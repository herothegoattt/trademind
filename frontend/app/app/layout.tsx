"use client";
import { ReactNode } from "react";
import { AppProviders } from "../../components/providers/AppProviders";
import { SidebarNav } from "../../components/dashboard/SidebarNav";
import { TopStatusBar } from "../../components/dashboard/TopStatusBar";
import { ProtectedLayout } from "../../components/ProtectedLayout";
import { AppEntrance } from "../../components/AppEntrance";
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedLayout>
      <AppProviders>
        <AppEntrance>
          <div className="tm-app h-screen w-screen overflow-hidden bg-[var(--bg)]">
            <SidebarNav />
            <TopStatusBar />
            {/* Content area — fixed, exact fill from below TopStatusBar to screen bottom */}
            <div data-entrance="content" className="app-content fixed top-16 left-0 md:left-56 right-0 bottom-14 md:bottom-0 overflow-hidden">
              {children}
            </div>
          </div>
        </AppEntrance>
      </AppProviders>
    </ProtectedLayout>
  );
}
