import { NextRequest, NextResponse } from "next/server";
// yahoo-finance2 v3 requires instantiation
// eslint-disable-next-line @typescript-eslint/no-var-requires
const YahooFinanceClass = require("yahoo-finance2").default;
const yf = new YahooFinanceClass();

// Always serve live data — do not cache this route handler
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Interval mapping → Yahoo Finance interval string
const YF_INTERVAL: Record<string, string> = {
  "1m":  "1m",
  "5m":  "5m",
  "15m": "15m",
  "1h":  "60m",
  "4h":  "60m",   // fetch 1h then resample to 4h
  "1d":  "1d",
  "1wk": "1wk",
};

// How many days back to fetch per period
const PERIOD_DAYS: Record<string, number> = {
  "7d":  7, "1mo": 30, "3mo": 90, "6mo": 180,
  "1y":  365, "2y": 730, "5y": 1825,
};

// Max days per intraday interval (Yahoo Finance limits)
const MAX_DAYS: Record<string, number> = {
  "1m":  6,
  "5m":  59,
  "15m": 59,
  "60m": 729,
};

export interface OHLCVBar {
  time:   number;
  open:   number;
  high:   number;
  low:    number;
  close:  number;
  volume: number;
}

function resample4h(candles: OHLCVBar[]): OHLCVBar[] {
  const buckets = new Map<number, OHLCVBar[]>();
  for (const c of candles) {
    const key = Math.floor(c.time / (4 * 3600)) * (4 * 3600);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(c);
  }
  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([t, bars]) => ({
      time:   t,
      open:   bars[0].open,
      high:   Math.max(...bars.map((b) => b.high)),
      low:    Math.min(...bars.map((b) => b.low)),
      close:  bars[bars.length - 1].close,
      volume: bars.reduce((s, b) => s + b.volume, 0),
    }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const symbol   = (searchParams.get("symbol")   ?? "AAPL").toUpperCase().trim();
  const interval = searchParams.get("interval")  ?? "1d";
  const period   = searchParams.get("period")    ?? "2y";

  const yfInterval = YF_INTERVAL[interval] ?? "1d";
  const daysBack   = PERIOD_DAYS[period]   ?? 730;
  const maxDays    = MAX_DAYS[yfInterval];
  const actualDays = maxDays ? Math.min(daysBack, maxDays) : daysBack;

  const period2 = new Date();
  const period1 = new Date(period2.getTime() - actualDays * 86_400_000);

  try {
    const result = await yf.chart(
      symbol,
      { period1: period1.toISOString().slice(0, 10), interval: yfInterval },
      { validateResult: false }
    );

    const quotes: any[] = result?.quotes ?? [];

    if (quotes.length === 0) {
      return NextResponse.json(
        { detail: `No data found for '${symbol}'` },
        { status: 404 }
      );
    }

    const seen = new Set<number>();
    let candles: OHLCVBar[] = [];

    for (const q of quotes) {
      if (!q || q.open == null || q.close == null) continue;

      const t = Math.floor(new Date(q.date).getTime() / 1000);
      if (seen.has(t)) continue;
      seen.add(t);

      candles.push({
        time:   t,
        open:   +Number(q.open).toFixed(6),
        high:   +Number(q.high).toFixed(6),
        low:    +Number(q.low).toFixed(6),
        close:  +Number(q.close).toFixed(6),
        volume: Math.round(q.volume ?? 0),
      });
    }

    if (interval === "4h") {
      candles = resample4h(candles);
    }

    return NextResponse.json({
      symbol,
      interval,
      period,
      count:   candles.length,
      candles,
    });

  } catch (err: any) {
    const msg = err?.message ?? "Market data unavailable";
    return NextResponse.json(
      { detail: msg.slice(0, 200) },
      { status: 502 }
    );
  }
}
