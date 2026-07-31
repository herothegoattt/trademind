"use client";
import { motion } from "framer-motion";
import { AICoreBg } from "./AICoreBg";
import { AIChatWindow } from "./AIChatWindow";
import { FeatureGate } from "../FeatureGate";

/* ── Timing calibrated for ~1200 × 900 chat area ────────────────
   perimeter ≈ 4200 px, speed ≈ 700 px/s → full cycle ≈ 6 s      */
const CYCLE  = 6;
const T_TOP  = 1.72;   // 1200 / 700
const T_SIDE = 1.28;   // 900  / 700
const D = {
  top:    0,
  right:  T_TOP,
  bottom: T_TOP + T_SIDE,
  left:   T_TOP + T_SIDE + T_TOP,
};
const BEAM = 35; // beam = 35% of side length

/* ── Corner bracket ─────────────────────────────────────────── */
function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const isTop  = pos[0] === "t";
  const isLeft = pos[1] === "l";
  const rot    = { tl: 0, tr: 90, br: 180, bl: 270 }[pos];
  const delay  = { tl: 0, tr: 1.5, br: 3, bl: 4.5 }[pos];
  const S = 22;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        [isTop  ? "top"    : "bottom"]: 0,
        [isLeft ? "left"   : "right" ]: 0,
        width: S, height: S,
        transform: `rotate(${rot}deg)`,
      }}
    >
      {/* Glow layer */}
      <motion.svg
        width={S} height={S} viewBox={`0 0 ${S} ${S}`} fill="none"
        style={{ position: "absolute", inset: 0, filter: "blur(3px)" }}
        animate={{ opacity: [0.25, 0.7, 0.25] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
      >
        <path d={`M0 ${S} L0 3 Q0 0 3 0 L${S} 0`} stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round"/>
      </motion.svg>
      {/* Sharp layer */}
      <motion.svg
        width={S} height={S} viewBox={`0 0 ${S} ${S}`} fill="none"
        style={{ position: "absolute", inset: 0 }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
      >
        <path d={`M0 ${S} L0 3 Q0 0 3 0 L${S} 0`} stroke="#22d3ee" strokeWidth="1.2" strokeLinecap="round"/>
        {/* Tick notches */}
        <line x1="0"    y1={S - 7} x2="4"    y2={S - 7} stroke="#22d3ee" strokeWidth="0.8" opacity="0.55"/>
        <line x1={S-7}  y1="0"     x2={S - 7} y2="4"    stroke="#22d3ee" strokeWidth="0.8" opacity="0.55"/>
      </motion.svg>
    </motion.div>
  );
}

/* ── One traveling beam on a single border edge ──────────────── */
function BorderBeam({
  edge, color, dur, delay,
}: {
  edge: "top" | "right" | "bottom" | "left";
  color: string;
  dur: number;
  delay: number;
}) {
  const horiz = edge === "top" || edge === "bottom";
  const rev   = edge === "bottom" || edge === "left";

  const containerStyle: React.CSSProperties = horiz
    ? { position: "absolute", [edge]: 0, left: 0, right: 0, height: 1, overflow: "hidden" }
    : { position: "absolute", [edge === "left" ? "left" : "right"]: 0, top: 0, bottom: 0, width: 1, overflow: "hidden" };

  const beamStyle: React.CSSProperties = horiz
    ? { position: "absolute", top: 0, height: "100%", width: `${BEAM}%`,
        background: `linear-gradient(90deg, transparent, ${color} 50%, transparent)`,
        filter: "blur(0.5px)" }
    : { position: "absolute", left: 0, width: "100%", height: `${BEAM}%`,
        background: `linear-gradient(180deg, transparent, ${color} 50%, transparent)`,
        filter: "blur(0.5px)" };

  const startProp = horiz ? "left" : "top";
  const from = rev ? "100%" : `${-BEAM}%`;
  const to   = rev ? `${-BEAM}%` : "100%";

  return (
    <div style={containerStyle}>
      <motion.div
        style={beamStyle}
        animate={{ [startProp]: [from, to] }}
        transition={{ duration: dur, repeat: Infinity, ease: "linear", delay, repeatDelay: CYCLE - dur }}
      />
    </div>
  );
}

/* ── Full cyberpunk frame overlay ────────────────────────────── */
function CyberpunkFrame() {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">

      {/* Pulsing static border */}
      <motion.div
        className="absolute inset-0"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        animate={{
          boxShadow: [
            "inset 0 0 24px rgba(34,211,238,0.02), 0 0 0 1px rgba(34,211,238,0.07)",
            "inset 0 0 48px rgba(34,211,238,0.07), 0 0 0 1px rgba(34,211,238,0.22), 0 0 32px rgba(34,211,238,0.06)",
            "inset 0 0 24px rgba(34,211,238,0.02), 0 0 0 1px rgba(34,211,238,0.07)",
          ],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Traveling beams — clockwise */}
      <BorderBeam edge="top"    color="rgba(255,255,255,0.92)" dur={T_TOP}  delay={D.top}    />
      <BorderBeam edge="right"  color="rgba(34,211,238,0.85)"  dur={T_SIDE} delay={D.right}  />
      <BorderBeam edge="bottom" color="rgba(255,255,255,0.92)" dur={T_TOP}  delay={D.bottom} />
      <BorderBeam edge="left"   color="rgba(34,211,238,0.85)"  dur={T_SIDE} delay={D.left}   />

      {/* Corner brackets */}
      <Corner pos="tl" />
      <Corner pos="tr" />
      <Corner pos="bl" />
      <Corner pos="br" />

      {/* Subtle top edge accent line */}
      <div
        className="absolute top-0 left-[10%] right-[10%]"
        style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.18) 30%, rgba(255,255,255,0.12) 50%, rgba(34,211,238,0.18) 70%, transparent)" }}
      />

      {/* Bottom-right coordinate tag */}
      <motion.span
        className="absolute bottom-[10px] right-[28px] text-[7px] font-mono tracking-widest"
        style={{ color: "rgba(34,211,238,0.25)" }}
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        SYS:CORE — SECURE
      </motion.span>
    </div>
  );
}

/* ── CoreHub ─────────────────────────────────────────────────── */
export function CoreHub() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "var(--bg-core)" }}>
      <AICoreBg />

      {/* Chat content */}
      <div className="absolute inset-0 z-10">
        <FeatureGate feature="ai_chat">
          <AIChatWindow isCompact={false} />
        </FeatureGate>
      </div>

      {/* Cyberpunk frame sits above everything */}
      <CyberpunkFrame />
    </div>
  );
}
