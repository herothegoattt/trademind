'use client';

import { TrendingUp, TrendingDown, DollarSign, Percent, AlertCircle } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { usePortfolio, calcPnL, posInvested, posCurrentValue } from '../../lib/portfolioContext';
import { CAT_COLORS } from './InvestingPortfolio';

export default function PortfolioOverview() {
  const { positions, stats, allocation, performance, isEmpty } = usePortfolio();

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4">📊</div>
        <h3 className="text-xl font-bold text-slate-200 mb-2">No positions yet</h3>
        <p className="text-slate-400 text-sm max-w-md">
          Add your investments in the <span className="text-orange-400 font-bold">My Portfolio</span> tab.
          All stats, charts and analysis will populate automatically.
        </p>
      </div>
    );
  }

  const fmt = (n: number) => Math.abs(n) >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n.toFixed(0)}`;
  const totalReturn  = stats.totalPnL;
  const returnPct    = stats.totalReturnPct;
  const openPositions = positions.filter(p => p.status === 'open');

  const allocData = allocation.map(a => ({
    name: a.category, value: a.currentValue, color: CAT_COLORS[a.category] || '#64748b',
  }));

  const topHoldings = [...openPositions]
    .sort((a, b) => posCurrentValue(b) - posCurrentValue(a))
    .slice(0, 8);

  const totalOpenVal = openPositions.reduce((s, p) => s + posCurrentValue(p), 0);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Portfolio Value</p>
              <p className="text-3xl font-bold text-slate-100 mt-2">{fmt(stats.totalCurrentVal)}</p>
              <p className="text-slate-500 text-xs mt-1">{stats.openCount} open positions</p>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg"><DollarSign size={24} className="text-cyan-400" /></div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Return</p>
              <p className={`text-3xl font-bold mt-2 ${totalReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalReturn >= 0 ? '+' : ''}{fmt(totalReturn)}
              </p>
              <p className={`text-xs mt-1 ${returnPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}% overall
              </p>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg">
              {totalReturn >= 0 ? <TrendingUp size={24} className="text-emerald-400" /> : <TrendingDown size={24} className="text-rose-400" />}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Unrealized P&L</p>
              <p className={`text-3xl font-bold mt-2 ${stats.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.unrealizedPnL >= 0 ? '+' : ''}{fmt(stats.unrealizedPnL)}
              </p>
              <p className="text-slate-500 text-xs mt-1">Open positions</p>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg"><Percent size={24} className="text-blue-400" /></div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Win Rate</p>
              <p className={`text-3xl font-bold mt-2 ${stats.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.winRate.toFixed(0)}%
              </p>
              <p className="text-slate-500 text-xs mt-1">
                {positions.filter(p => calcPnL(p) > 0).length}W / {positions.filter(p => calcPnL(p) < 0).length}L
              </p>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg"><TrendingUp size={24} className="text-emerald-400" /></div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-6">Portfolio Performance (Cumulative P&L)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                formatter={(v: any) => [`$${Number(v).toFixed(0)}`, 'Cumul. P&L']} />
              <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="cumulativePnL" stroke="#06b6d4" dot={{ fill: '#06b6d4', r: 4 }} activeDot={{ r: 6 }} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-6">Asset Allocation</h3>
          {allocData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={allocData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                    {allocData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                    formatter={(v: any) => [`$${Number(v).toFixed(0)}`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {allocData.map((e, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                      <span className="text-slate-400 capitalize">{e.name}</span>
                    </div>
                    <span className="text-slate-300 font-mono">{fmt(e.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-sm">No open positions</p>
          )}
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-6">Top Holdings</h3>
        <div className="space-y-3">
          {topHoldings.map((pos, i) => {
            const pnl    = calcPnL(pos);
            const pct    = totalOpenVal > 0 ? (posCurrentValue(pos) / totalOpenVal) * 100 : 0;
            const isGood = pnl >= 0;
            return (
              <div key={pos.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CAT_COLORS[pos.category] || '#64748b' }} />
                  <div>
                    <p className="text-slate-100 font-bold">{pos.symbol}</p>
                    <p className="text-slate-500 text-xs capitalize">{pos.category} · {pos.type}</p>
                  </div>
                </div>
                <div className="text-center hidden sm:block">
                  <p className="text-slate-300 text-sm font-mono">{fmt(posCurrentValue(pos))}</p>
                  <p className="text-slate-500 text-xs">{pct.toFixed(1)}% of portfolio</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${isGood ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isGood ? '+' : ''}{fmt(pnl)}
                  </p>
                  <p className={`text-xs ${isGood ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isGood ? '+' : ''}{((pnl / posInvested(pos)) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Best / Worst */}
      {(stats.best || stats.worst) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.best && (
            <div className="bg-emerald-900/10 border border-emerald-700/30 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-900/30 rounded-lg"><TrendingUp className="text-emerald-400" size={18} /></div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Best Position</p>
                  <p className="text-xl font-black text-emerald-400 mt-1">{stats.best.symbol}</p>
                  <p className="text-sm text-slate-300">+{fmt(calcPnL(stats.best))} ({((calcPnL(stats.best)/posInvested(stats.best))*100).toFixed(1)}%)</p>
                </div>
              </div>
            </div>
          )}
          {stats.worst && (
            <div className="bg-rose-900/10 border border-rose-700/30 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-900/30 rounded-lg"><TrendingDown className="text-rose-400" size={18} /></div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Worst Position</p>
                  <p className="text-xl font-black text-rose-400 mt-1">{stats.worst.symbol}</p>
                  <p className="text-sm text-slate-300">{fmt(calcPnL(stats.worst))} ({((calcPnL(stats.worst)/posInvested(stats.worst))*100).toFixed(1)}%)</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
