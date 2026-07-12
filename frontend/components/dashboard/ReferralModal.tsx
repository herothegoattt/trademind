"use client";
/**
 * ReferralModal — Referral program + Promo codes panel.
 * Beautiful dark-themed modal with animated stats, share link, and promo input.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Copy, Check, Gift, Users, TrendingUp, Star, Zap,
  Link2, Ticket, ChevronRight, Crown, Sparkles, Share2,
  Trophy, Coins, ArrowRight, RefreshCw,
} from "lucide-react";
import { useAuthStore } from "../../lib/auth-store";
import { cn } from "../../lib/utils";
import type { Plan } from "../../lib/auth-store";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReferralStats {
  code: string;
  share_url: string;
  total_clicks: number;
  total_signups: number;
  total_conversions: number;
  total_earned_dollars: number;
  credits_balance_dollars: number;
  recent_uses: { status: string; date: string; reward_dollars: number }[];
}

interface PromoResult {
  valid: boolean;
  code: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  uses_remaining?: number | null;
}

// ─── Early-user promos (shown as featured deals) ─────────────────────────────
const FEATURED_PROMOS = [
  { code: "LAUNCH",   label: "Launch Special",  discount: "25% off",  limit: "500 uses",  icon: Zap,     color: "#22d3ee" },
  { code: "EARLY50",  label: "Early Adopter",   discount: "50% off",  limit: "100 uses",  icon: Star,    color: "#f59e0b" },
  { code: "VIP30",    label: "VIP Access",      discount: "30% off",  limit: "50 uses",   icon: Crown,   color: "#a78bfa" },
  { code: "ANNUAL20", label: "Annual Bonus",    discount: "20% off",  limit: "Unlimited", icon: Trophy,  color: "#34d399" },
];

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatPill({
  icon: Icon, label, value, color,
}: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl"
      style={{ background: `${color}0d`, border: `1px solid ${color}20` }}>
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

// ─── Animated number ─────────────────────────────────────────────────────────
function AnimNum({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) return;
    let start = 0;
    const step = value / 20;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
}

// ─── Copy button ─────────────────────────────────────────────────────────────
function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch { }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
        copied
          ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
          : "bg-white/[0.06] border border-white/[0.1] text-gray-300 hover:border-cyan-500/30 hover:text-cyan-300"
      )}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : (label || "Copy")}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReferralModal({ isOpen, onClose }: ReferralModalProps) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const currentPlan = (user?.plan as Plan) || "core";

  const [tab, setTab] = useState<"referral" | "promo">("referral");
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [copiedPromo, setCopiedPromo] = useState<string | null>(null);

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    ...(token || (typeof window !== "undefined" && localStorage.getItem("access_token"))
      ? { Authorization: `Bearer ${token || localStorage.getItem("access_token")}` }
      : {}),
  }), [token]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/referral/my-code", { headers: authHeaders() });
      if (res.ok) setStats(await res.json());
    } catch {}
    setLoading(false);
  }, [authHeaders]);

  useEffect(() => {
    if (isOpen && tab === "referral") fetchStats();
  }, [isOpen, tab]);

  const validatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError(null);
    setPromoResult(null);
    try {
      const res = await fetch("/api/v1/referral/validate-promo", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ code: promoCode.trim().toUpperCase() }),
      });
      if (res.ok) {
        setPromoResult(await res.json());
      } else {
        const err = await res.json().catch(() => ({}));
        setPromoError(err.detail || "Invalid promo code");
      }
    } catch {
      setPromoError("Something went wrong. Try again.");
    }
    setPromoLoading(false);
  };

  const copyFeaturedPromo = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedPromo(code);
    setTimeout(() => setCopiedPromo(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[55] bg-black/75 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            className="fixed inset-0 z-[56] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full flex flex-col overflow-hidden"
              style={{
                maxWidth: 560,
                maxHeight: "90vh",
                background: "rgba(6,7,18,0.99)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 24,
                boxShadow: "0 0 80px rgba(139,92,246,0.1), 0 40px 100px rgba(0,0,0,0.9)",
              }}
            >
              {/* ── Glow top line ── */}
              <div className="absolute top-0 left-8 right-8 h-px"
                style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.6), rgba(34,211,238,0.4), transparent)" }} />

              {/* ── Header ── */}
              <div className="flex items-center justify-between px-6 py-5 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(34,211,238,0.15))", border: "1px solid rgba(167,139,250,0.3)" }}>
                    <Gift className="w-4.5 h-4.5 text-violet-400" style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Referrals & Promos</h2>
                    <p className="text-[11px] text-gray-500">Earn credits · Share discounts</p>
                  </div>
                </div>
                <button onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                  <X size={14} className="text-gray-500" />
                </button>
              </div>

              {/* ── Tab bar ── */}
              <div className="flex px-6 pt-4 gap-1 flex-shrink-0">
                {([
                  { id: "referral", label: "Refer Friends", icon: Users },
                  { id: "promo",    label: "Promo Codes",   icon: Ticket },
                ] as const).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all",
                      tab === id
                        ? "bg-white/[0.08] text-white"
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* ── Content ── */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                {/* ════ REFERRAL TAB ════ */}
                {tab === "referral" && (
                  <>
                    {/* Hero banner */}
                    <div className="relative rounded-2xl overflow-hidden p-5"
                      style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.1), rgba(34,211,238,0.06))", border: "1px solid rgba(167,139,250,0.18)" }}>
                      <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
                        style={{ background: "radial-gradient(circle, rgba(167,139,250,0.15), transparent 70%)", filter: "blur(20px)" }} />
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-1">Referral Program</div>
                          <div className="text-xl font-bold text-white mb-1">Earn $10 per friend</div>
                          <div className="text-[11px] text-gray-400 leading-relaxed max-w-[260px]">
                            Your friend gets <span className="text-cyan-400 font-medium">15% off</span> their first plan.
                            You get <span className="text-violet-400 font-medium">$10 credit</span> when they upgrade.
                          </div>
                        </div>
                        <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
                          style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(34,211,238,0.1))", border: "1px solid rgba(167,139,250,0.3)" }}>
                          <Coins className="w-7 h-7 text-violet-300" />
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-5 h-5 text-gray-600 animate-spin" />
                      </div>
                    ) : stats ? (
                      <>
                        <div className="grid grid-cols-3 gap-3">
                          <StatPill icon={Link2}     label="Clicks"      value={String(stats.total_clicks)}      color="#22d3ee" />
                          <StatPill icon={Users}     label="Sign-ups"    value={String(stats.total_signups)}     color="#a78bfa" />
                          <StatPill icon={TrendingUp} label="Upgrades"   value={String(stats.total_conversions)} color="#34d399" />
                        </div>

                        {/* Credits balance */}
                        <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl"
                          style={{ background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.12)" }}>
                          <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Your Credit Balance</div>
                            <div className="text-2xl font-bold text-cyan-300">
                              $<AnimNum value={stats.credits_balance_dollars} />
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-gray-500 mb-0.5">Total earned</div>
                            <div className="text-sm font-semibold text-gray-300">${stats.total_earned_dollars.toFixed(2)}</div>
                          </div>
                        </div>

                        {/* Referral link */}
                        <div>
                          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Your Referral Link</div>
                          <div className="flex items-center gap-2 p-3 rounded-xl"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <span className="text-xs text-gray-400 truncate flex-1 font-mono">{stats.share_url}</span>
                            <CopyBtn text={stats.share_url} label="Copy link" />
                          </div>
                        </div>

                        {/* Code */}
                        <div>
                          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Your Code</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl"
                              style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.2)" }}>
                              <span className="text-base font-bold tracking-[0.1em] text-violet-300">{stats.code}</span>
                            </div>
                            <CopyBtn text={stats.code} label="Copy code" />
                            <button
                              onClick={async () => {
                                const text = `Join TradeMind — the AI trading intelligence platform. Use my code ${stats.code} for 15% off: ${stats.share_url}`;
                                try { await navigator.share?.({ title: "TradeMind", text, url: stats.share_url }); }
                                catch { await navigator.clipboard.writeText(text); }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.05] border border-white/[0.08] text-gray-300 hover:bg-white/[0.08] transition-all"
                            >
                              <Share2 className="w-3 h-3" />
                              Share
                            </button>
                          </div>
                        </div>

                        {/* How it works */}
                        <div className="space-y-2">
                          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">How it works</div>
                          {[
                            { n: "1", text: "Share your link or code with traders", color: "#22d3ee" },
                            { n: "2", text: "They get 15% off their first plan", color: "#a78bfa" },
                            { n: "3", text: "You earn $10 when they upgrade", color: "#34d399" },
                          ].map(({ n, text, color }) => (
                            <div key={n} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                                style={{ background: `${color}18`, border: `1px solid ${color}35`, color }}>
                                {n}
                              </div>
                              <span className="text-xs text-gray-300">{text}</span>
                            </div>
                          ))}
                        </div>

                        {/* Recent activity */}
                        {stats.recent_uses.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Recent Activity</div>
                            {stats.recent_uses.map((u, i) => (
                              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg"
                                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    u.status === "rewarded" ? "bg-emerald-400" : u.status === "converted" ? "bg-cyan-400" : "bg-gray-500"
                                  )} />
                                  <span className="text-xs text-gray-400 capitalize">{u.status.replace("_", " ")}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  {u.reward_dollars > 0 && (
                                    <span className="text-xs font-semibold text-emerald-400">+${u.reward_dollars.toFixed(2)}</span>
                                  )}
                                  <span className="text-[10px] text-gray-600">
                                    {new Date(u.date).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-sm text-gray-500">Could not load referral data</div>
                    )}
                  </>
                )}

                {/* ════ PROMO TAB ════ */}
                {tab === "promo" && (
                  <>
                    {/* Promo input */}
                    <div className="space-y-3">
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Apply Promo Code</div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(null); setPromoResult(null); }}
                          onKeyDown={(e) => e.key === "Enter" && validatePromo()}
                          placeholder="ENTER CODE..."
                          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-mono font-bold tracking-widest text-white placeholder:text-gray-600 focus:outline-none transition-colors"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: promoError
                              ? "1px solid rgba(239,68,68,0.4)"
                              : promoResult
                                ? "1px solid rgba(52,211,153,0.4)"
                                : "1px solid rgba(255,255,255,0.08)",
                          }}
                        />
                        <button
                          onClick={validatePromo}
                          disabled={promoLoading || !promoCode.trim()}
                          className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 flex items-center gap-2"
                          style={{
                            background: "linear-gradient(135deg, rgba(167,139,250,0.3), rgba(34,211,238,0.2))",
                            border: "1px solid rgba(167,139,250,0.4)",
                            color: "#c4b5fd",
                          }}
                        >
                          {promoLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                          Apply
                        </button>
                      </div>

                      {/* Result */}
                      <AnimatePresence>
                        {promoError && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400"
                            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
                          >
                            <X className="w-3.5 h-3.5 flex-shrink-0" />
                            {promoError}
                          </motion.div>
                        )}
                        {promoResult && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-start gap-3 px-4 py-3 rounded-xl"
                            style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.2)" }}
                          >
                            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-sm font-bold text-emerald-300">
                                {promoResult.discount_type === "percent"
                                  ? `${promoResult.discount_value}% off`
                                  : `$${(promoResult.discount_value / 100).toFixed(0)} off`}
                                {" "}<span className="text-white">applied!</span>
                              </div>
                              {promoResult.description && (
                                <div className="text-xs text-gray-400 mt-0.5">{promoResult.description}</div>
                              )}
                              {promoResult.uses_remaining !== null && promoResult.uses_remaining !== undefined && (
                                <div className="text-[10px] text-gray-500 mt-1">{promoResult.uses_remaining} uses remaining</div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                      <span className="text-[10px] text-gray-600 uppercase tracking-wider">Featured Deals</span>
                      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                    </div>

                    {/* Featured promos */}
                    <div className="space-y-2.5">
                      {FEATURED_PROMOS.map((p) => {
                        const Icon = p.icon;
                        const isCopied = copiedPromo === p.code;
                        return (
                          <motion.div
                            key={p.code}
                            whileHover={{ y: -1 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer group"
                            style={{
                              background: `${p.color}0a`,
                              border: `1px solid ${p.color}22`,
                            }}
                          >
                            {/* Icon */}
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: `${p.color}18`, border: `1px solid ${p.color}30` }}>
                              <Icon className="w-4 h-4" style={{ color: p.color }} />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{p.label}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold"
                                  style={{ background: `${p.color}18`, color: p.color }}>
                                  {p.discount}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] font-mono font-bold tracking-widest" style={{ color: p.color }}>
                                  {p.code}
                                </span>
                                <span className="text-[10px] text-gray-600">· {p.limit}</span>
                              </div>
                            </div>

                            {/* Copy */}
                            <button
                              onClick={() => copyFeaturedPromo(p.code)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex-shrink-0",
                                isCopied
                                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                                  : "bg-white/[0.05] border border-white/[0.08] text-gray-400 group-hover:border-white/[0.15] group-hover:text-gray-200"
                              )}
                            >
                              {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {isCopied ? "Copied" : "Copy"}
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Note */}
                    <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                      Codes apply to your next subscription payment. One code per checkout.
                      <br />Early-user codes are limited — grab them while they last.
                    </p>
                  </>
                )}
              </div>

              {/* ── Footer ── */}
              <div className="flex-shrink-0 px-6 py-4"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                {tab === "referral" ? (
                  <p className="text-[10px] text-gray-600 text-center">
                    Credits are applied to future invoices. $10 per paid referral, unlimited referrals.
                  </p>
                ) : (
                  <p className="text-[10px] text-gray-600 text-center">
                    Promo codes apply once at checkout. Cannot be combined with other offers.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
