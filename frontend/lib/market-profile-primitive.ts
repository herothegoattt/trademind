/**
 * Right-anchored Market-Profile primitives for lightweight-charts v5.
 *
 * Two renderers, both paint in the chart's own canvas so they stay perfectly
 * aligned on zoom/pan and update live:
 *
 *   1. TPOPrimitive — MotiveWave-style TPO letter chart. Bars are bucketed into
 *      sessions (rows-per-session is fixed); within a session each period
 *      (bar) is assigned a letter A..Z as its time code. Letters are painted
 *      into price-sorted rows, so you can read where time auctioned value.
 *      POC (row with most time) + the 70% Value Area are highlighted.
 *
 *   2. GexProfilePrimitive — horizontal Gamma-Exposure profile from a live
 *      options chain (strike rows), coloured by call/put gamma contribution,
 *      POC strike accented with a brighter tip.
 */

import type { ISeriesApi, SeriesType, Time, IChartApi } from "lightweight-charts";
import type { VolumeProfile } from "./orderflow";

/* ── Shared helpers ─────────────────────────────────────────────────────────── */

function lighten(hex: string, amt: number): string {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f, 16);
  const r = Math.min(255, ((n >> 16) & 255) + amt);
  const g = Math.min(255, ((n >> 8) & 255) + amt);
  const b = Math.min(255, (n & 255) + amt);
  return `rgb(${r},${g},${b})`;
}

/* ════════════════════ TPO / Market Profile ═══════════════════════════════════ */

export interface TpoRow {
  priceLow: number;
  priceHigh: number;
  priceMid: number;
  // source bar index per session that printed into this row
  cells: { session: number; letters: string }[];
}

export interface TpoData {
  rows: TpoRow[];            // ascending price, each row is one price band
  sessions: { index: number; startTime: number; endTime: number }[];
  pocRow: number;            // index of POC (row with most time)
  vaLowRow: number;          // value-area low row index
  vaHighRow: number;         // value-area high row index
  rowsPerSession: number;
  side?: "left" | "right";   // anchor side (default right)
}

const TPO_COL = {
  cell:   "rgba(148,163,184,0.28)",   // letter cell outside value area
  va:     "rgba(56,189,248,0.30)",    // value-area cell (already painted behind)
  poc:    "rgba(245,158,11,0.42)",    // POC row accent
  text:   "rgba(203,213,225,0.9)",
  vaText: "rgba(56,189,248,1)",
  pocLine: "rgba(245,158,11,0.8)",
};

class TpoRenderer {
  constructor(
    private readonly _series: ISeriesApi<SeriesType, Time>,
    private readonly _data: TpoData | null,
  ) {}

