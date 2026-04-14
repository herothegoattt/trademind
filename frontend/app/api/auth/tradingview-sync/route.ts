import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken, updateUser } from "@/lib/auth-server";

/** POST /api/auth/tradingview-sync — trigger re-sync from TradingView */
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromToken(req.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    if (!user.tradingview?.username) {
      return NextResponse.json({ detail: "No TradingView account connected" }, { status: 400 });
    }

    // Update last_sync timestamp
    const tvData = {
      ...user.tradingview,
      last_sync: new Date().toISOString(),
      status: "connected" as const,
    };
    updateUser(user.id, { tradingview: tvData });

    // Return fresh stats (in production, would actually fetch from TV API)
    return NextResponse.json({
      synced: true,
      last_sync: tvData.last_sync,
    });
  } catch (err) {
    console.error("TradingView sync error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
