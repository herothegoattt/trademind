import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken, updateUser } from "@/lib/auth-server";

/** POST /api/auth/tradingview-disconnect — unlink TradingView account */
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromToken(req.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    updateUser(user.id, { tradingview: null });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("TradingView disconnect error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
