import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    const body = await req.json().catch(() => ({}));
    const res = await proxyToBackend("/api/v1/auth/onboarding", "POST", body, auth);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Onboarding proxy error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
