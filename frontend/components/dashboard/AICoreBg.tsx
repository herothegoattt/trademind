"use client";
import { motion } from "framer-motion";

export function AICoreBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 50% 50%, rgba(59,7,100,0.55) 0%, transparent 65%),
            radial-gradient(ellipse 100% 75% at 50% 50%, rgba(12,18,68,0.4) 0%, transparent 80%),
            #020308
          `,
        }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(6,182,212,0.1) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Corner targeting brackets */}
      <svg className="absolute top-5 left-5 opacity-20" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M0 13 L0 0 L13 0" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <svg className="absolute top-5 right-5 opacity-20" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M20 13 L20 0 L7 0" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <svg className="absolute bottom-5 left-5 opacity-20" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M0 7 L0 20 L13 20" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <svg className="absolute bottom-5 right-5 opacity-20" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M20 7 L20 20 L7 20" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>

      {/* Slow ambient rings */}
      {[350, 560].map((size, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            top: "50%",
            left: "50%",
            marginTop: -size / 2,
            marginLeft: -size / 2,
            border: `1px solid rgba(6,182,212,${0.05 - i * 0.01})`,
          }}
          animate={{ scale: [1, 1.07, 1], opacity: [0.5, 0.1, 0.5] }}
          transition={{ duration: 7 + i * 2, repeat: Infinity, ease: "easeInOut", delay: i * 1.5 }}
        />
      ))}
    </div>
  );
}
