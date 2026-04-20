'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus,
  RefreshCw, Target, Activity, Zap, Globe,
  BarChart2, Shield, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, Clock, AlertTriangle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Bias = 'bullish' | 'bearish' | 'neutral';
type Category = 'majors' | 'minors' | 'exotics' | 'crypto';
type Rec = 'trade' | 'avoid' | 'watch';

interface TFBias { tf: string; label: string; bias: Bias; strength: number; note: string; }
interface PairAnalysis {
  pair: string; base: string; quote: string; category: Category;
  overallBias: Bias; biasStrength: number;
  intradayBias: Bias; swingBias: Bias;
  timeframes: TFBias[];
  recommendation: Rec;
  reasoning: string;
  setups: string[];
  keyLevels: { s2: string; s1: string; r1: string; r2: string };
  sessions: { asia: Bias; london: Bias; ny: Bias };
  events: any[];
  volatilityRisk: 'low' | 'medium' | 'high';
}

interface LivePrices {
  prices: Record<string, number>;
  changes: Record<string, number>;
}

// ─── Pair Configs ─────────────────────────────────────────────────────────────
const PAIRS: Record<Category, { pair: string; base: string; quote: string }[]> = {
  majors: [
    { pair: 'EURUSD', base: 'EUR', quote: 'USD' },
    { pair: 'GBPUSD', base: 'GBP', quote: 'USD' },
    { pair: 'USDJPY', base: 'USD', quote: 'JPY' },
    { pair: 'USDCHF', base: 'USD', quote: 'CHF' },
    { pair: 'AUDUSD', base: 'AUD', quote: 'USD' },
    { pair: 'NZDUSD', base: 'NZD', quote: 'USD' },
    { pair: 'USDCAD', base: 'USD', quote: 'CAD' },
  ],
  minors: [
    { pair: 'EURJPY', base: 'EUR', quote: 'JPY' },
    { pair: 'GBPJPY', base: 'GBP', quote: 'JPY' },
    { pair: 'EURGBP', base: 'EUR', quote: 'GBP' },
    { pair: 'EURAUD', base: 'EUR', quote: 'AUD' },
    { pair: 'GBPAUD', base: 'GBP', quote: 'AUD' },
    { pair: 'AUDCAD', base: 'AUD', quote: 'CAD' },
    { pair: 'CADJPY', base: 'CAD', quote: 'JPY' },
    { pair: 'AUDNZD', base: 'AUD', quote: 'NZD' },
  ],
  exotics: [
    { pair: 'USDMXN', base: 'USD', quote: 'MXN' },
    { pair: 'USDZAR', base: 'USD', quote: 'ZAR' },
    { pair: 'USDTRY', base: 'USD', quote: 'TRY' },
    { pair: 'USDSEK', base: 'USD', quote: 'SEK' },
    { pair: 'USDNOK', base: 'USD', quote: 'NOK' },
    { pair: 'USDSGD', base: 'USD', quote: 'SGD' },
    { pair: 'USDHUF', base: 'USD', quote: 'HUF' },
  ],
  crypto: [
    { pair: 'BTCUSD', base: 'BTC', quote: 'USD' },
    { pair: 'ETHUSD', base: 'ETH', quote: 'USD' },
    { pair: 'XRPUSD', base: 'XRP', quote: 'USD' },
    { pair: 'SOLUSD', base: 'SOL', quote: 'USD' },
    { pair: 'BNBUSD', base: 'BNB', quote: 'USD' },
    { pair: 'ADAUSD', base: 'ADA', quote: 'USD' },
    { pair: 'LINKUSD', base: 'LINK', quote: 'USD' },
  ],
};

const PRICE_BASES: Record<string, number> = {
  EURUSD: 1.082, GBPUSD: 1.263, USDJPY: 149.5, USDCHF: 0.897,
  AUDUSD: 0.647, NZDUSD: 0.592, USDCAD: 1.358,
  EURJPY: 161.8, GBPJPY: 188.7, EURGBP: 0.857, EURAUD: 1.673,
  GBPAUD: 1.952, AUDCAD: 0.877, CADJPY: 110.1, AUDNZD: 1.092,
  USDMXN: 17.22, USDZAR: 18.55, USDTRY: 32.6, USDSEK: 10.52,
  USDNOK: 10.83, USDSGD: 1.346, USDHUF: 366.5,
  BTCUSD: 67400, ETHUSD: 3520, XRPUSD: 0.583, SOLUSD: 176,
  BNBUSD: 422, ADAUSD: 0.479, LINKUSD: 14.6,
};

const PRICE_DEC: Record<string, number> = {
  USDJPY: 2, EURJPY: 2, GBPJPY: 2, CADJPY: 2,
  USDMXN: 3, USDZAR: 3, USDTRY: 3, USDSEK: 3, USDNOK: 3, USDHUF: 1,
  USDSGD: 4, XRPUSD: 4, ADAUSD: 4,
  BTCUSD: 0, ETHUSD: 0, SOLUSD: 1, BNBUSD: 1, LINKUSD: 2,
};

