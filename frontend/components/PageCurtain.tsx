"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";

// Cinematic route-transition curtain (Lusion-style split reveal).
// It is a fixed, pointer-events-none overlay — it never wraps page content,
// so it can't break the app's many `position: fixed` elements. On every route
// change two panels close the screen then sweep apart, revealing the new page
// from a glowing seam.
const EASE = [0.76, 0, 0.24, 1] as const;
const CYN = "#22d3ee";
const VIO = "#8b5cf6";
const PANEL = "linear-gradient(180deg,#0b0b18 0%,#070a12 100%)";

export function PageCurtain() {
  const pathname = usePathname();
  const first = useRef(true);
  const [run, setRun] = useState(0); // bump to replay; 0 = idle

  useEffect(() => {
    if (first.current) { first.current = false; return; } // skip initial load
    // boot arrival already plays its own entrance (AppEntrance) — don't double-transition
    let skip = false;
    try {
      skip = sessionStorage.getItem("tm_skip_curtain") === "1";
      if (skip) sessionStorage.removeItem("tm_skip_curtain");
    } catch {}
    if (skip) return;
    setRun((n) => n + 1);
    const id = setTimeout(() => setRun(0), 820);
    return () => clearTimeout(id);
  }, [pathname]);

  if (!run) return null;

  return (
    <div key={run} aria-hidden style={{ position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "none", overflow: "hidden" }}>
      {/* top panel — closed, then sweeps up */}
      <motion.div
        initial={{ y: "0%" }} animate={{ y: "-101%" }}
        transition={{ duration: 0.62, ease: EASE, delay: 0.06 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50.5%", background: PANEL, willChange: "transform", boxShadow: "0 24px 60px rgba(0,0,0,.6)" }}
      />
      {/* bottom panel — closed, then sweeps down */}
      <motion.div
        initial={{ y: "0%" }} animate={{ y: "101%" }}
        transition={{ duration: 0.62, ease: EASE, delay: 0.06 }}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50.5%", background: PANEL, willChange: "transform", boxShadow: "0 -24px 60px rgba(0,0,0,.6)" }}
      />

      {/* glowing seam that splits open */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0.2 }}
        animate={{ opacity: [0, 1, 1, 0], scaleX: [0.2, 1, 1, 1] }}
        transition={{ duration: 0.72, ease: EASE, times: [0, 0.25, 0.5, 1] }}
        style={{
          position: "absolute", top: "50%", left: 0, right: 0, height: 2, marginTop: -1,
          transformOrigin: "center", willChange: "transform,opacity",
          background: `linear-gradient(90deg,transparent,${CYN},${VIO},transparent)`,
          boxShadow: `0 0 18px ${VIO}, 0 0 40px ${CYN}66`,
        }}
      />

      {/* brand mark flashes at center then fades as the panels part */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: [0, 1, 0], scale: [0.85, 1, 1.05] }}
        transition={{ duration: 0.55, ease: EASE }}
        style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <div style={{ width: 58, height: 58, borderRadius: 16, overflow: "hidden", border: `1px solid ${VIO}40`, boxShadow: `0 0 40px ${VIO}55, inset 0 1px 0 rgba(255,255,255,.08)` }}>
          <Image src="/logo.jpg" alt="" width={58} height={58} style={{ objectFit: "cover" }} />
        </div>
      </motion.div>
    </div>
  );
}
