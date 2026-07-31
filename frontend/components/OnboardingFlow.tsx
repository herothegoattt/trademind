"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import {
  BookOpen, Brain, Users, Settings, ChevronRight,
  Check, Sparkles, X,
} from "lucide-react";

const ACCENT = "#7C6FE0";

const MARKETS = ["Forex", "Crypto", "Stocks", "Futures", "Other"] as const;
type Market = (typeof MARKETS)[number];

// ── Tour steps ─────────────────────────────────────────────────────────────────
const TOUR_STEPS = [
  {
    path: "/journal",
    navId: "journal",
    label: "Smart Journal",
    headline: "Every trade, perfectly logged",
    desc: "Log trades in seconds. The AI automatically detects your patterns, biases, and recurring mistakes — so you don't have to.",
    color: "#22d3ee",
    glow: "34,211,238",
    icon: BookOpen,
  },
  {
    path: "/trader-dna",
    navId: "trader-dna",
    label: "Trader DNA",
    headline: "Know your trading fingerprint",
    desc: "A deep-dive into how YOU trade. Win rates, best sessions, worst pairs, psychological tendencies — your personal edge map.",
    color: "#a78bfa",
    glow: "167,139,250",
    icon: Brain,
  },
  {
    path: "/community-edge",
    navId: "community-edge",
    label: "Community Edge",
    headline: "Signals from verified pros",
    desc: "Real-time setups and signals from vetted traders. See what works before you risk a cent.",
    color: "#34d399",
    glow: "52,211,153",
    icon: Users,
  },
  {
    path: "/setups",
    navId: "setups",
    label: "Setups Library",
    headline: "Battle-tested trading playbooks",
    desc: "Explore, save and refine proven setups. Share your own with the community. Never enter a trade blind again.",
    color: "#818cf8",
    glow: "129,140,248",
    icon: Settings,
  },
] as const;

// step index: -1=welcome  0..3=tour  4=market  5=congrats
type StepIdx = -1 | 0 | 1 | 2 | 3 | 4 | 5;

// The tour auto-shows exactly once, only for a brand-new sign-up. `tm_new_user`
// is set at registration; `tm_onboarded` is the permanent "already seen" guard.
// The "Replay" action in settings shows it again regardless of both flags.
const ONBOARDED_KEY = "tm_onboarded";
const NEW_USER_KEY = "tm_new_user";
const hasSeenTour = () =>
  typeof window !== "undefined" && localStorage.getItem(ONBOARDED_KEY) === "1";
const isNewSignup = () =>
  typeof window !== "undefined" && localStorage.getItem(NEW_USER_KEY) === "1";
const markTourSeen = () => {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDED_KEY, "1");
  localStorage.removeItem(NEW_USER_KEY);
};

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti() {
  const items = useRef(
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      dur: 1.1 + Math.random() * 0.9,
      color: ["#22d3ee", "#a78bfa", "#34d399", "#fb923c", "#f472b6"][i % 5],
      size: 4 + Math.random() * 4,
    }))
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.current.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: -8, x: `${p.x}%` }}
          animate={{ opacity: [0, 1, 1, 0], y: "110%" }}
          transition={{ duration: p.dur, delay: p.delay, ease: "easeIn" }}
          style={{ position: "absolute", top: 0, width: p.size, height: p.size * 0.4, borderRadius: 1, background: p.color }}
        />
      ))}
    </div>
  );
}

// ── Spotlight overlay ─────────────────────────────────────────────────────────
interface SpotlightRect { top: number; left: number; width: number; height: number }

function useContentRect(stepIdx: number): SpotlightRect {
  const getViewport = () => ({
    top: 0, left: 0,
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });
  const [rect, setRect] = useState<SpotlightRect>(getViewport);

  useLayoutEffect(() => {
    function measure() {
      const el = document.querySelector(".app-content") as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setRect(getViewport());
      }
    }
    measure();
    // Re-measure after route transition settles
    const t = setTimeout(measure, 250);
    window.addEventListener("resize", measure);
    return () => { clearTimeout(t); window.removeEventListener("resize", measure); };
  }, [stepIdx]);

  return rect;
}

