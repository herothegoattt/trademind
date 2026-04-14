'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertCircle, Zap, RefreshCw } from 'lucide-react';
import { usePortfolio } from '../../lib/portfolioContext';

const MACRO_INDICATORS = [
  { name: 'Federal Funds Rate', value: '5.33%', change: 0, status: 'neutral', description: 'Holding steady. Rate cuts expected in 2025 — positive for risk assets.' },
  { name: 'US Inflation (CPI YoY)', value: '3.2%', change: -0.4, status: 'positive', description: 'Declining trend supports long-term equity and crypto valuations.' },
  { name: 'Unemployment Rate', value: '3.8%', change: 0.1, status: 'neutral', description: 'Near historic lows — strong consumer spending supports stocks.' },
  { name: 'GDP Growth (YoY)', value: '2.4%', change: 0.3, status: 'positive', description: 'Moderate growth. Goldilocks scenario for long-term investors.' },
];

const CATEGORY_INSIGHTS: Record<string, { headline: string; detail: string; impact: 'high'|'medium'|'low' }[]> = {
  crypto: [
    { headline: 'Bitcoin Spot ETF Inflows Accelerating', impact: 'high', detail: 'Institutional flows into BTC ETFs breaking records. Long-term bullish for the asset class.' },
    { headline: 'Ethereum Layer-2 Ecosystem Expanding', impact: 'medium', detail: 'L2 activity reaching all-time highs — bullish signal for ETH demand and fee revenue.' },
  ],
  stocks: [
    { headline: 'S&P 500 Earnings Growth Beating Estimates', impact: 'high', detail: 'Corporate earnings expanding 8–12% YoY. Strong fundamentals support continued equity appreciation.' },
    { headline: 'AI Capital Expenditure Cycle Intensifying', impact: 'high', detail: 'Tech majors spending aggressively on AI infrastructure — tailwind for semiconductors and cloud.' },
  ],
  etf: [
    { headline: 'Passive Fund Inflows at Record Levels', impact: 'medium', detail: 'ETF flows signal continued retail and institutional allocation to diversified products.' },
  ],
  commodities: [
    { headline: 'Gold Near All-Time Highs on Rate Pivot Expectations', impact: 'high', detail: 'Central bank gold buying accelerating. Rate cuts would boost non-yielding assets further.' },
    { headline: 'Copper Demand Rising on AI Infrastructure Build-Out', impact: 'medium', detail: 'Data centers and EV transition driving structural copper demand. Supply constrained.' },
  ],
  forex: [
    { headline: 'Dollar Index (DXY) Weakening on Fed Pivot Expectations', impact: 'high', detail: 'USD weakness benefits EM forex positions and dollar-denominated commodity prices.' },
  ],
};

