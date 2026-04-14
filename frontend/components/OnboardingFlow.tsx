"use client";

import { useState, useEffect, useRef, CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/auth-store";
import { tradeAPI } from "@/lib/trade-api";

const ACCENT   = "#7C6FE0";
const MARKETS  = ["Forex", "Crypto", "Stocks", "Futures", "Other"] as const;
type Market    = (typeof MARKETS)[number];
type Step      = 1 | 2 | 3 | "toast";

// ─── Shared primitives ─────────────────────────────────────────────────────────
const field: CSSProperties = {
  width: "100%",
  height: 40,
  background: "transparent",
  border: "none",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  color: "#e2e8f0",
  fontSize: "0.875rem",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
  padding: "0 2px",
  letterSpacing: "0.01em",
};

// ─── Component ─────────────────────────────────────────────────────────────────
export function OnboardingFlow() {
  const { user, isAuthenticated, markOnboarded } = useAuthStore();

  const [step, setStep]             = useState<Step>(1);
  const [visible, setVisible]       = useState(false);
  const [selectedMarket, setMarket] = useState<Market | null>(null);
  const [symbol, setSymbol]         = useState("");
  const [direction, setDir]         = useState<"long" | "short">("long");
  const [pnl, setPnl]               = useState("");
  const [submitting, setSubmitting] = useState(false);
  const markedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user && user.is_onboarded === false) {
      setVisible(true);
      if (!markedRef.current) {
        markedRef.current = true;
        markOnboarded(undefined);
      }
    }
  }, [isAuthenticated, user, markOnboarded]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape" && visible) dismiss(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [visible]);

  const dismiss   = () => setVisible(false);
  const goToStep  = (s: Step) => setStep(s);

  const handleMarketContinue = async () => {
    if (selectedMarket) await markOnboarded(selectedMarket);
    goToStep(3);
  };

  const handleAddTrade = async () => {
    setSubmitting(true);
    try {
      await tradeAPI.createTrade({
        symbol:   symbol.trim() || "N/A",
        type:     direction,
        entry:    0,
        duration: "N/A",
        notes:    "Added via onboarding",
        pnl:      pnl !== "" ? parseFloat(pnl) : undefined,
      });
    } catch { /* silently skip */ }
    setSubmitting(false);
    showToast();
  };

  const showToast = () => {
    goToStep("toast");
    setTimeout(() => setVisible(false), 3200);
  };

  if (!visible) return null;

  // ── Toast ─────────────────────────────────────────────────────────────────────
  if (step === "toast") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0  }}
          exit={{    opacity: 0, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
            zIndex: 9999,
            display: "flex", alignItems: "center", gap: 10,
            background: "#0f0e1c",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            padding: "10px 18px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#34d399", flexShrink: 0,
            boxShadow: "0 0 8px rgba(52,211,153,0.5)",
          }} />
          <span style={{ fontSize: "0.82rem", color: "#94a3b8", letterSpacing: "0.01em" }}>
            You're all set.{" "}
            <span style={{ color: "rgba(148,163,184,0.45)" }}>
              Trader DNA activates after 5 trades.
            </span>
          </span>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── Card ──────────────────────────────────────────────────────────────────────
  const stepNum = step as number;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{    opacity: 0 }}
        onClick={dismiss}
        style={{
          position: "fixed", inset: 0, zIndex: 9990,
          background: "rgba(0,0,0,0.55)",
        }}
      />

      {/* Card wrapper */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9991,
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "none",
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8  }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{
              pointerEvents: "auto",
              width: "min(400px, calc(100vw - 24px))",
              background: "#0b0a18",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
            }}
          >
            {/* ── Top bar ── */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}>
              {/* Step indicator — dots */}
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                {([1, 2, 3] as const).map((s) => (
                  <div key={s} style={{
                    height: 4, borderRadius: 2,
                    width: s === stepNum ? 16 : 4,
                    background: s === stepNum
                      ? ACCENT
                      : s < stepNum
                      ? "rgba(124,111,224,0.35)"
                      : "rgba(255,255,255,0.08)",
                    transition: "all 0.25s ease",
                  }} />
                ))}
                <span style={{
                  marginLeft: 6,
                  fontSize: "0.7rem",
                  fontFamily: "monospace",
                  color: "rgba(100,116,139,0.4)",
                  letterSpacing: "0.06em",
                }}>
                  {String(stepNum).padStart(2, "0")} / 03
                </span>
              </div>

              {/* Skip all */}
              <button
                onClick={dismiss}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "0.72rem", color: "rgba(100,116,139,0.4)",
                  fontFamily: "inherit", letterSpacing: "0.04em",
                  padding: 0, lineHeight: 1,
                  transition: "color 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(148,163,184,0.7)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(100,116,139,0.4)")}
              >
                skip all
              </button>
            </div>

            {/* ── Body ── */}
            <div style={{ padding: "28px 24px 24px" }}>

              {/* ── Step 1: Welcome ── */}
              {step === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <h2 style={{
                      margin: 0, fontSize: "1.3rem", fontWeight: 500,
                      color: "#e2e8f0", letterSpacing: "-0.02em", lineHeight: 1.3,
                    }}>
                      Good to have you here.
                    </h2>
                    <p style={{
                      margin: 0, fontSize: "0.82rem",
                      color: "rgba(100,116,139,0.7)", lineHeight: 1.7,
                    }}>
                      TradeMind takes 60 seconds to set up.
                      <br />Or skip and explore on your own.
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <button
                      onClick={() => goToStep(2)}
                      style={{
                        height: 36, paddingInline: 20,
                        borderRadius: 6, cursor: "pointer",
                        background: ACCENT,
                        border: "none",
                        color: "#fff",
                        fontSize: "0.82rem", fontFamily: "inherit", fontWeight: 500,
                        letterSpacing: "0.01em",
                        transition: "opacity 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                    >
                      Let's go
                    </button>
                    <button
                      onClick={dismiss}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: "0.82rem", color: "rgba(100,116,139,0.5)",
                        fontFamily: "inherit", padding: 0,
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = "rgba(148,163,184,0.7)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(100,116,139,0.5)")}
                    >
                      Skip setup
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 2: Market ── */}
              {step === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <h2 style={{
                      margin: 0, fontSize: "1.2rem", fontWeight: 500,
                      color: "#e2e8f0", letterSpacing: "-0.02em",
                    }}>
                      What do you mainly trade?
                    </h2>
                    <p style={{
                      margin: 0, fontSize: "0.78rem",
                      color: "rgba(100,116,139,0.5)",
                    }}>
                      Helps personalise your Trader DNA
                    </p>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {MARKETS.map((m) => {
                      const active = selectedMarket === m;
                      return (
                        <button
                          key={m}
                          onClick={() => setMarket(m)}
                          style={{
                            padding: "7px 14px",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontFamily: "inherit",
                            fontWeight: active ? 500 : 400,
                            background: active ? `${ACCENT}18` : "transparent",
                            border: `1px solid ${active ? ACCENT + "50" : "rgba(255,255,255,0.07)"}`,
                            color: active ? ACCENT : "rgba(148,163,184,0.55)",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <button
                      onClick={handleMarketContinue}
                      disabled={!selectedMarket}
                      style={{
                        height: 36, paddingInline: 20,
                        borderRadius: 6, cursor: selectedMarket ? "pointer" : "default",
                        background: ACCENT,
                        border: "none",
                        color: "#fff",
                        fontSize: "0.82rem", fontFamily: "inherit", fontWeight: 500,
                        opacity: selectedMarket ? 1 : 0.35,
                        transition: "opacity 0.15s",
                      }}
                      onMouseEnter={e => { if (selectedMarket) e.currentTarget.style.opacity = "0.85"; }}
                      onMouseLeave={e => { if (selectedMarket) e.currentTarget.style.opacity = "1"; }}
                    >
                      Continue
                    </button>
                    <button
                      onClick={() => goToStep(3)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: "0.82rem", color: "rgba(100,116,139,0.5)",
                        fontFamily: "inherit", padding: 0,
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = "rgba(148,163,184,0.7)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(100,116,139,0.5)")}
                    >
                      Skip
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 3: First trade ── */}
              {step === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <h2 style={{
                      margin: 0, fontSize: "1.15rem", fontWeight: 500,
                      color: "#e2e8f0", letterSpacing: "-0.02em", lineHeight: 1.35,
                    }}>
                      Log your first trade
                    </h2>
                    <p style={{
                      margin: 0, fontSize: "0.78rem",
                      color: "rgba(100,116,139,0.5)",
                    }}>
                      Activates Trader DNA — full details can be added later
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    {/* Symbol */}
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{
                        fontSize: "0.68rem", letterSpacing: "0.08em",
                        color: "rgba(100,116,139,0.45)",
                        fontFamily: "monospace",
                        textTransform: "uppercase",
                      }}>
                        Symbol
                      </span>
                      <input
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        placeholder="EURUSD, BTC, AAPL…"
                        maxLength={12}
                        style={field}
                      />
                    </label>

                    {/* Direction */}
                    <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <span style={{
                        fontSize: "0.68rem", letterSpacing: "0.08em",
                        color: "rgba(100,116,139,0.45)",
                        fontFamily: "monospace",
                        textTransform: "uppercase",
                      }}>
                        Direction
                      </span>
                      <div style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr",
                        gap: 6,
                      }}>
                        {(["long", "short"] as const).map((d) => {
                          const active = direction === d;
                          const isLong = d === "long";
                          return (
                            <button
                              key={d}
                              onClick={() => setDir(d)}
                              style={{
                                height: 36,
                                borderRadius: 6, cursor: "pointer",
                                fontSize: "0.78rem", fontFamily: "inherit",
                                fontWeight: active ? 500 : 400,
                                letterSpacing: "0.04em",
                                background: active
                                  ? isLong
                                    ? "rgba(16,185,129,0.1)"
                                    : "rgba(239,68,68,0.1)"
                                  : "transparent",
                                border: `1px solid ${active
                                  ? isLong
                                    ? "rgba(16,185,129,0.3)"
                                    : "rgba(239,68,68,0.3)"
                                  : "rgba(255,255,255,0.07)"}`,
                                color: active
                                  ? isLong ? "#10b981" : "#ef4444"
                                  : "rgba(100,116,139,0.4)",
                                transition: "all 0.15s ease",
                              }}
                            >
                              {isLong ? "Long ↑" : "Short ↓"}
                            </button>
                          );
                        })}
                      </div>
                    </label>

                    {/* P&L */}
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{
                        fontSize: "0.68rem", letterSpacing: "0.08em",
                        color: "rgba(100,116,139,0.45)",
                        fontFamily: "monospace",
                        textTransform: "uppercase",
                      }}>
                        P&amp;L
                      </span>
                      <input
                        type="number"
                        value={pnl}
                        onChange={(e) => setPnl(e.target.value)}
                        placeholder="+120 or −50"
                        style={field}
                      />
                    </label>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <button
                      onClick={handleAddTrade}
                      disabled={!symbol.trim() || submitting}
                      style={{
                        height: 36, paddingInline: 20,
                        borderRadius: 6,
                        cursor: symbol.trim() && !submitting ? "pointer" : "default",
                        background: ACCENT,
                        border: "none",
                        color: "#fff",
                        fontSize: "0.82rem", fontFamily: "inherit", fontWeight: 500,
                        opacity: symbol.trim() && !submitting ? 1 : 0.35,
                        transition: "opacity 0.15s",
                      }}
                      onMouseEnter={e => { if (symbol.trim()) e.currentTarget.style.opacity = "0.85"; }}
                      onMouseLeave={e => { if (symbol.trim()) e.currentTarget.style.opacity = "1"; }}
                    >
                      {submitting ? "Saving…" : "Add trade"}
                    </button>
                    <button
                      onClick={showToast}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: "0.82rem", color: "rgba(100,116,139,0.5)",
                        fontFamily: "inherit", padding: 0,
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = "rgba(148,163,184,0.7)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(100,116,139,0.5)")}
                    >
                      I'll do this later
                    </button>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
