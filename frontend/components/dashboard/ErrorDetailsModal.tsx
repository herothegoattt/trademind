"use client";
import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

// ─── TradingView-style chart ──────────────────────────────────────────────────

interface Candle { o: number; h: number; l: number; c: number; v?: number }
interface Marker { ci: number; above: boolean; text: string; color?: string }
interface Level  { p: number; color: string; dash?: boolean; label?: string }

function CandleChart({
  candles,
  levels = [],
  markers = [],
}: {
  candles: Candle[];
  levels?: Level[];
  markers?: Marker[];
}) {
  const VW = 380, VH = 148;
  const PH = 100, VH2 = 26;
  const PT = 6, PL = 4, PR = VW - 4;
  const VT = PT + PH + 8;

  const n = candles.length;
  const step = (PR - PL) / n;
  const cw = Math.min(step * 0.55, 13);
  const cx = (i: number) => PL + (i + 0.5) * step;
  const py = (pct: number) => PT + (1 - pct / 100) * PH;
  const vy = (pct: number) => VT + (1 - pct / 100) * VH2;

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-full" style={{ fontFamily: "monospace" }}>
      {/* Background */}
      <rect width={VW} height={VH} fill="#131722" rx="6" />

      {/* Grid lines */}
      {[25, 50, 75].map(p => (
        <line key={p} x1={PL} x2={PR} y1={py(p)} y2={py(p)}
          stroke="rgba(15,23,42,0.07)" strokeWidth="1" />
      ))}

      {/* Volume separator */}
      <line x1={PL} x2={PR} y1={VT - 2} y2={VT - 2}
        stroke="rgba(15,23,42,0.07)" strokeWidth="1" />

      {/* Level lines */}
      {levels.map((l, i) => (
        <g key={i}>
          <line x1={PL} x2={PR} y1={py(l.p)} y2={py(l.p)}
            stroke={l.color} strokeWidth="1"
            strokeDasharray={l.dash ? "4 3" : undefined}
            opacity="0.75" />
          {l.label && (
            <text x={PR - 2} y={py(l.p) - 2} fill={l.color}
              fontSize="6.5" textAnchor="end" opacity="0.85">
              {l.label}
            </text>
          )}
        </g>
      ))}

      {/* Candles */}
      {candles.map((c, i) => {
        const x = cx(i);
        const bull = c.c >= c.o;
        const col = bull ? "#26a69a" : "#ef5350";
        const bTop = py(Math.max(c.o, c.c));
        const bBot = py(Math.min(c.o, c.c));
        const bH = Math.max(1.5, bBot - bTop);
        const vol = c.v ?? 50;
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={py(c.h)} y2={py(c.l)} stroke={col} strokeWidth="1" />
            <rect x={x - cw / 2} y={bTop} width={cw} height={bH} fill={col} opacity="0.9" />
            <rect x={x - cw / 2} y={vy(vol)} width={cw} height={VT + VH2 - vy(vol)}
              fill={col} opacity="0.28" />
          </g>
        );
      })}

      {/* Markers */}
      {markers.map((m, i) => {
        const c = candles[m.ci];
        if (!c) return null;
        const x = cx(m.ci);
        const col = m.color ?? (m.above ? "#f59e0b" : "#ef5350");
        const tipY = m.above ? py(c.h) - 3 : py(c.l) + 3;
        const txtY = m.above ? tipY - 13 : tipY + 13;
        const txtLen = m.text.length * 4.2 + 8;
        return (
          <g key={i}>
            {m.above ? (
              <polygon points={`${x},${tipY} ${x - 3.5},${tipY - 6} ${x + 3.5},${tipY - 6}`}
                fill={col} opacity="0.95" />
            ) : (
              <polygon points={`${x},${tipY} ${x - 3.5},${tipY + 6} ${x + 3.5},${tipY + 6}`}
                fill={col} opacity="0.95" />
            )}
            <rect
              x={Math.max(PL + 1, Math.min(x - txtLen / 2, PR - txtLen - 1))}
              y={m.above ? txtY - 9 : txtY - 1}
              width={txtLen}
              height={10}
              fill="#0e1117"
              rx="2"
              opacity="0.92"
            />
            <text
              x={Math.max(PL + 1 + txtLen / 2, Math.min(x, PR - txtLen / 2 - 1))}
              y={m.above ? txtY - 1 : txtY + 7}
              fill={col}
              fontSize="6.5"
              textAnchor="middle"
              fontWeight="700"
            >
              {m.text}
            </text>
          </g>
        );
      })}

      {/* Volume label */}
      <text x={PL + 2} y={VT + VH2 - 2} fill="rgba(15,23,42,0.25)" fontSize="5.5">
        VOL
      </text>
    </svg>
  );
}

// ─── Chart data per error ─────────────────────────────────────────────────────

