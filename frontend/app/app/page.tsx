"use client";

// This dashboard reads runtime search params (payment redirect, upgrade CTA) so
// it must be rendered dynamically, not statically prerendered at build time.
export const dynamic = "force-dynamic";

import { LeftInsightPanel } from "../../components/dashboard/LeftInsightPanel";
import { CoreHub } from "../../components/dashboard/CoreHub";
import { AuthRequiredModal } from "../../components/AuthRequiredModal";
import { SubscriptionModal } from "../../components/dashboard/SubscriptionModal";
import { useDashboardStore } from "../../lib/store";
import { useAuthAction } from "../../lib/use-auth-action";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useAuthStore } from "../../lib/auth-store";
import type { Plan } from "../../lib/auth-store";

export default function DashboardPage() {
  // useSearchParams (used inside) requires a Suspense boundary during prerender.
  return (
    <Suspense fallback={null}>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const init = useDashboardStore((s: any) => s.initDashboard);
  const selectedErrorType = useDashboardStore((s: any) => s.selectedErrorType);
  const selectErrorType = useDashboardStore((s: any) => s.selectErrorType);
  const [mounted, setMounted] = useState(false);
  const [planSuccess, setPlanSuccess] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<Plan>("edge");
  const { showAuthModal, closeAuthModal } = useAuthAction();
  const searchParams = useSearchParams();
  const { fetchCurrentUser, user } = useAuthStore();

  useEffect(() => {
    init();
    setMounted(true);
    // Payment success redirect — confirm the plan synchronously instead of
    // waiting on the async webhook (which often lands after this redirect,
    // leaving a paid user locked). Falls back to polling /me as a safety net.
    if (searchParams.get("plan_success") === "1") {
      setPlanSuccess(true);
      const sessionId = searchParams.get("session_id") || undefined;
      const url = new URL(window.location.href);
      url.searchParams.delete("plan_success");
      url.searchParams.delete("session_id");
      window.history.replaceState({}, "", url.toString());

      (async () => {
        const token =
          useAuthStore.getState().token ||
          (typeof window !== "undefined" ? localStorage.getItem("access_token") : null);
        if (!token) return;
        const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
        // Up to 5 attempts: authoritatively sync from provider, then refresh user.
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            const res = await fetch("/api/v1/payments/confirm", {
              method: "POST",
              headers,
              body: JSON.stringify({ session_id: sessionId }),
            });
            if (res.ok) {
              const data = await res.json().catch(() => null);
              await fetchCurrentUser();
              if (data?.activated || (data?.plan && data.plan !== "core")) break;
            }
          } catch {
            /* transient — retry */
          }
          await new Promise((r) => setTimeout(r, 1500));
        }
      })();
    }
    // Auto-open upgrade modal from landing page plan CTA
    const upgradePlanParam = searchParams.get("upgrade_plan");
    if (upgradePlanParam && (upgradePlanParam === "edge" || upgradePlanParam === "apex")) {
      setUpgradePlan(upgradePlanParam as Plan);
      setUpgradeModalOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("upgrade_plan");
      url.searchParams.delete("billing");
      window.history.replaceState({}, "", url.toString());
    }

    // Global upgrade modal trigger (dispatched by FeatureGate / any component)
    const handleOpenUpgrade = (e: Event) => {
      const plan = (e as CustomEvent).detail?.plan as Plan;
      if (plan === "edge" || plan === "apex") setUpgradePlan(plan);
      setUpgradeModalOpen(true);
    };
    window.addEventListener("open-upgrade-modal", handleOpenUpgrade);
    return () => window.removeEventListener("open-upgrade-modal", handleOpenUpgrade);
  }, [init]);

  if (!mounted) return null;

  const isErrorOpen = selectedErrorType !== null;

  return (
    <>
      {/* Plan upgrade success toast */}
      {planSuccess && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(7,9,18,0.98), rgba(20,10,40,0.98))",
            border: "1px solid rgba(167,139,250,0.4)",
            boxShadow: "0 0 40px rgba(167,139,250,0.2)",
          }}
        >
          <Sparkles className="w-5 h-5 text-violet-400" />
          <div>
            <div className="text-sm font-semibold text-white">Subscription activated!</div>
            <div className="text-xs text-gray-400">Your plan has been upgraded successfully.</div>
          </div>
          <button onClick={() => setPlanSuccess(false)} className="ml-2 text-gray-600 hover:text-gray-300 text-xs">✕</button>
        </div>
      )}

      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        title="Save Your Analysis"
        message="Create a free account to save your trading decisions and analysis. All your data will be securely stored."
      />

      {/* Auto-open upgrade modal when coming from landing page plan CTA */}
      <SubscriptionModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        currentPlan={(user?.plan as Plan) || "core"}
        onUpgrade={() => setUpgradeModalOpen(false)}
      />

      {/* ── Error detail overlay ── */}
      {isErrorOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-[#09090f]">
          <div className="flex items-center h-12 px-5 border-b border-white/[0.05] shrink-0">
            <button
              onClick={() => selectErrorType(null)}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft size={15} />
              Dashboard
            </button>
          </div>
          <div className="flex-1 overflow-hidden flex">
            <LeftInsightPanel />
          </div>
        </div>
      )}

      {/* ── Main dashboard — fills the fixed content area exactly ── */}
      {!isErrorOpen && <CoreHub />}
    </>
  );
}
