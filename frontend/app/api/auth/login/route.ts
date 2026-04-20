import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await proxyToBackend("/api/v1/auth/login", "POST", body);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Login proxy error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
