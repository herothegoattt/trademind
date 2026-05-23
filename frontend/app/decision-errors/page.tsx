"use client";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft, ArrowRight, RotateCcw,
  Zap, Crown, Moon, Flame, Target, AlertTriangle, Radio,
  CheckCircle2, ChevronDown, ChevronUp, BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── Error metadata (unchanged content) ──────────────────────── */
const ERROR_META: Record<string, {
  label: string; desc: string;
  signals: string[]; rules: string[];
  zones: { risk: string; text: string; color: "red"|"amber"|"emerald" }[];
}> = {
  FOMO: {
    label: "FOMO",
    desc: "Entering trades emotionally after the move already happened.",
    signals: ["Chasing breakouts minutes after they occur","Increasing size because 'it's still going'","Entering without a pre-defined plan"],
    rules: ["If the entry is gone, the trade is gone","Set alerts — never watch charts waiting to chase","Document entry criteria before the session"],
    zones: [
      { risk:"HIGH", text:"First 5 min after breakout", color:"red" },
      { risk:"MED",  text:"Hours 1–4 of a strong trend", color:"amber" },
      { risk:"LOW",  text:"Pullback to planned entry zone", color:"emerald" },
    ],
  },
  OVERCONFIDENCE: {
    label: "Overconfidence",
    desc: "Abandoning risk rules after a winning streak.",
    signals: ["Skipping stop-loss 'this one time'","Doubling size after wins","Feeling invincible after 3+ green days"],
    rules: ["Position size is fixed — wins don't change the formula","Take first target; perfect exits don't exist","Log every trade — emotion fades, data doesn't"],
    zones: [
      { risk:"HIGH", text:"After 3rd consecutive winning trade", color:"red" },
      { risk:"MED",  text:"Second green day in a row", color:"amber" },
      { risk:"LOW",  text:"Following the same rules regardless of streak", color:"emerald" },
    ],
  },
  FATIGUE: {
    label: "Decision Under Fatigue",
    desc: "Impaired judgment from lack of sleep or extended sessions.",
    signals: ["Trading 7+ hours without a break","Entering trades while hesitating","Eye strain, slow reactions, irritability"],
    rules: ["Hard stop after 3 hours of active trading","7+ hours sleep is a trading prerequisite","Hesitation = your body saying no"],
    zones: [
      { risk:"HIGH", text:"7+ hours after waking, live trading", color:"red" },
      { risk:"MED",  text:"Hour 3+ of continuous chart watching", color:"amber" },
      { risk:"LOW",  text:"Fresh session, rested, <2h active", color:"emerald" },
    ],
  },
  REVENGE: {
    label: "Revenge Trading",
    desc: "Re-entering the market to recover losses emotionally.",
    signals: ["Trade placed within 5 min of a stop-out","Larger size 'to get it back faster'","Switching pairs or strategy after a loss"],
    rules: ["30 min mandatory pause after any loss","Write down the loss and why before next trade","Size never increases after a loss — ever"],
    zones: [
      { risk:"HIGH", text:"0–5 min after stop-out", color:"red" },
      { risk:"MED",  text:"5–30 min, still emotional", color:"amber" },
      { risk:"LOW",  text:"30+ min, reviewed and logged", color:"emerald" },
    ],
  },
  CONFIRMATION: {
    label: "Confirmation Bias",
    desc: "Filtering information to match your existing position.",
    signals: ["Ignoring signals that contradict your bias","Cherry-picking indicators","Moving stop-loss to avoid being stopped out"],
    rules: ["Write your exit thesis before entry — not after","Actively look for reasons your trade is wrong","Honor your stop. Every time."],
    zones: [
      { risk:"HIGH", text:"2–3 hours after entry (peak conviction)", color:"red" },
      { risk:"MED",  text:"Price 5%+ against you, no stop hit yet", color:"amber" },
      { risk:"LOW",  text:"Pre-written stop followed mechanically", color:"emerald" },
    ],
  },
  RISK: {
    label: "Risk Miscalculation",
    desc: "Incorrect position sizing leading to oversized drawdowns.",
    signals: ["No stop-loss on open position","Account down 20%+ from equity high","Using leverage without defined rules"],
    rules: ["Risk = Size × SL% = fixed dollar amount always","Max 2% per trade / 6% per week / 15% per month","Leverage is a tool for consistent traders only"],
    zones: [
      { risk:"HIGH", text:"Single trade risk exceeds 2% of account", color:"red" },
      { risk:"MED",  text:"Weekly drawdown approaching 5%", color:"amber" },
      { risk:"LOW",  text:"Position sized mathematically before entry", color:"emerald" },
    ],
  },
  SIGNAL: {
    label: "Invalid Signal Execution",
    desc: "Acting on unconfirmed or mismatched timeframe signals.",
    signals: ["Using 1m signals for a 4h strategy","Entering before candle close","Following alerts from untested sources"],
    rules: ["Your timeframe's candle must close before entry","Only trade systems you've backtested 50+ times","Faster timeframes are noise for swing traders"],
    zones: [
      { risk:"HIGH", text:"Entry on open candle, unconfirmed", color:"red" },
      { risk:"MED",  text:"News window ±2 hours", color:"amber" },
      { risk:"LOW",  text:"Closed candle, tested setup, right timeframe", color:"emerald" },
    ],
  },
};

