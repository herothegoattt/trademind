"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  X, LogOut, Edit2, Check, ChevronLeft, Camera, Zap, Shield, Crown,
  Link2, Unlink, RefreshCw, TrendingUp, BarChart3, Target, Trophy,
  Clock, Flame, ChevronRight, ExternalLink, Activity,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuthStore, type Plan } from "../../lib/auth-store";
import { SubscriptionModal } from "./SubscriptionModal";
import {
  connectTradingView,
  disconnectTradingView,
  syncTradingView,
} from "../../lib/tradingview";
import { useTradeStore, type TradeUI } from "../../lib/trade-store";
import { useT } from "../../lib/i18n";

// ─── Types ───────────────────────────────────────────────────────────────────
type Tab = "overview" | "stats" | "tradingview";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseDurationMins(d: string): number | null {
  if (!d?.trim()) return null;
  let t = 0;
  const days  = d.match(/(\d+)\s*d/i);
  const hours = d.match(/(\d+)\s*h/i);
  const mins  = d.match(/(\d+)\s*m/i);
  if (days)  t += parseInt(days[1])  * 24 * 60;
  if (hours) t += parseInt(hours[1]) * 60;
  if (mins)  t += parseInt(mins[1]);
  return t > 0 ? t : null;
}

function minsToLabel(m: number, tFn: (k: string) => string): string {
  if (m < 60) return `${Math.round(m)}${tFn('dur_m')}`;
  const h = Math.floor(m / 60);
  const rm = Math.round(m % 60);
  if (h >= 24) { const d = Math.floor(h / 24); return `${d}${tFn('dur_d')} ${h % 24}${tFn('dur_h')}`; }
  return rm > 0 ? `${h}${tFn('dur_h')} ${rm}${tFn('dur_m')}` : `${h}${tFn('dur_h')}`;
}

function computeStats(trades: TradeUI[]) {
  const done = trades.filter((t) => t.pnl !== undefined);
  if (!done.length) return null;

  const wins   = done.filter((t) => (t.pnl ?? 0) > 0);
  const losses = done.filter((t) => (t.pnl ?? 0) < 0);
  const totalPnl = done.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const avgWin  = wins.length   ? wins.reduce((s, t)   => s + (t.pnl ?? 0), 0) / wins.length   : 0;
  const avgLoss = losses.length ? Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length) : 0;

  const totalWins = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const totalLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));

  let streak = 0;
  for (const t of done) { if ((t.pnl ?? 0) > 0) streak++; else break; }

  const durs = done.map((t) => parseDurationMins(t.duration)).filter((d): d is number => d !== null);
  const avg_hold_mins = durs.length ? durs.reduce((s, d) => s + d, 0) / durs.length : null;

  const monthMap: Record<string, number> = {};
  done.forEach((t) => {
    const d = new Date(t.createdAt);
    const k = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
    monthMap[k] = (monthMap[k] ?? 0) + (t.pnl ?? 0);
  });
  const monthly_pnl = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([k, pnl]) => ({ monthIdx: parseInt(k.split("-")[1]), pnl: Math.round(pnl * 100) / 100 }));

  const pairMap: Record<string, { trades: number; pnl: number }> = {};
  done.forEach((t) => {
    if (!pairMap[t.symbol]) pairMap[t.symbol] = { trades: 0, pnl: 0 };
    pairMap[t.symbol].trades++;
    pairMap[t.symbol].pnl += t.pnl ?? 0;
  });
  const top_pairs = Object.entries(pairMap)
    .map(([symbol, d]) => ({ symbol, trades: d.trades, pnl: Math.round(d.pnl * 100) / 100 }))
    .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
    .slice(0, 5);

  return {
    total_trades: done.length,
    win_rate: wins.length / done.length,
    profit_factor: totalLoss > 0 ? totalWins / totalLoss : totalWins > 0 ? 999 : 0,
    total_pnl: Math.round(totalPnl * 100) / 100,
    avg_rr: avgLoss > 0 ? avgWin / avgLoss : 0,
    best_trade: Math.max(...done.map((t) => t.pnl ?? 0), 0),
    worst_trade: Math.min(...done.map((t) => t.pnl ?? 0), 0),
    avg_hold_mins,
    streak,
    monthly_pnl,
    top_pairs,
  };
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Plan metadata (perks use i18n keys) ─────────────────────────────────────
const PLAN_META: Record<Plan, { label: string; color: string; Icon: any; perkKeys: string[] }> = {
  core: {
    label: "Core", color: "#64748b", Icon: Shield,
    perkKeys: ["plan_core_perk1", "plan_core_perk2", "plan_core_perk3"],
  },
  edge: {
    label: "Edge", color: "#22d3ee", Icon: Zap,
    perkKeys: ["plan_edge_perk1", "plan_edge_perk2", "plan_edge_perk3", "plan_edge_perk4", "plan_edge_perk5"],
  },
  apex: {
    label: "Apex", color: "#a78bfa", Icon: Crown,
    perkKeys: ["plan_apex_perk1", "plan_apex_perk2", "plan_apex_perk3", "plan_apex_perk4", "plan_apex_perk5"],
  },
};

