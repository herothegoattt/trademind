import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

// Reads the Authorization header — must be dynamic, never statically collected.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    const res = await proxyToBackend("/api/v1/auth/me", "GET", undefined, auth);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    // Backend unreachable / cold-start / timeout — signal a transient 503 so the
    // client keeps the session instead of treating it as an auth failure.
    console.error("Me proxy error:", err);
    const detail = err instanceof Error ? err.message : "Service temporarily unavailable";
    return NextResponse.json({ detail }, { status: 503 });
  }
}
