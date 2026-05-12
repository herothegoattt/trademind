"use client";

export const dynamic = "force-dynamic";

import CommunityEdge from "../../components/dashboard/CommunityEdge";
import { FeatureGate } from "../../components/FeatureGate";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

      </div>

      {/* Content */}
      <div className="relative max-w-5xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <FeatureGate feature="community_post">
            <CommunityEdge />
          </FeatureGate>
        </motion.div>
      </div>
    </div>
  );
}
