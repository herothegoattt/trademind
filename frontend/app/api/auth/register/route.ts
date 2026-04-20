import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Register user in FastAPI
    const registerRes = await proxyToBackend("/api/v1/auth/register", "POST", body);
    const registerData = await registerRes.json();

    if (!registerRes.ok) {
      return NextResponse.json(registerData, { status: registerRes.status });
    }

    // Auto-login to get FastAPI JWT
    const loginRes = await proxyToBackend("/api/v1/auth/login", "POST", {
      email: body.email,
      password: body.password,
    });
    const loginData = await loginRes.json();

    if (!loginRes.ok) {
      return NextResponse.json(registerData, { status: 201 });
    }

    return NextResponse.json(
      { ...registerData, access_token: loginData.access_token },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register proxy error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
