'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, X, AlertTriangle, Star, TrendingUp, TrendingDown, BarChart2, Target, Shield, CheckCircle, XCircle, Clock, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Candle { o: number; h: number; l: number; c: number; v: number; }
interface HLine { y: number; label: string; color: string; }
interface Zone { y1: number; y2: number; label?: string; color: string; }
interface TLine { x1: number; y1: number; x2: number; y2: number; color?: string; }

interface Setup {
  id: string;
  level: 'beginner' | 'amateur' | 'professional';
  title: string;
  type: string;
  timeframe: string;
  direction: 'Long' | 'Short' | 'Both';
  marketCondition: 'Trending' | 'Ranging' | 'Both';
  rr: string;
  winRateRange: string;
  difficulty: number;
  description: string;
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

// ─── Candle Chart (SVG) ──────────────────────────────────────────────────────
function CandleChart({
  candles, hlines = [], zones = [], trendlines = [],
  entryCandle, slPrice, tpPrice,
  vw = 300, vh = 180, labels = true,
}: {
  candles: Candle[]; hlines?: HLine[]; zones?: Zone[]; trendlines?: TLine[];
  entryCandle?: number; slPrice?: number; tpPrice?: number;
  vw?: number; vh?: number; labels?: boolean;
}) {
  const PL = 8, PR = 48, PT = 10, PB = 4, VOLH = 20, GAP = 3;
  const PH = vh - PT - PB - VOLH - GAP;
  const CW = vw - PL - PR;

  const allP = candles.flatMap(c => [c.h, c.l]);
  if (slPrice != null) allP.push(slPrice);
  if (tpPrice != null) allP.push(tpPrice);
  hlines.forEach(h => allP.push(h.y));
  zones.forEach(z => { allP.push(z.y1); allP.push(z.y2); });

  const rawMax = Math.max(...allP);
  const rawMin = Math.min(...allP);
  const rng = rawMax === rawMin ? 0.001 : rawMax - rawMin;
  const maxP = rawMax + rng * 0.1;
  const minP = rawMin - rng * 0.1;
  const pRng = maxP - minP;

  const py = (p: number) => PT + ((maxP - p) / pRng) * PH;
  const volBase = PT + PH + GAP + VOLH;
  const maxVol = Math.max(...candles.map(c => c.v));
  const vy = (v: number) => volBase - (v / maxVol) * VOLH;

  const n = candles.length;
  const step = CW / n;
  const bw = Math.max(step * 0.56, 3);
  const cx = (i: number) => PL + (i + 0.5) * step;

  // Y-axis price labels
  const yAxisPrices = [
    { p: maxP - pRng * 0.05, y: PT + PH * 0.05 },
    { p: maxP - pRng * 0.5,  y: PT + PH * 0.5 },
    { p: minP + pRng * 0.05, y: PT + PH * 0.95 },
  ];

  const fmtP = (p: number) => p.toFixed(4);

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} width="100%" height="100%" preserveAspectRatio="none">
      {/* Background */}
      <rect width={vw} height={vh} fill="#06090f" />
      <rect width={vw} height={vh} fill="rgba(34,211,238,0.02)" />

      {/* Horizontal grid lines */}
      {[0.25, 0.5, 0.75, 1.0].map((f, i) => (
        <line key={`hg${i}`}
          x1={PL} y1={PT + f * PH}
          x2={vw - PR} y2={PT + f * PH}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}

      {/* Vertical right-edge separator */}
      <line x1={vw - PR} y1={PT} x2={vw - PR} y2={PT + PH + GAP + VOLH}
        stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* Volume separator */}
      <line x1={PL} y1={PT + PH + GAP} x2={vw - PR} y2={PT + PH + GAP}
        stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

      {/* Zones */}
      {zones.map((z, i) => {
        const y = Math.min(py(z.y1), py(z.y2));
        const h = Math.max(Math.abs(py(z.y1) - py(z.y2)), 2);
        return <rect key={`z${i}`} x={PL} y={y} width={CW} height={h}
          fill={z.color.replace(/[\d.]+\)$/, '0.12)')} />;
      })}

      {/* HLines */}
      {hlines.map((h, i) => (
        <g key={`hl${i}`}>
          <line x1={PL} y1={py(h.y)} x2={vw - PR} y2={py(h.y)}
            stroke={h.color} strokeWidth="1" strokeDasharray="4,3" opacity="0.75" />
          {labels && h.label && (
            <text x={vw - PR + 3} y={py(h.y) + 2.5}
              fill={h.color} fontSize="5.5" fontFamily="monospace" opacity="0.75">{h.label}</text>
          )}
        </g>
      ))}

      {/* TP dashed line + right label pill */}
      {tpPrice != null && (
        <g>
          <line x1={PL} y1={py(tpPrice)} x2={vw - PR} y2={py(tpPrice)}
            stroke="#34d399" strokeWidth="1.5" strokeDasharray="6,3" />
          <rect x={vw - PR + 1} y={py(tpPrice) - 5} width={PR - 2} height={10}
            fill="rgba(52,211,153,0.15)" rx="2" />
          <text x={vw - PR + (PR - 2) / 2 + 1} y={py(tpPrice) + 3}
            fill="#34d399" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">TP</text>
        </g>
      )}

