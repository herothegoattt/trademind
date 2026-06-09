"use client";

import React from "react";

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = "text-white",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{label}</span>
        {icon}
      </div>
      <p className={`text-2xl font-bold font-mono ${accent}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-white/[0.07] bg-white/[0.01] overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return <div className="py-16 text-center text-gray-600 text-sm">{label}</div>;
}

export function Empty({ label = "Nothing here" }: { label?: string }) {
  return <div className="py-16 text-center text-gray-600 text-sm">{label}</div>;
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="px-4 py-3 text-sm text-red-400 bg-red-500/10 border-b border-red-500/20">
      {message}
    </div>
  );
}

export function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "green" | "red" | "cyan" | "purple" | "amber";
}) {
  const tones: Record<string, string> = {
    gray: "text-gray-400 border-gray-600/40 bg-gray-500/10",
    green: "text-emerald-400 border-emerald-600/40 bg-emerald-500/10",
    red: "text-red-400 border-red-600/40 bg-red-500/10",
    cyan: "text-cyan-400 border-cyan-600/40 bg-cyan-500/10",
    purple: "text-purple-400 border-purple-600/40 bg-purple-500/10",
    amber: "text-amber-400 border-amber-600/40 bg-amber-500/10",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Lightweight bar chart for the signups time-series (no external deps). */
export function BarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex items-end gap-[3px] h-24">
      {data.map((d) => (
        <div key={d.date} className="flex-1 group relative flex items-end">
          <div
            className="w-full rounded-t bg-gradient-to-t from-purple-600/40 to-cyan-500/60 hover:from-purple-500/60 hover:to-cyan-400/80 transition-colors"
            style={{ height: `${Math.max(2, (d.count / max) * 100)}%` }}
          />
          <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded bg-black/90 border border-white/10 px-2 py-1 text-[10px] text-gray-200 z-10">
            {d.count} · {d.date.slice(5)}
          </div>
        </div>
      ))}
    </div>
  );
}
