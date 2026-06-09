'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, AlertCircle, RefreshCw, TrendingUp, TrendingDown, Minus, Activity, DollarSign, Globe, Zap } from 'lucide-react';
import { usePortfolio } from '../../lib/portfolioContext';
import { motion } from 'framer-motion';
import { SectionHeader, microLabel } from './_ui';

interface LiveMkt {
  sp500:     { current: number; change: number } | null;
  vix:       { current: number; change: number } | null;
  dxy:       { current: number; change: number } | null;
  gold:      { current: number; change: number } | null;
  btc:       { current: number; change: number } | null;
  tnx:       { current: number; change: number } | null;
  fearGreed: { value: number; classification: string } | null;
  updatedAt: string;
}

const CATEGORY_INSIGHTS: Record<string, { headline: string; detail: string; impact: 'high'|'medium'|'low' }[]> = {
  crypto: [
    { headline: 'Bitcoin Spot ETF Inflows Accelerating', impact: 'high', detail: 'Institutional flows into BTC ETFs at record pace. Structural demand from TradFi allocators is new this cycle.' },
    { headline: 'Ethereum Layer-2 Activity at ATH', impact: 'medium', detail: 'L2 sequencer fees flowing back to ETH creates deflationary pressure — bullish demand signal for ETH.' },
  ],
  stocks: [
    { headline: 'S&P 500 Earnings Growth Beating Estimates', impact: 'high', detail: 'Corporate earnings expanding 8–12% YoY. Strong fundamentals support continued equity appreciation.' },
    { headline: 'AI Capital Expenditure Cycle Intensifying', impact: 'high', detail: 'Tech majors spending aggressively on AI infrastructure — tailwind for semiconductors and cloud providers.' },
  ],
  etf: [
    { headline: 'Passive Fund Inflows at Record Levels', impact: 'medium', detail: 'ETF flows signal continued retail and institutional allocation to diversified products.' },
    { headline: 'Dividend ETFs Gaining Traction', impact: 'low', detail: 'Income-focused products seeing inflows as rate cycle peaks. Defensive positioning increasing.' },
  ],
  commodities: [
    { headline: 'Gold Near All-Time Highs on Rate Pivot', impact: 'high', detail: 'Central bank gold buying accelerating. Rate cuts would further boost non-yielding hard assets.' },
    { headline: 'Copper Demand Rising on AI Build-Out', impact: 'medium', detail: 'Data center and EV transition driving structural copper demand. Supply constrained from mining bottlenecks.' },
  ],
  forex: [
    { headline: 'Dollar Index Weakening on Fed Pivot', impact: 'high', detail: 'USD weakness benefits EM forex positions and dollar-denominated commodity prices globally.' },
    { headline: 'JPY Recovering as BOJ Normalizes', impact: 'medium', detail: 'Bank of Japan rate hike cycle beginning after decades of ZIRP. Watch carry trade unwind risk.' },
  ],
};

function fmt(n: number, decimals = 2) {
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return n.toFixed(decimals);
}

function ChangeChip({ change }: { change: number }) {
  const up = change > 0;
  const flat = Math.abs(change) < 0.01;
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  const col = flat ? 'text-slate-400' : up ? 'text-emerald-400' : 'text-rose-400';
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${col}`}>
      <Icon size={12} />
      {flat ? '—' : `${up ? '+' : ''}${change.toFixed(2)}%`}
    </span>
  );
}

function LiveCard({
  label, value, change, sub, color, icon: Icon, loading,
}: {
  label: string; value: string | null; change?: number | null; sub?: string;
  color: string; icon: React.ElementType; loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-xl p-5 overflow-hidden"
      style={{ background: 'rgba(7,10,20,0.9)', border: `1px solid rgba(${color},0.2)` }}
    >
      <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at top right, rgba(${color},0.6), transparent 70%)` }} />
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
        <div className="p-1.5 rounded-lg" style={{ background: `rgba(${color},0.12)` }}>
          <Icon size={14} style={{ color: `rgb(${color})` }} />
        </div>
      </div>
      {loading || value === null ? (
        <div className="h-8 w-20 rounded-md bg-slate-800 animate-pulse mt-1" />
      ) : (
        <p className="text-2xl font-bold text-slate-100 mb-1">{value}</p>
      )}
      <div className="flex items-center gap-2 mt-1">
        {change != null && !loading && <ChangeChip change={change} />}
        {sub && <span className="text-xs text-slate-500">{sub}</span>}
      </div>
    </motion.div>
  );
}

