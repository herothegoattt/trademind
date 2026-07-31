'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, X, AlertTriangle, Star, TrendingUp, TrendingDown,
  BarChart2, Target, Shield, CheckCircle, XCircle, Clock,
  Layers, BookOpen, Zap, ChevronRight, Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Candle { o: number; h: number; l: number; c: number; v: number; }
interface HLine  { y: number; label: string; color: string; }
interface Zone   { y1: number; y2: number; label?: string; color: string; }
interface TLine  { x1: number; y1: number; x2: number; y2: number; color?: string; }

interface Setup {
  id: string;
  level: 'beginner' | 'intermediate' | 'professional';
  title: string;
  type: string;
  symbol: string;
  timeframe: string;
  direction: 'Long' | 'Short' | 'Both';
  marketCondition: 'Trending' | 'Ranging' | 'Both';
  rr: string;
  rrNum: number;
  winRateRange: string;
  difficulty: number;
  badge?: 'popular' | 'high-rr' | 'advanced';
  description: string;
  /** One-paragraph, jargon-free explanation aimed at total beginners. */
  plain: string;
  /** Best trading session / time window for this setup. */
  session: string;
  concept: string;
  candles: Candle[];
  entryCandle: number;
  slPrice: number;
  tpPrice: number;
  hlines: HLine[];
  zones: Zone[];
  trendlines: TLine[];
  steps: string[];
  confluence: string[];
  exitStrategy: string[];
  commonMistakes: string[];
}

// ─── Time-axis label generator (deterministic — SSR safe) ─────────────────────
function axisTimes(timeframe: string | undefined, n: number): string[] {
  const tok = (timeframe || '').split(/[\s/]+/)[0] || '1H';
  const out: string[] = [];
  const pad = (x: number) => String(x).padStart(2, '0');
  if (/m$/i.test(tok)) {
    const step = parseInt(tok) || 15; let mins = 9 * 60 + 30; // 09:30
    for (let i = 0; i < n; i++) { out.push(`${pad(Math.floor(mins / 60) % 24)}:${pad(mins % 60)}`); mins += step; }
  } else if (/h$/i.test(tok)) {
    const step = parseInt(tok) || 1; let mins = 8 * 60;
    for (let i = 0; i < n; i++) { out.push(`${pad(Math.floor(mins / 60) % 24)}:${pad(mins % 60)}`); mins += step * 60; }
  } else {
    const isW = /w/i.test(tok);
    const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const base = Date.UTC(2024, 0, 2);
    for (let i = 0; i < n; i++) { const d = new Date(base + i * (isW ? 7 : 1) * 86400000); out.push(`${d.getUTCDate()} ${mon[d.getUTCMonth()]}`); }
  }
  return out;
}

// ─── Enhanced Candle Chart ───────────────────────────────────────────────────
function CandleChart({
  candles, hlines = [], zones = [], trendlines = [],
  entryCandle, slPrice, tpPrice, symbol, timeframe,
  vw = 340, vh = 200, labels = true,
}: {
  candles: Candle[]; hlines?: HLine[]; zones?: Zone[]; trendlines?: TLine[];
  entryCandle?: number; slPrice?: number; tpPrice?: number; symbol?: string; timeframe?: string;
  vw?: number; vh?: number; labels?: boolean;
}) {
  const PL = 8, PR = 46, PT = 24, PB = 15, VOLH = 16, GAP = 6;
  const PH = vh - PT - PB - VOLH - GAP;
  const CW = vw - PL - PR;

  const allP = candles.flatMap(c => [c.h, c.l]);
  if (slPrice != null) allP.push(slPrice);
  if (tpPrice != null) allP.push(tpPrice);
  hlines.forEach(h => allP.push(h.y));
  zones.forEach(z => { allP.push(z.y1); allP.push(z.y2); });

  const rawMax = Math.max(...allP);
  const rawMin = Math.min(...allP);
  const rng    = rawMax === rawMin ? 0.001 : rawMax - rawMin;
  const maxP   = rawMax + rng * 0.06;
  const minP   = rawMin - rng * 0.10;
  const pRng   = maxP - minP;

  const py = (p: number) => PT + ((maxP - p) / pRng) * PH;
  const volBase = PT + PH + GAP + VOLH;
  const maxVol  = Math.max(...candles.map(c => c.v));
  const vy = (v: number) => volBase - (v / maxVol) * VOLH;

  const n    = candles.length;
  const step = CW / n;
  const bw   = Math.max(step * 0.64, 3.5);
  const cx   = (i: number) => PL + (i + 0.5) * step;

  // calmer, professional palette (muted teal / red — easy on the eyes)
  const UP = '#26a69a', DOWN = '#ef5350', ENTRY = '#f59e0b';

  const fmtP = (p: number) =>
    p > 999 ? p.toFixed(1) : p > 9 ? p.toFixed(2) : p.toFixed(4);

  // Moving average overlay (makes the chart read like a real platform)
  const smaP = Math.min(7, Math.max(2, Math.round(n / 3)));
  const smaPts = candles
    .map((_, i) => {
      if (i < smaP - 1) return null;
      let s = 0; for (let k = i - smaP + 1; k <= i; k++) s += candles[k].c;
      return `${cx(i).toFixed(1)},${py(s / smaP).toFixed(1)}`;
    })
    .filter(Boolean)
    .join(' ');

  // Time axis labels (a few, evenly spaced)
  const times = axisTimes(timeframe, n);
  const tickCount = Math.min(5, n);
  const tickIdx = Array.from({ length: tickCount }, (_, k) =>
    Math.round((k * (n - 1)) / Math.max(tickCount - 1, 1)));

  // Header price stats
  const last = candles[n - 1].c;
  const open0 = candles[0].o;
  const chgPct = ((last - open0) / open0) * 100;
  const up = chgPct >= 0;

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} width="100%" height="100%" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c111d" />
          <stop offset="100%" stopColor="#090d16" />
        </linearGradient>
      </defs>
      {/* Background */}
      <rect width={vw} height={vh} fill="url(#chartBg)" />

      {/* Subtle grid */}
      {[0.25, 0.5, 0.75].map((f, i) => (
        <line key={i} x1={PL} y1={PT + f * PH} x2={vw - PR} y2={PT + f * PH}
          stroke="rgba(255,255,255,0.03)" strokeWidth="0.7" />
      ))}
      {[0.25, 0.5, 0.75].map((f, i) => (
        <line key={i} x1={PL + f * CW} y1={PT} x2={PL + f * CW} y2={PT + PH}
          stroke="rgba(255,255,255,0.018)" strokeWidth="0.7" />
      ))}

      {/* Right separator */}
      <line x1={vw - PR} y1={PT} x2={vw - PR} y2={PT + PH + GAP + VOLH}
        stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" />

      {/* Volume separator */}
      <line x1={PL} y1={PT + PH + GAP} x2={vw - PR} y2={PT + PH + GAP}
        stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />

      {/* Zones */}
      {zones.map((z, i) => {
        const y = Math.min(py(z.y1), py(z.y2));
        const h = Math.max(Math.abs(py(z.y1) - py(z.y2)), 2);
        return <rect key={i} x={PL} y={y} width={CW} height={h}
          fill={z.color.replace(/[\d.]+\)$/, '0.14)')} />;
      })}

      {/* HLines */}
      {hlines.map((h, i) => (
        <g key={i}>
          <line x1={PL} y1={py(h.y)} x2={vw - PR} y2={py(h.y)}
            stroke={h.color} strokeWidth="1" strokeDasharray="4,3" opacity="0.7" />
          {labels && (
            <text x={vw - PR + 3} y={py(h.y) + 2.5}
              fill={h.color} fontSize="5.5" fontFamily="monospace" opacity="0.7">{h.label}</text>
          )}
        </g>
      ))}

      {/* TP line */}
      {tpPrice != null && (
        <g>
          <line x1={PL} y1={py(tpPrice)} x2={vw - PR} y2={py(tpPrice)}
            stroke={UP} strokeWidth="1.2" strokeDasharray="5,4" opacity="0.7" />
          <rect x={vw - PR + 1} y={py(tpPrice) - 5.5} width={PR - 2} height={11}
            fill="rgba(38,166,154,0.16)" rx="2" />
          <text x={vw - PR + (PR - 2) / 2 + 1} y={py(tpPrice) + 3.5}
            fill={UP} fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">TP</text>
        </g>
      )}

      {/* SL line */}
      {slPrice != null && (
        <g>
          <line x1={PL} y1={py(slPrice)} x2={vw - PR} y2={py(slPrice)}
            stroke={DOWN} strokeWidth="1.2" strokeDasharray="5,4" opacity="0.7" />
          <rect x={vw - PR + 1} y={py(slPrice) - 5.5} width={PR - 2} height={11}
            fill="rgba(239,83,80,0.16)" rx="2" />
          <text x={vw - PR + (PR - 2) / 2 + 1} y={py(slPrice) + 3.5}
            fill={DOWN} fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">SL</text>
        </g>
      )}

      {/* Trendlines */}
      {trendlines.map((tl, i) => (
        <line key={i}
          x1={cx(tl.x1)} y1={py(tl.y1)} x2={cx(tl.x2)} y2={py(tl.y2)}
          stroke={tl.color || '#60a5fa'} strokeWidth="1.3" opacity="0.5" strokeLinecap="round" />
      ))}

      {/* Volume bars */}
      {candles.map((c, i) => (
        <rect key={i}
          x={cx(i) - bw / 2} y={vy(c.v)} width={bw} height={volBase - vy(c.v)}
          fill={c.c >= c.o ? 'rgba(38,166,154,0.22)' : 'rgba(239,83,80,0.22)'} rx="1" />
      ))}

      {/* Entry highlight column */}
      {entryCandle != null && (
        <rect x={cx(entryCandle) - step / 2} y={PT} width={step} height={PH}
          fill="rgba(245,158,11,0.06)" />
      )}

      {/* Candles */}
      {candles.map((c, i) => {
        const isUp = c.c >= c.o;
        const isE  = i === entryCandle;
        const col  = isE ? ENTRY : isUp ? UP : DOWN;
        const by   = py(Math.max(c.o, c.c));
        const bh   = Math.max(py(Math.min(c.o, c.c)) - by, 1.5);
        const fill = isE ? ENTRY : isUp ? UP : DOWN;
        return (
          <g key={i}>
            <line x1={cx(i)} y1={py(c.h)} x2={cx(i)} y2={py(c.l)}
              stroke={col} strokeWidth="1.1" strokeLinecap="round" />
            <rect x={cx(i) - bw / 2} y={by} width={bw} height={bh}
              fill={fill} stroke={col} strokeWidth={isE ? 1.6 : 1}
              fillOpacity={isE ? 1 : isUp ? 0.85 : 0.7} rx="1" />
          </g>
        );
      })}

      {/* Moving average overlay */}
      {smaPts && (
        <polyline points={smaPts} fill="none"
          stroke="#5b8def" strokeWidth="1.1" opacity="0.5" strokeLinejoin="round" strokeLinecap="round" />
      )}

      {/* Entry arrow */}
      {entryCandle != null && (
        <g>
          <polygon
            points={`${cx(entryCandle)},${py(candles[entryCandle].l) + 10} ${cx(entryCandle) - 5},${py(candles[entryCandle].l) + 18} ${cx(entryCandle) + 5},${py(candles[entryCandle].l) + 18}`}
            fill="#f59e0b" opacity="0.95"
          />
          <text x={cx(entryCandle)} y={py(candles[entryCandle].l) + 27}
            fill="#f59e0b" fontSize="6" fontFamily="monospace" textAnchor="middle" fontWeight="bold" opacity="0.8">
            ENTRY
          </text>
        </g>
      )}

      {/* Y-axis price labels */}
      {labels && [0.1, 0.5, 0.9].map((f, i) => (
        <text key={i} x={vw - PR + 3} y={PT + f * PH + 2}
          fill="rgba(148,163,184,0.4)" fontSize="5.5" fontFamily="monospace">
          {fmtP(maxP - f * pRng)}
        </text>
      ))}

      {/* X-axis time labels */}
      {labels && tickIdx.map((ti, i) => (
        <text key={i} x={cx(ti)} y={vh - 3}
          fill="rgba(148,163,184,0.4)" fontSize="5.5" fontFamily="monospace"
          textAnchor={i === 0 ? 'start' : i === tickIdx.length - 1 ? 'end' : 'middle'}>
          {times[ti]}
        </text>
      ))}

      {/* Header: symbol · timeframe + last price & change (real-platform style) */}
      {symbol && (
        <g>
          <text x={PL + 2} y={PT - 9}
            fill="rgba(241,245,249,0.92)" fontSize="8" fontFamily="monospace" fontWeight="bold">
            {symbol}
          </text>
          {timeframe && (
            <text x={PL + 4 + symbol.length * 5.2} y={PT - 9}
              fill="rgba(148,163,184,0.55)" fontSize="6" fontFamily="monospace">
              {timeframe.split(/[\s/]+/)[0]}
            </text>
          )}
          <text x={vw - PR - 2} y={PT - 9} textAnchor="end"
            fill={up ? UP : DOWN} fontSize="7" fontFamily="monospace" fontWeight="bold">
            {fmtP(last)}  {up ? '▲' : '▼'}{Math.abs(chgPct).toFixed(2)}%
          </text>
        </g>
      )}

      {/* MA legend chip */}
      {smaPts && (
        <text x={PL + 2} y={PT + 8}
          fill="#5b8def" fontSize="5.5" fontFamily="monospace" opacity="0.65">
          — MA{smaP}
        </text>
      )}

      {/* Subtle example marker (bottom-right) */}
      <text x={vw - PR - 2} y={PT + PH - 2} textAnchor="end"
        fill="rgba(255,255,255,0.08)" fontSize="6" fontFamily="monospace" fontStyle="italic">
        annotated example
      </text>
    </svg>
  );
}