const CHART_DATA: Record<string, { candles: Candle[]; levels?: Level[]; markers?: Marker[] }> = {
  FOMO: {
    candles: [
      { o: 28, h: 35, l: 24, c: 33, v: 35 },
      { o: 33, h: 42, l: 30, c: 40, v: 40 },
      { o: 40, h: 50, l: 37, c: 47, v: 45 },
      { o: 47, h: 90, l: 44, c: 85, v: 97 }, // FOMO spike
      { o: 85, h: 88, l: 62, c: 65, v: 80 },
      { o: 65, h: 67, l: 42, c: 46, v: 72 }, // stop hit
      { o: 46, h: 57, l: 43, c: 54, v: 45 },
      { o: 54, h: 65, l: 50, c: 62, v: 50 },
    ],
    levels: [
      { p: 46, color: "#ef5350", dash: true, label: "Stop" },
    ],
    markers: [
      { ci: 3, above: true,  text: "FOMO Entry",  color: "#f59e0b" },
      { ci: 5, above: false, text: "Stop Hit ✕",  color: "#ef5350" },
      { ci: 7, above: true,  text: "Real Move",   color: "#26a69a" },
    ],
  },
  Overconfidence: {
    candles: [
      { o: 38, h: 50, l: 35, c: 47, v: 40 },
      { o: 47, h: 60, l: 44, c: 58, v: 45 },
      { o: 58, h: 70, l: 54, c: 67, v: 50 }, // win 3
      { o: 67, h: 78, l: 63, c: 75, v: 60 }, // oversizing begins
      { o: 75, h: 80, l: 36, c: 40, v: 95 }, // HUGE loss
      { o: 40, h: 44, l: 25, c: 29, v: 80 },
      { o: 29, h: 40, l: 26, c: 36, v: 55 },
      { o: 36, h: 45, l: 32, c: 42, v: 40 },
    ],
    levels: [
      { p: 67, color: "#26a69a", dash: true, label: "Entry" },
    ],
    markers: [
      { ci: 2, above: true,  text: "3 Wins",      color: "#26a69a" },
      { ci: 4, above: true,  text: "Oversized ✕", color: "#ef5350" },
    ],
  },
  "Decision Under Fatigue": {
    candles: [
      { o: 55, h: 65, l: 52, c: 63, v: 45 },
      { o: 63, h: 73, l: 60, c: 70, v: 48 },
      { o: 70, h: 72, l: 50, c: 54, v: 65 }, // first tired trade
      { o: 54, h: 62, l: 32, c: 37, v: 78 },
      { o: 37, h: 48, l: 22, c: 26, v: 85 },
      { o: 26, h: 36, l: 12, c: 18, v: 88 },
      { o: 18, h: 30, l: 14, c: 24, v: 65 },
      { o: 24, h: 34, l: 18, c: 20, v: 58 },
    ],
    markers: [
      { ci: 1, above: true,  text: "Disciplined",  color: "#26a69a" },
      { ci: 2, above: true,  text: "Fatigue Zone", color: "#f59e0b" },
      { ci: 5, above: false, text: "Drawdown ✕",   color: "#ef5350" },
    ],
  },
  "Revenge Decision": {
    candles: [
      { o: 65, h: 70, l: 52, c: 55, v: 55 }, // initial loss
      { o: 55, h: 62, l: 50, c: 58, v: 40 },
      { o: 58, h: 62, l: 35, c: 40, v: 90 }, // revenge, bigger
      { o: 40, h: 43, l: 10, c: 13, v: 99 }, // max loss
      { o: 13, h: 25, l: 10, c: 20, v: 70 },
      { o: 20, h: 30, l: 16, c: 26, v: 45 },
      { o: 26, h: 35, l: 22, c: 30, v: 38 },
    ],
    markers: [
      { ci: 0, above: false, text: "Loss",          color: "#f59e0b" },
      { ci: 2, above: true,  text: "Revenge ✕",     color: "#ef5350" },
      { ci: 3, above: false, text: "Max Drawdown",  color: "#ef5350" },
    ],
  },
  "Confirmation Bias": {
    candles: [
      { o: 28, h: 38, l: 25, c: 36, v: 55 },
      { o: 36, h: 50, l: 33, c: 47, v: 60 },
      { o: 47, h: 62, l: 44, c: 58, v: 58 },
      { o: 58, h: 72, l: 54, c: 68, v: 52 },
      { o: 68, h: 74, l: 63, c: 70, v: 38 }, // weakness (small body, low vol)
      { o: 70, h: 72, l: 48, c: 52, v: 80 }, // entry then reversal
      { o: 52, h: 55, l: 32, c: 36, v: 82 },
      { o: 36, h: 40, l: 22, c: 26, v: 72 },
    ],
    levels: [
      { p: 68, color: "#26a69a", dash: true, label: "Entry" },
      { p: 40, color: "#ef5350", dash: true, label: "Stop"  },
    ],
    markers: [
      { ci: 4, above: true,  text: "Bias Ignored", color: "#f59e0b" },
      { ci: 5, above: true,  text: "Entry ✕",      color: "#ef5350" },
    ],
  },
  "Risk Miscalculation": {
    candles: [
      { o: 48, h: 58, l: 45, c: 56, v: 45 },
      { o: 56, h: 66, l: 52, c: 63, v: 50 }, // entry
      { o: 63, h: 70, l: 59, c: 67, v: 52 },
      { o: 67, h: 68, l: 28, c: 33, v: 94 }, // spike down, stop too far → hit
      { o: 33, h: 52, l: 30, c: 50, v: 68 }, // price RECOVERS
      { o: 50, h: 63, l: 46, c: 60, v: 55 },
      { o: 60, h: 72, l: 56, c: 68, v: 47 }, // would have reached target
    ],
    levels: [
      { p: 63, color: "#26a69a", dash: true, label: "Entry"          },
      { p: 28, color: "#ef5350", dash: true, label: "Stop (too far)" },
      { p: 74, color: "#f59e0b", dash: true, label: "Target"         },
    ],
    markers: [
      { ci: 1, above: true,  text: "Entry",         color: "#26a69a" },
      { ci: 3, above: false, text: "Stop Hit ✕",    color: "#ef5350" },
      { ci: 6, above: true,  text: "Would recover", color: "#94a3b8" },
    ],
  },
  "Ignoring Invalid Signals": {
    candles: [
      { o: 45, h: 54, l: 42, c: 52, v: 42 },
      { o: 52, h: 57, l: 49, c: 55, v: 48 },
      { o: 55, h: 76, l: 52, c: 72, v: 90 }, // breakout entry
      { o: 72, h: 76, l: 62, c: 64, v: 65 }, // momentum fades
      { o: 64, h: 67, l: 52, c: 55, v: 62 }, // returning
      { o: 55, h: 58, l: 42, c: 46, v: 72 }, // stop hit
      { o: 46, h: 55, l: 43, c: 52, v: 44 },
      { o: 52, h: 57, l: 47, c: 53, v: 38 },
    ],
    levels: [
      { p: 55, color: "#f59e0b", dash: false, label: "Resistance" },
      { p: 42, color: "#94a3b8", dash: false, label: "Support"    },
    ],
    markers: [
      { ci: 2, above: true,  text: "Breakout Entry",  color: "#f59e0b" },
      { ci: 3, above: true,  text: "Fades",           color: "#f59e0b" },
      { ci: 5, above: false, text: "Stop Hit ✕",      color: "#ef5350" },
    ],
  },
};

