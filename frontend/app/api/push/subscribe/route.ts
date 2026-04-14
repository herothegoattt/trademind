import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { getUserFromToken } from "@/lib/auth-server";

const DATA_DIR = join(process.cwd(), "data");
const FILE     = join(DATA_DIR, "push-subscriptions.json");

export interface StoredSub {
  id:           string;
  user_id:      number | null;
  endpoint:     string;
  subscription: object;           // full PushSubscription JSON
  preferences:  SubPrefs;
  created_at:   string;
}

export interface SubPrefs {
  daily_bias:      boolean;
  trading_signals: boolean;
  price_alerts:    boolean;
  news:            boolean;
}

const DEFAULT_PREFS: SubPrefs = {
  daily_bias:      true,
  trading_signals: true,
  price_alerts:    true,
  news:            false,
};

function read(): StoredSub[] {
  try {
    if (!existsSync(FILE)) return [];
    return JSON.parse(readFileSync(FILE, "utf8"));
  } catch { return []; }
}

function write(subs: StoredSub[]) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(subs, null, 2), "utf8");
}

// ── POST /api/push/subscribe — save subscription ─────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, preferences } = body as {
      subscription: { endpoint: string; keys: object };
      preferences?: Partial<SubPrefs>;
    };

    if (!subscription?.endpoint) {
      return NextResponse.json({ detail: "Missing subscription" }, { status: 400 });
    }

    const user = getUserFromToken(req.headers.get("authorization"));
    const subs = read();

    // Upsert by endpoint
    const existing = subs.find((s) => s.endpoint === subscription.endpoint);
    if (existing) {
      existing.preferences = { ...existing.preferences, ...(preferences ?? {}) };
      if (user) existing.user_id = user.id;
      write(subs);
      return NextResponse.json({ id: existing.id });
    }

    const id = crypto.randomUUID();
    subs.push({
      id,
      user_id:      user?.id ?? null,
      endpoint:     subscription.endpoint,
      subscription,
      preferences:  { ...DEFAULT_PREFS, ...(preferences ?? {}) },
      created_at:   new Date().toISOString(),
    });
    write(subs);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}

// ── DELETE /api/push/subscribe — remove by endpoint ──────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json();
    if (!endpoint) return NextResponse.json({ detail: "Missing endpoint" }, { status: 400 });

    const subs = read().filter((s) => s.endpoint !== endpoint);
    write(subs);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Push unsubscribe error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}

// ── PATCH /api/push/subscribe — update preferences ───────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const { endpoint, preferences } = await req.json();
    const subs = read();
    const sub  = subs.find((s) => s.endpoint === endpoint);
    if (!sub) return NextResponse.json({ detail: "Not found" }, { status: 404 });

    sub.preferences = { ...sub.preferences, ...(preferences ?? {}) };
    write(subs);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Push pref update error:", err);
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}