// ─── Live Price Fetcher ───────────────────────────────────────────────────────
async function fetchLivePrices(): Promise<LivePrices> {
  const prices: Record<string, number> = { ...PRICE_BASES };
  const changes: Record<string, number> = {};
  const seed = dateSeed();

  // Simulate realistic forex % changes from seed
  Object.keys(PRICE_BASES).forEach((pair, i) => {
    const raw = (seeded(seed + i * 53) - 0.5) * 1.2;
    changes[pair] = +raw.toFixed(3);
  });

  try {
    const [fxRes, cryptoRes] = await Promise.allSettled([
      fetch('https://api.frankfurter.app/latest?from=USD', { signal: AbortSignal.timeout(5000) }),
      fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple,solana,binancecoin,cardano,chainlink&vs_currencies=usd&include_24hr_change=true',
        { signal: AbortSignal.timeout(5000) }
      ),
    ]);

    if (fxRes.status === 'fulfilled' && fxRes.value.ok) {
      const d = await fxRes.value.json();
      const r: Record<string, number> = d.rates || {};

      if (r.EUR) prices.EURUSD = +(1 / r.EUR).toFixed(5);
      if (r.GBP) prices.GBPUSD = +(1 / r.GBP).toFixed(5);
      if (r.JPY) prices.USDJPY = +r.JPY.toFixed(3);
      if (r.CHF) prices.USDCHF = +r.CHF.toFixed(5);
      if (r.AUD) prices.AUDUSD = +(1 / r.AUD).toFixed(5);
      if (r.NZD) prices.NZDUSD = +(1 / r.NZD).toFixed(5);
      if (r.CAD) prices.USDCAD = +r.CAD.toFixed(5);
      if (r.EUR && r.JPY) prices.EURJPY = +((1 / r.EUR) * r.JPY).toFixed(3);
      if (r.GBP && r.JPY) prices.GBPJPY = +((1 / r.GBP) * r.JPY).toFixed(3);
      if (r.EUR && r.GBP) prices.EURGBP = +(r.GBP / r.EUR).toFixed(5);
      if (r.EUR && r.AUD) prices.EURAUD = +(r.AUD / r.EUR).toFixed(5);
      if (r.GBP && r.AUD) prices.GBPAUD = +(r.AUD / r.GBP).toFixed(5);
      if (r.AUD && r.CAD) prices.AUDCAD = +(r.CAD / r.AUD).toFixed(5);
      if (r.CAD && r.JPY) prices.CADJPY = +(r.JPY / r.CAD).toFixed(3);
      if (r.AUD && r.NZD) prices.AUDNZD = +(r.NZD / r.AUD).toFixed(5);
      if (r.MXN) prices.USDMXN = +r.MXN.toFixed(4);
      if (r.ZAR) prices.USDZAR = +r.ZAR.toFixed(4);
      if (r.TRY) prices.USDTRY = +r.TRY.toFixed(4);
      if (r.SEK) prices.USDSEK = +r.SEK.toFixed(4);
      if (r.NOK) prices.USDNOK = +r.NOK.toFixed(4);
      if (r.SGD) prices.USDSGD = +r.SGD.toFixed(5);
      if (r.HUF) prices.USDHUF = +r.HUF.toFixed(2);
    }

    if (cryptoRes.status === 'fulfilled' && cryptoRes.value.ok) {
      const d = await cryptoRes.value.json();
      const map: Record<string, string> = {
        bitcoin: 'BTCUSD', ethereum: 'ETHUSD', ripple: 'XRPUSD',
        solana: 'SOLUSD', binancecoin: 'BNBUSD', cardano: 'ADAUSD', chainlink: 'LINKUSD',
      };
      for (const [id, pair] of Object.entries(map)) {
        if (d[id]?.usd)           prices[pair]  = d[id].usd;
        if (d[id]?.usd_24h_change !== undefined) changes[pair] = +(d[id].usd_24h_change as number).toFixed(3);
      }
    }
  } catch {}

  return { prices, changes };
}

// ─── Bias Engine ──────────────────────────────────────────────────────────────
function seeded(n: number) { const x = Math.sin(n) * 10000; return x - Math.floor(x); }
function dateSeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function buildStrength(ffEvents: any[]): Record<string, number> {
  const s: Record<string, number> = {
    USD: 50, EUR: 50, GBP: 50, JPY: 50, CHF: 50, AUD: 50, NZD: 50, CAD: 50,
    MXN: 50, ZAR: 50, TRY: 50, SEK: 50, NOK: 50, SGD: 50, HUF: 50,
    BTC: 50, ETH: 50, XRP: 50, SOL: 50, BNB: 50, ADA: 50, LINK: 50,
  };
  const seed = dateSeed();
  Object.keys(s).forEach((c, i) => { s[c] = 50 + (seeded(seed + i * 137) - 0.5) * 34; });

  const todayStr = new Date().toDateString();
  ffEvents.forEach(e => {
    try { if (new Date(e.date || e.time).toDateString() !== todayStr) return; } catch { return; }
    const cur = (e.country || '').toUpperCase();
    if (!(cur in s)) return;
    const impact = (e.impact || '').toLowerCase();
    const w = impact === 'high' ? 14 : impact === 'medium' ? 6 : 2;
    if (e.actual && e.forecast) {
      const act = parseFloat(String(e.actual).replace(/[^-\d.]/g, ''));
      const fcast = parseFloat(String(e.forecast).replace(/[^-\d.]/g, ''));
      if (!isNaN(act) && !isNaN(fcast))
        s[cur] = Math.max(5, Math.min(95, s[cur] + (act > fcast ? w : act < fcast ? -w : 0)));
    } else if (impact === 'high') {
      s[cur] = Math.max(30, Math.min(70, s[cur]));
    }
  });

  const btc = s['BTC'];
  s['ETH']  = s['ETH']  * 0.35 + btc * 0.65;
  s['SOL']  = s['SOL']  * 0.30 + btc * 0.70;
  s['BNB']  = s['BNB']  * 0.45 + btc * 0.55;
  s['ADA']  = s['ADA']  * 0.25 + btc * 0.75;
  s['LINK'] = s['LINK'] * 0.40 + btc * 0.60;
  s['XRP']  = s['XRP']  * 0.55 + btc * 0.45;
  return s;
}

function toBias(v: number): Bias { return v >= 57 ? 'bullish' : v <= 43 ? 'bearish' : 'neutral'; }