  draw(target: any) {
    const d = this._data;
    if (!d || d.rows.length === 0) return;

    target.useBitmapCoordinateSpace((scope: any) => {
      const ctx: CanvasRenderingContext2D = scope.context;
      const hRatio: number = scope.horizontalPixelRatio;
      const vRatio: number = scope.verticalPixelRatio;
      const paneW: number = scope.mediaSize.width;

      const nSessions = d.sessions.length;
      const nRows = d.rows.length;
      const right = d.side === "left" ? false : true;

      // Column layout: n session columns, right-anchored. All geometry below is
      // computed in bitmap (physical) pixels — mediaSize comes in CSS px, so
      // everything anchored to the pane must be scaled by hRatio.
      const LETTER_W = 9;   // css px per letter glyph
      const cssPaneW = paneW;
      const maxColWcss = Math.min(Math.max(28, cssPaneW / Math.max(nSessions, 1)), 96);
      const colWcss = Math.max(12, Math.min(maxColWcss, LETTER_W * 6));
      const colW = colWcss * hRatio;          // bitmap px per column
      const gapX = Math.max(1, hRatio);       // 1 css px gutter between columns
      const colAreaW = colW * nSessions;
      const xStart = right ? cssPaneW * hRatio - colAreaW : 0;

      // Price row mapping (bitmap coords). priceToCoordinate returns the Y of a
      // price level with higher prices at smaller Y (canvas y grows downward), so:
      //   frac=0 → rows[i].priceLow  (lower edge of the row)
      //   frac=1 → rows[i].priceHigh (upper edge of the row)
      const rowY = (rowIdx: number, frac: number): number => {
        const topPrice = d.rows[rowIdx].priceLow;
        const nextLow = d.rows[rowIdx + 1] ? d.rows[rowIdx + 1].priceLow : d.rows[rowIdx].priceHigh;
        const price = topPrice + (nextLow - topPrice) * frac;
        const y = this._series.priceToCoordinate(price);
        return y == null ? -1 : y * vRatio;
      };

      // Draw full session columns from the RIGHT edge, filling up to nSessions.
      const colXFor = (s: number) => xStart + s * colW;

      // Row pixel metrics (compute once, index-aligned)
      const rowTops: number[] = new Array(nRows).fill(0);
      const rowHs: number[] = new Array(nRows).fill(0);
      for (let i = 0; i < nRows; i++) {
        const top = rowY(i, 1); // upper edge (rows[i].priceHigh) → smallest Y
        const bot = rowY(i, 0); // lower edge (rows[i].priceLow)  → largest Y
        if (top < 0 || bot < 0) continue;
        rowTops[i] = top;
        rowHs[i] = Math.max(1, bot - top);
      }

      const inVA = (i: number) => d.vaLowRow <= i && i <= d.vaHighRow;
      const isPoc = (i: number) => i === d.pocRow;

      for (let s = 0; s < nSessions; s++) {
        const colX = colXFor(s);
        for (let r = 0; r < nRows; r++) {
          const cell = d.rows[r].cells.find((c) => c.session === s);
          if (!cell) continue;
          const top = rowTops[r];
          if (top == null) continue;
          const cellH = rowHs[r];

          // background
          ctx.fillStyle = isPoc(r) ? TPO_COL.poc : inVA(r) ? TPO_COL.va : TPO_COL.cell;
          ctx.fillRect(colX, top, colW - gapX, cellH);

          // letters (trim to fit column width)
          const fit = Math.max(1, Math.floor((colW - gapX) / (LETTER_W * hRatio)));
          const letters = cell.letters.slice(0, fit);
          ctx.font = `${Math.floor(8 * hRatio)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
          ctx.textBaseline = "middle";
          ctx.fillStyle = isPoc(r) ? lighten("#fbbf24", 40) : inVA(r) ? TPO_COL.vaText : TPO_COL.text;
          ctx.textAlign = "center";
          ctx.fillText(letters, colX + colW / 2, top + cellH / 2 + 0.5 * vRatio);
        }
      }

      // Value Area boundaries — faint horizontal markers at VAL / VAH edges
      for (const idx of [d.vaLowRow, d.vaHighRow]) {
        const t = idx >= 0 && idx < nRows ? rowTops[idx] : null;
        if (t != null) {
          ctx.fillStyle = "rgba(56,189,248,0.28)";
          ctx.fillRect(0, t - 0.5 * vRatio, paneW * hRatio, Math.max(1.5 * vRatio, 1));
        }
      }

      // POC horizontal accent line across the price axis
      const pocTop = rowTops[d.pocRow];
      if (pocTop != null) {
        ctx.fillStyle = TPO_COL.pocLine;
        ctx.fillRect(0, pocTop, paneW * hRatio, Math.max(2 * vRatio, 1));
      }
    });
  }
}

class TpoPaneView {
  constructor(private readonly _series: ISeriesApi<SeriesType, Time>, private _data: TpoData | null) {}

  update(data: TpoData | null) { this._data = data; }
  zOrder() { return "top" as const; }
  renderer() { return new TpoRenderer(this._series, this._data); }
}

export class TPOPrimitive {
  private _pv: TpoPaneView | null = null;
  private _req: (() => void) | null = null;
  constructor(private _data: TpoData | null = null) {}

  attached(param: { series: ISeriesApi<SeriesType, Time>; requestUpdate: () => void }) {
    this._req = param.requestUpdate;
    this._pv = new TpoPaneView(param.series, this._data);
  }
  detached() { this._req = null; this._pv = null; }
  setData(d: TpoData | null) { this._data = d; this._pv?.update(d); this._req?.(); }
  paneViews() { return this._pv ? [this._pv] : []; }
}

/* ════════════════════ GEX Profile ════════════════════════════════════════════ */

export interface GexRow {
  strike: number;
  gex: number;
  callGex: number;
  putGex: number;
  oi: number;
}

export interface GexData {
  rows: GexRow[];            // ascending strike
  spot: number;
  pocStrike: number;
  maxGex: number;
}

const GEX_COL = {
  base:   "rgba(56,189,248,0.30)",   // net gamma near balanced
  call:   "rgba(74,222,128,0.55)",   // call-heavy (up-strike convexity)
  put:    "rgba(248,113,113,0.55)",  // put-heavy
  poc:    "rgba(245,158,11,0.95)",
  spot:   "rgba(255,255,255,0.75)",
};

class GexRenderer {
  constructor(private readonly _series: ISeriesApi<SeriesType, Time>, private readonly _data: GexData | null) {}

  draw(target: any) {
    const d = this._data;
    if (!d || d.rows.length === 0) return;

    target.useBitmapCoordinateSpace((scope: any) => {
      const ctx: CanvasRenderingContext2D = scope.context;
      const hRatio: number = scope.horizontalPixelRatio;
      const vRatio: number = scope.verticalPixelRatio;
      const paneW: number = scope.mediaSize.width;

      const maxFrac = 0.22; // bars grow from the right edge toward price
      const maxBarW = paneW * maxFrac * hRatio;
      const anchorX = paneW * hRatio; // right edge (bitmap px)

      for (const r of d.rows) {
        const m = Math.abs(r.gex) / d.maxGex;
        const w = Math.max(2 * hRatio, m * maxBarW);
        const y = this._series.priceToCoordinate(r.strike);
        if (y == null) continue;
        const top = y * vRatio - 1.5 * vRatio;
        const h = Math.max(2 * vRatio, 3 * vRatio);

        const isPoc = Math.abs(r.strike - d.pocStrike) < 0.01;
        const callHeavy = r.callGex > r.putGex;

        ctx.fillStyle = isPoc ? GEX_COL.poc : callHeavy ? GEX_COL.call : GEX_COL.put;
        ctx.fillRect(anchorX - w, top - h / 2, w, h);
        if (isPoc) {
          ctx.fillStyle = GEX_COL.poc;
          ctx.fillRect(anchorX - w, top, Math.max(w, 3 * hRatio), Math.max(2 * vRatio, 2));
        }
      }

      // spot line
      const sy = this._series.priceToCoordinate(d.spot);
      if (sy != null) {
        ctx.fillStyle = GEX_COL.spot;
        ctx.globalAlpha = 0.18; // soft glow
        ctx.fillRect(0, sy * vRatio - 3.5 * vRatio, paneW * hRatio, 7 * vRatio);
        ctx.globalAlpha = 1;
        ctx.fillRect(0, sy * vRatio - 0.5 * vRatio, paneW * hRatio, Math.max(1 * vRatio, 1));
      }
    });
  }
}

class GexPaneView {
  constructor(private readonly _series: ISeriesApi<SeriesType, Time>, private _data: GexData | null) {}

  update(data: GexData | null) { this._data = data; }
  zOrder() { return "top" as const; }
  renderer() { return new GexRenderer(this._series, this._data); }
}

export class GexProfilePrimitive {
  private _pv: GexPaneView | null = null;
  private _req: (() => void) | null = null;
  constructor(private _data: GexData | null = null) {}

  attached(param: { series: ISeriesApi<SeriesType, Time>; requestUpdate: () => void }) {
    this._req = param.requestUpdate;
    this._pv = new GexPaneView(param.series, this._data);
  }
  detached() { this._req = null; this._pv = null; }
  setData(d: GexData | null) { this._data = d; this._pv?.update(d); this._req?.(); }
  paneViews() { return this._pv ? [this._pv] : []; }
}

/* ════════════════════ Band fill (BB / VWAP σ zones) ═════════════════════════ */

export interface BandRow {
  time: number;
  top: number;    // upper edge price
  bottom: number; // lower edge price
}

export interface BandData {
  rows: BandRow[];
  color: string;  // translucent fill color
}

/**
 * Painting-time band fill, drawn BEHIND the candles (zOrder "bottom") so it
 * reads like a Bollinger / VWAP σ envelope. Rows are per bar: the horizontal
 * strip between top and bottom is filled across that bar's time slot. Fully
 * synchronized with zoom/pan because it uses the chart's own coordinate space.
 */
class BandRenderer {
  constructor(
    private readonly _chart: IChartApi,
    private readonly _series: ISeriesApi<SeriesType, Time>,
    private readonly _data: BandData | null,
  ) {}

  draw(target: any) {
    const d = this._data;
    if (!d || d.rows.length === 0) return;

    target.useBitmapCoordinateSpace((scope: any) => {
      const ctx: CanvasRenderingContext2D = scope.context;
      const hRatio: number = scope.horizontalPixelRatio;
      const vRatio: number = scope.verticalPixelRatio;
      const ts = this._chart.timeScale();

      ctx.fillStyle = d.color;
      for (let i = 0; i < d.rows.length; i++) {
        const r = d.rows[i];
        const yTop = this._series.priceToCoordinate(Math.max(r.top, r.bottom));
        const yBot = this._series.priceToCoordinate(Math.min(r.top, r.bottom));
        if (yTop == null || yBot == null) continue;
        const x = ts.timeToCoordinate(r.time as any);
        if (x == null) continue;
        const prevTime = d.rows[i - 1]?.time ?? r.time;
        const nextTime = d.rows[i + 1]?.time ?? r.time + (r.time - prevTime);
        const xn = ts.timeToCoordinate(nextTime as any);
        const w = xn != null && xn > x ? xn - x : 0;
        if (w <= 0) continue;
        const top = Math.min(yTop, yBot) * vRatio;
        const h = Math.abs(yBot - yTop) * vRatio;
        if (h <= 0) continue;
        ctx.fillRect(x * hRatio, top, w * hRatio, h);
      }
    });
  }
}

class BandPaneView {
  constructor(
    private readonly _chart: IChartApi,
    private readonly _series: ISeriesApi<SeriesType, Time>,
    private _data: BandData | null,
  ) {}

  update(data: BandData | null) { this._data = data; }
  zOrder() { return "bottom" as const; }
  renderer() { return new BandRenderer(this._chart, this._series, this._data); }
}

export class BandFillPrimitive {
  private _pv: BandPaneView | null = null;
  private _req: (() => void) | null = null;
  constructor(
    private readonly _chart: IChartApi,
    private _data: BandData | null = null,
  ) {}

  attached(param: { series: ISeriesApi<SeriesType, Time>; requestUpdate: () => void }) {
    this._req = param.requestUpdate;
    this._pv = new BandPaneView(this._chart, param.series, this._data);
  }
  detached() { this._req = null; this._pv = null; }
  setData(d: BandData | null) { this._data = d; this._pv?.update(d); this._req?.(); }
  paneViews() { return this._pv ? [this._pv] : []; }
}

/* ════════════════════ Volume / Market Profile ══════════════════════════════ */

const VP_COL = {
  base:   "rgba(59,130,246,0.42)",   // outside value area
  va:     "rgba(56,189,248,0.52)",   // inside 70% value area
  call:   "rgba(52,211,153,0.62)",   // delta-positive bins
  put:    "rgba(248,113,113,0.62)",  // delta-negative bins
  poc:    "rgba(245,158,11,0.85)",   // point of control
  single: "rgba(245,158,11,0.95)",   // single-print tick
  vaZone: "rgba(56,189,248,0.05)",   // faint full-width VA strip
  vaLine: "rgba(56,189,248,0.55)",
  pocLine: "rgba(245,158,11,0.75)",
};

/**
 * TradingView-style horizontal market/volume profile, right-anchored: a bar
 * per price bin grows leftward proportional to volume, POC + 70% Value Area
 * are highlighted, VAH/VAL + POC reach across the whole pane, and single
 * prints (touched by one period only) get an amber tick. Optional per-bin net
 * delta tints bars buy/sell when the OHLCV estimate is available.
 */
class VolumeProfileRenderer {
  constructor(
    private readonly _series: ISeriesApi<SeriesType, Time>,
    private readonly _data: VolumeProfile | null,
  ) {}

  draw(target: any) {
    const data = this._data;
    if (!data || data.bins.length === 0) return;
    const bins = data.bins;

    target.useBitmapCoordinateSpace((scope: any) => {
      const ctx: CanvasRenderingContext2D = scope.context;
      const hRatio: number = scope.horizontalPixelRatio;
      const vRatio: number = scope.verticalPixelRatio;
      const paneW: number = scope.mediaSize.width;

      const paneWpx = paneW * hRatio;
      const right = paneWpx;
      const maxFrac = 0.42;
      const maxV = Math.max(1, data.maxVolume);
      const singleSet = new Set(data.singlePrints);
      const inVA = (i: number) => i >= data.vaLowRow && i <= data.vaHighRow;

      // faint full-width strip for the 70% value area
      const vaTop = this._series.priceToCoordinate(data.vah);
      const vaBot = this._series.priceToCoordinate(data.val);
      if (vaTop != null && vaBot != null) {
        ctx.fillStyle = VP_COL.vaZone;
        ctx.fillRect(0, Math.min(vaTop, vaBot) * vRatio, paneWpx, Math.abs(vaBot - vaTop) * vRatio);
      }

      for (let i = 0; i < bins.length; i++) {
        const b = bins[i];
        if (b.volume <= 0) continue;
        const yTop = this._series.priceToCoordinate(b.priceHigh);
        const yBot = this._series.priceToCoordinate(b.priceLow);
        if (yTop == null || yBot == null) continue;
        const top = Math.min(yTop, yBot) * vRatio;
        const h = Math.max(1, Math.abs(yBot - yTop) * vRatio);
        const w = Math.max(1.5 * hRatio, (b.volume / maxV) * paneWpx * maxFrac);
        const x = right - w;

        // colour: POC → amber; otherwise delta tint → VA/net-neutral
        let fill = VP_COL.base;
        if (i === data.pocIndex) fill = VP_COL.poc;
        else if (b.net != null && Math.abs(b.net) > b.volume * 0.18) fill = b.net > 0 ? VP_COL.call : VP_COL.put;
        else if (inVA(i)) fill = VP_COL.va;

        ctx.fillStyle = fill;
        ctx.fillRect(x, top, w, h);

        // single print → amber tick pinned to the right edge
        if (singleSet.has(b.priceMid)) {
          ctx.fillStyle = VP_COL.single;
          ctx.fillRect(right - Math.max(2 * hRatio, 3), top, Math.max(2 * hRatio, 3), h);
        }
      }

      // horizontal reference lines across the pane
      const hl = (price: number, color: string, dashed: boolean, lw: number) => {
        const y = this._series.priceToCoordinate(price);
        if (y == null) return;
        ctx.strokeStyle = color;
        ctx.lineWidth = lw * vRatio;
        ctx.setLineDash(dashed ? [4 * hRatio, 3 * hRatio] : []);
        ctx.beginPath();
        ctx.moveTo(0, y * vRatio);
        ctx.lineTo(paneWpx, y * vRatio);
        ctx.stroke();
        ctx.setLineDash([]);
      };
      hl(data.vah, VP_COL.vaLine, true, 1.4);
      hl(data.val, VP_COL.vaLine, true, 1.4);
      hl(bins[data.pocIndex].priceMid, VP_COL.pocLine, false, 2);
    });
  }
}

class VolumeProfilePaneView {
  constructor(
    private readonly _series: ISeriesApi<SeriesType, Time>,
    private _data: VolumeProfile | null,
  ) {}

  update(data: VolumeProfile | null) { this._data = data; }
  zOrder() { return "top" as const; }
  renderer() { return new VolumeProfileRenderer(this._series, this._data); }
}

export class VolumeProfilePrimitive {
  private _pv: VolumeProfilePaneView | null = null;
  private _req: (() => void) | null = null;
  constructor(private _data: VolumeProfile | null = null) {}

  attached(param: { series: ISeriesApi<SeriesType, Time>; requestUpdate: () => void }) {
    this._req = param.requestUpdate;
    this._pv = new VolumeProfilePaneView(param.series, this._data);
  }
  detached() { this._req = null; this._pv = null; }
  setData(d: VolumeProfile | null) { this._data = d; this._pv?.update(d); this._req?.(); }
  paneViews() { return this._pv ? [this._pv] : []; }
}