/**
 * Order-flow analytics — pure, framework-free math.
 *
 * VWAP + σ-bands, Volume/Market Profile (POC / Value Area / Single Prints) and
 * stacked-imbalance detection. The OHLCV-based functions work on any symbol
 * (Yahoo data via /api/backtesting/ohlcv); the footprint/imbalance functions
 * operate on real tick-derived cells from /api/orderflow (Binance).
 */

export interface OHLCVBar {
  time: number; open: number; high: number; low: number; close: number; volume: number;
}

/* ── VWAP + standard-deviation bands ──────────────────────────────────────── */
export interface VWAPPoint {
  time: number;
  vwap: number;
  upper1: number; lower1: number;
  upper2: number; lower2: number;
}

/**
 * Cumulative session VWAP anchored at the first bar, with volume-weighted
 * standard-deviation bands (±1σ / ±2σ) — the institutional baseline.
 */
export function computeVWAP(candles: OHLCVBar[]): VWAPPoint[] {
  let cumPV = 0, cumV = 0, cumPV2 = 0;
  const out: VWAPPoint[] = [];
  for (const c of candles) {
    const tp = (c.high + c.low + c.close) / 3;
    const v = c.volume > 0 ? c.volume : 0;
    cumPV += tp * v;
    cumPV2 += tp * tp * v;
    cumV += v;
    const vwap = cumV > 0 ? cumPV / cumV : tp;
    const variance = cumV > 0 ? Math.max(0, cumPV2 / cumV - vwap * vwap) : 0;
    const sd = Math.sqrt(variance);
    out.push({
      time: c.time,
      vwap,
      upper1: vwap + sd, lower1: vwap - sd,
      upper2: vwap + 2 * sd, lower2: vwap - 2 * sd,
    });
  }
  return out;
}

/** Latest VWAP value (session) + its σ, or null if no data. */
export function sessionVWAP(candles: OHLCVBar[]): { vwap: number; sd: number } | null {
  const series = computeVWAP(candles);
  if (!series.length) return null;
  const last = series[series.length - 1];
  return { vwap: last.vwap, sd: last.upper1 - last.vwap };
}

/* ── Volume / Market Profile (TPO) ────────────────────────────────────────── */
export interface ProfileBin {
  priceLow: number; priceHigh: number; priceMid: number;
  volume: number;   // volume traded inside this price band
  tpo: number;      // # of bars (time periods) that touched this band
}
export interface VolumeProfile {
  bins: ProfileBin[];          // ascending by price
  pocIndex: number;            // index of Point of Control (max volume)
  poc: number;                 // POC mid price
  vah: number;                 // Value Area High
  val: number;                 // Value Area Low
  total: number;               // total distributed volume
  singlePrints: number[];      // mid prices of bins touched by exactly one bar
}

/**
 * Distributes each bar's volume uniformly across its [low, high] range into
 * `rows` price bins, then derives POC, the 70% Value Area, and Single Prints
 * (price levels printed by a single time period — the TPO definition).
 */
export function computeVolumeProfile(candles: OHLCVBar[], rows = 24): VolumeProfile | null {
  if (!candles.length) return null;
  let lo = Infinity, hi = -Infinity;
  for (const c of candles) { lo = Math.min(lo, c.low); hi = Math.max(hi, c.high); }
  if (!isFinite(lo) || !isFinite(hi) || hi <= lo) return null;

  const span = hi - lo;
  const step = span / rows;
  const bins: ProfileBin[] = Array.from({ length: rows }, (_, i) => ({
    priceLow: lo + i * step,
    priceHigh: lo + (i + 1) * step,
    priceMid: lo + (i + 0.5) * step,
    volume: 0,
    tpo: 0,
  }));

  for (const c of candles) {
    const range = c.high - c.low;
    const startBin = Math.max(0, Math.floor((c.low - lo) / step));
    const endBin = Math.min(rows - 1, Math.floor((c.high - lo) / step));
    if (range <= 0) {
      bins[startBin].volume += c.volume;
      bins[startBin].tpo += 1;
      continue;
    }
    for (let b = startBin; b <= endBin; b++) {
      const overlap = Math.min(c.high, bins[b].priceHigh) - Math.max(c.low, bins[b].priceLow);
      if (overlap <= 0) continue;
      bins[b].volume += c.volume * (overlap / range);
      bins[b].tpo += 1;
    }
  }

  const total = bins.reduce((s, b) => s + b.volume, 0);
  let pocIndex = 0;
  for (let i = 1; i < bins.length; i++) if (bins[i].volume > bins[pocIndex].volume) pocIndex = i;

  // Value Area: expand from POC, always taking the richer adjacent side, until 70%.
  const target = total * 0.7;
  let acc = bins[pocIndex].volume;
  let loIdx = pocIndex, hiIdx = pocIndex;
  while (acc < target && (loIdx > 0 || hiIdx < bins.length - 1)) {
    const below = loIdx > 0 ? bins[loIdx - 1].volume : -1;
    const above = hiIdx < bins.length - 1 ? bins[hiIdx + 1].volume : -1;
    if (above >= below) { hiIdx += 1; acc += Math.max(0, above); }
    else { loIdx -= 1; acc += Math.max(0, below); }
  }

  const singlePrints = bins.filter((b) => b.tpo === 1 && b.volume > 0).map((b) => b.priceMid);

  return {
    bins,
    pocIndex,
    poc: bins[pocIndex].priceMid,
    vah: bins[hiIdx].priceHigh,
    val: bins[loIdx].priceLow,
    total,
    singlePrints,
  };
}

