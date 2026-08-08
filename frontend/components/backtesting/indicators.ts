"use client";

/* ── Indicator engine for the TV-style Backtest chart ───────────────── */

import type { OHLCVBar } from "./ReplayChart";

export interface IndicatorConfig {
  id: string;
  name: string;    // display name, e.g. "SMA 20"
  pane: 0 | 1;     // 0 = overlays candles, 1 = bottom pane (RSI/MACD)
  color: string;
}

/* Computed points: lightweight-charts accepts {time, value}[] */
export type Point = { time: number; value: number };

/* One concrete visual series on the chart (an indicator may emit several). */
export interface IndicatorSource {
  id: string;         // unique chart key, e.g. "bb20-upper"
  name: string;       // legend label
  color: string;
  pane: 0 | 1;
  kind: "line" | "area" | "histogram" | "baseline";
  points: Point[];
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

/* ── Series builder ────────────────────────────────────────────── */

function toPoints(bars: OHLCVBar[], arr: (number | null)[]): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < bars.length; i++) {
    const v = arr[i];
    if (v != null && isFinite(v)) out.push({ time: bars[i].time, value: v });
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
    case "sma20": return [line("", sma(closes, 20))];
    case "sma50": return [line("", sma(closes, 50))];
    case "sma100": return [line("", sma(closes, 100))];
    case "sma200": return [line("", sma(closes, 200))];
    case "ema9":   return [line("", ema(closes, 9))];
    case "ema21":  return [line("", ema(closes, 21))];
    case "ema50":  return [line("", ema(closes, 50))];
    case "vwap":   return [line("", vwap(bars))];
    case "atr14":  return [line("", atr(bars, 14))];

    case "bb20": {
      const { upper, mid, lower } = bollinger(closes, 20, 2);
      return [
        { id: "bb20-upper", name: "Upper", color: cfg.color, pane: 0, kind: "line", points: toPoints(bars, upper) },
        { id: "bb20-mid",   name: "Mid",   color: "#93c5fd", pane: 0, kind: "line", points: toPoints(bars, mid) },
        { id: "bb20-lower", name: "Lower", color: cfg.color, pane: 0, kind: "line", points: toPoints(bars, lower) },
      ];
    }

    case "rsi14": {
      const r = rsi(closes, 14);
      return [{
        id: "rsi14", name: "RSI (14)", color: cfg.color, pane: 1, kind: "line",
        points: toPoints(bars, r),
      }];
    }

    case "macd": {
      const { macd: m, signal: sg, hist } = macd(closes, 12, 26, 9);
      const src: IndicatorSource[] = [
        {
          id: "macd", name: "MACD", color: "#2962ff", pane: 1, kind: "line",
          points: toPoints(bars, m),
        },
        {
          id: "macd-signal", name: "Signal", color: "#f5923e", pane: 1, kind: "line",
          points: toPoints(bars, sg),
        },
      ];
      const hp = toPoints(bars, hist);
      return [
        ...src,
        {
          id: "macd-hist", name: "Hist", color: "", pane: 1, kind: "histogram",
          points: hp,
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