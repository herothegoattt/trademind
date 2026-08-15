import { NextRequest, NextResponse } from "next/server";
import { getUserFromBackendToken } from "@/lib/backend-proxy";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromBackendToken(req.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("TradingView disconnect error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
