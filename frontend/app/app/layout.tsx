"use client";
import { ReactNode } from "react";
import { AppProviders } from "../../components/providers/AppProviders";
import { SidebarNav } from "../../components/dashboard/SidebarNav";
import { TopStatusBar } from "../../components/dashboard/TopStatusBar";
import { ProtectedLayout } from "../../components/ProtectedLayout";
import { OnboardingFlow } from "../../components/OnboardingFlow";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedLayout>
      <AppProviders>
        <div className="h-screen w-screen overflow-hidden bg-[var(--bg)]">
          <SidebarNav />
          <TopStatusBar />
          {/* Content area — fixed, exact fill from below TopStatusBar to screen bottom */}
          <div className="fixed top-16 left-0 md:left-56 right-0 bottom-0 overflow-y-auto pb-14 md:pb-0">
            {children}
          </div>
        </div>
        <OnboardingFlow />
      </AppProviders>
    </ProtectedLayout>
  );
}
