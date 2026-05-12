"use client";
import Link from "next/link";
import TraderDNA from "../../components/dashboard/TraderDNA";
import { FeatureGate } from "../../components/FeatureGate";
import { ArrowLeft, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTradeStore } from "../../lib/trade-store";

/* ── Sidebar stats ────────────────────────────────────────────────────────────
   Metrics not shown in the main TraderDNA panel:
     - R:R ratio (avgWin / avgLoss)
     - Expected value per trade
     - Long vs Short split (P&L + win-rate per direction)
     - Worst pairs (only negative-PnL symbols with ≥2 trades)
────────────────────────────────────────────────────────────────────────────── */
function useSidebarStats() {
  const { trades } = useTradeStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const closed = trades.filter(t => t.pnl != null);
  if (closed.length === 0) return null;

  const wins   = closed.filter(t => (t.pnl || 0) > 0);
  const losses = closed.filter(t => (t.pnl || 0) < 0);
  const wr     = closed.length > 0 ? wins.length / closed.length : 0;

  const avgWin  = wins.length   > 0 ? wins.reduce((s, t) => s + (t.pnl || 0), 0)  / wins.length   : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + (t.pnl || 0), 0) / losses.length) : 0;

  const rr = avgLoss > 0 ? avgWin / avgLoss : null;
  const ev = avgWin > 0 && avgLoss > 0 ? wr * avgWin - (1 - wr) * avgLoss : null;

  // Long vs Short
  const longs  = closed.filter(t => t.type === "long");
  const shorts = closed.filter(t => t.type === "short");
  const side = (arr: typeof closed) => ({
    count:  arr.length,
    pnl:    Number(arr.reduce((s, t) => s + (t.pnl || 0), 0).toFixed(2)),
    wr:     arr.length > 0 ? Math.round(arr.filter(t => (t.pnl || 0) > 0).length / arr.length * 100) : 0,
  });
  const longSide  = side(longs);
  const shortSide = side(shorts);

  // Worst pairs (negative total PnL, ≥2 trades)
  const byPair: Record<string, { pnl: number; trades: number }> = {};
  closed.forEach(t => {
    byPair[t.symbol] = byPair[t.symbol] || { pnl: 0, trades: 0 };
    byPair[t.symbol].pnl    += t.pnl || 0;
    byPair[t.symbol].trades += 1;
  });
  const worstPairs = Object.entries(byPair)
    .filter(([, v]) => v.pnl < 0 && v.trades >= 2)
    .sort(([, a], [, b]) => a.pnl - b.pnl)
    .slice(0, 3)
    .map(([pair, v]) => ({ pair, pnl: Number(v.pnl.toFixed(2)), trades: v.trades }));

  return { rr, ev, wr, avgWin, avgLoss, longSide, shortSide, worstPairs, totalClosed: closed.length };
}

