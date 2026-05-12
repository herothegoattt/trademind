"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/auth-store";
import { tradeAPI } from "@/lib/trade-api";
import {
  BookOpen, Brain, Users, MessageSquare, TrendingUp,
  ChevronRight, Check, Sparkles, Zap,
} from "lucide-react";

const ACCENT = "#7C6FE0";
const MARKETS = ["Forex", "Crypto", "Stocks", "Futures", "Other"] as const;
type Market = (typeof MARKETS)[number];

// 0=welcome  1=features  2=market  3=congrats
type Step = 0 | 1 | 2 | 3;

const FEATURES = [
  {
    icon: BookOpen,
    label: "Smart Journal",
    desc: "Log every trade. Spot patterns automatically.",
    color: "#22d3ee",
    glow: "rgba(34,211,238,0.15)",
    from: { x: -60, y: 20, rotate: -6 },
  },
  {
    icon: Brain,
    label: "Trader DNA",
    desc: "Your AI trading fingerprint — know your edge.",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.15)",
    from: { x: 60, y: -20, rotate: 5 },
  },
  {
    icon: Users,
    label: "Community Edge",
    desc: "Signals from verified pro traders. Stay ahead.",
    color: "#34d399",
    glow: "rgba(52,211,153,0.15)",
    from: { x: -40, y: -30, rotate: -4 },
  },
  {
    icon: MessageSquare,
    label: "AI Mentor",
    desc: "Ask anything. Instant market analysis.",
    color: "#fb923c",
    glow: "rgba(251,146,60,0.15)",
    from: { x: 50, y: 30, rotate: 6 },
  },
] as const;

// ── Confetti particle ──────────────────────────────────────────────────────────
function Confetti() {
  const items = useRef(
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.6,
      dur: 1.2 + Math.random() * 0.8,
      color: ["#22d3ee", "#a78bfa", "#34d399", "#fb923c", "#f472b6"][i % 5],
      size: 4 + Math.random() * 5,
      rotate: Math.random() * 360,
    }))
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.current.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: -10, x: `${p.x}%`, rotate: p.rotate }}
          animate={{ opacity: [0, 1, 1, 0], y: "110%", rotate: p.rotate + 180 }}
          transition={{ duration: p.dur, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "absolute",
            top: 0,
            width: p.size,
            height: p.size * 0.45,
            borderRadius: 1,
            background: p.color,
          }}
        />
      ))}
    </div>
  );
}

