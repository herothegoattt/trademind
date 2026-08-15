import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Register user in FastAPI
    const registerRes = await proxyToBackend("/api/v1/auth/register", "POST", body);
    const regContentType = registerRes.headers.get("content-type") ?? "";
    if (!regContentType.includes("application/json")) {
      const text = await registerRes.text();
      console.error("Register: non-JSON from backend", registerRes.status, text.slice(0, 300));
      return NextResponse.json(
        { detail: `Backend error (${registerRes.status}) — check server logs` },
        { status: 502 }
      );
    }
    const registerData = await registerRes.json();

    if (!registerRes.ok) {
      return NextResponse.json(registerData, { status: registerRes.status });
    }

    // Auto-login to get FastAPI JWT
    const loginRes = await proxyToBackend("/api/v1/auth/login", "POST", {
      email: body.email,
      password: body.password,
    });
    const loginContentType = loginRes.headers.get("content-type") ?? "";
    const loginData = loginContentType.includes("application/json")
      ? await loginRes.json()
      : {};

    if (!loginRes.ok || !loginData.access_token) {
      // Registration succeeded but auto-login failed — return user without token
      // Client will need to log in manually
      console.error("Register: auto-login failed", loginRes.status);
      return NextResponse.json(registerData, { status: 201 });
    }

    return NextResponse.json(
      { ...registerData, access_token: loginData.access_token },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Register proxy error:", msg);
    return NextResponse.json({ detail: msg }, { status: 502 });
  }
}
