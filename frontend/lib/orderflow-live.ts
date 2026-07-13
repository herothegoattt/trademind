/**
 * Real-time order flow for crypto — seeds history from /api/orderflow (Binance
 * REST) then layers a live Binance WebSocket on top:
 *   - <sym>@kline_<iv>  → authoritative OHLCV + per-bar volume delta (taker buy V)
 *   - <sym>@aggTrade    → price-binned footprint cells, Speed of Tape, Big Trades
 *
 * Everything updates continuously; React state is flushed on a throttled tick so
 * a busy tape doesn't thrash rendering. Stocks/forex have no free tick source and
 * should not use this hook (the lab keeps its OHLCV fallback for them).
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type OHLCVBar, type FootprintBar, type FootprintCell, type ImbalanceRun,
  detectStackedImbalances, estimateDeltaFromOHLCV,
} from "./orderflow";

const INTERVAL_SECS: Record<string, number> = { "1m": 60, "5m": 300, "15m": 900, "1h": 3600 };

const MAX_BARS = 90;      // candles retained
const MAX_FP_BARS = 14;   // bars that keep full footprint cells (memory cap)
const TAPE_WINDOW_MS = 12_000;
const BIG_TRADES_KEEP = 24;
const FLUSH_MS = 300;

export interface BigTrade { id: number; time: number; price: number; qty: number; side: "buy" | "sell"; }
export interface TapeSpeed { tradesPerSec: number; volPerSec: number; prints: number; }

export interface LiveOrderFlow {
  candles: OHLCVBar[];
  deltas: number[];
  deltaCumulative: number[];
  footprint: FootprintBar[];
  imbalances: ImbalanceRun[];
  tickSize: number;
  bigTrades: BigTrade[];
  tape: TapeSpeed;
  lastPrice: number;
}

interface BarState {
  time: number;
  open: number; high: number; low: number; close: number; volume: number;
  buy: number; sell: number;          // taker buy / sell base volume (delta = buy - sell)
  fp: Map<number, FootprintCell> | null;
  closed: boolean;
}

/** BTC-USD / BTCUSDT → btcusdt (Binance lower-case stream symbol), else null. */
function toStreamSymbol(raw: string): string | null {
  const s = raw.toUpperCase().trim();
  if (!/USDT?$/.test(s)) return null;
  const base = s.replace(/[-/]?USDT?$/, "").replace(/[-/]/g, "");
  if (!base || !/^[A-Z0-9]{2,15}$/.test(base)) return null;
  return `${base}USDT`.toLowerCase();
}

function niceTick(range: number): number {
  if (range <= 0) return 1;
  const raw = range / 18;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
  return step * mag;
}

/* ════════════════════════════════════════════════════════════════════════════
   Non-crypto live (stocks / futures / forex / indices) — there is no free tick
   source, so we poll Yahoo: the OHLCV series refreshes the bars and a faster
   quote poll keeps the forming bar's price snappy. Delta is an estimate from
   candle shape (no real order flow) and footprint is intentionally omitted —
   real footprint requires a paid tick feed.
═══════════════════════════════════════════════════════════════════════════════ */
const OHLCV_PERIOD: Record<string, string> = { "1m": "7d", "5m": "1mo", "15m": "1mo", "1h": "3mo" };
const SERIES_MS = 15_000;
const QUOTE_MS = 5_000;