/* ── Footprint + stacked imbalance ────────────────────────────────────────── */
export interface FootprintCell { price: number; buy: number; sell: number; }
export interface FootprintBar {
  time: number;
  cells: FootprintCell[];   // ascending by price
  delta: number;            // total buy − sell for the bar
  totalVol: number;
}
export interface ImbalanceRun {
  barIndex: number;
  time: number;
  type: "buy" | "sell";
  priceStart: number;
  priceEnd: number;
  levels: number;
}

/**
 * Diagonal stacked-imbalance detection on a footprint.
 *  - Buy imbalance at price P  : buy[P] ≥ ratio × sell[P−1 tick]
 *  - Sell imbalance at price P  : sell[P] ≥ ratio × buy[P+1 tick]
 * `minRun` consecutive imbalanced levels in the same direction = a stacked run.
 */
export function detectStackedImbalances(
  bars: FootprintBar[], ratio = 3, minRun = 3
): ImbalanceRun[] {
  const runs: ImbalanceRun[] = [];

  bars.forEach((bar, barIndex) => {
    const cells = bar.cells; // ascending price
    const n = cells.length;
    if (n < minRun + 1) return;

    const flag = (above: number, below: number) => above > 0 && (below <= 0 || above >= ratio * below);

    // Buy imbalances: compare ask(buy) at level i vs bid(sell) one tick below.
    let buyStart = -1;
    for (let i = 1; i <= n; i++) {
      const isImb = i < n && flag(cells[i].buy, cells[i - 1].sell);
      if (isImb && buyStart < 0) buyStart = i;
      if ((!isImb || i === n) && buyStart >= 0) {
        const end = i - 1;
        if (end - buyStart + 1 >= minRun) {
          runs.push({
            barIndex, time: bar.time, type: "buy",
            priceStart: cells[buyStart].price, priceEnd: cells[end].price,
            levels: end - buyStart + 1,
          });
        }
        buyStart = -1;
      }
    }

    // Sell imbalances: compare bid(sell) at level i vs ask(buy) one tick above.
    let sellStart = -1;
    for (let i = 0; i <= n - 1; i++) {
      const isImb = i < n - 1 && flag(cells[i].sell, cells[i + 1].buy);
      if (isImb && sellStart < 0) sellStart = i;
      if ((!isImb || i === n - 1) && sellStart >= 0) {
        const end = isImb && i === n - 1 ? i : i - 1;
        if (end - sellStart + 1 >= minRun) {
          runs.push({
            barIndex, time: bar.time, type: "sell",
            priceStart: cells[sellStart].price, priceEnd: cells[end].price,
            levels: end - sellStart + 1,
          });
        }
        sellStart = -1;
      }
    }
  });

  return runs;
}

/* ── OHLCV delta estimate (non-crypto fallback) ───────────────────────────── */
/**
 * Approximates per-bar volume delta from candle shape when real tick data is
 * unavailable: close near the high ⇒ buyer-dominated (+), near the low ⇒ seller.
 * Surface this in the UI as an estimate ("est."), not real order flow.
 */
export function estimateDeltaFromOHLCV(bar: OHLCVBar): number {
  const range = bar.high - bar.low;
  if (range <= 0) return 0;
  return bar.volume * (2 * ((bar.close - bar.low) / range) - 1);
}
