/**
 * Left-anchored Volume Profile — a lightweight-charts v5 series primitive.
 *
 * Draws a horizontal volume histogram pinned to the LEFT edge of the price pane,
 * price-aligned with the candles so you can read each candle in the context of
 * where volume actually traded (POC / Value Area). When buy/sell split data is
 * available (real tick footprint) each bar is rendered as a stacked sell|buy bar.
 *
 * It paints in the same canvas as the chart, so it stays perfectly aligned on
 * zoom / pan and updates live without any manual coordinate syncing.
 */

import type { ISeriesApi, SeriesType, Time } from "lightweight-charts";

export interface ProfileRow {
  priceLow: number;
  priceHigh: number;
  priceMid: number;
  volume: number;
  buy?: number;  // optional buy (ask) volume for split rendering
  sell?: number; // optional sell (bid) volume for split rendering
}

export interface VolumeProfileData {
  rows: ProfileRow[];
  pocPrice: number;   // Point of Control price (mid of the richest bin)
  vaLow: number;      // Value Area Low price
  vaHigh: number;     // Value Area High price
}

const COL = {
  base:  "rgba(100,116,139,0.34)",  // outside value area
  va:    "rgba(34,211,238,0.34)",   // inside value area (cyan)
  buy:   "rgba(52,211,153,0.55)",   // ask / buy
  sell:  "rgba(248,113,113,0.5)",   // bid / sell
  poc:   "rgba(245,158,11,0.92)",   // point of control (amber)
};

/** A single pane renderer that paints the profile in bitmap space. */
class ProfileRenderer {
  constructor(
    private readonly _series: ISeriesApi<SeriesType, Time>,
    private readonly _data: VolumeProfileData | null,
    private readonly _maxWidthFrac: number,
    private readonly _split: boolean,
  ) {}

  draw(target: any) {
    const data = this._data;
    if (!data || data.rows.length === 0) return;

    target.useBitmapCoordinateSpace((scope: any) => {
      const ctx: CanvasRenderingContext2D = scope.context;
      const hRatio: number = scope.horizontalPixelRatio;
      const vRatio: number = scope.verticalPixelRatio;
      const paneW: number = scope.mediaSize.width;

      const maxVol = Math.max(1, ...data.rows.map((r) => r.volume));
      const maxBarW = paneW * this._maxWidthFrac * hRatio;
      const x0 = 0; // left edge of the pane

      for (const r of data.rows) {
        if (r.volume <= 0) continue;
        const yHi = this._series.priceToCoordinate(r.priceHigh);
        const yLo = this._series.priceToCoordinate(r.priceLow);
        if (yHi == null || yLo == null) continue;

        const top = Math.min(yHi, yLo) * vRatio;
        const bottom = Math.max(yHi, yLo) * vRatio;
        const h = Math.max(1, bottom - top - 1); // 1px gap between rows
        const w = (r.volume / maxVol) * maxBarW;
        if (w < 0.5) continue;

        const inVA = r.priceMid >= data.vaLow && r.priceMid <= data.vaHigh;
        const isPOC =
          Math.abs(r.priceMid - data.pocPrice) <= (r.priceHigh - r.priceLow) / 2 + 1e-9;

        if (this._split && (r.buy || r.sell)) {
          const tot = (r.buy ?? 0) + (r.sell ?? 0) || 1;
          const sellW = w * ((r.sell ?? 0) / tot);
          const buyW = w * ((r.buy ?? 0) / tot);
          ctx.fillStyle = COL.sell;
          ctx.fillRect(x0, top, sellW, h);
          ctx.fillStyle = COL.buy;
          ctx.fillRect(x0 + sellW, top, buyW, h);
        } else {
          ctx.fillStyle = isPOC ? COL.poc : inVA ? COL.va : COL.base;
          ctx.fillRect(x0, top, w, h);
        }

        // POC accent line on the right tip of the bar
        if (isPOC) {
          ctx.fillStyle = COL.poc;
          ctx.fillRect(x0, top, Math.max(w, 2 * hRatio), Math.max(1, h * 0.18));
        }
      }
    });
  }
}

class ProfilePaneView {
  constructor(
    private readonly _series: ISeriesApi<SeriesType, Time>,
    private _data: VolumeProfileData | null,
    private readonly _maxWidthFrac: number,
    private readonly _split: boolean,
  ) {}

  update(data: VolumeProfileData | null) {
    this._data = data;
  }

  // Paint beneath the candles so wicks/bodies stay readable on top.
  zOrder() {
    return "bottom" as const;
  }

  renderer() {
    return new ProfileRenderer(this._series, this._data, this._maxWidthFrac, this._split);
  }
}

export class VolumeProfilePrimitive {
  private _paneView: ProfilePaneView | null = null;
  private _series: ISeriesApi<SeriesType, Time> | null = null;
  private _requestUpdate: (() => void) | null = null;
  private _data: VolumeProfileData | null = null;

  constructor(
    private readonly _maxWidthFrac = 0.26,
    private readonly _split = true,
  ) {}

  attached(param: { series: ISeriesApi<SeriesType, Time>; requestUpdate: () => void }) {
    this._series = param.series;
    this._requestUpdate = param.requestUpdate;
    this._paneView = new ProfilePaneView(param.series, this._data, this._maxWidthFrac, this._split);
  }

  detached() {
    this._series = null;
    this._requestUpdate = null;
    this._paneView = null;
  }

  setData(data: VolumeProfileData | null) {
    this._data = data;
    this._paneView?.update(data);
    this._requestUpdate?.();
  }

  paneViews() {
    return this._paneView ? [this._paneView] : [];
  }
}
