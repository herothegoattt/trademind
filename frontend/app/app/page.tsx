"use client";
import { SidebarNav } from "../../components/dashboard/SidebarNav";
import { RightInsightPanel } from "../../components/dashboard/RightInsightPanel";
import { LeftInsightPanel } from "../../components/dashboard/LeftInsightPanel";
import { CoreHub } from "../../components/dashboard/CoreHub";
import { AuthRequiredModal } from "../../components/AuthRequiredModal";
import { useDashboardStore } from "../../lib/store";
import { useAuthAction } from "../../lib/use-auth-action";
import { useEffect, useState } from "react";

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
    <div className="h-screen w-screen flex flex-col bg-[var(--bg)] text-white overflow-hidden">
      {/* Auth Modal for unauthenticated users trying to save */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        title="Save Your Analysis"
        message="Create a free account to save your trading decisions and analysis. All your data will be securely stored."
      />

      {/* Full Screen Error View */}
      {isErrorOpen && (
        <div className="absolute inset-0 z-40 flex flex-col bg-black">
          <div className="flex items-center h-16 px-6 bg-gradient-to-r from-black/80 via-slate-900/60 to-black/80 backdrop-blur-xl border-b border-cyan-500/20 shadow-lg">
            <button
              onClick={() => selectErrorType(null)}
              className="px-4 py-2.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <LeftInsightPanel />
          </div>
        </div>
      )}

      {/* Main Content Area - Three-zone layout with improved proportions */}
      {!isErrorOpen && (
        <div className="flex flex-1 gap-0 overflow-hidden">
          {/* Left Sidebar Navigation - Fixed 72px when collapsed, ~256px expanded */}
          <SidebarNav />

          {/* Center area - AI Core */}
          <div className="flex-1 overflow-hidden relative">
            <CoreHub />
          </div>
        </div>
      )}
    </div>
  );
}
