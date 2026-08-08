"use client";

/* ── Pure analytics engine for the backtest journal ────────────────── */

export interface ClosedTradeLike {
  id: string;
  symbol?: string;
  side: "buy" | "sell";
  size: number;
  entry: number;
  exit: number;
  sl: number | null;
  tp: number | null;
  pnl: number;
  reason: string;
  openTime: number;
  closeTime: number;
}

export type Session = "asian" | "london" | "newyork" | "other";

export function sessionOf(timeUnix: number): Session {
  const h = new Date(timeUnix * 1000).getUTCHours();
  if (h >= 0  && h < 7)  return "asian";
  if (h >= 7  && h < 13) return "london";
  if (h >= 13 && h < 21) return "newyork";
  return "other";
}

export const SESSION_LABEL: Record<Session, string> = {
  asian: "Asian", london: "London", newyork: "New York", other: "Overnight",
};

export const DAY_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface Filters {
  session: Session | "all";
  day: number | "all";
  symbol: string;
  from?: number; // unix seconds
  to?: number;
}

export function filterClosed(items: ClosedTradeLike[], f: Filters): ClosedTradeLike[] {
  return items.filter((t) => {
    if (f.symbol !== "all" && f.symbol.length && !t.symbol?.toLowerCase().includes(f.symbol.toLowerCase())) return false;
    if (f.session !== "all" && sessionOf(t.closeTime) !== f.session) return false;
    if (f.day !== "all" && new Date(t.closeTime * 1000).getUTCDay() !== f.day) return false;
    if (f.from && t.closeTime < f.from) return false;
    if (f.to && t.closeTime > f.to) return false;
    return true;
  });
}

export interface Metrics {
  count: number;
  wins: number;
  losses: number;
  winRate: number;       // 0..1
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;  // 9999 = infinite
  net: number;
  maxDrawdown: number;   // percent (positive)
  currentDrawdown: number; // percent
  expectancy: number;    // $ per trade
  expectancyR: number;   // R per trade
  totalR: number;
  avgWin: number;
  avgLoss: number;
  best: number;
  worst: number;
  equityCurve: { t: number; balance: number }[];
}

export function computeMetrics(
  trades: ClosedTradeLike[],
  startBalance: number,
  contract: number, // monetary scale per lot (e.g. 100)
): Metrics {
  const empty: Metrics = {
    count: 0, wins: 0, losses: 0, winRate: 0, grossProfit: 0, grossLoss: 0,
    profitFactor: 0, net: 0, maxDrawdown: 0, currentDrawdown: 0,
    expectancy: 0, expectancyR: 0, totalR: 0, avgWin: 0, avgLoss: 0,
    best: 0, worst: 0, equityCurve: [{ t: 0, balance: startBalance }],
  };

  if (!trades.length) return empty;

  let bal = startBalance;
  let peak = startBalance;
  let maxDD = 0;
  const curve: { t: number; balance: number }[] = [{ t: 0, balance: startBalance }];

  const ordered = [...trades].sort((a, b) => a.closeTime - b.closeTime);

  let wins = 0, gp = 0, gl = 0;
  let best = -Infinity, worst = Infinity;
  let rSum = 0, rCount = 0;

  for (const t of ordered) {
    bal += t.pnl;
    if (bal > peak) peak = bal;
    const dd = peak > 0 ? ((peak - bal) / peak) * 100 : 0;
    if (dd > maxDD) maxDD = dd;
    curve.push({ t: t.closeTime, balance: bal });

    if (t.pnl > 0) { wins++; gp += t.pnl; } else if (t.pnl < 0) { gl += -t.pnl; }
    if (t.pnl > best) best = t.pnl;
    if (t.pnl < worst) worst = t.pnl;

    if (t.sl != null) {
      const risk = Math.abs(t.entry - t.sl) * t.size * contract;
      if (risk > 0) { rSum += t.pnl / risk; rCount++; }
    }
  }

  const count = ordered.length;
  const net = ordered.reduce((s, t) => s + t.pnl, 0);
  const cur = peak > 0 ? ((peak - bal) / peak) * 100 : 0;
  const pf = gl > 0 ? gp / gl : gp > 0 ? 9999 : 0;

  return {
    count,
    wins,
    losses: count - wins,
    winRate: count ? wins / count : 0,
    grossProfit: gp,
    grossLoss: gl,
    profitFactor: pf,
    net,
    maxDrawdown: maxDD,
    currentDrawdown: cur,
    expectancy: count ? net / count : 0,
    expectancyR: rCount ? rSum / rCount : 0,
    totalR: rSum,
    avgWin: wins ? gp / wins : 0,
    avgLoss: gl > 0 ? -(gl / (count - wins)) : 0,
    best,
    worst: worst === Infinity ? 0 : worst,
    equityCurve: curve,
  };
}