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
  net?: number;     // signed volume delta inside the band (if deltas provided)
}
export interface VolumeProfile {
  bins: ProfileBin[];          // ascending by price
  pocIndex: number;            // index of Point of Control (max volume)
  poc: number;                 // POC mid price
  vah: number;                 // Value Area High
  val: number;                 // Value Area Low
  vaLowRow: number;            // bin row index of Value Area Low
  vaHighRow: number;           // bin row index of Value Area High
  total: number;               // total distributed volume
  singlePrints: number[];      // mid prices of bins touched by exactly one bar
  maxVolume: number;           // largest bin volume (for proportional bars)
}

/**
 * Distributes each bar's volume uniformly across its [low, high] range into
 * `rows` price bins, then derives POC, the 70% Value Area, and Single Prints
 * (price levels printed by a single time period — the TPO definition). When
 * `deltas` (aligned to candles) is given, each bin also accumulates a signed
 * `net` delta so the profile can be tinted buy/sell like TradingView.
 */
export function computeVolumeProfile(
  candles: OHLCVBar[],
  rows = 24,
  deltas?: (number | null)[],
): VolumeProfile | null {
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
    net: 0,
  }));

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const range = c.high - c.low;
    const d = deltas?.[i] ?? null;
    const startBin = Math.max(0, Math.floor((c.low - lo) / step));
    const endBin = Math.min(rows - 1, Math.floor((c.high - lo) / step));
    if (range <= 0) {
      bins[startBin].volume += c.volume;
      if (d != null) bins[startBin].net = (bins[startBin].net ?? 0) + d;
      bins[startBin].tpo += 1;
      continue;
    }
    for (let b = startBin; b <= endBin; b++) {
      const overlap = Math.min(c.high, bins[b].priceHigh) - Math.max(c.low, bins[b].priceLow);
      if (overlap <= 0) continue;
      const frac = overlap / range;
      bins[b].volume += c.volume * frac;
      if (d != null) bins[b].net = (bins[b].net ?? 0) + d * frac;
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
  const maxVolume = Math.max(1, ...bins.map((b) => b.volume));

  return {
    bins,
    pocIndex,
    poc: bins[pocIndex].priceMid,
    vah: bins[hiIdx].priceHigh,
    val: bins[loIdx].priceLow,
    vaLowRow: loIdx,
    vaHighRow: hiIdx,
    total,
    singlePrints,
    maxVolume,
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

/* ── Classic chart indicators (read the candles) ──────────────────────────── */
export interface LinePoint { time: number; value: number; }

/** Exponential moving average over closes. Seeded with the SMA of the first `period` bars. */
export function computeEMA(candles: OHLCVBar[], period: number): LinePoint[] {
  if (candles.length < period || period < 1) return [];
  const k = 2 / (period + 1);
  const out: LinePoint[] = [];
  let ema = 0;
  for (let i = 0; i < period; i++) ema += candles[i].close;
  ema /= period;
  out.push({ time: candles[period - 1].time, value: ema });
  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
    out.push({ time: candles[i].time, value: ema });
  }
  return out;
}

export interface BollingerPoint { time: number; mid: number; upper: number; lower: number; }
/** Bollinger Bands — SMA(period) ± mult·σ of closes. */
export function computeBollinger(candles: OHLCVBar[], period = 20, mult = 2): BollingerPoint[] {
  if (candles.length < period) return [];
  const out: BollingerPoint[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
    const mid = sum / period;
    let v = 0;
    for (let j = i - period + 1; j <= i; j++) v += (candles[j].close - mid) ** 2;
    const sd = Math.sqrt(v / period);
    out.push({ time: candles[i].time, mid, upper: mid + mult * sd, lower: mid - mult * sd });
  }
  return out;
}

/** Wilder's RSI over closes. Returns one point per bar from index `period` onward. */
export function computeRSI(candles: OHLCVBar[], period = 14): LinePoint[] {
  if (candles.length <= period) return [];
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const ch = candles[i].close - candles[i - 1].close;
    if (ch >= 0) gain += ch; else loss -= ch;
  }
  let avgGain = gain / period, avgLoss = loss / period;
  const out: LinePoint[] = [];
  const rsi = (g: number, l: number) => (l === 0 ? 100 : 100 - 100 / (1 + g / l));
  out.push({ time: candles[period].time, value: rsi(avgGain, avgLoss) });
  for (let i = period + 1; i < candles.length; i++) {
    const ch = candles[i].close - candles[i - 1].close;
    const g = ch >= 0 ? ch : 0, l = ch < 0 ? -ch : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    out.push({ time: candles[i].time, value: rsi(avgGain, avgLoss) });
  }
  return out;
}

