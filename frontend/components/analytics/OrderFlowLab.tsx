"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createChart, IChartApi, ISeriesApi, ColorType, CrosshairMode,
  CandlestickSeries, LineSeries,
} from "lightweight-charts";
import {
  Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Line, ComposedChart,
} from "recharts";
import {
  Layers, Search, ChevronDown, Activity, Target, Gauge, Crosshair,
  TrendingUp, TrendingDown, Loader2, AlertTriangle, Info, Zap, Flame, Radio,
} from "lucide-react";
import {
  type OHLCVBar, type FootprintBar, type ImbalanceRun,
  computeVWAP, computeVolumeProfile, sessionVWAP, estimateDeltaFromOHLCV,
} from "../../lib/orderflow";
import { useLiveOrderFlow, useLivePolledOHLCV, type BigTrade, type TapeSpeed } from "../../lib/orderflow-live";
import { VolumeProfilePrimitive, type VolumeProfileData } from "../../lib/volume-profile-primitive";
import { cn } from "../../lib/utils";

/* ── Symbols ──────────────────────────────────────────────────────────────── */
type Sym = { label: string; ticker: string; name?: string };
const CRYPTO: Sym[] = [
  { label: "BTC", ticker: "BTC-USD" }, { label: "ETH", ticker: "ETH-USD" },
  { label: "SOL", ticker: "SOL-USD" }, { label: "BNB", ticker: "BNB-USD" },
  { label: "XRP", ticker: "XRP-USD" }, { label: "DOGE", ticker: "DOGE-USD" },
  { label: "ADA", ticker: "ADA-USD" }, { label: "AVAX", ticker: "AVAX-USD" },
  { label: "LINK", ticker: "LINK-USD" }, { label: "LTC", ticker: "LTC-USD" },
  { label: "DOT", ticker: "DOT-USD" }, { label: "ARB", ticker: "ARB-USD" },
  { label: "OP", ticker: "OP-USD" }, { label: "SUI", ticker: "SUI-USD" },
  { label: "INJ", ticker: "INJ-USD" }, { label: "TIA", ticker: "TIA-USD" },
];
const FUTURES: Sym[] = [
  { label: "ES", ticker: "ES=F", name: "S&P 500" }, { label: "NQ", ticker: "NQ=F", name: "Nasdaq 100" },
  { label: "YM", ticker: "YM=F", name: "Dow" }, { label: "RTY", ticker: "RTY=F", name: "Russell 2000" },
];
const INDICES: Sym[] = [
  { label: "S&P 500", ticker: "^GSPC" }, { label: "Nasdaq 100", ticker: "^NDX" },
  { label: "Dow Jones", ticker: "^DJI" }, { label: "Russell 2000", ticker: "^RUT" },
  { label: "VIX", ticker: "^VIX" },
];
const STOCKS: Sym[] = [
  { label: "SPY", ticker: "SPY" }, { label: "QQQ", ticker: "QQQ" },
  { label: "AAPL", ticker: "AAPL" }, { label: "NVDA", ticker: "NVDA" },
  { label: "TSLA", ticker: "TSLA" }, { label: "MSFT", ticker: "MSFT" },
  { label: "AMZN", ticker: "AMZN" }, { label: "META", ticker: "META" },
  { label: "GOOGL", ticker: "GOOGL" }, { label: "AMD", ticker: "AMD" },
  { label: "NFLX", ticker: "NFLX" }, { label: "COIN", ticker: "COIN" },
];
const FOREX: Sym[] = [
  { label: "EUR/USD", ticker: "EURUSD=X" }, { label: "GBP/USD", ticker: "GBPUSD=X" },
  { label: "USD/JPY", ticker: "USDJPY=X" }, { label: "AUD/USD", ticker: "AUDUSD=X" },
  { label: "USD/CAD", ticker: "USDCAD=X" }, { label: "USD/CHF", ticker: "USDCHF=X" },
];
const COMMODITIES: Sym[] = [
  { label: "Gold", ticker: "GC=F" }, { label: "Silver", ticker: "SI=F" },
  { label: "Crude Oil", ticker: "CL=F" }, { label: "Nat Gas", ticker: "NG=F" },
  { label: "Copper", ticker: "HG=F" },
];
const SYMBOL_GROUPS: { name: string; tag: "tick" | "live"; items: Sym[] }[] = [
  { name: "Crypto · real footprint", tag: "tick", items: CRYPTO },
  { name: "Фьючерсы", tag: "live", items: FUTURES },
  { name: "Индексы", tag: "live", items: INDICES },
  { name: "Акции", tag: "live", items: STOCKS },
  { name: "Форекс", tag: "live", items: FOREX },
  { name: "Сырьё и металлы", tag: "live", items: COMMODITIES },
];
const INTERVALS = ["1m", "5m", "15m", "1h"] as const;
type Interval = typeof INTERVALS[number];

