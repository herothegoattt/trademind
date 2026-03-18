'use client';

import { useState } from 'react';
import { Lightbulb, TrendingUp, Zap, Target } from 'lucide-react';

interface Opportunity {
  name: string;
  category: string;
  confidence: number;
  trend: 'up' | 'down' | 'neutral';
  description: string;
  aiRecommendation: string;
  timeframe: string;
  potentialReturn: string;
}

export default function LongTermOpportunities() {
  const [opportunities] = useState<Opportunity[]>([
    {
      name: 'Artificial Intelligence & Machine Learning',
      category: 'Technology',
      confidence: 95,
      trend: 'up',
      description:
        'AI generative models and enterprise automation continue to drive productivity gains across industries. Strong secular growth tailwind.',
      aiRecommendation:
        'High conviction opportunity. Consider increasing tech allocation to capture AI-driven transformations. Focus on companies with strong competitive moats.',
      timeframe: '5+ years',
      potentialReturn: '12-18% annually',
    },
    {
      name: 'Renewable Energy & Clean Tech',
      category: 'Energy',
      confidence: 78,
      trend: 'up',
      description:
        'Global energy transition accelerated by climate goals and policy support. Solar, wind, and battery storage seeing rapid adoption.',
      aiRecommendation:
        'Medium-to-high conviction. Your portfolio currently underweight in this sector. Increasing exposure provides inflation hedge and ESG alignment.',
      timeframe: '10+ years',
      potentialReturn: '10-15% annually',
    },
    {
      name: 'Healthcare Innovation & Biotech',
      category: 'Healthcare',
      confidence: 82,
      trend: 'up',
      description:
        'Aging population demographics and advances in genomics driving pharmaceutical innovation and longevity strategies. Secular structural growth.',
      aiRecommendation:
        'Solid core holding opportunity. Healthcare typically provides defensive characteristics while maintaining growth. Already in your portfolio - maintain allocation.',
      timeframe: '7+ years',
      potentialReturn: '8-14% annually',
    },
    {
      name: 'Infrastructure & Digital Economy',
      category: 'Infrastructure',
      confidence: 85,
      trend: 'up',
      description:
        'Global infrastructure spending and digital transformation creating opportunities in cloud computing, cybersecurity, and connectivity.',
      aiRecommendation:
        'Strong opportunity with both growth and stability characteristics. Consider tilting allocation toward quality infrastructure plays.',
      timeframe: '5-10 years',
      potentialReturn: '9-16% annually',
    },
    {
      name: 'Emerging Markets Growth',
      category: 'International',
      confidence: 72,
      trend: 'neutral',
      description:
        'Emerging market economies benefiting from technology adoption, consumer growth, and favorable demographics. Currently attractive valuations.',
      aiRecommendation:
        'Moderate opportunity. Your international allocation provides exposure. Consider rebalancing if emerging market valuations become more compelling.',
      timeframe: '7+ years',
      potentialReturn: '8-13% annually',
    },
    {
      name: 'Alternative Assets & Real Assets',
      category: 'Alternatives',
      confidence: 68,
      trend: 'neutral',
      description:
        'Real estate, commodities, and alternative investments provide inflation protection and diversification from financial assets.',
      aiRecommendation: 'Balanced opportunity for portfolio resilience. Your current allocation provides adequate diversification.',
      timeframe: '10+ years',
      potentialReturn: '6-10% annually',
    },
  ]);

  const [sectors] = useState([
    { name: 'Technology', allocation: '35%', trend: 'up', score: 92 },
    { name: 'Healthcare', allocation: '18%', trend: 'up', score: 78 },
    { name: 'Financials', allocation: '15%', trend: 'neutral', score: 65 },
    { name: 'Industrials', allocation: '12%', trend: 'up', score: 72 },
    { name: 'Consumer', allocation: '10%', trend: 'down', score: 55 },
    { name: 'Energy', allocation: '6%', trend: 'up', score: 68 },
    { name: 'Utilities', allocation: '4%', trend: 'neutral', score: 58 },
  ]);

  return (
    <div className="space-y-6 contains-layout">
      {/* Sector Overview */}
      <div className="will-change-auto">
        <div className="flex items-center gap-2 mb-6">
          <Target className="text-cyan-400" size={24} />
          <h2 className="text-2xl font-bold text-slate-100">Sector Allocation & Opportunities</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 will-change-auto max-h-96 overflow-y-auto">
          {sectors.map((sector, index) => (
            <div key={index} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-slate-100">{sector.name}</p>
                {sector.trend === 'up' ? (
                  <TrendingUp size={16} className="text-emerald-400" />
                ) : sector.trend === 'down' ? (
                  <div className="transform rotate-180">
                    <TrendingUp size={16} className="text-red-400" />
                  </div>
                ) : (
                  <div className="w-4 h-4 border-l-2 border-yellow-400" />
                )}
              </div>
              <p className="text-2xl font-bold text-cyan-400 mb-2">{sector.allocation}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Opportunity: {sector.score}/100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                <div
                  className="bg-cyan-400 h-1.5 rounded-full"
                  style={{ width: `${sector.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Opportunities */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Lightbulb className="text-cyan-400" size={24} />
          <h2 className="text-2xl font-bold text-slate-100">Long-Term Investment Themes</h2>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {opportunities.map((opp, index) => (
            <div
              key={index}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-100">{opp.name}</h3>
                  <p className="text-slate-400 text-sm mt-1">{opp.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  {opp.trend === 'up' ? (
                    <TrendingUp className="text-emerald-400" size={20} />
                  ) : opp.trend === 'down' ? (
                    <div className="transform rotate-180">
                      <TrendingUp className="text-red-400" size={20} />
                    </div>
                  ) : (
                    <Zap className="text-yellow-400" size={20} />
                  )}
                </div>
              </div>

              <p className="text-slate-300 text-sm mb-4">{opp.description}</p>

              {/* Confidence Score */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400">AI Confidence</span>
                  <span className="text-sm font-bold text-cyan-400">{opp.confidence}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-blue-400 h-2 rounded-full"
                    style={{ width: `${opp.confidence}%` }}
                  />
                </div>
              </div>

              {/* AI Recommendation */}
              <div className="bg-slate-800/50 rounded-lg p-4 mb-4 border border-slate-700/50">
                <p className="text-xs font-semibold text-cyan-400 mb-2">AI INVESTMENT RECOMMENDATION:</p>
                <p className="text-slate-300 text-sm leading-relaxed">{opp.aiRecommendation}</p>
              </div>

              {/* Details */}
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

      {/* Strategic Positioning */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Strategic Positioning</h3>
        <p className="text-slate-300 text-sm leading-relaxed mb-4">
          Your portfolio shows strong positioning for long-term opportunities while maintaining diversification. Key themes driving
          growth (AI, clean energy, healthcare innovation) are well-represented in your core holdings. Consider the following for enhanced
          opportunity capture:
        </p>
        <ul className="space-y-2 text-slate-300 text-sm">
          <li>• Increase tech exposure to 40%+ to capture AI transformation potential</li>
          <li>• Build position in renewable energy/clean tech via dedicated fund or ETF</li>
          <li>• Maintain healthcare allocation for demographic safety net and growth</li>
          <li>• Rebalance annually to maintain strategic asset mix</li>
        </ul>
      </div>
    </div>
  );
}
