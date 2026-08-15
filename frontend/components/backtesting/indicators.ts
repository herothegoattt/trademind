"use client";

/* ── Indicator engine for the TV-style Backtest chart ───────────────── */

import type { OHLCVBar } from "./ReplayChart";
import { estimateDeltaFromOHLCV, computeVWAP, computeVolumeProfile, type VolumeProfile } from "../../lib/orderflow";
import type { TpoRow, TpoData, GexData, BandRow } from "../../lib/market-profile-primitive";

export interface IndicatorConfig {
  id: string;
  name: string;    // display name, e.g. "SMA 20"
  pane: 0 | 1;     // 0 = overlays candles, 1 = bottom pane (RSI/MACD)
  color: string;
}

/* Computed points: lightweight-charts accepts {time, value}[] */
export type Point = { time: number; value: number };

/* Order-flow big-trade marker (volume spike → proxy for a large print). */
export interface BigTradeMarker {
  time: number;
  price: number;
  side: "buy" | "sell";
  size?: number;  // 0..1 marker size, scaled by how extreme the spike is
}

/* One concrete visual series on the chart (an indicator may emit several). */
export interface FloorLine {
  price: number;                        // reference level (RSI 30/70, zero lines…)
  color?: string;
  dashed?: boolean;
  label?: string;                       // chip text on the price axis
}

export interface IndicatorSource {
  id: string;         // unique chart key, e.g. "bb20-upper"
  name: string;       // legend label
  color: string;
  pane: 0 | 1;
  kind: "line" | "area" | "histogram" | "baseline" | "markers" | "tpo" | "gex" | "band" | "profile";
  points: Point[];
  markers?: BigTradeMarker[];   // kind === "markers"
  tpo?: TpoData | null;         // kind === "tpo"
  gex?: GexData | null;         // kind === "gex"
  profile?: VolumeProfile | null;  // kind === "profile" (TradingView market/volume profile)
  band?: { rows: BandRow[]; color: string } | null;  // kind === "band"
  baseline?: number;            // kind === "baseline": center reference (e.g. RSI 50)
  baselineTopColor?: string;    // color of the line / fill above the baseline
  baselineBottomColor?: string; // color of the line / fill below the baseline
  floors?: FloorLine[];         // horizontal reference lines w/ axis chips
  areaFill?: { top: string; bottom: string } | null;   // kind === "area" gradient
  height?: number;              // preferred bottom-pane height (px) for delta
  shareScale?: string;          // join an existing price scale instead of a new axis
  priceFormat?: any;            // axis formatting, e.g. { type: "volume" }
  lineWidth?: number;           // stroke width (1|2|3)
}

/* ── Simple stats ──────────────────────────────────────────────── */

export function sma(values: number[], p: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= p) sum -= values[i - p];
    if (i >= p - 1) out[i] = sum / p;
  }
  return out;
}

export function ema(values: number[], p: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  const k = 2 / (p + 1);
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    prev = prev == null ? values[i] : values[i] * k + prev * (1 - k);
    if (i >= p - 1) out[i] = prev;
  }
  return out;
}

export function rsi(values: number[], p = 14): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let gain = 0, loss = 0;
  for (let i = 1; i < values.length; i++) {
    const ch = values[i] - values[i - 1];
    const g = ch > 0 ? ch : 0;
    const l = ch < 0 ? -ch : 0;
    if (i <= p) {
      gain += g; loss += l;
      if (i === p) out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
    } else {
      gain = (gain * (p - 1) + g) / p;
      loss = (loss * (p - 1) + l) / p;
      out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
    }
  }
  return out;
}

export function bollinger(
  values: number[], p = 20, mult = 2,
): { upper: (number | null)[]; mid: (number | null)[]; lower: (number | null)[] } {
  const mid = sma(values, p);
  const upper: (number | null)[] = new Array(values.length).fill(null);
  const lower: (number | null)[] = new Array(values.length).fill(null);
  for (let i = p - 1; i < values.length; i++) {
    const m = mid[i] as number;
    let sum = 0;
    for (let j = i - p + 1; j <= i; j++) sum += (values[j] - m) ** 2;
    const sd = Math.sqrt(sum / p);
    upper[i] = m + mult * sd;
    lower[i] = m - mult * sd;
  }
  return { upper, mid, lower };
}