const isCryptoTicker = (t: string) => /-USD$/i.test(t);
// Yahoo period for non-crypto intraday OHLCV
const OHLCV_PERIOD: Record<Interval, string> = { "1m": "7d", "5m": "1mo", "15m": "1mo", "1h": "3mo" };

/* ── Format helpers ───────────────────────────────────────────────────────── */
function decimalsFor(tick: number): number {
  if (!tick || tick >= 1) return tick >= 100 ? 0 : tick >= 1 ? 1 : 2;
  return Math.min(8, Math.max(0, Math.ceil(-Math.log10(tick))));
}
function fmtPrice(p: number, tick: number): string {
  return p.toLocaleString("en-US", { minimumFractionDigits: decimalsFor(tick), maximumFractionDigits: decimalsFor(tick) });
}
function fmtQty(q: number): string {
  const a = Math.abs(q);
  if (a >= 1000) return (q / 1000).toFixed(1) + "k";
  if (a >= 10) return q.toFixed(0);
  if (a >= 1) return q.toFixed(1);
  if (a >= 0.01) return q.toFixed(2);
  return q.toExponential(1);
}
function fmtSigned(n: number): string {
  return (n >= 0 ? "+" : "") + fmtQty(n);
}

/* ── Small UI primitives (self-contained — match Analytics Lab visual language) */
function StatCard({ label, value, sub, color = "#a78bfa", icon: Icon }: {
  label: string; value: string; sub?: string; color?: string; icon?: any;
}) {
  return (
    <div className="rounded-2xl p-4 relative overflow-hidden"
      style={{
        background: `linear-gradient(145deg, ${color}1a, rgba(255,255,255,0.015))`,
        border: `1px solid ${color}2e`,
        boxShadow: `0 4px 20px ${color}14`,
      }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "rgba(120,134,158,0.9)" }}>{label}</span>
        {Icon && <Icon className="w-3.5 h-3.5" style={{ color }} />}
      </div>
      <div className="text-[19px] font-bold font-mono tabular-nums leading-tight" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] mt-1" style={{ color: "rgba(120,134,158,0.75)" }}>{sub}</div>}
    </div>
  );
}

/* ═══ VWAP + price chart (lightweight-charts) ════════════════════════════════ */
function VWAPChart({ candles, profile }: { candles: OHLCVBar[]; profile: VolumeProfileData | null }) {
  const elRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineRefs = useRef<Record<string, ISeriesApi<"Line">>>({});
  const profileRef = useRef<VolumeProfilePrimitive | null>(null);
  const fittedRef = useRef(false);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const chart = createChart(el, {
      width: el.clientWidth || 800,
      height: el.clientHeight || 360,
      layout: { background: { type: ColorType.Solid, color: "#070a12" }, textColor: "#64748b", fontSize: 11 },
      grid: { vertLines: { color: "rgba(255,255,255,0.04)" }, horzLines: { color: "rgba(255,255,255,0.04)" } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.06)", scaleMargins: { top: 0.08, bottom: 0.08 } },
      timeScale: { borderColor: "rgba(255,255,255,0.06)", timeVisible: true, secondsVisible: false, rightOffset: 4 },
    });
    candleRef.current = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981", downColor: "#ef4444", borderVisible: false,
      wickUpColor: "#10b981", wickDownColor: "#ef4444",
    });
    const mkLine = (color: string, width: 1 | 2, dashed = false) =>
      chart.addSeries(LineSeries, {
        color, lineWidth: width, priceLineVisible: false, lastValueVisible: false,
        lineStyle: dashed ? 2 : 0, crosshairMarkerVisible: false,
      });
    lineRefs.current = {
      vwap: mkLine("#f59e0b", 2),
      u1: mkLine("rgba(34,211,238,0.55)", 1, true),
      l1: mkLine("rgba(34,211,238,0.55)", 1, true),
      u2: mkLine("rgba(167,139,250,0.45)", 1, true),
      l2: mkLine("rgba(167,139,250,0.45)", 1, true),
    };
    // Left-anchored, price-aligned volume profile drawn under the candles.
    const profilePrim = new VolumeProfilePrimitive(0.26, true);
    candleRef.current.attachPrimitive(profilePrim as any);
    profileRef.current = profilePrim;
    chartRef.current = chart;
    const ro = new ResizeObserver(() => {
      if (chartRef.current && el.clientWidth > 0) chartRef.current.applyOptions({ width: el.clientWidth, height: el.clientHeight });
    });
    ro.observe(el);
    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; candleRef.current = null; lineRefs.current = {}; profileRef.current = null; };
  }, []);

  useEffect(() => { profileRef.current?.setData(profile); }, [profile]);

  useEffect(() => {
    if (!candleRef.current || !candles.length) return;
    candleRef.current.setData(candles.map((c) => ({ time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close })));
    const v = computeVWAP(candles);
    lineRefs.current.vwap?.setData(v.map((p) => ({ time: p.time as any, value: p.vwap })));
    lineRefs.current.u1?.setData(v.map((p) => ({ time: p.time as any, value: p.upper1 })));
    lineRefs.current.l1?.setData(v.map((p) => ({ time: p.time as any, value: p.lower1 })));
    lineRefs.current.u2?.setData(v.map((p) => ({ time: p.time as any, value: p.upper2 })));
    lineRefs.current.l2?.setData(v.map((p) => ({ time: p.time as any, value: p.lower2 })));
    // Fit once; afterwards keep the user's zoom/scroll while live data streams in.
    if (!fittedRef.current) { chartRef.current?.timeScale().fitContent(); fittedRef.current = true; }
  }, [candles]);

  return <div ref={elRef} className="w-full h-[360px]" />;
}

