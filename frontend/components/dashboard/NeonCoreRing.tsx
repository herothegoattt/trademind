"use client";
import { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { useDashboardStore } from "../../lib/store";

interface NeonCoreRingProps {
  children?: React.ReactNode;
}

export function NeonCoreRing({ children }: NeonCoreRingProps) {
  const selectedErrorType = useDashboardStore((s: any) => s.selectedErrorType);
  const isSending = useDashboardStore((s: any) => s.isSending);
  const controls = useAnimation();

  return (
    <div className="relative flex items-center justify-center w-[520px] h-[520px] overflow-hidden">
      {/* Enhanced warm amber glow background */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.4), rgba(59, 130, 246, 0.1))",
        }}
      />

      {/* AI Core System */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Outer atmospheric ring - Cyan blue */}
        <motion.div
          animate={{
            rotate: [0, 360],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
            opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute rounded-full"
          style={{
            width: "520px",
            height: "520px",
            border: "2px solid rgba(6, 182, 212, 0.4)",
            boxShadow: "0 0 60px rgba(6, 182, 212, 0.3), inset 0 0 40px rgba(6, 182, 212, 0.1)",
          }}
        />

        {/* Secondary ring - Fast rotation */}
        <motion.div
          animate={{
            rotate: [360, 0],
            opacity: [0.15, 0.4, 0.15],
          }}
          transition={{
            rotate: { duration: 18, repeat: Infinity, ease: "linear" },
            opacity: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute rounded-full"
          style={{
            width: "460px",
            height: "460px",
            border: "1.5px solid rgba(59, 130, 246, 0.3)",
            boxShadow: "0 0 40px rgba(59, 130, 246, 0.2)",
          }}
        />

        {/* Middle Ring - Rotating opposite with cyan tones */}
        <motion.div
          animate={{
            rotate: [0, -360],
            scale: [0.98, 1.02, 0.98],
          }}
          transition={{
            rotate: { duration: 30, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute rounded-full"
          style={{
            width: "380px",
            height: "380px",
            border: "1.5px solid rgba(59, 130, 246, 0.35)",
            boxShadow: "0 0 30px rgba(6, 182, 212, 0.3), inset 0 0 20px rgba(6, 182, 212, 0.1)",
          }}
        />

        {/* Inner glow ring - Cyan */}
        <motion.div
          animate={{
            rotate: [0, 360],
            opacity: [0.25, 0.6, 0.25],
          }}
          transition={{
            rotate: { duration: 22, repeat: Infinity, ease: "linear" },
            opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute rounded-full"
          style={{
            width: "280px",
            height: "280px",
            border: "1px solid rgba(6, 182, 212, 0.4)",
            boxShadow: "0 0 30px rgba(6, 182, 212, 0.35)",
          }}
        />

        {/* Primary nucleus - 3D sphere with pulsation */}
        <motion.div
          animate={{
            scale: [0.9, 1.2, 0.9],
            opacity: [0.85, 1, 0.85],
            boxShadow: [
              "0 0 60px rgba(6, 182, 212, 0.6), 0 0 120px rgba(59, 130, 246, 0.4), 0 0 180px rgba(6, 182, 212, 0.2), inset -20px -20px 40px rgba(0, 0, 0, 0.3)",
              "0 0 100px rgba(6, 182, 212, 0.8), 0 0 180px rgba(59, 130, 246, 0.6), 0 0 260px rgba(6, 182, 212, 0.35), inset -30px -30px 60px rgba(0, 0, 0, 0.4)",
              "0 0 60px rgba(6, 182, 212, 0.6), 0 0 120px rgba(59, 130, 246, 0.4), 0 0 180px rgba(6, 182, 212, 0.2), inset -20px -20px 40px rgba(0, 0, 0, 0.3)",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute rounded-full shadow-2xl"
          style={{
            width: "200px",
            height: "200px",
            background: `
              radial-gradient(
                ellipse 40% 40% at 35% 35%,
                rgba(165, 243, 252, 1) 0%,
                rgba(125, 230, 247, 0.95) 25%,
                rgba(6, 182, 212, 0.9) 50%,
                rgba(59, 130, 246, 0.95) 75%,
                rgba(37, 99, 235, 1) 100%
              )
            `,
            filter: "drop-shadow(0 0 30px rgba(6, 182, 212, 0.7)) drop-shadow(-20px -20px 30px rgba(165, 243, 252, 0.3))",
          }}
        />

        {/* Secondary core with offset animation */}
        <motion.div
          animate={{
            scale: [0.7, 1.05, 0.7],
            opacity: [0.6, 0.95, 0.6],
            boxShadow: [
              "0 0 40px rgba(6, 182, 212, 0.5), 0 0 80px rgba(59, 130, 246, 0.3)",
              "0 0 70px rgba(6, 182, 212, 0.7), 0 0 140px rgba(59, 130, 246, 0.5)",
              "0 0 40px rgba(6, 182, 212, 0.5), 0 0 80px rgba(59, 130, 246, 0.3)",
            ],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute rounded-full"
          style={{
            width: "140px",
            height: "140px",
            background: `
              radial-gradient(
                ellipse 50% 50% at 40% 40%,
                rgba(206, 250, 254, 1),
                rgba(165, 243, 252, 0.85),
                rgba(6, 182, 212, 0.8),
                rgba(59, 130, 246, 0.9)
              )
            `,
          }}
        />

        {/* Bright inner core - Rapid pulsation */}
        <motion.div
          animate={{
            scale: [0.5, 0.85, 0.5],
            opacity: [0.7, 1, 0.7],
            boxShadow: [
              "0 0 30px rgba(165, 243, 252, 0.6)",
              "0 0 60px rgba(165, 243, 252, 1), 0 0 100px rgba(6, 182, 212, 0.7)",
              "0 0 30px rgba(165, 243, 252, 0.6)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute rounded-full"
          style={{
            width: "80px",
            height: "80px",
            background: `
              radial-gradient(
                circle at 40% 40%,
                rgba(206, 250, 254, 1),
                rgba(165, 243, 252, 0.95),
                rgba(125, 230, 247, 0.9),
                rgba(6, 182, 212, 0.95)
              )
            `,
            filter: "drop-shadow(0 0 20px rgba(165, 243, 252, 0.8))",
          }}
        />

        {/* Ultra-bright center point */}
        <motion.div
          animate={{
            scale: [0.3, 0.7, 0.3],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute rounded-full"
          style={{
            width: "40px",
            height: "40px",
            background: `
              radial-gradient(
                circle,
                rgba(230, 254, 255, 1),
                rgba(206, 250, 254, 0.95),
                rgba(165, 243, 252, 0.85)
              )
            `,
            boxShadow: "0 0 30px rgba(165, 243, 252, 1), 0 0 50px rgba(6, 182, 212, 0.8), 0 0 80px rgba(59, 130, 246, 0.5)",
            filter: "drop-shadow(0 0 15px rgba(206, 250, 254, 1))",
          }}
        />
      </div>

      {children && (
        <div className="relative z-50 pointer-events-auto flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
