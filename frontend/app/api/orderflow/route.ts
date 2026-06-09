import { NextRequest, NextResponse } from "next/server";
import {
  type OHLCVBar, type FootprintBar, type FootprintCell,
  detectStackedImbalances,
} from "../../../lib/orderflow";

/**
 * Real order-flow data for crypto via Binance's free public API (no key).
 *  - klines  → candles + genuine per-bar volume delta (taker-buy vs taker-sell)
 *  - aggTrades → price-binned footprint cells (buy/sell) for the most recent bars
 * Stocks/forex/etc. have no free tick source → rejected with 400 (UI falls back
 * to OHLCV-only VWAP/Profile from /api/backtesting/ohlcv).
 */

const BINANCE = "https://api.binance.com/api/v3";

// Interval → Binance string + seconds per bar
const INTERVAL: Record<string, { binance: string; secs: number }> = {
  "1m":  { binance: "1m",  secs: 60 },
  "5m":  { binance: "5m",  secs: 300 },
  "15m": { binance: "15m", secs: 900 },
  "1h":  { binance: "1h",  secs: 3600 },
};

/** BTC-USD / BTCUSD → BTCUSDT (Binance spot pair). Non-crypto symbols → null. */
function toBinanceSymbol(raw: string): string | null {
  const s = raw.toUpperCase().trim();
  // Must be a USD-quoted crypto pair (e.g. BTC-USD); stocks/forex have no free tick source.
  if (!/USDT?$/.test(s)) return null;
  const base = s.replace(/[-/]?USDT?$/, "").replace(/[-/]/g, "");
  if (!base || !/^[A-Z0-9]{2,15}$/.test(base)) return null;
  return `${base}USDT`;
}

interface Kline { t: number; o: number; h: number; l: number; c: number; v: number; takerBuy: number; }

async function fetchKlines(sym: string, interval: string, limit: number): Promise<Kline[]> {
  const url = `${BINANCE}/klines?symbol=${sym}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Binance klines ${res.status}`);
  const raw: any[] = await res.json();
  return raw.map((k) => ({
    t: Math.floor(k[0] / 1000),
    o: +k[1], h: +k[2], l: +k[3], c: +k[4],
    v: +k[5],
    takerBuy: +k[9],
  }));
}

/** Page aggTrades across [startMs, endMs) — Binance caps 1000/req. */
async function fetchAggTrades(sym: string, startMs: number, endMs: number) {
  const out: { p: number; q: number; sell: boolean }[] = [];
  let from = startMs;
  // Hard cap on pages so a busy window can't hang the request.
  for (let page = 0; page < 12 && from < endMs; page++) {
    const url = `${BINANCE}/aggTrades?symbol=${sym}&startTime=${from}&endTime=${endMs}&limit=1000`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Binance aggTrades ${res.status}`);
    const raw: any[] = await res.json();
    if (!raw.length) break;
    for (const a of raw) out.push({ p: +a.p, q: +a.q, sell: a.m === true });
    const lastT = raw[raw.length - 1].T;
    if (raw.length < 1000) break;
    from = lastT + 1;
  }
  return out;
}

/** Choose a "nice" tick size so a bar spans ~10–25 footprint rows. */
function niceTick(range: number): number {
  if (range <= 0) return 1;
  const raw = range / 18;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
  return step * mag;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const symbolRaw = searchParams.get("symbol") ?? "BTC-USD";
  const intervalKey = searchParams.get("interval") ?? "5m";
  const bars = Math.min(96, Math.max(10, Number(searchParams.get("bars")) || 48));
  const footprintBars = Math.min(20, Math.max(1, Number(searchParams.get("footprintBars")) || 10));

  const sym = toBinanceSymbol(symbolRaw);
  const iv = INTERVAL[intervalKey] ?? INTERVAL["5m"];
  if (!sym) {
    return NextResponse.json(
      { detail: `Footprint requires a crypto symbol with free tick data (got '${symbolRaw}')` },
      { status: 400 }
    );
  }

  try {
    const klines = await fetchKlines(sym, iv.binance, bars);
    if (!klines.length) {
      return NextResponse.json({ detail: `No data for '${symbolRaw}' on Binance` }, { status: 404 });
    }

    const candles: OHLCVBar[] = klines.map((k) => ({
      time: k.t, open: k.o, high: k.h, low: k.l, close: k.c, volume: k.v,
    }));

    // Real per-bar volume delta from taker-buy volume: buy − sell = 2·takerBuy − volume.
    const deltas = klines.map((k) => 2 * k.takerBuy - k.v);
    let cum = 0;
    const deltaCumulative = deltas.map((d) => (cum += d));

    // Footprint for the most recent `footprintBars` candles from raw aggTrades.
    // Each bar's window is independent → fetch them concurrently (pages within a
    // bar stay sequential, but bars run in parallel) to keep latency reasonable.
    const fpKlines = klines.slice(-footprintBars);
    const footprint: FootprintBar[] = await Promise.all(
      fpKlines.map(async (k) => {
        const startMs = k.t * 1000;
        const endMs = startMs + iv.secs * 1000;
        const tick = niceTick(k.h - k.l);

        const trades = await fetchAggTrades(sym, startMs, endMs);
        const binMap = new Map<number, FootprintCell>();
        for (const tr of trades) {
          const price = Math.round(tr.p / tick) * tick;
          let cell = binMap.get(price);
          if (!cell) { cell = { price, buy: 0, sell: 0 }; binMap.set(price, cell); }
          if (tr.sell) cell.sell += tr.q; else cell.buy += tr.q;
        }
        const cells = [...binMap.values()].sort((a, b) => a.price - b.price);
        const delta = cells.reduce((s, c) => s + c.buy - c.sell, 0);
        const totalVol = cells.reduce((s, c) => s + c.buy + c.sell, 0);
        return { time: k.t, cells, delta, totalVol, tick } as FootprintBar & { tick: number };
      })
    );

    const imbalances = detectStackedImbalances(footprint, 3, 3);
    // Use the most common per-bar tick as the shared display tick.
    const tickSize = (footprint[footprint.length - 1] as any)?.tick ?? 0;

    return NextResponse.json({
      symbol: symbolRaw,
      binanceSymbol: sym,
      interval: intervalKey,
      count: candles.length,
      candles,
      deltas,
      deltaCumulative,
      footprint,
      imbalances,
      tickSize,
    });
  } catch (err: any) {
    const msg = err?.message ?? "Order-flow data unavailable";
    return NextResponse.json({ detail: String(msg).slice(0, 200) }, { status: 502 });
  }
}