/* ═══ Footprint chart (canvas — professional bid×ask ladder) ═════════════════ */
interface FpRow { price: number; buy: number; sell: number; }
interface FpBar {
  time: number; rows: Map<number, FpRow>; delta: number; totalVol: number;
  pocPrice: number | null; open?: number; close?: number; high?: number; low?: number;
  buyImb: Set<number>; sellImb: Set<number>;
}

function FootprintChart({ footprint, candles, tickSize, imbalances }: {
  footprint: FootprintBar[]; candles: OHLCVBar[]; tickSize: number; imbalances: ImbalanceRun[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const axisRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const atRightRef = useRef(true);

  // ── Build a shared, sanely-grouped price ladder ────────────────────────────
  const model = useMemo(() => {
    if (!footprint.length) return null;
    const tick = tickSize > 0 ? tickSize : 1;
    let min = Infinity, max = -Infinity;
    for (const b of footprint) for (const c of b.cells) {
      if (c.price < min) min = c.price; if (c.price > max) max = c.price;
    }
    if (!isFinite(min) || !isFinite(max) || max < min) return null;

    // Group ticks so the ladder never exceeds ~34 rows (keeps numbers legible).
    const rawLevels = Math.round((max - min) / tick) + 1;
    const group = Math.max(1, Math.ceil(rawLevels / 34));
    const dTick = tick * group;
    const top = Math.round(max / dTick) * dTick;
    const bottom = Math.round(min / dTick) * dTick;
    const rowCount = Math.max(1, Math.round((top - bottom) / dTick) + 1);
    const rows: number[] = [];
    for (let i = 0; i < rowCount; i++) rows.push(top - i * dTick);

    const candleByTime = new Map<number, OHLCVBar>();
    for (const c of candles) candleByTime.set(c.time, c);

    const imbByBar = new Map<number, { buy: Set<number>; sell: Set<number> }>();
    for (const b of footprint) imbByBar.set(b.time, { buy: new Set(), sell: new Set() });
    for (const r of imbalances) {
      const tgt = footprint[r.barIndex];
      if (!tgt) continue;
      const entry = imbByBar.get(tgt.time)!;
      const lo = Math.min(r.priceStart, r.priceEnd), hi = Math.max(r.priceStart, r.priceEnd);
      for (const p of rows) if (p >= lo - dTick / 2 && p <= hi + dTick / 2) entry[r.type].add(p);
    }

    let maxCell = 1;
    const bars: FpBar[] = footprint.map((b) => {
      const map = new Map<number, FpRow>();
      for (const c of b.cells) {
        const p = Math.round(c.price / dTick) * dTick;
        let row = map.get(p);
        if (!row) { row = { price: p, buy: 0, sell: 0 }; map.set(p, row); }
        row.buy += c.buy; row.sell += c.sell;
        if (row.buy > maxCell) maxCell = row.buy;
        if (row.sell > maxCell) maxCell = row.sell;
      }
      let pocPrice: number | null = null, pocVol = -1;
      for (const r of map.values()) { const t = r.buy + r.sell; if (t > pocVol) { pocVol = t; pocPrice = r.price; } }
      const cd = candleByTime.get(b.time);
      const imb = imbByBar.get(b.time)!;
      return {
        time: b.time, rows: map, delta: b.delta, totalVol: b.totalVol, pocPrice,
        open: cd?.open, close: cd?.close, high: cd?.high, low: cd?.low,
        buyImb: imb.buy, sellImb: imb.sell,
      };
    });

    return { dTick, rows, top, bars, maxCell };
  }, [footprint, candles, tickSize, imbalances]);

  // Layout constants
  const COL = 92, GUT = 12, HEAD = 22, FOOT = 38;
  const rowCount = model?.rows.length ?? 0;
  const rowH = Math.max(13, Math.min(22, Math.floor(560 / Math.max(1, rowCount))));
  const bodyH = rowCount * rowH;
  const totalH = HEAD + bodyH + FOOT;
  const AXIS_W = 58;

  const draw = useCallback(() => {
    const m = model;
    const axis = axisRef.current, grid = gridRef.current;
    if (!m || !axis || !grid) return;
    const dpr = window.devicePixelRatio || 1;
    const dec = decimalsFor(m.dTick);
    const yOf = (rowIdx: number) => HEAD + rowIdx * rowH;
    const priceRowIdx = (p: number) => Math.round((m.top - p) / m.dTick);

    // ── Price axis (fixed left) ──────────────────────────────────────────────
    axis.width = AXIS_W * dpr; axis.height = totalH * dpr;
    axis.style.width = `${AXIS_W}px`; axis.style.height = `${totalH}px`;
    const ax = axis.getContext("2d")!; ax.setTransform(dpr, 0, 0, dpr, 0, 0);
    ax.clearRect(0, 0, AXIS_W, totalH);
    ax.font = "10px ui-monospace, monospace"; ax.textAlign = "right"; ax.textBaseline = "middle";
    const labelEvery = rowH < 16 ? 2 : 1;
    m.rows.forEach((p, i) => {
      const y = yOf(i) + rowH / 2;
      ax.strokeStyle = "rgba(255,255,255,0.03)"; ax.beginPath(); ax.moveTo(0, yOf(i) + rowH); ax.lineTo(AXIS_W, yOf(i) + rowH); ax.stroke();
      if (i % labelEvery === 0) { ax.fillStyle = "rgba(120,134,158,0.85)"; ax.fillText(p.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }), AXIS_W - 5, y); }
    });

    // ── Footprint grid (scrollable) ──────────────────────────────────────────
    const W = m.bars.length * COL;
    grid.width = Math.max(1, W) * dpr; grid.height = totalH * dpr;
    grid.style.width = `${W}px`; grid.style.height = `${totalH}px`;
    const g = grid.getContext("2d")!; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, totalH);
    g.font = "10px ui-monospace, monospace"; g.textBaseline = "middle";

    m.bars.forEach((bar, bi) => {
      const x = bi * COL;
      const mid = x + GUT + (COL - GUT) / 2;

      // column separator
      g.strokeStyle = "rgba(255,255,255,0.04)"; g.beginPath(); g.moveTo(x + 0.5, HEAD); g.lineTo(x + 0.5, HEAD + bodyH); g.stroke();

      // time header
      g.fillStyle = "rgba(120,134,158,0.8)"; g.textAlign = "center";
      g.fillText(new Date(bar.time * 1000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }), x + COL / 2, HEAD / 2);

      // candle (wick + body) drawn in the left gutter
      if (bar.high != null && bar.low != null && bar.open != null && bar.close != null) {
        const up = bar.close >= bar.open;
        const col = up ? "#10b981" : "#ef4444";
        const cx = x + GUT / 2;
        const yH = HEAD + Math.max(0, priceRowIdx(bar.high)) * rowH;
        const yL = HEAD + Math.min(rowCount, priceRowIdx(bar.low) + 1) * rowH;
        g.strokeStyle = col; g.globalAlpha = 0.9; g.beginPath(); g.moveTo(cx, yH); g.lineTo(cx, yL); g.stroke();
        const yO = HEAD + priceRowIdx(bar.open) * rowH + rowH / 2;
        const yC = HEAD + priceRowIdx(bar.close) * rowH + rowH / 2;
        g.fillStyle = col; g.fillRect(cx - 2.5, Math.min(yO, yC), 5, Math.max(2, Math.abs(yC - yO)));
        g.globalAlpha = 1;
      }

      // cells
      const halfW = (COL - GUT) / 2 - 2;
      for (const row of bar.rows.values()) {
        if (row.buy === 0 && row.sell === 0) continue;
        const ri = priceRowIdx(row.price);
        if (ri < 0 || ri >= rowCount) continue;
        const y = yOf(ri);
        const isPOC = bar.pocPrice != null && Math.abs(row.price - bar.pocPrice) < m.dTick / 2;
        const sellI = Math.min(1, row.sell / m.maxCell);
        const buyI = Math.min(1, row.buy / m.maxCell);

        // POC band
        if (isPOC) { g.fillStyle = "rgba(245,158,11,0.12)"; g.fillRect(x + GUT - 2, y, COL - GUT, rowH); }

        // sell (left) heat + number
        g.fillStyle = `rgba(248,113,113,${0.08 + sellI * 0.42})`;
        g.fillRect(x + GUT, y + 0.5, halfW, rowH - 1);
        // buy (right) heat + number
        g.fillStyle = `rgba(52,211,153,${0.08 + buyI * 0.42})`;
        g.fillRect(mid + 1, y + 0.5, halfW, rowH - 1);

        // imbalance outlines
        if (bar.sellImb.has(row.price)) { g.strokeStyle = "#f87171"; g.lineWidth = 1; g.strokeRect(x + GUT + 0.5, y + 1, halfW - 1, rowH - 2); }
        if (bar.buyImb.has(row.price)) { g.strokeStyle = "#34d399"; g.lineWidth = 1; g.strokeRect(mid + 1.5, y + 1, halfW - 1, rowH - 2); }

        if (rowH >= 13) {
          g.fillStyle = row.sell > 0 ? "#fca5a5" : "#475569"; g.textAlign = "right";
          if (row.sell > 0) g.fillText(fmtQty(row.sell), mid - 4, y + rowH / 2);
          g.fillStyle = isPOC ? "#fbbf24" : row.buy > 0 ? "#86efac" : "#475569"; g.textAlign = "left";
          if (row.buy > 0) g.fillText(fmtQty(row.buy), mid + 5, y + rowH / 2);
        }
      }

      // footer — delta badge + total volume
      const fy = HEAD + bodyH;
      const up = bar.delta >= 0;
      g.fillStyle = up ? "rgba(52,211,153,0.16)" : "rgba(248,113,113,0.16)";
      g.fillRect(x + 3, fy + 4, COL - 6, 18);
      g.fillStyle = up ? "#34d399" : "#f87171"; g.textAlign = "center"; g.font = "bold 10px ui-monospace, monospace";
      g.fillText(fmtSigned(bar.delta), x + COL / 2, fy + 13);
      g.font = "9px ui-monospace, monospace"; g.fillStyle = "rgba(120,134,158,0.7)";
      g.fillText(`Σ ${fmtQty(bar.totalVol)}`, x + COL / 2, fy + 30);
      g.font = "10px ui-monospace, monospace";
    });

    // keep the latest bar in view unless the user scrolled away
    const sc = scrollRef.current;
    if (sc && atRightRef.current) sc.scrollLeft = sc.scrollWidth;
  }, [model, rowH, rowCount, bodyH, totalH]);

  useEffect(() => { draw(); }, [draw]);
  useEffect(() => {
    const ro = new ResizeObserver(() => draw());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [draw]);

  if (!model) return null;
  return (
    <div ref={wrapRef} className="flex" style={{ height: totalH }}>
      <canvas ref={axisRef} className="flex-shrink-0" />
      <div ref={scrollRef} className="overflow-x-auto flex-1"
        onScroll={(e) => { const el = e.currentTarget; atRightRef.current = el.scrollWidth - el.clientWidth - el.scrollLeft < 24; }}>
        <canvas ref={gridRef} />
      </div>
    </div>
  );
}