// ─── Setup Data ──────────────────────────────────────────────────────────────
const SETUPS: Setup[] = [
  {
    id: 'trend-pullback',
    level: 'beginner',
    title: 'Trend Pullback (HH/HL)',
    type: 'Smart Money',
    symbol: 'EURUSD',
    timeframe: '1H / 4H',
    direction: 'Long',
    marketCondition: 'Trending',
    rr: '1:2', rrNum: 2,
    winRateRange: '45–55%',
    difficulty: 1,
    badge: 'popular',
    description: 'Trade pullbacks in a clear uptrend using Higher Highs / Higher Lows structure.',
    plain: 'When a market is clearly going up, it never moves in a straight line — it climbs, dips a little, then climbs again. This setup waits for one of those small dips and joins the trend while it is "on sale", instead of buying at the top.',
    session: 'London & New York',
    concept: 'Price moves in waves. An uptrend creates Higher Highs (HH) and Higher Lows (HL). When price pulls back to an HL zone and shows bullish rejection, that\'s a high-probability long entry with the trend. The opposite applies for downtrends.',
    candles: [
      { o:1.0940,h:1.0975,l:1.0930,c:1.0965, v:75 },
      { o:1.0965,h:1.1005,l:1.0958,c:1.0998, v:95 },
      { o:1.0998,h:1.1018,l:1.0980,c:1.0985, v:60 },
      { o:1.0985,h:1.0992,l:1.0952,c:1.0960, v:68 },
      { o:1.0960,h:1.0968,l:1.0935,c:1.0942, v:55 },
      { o:1.0942,h:1.0988,l:1.0937,c:1.0982, v:125 },
      { o:1.0982,h:1.1022,l:1.0975,c:1.1015, v:142 },
      { o:1.1015,h:1.1048,l:1.1008,c:1.1040, v:128 },
      { o:1.1040,h:1.1058,l:1.1012,c:1.1018, v:72 },
      { o:1.1018,h:1.1025,l:1.0985,c:1.0990, v:65 },
      { o:1.0990,h:1.1032,l:1.0985,c:1.1028, v:138 },
      { o:1.1028,h:1.1062,l:1.1022,c:1.1055, v:148 },
      { o:1.1055,h:1.1088,l:1.1048,c:1.1082, v:132 },
      { o:1.1082,h:1.1105,l:1.1075,c:1.1098, v:118 },
    ],
    entryCandle: 5,
    slPrice: 1.0918,
    tpPrice: 1.1066,
    hlines: [
      { y:1.1048, label:'HH', color:'#60a5fa' },
      { y:1.0935, label:'HL', color:'#60a5fa' },
    ],
    zones: [],
    trendlines: [{ x1:0, y1:1.0930, x2:4, y2:1.0935 }],
    steps: [
      'On 4H chart confirm uptrend: at least 2 HH and 2 HL visible',
      'Draw a trendline connecting the last 2 swing lows (Higher Lows)',
      'Wait for price to pull back into the HL zone — do NOT chase',
      'Switch to 1H to look for 2–3 consecutive bullish candles forming at HL',
      'Enter long at open of the 3rd bullish candle',
      'Place Stop Loss 10–15 pips below the HL (below the wick)',
      'Take Profit = 2× your Stop Loss distance (1:2 R:R minimum)',
    ],
    confluence: [
      'Trend direction aligned across 4H and Daily',
      'Volume increases on the bounce candle',
      'RSI not overbought (below 70) at entry',
      'Entry zone near round number (1.1000, 1.0950)',
    ],
    exitStrategy: [
      'Close 50% at 1:1 R:R, move SL to breakeven',
      'Close remaining 50% at 1:2 R:R',
      'If price fails to create new HH after entry → exit early',
    ],
    commonMistakes: [
      'Entering before pullback (chasing the move)',
      'Setting TP too far — trend may not extend that much',
      'Not checking Daily timeframe trend direction first',
      'Moving SL to breakeven too early (gets stopped out before target)',
    ],
  },

  {
    id: 'sr-bounce',
    level: 'beginner',
    title: 'Support / Resistance Bounce',
    type: 'Technical Analysis',
    symbol: 'GBPUSD',
    timeframe: '4H / Daily',
    direction: 'Both',
    marketCondition: 'Both',
    rr: '1:2', rrNum: 2,
    winRateRange: '40–52%',
    difficulty: 1,
    description: 'Enter when price bounces from a clear horizontal support or resistance level on 4H or Daily.',
    plain: 'Markets tend to "remember" certain price levels where they turned around before. This setup draws a line at one of those levels and waits for price to come back, touch it, and bounce — then trades in the direction of the bounce.',
    session: 'Any active session',
    concept: 'Institutional buyers/sellers cluster orders at previously significant price levels. When price returns to these areas, a reaction (bounce) is expected. The more times a level has been tested, the more significant it is.',
    candles: [
      { o:1.2680,h:1.2712,l:1.2655,c:1.2665, v:88 },
      { o:1.2665,h:1.2678,l:1.2632,c:1.2640, v:105 },
      { o:1.2640,h:1.2650,l:1.2602,c:1.2612, v:98 },
      { o:1.2612,h:1.2625,l:1.2580,c:1.2592, v:92 },
      { o:1.2592,h:1.2605,l:1.2568,c:1.2580, v:85 },
      { o:1.2580,h:1.2590,l:1.2552,c:1.2570, v:72 },
      { o:1.2570,h:1.2615,l:1.2562,c:1.2608, v:155 },
      { o:1.2608,h:1.2645,l:1.2600,c:1.2638, v:138 },
      { o:1.2638,h:1.2672,l:1.2630,c:1.2665, v:122 },
      { o:1.2665,h:1.2698,l:1.2658,c:1.2690, v:118 },
      { o:1.2690,h:1.2720,l:1.2682,c:1.2712, v:108 },
      { o:1.2712,h:1.2748,l:1.2705,c:1.2740, v:128 },
    ],
    entryCandle: 6,
    slPrice: 1.2540,
    tpPrice: 1.2715,
    hlines: [
      { y:1.2560, label:'SUPPORT', color:'#34d399' },
      { y:1.2720, label:'RESIST', color:'#f87171' },
    ],
    zones: [{ y1:1.2572, y2:1.2552, color:'#34d39915' }],
    trendlines: [],
    steps: [
      'On Daily chart, identify a price level touched at least 2–3 times',
      'Mark the support zone (±5–10 pips around the key level)',
      'Wait for price to fall INTO the support zone — be patient',
      'On 4H, look for a bullish rejection: long lower wick or 2 green candles',
      'Enter at open of confirmation candle (the 2nd green candle after bounce)',
      'SL: 15–20 pips below the support zone',
      'TP: next resistance level above (check Daily for obvious target)',
    ],
    confluence: [
      'Support tested 2+ times previously without breaking',
      'Daily candle shows long lower wick at support',
      'Volume spike on bounce candle vs recent average',
      'Bounce happening during active London or NY session',
    ],
    exitStrategy: [
      'Exit 50% at midpoint between support and resistance',
      'Exit remaining at resistance level',
      'If price closes BELOW support on 4H → exit all',
    ],
    commonMistakes: [
      'Entering before price actually reaches support (anticipating)',
      'Trading a support level that was already broken',
      'Ignoring Daily trend — counter-trend bounces have low success rate',
      'Holding through news events near the level',
    ],
  },

  {
    id: 'liquidity-sweep',
    level: 'intermediate',
    title: 'Liquidity Sweep Reversal',
    type: 'Smart Money',
    symbol: 'EURUSD',
    timeframe: '15m / 1H',
    direction: 'Short',
    marketCondition: 'Both',
    rr: '1:3', rrNum: 3,
    winRateRange: '48–58%',
    difficulty: 2,
    badge: 'high-rr',
    description: 'Smart money engineers a false breakout above/below a key level to grab liquidity, then reverses sharply.',
    plain: 'Big players know exactly where most traders put their stop-losses. Sometimes they push price just past that level to trigger everyone\'s stops, then snap it back the other way. This setup waits for that fake-out, then trades the snap-back.',
    session: 'London & NY open',
    concept: 'Retail traders place stop losses just above swing highs or below swing lows. Smart money deliberately pushes price through these levels to fill their own orders — called a "liquidity sweep". After the sweep, price rapidly reverses. Trading the reversal gives you an asymmetric opportunity.',
    candles: [
      { o:1.1065,h:1.1080,l:1.1055,c:1.1075, v:62 },
      { o:1.1075,h:1.1088,l:1.1068,c:1.1082, v:58 },
      { o:1.1082,h:1.1092,l:1.1072,c:1.1085, v:65 },
      { o:1.1085,h:1.1095,l:1.1075,c:1.1088, v:55 },
      { o:1.1088,h:1.1092,l:1.1078,c:1.1082, v:50 },
      { o:1.1082,h:1.1115,l:1.1078,c:1.1108, v:162 },
      { o:1.1108,h:1.1118,l:1.1065,c:1.1068, v:185 },
      { o:1.1068,h:1.1072,l:1.1038,c:1.1042, v:148 },
      { o:1.1042,h:1.1048,l:1.1010,c:1.1015, v:132 },
      { o:1.1015,h:1.1022,l:1.0988,c:1.0992, v:118 },
      { o:1.0992,h:1.1000,l:1.0965,c:1.0968, v:108 },
      { o:1.0968,h:1.0975,l:1.0945,c:1.0948, v:98 },
    ],
    entryCandle: 7,
    slPrice: 1.1125,
    tpPrice: 1.0998,
    hlines: [{ y:1.1090, label:'LIQUIDITY', color:'#f59e0b' }],
    zones: [{ y1:1.1098, y2:1.1082, color:'#f59e0b18' }],
    trendlines: [],
    steps: [
      'Identify a clear swing high with multiple wicks (retail stop cluster above)',
      'Mark the liquidity zone: 5 pips above/below the swing high/low',
      'Watch on 1H for a breakout candle that closes back INSIDE the range',
      'A long bearish wick above the sweep level = confirmation of fake breakout',
      'Enter SHORT when a bearish candle closes below the sweep level',
      'SL: 5–8 pips above the sweep candle high (above liquidity)',
      'TP: Next significant support below (often a 30–50 pip target)',
    ],
    confluence: [
      'Sweep happens during NY or London open (higher volume)',
      'Sweep candle volume significantly higher than average',
      'Price swept into a higher timeframe (4H) resistance zone',
      'Reversal candle body closes fully back below swept level',
    ],
    exitStrategy: [
      'Exit 1/3 at 1:1 R:R',
      'Exit 1/3 at 1:2 R:R',
      'Trail remaining to capture full move',
      'Exit all if price makes new high after sweep',
    ],
    commonMistakes: [
      'Entering before the reversal candle closes (too early)',
      'Chasing the entry after missing the initial reversal',
      'Trading sweeps in consolidation — wait for a clear range boundary',
      'Not checking that volume confirms the sweep',
    ],
  },

  {
    id: 'order-block',
    level: 'intermediate',
    title: 'Order Block Reversal',
    type: 'Smart Money',
    symbol: 'XAUUSD',
    timeframe: '4H / Daily',
    direction: 'Long',
    marketCondition: 'Trending',
    rr: '1:3', rrNum: 3,
    winRateRange: '48–60%',
    difficulty: 3,
    description: 'The last bearish candle before a strong bullish impulse becomes a support zone on retrace.',
    plain: 'Right before a big move up, there is usually one last red candle — that\'s where the big buyers loaded up. This setup marks that candle as a "buy zone" and waits for price to come back down to it, expecting buyers to defend it again.',
    session: 'Any active session',
    concept: 'An Order Block is the last opposing candle before a strong directional move. Banks and institutions place large limit orders in this zone. When price returns to these levels months or weeks later, those pending orders activate — creating a powerful rejection.',
    candles: [
      { o:2318,h:2325,l:2310,c:2312, v:95 },
      { o:2312,h:2318,l:2295,c:2298, v:105 },
      { o:2298,h:2305,l:2280,c:2282, v:98 },
      { o:2282,h:2295,l:2275,c:2290, v:88 },
      { o:2290,h:2322,l:2285,c:2318, v:185 },
      { o:2318,h:2348,l:2312,c:2342, v:168 },
      { o:2342,h:2362,l:2335,c:2355, v:152 },
      { o:2355,h:2365,l:2322,c:2328, v:128 },
      { o:2328,h:2345,l:2318,c:2340, v:175 },
      { o:2340,h:2358,l:2332,c:2352, v:158 },
      { o:2352,h:2372,l:2345,c:2368, v:142 },
      { o:2368,h:2385,l:2360,c:2380, v:135 },
    ],
    entryCandle: 8,
    slPrice: 2268,
    tpPrice: 2375,
    hlines: [
      { y:2295, label:'OB HIGH', color:'#a855f7' },
      { y:2275, label:'OB LOW', color:'#a855f7' },
    ],
    zones: [{ y1:2295, y2:2275, color:'#a855f720' }],
    trendlines: [],
    steps: [
      'Identify a strong bullish impulse on 4H — at least 3–4 large bullish candles',
      'Find the LAST bearish candle before this impulse started — that is the Order Block',
      'Mark the OB zone: from OB candle HIGH to OB candle LOW',
      'Wait for price to retrace back DOWN into this OB zone',
      'On 1H, look for bullish rejection inside the zone (long wick or 2 green candles)',
      'Enter LONG at the midpoint of the OB zone',
      'SL: 10 pips below the OB LOW; TP: previous structure high',
    ],
    confluence: [
      'OB aligns with a Daily support or Fibonacci 61.8% retracement',
      'RSI below 40 when price enters OB (oversold condition)',
      'Volume drops during pullback (weak selling pressure)',
      'Multiple OB tests without breaking → stronger zone',
    ],
    exitStrategy: [
      'Exit 50% at previous swing high',
      'Move SL to breakeven after 1:1',
      'Exit rest at 1:3 R:R or next major structure',
    ],
    commonMistakes: [
      'Misidentifying the OB — it must be the LAST candle before the impulse',
      'Entering at OB that price has already visited (mitigated OBs are weaker)',
      'Ignoring the higher timeframe trend',
      'Order block too small (< 10 pips) — skips easily',
    ],
  },

  {
    id: 'fvg',
    level: 'professional',
    title: 'Fair Value Gap (FVG)',
    type: 'Smart Money',
    symbol: 'NAS100',
    timeframe: '15m / 1H',
    direction: 'Short',
    marketCondition: 'Trending',
    rr: '1:4', rrNum: 4,
    winRateRange: '52–65%',
    difficulty: 4,
    badge: 'high-rr',
    description: 'A 3-candle imbalance forms during a fast move. Price returns to fill the gap — entry on rejection.',
    plain: 'When price moves very fast it sometimes leaves a "gap" — an empty zone it skipped over. Markets tend to come back and fill those gaps, like backtracking to finish a job. This setup spots the gap and trades the move once price returns to fill it.',
    session: 'London & NY open',
    concept: 'A Fair Value Gap (FVG) is a 3-candle pattern where price moves so fast that a gap forms between Candle 1\'s low and Candle 3\'s high. This "imbalance" acts like a magnet — price is attracted back to fill it. Smart money uses these zones as entry points after the fill.',
    candles: [
      { o:19850,h:19885,l:19830,c:19842, v:95 },
      { o:19842,h:19855,l:19805,c:19818, v:102 },
      { o:19818,h:19822,l:19760,c:19768, v:198 },
      { o:19768,h:19810,l:19762,c:19805, v:88 },
      { o:19805,h:19848,l:19798,c:19840, v:125 },
      { o:19840,h:19845,l:19795,c:19800, v:158 },
      { o:19800,h:19808,l:19755,c:19762, v:142 },
      { o:19762,h:19770,l:19718,c:19725, v:132 },
      { o:19725,h:19735,l:19692,c:19698, v:122 },
      { o:19698,h:19708,l:19668,c:19672, v:115 },
      { o:19672,h:19682,l:19642,c:19648, v:108 },
      { o:19648,h:19658,l:19615,c:19620, v:102 },
    ],
    entryCandle: 6,
    slPrice: 19860,
    tpPrice: 19622,
    hlines: [
      { y:19822, label:'FVG HIGH', color:'#06b6d4' },
      { y:19805, label:'FVG LOW', color:'#06b6d4' },
    ],
    zones: [{ y1:19822, y2:19805, color:'#06b6d420' }],
    trendlines: [],
    steps: [
      'Spot a 3-candle sequence where Candle 2 is a large fast candle (engine)',
      'Verify: Candle 1 LOW is higher than Candle 3 HIGH — that gap is the FVG',
      'Mark the FVG zone: from C1.Low to C3.High',
      'Wait for price to retrace INTO the FVG zone',
      'Look for rejection candle inside the FVG (long wick + close back outside)',
      'Combine with an Order Block inside the FVG for higher probability',
      'Enter SHORT at top of FVG on rejection; SL above FVG HIGH + buffer',
    ],
    confluence: [
      'FVG aligns with a higher timeframe Order Block',
      'Volume imbalance (low volume during FVG formation)',
      'Price enters FVG during active session (not overnight gaps)',
      'Second entry into FVG (partial fill → full fill pattern)',
    ],
    exitStrategy: [
      'Partial exit at 1:2 — lock in profits',
      'Full exit at 1:4 or next FVG below',
      'If price closes ABOVE FVG HIGH → invalidated, exit immediately',
    ],
    commonMistakes: [
      'Entering the FVG without a rejection candle (price may pass through)',
      'Trading FVGs against the major trend',
      'Not accounting for spread — especially important on 15m entries',
      'Exiting too early inside the FVG before price shows rejection',
    ],
  },

  {
    id: 'breaker-block',
    level: 'professional',
    title: 'Breaker Block + CHoCH',
    type: 'Smart Money',
    symbol: 'EURUSD',
    timeframe: 'Daily / Weekly',
    direction: 'Long',
    marketCondition: 'Trending',
    rr: '1:5', rrNum: 5,
    winRateRange: '50–62%',
    difficulty: 5,
    badge: 'advanced',
    description: 'A failed Order Block becomes a Breaker Block. Price returns to the broken zone for a high-conviction entry.',
    plain: 'Sometimes a level that used to act as a ceiling gets broken and price closes above it. That old ceiling often flips into a new floor. This setup waits for price to come back and retest that flipped level, then trades the bounce off it.',
    session: 'Daily / swing trade',
    concept: 'When price breaks THROUGH an Order Block (instead of respecting it), that OB becomes a "Breaker Block". The failure reveals a shift in market structure (CHoCH). When price later returns to this zone for a retest, it provides an extremely high-conviction entry with outsized R:R potential.',
    candles: [
      { o:1.0820,h:1.0838,l:1.0795,c:1.0802, v:108 },
      { o:1.0802,h:1.0812,l:1.0778,c:1.0785, v:92 },
      { o:1.0785,h:1.0850,l:1.0780,c:1.0845, v:195 },
      { o:1.0845,h:1.0858,l:1.0802,c:1.0808, v:128 },
      { o:1.0808,h:1.0845,l:1.0800,c:1.0840, v:172 },
      { o:1.0840,h:1.0862,l:1.0832,c:1.0855, v:152 },
      { o:1.0855,h:1.0878,l:1.0848,c:1.0872, v:142 },
      { o:1.0872,h:1.0895,l:1.0865,c:1.0890, v:135 },
      { o:1.0890,h:1.0912,l:1.0882,c:1.0908, v:128 },
      { o:1.0908,h:1.0932,l:1.0900,c:1.0928, v:122 },
      { o:1.0928,h:1.0952,l:1.0920,c:1.0948, v:115 },
      { o:1.0948,h:1.0975,l:1.0940,c:1.0970, v:108 },
    ],
    entryCandle: 4,
    slPrice: 1.0772,
    tpPrice: 1.0960,
    hlines: [
      { y:1.0838, label:'BB HIGH', color:'#ec4899' },
      { y:1.0795, label:'BB LOW', color:'#ec4899' },
    ],
    zones: [{ y1:1.0838, y2:1.0795, color:'#ec489920' }],
    trendlines: [],
    steps: [
      'On Weekly/Daily, find a bearish OB that price has now broken THROUGH to the upside',
      'That former bearish OB is now a BULLISH Breaker Block — mark it',
      'Wait for price to retrace back DOWN into this zone (can take days/weeks)',
      'On 4H, confirm multiple rejections of the BB LOW (at least 2–3 wicks)',
      'Enter LONG at BB LOW area with tight SL just below the zone',
      'TP: Fibonacci 161.8% extension or next major resistance',
    ],
    confluence: [
      'Weekly trend direction confirms the long entry',
      'Breaker Block aligns with Daily 50% retracement',
      'Volume profile shows high volume node in the BB zone',
      'COT report showing institutional long positioning (advanced)',
    ],
    exitStrategy: [
      'Hold minimum 3–5 days — these are macro moves',
      'Trail SL below each new HL as price moves up',
      'Partial exit at 1:2, let winners run to 1:5+',
    ],
    commonMistakes: [
      'Confusing a regular pullback to OB with a Breaker Block setup',
      'Entering too early — wait for the FULL retrace into the zone',
      'Using tight stops on Daily/Weekly setups — give price room',
      'Not checking Weekly narrative before entry',
    ],
  },

  {
    id: 'hidden-div',
    level: 'professional',
    title: 'Hidden Divergence',
    type: 'Technical Analysis',
    symbol: 'GBPJPY',
    timeframe: '1H / 4H',
    direction: 'Short',
    marketCondition: 'Trending',
    rr: '1:3', rrNum: 3,
    winRateRange: '50–60%',
    difficulty: 4,
    description: 'Hidden RSI divergence signals trend continuation — powerful low-risk entry in the direction of the trend.',
    plain: 'An indicator called RSI can disagree with price. When price makes a small pullback but the RSI shows the trend is still strong underneath, it\'s a hint the trend will continue. This setup uses that hidden hint to join the trend again with a tight stop.',
    session: 'London & New York',
    concept: 'Hidden Divergence occurs when price makes a Higher Low but RSI makes a Lower Low (bullish continuation), or price makes a Lower High while RSI makes a Higher High (bearish continuation). Unlike regular divergence which signals reversals, hidden divergence signals CONTINUATION of the existing trend.',
    candles: [
      { o:198.20,h:199.05,l:197.85,c:198.92, v:78 },
      { o:198.92,h:199.60,l:198.70,c:198.80, v:70 },
      { o:198.80,h:199.00,l:197.60,c:197.75, v:85 },
      { o:197.75,h:198.80,l:197.50,c:198.65, v:110 },
      { o:198.65,h:199.80,l:198.55,c:199.70, v:125 },
      { o:199.70,h:199.85,l:198.80,c:198.90, v:142 },
      { o:198.90,h:199.20,l:197.40,c:197.55, v:128 },
      { o:197.55,h:197.80,l:196.30,c:196.45, v:118 },
      { o:196.45,h:196.70,l:195.20,c:195.35, v:108 },
      { o:195.35,h:195.60,l:194.20,c:194.32, v:98 },
      { o:194.32,h:194.55,l:193.20,c:193.35, v:92 },
      { o:193.35,h:193.60,l:192.40,c:192.52, v:88 },
    ],
    entryCandle: 6,
    slPrice: 200.05,
    tpPrice: 195.20,
    hlines: [
      { y:199.05, label:'PREV HIGH', color:'#60a5fa' },
      { y:199.80, label:'NEW LH', color:'#f87171' },
    ],
    zones: [],
    trendlines: [],
    steps: [
      'Confirm the major trend on 4H (downtrend for bearish hidden div)',
      'Look for a rally that creates a new Lower High (price) on 1H',
      'Open RSI (14) — the rally should show RSI making a HIGHER High than previous rally',
      'This mismatch (price LH, RSI HH) = Bearish Hidden Divergence',
      'Enter SHORT at the new Lower High with volume declining on the rally',
      'SL: 10–15 pips above the new Lower High (divergence candle)',
      'Scale exits: 1/3 at 1:1, 1/3 at 1:2, trail final 1/3',
    ],
    confluence: [
      'Hidden divergence visible on BOTH RSI and Stochastic',
      'Entry aligns with a 4H resistance or Order Block',
      'Volume declining on the divergence rally',
      '4H trend is clearly down — divergence confirms continuation',
    ],
    exitStrategy: [
      'Exit 33% at 1:1 (guarantee profit)',
      'Exit 33% at 1:2',
      'Trail remaining using 20-period EMA on 1H',
    ],
    commonMistakes: [
      'Confusing Hidden Divergence with Regular Divergence (opposite signals)',
      'Trading hidden div against the major trend — it only works WITH trend',
      'Not waiting for 2+ oscillators to confirm',
      'Entering on divergence that formed during a news spike',
    ],
  },

  {
    id: 'ict-killzone',
    level: 'professional',
    title: 'ICT Kill Zone Entry',
    type: 'Smart Money',
    symbol: 'EURUSD',
    timeframe: '5m / 15m',
    direction: 'Both',
    marketCondition: 'Trending',
    rr: '1:4', rrNum: 4,
    winRateRange: '55–68%',
    difficulty: 5,
    badge: 'advanced',
    description: 'Time-based entry during London or NY open kill zones using overnight consolidation and displacement.',
    plain: 'The market is most active at specific times of day — the London and New York opens. This setup only trades during those windows, when a clean directional move is most likely, and ignores the quiet hours where price just chops around.',
    session: 'London 02–05 ET · NY 07–10 ET',
    concept: 'ICT Kill Zones are time windows (London Open: 02:00–05:00 ET, NY Open: 07:00–10:00 ET) when institutional order flow is highest. Price typically sweeps overnight liquidity during these windows and then makes a strong directional move. Combining time, liquidity sweeps and FVGs gives maximum probability.',
    candles: [
      { o:1.0882,h:1.0888,l:1.0875,c:1.0880, v:40 },
      { o:1.0880,h:1.0885,l:1.0872,c:1.0875, v:35 },
      { o:1.0875,h:1.0880,l:1.0868,c:1.0872, v:38 },
      { o:1.0872,h:1.0875,l:1.0862,c:1.0865, v:32 },
      { o:1.0865,h:1.0905,l:1.0858,c:1.0898, v:185 },
      { o:1.0898,h:1.0920,l:1.0892,c:1.0915, v:168 },
      { o:1.0915,h:1.0938,l:1.0908,c:1.0932, v:155 },
      { o:1.0932,h:1.0955,l:1.0925,c:1.0950, v:142 },
      { o:1.0950,h:1.0972,l:1.0942,c:1.0968, v:132 },
      { o:1.0968,h:1.0988,l:1.0960,c:1.0982, v:122 },
      { o:1.0982,h:1.1002,l:1.0975,c:1.0998, v:115 },
      { o:1.0998,h:1.1018,l:1.0990,c:1.1012, v:108 },
    ],
    entryCandle: 5,
    slPrice: 1.0848,
    tpPrice: 1.1012,
    hlines: [
      { y:1.0862, label:'ASIA LOW', color:'#f59e0b' },
      { y:1.0888, label:'ASIA HIGH', color:'#f59e0b' },
    ],
    zones: [{ y1:1.0888, y2:1.0862, color:'#f59e0b10' }],
    trendlines: [],
    steps: [
      'Identify the overnight/Asian session high and low (consolidation range)',
      'At London Open (02:00–05:00 ET), watch for a sweep of the Asia low/high',
      'The sweep creates displacement — a strong directional FVG or BOS',
      'Enter in the direction of the displacement at the first FVG formed',
      'SL: below the sweep candle low (Asia range + buffer)',
      'TP: Previous swing high or 1:4 R:R from entry',
      'Only trade during defined Kill Zone windows — no other times',
    ],
    confluence: [
      'Daily bias confirmed on the previous trading day',
      'Kill Zone timing: London (02–05 ET) or NY (07–10 ET) only',
      'Clear sweep of overnight liquidity before entry',
      'FVG or OB aligns with the entry direction',
    ],
    exitStrategy: [
      'Exit 50% at previous session high/low',
      'Trail remaining with SL to swing lows',
      'Hard exit at end of kill zone window if TP not hit',
    ],
    commonMistakes: [
      'Trading outside of Kill Zone windows — probability drops significantly',
      'Not waiting for the sweep before entry (entering into consolidation)',
      'Forgetting to account for DST changes in ET kill zone times',
      'Over-trading — one entry per Kill Zone maximum',
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const LEVEL_CFG = {
  beginner: {
    label: 'Beginner',
    icon: '●',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.15)',
    badgeBg: 'rgba(52,211,153,0.1)',
    badgeBorder: 'rgba(52,211,153,0.3)',
    badgeText: '#6ee7b7',
    grad: 'from-emerald-500 to-teal-500',
    bar: 'bg-emerald-500',
  },
  intermediate: {
    label: 'Intermediate',
    icon: '◆',
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.15)',
    badgeBg: 'rgba(96,165,250,0.1)',
    badgeBorder: 'rgba(96,165,250,0.3)',
    badgeText: '#93c5fd',
    grad: 'from-blue-500 to-cyan-500',
    bar: 'bg-blue-500',
  },
  professional: {
    label: 'Professional',
    icon: '▲',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.15)',
    badgeBg: 'rgba(167,139,250,0.1)',
    badgeBorder: 'rgba(167,139,250,0.3)',
    badgeText: '#c4b5fd',
    grad: 'from-purple-500 to-pink-500',
    bar: 'bg-purple-500',
  },
};