// ─── Error details data ───────────────────────────────────────────────────────

const ERROR_DETAILS: Record<string, any> = {
  "FOMO": {
    title: "Fear of Missing Out",
    tag: "FOMO",
    description: "Entering trades too early or without confirmation because you're afraid the market will move without you.",
    signals: [
      "Market is making a fast move without you",
      "Friends or colleagues are taking positions",
      "You feel regret about missed opportunities",
      "Price is rallying and you feel left behind",
    ],
    corrective_rules: [
      "Wait for at least 2 confirmations before any entry",
      "Set up your watch list 1 hour before market open",
      "Practice sitting on hands for 5 candles after a signal",
      "Document every FOMO session in your journal",
    ],
  },
  "Overconfidence": {
    title: "Overconfidence Bias",
    tag: "OVERCONFIDENCE",
    description: "After winning trades, taking excessive risks or oversizing positions because you feel invincible.",
    signals: [
      "You just had 2–3 winning trades in a row",
      "Increasing position size without market confirmation",
      "Taking trades with worse risk/reward after wins",
      "You think 'I can't lose right now'",
    ],
    corrective_rules: [
      "Use fixed position size regardless of win streak",
      "Take a break after 3 consecutive wins",
      "Review historical win/loss streaks regularly",
      "Risk only 1% per trade, regardless of confidence",
    ],
  },
  "Decision Under Fatigue": {
    title: "Decision Under Fatigue",
    tag: "FATIGUE",
    description: "Making impulsive or poor decisions when tired, emotional, or after extended trading sessions.",
    signals: [
      "You've been trading for 6+ hours",
      "You feel frustrated or emotionally drained",
      "Your accuracy noticeably drops after 3 PM",
      "You're taking trades just to 'end green'",
    ],
    corrective_rules: [
      "Set a daily trade limit (e.g. 5 trades max)",
      "Take 15-min breaks every 90 minutes",
      "Review your best and worst trading hours",
      "Use a checklist before every entry when tired",
    ],
  },
  "Revenge Decision": {
    title: "Revenge Trading",
    tag: "REVENGE",
    description: "Taking excessive risks or oversizing after a loss in an attempt to quickly recover money.",
    signals: [
      "You just had a losing trade",
      "You're taking the next trade without your setup",
      "Position size is larger than your plan allows",
      "You feel angry, frustrated, or desperate",
    ],
    corrective_rules: [
      "Step away after 2 consecutive losses",
      "Use a mandatory 15–30 minute cooling-off period",
      "Never increase position size to recover losses",
      "Review your loss in writing before your next trade",
    ],
  },
  "Confirmation Bias": {
    title: "Confirmation Bias",
    tag: "BIAS",
    description: "Only looking at data and signals that confirm your bias while ignoring contradictory evidence.",
    signals: [
      "You've decided direction before looking at charts",
      "You ignore bearish signals on bullish setups",
      "You focus on a single timeframe only",
      "You find reasons to enter after you've already decided",
    ],
    corrective_rules: [
      "Always check 3 timeframes before entry",
      "Write your bias down before looking at charts",
      "List 3 reasons FOR and 3 reasons AGAINST entry",
      "Use a pre-market checklist to stay objective",
    ],
  },
  "Risk Miscalculation": {
    title: "Risk Miscalculation",
    tag: "RISK",
    description: "Incorrectly calculating position size, stop loss, or risk exposure — leading to losses larger than expected.",
    signals: [
      "You're not using a position size formula",
      "You don't know your exact risk on each trade",
      "Stop losses are arbitrary, not based on structure",
      "You adjust stops after entry",
    ],
    corrective_rules: [
      "Use a position size formula before every trade",
      "Risk a maximum of 2% per trade",
      "Set stop loss before entry based on support/resistance",
      "Use a position size calculator for every trade",
    ],
  },
  "Ignoring Invalid Signals": {
    title: "Invalid Signal Execution",
    tag: "SIGNAL",
    description: "Taking trades based on signals that are no longer valid due to changed market conditions or broken structure.",
    signals: [
      "Market structure has broken since your signal",
      "Volatility has dropped significantly",
      "Support/resistance levels have shifted",
      "Your signal is more than 2 bars old",
    ],
    corrective_rules: [
      "Re-validate setup 30 seconds before entry",
      "If price moves against signal 5+ pips, signal is void",
      "Check volume on your signal",
      "Journal when signals became invalid vs when they were taken",
    ],
  },
};

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ErrorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorType: string | null;
}

