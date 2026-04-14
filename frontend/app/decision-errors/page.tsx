"use client";
import Link from "next/link";
import { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Error definitions ────────────────────────────────────────────────────────

const ERROR_META: Record<string, { label: string; desc: string; signals: string[]; rules: string[]; zones: { risk: string; text: string; color: "red"|"amber"|"emerald" }[] }> = {
  FOMO: {
    label: "FOMO",
    desc: "Entering trades emotionally after the move already happened.",
    signals: ["Chasing breakouts minutes after they occur", "Increasing size because 'it's still going'", "Entering without a pre-defined plan"],
    rules: ["If the entry is gone, the trade is gone", "Set alerts — never watch charts waiting to chase", "Document entry criteria before the session"],
    zones: [
      { risk: "HIGH", text: "First 5 min after breakout", color: "red" },
      { risk: "MED",  text: "Hours 1–4 of a strong trend", color: "amber" },
      { risk: "LOW",  text: "Pullback to planned entry zone", color: "emerald" },
    ],
  },
  OVERCONFIDENCE: {
    label: "Overconfidence",
    desc: "Abandoning risk rules after a winning streak.",
    signals: ["Skipping stop-loss 'this one time'", "Doubling size after wins", "Feeling invincible after 3+ green days"],
    rules: ["Position size is fixed — wins don't change the formula", "Take first target; perfect exits don't exist", "Log every trade — emotion fades, data doesn't"],
    zones: [
      { risk: "HIGH", text: "After 3rd consecutive winning trade", color: "red" },
      { risk: "MED",  text: "Second green day in a row", color: "amber" },
      { risk: "LOW",  text: "Following the same rules regardless of streak", color: "emerald" },
    ],
  },
  FATIGUE: {
    label: "Decision Under Fatigue",
    desc: "Impaired judgment from lack of sleep or extended sessions.",
    signals: ["Trading 7+ hours without a break", "Entering trades while hesitating", "Eye strain, slow reactions, irritability"],
    rules: ["Hard stop after 3 hours of active trading", "7+ hours sleep is a trading prerequisite", "Hesitation = your body saying no"],
    zones: [
      { risk: "HIGH", text: "7+ hours after waking, live trading", color: "red" },
      { risk: "MED",  text: "Hour 3+ of continuous chart watching", color: "amber" },
      { risk: "LOW",  text: "Fresh session, rested, <2h active", color: "emerald" },
    ],
  },
  REVENGE: {
    label: "Revenge Trading",
    desc: "Re-entering the market to recover losses emotionally.",
    signals: ["Trade placed within 5 min of a stop-out", "Larger size 'to get it back faster'", "Switching pairs or strategy after a loss"],
    rules: ["30 min mandatory pause after any loss", "Write down the loss and why before next trade", "Size never increases after a loss — ever"],
    zones: [
      { risk: "HIGH", text: "0–5 min after stop-out", color: "red" },
      { risk: "MED",  text: "5–30 min, still emotional", color: "amber" },
      { risk: "LOW",  text: "30+ min, reviewed and logged", color: "emerald" },
    ],
  },
  CONFIRMATION: {
    label: "Confirmation Bias",
    desc: "Filtering information to match your existing position.",
    signals: ["Ignoring signals that contradict your bias", "Cherry-picking indicators", "Moving stop-loss to avoid being stopped out"],
    rules: ["Write your exit thesis before entry — not after", "Actively look for reasons your trade is wrong", "Honor your stop. Every time."],
    zones: [
      { risk: "HIGH", text: "2–3 hours after entry (peak conviction)", color: "red" },
      { risk: "MED",  text: "Price 5%+ against you, no stop hit yet", color: "amber" },
      { risk: "LOW",  text: "Pre-written stop followed mechanically", color: "emerald" },
    ],
  },
  RISK: {
    label: "Risk Miscalculation",
    desc: "Incorrect position sizing leading to oversized drawdowns.",
    signals: ["No stop-loss on open position", "Account down 20%+ from equity high", "Using leverage without defined rules"],
    rules: ["Risk = Size × SL% = fixed dollar amount always", "Max 2% per trade / 6% per week / 15% per month", "Leverage is a tool for consistent traders only"],
    zones: [
      { risk: "HIGH", text: "Single trade risk exceeds 2% of account", color: "red" },
      { risk: "MED",  text: "Weekly drawdown approaching 5%", color: "amber" },
      { risk: "LOW",  text: "Position sized mathematically before entry", color: "emerald" },
    ],
  },
  SIGNAL: {
    label: "Invalid Signal Execution",
    desc: "Acting on unconfirmed or mismatched timeframe signals.",
    signals: ["Using 1m signals for a 4h strategy", "Entering before candle close", "Following alerts from untested sources"],
    rules: ["Your timeframe's candle must close before entry", "Only trade systems you've backtested 50+ times", "Faster timeframes are noise for swing traders"],
    zones: [
      { risk: "HIGH", text: "Entry on open candle, unconfirmed", color: "red" },
      { risk: "MED",  text: "News window ±2 hours", color: "amber" },
      { risk: "LOW",  text: "Closed candle, tested setup, right timeframe", color: "emerald" },
    ],
  },
};

// ─── Question bank ────────────────────────────────────────────────────────────

type QOption = { text: string; error: keyof typeof ERROR_META | null };
type Question = { q: string; context?: string; options: QOption[] };

const QUESTION_BANK: Record<keyof typeof ERROR_META, Question[]> = {
  FOMO: [
    {
      q: "EUR/USD ripped 150 pips in 20 minutes while you were away from your desk. It's still moving. What do you do?",
      options: [
        { text: "Enter now — momentum is clearly there", error: "FOMO" },
        { text: "Wait for a retracement to my planned entry level", error: null },
        { text: "Enter half size since I missed the ideal entry", error: "FOMO" },
        { text: "Mark it in my journal and look for the next setup", error: null },
      ],
    },
    {
      q: "Bitcoin just pumped 18% in 90 minutes on news. You had a dip-buy plan but it never pulled back. It's still green. You...",
      options: [
        { text: "Enter now — the momentum confirms the bull thesis", error: "FOMO" },
        { text: "Accept the miss and wait for my planned dip entry", error: null },
        { text: "Enter a small position just to 'participate' in the move", error: "FOMO" },
        { text: "Set an alert at my original level and move on", error: null },
      ],
    },
    {
      q: "A stock you've been watching breaks out of a 3-month range. By the time you see it, it's already 7% above the breakout level. You...",
      options: [
        { text: "Buy immediately — breakouts often extend further", error: "FOMO" },
        { text: "Wait to see if price retests the breakout level as support", error: null },
        { text: "Buy half now and plan to add on any pullback", error: "FOMO" },
        { text: "Skip it — my entry was the breakout, not 7% above it", error: null },
      ],
    },
    {
      q: "A trader in your group chat is posting real-time gains from a trade you don't have on. They're up $4,000 and it's 'still going.' You...",
      options: [
        { text: "Open the chart and find the nearest entry point quickly", error: "FOMO" },
        { text: "Congratulate them and stay focused on your own watchlist", error: null },
        { text: "Enter a smaller size — better late than never", error: "FOMO" },
        { text: "Check if this setup fits your own system before acting", error: null },
      ],
    },
    {
      q: "You set an alarm for a news trade but slept through it. The 200-pip spike already happened. Price is now consolidating near highs. You...",
      options: [
        { text: "Enter on the consolidation — these patterns often continue", error: "FOMO" },
        { text: "Note the setup in your journal for the next occurrence", error: null },
        { text: "Enter a reduced size using the consolidation as entry", error: "FOMO" },
        { text: "Accept the miss — a missed trade is not a trading loss", error: null },
      ],
    },
  ],

  OVERCONFIDENCE: [
    {
      q: "You've closed 5 winning trades this week, up 8%. A new setup appears with a slightly wider stop than usual. You size it...",
      options: [
        { text: "Same fixed % as every other trade", error: null },
        { text: "A bit larger — I'm in a flow state right now", error: "OVERCONFIDENCE" },
        { text: "Larger, but I'll scale out early to protect gains", error: "OVERCONFIDENCE" },
        { text: "Smaller — a wider stop means smaller position", error: null },
      ],
    },
    {
      q: "You've had your best week ever — up 11%. It's Monday morning. A setup that's 'almost' your entry criteria appears. You...",
      options: [
        { text: "Skip it — 'almost' is not my criteria", error: null },
        { text: "Take it — I'm clearly reading the market well right now", error: "OVERCONFIDENCE" },
        { text: "Take it at reduced size as a 'feel' trade", error: "OVERCONFIDENCE" },
        { text: "Write out exactly why it doesn't qualify and pass", error: null },
      ],
    },
    {
      q: "After 4 consecutive winning trades you find yourself skipping your pre-trade checklist. You...",
      options: [
        { text: "Run the checklist anyway — discipline doesn't take days off", error: null },
        { text: "Skip it — I've proven I can read this market", error: "OVERCONFIDENCE" },
        { text: "Do a shortened version — just the most important items", error: "OVERCONFIDENCE" },
        { text: "Stop trading and review why I'm skipping the process", error: null },
      ],
    },
    {
      q: "You just made 3× your average monthly return in 2 weeks. You decide to...",
      options: [
        { text: "Double position sizes to capitalize on the hot streak", error: "OVERCONFIDENCE" },
        { text: "Keep the same rules — this month's returns don't change my edge", error: null },
        { text: "Take a few days off to protect the gains and reset", error: null },
        { text: "Start trading instruments outside my usual specialization", error: "OVERCONFIDENCE" },
      ],
    },
    {
      q: "Your stop-loss is 12 pips away but you feel very confident about this trade. You consider moving it to 25 pips 'just this once.' You...",
      options: [
        { text: "Move it — my read on this one is exceptional", error: "OVERCONFIDENCE" },
        { text: "Keep the stop exactly where it should be per the setup", error: null },
        { text: "Remove the stop entirely — I'll exit manually if needed", error: "OVERCONFIDENCE" },
        { text: "Accept the trade at the original stop or don't take it", error: null },
      ],
    },
  ],

  FATIGUE: [
    {
      q: "It's hour 6 of your trading session. A setup that matches your criteria appears. You haven't taken a break. You...",
      options: [
        { text: "Take it — the setup is valid regardless of how long I've been trading", error: "FATIGUE" },
        { text: "Close charts and come back tomorrow", error: null },
        { text: "Take it at half size since I'm aware I'm fatigued", error: "FATIGUE" },
        { text: "Step away for 30–45 minutes, then reassess with fresh eyes", error: null },
      ],
    },
    {
      q: "You slept 4 hours last night due to stress. Markets just opened and your scanner flags a valid setup. You...",
      options: [
        { text: "Take it — the setup is valid regardless of my sleep", error: "FATIGUE" },
        { text: "Paper-trade it today and track whether it would have worked", error: null },
        { text: "Take it at half size to limit potential damage", error: "FATIGUE" },
        { text: "Skip today's session and prioritize sleep recovery", error: null },
      ],
    },
    {
      q: "It's 11:30pm and the Asian session is showing a textbook setup that perfectly matches your criteria. You...",
      options: [
        { text: "Enter — perfect setups don't care about time zones", error: "FATIGUE" },
        { text: "Set an alert at entry price and review it in the morning", error: null },
        { text: "Enter now but use a tighter stop to limit overnight risk", error: "FATIGUE" },
        { text: "Log it as a missed opportunity, sleep, and review tomorrow", error: null },
      ],
    },
    {
      q: "You've been in stressful back-to-back meetings all day. Markets close in 90 minutes. A high-probability setup just formed. You...",
      options: [
        { text: "Enter — good setups don't wait for better timing", error: "FATIGUE" },
        { text: "Paper-trade this one and revisit the setup type tomorrow", error: null },
        { text: "Enter with a tighter stop to account for reduced focus", error: "FATIGUE" },
        { text: "Skip it — trading on a stressed, distracted mind isn't an edge", error: null },
      ],
    },
    {
      q: "You're on your 4th consecutive trading day after intense 6-hour sessions each day. A familiar setup appears. You...",
      options: [
        { text: "Enter — familiarity with the pattern reduces the mental load", error: "FATIGUE" },
        { text: "Take a full rest day before the next session", error: null },
        { text: "Enter half size to account for accumulated fatigue", error: "FATIGUE" },
        { text: "Review recent trades for fatigue-driven mistakes before deciding", error: null },
      ],
    },
  ],

  REVENGE: [
    {
      q: "Your stop-loss triggered for a 1.8% loss. The market immediately reverses in your original direction. You...",
      options: [
        { text: "Re-enter — I was right, just early", error: "REVENGE" },
        { text: "Walk away for at least 30 minutes", error: null },
        { text: "Enter smaller to 'test' the direction", error: "REVENGE" },
        { text: "Log the trade and wait for the next clean setup tomorrow", error: null },
      ],
    },
    {
      q: "You've had two consecutive losses today totaling 3.5% drawdown. Another setup appears 10 minutes later. You...",
      options: [
        { text: "Take it — the losses were bad luck, this one will recover them", error: "REVENGE" },
        { text: "Follow your daily loss rule and stop trading for the day", error: null },
        { text: "Take it at reduced size to 'get some back' safely", error: "REVENGE" },
        { text: "Step away, review both losses, and reset tomorrow", error: null },
      ],
    },
    {
      q: "You hit your pre-defined daily loss limit (−3%). A high-conviction setup forms 20 minutes later. You...",
      options: [
        { text: "Take it — daily limits are guidelines, not hard rules", error: "REVENGE" },
        { text: "Honor the limit — it exists to prevent bigger damage", error: null },
        { text: "Take it at 50% size since I'm still within weekly limits", error: "REVENGE" },
        { text: "Close the platform and plan tomorrow's session instead", error: null },
      ],
    },
    {
      q: "You made an execution error and lost more than the trade should have cost. You feel the market 'owes you.' You...",
      options: [
        { text: "Enter the next setup immediately to recover from the mistake", error: "REVENGE" },
        { text: "Accept the loss, log the execution error, and step away", error: null },
        { text: "Increase size on the next trade to recover the extra loss", error: "REVENGE" },
        { text: "Wait until tomorrow and review whether the error was systemic", error: null },
      ],
    },
    {
      q: "You're down 7% on the week. It's Thursday. One strong trade could put you close to flat. You...",
      options: [
        { text: "Find the best setup and trade it at larger size than usual", error: "REVENGE" },
        { text: "Accept the week's result and follow normal Friday sizing rules", error: null },
        { text: "Take one trade at normal size — your last for the week", error: null },
        { text: "Chase the biggest mover on your watchlist to recover quickly", error: "REVENGE" },
      ],
    },
  ],

  CONFIRMATION: [
    {
      q: "You're long BTC with a strong weekly bullish thesis. The 4h chart prints a bearish engulfing with high volume. You...",
      options: [
        { text: "Hold — my weekly view hasn't changed", error: "CONFIRMATION" },
        { text: "Tighten my stop-loss to protect the position", error: null },
        { text: "Find a bullish indicator on another chart to justify holding", error: "CONFIRMATION" },
        { text: "Honor my pre-planned stop — it's there for a reason", error: null },
      ],
    },
    {
      q: "You're short EUR/USD. The ECB surprises with a rate hike (EUR-bullish). Price spikes up. You...",
      options: [
        { text: "Hold — rate decisions often fully reverse after the spike", error: "CONFIRMATION" },
        { text: "Honor my stop-loss — the fundamental backdrop just changed", error: null },
        { text: "Add to the short — these spikes are always faded eventually", error: "CONFIRMATION" },
        { text: "Exit the position and wait for the volatility to settle", error: null },
      ],
    },
    {
      q: "You're long a growth stock. Three separate technical indicators are diverging bearishly. You think...",
      options: [
        { text: "These indicators lag price — my fundamental thesis is intact", error: "CONFIRMATION" },
        { text: "One divergence is noise; three is a warning worth acting on", error: null },
        { text: "Find a bullish indicator to offset the three bearish ones", error: "CONFIRMATION" },
        { text: "Reduce position size and tighten the stop as a precaution", error: null },
      ],
    },
    {
      q: "You have a long bias on oil. A respected macro analyst publishes a detailed bearish oil report. You...",
      options: [
        { text: "Dismiss it — they don't trade oil with my level of precision", error: "CONFIRMATION" },
        { text: "Read it objectively and check whether your thesis still holds", error: null },
        { text: "Find a bullish analyst report to counter their view", error: "CONFIRMATION" },
        { text: "Treat it as relevant data and update your view accordingly", error: null },
      ],
    },
    {
      q: "Your trade has been open 3 days with no movement toward your target. Price keeps returning to your entry. You...",
      options: [
        { text: "Hold — the setup remains valid, markets just take time", error: "CONFIRMATION" },
        { text: "Set a time-based exit: if no progress by Friday, I'm out", error: null },
        { text: "Add to the position — more conviction means more size", error: "CONFIRMATION" },
        { text: "Reassess honestly whether the original thesis is still valid", error: null },
      ],
    },
  ],

  RISK: [
    {
      q: "You want to risk exactly 1.5% of your $10,000 account. Your stop-loss is 6% away from entry. What size do you take?",
      context: "Position size = Risk $ ÷ Stop %",
      options: [
        { text: "$2,500 — that's 25% of my account ($2,500 × 6% = $150 = 1.5%)", error: null },
        { text: "$1,500 — I'm risking $1,500", error: "RISK" },
        { text: "$5,000 — feels like a solid size for this setup", error: "RISK" },
        { text: "$10,000 — full account, stop is only 6%", error: "RISK" },
      ],
    },
    {
      q: "Your trade is up 3R and still running. You want to add to the position. How do you size the addition?",
      options: [
        { text: "Full original size — I'm in profit so it's essentially 'free'", error: "RISK" },
        { text: "Recalculate using the same % risk from the new entry price", error: null },
        { text: "Double the original size — the trend is clearly confirmed", error: "RISK" },
        { text: "Same % risk rule applied to current price with a new stop", error: null },
      ],
    },
    {
      q: "A setup requires a stop-loss 18% below entry — much wider than usual. Your standard risk rule is 2% of account. You...",
      options: [
        { text: "Place a normal size trade — the wider stop reflects higher conviction", error: "RISK" },
        { text: "Skip the trade — the math doesn't allow for proper sizing", error: null },
        { text: "Use leverage to keep the notional position size large", error: "RISK" },
        { text: "Size down so the 18% stop still equals exactly 2% account risk", error: null },
      ],
    },
    {
      q: "You have 3 open trades each risking 1.5% of your account. A 4th excellent setup appears. You...",
      options: [
        { text: "Add it — each trade is independently managed", error: "RISK" },
        { text: "Skip it — total open risk is already at 4.5%", error: null },
        { text: "Add it but reduce all 4 to 1% to balance total exposure", error: null },
        { text: "Add it at 2% size since this one has extra conviction", error: "RISK" },
      ],
    },
    {
      q: "After 5 winning trades in a row you consider scaling up your risk per trade from 1% to 3%. You...",
      options: [
        { text: "Do it — a 5-trade winning streak justifies higher risk", error: "RISK" },
        { text: "Keep 1% — a sample size of 5 is statistically meaningless", error: null },
        { text: "Scale to 1.5% as a modest step up", error: "RISK" },
        { text: "Revisit risk parameters only after a formal 100-trade review", error: null },
      ],
    },
  ],

  SIGNAL: [
    {
      q: "You trade a 4h breakout strategy. A breakout signal fires on the 15m chart before the 4h candle closes. You...",
      options: [
        { text: "Enter now for a better average price", error: "SIGNAL" },
        { text: "Wait for the 4h candle to close and confirm", error: null },
        { text: "Enter 25% size now, add the rest on 4h close", error: "SIGNAL" },
        { text: "Ignore it — my edge is defined on the 4h, not 15m", error: null },
      ],
    },
    {
      q: "A prominent trader on X posts a 'must buy now' alert on a stock outside your normal watchlist. Hundreds are liking it. You...",
      options: [
        { text: "Enter — crowd momentum adds to the thesis", error: "SIGNAL" },
        { text: "Ignore it — it's outside my system and untested by me", error: null },
        { text: "Enter half size — community confirmation counts as a signal", error: "SIGNAL" },
        { text: "Check if the pattern fits your own criteria before acting", error: null },
      ],
    },
    {
      q: "You're about to enter a trade. A high-impact news event is scheduled in 25 minutes. You...",
      options: [
        { text: "Enter now and use a tighter stop to manage news risk", error: "SIGNAL" },
        { text: "Wait until after the event and let price settle", error: null },
        { text: "Enter half size now and plan to add post-news", error: "SIGNAL" },
        { text: "Skip it — news windows are outside my system rules", error: null },
      ],
    },
    {
      q: "Two of your three required entry conditions are met. The third is borderline. You...",
      options: [
        { text: "Enter — two out of three is a strong majority", error: "SIGNAL" },
        { text: "Wait for all three conditions to be unambiguously met", error: null },
        { text: "Enter at reduced size since conviction is lower", error: "SIGNAL" },
        { text: "Document it as a near-miss setup and wait for the next one", error: null },
      ],
    },
    {
      q: "Your 1-hour strategy shows a strong buy signal, but the daily chart is in a clear downtrend. You...",
      options: [
        { text: "Enter long — the 1h signal is my defined edge", error: "SIGNAL" },
        { text: "Skip it — trading against the dominant trend reduces my edge", error: null },
        { text: "Enter a smaller long position with a tighter stop", error: "SIGNAL" },
        { text: "Look for short setups instead, aligned with the daily trend", error: null },
      ],
    },
  ],
};

function generateQuiz(): Question[] {
  const questions = (Object.keys(QUESTION_BANK) as Array<keyof typeof ERROR_META>).map(
    key => QUESTION_BANK[key][Math.floor(Math.random() * QUESTION_BANK[key].length)]
  );
  return shuffleArray(questions);
}

// ─── Zone colors ──────────────────────────────────────────────────────────────

const zoneColor = {
  red:     { dot: "bg-red-500",     text: "text-red-400/75",     label: "HIGH" },
  amber:   { dot: "bg-amber-400",   text: "text-amber-400/75",   label: "MED"  },
  emerald: { dot: "bg-emerald-500", text: "text-emerald-400/75", label: "LOW"  },
};

// ─── DetectedErrorCard — compact card shown in results ───────────────────────

function DetectedErrorCard({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const e = ERROR_META[id];
  if (!e) return null;

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden mb-3">
      {/* Summary row — always visible */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start justify-between gap-4 px-4 py-3.5 text-left group"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/70 shrink-0" />
            <span className="text-[13px] font-semibold text-white leading-none">{e.label}</span>
          </div>
          <p className="text-[12px] text-zinc-500 leading-relaxed pl-3.5">{e.desc}</p>
        </div>
        <div className={`flex items-center gap-1 shrink-0 mt-0.5 text-[11px] transition-colors ${open ? "text-zinc-400" : "text-zinc-600 group-hover:text-zinc-400"}`}>
          <span>{open ? "Less" : "How to fix"}</span>
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </button>

      {/* Full details — collapsible */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.05] px-4 pt-4 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <p className="text-[9px] tracking-[0.2em] text-zinc-600 font-bold mb-2.5">WARNING SIGNS</p>
                {e.signals.map((s, i) => (
                  <p key={i} className="text-[11px] text-zinc-400 mb-1.5 flex gap-2 leading-relaxed">
                    <span className="text-zinc-700 shrink-0 mt-0.5">–</span>{s}
                  </p>
                ))}
              </div>
              <div>
                <p className="text-[9px] tracking-[0.2em] text-zinc-600 font-bold mb-2.5">RULES TO FOLLOW</p>
                {e.rules.map((r, i) => (
                  <p key={i} className="text-[11px] text-zinc-400 mb-1.5 flex gap-2 leading-relaxed">
                    <span className="text-zinc-700 shrink-0 font-mono mt-0.5">{i + 1}.</span>{r}
                  </p>
                ))}
              </div>
              <div>
                <p className="text-[9px] tracking-[0.2em] text-zinc-600 font-bold mb-2.5">RISK ZONES</p>
                {e.zones.map((z, i) => {
                  const c = zoneColor[z.color];
                  return (
                    <div key={i} className="flex items-start gap-2 mb-1.5">
                      <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
                      <p className={`text-[11px] leading-relaxed ${c.text}`}>{z.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── LibraryErrorCard (used in library view) ──────────────────────────────────

function LibraryErrorCard({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const e = ERROR_META[id];
  if (!e) return null;

  return (
    <div className="border-b border-white/[0.05]">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">{e.label}</span>
        </div>
        {open ? <ChevronUp size={13} className="text-zinc-600" /> : <ChevronDown size={13} className="text-zinc-600" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <p className="text-[12px] text-zinc-500 mb-4 leading-relaxed">{e.desc}</p>
            <div className="pb-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <p className="text-[9px] tracking-[0.2em] text-zinc-600 font-bold mb-2">WARNING SIGNS</p>
                {e.signals.map((s, i) => (
                  <p key={i} className="text-[11px] text-zinc-400 mb-1 flex gap-2"><span className="text-zinc-700">–</span>{s}</p>
                ))}
              </div>
              <div>
                <p className="text-[9px] tracking-[0.2em] text-zinc-600 font-bold mb-2">RULES TO FOLLOW</p>
                {e.rules.map((r, i) => (
                  <p key={i} className="text-[11px] text-zinc-400 mb-1 flex gap-2"><span className="text-zinc-700 shrink-0">{i+1}.</span>{r}</p>
                ))}
              </div>
              <div>
                <p className="text-[9px] tracking-[0.2em] text-zinc-600 font-bold mb-2">RISK ZONES</p>
                {e.zones.map((z, i) => {
                  const c = zoneColor[z.color];
                  return (
                    <div key={i} className="flex items-start gap-2 mb-1.5">
                      <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
                      <p className={`text-[11px] ${c.text}`}>{z.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type View = "quiz" | "results" | "library";

export default function DecisionErrorsPage() {
  const [view, setView] = useState<View>("quiz");
  const [step, setStep] = useState(0);
  const [flagged, setFlagged] = useState<string[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [quizKey, setQuizKey] = useState(0);

  const shuffledQuiz = useMemo(() => generateQuiz(), [quizKey]); // eslint-disable-line react-hooks/exhaustive-deps

  function reset() {
    setView("quiz");
    setStep(0);
    setFlagged([]);
    setChosen(null);
    setQuizKey(k => k + 1);
  }

  function pick(idx: number) {
    if (chosen !== null) return;
    setChosen(idx);
    const err = shuffledQuiz[step].options[idx].error;
    const next = err && !flagged.includes(err) ? [...flagged, err] : flagged;
    setTimeout(() => {
      if (step + 1 < shuffledQuiz.length) {
        setFlagged(next);
        setStep(s => s + 1);
        setChosen(null);
      } else {
        setFlagged(next);
        setView("results");
      }
    }, 480);
  }

  const allErrorIds = Object.keys(ERROR_META);

  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden bg-[#07080f] text-white">

      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#07080f]/95 backdrop-blur border-b border-white/[0.05]">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/app" className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
              <ArrowLeft size={15} className="text-zinc-600" />
            </Link>
            <div>
              <h1 className="text-sm font-semibold text-white">Decision Errors</h1>
              <p className="text-[10px] text-zinc-600">
                {view === "quiz" ? `Question ${step + 1} of ${shuffledQuiz.length}` : view === "results" ? "Your personal profile" : "Error library"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {view !== "library" && (
              <button onClick={() => setView("library")} className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">
                View all errors
              </button>
            )}
            {view !== "quiz" && (
              <button onClick={reset} className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">
                <RotateCcw size={11} /> Retake
              </button>
            )}
            {view === "library" && (
              <button onClick={() => setView("quiz")} className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors">
                Take quiz <ArrowRight size={11} />
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── QUIZ ─────────────────────────────────────────────────────────── */}
        {view === "quiz" && (
          <motion.div key={`q${quizKey}-${step}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto px-6 py-10"
          >
            {/* Progress bar */}
            <div className="flex gap-1 mb-10">
              {shuffledQuiz.map((_, i) => (
                <div key={i} className={`h-[2px] flex-1 rounded-full transition-all duration-300 ${
                  i < step ? "bg-white/30" : i === step ? "bg-white/70" : "bg-white/8"
                }`} />
              ))}
            </div>

            <h2 className="text-[15px] font-medium text-zinc-200 leading-relaxed mb-2">{shuffledQuiz[step].q}</h2>
            {shuffledQuiz[step].context && (
              <p className="text-[11px] text-zinc-600 mb-6 font-mono">{shuffledQuiz[step].context}</p>
            )}
            {!shuffledQuiz[step].context && <div className="mb-6" />}

            <div className="space-y-2">
              {shuffledQuiz[step].options.map((opt, i) => {
                const isChosen = chosen === i;
                const revealed = chosen !== null;
                return (
                  <button
                    key={i}
                    onClick={() => pick(i)}
                    disabled={revealed}
                    className={`w-full text-left px-4 py-3.5 rounded-lg border text-[13px] transition-all duration-200 ${
                      !revealed
                        ? "border-white/8 text-zinc-400 hover:border-white/18 hover:text-zinc-200 hover:bg-white/[0.03]"
                        : isChosen
                          ? "border-white/25 bg-white/[0.05] text-zinc-200"
                          : "border-white/4 text-zinc-700"
                    }`}
                  >
                    <span className="text-zinc-700 mr-3 text-[11px] font-mono">{String.fromCharCode(65 + i)}</span>
                    {opt.text}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── RESULTS ──────────────────────────────────────────────────────── */}
        {view === "results" && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto px-6 py-8"
          >
            {flagged.length === 0 ? (
              <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-emerald-500/20 bg-emerald-500/5 mb-4">
                  <span className="text-emerald-400 text-xl">✓</span>
                </div>
                <h2 className="text-sm font-semibold text-white mb-2">No patterns detected</h2>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
                  Your responses show disciplined thinking. Review the error library periodically to stay sharp.
                </p>
                <button onClick={() => setView("library")} className="mt-6 text-xs text-zinc-600 hover:text-zinc-400 underline transition-colors">
                  Browse all errors anyway
                </button>
              </div>
            ) : (
              <>
                {/* Score header */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-bold text-white">{flagged.length}</span>
                    <span className="text-sm text-zinc-600">of {allErrorIds.length} patterns found</span>
                  </div>
                  <p className="text-[12px] text-zinc-500 leading-relaxed">
                    Tap any card to see what triggers it and how to fix it.
                  </p>
                </div>

                {/* Detected errors */}
                <div className="mb-8">
                  {flagged.map(id => (
                    <DetectedErrorCard key={id} id={id} />
                  ))}
                </div>

                {/* Clean areas — minimal */}
                {allErrorIds.filter(id => !flagged.includes(id)).length > 0 && (
                  <div className="pt-5 border-t border-white/[0.04]">
                    <p className="text-[9px] tracking-[0.15em] text-zinc-700 font-bold mb-3">CLEAN ON</p>
                    <div className="flex flex-wrap gap-2">
                      {allErrorIds.filter(id => !flagged.includes(id)).map(id => (
                        <span key={id} className="text-[11px] text-zinc-700 px-2.5 py-1 rounded-md border border-white/[0.04] bg-white/[0.01]">
                          {ERROR_META[id].label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ── LIBRARY ──────────────────────────────────────────────────────── */}
        {view === "library" && (
          <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto px-6 py-6"
          >
            <p className="text-[10px] tracking-[0.2em] text-zinc-600 font-bold mb-6">ALL 7 DECISION ERRORS</p>
            {allErrorIds.map(id => (
              <LibraryErrorCard key={id} id={id} />
            ))}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
