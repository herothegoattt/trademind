"use client";

export const dynamic = "force-dynamic";

import CommunityEdge from "../../components/dashboard/CommunityEdge";
import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useT } from "../../lib/i18n";

export default function CommunityEdgePage() {
  const t = useT();

  return (
    <div
      className="h-full overflow-y-auto pb-16 md:pb-0 text-white"
      style={{ background: "linear-gradient(160deg, #020308 0%, #020210 50%, #020308 100%)" }}
    >
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.045) 0%, transparent 65%)" }}
        />
        <div
          className="absolute top-1/3 right-0 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 65%)" }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(244,114,182,0.03) 0%, transparent 65%)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(34,211,238,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.018) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
      </div>

      {/* Sticky top bar */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-3 sm:px-6 h-14"
        style={{
          background: "rgba(2,3,8,0.92)",
          borderBottom: "1px solid rgba(34,211,238,0.08)",
          backdropFilter: "blur(24px)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <Link
            href="/app"
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-cyan-500/10 hover:scale-105"
            style={{ border: "1px solid rgba(34,211,238,0.18)", color: "#22d3ee" }}
          >
            <ArrowLeft size={15} />
          </Link>
          <div className="w-px h-5" style={{ background: "rgba(34,211,238,0.15)" }} />
          <span className="text-sm font-semibold text-gray-500">{t("ce_back")}</span>
        </motion.div>

        {/* Live indicator */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.12)" }}
        >
          <div className="relative">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px rgba(52,211,153,0.8)" }} />
            <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-50" />
          </div>
          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Live</span>
          <Zap size={10} className="text-cyan-500/60" />
          <span className="text-[10px] text-gray-600">847 online</span>
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative max-w-5xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <CommunityEdge />
        </motion.div>
      </div>
    </div>
  );
}
