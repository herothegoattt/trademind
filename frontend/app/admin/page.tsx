"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield,
  RefreshCw,
  LayoutDashboard,
  Users as UsersIcon,
  Activity as ActivityIcon,
  Ticket,
  Gift,
} from "lucide-react";
import { useAuthStore } from "../../lib/auth-store";
import { ADMIN_EMAIL, Stats, adminFetch } from "../../lib/admin";
import Dashboard from "./_tabs/Dashboard";
import Users from "./_tabs/Users";
import Activity from "./_tabs/Activity";
import Promos from "./_tabs/Promos";
import Referrals from "./_tabs/Referrals";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: UsersIcon },
  { id: "activity", label: "Activity", icon: ActivityIcon },
  { id: "promos", label: "Promos", icon: Ticket },
  { id: "referrals", label: "Referrals", icon: Gift },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, fetchCurrentUser } = useAuthStore();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<TabId>("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);

  const isAdmin = !!user && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Auth guard
  useEffect(() => {
    (async () => {
      if (!isAuthenticated) await fetchCurrentUser();
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready && !isAdmin) router.replace("/app");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isAdmin]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await adminFetch<Stats>("/stats"));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (ready && isAdmin) loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isAdmin]);

  if (!ready || !isAdmin) return null;

  return (
    <div className="min-h-screen page-bg text-white pb-16">
      {/* Header */}
      <div
        className="sticky top-0 z-30"
        style={{
          background: "rgba(7,10,18,0.96)",
          borderBottom: "1px solid rgba(192,132,252,0.15)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Admin Panel</h1>
            <p className="text-[11px] text-gray-500">Restricted · {user!.email}</p>
          </div>
          <button
            onClick={loadStats}
            title="Refresh metrics"
            className="ml-auto p-2 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-gray-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap transition-colors ${
                  active ? "text-white" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {active && (
                  <motion.div
                    layoutId="admin-tab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {tab === "dashboard" && <Dashboard stats={stats} />}
        {tab === "users" && <Users onChanged={loadStats} />}
        {tab === "activity" && <Activity />}
        {tab === "promos" && <Promos />}
        {tab === "referrals" && <Referrals />}
      </div>
    </div>
  );
}
