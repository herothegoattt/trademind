'use client';

import { useMemo } from 'react';
import { Lightbulb, TrendingUp, Zap, Target, AlertCircle } from 'lucide-react';
import { usePortfolio, posCurrentValue } from '../../lib/portfolioContext';

const ALL_OPPORTUNITIES = [
  {
    name: 'Artificial Intelligence & Machine Learning',
    category: 'stocks', confidence: 95, trend: 'up' as const,
    description: 'AI generative models and enterprise automation drive productivity gains. Strong secular growth tailwind with no signs of slowing.',
    timeframe: '5+ years', potentialReturn: '12–18% annually',
    keywords: ['NVDA','MSFT','GOOGL','META','AMD','PLTR','AI'],
  },
  {
    name: 'Bitcoin & Digital Assets',
    category: 'crypto', confidence: 82, trend: 'up' as const,
    description: 'Institutional adoption, ETF approvals, and halving cycle dynamics support long-term appreciation. High volatility but asymmetric upside.',
    timeframe: '3–10 years', potentialReturn: '20–50%+ annually (high risk)',
    keywords: ['BTC','ETH','SOL','LINK','BNB'],
  },
  {
    name: 'Renewable Energy & Clean Tech',
    category: 'etf', confidence: 78, trend: 'up' as const,
    description: 'Global energy transition driven by climate policy and economics. Solar and storage costs falling below fossil fuels.',
    timeframe: '10+ years', potentialReturn: '10–15% annually',
    keywords: ['ICLN','FSLR','ENPH','NEE','SEDG'],
  },
  {
    name: 'Healthcare Innovation & Biotech',
    category: 'stocks', confidence: 80, trend: 'up' as const,
    description: 'Aging demographics + genomics advances driving pharmaceutical innovation. GLP-1s, oncology, and longevity are structural tailwinds.',
    timeframe: '7+ years', potentialReturn: '8–14% annually',
    keywords: ['JNJ','LLY','NVO','MRNA','ABBV','PFE'],
  },
  {
    name: 'Global Infrastructure & Digital Economy',
    category: 'etf', confidence: 85, trend: 'up' as const,
    description: 'Cloud, cybersecurity, and physical infrastructure modernization create multi-decade opportunities with both growth and stability.',
    timeframe: '5–10 years', potentialReturn: '9–16% annually',
    keywords: ['MSFT','AMZN','CRM','PANW','CRWD','VPN'],
  },
  {
    name: 'Commodities & Inflation Hedge',
    category: 'commodities', confidence: 68, trend: 'neutral' as const,
    description: 'Physical commodities (gold, silver, copper) provide portfolio insurance against currency debasement and geopolitical risk.',
    timeframe: '10+ years', potentialReturn: '6–10% annually',
    keywords: ['GLD','SLV','GDX','FCX','GOLD','XOM'],
  },
  {
    name: 'Emerging Market Consumer Growth',
    category: 'stocks', confidence: 72, trend: 'neutral' as const,
    description: 'Middle-class expansion in Asia and LatAm driving consumer spending. Attractive valuations vs developed markets.',
    timeframe: '7+ years', potentialReturn: '8–13% annually',
    keywords: ['EEM','VWO','BABA','SE','MELI'],
  },
];

