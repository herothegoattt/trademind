"use client";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, AlertCircle, Target, Zap, Shield, BarChart2, Flame, Trophy, Skull } from "lucide-react";
import { motion } from "framer-motion";
import { useTradeStore, TradeUI } from "../../lib/trade-store";

interface PairStat {
  pair: string;
  totalPnl: number;
  winRate: number;
  trades: number;
}

interface TradeAnalysis {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnL: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  bestPairs: PairStat[];
  worstPairs: PairStat[];
  riskLevel: string;
  avgRiskPct: number;
  mistakes: string[];
  currentStreak: { type: "win" | "loss"; count: number } | null;
  bestTrade: { symbol: string; pnl: number } | null;
  worstTrade: { symbol: string; pnl: number } | null;
}

function analyzeTrades(trades: TradeUI[]): TradeAnalysis | null {
  const closed = trades.filter((t) => t.pnl != null);
  if (closed.length === 0) return null;

  const wins = closed.filter((t) => (t.pnl || 0) > 0);
  const losses = closed.filter((t) => (t.pnl || 0) < 0);
  const totalPnL = closed.reduce((s, t) => s + (t.pnl || 0), 0);
  const winRate = (wins.length / closed.length) * 100;
  const avgWin =
    wins.length > 0
      ? wins.reduce((s, t) => s + (t.pnl || 0), 0) / wins.length
      : 0;
  const avgLossRaw =
    losses.length > 0
      ? Math.abs(losses.reduce((s, t) => s + (t.pnl || 0), 0) / losses.length)
      : 0;
  const profitFactor = avgLossRaw > 0 ? avgWin / avgLossRaw : wins.length > 0 ? 99 : 0;

  // Per-pair stats
  const byPair: Record<string, { pnl: number; wins: number; trades: number }> = {};
  closed.forEach((t) => {
    const pair = t.symbol;
    byPair[pair] = byPair[pair] || { pnl: 0, wins: 0, trades: 0 };
    byPair[pair].pnl += t.pnl || 0;
    byPair[pair].wins += (t.pnl || 0) > 0 ? 1 : 0;
    byPair[pair].trades += 1;
  });

  const pairList: PairStat[] = Object.entries(byPair)
    .map(([pair, s]) => ({
      pair,
      totalPnl: Number(s.pnl.toFixed(2)),
      winRate: Math.round((s.wins / s.trades) * 100),
      trades: s.trades,
    }))
    .sort((a, b) => b.totalPnl - a.totalPnl);

  const bestPairs = pairList.slice(0, 3);
  const worstPairs = [...pairList].sort((a, b) => a.totalPnl - b.totalPnl).slice(0, 2);

  // Risk level based on avg pnlPercent magnitude
  const withPct = closed.filter((t) => t.pnlPercent != null);
  const avgRiskPct =
    withPct.length > 0
      ? withPct.reduce((s, t) => s + Math.abs(t.pnlPercent || 0), 0) / withPct.length
      : 0;
  let riskLevel = "Low";
  if (avgRiskPct >= 3) riskLevel = "High";
  else if (avgRiskPct >= 1.5) riskLevel = "Medium";

  // Behavioral analysis
  const mistakes: string[] = [];
  const sorted = [...closed].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Consecutive losses (revenge trading signal)
  let streak = 0;
  let maxLossStreak = 0;
  sorted.forEach((t) => {
    if ((t.pnl || 0) < 0) {
      streak++;
      maxLossStreak = Math.max(maxLossStreak, streak);
    } else {
      streak = 0;
    }
  });
  if (maxLossStreak >= 3) {
    mistakes.push(`Max ${maxLossStreak} consecutive losses — possible revenge trading`);
  }

  // Oversized risk
  const highRiskCount = withPct.filter((t) => Math.abs(t.pnlPercent || 0) > 3).length;
  if (withPct.length > 0 && highRiskCount / withPct.length > 0.2) {
    mistakes.push(
      `${Math.round((highRiskCount / withPct.length) * 100)}% of trades exceeded 3% account risk`
    );
  }

  // Consistent losing pairs (2+ trades, negative PnL)
  const losingPairs = pairList.filter((p) => p.totalPnl < 0 && p.trades >= 2);
  if (losingPairs.length > 0) {
    mistakes.push(`Consistently losing on: ${losingPairs.map((p) => p.pair).join(", ")}`);
  }

  // Low win rate warning
  if (winRate < 40 && closed.length >= 5) {
    mistakes.push("Win rate below 40% — review entry criteria");
  }

  // Low profit factor
  if (profitFactor < 1 && profitFactor > 0 && closed.length >= 5) {
    mistakes.push(`Profit factor ${profitFactor.toFixed(2)} — losses outweigh wins`);
  }

  if (mistakes.length === 0) {
    mistakes.push("No major recurring issues detected — keep journaling!");
  }

  // Current streak
  let currentStreakType: "win" | "loss" =
    (sorted[sorted.length - 1]?.pnl || 0) > 0 ? "win" : "loss";
  let currentStreakCount = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const isWin = (sorted[i].pnl || 0) > 0;
    if (
      (currentStreakType === "win" && isWin) ||
      (currentStreakType === "loss" && !isWin)
    ) {
      currentStreakCount++;
    } else break;
  }

  // Best and worst single trades
  const bestTrade = closed.reduce<TradeUI | null>(
    (best, t) => ((t.pnl || 0) > (best?.pnl || -Infinity) ? t : best),
    null
  );
  const worstTrade = closed.reduce<TradeUI | null>(
    (worst, t) => ((t.pnl || 0) < (worst?.pnl || Infinity) ? t : worst),
    null
  );

  return {
    totalTrades: closed.length,
    wins: wins.length,
    losses: losses.length,
    winRate: Number(winRate.toFixed(1)),
    totalPnL: Number(totalPnL.toFixed(2)),
    avgWin: Number(avgWin.toFixed(2)),
    avgLoss: Number(avgLossRaw.toFixed(2)),
    profitFactor: profitFactor >= 99 ? 99 : Number(profitFactor.toFixed(2)),
    bestPairs,
    worstPairs,
    riskLevel,
    avgRiskPct: Number(avgRiskPct.toFixed(2)),
    mistakes,
    currentStreak: currentStreakCount > 0 ? { type: currentStreakType, count: currentStreakCount } : null,
    bestTrade: bestTrade ? { symbol: bestTrade.symbol, pnl: bestTrade.pnl! } : null,
    worstTrade: worstTrade ? { symbol: worstTrade.symbol, pnl: worstTrade.pnl! } : null,
  };
}

