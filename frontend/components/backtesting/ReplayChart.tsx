"use client";
import { useEffect, useRef, useCallback } from "react";
import { createChart, IChartApi, ISeriesApi, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries } from "lightweight-charts";

/* ── Public types ─────────────────────────────────────────────────── */
export interface OHLCVBar {
  time: number; open: number; high: number; low: number; close: number; volume: number;
}

export type DrawingTool = "pointer" | "pen" | "line" | "hline" | "ray" | "eraser";

export interface DrawPoint { time: number; price: number; }
export interface Drawing {
  id: string;
  type: "pen" | "line" | "hline" | "ray";
  points: DrawPoint[];
  color: string;
  width: number;
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
  candleUpColor?:    string;
  candleDownColor?:  string;
  liveBarOverride?:  OHLCVBar;
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
  ctx.restore();
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
  if ((d.type === "line" || d.type === "ray") && d.points.length >= 2) {
    const p1 = toPixel(chart, series, d.points[0]);
    const p2 = toPixel(chart, series, d.points[1]);
    if (!p1 || !p2) return false;
    return distPtSeg(mx, my, p1.x, p1.y, p2.x, p2.y) < R;
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
  candleUpColor   = "#10b981",
  candleDownColor = "#ef4444",
  liveBarOverride,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const candleRef    = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volRef       = useRef<ISeriesApi<"Histogram"> | null>(null);
  const prevVisible  = useRef(0);
  // track the last candles array reference to detect dataset swaps vs scrub
  const prevCandlesRef = useRef<OHLCVBar[]>([]);
  const dprRef       = useRef(1);

  // refs so event-handler closures always see the latest values
  const toolRef      = useRef(tool);
  const colorRef     = useRef(drawColor);
  const widthRef     = useRef(drawWidth);
  const drawingsRef  = useRef(drawings);
  const upColorRef   = useRef(candleUpColor);
  const downColorRef = useRef(candleDownColor);
  const isPenDown    = useRef(false);
  const pendingPen   = useRef<DrawPoint[]>([]);
  const lineStart    = useRef<DrawPoint | null>(null);
  const mouseCSS     = useRef<{ x: number; y: number } | null>(null);
  const rafId        = useRef(0);

  useEffect(() => { toolRef.current     = tool;           }, [tool]);
  useEffect(() => { colorRef.current    = drawColor;      }, [drawColor]);
  useEffect(() => { widthRef.current    = drawWidth;      }, [drawWidth]);
  useEffect(() => { upColorRef.current  = candleUpColor;  }, [candleUpColor]);
  useEffect(() => { downColorRef.current = candleDownColor; }, [candleDownColor]);
  useEffect(() => { drawingsRef.current = drawings; scheduleRender(); }, [drawings]); // eslint-disable-line

  /* ── Apply candle color changes live ───────────────────────────── */
  useEffect(() => {
    if (!candleRef.current) return;
    candleRef.current.applyOptions({
      upColor:      candleUpColor,
      downColor:    candleDownColor,
      wickUpColor:  candleUpColor,
      wickDownColor: candleDownColor,
    });
  }, [candleUpColor, candleDownColor]);

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
  }, []);

  const scheduleRender = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => { renderCanvas(); rafId.current = 0; });
  }, [renderCanvas]);

  /* ── Live bar: fast update() path — never touches viewport ─────── */
  useEffect(() => {
    if (!liveBarOverride || !candleRef.current || !volRef.current) return;
    const c = liveBarOverride;
    const up = upColorRef.current;
    const dn = downColorRef.current;
    try {
      candleRef.current.update({
        time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close,
      });
      volRef.current.update({
        time: c.time as any, value: c.volume,
        color: c.close >= c.open ? `${up}38` : `${dn}38`,
      });
      scheduleRender();
    } catch {
      // stale time from quote API — skip this tick, next poll will have fresh data
    }
  }, [liveBarOverride, scheduleRender]);

  /* ── Create chart once ──────────────────────────────────────────── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const dpr  = window.devicePixelRatio || 1;
    dprRef.current = dpr;

    const rect = el.getBoundingClientRect();
    const w = rect.width  || 800;
    const h = rect.height || 500;

    const chart = createChart(el, {
      width: w, height: h,
      layout: {
        background: { type: ColorType.Solid, color: "#070a12" },
        textColor: "#64748b", fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.06)",
        scaleMargins: { top: 0.06, bottom: 0.22 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.06)",
        timeVisible: true, secondsVisible: false, rightOffset: 8,
        // keep the latest bar visible by default
        lockVisibleTimeRangeOnResize: true,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor:       upColorRef.current,
      downColor:     downColorRef.current,
      borderVisible: false,
      wickUpColor:   upColorRef.current,
      wickDownColor: downColorRef.current,
    });

    const volSeries = chart.addSeries(HistogramSeries, {
      color: "rgba(16,185,129,0.25)", priceFormat: { type: "volume" }, priceScaleId: "vol_ov",
    });
    chart.priceScale("vol_ov").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    chartRef.current  = chart;
    candleRef.current = candleSeries;
    volRef.current    = volSeries;

    if (canvasRef.current) {
      canvasRef.current.width  = Math.round(w * dpr);
      canvasRef.current.height = Math.round(h * dpr);
    }

    chart.timeScale().subscribeVisibleLogicalRangeChange(() => scheduleRender());

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
      chart.remove();
      chartRef.current = null; candleRef.current = null; volRef.current = null;
    };
  }, [scheduleRender]);

  /* ── Data updates ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!candleRef.current || !volRef.current || !candles.length) return;

    // detect dataset swap (new symbol/period loaded) vs slider/replay scrub
    const isNewDataset = candles !== prevCandlesRef.current;
    prevCandlesRef.current = candles;

    const visible  = candles.slice(0, visibleCount);
    const isAppend = !isNewDataset && prevVisible.current > 0 && visibleCount === prevVisible.current + 1;
    prevVisible.current = visibleCount;

    const up = upColorRef.current;
    const dn = downColorRef.current;
    const cd = visible.map((c) => ({ time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close }));
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
  }, [candles, visibleCount, scheduleRender]);

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

    if (t === "line" || t === "ray") {
      if (!lineStart.current) {
        lineStart.current = cp;
        mouseCSS.current  = px;
      } else {
        onDrawingsChange([...drawingsRef.current, { id: newId(), type: t, points: [lineStart.current, cp], color: colorRef.current, width: widthRef.current }]);
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

    if (["line", "ray", "hline"].includes(t) && lineStart.current) scheduleRender();
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
    eraser:  "cell",
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
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
