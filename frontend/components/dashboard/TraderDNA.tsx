"use client";
import { Card } from "../ui/card";
import { mockTradeHistory } from "../../lib/mock";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, AlertCircle, Target, Zap, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { tradeAPI, Trade } from "../../lib/trade-api";

function convertTradesToAnalysisFormat(trades: Trade[]) {
  return trades.map((t: any) => {
    const pnl = t.pnl || 0;
    const account = t.account_size;
    // if accountSize provided, calculate percent risk from it
    const riskPct = account
      ? Math.abs(pnl) / account * 100
      : t.pnl_percent ? Math.abs(t.pnl_percent) / 10 : 1;
    return {
      pair: t.symbol || t.pair,
      pnl,
      win: pnl > 0,
      riskPercent: riskPct,
      entryAt: t.created_at ? new Date(t.created_at).getTime() : Date.now(),
      exitAt: t.updated_at ? new Date(t.updated_at).getTime() : Date.now(),
    };
  });
}

function analyzeTrades(trades: any[]) {
  if (!trades || trades.length === 0) return null;

  // Best pairs by total pnl and winrate
  const byPair: Record<string, { pnl: number; wins: number; trades: number }> = {};
  let totalRisk = 0;
  trades.forEach((t) => {
    byPair[t.pair] = byPair[t.pair] || { pnl: 0, wins: 0, trades: 0 };
    byPair[t.pair].pnl += t.pnl;
    byPair[t.pair].wins += t.win ? 1 : 0;
    byPair[t.pair].trades += 1;
    totalRisk += t.riskPercent || 0;
  });

  const pairs = Object.keys(byPair)
    .map((p) => ({ pair: p, ...byPair[p] }))
    .sort((a, b) => b.pnl - a.pnl);

  const bestPairs = pairs.slice(0, 3).map((p) => ({
    pair: p.pair,
    totalPnl: p.pnl,
    winRate: Math.round((p.wins / p.trades) * 100),
  }));

  const avgRisk = totalRisk / trades.length;
  let riskLevel = "Low";
  if (avgRisk >= 3) riskLevel = "High";
  else if (avgRisk >= 1.5) riskLevel = "Medium";

  // Simple mistakes heuristics
  const mistakes: string[] = [];
  const lossAfterLoss = trades.reduce((acc, t, i) => {
    if (i === 0) return acc;
    const prev = trades[i - 1];
    if (prev.pnl < 0 && t.pnl < 0) return acc + 1;
    return acc;
  }, 0);
  if (lossAfterLoss / trades.length > 0.15) mistakes.push("Revenge Decisions: took losing trades after losses");

  const highRiskCount = trades.filter((t) => (t.riskPercent || 0) > 3).length;
  if (highRiskCount / trades.length > 0.2) mistakes.push("Frequent high-risk sizing (>3%)");

  const shortHolds = trades.filter((t) => (t.exitAt - t.entryAt) < 1000 * 60 * 15).length;
  if (shortHolds / trades.length > 0.25) mistakes.push("Many very short trades (possible overtrading)");

  if (mistakes.length === 0) mistakes.push("No major recurring mistakes detected — keep journaling");

  return { bestPairs, avgRisk: Number(avgRisk.toFixed(2)), riskLevel, mistakes };
}