function FearGauge({ value, label, loading }: { value: number | null; label: string; loading: boolean }) {
  const angle = value !== null ? (value / 100) * 180 - 90 : -90;
  const col = value === null ? '#64748b'
    : value >= 75 ? '#f87171'
    : value >= 55 ? '#fb923c'
    : value >= 45 ? '#94a3b8'
    : value >= 25 ? '#60a5fa'
    : '#34d399';

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <svg viewBox="0 0 120 70" width="120" height="70">
        <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" strokeLinecap="round" />
        {value !== null && (
          <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke={col} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${(value / 100) * 157} 157`} style={{ transition: 'stroke-dasharray 1s ease' }} />
        )}
        {!loading && value !== null && (
          <line
            x1="60" y1="60"
            x2={60 + 38 * Math.cos(((angle - 90) * Math.PI) / 180)}
            y2={60 + 38 * Math.sin(((angle - 90) * Math.PI) / 180)}
            stroke={col} strokeWidth="2.5" strokeLinecap="round"
            style={{ transition: 'all 1s ease' }}
          />
        )}
        <circle cx="60" cy="60" r="4" fill={loading ? '#334155' : col} />
      </svg>
      {loading ? (
        <div className="h-5 w-16 rounded bg-slate-800 animate-pulse" />
      ) : value !== null ? (
        <div className="text-center">
          <span className="text-xl font-bold" style={{ color: col }}>{value}</span>
          <span className="text-xs text-slate-400 ml-2">{label}</span>
        </div>
      ) : (
        <span className="text-xs text-slate-500">Unavailable</span>
      )}
    </div>
  );
}

export default function MarketIntelligence() {
  const { positions, isEmpty } = usePortfolio();
  const [data, setData] = useState<LiveMkt | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/market-data');
      if (r.ok) {
        const d = await r.json();
        setData(d);
        setLastRefresh(new Date());
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const heldCategories = [...new Set(positions.map(p => p.category))];
  const insights = isEmpty
    ? Object.values(CATEGORY_INSIGHTS).flat().slice(0, 5)
    : heldCategories.flatMap(cat => (CATEGORY_INSIGHTS[cat] || []).map(i => ({ ...i, category: cat })));

  const vixStatus = data?.vix?.current
    ? data.vix.current < 15 ? { label: 'Low', col: '52,211,153' }
    : data.vix.current < 25 ? { label: 'Moderate', col: '250,204,21' }
    : { label: 'Elevated', col: '248,113,113' }
    : null;

  const fearLabel = data?.fearGreed?.classification ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        icon={BarChart3}
        title="Market Intelligence"
        subtitle={lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Live market context'}
        right={
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-cyan-300 transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      />

      {/* Live Market Ticker Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <LiveCard label="S&P 500"  value={data?.sp500 ? fmt(data.sp500.current)       : null} change={data?.sp500?.change}  color="52,211,153"  icon={TrendingUp} loading={loading} />
        <LiveCard label="BTC/USD"  value={data?.btc   ? `$${fmt(data.btc.current, 0)}`  : null} change={data?.btc?.change}   color="245,158,11"  icon={Activity}   loading={loading} />
        <LiveCard label="Gold"     value={data?.gold  ? `$${fmt(data.gold.current)}`     : null} change={data?.gold?.change}  color="234,179,8"   icon={DollarSign} loading={loading} />
        <LiveCard label="VIX"      value={data?.vix   ? fmt(data.vix.current)            : null} change={data?.vix?.change}   sub={vixStatus?.label ?? undefined} color={vixStatus?.col ?? '148,163,184'} icon={Activity} loading={loading} />
        <LiveCard label="DXY"      value={data?.dxy   ? fmt(data.dxy.current)            : null} change={data?.dxy?.change}   color="129,140,248" icon={Globe}      loading={loading} />
        <LiveCard label="10Y Yield" value={data?.tnx  ? `${fmt(data.tnx.current)}%`     : null} change={data?.tnx?.change}   color="167,139,250" icon={Zap}        loading={loading} />
      </div>

      {/* Sentiment Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fear & Greed */}
        <div className="rounded-xl p-5" style={{ background: 'rgba(7,10,20,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Crypto Fear & Greed</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.2)' }}>LIVE</span>
          </div>
          <FearGauge value={data?.fearGreed?.value ?? null} label={fearLabel ?? ''} loading={loading} />
        </div>

        {/* Market Outlook */}
        <div className="rounded-xl p-5" style={{ background: 'rgba(7,10,20,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Market Context</p>
          <div className="space-y-3">
            {[
              { label: 'Trend', val: data?.sp500 ? (data.sp500.change > 0 ? 'Bullish' : 'Bearish') : '—', up: data?.sp500 ? data.sp500.change > 0 : null },
              { label: 'Volatility', val: vixStatus?.label ?? '—', up: data?.vix ? data.vix.current < 20 : null },
              { label: 'Dollar', val: data?.dxy ? (data.dxy.change > 0 ? 'Strengthening' : 'Weakening') : '—', up: data?.dxy ? data.dxy.change < 0 : null },
            ].map(({ label, val, up }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{label}</span>
                <span className={`text-xs font-semibold ${up === null ? 'text-slate-400' : up ? 'text-emerald-400' : 'text-rose-400'}`}>{val}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs text-slate-400 leading-relaxed">
              {!loading && data ? (
                data.vix && data.vix.current > 25
                  ? 'Elevated volatility — reduce position size, widen stops, and focus on quality assets.'
                  : data.sp500 && data.sp500.change > 0
                  ? 'Positive session — risk-on environment supports growth assets and cyclicals.'
                  : 'Defensive session — monitor key support levels and consider partial hedges.'
              ) : 'Loading market context...'}
            </p>
          </div>
        </div>
      </div>

      {/* Portfolio-specific insights */}
      {insights.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold tracking-tight text-slate-100">
              {isEmpty ? 'Market Insights' : 'Insights for Your Holdings'}
            </h3>
            {!isEmpty && <span className="text-xs text-slate-500">based on your portfolio categories</span>}
          </div>
          <div className="space-y-3">
            {insights.map((news, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl p-5 hover:border-slate-600 transition-colors"
                style={{ background: 'rgba(7,10,20,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                    news.impact === 'high' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                    : news.impact === 'medium' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                    : 'bg-slate-700/50 text-slate-300 border border-slate-600/25'}`}>
                    {news.impact.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-100 text-sm mb-1">{news.headline}</h4>
                    {'category' in news && (
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">{(news as any).category}</p>
                    )}
                    <div className="flex items-start gap-2 mt-2 p-3 rounded-lg" style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.1)' }}>
                      <AlertCircle size={13} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                      <p className="text-slate-300 text-xs leading-relaxed">{news.detail}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