/* ── Per-error visual config ──────────────────────────────────── */
type ECEntry = { color: string; rgb: string; Icon: React.FC<{ className?: string; style?: React.CSSProperties }> };
const EC: Record<string, ECEntry> = {
  FOMO:           { color: "#f97316", rgb: "249,115,22",  Icon: (p) => <Zap           {...p} /> },
  OVERCONFIDENCE: { color: "#a78bfa", rgb: "167,139,250", Icon: (p) => <Crown         {...p} /> },
  FATIGUE:        { color: "#38bdf8", rgb: "56,189,248",  Icon: (p) => <Moon          {...p} /> },
  REVENGE:        { color: "#f43f5e", rgb: "244,63,94",   Icon: (p) => <Flame         {...p} /> },
  CONFIRMATION:   { color: "#fb923c", rgb: "251,146,60",  Icon: (p) => <Target        {...p} /> },
  RISK:           { color: "#facc15", rgb: "250,204,21",  Icon: (p) => <AlertTriangle  {...p} /> },
  SIGNAL:         { color: "#34d399", rgb: "52,211,153",  Icon: (p) => <Radio         {...p} /> },
};

/* ── Question bank (unchanged) ───────────────────────────────── */
type QOption = { text: string; error: keyof typeof ERROR_META | null };
type Question = { q: string; context?: string; options: QOption[] };

