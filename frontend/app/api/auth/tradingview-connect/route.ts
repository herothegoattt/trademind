import { NextRequest, NextResponse } from "next/server";
import { getUserFromBackendToken } from "@/lib/backend-proxy";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromBackendToken(req.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const { username } = await req.json();
    if (!username || typeof username !== "string" || username.trim().length < 2) {
      return NextResponse.json({ detail: "Invalid TradingView username" }, { status: 400 });
    }

    const tvData = {
      username: username.trim(),
      connected_at: new Date().toISOString(),
      last_sync: new Date().toISOString(),
      status: "connected",
    };

    return NextResponse.json({ ...user, tradingview: tvData });
  } catch (err) {
    console.error("TradingView connect error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
