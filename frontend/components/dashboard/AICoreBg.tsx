"use client";

import { motion } from "framer-motion";

const STAR_POSITIONS = [
  { left: "10%", top: "12%", size: 2 },
  { left: "22%", top: "35%", size: 1 },
  { left: "70%", top: "18%", size: 1.5 },
  { left: "85%", top: "60%", size: 1 },
  { left: "45%", top: "80%", size: 1.75 },
  { left: "30%", top: "60%", size: 1 },
  { left: "60%", top: "40%", size: 1.25 },
  { left: "15%", top: "75%", size: 1 },
  { left: "80%", top: "30%", size: 1.2 },
  { left: "50%", top: "50%", size: 1.5 },
];

export function AICoreBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-black/70">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(168,85,247,0.22),transparent_60%)]" />

      {STAR_POSITIONS.map((star, idx) => (
        <div
          key={idx}
          className="absolute rounded-full bg-white/60"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
        />
      ))}

      <motion.svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 800 800"
        preserveAspectRatio="xMidYMid meet"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
      >
        <defs>
          <radialGradient id="galaxyRing" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.6)" />
            <stop offset="40%" stopColor="rgba(6, 182, 212, 0.35)" />
            <stop offset="80%" stopColor="rgba(139, 92, 246, 0)" />
          </radialGradient>
        </defs>

        <circle
          cx="400"
          cy="400"
          r="260"
          fill="none"
          stroke="url(#galaxyRing)"
          strokeWidth="10"
          opacity="0.85"
        />

        <circle
          cx="400"
          cy="400"
          r="320"
          fill="none"
          stroke="rgba(59,130,246,0.25)"
          strokeWidth="2"
          strokeDasharray="12 10"
        />
      </motion.svg>
    </div>
  );
}
