'use client';

import { useMemo } from 'react';
import { Target, TrendingUp, TrendingDown, Zap, AlertCircle, CheckCircle2, Plus, BarChart2 } from 'lucide-react';
import { usePortfolio, calcPnL, calcPnLPct, posCurrentValue } from '../../lib/portfolioContext';
import { motion } from 'framer-motion';
import { SectionHeader } from './_ui';

type Trend = 'up' | 'down' | 'neutral';

const THEMES: { id: string; name: string; category: string; confidence: number; trend: Trend; timeframe: string; potentialReturn: string; description: string; keywords: string[]; tags: string[]; addIdeas: string[] }[] = [
  {
    id: 'ai', name: 'Artificial Intelligence & Machine Learning', category: 'stocks', confidence: 95,
    trend: 'up', timeframe: '5+ years', potentialReturn: '12–18% annually',
    description: 'AI generative models and enterprise automation driving productivity revolution. No cycle peak in sight.',
    keywords: ['NVDA','MSFT','GOOGL','META','AMD','PLTR','AI','SMCI','ORCL'],
    tags: ['Growth', 'Tech', 'Secular'],
    addIdeas: ['NVDA', 'MSFT', 'AMD'],
  },
  {
    id: 'btc', name: 'Bitcoin & Digital Assets', category: 'crypto', confidence: 82,
    trend: 'up', timeframe: '3–10 years', potentialReturn: '20–50%+ annually (high risk)',
    description: 'ETF approvals, halving cycles, and institutional custody solving drive structural demand.',
    keywords: ['BTC','ETH','SOL','LINK','BNB','AVAX','DOT'],
    tags: ['High Risk', 'Asymmetric', 'Crypto'],
    addIdeas: ['BTC', 'ETH', 'SOL'],
  },
  {
    id: 'clean', name: 'Renewable Energy & Clean Tech', category: 'etf', confidence: 78,
    trend: 'up', timeframe: '10+ years', potentialReturn: '10–15% annually',
    description: 'Global energy transition driven by climate policy and economics. Solar and storage costs falling below fossil fuels.',
    keywords: ['ICLN','FSLR','ENPH','NEE','SEDG','PLUG','BE'],
    tags: ['ESG', 'Thematic', 'Long-Horizon'],
    addIdeas: ['FSLR', 'NEE', 'ICLN'],
  },
  {
    id: 'health', name: 'Healthcare Innovation & Biotech', category: 'stocks', confidence: 80,
    trend: 'up', timeframe: '7+ years', potentialReturn: '8–14% annually',
    description: 'Aging demographics + GLP-1 drugs + genomics revolution. Structural demand for medical innovation.',
    keywords: ['JNJ','LLY','NVO','MRNA','ABBV','PFE','REGN','GILD'],
    tags: ['Defensive', 'Innovation', 'Demographic'],
    addIdeas: ['LLY', 'NVO', 'ABBV'],
  },
  {
    id: 'infra', name: 'Global Infrastructure & Digital Economy', category: 'etf', confidence: 85,
    trend: 'up', timeframe: '5–10 years', potentialReturn: '9–16% annually',
    description: 'Cloud, cybersecurity, and physical infrastructure modernization — multi-decade compounding.',
    keywords: ['MSFT','AMZN','CRM','PANW','CRWD','ZS','NET','DDOG'],
    tags: ['Compounding', 'Wide Moat', 'Cloud'],
    addIdeas: ['PANW', 'CRWD', 'NET'],
  },
  {
    id: 'gold', name: 'Gold & Hard Asset Hedge', category: 'commodities', confidence: 68,
    trend: 'neutral', timeframe: '10+ years', potentialReturn: '6–10% annually',
    description: 'Portfolio insurance against currency debasement, geopolitical risk, and rate cycle uncertainty.',
    keywords: ['GLD','SLV','GDX','FCX','GOLD','NEM'],
    tags: ['Hedge', 'Store of Value', 'Insurance'],
    addIdeas: ['GLD', 'GDX', 'NEM'],
  },
  {
    id: 'em', name: 'Emerging Market Consumer Growth', category: 'stocks', confidence: 72,
    trend: 'neutral', timeframe: '7+ years', potentialReturn: '8–13% annually',
    description: 'Middle-class expansion in Asia and LatAm driving consumer spending. Attractive valuations vs developed markets.',
    keywords: ['EEM','VWO','BABA','SE','MELI','NU','GRAB'],
    tags: ['Value', 'Demographic', 'Global'],
    addIdeas: ['EEM', 'MELI', 'NU'],
  },
];