export default function MarketIntelligence() {
  const { positions, allocation, isEmpty } = usePortfolio();
  const [fearIndex, setFearIndex] = useState<number | null>(null);
  const [loadingFear, setLoadingFear] = useState(true);

  useEffect(() => {
    fetch('https://api.alternative.me/fng/?limit=1')
      .then(r => r.json())
      .then(d => { if (d.data?.[0]?.value) setFearIndex(parseInt(d.data[0].value)); })
      .catch(() => {})
      .finally(() => setLoadingFear(false));
  }, []);

  const fearLabel = fearIndex !== null
    ? fearIndex >= 75 ? { text: 'Extreme Greed', color: 'text-rose-400', bar: 'bg-rose-400' }
    : fearIndex >= 55 ? { text: 'Greed',         color: 'text-orange-400', bar: 'bg-orange-400' }
    : fearIndex >= 45 ? { text: 'Neutral',        color: 'text-gray-300',  bar: 'bg-gray-400'   }
    : fearIndex >= 25 ? { text: 'Fear',           color: 'text-blue-400',  bar: 'bg-blue-400'   }
    : { text: 'Extreme Fear', color: 'text-emerald-400', bar: 'bg-emerald-400' }
    : null;

  // Gather relevant news for held categories
  const heldCategories = [...new Set(positions.map(p => p.category))];
  const relevantInsights = heldCategories.flatMap(cat => (CATEGORY_INSIGHTS[cat] || []).map(i => ({ ...i, category: cat })));
  const genericInsights = isEmpty ? Object.values(CATEGORY_INSIGHTS).flat().slice(0, 4) : [];
  const insights = isEmpty ? genericInsights : relevantInsights;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="text-cyan-400" size={24} />
        <h2 className="text-2xl font-bold text-slate-100">Market Intelligence</h2>
        {!isEmpty && <span className="text-xs text-slate-500">filtered to your holdings</span>}
      </div>

      {/* Macro Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {MACRO_INDICATORS.map((ind, i) => (
          <div key={i} className={`bg-slate-900 border rounded-xl p-6 ${
            ind.status === 'positive' ? 'border-emerald-700/50' : ind.status === 'negative' ? 'border-red-700/50' : 'border-slate-800'}`}>
            <p className="text-slate-400 text-sm font-medium">{ind.name}</p>
            <div className="flex items-baseline gap-2 mt-3">
              <p className="text-2xl font-bold text-slate-100">{ind.value}</p>
              {ind.change !== 0 && (
                <span className={`text-sm font-semibold ${ind.change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {ind.change > 0 ? '+' : ''}{ind.change}%
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs mt-3">{ind.description}</p>
          </div>
        ))}
      </div>

      {/* Sentiment row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <p className="text-slate-400 text-sm font-medium mb-2">Investor Sentiment</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-cyan-400">58%</p>
            <p className="text-slate-400 text-sm">Bullish</p>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-3">
            <div className="bg-cyan-400 h-2 rounded-full" style={{ width: '58%' }} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <p className="text-slate-400 text-sm font-medium mb-2">Crypto Fear & Greed</p>
          {loadingFear ? (
            <div className="flex items-center gap-2 mt-2"><RefreshCw size={16} className="animate-spin text-slate-500" /><span className="text-slate-500 text-sm">Loading…</span></div>
          ) : fearLabel ? (
            <>
              <div className="flex items-baseline gap-2">
                <p className={`text-2xl font-bold ${fearLabel.color}`}>{fearIndex}</p>
                <p className="text-slate-400 text-sm">{fearLabel.text}</p>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mt-3">
                <div className={`${fearLabel.bar} h-2 rounded-full`} style={{ width: `${fearIndex}%` }} />
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-sm mt-2">Unavailable</p>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <p className="text-slate-400 text-sm font-medium mb-2">Market Volatility (VIX)</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-100">14.2</p>
            <p className="text-emerald-400 text-sm">Low</p>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-3">
            <div className="bg-emerald-400 h-2 rounded-full" style={{ width: '35%' }} />
          </div>
        </div>
      </div>

      {/* Economic Outlook */}
      <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-cyan-700/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-cyan-900/50 rounded-lg mt-1"><Zap className="text-cyan-400" size={20} /></div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">2025 Economic Outlook</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Rate cut cycle beginning, inflation normalizing, and AI productivity wave accelerating — a broadly constructive environment
              for long-term investors. Tech, crypto, and infrastructure remain primary growth drivers. Monitor geopolitical risks
              and position sizing in high-leverage futures trades.
            </p>
          </div>
        </div>
      </div>

      {/* Portfolio-specific insights */}
      {insights.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-slate-100 mb-4">
            {isEmpty ? 'Market News & Analysis' : `News Relevant to Your Portfolio`}
          </h3>
          <div className="space-y-4">
            {insights.map((news, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    news.impact === 'high' ? 'bg-red-900/30 text-red-200' : news.impact === 'medium' ? 'bg-yellow-900/30 text-yellow-200' : 'bg-slate-800 text-slate-300'}`}>
                    {news.impact.toUpperCase()} IMPACT
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-100 mb-1">{news.headline}</h4>
                    {'category' in news && (
                      <p className="text-slate-500 text-xs mb-3 capitalize">{(news as any).category}</p>
                    )}
                    <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                        <p className="text-slate-300 text-sm">
                          <span className="font-semibold text-cyan-400">Portfolio Impact: </span>{news.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