/* ═══ Volume / Market Profile (horizontal histogram) ═════════════════════════ */
function VolumeProfilePanel({ candles, tick }: { candles: OHLCVBar[]; tick: number }) {
  const profile = useMemo(() => computeVolumeProfile(candles, 26), [candles]);
  if (!profile) return null;
  const maxVol = Math.max(1, ...profile.bins.map((b) => b.volume));
  const singles = new Set(profile.singlePrints.map((p) => p.toFixed(6)));
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-[10px] text-gray-500 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400/80" /> POC</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-cyan-400/40" /> Value Area (70%)</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-fuchsia-400/70" /> Single Print</span>
      </div>
      <div className="flex flex-col-reverse gap-[2px]">
        {profile.bins.map((b, i) => {
          const inVA = b.priceMid >= profile.val && b.priceMid <= profile.vah;
          const isPOC = i === profile.pocIndex;
          const isSingle = singles.has(b.priceMid.toFixed(6));
          return (
            <div key={i} className="flex items-center gap-2 h-4">
              <span className="text-[9px] font-mono text-gray-600 w-16 text-right tabular-nums">{fmtPrice(b.priceMid, tick)}</span>
              <div className="flex-1 h-3 bg-white/[0.02] rounded-sm overflow-hidden relative">
                <div className="h-full rounded-sm"
                  style={{
                    width: `${(b.volume / maxVol) * 100}%`,
                    background: isPOC ? "rgba(245,158,11,0.85)" : inVA ? "rgba(34,211,238,0.45)" : "rgba(100,116,139,0.35)",
                  }} />
                {isSingle && <div className="absolute right-0 top-0 h-full w-1 bg-fuchsia-400/80" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══ Main component ═════════════════════════════════════════════════════════ */
interface OrderFlowData {
  candles: OHLCVBar[];
  deltas: number[];
  deltaCumulative: number[];
  footprint: FootprintBar[];
  imbalances: ImbalanceRun[];
  tickSize: number;
  real: boolean; // true = Binance tick data, false = OHLCV estimate
}

export default function OrderFlowLab() {
  const [ticker, setTicker] = useState("BTC-USD");
  const [label, setLabel] = useState("BTC");
  const [interval, setInterval] = useState<Interval>("5m");
  const [liveMode, setLiveMode] = useState(true);
  const [staticData, setStaticData] = useState<OrderFlowData | null>(null);
  const [staticLoading, setStaticLoading] = useState(false);
  const [staticError, setStaticError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const reqId = useRef(0);

  const crypto = isCryptoTicker(ticker);
  const liveEnabled = liveMode;

  // ── Real-time paths: Binance WebSocket (crypto) or Yahoo polling (other) ───
  const cryptoLive = useLiveOrderFlow(ticker, interval, crypto && liveMode);
  const polledLive = useLivePolledOHLCV(ticker, interval, !crypto && liveMode);
  const live = crypto ? cryptoLive : polledLive;

  // ── Static path: one-shot REST when live is paused ─────────────────────────
  const load = useCallback(async (tk: string, iv: Interval) => {
    const id = ++reqId.current;
    setStaticLoading(true); setStaticError(null);
    try {
      if (isCryptoTicker(tk)) {
        const res = await fetch(`/api/orderflow?symbol=${encodeURIComponent(tk)}&interval=${iv}&bars=90&footprintBars=12`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.detail || "Failed to load order flow");
        if (id !== reqId.current) return;
        setStaticData({
          candles: json.candles, deltas: json.deltas, deltaCumulative: json.deltaCumulative,
          footprint: json.footprint, imbalances: json.imbalances, tickSize: json.tickSize, real: true,
        });
      } else {
        const res = await fetch(`/api/backtesting/ohlcv?symbol=${encodeURIComponent(tk)}&interval=${iv}&period=${OHLCV_PERIOD[iv]}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.detail || "Failed to load data");
        if (id !== reqId.current) return;
        const candles: OHLCVBar[] = (json.candles as OHLCVBar[]).slice(-120);
        const deltas = candles.map(estimateDeltaFromOHLCV);
        let cum = 0; const deltaCumulative = deltas.map((d) => (cum += d));
        setStaticData({ candles, deltas, deltaCumulative, footprint: [], imbalances: [], tickSize: 0, real: false });
      }
    } catch (e: any) {
      if (id === reqId.current) { setStaticError(e.message ?? "Unknown error"); setStaticData(null); }
    } finally {
      if (id === reqId.current) setStaticLoading(false);
    }
  }, []);

  useEffect(() => { if (!liveEnabled) load(ticker, interval); }, [ticker, interval, liveEnabled, load]);

  // ── Unified view over both paths ───────────────────────────────────────────
  const data = liveEnabled ? live.data : staticData;
  const loading = liveEnabled ? live.loading : staticLoading;
  const error = liveEnabled ? live.error : staticError;
  const connected = liveEnabled && live.connected;
  const marketState = !crypto ? polledLive.marketState : "";
  const isReal = crypto ? (liveEnabled || (staticData?.real ?? false)) : false;
  const bigTrades: BigTrade[] = crypto && liveEnabled ? (cryptoLive.data?.bigTrades ?? []) : [];
  const tape: TapeSpeed | undefined = crypto && liveEnabled ? cryptoLive.data?.tape : undefined;

  const profile = useMemo(() => (data ? computeVolumeProfile(data.candles, 30) : null), [data]);
  const vwap = useMemo(() => (data ? sessionVWAP(data.candles) : null), [data]);
  const lastPrice = liveEnabled
    ? (live.data?.lastPrice ?? 0)
    : (data?.candles.length ? data.candles[data.candles.length - 1].close : 0);
  const cumDelta = data?.deltaCumulative.length ? data.deltaCumulative[data.deltaCumulative.length - 1] : 0;
  const priceTick = data?.tickSize || (profile ? (profile.bins[1]?.priceMid - profile.bins[0]?.priceMid) : 0) || 0.01;

  // ── Price-aligned volume profile for the chart (buy/sell split from footprint) ─
  const chartProfile = useMemo<VolumeProfileData | null>(() => {
    if (!profile) return null;
    // Aggregate footprint buy/sell across visible bars, keyed by raw price.
    const fpCells: { price: number; buy: number; sell: number }[] = [];
    for (const fb of data?.footprint ?? []) for (const c of fb.cells) fpCells.push(c);
    const rows = profile.bins.map((b) => {
      let buy = 0, sell = 0;
      for (const c of fpCells) if (c.price >= b.priceLow && c.price < b.priceHigh) { buy += c.buy; sell += c.sell; }
      return {
        priceLow: b.priceLow, priceHigh: b.priceHigh, priceMid: b.priceMid,
        volume: b.volume, buy: buy || undefined, sell: sell || undefined,
      };
    });
    return { rows, pocPrice: profile.poc, vaLow: profile.val, vaHigh: profile.vah };
  }, [profile, data]);

  const deltaChart = useMemo(() => {
    if (!data) return [];
    return data.candles.map((c, i) => ({
      t: new Date(c.time * 1000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      delta: data.deltas[i] ?? 0,
      cum: data.deltaCumulative[i] ?? 0,
    }));
  }, [data]);

  const q = query.toLowerCase();
  const filteredGroups = SYMBOL_GROUPS
    .map((g) => ({
      ...g,
      items: q
        ? g.items.filter((s) => s.label.toLowerCase().includes(q) || s.ticker.toLowerCase().includes(q) || (s.name?.toLowerCase().includes(q)))
        : g.items,
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "#a78bfa15", border: "1px solid #a78bfa25" }}>
          <Layers className="w-5 h-5" style={{ color: "#a78bfa" }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-white">Order Flow</h2>
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border",
              crypto ? "bg-purple-500/15 text-purple-300 border-purple-500/25" : "bg-cyan-500/12 text-cyan-300 border-cyan-500/25")}>
              {crypto ? "REAL TICK DATA" : "LIVE QUOTE"}
            </span>
            {liveEnabled && (
              <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                connected ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-amber-500/12 text-amber-300 border-amber-500/25")}>
                <span className={cn("w-1.5 h-1.5 rounded-full", connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400")} />
                {connected ? "LIVE" : "Подключение…"}
              </span>
            )}
            {!crypto && marketState && marketState !== "REGULAR" && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.04] text-gray-400 border border-white/[0.06]">
                рынок: {marketState === "CLOSED" ? "закрыт" : marketState === "PRE" ? "пре-маркет" : marketState === "POST" ? "пост-маркет" : marketState}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Footprint, Volume Delta, VWAP, Market Profile / TPO, Single Prints, Stacked Imbalance, Speed of Tape и Big Trades в реальном времени
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* symbol picker */}
        <div className="relative">
          <button onClick={() => setPickerOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white hover:bg-white/[0.06] transition-all">
            <span className="font-semibold">{label}</span>
            <span className="text-[10px] text-gray-500">{ticker}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          </button>
          {pickerOpen && (
            <div className="absolute z-30 mt-2 w-72 max-h-80 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0b0f1a] shadow-2xl p-2">
              <div className="flex items-center gap-2 px-2 py-1.5 mb-1 rounded-lg bg-white/[0.04]">
                <Search className="w-3.5 h-3.5 text-gray-500" />
                <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск символа…"
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600" />
              </div>
              {filteredGroups.length === 0 && (
                <div className="px-2 py-3 text-center text-xs text-gray-600">Ничего не найдено</div>
              )}
              {filteredGroups.map((g) => (
                <div key={g.name} className="mb-1">
                  <div className={cn("px-2 pt-1.5 pb-0.5 text-[9px] uppercase tracking-wider", g.tag === "tick" ? "text-purple-400/70" : "text-cyan-400/60")}>
                    {g.name}
                  </div>
                  {g.items.map((s) => (
                    <button key={s.ticker}
                      onClick={() => { setTicker(s.ticker); setLabel(s.label); setPickerOpen(false); setQuery(""); }}
                      className={cn("w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm hover:bg-white/[0.05] transition-colors",
                        s.ticker === ticker ? "text-white bg-white/[0.04]" : "text-gray-400")}>
                      <span className="flex items-baseline gap-1.5 min-w-0">
                        <span className="font-medium truncate">{s.label}</span>
                        {s.name && <span className="text-[9px] text-gray-600 truncate">{s.name}</span>}
                      </span>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded flex-shrink-0", g.tag === "tick" ? "text-purple-300 bg-purple-500/10" : "text-cyan-300/80 bg-cyan-500/10")}>
                        {g.tag === "tick" ? "tick" : "live"}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* interval */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          {INTERVALS.map((iv) => (
            <button key={iv} onClick={() => setInterval(iv)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                interval === iv ? "bg-purple-500/20 text-purple-200" : "text-gray-500 hover:text-gray-300")}>
              {iv}
            </button>
          ))}
        </div>

        {/* live toggle */}
        {(
          <button onClick={() => setLiveMode((v) => !v)}
            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all",
              liveMode
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                : "bg-white/[0.03] text-gray-400 border-white/[0.08] hover:text-gray-200")}>
            <Radio className={cn("w-3.5 h-3.5", liveMode && connected && "animate-pulse")} />
            {liveMode ? "Live" : "Пауза"}
          </button>
        )}

        {loading && <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
        {data && (
          <span className={cn("text-[13px] font-mono font-semibold tabular-nums", liveEnabled && connected ? "text-emerald-300" : "text-gray-400")}>
            {lastPrice.toLocaleString("en-US", { maximumFractionDigits: decimalsFor(priceTick) })}
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/[0.05] border border-red-500/15 text-sm text-red-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {!crypto && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-cyan-500/[0.04] border border-cyan-500/12">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-400">
            {label} обновляется в реальном времени (цена, VWAP, Market Profile, Single Prints) из live-котировок Yahoo.
            Volume Delta — <span className="text-cyan-300">оценка (est.)</span> из формы свечи.
            Настоящий тиковый <span className="text-gray-300">Footprint</span> и <span className="text-gray-300">Stacked Imbalance</span> для акций/фьючерсов
            требуют платного биржевого фида — бесплатно они доступны только для крипты (Binance).
          </div>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard icon={Gauge} label="Session VWAP" color="#f59e0b"
              value={vwap ? vwap.vwap.toLocaleString("en-US", { maximumFractionDigits: decimalsFor(priceTick) }) : "—"}
              sub={vwap && lastPrice ? `${lastPrice >= vwap.vwap ? "выше" : "ниже"} VWAP` : undefined} />
            <StatCard icon={Target} label="POC" color="#22d3ee"
              value={profile ? fmtPrice(profile.poc, priceTick) : "—"}
              sub="Point of Control" />
            <StatCard icon={Layers} label="Value Area" color="#a78bfa"
              value={profile ? `${fmtPrice(profile.val, priceTick)}–${fmtPrice(profile.vah, priceTick)}` : "—"}
              sub="70% объёма" />
            <StatCard icon={cumDelta >= 0 ? TrendingUp : TrendingDown} label="Cumulative Δ"
              color={cumDelta >= 0 ? "#34d399" : "#f87171"}
              value={fmtSigned(cumDelta)}
              sub={isReal ? "реальная дельта" : "оценка (est.)"} />
            <StatCard icon={Crosshair} label="Stacked Imbalance" color="#fb7185"
              value={crypto ? String(data.imbalances.length) : "—"}
              sub={crypto ? "зон 3+ подряд" : "нужны тики"} />
            <StatCard icon={Zap} label="Speed of Tape" color="#38bdf8"
              value={tape ? `${tape.tradesPerSec.toFixed(1)}/с` : "—"}
              sub={tape ? `${tape.prints} принтов · ${fmtQty(tape.volPerSec)}/с` : (crypto ? "ожидание потока" : "только крипта")} />
          </div>

          {/* Chart + profile */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-3">
              <div className="flex items-center gap-3 px-1 pb-2 text-[10px] text-gray-500 flex-wrap">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-400" /> VWAP</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-cyan-400/60" /> ±1σ</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-fuchsia-400/50" /> ±2σ</span>
                <span className="flex items-center gap-1 ml-auto"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400/50" /> объём buy</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400/50" /> sell (слева)</span>
              </div>
              <VWAPChart key={`${ticker}-${interval}`} candles={data.candles} profile={chartProfile} />
            </div>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Market Profile / TPO</h3>
              </div>
              <VolumeProfilePanel candles={data.candles} tick={priceTick} />
            </div>
          </div>

          {/* Volume delta strip */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Volume Delta {isReal ? <span className="text-emerald-400/80">(real)</span> : <span className="text-amber-400/80">(est.)</span>}
              </h3>
              <span className="text-[10px] text-gray-600">по барам · линия = накопленная дельта</span>
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <ComposedChart data={deltaChart}>
                <XAxis dataKey="t" tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} interval="preserveStartEnd" minTickGap={40} />
                <YAxis yAxisId="d" tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="c" orientation="right" tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "rgba(7,9,18,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
                  formatter={(v: any, n: any) => [fmtQty(Number(v)), n === "cum" ? "накопл." : "дельта"]} />
                <ReferenceLine yAxisId="d" y={0} stroke="rgba(255,255,255,0.12)" />
                <Bar yAxisId="d" dataKey="delta" radius={[2, 2, 0, 0]}>
                  {deltaChart.map((d, i) => <Cell key={i} fill={d.delta >= 0 ? "rgba(52,211,153,0.6)" : "rgba(248,113,113,0.55)"} />)}
                </Bar>
                <Line yAxisId="c" dataKey="cum" stroke="#a78bfa" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Footprint (crypto only) */}
          {crypto && data.footprint.length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Footprint Chart</h3>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400/50" /> Sell (bid)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400/50" /> Buy (ask)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400/40" /> POC</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm border border-emerald-400" /> Imbalance 3:1</span>
                </div>
              </div>
              <FootprintChart footprint={data.footprint} candles={data.candles} tickSize={data.tickSize || priceTick} imbalances={data.imbalances} />
              <div className="mt-2 text-[10px] text-gray-600">
                Слева — свеча (тело/тень), в колонке — <span className="text-red-300/80">sell</span> × <span className="text-emerald-300/80">buy</span> объём на каждом уровне.
                Жёлтым — POC бара, рамкой — диагональные имбалансы 3:1. Внизу: дельта и суммарный объём.
              </div>
            </div>
          )}

          {/* Big Trades tape (live crypto only) */}
          {liveEnabled && (
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Big Trades</h3>
                </div>
                <span className="text-[10px] text-gray-600">крупные принты ленты (динамический порог)</span>
              </div>
              {bigTrades.length === 0 ? (
                <div className="text-xs text-gray-600 py-6 text-center">
                  {connected ? "Ждём крупный принт…" : "Подключение к потоку…"}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                  {bigTrades.slice(0, 12).map((t) => (
                    <div key={t.id}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-mono tabular-nums"
                      style={{
                        background: t.side === "buy" ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)",
                        border: `1px solid ${t.side === "buy" ? "rgba(52,211,153,0.18)" : "rgba(248,113,113,0.18)"}`,
                      }}>
                      <span className="text-gray-500">{new Date(t.time * 1000).toLocaleTimeString("en-US", { hour12: false })}</span>
                      <span className={t.side === "buy" ? "text-emerald-300" : "text-red-300"}>
                        {t.side === "buy" ? "▲" : "▼"} {fmtPrice(t.price, priceTick)}
                      </span>
                      <span className="font-semibold text-white">{fmtQty(t.qty)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {loading && !data && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-purple-400/70 animate-spin" />
          <p className="text-sm text-gray-500">Загрузка рыночных данных…</p>
        </div>
      )}
    </div>
  );
}