const CAT_COLOR: Record<string, string> = {
  stocks: '34,211,238', crypto: '245,158,11', etf: '52,211,153',
  commodities: '234,179,8', forex: '129,140,248', other: '148,163,184',
};

function fmt(n: number) {
  if (Math.abs(n) >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  return `$${n.toFixed(2)}`;
}

function PnLBadge({ pnl, pnlPct }: { pnl: number; pnlPct: number }) {
  const up = pnl >= 0;
  return (
    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${up ? 'text-emerald-300' : 'text-rose-300'}`}
      style={{ background: up ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', border: `1px solid ${up ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}` }}>
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {up ? '+' : ''}{pnlPct.toFixed(1)}%
    </span>
  );
}

export default function LongTermOpportunities() {
  const { positions, allocation, stats, isEmpty } = usePortfolio();

  const heldSymbols = useMemo(() => new Set(positions.map(p => p.symbol.toUpperCase())), [positions]);
  const heldCategories = useMemo(() => new Set(positions.map(p => p.category)), [positions]);

  const enriched = useMemo(() => THEMES.map(theme => {
    const held = theme.keywords.filter(k => heldSymbols.has(k));
    const heldPositions = positions.filter(p => held.includes(p.symbol.toUpperCase()));
    const catAlloc = allocation.find(a => a.category === theme.category);
    const totalHeldVal = heldPositions.reduce((s, p) => s + posCurrentValue(p), 0);
    const totalHeldPnl = heldPositions.reduce((s, p) => s + calcPnL(p), 0);
    const totalHeldPnlPct = totalHeldVal > 0 ? (totalHeldPnl / (totalHeldVal - totalHeldPnl)) * 100 : 0;
    return {
      ...theme,
      held,
      heldPositions,
      catPct: catAlloc?.pct ?? 0,
      totalHeldVal,
      totalHeldPnl,
      totalHeldPnlPct,
    };
  }).sort((a, b) => {
    if (a.held.length > 0 && b.held.length === 0) return -1;
    if (b.held.length > 0 && a.held.length === 0) return 1;
    return b.confidence - a.confidence;
  }), [positions, allocation, heldSymbols]);

  const missingCategories = ['crypto','stocks','etf','commodities','forex'].filter(c => !heldCategories.has(c));
  const totalPortfolioValue = positions.reduce((s, p) => s + posCurrentValue(p), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        icon={Target}
        title="Long-Term Opportunities"
        subtitle={isEmpty ? 'Add portfolio positions to personalize' : 'Ranked and personalized to your holdings'}
      />

      {/* Portfolio Snapshot (if not empty) */}
      {!isEmpty && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-5"
          style={{ background: 'rgba(7,10,20,0.9)', border: '1px solid rgba(34,211,238,0.15)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={14} className="text-cyan-400" />
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">Your Portfolio Overview</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Total Value</p>
              <p className="text-lg font-bold text-slate-100">{fmt(totalPortfolioValue)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Total P&L</p>
              <p className={`text-lg font-bold ${stats.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.totalPnL >= 0 ? '+' : ''}{fmt(stats.totalPnL)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Win Rate</p>
              <p className="text-lg font-bold text-slate-100">{stats.winRate.toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Positions</p>
              <p className="text-lg font-bold text-slate-100">{stats.openCount} open</p>
            </div>
          </div>
          {/* Category breakdown */}
          {allocation.length > 0 && (
            <div className="space-y-2">
              {allocation.slice(0, 5).map(a => {
                const colRgb = CAT_COLOR[a.category] ?? '148,163,184';
                return (
                  <div key={a.category} className="flex items-center gap-3">
                    <span className="text-xs capitalize text-slate-400 w-20 flex-shrink-0">{a.category}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${a.pct}%`, background: `rgb(${colRgb})`, transition: 'width 0.8s ease' }} />
                    </div>
                    <span className="text-xs text-slate-400 w-10 text-right">{a.pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Gaps Banner */}
      {!isEmpty && missingCategories.length > 0 && (
        <div className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" size={16} />
          <div>
            <p className="text-amber-300 font-semibold text-sm mb-0.5">Portfolio Gaps</p>
            <p className="text-slate-300 text-xs">
              No exposure to: <span className="font-bold text-amber-300">{missingCategories.join(', ')}</span>.
              See opportunities below to improve diversification.
            </p>
          </div>
        </div>
      )}

      {/* Themes */}
      <div className="space-y-4">
        {enriched.map((theme, i) => {
          const colRgb = CAT_COLOR[theme.category] ?? '148,163,184';
          const isHeld = theme.held.length > 0;
          const isMissing = missingCategories.includes(theme.category);

          const aiRec = (() => {
            if (isEmpty) return theme.confidence >= 80 ? `High conviction theme. Consider starting with ${theme.addIdeas[0]} or ${theme.addIdeas[1]}.` : `Moderate conviction. Start small with ${theme.addIdeas[0]} and scale in on pullbacks.`;
            if (isHeld) {
              if (theme.catPct > 35) return `You're overweight here (${theme.catPct.toFixed(0)}% of portfolio). Consider trimming on strength and deploying elsewhere.`;
              if (theme.catPct < 10) return `Underweight relative to theme conviction. Consider adding ${theme.addIdeas.filter(k => !heldSymbols.has(k))[0] ?? theme.addIdeas[0]} to increase exposure.`;
              return `Well-positioned. You hold ${theme.held.join(', ')}. Hold or add on pullbacks — ${theme.catPct.toFixed(0)}% allocation is healthy.`;
            }
            return isMissing ? `No exposure to ${theme.category} — this theme could fill your portfolio gap. Start with ${theme.addIdeas[0]}.` : `Not in this theme. ${theme.confidence >= 80 ? 'High conviction — build a starter position.' : 'Consider a small allocation.'}`;
          })();

          return (
            <motion.div
              key={theme.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl overflow-hidden"
              style={{
                background: 'rgba(7,10,20,0.9)',
                border: `1px solid ${isHeld ? `rgba(${colRgb},0.25)` : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              {/* Top accent */}
              <div style={{ height: 2, background: isHeld ? `rgba(${colRgb},0.7)` : 'rgba(255,255,255,0.06)' }} />

              <div className="p-5">
                {/* Title row */}
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-slate-100 text-sm">{theme.name}</h3>
                      {isHeld && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `rgba(${colRgb},0.15)`, color: `rgb(${colRgb})`, border: `1px solid rgba(${colRgb},0.3)` }}>
                          IN PORTFOLIO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] capitalize font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `rgba(${colRgb},0.1)`, color: `rgb(${colRgb})`, border: `1px solid rgba(${colRgb},0.2)` }}>
                        {theme.category}
                      </span>
                      {theme.tags.slice(0, 2).map(t => (
                        <span key={t} className="text-[10px] text-slate-500 px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {theme.trend === 'up' ? <TrendingUp className="text-emerald-400" size={18} />
                    : theme.trend === 'down' ? <TrendingDown className="text-rose-400" size={18} />
                    : <Zap className="text-amber-400" size={18} />}
                  </div>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed mb-3">{theme.description}</p>

                {/* Held positions detail */}
                {isHeld && theme.heldPositions.length > 0 && (
                  <div className="mb-3 p-3 rounded-lg space-y-2"
                    style={{ background: `rgba(${colRgb},0.05)`, border: `1px solid rgba(${colRgb},0.15)` }}>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Your Positions in This Theme</p>
                    {theme.heldPositions.slice(0, 4).map(pos => {
                      const pnl = calcPnL(pos);
                      const pnlPct = calcPnLPct(pos);
                      return (
                        <div key={pos.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-200">{pos.symbol}</span>
                            <span className="text-[10px] text-slate-500">@ {pos.entryPrice.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">{fmt(posCurrentValue(pos))}</span>
                            <PnLBadge pnl={pnl} pnlPct={pnlPct} />
                          </div>
                        </div>
                      );
                    })}
                    {theme.heldPositions.length > 1 && (
                      <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <span className="text-[10px] text-slate-500">Theme total</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-300">{fmt(theme.totalHeldVal)}</span>
                          <PnLBadge pnl={theme.totalHeldPnl} pnlPct={theme.totalHeldPnlPct} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Conviction bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Conviction</span>
                    <span className="text-xs font-bold" style={{ color: `rgb(${colRgb})` }}>{theme.confidence}%</span>
                  </div>
                  <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${theme.confidence}%`, background: `rgba(${colRgb},0.7)`, transition: 'width 1s ease' }} />
                  </div>
                </div>

                {/* AI Recommendation */}
                <div className="p-3 rounded-lg mb-3" style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.1)' }}>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={12} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-300 text-xs leading-relaxed">{aiRec}</p>
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500">Timeframe</p>
                      <p className="font-semibold text-slate-300 mt-0.5">{theme.timeframe}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500">Est. Return</p>
                      <p className="font-semibold text-emerald-400 mt-0.5">{theme.potentialReturn}</p>
                    </div>
                  </div>
                  {!isHeld && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Plus size={10} />
                      <span>Consider: {theme.addIdeas.slice(0, 2).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="text-xs text-slate-600 text-center">
        Opportunities are personalized to your portfolio holdings. Not financial advice — educational only.
      </p>
    </div>
  );
}
