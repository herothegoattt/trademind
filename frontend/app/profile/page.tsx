"use client";

import { useAuthStore, type Plan } from "@/lib/auth-store";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, User, Mail, Calendar, Shield, Zap, Crown, Activity,
  BarChart3, TrendingUp, Target, Trophy, Clock, Flame, RefreshCw,
  Link2, Unlink, ExternalLink, Check, ChevronRight,
  Wallet, Award, Star, Layers, BookOpen, PieChart, AlertCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  connectTradingView,
  disconnectTradingView,
  syncTradingView,
} from "@/lib/tradingview";
import { cn } from "@/lib/utils";
import { useTradeStore, type TradeUI } from "@/lib/trade-store";
import { usePortfolio, PortfolioProvider, calcPnL } from "@/lib/portfolioContext";

// ─── Plan config ─────────────────────────────────────────────────────────────
const PLAN_META: Record<Plan, { label: string; color: string; bg: string; Icon: any; perks: string[] }> = {
  core: {
    label: "Core", color: "#64748b", bg: "rgba(100,116,139,0.06)", Icon: Shield,
    perks: ["5 AI-решений в день", "Базовый анализ рынка", "Новостная лента", "Сообщество (чтение)"],
  },
  edge: {
    label: "Edge", color: "#22d3ee", bg: "rgba(34,211,238,0.06)", Icon: Zap,
    perks: ["Безлимит AI-решений", "Реалтайм рыночные данные", "Полный доступ к сообществу", "Расширенные сетапы и сигналы", "Обзор портфеля", "TradingView интеграция", "Приоритетная поддержка"],
  },
  apex: {
    label: "Apex", color: "#a78bfa", bg: "rgba(167,139,250,0.06)", Icon: Crown,
    perks: ["Все из Edge", "Персональный AI коучинг", "Эксклюзивные сигналы", "Оптимизация портфеля", "Полный API доступ", "Кастомные уведомления", "Ранний доступ к функциям", "Выделенная поддержка"],
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseDurationToMinutes(duration: string): number | null {
  if (!duration?.trim()) return null;
  let total = 0;
  const days = duration.match(/(\d+)\s*d/i);
  const hours = duration.match(/(\d+)\s*h/i);
  const mins = duration.match(/(\d+)\s*m/i);
  if (days) total += parseInt(days[1]) * 24 * 60;
  if (hours) total += parseInt(hours[1]) * 60;
  if (mins) total += parseInt(mins[1]);
  return total > 0 ? total : null;
}

function minutesToDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}м`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return rh > 0 ? `${d}д ${rh}ч` : `${d}д`;
  }
  return m > 0 ? `${h}ч ${m}м` : `${h}ч`;
}

const RU_MONTHS = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];

function computeJournalStats(trades: TradeUI[]) {
  const completed = trades.filter((t) => t.pnl !== undefined);
  if (completed.length === 0) return null;

  const wins = completed.filter((t) => (t.pnl ?? 0) > 0);
  const losses = completed.filter((t) => (t.pnl ?? 0) < 0);

  const totalPnl = completed.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const winRate = completed.length > 0 ? wins.length / completed.length : 0;

  const avgWin = wins.length > 0
    ? wins.reduce((s, t) => s + (t.pnl ?? 0), 0) / wins.length
    : 0;
  const avgLoss = losses.length > 0
    ? Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length)
    : 0;
  const avgRR = avgLoss > 0 ? avgWin / avgLoss : 0;

  const totalWins = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const totalLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));
  const profitFactor = totalLoss > 0 ? totalWins / totalLoss : totalWins > 0 ? 999 : 0;

  const bestTrade = Math.max(...completed.map((t) => t.pnl ?? 0), 0);
  const worstTrade = Math.min(...completed.map((t) => t.pnl ?? 0), 0);

  // Streak — consecutive wins from the most recent
  let streak = 0;
  for (const t of completed) {
    if ((t.pnl ?? 0) > 0) streak++;
    else break;
  }

  // Avg hold time
  const durations = completed.map((t) => parseDurationToMinutes(t.duration)).filter((d): d is number => d !== null);
  const avgHoldTime = durations.length > 0
    ? minutesToDuration(durations.reduce((s, d) => s + d, 0) / durations.length)
    : "—";

  // Monthly PnL (last 6 months with data)
  const monthlyMap: Record<string, number> = {};
  completed.forEach((t) => {
    const d = new Date(t.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
    monthlyMap[key] = (monthlyMap[key] ?? 0) + (t.pnl ?? 0);
  });
  const monthly_pnl = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, pnl]) => {
      const monthIdx = parseInt(key.split("-")[1]);
      return { month: RU_MONTHS[monthIdx] ?? key, pnl: Math.round(pnl * 100) / 100 };
    });

  // Top pairs by |pnl|
  const pairMap: Record<string, { trades: number; pnl: number }> = {};
  completed.forEach((t) => {
    if (!pairMap[t.symbol]) pairMap[t.symbol] = { trades: 0, pnl: 0 };
    pairMap[t.symbol].trades++;
    pairMap[t.symbol].pnl += t.pnl ?? 0;
  });
  const top_pairs = Object.entries(pairMap)
    .map(([symbol, d]) => ({ symbol, trades: d.trades, pnl: Math.round(d.pnl * 100) / 100 }))
    .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
    .slice(0, 5);

  return {
    total_trades: completed.length,
    win_rate: winRate,
    profit_factor: profitFactor,
    total_pnl: Math.round(totalPnl * 100) / 100,
    avg_rr: avgRR,
    best_trade: bestTrade,
    worst_trade: worstTrade,
    avg_hold_time: avgHoldTime,
    streak,
    monthly_pnl,
    top_pairs,
  };
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: any; label: string; value: string; color: string; sub?: string;
}) {
  return (
    <div className="bg-white/[0.025] border border-white/[0.05] rounded-2xl p-5 hover:bg-white/[0.04] transition-all">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-gray-600 mt-1">{sub}</div>}
    </div>
  );
}

// ─── PnL Chart ───────────────────────────────────────────────────────────────
function PnlChart({ data }: { data: { month: string; pnl: number }[] }) {
  const max = Math.max(...data.map((d) => Math.abs(d.pnl)), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d) => {
        const pct = Math.abs(d.pnl) / max;
        const isPos = d.pnl >= 0;
        return (
          <div key={d.month} className="flex flex-col items-center flex-1 gap-1 group">
            <div className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {isPos ? "+" : ""}${d.pnl.toLocaleString()}
            </div>
            <div
              className="w-full rounded-md transition-all group-hover:brightness-125"
              style={{
                height: Math.max(6, pct * 100),
                background: isPos
                  ? "linear-gradient(180deg, #22d3ee, #0891b2)"
                  : "linear-gradient(180deg, #f87171, #dc2626)",
                opacity: 0.75,
              }}
            />
            <span className="text-[10px] text-gray-500 mt-1">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
function ProfilePageInner() {
  const { user, isAuthenticated, logout, fetchCurrentUser } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // TradingView
  const [tvUsername, setTvUsername] = useState("");
  const [tvConnecting, setTvConnecting] = useState(false);
  const [tvError, setTvError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Tab
  const [activeSection, setActiveSection] = useState<"stats" | "tradingview" | "plan">("stats");

  // Real data
  const { trades } = useTradeStore();
  const portfolio = usePortfolio();

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) router.push("/");
  }, [isAuthenticated, router]);

  // Computed stats from real journal data
  const journalStats = useMemo(() => computeJournalStats(trades), [trades]);

  // Portfolio computed values
  const portfolioSummary = useMemo(() => {
    const { stats, positions } = portfolio;
    return {
      totalPnL: Math.round(stats.totalPnL * 100) / 100,
      unrealizedPnL: Math.round(stats.unrealizedPnL * 100) / 100,
      realizedPnL: Math.round(stats.realizedPnL * 100) / 100,
      winRate: Math.round(stats.winRate * 10) / 10,
      openCount: stats.openCount,
      closedCount: stats.closedCount,
      totalPositions: positions.length,
      bestPosition: stats.best ? { symbol: stats.best.symbol, pnl: Math.round(calcPnL(stats.best) * 100) / 100 } : null,
      worstPosition: stats.worst ? { symbol: stats.worst.symbol, pnl: Math.round(calcPnL(stats.worst) * 100) / 100 } : null,
    };
  }, [portfolio]);

  const hasJournalData = (journalStats?.total_trades ?? 0) > 0;
  const hasPortfolioData = portfolio.positions.length > 0;

  if (!mounted || !isAuthenticated || !user) {
    return (
      <div className="tm-app min-h-screen flex items-center justify-center" style={{ background: "#060612" }}>
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  const plan: Plan = (user.plan as Plan) || "core";
  const planMeta = PLAN_META[plan];
  const tvConnected = !!user.tradingview?.username;

  const avatarUrl = user.avatar_url || `https://api.dicebear.com/7.x/avataaars/png?seed=${user.email}`;

  // Combined quick stats for header
  const combinedTotalPnL = (journalStats?.total_pnl ?? 0) + portfolioSummary.totalPnL;
  const combinedTrades = (journalStats?.total_trades ?? 0) + portfolioSummary.totalPositions;

  // Handlers
  const handleTvConnect = async () => {
    if (!tvUsername.trim()) return;
    setTvConnecting(true);
    setTvError(null);
    try {
      await connectTradingView(tvUsername.trim());
      await fetchCurrentUser();
      setTvUsername("");
    } catch (err: any) {
      setTvError(err.message || "Connection failed");
    } finally {
      setTvConnecting(false);
    }
  };

  const handleTvDisconnect = async () => {
    await disconnectTradingView();
    await fetchCurrentUser();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncTradingView();
    } catch {}
    setSyncing(false);
  };

  return (
    <div className="tm-app min-h-screen text-white" style={{ background: "#060612" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: "rgba(6,6,18,0.85)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/app"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-all">
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </Link>
            <h1 className="text-sm font-semibold text-white">Профиль</h1>
          </div>
          <button
            onClick={async () => { await logout(); router.push("/"); }}
            className="px-3 py-1.5 rounded-lg text-xs text-red-400/70 hover:text-red-400 bg-red-500/[0.04] hover:bg-red-500/8 border border-red-500/10 transition-all"
          >
            Выйти
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* ── Profile header card ────────────────────────────────────────── */}
        <div className="rounded-2xl p-6 mb-6"
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(6,182,212,0.04), rgba(59,130,246,0.03))",
            border: "1px solid rgba(255,255,255,0.05)",
          }}>
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-full blur-xl" style={{ background: `${planMeta.color}15` }} />
              <Image src={avatarUrl} alt="Avatar" width={80} height={80}
                className="relative rounded-full border-2 w-[80px] h-[80px] object-cover"
                style={{ borderColor: `${planMeta.color}40` }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-white truncate">{user.name}</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0"
                  style={{
                    background: `${planMeta.color}12`,
                    border: `1px solid ${planMeta.color}30`,
                    color: planMeta.color,
                  }}>
                  <planMeta.Icon className="w-3 h-3" />
                  {planMeta.label}
                </span>
                {user.verified && (
                  <span className="inline-flex items-center px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-[10px] text-emerald-400 flex-shrink-0">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400">{user.email}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-gray-500">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  С {new Date(user.created_at || Date.now()).toLocaleDateString("ru-RU")}
                </span>
                {tvConnected && (
                  <span className="text-xs text-blue-400 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    @{user.tradingview!.username}
                  </span>
                )}
              </div>
            </div>

            {/* Quick stats from real data */}
            {(hasJournalData || hasPortfolioData) && (
              <div className="hidden md:flex items-center gap-4 flex-shrink-0">
                {hasJournalData && journalStats && (
                  <>
                    <div className="text-center">
                      <div className="text-lg font-bold text-cyan-400">{Math.round(journalStats.win_rate * 100)}%</div>
                      <div className="text-[10px] text-gray-500">Win Rate</div>
                    </div>
                    <div className="w-px h-8 bg-white/[0.05]" />
                  </>
                )}
                <div className="text-center">
                  <div className={cn("text-lg font-bold", combinedTotalPnL >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {combinedTotalPnL >= 0 ? "+" : ""}${Math.abs(combinedTotalPnL).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-500">Общий PnL</div>
                </div>
                <div className="w-px h-8 bg-white/[0.05]" />
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">{combinedTrades}</div>
                  <div className="text-[10px] text-gray-500">Позиций</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Section tabs ───────────────────────────────────────────────── */}
        <div className="flex gap-1 mb-6">
          {([
            { id: "stats" as const, label: "Статистика", icon: BarChart3 },
            { id: "tradingview" as const, label: "TradingView", icon: Activity },
            { id: "plan" as const, label: "План и привилегии", icon: Award },
          ]).map((t) => {
            const Icon = t.icon;
            const active = activeSection === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveSection(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-white/[0.07] text-white border border-white/[0.08]"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] border border-transparent"
                )}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        {activeSection === "stats" && (
          <div className="space-y-6">

            {/* ── Journal Stats ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">Журнал сделок</span>
                {tvConnected && (
                  <span className="text-[10px] text-blue-400/70 bg-blue-500/8 border border-blue-500/15 rounded-full px-2 py-0.5 flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5" /> TradingView
                  </span>
                )}
              </div>
              {!hasJournalData && (
                <Link href="/journal"
                  className="text-xs text-cyan-400/70 hover:text-cyan-400 flex items-center gap-1 transition-colors">
                  Добавить сделки <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {hasJournalData && journalStats ? (
              <>
                {/* Main stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard
                    icon={Trophy} label="Win Rate"
                    value={`${Math.round(journalStats.win_rate * 100)}%`}
                    color={journalStats.win_rate >= 0.5 ? "#22d3ee" : "#f87171"}
                    sub={`${journalStats.total_trades} сделок`}
                  />
                  <StatCard
                    icon={TrendingUp} label="Общий PnL"
                    value={`${journalStats.total_pnl >= 0 ? "+" : ""}$${Math.abs(journalStats.total_pnl).toLocaleString()}`}
                    color={journalStats.total_pnl >= 0 ? "#34d399" : "#f87171"}
                    sub={`PF: ${journalStats.profit_factor > 0 ? journalStats.profit_factor.toFixed(2) : "—"}`}
                  />
                  <StatCard
                    icon={Target} label="Средний R:R"
                    value={journalStats.avg_rr > 0 ? `1:${journalStats.avg_rr.toFixed(1)}` : "—"}
                    color="#a78bfa" sub="Risk/Reward"
                  />
                  <StatCard
                    icon={Flame} label="Серия побед"
                    value={`${journalStats.streak}`}
                    color="#f59e0b"
                    sub={journalStats.avg_hold_time !== "—" ? `Ср. время: ${journalStats.avg_hold_time}` : undefined}
                  />
                </div>

                {/* Best / Worst trades */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-500/[0.04] border border-emerald-500/10 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-gray-400 uppercase tracking-wider">Лучшая сделка</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">
                      +${journalStats.best_trade.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-red-500/[0.04] border border-red-500/10 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
                      <span className="text-xs text-gray-400 uppercase tracking-wider">Худшая сделка</span>
                    </div>
                    <div className="text-2xl font-bold text-red-400">
                      -${Math.abs(journalStats.worst_trade).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* PnL chart */}
                {journalStats.monthly_pnl.length > 0 && (
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-white">PnL по месяцам</h3>
                      <span className="text-[10px] text-gray-500">Из журнала сделок</span>
                    </div>
                    <PnlChart data={journalStats.monthly_pnl} />
                  </div>
                )}

                {/* Top pairs */}
                {journalStats.top_pairs.length > 0 && (
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">Топ инструменты</h3>
                    <div className="space-y-2">
                      {journalStats.top_pairs.map((pair, i) => {
                        const maxPnl = Math.max(...journalStats.top_pairs.map((p) => Math.abs(p.pnl)), 1);
                        const pct = Math.abs(pair.pnl) / maxPnl;
                        return (
                          <div key={pair.symbol} className="flex items-center gap-3 group">
                            <span className="text-xs text-gray-600 w-4">{i + 1}</span>
                            <span className="text-sm font-semibold text-white w-20">{pair.symbol}</span>
                            <div className="flex-1 h-6 bg-white/[0.02] rounded-md overflow-hidden">
                              <div
                                className="h-full rounded-md transition-all"
                                style={{
                                  width: `${pct * 100}%`,
                                  background: pair.pnl >= 0
                                    ? "linear-gradient(90deg, rgba(34,211,238,0.2), rgba(34,211,238,0.4))"
                                    : "linear-gradient(90deg, rgba(248,113,113,0.2), rgba(248,113,113,0.4))",
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-16 text-right">{pair.trades} сд.</span>
                            <span className={cn("text-sm font-semibold w-20 text-right", pair.pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                              {pair.pnl >= 0 ? "+" : ""}${pair.pnl.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white/[0.015] border border-white/[0.04] rounded-2xl p-8 text-center">
                <BookOpen className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <div className="text-sm text-gray-500 mb-1">Нет сделок в журнале</div>
                <div className="text-xs text-gray-600 mb-4">Добавьте сделки в журнале, чтобы увидеть статистику</div>
                <Link href="/journal"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-cyan-400 bg-cyan-500/8 border border-cyan-500/20 hover:bg-cyan-500/15 transition-all">
                  Открыть журнал <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* ── Portfolio Stats ────────────────────────────────────────── */}
            <div className="flex items-center gap-2 pt-2">
              <PieChart className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">Инвестиционный портфель</span>
            </div>

            {hasPortfolioData ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard
                    icon={Wallet} label="Общий PnL"
                    value={`${portfolioSummary.totalPnL >= 0 ? "+" : ""}$${Math.abs(portfolioSummary.totalPnL).toLocaleString()}`}
                    color={portfolioSummary.totalPnL >= 0 ? "#34d399" : "#f87171"}
                    sub={`${portfolioSummary.totalPositions} позиций`}
                  />
                  <StatCard
                    icon={TrendingUp} label="Нереализованный"
                    value={`${portfolioSummary.unrealizedPnL >= 0 ? "+" : ""}$${Math.abs(portfolioSummary.unrealizedPnL).toLocaleString()}`}
                    color={portfolioSummary.unrealizedPnL >= 0 ? "#22d3ee" : "#f87171"}
                    sub={`${portfolioSummary.openCount} откр.`}
                  />
                  <StatCard
                    icon={Check} label="Реализованный"
                    value={`${portfolioSummary.realizedPnL >= 0 ? "+" : ""}$${Math.abs(portfolioSummary.realizedPnL).toLocaleString()}`}
                    color={portfolioSummary.realizedPnL >= 0 ? "#34d399" : "#f87171"}
                    sub={`${portfolioSummary.closedCount} закр.`}
                  />
                  <StatCard
                    icon={Trophy} label="Win Rate"
                    value={`${portfolioSummary.winRate.toFixed(1)}%`}
                    color={portfolioSummary.winRate >= 50 ? "#22d3ee" : "#f87171"}
                    sub="По позициям"
                  />
                </div>

                {/* Best / Worst portfolio positions */}
                {(portfolioSummary.bestPosition || portfolioSummary.worstPosition) && (
                  <div className="grid grid-cols-2 gap-3">
                    {portfolioSummary.bestPosition && (
                      <div className="bg-emerald-500/[0.04] border border-emerald-500/10 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs text-gray-400 uppercase tracking-wider">Лучшая позиция</span>
                        </div>
                        <div className="text-lg font-bold text-emerald-400">
                          +${portfolioSummary.bestPosition.pnl.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{portfolioSummary.bestPosition.symbol}</div>
                      </div>
                    )}
                    {portfolioSummary.worstPosition && portfolioSummary.worstPosition.pnl < 0 && (
                      <div className="bg-red-500/[0.04] border border-red-500/10 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
                          <span className="text-xs text-gray-400 uppercase tracking-wider">Худшая позиция</span>
                        </div>
                        <div className="text-lg font-bold text-red-400">
                          -${Math.abs(portfolioSummary.worstPosition.pnl).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{portfolioSummary.worstPosition.symbol}</div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white/[0.015] border border-white/[0.04] rounded-2xl p-8 text-center">
                <PieChart className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <div className="text-sm text-gray-500 mb-1">Нет инвестиционных позиций</div>
                <div className="text-xs text-gray-600 mb-4">Добавьте позиции в разделе Инвестиции</div>
                <Link href="/investing"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-purple-400 bg-purple-500/8 border border-purple-500/20 hover:bg-purple-500/15 transition-all">
                  Открыть инвестиции <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* ── TradingView status hint ────────────────────────────────── */}
            {!tvConnected && (
              <div className="flex items-center gap-3 p-4 bg-blue-500/[0.04] border border-blue-500/10 rounded-xl">
                <Activity className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-white">Подключите TradingView</div>
                  <div className="text-[11px] text-gray-500">Для автоимпорта сделок и реалтайм статистики</div>
                </div>
                <button onClick={() => setActiveSection("tradingview")}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 flex-shrink-0 transition-colors">
                  Подключить <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {activeSection === "tradingview" && (
          <div className="max-w-2xl space-y-6">
            {tvConnected ? (
              <>
                {/* Connection card */}
                <div className="bg-blue-500/[0.04] border border-blue-500/12 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-sm font-medium text-emerald-400">Подключено</span>
                    </div>
                    <button onClick={handleSync} disabled={syncing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-all disabled:opacity-50">
                      <RefreshCw className={cn("w-3.5 h-3.5", syncing && "animate-spin")} />
                      {syncing ? "Синхронизация..." : "Синхронизировать"}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Аккаунт</div>
                      <div className="text-sm font-medium text-white">@{user.tradingview!.username}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Подключен</div>
                      <div className="text-sm text-gray-300">
                        {new Date(user.tradingview!.connected_at).toLocaleDateString("ru-RU")}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Последняя синхр.</div>
                      <div className="text-sm text-gray-300">
                        {user.tradingview!.last_sync
                          ? new Date(user.tradingview!.last_sync).toLocaleString("ru-RU")
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats linked to TradingView */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-white mb-3">Ваша статистика</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className={cn("text-xl font-bold", (journalStats?.win_rate ?? 0) >= 0.5 ? "text-cyan-400" : "text-gray-400")}>
                        {journalStats ? `${Math.round(journalStats.win_rate * 100)}%` : "—"}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className={cn("text-xl font-bold", (journalStats?.total_pnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {journalStats ? `$${Math.abs(journalStats.total_pnl).toLocaleString()}` : "—"}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">Журнал PnL</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-400">
                        {journalStats?.total_trades ?? portfolio.positions.length}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">Сделок</div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-white mb-4">Что вы получаете</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: BarChart3, text: "Автоимпорт сделок", desc: "Все сделки загружаются автоматически" },
                      { icon: TrendingUp, text: "Реалтайм статистика", desc: "PnL, win rate, R:R в реальном времени" },
                      { icon: Target, text: "AI анализ паттернов", desc: "Находим закономерности в вашей торговле" },
                      { icon: Layers, text: "Журнал сделок", desc: "Полный учет с заметками и тегами" },
                    ].map((f) => (
                      <div key={f.text} className="flex gap-3 p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                        <f.icon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-medium text-white">{f.text}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{f.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <a href={`https://www.tradingview.com/u/${user.tradingview!.username}/`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-blue-400 bg-blue-500/8 border border-blue-500/15 hover:bg-blue-500/15 transition-all">
                    <ExternalLink className="w-4 h-4" />
                    Открыть TradingView
                  </a>
                  <button onClick={handleTvDisconnect}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm text-red-400/60 hover:text-red-400 border border-red-500/10 hover:border-red-500/20 hover:bg-red-500/5 transition-all">
                    <Unlink className="w-4 h-4" />
                    Отключить
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Hero */}
                <div className="text-center py-6">
                  <div className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.06))",
                      border: "1px solid rgba(59,130,246,0.15)",
                    }}>
                    <Activity className="w-10 h-10 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Подключите TradingView</h3>
                  <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                    Привяжите ваш аккаунт TradingView для автоматического импорта сделок,
                    просмотра детальной статистики и ведения журнала трейдинга прямо в TradeMind
                  </p>
                </div>

                {/* Connect form */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-medium">TradingView Username</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tvUsername}
                        onChange={(e) => setTvUsername(e.target.value)}
                        placeholder="your_username"
                        className="flex-1 px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/40 transition-colors placeholder:text-gray-600"
                        onKeyDown={(e) => e.key === "Enter" && handleTvConnect()}
                      />
                      <button
                        onClick={handleTvConnect}
                        disabled={tvConnecting || !tvUsername.trim()}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
                        style={{
                          background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.15))",
                          border: "1px solid rgba(59,130,246,0.3)",
                          color: "#60a5fa",
                        }}
                      >
                        <Link2 className="w-4 h-4" />
                        {tvConnecting ? "..." : "Подключить"}
                      </button>
                    </div>
                  </div>

                  {tvError && (
                    <div className="text-xs text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">
                      {tvError}
                    </div>
                  )}
                </div>

                {/* Benefits grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: BarChart3, title: "Автоимпорт сделок", desc: "Все позиции подтягиваются из TradingView автоматически" },
                    { icon: TrendingUp, title: "Живая статистика", desc: "Win rate, PnL, profit factor обновляются в реальном времени" },
                    { icon: Target, title: "Анализ паттернов", desc: "AI находит ваши сильные и слабые стороны в трейдинге" },
                    { icon: Wallet, title: "Терминал", desc: "Открывайте и управляйте позициями через TradeMind" },
                    { icon: Star, title: "Журнал сделок", desc: "Автоматический учет с заметками и тегами" },
                    { icon: Layers, title: "Портфель", desc: "Обзор всех активов и позиций в одном месте" },
                  ].map((b) => (
                    <div key={b.title}
                      className="flex gap-3 p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:bg-white/[0.035] transition-all">
                      <b.icon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-white mb-0.5">{b.title}</div>
                        <div className="text-[10px] text-gray-500 leading-relaxed">{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {plan === "core" && (
                  <div className="text-center">
                    <div className="text-xs text-amber-400/70 bg-amber-500/6 border border-amber-500/10 rounded-xl px-4 py-3">
                      Полная TradingView интеграция доступна на плане Edge ($29/мес) и выше.
                      Базовое подключение доступно бесплатно.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeSection === "plan" && (
          <div className="max-w-2xl space-y-6">
            {/* Current plan card */}
            <div className="rounded-2xl p-6"
              style={{ background: planMeta.bg, border: `1px solid ${planMeta.color}20` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${planMeta.color}15`, border: `1px solid ${planMeta.color}25` }}>
                  <planMeta.Icon className="w-5 h-5" style={{ color: planMeta.color }} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">План {planMeta.label}</h3>
                  <p className="text-xs text-gray-400">Ваш текущий план</p>
                </div>
              </div>

              <div className="space-y-2 mb-5">
                {planMeta.perks.map((perk) => (
                  <div key={perk} className="flex items-center gap-2.5">
                    <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: planMeta.color }} />
                    <span className="text-sm text-gray-300">{perk}</span>
                  </div>
                ))}
              </div>

              {plan !== "apex" && (
                <button
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:brightness-110"
                  style={{
                    background: `linear-gradient(135deg, ${planMeta.color}25, ${planMeta.color}15)`,
                    border: `1px solid ${planMeta.color}35`,
                    color: planMeta.color,
                  }}
                >
                  <Zap className="w-4 h-4" />
                  Улучшить план
                </button>
              )}
            </div>

            {/* All plans comparison */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300">Сравнение планов</h3>
              {(["core", "edge", "apex"] as Plan[]).map((p) => {
                const meta = PLAN_META[p];
                const isCurrent = p === plan;
                return (
                  <div key={p}
                    className={cn(
                      "rounded-xl p-4 transition-all",
                      isCurrent ? "ring-1" : "bg-white/[0.015] border border-white/[0.04]"
                    )}
                    style={isCurrent ? { background: meta.bg, ["--tw-ring-color" as any]: `${meta.color}30` } : {}}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <meta.Icon className="w-4 h-4" style={{ color: meta.color }} />
                        <span className="text-sm font-semibold text-white">{meta.label}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}25` }}>
                            Текущий
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold" style={{ color: meta.color }}>
                        {p === "core" ? "Free" : p === "edge" ? "$29/мес" : "$79/мес"}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {meta.perks.slice(0, 4).map((perk) => (
                        <span key={perk} className="text-[10px] text-gray-500 bg-white/[0.03] px-2 py-0.5 rounded-md">
                          {perk}
                        </span>
                      ))}
                      {meta.perks.length > 4 && (
                        <span className="text-[10px] text-gray-600">+{meta.perks.length - 4} ещё</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap with PortfolioProvider so usePortfolio() works
export default function ProfilePage() {
  return (
    <PortfolioProvider>
      <ProfilePageInner />
    </PortfolioProvider>
  );
}
