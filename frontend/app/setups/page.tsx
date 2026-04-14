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
  const PL = 28, PR = 6, PT = 8, PB = 4, VOLH = 26, GAP = 3;
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

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} width="100%" height="100%" preserveAspectRatio="none">
      <rect width={vw} height={vh} fill="#05050d" rx="4" />

      {/* Grid */}
      {[0.33, 0.66].map((f, i) => (
        <line key={i} x1={PL} y1={PT + f * PH} x2={vw - PR} y2={PT + f * PH} stroke="#111120" strokeWidth="1" />
      ))}
      <line x1={PL} y1={PT + PH + GAP} x2={vw - PR} y2={PT + PH + GAP} stroke="#111120" strokeWidth="1" />

      {/* Zones */}
      {zones.map((z, i) => {
        const y = Math.min(py(z.y1), py(z.y2));
        const h = Math.max(Math.abs(py(z.y1) - py(z.y2)), 2);
        return <rect key={i} x={PL} y={y} width={CW} height={h} fill={z.color} />;
      })}

      {/* TP */}
      {tpPrice != null && (
        <g>
          <line x1={PL} y1={py(tpPrice)} x2={vw - PR} y2={py(tpPrice)} stroke="#10b981" strokeWidth="1.5" strokeDasharray="5,3" />
          {labels && <text x={PL + 1} y={py(tpPrice) - 2} fill="#10b981" fontSize="7" fontFamily="monospace">TP</text>}
        </g>
      )}

      {/* SL */}
      {slPrice != null && (
        <g>
          <line x1={PL} y1={py(slPrice)} x2={vw - PR} y2={py(slPrice)} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,3" />
          {labels && <text x={PL + 1} y={py(slPrice) + 9} fill="#ef4444" fontSize="7" fontFamily="monospace">SL</text>}
        </g>
      )}

      {/* H-Lines */}
      {hlines.map((h, i) => (
        <g key={i}>
          <line x1={PL} y1={py(h.y)} x2={vw - PR} y2={py(h.y)} stroke={h.color} strokeWidth="1" strokeDasharray="4,3" opacity="0.8" />
          {labels && h.label && <text x={PL + 2} y={py(h.y) - 2} fill={h.color} fontSize="6.5" fontFamily="monospace">{h.label}</text>}
        </g>
      ))}

      {/* Trendlines */}
      {trendlines.map((tl, i) => (
        <line key={i} x1={cx(tl.x1)} y1={py(tl.y1)} x2={cx(tl.x2)} y2={py(tl.y2)}
          stroke={tl.color || '#60a5fa'} strokeWidth="1.5" opacity="0.85" strokeLinecap="round" />
      ))}

      {/* Volume */}
      {candles.map((c, i) => (
        <rect key={`v${i}`} x={cx(i) - bw / 2} y={vy(c.v)} width={bw} height={volBase - vy(c.v)}
          fill={c.c >= c.o ? '#10b98130' : '#ef444430'} rx="1" />
      ))}

      {/* Candles */}
      {candles.map((c, i) => {
        const isUp = c.c >= c.o;
        const isE = i === entryCandle;
        const col = isE ? '#f59e0b' : isUp ? '#10b981' : '#ef4444';
        const by = py(Math.max(c.o, c.c));
        const bh = Math.max(py(Math.min(c.o, c.c)) - by, 1.5);
        return (
          <g key={`c${i}`}>
            <line x1={cx(i)} y1={py(c.h)} x2={cx(i)} y2={py(c.l)} stroke={col} strokeWidth="1.5" />
            <rect x={cx(i) - bw / 2} y={by} width={bw} height={bh}
              fill={isUp ? col : '#05050d'} stroke={col} strokeWidth={isE ? 2 : 1.5} rx="1" />
          </g>
        );
      })}

      {/* Entry label */}
      {entryCandle != null && labels && (
        <text x={cx(entryCandle)} y={py(candles[entryCandle].l) + 18}
          fill="#f59e0b" fontSize="6.5" textAnchor="middle" fontFamily="monospace" fontWeight="bold">ENTRY</text>
      )}

      {/* VOL label */}
      <text x={PL + 1} y={PT + PH + GAP + 9} fill="#1e1e30" fontSize="6" fontFamily="monospace">VOL</text>
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
    label: 'Beginner', emoji: '🟢', color: 'text-emerald-400',
    border: 'border-emerald-500/30', bg: 'bg-emerald-500/5',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    grad: 'from-emerald-500 to-teal-500',
  },
  amateur: {
    label: 'Intermediate', emoji: '🔵', color: 'text-blue-400',
    border: 'border-blue-500/30', bg: 'bg-blue-500/5',
    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    grad: 'from-blue-500 to-cyan-500',
  },
  professional: {
    label: 'Professional', emoji: '💎', color: 'text-purple-400',
    border: 'border-purple-500/30', bg: 'bg-purple-500/5',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
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
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`group cursor-pointer rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden transition-all hover:border-opacity-60 hover:shadow-lg`}
    >
      {/* Mini Chart */}
      <div className="relative w-full" style={{ height: 150 }}>
        <CandleChart
          candles={setup.candles}
          hlines={setup.hlines}
          zones={setup.zones}
          trendlines={setup.trendlines}
          entryCandle={setup.entryCandle}
          slPrice={setup.slPrice}
          tpPrice={setup.tpPrice}
          vw={300} vh={150} labels={true}
        />
        {/* Direction badge */}
        <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${cfg.badge}`}>
          {setup.direction === 'Long' ? <TrendingUp className="w-3 h-3" /> : setup.direction === 'Short' ? <TrendingDown className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
          {setup.direction}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className={`font-bold text-base leading-tight group-hover:${cfg.color} transition-colors`}>{setup.title}</h3>
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded border ${cfg.badge}`}>{cfg.emoji} {cfg.label}</span>
        </div>

        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{setup.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-xs px-2 py-0.5 rounded bg-gray-800/60 text-gray-300 border border-gray-700/50">{setup.type}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-gray-800/60 text-gray-300 border border-gray-700/50 flex items-center gap-1">
            <Clock className="w-3 h-3" />{setup.timeframe}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded bg-gray-800/60 border border-gray-700/50 ${setup.marketCondition === 'Trending' ? 'text-cyan-400' : setup.marketCondition === 'Ranging' ? 'text-orange-400' : 'text-gray-300'}`}>
            {setup.marketCondition}
          </span>
        </div>

        {/* Metrics row */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700/40">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-0.5">R:R</div>
            <div className="text-sm font-bold text-cyan-300">{setup.rr}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-0.5">Win Rate</div>
            <div className="text-sm font-bold text-green-300">{setup.winRateRange}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-0.5">Difficulty</div>
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
      className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className={`relative w-full max-w-3xl my-4 rounded-2xl border ${cfg.border} bg-gradient-to-b from-gray-950 to-black overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-gray-800/60 hover:bg-gray-700 transition-colors">
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Header */}
        <div className={`px-6 pt-6 pb-4 border-b ${cfg.border}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded border ${cfg.badge}`}>{cfg.emoji} {cfg.label}</span>
            <span className="text-xs text-gray-500">{setup.type}</span>
            <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{setup.timeframe}</span>
          </div>
          <h2 className={`text-2xl font-bold bg-gradient-to-r ${cfg.grad} bg-clip-text text-transparent`}>{setup.title}</h2>
          <p className="text-gray-400 text-sm mt-1">{setup.description}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Chart */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pattern Visualization</span>
              <span className="ml-auto text-xs text-gray-600 italic">Educational chart model — not real market data</span>
            </div>
            <div className="rounded-xl overflow-hidden border border-gray-800" style={{ height: 220 }}>
              <CandleChart
                candles={setup.candles}
                hlines={setup.hlines}
                zones={setup.zones}
                trendlines={setup.trendlines}
                entryCandle={setup.entryCandle}
                slPrice={setup.slPrice}
                tpPrice={setup.tpPrice}
                vw={600} vh={220} labels={true}
              />
            </div>

            {/* Chart Legend */}
            <div className="flex flex-wrap gap-4 mt-2 px-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className="w-6 h-0.5 bg-green-500" style={{ borderTop: '1.5px dashed #10b981' }} />
                Take Profit (TP)
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className="w-6 h-0.5" style={{ borderTop: '1.5px dashed #ef4444' }} />
                Stop Loss (SL)
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className="w-3 h-3 rounded border-2 border-yellow-400" />
                Entry Candle
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className="w-8 h-3 opacity-40" style={{ background: 'rgba(168,85,247,0.3)' }} />
                Key Zone
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Risk : Reward', value: setup.rr, icon: <Target className="w-4 h-4 text-cyan-400" />, col: 'text-cyan-300' },
              { label: 'Est. Win Rate', value: setup.winRateRange, icon: <TrendingUp className="w-4 h-4 text-green-400" />, col: 'text-green-300' },
              { label: 'Market Type', value: setup.marketCondition, icon: <BarChart2 className="w-4 h-4 text-blue-400" />, col: 'text-blue-300' },
            ].map((m, i) => (
              <div key={i} className="rounded-lg border border-gray-700/50 bg-gray-900/40 p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">{m.icon}<span className="text-xs text-gray-400">{m.label}</span></div>
                <div className={`text-lg font-bold ${m.col}`}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Concept */}
          <div className="rounded-xl border border-gray-700/40 bg-gray-900/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider">Core Concept</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{setup.concept}</p>
          </div>

          {/* Steps + Confluence */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Entry Checklist</span>
              </div>
              <ol className="space-y-2">
                {setup.steps.map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-xs text-gray-300">
                    <span className="shrink-0 w-5 h-5 rounded bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs">{i + 1}</span>
                    <span className="pt-0.5 leading-relaxed">{s}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Confluence Factors</span>
                </div>
                <ul className="space-y-1.5">
                  {setup.confluence.map((c, i) => (
                    <li key={i} className="flex gap-2 text-xs text-gray-300">
                      <CheckCircle className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-bold text-green-300 uppercase tracking-wider">Exit Strategy</span>
                </div>
                <ul className="space-y-1.5">
                  {setup.exitStrategy.map((e, i) => (
                    <li key={i} className="flex gap-2 text-xs text-gray-300">
                      <span className="text-green-400 font-bold shrink-0">→</span>
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Common Mistakes */}
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold text-red-300 uppercase tracking-wider">Common Mistakes to Avoid</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {setup.commonMistakes.map((m, i) => (
                <div key={i} className="flex gap-2 text-xs text-gray-400">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  {m}
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex gap-2 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
            <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-200/70">
              <strong>Educational Model Only.</strong> This is a pattern model for learning purposes, not a trading signal or financial advice. Always backtest on your own data and manage risk accordingly.
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#06060f] to-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/70 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Setups Library
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Pattern models with candlestick charts · Educational use only</p>
          </div>
          <Link href="/app" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 text-sm transition-colors">
            <ArrowLeft size={16} /> <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-2 pb-0">
        <p className="text-[11px] text-gray-600">Not financial advice. Educational pattern models for learning purposes only.</p>
      </div>

      {/* Filter Tabs */}
      <div className="sticky top-[57px] z-20 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-2 sm:px-6 py-3 flex items-center gap-2 sm:gap-3 overflow-x-auto">
          {([
            { key: 'all', label: '📚 All', count: SETUPS.length },
            { key: 'beginner', label: '🟢 Beginner', count: SETUPS.filter(s => s.level === 'beginner').length },
            { key: 'amateur', label: '🔵 Intermediate', count: SETUPS.filter(s => s.level === 'amateur').length },
            { key: 'professional', label: '💎 Professional', count: SETUPS.filter(s => s.level === 'professional').length },
          ] as const).map(tab => (
            <motion.button
              key={tab.key}
              onClick={() => setFilterLevel(tab.key as any)}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterLevel === tab.key
                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                  : 'bg-gray-800/30 border border-gray-700/40 text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${filterLevel === tab.key ? 'bg-cyan-500/30 text-cyan-200' : 'bg-gray-700/50 text-gray-500'}`}>
                {tab.count}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-8 sm:space-y-12">
        {(['beginner', 'amateur', 'professional'] as const).map(level => {
          const levelSetups = groups[level];
          if (levelSetups.length === 0) return null;
          const cfg = LEVEL_CFG[level];

          return (
            <motion.section key={level} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              {/* Section header */}
              <div className="flex items-end gap-4 mb-6 pb-4 border-b border-gray-800">
                <div>
                  <h2 className={`text-xl font-bold bg-gradient-to-r ${cfg.grad} bg-clip-text text-transparent`}>
                    {cfg.emoji} {cfg.label} Setups
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {level === 'beginner' && 'Foundation patterns — clear rules, simple execution'}
                    {level === 'amateur' && 'Intermediate concepts — requires understanding of market structure'}
                    {level === 'professional' && 'Advanced confluence strategies — multi-timeframe, high R:R'}
                  </p>
                </div>
                <span className="ml-auto text-xs text-gray-600">{levelSetups.length} {levelSetups.length === 1 ? 'setup' : 'setups'}</span>
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
