'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus,
  Clock, RefreshCw, AlertTriangle, Target,
  Activity, ChevronDown, ChevronUp, Zap, Globe,
  BarChart2, Shield, Star, ChevronLeft, ChevronRight
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
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
      if (!isNaN(act) && !isNaN(fcast)) {
        s[cur] = Math.max(5, Math.min(95, s[cur] + (act > fcast ? w : act < fcast ? -w : 0)));
      }
    } else if (impact === 'high') {
      s[cur] = Math.max(30, Math.min(70, s[cur]));
    }
  });

  // Crypto correlation to BTC
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
    { tf: 'M15', label: '15 Min', noise: 28 },
    { tf: 'H1',  label: '1 Hour', noise: 18 },
    { tf: 'H4',  label: '4 Hour', noise: 9  },
    { tf: 'D1',  label: 'Daily',  noise: 4  },
    { tf: 'W1',  label: 'Weekly', noise: 2  },
  ].map(({ tf, label, noise }, i) => {
    const n = (seeded(seed + pIdx * 97 + i * 31) - 0.5) * noise;
    const diff = (baseV - quoteV) + n;
    const bias = diff > 6 ? 'bullish' : diff < -6 ? 'bearish' : 'neutral';
    const strength = Math.min(100, Math.max(0, 50 + diff));
    const notes = TF_NOTES[tf][bias];
    return { tf, label, bias, strength, note: notes[Math.floor(seeded(seed + pIdx * 43 + i * 19) * notes.length)] };
  });
}

