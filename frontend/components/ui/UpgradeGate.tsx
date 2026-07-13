"use client";
/**
 * UpgradeGate — wraps a section that requires a paid plan.
 * Shows a blurred overlay with upgrade CTA when the user's plan is insufficient.
 *
 * Usage:
 *   <UpgradeGate requiredPlan="edge" feature="AI Analysis">
 *     <ExpensiveComponent />
 *   </UpgradeGate>
 */
import { useState } from "react";
import { Lock, Zap, Crown } from "lucide-react";
import { useAuthStore } from "../../lib/auth-store";
import { isAdminUser } from "../../lib/admin";
import { SubscriptionModal } from "../dashboard/SubscriptionModal";
import type { Plan } from "../../lib/auth-store";

const PLAN_ORDER: Plan[] = ["core", "edge", "apex"];

interface UpgradeGateProps {
  requiredPlan: Plan;
  feature?: string;
  children?: React.ReactNode;
  /** When true the children are still rendered but blurred. Default: true. */
  blurContent?: boolean;
}

export function UpgradeGate({
  requiredPlan,
  feature,
  children,
  blurContent = true,
}: UpgradeGateProps) {
  const user = useAuthStore((s) => s.user);
  const currentPlan = (user?.plan as Plan) || "core";
  const [subOpen, setSubOpen] = useState(false);

  const currentIdx  = PLAN_ORDER.indexOf(currentPlan);
  const requiredIdx = PLAN_ORDER.indexOf(requiredPlan);
  const hasAccess   = currentIdx >= requiredIdx;

  if (isAdminUser(user?.email) || hasAccess) return <>{children}</>;

  const PlanIcon = requiredPlan === "apex" ? Crown : Zap;
  const planColor = requiredPlan === "apex" ? "#a78bfa" : "#22d3ee";
  const planLabel = requiredPlan === "apex" ? "Apex" : "Edge";

  return (
    <>
      <div className="relative rounded-xl overflow-hidden">
        {/* Blurred content behind */}
        {blurContent && (
          <div className="pointer-events-none select-none" style={{ filter: "blur(4px)", opacity: 0.35 }}>
            {children}
          </div>
        )}

        {/* Overlay */}
        <div
          className={`${blurContent ? "absolute inset-0" : ""} flex flex-col items-center justify-center gap-4 p-8 text-center`}
          style={{
            background: blurContent
              ? "linear-gradient(180deg, rgba(2,4,20,0.6), rgba(2,4,20,0.9))"
              : "rgba(255,255,255,0.02)",
            border: blurContent ? undefined : `1px solid ${planColor}20`,
            borderRadius: blurContent ? undefined : 16,
            minHeight: blurContent ? undefined : 180,
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: `${planColor}14`,
              border: `1px solid ${planColor}30`,
            }}
          >
            <Lock className="w-5 h-5" style={{ color: planColor }} />
          </div>

          <div>
            <div className="text-sm font-semibold text-white mb-1">
              {feature ? `${feature} requires ${planLabel}` : `${planLabel} plan required`}
            </div>
            <div className="text-xs text-gray-500 max-w-[240px] leading-relaxed">
              {requiredPlan === "apex"
                ? "Upgrade to Apex for full access and unlimited AI."
                : "Upgrade to Edge to unlock this feature."}
            </div>
          </div>

          <button
            onClick={() => setSubOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
            style={{
              background: `linear-gradient(135deg, ${planColor}40, ${planColor}20)`,
              border: `1px solid ${planColor}50`,
              color: planColor,
            }}
          >
            <PlanIcon className="w-4 h-4" />
            Upgrade to {planLabel}
          </button>
        </div>
      </div>

      <SubscriptionModal
        isOpen={subOpen}
        onClose={() => setSubOpen(false)}
        currentPlan={currentPlan}
        onUpgrade={(p) => { setSubOpen(false); }}
      />
    </>
  );
}

/** Inline lock badge — shows next to a feature title */
export function PlanBadge({ plan }: { plan: Plan }) {
  const [subOpen, setSubOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const currentPlan = (user?.plan as Plan) || "core";
  const color = plan === "apex" ? "#a78bfa" : "#22d3ee";
  const label = plan === "apex" ? "Apex" : "Edge";
  const Icon  = plan === "apex" ? Crown : Zap;

  if (isAdminUser(user?.email)) return null;

  return (
    <>
      <button
        onClick={() => setSubOpen(true)}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold"
        style={{
          background: `${color}14`,
          border: `1px solid ${color}30`,
          color,
        }}
      >
        <Icon className="w-2.5 h-2.5" />
        {label}
      </button>
      <SubscriptionModal
        isOpen={subOpen}
        onClose={() => setSubOpen(false)}
        currentPlan={currentPlan}
        onUpgrade={() => setSubOpen(false)}
      />
    </>
  );
}
