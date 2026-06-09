"use client";

import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  Ban,
  DollarSign,
  Sparkles,
  Activity,
  BookOpen,
  LineChart,
  Gift,
  Ticket,
  TrendingUp,
} from "lucide-react";
import { Stats, money, PLANS, cap } from "../../../lib/admin";
import { StatCard, Panel, BarChart } from "../_components/ui";

export default function Dashboard({ stats }: { stats: Stats | null }) {
  if (!stats) return <div className="py-16 text-center text-gray-600 text-sm">Loading metrics…</div>;

  const growthCards = [
    { label: "Today", value: stats.new_users_today },
    { label: "Last 7 days", value: stats.new_users_7d },
    { label: "Last 30 days", value: stats.new_users_30d },
  ];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="MRR (est.)"
          value={money(stats.mrr_cents)}
          sub={`${stats.paying_users} paying`}
          accent="text-emerald-400"
          icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
        />
        <StatCard
          label="Total Users"
          value={stats.total_users}
          sub={`${stats.banned_users} banned`}
          icon={<Users className="w-5 h-5 text-cyan-400" />}
        />
        <StatCard
          label="Active Users"
          value={stats.active_users}
          icon={<UserCheck className="w-5 h-5 text-emerald-400" />}
        />
        <StatCard
          label="AI Queries / mo"
          value={stats.ai_queries_month.toLocaleString()}
          accent="text-purple-400"
          icon={<Sparkles className="w-5 h-5 text-purple-400" />}
        />
      </div>

      {/* Growth + chart */}
      <Panel className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-gray-200">New signups · last 30 days</h2>
          </div>
          <div className="flex gap-5">
            {growthCards.map((g) => (
              <div key={g.label} className="text-right">
                <p className="text-lg font-bold font-mono text-white">{g.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-600">{g.label}</p>
              </div>
            ))}
          </div>
        </div>
        <BarChart data={stats.signups_30d} />
      </Panel>

      {/* Plan breakdown */}
      <div className="grid grid-cols-3 gap-4">
        {PLANS.map((p) => {
          const count = stats.by_plan[p] ?? 0;
          const pct = stats.total_users ? Math.round((count / stats.total_users) * 100) : 0;
          const accent = p === "apex" ? "text-purple-400" : p === "edge" ? "text-cyan-400" : "text-gray-400";
          return (
            <Panel key={p} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{cap(p)}</span>
                <span className="text-[10px] text-gray-600">{pct}%</span>
              </div>
              <p className={`text-2xl font-bold font-mono mt-1 ${accent}`}>{count}</p>
              <div className="mt-2 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                <div
                  className={`h-full ${p === "apex" ? "bg-purple-500" : p === "edge" ? "bg-cyan-500" : "bg-gray-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </Panel>
          );
        })}
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Actions today" value={stats.actions_today} icon={<Activity className="w-5 h-5 text-amber-400" />} />
        <StatCard label="Decisions" value={stats.total_decisions} icon={<BookOpen className="w-5 h-5 text-cyan-400" />} />
        <StatCard label="Trades" value={stats.total_trades} icon={<LineChart className="w-5 h-5 text-emerald-400" />} />
        <StatCard label="Setups" value={stats.total_setups} icon={<BookOpen className="w-5 h-5 text-gray-400" />} />
        <StatCard label="News items" value={stats.total_news} icon={<BookOpen className="w-5 h-5 text-gray-400" />} />
        <StatCard
          label="Referral signups"
          value={stats.referral_signups}
          sub={money(stats.referral_earned_cents) + " earned"}
          icon={<Gift className="w-5 h-5 text-purple-400" />}
        />
        <StatCard label="Active promos" value={stats.active_promos} icon={<Ticket className="w-5 h-5 text-amber-400" />} />
      </div>
    </motion.div>
  );
}
