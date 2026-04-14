"use client";
import { LeftInsightPanel } from "../../components/dashboard/LeftInsightPanel";
import { CoreHub } from "../../components/dashboard/CoreHub";
import { AuthRequiredModal } from "../../components/AuthRequiredModal";
import { useDashboardStore } from "../../lib/store";
import { useAuthAction } from "../../lib/use-auth-action";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

export default function DashboardPage() {
  const init = useDashboardStore((s: any) => s.initDashboard);
  const selectedErrorType = useDashboardStore((s: any) => s.selectedErrorType);
  const selectErrorType = useDashboardStore((s: any) => s.selectErrorType);
  const [mounted, setMounted] = useState(false);
  const { showAuthModal, closeAuthModal } = useAuthAction();

  useEffect(() => {
    init();
    setMounted(true);
  }, [init]);

  if (!mounted) return null;

  const isErrorOpen = selectedErrorType !== null;

  return (
    <>
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        title="Save Your Analysis"
        message="Create a free account to save your trading decisions and analysis. All your data will be securely stored."
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
