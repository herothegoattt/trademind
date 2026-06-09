"use client";
export const dynamic = "force-dynamic";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, FlaskConical, Zap, Shield, Crown, Gem,
  TrendingUp, TrendingDown, Target, Activity, BarChart2,
  Clock, Flame, Dice6, RefreshCw, AlertTriangle,
  ChevronDown, ChevronRight, Info, Sigma, Brain,
  Layers, Shuffle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, ReferenceLine, Cell,
} from "recharts";
import { useTradeStore } from "../../lib/trade-store";
import { useAuthStore, type Plan } from "../../lib/auth-store";
import { cn } from "../../lib/utils";
import { usePlanLimits } from "../../lib/plan-limits";
import { UpgradeGate } from "../../components/ui/UpgradeGate";
import OrderFlowLab from "../../components/analytics/OrderFlowLab";

// ─── Tier config ──────────────────────────────────────────────────────────────
type Tier = "core" | "edge" | "apex" | "pro";
const TIER_META: Record<Tier, { label: string; color: string; Icon: any }> = {
  core:  { label: "Core",  color: "#64748b", Icon: Shield },
  edge:  { label: "Edge",  color: "#22d3ee", Icon: Zap },
  apex:  { label: "Apex",  color: "#a78bfa", Icon: Crown },
  pro:   { label: "Pro",   color: "#f59e0b", Icon: Gem },
};

// ─── Math helpers ─────────────────────────────────────────────────────────────
function mean(arr: number[]): number {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}
function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}
function pearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;
  const mx = mean(x), my = mean(y);
  const num = x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0);
  const den = Math.sqrt(
    x.reduce((s, v) => s + (v - mx) ** 2, 0) *
    y.reduce((s, v) => s + (v - my) ** 2, 0)
  );
  return den === 0 ? 0 : num / den;
}

const DAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, color = "#22d3ee", icon: Icon }: {
  label: string; value: string; sub?: string; color?: string; icon?: any;
}) {
  const alphaColor = color + "22";
  const borderColor = color + "33";
  const glowColor = color + "18";
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: `linear-gradient(145deg, ${alphaColor}, rgba(255,255,255,0.015))`,
        border: `1px solid ${borderColor}`,
        boxShadow: `0 4px 24px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      <div className="absolute top-0 left-6 right-6 h-px" style={{
        background: `linear-gradient(90deg, transparent, ${borderColor}, transparent)`,
      }} />
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "rgba(90,104,128,0.85)" }}>{label}</span>
        {Icon && (
          <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: alphaColor }}>
            <Icon className="w-3.5 h-3.5" style={{ color }} />
          </span>
        )}
      </div>
      <div className="text-[22px] font-bold font-mono tabular-nums" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] mt-1.5" style={{ color: "rgba(90,104,128,0.75)" }}>{sub}</div>}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function BlockHeader({ icon: Icon, color, title, sub, badge }: {
  icon: any; color: string; title: string; sub: string; badge?: string;
}) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-white">{title}</h2>
          {badge && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function NoData({ text = "Добавьте сделки в журнал" }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <BarChart2 className="w-8 h-8 text-gray-700" />
      <p className="text-sm text-gray-600">{text}</p>
      <Link href="/journal"
        className="mt-1 text-xs text-cyan-400/70 hover:text-cyan-400 flex items-center gap-1 transition-colors">
        Открыть журнал <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function AnalyticsLabPage() {
  const { trades } = useTradeStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"risk" | "performance" | "market" | "orderflow" | "montecarlo" | "sortino" | "kelly" | "es">("risk");
  const [accountSize, setAccountSize] = useState("10000");
  const [mcRuns, setMcRuns] = useState(0); // increments to trigger re-run
  const [riskThreshold, setRiskThreshold] = useState(50); // % loss for ruin check

  const userPlan = (user?.plan as Plan) || "core";
  const limits = usePlanLimits();
  // Advanced tabs require Edge+ (Monte Carlo family); Order Flow requires Apex (analytics_advanced)
  const LOCKED_TABS = [
    ...(limits.analytics_montecarlo ? [] : ["montecarlo", "sortino", "kelly", "es"]),
    ...(limits.analytics_advanced ? [] : ["orderflow"]),
  ];

  // ── Completed trades only ────────────────────────────────────────────────
  const completed = useMemo(
    () => trades.filter((t) => t.pnl !== undefined),
    [trades]
  );
  const pnls = useMemo(() => completed.map((t) => t.pnl ?? 0), [completed]);
  const wins = useMemo(() => pnls.filter((p) => p > 0), [pnls]);
  const losses = useMemo(() => pnls.filter((p) => p < 0), [pnls]);

  const hasData = completed.length >= 3;

  // ── Base stats ────────────────────────────────────────────────────────────
  const baseStats = useMemo(() => {
    if (!hasData) return null;
    const winRate = wins.length / pnls.length;
    const avgWin  = wins.length  ? mean(wins)            : 0;
    const avgLoss = losses.length ? mean(losses.map(Math.abs)) : 0;
    const totalPnl = pnls.reduce((s, v) => s + v, 0);

    // Max Drawdown
    let cum = 0, peak = 0, maxDD = 0;
    for (const p of pnls) {
      cum  += p;
      peak  = Math.max(peak, cum);
      maxDD = Math.max(maxDD, peak - cum);
    }

    // Equity curve
    let running = 0;
    const equity = completed.map((t) => {
      running += t.pnl ?? 0;
      return { date: new Date(t.createdAt).toLocaleDateString("ru-RU", { day:"2-digit", month:"2-digit" }), pnl: Math.round(running * 100) / 100 };
    });

    return { winRate, avgWin, avgLoss, totalPnl, maxDD, equity };
  }, [hasData, wins, losses, pnls, completed]);

  // ── Kelly Criterion ───────────────────────────────────────────────────────
  const kelly = useMemo(() => {
    if (!baseStats || baseStats.avgLoss === 0) return null;
    const { winRate, avgWin, avgLoss } = baseStats;
    const b = avgWin / avgLoss;          // win/loss ratio
    const q = 1 - winRate;
    const k = (b * winRate - q) / b;    // Kelly %
    const halfK = k / 2;                // conservative Half-Kelly
    const acct = parseFloat(accountSize) || 10000;
    return {
      kelly: Math.max(0, k),
      halfKelly: Math.max(0, halfK),
      optimalSize: Math.max(0, halfK) * acct,
      ratio: b,
    };
  }, [baseStats, accountSize]);

  // ── Sharpe / Sortino / Calmar ─────────────────────────────────────────────
  const ratios = useMemo(() => {
    if (!hasData || !baseStats) return null;
    const m   = mean(pnls);
    const sd  = stdDev(pnls);
    const downPnls = pnls.filter((p) => p < 0);
    const downSd = stdDev(downPnls.length > 1 ? downPnls : pnls);
    const sharpe  = sd > 0 ? m / sd : 0;
    const sortino = downSd > 0 ? m / downSd : 0;
    const calmar  = baseStats.maxDD > 0 ? baseStats.totalPnl / baseStats.maxDD : 0;
    return { sharpe, sortino, calmar };
  }, [hasData, baseStats, pnls]);

  // ── Expected Shortfall (CVaR) ─────────────────────────────────────────────
  const expectedShortfall = useMemo(() => {
    if (!hasData || pnls.length < 5) return null;
    const sorted = [...pnls].sort((a, b) => a - b);
    // VaR & ES at 95% confidence (worst 5% of trades)
    const cut5  = Math.max(1, Math.floor(sorted.length * 0.05));
    const cut10 = Math.max(1, Math.floor(sorted.length * 0.10));
    const var95 = sorted[cut5 - 1];                       // 5th percentile loss
    const var90 = sorted[cut10 - 1];                      // 10th percentile loss
    const es95  = mean(sorted.slice(0, cut5));             // avg of worst 5%
    const es90  = mean(sorted.slice(0, cut10));            // avg of worst 10%
    // Tail ratio: avg profit / avg loss in tails
    const topCut  = Math.max(1, Math.floor(sorted.length * 0.05));
    const topGains = sorted.slice(sorted.length - topCut);
    const tailRatio = es95 !== 0 ? mean(topGains) / Math.abs(es95) : null;
    return { var95, var90, es95, es90, tailRatio };
  }, [hasData, pnls]);

  // ── Expectancy ────────────────────────────────────────────────────────────
  const expectancy = useMemo(() => {
    if (!baseStats) return null;
    const { winRate, avgWin, avgLoss } = baseStats;
    return winRate * avgWin - (1 - winRate) * avgLoss;
  }, [baseStats]);

  // ── R-Multiple distribution ───────────────────────────────────────────────
  const rMultiples = useMemo(() => {
    if (!baseStats || baseStats.avgLoss === 0) return [];
    const oneR = baseStats.avgLoss;
    const buckets: Record<string, number> = {};
    for (const p of pnls) {
      const r = p / oneR;
      const bucket = r >= 3 ? "3R+" : r >= 2 ? "2R" : r >= 1 ? "1R" : r >= 0 ? "0R" : r >= -1 ? "-1R" : r >= -2 ? "-2R" : "<-2R";
      buckets[bucket] = (buckets[bucket] ?? 0) + 1;
    }
    const order = ["<-2R", "-2R", "-1R", "0R", "1R", "2R", "3R+"];
    return order.map((k) => ({ label: k, count: buckets[k] ?? 0, pos: !k.startsWith("-") && k !== "0R" }));
  }, [pnls, baseStats]);

  // ── Win rate by day / hour ────────────────────────────────────────────────
  const winByDay = useMemo(() => {
    const map: Record<number, { w: number; t: number }> = {};
    for (const tr of completed) {
      const d = new Date(tr.createdAt).getDay();
      if (!map[d]) map[d] = { w: 0, t: 0 };
      map[d].t++;
      if ((tr.pnl ?? 0) > 0) map[d].w++;
    }
    return [0, 1, 2, 3, 4, 5, 6].map((d) => ({
      day: DAYS[d],
      rate: map[d] ? Math.round((map[d].w / map[d].t) * 100) : null,
      trades: map[d]?.t ?? 0,
    }));
  }, [completed]);

  const winByHour = useMemo(() => {
    const map: Record<number, { w: number; t: number }> = {};
    for (const tr of completed) {
      const h = new Date(tr.createdAt).getHours();
      if (!map[h]) map[h] = { w: 0, t: 0 };
      map[h].t++;
      if ((tr.pnl ?? 0) > 0) map[h].w++;
    }
    const hours: { hour: string; rate: number | null; trades: number }[] = [];
    for (let h = 0; h < 24; h++) {
      hours.push({
        hour: `${String(h).padStart(2, "0")}:00`,
        rate: map[h] ? Math.round((map[h].w / map[h].t) * 100) : null,
        trades: map[h]?.t ?? 0,
      });
    }
    return hours.filter((h) => h.trades > 0);
  }, [completed]);

  // ── Correlation heatmap ───────────────────────────────────────────────────
  const correlation = useMemo(() => {
    const symbols = [...new Set(completed.map((t) => t.symbol))].slice(0, 6);
    if (symbols.length < 2) return null;
    // Build day-indexed pnl per symbol
    const symDayPnl: Record<string, Record<string, number>> = {};
    for (const tr of completed) {
      const day = tr.createdAt.slice(0, 10);
      if (!symDayPnl[tr.symbol]) symDayPnl[tr.symbol] = {};
      symDayPnl[tr.symbol][day] = (symDayPnl[tr.symbol][day] ?? 0) + (tr.pnl ?? 0);
    }
    const allDays = [...new Set(completed.map((t) => t.createdAt.slice(0, 10)))].sort();
    const matrix: { s1: string; s2: string; r: number }[] = [];
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const s1 = symbols[i], s2 = symbols[j];
        const x = allDays.map((d) => symDayPnl[s1]?.[d] ?? 0);
        const y = allDays.map((d) => symDayPnl[s2]?.[d] ?? 0);
        matrix.push({ s1, s2, r: Math.round(pearson(x, y) * 100) / 100 });
      }
    }
    return { symbols, matrix };
  }, [completed]);

  // ── Monte Carlo ───────────────────────────────────────────────────────────
  const monteCarlo = useMemo(() => {
    if (!hasData || mcRuns === 0) return null;

    const acct     = parseFloat(accountSize) || 10000;
    const ruinFrac = riskThreshold / 100;
    const nSims    = 1000;
    const nTrades  = Math.max(completed.length, 50);

    // ── % доходность каждой сделки ────────────────────────────────────────
    const rawReturns: number[] = completed
      .map((t) => {
        if (t.pnlPercent !== undefined && t.pnlPercent !== 0) return t.pnlPercent / 100;
        if (t.accountSize && t.accountSize > 0) return (t.pnl ?? 0) / t.accountSize;
        return (t.pnl ?? 0) / acct;
      })
      .filter((r) => isFinite(r) && r !== 0);

    if (rawReturns.length < 2) return null;

    // Ограничиваем выбросы: не более -99% и +200% за сделку
    const returns = rawReturns.map((r) => Math.max(-0.99, Math.min(2.0, r)));

    // Вспомогательная функция перцентиля (0-based index, безопасная)
    const pct = (arr: number[], p: number) =>
      arr[Math.min(arr.length - 1, Math.max(0, Math.floor(arr.length * p)))];

    // ── 1000 симуляций ────────────────────────────────────────────────────
    const allFinal:      number[] = []; // итоговый капитал всех путей
    const survivedFinal: number[] = []; // только выжившие (не руинированные)
    const allMaxDDs:     number[] = []; // макс просадка каждого пути (в %)
    let ruinCount = 0;

    for (let i = 0; i < nSims; i++) {
      let equity   = 1.0;   // 1.0 = 100% стартового капитала
      let peak     = 1.0;
      let simMaxDD = 0;
      let ruined   = false;

      for (let j = 0; j < nTrades; j++) {
        const r = returns[Math.floor(Math.random() * returns.length)];
        equity = Math.max(equity * (1 + r), 1e-6); // компаундинг, не уходим в минус
        if (equity > peak) peak = equity;
        const dd = (peak - equity) / peak;
        if (dd > simMaxDD) simMaxDD = dd;
        if (equity <= 1 - ruinFrac) {
          ruined = true;
          ruinCount++;
          break;
        }
      }

      const finalUSD = Math.round(equity * acct * 100) / 100;
      allFinal.push(finalUSD);
      allMaxDDs.push(simMaxDD * 100); // в %
      if (!ruined) survivedFinal.push(finalUSD);
    }

    allFinal.sort((a, b) => a - b);
    survivedFinal.sort((a, b) => a - b);

    // ── Перцентили по ВЫЖИВШИМ путям (корректная картина доходности) ─────
    const hassurvived = survivedFinal.length > 0;
    const sp5  = hassurvived ? pct(survivedFinal, 0.05) : null;
    const sp25 = hassurvived ? pct(survivedFinal, 0.25) : null;
    const sp50 = hassurvived ? pct(survivedFinal, 0.50) : null;
    const sp75 = hassurvived ? pct(survivedFinal, 0.75) : null;
    const sp95 = hassurvived ? pct(survivedFinal, 0.95) : null;

    // ── Перцентили по ВСЕМ путям (полное распределение) ──────────────────
    const ap5  = pct(allFinal, 0.05);
    const ap50 = pct(allFinal, 0.50);
    const ap95 = pct(allFinal, 0.95);

    const ruinPct        = Math.round((ruinCount / nSims) * 100);
    const survivedPct    = 100 - ruinPct;
    const avgMaxDD       = Math.round(mean(allMaxDDs) * 10) / 10;

    // Доходность медианы выживших в %
    const medReturnPct = sp50 != null
      ? Math.round(((sp50 / acct) - 1) * 1000) / 10
      : null;
    // Доходность лучшего сценария (P95 выживших) в %
    const bestReturnPct = sp95 != null
      ? Math.round(((sp95 / acct) - 1) * 1000) / 10
      : null;
    // Доходность худшего без руина (P5 выживших) в %
    const worstSurvivedReturnPct = sp5 != null
      ? Math.round(((sp5 / acct) - 1) * 1000) / 10
      : null;

    // ── Гистограмма по ВСЕМ исходам ───────────────────────────────────────
    const minOut = allFinal[0];
    const maxOut = allFinal[nSims - 1];
    const step   = (maxOut - minOut) / 20 || acct * 0.02;
    const histo = Array.from({ length: 20 }, (_, b) => {
      const lo = minOut + b * step;
      const hi = b < 19 ? lo + step : maxOut + 1;
      const label = Math.abs(lo) >= 1000
        ? `$${(lo / 1000).toFixed(0)}k`
        : `$${lo.toFixed(0)}`;
      return {
        x: label,
        count: allFinal.filter((v) => v >= lo && v < hi).length,
        pos: lo >= acct,
      };
    });

    return {
      // Выжившие (основные метрики доходности)
      sp5, sp25, sp50, sp75, sp95,
      medReturnPct, bestReturnPct, worstSurvivedReturnPct,
      survivedPct, survivedCount: survivedFinal.length,
      // Полное распределение
      ap5, ap50, ap95,
      // Риск
      ruinPct, avgMaxDD,
      // Метаданные
      histo, nSims, nTrades,
    };
  }, [mcRuns, hasData, completed, accountSize, riskThreshold]);

  // ── Tabs config ───────────────────────────────────────────────────────────
  const TABS = [
    { id: "risk"        as const, label: "Risk Engine",         icon: Flame,        color: "#f87171" },
    { id: "performance" as const, label: "Performance",         icon: Sigma,        color: "#22d3ee" },
    { id: "market"      as const, label: "Market Structure",    icon: Layers,       color: "#a78bfa" },
    { id: "orderflow"   as const, label: "Order Flow",          icon: BarChart2,    color: "#a78bfa" },
    { id: "montecarlo"  as const, label: "Monte Carlo",         icon: Dice6,        color: "#f59e0b" },
    { id: "sortino"     as const, label: "Sortino Ratio",       icon: TrendingDown, color: "#818cf8" },
    { id: "kelly"       as const, label: "Kelly Criterion",     icon: Target,       color: "#34d399" },
    { id: "es"          as const, label: "Expected Shortfall",  icon: Shield,       color: "#fb923c" },
  ];

  const planMeta = TIER_META[(userPlan as Tier)] ?? TIER_META.core;

  return (
    <div className="h-full overflow-hidden flex flex-col text-white min-w-0 page-bg">
      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 z-30 backdrop-blur-xl"
        style={{ background: "rgba(7,10,18,0.94)", borderBottom: "1px solid rgba(251,146,60,0.14)" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-3 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/app"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-all">
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-amber-400" />
              <h1 className="text-sm font-bold neon-amber">Analytics Lab</h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                ИНСТИТУЦИОНАЛЬНЫЕ ИНСТРУМЕНТЫ
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500">{completed.length} сделок в базе</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ background: `${planMeta.color}12`, border: `1px solid ${planMeta.color}30`, color: planMeta.color }}>
              <planMeta.Icon className="w-3 h-3" />
              {planMeta.label}
            </span>
          </div>
        </div>

        {/* Tab nav */}
        <div className="max-w-6xl mx-auto px-2 sm:px-6 pb-0 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            const locked = LOCKED_TABS.includes(tab.id);
            return (
              <button key={tab.id} onClick={() => {
                if (locked) {
                  // Switch to tab so UpgradeGate shows
                  setActiveTab(tab.id as any);
                } else {
                  setActiveTab(tab.id);
                }
              }}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all",
                  active
                    ? "border-current text-white"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                )}
                style={active ? { color: locked ? "#f59e0b" : tab.color, borderColor: locked ? "#f59e0b" : tab.color } : {}}>
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {locked && <span className="text-[9px] ml-0.5 text-amber-500">🔒</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-14 md:pb-0">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">

        {/* ══════════════════════════════════════════════════════════════════════
            BLOCK 1 — RISK ENGINE
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "risk" && (
          <div className="space-y-8">
            <BlockHeader
              icon={Flame} color="#f87171"
              title="Risk Engine"
              sub="Оптимальный размер позиции, Kelly Criterion, корреляция портфеля и максимальная просадка"
            />

            {/* Account size input */}
            <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl">
              <span className="text-xs text-gray-400 flex-shrink-0">Размер депозита ($)</span>
              <input
                type="number"
                value={accountSize}
                onChange={(e) => setAccountSize(e.target.value)}
                className="flex-1 max-w-[180px] px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-red-500/40 transition-colors"
              />
              <span className="text-xs text-gray-600">Используется для расчёта позиции</span>
            </div>

            {!hasData ? <NoData /> : (
              <>
                {/* Kelly cards */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Kelly Criterion</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard
                      icon={Target} label="Kelly %"
                      value={kelly ? `${(kelly.kelly * 100).toFixed(1)}%` : "—"}
                      color="#f87171"
                      sub="Агрессивный Kelly"
                    />
                    <MetricCard
                      icon={Target} label="Half-Kelly %"
                      value={kelly ? `${(kelly.halfKelly * 100).toFixed(1)}%` : "—"}
                      color="#34d399"
                      sub="Рекомендуемый"
                    />
                    <MetricCard
                      icon={TrendingUp} label="Оптим. позиция"
                      value={kelly ? `$${kelly.optimalSize.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}` : "—"}
                      color="#22d3ee"
                      sub={`От $${accountSize} депозита`}
                    />
                    <MetricCard
                      icon={Sigma} label="Win/Loss Ratio"
                      value={kelly ? `${kelly.ratio.toFixed(2)}` : "—"}
                      color="#a78bfa"
                      sub="Avg Win ÷ Avg Loss"
                    />
                  </div>

                  {/* Kelly explanation */}
                  {kelly && (
                    <div className="mt-3 p-4 bg-red-500/[0.04] border border-red-500/10 rounded-xl">
                      <div className="flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-gray-400 leading-relaxed">
                          {kelly.halfKelly <= 0
                            ? "Ваша стратегия имеет отрицательное математическое ожидание. Kelly рекомендует не рисковать."
                            : kelly.halfKelly < 0.05
                            ? `Half-Kelly (${(kelly.halfKelly * 100).toFixed(1)}%) — рискуйте малой долей. Стратегия работает, но edge слабый.`
                            : kelly.halfKelly < 0.15
                            ? `Half-Kelly (${(kelly.halfKelly * 100).toFixed(1)}%) — оптимальный размер $${kelly.optimalSize.toFixed(0)} при вашем депозите.`
                            : `Kelly даёт ${(kelly.kelly * 100).toFixed(1)}%, Half-Kelly — ${(kelly.halfKelly * 100).toFixed(1)}%. Сильный edge! Рекомендуем Half-Kelly для управления дисперсией.`
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Max Drawdown + Equity curve */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Max Drawdown Tracker</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    <MetricCard
                      icon={TrendingDown} label="Max Drawdown"
                      value={baseStats ? `$${baseStats.maxDD.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}` : "—"}
                      color="#f87171"
                      sub="Максимальная просадка"
                    />
                    <MetricCard
                      icon={TrendingUp} label="Total PnL"
                      value={baseStats ? `${baseStats.totalPnl >= 0 ? "+" : ""}$${Math.abs(baseStats.totalPnl).toLocaleString("ru-RU", { maximumFractionDigits: 0 })}` : "—"}
                      color={baseStats && baseStats.totalPnl >= 0 ? "#34d399" : "#f87171"}
                      sub="Итоговый результат"
                    />
                    <MetricCard
                      icon={Activity} label="Recovery Factor"
                      value={baseStats && baseStats.maxDD > 0 ? `${(baseStats.totalPnl / baseStats.maxDD).toFixed(2)}` : "—"}
                      color="#f59e0b"
                      sub="Total PnL ÷ Max DD"
                    />
                  </div>

                  {baseStats && baseStats.equity.length > 1 && (
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
                      <div className="text-xs text-gray-500 mb-4">Кривая капитала (накопленный PnL)</div>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={baseStats.equity}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} />
                          <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                          <Tooltip
                            contentStyle={{ background: "rgba(7,9,18,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
                            formatter={(v: any) => [`$${Number(v).toFixed(2)}`, "PnL"]}
                          />
                          <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                          <Line dataKey="pnl" stroke="#22d3ee" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Correlation heatmap */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Portfolio Heat Map — Корреляция инструментов</h3>
                  {!correlation ? (
                    <div className="p-6 bg-white/[0.015] border border-white/[0.04] rounded-2xl text-center">
                      <p className="text-xs text-gray-600">Нужно минимум 2 разных инструмента в журнале</p>
                    </div>
                  ) : (
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 overflow-x-auto">
                      <div className="text-[10px] text-gray-600 mb-3">1.0 = полная корреляция · 0 = нет связи · -1.0 = обратная корреляция</div>
                      <div className="inline-grid gap-1"
                        style={{ gridTemplateColumns: `auto repeat(${correlation.symbols.length - 1}, 1fr)` }}>
                        {correlation.matrix.map(({ s1, s2, r }) => {
                          const intensity = Math.abs(r);
                          const bg = r > 0
                            ? `rgba(34,211,238,${intensity * 0.6})`
                            : `rgba(248,113,113,${intensity * 0.6})`;
                          return (
                            <div key={`${s1}-${s2}`}
                              className="rounded-lg p-3 text-center min-w-[80px]"
                              style={{ background: bg, border: "1px solid rgba(255,255,255,0.05)" }}>
                              <div className="text-[9px] text-gray-400">{s1} / {s2}</div>
                              <div className="text-sm font-bold text-white mt-1">
                                {r > 0 ? "+" : ""}{r.toFixed(2)}
                              </div>
                              <div className="text-[9px] text-gray-500 mt-0.5">
                                {Math.abs(r) > 0.7 ? "Высокая" : Math.abs(r) > 0.4 ? "Средняя" : "Низкая"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            BLOCK 2 — PERFORMANCE SCIENCE
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "performance" && (
          <div className="space-y-8">
            <BlockHeader
              icon={Sigma} color="#22d3ee"
              title="Performance Science"
              sub="Sharpe, Sortino, Calmar — метрики которые используют профессиональные управляющие фондами"
            />

            {!hasData ? <NoData /> : (
              <>
                {/* Ratio cards */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Качество стратегии</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        label: "Sharpe Ratio",
                        value: ratios ? ratios.sharpe.toFixed(3) : "—",
                        color: ratios && ratios.sharpe > 1 ? "#34d399" : ratios && ratios.sharpe > 0 ? "#f59e0b" : "#f87171",
                        desc: "Доходность на единицу риска. >1 — хорошо, >2 — отлично, >3 — исключительно.",
                        rating: ratios
                          ? ratios.sharpe > 2 ? "Отлично" : ratios.sharpe > 1 ? "Хорошо" : ratios.sharpe > 0 ? "Приемлемо" : "Плохо"
                          : "—",
                      },
                      {
                        label: "Sortino Ratio",
                        value: ratios ? ratios.sortino.toFixed(3) : "—",
                        color: ratios && ratios.sortino > 1 ? "#34d399" : ratios && ratios.sortino > 0 ? "#f59e0b" : "#f87171",
                        desc: "Как Sharpe, но штрафует только за убыточную волатильность. Более справедливая метрика.",
                        rating: ratios
                          ? ratios.sortino > 2 ? "Отлично" : ratios.sortino > 1 ? "Хорошо" : ratios.sortino > 0 ? "Приемлемо" : "Плохо"
                          : "—",
                      },
                      {
                        label: "Calmar Ratio",
                        value: ratios ? ratios.calmar.toFixed(3) : "—",
                        color: ratios && ratios.calmar > 1 ? "#34d399" : ratios && ratios.calmar > 0 ? "#f59e0b" : "#f87171",
                        desc: "Total PnL ÷ Max Drawdown. Показывает насколько эффективно вы зарабатываете относительно просадки.",
                        rating: ratios
                          ? ratios.calmar > 3 ? "Отлично" : ratios.calmar > 1 ? "Хорошо" : ratios.calmar > 0 ? "Приемлемо" : "Плохо"
                          : "—",
                      },
                    ].map((m) => (
                      <div key={m.label}
                        className="bg-white/[0.025] border border-white/[0.05] rounded-2xl p-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">{m.label}</div>
                            <div className="text-3xl font-bold mt-1" style={{ color: m.color }}>{m.value}</div>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1"
                            style={{ background: `${m.color}15`, color: m.color, border: `1px solid ${m.color}25` }}>
                            {m.rating}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed">{m.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expectancy */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Expectancy по стратегии</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard
                      icon={Target} label="Expectancy"
                      value={expectancy !== null ? `${expectancy >= 0 ? "+" : ""}$${expectancy.toFixed(2)}` : "—"}
                      color={expectancy !== null && expectancy >= 0 ? "#34d399" : "#f87171"}
                      sub="Ожидаемый PnL за сделку"
                    />
                    <MetricCard
                      icon={TrendingUp} label="Avg Win"
                      value={baseStats ? `+$${baseStats.avgWin.toFixed(2)}` : "—"}
                      color="#34d399"
                      sub={`${wins.length} выигрышей`}
                    />
                    <MetricCard
                      icon={TrendingDown} label="Avg Loss"
                      value={baseStats ? `-$${baseStats.avgLoss.toFixed(2)}` : "—"}
                      color="#f87171"
                      sub={`${losses.length} убытков`}
                    />
                    <MetricCard
                      icon={Flame} label="Win Rate"
                      value={baseStats ? `${(baseStats.winRate * 100).toFixed(1)}%` : "—"}
                      color={baseStats && baseStats.winRate >= 0.5 ? "#22d3ee" : "#f59e0b"}
                      sub={`${completed.length} сделок`}
                    />
                  </div>
                </div>

                {/* R-Multiple distribution */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">R-Multiple Distribution</h3>
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
                    <div className="text-[10px] text-gray-600 mb-4">1R = средний убыток (${baseStats?.avgLoss.toFixed(0) ?? "?"}). Распределение сделок по кратности R.</div>
                    {rMultiples.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={rMultiples}>
                          <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} />
                          <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ background: "rgba(7,9,18,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
                            formatter={(v: any) => [v, "сделок"]}
                          />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {rMultiples.map((entry, i) => (
                              <Cell key={i} fill={entry.pos ? "rgba(34,211,238,0.6)" : "rgba(248,113,113,0.6)"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-gray-600 text-center py-8">Недостаточно данных</p>
                    )}
                  </div>
                </div>

                {/* Win rate by day + hour */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* By day */}
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Win Rate по дням недели</h3>
                    <div className="space-y-2">
                      {winByDay.map((d) => (
                        <div key={d.day} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-7">{d.day}</span>
                          <div className="flex-1 h-5 bg-white/[0.03] rounded-md overflow-hidden">
                            {d.rate !== null && (
                              <div
                                className="h-full rounded-md transition-all"
                                style={{
                                  width: `${d.rate}%`,
                                  background: d.rate >= 60
                                    ? "linear-gradient(90deg,rgba(52,211,153,0.3),rgba(52,211,153,0.5))"
                                    : d.rate >= 40
                                    ? "linear-gradient(90deg,rgba(245,158,11,0.3),rgba(245,158,11,0.5))"
                                    : "linear-gradient(90deg,rgba(248,113,113,0.3),rgba(248,113,113,0.5))",
                                }}
                              />
                            )}
                          </div>
                          <span className={cn("text-xs font-semibold w-10 text-right",
                            d.rate === null ? "text-gray-700"
                            : d.rate >= 60 ? "text-emerald-400"
                            : d.rate >= 40 ? "text-amber-400"
                            : "text-red-400")}>
                            {d.rate !== null ? `${d.rate}%` : "—"}
                          </span>
                          <span className="text-[10px] text-gray-700 w-8">{d.trades > 0 ? `${d.trades}т` : ""}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* By hour */}
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Win Rate по времени суток</h3>
                    {winByHour.length === 0 ? (
                      <p className="text-xs text-gray-600 py-8 text-center">Нет данных</p>
                    ) : (
                      <div className="space-y-1.5">
                        {winByHour.map((h) => (
                          <div key={h.hour} className="flex items-center gap-3">
                            <span className="text-[10px] text-gray-500 w-12">{h.hour}</span>
                            <div className="flex-1 h-4 bg-white/[0.03] rounded overflow-hidden">
                              {h.rate !== null && (
                                <div className="h-full rounded transition-all"
                                  style={{
                                    width: `${h.rate}%`,
                                    background: h.rate >= 60
                                      ? "rgba(52,211,153,0.4)"
                                      : h.rate >= 40
                                      ? "rgba(245,158,11,0.4)"
                                      : "rgba(248,113,113,0.4)",
                                  }} />
                              )}
                            </div>
                            <span className={cn("text-[10px] font-semibold w-9 text-right",
                              h.rate === null ? "text-gray-700"
                              : h.rate >= 60 ? "text-emerald-400"
                              : h.rate >= 40 ? "text-amber-400"
                              : "text-red-400")}>
                              {h.rate !== null ? `${h.rate}%` : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            BLOCK 3 — MARKET STRUCTURE
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "market" && (
          <div className="space-y-8">
            <BlockHeader
              icon={Layers} color="#a78bfa"
              title="Market Structure"
              sub="Институциональные инструменты анализа рынка — VWAP, ликвидность, Smart Money"
              badge="Live Data"
            />

            {/* Live data CTA */}
            <div className="flex items-center gap-4 p-4 rounded-xl"
              style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
              <Activity className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Требуется подключение к рыночным данным</div>
                <div className="text-xs text-gray-500 mt-0.5">Блок Market Structure использует live данные через TradingView или биржевой API</div>
              </div>
              <Link href="/profile"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/15 transition-all flex-shrink-0">
                Подключить <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Tools grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  title: "VWAP Deviation Analysis",
                  desc: "Volume Weighted Average Price — анализирует отклонение цены от VWAP. Институциональные трейдеры используют VWAP как базовую линию. Отклонение >2σ — потенциальный разворот.",
                  metrics: ["VWAP Level", "Отклонение σ", "Институц. зоны"],
                  color: "#a78bfa",
                  status: "live",
                },
                {
                  title: "Standard Deviation Bands",
                  desc: "Статистические полосы вокруг VWAP (+1σ, +2σ, -1σ, -2σ). Цена вне 2σ — статистически аномальная зона, часто означает перекупленность/перепроданность.",
                  metrics: ["±1σ зоны", "±2σ зоны", "Вероятность возврата"],
                  color: "#22d3ee",
                  status: "live",
                },
                {
                  title: "Liquidity Levels Detector",
                  desc: "Автоматически находит уровни с высокой концентрацией ордеров. Stop-hunt зоны, ликвидационные кластеры, уровни где маркет-мейкеры собирают ликвидность.",
                  metrics: ["Buy/Sell стопы", "Order Clusters", "Ликвидации"],
                  color: "#f59e0b",
                  status: "live",
                },
                {
                  title: "Smart Money vs Retail Flow",
                  desc: "COT Report данные + анализ options flow показывает куда смотрят институционалы. Когда розничные трейдеры шортят — умные деньги покупают. Divergence = сигнал.",
                  metrics: ["COT Positioning", "Options Flow", "Retail Sentiment"],
                  color: "#34d399",
                  status: "live",
                },
              ].map((tool) => (
                <div key={tool.title}
                  className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">{tool.title}</h3>
                      <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">{tool.desc}</p>
                    </div>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex-shrink-0 ml-3">
                      LIVE
                    </span>
                  </div>

                  {/* Mock chart placeholder */}
                  <div className="h-24 rounded-xl flex items-center justify-center"
                    style={{ background: `${tool.color}06`, border: `1px dashed ${tool.color}20` }}>
                    <div className="text-center">
                      <Activity className="w-6 h-6 mx-auto mb-1.5" style={{ color: `${tool.color}40` }} />
                      <div className="text-[10px]" style={{ color: `${tool.color}50` }}>Требует live данные</div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {tool.metrics.map((m) => (
                      <span key={m} className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.03] text-gray-500 border border-white/[0.04]">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Statistics computed from trades */}
            {hasData && (
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Доступно из вашего журнала</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricCard
                    icon={Sigma} label="Std Dev PnL"
                    value={`$${stdDev(pnls).toFixed(2)}`}
                    color="#a78bfa"
                    sub="Волатильность сделок"
                  />
                  <MetricCard
                    icon={TrendingUp} label="+2σ Уровень"
                    value={`$${(mean(pnls) + 2 * stdDev(pnls)).toFixed(2)}`}
                    color="#34d399"
                    sub="Аномально высокий PnL"
                  />
                  <MetricCard
                    icon={TrendingDown} label="-2σ Уровень"
                    value={`$${(mean(pnls) - 2 * stdDev(pnls)).toFixed(2)}`}
                    color="#f87171"
                    sub="Аномально большой убыток"
                  />
                  <MetricCard
                    icon={Target} label="Mean PnL"
                    value={`${mean(pnls) >= 0 ? "+" : ""}$${mean(pnls).toFixed(2)}`}
                    color={mean(pnls) >= 0 ? "#22d3ee" : "#f87171"}
                    sub="Среднее за сделку"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            BLOCK 3.5 — ORDER FLOW (real market data, Apex)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "orderflow" && !limits.analytics_advanced && (
          <div className="py-8">
            <UpgradeGate requiredPlan="apex" feature="Order Flow Lab" blurContent={false} />
          </div>
        )}
        {activeTab === "orderflow" && limits.analytics_advanced && (
          <OrderFlowLab />
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            BLOCK 4 — MONTE CARLO
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "montecarlo" && !limits.analytics_montecarlo && (
          <div className="py-8">
            <UpgradeGate requiredPlan="edge" feature="Monte Carlo Simulator" blurContent={false} />
          </div>
        )}
        {activeTab === "montecarlo" && limits.analytics_montecarlo && (
          <div className="space-y-8">
            <BlockHeader
              icon={Dice6} color="#f59e0b"
              title="Monte Carlo Simulator"
              sub="1000 сценариев на основе вашей реальной истории сделок — вероятность руинирования депозита"
              badge="Pro"
            />

            {!hasData ? (
              <NoData text="Нужно минимум 3 сделки с PnL для симуляции" />
            ) : (
              <>
                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-medium">Начальный депозит ($)</label>
                    <input
                      type="number"
                      value={accountSize}
                      onChange={(e) => setAccountSize(e.target.value)}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/40 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-medium">Порог руинирования (%)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range" min={10} max={90} step={5}
                        value={riskThreshold}
                        onChange={(e) => setRiskThreshold(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm font-bold text-amber-400 w-10">{riskThreshold}%</span>
                    </div>
                    <div className="text-[10px] text-gray-600">Потеря {riskThreshold}% депозита = руинирование</div>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => setMcRuns((r) => r + 1)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:brightness-110"
                      style={{
                        background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.1))",
                        border: "1px solid rgba(245,158,11,0.35)",
                        color: "#f59e0b",
                      }}>
                      <Shuffle className="w-4 h-4" />
                      {mcRuns === 0 ? "Запустить симуляцию" : "Пересчитать"}
                    </button>
                  </div>
                </div>

                {/* Info bar */}
                <div className="flex items-center gap-2 p-3 bg-amber-500/[0.04] border border-amber-500/10 rounded-xl">
                  <Brain className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div className="text-xs text-gray-400">
                    Симулятор переводит {completed.length} сделок журнала в <span className="text-amber-400/80">% доходности</span>,
                    случайно перемешивает их 1000 раз с компаундингом
                    и строит распределение возможных исходов для {Math.max(completed.length, 50)} следующих сделок.
                  </div>
                </div>

                {mcRuns === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Dice6 className="w-12 h-12 text-gray-700" />
                    <p className="text-sm text-gray-500">Нажмите "Запустить симуляцию" чтобы увидеть 1000 сценариев</p>
                  </div>
                ) : monteCarlo ? (
                  <>
                    {/* Key results */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className={cn("rounded-2xl p-5 border", monteCarlo.ruinPct > 25 ? "bg-red-500/[0.06] border-red-500/20" : monteCarlo.ruinPct > 10 ? "bg-amber-500/[0.06] border-amber-500/20" : "bg-emerald-500/[0.06] border-emerald-500/20")}>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-3.5 h-3.5" style={{ color: monteCarlo.ruinPct > 25 ? "#f87171" : monteCarlo.ruinPct > 10 ? "#f59e0b" : "#34d399" }} />
                          <span className="text-xs text-gray-500 uppercase tracking-wider">Риск руинирования</span>
                        </div>
                        <div className="text-3xl font-bold" style={{ color: monteCarlo.ruinPct > 25 ? "#f87171" : monteCarlo.ruinPct > 10 ? "#f59e0b" : "#34d399" }}>
                          {monteCarlo.ruinPct}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">потери {riskThreshold}% за {monteCarlo.nTrades} сделок</div>
                      </div>
                      <MetricCard
                        icon={TrendingDown} label="Avg Max Drawdown"
                        value={`${monteCarlo.avgMaxDD}%`}
                        color="#f87171"
                        sub="Средняя макс. просадка"
                      />
                      <MetricCard
                        icon={Target} label="Медианный исход"
                        value={monteCarlo.sp50 != null ? `$${monteCarlo.sp50.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}` : "—"}
                        color={monteCarlo.sp50 != null && monteCarlo.sp50 >= parseFloat(accountSize) ? "#34d399" : "#f87171"}
                        sub={monteCarlo.medReturnPct != null ? `${monteCarlo.medReturnPct >= 0 ? "+" : ""}${monteCarlo.medReturnPct}% выживших` : `${monteCarlo.survivedPct}% путей выжили`}
                      />
                      <MetricCard
                        icon={TrendingUp} label="Лучший сценарий"
                        value={monteCarlo.sp95 != null ? `$${monteCarlo.sp95.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}` : "—"}
                        color="#22d3ee"
                        sub={monteCarlo.bestReturnPct != null ? `+${monteCarlo.bestReturnPct}% топ 5%` : "Топ 5% сценариев"}
                      />
                    </div>

                    {/* Percentile breakdown */}
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                        Распределение исходов по {monteCarlo.nSims} симуляциям
                      </h3>
                      <div className="text-[10px] text-gray-500 mb-3">
                        Выжили: <span className="text-emerald-400 font-semibold">{monteCarlo.survivedPct}%</span> сценариев ({monteCarlo.survivedCount} из {monteCarlo.nSims}) · Руинированы: <span className="text-red-400 font-semibold">{monteCarlo.ruinPct}%</span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 mb-5">
                        {[
                          { label: "P5 (худший)", value: monteCarlo.sp5, color: "#f87171" },
                          { label: "P25",         value: monteCarlo.sp25, color: "#f59e0b" },
                          { label: "P50 (медиана)", value: monteCarlo.sp50, color: "#22d3ee" },
                          { label: "P75",         value: monteCarlo.sp75, color: "#34d399" },
                          { label: "P95 (лучший)", value: monteCarlo.sp95, color: "#a78bfa" },
                        ].map((p) => (
                          <div key={p.label} className="text-center">
                            <div className="text-[10px] text-gray-500 mb-1">{p.label}</div>
                            <div className="text-base font-bold" style={{ color: p.color }}>
                              {p.value != null ? `$${p.value.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}` : "—"}
                            </div>
                          </div>
                        ))}
                      </div>

                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={monteCarlo.histo} barCategoryGap="5%">
                          <XAxis dataKey="x" tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} interval={2} />
                          <YAxis tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ background: "rgba(7,9,18,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
                            formatter={(v: any) => [v, "сценариев"]}
                          />
                          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                            {monteCarlo.histo.map((entry, i) => (
                              <Cell key={i} fill={entry.pos ? "rgba(34,211,238,0.55)" : "rgba(248,113,113,0.45)"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>

                      <div className="mt-4 p-4 rounded-xl"
                        style={{
                          background: monteCarlo.ruinPct > 25 ? "rgba(248,113,113,0.05)" : monteCarlo.ruinPct > 10 ? "rgba(245,158,11,0.05)" : "rgba(52,211,153,0.05)",
                          border: `1px solid ${monteCarlo.ruinPct > 25 ? "rgba(248,113,113,0.15)" : monteCarlo.ruinPct > 10 ? "rgba(245,158,11,0.15)" : "rgba(52,211,153,0.15)"}`,
                        }}>
                        <div className="text-xs text-gray-300 leading-relaxed">
                          {(() => {
                            const medStr = monteCarlo.medReturnPct != null
                              ? `Медианный исход выживших: ${monteCarlo.medReturnPct >= 0 ? "+" : ""}${monteCarlo.medReturnPct}%.`
                              : `Все пути руинированы.`;
                            if (monteCarlo.ruinPct > 25)
                              return `⚠️ Вероятность потери ${riskThreshold}% депозита за ${monteCarlo.nTrades} сделок = ${monteCarlo.ruinPct}%. ${medStr} Рекомендуем снизить размер позиции или пересмотреть стратегию риск-менеджмента.`;
                            if (monteCarlo.ruinPct > 10)
                              return `Вероятность потери ${riskThreshold}% депозита = ${monteCarlo.ruinPct}% за ${monteCarlo.nTrades} сделок. ${medStr} Умеренный риск — рассмотрите Half-Kelly sizing.`;
                            return `Вероятность потери ${riskThreshold}% депозита = ${monteCarlo.ruinPct}% за ${monteCarlo.nTrades} сделок. ${medStr} Стратегия показывает устойчивые характеристики.`;
                          })()}
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
              </>
            )}
          </div>
        )}
        {/* ══════════════════════════════════════════════════════════════════════
            BLOCK 5 — SORTINO RATIO
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "sortino" && !limits.analytics_montecarlo && (
          <div className="py-8"><UpgradeGate requiredPlan="edge" feature="Sortino Ratio" blurContent={false} /></div>
        )}
        {activeTab === "sortino" && limits.analytics_montecarlo && (
          <div className="space-y-8">
            <BlockHeader
              icon={TrendingDown} color="#818cf8"
              title="Sortino Ratio"
              sub="Измеряет доходность на единицу нисходящего риска — в отличие от Sharpe учитывает только убыточную волатильность"
            />

            {!hasData ? <NoData /> : (
              <>
                {/* Main value */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 bg-white/[0.025] border border-white/[0.05] rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Sortino Ratio</div>
                      <div className="text-5xl font-bold mb-3" style={{ color: ratios && ratios.sortino > 1 ? "#34d399" : ratios && ratios.sortino > 0 ? "#f59e0b" : "#f87171" }}>
                        {ratios ? ratios.sortino.toFixed(3) : "—"}
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: ratios && ratios.sortino > 2 ? "rgba(52,211,153,0.12)" : ratios && ratios.sortino > 1 ? "rgba(245,158,11,0.12)" : "rgba(248,113,113,0.12)",
                          color: ratios && ratios.sortino > 2 ? "#34d399" : ratios && ratios.sortino > 1 ? "#f59e0b" : "#f87171",
                          border: `1px solid ${ratios && ratios.sortino > 2 ? "rgba(52,211,153,0.25)" : ratios && ratios.sortino > 1 ? "rgba(245,158,11,0.25)" : "rgba(248,113,113,0.25)"}`,
                        }}>
                        {ratios ? ratios.sortino > 3 ? "Исключительно" : ratios.sortino > 2 ? "Отлично" : ratios.sortino > 1 ? "Хорошо" : ratios.sortino > 0 ? "Приемлемо" : "Плохо" : "—"}
                      </span>
                    </div>
                    <div className="mt-4 text-xs text-gray-500 leading-relaxed">
                      Benchmark: &gt;1 — хорошо · &gt;2 — отлично · &gt;3 — исключительно
                    </div>
                  </div>

                  <div className="md:col-span-2 grid grid-rows-2 gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <MetricCard
                        icon={Sigma} label="Sharpe Ratio"
                        value={ratios ? ratios.sharpe.toFixed(3) : "—"}
                        color={ratios && ratios.sharpe > 1 ? "#34d399" : "#f59e0b"}
                        sub="Для сравнения (все убытки)"
                      />
                      <MetricCard
                        icon={TrendingDown} label="Downside Deviation"
                        value={ratios && pnls.filter(p => p < 0).length > 1
                          ? `$${stdDev(pnls.filter(p => p < 0)).toFixed(2)}`
                          : "—"}
                        color="#818cf8"
                        sub="Ст. отклонение убытков"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <MetricCard
                        icon={Activity} label="Avg Loss"
                        value={baseStats ? `-$${baseStats.avgLoss.toFixed(2)}` : "—"}
                        color="#f87171"
                        sub={`${losses.length} убыточных сделок`}
                      />
                      <MetricCard
                        icon={TrendingUp} label="Avg Win"
                        value={baseStats ? `+$${baseStats.avgWin.toFixed(2)}` : "—"}
                        color="#34d399"
                        sub={`${wins.length} прибыльных сделок`}
                      />
                    </div>
                  </div>
                </div>

                {/* Sortino vs Sharpe comparison */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Sortino vs Sharpe — разница в подходе</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                        <div>
                          <div className="text-xs text-gray-500 mb-0.5">Sharpe штрафует за</div>
                          <div className="text-sm text-white">Любую волатильность (↑ и ↓)</div>
                        </div>
                        <div className="text-lg font-bold" style={{ color: ratios && ratios.sharpe > 1 ? "#34d399" : "#f59e0b" }}>
                          {ratios?.sharpe.toFixed(2) ?? "—"}
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl border"
                        style={{ background: "rgba(129,140,248,0.05)", borderColor: "rgba(129,140,248,0.2)" }}>
                        <div>
                          <div className="text-xs text-gray-500 mb-0.5">Sortino штрафует за</div>
                          <div className="text-sm text-white">Только убыточную волатильность (↓)</div>
                        </div>
                        <div className="text-lg font-bold text-indigo-400">
                          {ratios?.sortino.toFixed(2) ?? "—"}
                        </div>
                      </div>
                      {ratios && ratios.sortino > ratios.sharpe && (
                        <div className="text-xs text-indigo-300/70 p-2 text-center">
                          Sortino &gt; Sharpe — ваши прибыльные сделки создают "хорошую" волатильность, что справедливо не учитывается Sharpe
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 mb-2">Распределение убытков (downside)</div>
                      {losses.length > 0 ? (
                        <ResponsiveContainer width="100%" height={150}>
                          <BarChart data={(() => {
                            const sorted = [...losses].sort((a, b) => a - b);
                            const step = (sorted[sorted.length - 1] - sorted[0]) / 10 || 1;
                            return Array.from({ length: 10 }, (_, i) => {
                              const lo = sorted[0] + i * step;
                              const hi = lo + step;
                              return {
                                label: `$${lo.toFixed(0)}`,
                                count: sorted.filter(v => v >= lo && v < hi).length,
                              };
                            });
                          })()}>
                            <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} interval={1} />
                            <YAxis tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ background: "rgba(7,9,18,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} formatter={(v: any) => [v, "убытков"]} />
                            <Bar dataKey="count" fill="rgba(129,140,248,0.5)" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-xs text-gray-600 text-center py-8">Нет убыточных сделок</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Interpretation */}
                <div className="p-4 rounded-xl"
                  style={{
                    background: ratios && ratios.sortino > 1 ? "rgba(52,211,153,0.04)" : "rgba(245,158,11,0.04)",
                    border: `1px solid ${ratios && ratios.sortino > 1 ? "rgba(52,211,153,0.15)" : "rgba(245,158,11,0.15)"}`,
                  }}>
                  <div className="flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-gray-400 leading-relaxed">
                      {ratios
                        ? ratios.sortino > 2
                          ? `Sortino ${ratios.sortino.toFixed(2)} — отличный результат. Ваш downside-риск хорошо контролируется относительно средней прибыли.`
                          : ratios.sortino > 1
                          ? `Sortino ${ratios.sortino.toFixed(2)} — приемлемый уровень. Убыточная волатильность умеренная, но есть потенциал для улучшения через стоп-лосс дисциплину.`
                          : ratios.sortino > 0
                          ? `Sortino ${ratios.sortino.toFixed(2)} — слабый результат. Размер убытков велик относительно прибыли. Рекомендуем ужесточить правила выхода.`
                          : `Sortino ${ratios.sortino.toFixed(2)} — отрицательное значение означает что стратегия убыточна в среднем.`
                        : "Нет данных для анализа."
                      }
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            BLOCK 6 — KELLY CRITERION
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "kelly" && !limits.analytics_montecarlo && (
          <div className="py-8"><UpgradeGate requiredPlan="edge" feature="Kelly Criterion" blurContent={false} /></div>
        )}
        {activeTab === "kelly" && limits.analytics_montecarlo && (
          <div className="space-y-8">
            <BlockHeader
              icon={Target} color="#34d399"
              title="Kelly Criterion"
              sub="Математически оптимальный размер позиции для максимизации долгосрочного роста капитала"
            />

            {/* Account size */}
            <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl">
              <span className="text-xs text-gray-400 flex-shrink-0">Размер депозита ($)</span>
              <input
                type="number"
                value={accountSize}
                onChange={(e) => setAccountSize(e.target.value)}
                className="flex-1 max-w-[180px] px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/40 transition-colors"
              />
              <span className="text-xs text-gray-600">Для расчёта оптимальной позиции в $</span>
            </div>

            {!hasData ? <NoData /> : (
              <>
                {/* Main Kelly metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/[0.025] border border-white/[0.05] rounded-2xl p-5">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Full Kelly</div>
                    <div className="text-4xl font-bold text-red-400 mb-1">
                      {kelly ? `${(kelly.kelly * 100).toFixed(1)}%` : "—"}
                    </div>
                    <div className="text-[10px] text-gray-600">Агрессивный · не рекомендуется</div>
                  </div>
                  <div className="rounded-2xl p-5" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)" }}>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Half Kelly ✓</div>
                    <div className="text-4xl font-bold text-emerald-400 mb-1">
                      {kelly ? `${(kelly.halfKelly * 100).toFixed(1)}%` : "—"}
                    </div>
                    <div className="text-[10px] text-gray-600">Рекомендуемый размер</div>
                  </div>
                  <MetricCard
                    icon={Target} label="Оптим. позиция"
                    value={kelly ? `$${kelly.optimalSize.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}` : "—"}
                    color="#22d3ee"
                    sub={`Half-Kelly от $${accountSize}`}
                  />
                  <MetricCard
                    icon={Sigma} label="Win/Loss Ratio (b)"
                    value={kelly ? kelly.ratio.toFixed(2) : "—"}
                    color="#a78bfa"
                    sub="Avg Win ÷ Avg Loss"
                  />
                </div>

                {/* Formula breakdown */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Формула Kelly</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="p-4 rounded-xl bg-black/30 border border-white/[0.06] font-mono text-sm text-emerald-300 mb-4">
                        f* = (b × p − q) ÷ b
                      </div>
                      <div className="space-y-2 text-xs text-gray-400">
                        {[
                          { sym: "f*", desc: "Доля капитала для позиции", val: kelly ? `${(kelly.kelly * 100).toFixed(1)}%` : "—" },
                          { sym: "b",  desc: "Win/Loss ratio (Avg Win ÷ Avg Loss)", val: kelly ? kelly.ratio.toFixed(2) : "—" },
                          { sym: "p",  desc: "Вероятность выигрыша (Win Rate)", val: baseStats ? `${(baseStats.winRate * 100).toFixed(1)}%` : "—" },
                          { sym: "q",  desc: "Вероятность проигрыша (1 − p)", val: baseStats ? `${((1 - baseStats.winRate) * 100).toFixed(1)}%` : "—" },
                        ].map((row) => (
                          <div key={row.sym} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                            <span className="font-mono text-indigo-400 w-4">{row.sym}</span>
                            <span className="flex-1 text-gray-500">{row.desc}</span>
                            <span className="text-white font-semibold">{row.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-2">Kelly % vs Half-Kelly %</div>
                        <div className="relative h-8 bg-white/[0.03] rounded-lg overflow-hidden">
                          <div className="absolute left-0 top-0 h-full rounded-lg bg-red-500/30 transition-all"
                            style={{ width: `${Math.min(100, (kelly?.kelly ?? 0) * 100 * 2)}%` }} />
                          <div className="absolute left-0 top-0 h-full rounded-lg bg-emerald-500/40 transition-all"
                            style={{ width: `${Math.min(100, (kelly?.halfKelly ?? 0) * 100 * 2)}%` }} />
                          <div className="absolute inset-0 flex items-center px-3 gap-4">
                            <span className="text-[10px] text-white/60">Full: {kelly ? `${(kelly.kelly * 100).toFixed(1)}%` : "—"}</span>
                            <span className="text-[10px] text-emerald-300">Half: {kelly ? `${(kelly.halfKelly * 100).toFixed(1)}%` : "—"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs text-gray-500">Почему Half-Kelly?</div>
                        <div className="text-xs text-gray-400 leading-relaxed">
                          Full Kelly максимизирует геометрический рост, но создаёт огромные просадки. Half-Kelly даёт ~75% роста Full Kelly при вдвое меньшей волатильности. Большинство профессионалов используют ¼–½ Kelly.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edge strength */}
                <div className="p-4 rounded-xl"
                  style={{
                    background: kelly && kelly.kelly > 0 ? "rgba(52,211,153,0.04)" : "rgba(248,113,113,0.04)",
                    border: `1px solid ${kelly && kelly.kelly > 0 ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)"}`,
                  }}>
                  <div className="flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-gray-400 leading-relaxed">
                      {kelly
                        ? kelly.kelly <= 0
                          ? "Kelly = 0 или отрицательный — стратегия имеет отрицательное математическое ожидание. Торговать не рекомендуется."
                          : kelly.kelly < 0.05
                          ? `Kelly ${(kelly.kelly * 100).toFixed(1)}% — очень слабый edge. Half-Kelly даёт позицию $${kelly.optimalSize.toFixed(0)}. Стратегия работает, но почти на грани.`
                          : kelly.kelly < 0.15
                          ? `Kelly ${(kelly.kelly * 100).toFixed(1)}% — умеренный edge. Рекомендуемая позиция: $${kelly.optimalSize.toFixed(0)} (Half-Kelly).`
                          : `Kelly ${(kelly.kelly * 100).toFixed(1)}% — сильный edge! Позиция $${kelly.optimalSize.toFixed(0)} по Half-Kelly. Не превышайте Full Kelly — просадки будут катастрофическими.`
                        : "Нет данных — добавьте закрытые сделки в журнал."
                      }
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            BLOCK 7 — EXPECTED SHORTFALL (CVaR)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "es" && !limits.analytics_montecarlo && (
          <div className="py-8"><UpgradeGate requiredPlan="edge" feature="Expected Shortfall (CVaR)" blurContent={false} /></div>
        )}
        {activeTab === "es" && limits.analytics_montecarlo && (
          <div className="space-y-8">
            <BlockHeader
              icon={Shield} color="#fb923c"
              title="Expected Shortfall (CVaR)"
              sub="Среднее значение потерь в худшем хвосте распределения — более консервативная мера риска чем VaR"
            />

            {!hasData ? <NoData text="Нужно минимум 5 закрытых сделок" /> : (
              <>
                {/* Main ES metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-2xl p-5" style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.2)" }}>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">ES / CVaR 95%</div>
                    <div className="text-4xl font-bold text-orange-400 mb-1">
                      {expectedShortfall ? `$${expectedShortfall.es95.toFixed(2)}` : "—"}
                    </div>
                    <div className="text-[10px] text-gray-600">Средний убыток в худшие 5% сделок</div>
                  </div>
                  <MetricCard
                    icon={AlertTriangle} label="VaR 95%"
                    value={expectedShortfall ? `$${expectedShortfall.var95.toFixed(2)}` : "—"}
                    color="#f87171"
                    sub="5-й перцентиль убытков"
                  />
                  <MetricCard
                    icon={AlertTriangle} label="ES / CVaR 90%"
                    value={expectedShortfall ? `$${expectedShortfall.es90.toFixed(2)}` : "—"}
                    color="#f59e0b"
                    sub="Средний убыток в худшие 10%"
                  />
                  <MetricCard
                    icon={Sigma} label="Tail Ratio"
                    value={expectedShortfall?.tailRatio != null ? expectedShortfall.tailRatio.toFixed(2) : "—"}
                    color={expectedShortfall?.tailRatio != null && expectedShortfall.tailRatio > 1 ? "#34d399" : "#f59e0b"}
                    sub="Топ 5% прибыль ÷ CVaR 95%"
                  />
                </div>

                {/* ES vs VaR explanation */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">VaR vs Expected Shortfall</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">VaR 95%</span>
                          <span className="text-sm font-bold text-red-400">{expectedShortfall ? `$${expectedShortfall.var95.toFixed(2)}` : "—"}</span>
                        </div>
                        <div className="text-[10px] text-gray-600">«В 95% случаев убыток не превысит эту сумму» — но не говорит ничего о том, что происходит в худшие 5%</div>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: "rgba(251,146,60,0.05)", border: "1px solid rgba(251,146,60,0.15)" }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">ES / CVaR 95%</span>
                          <span className="text-sm font-bold text-orange-400">{expectedShortfall ? `$${expectedShortfall.es95.toFixed(2)}` : "—"}</span>
                        </div>
                        <div className="text-[10px] text-gray-600">«В худшие 5% сделок средний убыток составит эту сумму» — полная картина хвостового риска</div>
                      </div>
                      <div className="text-[10px] text-gray-600 px-1">
                        CVaR всегда ≥ VaR. Чем больше разрыв — тем тяжелее хвост распределения.
                      </div>
                    </div>

                    {/* Loss tail chart */}
                    <div>
                      <div className="text-xs text-gray-500 mb-2">Хвост убытков (все отрицательные сделки)</div>
                      {losses.length > 0 ? (
                        <ResponsiveContainer width="100%" height={170}>
                          <BarChart data={(() => {
                            const sorted = [...losses].sort((a, b) => a - b);
                            const n = Math.min(sorted.length, 20);
                            const step = (sorted[sorted.length - 1] - sorted[0]) / n || 1;
                            return Array.from({ length: n }, (_, i) => {
                              const lo = sorted[0] + i * step;
                              const hi = lo + step;
                              const cnt = sorted.filter(v => v >= lo && v < hi).length;
                              const isES = lo <= (expectedShortfall?.var95 ?? -Infinity);
                              return { label: `$${lo.toFixed(0)}`, count: cnt, isES };
                            });
                          })()}>
                            <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} interval={2} />
                            <YAxis tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ background: "rgba(7,9,18,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} formatter={(v: any) => [v, "сделок"]} />
                            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                              {(() => {
                                const sorted = [...losses].sort((a, b) => a - b);
                                const n = Math.min(sorted.length, 20);
                                const step = (sorted[sorted.length - 1] - sorted[0]) / n || 1;
                                return Array.from({ length: n }, (_, i) => {
                                  const lo = sorted[0] + i * step;
                                  const isES = lo <= (expectedShortfall?.var95 ?? -Infinity);
                                  return <Cell key={i} fill={isES ? "rgba(251,146,60,0.7)" : "rgba(248,113,113,0.35)"} />;
                                });
                              })()}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-xs text-gray-600 text-center py-8">Нет убыточных сделок</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-600">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-orange-400/70" /> CVaR зона (худшие 5%)</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-red-400/35" /> Остальные убытки</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tail ratio interpretation */}
                <div className="p-4 rounded-xl"
                  style={{
                    background: expectedShortfall?.tailRatio != null && expectedShortfall.tailRatio > 1 ? "rgba(52,211,153,0.04)" : "rgba(251,146,60,0.04)",
                    border: `1px solid ${expectedShortfall?.tailRatio != null && expectedShortfall.tailRatio > 1 ? "rgba(52,211,153,0.15)" : "rgba(251,146,60,0.15)"}`,
                  }}>
                  <div className="flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-gray-400 leading-relaxed">
                      {expectedShortfall
                        ? (() => {
                            const esVal = Math.abs(expectedShortfall.es95).toFixed(2);
                            const varVal = Math.abs(expectedShortfall.var95).toFixed(2);
                            const tr = expectedShortfall.tailRatio;
                            if (tr == null) return `CVaR 95% = $${esVal}. Недостаточно данных для tail ratio.`;
                            if (tr > 2) return `CVaR 95% = $${esVal}. Tail Ratio ${tr.toFixed(2)} — отличный результат. Ваши лучшие сделки приносят в ${tr.toFixed(1)}x больше чем теряют худшие. Хвост прибылей компенсирует хвост убытков.`;
                            if (tr > 1) return `CVaR 95% = $${esVal}. Tail Ratio ${tr.toFixed(2)} — позитивная асимметрия. Прибыльные хвосты превышают убыточные. Стратегия устойчива.`;
                            return `CVaR 95% = $${esVal}. Tail Ratio ${tr.toFixed(2)} < 1 — убыточные хвосты превышают прибыльные. Рассмотрите ужесточение стоп-лоссов или снижение размера позиции в стрессовых условиях.`;
                          })()
                        : "Нужно минимум 5 закрытых сделок для анализа хвостового риска."
                      }
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </div>
      </div>{/* end scrollable */}
    </div>
  );
}
