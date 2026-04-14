import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken, updateUser, userToResponse } from "@/lib/auth-server";

/** POST /api/auth/tradingview-connect — link TradingView account */
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromToken(req.headers.get("authorization"));
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
      status: "connected" as const,
    };

    const updated = updateUser(user.id, { tradingview: tvData });
    if (!updated) {
      return NextResponse.json({ detail: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...userToResponse(updated),
      tradingview: tvData,
    });
  } catch (err) {
    console.error("TradingView connect error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
