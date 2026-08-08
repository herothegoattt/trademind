"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  createChart, IChartApi, ColorType, CandlestickSeries, ISeriesApi,
  createSeriesMarkers, ISeriesMarkersPluginApi,
} from "lightweight-charts";
import type { OHLCVBar } from "./ReplayChart";

const MTF_INTERVALS = ["5m", "15m", "1h"] as const;
type MTFInterval = (typeof MTF_INTERVALS)[number];

const PANE_H = 74;

export default function MultiTimeframe({
  ticker,
  period,
  currentTime,
  activeInterval,
  onPickInterval,
  height,
}: {
  ticker: string;
  period: string;
  currentTime: number | null;
  activeInterval: string;
  onPickInterval: (t: string) => void;
  height: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef<Record<string, OHLCVBar[]>>({});
  const chartRef = useRef<IChartApi[]>([]);
  const seriesRef = useRef<ISeriesApi<"Candlestick">[]>([]);
  const markerRef = useRef<(ISeriesMarkersPluginApi<"Candlestick"> | null)[]>([]);

  const applyNow = useCallback(() => {
    if (currentTime == null) return;
    chartRef.current.forEach((chart, i) => {
      const iv = MTF_INTERVALS[i];
      const bars = dataRef.current[iv] ?? [];
      const cs = seriesRef.current[i];
      if (!bars.length || !cs) return;
      let idx = bars.length - 1;
      for (let b = 0; b < bars.length; b++) {
        if (bars[b].time > currentTime) { idx = b - 1; break; }
      }
      idx = Math.max(0, idx);
      const win = bars.slice(Math.max(0, idx - 40), Math.min(bars.length, idx + 1));
      const lo = Math.min(...win.map((x) => x.low));
      const hi = Math.max(...win.map((x) => x.high));
      if (isFinite(lo) && isFinite(hi)) {
        if (!markerRef.current[i]) {
          const m = createSeriesMarkers(cs, [{ time: bars[idx].time as any, position: "belowBar", color: "#38bdf8", shape: "arrowUp", text: "" }]);
          (cs as any).attachPrimitive(m);
          markerRef.current[i] = m;
        } else {
          markerRef.current[i]?.setMarkers([{ time: bars[idx].time as any, position: "belowBar", color: "#38bdf8", shape: "arrowUp", text: "" }]);
        }
      }
      chart.timeScale().setVisibleLogicalRange({ from: idx - 44, to: idx + 4 });
    });
  }, [currentTime]);

  const refreshCharts = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const w = wrap.clientWidth || 600;

    chartRef.current.forEach((c) => c.remove());
    chartRef.current = [];
    seriesRef.current = [];
    markerRef.current = [];

    wrap.querySelectorAll<HTMLDivElement>("[data-pane]").forEach((el) => {
      const iv = el.dataset["pane"] as MTFInterval;
      const bars = dataRef.current[iv] ?? [];
      const chart = createChart(el, {
        width: w,
        height: PANE_H,
        layout: { background: { type: ColorType.Solid, color: "#0b0f17" }, textColor: "#475569", fontSize: 9 },
        grid: { vertLines: { visible: false }, horzLines: { color: "rgba(255,255,255,0.04)" } },
        rightPriceScale: { borderColor: "rgba(255,255,255,0.06)", scaleMargins: { top: 0.12, bottom: 0.12 } },
        timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false, rightOffset: 2 },
        crosshair: { mode: 0 },
      });
      const candle = chart.addSeries(CandlestickSeries, {
        upColor: "#16a34a", downColor: "#dc2626",
        borderVisible: false, wickUpColor: "#16a34a", wickDownColor: "#dc2626",
      });
      candle.setData(barsOrEmpty(bars));
      chart.timeScale().fitContent();
      chartRef.current.push(chart);
      seriesRef.current.push(candle);
      markerRef.current.push(null);
    });
    applyNow();
  }, [applyNow]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out: Record<string, OHLCVBar[]> = {};
      for (const iv of MTF_INTERVALS) {
        try {
          const res = await fetch(`/api/backtesting/ohlcv?symbol=${encodeURIComponent(ticker)}&interval=${iv}&period=${period}&v=${Date.now()}`, { cache: "no-store" });
          const j = await res.json();
          out[iv] = (j.candles ?? []) as OHLCVBar[];
        } catch { /* skip frame */ }
      }
      if (cancelled) return;
      dataRef.current = out;
      refreshCharts();
    })();
    return () => { cancelled = true; };
  }, [ticker, period, refreshCharts]);

  useEffect(() => { applyNow(); }, [applyNow]);

  const active = activeInterval;

  return (
    <div ref={wrapRef} className="w-full flex-shrink-0" style={{ height, borderTop: "1px solid rgba(255,255,255,0.07)", background: "#0b0f17" }}>
      <div className="flex items-center gap-1 px-2 py-1">
        <span className="text-[8px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: "#5b667d" }}>
          Multi-Timeframe
        </span>
        <span className="text-[8px] text-slate-600 font-mono flex-shrink-0">sync · {ticker}</span>
        <div className="flex-1" />
        <span className="text-[8px] text-slate-600 font-mono flex-shrink-0">click a frame to switch the main chart</span>
      </div>
      <div className="flex gap-1 px-2 pb-2">
        {MTF_INTERVALS.map((iv) => (
          <div key={iv} className="flex flex-col flex-1 gap-1">
            <button
              onClick={() => onPickInterval(iv)}
              className="text-[9px] font-bold py-0.5 rounded transition-all"
              style={{
                background: active === iv ? "rgba(59,130,246,0.14)" : "rgba(255,255,255,0.03)",
                border: active === iv ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.07)",
                color: active === iv ? "#60a5fa" : "#64748b",
              }}
            >
              {iv}
            </button>
            <div
              data-pane={iv}
              className="w-full overflow-hidden rounded"
              style={{ height: PANE_H, pointerEvents: "none" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function barsOrEmpty(bars: OHLCVBar[]) {
  return bars.map((b) => ({ time: b.time as any, open: b.open, high: b.high, low: b.low, close: b.close }));
}