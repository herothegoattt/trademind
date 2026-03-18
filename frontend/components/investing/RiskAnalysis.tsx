'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, BarChart3, TrendingDown } from 'lucide-react';
import { BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RiskMetric {
  name: string;
  value: string;
  threshold: string;
  status: 'good' | 'warning' | 'critical';
  description: string;
}

interface SectorRisk {
  sector: string;
  allocation: number;
  volatility: number;
  correlation: number;
}

interface CorrelationPair {
  asset1: string;
  asset2: string;
  correlation: number;
}

export default function RiskAnalysis() {
  const [riskMetrics] = useState<RiskMetric[]>([
    {
      name: 'Portfolio Volatility (Beta)',
      value: '0.92',
      threshold: '< 1.2',
      status: 'good',
      description: 'Your portfolio has below-market volatility, indicating lower risk exposure than the market average.',
    },
    {
      name: 'Maximum Drawdown',
      value: '-18.3%',
      threshold: '< -25%',
      status: 'good',
      description: 'Largest historical peak-to-trough decline. Well within acceptable limits for diversified portfolio.',
    },
    {
      name: 'Sharpe Ratio',
      value: '1.24',
      threshold: '> 1.0',
      status: 'good',
      description: 'Risk-adjusted returns are strong, indicating efficient portfolio construction for given risk level.',
    },
    {
      name: 'Sector Concentration',
      value: '40%',
      threshold: '< 45%',
      status: 'good',
      description: 'Largest sector (Tech) represents appropriate share, avoiding excessive concentration.',
    },
    {
      name: 'Interest Rate Sensitivity',
      value: '2.8 years',
      threshold: '3-5 years',
      status: 'warning',
      description: 'Bond duration slightly low. Rate increases would have moderate negative impact on fixed income portion.',
    },
    {
      name: 'Equity/Bond Ratio',
      value: '65/35',
      threshold: 'Target',
      status: 'good',
      description: 'Aligned with strategic allocation. Good balance between growth and stability.',
    },
  ]);

  const [correlationData] = useState<CorrelationPair[]>([
    { asset1: 'Tech', asset2: 'Healthcare', correlation: 0.68 },
    { asset1: 'Tech', asset2: 'Bonds', correlation: -0.24 },
    { asset1: 'Tech', asset2: 'Real Estate', correlation: 0.42 },
    { asset1: 'Healthcare', asset2: 'Bonds', correlation: -0.18 },
    { asset1: 'Healthcare', asset2: 'Real Estate', correlation: 0.35 },
    { asset1: 'Bonds', asset2: 'Real Estate', correlation: 0.28 },
  ]);

  const [riskByGeo] = useState([
    { geography: 'US', exposure: 65, volatility: 15 },
    { geography: 'International', exposure: 24, volatility: 18 },
    { geography: 'Emerging Markets', exposure: 11, volatility: 22 },
  ]);

  const [concentrationRisk] = useState([
    { name: 'Top 1 Holding', value: 4.2 },
    { name: 'Top 5 Holdings', value: 18.5 },
    { name: 'Top 10 Holdings', value: 32.1 },
    { name: 'Top 25 Holdings', value: 55.3 },
    { name: 'Rest of Portfolio', value: 44.7 },
  ]);

  return (
    <div className="space-y-6 contains-layout">
      {/* Risk Metrics Overview */}
      <div className="will-change-auto">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="text-cyan-400" size={24} />
          <h2 className="text-2xl font-bold text-slate-100">Portfolio Risk Assessment</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 will-change-auto max-h-96 overflow-y-auto">
          {riskMetrics.map((metric, index) => (
            <div
              key={index}
              className={`bg-slate-900 border rounded-xl p-5 ${
                metric.status === 'good'
                  ? 'border-emerald-700/30'
                  : metric.status === 'warning'
                    ? 'border-yellow-700/30'
                    : 'border-red-700/30'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-slate-400 text-sm font-medium">{metric.name}</p>
                  <p className="text-2xl font-bold text-slate-100 mt-2">{metric.value}</p>
                </div>
                {metric.status === 'good' ? (
                  <div className="p-2 bg-emerald-900/30 rounded-lg">
                    <Shield className="text-emerald-400" size={20} />
                  </div>
                ) : metric.status === 'warning' ? (
                  <div className="p-2 bg-yellow-900/30 rounded-lg">
                    <AlertTriangle className="text-yellow-400" size={20} />
                  </div>
                ) : (
                  <div className="p-2 bg-red-900/30 rounded-lg">
                    <AlertTriangle className="text-red-400" size={20} />
                  </div>
                )}
              </div>
              <p className="text-slate-400 text-xs mb-2">Target: {metric.threshold}</p>
              <p className="text-slate-400 text-xs leading-relaxed">{metric.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Geographic Risk Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 will-change-auto">
        <h3 className="text-lg font-semibold text-slate-100 mb-6">Geographic Risk Exposure</h3>
        <div className="w-full h-72 will-change-auto">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={riskByGeo}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="geography" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ color: '#cbd5e1' }} />
            <Bar dataKey="exposure" fill="#06b6d4" name="Exposure %" />
            <Bar dataKey="volatility" fill="#f59e0b" name="Volatility %" />
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* Correlation Analysis */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-6">Asset Correlation Matrix</h3>
        <p className="text-slate-400 text-sm mb-4">
          Low correlations between assets provide diversification benefits and reduce overall portfolio risk.
        </p>
        <div className="space-y-3">
          {correlationData.map((pair, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <span className="text-slate-300 font-medium">
                {pair.asset1} ↔ {pair.asset2}
              </span>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      pair.correlation > 0.5
                        ? 'bg-red-400'
                        : pair.correlation > 0
                          ? 'bg-yellow-400'
                          : 'bg-emerald-400'
                    }`}
                    style={{
                      width: `${Math.abs(pair.correlation) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-100 w-12">
                  {pair.correlation.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4">
          Green = Low correlation (good diversification) • Yellow = Moderate • Red = High correlation (concentration risk)
        </p>
      </div>

      {/* Holding Concentration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-96 overflow-y-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-6">Holding Concentration</h3>
          <div className="space-y-3">
            {concentrationRisk.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">{item.name}</span>
                  <span className="text-slate-100 font-semibold">{item.value}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-blue-400 h-2.5 rounded-full"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Well-diversified across holdings. No excessive dependence on individual positions.
          </p>
        </div>

        {/* Risk Recommendations */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <TrendingDown size={20} className="text-cyan-400" />
            Risk Management Recommendations
          </h3>
          <ul className="space-y-3 text-slate-300 text-sm">
            <li className="flex gap-3">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Portfolio volatility well-managed and aligned with risk tolerance</span>
            </li>
            <li className="flex gap-3">
              <span className="text-cyan-400 font-bold">→</span>
              <span>Consider increasing bond duration for improved interest rate hedging</span>
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Diversification across sectors and geographies limiting idiosyncratic risk</span>
            </li>
            <li className="flex gap-3">
              <span className="text-cyan-400 font-bold">→</span>
              <span>Monitor sector concentrations quarterly and rebalance when exposures drift 5%+</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Stress Test Information */}
      <div className="bg-yellow-900/10 border border-yellow-700/30 rounded-xl p-6">
        <div className="flex gap-4">
          <div className="p-3 bg-yellow-900/30 rounded-lg h-fit">
            <AlertTriangle className="text-yellow-400" size={20} />
          </div>
          <div>
            <h4 className="text-slate-100 font-semibold mb-2">Stress Test Results</h4>
            <p className="text-slate-300 text-sm">
              Portfolio stress testing shows resilience under adverse market scenarios. In a 20% equity market decline scenario, your portfolio
              would decline approximately 12-14%, significantly better than market average due to diversification. Bonds and alternatives provide
              effective downside protection while maintaining long-term growth potential.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
