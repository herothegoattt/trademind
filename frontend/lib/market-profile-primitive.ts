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

import type { ISeriesApi, SeriesType, Time } from "lightweight-charts";

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

      // POC horizontal accent line across the price axis
      const pocTop = rowTops[d.pocRow];
      if (pocTop != null) {
        ctx.fillStyle = TPO_COL.pocLine;
        ctx.fillRect(0, pocTop, paneW * hRatio, Math.max(1.5 * vRatio, 1));
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