/**
 * Developing Point of Control — the price level holding the most cumulative
 * volume as the session builds (Auction Market Theory). Anchored at the first
 * bar; the line shows where the market is repeatedly accepting price over time.
 */
export function computeDevelopingPOC(candles: OHLCVBar[], rows = 60): LinePoint[] {
  if (!candles.length) return [];
  let lo = Infinity, hi = -Infinity;
  for (const c of candles) { lo = Math.min(lo, c.low); hi = Math.max(hi, c.high); }
  if (!isFinite(lo) || !isFinite(hi) || hi <= lo) return [];
  const step = (hi - lo) / rows;
  const vol = new Array(rows).fill(0);
  const out: LinePoint[] = [];
  let pocIdx = 0;
  for (const c of candles) {
    const range = c.high - c.low;
    const start = Math.max(0, Math.floor((c.low - lo) / step));
    const end = Math.min(rows - 1, Math.floor((c.high - lo) / step));
    if (range <= 0) { vol[start] += c.volume; }
    else for (let b = start; b <= end; b++) {
      const overlap = Math.min(c.high, lo + (b + 1) * step) - Math.max(c.low, lo + b * step);
      if (overlap > 0) vol[b] += c.volume * (overlap / range);
    }
    for (let b = 0; b < rows; b++) if (vol[b] > vol[pocIdx]) pocIdx = b;
    out.push({ time: c.time, value: lo + (pocIdx + 0.5) * step });
  }
  return out;
}

/* ── POC Absorption (Auction Market Theory) ───────────────────────────────── */
/**
 * Absorption = aggressive market orders meet passive limit orders that *absorb*
 * them, so price barely moves despite heavy one-sided flow. A bar shows
 * absorption when volume is above average, delta is clearly one-sided, yet the
 * body stalls (or even closes against the delta) — a large player defending a
 * level. Net selling absorbed ⇒ bullish (buyers held); net buying absorbed ⇒
 * bearish (sellers capped it).
 */
export interface AbsorptionEvent {
  barIndex: number;
  time: number;
  price: number;                  // level being defended (bar POC / extreme)
  type: "bullish" | "bearish";    // bullish = bid absorption, bearish = ask absorption
  delta: number;
  volume: number;
  strength: number;               // 0..1 composite confidence
  real: boolean;                  // true = from real footprint, false = OHLCV estimate
}

export function detectAbsorption(
  candles: OHLCVBar[],
  footprint: FootprintBar[] = [],
  deltas: number[] = [],
): AbsorptionEvent[] {
  if (!candles.length) return [];
  const avgVol = candles.reduce((s, c) => s + (c.volume > 0 ? c.volume : 0), 0) / candles.length || 1;
  const events: AbsorptionEvent[] = [];
  const real = footprint.length > 0;
  const fpByTime = new Map<number, FootprintBar>();
  for (const fb of footprint) fpByTime.set(fb.time, fb);

  candles.forEach((c, i) => {
    const fb = fpByTime.get(c.time);
    const volume = fb ? fb.totalVol : (c.volume > 0 ? c.volume : 0);
    if (volume <= 0) return;
    const delta = fb ? fb.delta : (deltas[i] ?? estimateDeltaFromOHLCV(c));
    const range = c.high - c.low;
    const body = Math.abs(c.close - c.open);
    const bodyRatio = range > 0 ? body / range : 1;     // small ⇒ price stalled
    const deltaRatio = volume > 0 ? delta / volume : 0;  // signed, ~[-1,1]
    const volRatio = volume / avgVol;

    // Above-average participation + clearly one-sided + price didn't progress
    // (or closed against the dominant flow) = absorption.
    const stalled = bodyRatio <= 0.5 || Math.sign(delta) !== Math.sign(c.close - c.open);
    if (volRatio < 1.25 || Math.abs(deltaRatio) < 0.22 || !stalled) return;

    const type: AbsorptionEvent["type"] = delta < 0 ? "bullish" : "bearish";
    // Defended level: bid absorption holds the low, ask absorption caps the high.
    const price = real && fb
      ? pocOfBar(fb) ?? (type === "bullish" ? c.low : c.high)
      : (type === "bullish" ? c.low : c.high);

    const strength = Math.min(1,
      (Math.min(volRatio, 3) - 1) / 2 * 0.45 +
      Math.min(1, Math.abs(deltaRatio) / 0.6) * 0.4 +
      (1 - Math.min(1, bodyRatio)) * 0.15);

    events.push({ barIndex: i, time: c.time, price, type, delta, volume, strength, real });
  });

  return events;
}

function pocOfBar(fb: FootprintBar): number | null {
  let poc: number | null = null, max = -1;
  for (const cell of fb.cells) {
    const t = cell.buy + cell.sell;
    if (t > max) { max = t; poc = cell.price; }
  }
  return poc;
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