export function vwap(values: OHLCVBar[]): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let pv = 0, vol = 0;
  for (let i = 0; i < values.length; i++) {
    const tp = (values[i].high + values[i].low + values[i].close) / 3;
    const v = values[i].volume || 0;
    pv += tp * v; vol += v;
    if (vol > 0) out[i] = pv / vol;
  }
  return out;
}

export function atr(values: OHLCVBar[], p = 14): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < 2) return out;
  const trs: number[] = [0];
  for (let i = 1; i < values.length; i++) {
    const h = values[i].high, l = values[i].low, pc = values[i - 1].close;
    trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }
  let prev = 0;
  for (let i = 0; i < values.length; i++) {
    if (i < p) {
      prev += trs[i];
      if (i === p - 1) out[i] = prev / p;
    } else {
      prev = (prev * (p - 1) + trs[i]) / p;
      out[i] = prev;
    }
  }
  return out;
}

export function macd(
  values: number[], fast = 12, slow = 26, sig = 9,
): { macd: (number | null)[]; signal: (number | null)[]; hist: (number | null)[] } {
  const f = ema(values, fast);
  const s = ema(values, slow);
  const line = values.map((_, i) => (f[i] != null && s[i] != null ? (f[i] as number) - (s[i] as number) : null));
  const signal = ema(line.map((v) => v ?? 0), sig).map((v, i) => (line[i] != null ? v : null));
  const hist = line.map((v, i) => (v != null && signal[i] != null ? (v as number) - (signal[i] as number) : null));
  return { macd: line, signal, hist };
}

/* ── Order-flow estimates (OHLCV-derived, honest "est." labels) ──────── */

/** Per-bar raw volume delta estimate (close position within the range). */
export function deltaSeries(values: OHLCVBar[]): (number | null)[] {
  return values.map((b) => estimateDeltaFromOHLCV(b));
}

/** Cumulative signed delta — running sum of the per-bar estimate. */
export function cumulativeDelta(values: OHLCVBar[]): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let acc = 0;
  for (let i = 0; i < values.length; i++) {
    acc += estimateDeltaFromOHLCV(values[i]);
    out[i] = acc;
  }
  return out;
}

/** Bars whose volume ≥ mult × rolling average → "big trades" proxy markers. */
export function bigTrades(values: OHLCVBar[], window = 20, mult = 2.5): BigTradeMarker[] {
  if (values.length === 0) return [];
  const out: BigTradeMarker[] = [];
  const vols = values.map((b) => b.volume || 0);
  let sum = 0;
  const rolling: number[] = [];
  for (let i = 0; i < vols.length; i++) {
    sum += vols[i];
    if (i >= window) sum -= vols[i - window];
    rolling[i] = i >= window - 1 ? sum / window : sum / Math.min(i + 1, window);
  }
  for (let i = 0; i < values.length; i++) {
    const v = vols[i];
    const avg = rolling[i] || 1;
    if (v > 0 && v >= mult * avg) {
      const ratio = v / avg;
      out.push({
        time: values[i].time, price: values[i].close >= values[i].open ? values[i].high : values[i].low,
        side: values[i].close >= values[i].open ? "buy" : "sell",
        size: Math.min(1, 0.55 + ratio / 24),
      });
    }
  }
  return out;
}

/* ── TPO / Market Profile (OHLCV-derived) ───────────────────────────── */