export function ErrorDetailsModal({ isOpen, onClose, errorType }: ErrorDetailsModalProps) {
  const details = errorType && errorType in ERROR_DETAILS ? ERROR_DETAILS[errorType] : null;
  const chart   = errorType && errorType in CHART_DATA    ? CHART_DATA[errorType]    : null;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-[#09090f] border border-white/[0.08] rounded-2xl shadow-2xl p-0">
        {details ? (
          <div className="flex flex-col">

            {/* Header */}
            <div className="px-6 pt-6 pb-5 border-b border-white/[0.06]">
              <div className="text-[10px] font-semibold tracking-[0.15em] text-amber-400/60 mb-2">
                {details.tag}
              </div>
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-white/90 leading-snug">
                  {details.title}
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-zinc-500 leading-relaxed mt-2">{details.description}</p>
            </div>

            <div className="px-6 py-5 space-y-7">

              {/* Chart */}
              {chart && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-semibold tracking-[0.12em] text-zinc-600">
                      CHART EXAMPLE
                    </div>
                    <div className="flex items-center gap-3 text-[9px] text-zinc-600 font-mono">
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-sm bg-[#26a69a] opacity-80" />
                        Bullish
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-sm bg-[#ef5350] opacity-80" />
                        Bearish
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-white/[0.05]" style={{ height: 148 }}>
                    <CandleChart
                      candles={chart.candles}
                      levels={chart.levels}
                      markers={chart.markers}
                    />
                  </div>
                </div>
              )}

              {/* Recognition Signals */}
              <div>
                <div className="text-[10px] font-semibold tracking-[0.12em] text-zinc-600 mb-3">
                  RECOGNITION SIGNALS
                </div>
                <div className="space-y-2.5">
                  {details.signals.map((signal: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 group">
                      <div className="w-1 h-1 rounded-full bg-amber-500/60 mt-[7px] shrink-0" />
                      <span className="text-sm text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
                        {signal}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Corrective Rules */}
              <div>
                <div className="text-[10px] font-semibold tracking-[0.12em] text-zinc-600 mb-3">
                  CORRECTIVE RULES
                </div>
                <div className="space-y-2.5">
                  {details.corrective_rules.map((rule: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-[10px] font-mono text-emerald-600/70 mt-0.5 shrink-0 w-4">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm text-zinc-400 leading-relaxed">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Close */}
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-zinc-400 hover:text-zinc-300 transition-all duration-150"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-zinc-600 text-sm">
            No details available for this error type.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