export default function LongTermOpportunities() {
  const { positions, allocation, isEmpty } = usePortfolio();

  const heldSymbols = new Set(positions.map(p => p.symbol.toUpperCase()));
  const heldCategories = new Set(positions.map(p => p.category));

  // Enrich opportunities with portfolio context
  const enriched = useMemo(() => ALL_OPPORTUNITIES.map(opp => {
    const held = opp.keywords.filter(k => heldSymbols.has(k));
    const catAlloc = allocation.find(a => a.category === opp.category);
    const pct = catAlloc ? catAlloc.pct : 0;
    return { ...opp, held, catPct: pct };
  }).sort((a, b) => {
    // Sort: already holding → watch closely; missing categories first for new ideas
    if (a.held.length > 0 && b.held.length === 0) return -1;
    if (b.held.length > 0 && a.held.length === 0) return 1;
    return b.confidence - a.confidence;
  }), [positions, allocation, heldSymbols]);

  // Category gaps: what you don't have
  const missingCategories = ['crypto','stocks','etf','commodities','forex']
    .filter(c => !heldCategories.has(c));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Target className="text-cyan-400" size={24} />
        <h2 className="text-2xl font-bold text-slate-100">Long-Term Investment Themes</h2>
        {!isEmpty && <span className="text-xs text-slate-500">personalized to your portfolio</span>}
      </div>

      {/* Portfolio gaps */}
      {!isEmpty && missingCategories.length > 0 && (
        <div className="bg-amber-900/15 border border-amber-700/30 rounded-xl p-5 flex items-start gap-4">
          <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-amber-300 font-semibold text-sm mb-1">Portfolio Gaps Detected</p>
            <p className="text-slate-300 text-sm">
              Your portfolio is missing exposure to: <span className="font-bold text-amber-300">{missingCategories.join(', ')}</span>.
              Consider the opportunities below to improve diversification.
            </p>
          </div>
        </div>
      )}

      {/* Current allocation summary */}
      {!isEmpty && allocation.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {allocation.slice(0, 4).map(a => (
            <div key={a.category} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-400 text-xs font-medium capitalize">{a.category}</p>
              <p className="text-xl font-bold text-cyan-400 mt-1">{a.pct.toFixed(0)}%</p>
              <p className="text-slate-500 text-xs">{a.count} position{a.count !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      )}

      {/* Opportunities */}
      <div className="space-y-4">
        {enriched.map((opp, i) => (
          <div key={i} className={`bg-slate-900 border rounded-xl p-6 hover:border-slate-700 transition-colors ${
            opp.held.length > 0 ? 'border-cyan-700/30' : 'border-slate-800'}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-slate-100">{opp.name}</h3>
                  {opp.held.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      IN YOUR PORTFOLIO
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm capitalize">{opp.category}</p>
              </div>
              <div className="flex items-center gap-2">
                {opp.trend === 'up' ? (
                  <TrendingUp className="text-emerald-400" size={20} />
                ) : opp.trend === 'down' ? (
                  <TrendingUp className="text-red-400 rotate-180" size={20} />
                ) : (
                  <Zap className="text-yellow-400" size={20} />
                )}
              </div>
            </div>

            <p className="text-slate-300 text-sm mb-4">{opp.description}</p>

            {/* If holding */}
            {opp.held.length > 0 && (
              <div className="mb-4 p-3 bg-cyan-900/20 border border-cyan-700/30 rounded-lg text-xs text-cyan-300">
                You hold: <span className="font-bold">{opp.held.join(', ')}</span>
                {opp.catPct > 0 && ` — ${opp.catPct.toFixed(0)}% of portfolio in this category`}
              </div>
            )}

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">Conviction Score</span>
                <span className="text-sm font-bold text-cyan-400">{opp.confidence}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-gradient-to-r from-cyan-400 to-blue-400 h-2 rounded-full" style={{ width: `${opp.confidence}%` }} />
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 mb-4 border border-slate-700/50">
              <p className="text-xs font-semibold text-cyan-400 mb-2">AI RECOMMENDATION:</p>
              <p className="text-slate-300 text-sm leading-relaxed">
                {opp.held.length > 0
                  ? `You're already positioned here. ${opp.catPct > 30 ? 'Consider trimming if overweight.' : 'Consider adding on pullbacks to increase exposure.'}`
                  : `Not yet in your portfolio. ${opp.confidence >= 80 ? 'High conviction — consider building a position.' : 'Moderate conviction — start small and scale in.'}`
                }
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 font-medium">Timeframe</p>
                <p className="text-sm font-semibold text-slate-100 mt-1">{opp.timeframe}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Potential Return</p>
                <p className="text-sm font-semibold text-emerald-400 mt-1">{opp.potentialReturn}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
