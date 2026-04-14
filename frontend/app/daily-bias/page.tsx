'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

interface ForexEvent {
  pair: string;
  time: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  previous?: string;
  forecast?: string;
  actual?: string;
}

interface PairRecommendation {
  pair: string;
  recommendation: 'trade' | 'avoid' | 'watch';
  reason: string;
  tone: 'bullish' | 'bearish' | 'neutral';
  events: ForexEvent[];
  setupsAvailable: string[];
}

export default function DailyBiasPage() {
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<ForexEvent[]>([]);
  const [recommendations, setRecommendations] = useState<PairRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchForexFactoryData();
  }, []);

  const fetchForexFactoryData = async () => {
    setLoading(true);
    try {
      // Fetch from Forex Factory API or mock data
      const mockEvents = generateMockEvents();
      setEvents(mockEvents);
      
      // Generate recommendations based on events
      const recs = generateRecommendations(mockEvents);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to fetch forex data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto" />
          <p className="text-gray-400">Loading today&apos;s market data...</p>
        </div>
      </div>
    );
  }

  const tradeRecommendations = recommendations.filter(r => r.recommendation === 'trade');
  const avoidRecommendations = recommendations.filter(r => r.recommendation === 'avoid');
  const watchRecommendations = recommendations.filter(r => r.recommendation === 'watch');

  return (
    <div className="min-h-screen bg-black text-white flex flex-col xl:pr-80">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-black/90 via-slate-900/80 to-black/90 backdrop-blur-lg border-b border-cyan-500/20 px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Daily Market Bias</h1>
            <p className="text-gray-400 text-sm mt-1">Forex Factory events & pair recommendations for today</p>
          </div>
          <Link href="/app" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 transition-colors">
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Quick Summary */}
          <div className="grid grid-cols-3 gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="text-sm text-gray-400 mb-1">Recommended to Trade</div>
              <div className="text-3xl font-bold text-green-400">{tradeRecommendations.length}</div>
              <p className="text-xs text-gray-400 mt-2">pairs with good setups</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="text-sm text-gray-400 mb-1">Watch Carefully</div>
              <div className="text-3xl font-bold text-blue-400">{watchRecommendations.length}</div>
              <p className="text-xs text-gray-400 mt-2">pairs with upcoming events</p>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="text-sm text-gray-400 mb-1">Avoid Today</div>
              <div className="text-3xl font-bold text-red-400">{avoidRecommendations.length}</div>
              <p className="text-xs text-gray-400 mt-2">high volatility pairs</p>
            </div>
          </div>

          {/* Trade Recommendations */}
          {tradeRecommendations.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle size={28} className="text-green-400" />
                <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Good Trading Pairs Today
                </span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {tradeRecommendations.map(rec => (
                  <PairCard key={rec.pair} recommendation={rec} />
                ))}
              </div>
            </section>
          )}

          {/* Watch Recommendations */}
          {watchRecommendations.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <AlertCircle size={28} className="text-blue-400" />
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Watch These Pairs
                </span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {watchRecommendations.map(rec => (
                  <PairCard key={rec.pair} recommendation={rec} />
                ))}
              </div>
            </section>
          )}

          {/* Avoid Recommendations */}
          {avoidRecommendations.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <TrendingDown size={28} className="text-red-400" />
                <span className="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                  Avoid Trading Today
                </span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {avoidRecommendations.map(rec => (
                  <PairCard key={rec.pair} recommendation={rec} />
                ))}
              </div>
            </section>
          )}

          {/* Today's Events Calendar */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Today&apos;s Economic Events</h2>
            <div className="space-y-3">
              {events.map((event, idx) => (
                <EventCard key={idx} event={event} />
              ))}
            </div>
          </section>

          {/* Trading Strategy Tips */}
          <section className="bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-purple-500/20 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Today&apos;s Strategy Tips</h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex gap-3">
                <span className="text-green-400 font-bold">✓</span>
                <span>Monitor high-impact events 30 minutes before &amp; after release</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-400 font-bold">✓</span>
                <span>Use 50% position size on news events - slippage is brutal</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-400 font-bold">✓</span>
                <span>Best trading: 1 hour AFTER chaos settles, not during release</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-400 font-bold">✓</span>
                <span>London overlap (8 AM - 12 PM EST) = tightest spreads & best liquidity</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-400 font-bold">✓</span>
                <span>Risk 1-2% per trade MAXIMUM - let wins compound</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function PairCard({ recommendation }: { recommendation: PairRecommendation }) {
  const colorConfig = {
    trade: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      textColor: 'text-green-300',
      icon: TrendingUp,
      bgColor: 'text-green-400'
    },
    avoid: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30', 
      textColor: 'text-red-300',
      icon: TrendingDown,
      bgColor: 'text-red-400'
    },
    watch: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      textColor: 'text-blue-300',
      icon: AlertCircle,
      bgColor: 'text-blue-400'
    }
  };

  const config = colorConfig[recommendation.recommendation];
  const Icon = config.icon;

  return (
    <div className={`p-4 rounded-lg border ${config.bg} ${config.border}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-2xl font-bold text-white">{recommendation.pair}</h3>
          <p className={`text-sm font-semibold ${config.textColor} flex items-center gap-1 mt-1`}>
            <Icon size={16} />
            {recommendation.recommendation === 'trade' ? '✓ Trade Today' : recommendation.recommendation === 'avoid' ? '✗ Avoid' : '⚠ Watch'}
          </p>
        </div>
      </div>
      
      <div className="mb-3 p-2 bg-black/30 rounded border border-gray-700">
        <p className="text-sm text-gray-300">{recommendation.reason}</p>
      </div>

      {recommendation.events.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-400 mb-2 font-semibold">Events:</p>
          <div className="space-y-1">
            {recommendation.events.slice(0, 2).map((evt, i) => (
              <div key={i} className="text-xs text-gray-400 flex gap-2">
                <span className={`px-2 py-0.5 rounded ${evt.impact === 'high' ? 'bg-red-500/20 text-red-300' : evt.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
                  {evt.impact.toUpperCase()}
                </span>
                <span>{evt.time} - {evt.event.slice(0, 30)}...</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendation.setupsAvailable.length > 0 && (
        <div className="text-xs">
          <p className="text-gray-400 mb-1">Available Setups:</p>
          <div className="flex flex-wrap gap-1">
            {recommendation.setupsAvailable.map((setup, i) => (
              <span key={i} className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs">
                {setup}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: ForexEvent }) {
  const impactColor = event.impact === 'high' ? 'bg-red-500/20 border-red-500/40 text-red-300' : event.impact === 'medium' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300' : 'bg-green-500/20 border-green-500/40 text-green-300';

  return (
    <div className={`p-4 rounded-lg border ${impactColor}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-white">{event.pair}</span>
            <span className={`text-xs px-2 py-0.5 rounded border ${impactColor}`}>
              {event.impact.toUpperCase()} IMPACT
            </span>
          </div>
          <p className="text-sm mb-2">{event.event}</p>
          <p className="text-xs text-gray-400">{event.time}</p>
        </div>
        <div className="text-right text-xs min-w-fit">
          {event.forecast && <p>Forecast: <span className="font-semibold">{event.forecast}</span></p>}
          {event.previous && <p>Previous: <span className="font-semibold">{event.previous}</span></p>}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function generateMockEvents(): ForexEvent[] {
  return [
    {
      pair: 'EURUSD',
      time: '08:00',
      event: 'German ZEW Economic Sentiment',
      impact: 'high',
      previous: '25.0',
      forecast: '26.0'
    },
    {
      pair: 'GBPUSD',
      time: '08:30',
      event: 'UK Retail Sales YoY',
      impact: 'high',
      previous: '2.2%',
      forecast: '2.5%'
    },
    {
      pair: 'USDJPY',
      time: '12:00',
      event: 'US Initial Jobless Claims',
      impact: 'high',
      previous: '218K',
      forecast: '215K'
    },
    {
      pair: 'AUDUSD',
      time: '14:30',
      event: 'Australia CPI YoY',
      impact: 'high',
      previous: '3.4%',
      forecast: '3.3%'
    },
    {
      pair: 'NZDUSD',
      time: '16:45',
      event: 'NZ Trade Balance',
      impact: 'medium',
      previous: '-500M',
      forecast: '-450M'
    },
    {
      pair: 'EURUSD',
      time: '17:00',
      event: 'ECB Economic Bulletin',
      impact: 'medium'
    },
  ];
}

function generateRecommendations(events: ForexEvent[]): PairRecommendation[] {
  return [
    {
      pair: 'EURUSD',
      recommendation: 'watch',
      reason: 'German sentiment + ECB bulletin today. High volatility expected. Wait for 1H post-release for cleaner setups.',
      tone: 'neutral',
      events: events.filter(e => e.pair === 'EURUSD'),
      setupsAvailable: ['Smart Money Liquidity', 'Order Block Reversal']
    },
    {
      pair: 'GBPUSD',
      recommendation: 'trade',
      reason: 'Retail sales data expected. No major shocks forecasted. Good for technical setups in London session.',
      tone: 'neutral',
      events: events.filter(e => e.pair === 'GBPUSD'),
      setupsAvailable: ['Market Structure', 'Support/Resistance Bounce']
    },
    {
      pair: 'USDJPY',
      recommendation: 'avoid',
      reason: 'US Jobs data at 12:00 = maximum volatility. Slippage will be brutal. Skip today, plenty of other opportunities.',
      tone: 'bullish',
      events: events.filter(e => e.pair === 'USDJPY'),
      setupsAvailable: []
    },
    {
      pair: 'AUDUSD',
      recommendation: 'watch',
      reason: 'CPI release at 2:30 PM. Watch for breakout direction. Safe entry 30 mins after release.',
      tone: 'neutral',
      events: events.filter(e => e.pair === 'AUDUSD'),
      setupsAvailable: ['Fair Value Gap + Block']
    },
    {
      pair: 'NZDUSD',
      recommendation: 'trade',
      reason: 'Trade balance (medium impact). Setup opportunities likely to form around London open.',
      tone: 'neutral',
      events: events.filter(e => e.pair === 'NZDUSD'),
      setupsAvailable: ['Market Structure', 'Order Block']
    },
    {
      pair: 'CHFUSD',
      recommendation: 'trade',
      reason: 'No major economic events for Swiss Franc today. Safe trading environment.',
      tone: 'neutral',
      events: [],
      setupsAvailable: ['Market Structure', 'Support/Resistance']
    },
  ];
}
