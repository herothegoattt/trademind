"use client";

export const dynamic = "force-dynamic";

import CommunityEdge from "../../components/dashboard/CommunityEdge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useT } from "../../lib/i18n";

export default function CommunityEdgePage() {
  const t = useT();

  return (
    <div
      className="h-screen overflow-y-auto text-white"
      style={{ background: "linear-gradient(160deg, #020308 0%, #020210 50%, #020308 100%)" }}
    >
      {/* Ambient glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 right-0 w-80 h-80 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(244,114,182,0.03) 0%, transparent 70%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Sticky top bar */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-3 sm:px-6 h-14"
        style={{
          background: "rgba(2,3,8,0.92)",
          borderBottom: "1px solid rgba(34,211,238,0.1)",
          backdropFilter: "blur(20px)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <Link
            href="/app"
            className="p-1.5 rounded-lg transition-all hover:bg-cyan-500/10"
            style={{ border: "1px solid rgba(34,211,238,0.15)", color: "#22d3ee" }}
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="w-px h-5" style={{ background: "rgba(34,211,238,0.2)" }} />
          <span className="text-sm font-semibold text-gray-400">{t("ce_back")}</span>
        </motion.div>

      </div>

      {/* Content */}
      <div className="relative max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <CommunityEdge />
        </motion.div>
      </div>
    </div>
  );
}
