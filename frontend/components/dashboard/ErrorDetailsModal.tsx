"use client";
import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { AlertCircle, Target, Lightbulb, BarChart, TrendingUp } from "lucide-react";

const ERROR_DETAILS: Record<string, any> = {
  "FOMO": {
    title: "Fear of Missing Out (FOMO)",
    description: "Entering trades too early or without proper confirmation because you're afraid the market will move without you.",
    signals: ["Market is making a move", "Friends/colleagues taking positions", "See profit opportunities you didn't take", "Price is rallying without you"],
    corrective_rules: ["Always wait for at least 2 confirmations before entry", "Set up your watch list 1 hour before market open", "Practice sitting on hands for 5 candles after signal", "Document FOMO sessions in your journal"],
    example: "You see a fast green candle and immediately enter, only to be stopped out when the move reverses. The trade was taken without waiting for a proper breakout or retest.",
    chartNotes: [
      "1. Price accelerates up (FOMO candle)",
      "2. You enter without confirmation",
      "3. Price pulls back and stops you out",
      "4. Real trend continues later without you"
    ],
    volume: [70, 40, 80, 50, 65],
  },
  "Overconfidence": {
    title: "Overconfidence Bias",
    description: "After winning trades, taking excessive risks or oversizing positions because you feel invincible.",
    signals: ["You just had 2-3 winning trades in a row", "Increasing position size without market confirmation", "Taking trades with worse risk/reward after wins", "You think 'I can't lose right now'"],
    corrective_rules: ["Use fixed position size regardless of win streak", "Take a break trade after 3 consecutive wins", "Review historical win/loss streaks", "Risk only 1% per trade, regardless of confidence"],
    example: "You won three trades in a row, then double your position size and take a trade with a poor setup — and the market quickly reverses.",
    chartNotes: [
      "1. Win streak builds confidence",
      "2. Position size increases",
      "3. Trade setup is weaker but still taken",
      "4. Market reverses and losses compound"
    ],
    volume: [55, 65, 50, 70, 60],
  },
  "Decision Under Fatigue": {
    title: "Decision Under Fatigue",
    description: "Making impulsive or poor decisions when tired, emotional, or after extended trading sessions.",
    signals: ["You've been trading for 6 hours", "You're trading your last trade of the day", "You feel frustrated or emotional", "Your accuracy drops after 3 PM"],
    corrective_rules: ["Set a daily trade limit (e.g., 5 trades max)", "Take 15-min breaks every 90 minutes", "Review your best trading hours", "Use a checklist before every entry when tired"],
    example: "After 5 hours of trading, you start taking trades that don’t meet your plan simply because you want to finish the day in profit. The result is random entries and bigger drawdowns.",
    chartNotes: [
      "1. Trading pace increases as fatigue grows",
      "2. Setup quality decreases",
      "3. Random entries, then rapid losses",
      "4. Day ends with larger drawdown"
    ],
    volume: [40, 60, 45, 70, 50],
  },
  "Revenge Decision": {
    title: "Revenge Decision (Revenge Trading)",
    description: "Taking excessive risks or oversizing after a loss to quickly recover the money lost.",
    signals: ["You just had a losing trade", "You're taking the next trade without your setup", "Position size is larger than normal", "You feel angry or frustrated"],
    corrective_rules: ["Step away after 2 consecutive losses", "Use a cooling-off period (15-30 minutes)", "Never increase position size to recover losses", "Review your loss journal before next trade"],
    example: "You lose a trade, then immediately take a second trade with a much larger size to 'get it back'—only to lose again and increase the drawdown.",
    chartNotes: [
      "1. Loss triggers emotional response",
      "2. Next trade is taken too quickly",
      "3. Position size is too large",
      "4. Losses compound"
    ],
  },
  "Confirmation Bias": {
    title: "Confirmation Bias",
    description: "Only looking at data/signals that confirm your bias while ignoring contradictory evidence.",
    signals: ["You've decided direction before looking at charts", "You ignore bearish signals on bullish setups", "You focus on one timeframe only", "You journal reasons after taking the trade"],
    corrective_rules: ["Always check 3 timeframes before entry", "Write your bias before looking at charts", "List 3 reasons FOR and 3 reasons AGAINST", "Use a pre-market checklist to stay objective"],
    example: "You see a bullish setup and ignore bearish divergence on higher timeframes — then the market reverses and hits your stop loss.",
    chartNotes: [
      "1. You spot a bullish pattern",
      "2. Bearish signals are ignored",
      "3. Trade is taken anyway",
      "4. Market reverses and stops you out"
    ],
  },
  "Risk Miscalculation": {
    title: "Risk Miscalculation",
    description: "Incorrectly calculating position size, stop loss, or risk exposure, leading to larger losses than expected.",
    signals: ["You're not using a position size formula", "You don't know your risk on each trade", "Stop losses are arbitrary, not based on structure", "You adjust stops after entry"],
    corrective_rules: ["Use a position size formula", "Risk only 2% maximum per trade", "Set stop loss BEFORE entry based on support/resistance", "Use a position size calculator for every trade"],
    example: "You set your stop loss too far away because 'it has room to breathe', which turns a small move against you into a large loss.",
    chartNotes: [
      "1. Stop is placed far from structure",
      "2. Trade size is too large for that stop",
      "3. Small pullback triggers stop",
      "4. Loss is bigger than planned"
    ],
  },
  "Ignoring Invalid Signals": {
    title: "Ignoring Invalid Signals",
    description: "Taking trades based on signals that are no longer valid due to changed market conditions or broken structure.",
    signals: ["Market structure has broken since your signal", "Volatility has dropped significantly", "Support/resistance levels have shifted", "Your signal is more than 2 bars old"],
    corrective_rules: ["Re-validate setup 30 seconds before entry", "If price moves against signal 5+ pips, signal is void", "Check volume on your signal", "Journal when signals became invalid vs taken"],
    example: "You take a breakout trade, but the breakout loses momentum and price returns to range — the original signal is no longer valid.",
    chartNotes: [
      "1. Signal triggers (breakout)",
      "2. momentum fades",
      "3. price returns into range",
      "4. trade turns into a loss"
    ],
    volume: [75, 50, 55, 40, 60]
  },
};

