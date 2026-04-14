"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useT } from "../lib/i18n";

const TOTAL_MS = 2600;

export default function HomePage() {
  const t = useT();
  const router = useRouter();
  const [phase,    setPhase]    = useState<"idle" | "loading" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [modIdx,   setModIdx]   = useState(0);
  const launched = useRef(false);

  const MODULES = [
    t('module_neural'),
    t('module_market_data'),
    t('module_risk'),
    t('module_ai_core'),
    t('module_bias_filter'),
    t('module_signals'),
  ];

  const STEP_MS = TOTAL_MS / MODULES.length;

  // Boot sequence
  useEffect(() => {
    if (phase !== "loading") return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    MODULES.forEach((_, i) => {
      if (i > 0) timers.push(setTimeout(() => setModIdx(i), i * STEP_MS));
    });
    const start = Date.now();
    const iv = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / TOTAL_MS) * 100);
      setProgress(pct);
      if (pct >= 100) { clearInterval(iv); setPhase("done"); }
    }, 16);
    return () => { timers.forEach(clearTimeout); clearInterval(iv); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(() => router.push("/app"), 900);
    return () => clearTimeout(t);
  }, [phase, router]);

  const launch = () => {
    if (launched.current) return;
    launched.current = true;
    setPhase("loading");
  };

  const pct = Math.round(progress);
  const accent = "#8b5cf6";

  // ── BOOT SCREEN ──────────────────────────────────────────────────────────────
  if (phase === "loading" || phase === "done") {
    return (
      <div style={{
        minHeight: "100vh", background: "#07080f",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "inherit", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(139,92,246,0.07) 0%, transparent 70%)",
        }} />
        {[
          { top: 20, left: 20,  borderTop: "1px solid rgba(34,211,238,0.2)", borderLeft:  "1px solid rgba(34,211,238,0.2)" },
          { top: 20, right: 20, borderTop: "1px solid rgba(34,211,238,0.2)", borderRight: "1px solid rgba(34,211,238,0.2)" },
          { bottom: 20, left: 20,  borderBottom: "1px solid rgba(34,211,238,0.2)", borderLeft:  "1px solid rgba(34,211,238,0.2)" },
          { bottom: 20, right: 20, borderBottom: "1px solid rgba(34,211,238,0.2)", borderRight: "1px solid rgba(34,211,238,0.2)" },
        ].map((s, i) => <div key={i} style={{ position: "absolute", width: 24, height: 24, ...s }} />)}

        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 48, width: "100%", maxWidth: 420, padding: "0 24px", zIndex: 10,
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18,
              border: "1px solid rgba(139,92,246,0.35)", background: "rgba(10,8,26,0.9)",
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
              boxShadow: "0 0 28px rgba(139,92,246,0.18)",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="TradeMind" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: "2.6rem", fontWeight: 600, letterSpacing: "-0.02em", color: "#f1f5f9", lineHeight: 1 }}>
                TradeMind
              </h1>
              <p style={{ margin: "10px 0 0", fontSize: 9, fontFamily: "monospace", letterSpacing: "0.28em", color: "rgba(100,116,139,0.6)" }}>
                {t('ai_powered_trading')}
              </p>
            </div>
          </div>

          <div style={{ width: "100%", minHeight: 44, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                background: "#22d3ee", boxShadow: "0 0 8px rgba(34,211,238,0.7)", animation: "tmPulse 1s infinite",
              }} />
              <span style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.18em", color: "rgba(148,163,184,0.85)" }}>
                {MODULES[modIdx]}
              </span>
            </div>
            <span style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(100,116,139,0.5)" }}>
              {modIdx + 1}&nbsp;/&nbsp;{MODULES.length}
            </span>
          </div>

          <div style={{ width: "100%", height: 52,
            border: `1px solid ${phase === "done" ? "rgba(52,211,153,0.3)" : "rgba(34,211,238,0.22)"}`,
            borderRadius: 10, position: "relative", overflow: "hidden", transition: "border-color 0.4s",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, bottom: 0, width: `${progress}%`,
              background: phase === "done"
                ? "linear-gradient(90deg, rgba(52,211,153,0.2), rgba(52,211,153,0.08))"
                : "linear-gradient(90deg, rgba(139,92,246,0.22), rgba(6,182,212,0.14))",
              transition: "width 0.08s linear, background 0.4s",
            }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
              <span style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.22em", color: phase === "done" ? "#34d399" : "rgba(148,163,184,0.5)", transition: "color 0.3s" }}>
                {phase === "done" ? t('access_granted') : t('loading_text')}
              </span>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: phase === "done" ? "rgba(52,211,153,0.8)" : "rgba(100,116,139,0.55)", fontVariantNumeric: "tabular-nums", transition: "color 0.3s" }}>
                {pct}%
              </span>
            </div>
          </div>
        </div>
        <style>{`@keyframes tmPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      </div>
    );
  }

  // ── LANDING SCREEN ────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh", background: "#07080f",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "inherit", position: "relative", overflow: "hidden",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(139,92,246,0.1) 0%, transparent 65%)",
      }} />

      {/* HUD corners */}
      {[
        { top: 20, left: 20,  borderTop: "1px solid rgba(34,211,238,0.15)", borderLeft:  "1px solid rgba(34,211,238,0.15)" },
        { top: 20, right: 20, borderTop: "1px solid rgba(34,211,238,0.15)", borderRight: "1px solid rgba(34,211,238,0.15)" },
        { bottom: 20, left: 20,  borderBottom: "1px solid rgba(34,211,238,0.15)", borderLeft:  "1px solid rgba(34,211,238,0.15)" },
        { bottom: 20, right: 20, borderBottom: "1px solid rgba(34,211,238,0.15)", borderRight: "1px solid rgba(34,211,238,0.15)" },
      ].map((s, i) => <div key={i} style={{ position: "absolute", width: 24, height: 24, ...s }} />)}

      {/* Version badge */}
      <div style={{
        position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
        fontSize: 9, fontFamily: "monospace", letterSpacing: "0.28em",
        color: "rgba(100,116,139,0.5)", border: "1px solid rgba(100,116,139,0.1)",
        padding: "3px 10px", borderRadius: 4,
      }}>
        v1.0 · ALPHA
      </div>

      {/* Main content */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 40, width: "100%", maxWidth: 400, padding: "0 32px",
        zIndex: 10, textAlign: "center",
        animation: "tmFadeIn 0.5s ease both",
      }}>
        {/* Logo */}
        <div style={{
          width: 88, height: 88, borderRadius: 22,
          border: `1px solid ${accent}40`,
          background: "rgba(10,8,26,0.9)",
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
          boxShadow: `0 0 40px rgba(139,92,246,0.2)`,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="TradeMind" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: "2.8rem", fontWeight: 700, letterSpacing: "-0.03em", color: "#f1f5f9", lineHeight: 1 }}>
            TradeMind
          </h1>
          <p style={{ margin: 0, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.28em", color: "rgba(100,116,139,0.55)" }}>
            {t('ai_powered_trading')}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "rgba(148,163,184,0.55)", lineHeight: 1.6 }}>
            {t('trading_companion')}
          </p>
        </div>

        {/* Launch button */}
        <button
          onClick={launch}
          style={{
            width: "100%", height: 54,
            background: `linear-gradient(135deg, ${accent}28, ${accent}14)`,
            border: `1px solid ${accent}55`,
            borderRadius: 14, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            boxShadow: `0 0 28px ${accent}22`,
            transition: "box-shadow 0.2s, background 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 42px ${accent}44`; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 28px ${accent}22`; }}
        >
          <span style={{
            fontSize: 12, fontFamily: "monospace", letterSpacing: "0.2em",
            color: accent, fontWeight: 700,
          }}>
            {t('initialize_system')}
          </span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7h10M8 3l4 4-4 4" stroke={accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes tmFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes tmPulse {
          0%,100%{opacity:1} 50%{opacity:0.3}
        }
      `}</style>
    </div>
  );
}
