import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth-server";

/**
 * GET /api/auth/trading-stats
 * Returns trading statistics. When TradingView is connected, returns enriched data.
 * Currently uses mock/demo data — will integrate with TradingView API when available.
 */
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken(req.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const hasTv = !!user.tradingview?.username;

    // In production, this would fetch from TradingView API or local trade journal
    const stats = {
      total_trades: hasTv ? 156 : 23,
      win_rate: hasTv ? 0.62 : 0.52,
      profit_factor: hasTv ? 1.85 : 1.2,
      total_pnl: hasTv ? 4280.5 : 340.0,
      avg_rr: hasTv ? 1.92 : 1.4,
      best_trade: hasTv ? 1250.0 : 280.0,
      worst_trade: hasTv ? -480.0 : -150.0,
      avg_hold_time: hasTv ? "2h 35m" : "45m",
      streak: hasTv ? 4 : 1,
      monthly_pnl: [
        { month: "Oct", pnl: hasTv ? 820 : 80 },
        { month: "Nov", pnl: hasTv ? -210 : -40 },
        { month: "Dec", pnl: hasTv ? 1150 : 120 },
        { month: "Jan", pnl: hasTv ? 640 : 50 },
        { month: "Feb", pnl: hasTv ? 930 : 70 },
        { month: "Mar", pnl: hasTv ? 950 : 60 },
      ],
      top_pairs: hasTv
        ? [
            { symbol: "EURUSD", trades: 42, pnl: 1820 },
            { symbol: "BTCUSD", trades: 28, pnl: 1250 },
            { symbol: "XAUUSD", trades: 21, pnl: 680 },
            { symbol: "GBPJPY", trades: 18, pnl: 340 },
            { symbol: "NAS100", trades: 15, pnl: 190 },
          ]
        : [
            { symbol: "BTCUSD", trades: 12, pnl: 200 },
            { symbol: "EURUSD", trades: 11, pnl: 140 },
          ],
      source: hasTv ? "tradingview" : "manual",
    };

    return NextResponse.json(stats);
  } catch (err) {
    console.error("Trading stats error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