const QUESTION_BANK: Record<keyof typeof ERROR_META, Question[]> = {
  FOMO:[
    { q:"EUR/USD ripped 150 pips in 20 minutes while you were away from your desk. It's still moving. What do you do?",
      options:[{text:"Enter now — momentum is clearly there",error:"FOMO"},{text:"Wait for a retracement to my planned entry level",error:null},{text:"Enter half size since I missed the ideal entry",error:"FOMO"},{text:"Mark it in my journal and look for the next setup",error:null}]},
    { q:"Bitcoin just pumped 18% in 90 minutes on news. You had a dip-buy plan but it never pulled back. It's still green. You...",
      options:[{text:"Enter now — the momentum confirms the bull thesis",error:"FOMO"},{text:"Accept the miss and wait for my planned dip entry",error:null},{text:"Enter a small position just to 'participate' in the move",error:"FOMO"},{text:"Set an alert at my original level and move on",error:null}]},
    { q:"A stock you've been watching breaks out of a 3-month range. By the time you see it, it's already 7% above the breakout level. You...",
      options:[{text:"Buy immediately — breakouts often extend further",error:"FOMO"},{text:"Wait to see if price retests the breakout level as support",error:null},{text:"Buy half now and plan to add on any pullback",error:"FOMO"},{text:"Skip it — my entry was the breakout, not 7% above it",error:null}]},
    { q:"A trader in your group chat is posting real-time gains from a trade you don't have on. They're up $4,000 and it's 'still going.' You...",
      options:[{text:"Open the chart and find the nearest entry point quickly",error:"FOMO"},{text:"Congratulate them and stay focused on your own watchlist",error:null},{text:"Enter a smaller size — better late than never",error:"FOMO"},{text:"Check if this setup fits your own system before acting",error:null}]},
    { q:"You set an alarm for a news trade but slept through it. The 200-pip spike already happened. You...",
      options:[{text:"Enter on the consolidation — these patterns often continue",error:"FOMO"},{text:"Note the setup in your journal for the next occurrence",error:null},{text:"Enter a reduced size using the consolidation as entry",error:"FOMO"},{text:"Accept the miss — a missed trade is not a trading loss",error:null}]},
  ],
  OVERCONFIDENCE:[
    { q:"You've closed 5 winning trades this week, up 8%. A new setup appears with a slightly wider stop than usual. You size it...",
      options:[{text:"Same fixed % as every other trade",error:null},{text:"A bit larger — I'm in a flow state right now",error:"OVERCONFIDENCE"},{text:"Larger, but I'll scale out early to protect gains",error:"OVERCONFIDENCE"},{text:"Smaller — a wider stop means smaller position",error:null}]},
    { q:"You've had your best week ever — up 11%. It's Monday morning. A setup that's 'almost' your entry criteria appears. You...",
      options:[{text:"Skip it — 'almost' is not my criteria",error:null},{text:"Take it — I'm clearly reading the market well right now",error:"OVERCONFIDENCE"},{text:"Take it at reduced size as a 'feel' trade",error:"OVERCONFIDENCE"},{text:"Write out exactly why it doesn't qualify and pass",error:null}]},
    { q:"After 4 consecutive winning trades you find yourself skipping your pre-trade checklist. You...",
      options:[{text:"Run the checklist anyway — discipline doesn't take days off",error:null},{text:"Skip it — I've proven I can read this market",error:"OVERCONFIDENCE"},{text:"Do a shortened version — just the most important items",error:"OVERCONFIDENCE"},{text:"Stop trading and review why I'm skipping the process",error:null}]},
    { q:"You just made 3× your average monthly return in 2 weeks. You decide to...",
      options:[{text:"Double position sizes to capitalize on the hot streak",error:"OVERCONFIDENCE"},{text:"Keep the same rules — this month's returns don't change my edge",error:null},{text:"Take a few days off to protect the gains and reset",error:null},{text:"Start trading instruments outside my usual specialization",error:"OVERCONFIDENCE"}]},
    { q:"Your stop-loss is 12 pips away but you feel very confident about this trade. You consider moving it to 25 pips 'just this once.' You...",
      options:[{text:"Move it — my read on this one is exceptional",error:"OVERCONFIDENCE"},{text:"Keep the stop exactly where it should be per the setup",error:null},{text:"Remove the stop entirely — I'll exit manually if needed",error:"OVERCONFIDENCE"},{text:"Accept the trade at the original stop or don't take it",error:null}]},
  ],
  FATIGUE:[
    { q:"It's hour 6 of your trading session. A setup that matches your criteria appears. You haven't taken a break. You...",
      options:[{text:"Take it — the setup is valid regardless of how long I've been trading",error:"FATIGUE"},{text:"Close charts and come back tomorrow",error:null},{text:"Take it at half size since I'm aware I'm fatigued",error:"FATIGUE"},{text:"Step away for 30–45 minutes, then reassess with fresh eyes",error:null}]},
    { q:"You slept 4 hours last night due to stress. Markets just opened and your scanner flags a valid setup. You...",
      options:[{text:"Take it — the setup is valid regardless of my sleep",error:"FATIGUE"},{text:"Paper-trade it today and track whether it would have worked",error:null},{text:"Take it at half size to limit potential damage",error:"FATIGUE"},{text:"Skip today's session and prioritize sleep recovery",error:null}]},
    { q:"It's 11:30pm and the Asian session is showing a textbook setup that perfectly matches your criteria. You...",
      options:[{text:"Enter — perfect setups don't care about time zones",error:"FATIGUE"},{text:"Set an alert at entry price and review it in the morning",error:null},{text:"Enter now but use a tighter stop to limit overnight risk",error:"FATIGUE"},{text:"Log it as a missed opportunity, sleep, and review tomorrow",error:null}]},
    { q:"You've been in stressful back-to-back meetings all day. Markets close in 90 minutes. A high-probability setup just formed. You...",
      options:[{text:"Enter — good setups don't wait for better timing",error:"FATIGUE"},{text:"Paper-trade this one and revisit the setup type tomorrow",error:null},{text:"Enter with a tighter stop to account for reduced focus",error:"FATIGUE"},{text:"Skip it — trading on a stressed, distracted mind isn't an edge",error:null}]},
    { q:"You're on your 4th consecutive trading day after intense 6-hour sessions each day. A familiar setup appears. You...",
      options:[{text:"Enter — familiarity with the pattern reduces the mental load",error:"FATIGUE"},{text:"Take a full rest day before the next session",error:null},{text:"Enter half size to account for accumulated fatigue",error:"FATIGUE"},{text:"Review recent trades for fatigue-driven mistakes before deciding",error:null}]},
  ],
  REVENGE:[
    { q:"Your stop-loss triggered for a 1.8% loss. The market immediately reverses in your original direction. You...",
      options:[{text:"Re-enter — I was right, just early",error:"REVENGE"},{text:"Walk away for at least 30 minutes",error:null},{text:"Enter smaller to 'test' the direction",error:"REVENGE"},{text:"Log the trade and wait for the next clean setup tomorrow",error:null}]},
    { q:"You've had two consecutive losses today totaling 3.5% drawdown. Another setup appears 10 minutes later. You...",
      options:[{text:"Take it — the losses were bad luck, this one will recover them",error:"REVENGE"},{text:"Follow your daily loss rule and stop trading for the day",error:null},{text:"Take it at reduced size to 'get some back' safely",error:"REVENGE"},{text:"Step away, review both losses, and reset tomorrow",error:null}]},
    { q:"You hit your pre-defined daily loss limit (−3%). A high-conviction setup forms 20 minutes later. You...",
      options:[{text:"Take it — daily limits are guidelines, not hard rules",error:"REVENGE"},{text:"Honor the limit — it exists to prevent bigger damage",error:null},{text:"Take it at 50% size since I'm still within weekly limits",error:"REVENGE"},{text:"Close the platform and plan tomorrow's session instead",error:null}]},
    { q:"You made an execution error and lost more than the trade should have cost. You feel the market 'owes you.' You...",
      options:[{text:"Enter the next setup immediately to recover from the mistake",error:"REVENGE"},{text:"Accept the loss, log the execution error, and step away",error:null},{text:"Increase size on the next trade to recover the extra loss",error:"REVENGE"},{text:"Wait until tomorrow and review whether the error was systemic",error:null}]},
    { q:"You're down 7% on the week. It's Thursday. One strong trade could put you close to flat. You...",
      options:[{text:"Find the best setup and trade it at larger size than usual",error:"REVENGE"},{text:"Accept the week's result and follow normal Friday sizing rules",error:null},{text:"Take one trade at normal size — your last for the week",error:null},{text:"Chase the biggest mover on your watchlist to recover quickly",error:"REVENGE"}]},
  ],
  CONFIRMATION:[
    { q:"You're long BTC with a strong weekly bullish thesis. The 4h chart prints a bearish engulfing with high volume. You...",
      options:[{text:"Hold — my weekly view hasn't changed",error:"CONFIRMATION"},{text:"Tighten my stop-loss to protect the position",error:null},{text:"Find a bullish indicator on another chart to justify holding",error:"CONFIRMATION"},{text:"Honor my pre-planned stop — it's there for a reason",error:null}]},
    { q:"You're short EUR/USD. The ECB surprises with a rate hike (EUR-bullish). Price spikes up. You...",
      options:[{text:"Hold — rate decisions often fully reverse after the spike",error:"CONFIRMATION"},{text:"Honor my stop-loss — the fundamental backdrop just changed",error:null},{text:"Add to the short — these spikes are always faded eventually",error:"CONFIRMATION"},{text:"Exit the position and wait for the volatility to settle",error:null}]},
    { q:"You're long a growth stock. Three separate technical indicators are diverging bearishly. You think...",
      options:[{text:"These indicators lag price — my fundamental thesis is intact",error:"CONFIRMATION"},{text:"One divergence is noise; three is a warning worth acting on",error:null},{text:"Find a bullish indicator to offset the three bearish ones",error:"CONFIRMATION"},{text:"Reduce position size and tighten the stop as a precaution",error:null}]},
    { q:"You have a long bias on oil. A respected macro analyst publishes a detailed bearish oil report. You...",
      options:[{text:"Dismiss it — they don't trade oil with my level of precision",error:"CONFIRMATION"},{text:"Read it objectively and check whether your thesis still holds",error:null},{text:"Find a bullish analyst report to counter their view",error:"CONFIRMATION"},{text:"Treat it as relevant data and update your view accordingly",error:null}]},
    { q:"Your trade has been open 3 days with no movement toward your target. Price keeps returning to your entry. You...",
      options:[{text:"Hold — the setup remains valid, markets just take time",error:"CONFIRMATION"},{text:"Set a time-based exit: if no progress by Friday, I'm out",error:null},{text:"Add to the position — more conviction means more size",error:"CONFIRMATION"},{text:"Reassess honestly whether the original thesis is still valid",error:null}]},
  ],
  RISK:[
    { q:"You want to risk exactly 1.5% of your $10,000 account. Your stop-loss is 6% away from entry. What size do you take?",
      context:"Position size = Risk $ ÷ Stop %",
      options:[{text:"$2,500 — that's 25% of my account ($2,500 × 6% = $150 = 1.5%)",error:null},{text:"$1,500 — I'm risking $1,500",error:"RISK"},{text:"$5,000 — feels like a solid size for this setup",error:"RISK"},{text:"$10,000 — full account, stop is only 6%",error:"RISK"}]},
    { q:"Your trade is up 3R and still running. You want to add to the position. How do you size the addition?",
      options:[{text:"Full original size — I'm in profit so it's essentially 'free'",error:"RISK"},{text:"Recalculate using the same % risk from the new entry price",error:null},{text:"Double the original size — the trend is clearly confirmed",error:"RISK"},{text:"Same % risk rule applied to current price with a new stop",error:null}]},
    { q:"A setup requires a stop-loss 18% below entry — much wider than usual. Your standard risk rule is 2% of account. You...",
      options:[{text:"Place a normal size trade — the wider stop reflects higher conviction",error:"RISK"},{text:"Skip the trade — the math doesn't allow for proper sizing",error:null},{text:"Use leverage to keep the notional position size large",error:"RISK"},{text:"Size down so the 18% stop still equals exactly 2% account risk",error:null}]},
    { q:"You have 3 open trades each risking 1.5% of your account. A 4th excellent setup appears. You...",
      options:[{text:"Add it — each trade is independently managed",error:"RISK"},{text:"Skip it — total open risk is already at 4.5%",error:null},{text:"Add it but reduce all 4 to 1% to balance total exposure",error:null},{text:"Add it at 2% size since this one has extra conviction",error:"RISK"}]},
    { q:"After 5 winning trades in a row you consider scaling up your risk per trade from 1% to 3%. You...",
      options:[{text:"Do it — a 5-trade winning streak justifies higher risk",error:"RISK"},{text:"Keep 1% — a sample size of 5 is statistically meaningless",error:null},{text:"Scale to 1.5% as a modest step up",error:"RISK"},{text:"Revisit risk parameters only after a formal 100-trade review",error:null}]},
  ],
  SIGNAL:[
    { q:"You trade a 4h breakout strategy. A breakout signal fires on the 15m chart before the 4h candle closes. You...",
      options:[{text:"Enter now for a better average price",error:"SIGNAL"},{text:"Wait for the 4h candle to close and confirm",error:null},{text:"Enter 25% size now, add the rest on 4h close",error:"SIGNAL"},{text:"Ignore it — my edge is defined on the 4h, not 15m",error:null}]},
    { q:"A prominent trader on X posts a 'must buy now' alert on a stock outside your normal watchlist. Hundreds are liking it. You...",
      options:[{text:"Enter — crowd momentum adds to the thesis",error:"SIGNAL"},{text:"Ignore it — it's outside my system and untested by me",error:null},{text:"Enter half size — community confirmation counts as a signal",error:"SIGNAL"},{text:"Check if the pattern fits your own criteria before acting",error:null}]},
    { q:"You're about to enter a trade. A high-impact news event is scheduled in 25 minutes. You...",
      options:[{text:"Enter now and use a tighter stop to manage news risk",error:"SIGNAL"},{text:"Wait until after the event and let price settle",error:null},{text:"Enter half size now and plan to add post-news",error:"SIGNAL"},{text:"Skip it — news windows are outside my system rules",error:null}]},
    { q:"Two of your three required entry conditions are met. The third is borderline. You...",
      options:[{text:"Enter — two out of three is a strong majority",error:"SIGNAL"},{text:"Wait for all three conditions to be unambiguously met",error:null},{text:"Enter at reduced size since conviction is lower",error:"SIGNAL"},{text:"Document it as a near-miss setup and wait for the next one",error:null}]},
    { q:"Your 1-hour strategy shows a strong buy signal, but the daily chart is in a clear downtrend. You...",
      options:[{text:"Enter long — the 1h signal is my defined edge",error:"SIGNAL"},{text:"Skip it — trading against the dominant trend reduces my edge",error:null},{text:"Enter a smaller long position with a tighter stop",error:"SIGNAL"},{text:"Look for short setups instead, aligned with the daily trend",error:null}]},
  ],
};