interface ErrorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorType: string | null;
}

export function ErrorDetailsModal({ isOpen, onClose, errorType }: ErrorDetailsModalProps) {
  const details = errorType && errorType in ERROR_DETAILS ? ERROR_DETAILS[errorType] : null;

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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-900 border border-cyan-500/30">
        {details ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <AlertCircle size={24} className="text-purple-400" />
                {details.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div>
                <p className="text-gray-300 leading-relaxed">{details.description}</p>
              </div>

              {details.example && (
                <div className="rounded-xl bg-slate-900/60 border border-slate-700/40 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={18} className="text-pink-400" />
                    <h3 className="font-semibold text-pink-400">Пример на графике</h3>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-3">{details.example}</p>
                  <div className="relative rounded-lg bg-slate-950/60 border border-slate-800/50 h-28 overflow-hidden">
                    <svg viewBox="0 0 220 120" className="w-full h-full">
                      <defs>
                        <linearGradient id="candleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="#16a34a" stopOpacity="0.6" />
                        </linearGradient>
                        <linearGradient id="candleGradDown" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#f97316" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="#fb923c" stopOpacity="0.6" />
                        </linearGradient>
                        <linearGradient id="volGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
                        </linearGradient>
                      </defs>

                      {/* candlesticks */}
                      <g stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
                        {[
                          { x: 28, high: 28, low: 60, open: 45, close: 52, up: true },
                          { x: 68, high: 24, low: 58, open: 52, close: 40, up: false },
                          { x: 108, high: 30, low: 55, open: 40, close: 50, up: true },
                          { x: 148, high: 22, low: 62, open: 50, close: 38, up: false },
                          { x: 188, high: 26, low: 54, open: 38, close: 48, up: true },
                        ].map((candle, i) => (
                          <g key={i}>
                            <line x1={candle.x} y1={candle.high} x2={candle.x} y2={candle.low} />
                            <rect
                              x={candle.x - 6}
                              y={Math.min(candle.open, candle.close)}
                              width={12}
                              height={Math.max(2, Math.abs(candle.open - candle.close))}
                              fill={candle.up ? "url(#candleGrad)" : "url(#candleGradDown)"}
                            />
                          </g>
                        ))}
                      </g>

                      {/* volume bars */}
                      {details.volume && (
                        <g transform="translate(0, 80)">
                          {details.volume.map((vol: number, i: number) => {
                            const barWidth = 14;
                            const xPos = 14 + i * 36;
                            const barHeight = Math.min(32, (vol / 100) * 32);
                            return (
                              <rect
                                key={i}
                                x={xPos}
                                y={32 - barHeight}
                                width={barWidth}
                                height={barHeight}
                                fill="url(#volGrad)"
                                opacity={0.9}
                              />
                            );
                          })}
                          <text x="12" y="46" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">
                            Volume
                          </text>
                        </g>
                      )}
                    </svg>
                  </div>

                  {details.chartNotes && details.chartNotes.length > 0 && (
                    <div className="mt-3 text-sm text-gray-300 space-y-1">
                      {details.chartNotes.map((note: string, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="mt-1 text-pink-300">•</span>
                          <span>{note}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={18} className="text-cyan-400" />
                  <h3 className="font-semibold text-cyan-400">Recognition Signals</h3>
                </div>
                <ul className="space-y-2">
                  {details.signals.map((signal: string, i: number) => (
                    <li key={i} className="flex gap-3 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-gray-300 text-sm">
                      <span className="text-cyan-400 font-bold flex-shrink-0">•</span>
                      {signal}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target size={18} className="text-purple-400" />
                  <h3 className="font-semibold text-purple-400">Corrective Rules</h3>
                </div>
                <ul className="space-y-2">
                  {details.corrective_rules.map((rule: string, i: number) => (
                    <li key={i} className="flex gap-3 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-gray-300 text-sm">
                      <span className="text-purple-400 font-bold flex-shrink-0">✓</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="primary" className="flex-1" onClick={onClose}>
                  <Lightbulb size={16} className="mr-2" />
                  Apply Rules &amp; Close
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-400">No details available for this error type.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
