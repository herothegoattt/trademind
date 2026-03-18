'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface PortfolioMetrics {
  totalValue: number;
  totalInvested: number;
  totalReturn: number;
  returnPercentage: number;
  yearlyReturn: number;
  assets: Array<{
    name: string;
    value: number;
    percentage: number;
    color: string;
  }>;
  performance: Array<{
    month: string;
    value: number;
  }>;
}

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

export default function PortfolioOverview() {
  const [metrics, setMetrics] = useState<PortfolioMetrics>({
    totalValue: 487500,
    totalInvested: 385000,
    totalReturn: 102500,
    returnPercentage: 26.6,
    yearlyReturn: 18.2,
    assets: [
      { name: 'US Equities', value: 195000, percentage: 40, color: COLORS[0] },
      { name: 'International', value: 117000, percentage: 24, color: COLORS[1] },
      { name: 'Bonds', value: 97500, percentage: 20, color: COLORS[2] },
      { name: 'Real Estate', value: 58500, percentage: 12, color: COLORS[3] },
      { name: 'Alternatives', value: 19500, percentage: 4, color: COLORS[4] },
    ],
    performance: [
      { month: 'Jan', value: 420000 },
      { month: 'Feb', value: 432000 },
      { month: 'Mar', value: 445000 },
      { month: 'Apr', value: 438000 },
      { month: 'May', value: 455000 },
      { month: 'Jun', value: 472000 },
      { month: 'Jul', value: 465000 },
      { month: 'Aug', value: 478000 },
      { month: 'Sep', value: 485000 },
      { month: 'Oct', value: 492000 },
      { month: 'Nov', value: 487500 },
    ],
  });

  const [diversificationScore, setDiversificationScore] = useState(82);

  return (
    <div className="space-y-6 contains-layout">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 will-change-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Portfolio Value</p>
              <p className="text-3xl font-bold text-slate-100 mt-2">
                ${(metrics.totalValue / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg">
              <DollarSign size={24} className="text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Return</p>
              <p className="text-3xl font-bold text-cyan-400 mt-2">
                +${(metrics.totalReturn / 1000).toFixed(0)}K
              </p>
              <p className="text-slate-400 text-xs mt-1">{metrics.returnPercentage}% gain</p>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg">
              <TrendingUp size={24} className="text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Yearly Return</p>
              <p className="text-3xl font-bold text-slate-100 mt-2">
                {metrics.yearlyReturn}%
              </p>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg">
              <Percent size={24} className="text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Diversification</p>
              <p className="text-3xl font-bold text-slate-100 mt-2">
                {diversificationScore}%
              </p>
              <p className="text-slate-400 text-xs mt-1">Well diversified</p>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg">
              <TrendingUp size={24} className="text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 will-change-auto">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 will-change-auto">
          <h3 className="text-lg font-semibold text-slate-100 mb-6">Portfolio Performance</h3>
          <div className="w-full h-80 will-change-auto">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.performance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#06b6d4"
                dot={{ fill: '#06b6d4', r: 4 }}
                activeDot={{ r: 6 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Allocation Pie */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 will-change-auto">
          <h3 className="text-lg font-semibold text-slate-100 mb-6">Asset Allocation</h3>
          <div className="w-full h-64 will-change-auto">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={metrics.assets}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {metrics.assets.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Asset Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 will-change-auto">
        <h3 className="text-lg font-semibold text-slate-100 mb-6">Holdings by Asset Class</h3>
        <div className="space-y-3">
          {metrics.assets.map((asset, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: asset.color }}
                />
                <div>
                  <p className="text-slate-100 font-medium">{asset.name}</p>
                  <p className="text-slate-400 text-sm">${(asset.value / 1000).toFixed(0)}K</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-100 font-semibold">{asset.percentage}%</p>
                <p className="text-slate-400 text-sm">of portfolio</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rebalance Recommendation */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 will-change-auto">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-slate-800 rounded-lg">
            <TrendingUp className="text-cyan-400" size={20} />
          </div>
          <div>
            <h4 className="text-slate-100 font-semibold mb-1">Rebalancing Opportunity</h4>
            <p className="text-slate-400 text-sm">
              Your portfolio has drifted 3% from target allocations. Consider rebalancing to maintain your strategic asset mix and manage risk effectively.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
