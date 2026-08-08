"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import {
  createChart, IChartApi, ISeriesApi, ColorType, CrosshairMode,
  CandlestickSeries, BarSeries, AreaSeries, HistogramSeries, LineSeries, LineStyle,
  createTextWatermark,
} from "lightweight-charts";
import { computeIndicator, IndicatorConfig, IndicatorSource, lastValueAt } from "./indicators";

/* ── TradingView dark palette ──────────────────────────────────── */
export const TV = {
  bg:    "#131722",
  panel: "#1e222d",
  line:  "#2a2e39",
  text:  "#d1d4dc",
  muted: "#b2b5be",
  dim:   "#787b86",
  blue:  "#2962ff",
  up:    "#26a69a",
  down:  "#ef5350",
};

/* ── Public types ─────────────────────────────────────────────────── */
export interface OHLCVBar {
  time: number; open: number; high: number; low: number; close: number; volume: number;
}

export type ChartType = "candles" | "bars" | "line" | "area";

export interface ChartStyle {
  chartType: ChartType;
  upColor: string;
  downColor: string;
  wickUpColor: string;
  wickDownColor: string;
  borderUpColor: string;
  borderDownColor: string;
  borderVisible: boolean;
  bgColor: string;
  gridColor: string;
  textColor: string;
  showGrid: boolean;
  showWatermark: boolean;
}

/* TradingView default chart style (like TV's chart settings) */
export const DEFAULT_CHART_STYLE: ChartStyle = {
  chartType: "candles",
  upColor: TV.up,
  downColor: TV.down,
  wickUpColor: TV.up,
  wickDownColor: TV.down,
  borderUpColor: TV.up,
  borderDownColor: TV.down,
  borderVisible: true,
  bgColor: TV.bg,
  gridColor: "#1d2a3d",
  textColor: TV.dim,
  showGrid: true,
  showWatermark: true,
};

export type DrawingTool =
  | "pointer" | "pen" | "line" | "hline" | "ray"
  | "rect"   // POI / FVG / demand-supply zone box
  | "rr"     // Risk-to-reward Long/Short grid
  | "brk"    // BOS / CHOCH structure marker
  | "eraser";

export interface DrawPoint { time: number; price: number; }
export interface Drawing {
  id: string;
  type: "pen" | "line" | "hline" | "ray" | "rect" | "rr" | "brk";
  points: DrawPoint[];
  color: string;
  width: number;
  label?: string;   // e.g. "POI", "FVG", "BOS", "CHOCH", "Supply", "Demand"
}

/* ── Props ────────────────────────────────────────────────────────── */
interface Props {
  candles:          OHLCVBar[];
  visibleCount:     number;
  tool?:            DrawingTool;
  drawColor?:       string;
  drawWidth?:       number;
  drawings:         Drawing[];
  onDrawingsChange: (d: Drawing[]) => void;
  style?:           Partial<ChartStyle>;
  liveBarOverride?:  OHLCVBar;
  structureLabel?:   "BOS" | "CHOCH";   // label used by the "brk" tool
  zoneLabel?:        string;            // label used by the "rect" tool (POI/FVG/zone)
  indicators?:       IndicatorConfig[];
  symbolLabel?:      string;
  intervalLabel?:    string;
}

/* ── Coordinate helpers ───────────────────────────────────────────── */
function toPixel(
  chart: IChartApi, series: ISeriesApi<"Candlestick">, p: DrawPoint
): { x: number; y: number } | null {
  const x = chart.timeScale().timeToCoordinate(p.time as any);
  const y = series.priceToCoordinate(p.price);
  return x != null && y != null ? { x, y } : null;
}

function fromPixel(
  chart: IChartApi, series: ISeriesApi<"Candlestick">, x: number, y: number
): DrawPoint | null {
  const time  = chart.timeScale().coordinateToTime(x);
  const price = series.coordinateToPrice(y);
  return time != null && price != null ? { time: time as number, price } : null;
}

