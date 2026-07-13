"use client";

import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Zap, Crown, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { isAdminUser } from "@/lib/admin";
import type { Plan } from "@/lib/auth-store";

type Feature =
  | "ai_chat"
  | "community_post"
  | "setups_create"
  | "trader_dna_ai"
  | "analytics_advanced"
  | "journal_ai"
  | "export";

interface GateConfig {
  minPlan: "core" | "edge" | "apex";
  label: string;
  desc: string;
  color: string;
  glow: string;
}

const GATE: Record<Feature, GateConfig> = {
  ai_chat: {
    minPlan: "core",
    label: "AI Mentor",
    desc: "Ask anything about markets, get instant trade analysis and pattern recognition powered by AI.",
    color: "#22d3ee",
    glow: "34,211,238",
  },
  community_post: {
    minPlan: "edge",
    label: "Community Edge",
    desc: "Post signals, comment on setups, and engage with verified pro traders.",
    color: "#34d399",
    glow: "52,211,153",
  },
  setups_create: {
    minPlan: "edge",
    label: "Setup Builder",
    desc: "Create, save and share unlimited trading setups with compliance checks and AI review.",
    color: "#818cf8",
    glow: "129,140,248",
  },
  trader_dna_ai: {
    minPlan: "core",
    label: "Trader DNA — AI Analysis",
    desc: "Full AI-powered breakdown of your trading patterns, biases and psychological tendencies.",
    color: "#a78bfa",
    glow: "167,139,250",
  },
  analytics_advanced: {
    minPlan: "apex",
    label: "Advanced Analytics",
    desc: "Monte Carlo simulations, advanced risk metrics, and full decision-error deep dives.",
    color: "#fb923c",
    glow: "251,146,60",
  },
  journal_ai: {
    minPlan: "core",
    label: "Journal AI Analysis",
    desc: "Automatic pattern detection, bias alerts and AI feedback on every trade you log.",
    color: "#22d3ee",
    glow: "34,211,238",
  },
  export: {
    minPlan: "apex",
    label: "Data Export",
    desc: "Download your full trading history, analytics and Trader DNA reports.",
    color: "#a78bfa",
    glow: "167,139,250",
  },
};

const PLAN_ORDER: Plan[] = ["core", "edge", "apex"];

function planMeetsMinimum(userPlan: Plan, minPlan: "core" | "edge" | "apex"): boolean {
  return PLAN_ORDER.indexOf(userPlan) >= PLAN_ORDER.indexOf(minPlan as Plan);
}

function openUpgradeModal(plan: "edge" | "apex") {
  window.dispatchEvent(new CustomEvent("open-upgrade-modal", { detail: { plan } }));
}

interface FeatureGateProps {
  feature: Feature;
  children: ReactNode;
  /** Show a compact inline badge instead of full gate wall */
  inline?: boolean;
}

export function FeatureGate({ feature, children, inline = false }: FeatureGateProps) {
  const user = useAuthStore((s) => s.user);
  const plan = (user?.plan as Plan) || "core";
  const cfg = GATE[feature];

  if (isAdminUser(user?.email) || planMeetsMinimum(plan, cfg.minPlan)) {
    return <>{children}</>;
  }

  if (inline) {
    return (
      <button
        onClick={() => openUpgradeModal(cfg.minPlan as "edge" | "apex")}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
        style={{
          background: `rgba(${cfg.glow},0.08)`,
          border: `1px solid rgba(${cfg.glow},0.25)`,
          color: cfg.color,
        }}
      >
        <Lock size={10} />
        {cfg.minPlan === "apex" ? "Apex" : cfg.minPlan === "edge" ? "Edge" : "Core"}
      </button>
    );
  }

  return <GateWall cfg={cfg} />;
}

function GateWall({ cfg }: { cfg: GateConfig }) {
  const [hovering, setHovering] = useState(false);
  const PlanIcon = cfg.minPlan === "apex" ? Crown : Zap;
  const upgradeTarget = cfg.minPlan === "core" ? "edge" : cfg.minPlan;

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full min-h-[320px] px-6 select-none">
      {/* Ambient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, rgba(${cfg.glow},0.07) 0%, transparent 60%)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col items-center gap-6 text-center max-w-sm relative z-10"
      >
        {/* Icon */}
        <motion.div
          animate={{ boxShadow: [`0 0 0 0 rgba(${cfg.glow},0)`, `0 0 0 12px rgba(${cfg.glow},0)`, `0 0 0 0 rgba(${cfg.glow},0)`] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: `rgba(${cfg.glow},0.08)`,
            border: `1.5px solid rgba(${cfg.glow},0.25)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Lock size={28} color={cfg.color} strokeWidth={1.5} />
        </motion.div>

        <div className="flex flex-col gap-2">
          {/* Plan badge */}
          <div className="flex justify-center">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest"
              style={{
                background: `rgba(${cfg.glow},0.1)`,
                border: `1px solid rgba(${cfg.glow},0.3)`,
                color: cfg.color,
              }}
            >
              <PlanIcon size={11} />
              {cfg.minPlan} plan
            </span>
          </div>

          <h3 className="text-xl font-semibold text-white leading-tight">
            {cfg.label}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            {cfg.desc}
          </p>
        </div>

        <motion.button
          onHoverStart={() => setHovering(true)}
          onHoverEnd={() => setHovering(false)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => openUpgradeModal(upgradeTarget as "edge" | "apex")}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all"
          style={{
            background: `linear-gradient(135deg, rgba(${cfg.glow},0.25), rgba(${cfg.glow},0.12))`,
            border: `1px solid rgba(${cfg.glow},0.4)`,
            boxShadow: hovering ? `0 0 24px rgba(${cfg.glow},0.3)` : `0 0 0px rgba(${cfg.glow},0)`,
            transition: "box-shadow 0.25s ease",
          }}
        >
          Upgrade to {cfg.minPlan === "apex" ? "Apex" : "Edge"}
          <ChevronRight size={14} />
        </motion.button>
      </motion.div>
    </div>
  );
}