export function TraderDNA() {
  const { trades } = useTradeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const analysis = mounted ? analyzeTrades(trades) : null;

  if (!mounted) return null;

  // Empty state — no journal trades yet
  if (!analysis) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <BarChart2 className="w-14 h-14 text-gray-700 mb-4" />
        <p className="text-gray-400 font-semibold mb-1">No journal data yet</p>
        <p className="text-gray-600 text-xs max-w-[200px]">
          Add closed trades (with exit price) in the Journal to generate your Trader DNA
        </p>
      </motion.div>
    );
  }

  const riskColor =
    analysis.riskLevel === "High"
      ? "text-red-400"
      : analysis.riskLevel === "Medium"
      ? "text-yellow-400"
      : "text-green-400";

  const riskBg =
    analysis.riskLevel === "High"
      ? "bg-red-500/10 border-red-500/30"
      : analysis.riskLevel === "Medium"
      ? "bg-yellow-500/10 border-yellow-500/30"
      : "bg-green-500/10 border-green-500/30";

  const riskIcon =
    analysis.riskLevel === "High" ? (
      <AlertCircle className="w-5 h-5" />
    ) : analysis.riskLevel === "Medium" ? (
      <Zap className="w-5 h-5" />
    ) : (
      <Shield className="w-5 h-5" />
    );

  return (
    <div className="space-y-5">
      {/* Overall P&L + Win Rate */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-4 text-center">
          <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-bold">Total P&L</div>
          <div
            className={`text-2xl font-bold ${
              analysis.totalPnL >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {analysis.totalPnL >= 0 ? "+" : ""}
            {analysis.totalPnL}
          </div>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-4 text-center">
          <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-bold">Win Rate</div>
          <div
            className={`text-2xl font-bold ${
              analysis.winRate >= 50 ? "text-cyan-400" : "text-orange-400"
            }`}
          >
            {analysis.winRate}%
          </div>
        </div>
      </motion.div>

      {/* Key metrics row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-2"
      >
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">Trades</div>
          <div className="text-lg font-bold text-blue-300">{analysis.totalTrades}</div>
          <div className="text-xs text-gray-500">
            {analysis.wins}W / {analysis.losses}L
          </div>
        </div>
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">Profit Factor</div>
          <div
            className={`text-lg font-bold ${
              analysis.profitFactor >= 1.5
                ? "text-green-300"
                : analysis.profitFactor >= 1
                ? "text-yellow-300"
                : "text-red-300"
            }`}
          >
            {analysis.profitFactor >= 99 ? "∞" : analysis.profitFactor}
          </div>
        </div>
        <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">Avg W/L</div>
          <div className="text-xs font-bold text-green-300">+{analysis.avgWin}</div>
          <div className="text-xs font-bold text-red-300">-{analysis.avgLoss}</div>
        </div>
      </motion.div>

      {/* Current streak + best/worst trade */}
      {(analysis.currentStreak || analysis.bestTrade || analysis.worstTrade) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-2"
        >
          {analysis.currentStreak && (
            <div
              className={`rounded-lg border p-3 text-center ${
                analysis.currentStreak.type === "win"
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-red-500/30 bg-red-500/5"
              }`}
            >
              <div className="text-xs text-gray-400 mb-1">Streak</div>
              <div
                className={`text-lg font-bold flex items-center justify-center gap-1 ${
                  analysis.currentStreak.type === "win" ? "text-green-300" : "text-red-300"
                }`}
              >
                <Flame className="w-4 h-4" />
                {analysis.currentStreak.count}
              </div>
              <div className="text-xs text-gray-500 capitalize">{analysis.currentStreak.type}s</div>
            </div>
          )}
          {analysis.bestTrade && (
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-center">
              <div className="text-xs text-gray-400 mb-1 flex items-center justify-center gap-1">
                <Trophy className="w-3 h-3" /> Best
              </div>
              <div className="text-xs font-bold text-cyan-300">{analysis.bestTrade.symbol}</div>
              <div className="text-sm font-bold text-green-300">+{analysis.bestTrade.pnl.toFixed(2)}</div>
            </div>
          )}
          {analysis.worstTrade && (
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 text-center">
              <div className="text-xs text-gray-400 mb-1 flex items-center justify-center gap-1">
                <Skull className="w-3 h-3" /> Worst
              </div>
              <div className="text-xs font-bold text-orange-300">{analysis.worstTrade.symbol}</div>
              <div className="text-sm font-bold text-red-300">{analysis.worstTrade.pnl.toFixed(2)}</div>
            </div>
          )}
        </motion.div>
      )}

      {/* Risk Profile */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={`relative overflow-hidden rounded-lg border ${riskBg} p-5 backdrop-blur-sm`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={riskColor}>{riskIcon}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Risk Profile</span>
          </div>
          <div className={`text-xl font-bold ${riskColor}`}>{analysis.riskLevel}</div>
        </div>
        <div className="text-xs text-gray-400 mb-2">
          Avg exposure: <span className={`${riskColor} font-semibold`}>{analysis.avgRiskPct}%</span> per trade
        </div>
        <div className="relative h-1.5 bg-black/40 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width:
                analysis.riskLevel === "High"
                  ? "80%"
                  : analysis.riskLevel === "Medium"
                  ? "50%"
                  : "25%",
            }}
            transition={{ duration: 1, delay: 0.4 }}
            className={`h-full rounded-full ${
              analysis.riskLevel === "High"
                ? "bg-gradient-to-r from-red-500 to-red-600"
                : analysis.riskLevel === "Medium"
                ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                : "bg-gradient-to-r from-green-500 to-green-600"
            }`}
          />
        </div>
      </motion.div>

      {/* Best Performing Pairs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            Best Performing Pairs
          </h3>
        </div>
        {analysis.bestPairs.length === 0 ? (
          <p className="text-xs text-gray-500">No data yet</p>
        ) : (
          <div className="space-y-2">
            {analysis.bestPairs.map((p, idx) => (
              <motion.div
                key={p.pair}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + idx * 0.07 }}
                className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-cyan-500/10"
              >
                <div>
                  <div className="font-semibold text-sm text-cyan-300">{p.pair}</div>
                  <div className="text-xs text-gray-500">
                    {p.trades} trades · {p.winRate}% WR
                  </div>
                </div>
                <div
                  className={`text-base font-bold ${
                    p.totalPnl >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {p.totalPnl >= 0 ? "+" : ""}
                  {p.totalPnl}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Areas to Improve */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">
            Behavioral Analysis
          </h3>
        </div>
        <div className="space-y-2">
          {analysis.mistakes.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.07 }}
              className="flex gap-2.5 p-2 rounded-lg bg-black/30 border border-purple-500/10"
            >
              <span className="text-purple-400 mt-0.5 flex-shrink-0">•</span>
              <p className="text-xs text-gray-300">{m}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default TraderDNA;
