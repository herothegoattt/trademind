"use client";

import { useMemo, useState } from "react";
import {
  ClosedTradeLike, Metrics, Session, SESSION_LABEL, DAY_LABEL,
  computeMetrics, filterClosed, sessionOf,
} from "./analytics";

const C = {
  bg: "#0f1420", card: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.07)",
  border2: "rgba(255,255,255,0.12)", dim: "#5b667d", muted: "#8b96ab",
  up: "#22c55e", down: "#ef4444", blue: "#3b82f6", text: "#d3dbe8",
};

const fmtMoney = (n: number) => {
  const sign = n < 0 ? "-" : "";
  const a = Math.abs(n);
  return `${sign}$${a.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtDate = (u: number) =>
  new Date(u * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function Card({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: C.dim }}>{label}</p>
      <p className="text-[15px] font-bold font-mono mt-1" style={{ color: color ?? C.text }}>{value}</p>
    </div>
  );
}

function EquityCurve({ curve, start }: { curve: { t: number; balance: number }[]; start: number }) {
  const W = 560, H = 120;
  const pts = curve;
  if (pts.length < 2) {
    return (
      <div className="flex items-center justify-center" style={{ height: H, color: C.dim, fontSize: 11 }}>
        No closed trades yet — run the simulation to see the balance curve.
      </div>
    );
  }
  const min = Math.min(start, ...pts.map((p) => p.balance));
  const max = Math.max(start, ...pts.map((p) => p.balance));
  const span = max - min || 1;
  const px = (i: number) => (i / (pts.length - 1)) * W;
  const py = (v: number) => H - ((v - min) / span) * (H - 8) - 4;
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(p.balance).toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1].balance;
  const color = last >= start ? C.up : C.down;

  return (
    <div className="relative" style={{ width: "100%", height: H }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: H }}>
        <defs>
          <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d} L${W},${H} L0,${H} Z`} fill="url(#eqFill)" />
        <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        <circle cx={px(pts.length - 1)} cy={py(last)} r="3" fill={color} />
      </svg>
      <span className="absolute right-2 top-1 text-[10px] font-bold font-mono" style={{ color }}>
        {fmtMoney(last)}
      </span>
      <span className="absolute left-2 top-1 text-[9px] font-semibold font-mono" style={{ color: C.dim }}>
        Equity ({pts.length} trades)
      </span>
    </div>
  );
}