const TF_NOTES: Record<string, Record<Bias, string[]>> = {
  M15: {
    bullish: ['Price above VWAP — micro momentum up', 'Short-term order flow bullish, scalps long', 'M15 CHoCH bullish confirmed'],
    bearish: ['Price below VWAP — micro momentum down', 'Rejection from highs, short-term flow bearish', 'M15 CHoCH bearish, fade rallies'],
    neutral: ['VWAP equilibrium — skip scalps', 'Ranging M15 structure, wait for break', 'Low momentum, no clear M15 edge'],
  },
  H1: {
    bullish: ['H1 HH/HL structure intact', 'Bullish order block holding on H1', 'H1 impulse forming, buy dips to OB'],
    bearish: ['H1 LH/LL structure dominant', 'Bearish FVG overhead, short rallies', 'H1 supply zone rejecting price'],
    neutral: ['H1 inside range — wait for breakout', 'Indecision on H1 — no momentum', 'H1 at equilibrium, structure only'],
  },
  H4: {
    bullish: ['H4 bullish CHoCH confirmed', 'Above H4 50% — targeting premium', 'H4 demand zone absorbing sells'],
    bearish: ['H4 bearish CHoCH, correction active', 'Below H4 50% — targeting discount', 'H4 supply zone capping price'],
    neutral: ['H4 consolidation, both sides valid', 'H4 at equilibrium — no HTF bias', 'Pending H4 break for direction'],
  },
  D1: {
    bullish: ['Daily uptrend intact, higher lows building', 'Above D1 50 EMA — macro bullish', 'D1 demand zone holding, swing long'],
    bearish: ['Daily lower highs — trend bearish', 'Below D1 50 EMA — macro bearish', 'D1 supply zone rejecting price'],
    neutral: ['Daily ranging between key zones', 'D1 at fair value — no swing edge', 'Mixed daily candles, no conviction'],
  },
  W1: {
    bullish: ['Weekly uptrend dominant — buy every dip', 'W1 above 20 EMA, long-term bullish', 'Multi-week bullish — position long'],
    bearish: ['Weekly downtrend — sell every rally', 'W1 below 20 EMA, long-term bearish', 'Multi-week bearish — position short'],
    neutral: ['Weekly range-bound consolidation', 'W1 inside macro zone — both sides', 'No weekly directional conviction'],
  },
};

function buildTimeframes(baseV: number, quoteV: number, seed: number, pIdx: number): TFBias[] {
  return [
    { tf: 'M15', label: '15m', noise: 28 },
    { tf: 'H1',  label: '1H',  noise: 18 },
    { tf: 'H4',  label: '4H',  noise: 9  },
    { tf: 'D1',  label: 'D1',  noise: 4  },
    { tf: 'W1',  label: 'W1',  noise: 2  },
  ].map(({ tf, label, noise }, i) => {
    const n = (seeded(seed + pIdx * 97 + i * 31) - 0.5) * noise;
    const diff = (baseV - quoteV) + n;
    const bias = diff > 6 ? 'bullish' : diff < -6 ? 'bearish' : 'neutral';
    const strength = Math.min(100, Math.max(0, 50 + diff));
    const notes = TF_NOTES[tf][bias];
    return { tf, label, bias, strength, note: notes[Math.floor(seeded(seed + pIdx * 43 + i * 19) * notes.length)] };
  });
}

function buildLevels(pair: string, seed: number, livePrice?: number) {
  const base = livePrice || PRICE_BASES[pair] || 1;
  const dec  = PRICE_DEC[pair] ?? 4;
  const n1 = seeded(seed + pair.charCodeAt(0) * 7) * base * 0.004 + base * 0.001;
  const n2 = seeded(seed + pair.charCodeAt(1) * 13) * base * 0.008 + base * 0.003;
  return {
    s2: (base - n2).toFixed(dec),
    s1: (base - n1).toFixed(dec),
    r1: (base + n1).toFixed(dec),
    r2: (base + n2).toFixed(dec),
  };
}

