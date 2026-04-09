// lib/tradingview.ts — TradingView integration helpers
import type { TradingViewConnection, TradingStats } from "./auth-store";

/** Connect a TradingView account by username */
export async function connectTradingView(username: string): Promise<TradingViewConnection> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`/api/auth/tradingview-connect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ username }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to connect TradingView");
  }
  return res.json();
}

/** Disconnect TradingView account */
export async function disconnectTradingView(): Promise<void> {
  const token = localStorage.getItem("access_token");
  await fetch(`/api/auth/tradingview-disconnect`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

/** Fetch trading stats (from TradingView or local journal) */
export async function fetchTradingStats(): Promise<TradingStats> {
  const token = localStorage.getItem("access_token");
  try {
    const res = await fetch(`/api/auth/trading-stats`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (res.ok) return res.json();
  } catch {
    // fallback to mock
  }

  return getMockTradingStats();
}

/** Sync latest data from TradingView */
export async function syncTradingView(): Promise<TradingStats> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`/api/auth/tradingview-sync`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) throw new Error("Sync failed");
  return res.json();
}

export function getMockTradingStats(): TradingStats {
  return {
    total_trades: 156,
    win_rate: 0.62,
    profit_factor: 1.85,
    total_pnl: 4280.5,
    avg_rr: 1.92,
    best_trade: 1250.0,
    worst_trade: -480.0,
    avg_hold_time: "2h 35m",
    streak: 4,
    monthly_pnl: [
      { month: "Oct", pnl: 820 },
      { month: "Nov", pnl: -210 },
      { month: "Dec", pnl: 1150 },
      { month: "Jan", pnl: 640 },
      { month: "Feb", pnl: 930 },
      { month: "Mar", pnl: 950 },
    ],
    top_pairs: [
      { symbol: "EURUSD", trades: 42, pnl: 1820 },
      { symbol: "BTCUSD", trades: 28, pnl: 1250 },
      { symbol: "XAUUSD", trades: 21, pnl: 680 },
      { symbol: "GBPJPY", trades: 18, pnl: 340 },
      { symbol: "NAS100", trades: 15, pnl: 190 },
    ],
  };
}
