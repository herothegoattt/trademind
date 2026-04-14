'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useT } from '../../lib/i18n';
import { ArrowLeft, ChevronRight, Lightbulb, Target, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Setup {
  id: string;
  title: string;
  level: 'beginner' | 'amateur' | 'professional';
  type: string;
  timeframe: string;
  description: string;
  steps: string[];
  compliance: string[];
}

const SETUPS: Setup[] = [
  // BEGINNERS
  {
    id: 'beginner-st-market-structure',
    level: 'beginner',
    title: 'Market Structure Trend',
    type: 'Smart Money',
    timeframe: 'Short Term (1H/4H)',
    description: 'Identify uptrends and downtrends using higher highs/lows for entry',
    steps: [
      'Identify if price is making Higher Highs & Higher Lows (UPTREND) or Lower Highs & Lower Lows (DOWNTREND)',
      'On 1H/4H chart, draw a trendline connecting last 2 swing lows (for uptrend) or highs (for downtrend)',
      'Wait for price to pullback to this trendline',
      'When price touches trendline + shows 2-3 bullish/bearish candles, enter',
      'Stop loss: 10-15 pips below the trendline',
      'Target: Risk 1:2 (if risking 20 pips, target 40 pips)',
    ],
    compliance: [
      'Use only EURUSD, GBPUSD (liquid pairs)',
      'Trade only London/NY overlap (8 AM - 5 PM EST)',
      'Risk max 1% per trade',
      'Close trade manually - don\'t rely on targets',
      'Journal entry: what price action you saw'
    ]
  },
  {
    id: 'beginner-lt-4h-support',
    level: 'beginner',
    title: 'Support/Resistance Bounce',
    type: 'Technical Analysis',
    timeframe: 'Long Term (4H/Daily)',
    description: 'Bounce trades from support levels with multi-day holds',
    steps: [
      'On Daily chart, mark previous swing lows as SUPPORT (red line)',
      'Mark previous swing highs as RESISTANCE (green line)',
      'When price drops to support, wait for it to bounce',
      'Enter on 4H chart when price bounces from support + closes above it',
      'Stop loss: 20 pips below support',
      'Hold trade for 2-4 days, target: next resistance level',
    ],
    compliance: [
      'Wait 24-48 hours before entering (patience = edge)',
      'Check daily/weekly trend direction first',
      'Risk: 1% max per trade',
      'Don\'t add to winning positions',
      'Exits: take profit at resistance or 2% account gains'
    ]
  },

  // AMATEURS
  {
    id: 'amateur-st-smart-money',
    level: 'amateur',
    title: 'Smart Money Liquidity Sweep',
    type: 'Smart Money',
    timeframe: 'Short Term (15m/1H)',
    description: 'Trade breakout sweeps where smart money shakes out retail',
    steps: [
      'Identify recent swing high (resistance above price) - this is LIQUIDITY ZONE',
      'On 1H chart, watch for breakout ABOVE the swing high with volume',
      'After breakout, price will often return DOWN to "sweep" traders',
      'Enter SHORT when price comes back down to the broken level (smart money shakes out longs)',
      'Stop loss: 10 pips above the swing high',
      'Target: 30-50 pips down to the previous support',
    ],
    compliance: [
      'Confirm with volume profile or tick volume increase',
      'Use 1-minute chart to time exact entry',
      'Risk: 1-2% per trade',
      'Exit early if structure breaks',
      'Don\'t chase - wait for proper setup'
    ]
  },
  {
    id: 'amateur-lt-order-block',
    level: 'amateur',
    title: 'Order Block Reversal',
    type: 'Smart Money',
    timeframe: 'Long Term (4H/Daily)',
    description: 'Reversal trades at order blocks from strong trends',
    steps: [
      'Identify recent STRONG downtrend on Daily (at least 100+ pips)',
      'Find the candle that STARTED the downtrend (this is the ORDER BLOCK)',
      'Mark high and low of that candle as a zone',
      'When price falls back to this zone after pullup, it\'s a reversal point',
      'Enter LONG at order block zone when 2-3 bullish candles form',
      'Stop loss: 20 pips below order block',
      'Target: 100-150 pips up to previous resistance'
    ],
    compliance: [
      'Order blocks work better in strong trending markets',
      'Confirm RSI is oversold (<30) at entry',
      'Hold 3-7 days minimum',
      'Risk: 1-2% per trade',
      'Key: patience and structure'
    ]
  },

  // PROFESSIONALS
  {
    id: 'pro-st-fvg-mitigation',
    level: 'professional',
    title: 'Fair Value Gap + Mitigated Block',
    type: 'Smart Money',
    timeframe: 'Short Term (15m/1H)',
    description: 'Advanced confluence of FVG + order block + volume',
    steps: [
      'Identify 3-candle Fair Value Gap (FVG): candle 1 & 3 form gap, candle 2 is inside',
      'On 1H chart, when FVG forms, smart money will come back to FILL it (mitigation)',
      'As price approaches FVG, identify the ORDER BLOCK that caused the move',
      'Enter SHORT at the ORDER BLOCK when price mitigates the FVG with wick rejection',
      'Stop loss: 5 pips above order block high',
      'Targets: Fibonacci levels (61.8%, 78.6%) of previous structure'
    ],
    compliance: [
      'Use Advanced Smart Money concepts (FVG + block confluence)',
      'Confirm with Volume Profile imbalance',
      'Risk: 2-3% per trade (higher win rate justifies it)',
      'Trade only major pairs with 2+ pip spreads',
      'Keep trade journal with exact levels and logic'
    ]
  },
  {
    id: 'pro-lt-breaker-block',
    level: 'professional',
    title: 'Breaker Block + Macro Structure',
    type: 'Smart Money',
    timeframe: 'Long Term (Daily/Weekly)',
    description: 'Highest probability multi-timeframe confluence trades',
    steps: [
      'On Weekly chart, identify multi-week downtrend structure',
      'Find the BREAKER BLOCK: the candle that closed BELOW the previous lower low',
      'This block becomes support for future bounces',
      'On Daily chart, when price returns to breaker block after pullup, it\'s a buy zone',
      'Enter LONG when price creates higher lows around breaker block (3+ rejections)',
      'Stop loss: 5-10 pips below breaker block (use tight stops due to macro levels)',
      'Target: Fibonacci extensions (127%, 161.8%) from major swings'
    ],
    compliance: [
      'Confluence = Weekly + Daily + 1H alignment',
      'Use only on pairs with strong multi-week trends',
      'Risk: 2% per trade (tight stops = small risk)',
      'Hold minimum 5 days',
      'Best performance in trending markets (avoid consolidations)'
    ]
  },
  {
    id: 'pro-market-profile',
    level: 'professional',
    title: 'Market Profile + TPO Analysis',
    type: 'Market Profile',
    timeframe: 'All Timeframes',
    description: 'Probabilistic trading based on volume distribution',
    steps: [
      'Study Market Profile showing where volume is concentrated (Value Area)',
      'Identify Point of Control (POC) - the price level with most volume',
      'Watch for price rejection from Value Area extremes',
      'Enter when price breaks out of Value Area with volume confirmation',
      'Stop loss: just beyond opposite edge of Value Area',
      'Target: Next developing Value Area or resistance'
    ],
    compliance: [
      'Requires Market Profile charting software',
      'Works best on liquid pairs (EURUSD, GBPUSD)',
      'Risk: 1-2% per trade',
      'Patience is critical - wait for proper setup',
      'Keep Volume Profile notebook for trading patterns'
    ]
  },
  {
    id: 'pro-momentum-divergence',
    level: 'professional',
    title: 'Hidden Divergence + Momentum',
    type: 'Technical Analysis',
    timeframe: 'Multi-Timeframe',
    description: 'Continuation signals from divergence patterns',
    steps: [
      'Identify hidden bearish divergence: price higher high but oscillator lower high',
      'This signals continuation of downtrend (not reversal)',
      'Combine with momentum confirmation (volume increasing into the move)',
      'Enter SHORT when price makes new higher high + divergence confirmed',
      'Stop loss: 15 pips above the divergence high',
      'Scale exits at 1:1, 1:2, 1:3'
    ],
    compliance: [
      'Use multiple oscillators (RSI + Stochastic) for confirmation',
      'Only trade with overall trend direction',
      'Risk: 1-2% per trade',
      'Exit partial at 1:1 ratio',
      'Journal: accuracy percentage over 20+ trades'
    ]
  }
];

export default function SetupsPage() {
  const t = useT();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<'all' | 'beginner' | 'amateur' | 'professional'>('all');

  const levelConfig = {
    beginner: {
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/5',
      borderColor: 'border-green-500/30',
      hoverColor: 'hover:border-green-500/60',
      label: '🟢 Beginners',
      icon: '🚀',
      subtext: 'Foundation trades for new traders'
    },
    amateur: {
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/5',
      borderColor: 'border-blue-500/30',
      hoverColor: 'hover:border-blue-500/60',
      label: '🔵 Amateurs',
      icon: '⚡',
      subtext: 'Intermediate confidence setups'
    },
    professional: {
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/5',
      borderColor: 'border-purple-500/30',
      hoverColor: 'hover:border-purple-500/60',
      label: '💎 Professionals',
      icon: '🎯',
      subtext: 'Advanced confluent multi-chart strategies'
    }
  };

  const setupsByLevel = {
    beginner: SETUPS.filter(s => s.level === 'beginner'),
    amateur: SETUPS.filter(s => s.level === 'amateur'),
    professional: SETUPS.filter(s => s.level === 'professional'),
  };

  const filteredSetups = filterLevel === 'all' 
    ? SETUPS 
    : filterLevel === 'beginner' ? setupsByLevel.beginner
    : filterLevel === 'amateur' ? setupsByLevel.amateur
    : setupsByLevel.professional;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-black/95 text-white flex flex-col xl:pr-80">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-black/90 via-slate-900/80 to-black/90 backdrop-blur-lg border-b border-cyan-500/20 px-3 sm:px-6 py-3 sm:py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-xl sm:text-3xl font-bold">{t('setups_library')}</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">Ready-made setups organized by skill level & market type</p>
          </motion.div>
          <Link href="/app" className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs sm:text-sm transition-colors">
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">{t('back_to_dashboard')}</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="sticky top-14 sm:top-16 z-10 bg-black/70 backdrop-blur-lg border-b border-cyan-500/10 px-3 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filter:</span>
            <div className="flex flex-wrap gap-2">
              {['all', 'beginner', 'amateur', 'professional'].map((level) => (
                <motion.button
                  key={level}
                  onClick={() => setFilterLevel(level as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all ${
                    filterLevel === level
                      ? level === 'all' ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-300'
                        : level === 'beginner' ? `bg-green-500/30 border border-green-400 text-green-300`
                        : level === 'amateur' ? `bg-blue-500/30 border border-blue-400 text-blue-300`
                        : `bg-purple-500/30 border border-purple-400 text-purple-300`
                      : 'bg-gray-800/30 border border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {level === 'all' ? '📚 All Setups' 
                    : level === 'beginner' ? '🟢 Beginner'
                    : level === 'amateur' ? '🔵 Amateur'
                    : '💎 Professional'}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            {filterLevel === 'all' ? (
              // Show all sections
              <motion.div
                key="all"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-16"
              >
                {/* BEGINNERS */}
                <SetupsSection
                  title={levelConfig.beginner.label}
                  subtext={levelConfig.beginner.subtext}
                  config={levelConfig.beginner}
                  setups={setupsByLevel.beginner}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                />

                {/* AMATEURS */}
                <SetupsSection
                  title={levelConfig.amateur.label}
                  subtext={levelConfig.amateur.subtext}
                  config={levelConfig.amateur}
                  setups={setupsByLevel.amateur}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                />

                {/* PROFESSIONALS */}
                <SetupsSection
                  title={levelConfig.professional.label}
                  subtext={levelConfig.professional.subtext}
                  config={levelConfig.professional}
                  setups={setupsByLevel.professional}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                />
              </motion.div>
            ) : (
              // Show single filtered level
              <motion.div
                key={filterLevel}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <SetupsSection
                  title={levelConfig[filterLevel as keyof typeof levelConfig].label}
                  subtext={levelConfig[filterLevel as keyof typeof levelConfig].subtext}
                  config={levelConfig[filterLevel as keyof typeof levelConfig]}
                  setups={filteredSetups}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SetupsSection({ title, subtext, config, setups, expandedId, setExpandedId }: any) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      className="scroll-mt-32"
    >
      <div className={`mb-8 space-y-2 pb-6 border-b border-gray-700`}>
        <h2 className={`text-2xl font-bold bg-gradient-to-r ${config.color} bg-clip-text text-transparent flex items-center gap-2`}>
          <span>{config.icon}</span>
          {title}
        </h2>
        <p className="text-gray-400">{subtext}</p>
        <div className="text-xs text-gray-500 pt-2">
          {setups.length} {setups.length === 1 ? 'setup' : 'setups'} available
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-h-96 overflow-y-auto">
        {setups.map((setup: Setup, idx: number) => (
          <motion.div
            key={setup.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.05 }}
          >
            <SetupCard 
              setup={setup}
              config={config}
              isExpanded={expandedId === setup.id}
              onToggle={() => setExpandedId(expandedId === setup.id ? null : setup.id)}
            />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

function SetupCard({ setup, config, isExpanded, onToggle }: any) {
  return (
    <motion.button
      onClick={onToggle}
      className={`
        text-left w-full rounded-lg border transition-all duration-300
        ${config.bgColor} ${config.borderColor} ${config.hoverColor}
        hover:shadow-lg hover:shadow-${config.color.split('-')[1]}-500/20 transform
        group relative overflow-hidden
      `}
      whileHover={{ y: -4 }}
      whileTap={{ y: -2 }}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      <div className="relative p-5 flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-start gap-2 mb-3">
            <div className={`mt-1 text-lg`}>
              {setup.level === 'beginner' ? '🚀' : setup.level === 'amateur' ? '⚡' : '🎯'}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text transition-colors" 
                  style={isExpanded ? { 
                    backgroundImage: `linear-gradient(to right, ${config.color})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  } : {}}>
                {setup.title}
              </h3>
            </div>
          </div>
          
          {/* Tags */}
          <div className="flex gap-2 flex-wrap mb-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-800/50 text-gray-300 border border-gray-700/50 group-hover:border-gray-600">
              {setup.type}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-800/50 text-gray-300 border border-gray-700/50 group-hover:border-gray-600">
              ⏱️ {setup.timeframe}
            </span>
          </div>
          
          <p className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors">{setup.description}</p>
        </div>
        
        {/* Chevron Icon */}
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 mt-1"
        >
          <ChevronRight 
            size={20} 
            className="transition-colors group-hover:text-white"
          />
        </motion.div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="relative px-5 pb-5 space-y-5 border-t border-gray-700/50"
          >
            {/* Entry Steps */}
            <div>
              <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-200 flex items-center gap-2">
                <Target size={16} className="text-cyan-400" />
                Entry Steps
              </h4>
              <ol className="space-y-2.5">
                {setup.steps.map((step: string, i: number) => (
                  <motion.li 
                    key={i} 
                    className="text-sm text-gray-300 flex gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <span className="font-bold text-gray-500 min-w-fit bg-gray-800/50 w-6 h-6 flex items-center justify-center rounded text-xs">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </motion.li>
                ))}
              </ol>
            </div>

            {/* Risk Management Rules */}
            <div>
              <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-200 flex items-center gap-2">
                <Lightbulb size={16} className="text-green-400" />
                Risk Management Rules
              </h4>
              <ul className="space-y-2">
                {setup.compliance.map((rule: string, i: number) => (
                  <motion.li 
                    key={i} 
                    className="text-sm text-gray-300 flex gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  >
                    <span className="text-green-400 flex-shrink-0 font-bold">✓</span>
                    <span>{rule}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
