"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../lib/auth-store";
import { motion } from "framer-motion";
import { Shield, Users, TrendingUp, RefreshCw, ChevronDown, Search, Check } from "lucide-react";

const ADMIN_EMAIL = "rem.vafin.08@gmail.com";
const PLANS = ["core", "edge", "apex"] as const;
type Plan = (typeof PLANS)[number];

interface StatsData {
  total_users: number;
  by_plan: Record<string, number>;
  active_users: number;
}

interface UserRow {
  id: number;
  email: string;
  name: string | null;
  plan: Plan;
  ai_queries_this_month: number;
  is_active: boolean;
  created_at: string | null;
  plan_expires_at: string | null;
}

const PLAN_COLOR: Record<Plan, string> = {
  core:  "text-gray-400 border-gray-600",
  edge:  "text-cyan-400 border-cyan-600",
  apex:  "text-purple-400 border-purple-600",
};

const PLAN_BG: Record<Plan, string> = {
  core:  "bg-gray-500/10",
  edge:  "bg-cyan-500/10",
  apex:  "bg-purple-500/10",
};

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, fetchCurrentUser } = useAuthStore();
  const [ready, setReady] = useState(false);

  const [stats, setStats]     = useState<StatsData | null>(null);
  const [users, setUsers]     = useState<UserRow[]>([]);
  const [search, setSearch]   = useState("");
  const [saving, setSaving]   = useState<Record<number, boolean>>({});
  const [saved, setSaved]     = useState<Record<number, boolean>>({});
  const [pending, setPending] = useState<Record<number, Plan>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    (async () => {
      if (!isAuthenticated) await fetchCurrentUser();
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      router.replace("/app");
    }
  }, [ready, user]);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/v1/admin/stats", { headers: authHeaders() });
    if (res.ok) setStats(await res.json());
  }, []);

  const loadUsers = useCallback(async (q = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/users?search=${encodeURIComponent(q)}&limit=200`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: UserRow[] = await res.json();
      setUsers(data);
      setPending({});
    } catch (e: any) {
      setError(e.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready || !user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return;
    loadStats();
    loadUsers();
  }, [ready, user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(search);
  };

  const setPlan = (userId: number, plan: Plan) =>
    setPending(p => ({ ...p, [userId]: plan }));

  const savePlan = async (userId: number) => {
    const plan = pending[userId];
    if (!plan) return;
    setSaving(s => ({ ...s, [userId]: true }));
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/plan`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated: UserRow = await res.json();
      setUsers(us => us.map(u => u.id === userId ? updated : u));
      setPending(p => { const n = { ...p }; delete n[userId]; return n; });
      setSaved(s => ({ ...s, [userId]: true }));
      setTimeout(() => setSaved(s => { const n = { ...s }; delete n[userId]; return n; }), 2000);
      loadStats();
    } catch {
      // keep pending so user can retry
    } finally {
      setSaving(s => ({ ...s, [userId]: false }));
    }
  };

  if (!ready) return null;
  if (!user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null;

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }) : "—";

  return (
    <div className="min-h-screen page-bg text-white pb-16">
      {/* Header */}
      <div
        className="sticky top-0 z-30"
        style={{ background: "rgba(7,10,18,0.96)", borderBottom: "1px solid rgba(192,132,252,0.15)", backdropFilter: "blur(20px)" }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Admin Panel</h1>
            <p className="text-[11px] text-gray-500">Restricted · {user.email}</p>
          </div>
          <button
            onClick={() => { loadStats(); loadUsers(search); }}
            className="ml-auto p-2 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-gray-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        {stats && (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <StatCard label="Total Users" value={stats.total_users} icon={<Users className="w-5 h-5 text-cyan-400" />} />
            <StatCard label="Active Users" value={stats.active_users} icon={<TrendingUp className="w-5 h-5 text-emerald-400" />} />
            {PLANS.map(p => (
              <StatCard
                key={p}
                label={p.charAt(0).toUpperCase() + p.slice(1)}
                value={stats.by_plan[p] ?? 0}
                accent={p === "apex" ? "text-purple-400" : p === "edge" ? "text-cyan-400" : "text-gray-400"}
              />
            ))}
          </motion.div>
        )}

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by email or name…"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 text-sm hover:bg-purple-600/30 transition-colors"
          >
            Search
          </button>
        </form>

        {/* User table */}
        <motion.div
          className="rounded-xl border border-white/[0.07] overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {error && (
            <div className="px-4 py-3 text-sm text-red-400 bg-red-500/10 border-b border-red-500/20">{error}</div>
          )}

          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] md:grid-cols-[1fr_120px_80px_120px_120px] gap-4 px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06]">
            {["User", "Plan", "Queries", "Joined", "Action"].map(h => (
              <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{h}</span>
            ))}
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-600 text-sm">Loading…</div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-gray-600 text-sm">No users found</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {users.map(u => {
                const currentPlan = pending[u.id] ?? u.plan;
                const changed = pending[u.id] && pending[u.id] !== u.plan;
                return (
                  <div
                    key={u.id}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] md:grid-cols-[1fr_120px_80px_120px_120px] gap-4 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors"
                  >
                    {/* User info */}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{u.name || "—"}</p>
                      <p className="text-[11px] text-gray-500 truncate">{u.email}</p>
                    </div>

                    {/* Plan selector */}
                    <div className="relative">
                      <select
                        value={currentPlan}
                        onChange={e => setPlan(u.id, e.target.value as Plan)}
                        className={`appearance-none w-full text-[12px] font-semibold px-2.5 py-1.5 pr-6 rounded-md border ${PLAN_COLOR[currentPlan]} ${PLAN_BG[currentPlan]} bg-transparent cursor-pointer focus:outline-none`}
                      >
                        {PLANS.map(p => (
                          <option key={p} value={p} className="bg-[#0d1117] text-gray-200">
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600 pointer-events-none" />
                    </div>

                    {/* Queries */}
                    <span className="text-[12px] font-mono text-gray-400 text-center">{u.ai_queries_this_month}</span>

                    {/* Joined */}
                    <span className="text-[11px] text-gray-500 hidden md:block">{fmtDate(u.created_at)}</span>

                    {/* Save button */}
                    <div>
                      {saved[u.id] ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                          <Check className="w-3.5 h-3.5" /> Saved
                        </span>
                      ) : (
                        <button
                          onClick={() => savePlan(u.id)}
                          disabled={!changed || saving[u.id]}
                          className={`text-[11px] px-3 py-1.5 rounded-md border transition-colors ${
                            changed
                              ? "border-purple-500/50 text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 cursor-pointer"
                              : "border-white/[0.05] text-gray-600 cursor-default"
                          }`}
                        >
                          {saving[u.id] ? "…" : "Save"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <p className="text-center text-[11px] text-gray-700">{users.length} users loaded</p>
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon, accent = "text-white",
}: {
  label: string; value: number; icon?: React.ReactNode; accent?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{label}</span>
        {icon}
      </div>
      <p className={`text-2xl font-bold font-mono ${accent}`}>{value}</p>
    </div>
  );
}