export function TraderDNA() {
  const [trades, setTrades] = useState<any[] | null>(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    const loadTrades = async () => {
      try {
        console.log('Loading trades for DNA...');
        const apiTrades = await tradeAPI.listTrades(0, 200);
        console.log('API trades:', apiTrades);
        if (apiTrades && apiTrades.length > 0) {
          const converted = convertTradesToAnalysisFormat(apiTrades);
          setTrades(converted);
        } else {
          // Fallback to localStorage for development
          const stored = localStorage.getItem('trades');
          if (stored) {
            const parsed = JSON.parse(stored);
            const converted = convertTradesToAnalysisFormat(parsed);
            if (converted && converted.length > 0) {
              setTrades(converted);
            } else {
              setTrades(mockTradeHistory as any[]);
            }
          } else {
            setTrades(mockTradeHistory as any[]);
          }
        }
      } catch (error) {
        console.error('Error loading trades from API:', error);
        // Fallback to localStorage
        try {
          const stored = localStorage.getItem('trades');
          if (stored) {
            const parsed = JSON.parse(stored);
            const converted = convertTradesToAnalysisFormat(parsed);
            setTrades(converted);
          } else {
            setTrades(mockTradeHistory as any[]);
          }
        } catch {
          setTrades(mockTradeHistory as any[]);
        }
      }
    };
    loadTrades();
  }, []);

  const analysis = trades ? analyzeTrades(trades) : null;

  if (!analysis || !mounted) return null;

  const riskLevelColor = 
    analysis.riskLevel === "High" ? "text-red-400" : 
    analysis.riskLevel === "Medium" ? "text-yellow-400" : 
    "text-green-400";

  const riskLevelBg = 
    analysis.riskLevel === "High" ? "bg-red-500/10 border-red-500/30" : 
    analysis.riskLevel === "Medium" ? "bg-yellow-500/10 border-yellow-500/30" : 
    "bg-green-500/10 border-green-500/30";

  const riskIcon = 
    analysis.riskLevel === "High" ? <AlertCircle className="w-5 h-5" /> : 
    analysis.riskLevel === "Medium" ? <Zap className="w-5 h-5" /> : 
    <Shield className="w-5 h-5" />;

  return (
    <div className="space-y-6">
      {/* Main Risk Metric Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-lg border ${riskLevelBg} p-6 backdrop-blur-sm`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className={`${riskLevelColor} transition-colors`}>
                {riskIcon}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Risk Profile</span>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-white">{analysis.riskLevel}</div>
              <div className="text-sm text-gray-400">Avg <span className={`${riskLevelColor} font-semibold`}>{analysis.avgRisk}%</span> per trade</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold opacity-10">{analysis.avgRisk}</div>
          </div>
        </div>
        
        {/* Risk Level Indicator */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <Shield size={14} /> Risk Gauge
          </div>
          <div className="relative h-2 bg-black/40 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ 
                width: analysis.riskLevel === "High" ? "75%" : analysis.riskLevel === "Medium" ? "50%" : "25%"
              }}
              transition={{ duration: 1, delay: 0.3 }}
              className={`h-full rounded-full ${
                analysis.riskLevel === "High" ? "bg-gradient-to-r from-red-500 to-red-600" : 
                analysis.riskLevel === "Medium" ? "bg-gradient-to-r from-yellow-500 to-yellow-600" : 
                "bg-gradient-to-r from-green-500 to-green-600"
              }`}
            />
          </div>
        </div>
      </motion.div>

      {/* Top Pairs Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-6 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300">Best Performing Pairs</h3>
        </div>
        <div className="space-y-3">
          {analysis.bestPairs.map((p: any, idx: number) => (
            <motion.div
              key={p.pair}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-cyan-500/10 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex-1">
                <div className="font-semibold text-cyan-300">{p.pair}</div>
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  Win Rate: <span className="text-cyan-300">{p.winRate}%</span>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${p.totalPnl > 0 ? "text-green-400" : "text-red-400"}`}>
                  {p.totalPnl > 0 ? "+" : ""}{p.totalPnl}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Weaknesses Alert Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-6 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300">Areas to Improve</h3>
        </div>
        <div className="space-y-2">
          {analysis.mistakes.map((m: string, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex gap-3 p-2 rounded-lg bg-black/30 border border-purple-500/10"
            >
              <div className="text-purple-400 mt-0.5 flex-shrink-0">•</div>
              <p className="text-sm text-gray-300">{m}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-3 gap-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-center"
        >
          <div className="text-xs text-gray-400">Total Trades</div>
          <div className="text-xl font-bold text-blue-300">{trades?.length || 0}</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.45 }}
          className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-center"
        >
          <div className="text-xs text-gray-400">Pairs Traded</div>
          <div className="text-xl font-bold text-green-300">{analysis.bestPairs.length}</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-center"
        >
          <div className="text-xs text-gray-400">Win Rate Avg</div>
          <div className="text-xl font-bold text-yellow-300">
            {Math.round(
              analysis.bestPairs.reduce((a, p) => a + p.winRate, 0) / analysis.bestPairs.length
            )}%
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default TraderDNA;
