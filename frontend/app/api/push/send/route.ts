import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { StoredSub, SubPrefs } from "../subscribe/route";

const FILE = join(process.cwd(), "data", "push-subscriptions.json");

function getSubs(): StoredSub[] {
  try {
    if (!existsSync(FILE)) return [];
    return JSON.parse(readFileSync(FILE, "utf8"));
  } catch { return []; }
}

function initVapid() {
  const pub  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const mail = process.env.VAPID_EMAIL ?? "mailto:support@trademind.ai";
  if (!pub || !priv) throw new Error("VAPID keys not configured");
  webpush.setVapidDetails(mail, pub, priv);
}

export interface PushPayload {
  title:    string;
  body:     string;
  icon?:    string;
  url?:     string;
  tag?:     string;
  /** Only send to subs that have this preference enabled */
  channel?: keyof SubPrefs;
  /** Restrict to specific user IDs (omit = send to all) */
  user_ids?: number[];
}

// ── POST /api/push/send ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    initVapid();
  } catch {
    return NextResponse.json({ detail: "VAPID keys not configured" }, { status: 503 });
  }

  try {
    const payload: PushPayload = await req.json();

    if (!payload.title || !payload.body) {
      return NextResponse.json({ detail: "title and body required" }, { status: 400 });
    }

    let subs = getSubs();

    // Filter by channel preference
    if (payload.channel) {
      subs = subs.filter((s) => s.preferences[payload.channel!] === true);
    }

    // Filter by user IDs
    if (payload.user_ids?.length) {
      subs = subs.filter((s) => s.user_id && payload.user_ids!.includes(s.user_id));
    }

    const message = JSON.stringify({
      title: payload.title,
      body:  payload.body,
      icon:  payload.icon  ?? "/logo.jpg",
      url:   payload.url   ?? "/app",
      tag:   payload.tag   ?? "trademind",
    });

    const results = await Promise.allSettled(
      subs.map((s) =>
        webpush.sendNotification(
          s.subscription as webpush.PushSubscription,
          message,
          { TTL: 60 * 60 * 24 }, // 24h TTL
        )
      )
    );

    const sent   = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({ sent, failed, total: subs.length });
  } catch (err) {
    console.error("Push send error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}
