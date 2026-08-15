import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

export const maxDuration = 60;

export async function PUT(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    const body = await req.json();
    const res = await proxyToBackend("/api/v1/auth/profile", "PUT", body, auth);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Profile proxy error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
