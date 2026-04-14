"use client";
import { ReactNode, useEffect } from "react";
import { AppProviders } from "../../components/providers/AppProviders";
import { SidebarNav } from "../../components/dashboard/SidebarNav";
import { TopStatusBar } from "../../components/dashboard/TopStatusBar";
import { ProtectedLayout } from "../../components/ProtectedLayout";
import { useAuthStore } from "../../lib/auth-store";

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    // Initialize authentication on app load
    fetchCurrentUser();
  }, []);

  return (
    <ProtectedLayout>
      <AppProviders>
        {/* no scrolling - page is fixed height/width */}
        <div className="h-screen w-screen overflow-hidden bg-[var(--bg)]">
          <SidebarNav />
          <div className="flex flex-col h-full ml-0 md:ml-56">
            <TopStatusBar />
            <div className="flex-1 relative overflow-hidden pt-16 pb-14 md:pb-0">
              {children}
            </div>
          </div>
        </div>
      </AppProviders>
    </ProtectedLayout>
  );
}
