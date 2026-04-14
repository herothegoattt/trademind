'use client';

import { useMemo } from 'react';
import { Shield, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { usePortfolio, calcPnL, posInvested, posCurrentValue } from '../../lib/portfolioContext';
import { CAT_COLORS } from './InvestingPortfolio';

export default function RiskAnalysis() {
  const { positions, stats, allocation, isEmpty } = usePortfolio();

  const riskMetrics = useMemo(() => {
    if (isEmpty) return [];

    const open = positions.filter(p => p.status === 'open');
    const futuresPositions = open.filter(p => p.type === 'futures');
    const avgLeverage = futuresPositions.length > 0
      ? futuresPositions.reduce((s, p) => s + p.leverage, 0) / futuresPositions.length
      : 1;

    const totalVal = stats.totalCurrentVal;
    const winners = positions.filter(p => calcPnL(p) > 0);
    const losers  = positions.filter(p => calcPnL(p) < 0);
    const biggestLoss = losers.length > 0 ? Math.min(...losers.map(calcPnL)) : 0;
    const maxDrawdownPct = stats.totalInvested > 0 ? (biggestLoss / stats.totalInvested) * 100 : 0;

    // Concentration: largest single position
    const sortedByVal = [...open].sort((a, b) => posCurrentValue(b) - posCurrentValue(a));
    const topPct = totalVal > 0 && sortedByVal[0] ? (posCurrentValue(sortedByVal[0]) / totalVal) * 100 : 0;

    // Category concentration
    const catCount = new Set(open.map(p => p.category)).size;
    const diversificationScore = Math.min(100, catCount * 20 + Math.min(40, open.length * 4));

    const leverageRisk = avgLeverage > 10 ? 'critical' : avgLeverage > 3 ? 'warning' : 'good';
    const concRisk = topPct > 50 ? 'critical' : topPct > 30 ? 'warning' : 'good';

    return [
      {
        name: 'Portfolio Win Rate',
        value: `${stats.winRate.toFixed(0)}%`,
        threshold: '> 50%',
        status: stats.winRate >= 50 ? 'good' : stats.winRate >= 35 ? 'warning' : 'critical',
        description: `${winners.length} winning vs ${losers.length} losing positions. ${stats.winRate >= 50 ? 'Healthy win rate.' : 'Consider reviewing your losing positions.'}`,
      },
      {
        name: 'Largest Single Drawdown',
        value: `${maxDrawdownPct.toFixed(1)}%`,
        threshold: '< -15%',
        status: maxDrawdownPct > -25 ? 'good' : maxDrawdownPct > -40 ? 'warning' : 'critical',
        description: `Worst single position loss relative to total invested capital. ${Math.abs(maxDrawdownPct) < 15 ? 'Well within acceptable range.' : 'Consider position sizing adjustments.'}`,
      },
      {
        name: 'Avg Futures Leverage',
        value: avgLeverage > 1 ? `${avgLeverage.toFixed(1)}x` : 'N/A (Spot)',
        threshold: '< 5x',
        status: leverageRisk,
        description: futuresPositions.length > 0
          ? `Average leverage across ${futuresPositions.length} futures position(s). ${avgLeverage > 5 ? 'High leverage amplifies both gains and losses.' : 'Leverage within manageable range.'}`
          : 'No futures positions — pure spot portfolio.',
      },
      {
        name: 'Top Position Concentration',
        value: `${topPct.toFixed(0)}%`,
        threshold: '< 30%',
        status: concRisk,
        description: sortedByVal[0]
          ? `Largest position (${sortedByVal[0].symbol}) represents ${topPct.toFixed(1)}% of portfolio value. ${topPct > 30 ? 'Consider reducing concentration risk.' : 'Concentration within limits.'}`
          : 'No open positions.',
      },
      {
        name: 'Diversification Score',
        value: `${diversificationScore}/100`,
        threshold: '> 60',
        status: diversificationScore >= 60 ? 'good' : diversificationScore >= 40 ? 'warning' : 'critical',
        description: `Based on ${catCount} categories and ${open.length} open positions. ${diversificationScore >= 60 ? 'Well diversified across asset classes.' : 'Add positions across more categories to improve diversification.'}`,
      },
      {
        name: 'Realized vs Unrealized',
        value: `${stats.realizedPnL >= 0 ? '+' : ''}$${Math.abs(stats.realizedPnL) >= 1000 ? (stats.realizedPnL/1000).toFixed(1)+'k' : stats.realizedPnL.toFixed(0)} / ${stats.unrealizedPnL >= 0 ? '+' : ''}$${Math.abs(stats.unrealizedPnL) >= 1000 ? (stats.unrealizedPnL/1000).toFixed(1)+'k' : stats.unrealizedPnL.toFixed(0)}`,
        threshold: 'Realized > 0',
        status: stats.realizedPnL >= 0 ? 'good' : 'warning',
        description: `Realized P&L from ${stats.closedCount} closed trades. Unrealized from ${stats.openCount} open. ${stats.realizedPnL >= 0 ? 'Positive realized P&L — good discipline.' : 'Negative realized P&L — review closed trade strategy.'}`,
      },
    ];
  }, [positions, stats, isEmpty]);

  const catBarData = useMemo(() =>
    allocation.map(a => ({
      name: a.category,
      invested: parseFloat(a.invested.toFixed(0)),
      currentValue: parseFloat(a.currentValue.toFixed(0)),
      pnl: parseFloat(a.pnl.toFixed(0)),
      fill: CAT_COLORS[a.category] || '#64748b',
    })), [allocation]);

  const concentrationData = useMemo(() => {
    const open = positions.filter(p => p.status === 'open');
    const totalVal = open.reduce((s, p) => s + posCurrentValue(p), 0);
    return [...open]
      .sort((a, b) => posCurrentValue(b) - posCurrentValue(a))
      .slice(0, 8)
      .map(p => ({
        name: p.symbol,
        pct: totalVal > 0 ? (posCurrentValue(p) / totalVal) * 100 : 0,
      }));
  }, [positions]);

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4">🛡️</div>
        <h3 className="text-xl font-bold text-slate-200 mb-2">No data to analyze</h3>
        <p className="text-slate-400 text-sm max-w-md">
          Add positions in <span className="text-orange-400 font-bold">My Portfolio</span> and risk metrics will populate automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="text-cyan-400" size={24} />
        <h2 className="text-2xl font-bold text-slate-100">Portfolio Risk Assessment</h2>
        <span className="text-xs text-slate-500 ml-2">Based on your {positions.length} positions</span>
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {riskMetrics.map((m, i) => (
          <div key={i} className={`bg-slate-900 border rounded-xl p-5 ${
            m.status === 'good' ? 'border-emerald-700/30' : m.status === 'warning' ? 'border-yellow-700/30' : 'border-red-700/30'}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-slate-400 text-sm font-medium">{m.name}</p>
                <p className="text-2xl font-bold text-slate-100 mt-2">{m.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${m.status === 'good' ? 'bg-emerald-900/30' : m.status === 'warning' ? 'bg-yellow-900/30' : 'bg-red-900/30'}`}>
                {m.status === 'good'
                  ? <Shield className="text-emerald-400" size={20} />
                  : <AlertTriangle className={m.status === 'warning' ? 'text-yellow-400' : 'text-red-400'} size={20} />}
              </div>
            </div>
            <p className="text-slate-400 text-xs mb-1">Target: {m.threshold}</p>
            <p className="text-slate-400 text-xs leading-relaxed">{m.description}</p>
          </div>
        ))}
      </div>

      {/* Category risk */}
      {catBarData.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-6">P&L by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={catBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                formatter={(v: any) => [`$${Number(v).toFixed(0)}`]} />
              <Legend wrapperStyle={{ color: '#cbd5e1' }} />
              <Bar dataKey="invested" name="Invested" fill="#334155" radius={[4,4,0,0]} />
              <Bar dataKey="currentValue" name="Current Value" fill="#06b6d4" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Concentration */}
      {concentrationData.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-6">Position Concentration</h3>
          <div className="space-y-3">
            {concentrationData.map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-300 text-sm font-medium">{item.name}</span>
                  <span className={`font-bold text-sm ${item.pct > 30 ? 'text-rose-400' : item.pct > 20 ? 'text-yellow-400' : 'text-slate-300'}`}>
                    {item.pct.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className={`h-2 rounded-full ${item.pct > 30 ? 'bg-rose-400' : item.pct > 20 ? 'bg-yellow-400' : 'bg-cyan-400'}`}
                    style={{ width: `${Math.min(100, item.pct)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Green &lt;20% · Yellow 20–30% · Red &gt;30% (concentration risk)
          </p>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <TrendingDown size={20} className="text-cyan-400" />
          Risk Management Recommendations
        </h3>
        <ul className="space-y-3 text-slate-300 text-sm">
          {stats.winRate < 50 && (
            <li className="flex gap-3"><span className="text-yellow-400 font-bold">→</span>
              <span>Win rate below 50% — review your entry criteria and consider tightening stop losses</span></li>
          )}
          {allocation.length < 3 && (
            <li className="flex gap-3"><span className="text-yellow-400 font-bold">→</span>
              <span>Portfolio concentrated in {allocation.length} categor{allocation.length === 1 ? 'y' : 'ies'} — diversify across crypto, stocks, ETFs</span></li>
          )}
          {positions.filter(p => p.type === 'futures' && p.leverage > 10).length > 0 && (
            <li className="flex gap-3"><span className="text-red-400 font-bold">!</span>
              <span>High leverage futures detected (&gt;10x) — these can liquidate fast; manage size carefully</span></li>
          )}
          {stats.winRate >= 50 && (
            <li className="flex gap-3"><span className="text-emerald-400 font-bold">✓</span>
              <span>Win rate healthy at {stats.winRate.toFixed(0)}% — maintain discipline and position sizing</span></li>
          )}
          <li className="flex gap-3"><span className="text-cyan-400 font-bold">→</span>
            <span>Review positions quarterly and rebalance when a category drifts 10%+ from target</span></li>
          <li className="flex gap-3"><span className="text-emerald-400 font-bold">✓</span>
            <span>Use stop losses on all futures positions to cap maximum drawdown</span></li>
        </ul>
      </div>
    </div>
  );
}
