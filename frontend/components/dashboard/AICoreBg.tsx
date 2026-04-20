"use client";
import { motion } from "framer-motion";

export function AICoreBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">

      {/* Multi-color base gradient */}
      <div
        className="absolute inset-0 ai-core-bg-gradient"
        style={{
          background: `
            radial-gradient(ellipse 50% 45% at 50% 35%,  rgba(34,211,238,0.07)  0%, transparent 65%),
            radial-gradient(ellipse 40% 40% at 80% 75%,  rgba(129,140,248,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 35% 35% at 15% 70%,  rgba(52,211,153,0.04)  0%, transparent 55%),
            radial-gradient(ellipse 55% 60% at 50% 50%,  rgba(6,15,36,0.6)      0%, transparent 80%),
            #070a12
          `,
        }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 ai-core-dot-grid"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.032) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* Faint grid lines (optional, very subtle) */}
      <div
        className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,1) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      {/* Corner brackets */}
      {[
        { cls: "absolute top-5 left-5",   d: "M0 14 L0 0 L14 0" },
        { cls: "absolute top-5 right-5",  d: "M18 14 L18 0 L4 0"  },
        { cls: "absolute bottom-5 left-5",   d: "M0 4 L0 18 L14 18" },
        { cls: "absolute bottom-5 right-5",  d: "M18 4 L18 18 L4 18" },
      ].map((b, i) => (
        <svg key={i} className={b.cls} style={{ opacity: 0.1 }} width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d={b.d} stroke="#22d3ee" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ))}

      {/* Ambient rings — multi-color */}
      {[
        { size: 260,  color: "34,211,238",  opacity: 0.055, delay: 0,   duration: 10 },
        { size: 440,  color: "129,140,248", opacity: 0.04,  delay: 2.5, duration: 14 },
        { size: 640,  color: "34,211,238",  opacity: 0.025, delay: 5,   duration: 18 },
        { size: 860,  color: "52,211,153",  opacity: 0.015, delay: 1,   duration: 22 },
      ].map(({ size, color, opacity, delay, duration }, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full ai-core-ring"
          style={{
            width: size, height: size,
            top: "50%", left: "50%",
            marginTop: -size / 2, marginLeft: -size / 2,
            border: `1px solid rgba(${color},${opacity})`,
          }}
          animate={{
            scale:   [1, 1 + 0.028 * (i + 1), 1],
            opacity: [0.6 - i * 0.1, 0.12, 0.6 - i * 0.1],
          }}
          transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
        />
      ))}

      {/* Floating cyan orb at center */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 120, height: 120,
          top: "50%", left: "50%",
          marginTop: -60, marginLeft: -60,
          background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle horizontal center line */}
      <div
        className="absolute left-[8%] right-[8%]"
        style={{
          top: "50%",
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.05) 20%, rgba(34,211,238,0.05) 80%, transparent)",
        }}
      />

      {/* Floating mini particles */}
      {[
        { x: "20%", y: "30%", color: "#22d3ee", size: 3, delay: 0 },
        { x: "75%", y: "25%", color: "#818cf8", size: 2, delay: 1.5 },
        { x: "85%", y: "65%", color: "#34d399", size: 3, delay: 3 },
        { x: "12%", y: "72%", color: "#22d3ee", size: 2, delay: 0.8 },
        { x: "60%", y: "80%", color: "#c084fc", size: 2, delay: 2.2 },
      ].map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: p.x, top: p.y,
            width: p.size, height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            opacity: 0.5,
          }}
          animate={{ y: [-4, 4, -4], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
        />
      ))}
    </div>
  );
}
