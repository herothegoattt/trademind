'use client';

import { TrendingUp, TrendingDown, DollarSign, Percent, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Area, AreaChart } from 'recharts';
import { usePortfolio, calcPnL, posInvested, posCurrentValue } from '../../lib/portfolioContext';
import { CAT_COLORS } from './InvestingPortfolio';
import { Panel, StatTile, EmptyState, microLabel, tooltipStyle, DeltaChip, CAT_RGB } from './_ui';

export default function PortfolioOverview() {
  const { positions, stats, allocation, performance, isEmpty } = usePortfolio();

  if (isEmpty) {
    return (
      <EmptyState icon={Wallet} title="No positions yet">
        Add your investments in the <span className="text-cyan-400 font-medium">My Portfolio</span> tab.
        Every stat, chart and analysis here will populate automatically.
      </EmptyState>
    );
  }

  // '-$1.5k' / '+$1.5k' / '$500'
  const fmt = (n: number, sign = false): string => {
    const abs = Math.abs(n);
    const prefix = n < 0 ? '-' : sign ? '+' : '';
    return abs >= 1000 ? `${prefix}$${(abs / 1000).toFixed(1)}k` : `${prefix}$${abs.toFixed(0)}`;
  };
  const tone = (n: number) => (n >= 0 ? 'text-emerald-400' : 'text-rose-400');

  const totalReturn   = stats.totalPnL;
  const returnPct     = stats.totalReturnPct;
  const openPositions = positions.filter(p => p.status === 'open');

  const allocData = allocation.map(a => ({
    name: a.category, value: a.currentValue, color: CAT_COLORS[a.category] || '#94a3b8',
  }));

  const topHoldings = [...openPositions]
    .sort((a, b) => posCurrentValue(b) - posCurrentValue(a))
    .slice(0, 8);

  const totalOpenVal = openPositions.reduce((s, p) => s + posCurrentValue(p), 0);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile index={0} label="Portfolio Value" value={fmt(stats.totalCurrentVal)}
          icon={DollarSign} delta={`${stats.openCount} open positions`} deltaTone="muted" />
        <StatTile index={1} label="Total Return" value={fmt(totalReturn, true)}
          valueClass={tone(totalReturn)} icon={totalReturn >= 0 ? TrendingUp : TrendingDown}
          delta={`${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(1)}% overall`} deltaTone={returnPct >= 0 ? 'gain' : 'loss'} />
        <StatTile index={2} label="Unrealized P&L" value={fmt(stats.unrealizedPnL, true)}
          valueClass={tone(stats.unrealizedPnL)} icon={Percent} delta="Open positions" deltaTone="muted" />
        <StatTile index={3} label="Win Rate" value={`${stats.winRate.toFixed(0)}%`}
          valueClass={tone(stats.winRate - 50)} icon={TrendingUp}
          delta={`${positions.filter(p => calcPnL(p) > 0).length}W · ${positions.filter(p => calcPnL(p) < 0).length}L`} deltaTone="muted" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2 p-5">
          <h3 className={`${microLabel} mb-4`}>Portfolio Performance · Cumulative P&amp;L</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performance} margin={{ top: 4, right: 6, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="ovFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(34,211,238)" stopOpacity={0.26} />
                  <stop offset="100%" stopColor="rgb(34,211,238)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={48} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'rgba(34,211,238,0.3)' }}
                formatter={(v: any) => [`$${Number(v).toFixed(0)}`, 'Cumulative P&L']} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="cumulativePnL" stroke="rgb(34,211,238)" strokeWidth={2} fill="url(#ovFill)" dot={false} activeDot={{ r: 4, fill: 'rgb(34,211,238)' }} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel className="p-5">
          <h3 className={`${microLabel} mb-4`}>Asset Allocation</h3>
          {allocData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={allocData} cx="50%" cy="50%" innerRadius={56} outerRadius={86} paddingAngle={3} dataKey="value" stroke="none">
                    {allocData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle}
                    formatter={(v: any, _n: any, p: any) => [`$${Number(v).toFixed(0)}`, p?.payload?.name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {allocData.map((e, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                      <span className="text-slate-400 capitalize">{e.name}</span>
                    </div>
                    <span className="text-slate-300 tabular-nums">{fmt(e.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 grid place-items-center text-slate-600 text-sm">No open positions</div>
          )}
        </Panel>
      </div>

      {/* Holdings */}
      <Panel className="p-5">
        <h3 className={`${microLabel} mb-4`}>Top Holdings</h3>
        <div className="space-y-1.5">
          {topHoldings.map((pos) => {
            const pnl    = calcPnL(pos);
            const share  = totalOpenVal > 0 ? (posCurrentValue(pos) / totalOpenVal) * 100 : 0;
            const pnlPct = posInvested(pos) > 0 ? (pnl / posInvested(pos)) * 100 : 0;
            const isGood = pnl >= 0;
            return (
              <div key={pos.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-white/[0.02]"
                style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: `rgb(${CAT_RGB[pos.category] || CAT_RGB.other})` }} />
                  <div className="min-w-0">
                    <p className="text-slate-100 font-semibold text-sm">{pos.symbol}</p>
                    <p className="text-slate-500 text-xs capitalize">{pos.category} · {pos.type}</p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-slate-300 text-sm tabular-nums">{fmt(posCurrentValue(pos))}</p>
                  <p className="text-slate-500 text-xs tabular-nums">{share.toFixed(1)}% of book</p>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className={`text-sm font-semibold tabular-nums ${isGood ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(pnl, true)}</span>
                  <DeltaChip value={pnlPct} size="xs" />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Best / Worst */}
      {(stats.best || stats.worst) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stats.best && <Highlight position={stats.best} kind="best" fmt={fmt} />}
          {stats.worst && <Highlight position={stats.worst} kind="worst" fmt={fmt} />}
        </div>
      )}
    </div>
  );
}

function Highlight({ position, kind, fmt }: { position: any; kind: 'best' | 'worst'; fmt: (n: number, s?: boolean) => string }) {
  const pnl = calcPnL(position);
  const pct = posInvested(position) > 0 ? (pnl / posInvested(position)) * 100 : 0;
  const isBest = kind === 'best';
  const rgb = isBest ? '52,211,153' : '248,113,113';
  const Icon = isBest ? TrendingUp : TrendingDown;
  return (
    <Panel accent={rgb} glow className="p-5">
      <div className="flex items-start gap-3">
        <div className="grid place-items-center w-9 h-9 rounded-xl flex-shrink-0" style={{ background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.25)` }}>
          <Icon size={17} style={{ color: `rgb(${rgb})` }} />
        </div>
        <div>
          <p className={microLabel}>{isBest ? 'Best Position' : 'Worst Position'}</p>
          <p className="text-xl font-semibold tracking-tight text-slate-100 mt-1">{position.symbol}</p>
          <p className="text-sm mt-0.5 tabular-nums">
            <span style={{ color: `rgb(${rgb})` }}>{fmt(pnl, true)}</span>
            <span className="text-slate-500 ml-1.5">({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)</span>
          </p>
        </div>
      </div>
    </Panel>
  );
}