/* ── Canvas draw single shape ─────────────────────────────────────── */
function drawShape(
  ctx: CanvasRenderingContext2D,
  d: Drawing,
  chart: IChartApi,
  series: ISeriesApi<"Candlestick">,
  W: number,
  dpr: number,
) {
  ctx.save();
  ctx.strokeStyle = d.color;
  ctx.lineWidth   = d.width;
  ctx.lineCap     = "round";
  ctx.lineJoin    = "round";

  if (d.type === "pen") {
    ctx.beginPath();
    let first = true;
    for (const p of d.points) {
      const px = toPixel(chart, series, p);
      if (!px) continue;
      if (first) { ctx.moveTo(px.x * dpr, px.y * dpr); first = false; }
      else         ctx.lineTo(px.x * dpr, px.y * dpr);
    }
    ctx.stroke();
  }

  if (d.type === "line" && d.points.length >= 2) {
    const p1 = toPixel(chart, series, d.points[0]);
    const p2 = toPixel(chart, series, d.points[1]);
    if (p1 && p2) {
      ctx.beginPath();
      ctx.moveTo(p1.x * dpr, p1.y * dpr);
      ctx.lineTo(p2.x * dpr, p2.y * dpr);
      ctx.stroke();
    }
  }

  if (d.type === "hline" && d.points.length >= 1) {
    const y = series.priceToCoordinate(d.points[0].price);
    if (y != null) {
      ctx.setLineDash([8 * dpr, 5 * dpr]);
      ctx.beginPath();
      ctx.moveTo(0, y * dpr);
      ctx.lineTo(W, y * dpr);
      ctx.stroke();
    }
  }

  if (d.type === "ray" && d.points.length >= 2) {
    const p1 = toPixel(chart, series, d.points[0]);
    const p2 = toPixel(chart, series, d.points[1]);
    if (p1 && p2) {
      const dx = p2.x - p1.x, dy = p2.y - p1.y;
      if (dx !== 0 || dy !== 0) {
        const tEnd = dx > 0 ? (W / dpr - p1.x) / dx : dx < 0 ? -p1.x / dx : Infinity;
        const t    = Math.max(0, tEnd);
        ctx.beginPath();
        ctx.moveTo(p1.x * dpr, p1.y * dpr);
        ctx.lineTo((p1.x + t * dx) * dpr, (p1.y + t * dy) * dpr);
        ctx.stroke();
      }
    }
  }

  if (d.type === "rect" && d.points.length >= 2) {
    const p1 = toPixel(chart, series, d.points[0]);
    const p2 = toPixel(chart, series, d.points[1]);
    if (p1 && p2) {
      const x1 = Math.min(p1.x, p2.x) * dpr, x2 = Math.max(p1.x, p2.x) * dpr;
      const y1 = Math.min(p1.y, p2.y) * dpr, y2 = Math.max(p1.y, p2.y) * dpr;
      ctx.fillStyle = hexA(d.color, 0.12);
      ctx.strokeStyle = d.color;
      ctx.lineWidth   = d.width * dpr;
      ctx.setLineDash([6 * dpr, 4 * dpr]);
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      ctx.setLineDash([]);
      // time-axis label
      if (d.label) {
        const label = d.label.toUpperCase();
        ctx.font = `bold ${9 * dpr}px ui-sans-serif, system-ui, sans-serif`;
        ctx.fillStyle = d.color;
        ctx.textBaseline = "top";
        ctx.fillText(label, x1 + 4 * dpr, Math.max(2 * dpr, y1 + 4 * dpr));
      }
    }
  }

  if (d.type === "rr" && d.points.length >= 2) {
    // points[0] = stop-loss anchor, points[1] = entry/TP baseline
    const p1 = toPixel(chart, series, d.points[0]);
    const p2 = toPixel(chart, series, d.points[1]);
    if (p1 && p2) {
      const entry = d.points[1].price, sl = d.points[0].price;
      const dir  = entry >= sl ? 1 : -1;
      const risk = Math.abs(entry - sl);
      if (risk > 0) {
        const N = 3;
        ctx.font = `bold ${9 * dpr}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        for (let i = 0; i <= N; i++) {
          const target = entry + dir * risk * i;
          const ty = series.priceToCoordinate(target);
          if (ty == null) continue;
          const isBE = i === 0, isTP = i === 1;
          ctx.save();
          ctx.strokeStyle = isBE ? "#64748b" : isTP ? "#22c55e" : hexA("#22c55e", 0.55);
          ctx.lineWidth = (isBE || isTP ? 1.6 : 1) * dpr;
          ctx.setLineDash([6 * dpr, 4 * dpr]);
          ctx.beginPath(); ctx.moveTo(0, ty * dpr); ctx.lineTo(W, ty * dpr); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = isBE ? "#94a3b8" : isTP ? "#22c55e" : hexA("#22c55e", 0.7);
          const label = i === 0 ? "BE" : `+${i}R`;
          ctx.fillText(label, W - 6 * dpr, ty * dpr);
          ctx.restore();
        }
        // entry + SL labels
        const ey = series.priceToCoordinate(entry);
        const sy = series.priceToCoordinate(sl);
        if (ey != null) { ctx.fillStyle = "#60a5fa"; ctx.textAlign = "left"; ctx.fillText(`Entry ${fmtNum(entry)}`, 6 * dpr, ey * dpr); }
        if (sy != null) { ctx.fillStyle = "#ef4444"; ctx.textAlign = "left"; ctx.fillText(`SL ${fmtNum(sl)}`, 6 * dpr, sy * dpr); }
        ctx.textAlign = "start";
      }
    }
  }

  if (d.type === "brk" && d.points.length >= 2) {
    const p1 = toPixel(chart, series, d.points[0]);
    const p2 = toPixel(chart, series, d.points[1]);
    if (p1 && p2) {
      ctx.save();
      ctx.strokeStyle = d.color;
      ctx.lineWidth   = d.width * dpr;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(p1.x * dpr, p1.y * dpr);
      ctx.lineTo(p2.x * dpr, p2.y * dpr);
      ctx.stroke();
      // marker dot at breakout point
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(p2.x * dpr, p2.y * dpr, 3.5 * dpr, 0, Math.PI * 2);
      ctx.fill();
      if (d.label) {
        ctx.font = `bold ${9 * dpr}px ui-sans-serif, system-ui, sans-serif`;
        ctx.fillStyle = d.color;
        ctx.textBaseline = "bottom";
        ctx.fillText(d.label.toUpperCase(), p2.x * dpr + 5 * dpr, p2.y * dpr - 3 * dpr);
        ctx.textBaseline = "alphabetic";
      }
      ctx.restore();
    }
  }
  ctx.restore();
}

/* hex color with alpha, supports #rrggbb */
function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

function fmtNum(n: number): string {
  return n < 0.01 ? n.toFixed(5) : n < 1 ? n.toFixed(4) : n.toFixed(2);
}

/* ── Build the main (price) series according to the chosen chart type ── */
function buildMainSeries(chart: IChartApi, s: ChartStyle): ISeriesApi<any> {
  const dotted = { priceLineVisible: true, priceLineColor: s.downColor, priceLineStyle: LineStyle.Dotted };
  if (s.chartType === "bars") {
    return chart.addSeries(BarSeries, { upColor: s.upColor, downColor: s.downColor, ...dotted });
  }
  if (s.chartType === "line") {
    return chart.addSeries(LineSeries, { color: s.upColor, lineWidth: 2, ...dotted });
  }
  if (s.chartType === "area") {
    return chart.addSeries(AreaSeries, {
      lineColor: s.upColor, topColor: hexA(s.upColor, 0.35), bottomColor: hexA(s.upColor, 0.02), lineWidth: 2, ...dotted,
    });
  }
  return chart.addSeries(CandlestickSeries, {
    upColor: s.upColor, downColor: s.downColor,
    wickUpColor: s.wickUpColor, wickDownColor: s.wickDownColor,
    borderUpColor: s.borderUpColor, borderDownColor: s.borderDownColor,
    borderVisible: s.borderVisible, ...dotted,
  });
}

/* shape of one main-series data point per chart type */
function mainPoint(c: OHLCVBar, s: ChartStyle): Record<string, any> {
  if (s.chartType === "candles" || s.chartType === "bars") {
    return { time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close };
  }
  return { time: c.time as any, value: c.close };
}

/* ── Hit testing (eraser) ─────────────────────────────────────────── */
function distPtSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function hitTest(
  d: Drawing, mx: number, my: number,
  chart: IChartApi, series: ISeriesApi<"Candlestick">, R = 12
): boolean {
  if (d.type === "pen") {
    for (const p of d.points) {
      const px = toPixel(chart, series, p);
      if (px && Math.hypot(px.x - mx, px.y - my) < R) return true;
    }
    return false;
  }
  if (d.type === "hline") {
    const y = series.priceToCoordinate(d.points[0]?.price ?? 0);
    return y != null && Math.abs(y - my) < R;
  }
  if ((d.type === "line" || d.type === "ray" || d.type === "brk") && d.points.length >= 2) {
    const p1 = toPixel(chart, series, d.points[0]);
    const p2 = toPixel(chart, series, d.points[1]);
    if (!p1 || !p2) return false;
    return distPtSeg(mx, my, p1.x, p1.y, p2.x, p2.y) < R;
  }
  if (d.type === "rect" && d.points.length >= 2) {
    const p1 = toPixel(chart, series, d.points[0]);
    const p2 = toPixel(chart, series, d.points[1]);
    if (!p1 || !p2) return false;
    return mx >= Math.min(p1.x, p2.x) - R && mx <= Math.max(p1.x, p2.x) + R &&
           my >= Math.min(p1.y, p2.y) - R && my <= Math.max(p1.y, p2.y) + R;
  }
  if (d.type === "rr" && d.points.length >= 2) {
    const p1 = toPixel(chart, series, d.points[0]);
    const p2 = toPixel(chart, series, d.points[1]);
    if (p1 && p2 && Math.abs(my - p1.y) < R) return true;
    if (p1 && p2) {
      const entry = d.points[1].price, sl = d.points[0].price;
      const dir = entry >= sl ? 1 : -1;
      const risk = Math.abs(entry - sl);
      for (let i = 0; i <= 3; i++) {
        const y = series.priceToCoordinate(entry + dir * risk * i);
        if (y != null && Math.abs(y - my) < R) return true;
      }
    }
    return false;
  }
  return false;
}

/* ── Component ────────────────────────────────────────────────────── */
export function ReplayChart({
  candles, visibleCount,
  tool = "pointer",
  drawColor = "#22d3ee",
  drawWidth = 2,
  drawings,
  onDrawingsChange,
  style,
  liveBarOverride,
  structureLabel = "BOS",
  zoneLabel = "POI",
  indicators = [],
  symbolLabel = "",
  intervalLabel = "",
}: Props) {
  const effStyle = { ...DEFAULT_CHART_STYLE, ...style };
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const candleRef    = useRef<ISeriesApi<any> | null>(null);
  const volRef       = useRef<ISeriesApi<"Histogram"> | null>(null);
  const indRef       = useRef<Map<string, ISeriesApi<any> | null>>(new Map());
  const prevVisible  = useRef(0);
  // track the last candles array reference to detect dataset swaps vs scrub
  const prevCandlesRef = useRef<OHLCVBar[]>([]);
  const dprRef       = useRef(1);
  const [legend, setLegend] = useState<{ time: string; oh: [number, number, number, number]; vol: string; inds: { name: string; color: string; value: string }[] } | null>(null);
  const indSourcesRef = useRef<IndicatorSource[]>([]);
  const wmRef = useRef<{ applyOptions: (o: any) => void; detach: () => void } | null>(null);

  // refs so event-handler closures always see the latest values
  const toolRef      = useRef(tool);
  const colorRef     = useRef(drawColor);
  const widthRef     = useRef(drawWidth);
  const drawingsRef  = useRef(drawings);
  const styleRef     = useRef<ChartStyle>({ ...DEFAULT_CHART_STYLE, ...style });
  const structRef    = useRef(structureLabel);
  const zoneLabelRef = useRef(zoneLabel);
  const indicatorsRef = useRef(indicators);
  const isPenDown    = useRef(false);
  const pendingPen   = useRef<DrawPoint[]>([]);
  const lineStart    = useRef<DrawPoint | null>(null);
  const mouseCSS     = useRef<{ x: number; y: number } | null>(null);
  const rafId        = useRef(0);
  // full OHLC window for legend lookups (works for line/area charts too)
  const visibleDataRef = useRef<OHLCVBar[]>([]);

  useEffect(() => { toolRef.current     = tool;           }, [tool]);
  useEffect(() => { colorRef.current    = drawColor;      }, [drawColor]);
  useEffect(() => { widthRef.current    = drawWidth;      }, [drawWidth]);
  useEffect(() => { styleRef.current    = { ...DEFAULT_CHART_STYLE, ...style }; }, [style]);
  useEffect(() => { structRef.current = structureLabel; }, [structureLabel]);
  useEffect(() => { zoneLabelRef.current = zoneLabel; }, [zoneLabel]);
  useEffect(() => { indicatorsRef.current = indicators; }, [indicators]);
  useEffect(() => { drawingsRef.current = drawings; scheduleRender(); }, [drawings]); // eslint-disable-line

  /* ── Apply chart style live (TV-style colors / grid / chart type) ── */
  const applyMainColors = useCallback((_chart: IChartApi, series: ISeriesApi<any> | null) => {
    if (!series) return;
    const s: ChartStyle = styleRef.current;
    if (s.chartType === "candles") {
      series.applyOptions({
        upColor: s.upColor, downColor: s.downColor,
        wickUpColor: s.wickUpColor, wickDownColor: s.wickDownColor,
        borderUpColor: s.borderUpColor, borderDownColor: s.borderDownColor,
        borderVisible: s.borderVisible,
        priceLineColor: s.downColor,
      });
    } else if (s.chartType === "bars") {
      series.applyOptions({ upColor: s.upColor, downColor: s.downColor, priceLineColor: s.downColor });
    } else if (s.chartType === "line") {
      series.applyOptions({ color: s.upColor, lineWidth: 2, priceLineColor: s.downColor });
    } else {
      series.applyOptions({
        lineColor: s.upColor,
        topColor: hexA(s.upColor, 0.35),
        bottomColor: hexA(s.upColor, 0.02),
        lineWidth: 2,
        priceLineColor: s.downColor,
      });
    }
  }, []);

  /* ── Render all drawings onto the canvas ────────────────────────── */
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const chart  = chartRef.current;
    const series = candleRef.current;
    if (!canvas || !chart || !series) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const dpr = dprRef.current;
    ctx.clearRect(0, 0, W, H);

    for (const d of drawingsRef.current) drawShape(ctx, d, chart, series, W, dpr);

    if (isPenDown.current && pendingPen.current.length > 1) {
      ctx.save();
      ctx.strokeStyle = colorRef.current;
      ctx.lineWidth   = widthRef.current * dpr;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      let first = true;
      for (const p of pendingPen.current) {
        const px = toPixel(chart, series, p);
        if (!px) continue;
        if (first) { ctx.moveTo(px.x * dpr, px.y * dpr); first = false; }
        else         ctx.lineTo(px.x * dpr, px.y * dpr);
      }
      ctx.stroke();
      ctx.restore();
    }

    const cur = mouseCSS.current;
    const ls  = lineStart.current;
    if (ls && cur && (toolRef.current === "line" || toolRef.current === "ray")) {
      const p1 = toPixel(chart, series, ls);
      if (p1) {
        ctx.save();
        ctx.globalAlpha = 0.65;
        ctx.strokeStyle = colorRef.current;
        ctx.lineWidth   = widthRef.current * dpr;
        ctx.lineCap = "round";
        ctx.setLineDash([6 * dpr, 4 * dpr]);
        ctx.beginPath();
        ctx.moveTo(p1.x * dpr, p1.y * dpr);
        if (toolRef.current === "ray") {
          const dx = cur.x - p1.x, dy = cur.y - p1.y;
          const t = dx > 0 ? (W / dpr - p1.x) / dx : dx < 0 ? -p1.x / dx : 1;
          ctx.lineTo((p1.x + Math.max(0, t) * dx) * dpr, (p1.y + Math.max(0, t) * dy) * dpr);
        } else {
          ctx.lineTo(cur.x * dpr, cur.y * dpr);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    if (ls && cur && toolRef.current === "hline") {
      const y = series.priceToCoordinate(ls.price);
      if (y != null) {
        ctx.save();
        ctx.globalAlpha = 0.65;
        ctx.strokeStyle = colorRef.current;
        ctx.lineWidth   = widthRef.current * dpr;
        ctx.setLineDash([8 * dpr, 5 * dpr]);
        ctx.beginPath(); ctx.moveTo(0, y * dpr); ctx.lineTo(W, y * dpr); ctx.stroke();
        ctx.restore();
      }
    }

    if (ls && cur && toolRef.current === "rect") {
      const p1 = toPixel(chart, series, ls);
      if (p1) {
        const x1 = Math.min(p1.x, cur.x) * dpr, x2 = Math.max(p1.x, cur.x) * dpr;
        const y1 = Math.min(p1.y, cur.y) * dpr, y2 = Math.max(p1.y, cur.y) * dpr;
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = colorRef.current;
        ctx.fillStyle   = hexA(colorRef.current, 0.1);
        ctx.lineWidth   = widthRef.current * dpr;
        ctx.setLineDash([6 * dpr, 4 * dpr]);
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        ctx.restore();
      }
    }

    if (ls && cur && toolRef.current === "rr") {
      const p1 = toPixel(chart, series, ls);
      if (p1) {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = colorRef.current;
        ctx.lineWidth   = widthRef.current * dpr;
        ctx.setLineDash([6 * dpr, 4 * dpr]);
        ctx.beginPath();
        ctx.moveTo(p1.x * dpr, p1.y * dpr);
        ctx.lineTo(cur.x * dpr, cur.y * dpr);
        ctx.stroke();
        ctx.restore();
      }
    }
  }, []);

  const scheduleRender = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => { renderCanvas(); rafId.current = 0; });
  }, [renderCanvas]);

  /* ── Apply chart style live (TV-style colors / grid / chart type) ── */
  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      chart.applyOptions({
        layout: {
          background: { type: ColorType.Solid, color: styleRef.current.bgColor },
          textColor:  styleRef.current.textColor,
        },
        grid: {
          vertLines: { color: styleRef.current.showGrid ? styleRef.current.gridColor : styleRef.current.bgColor },
          horzLines: { color: styleRef.current.showGrid ? styleRef.current.gridColor : styleRef.current.bgColor },
        },
      });
      applyMainColors(chart, candleRef.current);
    }
    // watermark visibility + text
    try {
      const show = styleRef.current.showWatermark;
      wmRef.current?.applyOptions({
        lines: show ? [{ text: symbolLabel ? `${symbolLabel}.${intervalLabel}` : "PRICE", color: "rgba(178,181,189,0.05)", fontSize: 84, fontStyle: "bold" }] : [],
      });
    } catch { /* ignore */ }
    scheduleRender();
  }, [style, symbolLabel, intervalLabel, scheduleRender]);

  /* ── Live bar: fast update() path — never touches viewport ─────── */
  useEffect(() => {
    if (!liveBarOverride || !candleRef.current || !volRef.current) return;
    const c = liveBarOverride;
    const up = styleRef.current.upColor;
    const dn = styleRef.current.downColor;
    try {
      candleRef.current.update(mainPoint(c, styleRef.current));
      volRef.current.update({
        time: c.time as any, value: c.volume,
        color: c.close >= c.open ? `${up}38` : `${dn}38`,
      });
      scheduleRender();
    } catch {
      // stale time from quote API — skip this tick, next poll will have fresh data
    }
  }, [liveBarOverride, scheduleRender, style]);

  /* ── Create chart once ──────────────────────────────────────────── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const dpr  = window.devicePixelRatio || 1;
    dprRef.current = dpr;

    const rect = el.getBoundingClientRect();
    const w = rect.width  || 800;
    const h = rect.height || 500;

    const s0: ChartStyle = styleRef.current;
    const chart = createChart(el, {
      width: w, height: h,
      layout: {
        background: { type: ColorType.Solid, color: s0.bgColor },
        textColor: s0.textColor, fontSize: 11,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif",
        panes: {
          separatorColor: TV.line,
          separatorHoverColor: "rgba(178,181,189,0.2)",
          enableResize: true,
        },
      },
      grid: {
        vertLines: { color: s0.showGrid ? s0.gridColor : s0.bgColor },
        horzLines: { color: s0.showGrid ? s0.gridColor : s0.bgColor },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { labelBackgroundColor: TV.blue, color: "rgba(41,98,255,0.4)", labelVisible: true },
        horzLine: { labelBackgroundColor: TV.blue, color: "rgba(41,98,255,0.4)", labelVisible: true },
      },
      rightPriceScale: {
        borderColor: TV.line,
        scaleMargins: { top: 0.06, bottom: 0.3 },
      },
      timeScale: {
        borderColor: TV.line,
        timeVisible: true, secondsVisible: false, rightOffset: 8,
        lockVisibleTimeRangeOnResize: true,
        tickMarkFormatter: (t: any) => {
          const d = new Date((t as number) * 1000);
          return `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })}`;
        },
      },
    });

    const candleSeries = buildMainSeries(chart, styleRef.current);

    const volSeries = chart.addSeries(HistogramSeries, {
      color: "rgba(38,166,154,0.3)", priceFormat: { type: "volume" }, priceScaleId: "vol_ov",
    });
    chart.priceScale("vol_ov").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    chartRef.current  = chart;
    candleRef.current = candleSeries;
    volRef.current    = volSeries;

    /* TradingView watermark */
    const wm = createTextWatermark(chart.panes()[0], {
      horzAlign: 'center', vertAlign: 'center',
      lines: s0.showWatermark ? [{
        text: symbolLabel ? `${symbolLabel}.${intervalLabel}` : "PRICE",
        color: "rgba(178,181,189,0.05)",
        fontSize: 84, fontStyle: "bold",
      }] : [],
    });
    wmRef.current = wm;

    if (canvasRef.current) {
      canvasRef.current.width  = Math.round(w * dpr);
      canvasRef.current.height = Math.round(h * dpr);
    }

    chart.timeScale().subscribeVisibleLogicalRangeChange(() => scheduleRender());

    /* ── Crosshair legend: OHLC + indicator values ────────────── */
    chart.subscribeCrosshairMove((param: any) => {
      const ch = chartRef.current, cs = candleRef.current;
      if (!ch || !cs) { setLegend(null); return; }
      const t = param.time;
      if (t == null) { setLegend(null); return; }
      const srcs = indSourcesRef.current;
      const inds: { name: string; color: string; value: string }[] = [];
      for (const s of srcs) if (s.name && s.kind === "line") {
        const v = lastValueAt(s, t as number);
        if (v) inds.push({ name: s.name, color: s.color, value: s.pane === 1 ? v.value.toFixed(2) : v.text });
      }
      const data = visibleDataRef.current;
      const bar = data.find((b) => b.time === t);
      if (bar) setLegend({ time: String(t), oh: [bar.open, bar.high, bar.low, bar.close], vol: String(bar.volume ?? ""), inds });
    });

    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width: cw, height: ch } = e.contentRect;
        if (!chartRef.current || cw <= 0 || ch <= 0) continue;
        chartRef.current.applyOptions({ width: cw, height: ch });
        if (canvasRef.current) {
          const d = dprRef.current;
          canvasRef.current.width  = Math.round(cw * d);
          canvasRef.current.height = Math.round(ch * d);
        }
        scheduleRender();
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      if (rafId.current) cancelAnimationFrame(rafId.current);
      try { wm.detach(); } catch { /* ignore */ }
      wmRef.current = null;
      indRef.current.clear(); // eslint-disable-line react-hooks/exhaustive-deps
      chart.remove();
      chartRef.current = null; candleRef.current = null; volRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleRender, style?.chartType]);

  /* ── Data updates ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!candleRef.current || !volRef.current || !candles.length) return;

    // detect dataset swap (new symbol/period loaded) vs slider/replay scrub
    const isNewDataset = candles !== prevCandlesRef.current;
    prevCandlesRef.current = candles;

    const visible  = candles.slice(0, visibleCount);
    visibleDataRef.current = visible;
    const isAppend = !isNewDataset && prevVisible.current > 0 && visibleCount === prevVisible.current + 1;
    prevVisible.current = visibleCount;

    const s = styleRef.current;
    const up = s.upColor;
    const dn = s.downColor;
    const cd = visible.map((c) => mainPoint(c, s));
    const vd = visible.map((c) => ({
      time: c.time as any, value: c.volume,
      color: c.close >= c.open ? `${up}38` : `${dn}38`,
    }));

    if (isAppend) {
      // single-bar update — fast path, doesn't disturb viewport
      candleRef.current.update(cd[cd.length - 1]);
      volRef.current.update(vd[vd.length - 1]);
      scheduleRender();
    } else {
      candleRef.current.setData(cd);
      volRef.current.setData(vd);
      scheduleRender();

      // default legend → last visible bar (with indicator values when available)
      const last = candles[visibleCount - 1];
      if (last) {
        const srcs = indSourcesRef.current;
        const inds: { name: string; color: string; value: string }[] = [];
        for (const s of srcs) if (s.name && s.kind === "line") {
          const v = lastValueAt(s, last.time);
          if (v) inds.push({ name: s.name, color: s.color, value: s.pane === 1 ? v.value.toFixed(2) : v.text });
        }
        setLegend({ time: String(last.time), oh: [last.open, last.high, last.low, last.close], vol: String(last.volume || ""), inds });
      }

      if (isNewDataset) {
        // new dataset loaded: show last ~80 bars right-aligned, leave room on right
        const WINDOW = 80;
        const t = setTimeout(() => {
          chartRef.current?.timeScale().setVisibleLogicalRange({
            from: Math.max(-2, cd.length - WINDOW),
            to:   cd.length - 1 + 10,
          });
        }, 30);
        return () => clearTimeout(t);
      }
      // slider scrub: don't touch viewport — let the user's manual pan/zoom persist
    }
  }, [candles, visibleCount, scheduleRender, style?.chartType]);

  /* ── Indicator series sync ──────────────────────────────────────── */
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !candles.length) return;
    const visible = candles.slice(0, visibleCount);

    // compute fresh sources for the currently-visible window
    const srcs: IndicatorSource[] = [];
    for (const cfg of indicators) {
      srcs.push(...computeIndicator(cfg, visible));
    }
    indSourcesRef.current = srcs;

    // drop series no longer needed
    const wanted = new Set(srcs.map((s) => s.id));
    indRef.current.forEach((s, id) => {
      if (!wanted.has(id) && s) { try { chart.removeSeries(s); } catch { /* ignore */ } indRef.current.delete(id); }
    });

    for (const s of srcs) {
      let series = indRef.current.get(s.id);
      if (!series) {
        try {
          if (s.kind === "histogram") {
            series = chart.addSeries(HistogramSeries, {
              priceFormat: { type: "volume" }, priceScaleId: `ind-${s.id}`,
              priceLineVisible: false, lastValueVisible: false,
            }, s.pane);
          } else {
            series = chart.addSeries(LineSeries, {
              color: s.color, lineWidth: 1, lineStyle: LineStyle.Solid,
              priceLineVisible: false, lastValueVisible: true,
              crosshairMarkerVisible: false,
            }, s.pane);
          }
          if (series) indRef.current.set(s.id, series);
        } catch { /* ignore */ }
      }
      if (series) {
        try {
          if (s.kind === "histogram") {
            (series as ISeriesApi<"Histogram">).setData(s.points.map((p) => ({
              time: p.time as any, value: p.value,
              color: p.value >= 0 ? "rgba(41,98,255,0.45)" : "rgba(239,83,80,0.45)",
            })));
          } else {
            (series as ISeriesApi<"Line">).setData(s.points.map((p) => ({ time: p.time as any, value: p.value })));
          }
        } catch { /* ignore */ }
      }
    }

    // bottom pane height for RSI/MACD
    const hasPane1 = srcs.some((s) => s.pane === 1);
    try {
      const panes = chart.panes();
      if (hasPane1 && panes.length >= 2) {
        panes[1].setHeight(96);
        chart.priceScale(`ind-${srcs.find((s) => s.pane === 1)?.id ?? "rsi14"}`, 1).applyOptions({ scaleMargins: { top: 0.1, bottom: 0.1 } });
      }
    } catch { /* ignore */ }
  }, [candles, visibleCount, indicators, style?.chartType]);

  /* ── Mouse helpers ──────────────────────────────────────────────── */
  const cssXY = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const chartPt = (e: React.MouseEvent<HTMLCanvasElement>): DrawPoint | null => {
    const { x, y } = cssXY(e);
    if (!chartRef.current || !candleRef.current) return null;
    return fromPixel(chartRef.current, candleRef.current, x, y);
  };

  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

  /* ── Event handlers ─────────────────────────────────────────────── */
  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const t = toolRef.current;
    if (t === "pointer") return;
    e.preventDefault();
    const px = cssXY(e);
    const cp = chartPt(e);
    if (!cp) return;

    if (t === "pen") {
      isPenDown.current  = true;
      pendingPen.current = [cp];
      return;
    }

    if (t === "hline") {
      onDrawingsChange([...drawingsRef.current, { id: newId(), type: "hline", points: [cp], color: colorRef.current, width: widthRef.current }]);
      lineStart.current = null;
      scheduleRender();
      return;
    }

    if (t === "line" || t === "ray" || t === "rect" || t === "brk") {
      if (!lineStart.current) {
        lineStart.current = cp;
        mouseCSS.current  = px;
      } else {
        const label = t === "rect" ? zoneLabelRef.current : t === "brk" ? structRef.current : undefined;
        onDrawingsChange([...drawingsRef.current, { id: newId(), type: t, points: [lineStart.current, cp], color: colorRef.current, width: widthRef.current, label }]);
        lineStart.current = null;
        mouseCSS.current  = null;
      }
      scheduleRender();
      return;
    }

    if (t === "rr") {
      if (!lineStart.current) {
        // first click = stop-loss anchor
        lineStart.current = cp;
        mouseCSS.current  = px;
      } else {
        onDrawingsChange([...drawingsRef.current, { id: newId(), type: "rr", points: [lineStart.current, cp], color: colorRef.current, width: widthRef.current }]);
        lineStart.current = null;
        mouseCSS.current  = null;
      }
      scheduleRender();
      return;
    }

    if (t === "eraser") {
      const kept = drawingsRef.current.filter((d) => !hitTest(d, px.x, px.y, chartRef.current!, candleRef.current!));
      onDrawingsChange(kept);
    }
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const t = toolRef.current;
    const px = cssXY(e);
    mouseCSS.current = px;

    if (t === "pen" && isPenDown.current) {
      const cp = chartPt(e);
      if (cp) pendingPen.current.push(cp);
      scheduleRender();
      return;
    }

    if (t === "eraser" && e.buttons === 1) {
      const kept = drawingsRef.current.filter((d) => !hitTest(d, px.x, px.y, chartRef.current!, candleRef.current!));
      if (kept.length !== drawingsRef.current.length) onDrawingsChange(kept);
    }

    if (["line", "ray", "hline", "rect", "rr", "brk"].includes(t) && lineStart.current) scheduleRender();
  };

  const onMouseUp = () => {
    if (toolRef.current === "pen" && isPenDown.current) {
      isPenDown.current = false;
      if (pendingPen.current.length >= 2) {
        onDrawingsChange([...drawingsRef.current, { id: newId(), type: "pen", points: [...pendingPen.current], color: colorRef.current, width: widthRef.current }]);
      }
      pendingPen.current = [];
      scheduleRender();
    }
  };

  const onMouseLeave = () => { mouseCSS.current = null; scheduleRender(); };

  const onContextMenu = (e: React.MouseEvent) => {
    if (toolRef.current !== "pointer") {
      e.preventDefault();
      lineStart.current = null; mouseCSS.current = null;
      isPenDown.current = false; pendingPen.current = [];
      scheduleRender();
    }
  };

  const cursorMap: Record<DrawingTool, string> = {
    pointer: "default", pen: "crosshair",
    line:    lineStart.current ? "crosshair" : "cell",
    hline:   "row-resize",
    ray:     lineStart.current ? "crosshair" : "cell",
    rect:    lineStart.current ? "crosshair" : "cell",
    rr:      lineStart.current ? "crosshair" : "cell",
    brk:     lineStart.current ? "crosshair" : "cell",
    eraser:  "cell",
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden" style={{ background: effStyle.bgColor }}>
      {/* TradingView-style OHLC + indicator legend overlay */}
      <div
        className="absolute top-2 left-2 z-20 pointer-events-none select-none rounded-md px-2 py-1.5 hidden lg:block"
        style={{ background: "rgba(19,23,34,0.72)", border: `1px solid ${TV.line}` }}
      >
        {legend && (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-[10px] font-bold" style={{ color: TV.text }}>{symbolLabel}</span>
              <span className="text-[9px]" style={{ color: TV.blue }}>{intervalLabel}</span>
              <span className="text-[10px]" style={{ color: "#e6a23c" }}>
                {fmtNum(legend.oh[3])}
              </span>
            </div>
            <div className="flex items-center gap-2.5 font-mono text-[9px]" style={{ color: TV.dim }}>
              <span>O <span style={{ color: TV.muted }}>{fmtNum(legend.oh[0])}</span></span>
              <span>H <span style={{ color: TV.up }}>{fmtNum(legend.oh[1])}</span></span>
              <span>L <span style={{ color: TV.down }}>{fmtNum(legend.oh[2])}</span></span>
              <span>C <span style={{ color: legend.oh[3] >= legend.oh[0] ? TV.up : TV.down }}>{fmtNum(legend.oh[3])}</span></span>
              <span>Vol <span style={{ color: TV.muted }}>{legend.vol}</span></span>
            </div>
            {legend.inds.length > 0 && (
              <div className="flex items-center gap-2.5 flex-wrap font-mono text-[9px] mt-0.5" style={{ color: TV.dim }}>
                {legend.inds.slice(0, 6).map((i) => (
                  <span key={i.name} className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: i.color }} />
                    {i.name} <span style={{ color: TV.muted }}>{i.value}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10"
        style={{
          pointerEvents: tool === "pointer" ? "none" : "all",
          cursor: cursorMap[tool] ?? "default",
          touchAction: "none",
          width: "100%", height: "100%",
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onContextMenu={onContextMenu}
      />
    </div>
  );
}