// ── Feature card ───────────────────────────────────────────────────────────────
function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[number];
  index: number;
}) {
  const Icon = feature.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: feature.from.x, y: feature.from.y, rotate: feature.from.rotate, scale: 0.85 }}
      animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${feature.color}28`,
        borderRadius: 10,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: `0 0 20px ${feature.glow}`,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: `${feature.color}15`,
          border: `1px solid ${feature.color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={feature.color} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#e2e8f0", letterSpacing: "-0.01em" }}>
          {feature.label}
        </p>
        <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(100,116,139,0.7)", lineHeight: 1.4 }}>
          {feature.desc}
        </p>
      </div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function OnboardingFlow() {
  const { user, isAuthenticated, markOnboarded } = useAuthStore();

  const [step, setStep] = useState<Step>(0);
  const [visible, setVisible] = useState(false);
  const [selectedMarket, setMarket] = useState<Market | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const markedRef = useRef(false);

  // Show for new users (is_onboarded === false) or on replay request
  useEffect(() => {
    if (isAuthenticated && user && user.is_onboarded === false) {
      setVisible(true);
      if (!markedRef.current) {
        markedRef.current = true;
      }
    }
  }, [isAuthenticated, user]);

  // Listen for replay event dispatched by BottomSheetSettings
  useEffect(() => {
    const handler = () => {
      setStep(0);
      setMarket(null);
      setVisible(true);
    };
    window.addEventListener("restart-tour", handler);
    return () => window.removeEventListener("restart-tour", handler);
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape" && visible) dismiss();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [visible]);

  const dismiss = () => setVisible(false);

  const handleSkip = async () => {
    await markOnboarded(selectedMarket ?? undefined);
    setStep(3); // jump to congrats
  };

  const handleMarketNext = async () => {
    if (selectedMarket) await markOnboarded(selectedMarket);
    setStep(3);
  };

  const handleFinish = () => {
    dismiss();
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, zIndex: 9990, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      />

      {/* Card container */}
      <div style={{ position: "fixed", inset: 0, zIndex: 9991, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{
              pointerEvents: "auto",
              width: "min(420px, calc(100vw - 24px))",
              background: "#080815",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,111,224,0.08)",
              position: "relative",
            }}
          >
            {/* Ambient glow top */}
            <div style={{ position: "absolute", top: -40, left: "30%", right: "30%", height: 80, background: `radial-gradient(ellipse, ${ACCENT}20, transparent 70%)`, pointerEvents: "none" }} />

            {/* Header bar with progress */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {/* Step dots */}
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                {([0, 1, 2, 3] as Step[]).map((s) => (
                  <motion.div
                    key={s}
                    animate={{
                      width: s === step ? 18 : 5,
                      background: s === step ? ACCENT : s < step ? `${ACCENT}55` : "rgba(255,255,255,0.08)",
                    }}
                    style={{ height: 4, borderRadius: 2 }}
                    transition={{ duration: 0.25 }}
                  />
                ))}
              </div>
              {step < 3 && (
                <button
                  onClick={handleSkip}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.7rem", color: "rgba(100,116,139,0.45)", fontFamily: "inherit", letterSpacing: "0.04em", padding: 0, lineHeight: 1 }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(148,163,184,0.7)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(100,116,139,0.45)")}
                >
                  skip all
                </button>
              )}
            </div>

            {/* Body */}
            <div style={{ padding: "26px 22px 22px" }}>

              {/* ── Step 0: Welcome ── */}
              {step === 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {/* Floating icon cluster */}
                  <div style={{ position: "relative", height: 68, overflow: "visible" }}>
                    {[
                      { icon: TrendingUp, color: "#22d3ee", top: 8,  left: 12,  size: 32, delay: 0 },
                      { icon: Brain,      color: "#a78bfa", top: 4,  left: 120, size: 38, delay: 0.1 },
                      { icon: Users,      color: "#34d399", top: 20, left: 220, size: 30, delay: 0.15 },
                      { icon: Zap,        color: "#fb923c", top: 10, left: 310, size: 28, delay: 0.2 },
                    ].map(({ icon: Icon, color, top, left, size, delay }, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: [0, -4, 0] }}
                        transition={{ duration: 0.4, delay, y: { duration: 2.5 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: delay + 0.5 } }}
                        style={{ position: "absolute", top, left, width: size, height: size, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <Icon size={size * 0.5} color={color} />
                      </motion.div>
                    ))}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 600, color: "#f1f5f9", letterSpacing: "-0.025em", lineHeight: 1.25 }}>
                      {user?.name ? `Hey ${user.name.split(" ")[0]}, welcome` : "Welcome to TradeMind"}
                    </h2>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(100,116,139,0.75)", lineHeight: 1.65 }}>
                      A quick tour of what's inside — takes under 30 seconds.
                      <br />Or jump straight in.
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setStep(1)}
                      style={{ height: 38, paddingInline: 22, borderRadius: 8, cursor: "pointer", background: `linear-gradient(135deg, ${ACCENT}, #5b8dff)`, border: "none", color: "#fff", fontSize: "0.82rem", fontFamily: "inherit", fontWeight: 600, letterSpacing: "0.01em", display: "flex", alignItems: "center", gap: 6 }}
                    >
                      Show me around <ChevronRight size={14} />
                    </motion.button>
                    <button
                      onClick={dismiss}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", color: "rgba(100,116,139,0.5)", fontFamily: "inherit", padding: 0 }}
                      onMouseEnter={e => (e.currentTarget.style.color = "rgba(148,163,184,0.7)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(100,116,139,0.5)")}
                    >
                      Skip setup
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 1: Feature showcase ── */}
              {step === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ margin: 0, fontSize: "0.72rem", letterSpacing: "0.1em", color: "rgba(124,111,224,0.7)", fontFamily: "monospace", textTransform: "uppercase", marginBottom: 6 }}>
                      What's inside
                    </motion.p>
                    <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ margin: 0, fontSize: "1.2rem", fontWeight: 600, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
                      Your full trading stack
                    </motion.h2>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {FEATURES.map((f, i) => (
                      <FeatureCard key={f.label} feature={f} index={i} />
                    ))}
                  </div>

                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setStep(2)}
                    style={{ alignSelf: "flex-start", height: 36, paddingInline: 20, borderRadius: 8, cursor: "pointer", background: ACCENT, border: "none", color: "#fff", fontSize: "0.8rem", fontFamily: "inherit", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
                  >
                    Next <ChevronRight size={13} />
                  </motion.button>
                </div>
              )}

              {/* ── Step 2: Market selection ── */}
              {step === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div>
                    <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ margin: 0, fontSize: "0.72rem", letterSpacing: "0.1em", color: "rgba(124,111,224,0.7)", fontFamily: "monospace", textTransform: "uppercase", marginBottom: 6 }}>
                      Personalise
                    </motion.p>
                    <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ margin: 0, fontSize: "1.2rem", fontWeight: 600, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
                      What do you mainly trade?
                    </motion.h2>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "rgba(100,116,139,0.6)" }}>
                      Tailors your Trader DNA and AI suggestions.
                    </motion.p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                    style={{ display: "flex", flexWrap: "wrap", gap: 7 }}
                  >
                    {MARKETS.map((m) => {
                      const active = selectedMarket === m;
                      return (
                        <motion.button
                          key={m}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setMarket(m)}
                          style={{
                            padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                            fontSize: "0.82rem", fontFamily: "inherit", fontWeight: active ? 600 : 400,
                            background: active ? `${ACCENT}18` : "transparent",
                            border: `1px solid ${active ? ACCENT + "55" : "rgba(255,255,255,0.08)"}`,
                            color: active ? "#b4aeff" : "rgba(148,163,184,0.55)",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {m}
                        </motion.button>
                      );
                    })}
                  </motion.div>

                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <motion.button
                      whileHover={{ scale: selectedMarket ? 1.03 : 1 }}
                      whileTap={{ scale: selectedMarket ? 0.97 : 1 }}
                      onClick={handleMarketNext}
                      disabled={!selectedMarket}
                      style={{ height: 38, paddingInline: 22, borderRadius: 8, cursor: selectedMarket ? "pointer" : "default", background: `linear-gradient(135deg, ${ACCENT}, #5b8dff)`, border: "none", color: "#fff", fontSize: "0.82rem", fontFamily: "inherit", fontWeight: 600, opacity: selectedMarket ? 1 : 0.35, display: "flex", alignItems: "center", gap: 6 }}
                    >
                      Continue <ChevronRight size={14} />
                    </motion.button>
                    <button
                      onClick={() => { markOnboarded(undefined); setStep(3); }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", color: "rgba(100,116,139,0.5)", fontFamily: "inherit", padding: 0 }}
                      onMouseEnter={e => (e.currentTarget.style.color = "rgba(148,163,184,0.7)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(100,116,139,0.5)")}
                    >
                      Skip for now
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 3: Congratulations ── */}
              {step === 3 && (
                <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 22, alignItems: "center", textAlign: "center", paddingBlock: 8 }}>
                  <Confetti />

                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 280, damping: 18 }}
                    style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, ${ACCENT}30, #5b8dff20)`, border: `2px solid ${ACCENT}50`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      <Sparkles size={26} color={ACCENT} />
                    </motion.div>
                    {/* Rings */}
                    {[1, 2].map(r => (
                      <motion.div
                        key={r}
                        initial={{ scale: 1, opacity: 0.6 }}
                        animate={{ scale: 1 + r * 0.5, opacity: 0 }}
                        transition={{ duration: 1.2, delay: 0.2 + r * 0.15, repeat: Infinity }}
                        style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${ACCENT}60` }}
                      />
                    ))}
                  </motion.div>

                  <div>
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.025em" }}
                    >
                      You're all set!
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      style={{ margin: "8px 0 0", fontSize: "0.83rem", color: "rgba(100,116,139,0.7)", lineHeight: 1.6 }}
                    >
                      TradeMind is ready. Start logging trades to<br />activate your Trader DNA.
                    </motion.p>
                  </div>

                  {/* Checklist */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {[
                      { label: "Journal ready", color: "#22d3ee" },
                      { label: "Trader DNA unlocked after 5 trades", color: "#a78bfa" },
                      { label: "AI Mentor available now", color: "#34d399" },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: `${item.color}08`, borderRadius: 8, border: `1px solid ${item.color}18` }}
                      >
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${item.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Check size={11} color={item.color} />
                        </div>
                        <span style={{ fontSize: "0.78rem", color: "rgba(148,163,184,0.8)" }}>{item.label}</span>
                      </motion.div>
                    ))}
                  </motion.div>

                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.75 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleFinish}
                    style={{ width: "100%", height: 42, borderRadius: 10, cursor: "pointer", background: `linear-gradient(135deg, ${ACCENT}, #5b8dff)`, border: "none", color: "#fff", fontSize: "0.88rem", fontFamily: "inherit", fontWeight: 600, letterSpacing: "0.01em", boxShadow: `0 0 24px ${ACCENT}30` }}
                  >
                    Start exploring TradeMind →
                  </motion.button>
                </div>
              )}

            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