// ── Main component ─────────────────────────────────────────────────────────────
export function OnboardingFlow() {
  const { user, isAuthenticated, markOnboarded } = useAuthStore();
  const router = useRouter();

  const [stepIdx, setStepIdx] = useState<StepIdx>(-1);
  const [visible, setVisible] = useState(false);
  const [selectedMarket, setMarket] = useState<Market | null>(null);
  const [navReady, setNavReady] = useState(false);
  const markedRef = useRef(false);
  const contentRect = useContentRect(stepIdx);

  // Auto-show ONLY for a brand-new sign-up, and only once. Existing users who
  // log in (no `tm_new_user` flag) never get the tour — it's purely opt-in for
  // them via Settings → Replay. Marking it seen up front guarantees "once".
  useEffect(() => {
    if (hasSeenTour() || markedRef.current) return;
    if (isAuthenticated && user && isNewSignup()) {
      markTourSeen();
      setStepIdx(-1);
      setVisible(true);
    }
  }, [isAuthenticated, user]);

  // Replay event from settings
  useEffect(() => {
    const handler = () => {
      setStepIdx(-1);
      setMarket(null);
      setNavReady(false);
      setVisible(true);
    };
    window.addEventListener("restart-tour", handler);
    return () => window.removeEventListener("restart-tour", handler);
  }, []);

  // Escape key
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape" && visible) handleSkip(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [visible]);

  // Navigate when a tour step activates
  useEffect(() => {
    if (stepIdx >= 0 && stepIdx <= 3) {
      setNavReady(false);
      const step = TOUR_STEPS[stepIdx as 0 | 1 | 2 | 3];
      router.push(step.path);
      // Small delay to let the page transition start
      const t = setTimeout(() => setNavReady(true), 420);
      return () => clearTimeout(t);
    }
  }, [stepIdx]);

  const handleSkip = async () => {
    if (!markedRef.current) {
      markedRef.current = true;
      markTourSeen();
      await markOnboarded(selectedMarket ?? undefined);
    }
    setVisible(false);
  };

  const handleNext = () => {
    if (stepIdx === -1) {
      setStepIdx(0);
    } else if (stepIdx >= 0 && stepIdx < 3) {
      setStepIdx((stepIdx + 1) as StepIdx);
    } else if (stepIdx === 3) {
      setStepIdx(4);
    } else if (stepIdx === 4) {
      if (!markedRef.current) {
        markedRef.current = true;
        markTourSeen();
        markOnboarded(selectedMarket ?? undefined);
      }
      setStepIdx(5);
    } else if (stepIdx === 5) {
      setVisible(false);
    }
  };

  if (!visible) return null;

  const isTourStep = stepIdx >= 0 && stepIdx <= 3;
  const currentTour = isTourStep ? TOUR_STEPS[stepIdx as 0 | 1 | 2 | 3] : null;

  // ── Welcome card (centered) ───────────────────────────────────────────────
  if (stepIdx === -1) {
    return (
      <>
        <div style={{ position: "fixed", inset: 0, zIndex: 9990, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} />
        <div style={{ position: "fixed", inset: 0, zIndex: 9991, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: "min(420px, calc(100vw - 28px))",
              background: "#080815",
              border: "1px solid rgba(124,111,224,0.2)",
              borderRadius: 18,
              overflow: "hidden",
              boxShadow: `0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(124,111,224,0.08)`,
              padding: "32px 28px 28px",
              position: "relative",
            }}
          >
            {/* top glow */}
            <div style={{ position: "absolute", top: -50, left: "20%", right: "20%", height: 100, background: `radial-gradient(ellipse, ${ACCENT}25, transparent 70%)`, pointerEvents: "none" }} />

            <button
              onClick={handleSkip}
              style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "rgba(100,116,139,0.4)", padding: 4, borderRadius: 6 }}
            >
              <X size={16} />
            </button>

            {/* Icon row */}
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              {TOUR_STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.navId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: [0, -4, 0] }}
                    transition={{ opacity: { duration: 0.3, delay: i * 0.08 }, y: { duration: 2.5 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: 0.6 + i * 0.15 } }}
                    style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}12`, border: `1px solid ${s.color}28`, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Icon size={18} color={s.color} />
                  </motion.div>
                );
              })}
            </div>

            <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
              {user?.name ? `Welcome, ${user.name.split(" ")[0]}` : "Welcome to TradeMind"}
            </h2>
            <p style={{ margin: "10px 0 0", fontSize: "0.84rem", color: "rgba(100,116,139,0.75)", lineHeight: 1.65 }}>
              A 30-second tour of what's inside — we'll navigate to each section together.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 28 }}>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={handleNext}
                style={{ height: 40, paddingInline: 24, borderRadius: 10, cursor: "pointer", background: `linear-gradient(135deg, ${ACCENT}, #5b8dff)`, border: "none", color: "#fff", fontSize: "0.84rem", fontFamily: "inherit", fontWeight: 600, display: "flex", alignItems: "center", gap: 7, boxShadow: `0 0 20px ${ACCENT}35` }}
              >
                Start the tour <ChevronRight size={15} />
              </motion.button>
              <button
                onClick={handleSkip}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", color: "rgba(100,116,139,0.5)", fontFamily: "inherit", padding: 0 }}
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  // ── Spotlight tour steps ──────────────────────────────────────────────────
  if (isTourStep && currentTour) {
    const Icon = currentTour.icon;
    const stepNum = (stepIdx as number) + 1;
    const totalSteps = TOUR_STEPS.length;

    return (
      <>
        {/* Click blocker */}
        <div style={{ position: "fixed", inset: 0, zIndex: 9988 }} />

        {/* Spotlight window — glides/morphs between sections as steps change */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            top: contentRect.top,
            left: contentRect.left,
            width: contentRect.width,
            height: contentRect.height,
            borderColor: `rgba(${currentTour.glow},0.4)`,
            boxShadow: `0 0 0 9999px rgba(0,0,0,0.72), inset 0 0 50px rgba(${currentTour.glow},0.05)`,
          }}
          transition={{ type: "spring", stiffness: 210, damping: 30, mass: 0.9 }}
          style={{
            position: "fixed",
            zIndex: 9989,
            borderStyle: "solid",
            borderWidth: 1.5,
            borderRadius: 8,
            pointerEvents: "none",
          }}
        />

        {/* Tooltip card — glides to each section; inner content cross-fades */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{
            opacity: navReady ? 1 : 0,
            scale: navReady ? 1 : 0.96,
            top: contentRect.top + 16,
            right: Math.max(16, window.innerWidth - contentRect.left - contentRect.width + 16),
            borderColor: `rgba(${currentTour.glow},0.3)`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(${currentTour.glow},0.08), 0 0 40px rgba(${currentTour.glow},0.12)`,
          }}
          transition={{ type: "spring", stiffness: 230, damping: 30, mass: 0.8 }}
          style={{
            position: "fixed",
            width: "min(320px, calc(100vw - 32px))",
            zIndex: 9995,
            background: "var(--bg-modal)",
            borderStyle: "solid",
            borderWidth: 1,
            borderRadius: 14,
            overflow: "hidden",
            backdropFilter: "blur(20px)",
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={stepIdx}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
          {/* Color accent bar */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${currentTour.color}80, transparent)` }} />

          <div style={{ padding: "16px 18px 18px" }}>
            {/* Step counter */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: 3,
                      width: i === stepIdx ? 20 : 6,
                      borderRadius: 2,
                      background: i <= stepIdx ? currentTour.color : "rgba(255,255,255,0.1)",
                      transition: "all 0.25s",
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: "0.68rem", fontFamily: "monospace", color: "rgba(100,116,139,0.45)", letterSpacing: "0.08em" }}>
                {String(stepNum).padStart(2, "0")}/{String(totalSteps).padStart(2, "0")}
              </span>
            </div>

            {/* Icon + label */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `rgba(${currentTour.glow},0.12)`, border: `1px solid rgba(${currentTour.glow},0.25)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={16} color={currentTour.color} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "0.7rem", letterSpacing: "0.08em", color: currentTour.color, fontFamily: "monospace", textTransform: "uppercase", opacity: 0.8 }}>
                  {currentTour.label}
                </p>
                <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  {currentTour.headline}
                </p>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(148,163,184,0.7)", lineHeight: 1.6, marginBottom: 16 }}>
              {currentTour.desc}
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={handleNext}
                style={{
                  height: 36, paddingInline: 18, borderRadius: 8, cursor: "pointer",
                  background: `linear-gradient(135deg, rgba(${currentTour.glow},0.3), rgba(${currentTour.glow},0.15))`,
                  border: `1px solid rgba(${currentTour.glow},0.4)`,
                  color: currentTour.color, fontSize: "0.8rem", fontFamily: "inherit", fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                {stepIdx === 3 ? "Personalise →" : "Next →"}
              </motion.button>
              <button
                onClick={handleSkip}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", color: "rgba(100,116,139,0.4)", fontFamily: "inherit", padding: 0 }}
              >
                Skip tour
              </button>
            </div>
          </div>
          </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Loading indicator while navigating — fades cleanly in/out */}
        <AnimatePresence>
          {!navReady && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ position: "fixed", top: contentRect.top + contentRect.height / 2 - 20, left: contentRect.left + contentRect.width / 2 - 20, zIndex: 9994 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{ width: 40, height: 40, borderRadius: "50%", border: `2px solid ${currentTour.color}30`, borderTopColor: currentTour.color }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ── Market selection (step 4) ─────────────────────────────────────────────
  if (stepIdx === 4) {
    return (
      <>
        <div style={{ position: "fixed", inset: 0, zIndex: 9990, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} />
        <div style={{ position: "fixed", inset: 0, zIndex: 9991, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: "min(400px, calc(100vw - 28px))", background: "#080815", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.8)", padding: "30px 26px 26px", position: "relative" }}
          >
            <div style={{ position: "absolute", top: -40, left: "25%", right: "25%", height: 80, background: `radial-gradient(ellipse, ${ACCENT}20, transparent 70%)`, pointerEvents: "none" }} />

            <p style={{ margin: 0, fontSize: "0.7rem", letterSpacing: "0.1em", color: `${ACCENT}bb`, fontFamily: "monospace", textTransform: "uppercase", marginBottom: 8 }}>
              Personalise
            </p>
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.025em" }}>
              What do you mainly trade?
            </h2>
            <p style={{ margin: "8px 0 0", fontSize: "0.8rem", color: "rgba(100,116,139,0.6)" }}>
              Tailors your Trader DNA and AI suggestions.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
              {MARKETS.map((m) => {
                const active = selectedMarket === m;
                return (
                  <motion.button
                    key={m}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setMarket(m)}
                    style={{ padding: "8px 18px", borderRadius: 10, cursor: "pointer", fontSize: "0.83rem", fontFamily: "inherit", fontWeight: active ? 600 : 400, background: active ? `${ACCENT}18` : "transparent", border: `1px solid ${active ? ACCENT + "55" : "rgba(255,255,255,0.08)"}`, color: active ? "#b4aeff" : "rgba(148,163,184,0.55)", transition: "all 0.15s" }}
                  >
                    {m}
                  </motion.button>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 24 }}>
              <motion.button
                whileHover={{ scale: selectedMarket ? 1.03 : 1 }} whileTap={{ scale: selectedMarket ? 0.97 : 1 }}
                onClick={handleNext}
                disabled={!selectedMarket}
                style={{ height: 38, paddingInline: 22, borderRadius: 9, cursor: selectedMarket ? "pointer" : "default", background: `linear-gradient(135deg, ${ACCENT}, #5b8dff)`, border: "none", color: "#fff", fontSize: "0.82rem", fontFamily: "inherit", fontWeight: 600, opacity: selectedMarket ? 1 : 0.35, display: "flex", alignItems: "center", gap: 6 }}
              >
                Continue <ChevronRight size={14} />
              </motion.button>
              <button
                onClick={() => { markOnboarded(undefined); setStepIdx(5); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.79rem", color: "rgba(100,116,139,0.5)", fontFamily: "inherit", padding: 0 }}
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  // ── Congratulations (step 5) ──────────────────────────────────────────────
  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 9990, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 9991, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: "min(400px, calc(100vw - 28px))", background: "#080815", border: "1px solid rgba(124,111,224,0.15)", borderRadius: 18, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.8)", padding: "32px 26px 28px", position: "relative", textAlign: "center" }}
        >
          <Confetti />

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            style={{ width: 68, height: 68, borderRadius: "50%", background: `${ACCENT}20`, border: `2px solid ${ACCENT}45`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", position: "relative" }}
          >
            <Sparkles size={28} color={ACCENT} />
            {[1, 2].map(r => (
              <motion.div
                key={r}
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1 + r * 0.55, opacity: 0 }}
                transition={{ duration: 1.3, delay: 0.2 + r * 0.15, repeat: Infinity }}
                style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${ACCENT}55` }}
              />
            ))}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.025em" }}
          >
            You're all set!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ margin: "8px 0 0", fontSize: "0.82rem", color: "rgba(100,116,139,0.7)", lineHeight: 1.65 }}
          >
            TradeMind is ready. Start logging trades to activate your Trader DNA.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
            style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 20 }}
          >
            {[
              { label: "Journal ready", color: "#22d3ee" },
              { label: "Trader DNA unlocks after 5 trades", color: "#a78bfa" },
              { label: "AI Mentor accessible from main screen", color: "#34d399" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.48 + i * 0.08 }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: `${item.color}07`, borderRadius: 8, border: `1px solid ${item.color}18` }}
              >
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${item.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Check size={11} color={item.color} />
                </div>
                <span style={{ fontSize: "0.77rem", color: "rgba(148,163,184,0.8)" }}>{item.label}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.72 }}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            style={{ width: "100%", height: 44, borderRadius: 11, cursor: "pointer", background: `linear-gradient(135deg, ${ACCENT}, #5b8dff)`, border: "none", color: "#fff", fontSize: "0.88rem", fontFamily: "inherit", fontWeight: 600, marginTop: 22, boxShadow: `0 0 28px ${ACCENT}30` }}
          >
            Start exploring TradeMind →
          </motion.button>
        </motion.div>
      </div>
    </>
  );
}