function generateQuiz(): Question[] {
  const questions = (Object.keys(QUESTION_BANK) as Array<keyof typeof ERROR_META>).map(
    key => QUESTION_BANK[key][Math.floor(Math.random() * QUESTION_BANK[key].length)]
  );
  return shuffleArray(questions);
}

const ALL_IDS = Object.keys(ERROR_META);
const STORAGE_KEY = "decision_errors_state";
type View = "quiz" | "results" | "library";

/* ── Roadmap node ─────────────────────────────────────────────── */
function RoadmapNode({
  id, index, detected, isLast,
}: { id: string; index: number; detected: boolean; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  const e  = ERROR_META[id];
  const ec = EC[id];
  const { Icon } = ec;

  return (
    <div className="relative">
      {/* Connector line */}
      {!isLast && (
        <div
          className="absolute left-[31px] top-[64px] w-px"
          style={{
            height: open ? "calc(100% - 48px)" : "calc(100% + 1px)",
            background: detected
              ? `linear-gradient(to bottom, ${ec.color}60, ${ec.color}15)`
              : "linear-gradient(to bottom, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
            transition: "height 0.3s ease",
          }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.07, duration: 0.4, ease: "easeOut" }}
      >
        {/* Node row */}
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center gap-4 text-left group"
          style={{ marginBottom: open ? 0 : 12 }}
        >
          {/* Circle node */}
          <div
            className="relative flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-300"
            style={{
              width: 64, height: 64,
              background: detected
                ? `radial-gradient(circle at 40% 35%, rgba(${ec.rgb},0.25) 0%, rgba(${ec.rgb},0.08) 60%, transparent 100%)`
                : "rgba(255,255,255,0.03)",
              border: detected
                ? `1.5px solid rgba(${ec.rgb},0.5)`
                : "1.5px solid rgba(255,255,255,0.08)",
              boxShadow: detected
                ? `0 0 24px rgba(${ec.rgb},0.2), 0 0 6px rgba(${ec.rgb},0.15), inset 0 1px 0 rgba(255,255,255,0.08)`
                : "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            {/* Pulse ring for detected */}
            {detected && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: `1px solid rgba(${ec.rgb},0.4)` }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <Icon className="w-5 h-5" style={{ color: detected ? ec.color : "rgba(255,255,255,0.2)" }} />
          </div>

          {/* Label */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-0.5">
              <span
                className="text-[13px] font-semibold tracking-wide"
                style={{ color: detected ? "#f1f5f9" : "rgba(148,163,184,0.45)" }}
              >
                {e.label}
              </span>
              {detected ? (
                <span
                  className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                  style={{
                    background: `rgba(${ec.rgb},0.12)`,
                    border: `1px solid rgba(${ec.rgb},0.3)`,
                    color: ec.color,
                  }}
                >
                  Detected
                </span>
              ) : (
                <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", color: "rgba(16,185,129,0.6)" }}>
                  Clear
                </span>
              )}
            </div>
            <p className="text-[11px] leading-relaxed truncate" style={{ color: "rgba(100,116,139,0.5)" }}>
              {e.desc}
            </p>
          </div>

          {/* Expand icon */}
          <div className="flex-shrink-0 pr-1" style={{ color: "rgba(71,85,105,0.5)" }}>
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </button>

        {/* Expandable detail panel */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div
                className="ml-[80px] mb-4 rounded-xl overflow-hidden"
                style={{
                  background: detected
                    ? `linear-gradient(135deg, rgba(${ec.rgb},0.07) 0%, rgba(7,10,18,0.8) 100%)`
                    : "rgba(255,255,255,0.02)",
                  border: detected
                    ? `1px solid rgba(${ec.rgb},0.18)`
                    : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: detected ? `0 4px 24px rgba(${ec.rgb},0.08)` : "none",
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.05]">
                  {/* Warning signs */}
                  <div className="px-4 py-3.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-2.5" style={{ color: "rgba(100,116,139,0.4)" }}>
                      Warning Signs
                    </p>
                    {e.signals.map((s, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: ec.color, opacity: 0.7 }} />
                        <p className="text-[11px] leading-relaxed" style={{ color: "rgba(148,163,184,0.65)" }}>{s}</p>
                      </div>
                    ))}
                  </div>
                  {/* Rules */}
                  <div className="px-4 py-3.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-2.5" style={{ color: "rgba(100,116,139,0.4)" }}>
                      Rules to Follow
                    </p>
                    {e.rules.map((r, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <span className="text-[10px] font-bold font-mono flex-shrink-0 mt-0.5" style={{ color: "rgba(71,85,105,0.7)" }}>{i + 1}.</span>
                        <p className="text-[11px] leading-relaxed" style={{ color: "rgba(148,163,184,0.65)" }}>{r}</p>
                      </div>
                    ))}
                  </div>
                  {/* Risk zones */}
                  <div className="px-4 py-3.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-2.5" style={{ color: "rgba(100,116,139,0.4)" }}>
                      Risk Zones
                    </p>
                    {e.zones.map((z, i) => {
                      const zc = z.color === "red" ? "#ef4444" : z.color === "amber" ? "#f59e0b" : "#10b981";
                      return (
                        <div key={i} className="flex gap-2 mb-2 items-start">
                          <span
                            className="mt-1 text-[8px] font-bold px-1 rounded flex-shrink-0"
                            style={{ background: `${zc}18`, color: zc, border: `1px solid ${zc}30` }}
                          >
                            {z.risk}
                          </span>
                          <p className="text-[11px] leading-relaxed" style={{ color: "rgba(148,163,184,0.55)" }}>{z.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ── Library card ─────────────────────────────────────────────── */
function LibraryCard({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const e  = ERROR_META[id];
  const ec = EC[id];
  const { Icon } = ec;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="relative rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: `linear-gradient(145deg, rgba(${ec.rgb},0.07) 0%, rgba(7,10,18,0.9) 55%)`,
        border: `1px solid rgba(${ec.rgb},0.18)`,
        boxShadow: `0 4px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(${ec.rgb},0.06), inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
      onClick={() => setOpen(v => !v)}
    >
      {/* Ambient glow corner */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, rgba(${ec.rgb},0.12) 0%, transparent 70%)`,
          transform: "translate(30%, -30%)",
        }}
      />

      {/* Card top */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div>
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl mb-2.5"
            style={{ background: `rgba(${ec.rgb},0.12)`, border: `1px solid rgba(${ec.rgb},0.22)` }}
          >
            <Icon className="w-4 h-4" style={{ color: ec.color }} />
          </div>
          <h3 className="text-[13px] font-bold" style={{ color: "#e2e8f0" }}>{e.label}</h3>
          <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "rgba(100,116,139,0.55)" }}>{e.desc}</p>
        </div>
        <div style={{ color: "rgba(71,85,105,0.5)", flexShrink: 0, marginTop: 2 }}>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: `rgba(${ec.rgb},0.1)` }}>
              <div className="pt-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "rgba(100,116,139,0.35)" }}>Warning Signs</p>
                {e.signals.map((s, i) => (
                  <div key={i} className="flex gap-2 mb-1.5">
                    <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: ec.color, opacity: 0.6 }} />
                    <p className="text-[11px] leading-relaxed" style={{ color: "rgba(148,163,184,0.6)" }}>{s}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "rgba(100,116,139,0.35)" }}>Rules</p>
                {e.rules.map((r, i) => (
                  <div key={i} className="flex gap-2 mb-1.5">
                    <span className="text-[10px] font-bold font-mono flex-shrink-0" style={{ color: "rgba(71,85,105,0.6)" }}>{i+1}.</span>
                    <p className="text-[11px] leading-relaxed" style={{ color: "rgba(148,163,184,0.6)" }}>{r}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function DecisionErrorsPage() {
  const [view,    setView]    = useState<View>("quiz");
  const [step,    setStep]    = useState(0);
  const [flagged, setFlagged] = useState<string[]>([]);
  const [chosen,  setChosen]  = useState<number | null>(null);
  const [quizKey, setQuizKey] = useState(0);
  const [mounted, setMounted] = useState(false);

  const freshQuiz = useMemo(() => generateQuiz(), [quizKey]); // eslint-disable-line
  const [quiz, setQuiz] = useState<Question[]>(freshQuiz);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const s = JSON.parse(saved);
        if (s.view)                              setView(s.view);
        if (typeof s.step === "number")          setStep(s.step);
        if (Array.isArray(s.flagged))            setFlagged(s.flagged);
        if (Array.isArray(s.quiz) && s.quiz.length) setQuiz(s.quiz);
      }
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => { if (mounted) setQuiz(freshQuiz); }, [quizKey]); // eslint-disable-line

  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ view, step, flagged, quiz })); } catch {}
  }, [view, step, flagged, quiz, mounted]);

  if (!mounted) return null;

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    setView("quiz"); setStep(0); setFlagged([]); setChosen(null); setQuizKey(k => k + 1);
  }

  function pick(idx: number) {
    if (chosen !== null) return;
    setChosen(idx);
    const err  = quiz[step].options[idx].error;
    const next = err && !flagged.includes(err) ? [...flagged, err] : flagged;
    setTimeout(() => {
      if (step + 1 < quiz.length) { setFlagged(next); setStep(s => s + 1); setChosen(null); }
      else { setFlagged(next); setView("results"); }
    }, 420);
  }

  const detectedCount = flagged.length;
  const cleanCount    = ALL_IDS.length - detectedCount;

  return (
    <div
      className="h-full overflow-y-auto overflow-x-hidden text-white"
      style={{ background: "#070a12" }}
    >
      {/* ── Dot-grid background ──────────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      {/* ── Ambient glow ─────────────────────────────────────── */}
      <div
        className="fixed pointer-events-none"
        style={{
          width: 600, height: 600,
          background: "radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)",
          top: "30%", left: "50%", transform: "translate(-50%,-50%)",
        }}
      />

      {/* ── Header ───────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-20"
        style={{ background: "rgba(7,10,18,0.92)", borderBottom: "1px solid rgba(255,255,255,0.055)", backdropFilter: "blur(16px)" }}
      >
        <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="flex items-center justify-center rounded-lg transition-colors"
              style={{ width: 28, height: 28, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <ArrowLeft className="w-3.5 h-3.5" style={{ color: "rgba(148,163,184,0.5)" }} />
            </Link>
            <div>
              <span className="text-[13px] font-bold" style={{ color: "#f1f5f9" }}>Decision Errors</span>
              <p className="text-[10px]" style={{ color: "rgba(100,116,139,0.5)" }}>
                {view === "quiz"    ? `Question ${step + 1} of ${quiz.length}` :
                 view === "results" ? `${detectedCount} detected · ${cleanCount} clear` :
                 "Error library — 7 cognitive traps"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view !== "library" && (
              <button
                onClick={() => setView("library")}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-medium transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(148,163,184,0.55)" }}
              >
                <BookOpen size={11} /> Library
              </button>
            )}
            {view !== "quiz" && (
              <button
                onClick={reset}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-medium transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(148,163,184,0.55)" }}
              >
                <RotateCcw size={11} /> Retake
              </button>
            )}
            {view === "library" && (
              <button
                onClick={() => setView("quiz")}
                className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-semibold transition-all"
                style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.28)", color: "#f59e0b" }}
              >
                Take quiz <ArrowRight size={11} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Views ────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* QUIZ ─────────────────────────────────────────────── */}
        {view === "quiz" && (
          <motion.div
            key={`q${quizKey}-${step}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="max-w-2xl mx-auto px-4 py-8 relative"
          >
            {/* Progress — connected nodes */}
            <div className="flex items-center gap-0 mb-10">
              {quiz.map((_, i) => {
                const done    = i < step;
                const current = i === step;
                const ec_id   = ALL_IDS[i];
                const ec      = EC[ec_id];
                return (
                  <div key={i} className="flex items-center flex-1">
                    <div
                      className="flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300"
                      style={{
                        width: current ? 32 : 22, height: current ? 32 : 22,
                        background: done
                          ? "rgba(16,185,129,0.15)"
                          : current
                            ? `rgba(${ec.rgb},0.18)`
                            : "rgba(255,255,255,0.04)",
                        border: done
                          ? "1.5px solid rgba(16,185,129,0.4)"
                          : current
                            ? `1.5px solid rgba(${ec.rgb},0.6)`
                            : "1.5px solid rgba(255,255,255,0.07)",
                        boxShadow: current ? `0 0 14px rgba(${ec.rgb},0.25)` : "none",
                      }}
                    >
                      {done ? (
                        <CheckCircle2 size={10} style={{ color: "#10b981" }} />
                      ) : (
                        <span className="text-[9px] font-bold font-mono" style={{ color: current ? ec.color : "rgba(71,85,105,0.5)" }}>
                          {i + 1}
                        </span>
                      )}
                    </div>
                    {i < quiz.length - 1 && (
                      <div
                        className="flex-1 h-px mx-1 transition-all duration-500"
                        style={{ background: done ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.06)" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Question card */}
            <div
              className="rounded-2xl p-6 mb-4"
              style={{
                background: "linear-gradient(145deg, rgba(255,255,255,0.035) 0%, rgba(7,10,18,0.8) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              {quiz[step].context && (
                <p className="text-[10px] font-mono mb-3 px-2 py-1.5 rounded-lg inline-block" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", color: "rgba(245,158,11,0.7)" }}>
                  {quiz[step].context}
                </p>
              )}
              <h2 className="text-[15px] font-medium leading-relaxed" style={{ color: "#e2e8f0" }}>
                {quiz[step].q}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {quiz[step].options.map((opt, i) => {
                const isChosen  = chosen === i;
                const revealed  = chosen !== null;
                const letter    = String.fromCharCode(65 + i);
                return (
                  <motion.button
                    key={i}
                    onClick={() => pick(i)}
                    disabled={revealed}
                    whileHover={!revealed ? { x: 4 } : {}}
                    className="w-full text-left flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200"
                    style={{
                      background: isChosen
                        ? "rgba(255,255,255,0.06)"
                        : revealed
                          ? "rgba(255,255,255,0.01)"
                          : "rgba(255,255,255,0.025)",
                      border: isChosen
                        ? "1px solid rgba(255,255,255,0.2)"
                        : revealed
                          ? "1px solid rgba(255,255,255,0.04)"
                          : "1px solid rgba(255,255,255,0.07)",
                      boxShadow: isChosen ? "0 4px 20px rgba(0,0,0,0.3)" : "none",
                    }}
                  >
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold font-mono mt-0.5"
                      style={{
                        background: isChosen ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                        color: isChosen ? "#e2e8f0" : "rgba(71,85,105,0.7)",
                        border: isChosen ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      {letter}
                    </span>
                    <span
                      className="text-[13px] leading-relaxed"
                      style={{ color: revealed ? (isChosen ? "#cbd5e1" : "rgba(71,85,105,0.5)") : "rgba(148,163,184,0.8)" }}
                    >
                      {opt.text}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* RESULTS — 3D ROADMAP ─────────────────────────────── */}
        {view === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-3xl mx-auto px-4 py-8"
          >
            {/* Score header */}
            <div className="mb-10">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-3 mb-3"
              >
                {detectedCount === 0 ? (
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-xl"
                    style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}
                  >
                    <CheckCircle2 size={16} style={{ color: "#10b981" }} />
                    <span className="text-[13px] font-semibold" style={{ color: "#10b981" }}>No patterns detected</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[40px] font-black leading-none" style={{ color: "#f1f5f9" }}>
                        {detectedCount}
                      </span>
                      <span className="text-[15px] font-medium" style={{ color: "rgba(100,116,139,0.6)" }}>
                        of {ALL_IDS.length} patterns detected
                      </span>
                    </div>
                    <p className="text-[12px]" style={{ color: "rgba(100,116,139,0.45)" }}>
                      Tap any node to inspect triggers and fixes
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Summary badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {flagged.map(id => {
                  const ec = EC[id];
                  return (
                    <span
                      key={id}
                      className="text-[10px] font-semibold px-2 py-1 rounded-lg"
                      style={{ background: `rgba(${ec.rgb},0.1)`, border: `1px solid rgba(${ec.rgb},0.22)`, color: ec.color }}
                    >
                      {ERROR_META[id].label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* 3D Roadmap */}
            <div
              className="relative pl-2"
              style={{
                transform: "perspective(1200px) rotateX(1.5deg)",
                transformOrigin: "top center",
              }}
            >
              {ALL_IDS.map((id, i) => (
                <RoadmapNode
                  key={id}
                  id={id}
                  index={i}
                  detected={flagged.includes(id)}
                  isLast={i === ALL_IDS.length - 1}
                />
              ))}
            </div>

            {/* Bottom CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-10 flex items-center justify-center gap-3"
            >
              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(148,163,184,0.6)" }}
              >
                <RotateCcw size={12} /> Retake quiz
              </button>
              <button
                onClick={() => setView("library")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all"
                style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.22)", color: "#f59e0b" }}
              >
                <BookOpen size={12} /> Study all errors
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* LIBRARY ─────────────────────────────────────────── */}
        {view === "library" && (
          <motion.div
            key="library"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-3xl mx-auto px-4 py-8"
          >
            <div className="mb-6">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-1" style={{ color: "rgba(100,116,139,0.35)" }}>
                Error Library
              </p>
              <h2 className="text-[18px] font-bold" style={{ color: "#f1f5f9" }}>
                7 Cognitive Traps
              </h2>
              <p className="text-[12px] mt-1" style={{ color: "rgba(100,116,139,0.45)" }}>
                Every loss has a pattern. Knowing the pattern is the edge.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALL_IDS.map((id, i) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <LibraryCard id={id} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