// ─── Stat card helper ────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: any; label: string; value: string; color: string; sub?: string;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 space-y-1">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-[11px] text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-lg font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] text-gray-600">{sub}</div>}
    </div>
  );
}

// ─── Mini PnL sparkline ──────────────────────────────────────────────────────
function MiniPnlChart({ data }: { data: { month: string; pnl: number }[] }) {
  const max = Math.max(...data.map((d) => Math.abs(d.pnl)), 1);
  const h = 48;
  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((d) => {
        const pct = Math.abs(d.pnl) / max;
        const isPos = d.pnl >= 0;
        return (
          <div key={d.month} className="flex flex-col items-center flex-1 gap-0.5">
            <div
              className="w-full rounded-sm transition-all"
              style={{
                height: Math.max(4, pct * h),
                background: isPos
                  ? "linear-gradient(180deg, #22d3ee, #06b6d4)"
                  : "linear-gradient(180deg, #f87171, #ef4444)",
                opacity: 0.8,
              }}
            />
            <span className="text-[8px] text-gray-600">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const t = useT();
  const { user: authUser, logout } = useAuthStore();
  const router = useRouter();

  // ─── Local state ─────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: "", avatar_url: "" });
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [plan, setPlan] = useState<Plan>((authUser?.plan as Plan) || "core");
  const [subOpen, setSubOpen] = useState(false);

  // TradingView
  const [tvUsername, setTvUsername] = useState("");
  const [tvConnecting, setTvConnecting] = useState(false);
  const [tvError, setTvError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Real trade data
  const { trades } = useTradeStore();

  // ─── Load data on open ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !authUser) return;
    setEditData({ name: authUser.name || "", avatar_url: authUser.avatar_url || "" });
    setPlan((authUser.plan as Plan) || "core");
    setAvatarPreview(null);
    setTab("overview");
    setIsEditing(false);
    setTvError(null);
  }, [isOpen, authUser]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Max 5MB"); return; }
    if (!file.type.startsWith("image/")) { alert("Images only"); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      setEditData((d) => ({ ...d, avatar_url: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdits = async () => {
    if (!authUser || !editData.name.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: editData.name.trim(),
          avatar_url: editData.avatar_url || undefined,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      // Refresh user data
      const { fetchCurrentUser } = useAuthStore.getState();
      await fetchCurrentUser();
      setAvatarPreview(null);
      setIsEditing(false);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleTvConnect = async () => {
    if (!tvUsername.trim()) return;
    setTvConnecting(true);
    setTvError(null);
    try {
      await connectTradingView(tvUsername.trim());
      const { fetchCurrentUser } = useAuthStore.getState();
      await fetchCurrentUser();
      setTvUsername("");
      setStats(null); // force reload stats
    } catch (err: any) {
      setTvError(err.message || "Connection failed");
    } finally {
      setTvConnecting(false);
    }
  };

  const handleTvDisconnect = async () => {
    try {
      await disconnectTradingView();
      const { fetchCurrentUser } = useAuthStore.getState();
      await fetchCurrentUser();
      setStats(null);
    } catch {
      // silent
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncTradingView();
      setStats(null); // force reload
    } catch {
      // silent
    } finally {
      setSyncing(false);
    }
  };

  const getAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;
    if (editData.avatar_url) return editData.avatar_url;
    return `https://api.dicebear.com/7.x/avataaars/png?seed=${authUser?.email || "default"}`;
  };

  // ─── Guard ───────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  if (!authUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full sm:w-96 rounded-t-2xl sm:rounded-2xl overflow-hidden"
          style={{ background: "rgba(7,9,18,0.98)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="p-6 text-center">
            <div className="text-lg font-semibold text-white mb-2">{t('welcome_title')}</div>
            <div className="text-sm text-gray-400 mb-6">{t('login_or_register')}</div>
            <div className="space-y-3">
              <button onClick={() => (window.location.href = "/auth/login")}
                className="w-full px-4 py-2.5 bg-cyan-500/15 hover:bg-cyan-500/25 rounded-xl text-cyan-300 transition-colors border border-cyan-500/20">
                {t('login_btn')}
              </button>
              <button onClick={() => (window.location.href = "/auth/signup")}
                className="w-full px-4 py-2.5 bg-purple-500/15 hover:bg-purple-500/25 rounded-xl text-purple-300 transition-colors border border-purple-500/20">
                {t('register_btn')}
              </button>
            </div>
          </div>
          <div className="px-6 pb-6">
            <button onClick={onClose} className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
              {t('close_btn')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tvConnected = !!authUser.tradingview?.username;
  const planMeta = PLAN_META[plan];

  // ─── Tabs ────────────────────────────────────────────────────────────────
  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: t('tab_profile'), icon: Edit2 },
    { id: "stats", label: t('tab_stats'), icon: BarChart3 },
    { id: "tradingview", label: "TradingView", icon: Activity },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-full sm:w-[480px] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{
          maxHeight: "92vh",
          background: "rgba(7,9,18,0.98)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-3">
            {isEditing && (
              <button onClick={() => { setIsEditing(false); setAvatarPreview(null); }}
                className="p-1 hover:bg-white/5 rounded-lg transition-colors">
                <ChevronLeft size={18} className="text-gray-400" />
              </button>
            )}
            <h2 className="text-base font-semibold text-white">
              {isEditing ? t('editing_title') : t('tab_profile')}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <X size={14} className="text-gray-500" />
          </button>
        </div>

        {/* ── Tab bar (when not editing) ─────────────────────────────────── */}
        {!isEditing && (
          <div className="flex px-5 pt-3 gap-1 flex-shrink-0">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    active
                      ? "bg-white/[0.07] text-white"
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Scrollable content ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {isEditing ? (
            /* ════ EDIT MODE ════ */
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="inline-flex relative mb-3 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-cyan-500/30 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative rounded-full overflow-hidden border-2 border-white/10">
                    <Image src={getAvatarUrl()} alt="Avatar" width={88} height={88}
                      className="w-[88px] h-[88px] object-cover" />
                    <button onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={22} className="text-white" />
                    </button>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                <p className="text-[11px] text-gray-500">{t('click_change_avatar')}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-medium">{t('name_label')}</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/40 transition-colors"
                  placeholder={t('your_name_ph')}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-medium">Email</label>
                <div className="px-3 py-2 bg-white/[0.02] border border-white/[0.05] rounded-xl text-gray-500 text-sm">
                  {authUser.email}
                </div>
              </div>

              <button
                onClick={handleSaveEdits}
                disabled={saving || !editData.name.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))",
                  border: "1px solid rgba(6,182,212,0.3)",
                  color: "#22d3ee",
                }}
              >
                <Check size={15} />
                {saving ? t('saving_text') : t('save_changes')}
              </button>
            </div>
          ) : tab === "overview" ? (
            /* ════ OVERVIEW TAB ════ */
            <>
              {/* Avatar & Info */}
              <div className="text-center">
                <div className="inline-flex relative mb-3">
                  <div className="absolute inset-0 rounded-full blur-lg"
                    style={{ background: `${planMeta.color}20` }} />
                  <Image src={getAvatarUrl()} alt="Avatar" width={72} height={72}
                    className="relative rounded-full border-2 w-[72px] h-[72px] object-cover"
                    style={{ borderColor: `${planMeta.color}40` }} />
                </div>
                <h3 className="text-base font-semibold text-white">{authUser.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{authUser.email}</p>

                {/* Plan & verified badges */}
                <div className="flex items-center justify-center gap-2 mt-2.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                    style={{
                      background: `${planMeta.color}10`,
                      border: `1px solid ${planMeta.color}30`,
                      color: planMeta.color,
                    }}>
                    <planMeta.Icon className="w-3 h-3" />
                    {planMeta.label}
                  </span>
                  {authUser.verified && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-[11px] text-emerald-400 font-medium">
                      Verified
                    </span>
                  )}
                  {tvConnected && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/25 rounded-full text-[11px] text-blue-400 font-medium">
                      <Activity className="w-2.5 h-2.5" />
                      TV
                    </span>
                  )}
                </div>
              </div>

              {/* Upgrade CTA */}
              {plan !== "apex" && (
                <button
                  onClick={() => setSubOpen(true)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all hover:brightness-110"
                  style={{
                    background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(6,182,212,0.04))",
                    border: "1px solid rgba(139,92,246,0.15)",
                  }}
                >
                  <div className="text-left">
                    <div className="text-xs font-medium text-white">
                      {plan === "core" ? t('upgrade_to_edge_apex') : t('upgrade_to_apex')}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {plan === "core" ? t('upgrade_desc_core') : t('upgrade_desc_edge')}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              )}

              {/* Plan Perks */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('plan_perks_label')}</div>
                <div className="space-y-1.5">
                  {planMeta.perkKeys.map((key) => (
                    <div key={key} className="flex items-center gap-2">
                      <Check className="w-3 h-3 flex-shrink-0" style={{ color: planMeta.color }} />
                      <span className="text-xs text-gray-300">{t(key)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TradingView quick status */}
              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all hover:brightness-110"
                onClick={() => setTab("tradingview")}
                style={{
                  background: tvConnected ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${tvConnected ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)"}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: tvConnected ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${tvConnected ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)"}`,
                    }}>
                    <Activity className="w-4 h-4" style={{ color: tvConnected ? "#3b82f6" : "#6b7280" }} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">TradingView</div>
                    <div className="text-[10px] text-gray-500">
                      {tvConnected ? `@${authUser.tradingview!.username}` : t('tv_not_connected_label')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {tvConnected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                </div>
              </div>

              {/* Member since */}
              {authUser.created_at && (
                <div className="text-[10px] text-gray-600 text-center">
                  {t('member_since')} {new Date(authUser.created_at).toLocaleDateString()}
                </div>
              )}
            </>
          ) : tab === "stats" ? (
            /* ════ STATS TAB ════ */
            (() => {
              const stats = computeStats(trades);
              if (!stats) return (
                <div className="text-center py-10 space-y-3">
                  <BarChart3 className="w-8 h-8 text-gray-700 mx-auto" />
                  <div className="text-xs text-gray-500">{t('stats_no_data')}</div>
                  <div className="text-[11px] text-gray-600">{t('stats_add_trades')}</div>
                </div>
              );
              return (
                <>
                  {/* Source badge */}
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <BarChart3 className="w-3 h-3" />
                    {t('stats_journal_label')} · {stats.total_trades} {t('stats_records')}
                    {tvConnected && (
                      <span className="ml-auto flex items-center gap-1 text-blue-400/60">
                        <Activity className="w-2.5 h-2.5" /> TradingView
                      </span>
                    )}
                  </div>

                  {/* Quick stats grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <StatCard icon={Trophy} label="Win Rate"
                      value={`${Math.round(stats.win_rate * 100)}%`}
                      color={stats.win_rate >= 0.5 ? "#22d3ee" : "#f87171"} />
                    <StatCard icon={TrendingUp} label="PnL"
                      value={`${stats.total_pnl >= 0 ? "+" : ""}$${Math.abs(stats.total_pnl).toLocaleString()}`}
                      color={stats.total_pnl >= 0 ? "#34d399" : "#f87171"} />
                    <StatCard icon={Target} label="Avg R:R"
                      value={stats.avg_rr > 0 ? `1:${stats.avg_rr.toFixed(1)}` : "—"}
                      color="#a78bfa" />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <StatCard icon={BarChart3} label={t('stats_trades_card')}
                      value={String(stats.total_trades)} color="#64748b" />
                    <StatCard icon={Clock} label={t('stats_avg_time')}
                      value={stats.avg_hold_mins !== null ? minsToLabel(stats.avg_hold_mins, t) : "—"} color="#f59e0b" />
                    <StatCard icon={Flame} label={t('stats_streak')}
                      value={`${stats.streak} W`} color="#22d3ee"
                      sub={stats.profit_factor > 0 ? `PF: ${stats.profit_factor.toFixed(2)}` : undefined} />
                  </div>

                  {/* Monthly PnL chart */}
                  {stats.monthly_pnl.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('stats_monthly_pnl')}</div>
                      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
                        <MiniPnlChart data={stats.monthly_pnl.map(d => ({ month: t(`month_${d.monthIdx}`), pnl: d.pnl }))} />
                      </div>
                    </div>
                  )}

                  {/* Top pairs */}
                  {stats.top_pairs.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('stats_top_pairs')}</div>
                      <div className="space-y-1">
                        {stats.top_pairs.map((pair) => (
                          <div key={pair.symbol}
                            className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border border-white/[0.04] rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-white">{pair.symbol}</span>
                              <span className="text-[10px] text-gray-500">{pair.trades} {t('stats_trade_abbr')}</span>
                            </div>
                            <span className={cn("text-xs font-semibold", pair.pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                              {pair.pnl >= 0 ? "+" : ""}${pair.pnl.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()
          ) : (
            /* ════ TRADINGVIEW TAB ════ */
            <>
              {tvConnected ? (
                /* Connected state */
                <div className="space-y-5">
                  {/* Connection status */}
                  <div className="bg-blue-500/[0.06] border border-blue-500/15 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-medium text-emerald-400">{t('tv_connected_status')}</span>
                      </div>
                      <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-all disabled:opacity-50"
                      >
                        <RefreshCw className={cn("w-3 h-3", syncing && "animate-spin")} />
                        {syncing ? t('tv_syncing') : t('tv_sync_btn')}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{t('tv_account_label')}</span>
                        <span className="text-xs text-white font-medium">@{authUser.tradingview!.username}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{t('tv_connected_since')}</span>
                        <span className="text-xs text-gray-300">
                          {new Date(authUser.tradingview!.connected_at).toLocaleDateString()}
                        </span>
                      </div>
                      {authUser.tradingview!.last_sync && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">{t('tv_last_sync_label')}</span>
                          <span className="text-xs text-gray-300">
                            {new Date(authUser.tradingview!.last_sync).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('tv_features_label')}</div>
                    {[
                      { icon: BarChart3, key: "tv_feature1" },
                      { icon: TrendingUp, key: "tv_feature2" },
                      { icon: Target, key: "tv_feature3" },
                      { icon: Activity, key: "tv_feature4" },
                    ].map((f) => (
                      <div key={f.key} className="flex items-center gap-2.5 px-3 py-2 bg-white/[0.02] border border-white/[0.04] rounded-lg">
                        <f.icon className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span className="text-xs text-gray-300">{t(f.key)}</span>
                        <Check className="w-3 h-3 text-emerald-400 ml-auto flex-shrink-0" />
                      </div>
                    ))}
                  </div>

                  {/* Open TradingView */}
                  <a
                    href={`https://www.tradingview.com/u/${authUser.tradingview!.username}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-xs font-medium text-blue-400 bg-blue-500/8 border border-blue-500/15 hover:bg-blue-500/15 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {t('tv_open_profile')}
                  </a>

                  {/* Disconnect */}
                  <button
                    onClick={handleTvDisconnect}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/15 transition-all"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    {t('tv_disconnect')}
                  </button>
                </div>
              ) : (
                /* Not connected state */
                <div className="space-y-5">
                  {/* Hero */}
                  <div className="text-center py-3">
                    <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))",
                        border: "1px solid rgba(59,130,246,0.2)",
                      }}>
                      <Activity className="w-7 h-7 text-blue-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">{t('tv_connect_title')}</h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed max-w-[280px] mx-auto">
                      {t('tv_connect_desc')}
                    </p>
                  </div>

                  {/* Connect form */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-medium">TradingView Username</label>
                      <input
                        type="text"
                        value={tvUsername}
                        onChange={(e) => setTvUsername(e.target.value)}
                        placeholder="your_username"
                        className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/40 transition-colors placeholder:text-gray-600"
                        onKeyDown={(e) => e.key === "Enter" && handleTvConnect()}
                      />
                    </div>

                    {tvError && (
                      <div className="text-[11px] text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">
                        {tvError}
                      </div>
                    )}

                    <button
                      onClick={handleTvConnect}
                      disabled={tvConnecting || !tvUsername.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
                      style={{
                        background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.15))",
                        border: "1px solid rgba(59,130,246,0.3)",
                        color: "#60a5fa",
                      }}
                    >
                      <Link2 className="w-4 h-4" />
                      {tvConnecting ? t('tv_connecting') : t('tv_connect_btn')}
                    </button>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('tv_benefits_label')}</div>
                    {["tv_benefit1","tv_benefit2","tv_benefit3","tv_benefit4","tv_benefit5"].map((key) => (
                      <div key={key} className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] border border-white/[0.04] rounded-lg">
                        <Check className="w-3 h-3 text-blue-400 flex-shrink-0" />
                        <span className="text-xs text-gray-400">{t(key)}</span>
                      </div>
                    ))}
                  </div>

                  {plan === "core" && (
                    <div className="text-center">
                      <div className="text-[10px] text-amber-400/60 bg-amber-500/6 border border-amber-500/10 rounded-lg px-3 py-2">
                        {t('tv_edge_required')}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        {!isEditing && (
          <div className="flex gap-2 px-5 py-3 flex-shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            {tab === "overview" && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] transition-all"
                >
                  <Edit2 size={13} />
                  {t('edit_profile_btn')}
                </button>
                <button
                  onClick={() => router.push("/profile")}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-200 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.05] transition-all"
                >
                  <ExternalLink size={13} />
                </button>
                <button
                  onClick={async () => { await logout(); onClose(); router.push("/"); }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400/70 hover:text-red-400 bg-red-500/[0.04] hover:bg-red-500/8 border border-red-500/10 transition-all"
                >
                  <LogOut size={13} />
                </button>
              </>
            )}
            {tab === "stats" && (
              <button
                onClick={() => router.push("/profile")}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: "linear-gradient(135deg, rgba(6,182,212,0.12), rgba(139,92,246,0.08))",
                  border: "1px solid rgba(6,182,212,0.2)",
                  color: "#22d3ee",
                }}
              >
                <ExternalLink size={13} />
                {t('full_stats_btn')}
              </button>
            )}
            {tab === "tradingview" && tvConnected && (
              <button
                onClick={() => setTab("stats")}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.15)",
                  color: "#60a5fa",
                }}
              >
                <BarChart3 size={13} />
                {t('view_stats_btn')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Subscription modal */}
      <SubscriptionModal
        isOpen={subOpen}
        onClose={() => setSubOpen(false)}
        currentPlan={plan}
        onUpgrade={(p) => setPlan(p)}
      />
    </div>
  );
}