export function useLivePolledOHLCV(ticker: string, interval: string, enabled: boolean) {
  const [data, setData] = useState<LiveOrderFlow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [marketState, setMarketState] = useState<string>("");

  const seriesRef = useRef<OHLCVBar[]>([]);
  const quoteRef = useRef<{ price: number; high: number; low: number; time: number } | null>(null);

  useEffect(() => {
    if (!enabled) { setData(null); return; }
    let disposed = false;
    let seriesTimer: ReturnType<typeof setInterval> | null = null;
    let quoteTimer: ReturnType<typeof setInterval> | null = null;

    seriesRef.current = [];
    quoteRef.current = null;
    setError(null); setLoading(true); setData(null);

    const build = () => {
      const series = seriesRef.current;
      if (!series.length) return;
      const candles = series.map((c) => ({ ...c }));
      const q = quoteRef.current;
      const last = candles[candles.length - 1];
      if (q && q.price > 0) {
        // Fold the latest quote into the forming bar for a live last price.
        last.close = q.price;
        last.high = Math.max(last.high, q.high || q.price, q.price);
        last.low = last.low > 0 ? Math.min(last.low, q.low || q.price, q.price) : q.price;
      }
      const deltas = candles.map(estimateDeltaFromOHLCV);
      let cum = 0;
      const deltaCumulative = deltas.map((d) => (cum += d));
      setData({
        candles, deltas, deltaCumulative, footprint: [], imbalances: [],
        tickSize: 0, bigTrades: [], tape: { tradesPerSec: 0, volPerSec: 0, prints: 0 },
        lastPrice: last.close,
      });
    };

    const loadSeries = async () => {
      try {
        const res = await fetch(`/api/backtesting/ohlcv?symbol=${encodeURIComponent(ticker)}&interval=${interval}&period=${OHLCV_PERIOD[interval] ?? "1mo"}`);
        const json = await res.json();
        if (disposed) return;
        if (!res.ok) throw new Error(json.detail || "Не удалось загрузить данные");
        seriesRef.current = (json.candles as OHLCVBar[]).slice(-120);
        setConnected(true);
        build();
        setLoading(false);
      } catch (e: any) {
        if (!disposed && !seriesRef.current.length) { setError(e?.message ?? "Ошибка загрузки"); setLoading(false); }
      }
    };

    const loadQuote = async () => {
      try {
        const res = await fetch(`/api/backtesting/quote?symbol=${encodeURIComponent(ticker)}`);
        const json = await res.json();
        if (disposed || !res.ok) return;
        quoteRef.current = { price: +json.price, high: +json.high, low: +json.low, time: +json.time };
        setMarketState(json.marketState ?? "");
        build();
      } catch { /* ignore transient quote errors */ }
    };

    loadSeries().then(loadQuote);
    seriesTimer = setInterval(loadSeries, SERIES_MS);
    quoteTimer = setInterval(loadQuote, QUOTE_MS);

    return () => {
      disposed = true;
      setConnected(false);
      if (seriesTimer) clearInterval(seriesTimer);
      if (quoteTimer) clearInterval(quoteTimer);
    };
  }, [ticker, interval, enabled]);

  return { data, loading, error, connected, marketState };
}