export function computeTpo(values: OHLCVBar[], rowsPerSession = 16): TpoData {
  if (values.length === 0) return { rows: [], sessions: [], pocRow: -1, vaLowRow: -1, vaHighRow: -1, rowsPerSession };

  // Session = consecutive runs of bars interrupted by a large time gap or day change.
  // Use ~18h inactivity as the session break (crypto/futures trade near 24/7).
  const sessions: TpoData["sessions"] = [];
  const sessionOf: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i === 0 || values[i].time - values[i - 1].time > 18 * 3600) {
      sessionOf[i] = sessions.length;
      sessions.push({ index: sessions.length, startTime: values[i].time, endTime: values[i].time });
    } else {
      sessionOf[i] = sessionOf[i - 1];
      sessions[sessionOf[i]].endTime = values[i].time;
    }
  }

  // Price rows: fixed number of bands over the visible price range.
  let lo = Infinity, hi = -Infinity;
  for (const b of values) { if (b.low < lo) lo = b.low; if (b.high > hi) hi = b.high; }
  if (!isFinite(lo) || !isFinite(hi) || hi <= lo) return { rows: [], sessions, pocRow: -1, vaLowRow: -1, vaHighRow: -1, rowsPerSession };
  const span = hi - lo;
  const step = span / rowsPerSession;
  const rows: TpoRow[] = Array.from({ length: rowsPerSession }, (_, r) => ({
    priceLow: lo + r * step,
    priceHigh: lo + (r + 1) * step,
    priceMid: lo + (r + 0.5) * step,
    cells: [],
  }));

  // Letter codes per session (A..Z, then AA, AB...). Every bar prints its
  // letter into every price row its [low, high] range passes through — that's
  // the "time spent at price" count in Market-Profile terms.
  let timeIdx: number[] = new Array(sessions.length).fill(0);
  const codeFor = (s: number): string => {
    let n = timeIdx[s]++;
    let out = "";
    do { out = String.fromCharCode(65 + (n % 26)) + out; n = Math.floor(n / 26) - 1; } while (n >= 0);
    return out;
  };

  for (let i = 0; i < values.length; i++) {
    const b = values[i];
    const s = sessionOf[i];
    const letter = codeFor(s);
    const startRow = Math.max(0, Math.floor((b.low - lo) / step));
    const endRow = Math.min(rowsPerSession - 1, Math.floor((b.high - lo) / step));
    for (let r = startRow; r <= endRow; r++) {
      const f = rows[r].cells.find((c) => c.session === s);
      if (f) f.letters += letter;
      else rows[r].cells.push({ session: s, letters: letter });
    }
  }

  // Row "time" = number of letters printed into it across all sessions.
  const timeCount = rows.map((r) => r.cells.reduce((acc, c) => acc + c.letters.length, 0));
  let pocRow = 0;
  for (let i = 1; i < rows.length; i++) if (timeCount[i] > timeCount[pocRow]) pocRow = i;

  // 70% Value Area expanding from POC.
  const total = timeCount.reduce((a, b) => a + b, 0) || 1;
  let acc = timeCount[pocRow], loIdx = pocRow, hiIdx = pocRow;
  while (acc < total * 0.7 && (loIdx > 0 || hiIdx < rows.length - 1)) {
    const below = loIdx > 0 ? timeCount[loIdx - 1] : -1;
    const above = hiIdx < rows.length - 1 ? timeCount[hiIdx + 1] : -1;
    if (above >= below && above >= -0) { hiIdx += 1; acc += timeCount[hiIdx]; }
    else if (below >= -0) { loIdx -= 1; acc += timeCount[loIdx]; }
    else break;
  }

  return { rows, sessions, pocRow, vaLowRow: loIdx, vaHighRow: hiIdx, rowsPerSession };
}

/* ── Series builder ────────────────────────────────────────────── */

function toPoints(bars: OHLCVBar[], arr: (number | null)[]): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < bars.length; i++) {
    const v = arr[i];
    if (v != null && isFinite(v)) out.push({ time: bars[i].time, value: v });
  }
  return out;
}

/** Parallel top/bottom arrays → per-bar band fill rows (envelope strips). */
function bandRows(bars: OHLCVBar[], top: (number | null)[], bottom: (number | null)[]): BandRow[] {
  const out: BandRow[] = [];
  for (let i = 0; i < bars.length; i++) {
    const t = top[i], b = bottom[i];
    if (t != null && b != null && isFinite(t) && isFinite(b) && t > b) {
      out.push({ time: bars[i].time, top: t, bottom: b });
    }
  }
  return out;
}