const BADGE_CFG = {
  popular:  { label: '🔥 Popular',  bg: 'rgba(251,146,60,0.15)',  border: 'rgba(251,146,60,0.35)',  text: '#fdba74' },
  'high-rr':{ label: '⚡ High R:R', bg: 'rgba(34,211,238,0.12)',  border: 'rgba(34,211,238,0.35)',  text: '#67e8f9' },
  advanced: { label: '💎 Advanced', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.35)', text: '#d8b4fe' },
};

function RRBar({ rrNum }: { rrNum: number }) {
  const max = 5;
  const pct = Math.min(rrNum / max, 1) * 100;
  return (
    <div style={{ width: '100%' }}>
      <div className="flex justify-between mb-1">
        <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)' }}>R:R</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#22d3ee', fontFamily: 'monospace' }}>1:{rrNum}</span>
      </div>
      <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(to right, #22d3ee, #60a5fa)' }}
        />
      </div>
    </div>
  );
}

function DifficultyBar({ n }: { n: number }) {
  const colors = ['#34d399', '#22d3ee', '#60a5fa', '#a78bfa', '#ec4899'];
  return (
    <div style={{ width: '100%' }}>
      <div className="flex justify-between mb-1">
        <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)' }}>Difficulty</span>
        <span style={{ fontSize: 10, color: colors[n - 1], fontWeight: 600 }}>
          {['Very Easy','Easy','Medium','Hard','Expert'][n - 1]}
        </span>
      </div>
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(i => (
          <motion.div key={i}
            initial={{ opacity: 0.1, scaleY: 0.3 }}
            whileInView={{ opacity: i <= n ? 1 : 0.12, scaleY: 1 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            style={{ flex: 1, height: 4, borderRadius: 2, background: i <= n ? colors[n - 1] : 'rgba(255,255,255,0.08)' }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Setup Card ───────────────────────────────────────────────────────────────
function SetupCard({ setup, onClick }: { setup: Setup; onClick: () => void }) {
  const cfg = LEVEL_CFG[setup.level];
  const bcfg = setup.badge ? BADGE_CFG[setup.badge] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, rgba(13,17,28,0.95) 0%, rgba(8,12,22,0.98) 100%)',
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: '1.25rem',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 40px ${cfg.glow}, 0 0 0 1px ${cfg.color}25`;
        (e.currentTarget as HTMLElement).style.borderColor = `${cfg.color}35`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
      }}
    >
      {/* Gradient accent top */}
      <div style={{
        height: 2,
        background: `linear-gradient(to right, ${cfg.color}, transparent 70%)`,
      }} />

      {/* Chart area */}
      <div style={{ height: 250, position: 'relative', background: '#090d16' }}>
        <CandleChart
          candles={setup.candles}
          hlines={setup.hlines}
          zones={setup.zones}
          trendlines={setup.trendlines}
          entryCandle={setup.entryCandle}
          slPrice={setup.slPrice}
          tpPrice={setup.tpPrice}
          symbol={setup.symbol}
          timeframe={setup.timeframe}
          vw={360} vh={250} labels={true}
        />

        {/* Bottom fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
          background: 'linear-gradient(to top, rgba(8,12,22,0.9), transparent)',
          pointerEvents: 'none',
        }} />

        {/* Direction badge */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700,
          background: 'rgba(6,10,18,0.85)',
          border: `1px solid ${cfg.badgeBorder}`,
          color: cfg.badgeText,
          backdropFilter: 'blur(6px)',
        }}>
          {setup.direction === 'Long'
            ? <TrendingUp style={{ width: 10, height: 10 }} />
            : setup.direction === 'Short'
              ? <TrendingDown style={{ width: 10, height: 10 }} />
              : <Layers style={{ width: 10, height: 10 }} />}
          {setup.direction}
        </div>

        {/* Achievement badge */}
        {bcfg && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700,
            background: bcfg.bg, border: `1px solid ${bcfg.border}`, color: bcfg.text,
            backdropFilter: 'blur(6px)',
          }}>
            {bcfg.label}
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px 16px' }}>
        {/* Level + type */}
        <div className="flex items-center gap-2 mb-2.5">
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
            background: cfg.badgeBg, border: `1px solid ${cfg.badgeBorder}`, color: cfg.badgeText,
          }}>{cfg.icon} {cfg.label}</span>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 99,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(148,163,184,0.55)',
          }}>{setup.type}</span>
          <span className="flex items-center gap-1 ml-auto" style={{
            fontSize: 10, color: 'rgba(148,163,184,0.4)', fontFamily: 'monospace',
          }}>
            <Clock style={{ width: 9, height: 9 }} />{setup.timeframe}
          </span>
        </div>

        {/* Title */}
        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', marginBottom: 6, lineHeight: 1.3 }}>
          {setup.title}
        </h3>

        {/* Description */}
        <p style={{
          fontSize: 11.5, color: 'rgba(148,163,184,0.6)', marginBottom: 14,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden', lineHeight: 1.55,
        }}>
          {setup.description}
        </p>

        {/* Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <RRBar rrNum={setup.rrNum} />
          <DifficultyBar n={setup.difficulty} />

          <div className="flex items-center justify-between pt-1">
            <div>
              <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.4)', marginBottom: 1 }}>Win Rate</div>
              <div style={{
                fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
                color: setup.rrNum >= 3 ? '#34d399' : '#f59e0b',
              }}>{setup.winRateRange}</div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              fontSize: 11, color: 'rgba(148,163,184,0.5)',
            }}>
              View Setup <ChevronRight style={{ width: 12, height: 12 }} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Modal Tabs ───────────────────────────────────────────────────────────────
type ModalTab = 'overview' | 'rules' | 'mistakes';

function SetupModal({ setup, onClose }: { setup: Setup; onClose: () => void }) {
  const cfg = LEVEL_CFG[setup.level];
  const [tab, setTab] = useState<ModalTab>('overview');
  const bcfg = setup.badge ? BADGE_CFG[setup.badge] : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(12px)',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 24 }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        style={{
          position: 'relative', width: '100%', maxWidth: 860,
          margin: '16px 0', borderRadius: '1.25rem',
          background: 'linear-gradient(135deg, #070b15 0%, #060910 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          overflow: 'hidden',
          boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px ${cfg.color}20`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top bar */}
        <div style={{
          height: 3,
          background: `linear-gradient(to right, ${cfg.color}, ${cfg.color}40, transparent)`,
        }} />

        {/* Header */}
        <div style={{
          padding: '20px 24px 0',
          background: `linear-gradient(to bottom, ${cfg.glow}, transparent)`,
        }}>
          <div className="flex items-start gap-3">
            <div style={{ flex: 1 }}>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                  background: cfg.badgeBg, border: `1px solid ${cfg.badgeBorder}`, color: cfg.badgeText,
                }}>{cfg.icon} {cfg.label}</span>
                <span style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 6,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(148,163,184,0.6)',
                }}>{setup.type}</span>
                {bcfg && (
                  <span style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 6,
                    background: bcfg.bg, border: `1px solid ${bcfg.border}`, color: bcfg.text,
                  }}>{bcfg.label}</span>
                )}
                <span className="flex items-center gap-1 ml-auto" style={{
                  fontSize: 11, color: 'rgba(148,163,184,0.45)',
                }}>
                  <Clock style={{ width: 11, height: 11 }} />{setup.timeframe}
                </span>
              </div>
              <h2 style={{
                fontSize: 22, fontWeight: 800,
                background: `linear-gradient(to right, ${cfg.color}, rgba(255,255,255,0.85))`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                lineHeight: 1.2,
              }}>{setup.title}</h2>
              <p style={{
                fontSize: 13, color: 'rgba(148,163,184,0.6)', marginTop: 6, lineHeight: 1.65,
              }}>{setup.description}</p>
            </div>
            <button
              onClick={onClose}
              style={{
                flexShrink: 0, padding: 8, borderRadius: 10,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            >
              <X style={{ width: 18, height: 18, color: 'rgba(148,163,184,0.7)' }} />
            </button>
          </div>

          {/* Metric pills */}
          <div className="flex flex-wrap gap-2 mt-4 pb-4">
            {[
              { label: 'R:R', value: setup.rr, color: '#22d3ee', bg: 'rgba(34,211,238,0.08)', icon: <Target style={{ width: 12, height: 12 }} /> },
              { label: 'Win Rate', value: setup.winRateRange, color: '#34d399', bg: 'rgba(52,211,153,0.08)', icon: <TrendingUp style={{ width: 12, height: 12 }} /> },
              { label: 'Market', value: setup.marketCondition, color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', icon: <Activity style={{ width: 12, height: 12 }} /> },
              { label: 'Direction', value: setup.direction, color: setup.direction === 'Long' ? '#34d399' : setup.direction === 'Short' ? '#f87171' : '#94a3b8', bg: setup.direction === 'Long' ? 'rgba(52,211,153,0.08)' : setup.direction === 'Short' ? 'rgba(248,113,113,0.08)' : 'rgba(148,163,184,0.08)', icon: setup.direction === 'Long' ? <TrendingUp style={{ width: 12, height: 12 }} /> : setup.direction === 'Short' ? <TrendingDown style={{ width: 12, height: 12 }} /> : <Layers style={{ width: 12, height: 12 }} /> },
            ].map((m, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 10,
                background: m.bg, border: `1px solid ${m.color}25`,
                color: m.color,
              }}>
                {m.icon}
                <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', marginRight: 2 }}>{m.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{m.value}</span>
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 -mx-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { id: 'overview' as ModalTab, label: 'What & why', icon: <BarChart2 style={{ width: 12, height: 12 }} /> },
              { id: 'rules' as ModalTab, label: 'How to trade it', icon: <Target style={{ width: 12, height: 12 }} /> },
              { id: 'mistakes' as ModalTab, label: 'Risks to avoid', icon: <AlertTriangle style={{ width: 12, height: 12 }} /> },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '10px 14px', borderRadius: 0, fontSize: 12, fontWeight: 600,
                  background: 'none', cursor: 'pointer', border: 'none',
                  borderBottom: tab === t.id ? `2px solid ${cfg.color}` : '2px solid transparent',
                  color: tab === t.id ? cfg.color : 'rgba(148,163,184,0.5)',
                  transition: 'color 0.15s, border-color 0.15s',
                  marginBottom: -1,
                }}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AnimatePresence mode="wait">
            {tab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* In simple terms — beginner-first explanation */}
                <div style={{
                  borderRadius: 14, padding: 18,
                  background: 'linear-gradient(135deg, rgba(52,211,153,0.08), rgba(34,211,238,0.04))',
                  border: '1px solid rgba(52,211,153,0.18)',
                }}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Zap style={{ width: 14, height: 14, color: '#34d399' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>In simple terms</span>
                  </div>
                  <p style={{ fontSize: 13.5, color: 'rgba(226,232,240,0.9)', lineHeight: 1.7 }}>{setup.plain}</p>
                </div>

                {/* Chart */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart2 style={{ width: 13, height: 13, color: 'rgba(148,163,184,0.4)' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(148,163,184,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Annotated example · {setup.symbol} · {setup.timeframe}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(148,163,184,0.25)', fontStyle: 'italic' }}>
                      Illustrative — not a live signal
                    </span>
                  </div>
                  <div style={{
                    height: 360, borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.07)',
                    background: '#090d16', overflow: 'hidden',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
                  }}>
                    <CandleChart
                      candles={setup.candles}
                      hlines={setup.hlines}
                      zones={setup.zones}
                      trendlines={setup.trendlines}
                      entryCandle={setup.entryCandle}
                      slPrice={setup.slPrice}
                      tpPrice={setup.tpPrice}
                      symbol={setup.symbol}
                      timeframe={setup.timeframe}
                      vw={760} vh={360} labels={true}
                    />
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 mt-3 px-1">
                    {[
                      { line: true, color: '#34d399', dash: true, label: 'Take Profit (TP)' },
                      { line: true, color: '#f87171', dash: true, label: 'Stop Loss (SL)' },
                      { swatch: '#f59e0b', label: 'Entry Candle' },
                      { swatch: 'rgba(129,140,248,0.35)', label: 'Key Zone' },
                      { line: true, color: '#5b8def', dash: false, label: 'Moving Average' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'rgba(148,163,184,0.45)' }}>
                        {item.line ? (
                          <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke={item.color} strokeWidth="1.5" strokeDasharray="5,3" /></svg>
                        ) : (
                          <div style={{ width: 11, height: 11, borderRadius: 3, background: item.swatch, border: `1.5px solid ${item.swatch}` }} />
                        )}
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Concept */}
                <div style={{
                  borderRadius: 14, padding: 18,
                  background: `linear-gradient(135deg, ${cfg.glow}, rgba(245,158,11,0.04))`,
                  border: `1px solid ${cfg.color}20`,
                }}>
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen style={{ width: 14, height: 14, color: cfg.color }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Core Concept</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(226,232,240,0.82)', lineHeight: 1.75 }}>{setup.concept}</p>
                </div>

                {/* Confluence */}
                <div style={{
                  borderRadius: 14, padding: 18,
                  background: 'rgba(129,140,248,0.05)',
                  border: '1px solid rgba(129,140,248,0.15)',
                }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield style={{ width: 14, height: 14, color: '#818cf8' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Confluence Factors</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {setup.confluence.map((c, i) => (
                      <div key={i} className="flex gap-2.5 items-start" style={{ fontSize: 12, color: 'rgba(226,232,240,0.72)' }}>
                        <CheckCircle style={{ width: 13, height: 13, color: '#818cf8', flexShrink: 0, marginTop: 1.5 }} />
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'rules' && (
              <motion.div key="rules" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Trade plan cheat-sheet */}
                {(() => {
                  const fmt = (p: number) => p > 999 ? p.toFixed(1) : p > 9 ? p.toFixed(2) : p.toFixed(4);
                  const entryPrice = setup.candles[setup.entryCandle].c;
                  const plan = [
                    { label: 'Entry trigger', value: fmt(entryPrice), color: '#f59e0b', icon: <Target style={{ width: 13, height: 13 }} />, hint: 'on confirmation candle' },
                    { label: 'Stop loss', value: fmt(setup.slPrice), color: '#f87171', icon: <Shield style={{ width: 13, height: 13 }} />, hint: 'risk per trade' },
                    { label: 'Take profit', value: fmt(setup.tpPrice), color: '#34d399', icon: <TrendingUp style={{ width: 13, height: 13 }} />, hint: `target · ${setup.rr}` },
                    { label: 'Timeframe', value: setup.timeframe, color: '#60a5fa', icon: <Clock style={{ width: 13, height: 13 }} />, hint: 'chart to watch' },
                    { label: 'Best session', value: setup.session, color: '#a78bfa', icon: <Activity style={{ width: 13, height: 13 }} />, hint: 'when it works best' },
                  ];
                  return (
                    <div style={{
                      borderRadius: 14, padding: 16,
                      background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen style={{ width: 14, height: 14, color: 'rgba(148,163,184,0.6)' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Trade plan at a glance</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {plan.map((p, i) => (
                          <div key={i} style={{
                            padding: '10px 12px', borderRadius: 10,
                            background: `${p.color}0d`, border: `1px solid ${p.color}22`,
                          }}>
                            <div className="flex items-center gap-1.5" style={{ color: p.color, marginBottom: 5 }}>
                              {p.icon}
                              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.label}</span>
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', fontFamily: 'monospace', lineHeight: 1.2 }}>{p.value}</div>
                            <div style={{ fontSize: 9.5, color: 'rgba(148,163,184,0.45)', marginTop: 2 }}>{p.hint}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Entry steps */}
                <div style={{
                  borderRadius: 14, padding: 20,
                  background: 'rgba(34,211,238,0.04)',
                  border: '1px solid rgba(34,211,238,0.15)',
                }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Target style={{ width: 14, height: 14, color: '#22d3ee' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#67e8f9', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Entry Checklist</span>
                    <span style={{
                      marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                      background: 'rgba(34,211,238,0.12)', color: '#22d3ee',
                    }}>{setup.steps.length} steps</span>
                  </div>
                  <ol style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {setup.steps.map((s, i) => (
                      <li key={i} className="flex gap-3" style={{ fontSize: 13, color: 'rgba(226,232,240,0.78)' }}>
                        <span style={{
                          flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                          background: 'rgba(34,211,238,0.12)', color: '#22d3ee',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 800, border: '1px solid rgba(34,211,238,0.2)',
                        }}>{i + 1}</span>
                        <span style={{ paddingTop: 2, lineHeight: 1.65 }}>{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Exit strategy */}
                <div style={{
                  borderRadius: 14, padding: 20,
                  background: 'rgba(52,211,153,0.04)',
                  border: '1px solid rgba(52,211,153,0.15)',
                }}>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp style={{ width: 14, height: 14, color: '#34d399' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Exit Strategy</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {setup.exitStrategy.map((e, i) => (
                      <div key={i} className="flex gap-3 items-start" style={{ fontSize: 13, color: 'rgba(226,232,240,0.75)' }}>
                        <div style={{
                          flexShrink: 0, width: 20, height: 20, borderRadius: 6,
                          background: 'rgba(52,211,153,0.12)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: 10, color: '#34d399', fontWeight: 700 }}>→</span>
                        </div>
                        <span style={{ paddingTop: 1, lineHeight: 1.65 }}>{e}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'mistakes' && (
              <motion.div key="mistakes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{
                  borderRadius: 14, padding: 20,
                  background: 'rgba(248,113,113,0.04)',
                  border: '1px solid rgba(248,113,113,0.15)',
                }}>
                  <div className="flex items-center gap-2 mb-4">
                    <XCircle style={{ width: 14, height: 14, color: '#f87171' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Common Mistakes to Avoid</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {setup.commonMistakes.map((m, i) => (
                      <div key={i} className="flex gap-3 items-start" style={{
                        padding: '10px 12px', borderRadius: 10,
                        background: 'rgba(248,113,113,0.06)',
                        border: '1px solid rgba(248,113,113,0.12)',
                        fontSize: 13, color: 'rgba(226,232,240,0.72)',
                      }}>
                        <span style={{ color: '#f87171', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>✕</span>
                        <span style={{ lineHeight: 1.6 }}>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk disclaimer */}
                <div style={{
                  display: 'flex', gap: 12, padding: 16, borderRadius: 12,
                  background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.18)',
                }}>
                  <AlertTriangle style={{ width: 16, height: 16, color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, color: 'rgba(253,230,138,0.6)', lineHeight: 1.7 }}>
                    <strong style={{ color: 'rgba(253,230,138,0.85)' }}>Educational Model Only.</strong>{' '}
                    This is a pattern model for learning purposes, not a trading signal or financial advice. Always backtest on your own data and manage risk independently.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SetupsPage() {
  const [filterLevel, setFilterLevel] = useState<'all' | 'beginner' | 'intermediate' | 'professional'>('all');
  const [selected, setSelected] = useState<Setup | null>(null);

  const filtered = filterLevel === 'all' ? SETUPS : SETUPS.filter(s => s.level === filterLevel);
  const groups = {
    beginner:     filtered.filter(s => s.level === 'beginner'),
    intermediate: filtered.filter(s => s.level === 'intermediate'),
    professional: filtered.filter(s => s.level === 'professional'),
  };

  const filterTabs = [
    { key: 'all'          as const, label: 'All Setups',   count: SETUPS.length,                                    icon: <Layers style={{ width: 12, height: 12 }} /> },
    { key: 'beginner'     as const, label: 'Beginner',     count: SETUPS.filter(s => s.level === 'beginner').length,     icon: <BookOpen style={{ width: 12, height: 12 }} /> },
    { key: 'intermediate' as const, label: 'Intermediate', count: SETUPS.filter(s => s.level === 'intermediate').length, icon: <Activity style={{ width: 12, height: 12 }} /> },
    { key: 'professional' as const, label: 'Professional', count: SETUPS.filter(s => s.level === 'professional').length, icon: <Zap style={{ width: 12, height: 12 }} /> },
  ];

  return (
    <div className="tm-app" style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)', color: 'var(--text-strong)', paddingBottom: 64 }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(6,9,16,0.97)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}>
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-4">
          <Link href="/app" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 12px', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(148,163,184,0.6)', fontSize: 13, textDecoration: 'none',
            transition: 'background 0.15s',
          }}>
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <div>
            <h1 style={{
              fontSize: 20, fontWeight: 800, lineHeight: 1.1,
              background: 'linear-gradient(to right, #a78bfa, #818cf8, rgba(255,255,255,0.7))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Setups Library
            </h1>
            <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)', marginTop: 1 }}>
              {SETUPS.length} trading setups · annotated chart examples + step-by-step plans
            </p>
          </div>

          {/* Stats pills */}
          <div className="hidden md:flex items-center gap-2 ml-auto">
            {[
              { label: 'Beginner', count: 2, color: '#34d399' },
              { label: 'Intermediate', count: 2, color: '#60a5fa' },
              { label: 'Pro', count: 4, color: '#a78bfa' },
            ].map(s => (
              <div key={s.label} style={{
                padding: '4px 10px', borderRadius: 8,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                fontSize: 11, color: 'rgba(148,163,184,0.5)',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                {s.count} {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{
        position: 'sticky', top: 57, zIndex: 20,
        background: 'rgba(6,9,16,0.96)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
      }}>
        <div className="max-w-6xl mx-auto px-2 sm:px-6 py-2.5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
          {filterTabs.map(tab => {
            const active = filterLevel === tab.key;
            const color = tab.key === 'beginner' ? '#34d399' : tab.key === 'intermediate' ? '#60a5fa' : tab.key === 'professional' ? '#a78bfa' : '#94a3b8';
            return (
              <motion.button
                key={tab.key}
                onClick={() => setFilterLevel(tab.key)}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px', borderRadius: 10,
                  fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                  background: active ? `${color}15` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? `${color}40` : 'rgba(255,255,255,0.07)'}`,
                  color: active ? color : 'rgba(148,163,184,0.5)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {tab.icon}
                {tab.label}
                <span style={{
                  padding: '1px 6px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                  background: active ? `${color}20` : 'rgba(255,255,255,0.06)',
                  color: active ? color : 'rgba(148,163,184,0.4)',
                }}>{tab.count}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* How-to-use banner */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-6">
        <div style={{
          borderRadius: 16, padding: '18px 20px',
          background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(129,140,248,0.03))',
          border: '1px solid rgba(167,139,250,0.16)',
        }}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen style={{ width: 15, height: 15, color: '#a78bfa' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9' }}>New here? How to use this library</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            {[
              { n: 1, t: 'Pick your level', d: 'Start with Beginner setups and work up. Each card shows difficulty and reward-to-risk.' },
              { n: 2, t: 'Open a setup', d: 'See an annotated chart, a plain-English explanation and a step-by-step trade plan.' },
              { n: 3, t: 'Practice first', d: 'Backtest or paper-trade it on your own charts before risking real money.' },
            ].map(s => (
              <div key={s.n} className="flex gap-3" style={{ fontSize: 12, color: 'rgba(203,213,225,0.75)' }}>
                <span style={{
                  flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(167,139,250,0.15)', color: '#c4b5fd', border: '1px solid rgba(167,139,250,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800,
                }}>{s.n}</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 2 }}>{s.t}</div>
                  <div style={{ lineHeight: 1.5 }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Chart legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2" style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Chart legend:</span>
            {[
              { line: true, color: '#34d399', label: 'Take Profit' },
              { line: true, color: '#f87171', label: 'Stop Loss' },
              { swatch: '#f59e0b', label: 'Entry candle' },
              { swatch: 'rgba(129,140,248,0.5)', label: 'Key zone' },
              { line: true, color: '#5b8def', label: 'Moving average' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'rgba(148,163,184,0.55)' }}>
                {item.line ? (
                  <svg width="18" height="8"><line x1="0" y1="4" x2="18" y2="4" stroke={item.color} strokeWidth="1.5" strokeDasharray="4,3" /></svg>
                ) : (
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: item.swatch }} />
                )}
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-8" style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        {(['beginner', 'intermediate', 'professional'] as const).map(level => {
          const ls = groups[level];
          if (ls.length === 0) return null;
          const cfg = LEVEL_CFG[level];

          return (
            <section key={level}>
              {/* Section header */}
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-end gap-4 mb-6"
                style={{ paddingBottom: 16, borderBottom: `1px solid ${cfg.color}18` }}
              >
                <div style={{
                  width: 3, height: 36, borderRadius: 99,
                  background: `linear-gradient(to bottom, ${cfg.color}, ${cfg.color}30)`,
                  flexShrink: 0,
                }} />
                <div>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: cfg.color,
                    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4,
                  }}>{cfg.icon} {cfg.label}</div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2 }}>
                    {level === 'beginner'     && 'Foundation Setups'}
                    {level === 'intermediate' && 'Intermediate Setups'}
                    {level === 'professional' && 'Professional Setups'}
                  </h2>
                  <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.45)', marginTop: 3 }}>
                    {level === 'beginner'     && 'Clear rules, simple execution — perfect starting point'}
                    {level === 'intermediate' && 'Requires understanding of market structure and order flow'}
                    {level === 'professional' && 'Advanced confluence strategies — multi-timeframe, high R:R'}
                  </p>
                </div>
                <span style={{
                  marginLeft: 'auto', fontSize: 11, color: 'rgba(148,163,184,0.3)',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  padding: '3px 10px', borderRadius: 99,
                }}>
                  {ls.length} {ls.length === 1 ? 'setup' : 'setups'}
                </span>
              </motion.div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {ls.map(s => (
                  <SetupCard key={s.id} setup={s} onClick={() => setSelected(s)} />
                ))}
              </div>
            </section>
          );
        })}

        {/* Bottom note */}
        <div className="flex items-center gap-2 justify-center" style={{
          padding: '12px 20px', borderRadius: 12,
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <AlertTriangle style={{ width: 13, height: 13, color: 'rgba(245,158,11,0.5)' }} />
          <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.35)', textAlign: 'center' }}>
            All setups are educational models only. Not financial advice. Always backtest and manage your own risk.
          </p>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selected && <SetupModal setup={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