export function useLiveOrderFlow(ticker: string, interval: string, enabled: boolean) {
  const [data, setData] = useState<LiveOrderFlow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  // Mutable live model (avoids re-render per trade) ─────────────────────────
  const barsRef = useRef<Map<number, BarState>>(new Map());
  const tickRef = useRef(0);
  const tapeRef = useRef<{ t: number; q: number }[]>([]);
  const bigRef = useRef<BigTrade[]>([]);
  const qtyHistRef = useRef<number[]>([]);  // recent trade sizes → dynamic big-trade threshold
  const dirtyRef = useRef(false);
  const bigSeqRef = useRef(0);
  const reconnectAttempt = useRef(0);

  const secs = INTERVAL_SECS[interval] ?? 300;

  const upsertBar = useCallback((time: number): BarState => {
    let b = barsRef.current.get(time);
    if (!b) {
      b = { time, open: 0, high: 0, low: 0, close: 0, volume: 0, buy: 0, sell: 0, fp: null, closed: false };
      barsRef.current.set(time, b);
      // Trim old bars + drop footprint from anything beyond the recent window.
      const times = [...barsRef.current.keys()].sort((a, c) => a - c);
      if (times.length > MAX_BARS) for (const t of times.slice(0, times.length - MAX_BARS)) barsRef.current.delete(t);
      const kept = [...barsRef.current.keys()].sort((a, c) => a - c);
      for (const t of kept.slice(0, Math.max(0, kept.length - MAX_FP_BARS))) {
        const ob = barsRef.current.get(t);
        if (ob) ob.fp = null;
      }
    }
    return b;
  }, []);

  const flush = useCallback(() => {
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    const sorted = [...barsRef.current.values()].sort((a, b) => a.time - b.time);
    if (!sorted.length) return;

    const candles: OHLCVBar[] = sorted.map((b) => ({
      time: b.time, open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume,
    }));
    const deltas = sorted.map((b) => b.buy - b.sell);
    let cum = 0;
    const deltaCumulative = deltas.map((d) => (cum += d));

    const footprint: FootprintBar[] = [];
    for (const b of sorted) {
      if (!b.fp || b.fp.size === 0) continue;
      const cells = [...b.fp.values()].sort((a, c) => a.price - c.price);
      const delta = cells.reduce((s, c) => s + c.buy - c.sell, 0);
      const totalVol = cells.reduce((s, c) => s + c.buy + c.sell, 0);
      footprint.push({ time: b.time, cells, delta, totalVol });
    }
    const imbalances = detectStackedImbalances(footprint, 3, 3);

    // Speed of tape over the rolling window.
    const now = Date.now();
    const cutoff = now - TAPE_WINDOW_MS;
    tapeRef.current = tapeRef.current.filter((x) => x.t >= cutoff);
    const prints = tapeRef.current.length;
    const winSec = TAPE_WINDOW_MS / 1000;
    const tape: TapeSpeed = {
      prints,
      tradesPerSec: prints / winSec,
      volPerSec: tapeRef.current.reduce((s, x) => s + x.q, 0) / winSec,
    };

    setData({
      candles, deltas, deltaCumulative, footprint, imbalances,
      tickSize: tickRef.current,
      bigTrades: [...bigRef.current],
      tape,
      lastPrice: sorted[sorted.length - 1].close,
    });
  }, []);

  useEffect(() => {
    if (!enabled) { setData(null); return; }
    const stream = toStreamSymbol(ticker);
    if (!stream) { setData(null); setError("Нет тикового источника для этого символа"); return; }

    let ws: WebSocket | null = null;
    let flushTimer: ReturnType<typeof setInterval> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    // Reset model for the new symbol/interval.
    barsRef.current = new Map();
    tapeRef.current = [];
    bigRef.current = [];
    qtyHistRef.current = [];
    tickRef.current = 0;
    dirtyRef.current = false;
    setError(null);
    setLoading(true);
    setData(null);

    const restSymbol = ticker;

    const seed = async () => {
      try {
        let cs: OHLCVBar[] = [];
        let ds: number[] = [];
        let fp: FootprintBar[] = [];

        // Try Binance route first (works for most crypto).
        const bRes = await fetch(`/api/orderflow?symbol=${encodeURIComponent(restSymbol)}&interval=${interval}&bars=${MAX_BARS}&footprintBars=${MAX_FP_BARS}`);
        if (bRes.ok) {
          const json = await bRes.json();
          if (disposed) return;
          const raw = (json.candles ?? []) as OHLCVBar[];
          const hasVol = raw.filter((c: OHLCVBar) => c.volume > 0).length >= Math.ceil(raw.length * 0.2);
          if (hasVol) {
            // Real Binance data with actual volume
            tickRef.current = json.tickSize || 0;
            cs = raw;
            ds = json.deltas ?? [];
            fp = json.footprint ?? [];
            if (!tickRef.current && cs.length) {
              const recent = cs.slice(-20);
              tickRef.current = niceTick(Math.max(...recent.map((c) => c.high)) - Math.min(...recent.map((c) => c.low)));
            }
            // Seed footprint cells
            for (const fb of fp) {
              const bar = barsRef.current.get(fb.time);
              if (!bar) continue;
              const m = new Map<number, FootprintCell>();
              for (const cell of fb.cells) m.set(cell.price, { price: cell.price, buy: cell.buy, sell: cell.sell });
              bar.fp = m;
            }
          }
        }
        // Binance unavailable (geo-restriction) or stale → seed from Yahoo OHLCV.
        if (!cs.length) {
          const yRes = await fetch(`/api/backtesting/ohlcv?symbol=${encodeURIComponent(restSymbol)}&interval=${interval}&period=1mo`);
          if (yRes.ok) {
            const json = await yRes.json();
            if (disposed) return;
            cs = (json.candles as OHLCVBar[]).slice(-MAX_BARS);
            ds = cs.map(estimateDeltaFromOHLCV);
            if (cs.length) {
              const recent = cs.slice(-20);
              tickRef.current = niceTick(Math.max(...recent.map((c) => c.high)) - Math.min(...recent.map((c) => c.low)));
            }
          }
        }

        for (let i = 0; i < cs.length; i++) {
          const c = cs[i];
          const delta = ds[i] ?? 0;
          const buy = Math.max(0, (c.volume + delta) / 2);
          const sell = Math.max(0, (c.volume - delta) / 2);
          barsRef.current.set(c.time, {
            time: c.time, open: c.open, high: c.high, low: c.low, close: c.close,
            volume: c.volume, buy, sell, fp: null, closed: true,
          });
        }
        dirtyRef.current = true;
        flush();
        setLoading(false);
      } catch (e: any) {
        if (!disposed) { setError(e?.message ?? "Ошибка загрузки"); setLoading(false); }
      }
    };

    const recordBigTrade = (time: number, price: number, qty: number, side: "buy" | "sell") => {
      const hist = qtyHistRef.current;
      hist.push(qty);
      if (hist.length > 200) hist.shift();
      if (hist.length < 20) return;
      const sortedQ = [...hist].sort((a, b) => a - b);
      const median = sortedQ[Math.floor(sortedQ.length / 2)] || 0;
      const threshold = Math.max(median * 8, sortedQ[Math.floor(sortedQ.length * 0.97)] || 0);
      if (qty < threshold || threshold <= 0) return;
      bigRef.current.unshift({ id: ++bigSeqRef.current, time, price, qty, side });
      if (bigRef.current.length > BIG_TRADES_KEEP) bigRef.current.length = BIG_TRADES_KEEP;
    };

    const onKline = (k: any) => {
      const t = Math.floor(k.t / 1000);
      const b = upsertBar(t);
      b.open = +k.o; b.high = +k.h; b.low = +k.l; b.close = +k.c;
      b.volume = +k.v;
      b.buy = +k.V;                 // taker buy base volume (authoritative)
      b.sell = Math.max(0, +k.v - +k.V);
      b.closed = k.x === true;
      dirtyRef.current = true;
    };

    const onAggTrade = (a: any) => {
      const ms = a.T;
      const t = Math.floor(ms / 1000);
      const barStart = Math.floor(t / secs) * secs;
      const price = +a.p, qty = +a.q, isSell = a.m === true;
      const tick = tickRef.current > 0 ? tickRef.current : 1;

      const b = upsertBar(barStart);
      if (!b.fp) b.fp = new Map<number, FootprintCell>();
      const binned = Math.round(price / tick) * tick;
      let cell = b.fp.get(binned);
      if (!cell) { cell = { price: binned, buy: 0, sell: 0 }; b.fp.set(binned, cell); }
      if (isSell) cell.sell += qty; else cell.buy += qty;
      // Keep OHLC sane if a trade lands before the bar's first kline frame, and
      // keep close fresh between kline ticks for a snappier last price.
      if (b.open === 0) { b.open = b.high = b.low = price; }
      if (price > b.high) b.high = price;
      if (price < b.low || b.low === 0) b.low = price;
      b.close = price;

      tapeRef.current.push({ t: Date.now(), q: qty });
      recordBigTrade(t, price, qty, isSell ? "sell" : "buy");
      dirtyRef.current = true;
    };

    const connect = () => {
      if (disposed) return;
      const url = `wss://stream.binance.com:9443/stream?streams=${stream}@kline_${interval}/${stream}@aggTrade`;
      ws = new WebSocket(url);
      ws.onopen = () => { if (!disposed) { setConnected(true); reconnectAttempt.current = 0; } };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          const d = msg.data;
          if (!d) return;
          if (d.e === "kline") onKline(d.k);
          else if (d.e === "aggTrade") onAggTrade(d);
        } catch { /* ignore malformed frame */ }
      };
      ws.onclose = () => {
        if (disposed) return;
        setConnected(false);
        const delay = Math.min(15_000, 1000 * 2 ** reconnectAttempt.current++);
        reconnectTimer = setTimeout(connect, delay);
      };
      ws.onerror = () => { try { ws?.close(); } catch { /* noop */ } };
    };

    seed().then(() => { if (!disposed) connect(); });
    flushTimer = setInterval(flush, FLUSH_MS);

    return () => {
      disposed = true;
      setConnected(false);
      if (flushTimer) clearInterval(flushTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) { ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null; try { ws.close(); } catch { /* noop */ } }
    };
  }, [ticker, interval, enabled, secs, upsertBar, flush]);

  return { data, loading, error, connected };
}
