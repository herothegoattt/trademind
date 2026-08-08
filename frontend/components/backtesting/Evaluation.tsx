"use client";
import { useState } from "react";
import { Sliders } from "lucide-react";
/* ── Evaluation simulator (prop-firm style) — Nami Replays vibe ──
   Reuses the replay's own trade engine: closed trades (realized PnL)
   + open positions (floating) drive the account state and rules.  */

export type Side = "buy" | "sell";

export interface OpenPos {
  id: string;
  side: Side;
  size: number;
  entry: number;
  sl: number | null;
  tp: number | null;
  openBar: number;
  openTime: number;
  breakEven?: boolean;
}

export interface ClosedTrade {
  id: string;
  side: Side;
  size: number;
  entry: number;
  exit: number;
  sl: number | null;
  tp: number | null;
  pnl: number;
  reason: "TP" | "SL" | "Manual" | "Session End";
  openTime: number;
  closeTime: number;
  symbol?: string;
  partial?: boolean;
}

export interface EvalConfig {
  balance: number;      // starting account, $
  targetPct: number;    // profit target, %
  dailyLossPct: number; // max daily loss, %
  maxDDPct: number;     // max trailing drawdown, %
}

export const DEFAULT_EVAL_CFG: EvalConfig = {
  balance: 50000,
  targetPct: 10,
  dailyLossPct: 5,
  maxDDPct: 8,
};

export type EvalStatus = "ACTIVE" | "PASSED" | "DAILY_LOSS" | "MAX_DD" | "CANCELLED";

export interface EvalResult {
  balance: number;
  realized: number;
  floating: number;
  equity: number;
  targetAmount: number;
  remaining: number;
  progress: number;      // 0..1 towards target
  dailyPnl: number;
  dailyLimit: number;
  maxDrawdown: number;
  ddAmount: number;
  wins: number;
  trades: number;
  status: EvalStatus;
}

const CONTRACT = 100;

function dayKey(ts: number): string {
  return new Date(ts * 1000).toDateString();
}

export function computeEvaluation(
  trades: ClosedTrade[],
  positions: OpenPos[],
  currentBar: { time: number; close: number } | null,
  cfg: EvalConfig,
): EvalResult {
  const balance = cfg.balance;
  const realized = trades.reduce((a, t) => a + t.pnl, 0);
  const floating = positions.reduce((a, p) => {
    if (!currentBar) return a;
    const dir = p.side === "buy" ? 1 : -1;
    return a + dir * (currentBar.close - p.entry) * p.size * CONTRACT;
  }, 0);
  const equity = balance + realized + floating;

  const targetAmount = (balance * cfg.targetPct) / 100;
  const ddAmount = (balance * cfg.maxDDPct) / 100;

  /* trailing drawdown over the realized equity curve (then fold floating in) */
  const sorted = [...trades].sort((a, b) => a.closeTime - b.closeTime);
  let peak = balance;
  let maxDrawdown = 0;
  let run = balance;
  for (const t of sorted) {
    run += t.pnl;
    if (run > peak) peak = run;
    const dd = peak - run;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }
  if (equity > peak) peak = equity;
  maxDrawdown = Math.max(maxDrawdown, peak - equity);

  /* daily P&L: realized today + current floating (marginal) */
  const day = currentBar ? dayKey(currentBar.time) : null;
  let dailyPnl = floating;
  for (const t of trades) {
    if (day && dayKey(t.closeTime) === day) dailyPnl += t.pnl;
  }
  const dailyLimit = (balance * cfg.dailyLossPct) / 100;

  const wins = trades.filter((t) => t.pnl > 0).length;

  let status: EvalStatus = "ACTIVE";
  if (equity >= balance + targetAmount) status = "PASSED";
  else if (maxDrawdown >= ddAmount) status = "MAX_DD";
  else if (dailyPnl <= -dailyLimit) status = "DAILY_LOSS";

  const progress = Math.max(0, Math.min(1, (equity - balance) / targetAmount));

  return {
    balance,
    realized,
    floating,
    equity,
    targetAmount,
    remaining: Math.max(0, targetAmount - (equity - balance)),
    progress,
    dailyPnl,
    dailyLimit,
    maxDrawdown,
    ddAmount,
    wins,
    trades: trades.length,
    status,
  };
}

/* ── UI ─────────────────────────────────────────────────────────── */

const EvalTheme = {
  bg: "#0b0f17",
  panel: "rgba(18,24,36,0.72)",
  line: "rgba(255,255,255,0.08)",
  text: "#e6ecf5",
  muted: "#93a3bd",
  dim: "#5b6a84",
  green: "#2ec98c",
  red: "#ff5c58",
  amber: "#f6b94f",
  blue: "#5aa5ff",
  violet: "#a78bfa",
};