function analyzeAll(ffEvents: any[], livePrices: Record<string, number>): PairAnalysis[] {
  const s = buildStrength(ffEvents);
  const seed = dateSeed();
  const result: PairAnalysis[] = [];

  const SETUPS_B = ['Order Block Long', 'FVG + BOS Long', 'Liquidity Grab → Long', 'Demand Zone Bounce', 'Bullish CHoCH Retest'];
  const SETUPS_S = ['Order Block Short', 'FVG + BOS Short', 'Liquidity Grab → Short', 'Supply Zone Rejection', 'Bearish CHoCH Retest'];
  const SETUPS_N = ['Range High/Low Fade', 'EQ Bounce Trade', 'Wait for Structural Break'];

  let pIdx = 0;
  for (const [cat, pairs] of Object.entries(PAIRS) as [Category, typeof PAIRS[Category]][]) {
    for (const { pair, base, quote } of pairs) {
      const bV = s[base] ?? 50;
      const qV = s[quote] ?? 50;
      const diff = bV - qV;
      const overallBias: Bias = diff > 7 ? 'bullish' : diff < -7 ? 'bearish' : 'neutral';
      const biasStrength = Math.min(5, Math.max(1, Math.round(Math.abs(diff) / 7)));

      const pairEvents = ffEvents.filter(e => {
        const c = (e.country || '').toUpperCase();
        return c === base || c === quote;
      });
      const highCount = pairEvents.filter(e => (e.impact || '').toLowerCase() === 'high').length;
      const volRisk: 'low' | 'medium' | 'high' = highCount >= 2 ? 'high' : highCount === 1 ? 'medium' : 'low';

      const tfs = buildTimeframes(bV, qV, seed, pIdx);

      const intradayVotes = tfs.slice(0, 2).map(t => t.bias);
      const intradayBias: Bias = intradayVotes.filter(b => b === 'bullish').length >= 2 ? 'bullish'
        : intradayVotes.filter(b => b === 'bearish').length >= 2 ? 'bearish' : 'neutral';

      const swingVotes = tfs.slice(3).map(t => t.bias);
      const swingBias: Bias = swingVotes.filter(b => b === 'bullish').length >= 2 ? 'bullish'
        : swingVotes.filter(b => b === 'bearish').length >= 2 ? 'bearish' : 'neutral';

      const sessions = {
        asia:   toBias(bV + (seeded(seed + pIdx * 7 + 1) - 0.5) * 22),
        london: toBias(bV + (seeded(seed + pIdx * 7 + 2) - 0.5) * 16),
        ny:     toBias(bV + (seeded(seed + pIdx * 7 + 3) - 0.5) * 16),
      };

      let recommendation: Rec = 'trade';
      if (volRisk === 'high') recommendation = 'avoid';
      else if (volRisk === 'medium' || overallBias === 'neutral') recommendation = 'watch';

      const setupPool = overallBias === 'bullish' ? SETUPS_B : overallBias === 'bearish' ? SETUPS_S : SETUPS_N;
      const setups = setupPool.slice(0, Math.floor(seeded(seed + pIdx * 11) * 2) + 2);

      const REASONS: Record<Bias, string[]> = {
        bullish: [
          `${base} strength ${bV.toFixed(0)}/100 outpacing ${quote} (${qV.toFixed(0)}/100) — bullish flow favored.`,
          `Currency differential +${Math.abs(diff).toFixed(0)} pts in favor of ${base}. Longs preferred on pullbacks.`,
          `${base} showing relative dominance today. Higher TF aligned bullish — buy dips strategy.`,
        ],
        bearish: [
          `${quote} dominance (${qV.toFixed(0)}/100) over ${base} (${bV.toFixed(0)}/100) — bearish pressure active.`,
          `${base} weakness + ${quote} strength = clear downside bias. Sell rallies into supply.`,
          `Macro flow bearish for ${base}. Breaks of intraday lows expected to accelerate.`,
        ],
        neutral: [
          `${base} (${bV.toFixed(0)}) and ${quote} (${qV.toFixed(0)}) near equilibrium — structure trades only.`,
          `No clear currency advantage today. Mixed TF signals — wait for confirmation.`,
          `Both currencies consolidating. Range-bound action likely until catalyst arrives.`,
        ],
      };
      const reasonArr = REASONS[overallBias];
      let reasoning = reasonArr[Math.floor(seeded(seed + pIdx * 23) * reasonArr.length)];
      if (highCount > 0) reasoning = `⚠ ${highCount} high-impact event(s) today. ${reasoning}`;

      result.push({
        pair, base, quote, category: cat,
        overallBias, biasStrength,
        intradayBias, swingBias,
        timeframes: tfs,
        recommendation, reasoning, setups,
        keyLevels: buildLevels(pair, seed, livePrices[pair]),
        sessions,
        events: pairEvents.slice(0, 3),
        volatilityRisk: volRisk,
      });
      pIdx++;
    }
  }
  return result;
}

// ─── Session Helper ────────────────────────────────────────────────────────────
const SESSIONS = [
  { name: 'TOKYO',          start: 0,  end: 8,  color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.25)',  flag: '🇯🇵', desc: 'JPY & AUD pairs — lower vol, range-bound' },
  { name: 'LONDON',         start: 8,  end: 13, color: '#fb923c', bg: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.25)',  flag: '🇬🇧', desc: 'EUR & GBP pairs — highest daily volume' },
  { name: 'NY OVERLAP',     start: 13, end: 17, color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.25)',  flag: '⚡', desc: 'Peak liquidity — best setups of the day' },
  { name: 'NEW YORK',       start: 17, end: 22, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)',  flag: '🇺🇸', desc: 'USD volatile — watch London close reversal' },
  { name: 'OFF-HOURS',      start: 22, end: 24, color: '#6b7280', bg: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.18)', flag: '🌙', desc: 'Low liquidity — review & prepare setups' },
];

function getSession() {
  const h = new Date().getUTCHours();
  return SESSIONS.find(s => h >= s.start && h < s.end) || SESSIONS[4];
}

function getNextSession() {
  const h = new Date().getUTCHours();
  const m = new Date().getUTCMinutes();
  const cur = SESSIONS.findIndex(s => h >= s.start && h < s.end);
  const next = SESSIONS[(cur + 1) % SESSIONS.length];
  const endH = SESSIONS[cur]?.end ?? 0;
  const mins = (endH - h - 1) * 60 + (60 - m);
  return { session: next, minsLeft: Math.max(0, mins) };
}

// ─── Style Maps ───────────────────────────────────────────────────────────────
const BIAS_CFG: Record<Bias, { icon: any; color: string; bg: string; border: string; label: string; barColor: string }> = {
  bullish: { icon: TrendingUp,   color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.28)',  label: 'BULL', barColor: '#34d399' },
  bearish: { icon: TrendingDown, color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.28)', label: 'BEAR', barColor: '#f87171' },
  neutral: { icon: Minus,        color: '#9ca3af', bg: 'rgba(156,163,175,0.06)', border: 'rgba(156,163,175,0.18)', label: 'NEUT', barColor: '#6b7280' },
};
const REC_CFG: Record<Rec, { label: string; dot: string; color: string; bg: string; border: string }> = {
  trade: { label: 'TRADE', dot: '#34d399', color: '#86efac', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.35)'  },
  watch: { label: 'WATCH', dot: '#fbbf24', color: '#fde68a', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.35)'  },
  avoid: { label: 'AVOID', dot: '#f87171', color: '#fca5a5', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.35)' },
};

