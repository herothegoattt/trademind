'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp, AlertCircle, Zap } from 'lucide-react';

interface MarketIndicator {
  name: string;
  value: string;
  change: number;
  status: 'positive' | 'negative' | 'neutral';
  description: string;
}

interface NewsItem {
  title: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  date: string;
  aiInsight: string;
}

export default function MarketIntelligence() {
  const [indicators] = useState<MarketIndicator[]>([
    {
      name: 'Federal Funds Rate',
      value: '5.33%',
      change: 0,
      status: 'neutral',
      description: 'Holding steady after recent pause in rate hikes',
    },
    {
      name: 'Inflation (YoY)',
      value: '3.2%',
      change: -0.4,
      status: 'positive',
      description: 'Declining inflation supports long-term portfolio growth',
    },
    {
      name: 'Unemployment Rate',
      value: '3.8%',
      change: 0.1,
      status: 'neutral',
      description: 'Remains near historic lows with resilient labor market',
    },
    {
      name: 'GDP Growth (YoY)',
      value: '2.4%',
      change: 0.3,
      status: 'positive',
      description: 'Moderate growth supports equity valuations',
    },
  ]);

  const [newsItems] = useState<NewsItem[]>([
    {
      title: 'Tech Sector Leads Market Higher on AI Optimism',
      impact: 'high',
      category: 'Technology',
      date: '2 hours ago',
      aiInsight:
        'AI-driven productivity gains could support tech valuations long-term. Consider increasing exposure in your portfolio if aligned with risk tolerance.',
    },
    {
      title: 'Fed Signals Pause on Rate Cuts Through Mid-2024',
      impact: 'high',
      category: 'Monetary Policy',
      date: '5 hours ago',
      aiInsight:
        'Stable rates benefit bonds and dividend-paying stocks. Your bond allocation provides good diversification benefit in this environment.',
    },
    {
      title: 'Corporate Earnings Beat Expectations Across Sectors',
      impact: 'medium',
      category: 'Earnings',
      date: '1 day ago',
      aiInsight:
        'Strong earnings support equity market fundamentals. Your diversified portfolio captures upside across multiple sectors.',
    },
    {
      title: 'Oil Prices Fall on Demand Concerns',
      impact: 'medium',
      category: 'Commodities',
      date: '1 day ago',
      aiInsight:
        'Lower energy prices are generally positive for economy and consumer spending patterns over long-term investment horizon.',
    },
  ]);

  return (
    <div className="space-y-6 contains-layout">
      {/* Market Overview */}
      <div className="will-change-auto">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="text-cyan-400" size={24} />
          <h2 className="text-2xl font-bold text-slate-100">Macroeconomic Context</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 will-change-auto max-h-96 overflow-y-auto">
          {indicators.map((indicator, index) => (
            <div
              key={index}
              className={`bg-slate-900 border rounded-xl p-6 ${
                indicator.status === 'positive'
                  ? 'border-emerald-700/50'
                  : indicator.status === 'negative'
                    ? 'border-red-700/50'
                    : 'border-slate-800'
              }`}
            >
              <p className="text-slate-400 text-sm font-medium">{indicator.name}</p>
              <div className="flex items-baseline gap-2 mt-3">
                <p className="text-2xl font-bold text-slate-100">{indicator.value}</p>
                {indicator.change !== 0 && (
                  <span
                    className={`text-sm font-semibold ${
                      indicator.change > 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {indicator.change > 0 ? '+' : ''}
                    {indicator.change}%
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs mt-3">{indicator.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Economic Outlook */}
      <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-cyan-700/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-cyan-900/50 rounded-lg mt-1">
            <Zap className="text-cyan-400" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Economic Outlook</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              The current economic environment presents a mixed picture with moderating inflation and stable rates creating supportive conditions
              for long-term investing. Tech sector strength, supported by AI productivity gains, is offsetting concerns in traditional sectors.
              Your diversified portfolio is well-positioned to benefit from multiple growth drivers while managing downside risks. Consider the
              timing of any rebalancing decisions given current valuation levels.
            </p>
          </div>
        </div>
      </div>

      {/* Market News & AI Insights */}
      <div className="will-change-auto">
        <h3 className="text-xl font-bold text-slate-100 mb-6">Market News & AI Analysis</h3>
        <div className="space-y-4 will-change-auto max-h-96 overflow-y-auto">
          {newsItems.map((news, index) => (
            <div key={index} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
              <div className="flex items-start gap-4">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    news.impact === 'high'
                      ? 'bg-red-900/30 text-red-200'
                      : news.impact === 'medium'
                        ? 'bg-yellow-900/30 text-yellow-200'
                        : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {news.impact.toUpperCase()} IMPACT
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-slate-100 mb-1">{news.title}</h4>
                      <p className="text-slate-400 text-xs mb-3">
                        {news.category} • {news.date}
                      </p>
                    </div>
                  </div>

                  {/* AI Insight */}
                  <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                      <p className="text-slate-300 text-sm">
                        <span className="font-semibold text-cyan-400">AI Insight:</span> {news.aiInsight}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Sentiment */}
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
          <p className="text-slate-400 text-sm font-medium mb-2">Fear & Greed Index</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-yellow-400">62</p>
            <p className="text-slate-400 text-sm">Greedy</p>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-3">
            <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '62%' }} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <p className="text-slate-400 text-sm font-medium mb-2">Market Volatility (VIX)</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-100">14.2</p>
            <p className="text-green-400 text-sm">Low</p>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-3">
            <div className="bg-emerald-400 h-2 rounded-full" style={{ width: '35%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