export default function AnalyticsPanel({
  closed,
  start,
}: {
  closed: (ClosedTradeLike & { symbol?: string })[];
  start: number;
}) {
  const [session, setSession] = useState<Session | "all">("all");
  const [day, setDay] = useState<number | "all">("all");
  const [sym, setSym] = useState("");

  const base = useMemo(() => closed.map((c) => ({ ...c, symbol: c.symbol || undefined })), [closed]);

  const filtered = useMemo(
    () => filterClosed(base, { session, day, symbol: sym }),
    [base, session, day, sym],
  );

  const m: Metrics = useMemo(
    () => computeMetrics(filtered, start, 100),
    [filtered, start],
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Filters */}
      <div className="grid grid-cols-2 gap-1.5">
        <label className="flex flex-col gap-1">
          <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: C.dim }}>Symbol</span>
          <input
            value={sym}
            onChange={(e) => setSym(e.target.value)}
            placeholder="All (e.g. BTC-USD)"
            className="w-full bg-transparent text-[11px] font-mono outline-none rounded-lg px-2 py-1.5"
            style={{ background: C.card, border: `1px solid ${C.border}`, color: "#fff" }}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: C.dim }}>Session</span>
          <div className="flex gap-1 flex-wrap">
            {(["all", "asian", "london", "newyork", "other"] as (Session | "all")[]).map((s) => (
              <button
                key={s}
                onClick={() => setSession(s)}
                className="px-2 py-1 rounded-md text-[9px] font-bold transition-all"
                style={{
                  background: session === s ? "rgba(59,130,246,0.14)" : C.card,
                  border: session === s ? "1px solid rgba(59,130,246,0.4)" : `1px solid ${C.border}`,
                  color: session === s ? "#60a5fa" : C.muted,
                }}
              >
                {s === "all" ? "All" : SESSION_LABEL[s]}
              </button>
            ))}
          </div>
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: C.dim }}>Weekday</span>
        <div className="flex gap-1 flex-wrap">
          {(["all"] as (number | "all")[]).concat([0, 1, 2, 3, 4, 5, 6]).map((d) => (
            <button
              key={d}
              onClick={() => setDay(d)}
              className="px-2 py-1 rounded-md text-[9px] font-bold transition-all"
              style={{
                background: day === d ? "rgba(59,130,246,0.14)" : C.card,
                border: day === d ? "1px solid rgba(59,130,246,0.4)" : `1px solid ${C.border}`,
                color: day === d ? "#60a5fa" : C.muted,
              }}
            >
              {d === "all" ? "Any" : DAY_LABEL[d]}
            </button>
          ))}
        </div>
      </label>

      {/* Equity curve */}
      <div className="rounded-xl p-2" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <EquityCurve curve={m.equityCurve} start={start} />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-1.5">
        <Card label="Trades" value={String(m.count)} />
        <Card label="Net P&L" value={fmtMoney(m.net)} color={m.net >= 0 ? C.up : C.down} />
        <Card label="Win Rate" value={m.count ? `${(m.winRate * 100).toFixed(1)}%` : "—"} />
        <Card label="Profit Factor" value={m.profitFactor === 9999 ? "∞" : m.count ? m.profitFactor.toFixed(2) : "—"} />
        <Card label="Max DD" value={`-${m.maxDrawdown.toFixed(1)}%`} color={C.down} />
        <Card label="Now DD" value={`-${m.currentDrawdown.toFixed(1)}%`} color={C.down} />
        <Card label="Expectancy" value={fmtMoney(m.expectancy)} color={m.expectancy >= 0 ? C.up : C.down} />
        <Card label="Exp (R)" value={m.count && m.expectancyR ? `${m.expectancyR.toFixed(2)}R` : "—"} color={m.expectancyR >= 0 ? C.up : C.down} />
        <Card label="Total R" value={`${m.totalR.toFixed(2)}R`} color={m.totalR >= 0 ? C.up : C.down} />
        <Card label="Avg Win" value={fmtMoney(m.avgWin)} color={C.up} />
        <Card label="Avg Loss" value={fmtMoney(m.avgLoss)} color={C.down} />
        <Card label="Best / Worst" value={`${fmtMoney(m.best)} / ${fmtMoney(m.worst)}`} />
      </div>

      {/* Trade list */}
      <div className="mt-1 flex flex-col gap-1">
        {filtered.length === 0 && (
          <div className="text-center py-6 text-[11px]" style={{ color: C.dim }}>
            No trades match the filters.
          </div>
        )}
        {filtered.slice(0, 40).map((t) => (
          <div key={t.id} className="rounded-lg px-2 py-1.5 flex flex-col gap-0.5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold" style={{ color: t.side === "buy" ? C.up : C.down }}>
                {t.side.toUpperCase()} · {t.symbol || "?"} · {SESSION_LABEL[sessionOf(t.closeTime)]}
              </span>
              <span className="text-[10px] font-bold font-mono" style={{ color: t.pnl >= 0 ? C.up : C.down }}>{fmtMoney(t.pnl)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono" style={{ color: C.dim }}>
                {t.entry.toFixed(t.entry < 1 ? 4 : 2)} → {t.exit.toFixed(t.exit < 1 ? 4 : 2)}
              </span>
              <span className="text-[8px] font-semibold" style={{ color: C.muted }}>
                {t.reason} · {fmtDate(t.closeTime)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}