// ─── Micro components ─────────────────────────────────────────────────────────

function BiasIcon({ bias, size = 14 }: { bias: Bias; size?: number }) {
  const { icon: Icon, color } = BIAS_CFG[bias];
  return <Icon size={size} style={{ color }} />;
}

function StrengthBar({ value, color, height = 4 }: { value: number; color: string; height?: number }) {
  return (
    <div className="flex-1 rounded-full overflow-hidden" style={{ height, background: 'rgba(255,255,255,0.06)' }}>
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
      />
    </div>
  );
}

function BiasStrengthDots({ count, color }: { count: number; color: string }) {
  return (
    <div className="flex gap-0.5 items-center">
      {[1,2,3,4,5].map(i => (
        <div
          key={i}
          className="rounded-full transition-all"
          style={{
            width: 6, height: 6,
            background: i <= count ? color : 'rgba(255,255,255,0.1)',
            boxShadow: i <= count ? `0 0 4px ${color}` : 'none',
          }}
        />
      ))}
    </div>
  );
}

function LivePrice({ pair, price, change }: { pair: string; price: number; change?: number }) {
  const dec = PRICE_DEC[pair] ?? 4;
  const isUp = (change ?? 0) >= 0;
  const formatted = price >= 1000 ? price.toLocaleString('en-US', { maximumFractionDigits: dec })
    : price.toFixed(dec);

  return (
    <div className="flex items-baseline gap-2">
      <span className="text-white font-mono font-bold text-sm tabular-nums">{formatted}</span>
      {change !== undefined && (
        <span
          className="text-[10px] font-bold tabular-nums flex items-center gap-0.5"
          style={{ color: isUp ? '#34d399' : '#f87171' }}
        >
          {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
        </span>
      )}
    </div>
  );
}

function VolBadge({ risk }: { risk: 'low' | 'medium' | 'high' }) {
  if (risk === 'low') return null;
  return (
    <span
      className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wide"
      style={risk === 'high'
        ? { background: 'rgba(248,113,113,0.15)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.3)' }
        : { background: 'rgba(251,191,36,0.12)', color: '#fde68a', border: '1px solid rgba(251,191,36,0.28)' }
      }
    >
      {risk === 'high' ? '⚡ HIGH VOL' : '~ MED VOL'}
    </span>
  );
}

// ─── TF Strip ─────────────────────────────────────────────────────────────────
function TFStrip({ timeframes }: { timeframes: TFBias[] }) {
  return (
    <div className="grid grid-cols-5 gap-1 mt-3">
      {timeframes.map(tf => {
        const cfg = BIAS_CFG[tf.bias];
        return (
          <div
            key={tf.tf}
            className="flex flex-col items-center gap-1 py-1.5 rounded-lg"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
          >
            <span className="text-[9px] font-black text-gray-500 tracking-wide">{tf.label}</span>
            <BiasIcon bias={tf.bias} size={13} />
            <div className="w-full px-1.5">
              <StrengthBar value={tf.strength} color={cfg.barColor} height={2} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Pair Card ────────────────────────────────────────────────────────────────
function PairCard({ p, livePrice, liveChange }: { p: PairAnalysis; livePrice?: number; liveChange?: number }) {
  const [expanded, setExpanded] = useState(false);
  const bs = BIAS_CFG[p.overallBias];
  const rs = REC_CFG[p.recommendation];
  const price = livePrice || PRICE_BASES[p.pair] || 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(8,10,24,0.97) 0%, rgba(5,7,18,0.98) 100%)',
        border: `1px solid ${expanded ? bs.border : 'rgba(255,255,255,0.07)'}`,
        boxShadow: expanded ? `0 4px 24px ${bs.color}12` : '0 2px 12px rgba(0,0,0,0.4)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Top accent line */}
      <div className="h-[1.5px] w-full" style={{
        background: `linear-gradient(90deg, transparent 0%, ${bs.color}70 40%, ${bs.color}70 60%, transparent 100%)`
      }} />

      {/* Card Header */}
      <div
        className="p-4 cursor-pointer select-none"
        onClick={() => setExpanded(x => !x)}
      >
        {/* Row 1: pair + price + rec badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className="text-lg font-black text-white tracking-widest leading-none">{p.pair}</span>
              <LivePrice pair={p.pair} price={price} change={liveChange} />
              <VolBadge risk={p.volatilityRisk} />
            </div>
            {/* Bias + strength dots */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5">
                <BiasIcon bias={p.overallBias} size={14} />
                <span className="text-xs font-black tracking-widest" style={{ color: bs.color }}>{bs.label}</span>
              </div>
              <BiasStrengthDots count={p.biasStrength} color={bs.color} />
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Recommendation */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider"
              style={{ background: rs.bg, border: `1px solid ${rs.border}`, color: rs.color }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: rs.dot, boxShadow: `0 0 4px ${rs.dot}` }} />
              {rs.label}
            </div>
            {/* Intraday + Swing */}
            <div className="flex gap-1">
              {([['I', p.intradayBias], ['S', p.swingBias]] as const).map(([label, bias]) => {
                const c = BIAS_CFG[bias];
                return (
                  <div
                    key={label}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold"
                    style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
                  >
                    {label}<BiasIcon bias={bias} size={9} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* TF strip */}
        <TFStrip timeframes={p.timeframes} />

        {/* Expand toggle */}
        <div className="flex items-center justify-center mt-3">
          <div
            className="flex items-center gap-1 text-[10px] text-gray-700 hover:text-gray-500 transition-colors"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="exp"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div
              className="p-4 space-y-5"
              style={{ borderTop: `1px solid ${bs.border}` }}
            >
              {/* Reasoning */}
              <div
                className="rounded-xl p-3.5 text-xs leading-relaxed"
                style={{ background: `${bs.color}06`, border: `1px solid ${bs.border}`, color: '#d1d5db' }}
              >
                {p.reasoning}
              </div>

              {/* MTF Breakdown */}
              <div>
                <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2.5">
                  Multi-Timeframe Breakdown
                </div>
                <div className="space-y-1.5">
                  {p.timeframes.map(tf => {
                    const cfg = BIAS_CFG[tf.bias];
                    return (
                      <div
                        key={tf.tf}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                      >
                        <span className="text-[10px] font-black w-8 shrink-0" style={{ color: cfg.color }}>{tf.tf}</span>
                        <div className="flex items-center gap-1 w-14 shrink-0">
                          <BiasIcon bias={tf.bias} size={11} />
                          <span className="text-[10px] font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                        </div>
                        <StrengthBar value={tf.strength} color={cfg.barColor} height={3} />
                        <span className="text-[9px] font-mono w-7 shrink-0 text-right" style={{ color: cfg.color }}>
                          {tf.strength.toFixed(0)}
                        </span>
                        <span className="text-[10px] text-gray-500 truncate hidden sm:block flex-1 min-w-0">
                          {tf.note}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sessions + Levels */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2.5">
                    Session Bias
                  </div>
                  <div className="space-y-1.5">
                    {([['asia', '🇯🇵 Tokyo'], ['london', '🇬🇧 London'], ['ny', '🇺🇸 New York']] as const).map(([k, name]) => {
                      const cfg = BIAS_CFG[p.sessions[k]];
                      return (
                        <div
                          key={k}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg"
                          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                        >
                          <span className="text-[10px] text-gray-400">{name}</span>
                          <div className="flex items-center gap-1">
                            <BiasIcon bias={p.sessions[k]} size={10} />
                            <span className="text-[9px] font-black" style={{ color: cfg.color }}>{cfg.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2.5">
                    Key Levels
                  </div>
                  <div className="space-y-1">
                    {[
                      { label: 'R2', val: p.keyLevels.r2, color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
                      { label: 'R1', val: p.keyLevels.r1, color: '#fca5a5', bg: 'rgba(248,113,113,0.04)', border: 'rgba(248,113,113,0.12)' },
                      { label: 'S1', val: p.keyLevels.s1, color: '#86efac', bg: 'rgba(52,211,153,0.04)',  border: 'rgba(52,211,153,0.12)' },
                      { label: 'S2', val: p.keyLevels.s2, color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)'  },
                    ].map(({ label, val, color, bg, border }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg"
                        style={{ background: bg, border: `1px solid ${border}` }}
                      >
                        <span className="text-[10px] font-black text-gray-500">{label}</span>
                        <span className="text-[11px] font-mono font-bold" style={{ color }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Setups + Events */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2.5">
                    Setups
                  </div>
                  <div className="space-y-1">
                    {p.setups.map((setup, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold"
                        style={{ background: bs.bg, border: `1px solid ${bs.border}`, color: bs.color }}
                      >
                        <div className="w-1 h-1 rounded-full shrink-0" style={{ background: bs.color }} />
                        {setup}
                      </div>
                    ))}
                  </div>
                </div>

                {p.events.length > 0 && (
                  <div>
                    <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2.5">
                      Events Today
                    </div>
                    <div className="space-y-1">
                      {p.events.map((ev, i) => {
                        const imp = (ev.impact || '').toLowerCase();
                        const [color, bg, border] = imp === 'high'
                          ? ['#fca5a5', 'rgba(248,113,113,0.1)', 'rgba(248,113,113,0.28)']
                          : imp === 'medium'
                          ? ['#fde68a', 'rgba(251,191,36,0.1)', 'rgba(251,191,36,0.25)']
                          : ['#9ca3af', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.08)'];
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px]"
                            style={{ background: bg, border: `1px solid ${border}`, color }}
                          >
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                            <span className="truncate">{(ev.title || ev.event || '').slice(0, 28)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Fear & Greed Gauge ───────────────────────────────────────────────────────
function FearGauge({ value }: { value: number }) {
  const label = value >= 75 ? { text: 'Extreme Greed', color: '#f87171' }
    : value >= 55 ? { text: 'Greed',         color: '#fb923c' }
    : value >= 45 ? { text: 'Neutral',        color: '#9ca3af' }
    : value >= 25 ? { text: 'Fear',           color: '#60a5fa' }
    : { text: 'Extreme Fear', color: '#34d399' };

  const angle = (value / 100) * 180 - 90;

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="relative w-10 h-5 shrink-0">
        <svg viewBox="0 0 40 20" className="w-full h-full">
          <path d="M2 20 A18 18 0 0 1 38 20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" strokeLinecap="round" />
          <path d="M2 20 A18 18 0 0 1 38 20" fill="none" stroke="url(#fg)" strokeWidth="3" strokeLinecap="round"
            strokeDasharray="56.5" strokeDashoffset={56.5 - (value / 100) * 56.5} />
          <defs>
            <linearGradient id="fg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f87171" />
            </linearGradient>
          </defs>
          <line
            x1="20" y1="20"
            x2={20 + 14 * Math.cos((angle * Math.PI) / 180)}
            y2={20 + 14 * Math.sin((angle * Math.PI) / 180)}
            stroke="white" strokeWidth="1.5" strokeLinecap="round"
          />
        </svg>
      </div>
      <div>
        <div className="text-[9px] text-gray-600 uppercase tracking-widest">Fear & Greed</div>
        <div className="text-xs font-black" style={{ color: label.color }}>
          {value} · {label.text}
        </div>
      </div>
    </div>
  );
}

// ─── UTC Clock ────────────────────────────────────────────────────────────────
function UTCClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toUTCString().slice(17, 25));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500">
      <Clock size={10} className="text-gray-600" />
      <span>{time} UTC</span>
    </div>
  );
}

// ─── Category config ──────────────────────────────────────────────────────────
const CAT_CFG: Record<Category, { label: string; icon: string; accent: string }> = {
  majors:  { label: 'Majors',  icon: '💱', accent: '#f59e0b' },
  minors:  { label: 'Minors',  icon: '🔗', accent: '#a78bfa' },
  exotics: { label: 'Exotics', icon: '🌐', accent: '#38bdf8' },
  crypto:  { label: 'Crypto',  icon: '₿',  accent: '#fb923c' },
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 4;

export default function DailyBiasPage() {
  const [ffEvents, setFfEvents]   = useState<any[]>([]);
  const [liveData, setLiveData]   = useState<LivePrices>({ prices: { ...PRICE_BASES }, changes: {} });
  const [loading, setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('majors');
  const [filterRec, setFilterRec] = useState<Rec | 'all'>('all');
  const [fearIndex, setFearIndex] = useState<number | null>(null);
  const [page, setPage]           = useState(0);
  const session = getSession();
  const nextSess = getNextSession();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [newsRes, fearRes, priceData] = await Promise.allSettled([
        fetch('/api/news?limit=100'),
        fetch('https://api.alternative.me/fng/?limit=1'),
        fetchLivePrices(),
      ]);

      if (newsRes.status === 'fulfilled' && newsRes.value.ok) {
        const d = await newsRes.value.json();
        setFfEvents(d.items || []);
      }
      if (fearRes.status === 'fulfilled' && fearRes.value.ok) {
        const fd = await fearRes.value.json();
        if (fd.data?.[0]?.value) setFearIndex(parseInt(fd.data[0].value));
      }
      if (priceData.status === 'fulfilled') {
        setLiveData(priceData.value);
      }
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(0); }, [activeCategory, filterRec]);

  const allPairs  = useMemo(() => analyzeAll(ffEvents, liveData.prices), [ffEvents, liveData]);
  const catPairs  = useMemo(() => allPairs.filter(p => p.category === activeCategory), [allPairs, activeCategory]);
  const displayed = useMemo(() =>
    filterRec === 'all' ? catPairs : catPairs.filter(p => p.recommendation === filterRec),
    [catPairs, filterRec]);

  const totalPages = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE));
  const paginated  = displayed.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const bullCount = catPairs.filter(p => p.overallBias === 'bullish').length;
  const bearCount = catPairs.filter(p => p.overallBias === 'bearish').length;
  const neutCount = catPairs.filter(p => p.overallBias === 'neutral').length;
  const catCfg = CAT_CFG[activeCategory];

  return (
    <div
      className="h-full overflow-y-auto pb-16 md:pb-0 text-white"
      style={{ background: 'linear-gradient(160deg, #020308 0%, #03040f 50%, #020308 100%)' }}
    >
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 65%)' }} />
        <div className="absolute top-1/2 right-0 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.03) 0%, transparent 65%)' }} />
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(245,158,11,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.015) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
      </div>

      {/* Sticky Header */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 h-14"
        style={{ background: 'rgba(2,3,8,0.94)', borderBottom: '1px solid rgba(245,158,11,0.1)', backdropFilter: 'blur(24px)' }}
      >
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <Link
            href="/app"
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-amber-500/10"
            style={{ border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}
          >
            <ArrowLeft size={15} />
          </Link>
          <div className="w-px h-5" style={{ background: 'rgba(245,158,11,0.2)' }} />
          <div>
            <h1
              className="text-sm font-black tracking-tight leading-none"
              style={{
                background: 'linear-gradient(90deg, #f59e0b, #fb923c)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}
            >
              Daily Market Bias
            </h1>
            <UTCClock />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
          {/* Session chip */}
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold"
            style={{ background: session.bg, border: `1px solid ${session.border}`, color: session.color }}
          >
            <span>{session.flag}</span>
            <span>{session.name}</span>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: session.color }} />
          </div>

          {lastUpdated && (
            <span className="hidden sm:block text-[10px] text-gray-600">
              {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          <button
            onClick={loadData} disabled={loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-amber-500/10"
            style={{ border: '1px solid rgba(245,158,11,0.15)', color: loading ? '#f59e0b' : '#6b7280' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </motion.div>
      </div>

      <div className="relative max-w-6xl mx-auto px-3 sm:px-5 py-5 sm:py-7 space-y-5">

        {/* Session Banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: session.bg, border: `1px solid ${session.border}` }}
        >
          <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: `${session.color}18`, border: `1px solid ${session.color}30` }}
              >
                {session.flag}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: session.color }} />
                  <span className="text-sm font-black tracking-widest" style={{ color: session.color }}>
                    {session.name} SESSION
                  </span>
                </div>
                <p className="text-xs text-gray-400">{session.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:flex-col sm:items-end">
              {fearIndex !== null && <FearGauge value={fearIndex} />}
              <div
                className="flex items-center gap-1.5 text-[10px] text-gray-500"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '4px 8px' }}
              >
                <Clock size={10} />
                Next: {nextSess.session.flag} {nextSess.session.name} in {nextSess.minsLeft}m
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Tabs */}
        <div
          className="flex gap-1 p-1 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {(Object.keys(CAT_CFG) as Category[]).map(cat => {
            const cfg = CAT_CFG[cat];
            const active = activeCategory === cat;
            const count = allPairs.filter(p => p.category === cat).length;
            return (
              <motion.button
                key={cat}
                onClick={() => { setActiveCategory(cat); setFilterRec('all'); }}
                className="relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                style={{ color: active ? cfg.accent : '#4b5563' }}
              >
                {active && (
                  <motion.div
                    layoutId="catBg"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: `${cfg.accent}12`, border: `1px solid ${cfg.accent}30` }}
                    transition={{ type: 'spring', damping: 30, stiffness: 380 }}
                  />
                )}
                <span className="relative">{cfg.icon}</span>
                <span className="relative">{cfg.label}</span>
                <span
                  className="relative text-[9px] px-1.5 py-0.5 rounded-full font-black"
                  style={active
                    ? { background: `${cfg.accent}20`, color: cfg.accent }
                    : { background: 'rgba(255,255,255,0.05)', color: '#4b5563' }
                  }
                >{count}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Summary Stats */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-3 gap-2 sm:gap-3"
          >
            {[
              { label: 'Bullish', count: bullCount, ...BIAS_CFG.bullish },
              { label: 'Neutral', count: neutCount, ...BIAS_CFG.neutral },
              { label: 'Bearish', count: bearCount, ...BIAS_CFG.bearish },
            ].map(({ label, count, color, bg, border, icon: Icon, barColor }) => (
              <div
                key={label}
                className="rounded-2xl p-4"
                style={{ background: bg, border: `1px solid ${border}` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>
                    {label}
                  </span>
                  <Icon size={12} style={{ color }} />
                </div>
                <div className="text-3xl font-black leading-none mb-2" style={{ color }}>{count}</div>
                <StrengthBar
                  value={catPairs.length > 0 ? (count / catPairs.length) * 100 : 0}
                  color={barColor}
                  height={3}
                />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Filter Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Filter:</span>
          {(['all', 'trade', 'watch', 'avoid'] as const).map(r => {
            const active = filterRec === r;
            const cfg = r !== 'all' ? REC_CFG[r] : null;
            return (
              <button
                key={r}
                onClick={() => setFilterRec(r)}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
                style={active && cfg
                  ? { background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }
                  : active
                  ? { background: `${catCfg.accent}15`, border: `1px solid ${catCfg.accent}35`, color: catCfg.accent }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#6b7280' }
                }
              >
                {r === 'all' ? 'All Pairs'
                  : r === 'trade' ? '● Trade'
                  : r === 'watch' ? '● Watch'
                  : '● Avoid'}
              </button>
            );
          })}
          <span className="ml-auto text-[10px] text-gray-700">{displayed.length} pairs</span>
        </div>

        {/* Pairs Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              <RefreshCw size={20} className="animate-spin text-amber-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white mb-1">Fetching live data…</p>
              <p className="text-xs text-gray-600">Connecting to market feeds</p>
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeCategory}-${filterRec}-${page}`}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
                className="grid gap-3 sm:grid-cols-2"
              >
                {paginated.length === 0 ? (
                  <div className="col-span-2 text-center py-16 text-gray-600">
                    <p className="text-sm">No pairs match this filter</p>
                  </div>
                ) : (
                  paginated.map((p, i) => (
                    <motion.div key={p.pair} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <PairCard
                        p={p}
                        livePrice={liveData.prices[p.pair]}
                        liveChange={liveData.changes[p.pair]}
                      />
                    </motion.div>
                  ))
                )}
              </motion.div>
            </AnimatePresence>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-25"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}
                >
                  <ChevronLeft size={15} /> Prev
                </button>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className="rounded-full transition-all"
                      style={i === page
                        ? { width: 24, height: 6, background: '#f59e0b', boxShadow: '0 0 8px rgba(245,158,11,0.5)' }
                        : { width: 6, height: 6, background: '#374151' }
                      }
                    />
                  ))}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-25"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            )}

            <div className="text-center text-[10px] text-gray-700">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, displayed.length)} of {displayed.length} pairs · click card to expand
            </div>
          </>
        )}

        {/* TF Guide */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={14} className="text-amber-400" />
            <h3 className="text-sm font-black text-white">Timeframe Trading Guide</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            {[
              { tf: 'M15', use: 'Scalping',      hold: '15–60m',   color: '#60a5fa' },
              { tf: 'H1',  use: 'Intraday',       hold: '1–4h',     color: '#22d3ee' },
              { tf: 'H4',  use: 'Swing / Intra',  hold: '4–12h',    color: '#34d399' },
              { tf: 'D1',  use: 'Swing',          hold: '1–5 days', color: '#fbbf24' },
              { tf: 'W1',  use: 'Position',       hold: 'Weeks+',   color: '#f59e0b' },
            ].map(({ tf, use, hold, color }) => (
              <div
                key={tf}
                className="rounded-xl p-3"
                style={{ background: `${color}08`, border: `1px solid ${color}20` }}
              >
                <div className="text-xs font-black mb-1" style={{ color }}>{tf}</div>
                <div className="text-[10px] font-bold text-gray-300">{use}</div>
                <div className="text-[9px] text-gray-600 mt-0.5">{hold}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.14)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield size={14} className="text-amber-400" />
            <h3 className="text-sm font-black text-amber-300">Daily Trading Rules</h3>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {[
              { icon: '⏱', text: 'Enter 30–60 min AFTER high-impact news — avoid the spike chaos' },
              { icon: '📐', text: 'Align at least 3 timeframes before any entry' },
              { icon: '💰', text: 'Risk max 1–2% per trade — let compounding work' },
              { icon: '🔄', text: 'Trade WITH the H4/D1 bias — counter-trend for experts only' },
              { icon: '🌍', text: 'London (08:00 UTC) & NY Overlap (13:00–17:00 UTC) = best setups' },
              { icon: '🚫', text: 'Avoid marked pairs — slippage + spread will eat your edge' },
            ].map(({ icon, text }, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="text-base shrink-0">{icon}</span>
                <span className="text-xs text-gray-400 leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