      {/* SL dashed line + right label pill */}
      {slPrice != null && (
        <g>
          <line x1={PL} y1={py(slPrice)} x2={vw - PR} y2={py(slPrice)}
            stroke="#f87171" strokeWidth="1.5" strokeDasharray="6,3" />
          <rect x={vw - PR + 1} y={py(slPrice) - 5} width={PR - 2} height={10}
            fill="rgba(248,113,113,0.15)" rx="2" />
          <text x={vw - PR + (PR - 2) / 2 + 1} y={py(slPrice) + 3}
            fill="#f87171" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">SL</text>
        </g>
      )}

      {/* Trendlines */}
      {trendlines.map((tl, i) => (
        <line key={`tl${i}`}
          x1={cx(tl.x1)} y1={py(tl.y1)} x2={cx(tl.x2)} y2={py(tl.y2)}
          stroke="#60a5fa" strokeWidth="1.5" opacity="0.7" strokeLinecap="round" />
      ))}

      {/* Volume bars */}
      {candles.map((c, i) => (
        <rect key={`v${i}`}
          x={cx(i) - bw / 2} y={vy(c.v)} width={bw} height={volBase - vy(c.v)}
          fill={c.c >= c.o ? 'rgba(34,211,238,0.15)' : 'rgba(248,113,113,0.15)'} rx="1" />
      ))}

      {/* Candles */}
      {candles.map((c, i) => {
        const isUp = c.c >= c.o;
        const isE = i === entryCandle;
        let col: string;
        if (isE) col = '#f59e0b';
        else if (isUp) col = '#22d3ee';
        else col = '#f87171';

        const by = py(Math.max(c.o, c.c));
        const bh = Math.max(py(Math.min(c.o, c.c)) - by, 1.5);
        const bodyFill = isE ? '#f59e0b' : isUp ? '#22d3ee' : 'transparent';
        return (
          <g key={`c${i}`}>
            {/* Wick */}
            <line x1={cx(i)} y1={py(c.h)} x2={cx(i)} y2={py(c.l)}
              stroke={col} strokeWidth="1.2" />
            {/* Body */}
            <rect x={cx(i) - bw / 2} y={by} width={bw} height={bh}
              fill={bodyFill} stroke={col} strokeWidth={isE ? 2.5 : 1.5} rx="1" />
          </g>
        );
      })}

      {/* Entry arrow: small amber triangle below the entry candle wick */}
      {entryCandle != null && (
        <polygon
          points={`${cx(entryCandle)},${py(candles[entryCandle].l) + 12} ${cx(entryCandle) - 4},${py(candles[entryCandle].l) + 19} ${cx(entryCandle) + 4},${py(candles[entryCandle].l) + 19}`}
          fill="#f59e0b" opacity="0.9"
        />
      )}

      {/* Y-axis price labels on right */}
      {labels && yAxisPrices.map((item, i) => (
        <text key={`ya${i}`}
          x={vw - PR + 3} y={item.y + 2}
          fill="rgba(148,163,184,0.45)" fontSize="6.5" fontFamily="monospace">{fmtP(item.p)}</text>
      ))}
    </svg>
  );
}

