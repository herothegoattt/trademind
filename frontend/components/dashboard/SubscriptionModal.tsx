"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Zap, Shield, Crown, Sparkles, Loader2, Ticket, Gift } from "lucide-react";
import { useT } from "../../lib/i18n";
import { useAuthStore } from "../../lib/auth-store";
import { ReferralModal } from "./ReferralModal";
import { AuthRequiredModal } from "../AuthRequiredModal";

export type Plan = "core" | "edge" | "apex";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: Plan;
  onUpgrade: (plan: Plan) => void;
}

const PLAN_ORDER: Plan[] = ["core", "edge", "apex"];

// Plan data uses translation keys
const PLAN_DEFS = [
  {
    id: "core" as Plan,
    name: "Core",
    price: 0,
    icon: Shield,
    color: "#64748b",
    border: "rgba(100,116,139,0.25)",
    bg: "rgba(100,116,139,0.05)",
    activeBorder: "rgba(100,116,139,0.5)",
    activeBg: "rgba(100,116,139,0.08)",
    featureKeys: ["plan_core_feat1","plan_core_feat2","plan_core_feat3","plan_core_feat4","plan_core_feat5"],
    missingKeys: ["plan_core_miss1","plan_core_miss2","plan_core_miss3","plan_core_miss4"],
    badgeKey: null as string | null,
  },
  {
    id: "edge" as Plan,
    name: "Edge",
    price: 29,
    icon: Zap,
    color: "#22d3ee",
    border: "rgba(34,211,238,0.2)",
    bg: "rgba(34,211,238,0.04)",
    activeBorder: "rgba(34,211,238,0.5)",
    activeBg: "rgba(34,211,238,0.07)",
    featureKeys: ["plan_edge_feat1","plan_edge_feat2","plan_edge_feat3","plan_edge_feat4","plan_edge_feat5","plan_edge_feat6"],
    missingKeys: ["plan_edge_miss1","plan_edge_miss2"],
    badgeKey: "plan_badge_popular" as string | null,
  },
  {
    id: "apex" as Plan,
    name: "Apex",
    price: 79,
    icon: Crown,
    color: "#a78bfa",
    border: "rgba(167,139,250,0.2)",
    bg: "rgba(167,139,250,0.04)",
    activeBorder: "rgba(167,139,250,0.5)",
    activeBg: "rgba(167,139,250,0.07)",
    featureKeys: ["plan_apex_feat1","plan_apex_feat2","plan_apex_feat3","plan_apex_feat4","plan_apex_feat5","plan_apex_feat6","plan_apex_feat7","plan_apex_feat8"],
    missingKeys: [] as string[],
    badgeKey: "plan_badge_best" as string | null,
  },
];

