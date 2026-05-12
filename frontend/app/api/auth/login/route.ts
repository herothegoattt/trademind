import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await proxyToBackend("/api/v1/auth/login", "POST", body);

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error("Login: unexpected non-JSON from backend", res.status, text.slice(0, 300));
      return NextResponse.json(
        { detail: `Backend error (${res.status}) — check server logs` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Login proxy error:", msg);
    return NextResponse.json({ detail: msg }, { status: 502 });
  }
}