export function computeIndicator(cfg: IndicatorConfig, bars: OHLCVBar[]): IndicatorSource[] {
  const closes = bars.map((b) => b.close);
  const line = (name: string, arr: (number | null)[], color = cfg.color): IndicatorSource => ({
    id: `${cfg.id}-${name}`, name: `${cfg.name}${name}`, color,
    pane: cfg.pane, kind: "line", points: toPoints(bars, arr),
  });

  switch (cfg.id) {
    case "delta": {
      const d = deltaSeries(bars);
      const cum = cumulativeDelta(bars);
      return [
        {
          id: "delta-hist", name: "Delta", color: "#22d3ee", pane: 1, kind: "histogram",
          points: toPoints(bars, d), height: 120, shareScale: "ind-delta",
          priceFormat: { type: "volume" },
          floors: [{ price: 0, color: "rgba(148,163,184,0.3)", dashed: true, label: "0" }],
        },
        {
          id: "delta-cum", name: "Cum Δ", color: "#22d3ee", pane: 1, kind: "area",
          points: toPoints(bars, cum), areaFill: { top: "rgba(34,211,238,0.30)", bottom: "rgba(34,211,238,0.01)" },
          shareScale: "ind-delta",
        },
      ];
    }

    case "bigtrades": {
      return [
        {
          id: "bigtrades", name: "Big Trades", color: cfg.color, pane: 0, kind: "markers",
          points: [], markers: bigTrades(bars),
        },
      ];
    }

    case "tpo": {
      return [
        {
          id: "tpo", name: "TPO", color: cfg.color, pane: 0, kind: "tpo",
          points: [], tpo: computeTpo(bars),
        },
      ];
    }

    case "gex": {
      return [
        {
          id: "gex", name: "GEX", color: cfg.color, pane: 0, kind: "gex",
          points: [], gex: null,
        },
      ];
    }

    case "sma20": return [line("", sma(closes, 20))];
    case "sma50": return [line("", sma(closes, 50))];
    case "sma100": return [line("", sma(closes, 100))];
    case "sma200": return [line("", sma(closes, 200))];
    case "ema9":   return [line("", ema(closes, 9))];
    case "ema21":  return [line("", ema(closes, 21))];
    case "ema50":  return [line("", ema(closes, 50))];
    case "vwap": {
      const v = vwap(bars);
      const bands = computeVWAP(bars);
      const u1 = bands.map((b) => b.upper1 as number | null), l1 = bands.map((b) => b.lower1 as number | null);
      const u2 = bands.map((b) => b.upper2 as number | null), l2 = bands.map((b) => b.lower2 as number | null);
      return [
        {
          id: "vwap", name: "VWAP", color: "#f8fafc", pane: 0, kind: "line", lineWidth: 2,
          points: toPoints(bars, v), priceFormat: { minMove: 0.000001 },
        },
        { id: "vwap-b1", name: "VWAP ±σ", color: "", pane: 0, kind: "band", points: [],
          band: { rows: bandRows(bars, u1, l1), color: "rgba(248,250,252,0.10)" } },
        { id: "vwap-b2", name: "VWAP ±2σ", color: "", pane: 0, kind: "band", points: [],
          band: { rows: bandRows(bars, u2, l2), color: "rgba(248,250,252,0.05)" } },
      ];
    }
    case "atr14":  return [line("", atr(bars, 14))];

    case "bb20": {
      const { upper, mid, lower } = bollinger(closes, 20, 2);
      return [
        {
          id: "bb20-band", name: "BB band", color: "", pane: 0, kind: "band", points: [],
          band: { rows: bandRows(bars, upper, lower), color: "rgba(96,165,250,0.12)" },
        },
        { id: "bb20-upper", name: "Upper", color: "#60a5fa", pane: 0, kind: "line", points: toPoints(bars, upper) },
        { id: "bb20-mid",   name: "Mid",   color: "rgba(147,197,253,0.85)", pane: 0, kind: "line", points: toPoints(bars, mid) },
        { id: "bb20-lower", name: "Lower", color: "#60a5fa", pane: 0, kind: "line", points: toPoints(bars, lower) },
      ];
    }

    case "rsi14": {
      const r = rsi(closes, 14);
      return [{
        id: "rsi14", name: "RSI (14)", color: "#a78bfa", pane: 1, kind: "baseline",
        baseline: 50, baselineTopColor: "#34d399", baselineBottomColor: "#f87171",
        points: toPoints(bars, r), height: 110,
        floors: [
          { price: 70, color: "rgba(239,68,68,0.4)", dashed: true, label: "70" },
          { price: 30, color: "rgba(34,197,94,0.4)", dashed: true, label: "30" },
          { price: 50, color: "rgba(148,163,184,0.25)", dashed: true },
        ],
      }];
    }

    case "macd": {
      const { macd: m, signal: sg, hist } = macd(closes, 12, 26, 9);
      return [
        {
          id: "macd", name: "MACD", color: "#2962ff", pane: 1, kind: "line",
          points: toPoints(bars, m), shareScale: "ind-macd",
        },
        {
          id: "macd-signal", name: "Signal", color: "#f5923e", pane: 1, kind: "line",
          points: toPoints(bars, sg), shareScale: "ind-macd",
        },
        {
          id: "macd-hist", name: "Hist", color: "", pane: 1, kind: "histogram",
          points: toPoints(bars, hist), shareScale: "ind-macd", height: 150,
          floors: [{ price: 0, color: "rgba(148,163,184,0.3)", dashed: true, label: "0" }],
        },
      ];
    }

    default: return [];
  }
}