function buildLevels(pair: string, seed: number) {
  const base = PRICE_BASES[pair] || 1;
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

function analyzeAll(ffEvents: any[]): PairAnalysis[] {
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
        keyLevels: buildLevels(pair, seed),
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
function getSession() {
  const h = new Date().getUTCHours();
  if (h >= 0  && h < 8)  return { name: 'TOKYO',              color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30',    desc: 'Asian session — JPY & AUD pairs most active, lower volatility' };
  if (h >= 8  && h < 13) return { name: 'LONDON',             color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', desc: 'London open — EUR & GBP pairs, highest volume of the day' };
  if (h >= 13 && h < 17) return { name: 'LONDON + NY OVERLAP',color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/30',desc: 'Power hour — peak liquidity, tightest spreads, best setups' };
  if (h >= 17 && h < 22) return { name: 'NEW YORK',           color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', desc: 'NY session — USD pairs volatile, watch for London close reversals' };
  return { name: 'OFF-HOURS', color: 'text-gray-500', bg: 'bg-gray-800/20 border-gray-700/30', desc: 'Low liquidity — prepare for next session, review setups' };
}

// ─── Style Maps ───────────────────────────────────────────────────────────────
const BIAS_STYLE: Record<Bias, { icon: any; color: string; bg: string; border: string; text: string; bar: string }> = {
  bullish: { icon: TrendingUp,   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'BULLISH', bar: 'bg-emerald-400' },
  bearish: { icon: TrendingDown, color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    text: 'BEARISH', bar: 'bg-rose-400'    },
  neutral: { icon: Minus,        color: 'text-gray-400',    bg: 'bg-gray-800/30',    border: 'border-gray-700/30',    text: 'NEUTRAL', bar: 'bg-gray-500'    },
};
const REC_STYLE: Record<Rec, { label: string; color: string; bg: string; border: string }> = {
  trade: { label: '✓ TRADE', color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40' },
  watch: { label: '◎ WATCH', color: 'text-yellow-300',  bg: 'bg-yellow-500/15',  border: 'border-yellow-500/40'  },
  avoid: { label: '✗ AVOID', color: 'text-rose-300',    bg: 'bg-rose-500/15',    border: 'border-rose-500/40'    },
};

function BiasIcon({ bias, size = 16 }: { bias: Bias; size?: number }) {
  const { icon: Icon, color } = BIAS_STYLE[bias];
  return <Icon size={size} className={color} />;
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={10} className={i <= count ? 'text-amber-400 fill-amber-400' : 'text-gray-700'} />
      ))}
    </div>
  );
}

// ─── Pair Card ────────────────────────────────────────────────────────────────
function PairCard({ p }: { p: PairAnalysis }) {
  const [expanded, setExpanded] = useState(false);
  const bs = BIAS_STYLE[p.overallBias];
  const rs = REC_STYLE[p.recommendation];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${bs.border} bg-[#0b0b0b] overflow-hidden`}
    >
      {/* Header — always visible */}
      <div className={`p-4 cursor-pointer select-none ${bs.bg}`} onClick={() => setExpanded(x => !x)}>
        <div className="flex items-start justify-between gap-2">
          {/* Left */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl font-black text-white tracking-wider">{p.pair}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${rs.bg} ${rs.border} ${rs.color}`}>
                {rs.label}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`flex items-center gap-1 text-xs font-bold ${bs.color}`}>
                <BiasIcon bias={p.overallBias} size={13} />
                {bs.text}
              </div>
              <Stars count={p.biasStrength} />
              {p.volatilityRisk !== 'low' && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.volatilityRisk === 'high' ? 'bg-rose-500/20 text-rose-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                  {p.volatilityRisk === 'high' ? '⚡ HIGH VOL' : '~ MED VOL'}
                </span>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <div className="flex gap-1.5">
              <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded ${BIAS_STYLE[p.intradayBias].bg} ${BIAS_STYLE[p.intradayBias].color}`}>
                <BiasIcon bias={p.intradayBias} size={10} />
                <span>Intraday</span>
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded ${BIAS_STYLE[p.swingBias].bg} ${BIAS_STYLE[p.swingBias].color}`}>
                <BiasIcon bias={p.swingBias} size={10} />
                <span>Swing</span>
              </div>
            </div>
            <span className="text-gray-700">
              {expanded ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
            </span>
          </div>
        </div>

        {/* TF strip */}
        <div className="mt-3 grid grid-cols-5 gap-1">
          {p.timeframes.map(tf => {
            const tbs = BIAS_STYLE[tf.bias];
            return (
              <div key={tf.tf} className={`rounded p-1.5 text-center border ${tbs.border} ${tbs.bg}`}>
                <div className="text-[9px] font-bold text-gray-500 mb-0.5">{tf.tf}</div>
                <div className="flex justify-center"><BiasIcon bias={tf.bias} size={12} /></div>
              </div>
            );
          })}
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
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 border-t border-gray-800/50">
              {/* Reasoning */}
              <p className="text-xs text-gray-300 bg-gray-900/50 rounded-lg p-3 border border-gray-800/40 leading-relaxed">
                {p.reasoning}
              </p>

              {/* Timeframe table */}
              <div>
                <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Multi-Timeframe Breakdown</div>
                <div className="space-y-1.5">
                  {p.timeframes.map(tf => {
                    const tbs = BIAS_STYLE[tf.bias];
                    return (
                      <div key={tf.tf} className={`grid items-center gap-2 rounded-lg px-2.5 py-2 border ${tbs.border} ${tbs.bg}`}
                        style={{ gridTemplateColumns: '40px 72px 1fr' }}>
                        <span className="text-[10px] font-black text-gray-400">{tf.tf}</span>
                        <div className={`flex items-center gap-1 text-[10px] font-bold ${tbs.color}`}>
                          <BiasIcon bias={tf.bias} size={11} />
                          {tbs.text}
                        </div>
                        <span className="text-[10px] text-gray-400 truncate">{tf.note}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sessions + Levels */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Session Bias</div>
                  <div className="space-y-1.5">
                    {([['asia','Tokyo'], ['london','London'], ['ny','New York']] as const).map(([k, name]) => {
                      const sb = BIAS_STYLE[p.sessions[k]];
                      return (
                        <div key={k} className={`flex items-center justify-between rounded px-2 py-1.5 border ${sb.border} ${sb.bg}`}>
                          <span className="text-[10px] text-gray-500">{name}</span>
                          <div className={`flex items-center gap-1 text-[10px] font-bold ${sb.color}`}>
                            <BiasIcon bias={p.sessions[k]} size={10} />{sb.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Key Levels</div>
                  <div className="space-y-1">
                    {[
                      { label: 'R2', val: p.keyLevels.r2, cls: 'border-rose-500/25 text-rose-300'    },
                      { label: 'R1', val: p.keyLevels.r1, cls: 'border-rose-500/15 text-rose-400/70'  },
                      { label: 'S1', val: p.keyLevels.s1, cls: 'border-emerald-500/15 text-emerald-400/70' },
                      { label: 'S2', val: p.keyLevels.s2, cls: 'border-emerald-500/25 text-emerald-300' },
                    ].map(({ label, val, cls }) => (
                      <div key={label} className={`flex justify-between px-2 py-1 rounded border ${cls} bg-black/20`}>
                        <span className="text-[10px] text-gray-500">{label}</span>
                        <span className={`text-[10px] font-mono font-bold ${cls.split(' ').find(c => c.startsWith('text-')) || ''}`}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Setups + Events */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Setups Available</div>
                  <div className="flex flex-col gap-1">
                    {p.setups.map((setup, i) => (
                      <span key={i} className={`text-[10px] font-semibold px-2 py-1 rounded border ${bs.border} ${bs.color} ${bs.bg}`}>
                        {setup}
                      </span>
                    ))}
                  </div>
                </div>
                {p.events.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Events Today</div>
                    <div className="space-y-1">
                      {p.events.map((ev, i) => {
                        const imp = (ev.impact || '').toLowerCase();
                        return (
                          <div key={i} className={`text-[10px] rounded px-2 py-1 border ${
                            imp === 'high' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                            : imp === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                            : 'bg-gray-800/30 border-gray-700/30 text-gray-400'}`}>
                            {imp === 'high' ? '🔴' : imp === 'medium' ? '🟡' : '🟢'}{' '}
                            {(ev.title || ev.event || '').slice(0, 30)}
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

// ─── Main Page ────────────────────────────────────────────────────────────────
const CAT_LABELS: Record<Category, string> = {
  majors: 'Forex Majors', minors: 'Forex Minors', exotics: 'Exotic Pairs', crypto: 'Crypto',
};
const CAT_ICONS: Record<Category, string> = {
  majors: '💱', minors: '🔗', exotics: '🌐', crypto: '₿',
};

export default function DailyBiasPage() {
  const [ffEvents, setFfEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('majors');
  const [filterRec, setFilterRec] = useState<Rec | 'all'>('all');
  const [fearIndex, setFearIndex] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 4;
  const session = getSession();

  const loadData = async () => {
    setLoading(true);
    try {
      const [newsRes, fearRes] = await Promise.allSettled([
        fetch('/api/news?limit=100'),
        fetch('https://api.alternative.me/fng/?limit=1'),
      ]);
      if (newsRes.status === 'fulfilled' && newsRes.value.ok) {
        const d = await newsRes.value.json();
        setFfEvents(d.items || []);
      }
      if (fearRes.status === 'fulfilled' && fearRes.value.ok) {
        const fd = await fearRes.value.json();
        if (fd.data?.[0]?.value) setFearIndex(parseInt(fd.data[0].value));
      }
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const allPairs  = useMemo(() => analyzeAll(ffEvents), [ffEvents]);
  const catPairs  = useMemo(() => allPairs.filter(p => p.category === activeCategory), [allPairs, activeCategory]);
  const displayed = useMemo(() =>
    filterRec === 'all' ? catPairs : catPairs.filter(p => p.recommendation === filterRec),
    [catPairs, filterRec]);

  const totalPages = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE));
  const paginated  = displayed.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  // Reset page when category or filter changes
  useEffect(() => { setPage(0); }, [activeCategory, filterRec]);

  const bullCount = catPairs.filter(p => p.overallBias === 'bullish').length;
  const bearCount = catPairs.filter(p => p.overallBias === 'bearish').length;
  const neutCount = catPairs.filter(p => p.overallBias === 'neutral').length;

  const fearLabel = fearIndex !== null
    ? fearIndex >= 75 ? { text: 'Extreme Greed', color: 'text-rose-400' }
    : fearIndex >= 55 ? { text: 'Greed',         color: 'text-orange-400' }
    : fearIndex >= 45 ? { text: 'Neutral',        color: 'text-gray-400'  }
    : fearIndex >= 25 ? { text: 'Fear',           color: 'text-blue-400'  }
    : { text: 'Extreme Fear', color: 'text-emerald-400' }
    : null;

  return (
    <div className="min-h-screen bg-[#050505] text-white">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#050505]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/app" className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
              <ArrowLeft size={18} className="text-gray-400" />
            </Link>
            <div>
              <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                Daily Market Bias
              </h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] text-gray-500">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
                {lastUpdated && (
                  <span className="text-[10px] text-gray-600">
                    · refreshed {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`hidden sm:flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-lg border ${session.bg}`}>
              <Activity size={11} className={session.color} />
              <span className={session.color}>{session.name}</span>
            </div>
            {fearLabel && (
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-gray-700/40 bg-gray-800/20">
                <span className="text-gray-600">F&G</span>
                <span className={fearLabel.color}>{fearIndex} · {fearLabel.text}</span>
              </div>
            )}
            <button onClick={loadData} disabled={loading}
              className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-white">
              <RefreshCw size={16} className={loading ? 'animate-spin text-orange-400' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-4 sm:space-y-5">

        {/* Session Banner */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border p-4 ${session.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${session.color.replace('text-','bg-')} animate-pulse`} />
            <span className={`font-black text-sm tracking-widest ${session.color}`}>{session.name}</span>
            <span className="text-gray-400 text-xs">{session.desc}</span>
          </div>
        </motion.div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(Object.keys(CAT_LABELS) as Category[]).map(cat => (
            <motion.button key={cat} whileTap={{ scale: 0.96 }}
              onClick={() => { setActiveCategory(cat); setFilterRec('all'); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
                activeCategory === cat
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                  : 'bg-white/3 border-white/5 text-gray-500 hover:text-gray-300 hover:border-gray-700/50'
              }`}>
              {CAT_ICONS[cat]} {CAT_LABELS[cat]}
            </motion.button>
          ))}
        </div>

        {/* Summary Stats */}
        <motion.div key={activeCategory} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="grid grid-cols-3 gap-3">
          {[
            { label: 'Bullish', count: bullCount, color: 'text-emerald-400', bg: 'bg-emerald-500/8 border-emerald-500/25', Icon: TrendingUp },
            { label: 'Neutral', count: neutCount, color: 'text-gray-400',    bg: 'bg-gray-800/30 border-gray-700/30',      Icon: Minus       },
            { label: 'Bearish', count: bearCount, color: 'text-rose-400',    bg: 'bg-rose-500/8 border-rose-500/25',        Icon: TrendingDown },
          ].map(({ label, count, color, bg, Icon }) => (
            <div key={label} className={`rounded-xl border p-4 ${bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={13} className={color} />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
              </div>
              <div className={`text-3xl font-black ${color}`}>{count}</div>
              <div className="text-[10px] text-gray-600 mt-1">{CAT_LABELS[activeCategory]}</div>
            </div>
          ))}
        </motion.div>

        {/* Filter Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Show:</span>
          {(['all', 'trade', 'watch', 'avoid'] as const).map(r => (
            <button key={r} onClick={() => setFilterRec(r)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                filterRec === r
                  ? r === 'trade' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : r === 'watch' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                    : r === 'avoid' ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                    : 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                  : 'bg-white/3 border-white/5 text-gray-500 hover:text-gray-300'
              }`}>
              {r === 'all' ? 'All Pairs' : r === 'trade' ? '✓ Trade' : r === 'watch' ? '◎ Watch' : '✗ Avoid'}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-gray-600">{displayed.length} pairs — tap to expand</span>
        </div>

        {/* Pairs Grid + Pagination */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 mt-4 text-sm">Analyzing market structure…</p>
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeCategory}-${filterRec}-${page}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
                className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2"
              >
                {paginated.map((p, i) => (
                  <motion.div key={p.pair} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}>
                    <PairCard p={p} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-1">
                {/* Prev */}
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                    page === 0
                      ? 'border-white/5 text-gray-700 cursor-not-allowed'
                      : 'border-orange-500/30 text-orange-300 bg-orange-500/10 hover:bg-orange-500/20'
                  }`}
                >
                  <ChevronLeft size={16} /> Prev
                </button>

                {/* Page dots */}
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`rounded-full transition-all ${
                        i === page
                          ? 'w-6 h-2 bg-orange-400'
                          : 'w-2 h-2 bg-gray-700 hover:bg-gray-500'
                      }`}
                    />
                  ))}
                </div>

                {/* Next */}
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                    page === totalPages - 1
                      ? 'border-white/5 text-gray-700 cursor-not-allowed'
                      : 'border-orange-500/30 text-orange-300 bg-orange-500/10 hover:bg-orange-500/20'
                  }`}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Page counter */}
            <div className="text-center text-[10px] text-gray-700">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, displayed.length)} of {displayed.length} pairs
            </div>
          </>
        )}

        {/* TF Guide */}
        <div className="rounded-xl border border-white/5 bg-white/2 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={15} className="text-orange-400" />
            <h3 className="font-bold text-sm text-white">Timeframe Trading Guide</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            {[
              { tf: 'M15', use: 'Scalping',       hold: '15–60 min', best: 'London & NY overlap', color: 'text-blue-400'    },
              { tf: 'H1',  use: 'Intraday',        hold: '1–4 hours', best: 'Active sessions',     color: 'text-cyan-400'   },
              { tf: 'H4',  use: 'Intraday/Swing',  hold: '4–12 hrs',  best: 'Post-London / NY',    color: 'text-emerald-400'},
              { tf: 'D1',  use: 'Swing',           hold: '1–5 days',  best: 'Daily close review',  color: 'text-amber-400'  },
              { tf: 'W1',  use: 'Position',        hold: 'Weeks+',    best: 'Weekend analysis',    color: 'text-orange-400' },
            ].map(({ tf, use, hold, best, color }) => (
              <div key={tf} className="rounded-lg bg-gray-900/50 border border-gray-800/50 p-3">
                <div className={`text-xs font-black ${color} mb-1`}>{tf}</div>
                <div className="text-[10px] font-bold text-gray-300">{use}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Hold: {hold}</div>
                <div className="text-[10px] text-gray-600">{best}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={15} className="text-amber-400" />
            <h3 className="font-bold text-sm text-amber-300">Daily Trading Rules</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { icon: '⏱', text: 'Enter 30–60 min AFTER high-impact news — avoid the spike chaos' },
              { icon: '📐', text: 'Align at least 3 timeframes before any entry' },
              { icon: '💰', text: 'Risk max 1–2% per trade — let compounding work' },
              { icon: '🔄', text: 'Trade WITH the H4/D1 bias — counter-trend for experts only' },
              { icon: '🌍', text: 'London open (08:00 UTC) & NY overlap (13:00–17:00 UTC) = best setups' },
              { icon: '🚫', text: 'Avoid marked pairs — slippage + spread will eat your edge' },
            ].map(({ icon, text }, i) => (
              <div key={i} className="flex gap-3 text-xs text-gray-300">
                <span className="text-base flex-shrink-0">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