export function EvaluationPanel({
  cfg, onCfg,
  trades, positions, current,
  onReset,
}: {
  cfg: EvalConfig;
  onCfg: (c: EvalConfig) => void;
  trades: ClosedTrade[];
  positions: OpenPos[];
  current: { time: number; close: number } | null;
  onReset: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EvalConfig>(cfg);
  const r = computeEquilibrium(trades, positions, current, cfg);

  const openEdit = () => { setDraft(cfg); setEditing(true); };
  const save = () => { onCfg(draft); setEditing(false); };

  return (
    <div
      className="w-[300px] flex-shrink-0 flex flex-col min-h-0"
      style={{ borderLeft: `1px solid ${EvalTheme.line}`, background: EvalTheme.panel, backdropFilter: "blur(14px)" }}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black"
              style={{ background: "linear-gradient(135deg,#5aa7ff,#a78bfa)", color: "#fff" }}>
              E
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[12px] font-bold" style={{ color: EvalTheme.text }}>Evaluation</span>
              <span className="text-[8px] font-semibold tracking-[0.18em]" style={{ color: EvalTheme.dim }}>TRADING LAB</span>
            </div>
          </div>
          <button
            onClick={openEdit}
            title="Evaluation settings"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${EvalTheme.line}`, color: EvalTheme.muted }}
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Status pill */}
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor(r.status).dot }} />
          <span className="text-[10px] font-bold tracking-wide" style={{ color: statusColor(r.status).text }}>
            {r.status === "PASSED" ? "ACCOUNT PASSED" : r.status === "ACTIVE" ? "EVALUATION ACTIVE" : r.status === "DAILY_LOSS" ? "DAILY LIMIT HIT" : r.status === "MAX_DD" ? "MAX DRAWDOWN" : "CANCELLED"}
          </span>
        </div>
      </div>

      {/* Balance + equity chips */}
      <div className="flex-shrink-0 px-3 pb-1 grid grid-cols-2 gap-2">
        <EvalCell label="Starting balance" value={fmtMoney(r.balance)} />
        <EvalCell label="Realized" value={`${r.realized >= 0 ? "+" : ""}${fmtMoney(r.realized)}`} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 flex flex-col gap-3">
        {/* Equity card */}
        <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(8,12,18,0.5)", border: `1px solid ${EvalTheme.line}` }}>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: EvalTheme.dim }}>Equity</div>
              <div className="text-[22px] font-bold font-mono leading-none mt-1" style={{ color: moneyColor(r.equity - r.balance) }}>
                {fmtMoney(r.equity)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: EvalTheme.dim }}>P&amp;L</div>
              <div className="text-[13px] font-bold font-mono mt-1" style={{ color: moneyColor(r.equity - r.balance) }}>
                {r.equity - r.balance >= 0 ? "+" : ""}{fmtMoney(r.equity - r.balance)}
              </div>
            </div>
          </div>

          {/* profit-target progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-semibold" style={{ color: EvalTheme.muted }}>Profit target</span>
              <span className="text-[9px] font-mono font-bold" style={{ color: EvalTheme.blue }}>
                {fmtMoney(r.equity - r.balance)} / {fmtMoney(r.targetAmount)}
              </span>
            </div>
            <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${r.progress * 100}%`, background: r.progress >= 1 ? EvalTheme.green : "linear-gradient(90deg,#5aa7ff,#a78bfa)" }} />
            </div>
          </div>
        </div>

        {/* Drawdown card */}
        <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${EvalTheme.line}` }}>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: EvalTheme.dim }}>Max drawdown (trailing)</div>
              <div className="text-[19px] font-bold font-mono leading-none mt-1" style={{ color: r.maxDrawdown >= r.ddAmount ? EvalTheme.red : EvalTheme.text }}>
                {fmtMoney(r.maxDrawdown)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: EvalTheme.dim }}>Limit</div>
              <div className="text-[12px] font-bold font-mono mt-1" style={{ color: EvalTheme.muted }}>{fmtMoney(r.ddAmount)}</div>
            </div>
          </div>
          <div className="relative mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (r.maxDrawdown / r.ddAmount) * 100)}%`, background: r.maxDrawdown > r.ddAmount ? EvalTheme.red : r.maxDrawdown > r.ddAmount * 0.6 ? EvalTheme.amber : EvalTheme.green }} />
          </div>
        </div>

        {/* Daily */}
        <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${EvalTheme.line}` }}>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: EvalTheme.dim }}>Daily P&amp;L</div>
              <div className="text-[19px] font-bold font-mono leading-none mt-1" style={{ color: moneyColor(r.dailyPnl) }}>
                {r.dailyPnl >= 0 ? "+" : ""}{fmtMoney(r.dailyPnl)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: EvalTheme.dim }}>Limit</div>
              <div className="text-[12px] font-bold font-mono mt-1" style={{ color: r.dailyPnl <= -r.dailyLimit ? EvalTheme.red : EvalTheme.muted }}>
                −{fmtMoney(r.dailyLimit)}
              </div>
            </div>
          </div>
          <div className="relative mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (Math.abs(Math.min(0, r.dailyPnl)) / r.dailyLimit) * 100)}%`, background: r.dailyPnl <= -r.dailyLimit * 0.7 ? EvalTheme.red : r.dailyPnl <= -r.dailyLimit * 0.3 ? EvalTheme.amber : "rgba(255,255,255,0.12)" }} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <MiniStatRow label="Realized" value={`${r.realized >= 0 ? "+" : ""}${fmtMoney(r.realized)}`} color={moneyColor(r.realized)} />
          <MiniStatRow label="Floating" value={`${r.floating >= 0 ? "+" : ""}${fmtMoney(r.floating)}`} color={moneyColor(r.floating)} />
          <MiniStatRow label="Trades" value={String(r.trades)} color={EvalTheme.text} />
          <MiniStatRow label="Win rate" value={`${r.trades ? Math.round((r.wins / r.trades) * 100) : 0}%`} color={EvalTheme.text} />
        </div>

        <button
          onClick={onReset}
          className="w-full rounded-lg py-2 text-[11px] font-bold transition-colors"
          style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${EvalTheme.line}`, color: EvalTheme.muted }}
        >
          Reset evaluation
        </button>
      </div>

      {/* Config editor */}
      {editing && (
        <div className="absolute inset-0 z-30 flex flex-col" style={{ background: "rgba(10,14,20,0.92)", backdropFilter: "blur(8px)" }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${EvalTheme.line}` }}>
            <span className="text-[11px] font-bold" style={{ color: EvalTheme.text }}>Evaluation settings</span>
            <button onClick={() => setEditing(false)} className="text-[11px]" style={{ color: EvalTheme.dim }}>Close</button>
          </div>
          <div className="px-4 py-4 flex flex-col gap-3 overflow-y-auto">
            <ConfigNumber label="Account size ($)" value={draft.balance} onChange={(v) => setDraft({ ...draft, balance: v })} />
            <ConfigNumber label="Profit target (%)" value={draft.targetPct} onChange={(v) => setDraft({ ...draft, targetPct: v })} />
            <ConfigNumber label="Max daily loss (%)" value={draft.dailyLossPct} onChange={(v) => setDraft({ ...draft, dailyLossPct: v })} />
            <ConfigNumber label="Max drawdown (%)" value={draft.maxDDPct} onChange={(v) => setDraft({ ...draft, maxDDPct: v })} />
          </div>
          <div className="px-4 pb-4 mt-auto">
            <button onClick={save} className="w-full rounded-xl py-2.5 text-[12px] font-bold transition-all" style={{ background: "linear-gradient(135deg,#5aa7ff,#a78bfa)", color: "#fff" }}>
              Apply configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const computeEquilibrium = computeEvaluation;