/* ── TV-style indicator menu ────────────────────────────────────────── */

export const INDICATOR_MENU: IndicatorConfig[] = [
  { id: "sma20",   name: "SMA 20",    pane: 0, color: "#f59e0b" },
  { id: "sma50",   name: "SMA 50",    pane: 0, color: "#38bdf8" },
  { id: "sma100",  name: "SMA 100",   pane: 0, color: "#4ade80" },
  { id: "sma200",  name: "SMA 200",   pane: 0, color: "#c084fc" },
  { id: "ema9",    name: "EMA 9",     pane: 0, color: "#f87171" },
  { id: "ema21",   name: "EMA 21",    pane: 0, color: "#fb923c" },
  { id: "ema50",   name: "EMA 50",    pane: 0, color: "#e879f9" },
  { id: "vwap",    name: "VWAP",      pane: 0, color: "#f8fafc" },
  { id: "bb20",    name: "BB (20, 2)",pane: 0, color: "#60a5fa" },
  { id: "atr14",   name: "ATR (14)",  pane: 0, color: "#a78bfa" },
  { id: "rsi14",   name: "RSI (14)",  pane: 1, color: "#a78bfa" },
  { id: "macd",    name: "MACD",      pane: 1, color: "#2962ff" },

  /* ── Order-flow set (backtest: OHLCV-derived estimates) ─────── */
  { id: "delta",    name: "Delta (est)",       pane: 1, color: "#22d3ee" },
  { id: "bigtrades",name: "Big Trades (proxy)", pane: 0, color: "#f472b6" },
  { id: "tpo",      name: "TPO Profile",       pane: 0, color: "#38bdf8" },
  { id: "gex",      name: "GEX Profile",       pane: 0, color: "#a3e635" },
];

export function indicatorById(id: string): IndicatorConfig | undefined {
  return INDICATOR_MENU.find((i) => i.id === id);
}

/* Value of an indicator source at/just-before the last visible bar time. */
export function lastValueAt(src: IndicatorSource, lastTime: number): { text: string; value: number } | null {
  const pts = src.points;
  if (!pts.length) return null;
  let lo = 0, hi = pts.length - 1, found: Point | null = null;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (pts[m].time <= lastTime) { found = pts[m]; lo = m + 1; }
    else hi = m - 1;
  }
  if (!found) return null;
  return { text: fmtValue(found.value), value: found.value };
}

function fmtValue(n: number): string {
  const a = Math.abs(n);
  if (a >= 10000) return n.toFixed(0);
  if (a >= 100)   return n.toFixed(2);
  if (a >= 1)     return n.toFixed(4);
  if (a >= 0.01)  return n.toFixed(4);
  return n.toPrecision(4);
}

/* ── End of engine ──────────────────────────────────────────────────── */