// ── Particle burst component ──────────────────────────────────────────────────
function Particles({ color }: { color: string }) {
  const particles = Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * 360;
    const dist  = 80 + Math.random() * 120;
    const x     = Math.cos((angle * Math.PI) / 180) * dist;
    const y     = Math.sin((angle * Math.PI) / 180) * dist;
    const size  = 3 + Math.random() * 4;
    const delay = Math.random() * 0.3;
    return { x, y, size, delay, angle };
  });

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
          transition={{ duration: 0.9 + Math.random() * 0.5, delay: p.delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 ${p.size * 2}px ${color}`,
          }}
        />
      ))}
    </div>
  );
}

// ── Congratulations overlay ───────────────────────────────────────────────────
function CongratsOverlay({
  plan,
  onClose,
}: {
  plan: (typeof PLAN_DEFS)[number];
  onClose: () => void;
}) {
  const t = useT();
  const PlanIcon = plan.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)" }}
    >
      {/* Close backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 280, mass: 0.9 }}
        className="relative z-10 w-full max-w-lg flex flex-col items-center text-center"
        style={{
          background: "rgba(7,9,18,0.97)",
          border: `1px solid ${plan.color}30`,
          borderRadius: 28,
          padding: "48px 36px 40px",
          boxShadow: `0 0 80px ${plan.color}18, 0 40px 100px rgba(0,0,0,0.8)`,
          overflow: "hidden",
        }}
      >
        {/* Top glow line */}
        <div
          className="absolute top-0 left-8 right-8 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${plan.color}80, transparent)` }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-white/08"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        {/* Icon burst */}
        <div className="relative mb-8" style={{ width: 80, height: 80 }}>
          <Particles color={plan.color} />
          <motion.div
            initial={{ scale: 0.4, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 14, stiffness: 200, delay: 0.15 }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center relative"
            style={{
              background: `${plan.color}14`,
              border: `1px solid ${plan.color}40`,
              boxShadow: `0 0 40px ${plan.color}30`,
            }}
          >
            <PlanIcon className="w-9 h-9" style={{ color: plan.color }} />
          </motion.div>
        </div>

        {/* Big text */}
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="font-extrabold leading-none mb-3"
          style={{
            fontSize: "clamp(2.4rem, 8vw, 3.6rem)",
            background: `linear-gradient(135deg, #fff 30%, ${plan.color})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.02em",
          }}
        >
          {t('congrats_text')}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-lg font-semibold mb-4"
          style={{ color: plan.color }}
        >
          {t('congrats_tagline')}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="text-sm text-gray-500 mb-8 leading-relaxed"
          style={{ maxWidth: 340 }}
        >
          {t('congrats_sub').replace('{plan}', plan.name)}
        </motion.p>

        {/* Plan badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.35 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full mb-8"
          style={{
            background: `${plan.color}10`,
            border: `1px solid ${plan.color}30`,
          }}
        >
          <PlanIcon className="w-4 h-4" style={{ color: plan.color }} />
          <span className="text-sm font-semibold" style={{ color: plan.color }}>
            {plan.name} Plan
          </span>
          <Sparkles className="w-3.5 h-3.5" style={{ color: plan.color, opacity: 0.7 }} />
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.35 }}
          onClick={onClose}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: `linear-gradient(135deg, ${plan.color}55, ${plan.color}30)`,
            border: `1px solid ${plan.color}50`,
            color: "#fff",
            boxShadow: `0 0 24px ${plan.color}18`,
          }}
        >
          {t('congrats_cta')}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export function SubscriptionModal({ isOpen, onClose, currentPlan, onUpgrade }: SubscriptionModalProps) {
  const t = useT();
  const token = useAuthStore((s) => s.token);
  const [selected, setSelected] = useState<Plan>(currentPlan);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [congratsPlan, setCongratsPlan] = useState<(typeof PLAN_DEFS)[number] | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discountPct: number; couponId?: string } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);

  const currentIdx  = PLAN_ORDER.indexOf(currentPlan);
  const selectedIdx = PLAN_ORDER.indexOf(selected);
  const isDowngrade = selectedIdx < currentIdx;
  const isSame      = selected === currentPlan;

  const handleConfirm = async () => {
    if (isSame || confirming) return;
    setError(null);

    // Require authentication
    const localToken = token || localStorage.getItem("access_token");
    if (!localToken) {
      setAuthOpen(true);
      return;
    }

    // Downgrade = show portal to cancel
    if (isDowngrade) {
      setConfirming(true);
      try {
        const res = await fetch("/api/v1/payments/customer-portal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ return_url: window.location.href }),
        });
        if (res.ok) {
          const { portal_url } = await res.json();
          window.location.href = portal_url;
          return;
        }
      } catch {}
      setConfirming(false);
      return;
    }

    // Free plan → paid plan: create Stripe Checkout session
    if (selected === "core") return; // core is free, nothing to pay
    setConfirming(true);
    try {
      const localToken = token || localStorage.getItem("access_token");
      const res = await fetch("/api/v1/payments/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localToken ? { Authorization: `Bearer ${localToken}` } : {}),
        },
        body: JSON.stringify({
          plan: selected,
          billing,
          success_url: `${window.location.origin}/app?plan_success=1`,
          cancel_url: window.location.href,
          coupon_id: promoApplied?.couponId ?? undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Payment setup failed");
      }

      const { checkout_url } = await res.json();
      window.location.href = checkout_url;
    } catch (e: any) {
      setError(e.message || "Payment failed. Please try again.");
      setConfirming(false);
    }
  };

  const handleCongratsClose = () => {
    setCongratsPlan(null);
    onClose();
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError(null);
    setPromoApplied(null);
    try {
      const localToken = token || localStorage.getItem("access_token");
      const res = await fetch("/api/v1/referral/validate-promo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localToken ? { Authorization: `Bearer ${localToken}` } : {}),
        },
        body: JSON.stringify({ code: promoCode.trim().toUpperCase(), plan: selected !== "core" ? selected : undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setPromoApplied({
          code: data.code,
          discountPct: data.discount_type === "percent" ? data.discount_value : 0,
          couponId: data.stripe_coupon_id,
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setPromoError(err.detail || "Invalid code");
      }
    } catch {
      setPromoError("Could not validate code");
    }
    setPromoLoading(false);
  };

  const discount = billing === "annual" ? 0.8 : 1;

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full flex flex-col"
              style={{
                maxWidth: 860,
                maxHeight: "90vh",
                background: "rgba(7,9,18,0.98)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20,
                boxShadow: "0 40px 100px rgba(0,0,0,0.85)",
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-7 py-5 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div>
                  <h2 className="text-base font-semibold text-white">{t('upgrade_access_title')}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{t('choose_plan_subtitle')}</p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Billing toggle */}
                  <div
                    className="flex items-center rounded-lg overflow-hidden text-xs"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {(["monthly", "annual"] as const).map((b) => (
                      <button
                        key={b}
                        onClick={() => setBilling(b)}
                        className="px-3 py-1.5 font-medium transition-all"
                        style={{
                          background: billing === b ? "rgba(255,255,255,0.08)" : "transparent",
                          color: billing === b ? "#e2e8f0" : "rgba(100,116,139,0.7)",
                        }}
                      >
                        {b === "annual" ? t('annual_billing') : t('monthly_billing')}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={onClose}
                    className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/06"
                    style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Plan cards */}
              <div className="flex-1 overflow-y-auto px-7 py-6">
                <div className="grid grid-cols-3 gap-4">
                  {PLAN_DEFS.map((plan) => {
                    const Icon      = plan.icon;
                    const isActive  = selected === plan.id;
                    const isCurrent = currentPlan === plan.id;
                    const price     = plan.price === 0 ? 0 : Math.round(plan.price * discount);

                    return (
                      <motion.div
                        key={plan.id}
                        onClick={() => setSelected(plan.id)}
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.15 }}
                        className="relative flex flex-col rounded-2xl cursor-pointer"
                        style={{
                          background: isActive ? plan.activeBg : plan.bg,
                          border: `1px solid ${isActive ? plan.activeBorder : plan.border}`,
                          padding: "20px",
                          transition: "background 0.2s, border-color 0.2s",
                        }}
                      >
                        {/* Badge */}
                        {(plan.badgeKey || isCurrent) && (
                          <div
                            className="absolute -top-px left-4 right-4 h-px"
                            style={{ background: `linear-gradient(90deg, transparent, ${plan.color}, transparent)` }}
                          />
                        )}
                        {plan.badgeKey && !isCurrent && (
                          <div
                            className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-widest px-2.5 py-0.5 rounded-full"
                            style={{
                              background: plan.activeBg,
                              border: `1px solid ${plan.activeBorder}`,
                              color: plan.color,
                            }}
                          >
                            {t(plan.badgeKey)}
                          </div>
                        )}
                        {isCurrent && (
                          <div
                            className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-widest px-2.5 py-0.5 rounded-full whitespace-nowrap"
                            style={{
                              background: "rgba(30,30,40,0.95)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "rgba(148,163,184,0.8)",
                            }}
                          >
                            {t('current_plan_badge')}
                          </div>
                        )}

                        {/* Icon + name */}
                        <div className="flex items-center gap-2.5 mb-4">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${plan.color}14`, border: `1px solid ${plan.color}30` }}
                          >
                            <Icon className="w-4 h-4" style={{ color: plan.color }} />
                          </div>
                          <span className="font-semibold text-sm text-white">{plan.name}</span>
                        </div>

                        {/* Price */}
                        <div className="mb-5">
                          {plan.price === 0 ? (
                            <div className="text-2xl font-bold" style={{ color: plan.color }}>{t('plan_free_label')}</div>
                          ) : (
                            <div className="flex items-end gap-1">
                              <span className="text-2xl font-bold" style={{ color: plan.color }}>${price}</span>
                              <span className="text-xs text-gray-500 mb-1">/ mo</span>
                            </div>
                          )}
                          {billing === "annual" && plan.price > 0 && (
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {t('billed_annually').replace('{amount}', String(Math.round(price * 12)))}
                            </div>
                          )}
                        </div>

                        {/* Divider */}
                        <div className="mb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} />

                        {/* Features */}
                        <div className="space-y-2 flex-1">
                          {plan.featureKeys.map((k) => (
                            <div key={k} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: plan.color }} />
                              <span className="text-xs text-gray-300 leading-relaxed">{t(k)}</span>
                            </div>
                          ))}
                          {plan.missingKeys.map((k) => (
                            <div key={k} className="flex items-start gap-2 opacity-35">
                              <div className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 flex items-center justify-center">
                                <div className="w-2.5 h-px bg-gray-600" />
                              </div>
                              <span className="text-xs text-gray-500 leading-relaxed">{t(k)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Select indicator */}
                        <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          <div
                            className="w-full h-8 rounded-lg flex items-center justify-center text-[11px] font-medium tracking-wide transition-all"
                            style={{
                              background: isActive ? `${plan.color}18` : "transparent",
                              border: `1px solid ${isActive ? plan.color + "40" : "rgba(255,255,255,0.07)"}`,
                              color: isActive ? plan.color : "rgba(100,116,139,0.6)",
                            }}
                          >
                            {isCurrent ? t('active_badge') : isActive ? t('selected_badge') : t('select_badge')}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div
                className="flex-shrink-0"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
              >
                {/* Promo code row */}
                {selected !== "core" && !isSame && (
                  <div className="px-7 py-3 flex items-center gap-2"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <Ticket className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                    {promoApplied ? (
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs font-mono font-bold text-violet-300 tracking-wider">{promoApplied.code}</span>
                        {promoApplied.discountPct > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 font-semibold border border-violet-500/25">
                            -{promoApplied.discountPct}%
                          </span>
                        )}
                        <span className="text-[10px] text-emerald-400">Applied ✓</span>
                        <button onClick={() => { setPromoApplied(null); setPromoCode(""); }}
                          className="ml-auto text-[10px] text-gray-600 hover:text-red-400 transition-colors">
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(null); }}
                          onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                          placeholder="Promo code..."
                          className="flex-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold tracking-widest bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/40 transition-colors"
                        />
                        <button
                          onClick={handleApplyPromo}
                          disabled={promoLoading || !promoCode.trim()}
                          className="px-3 py-1 rounded-lg text-xs font-semibold text-violet-300 bg-violet-500/10 border border-violet-500/25 hover:bg-violet-500/20 transition-all disabled:opacity-40"
                        >
                          {promoLoading ? "..." : "Apply"}
                        </button>
                        <button
                          onClick={() => setReferralOpen(true)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-gray-500 hover:text-cyan-400 transition-colors"
                        >
                          <Gift className="w-3 h-3" />
                          Deals
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {promoError && (
                  <div className="px-7 py-1.5 text-[11px] text-red-400">⚠ {promoError}</div>
                )}
                {error && (
                  <div className="px-7 pt-3 text-xs text-red-400 bg-red-500/5 border-b border-red-500/10 py-2">
                    {error}
                  </div>
                )}
                <div className="flex items-center justify-between px-7 py-4">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-600">{t('cancel_anytime')}</div>
                    <button
                      onClick={() => setReferralOpen(true)}
                      className="flex items-center gap-1.5 text-[10px] text-gray-600 hover:text-violet-400 transition-colors"
                    >
                      <Gift className="w-3 h-3" />
                      Earn credits
                    </button>
                  </div>
                  <div className="flex gap-2.5">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 transition-colors"
                      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={isSame || confirming}
                      className="px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      style={{
                        background: isSame
                          ? "rgba(255,255,255,0.05)"
                          : isDowngrade
                            ? "rgba(239,68,68,0.15)"
                            : "linear-gradient(135deg, rgba(139,92,246,0.7), rgba(6,182,212,0.7))",
                        border: isSame
                          ? "1px solid rgba(255,255,255,0.08)"
                          : isDowngrade
                            ? "1px solid rgba(239,68,68,0.3)"
                            : "1px solid rgba(139,92,246,0.4)",
                        color: isSame ? "#4b5563" : isDowngrade ? "#f87171" : "#fff",
                      }}
                    >
                      {confirming && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {confirming
                        ? t('processing_text')
                        : isSame
                          ? t('current_plan_btn')
                          : isDowngrade
                            ? `${t('downgrade_to')} ${PLAN_DEFS.find(p => p.id === selected)?.name}`
                            : `${t('upgrade_to_plan')} ${PLAN_DEFS.find(p => p.id === selected)?.name}`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* Congratulations overlay — rendered outside the modal AnimatePresence */}
    <AnimatePresence>
      {congratsPlan && (
        <CongratsOverlay plan={congratsPlan} onClose={handleCongratsClose} />
      )}
    </AnimatePresence>

    {/* Referral & Promo modal */}
    <ReferralModal isOpen={referralOpen} onClose={() => setReferralOpen(false)} />

    {/* Auth modal — shown when user tries to upgrade without being logged in */}
    <AuthRequiredModal
      isOpen={authOpen}
      onClose={() => setAuthOpen(false)}
      title="Sign in to upgrade"
      message="Create a free account or sign in to subscribe to a paid plan."
    />
    </>
  );
}