/* ── Sidebar component ───────────────────────────────────────────────────── */
function DnaSidebar() {
  const s = useSidebarStats();

  if (!s) {
    return (
      <div className="sticky top-24 rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
        <p className="text-[11px] text-gray-600 text-center leading-relaxed">
          Close trades with an exit price in your Journal to see your personal edge metrics here.
        </p>
      </div>
    );
  }

  const fmtPnl = (n: number) =>
    `${n >= 0 ? "+" : ""}$${Math.abs(n) >= 1000 ? (Math.abs(n) / 1000).toFixed(1) + "k" : Math.abs(n).toFixed(0)}`;

  return (
    <div className="sticky top-24 space-y-3">

      {/* ── R:R + EV ── */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Edge</p>
        <div className="space-y-2.5">

          {/* R:R */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-gray-400">Risk : Reward</span>
            {s.rr !== null ? (
              <span className={`text-[13px] font-bold font-mono ${s.rr >= 1.5 ? "text-emerald-400" : s.rr >= 1 ? "text-yellow-400" : "text-red-400"}`}>
                1 : {s.rr.toFixed(2)}
              </span>
            ) : (
              <span className="text-[12px] text-gray-600">—</span>
            )}
          </div>

          {/* EV */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-gray-400">Exp. value / trade</span>
            {s.ev !== null ? (
              <span className={`text-[13px] font-bold font-mono ${s.ev >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {s.ev >= 0 ? "+" : ""}${s.ev.toFixed(2)}
              </span>
            ) : (
              <span className="text-[12px] text-gray-600">—</span>
            )}
          </div>

          {/* Avg bars */}
          {s.avgWin > 0 && s.avgLoss > 0 && (
            <div className="pt-1 space-y-1.5">
              {[
                { label: "Avg win",  val: s.avgWin,  color: "bg-emerald-500", sign: "+" },
                { label: "Avg loss", val: s.avgLoss, color: "bg-red-500",     sign: "-" },
              ].map(row => {
                const max = Math.max(s.avgWin, s.avgLoss);
                const pct = max > 0 ? (row.val / max) * 100 : 0;
                return (
                  <div key={row.label}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[10px] text-gray-600">{row.label}</span>
                      <span className="text-[10px] font-mono text-gray-400">{row.sign}${row.val.toFixed(2)}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.05]">
                      <div className={`h-full rounded-full ${row.color} opacity-70`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Long vs Short ── */}
      {(s.longSide.count > 0 || s.shortSide.count > 0) && (
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Long vs Short</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Long",  data: s.longSide,  accent: "text-emerald-400", bar: "bg-emerald-500" },
              { label: "Short", data: s.shortSide, accent: "text-red-400",     bar: "bg-red-500"     },
            ].map(({ label, data, accent, bar }) => (
              <div key={label} className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-2.5">
                <p className="text-[10px] text-gray-500 mb-1">{label} · {data.count}t</p>
                <p className={`text-[13px] font-bold font-mono ${data.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {fmtPnl(data.pnl)}
                </p>
                {data.count > 0 && (
                  <>
                    <div className="flex justify-between mt-1.5 mb-0.5">
                      <span className="text-[10px] text-gray-600">WR</span>
                      <span className={`text-[10px] font-mono ${data.wr >= 50 ? "text-emerald-400" : "text-orange-400"}`}>{data.wr}%</span>
                    </div>
                    <div className="h-0.5 rounded-full bg-white/[0.05]">
                      <div className={`h-full rounded-full ${bar} opacity-60`} style={{ width: `${data.wr}%` }} />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Worst pairs ── */}
      {s.worstPairs.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-500/70 mb-3">Pairs bleeding you</p>
          <div className="space-y-1.5">
            {s.worstPairs.map(p => (
              <div key={p.pair} className="flex items-center justify-between">
                <div>
                  <span className="text-[12px] font-semibold text-gray-300">{p.pair}</span>
                  <span className="text-[10px] text-gray-600 ml-1.5">{p.trades} trades</span>
                </div>
                <span className="text-[12px] font-bold font-mono text-red-400">
                  ${Math.abs(p.pnl) >= 1000
                    ? "-" + (Math.abs(p.pnl) / 1000).toFixed(1) + "k"
                    : p.pnl.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function TraderDNAPage() {
  return (
    <div className="h-full overflow-y-auto pb-14 md:pb-0 page-bg text-white">
      {/* Header */}
      <div className="sticky top-0 z-20" style={{ background: "rgba(7,10,18,0.94)", borderBottom: "1px solid rgba(192,132,252,0.15)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center justify-between px-3 py-3 sm:p-6 max-w-7xl mx-auto">
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link href="/app" className="p-2 hover:bg-cyan-500/10 rounded transition-colors">
              <ArrowLeft className="w-5 h-5 text-cyan-400" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg blur-md opacity-40" />
                <Brain className="w-7 h-7 text-cyan-400 relative" />
              </div>
              <h1 className="text-xl sm:text-3xl font-bold text-gradient neon-white" style={{ animationDuration: "6s" }}>
                Trader DNA
              </h1>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <motion.div
          className="mb-6 space-y-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-sm text-gray-400">AI-powered analysis of your trading patterns and behavioral profile</p>
          <p className="text-xs text-gray-600">Based on your Trading Journal entries</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <FeatureGate feature="trader_dna_ai">
              <TraderDNA />
            </FeatureGate>
          </motion.div>

          {/* Real-data sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <DnaSidebar />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