function statusColor(s: EvalStatus): { dot: string; text: string } {
  switch (s) {
    case "PASSED": return { dot: EvalTheme.green, text: EvalTheme.green };
    case "DAILY_LOSS": return { dot: EvalTheme.red, text: EvalTheme.red };
    case "MAX_DD": return { dot: EvalTheme.red, text: EvalTheme.red };
    default: return { dot: EvalTheme.blue, text: EvalTheme.blue };
  }
}

function moneyColor(n: number): string {
  return n > 0 ? EvalTheme.green : n < 0 ? EvalTheme.red : EvalTheme.text;
}

function fmtMoney(n: number) {
  if (!isFinite(n)) n = 0;
  const sign = n < 0 ? "−" : "";
  return `${sign}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function EvalCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg px-2.5 py-1.5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${EvalTheme.line}` }}>
      <div className="text-[8px] font-bold uppercase tracking-widest" style={{ color: EvalTheme.dim }}>{label}</div>
      <div className="text-[12px] font-bold font-mono mt-0.5" style={{ color: EvalTheme.text }}>{value}</div>
    </div>
  );
}

function MiniStatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg px-2.5 py-2" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${EvalTheme.line}` }}>
      <div className="text-[8px] font-bold uppercase tracking-widest" style={{ color: EvalTheme.dim }}>{label}</div>
      <div className="text-[13px] font-bold font-mono mt-0.5" style={{ color }}>{value}</div>
    </div>
  );
}

function ConfigNumber({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  const [txt, setTxt] = useState(String(value));
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: EvalTheme.dim }}>{label}</span>
      <input
        type="number"
        value={txt}
        onChange={(e) => { setTxt(e.target.value); const n = Number(e.target.value); if (isFinite(n)) onChange(n); }}
        onBlur={() => setTxt(String(value))}
        className="w-full rounded-lg px-3 py-2 text-[12px] font-mono outline-none"
        style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${EvalTheme.line}`, color: EvalTheme.text }}
      />
    </label>
  );
}