// ─── Setup Data ──────────────────────────────────────────────────────────────
const SETUPS: Setup[] = [
  {
    id: 'b-trend',
    level: 'beginner',
    title: 'Market Structure Trend',
    type: 'Smart Money',
    timeframe: '1H / 4H',
    direction: 'Both',
    marketCondition: 'Trending',
    rr: '1:2',
    winRateRange: '45–55%',
    difficulty: 1,
    description: 'Trade pullbacks in a clear uptrend or downtrend using Higher Highs / Higher Lows structure.',
    concept: 'Price moves in waves. An uptrend creates Higher Highs (HH) and Higher Lows (HL). When price pulls back to an HL zone and shows bullish rejection, that\'s a high-probability long entry with the trend. The opposite applies for downtrends.',
    candles: [
      { o: 1.1008, h: 1.1055, l: 1.1000, c: 1.1048, v: 80 },
      { o: 1.1048, h: 1.1098, l: 1.1042, c: 1.1090, v: 100 },
      { o: 1.1090, h: 1.1102, l: 1.1060, c: 1.1066, v: 65 },
      { o: 1.1066, h: 1.1074, l: 1.1038, c: 1.1044, v: 72 },
      { o: 1.1044, h: 1.1082, l: 1.1036, c: 1.1077, v: 132 },
      { o: 1.1077, h: 1.1122, l: 1.1070, c: 1.1115, v: 148 },
      { o: 1.1115, h: 1.1152, l: 1.1108, c: 1.1145, v: 135 },
    ],
    entryCandle: 4,
    slPrice: 1.1026,
    tpPrice: 1.1142,
    hlines: [
      { y: 1.1098, label: 'HH', color: '#60a5fa' },
      { y: 1.1038, label: 'HL', color: '#60a5fa' },
    ],
    zones: [],
    trendlines: [{ x1: 0, y1: 1.1000, x2: 3, y2: 1.1038, color: '#60a5fa' }],
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
      'Entry zone near round number (1.1000, 1.1050)',
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
    id: 'b-sr',
    level: 'beginner',
    title: 'Support / Resistance Bounce',
    type: 'Technical Analysis',
    timeframe: '4H / Daily',
    direction: 'Both',
    marketCondition: 'Both',
    rr: '1:2',
    winRateRange: '40–52%',
    difficulty: 1,
    description: 'Enter when price bounces from a clear horizontal support or resistance level on 4H or Daily.',
    concept: 'Institutional buyers/sellers cluster orders at previously significant price levels. When price returns to these areas, a reaction (bounce) is expected. The more times a level has been tested, the more significant it is.',
    candles: [
      { o: 1.1150, h: 1.1162, l: 1.1128, c: 1.1133, v: 92 },
      { o: 1.1133, h: 1.1140, l: 1.1098, c: 1.1104, v: 112 },
      { o: 1.1104, h: 1.1110, l: 1.1068, c: 1.1073, v: 102 },
      { o: 1.1073, h: 1.1082, l: 1.1060, c: 1.1078, v: 70 },
      { o: 1.1078, h: 1.1120, l: 1.1072, c: 1.1115, v: 158 },
      { o: 1.1115, h: 1.1148, l: 1.1108, c: 1.1142, v: 132 },
      { o: 1.1142, h: 1.1168, l: 1.1135, c: 1.1162, v: 122 },
    ],
    entryCandle: 4,
    slPrice: 1.1052,
    tpPrice: 1.1158,
    hlines: [
      { y: 1.1065, label: 'SUPPORT', color: '#10b981' },
      { y: 1.1160, label: 'RESISTANCE', color: '#ef4444' },
    ],
    zones: [
      { y1: 1.1072, y2: 1.1060, color: '#10b98115', label: 'Support Zone' },
    ],
    trendlines: [],
    steps: [
      'On Daily chart, identify a price level that was touched at least 2–3 times before',
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
      'If price closes BELOW support on 4H → support broken, exit all',
    ],
    commonMistakes: [
      'Entering before price actually reaches support (anticipating)',
      'Trading a support level that was already broken and retested',
      'Ignoring Daily trend — counter-trend bounces have low success rate',
      'Holding through news events near the level',
    ],
  },

  {
    id: 'a-sweep',
    level: 'amateur',
    title: 'Liquidity Sweep Reversal',
    type: 'Smart Money',
    timeframe: '15m / 1H',
    direction: 'Both',
    marketCondition: 'Both',
    rr: '1:3',
    winRateRange: '48–58%',
    difficulty: 2,
    description: 'Smart money engineers a false breakout above/below a key level to grab liquidity, then reverses sharply.',
    concept: 'Retail traders place stop losses just above swing highs or below swing lows. Smart money (banks, institutions) deliberately push price through these levels to fill their orders — this is called a "liquidity sweep". After the sweep, price rapidly reverses. Trading the reversal gives you an asymmetric opportunity.',
    candles: [
      { o: 1.1068, h: 1.1085, l: 1.1060, c: 1.1080, v: 68 },
      { o: 1.1080, h: 1.1090, l: 1.1072, c: 1.1075, v: 62 },
      { o: 1.1075, h: 1.1118, l: 1.1071, c: 1.1112, v: 165 },
      { o: 1.1112, h: 1.1115, l: 1.1065, c: 1.1068, v: 188 },
      { o: 1.1068, h: 1.1072, l: 1.1035, c: 1.1038, v: 152 },
      { o: 1.1038, h: 1.1045, l: 1.1005, c: 1.1010, v: 132 },
      { o: 1.1010, h: 1.1016, l: 1.0985, c: 1.0990, v: 118 },
    ],
    entryCandle: 4,
    slPrice: 1.1125,
    tpPrice: 1.0998,
    hlines: [
      { y: 1.1090, label: 'LIQUIDITY', color: '#f59e0b' },
    ],
    zones: [
      { y1: 1.1095, y2: 1.1085, color: '#f59e0b18', label: 'Liquidity Zone' },
    ],
    trendlines: [],
    steps: [
      'Identify a clear swing high with multiple wicks (retail stop cluster above it)',
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
    id: 'a-ob',
    level: 'amateur',
    title: 'Order Block Reversal',
    type: 'Smart Money',
    timeframe: '4H / Daily',
    direction: 'Both',
    marketCondition: 'Trending',
    rr: '1:3',
    winRateRange: '48–60%',
    difficulty: 3,
    description: 'The last bearish candle before a strong bullish impulse becomes a support zone. When price returns to it, expect a bounce.',
    concept: 'An Order Block is the last opposing candle before a strong directional move. Banks and institutions place large limit orders in this zone. When price returns to these levels months or weeks later, those pending orders activate — creating a powerful rejection. This is one of the core Smart Money Concepts (SMC).',
    candles: [
      { o: 1.1072, h: 1.1080, l: 1.1048, c: 1.1052, v: 102 },
      { o: 1.1052, h: 1.1122, l: 1.1048, c: 1.1115, v: 185 },
      { o: 1.1115, h: 1.1152, l: 1.1108, c: 1.1145, v: 168 },
      { o: 1.1145, h: 1.1152, l: 1.1072, c: 1.1080, v: 125 },
      { o: 1.1080, h: 1.1118, l: 1.1068, c: 1.1112, v: 178 },
      { o: 1.1112, h: 1.1145, l: 1.1105, c: 1.1140, v: 158 },
      { o: 1.1140, h: 1.1170, l: 1.1132, c: 1.1165, v: 142 },
    ],
    entryCandle: 4,
    slPrice: 1.1038,
    tpPrice: 1.1158,
    hlines: [
      { y: 1.1080, label: 'OB HIGH', color: '#a855f7' },
      { y: 1.1048, label: 'OB LOW', color: '#a855f7' },
    ],
    zones: [
      { y1: 1.1080, y2: 1.1048, color: '#a855f720', label: 'Order Block' },
    ],
    trendlines: [],
    steps: [
      'Identify a strong bullish impulse on 4H — at least 3–4 large bullish candles',
      'Find the LAST bearish candle before this impulse started — that is the Order Block',
      'Mark the OB zone: from OB candle HIGH to OB candle LOW',
      'Wait for price to retrace back DOWN into this OB zone',
      'On 1H, look for bullish rejection inside the zone (long wick or 2 green candles)',
      'Enter LONG at the midpoint of the OB zone',
      'SL: 10 pips below the OB LOW',
      'TP: Previous structure high (where the impulse started)',
    ],
    confluence: [
      'OB aligns with a Daily support or Fibonacci 61.8% retracement',
      'RSI below 40 when price enters OB (oversold)',
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
    id: 'p-fvg',
    level: 'professional',
    title: 'Fair Value Gap Mitigation',
    type: 'Smart Money',
    timeframe: '15m / 1H',
    direction: 'Both',
    marketCondition: 'Trending',
    rr: '1:4',
    winRateRange: '52–65%',
    difficulty: 4,
    description: 'A 3-candle imbalance (FVG) forms during a fast move. Price returns to fill the gap — entry at the rejection.',
    concept: 'A Fair Value Gap (FVG) is a 3-candle pattern where price moves so fast that a gap forms between Candle 1\'s low and Candle 3\'s high (for a bearish FVG). This "imbalance" acts like a magnet — price is attracted back to fill it. Smart money uses these zones as entry points after the fill.',
    candles: [
      { o: 1.1148, h: 1.1158, l: 1.1118, c: 1.1122, v: 102 },
      { o: 1.1122, h: 1.1125, l: 1.1058, c: 1.1062, v: 205 },
      { o: 1.1062, h: 1.1092, l: 1.1055, c: 1.1088, v: 88 },
      { o: 1.1088, h: 1.1122, l: 1.1082, c: 1.1118, v: 125 },
      { o: 1.1118, h: 1.1122, l: 1.1080, c: 1.1084, v: 162 },
      { o: 1.1084, h: 1.1090, l: 1.1048, c: 1.1052, v: 142 },
      { o: 1.1052, h: 1.1058, l: 1.1020, c: 1.1025, v: 128 },
    ],
    entryCandle: 4,
    slPrice: 1.1132,
    tpPrice: 1.1032,
    hlines: [
      { y: 1.1118, label: 'FVG HIGH', color: '#06b6d4' },
      { y: 1.1092, label: 'FVG LOW', color: '#06b6d4' },
    ],
    zones: [
      { y1: 1.1118, y2: 1.1092, color: '#06b6d420', label: 'Fair Value Gap' },
    ],
    trendlines: [],
    steps: [
      'Spot a 3-candle sequence where Candle 2 is a large fast candle (engine)',
      'Verify: Candle 1 LOW is higher than Candle 3 HIGH — that gap is the FVG',
      'Mark the FVG zone: from C1.Low to C3.High',
      'Wait for price to retrace INTO the FVG zone',
      'Look for rejection candle inside the FVG (long wick + close back outside)',
      'Combine with an Order Block inside the FVG for higher probability',
      'Enter SHORT at top of FVG on rejection; SL above FVG HIGH + 5 pips',
      'TP: Previous structure low or 1:4 R:R target',
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
      'Trading FVGs against the major trend (counter-trend FVGs fail more often)',
      'Not accounting for spread — especially important on 15m entries',
      'Exiting too early inside the FVG before price shows rejection',
    ],
  },

  {
    id: 'p-breaker',
    level: 'professional',
    title: 'Breaker Block + Structure Shift',
    type: 'Smart Money',
    timeframe: 'Daily / Weekly',
    direction: 'Both',
    marketCondition: 'Trending',
    rr: '1:5',
    winRateRange: '50–62%',
    difficulty: 5,
    description: 'A failed Order Block becomes a Breaker Block. When price returns to the broken zone, it acts as strong support/resistance.',
    concept: 'When price breaks THROUGH an Order Block (instead of respecting it), that OB becomes a "Breaker Block". The failure reveals a shift in market structure. When price later returns to this zone for a retest, it provides an extremely high-conviction entry. Used by professional traders to catch high R:R macro moves.',
    candles: [
      { o: 1.1118, h: 1.1128, l: 1.1090, c: 1.1095, v: 112 },
      { o: 1.1095, h: 1.1100, l: 1.1062, c: 1.1068, v: 92 },
      { o: 1.1068, h: 1.1142, l: 1.1062, c: 1.1138, v: 202 },
      { o: 1.1138, h: 1.1152, l: 1.1092, c: 1.1098, v: 132 },
      { o: 1.1098, h: 1.1140, l: 1.1090, c: 1.1135, v: 178 },
      { o: 1.1135, h: 1.1165, l: 1.1128, c: 1.1160, v: 158 },
      { o: 1.1160, h: 1.1190, l: 1.1152, c: 1.1185, v: 145 },
    ],
    entryCandle: 4,
    slPrice: 1.1078,
    tpPrice: 1.1178,
    hlines: [
      { y: 1.1128, label: 'BB HIGH', color: '#ec4899' },
      { y: 1.1090, label: 'BB LOW', color: '#ec4899' },
    ],
    zones: [
      { y1: 1.1128, y2: 1.1090, color: '#ec489920', label: 'Breaker Block' },
    ],
    trendlines: [],
    steps: [
      'On Weekly/Daily, find a bearish OB that price has now broken THROUGH to the upside',
      'That former bearish OB is now a BULLISH Breaker Block',
      'Mark the Breaker Block zone (same high/low as the original OB)',
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
    id: 'p-profile',
    level: 'professional',
    title: 'Market Profile + Value Area',
    type: 'Market Profile',
    timeframe: 'All Timeframes',
    direction: 'Both',
    marketCondition: 'Both',
    rr: '1:3',
    winRateRange: '55–65%',
    difficulty: 5,
    description: 'Trade breakouts from Value Area using volume distribution — where price spends most time vs. where it rejects.',
    concept: 'Market Profile maps price against time and volume. The Value Area (VA) is the range where 70% of volume traded. The Point of Control (POC) is the single price with most volume. When price breaks out of the VA with increasing volume, it signals a strong directional move. Trading VA extremes gives clear, defined risk.',
    candles: [
      { o: 1.1075, h: 1.1092, l: 1.1068, c: 1.1087, v: 142 },
      { o: 1.1087, h: 1.1094, l: 1.1072, c: 1.1076, v: 122 },
      { o: 1.1076, h: 1.1085, l: 1.1065, c: 1.1080, v: 132 },
      { o: 1.1080, h: 1.1112, l: 1.1075, c: 1.1108, v: 195 },
      { o: 1.1108, h: 1.1140, l: 1.1102, c: 1.1135, v: 215 },
      { o: 1.1135, h: 1.1162, l: 1.1128, c: 1.1158, v: 188 },
      { o: 1.1158, h: 1.1180, l: 1.1150, c: 1.1175, v: 168 },
    ],
    entryCandle: 4,
    slPrice: 1.1086,
    tpPrice: 1.1165,
    hlines: [
      { y: 1.1094, label: 'VA HIGH', color: '#0ea5e9' },
      { y: 1.1082, label: 'POC', color: '#f59e0b' },
      { y: 1.1065, label: 'VA LOW', color: '#0ea5e9' },
    ],
    zones: [
      { y1: 1.1094, y2: 1.1065, color: '#0ea5e915', label: 'Value Area' },
    ],
    trendlines: [],
    steps: [
      'Load Market Profile or Volume Profile indicator on your platform',
      'Identify the Value Area High (VAH), Value Area Low (VAL), and POC for the current session',
      'When price is inside the VA, it tends to oscillate — WAIT at extremes',
      'When price breaks ABOVE VAH with high volume → enter LONG',
      'When price breaks BELOW VAL with high volume → enter SHORT',
      'SL: just inside the Value Area (if price returns, the breakout failed)',
      'TP: 1:3 to next session\'s expected Value Area or key structure',
    ],
    confluence: [
      'Breakout happens at session open (London/NY — highest volume)',
      'Volume is 150%+ above average during breakout candle',
      'Previous day profile supports direction (trending vs. balanced)',
      'Overnight inventory positioning confirms direction',
    ],
    exitStrategy: [
      'Exit at next Value Area high from previous sessions',
      'Trail using VWAP as dynamic support/resistance',
      'Exit if price re-enters Value Area — breakout failed',
    ],
    commonMistakes: [
      'Trading volume profile without proper software/data (fake profiles)',
      'Entering breakout without volume confirmation (false breakout risk)',
      'Confusing Value Area from different timeframes',
      'Not adjusting for gap opens in futures/indices',
    ],
  },

  {
    id: 'p-div',
    level: 'professional',
    title: 'Hidden Divergence + Momentum',
    type: 'Technical Analysis',
    timeframe: 'Multi-Timeframe',
    direction: 'Both',
    marketCondition: 'Trending',
    rr: '1:3',
    winRateRange: '50–60%',
    difficulty: 4,
    description: 'Hidden divergence between price and RSI signals trend continuation — a powerful low-risk entry in the direction of the trend.',
    concept: 'Hidden Divergence occurs when price makes a Higher Low but RSI makes a Lower Low (bullish hidden div — continuation up), or price makes a Lower High while RSI makes a Higher High (bearish hidden div — continuation down). Unlike regular divergence which signals reversals, hidden divergence signals CONTINUATION of the existing trend.',
    candles: [
      { o: 1.1058, h: 1.1082, l: 1.1050, c: 1.1078, v: 80 },
      { o: 1.1078, h: 1.1090, l: 1.1060, c: 1.1064, v: 72 },
      { o: 1.1064, h: 1.1072, l: 1.1042, c: 1.1048, v: 88 },
      { o: 1.1048, h: 1.1098, l: 1.1044, c: 1.1092, v: 112 },
      { o: 1.1092, h: 1.1102, l: 1.1068, c: 1.1072, v: 148 },
      { o: 1.1072, h: 1.1078, l: 1.1038, c: 1.1042, v: 132 },
      { o: 1.1042, h: 1.1048, l: 1.1012, c: 1.1018, v: 118 },
    ],
    entryCandle: 4,
    slPrice: 1.1110,
    tpPrice: 1.1020,
    hlines: [
      { y: 1.1082, label: 'PREV HIGH', color: '#60a5fa' },
      { y: 1.1098, label: 'NEW HH (Price)', color: '#60a5fa' },
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
      'Scale exits: 1/3 at 1:1, 1/3 at 1:2, let final 1/3 run with trailing SL',
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
      'Not waiting for 2+ oscillators to confirm (single RSI can be misleading)',
      'Entering on divergence that formed during a news spike',
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const LEVEL_CFG = {
  beginner: {
    label: 'Beginner',
    color: '#34d399',
    colorClass: 'text-emerald-400',
    accentFrom: '#34d399',
    accentTo: 'transparent',
    badgeBg: 'rgba(52,211,153,0.1)',
    badgeBorder: 'rgba(52,211,153,0.3)',
    badgeText: '#6ee7b7',
    grad: 'from-emerald-500 to-teal-500',
  },
  amateur: {
    label: 'Intermediate',
    color: '#60a5fa',
    colorClass: 'text-blue-400',
    accentFrom: '#60a5fa',
    accentTo: 'transparent',
    badgeBg: 'rgba(96,165,250,0.1)',
    badgeBorder: 'rgba(96,165,250,0.3)',
    badgeText: '#93c5fd',
    grad: 'from-blue-500 to-cyan-500',
  },
  professional: {
    label: 'Professional',
    color: '#a78bfa',
    colorClass: 'text-purple-400',
    accentFrom: '#a78bfa',
    accentTo: 'transparent',
    badgeBg: 'rgba(167,139,250,0.1)',
    badgeBorder: 'rgba(167,139,250,0.3)',
    badgeText: '#c4b5fd',
    grad: 'from-purple-500 to-pink-500',
  },
};

function DifficultyStars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= n ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`} />
      ))}
    </div>
  );
}

// ─── Setup Card ───────────────────────────────────────────────────────────────
function SetupCard({ setup, onClick }: { setup: Setup; onClick: () => void }) {
  const cfg = LEVEL_CFG[setup.level];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -3, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.15)' }}
      onClick={onClick}
      style={{
        background: 'rgba(7,10,20,0.85)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '1rem',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {/* Top accent bar */}
      <div style={{
        height: 2,
        background: `linear-gradient(to right, ${cfg.accentFrom}, ${cfg.accentTo})`,
      }} />

      {/* Chart area */}
      <div className="relative w-full" style={{ height: 160, background: '#06090f' }}>
        <CandleChart
          candles={setup.candles}
          hlines={setup.hlines}
          zones={setup.zones}
          trendlines={setup.trendlines}
          entryCandle={setup.entryCandle}
          slPrice={setup.slPrice}
          tpPrice={setup.tpPrice}
          vw={300} vh={160} labels={true}
        />
        {/* Direction badge — overlay top-right */}
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 8px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 700,
          background: 'rgba(7,10,20,0.82)',
          border: `1px solid ${cfg.badgeBorder}`,
          color: cfg.badgeText,
          backdropFilter: 'blur(4px)',
        }}>
          {setup.direction === 'Long'
            ? <TrendingUp style={{ width: 11, height: 11 }} />
            : setup.direction === 'Short'
              ? <TrendingDown style={{ width: 11, height: 11 }} />
              : <Layers style={{ width: 11, height: 11 }} />}
          {setup.direction}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: 16 }}>
        {/* Row 1: level badge + type tag */}
        <div className="flex items-center gap-2 mb-2">
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 99,
            background: cfg.badgeBg,
            border: `1px solid ${cfg.badgeBorder}`,
            color: cfg.badgeText,
          }}>{cfg.label}</span>
          <span style={{
            fontSize: 10,
            padding: '2px 8px',
            borderRadius: 99,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(148,163,184,0.7)',
          }}>{setup.type}</span>
        </div>

        {/* Title */}
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 6, lineHeight: 1.3 }}>
          {setup.title}
        </h3>

        {/* Description */}
        <p style={{
          fontSize: 12,
          color: 'rgba(148,163,184,0.65)',
          marginBottom: 10,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
          lineHeight: 1.5,
        }}>
          {setup.description}
        </p>

        {/* Timeframe tag */}
        <div className="flex items-center gap-1.5 mb-10px" style={{ marginBottom: 12 }}>
          <span style={{
            fontSize: 11,
            fontFamily: 'monospace',
            padding: '2px 8px',
            borderRadius: 6,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(148,163,184,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <Clock style={{ width: 10, height: 10 }} />
            {setup.timeframe}
          </span>
        </div>

        {/* Metrics row */}
        <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.45)', marginBottom: 2 }}>R:R</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#22d3ee' }}>{setup.rr}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.45)', marginBottom: 2 }}>Win Rate</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>{setup.winRateRange}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.45)', marginBottom: 2 }}>Difficulty</div>
            <DifficultyStars n={setup.difficulty} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Setup Modal ──────────────────────────────────────────────────────────────
function SetupModal({ setup, onClose }: { setup: Setup; onClose: () => void }) {
  const cfg = LEVEL_CFG[setup.level];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 768,
          margin: '16px 0',
          borderRadius: '1rem',
          background: '#070a14',
          border: '1px solid rgba(255,255,255,0.09)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Gradient top bar */}
        <div style={{
          height: 2,
          background: `linear-gradient(to right, ${cfg.accentFrom}, ${cfg.accentTo})`,
        }} />

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16, zIndex: 10,
            padding: '6px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
        >
          <X style={{ width: 18, height: 18, color: 'rgba(148,163,184,0.8)' }} />
        </button>

        {/* Header */}
        <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span style={{
              fontSize: 11, fontWeight: 600,
              padding: '3px 10px', borderRadius: 99,
              background: cfg.badgeBg, border: `1px solid ${cfg.badgeBorder}`, color: cfg.badgeText,
            }}>{cfg.label}</span>
            <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.5)' }}>{setup.type}</span>
            <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'rgba(148,163,184,0.5)' }}>
              <Clock style={{ width: 12, height: 12 }} />{setup.timeframe}
            </span>
          </div>
          <h2 className={`text-xl sm:text-2xl font-bold bg-gradient-to-r ${cfg.grad} bg-clip-text text-transparent`}>
            {setup.title}
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.65)', marginTop: 6, lineHeight: 1.6 }}>
            {setup.description}
          </p>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Chart section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 style={{ width: 14, height: 14, color: 'rgba(148,163,184,0.5)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pattern Visualization</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(148,163,184,0.3)', fontStyle: 'italic' }}>Educational model — not real data</span>
            </div>
            <div style={{
              height: 240, borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#06090f',
              overflow: 'hidden',
            }}>
              <CandleChart
                candles={setup.candles}
                hlines={setup.hlines}
                zones={setup.zones}
                trendlines={setup.trendlines}
                entryCandle={setup.entryCandle}
                slPrice={setup.slPrice}
                tpPrice={setup.tpPrice}
                vw={600} vh={240} labels={true}
              />
            </div>

            {/* Chart legend */}
            <div className="flex flex-wrap gap-4 mt-3 px-1">
              {[
                { line: true, color: '#34d399', dash: true, label: 'Take Profit (TP)' },
                { line: true, color: '#f87171', dash: true, label: 'Stop Loss (SL)' },
                { line: false, swatch: '#f59e0b', label: 'Entry Candle' },
                { line: false, swatch: 'rgba(129,140,248,0.3)', label: 'Key Zone' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'rgba(148,163,184,0.55)' }}>
                  {item.line ? (
                    <svg width="22" height="8">
                      <line x1="0" y1="4" x2="22" y2="4"
                        stroke={item.color} strokeWidth="1.5"
                        strokeDasharray={item.dash ? '5,3' : 'none'} />
                    </svg>
                  ) : (
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: item.swatch, border: `1.5px solid ${item.swatch}` }} />
                  )}
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Risk : Reward', value: setup.rr, icon: <Target style={{ width: 14, height: 14, color: '#22d3ee' }} />, col: '#22d3ee' },
              { label: 'Est. Win Rate', value: setup.winRateRange, icon: <TrendingUp style={{ width: 14, height: 14, color: '#34d399' }} />, col: '#34d399' },
              { label: 'Market Type', value: setup.marketCondition, icon: <BarChart2 style={{ width: 14, height: 14, color: '#60a5fa' }} />, col: '#60a5fa' },
            ].map((m, i) => (
              <div key={i} style={{
                borderRadius: 10, padding: '12px 14px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div className="flex items-center gap-1.5">
                  {m.icon}
                  <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.55)' }}>{m.label}</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: m.col }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Concept block */}
          <div style={{
            borderRadius: 12, padding: 16,
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.18)',
          }}>
            <div className="flex items-center gap-2 mb-2">
              <Layers style={{ width: 14, height: 14, color: '#f59e0b' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Core Concept</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(226,232,240,0.8)', lineHeight: 1.7 }}>{setup.concept}</p>
          </div>

          {/* Entry checklist + confluence/exit grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Entry checklist */}
            <div style={{
              borderRadius: 12, padding: 16,
              background: 'rgba(34,211,238,0.05)',
              border: '1px solid rgba(34,211,238,0.15)',
            }}>
              <div className="flex items-center gap-2 mb-3">
                <Target style={{ width: 14, height: 14, color: '#22d3ee' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#67e8f9', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Entry Checklist</span>
              </div>
              <ol style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {setup.steps.map((s, i) => (
                  <li key={i} className="flex gap-2.5" style={{ fontSize: 12, color: 'rgba(226,232,240,0.75)' }}>
                    <span style={{
                      flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                      background: 'rgba(34,211,238,0.15)', color: '#22d3ee',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700,
                    }}>{i + 1}</span>
                    <span style={{ paddingTop: 2, lineHeight: 1.6 }}>{s}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Confluence */}
              <div style={{
                borderRadius: 12, padding: 16,
                background: 'rgba(129,140,248,0.05)',
                border: '1px solid rgba(129,140,248,0.15)',
              }}>
                <div className="flex items-center gap-2 mb-3">
                  <Shield style={{ width: 14, height: 14, color: '#818cf8' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Confluence Factors</span>
                </div>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {setup.confluence.map((c, i) => (
                    <li key={i} className="flex gap-2" style={{ fontSize: 12, color: 'rgba(226,232,240,0.75)' }}>
                      <CheckCircle style={{ width: 13, height: 13, color: '#818cf8', flexShrink: 0, marginTop: 1 }} />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exit strategy */}
              <div style={{
                borderRadius: 12, padding: 16,
                background: 'rgba(52,211,153,0.05)',
                border: '1px solid rgba(52,211,153,0.15)',
              }}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp style={{ width: 14, height: 14, color: '#34d399' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Exit Strategy</span>
                </div>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {setup.exitStrategy.map((e, i) => (
                    <li key={i} className="flex gap-2" style={{ fontSize: 12, color: 'rgba(226,232,240,0.75)' }}>
                      <span style={{ color: '#34d399', fontWeight: 700, flexShrink: 0 }}>→</span>
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Common mistakes */}
          <div style={{
            borderRadius: 12, padding: 16,
            background: 'rgba(248,113,113,0.05)',
            border: '1px solid rgba(248,113,113,0.15)',
          }}>
            <div className="flex items-center gap-2 mb-3">
              <XCircle style={{ width: 14, height: 14, color: '#f87171' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Common Mistakes to Avoid</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {setup.commonMistakes.map((m, i) => (
                <div key={i} className="flex gap-2" style={{ fontSize: 12, color: 'rgba(148,163,184,0.65)' }}>
                  <span style={{ color: '#f87171', fontWeight: 700, flexShrink: 0 }}>✕</span>
                  {m}
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex gap-2" style={{
            padding: 12, borderRadius: 10,
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.2)',
          }}>
            <AlertTriangle style={{ width: 15, height: 15, color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: 'rgba(253,230,138,0.65)', lineHeight: 1.6 }}>
              <strong style={{ color: 'rgba(253,230,138,0.85)' }}>Educational Model Only.</strong>{' '}
              This is a pattern model for learning purposes, not a trading signal or financial advice. Always backtest on your own data and manage risk accordingly.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SetupsPage() {
  const [filterLevel, setFilterLevel] = useState<'all' | 'beginner' | 'amateur' | 'professional'>('all');
  const [selected, setSelected] = useState<Setup | null>(null);

  const filtered = filterLevel === 'all' ? SETUPS : SETUPS.filter(s => s.level === filterLevel);

  const groups = {
    beginner: filtered.filter(s => s.level === 'beginner'),
    amateur: filtered.filter(s => s.level === 'amateur'),
    professional: filtered.filter(s => s.level === 'professional'),
  };

  const filterTabs = [
    { key: 'all' as const, label: 'All', count: SETUPS.length },
    { key: 'beginner' as const, label: 'Beginner', count: SETUPS.filter(s => s.level === 'beginner').length },
    { key: 'amateur' as const, label: 'Intermediate', count: SETUPS.filter(s => s.level === 'amateur').length },
    { key: 'professional' as const, label: 'Professional', count: SETUPS.filter(s => s.level === 'professional').length },
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#070a12', color: '#fff', paddingBottom: 64 }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(5,7,15,0.96)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(16px)',
      }}>
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div>
            <h1 style={{
              fontSize: 22, fontWeight: 800,
              background: 'linear-gradient(to right, #a78bfa, #818cf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Setups Library
            </h1>
            <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.45)', marginTop: 2 }}>
              Pattern models with candlestick charts · Educational use only
            </p>
          </div>
          <Link href="/app" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(148,163,184,0.7)', fontSize: 13,
            textDecoration: 'none', transition: 'background 0.15s',
          }}>
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-2">
        <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.3)' }}>
          Not financial advice. Educational pattern models for learning purposes only.
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{
        position: 'sticky', top: 57, zIndex: 20,
        background: 'rgba(5,7,15,0.94)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
      }}>
        <div className="max-w-6xl mx-auto px-2 sm:px-6 py-3 flex items-center gap-2 sm:gap-3 overflow-x-auto">
          {filterTabs.map(tab => {
            const active = filterLevel === tab.key;
            return (
              <motion.button
                key={tab.key}
                onClick={() => setFilterLevel(tab.key)}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8,
                  fontSize: 12, fontWeight: 600,
                  whiteSpace: 'nowrap',
                  background: active ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.03)',
                  border: active ? '1px solid rgba(129,140,248,0.3)' : '1px solid rgba(255,255,255,0.07)',
                  color: active ? '#a5b4fc' : 'rgba(148,163,184,0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
                <span style={{
                  padding: '1px 6px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                  background: active ? 'rgba(129,140,248,0.25)' : 'rgba(255,255,255,0.06)',
                  color: active ? '#c7d2fe' : 'rgba(148,163,184,0.4)',
                }}>{tab.count}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-10" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        {(['beginner', 'amateur', 'professional'] as const).map(level => {
          const levelSetups = groups[level];
          if (levelSetups.length === 0) return null;
          const cfg = LEVEL_CFG[level];

          return (
            <motion.section key={level} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              {/* Section header */}
              <div className="flex items-end gap-4 mb-6" style={{ paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <h2 style={{
                    fontSize: 18, fontWeight: 700,
                    background: `linear-gradient(to right, ${cfg.color}, rgba(255,255,255,0.5))`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: 4,
                  }}>
                    {cfg.label} Setups
                  </h2>
                  <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.45)' }}>
                    {level === 'beginner' && 'Foundation patterns — clear rules, simple execution'}
                    {level === 'amateur' && 'Intermediate concepts — requires understanding of market structure'}
                    {level === 'professional' && 'Advanced confluence strategies — multi-timeframe, high R:R'}
                  </p>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(148,163,184,0.3)' }}>
                  {levelSetups.length} {levelSetups.length === 1 ? 'setup' : 'setups'}
                </span>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {levelSetups.map(setup => (
                  <SetupCard key={setup.id} setup={setup} onClick={() => setSelected(setup)} />
                ))}
              </div>
            </motion.section>
          );
        })}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selected && <SetupModal setup={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
