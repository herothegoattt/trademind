'use client';

import { useMemo } from 'react';
import { Shield, AlertTriangle, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { usePortfolio, calcPnL, posCurrentValue } from '../../lib/portfolioContext';
import { CAT_COLORS } from './InvestingPortfolio';
import { Panel, SectionHeader, EmptyState, microLabel, tooltipStyle } from './_ui';

type RiskStatus = 'good' | 'warning' | 'critical';

const STATUS_RGB: Record<RiskStatus, string> = {
  good: '52,211,153', warning: '251,191,36', critical: '248,113,113',
};

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

    const sortedByVal = [...open].sort((a, b) => posCurrentValue(b) - posCurrentValue(a));
    const topPct = totalVal > 0 && sortedByVal[0] ? (posCurrentValue(sortedByVal[0]) / totalVal) * 100 : 0;

    const catCount = new Set(open.map(p => p.category)).size;
    const diversificationScore = Math.min(100, catCount * 20 + Math.min(40, open.length * 4));

    const leverageRisk: RiskStatus = avgLeverage > 10 ? 'critical' : avgLeverage > 3 ? 'warning' : 'good';
    const concRisk: RiskStatus = topPct > 50 ? 'critical' : topPct > 30 ? 'warning' : 'good';

    const fmtK = (n: number) => `${n >= 0 ? '+' : ''}$${Math.abs(n) >= 1000 ? (n/1000).toFixed(1)+'k' : n.toFixed(0)}`;

    return [
      {
        name: 'Portfolio Win Rate', value: `${stats.winRate.toFixed(0)}%`, threshold: '> 50%',
        status: (stats.winRate >= 50 ? 'good' : stats.winRate >= 35 ? 'warning' : 'critical') as RiskStatus,
        description: `${winners.length} winning vs ${losers.length} losing positions. ${stats.winRate >= 50 ? 'Healthy win rate.' : 'Consider reviewing your losing positions.'}`,
      },
      {
        name: 'Largest Single Drawdown', value: `${maxDrawdownPct.toFixed(1)}%`, threshold: '< -15%',
        status: (maxDrawdownPct > -25 ? 'good' : maxDrawdownPct > -40 ? 'warning' : 'critical') as RiskStatus,
        description: `Worst single position loss relative to total invested capital. ${Math.abs(maxDrawdownPct) < 15 ? 'Well within acceptable range.' : 'Consider position sizing adjustments.'}`,
      },
      {
        name: 'Avg Futures Leverage', value: avgLeverage > 1 ? `${avgLeverage.toFixed(1)}x` : 'N/A · Spot', threshold: '< 5x',
        status: leverageRisk,
        description: futuresPositions.length > 0
          ? `Average leverage across ${futuresPositions.length} futures position(s). ${avgLeverage > 5 ? 'High leverage amplifies both gains and losses.' : 'Leverage within manageable range.'}`
          : 'No futures positions — pure spot portfolio.',
      },
      {
        name: 'Top Position Concentration', value: `${topPct.toFixed(0)}%`, threshold: '< 30%',
        status: concRisk,
        description: sortedByVal[0]
          ? `Largest position (${sortedByVal[0].symbol}) represents ${topPct.toFixed(1)}% of portfolio value. ${topPct > 30 ? 'Consider reducing concentration risk.' : 'Concentration within limits.'}`
          : 'No open positions.',
      },
      {
        name: 'Diversification Score', value: `${diversificationScore}/100`, threshold: '> 60',
        status: (diversificationScore >= 60 ? 'good' : diversificationScore >= 40 ? 'warning' : 'critical') as RiskStatus,
        description: `Based on ${catCount} categories and ${open.length} open positions. ${diversificationScore >= 60 ? 'Well diversified across asset classes.' : 'Add positions across more categories to improve diversification.'}`,
      },
      {
        name: 'Realized vs Unrealized', value: `${fmtK(stats.realizedPnL)} / ${fmtK(stats.unrealizedPnL)}`, threshold: 'Realized > 0',
        status: (stats.realizedPnL >= 0 ? 'good' : 'warning') as RiskStatus,
        description: `Realized P&L from ${stats.closedCount} closed trades. Unrealized from ${stats.openCount} open. ${stats.realizedPnL >= 0 ? 'Positive realized P&L — good discipline.' : 'Negative realized P&L — review closed trade strategy.'}`,
      },
    ];
  }, [positions, stats, isEmpty]);

  const catBarData = useMemo(() =>
    allocation.map(a => ({
      name: a.category,
      invested: parseFloat(a.invested.toFixed(0)),
      currentValue: parseFloat(a.currentValue.toFixed(0)),
      fill: CAT_COLORS[a.category] || '#94a3b8',
    })), [allocation]);

  const concentrationData = useMemo(() => {
    const open = positions.filter(p => p.status === 'open');
    const totalVal = open.reduce((s, p) => s + posCurrentValue(p), 0);
    return [...open]
      .sort((a, b) => posCurrentValue(b) - posCurrentValue(a))
      .slice(0, 8)
      .map(p => ({ name: p.symbol, pct: totalVal > 0 ? (posCurrentValue(p) / totalVal) * 100 : 0 }));
  }, [positions]);

  if (isEmpty) {
    return (
      <EmptyState icon={Shield} title="No data to analyze">
        Add positions in the <span className="text-cyan-400 font-medium">My Portfolio</span> tab and your
        risk metrics will populate automatically.
      </EmptyState>
    );
  }

  const recommendations = [
    stats.winRate < 50 && { tone: 'warning' as const, text: 'Win rate below 50% — review your entry criteria and consider tightening stop losses.' },
    allocation.length < 3 && { tone: 'warning' as const, text: `Portfolio concentrated in ${allocation.length} categor${allocation.length === 1 ? 'y' : 'ies'} — diversify across crypto, stocks and ETFs.` },
    positions.filter(p => p.type === 'futures' && p.leverage > 10).length > 0 && { tone: 'critical' as const, text: 'High leverage futures detected (>10x) — these can liquidate fast; manage size carefully.' },
    stats.winRate >= 50 && { tone: 'good' as const, text: `Win rate healthy at ${stats.winRate.toFixed(0)}% — maintain discipline and position sizing.` },
    { tone: 'info' as const, text: 'Review positions quarterly and rebalance when a category drifts 10%+ from target.' },
    { tone: 'good' as const, text: 'Use stop losses on all futures positions to cap maximum drawdown.' },
  ].filter(Boolean) as { tone: 'good'|'warning'|'critical'|'info'; text: string }[];

  return (
    <div className="space-y-6">
      <SectionHeader icon={Shield} title="Portfolio Risk Assessment" subtitle={`Based on your ${positions.length} positions`} />

      {/* Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {riskMetrics.map((m, i) => {
          const rgb = STATUS_RGB[m.status];
          return (
            <Panel key={i} accent={rgb} className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className={microLabel}>{m.name}</p>
                  <p className="text-2xl font-semibold tracking-tight text-slate-100 mt-2 tabular-nums">{m.value}</p>
                </div>
                <div className="grid place-items-center w-9 h-9 rounded-xl flex-shrink-0" style={{ background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.25)` }}>
                  {m.status === 'good'
                    ? <ShieldCheck size={17} style={{ color: `rgb(${rgb})` }} />
                    : <AlertTriangle size={17} style={{ color: `rgb(${rgb})` }} />}
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `rgba(${rgb},0.1)`, color: `rgb(${rgb})`, border: `1px solid rgba(${rgb},0.22)` }}>
                  Target {m.threshold}
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{m.description}</p>
            </Panel>
          );
        })}
      </div>

      {/* Category risk */}
      {catBarData.length > 0 && (
        <Panel className="p-5">
          <h3 className={`${microLabel} mb-4`}>Invested vs Current Value by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={catBarData} margin={{ top: 4, right: 6, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="capitalize" />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={48} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                formatter={(v: any, n: any) => [`$${Number(v).toFixed(0)}`, n]} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} iconType="circle" />
              <Bar dataKey="invested" name="Invested" fill="rgba(148,163,184,0.35)" radius={[4,4,0,0]} />
              <Bar dataKey="currentValue" name="Current Value" fill="rgb(34,211,238)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}

      {/* Concentration */}
      {concentrationData.length > 0 && (
        <Panel className="p-5">
          <h3 className={`${microLabel} mb-4`}>Position Concentration</h3>
          <div className="space-y-3.5">
            {concentrationData.map((item, i) => {
              const rgb = item.pct > 30 ? '248,113,113' : item.pct > 20 ? '251,191,36' : '34,211,238';
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-300 text-sm font-medium">{item.name}</span>
                    <span className="text-sm font-semibold tabular-nums" style={{ color: `rgb(${rgb})` }}>{item.pct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, item.pct)}%`, background: `rgb(${rgb})`, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-4 flex items-center gap-3 flex-wrap">
            <LegendDot rgb="34,211,238" label="< 20%" />
            <LegendDot rgb="251,191,36" label="20–30%" />
            <LegendDot rgb="248,113,113" label="> 30% concentration risk" />
          </p>
        </Panel>
      )}

      {/* Recommendations */}
      <Panel accent="34,211,238" glow className="p-5">
        <SectionHeader icon={ShieldCheck} title="Risk Management Recommendations" />
        <ul className="mt-4 space-y-2.5">
          {recommendations.map((r, i) => {
            const rgb = r.tone === 'good' ? '52,211,153' : r.tone === 'warning' ? '251,191,36' : r.tone === 'critical' ? '248,113,113' : '34,211,238';
            const Icon = r.tone === 'good' ? CheckCircle2 : r.tone === 'critical' ? AlertCircle : r.tone === 'warning' ? AlertTriangle : ArrowRight;
            return (
              <li key={i} className="flex items-start gap-2.5">
                <Icon size={15} className="flex-shrink-0 mt-0.5" style={{ color: `rgb(${rgb})` }} />
                <span className="text-slate-300 text-sm leading-relaxed">{r.text}</span>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

function LegendDot({ rgb, label }: { rgb: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ background: `rgb(${rgb})` }} />
      {label}
    </span>
  );
}
