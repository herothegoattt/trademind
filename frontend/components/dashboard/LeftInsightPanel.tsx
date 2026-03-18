"use client";
import { useEffect, useState } from "react";
import { useDashboardStore } from "../../lib/store";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";
import { MarketsView } from "./MarketsView";
import { Button } from "../ui/button";
import TraderDNA from "./TraderDNA";

interface ErrorInsight {
  signals: string[];
  rules: string[];
  zones: string[];
}

const errorDetails: Record<string, ErrorInsight> = {
  FOMO: {
    signals: [
      "Price jumped 15%+ while you slept",
      "Friends posting wins in chat",
      "Missed the move start by 10 minutes",
      "Comparing yourself to others' P&L",
    ],
    rules: [
      "Set alerts before sleep, check once after wake",
      "Don't enter trades to 'catch up' on missed moves",
      "Screenshot your plan BEFORE entry",
      "Ask: Would I enter this at -50%?",
    ],
    zones: [
      "🔴 HOT ZONE: Minutes 1-5 after breakout (FOMO peak)",
      "🟡 MEDIUM: Hours 1-4 of the move (still manageable)",
      "🟢 COOL: After confirmation candles close (safer entry)",
    ],
  },
  Overconfidence: {
    signals: [
      "Skipping stop loss placement",
      "Averaging down on losing trades",
      "Trading without your written plan",
      "Larger position after 3 wins in a row",
    ],
    rules: [
      "Position size: Risk fixed % per trade (2-3% max)",
      "Never add to losers outside your original plan",
      "Review your written setup BEFORE clicking buy",
      "Take profit at first target, don't wait for perfect",
    ],
    zones: [
      "🔴 HOT ZONE: 30 mins after 3rd consecutive win",
      "🟡 MEDIUM: Trading with 150%+ account conviction",
      "🟢 COOL: Back to base position size methodology",
    ],
  },
  "Decision Under Fatigue": {
    signals: [
      "Trading after <6 hours sleep",
      "Trading after 8+ hours of already trading",
      "Making decisions after emotional events",
      "Hand shaking, eye strain, slow reaction time",
    ],
    rules: [
      "7+ hours sleep BEFORE trading days (no exceptions)",
      "Max 3 hours trading per day, then 1 hour break",
      "No trading within 2 hours of major life events",
      "If you hesitate on entry = Rest, don't force it",
    ],
    zones: [
      "🔴 HOT ZONE: Trades 7+ hours after waking",
      "🟡 MEDIUM: After 2 hours of continuous trading",
      "🟢 COOL: Fresh morning, <3 hours being live",
    ],
  },
  "Revenge Decision": {
    signals: [
      "Trading immediately after a loss",
      "Larger position after losing",
      "Using different strategy after loss",
      "Angry/cursing after closed losing trade",
    ],
    rules: [
      "30 min cooling off AFTER every loss (mandatory)",
      "Distance yourself from charts for 15 minutes",
      "Review the loss in writing before next trade",
      "Position size CANNOT increase after losses",
    ],
    zones: [
      "🔴 HOT ZONE: 0-5 minutes after loss closing",
      "🟡 MEDIUM: 5-30 minutes after loss",
      "🟢 COOL: 30+ minutes, written review completed",
    ],
  },
  "Confirmation Bias": {
    signals: [
      "Ignoring price action that contradicts your view",
      "Only watching bullish news when long",
      "Cherry-picking indicators that say BUY",
      "Dismissing stop loss signals",
    ],
    rules: [
      "Write down 3 reasons to EXIT before entering",
      "Watch both bullish AND bearish timeframes",
      "Use opposing indicator (RSI low when volume low)",
      "Exit at stop loss WITHOUT rethinking it",
    ],
    zones: [
      "🔴 HOT ZONE: 2-3 hours after entry (conviction peak)",
      "🟡 MEDIUM: Price moving against you 5-7%",
      "🟢 COOL: Following mechanical stop loss rules",
    ],
  },
  "Risk Miscalculation": {
    signals: [
      "Account down 25%+ from recent high",
      "Position size not properly scaled",
      "No stop loss on position",
      "Leverage used without clear rules",
    ],
    rules: [
      "Risk calculation: (Position Size) × (SL %)  = Fixed $$",
      "Never trade without stop loss 'just this once'",
      "Max DD: 2% per trade, 6% per week, 15% per month",
      "Leverage only if your base returns are +200%+ YoY",
    ],
    zones: [
      "🔴 HOT ZONE: Account down 2%+ in one trade",
      "🟡 MEDIUM: Weekly drawdown hitting 5%+",
      "🟢 COOL: Every trade sized with mathematical formula",
    ],
  },
  "Ignoring Invalid Signals": {
    signals: [
      "Looking at 1m chart when setup is on 4h",
      "Trading news events without volatility management",
      "Following signals from non-tested strategies",
      "Entering before confirmed candle close",
    ],
    rules: [
      "Confirm on YOUR timeframe (ignore faster timeframes)",
      "News trades = smaller size, strict stops",
      "Use only backtested strategies (min 50 trades)",
      "Wait for candle close on your setup timeframe",
    ],
    zones: [
      "🔴 HOT ZONE: Entering on unconfirmed signals",
      "🟡 MEDIUM: News volatility (news +/- 2 hours)",
      "🟢 COOL: After candle close, on tested timeframe",
    ],
  },
};

export function LeftInsightPanel() {
  const selectedErrorType = useDashboardStore((s: any) => s.selectedErrorType);
  const selectedSection = useDashboardStore((s: any) => s.selectedSection);
  const selectErrorType = useDashboardStore((s: any) => s.selectErrorType);
  const selectSection = useDashboardStore((s: any) => s.selectSection);
  const insertPrompt = useDashboardStore((s: any) => s.insertPrompt);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [newsSourceFilter, setNewsSourceFilter] = useState<"all" | "forexfactory">("all");

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const errorInfo = selectedErrorType ? errorDetails[selectedErrorType as keyof typeof errorDetails] : null;
  const isErrorOpen = selectedErrorType !== null;
  const isNewsOpen = selectedSection === "News";

  useEffect(() => {
    if (isNewsOpen) {
      import("../../lib/api").then(({ getNews }) => {
        getNews(10).then(setNewsItems);
      });
    } else {
      setNewsItems([]);
    }
  }, [isNewsOpen]);

  if (!mounted) return null;

  // if nothing to show at all, hide panel
  if (!isErrorOpen && !isNewsOpen && !selectedSection) return null;

  let content: React.ReactNode;

  if (isErrorOpen && errorInfo) {
    // existing error details layout
    content = (
      <div className="space-y-6 px-6 py-8 overflow-y-auto h-full">
        {/* Error Type Title */}
        <div className="space-y-3 text-center sticky top-0 bg-black/80 backdrop-blur py-4 -mx-6 px-6 border-b border-purple-500/20">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {selectedErrorType}
          </h2>
          <div className="h-1.5 w-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto" />
          <p className="text-sm text-gray-300">Understanding this recurring pattern</p>
        </div>

        {/* Recognition Signals */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-purple-300 uppercase tracking-wider text-center py-2 border-b-2 border-purple-500/30">Recognition Signals</h3>
          <div className="space-y-2 max-w-3xl mx-auto">
            {errorInfo.signals.map((signal, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-all hover:scale-105 transform duration-200">
                <span className="text-purple-400 font-bold flex-shrink-0 text-lg">•</span>
                <span className="text-sm text-white leading-relaxed">{signal}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-emerald-300 uppercase tracking-wider text-center py-2 border-b-2 border-emerald-500/30">Corrective Rules</h3>
          <div className="space-y-2 max-w-3xl mx-auto">
            {errorInfo.rules.map((rule, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all hover:scale-105 transform duration-200">
                <span className="text-emerald-400 font-bold flex-shrink-0 text-lg">✓</span>
                <span className="text-sm text-white leading-relaxed">{rule}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Zones */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-yellow-300 uppercase tracking-wider text-center py-2 border-b-2 border-yellow-500/30">Risk Zones</h3>
          <div className="space-y-2 max-w-3xl mx-auto">
            {errorInfo.zones.map((zone, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 transition-all hover:scale-105 transform duration-200">
                <span className="text-sm text-white leading-relaxed">{zone}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  } else if (isNewsOpen) {
    const displayed = newsSourceFilter === "all" ? newsItems : newsItems.filter(n => (n.source || "").toLowerCase().includes("forexfactory"));

    content = (
      <div className="space-y-4 px-6 py-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-red-400 bg-clip-text text-transparent text-center">
          Market News & Events
        </h2>
        <p className="text-sm text-gray-400 text-center mb-6">
          Real-time economic news that impacts trading decisions
        </p>
        <div className="flex justify-center gap-2 mb-4">
          <button onClick={() => setNewsSourceFilter("all")} className={cn("px-3 py-1 rounded-lg text-sm font-semibold", newsSourceFilter === "all" ? "bg-yellow-500/25 text-yellow-200 border border-yellow-500/40" : "bg-gray-800 text-gray-300 border border-gray-700")}>All</button>
          <button onClick={() => setNewsSourceFilter("forexfactory")} className={cn("px-3 py-1 rounded-lg text-sm font-semibold", newsSourceFilter === "forexfactory" ? "bg-yellow-500/40 text-yellow-100 border border-yellow-400" : "bg-gray-800 text-gray-300 border border-gray-700")}>ForexFactory</button>
        </div>
        <div className="space-y-3 max-w-2xl mx-auto">
          {displayed && displayed.length > 0 ? (
            displayed.map((n, i) => (
              <div key={i} className="border-l-4 border-yellow-500 bg-yellow-500/5 p-4 rounded-lg hover:bg-yellow-500/10 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{n.title}</h3>
                    {n.summary && <p className="text-sm text-gray-300 mb-2">{n.summary}</p>}
                    <div className="flex gap-2 items-center">
                      {n.impact && <span className={`text-xs px-2 py-1 rounded font-bold ${
                        (typeof n.impact === 'string' ? (n.impact.toLowerCase() === 'high' ? 'bg-red-500/20 text-red-300' : n.impact.toLowerCase() === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300') : 'bg-green-500/20 text-green-300')
                      }`}>{(typeof n.impact === 'string' ? n.impact : String(n.impact))} Impact</span>}
                      {n.date && <span className="text-xs text-gray-400">{n.date}</span>}
                    </div>
                  </div>
                  {n.source && <div className="text-xs text-gray-400 ml-4">{n.source}</div>}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              Loading real-time market news...
            </div>
          )}
        </div>
      </div>
    );
  } else if (selectedSection === "Markets") {
    content = <MarketsView />;
  } else if (selectedSection === "Trader DNA") {
    content = (
      <div className="px-6 py-6">
        <h2 className="text-3xl font-bold text-center">Trader DNA</h2>
        <p className="text-sm text-gray-400 text-center mb-4">Overview of your trading strengths, risk profile and recurring mistakes.</p>
        <TraderDNA />
      </div>
    );
  } else if (selectedSection === "Community Edge") {
    // Keep legacy 'Analysis' quick access items but label is Community Edge
    const items = [
      { id: 'spx', label: 'SPX500' },
      { id: 'oil', label: 'OIL' },
      { id: 'bonds', label: 'Bonds' },
      { id: 'shares', label: 'Shares / Stocks' },
      { id: 'akc', label: 'Акции компаний' },
      { id: 'retired', label: 'Retired Funds' },
    ];

    content = (
      <div className="space-y-4 px-6 py-6">
        <h2 className="text-2xl font-bold text-center">Community Edge — Market Focus</h2>
        <p className="text-sm text-gray-400 text-center">Quick access market buckets for community analysis and proposals.</p>
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mt-4 max-h-64 overflow-y-auto">
          {items.map(item => (
            <Button
              key={item.id}
              variant="outline"
              onClick={() => insertPrompt(`Discuss community ideas and long-term outlook for ${item.label}. Include common community approaches and risk notes.`)}
              className="text-sm"
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>
    );
  } else if (selectedSection === "Setups") {
    const setups = [
      // BEGINNERS - SHORT TERM
      {
        id: "beginner-st-market-structure",
        title: "🟢 Beginners: Market Structure Trend (Short Term - 1H/4H)",
        steps: [
          "Identify if price is making Higher Highs & Higher Lows (UPTREND) or Lower Highs & Lower Lows (DOWNTREND)",
          "On 1H/4H chart, draw a trendline connecting last 2 swing lows (for uptrend) or highs (for downtrend)",
          "Wait for price to pullback to this trendline",
          "When price touches trendline + shows 2-3 bullish/bearish candles, enter",
          "Stop loss: 10-15 pips below the trendline",
          "Target: Risk 1:2 (if risking 20 pips, target 40 pips)",
        ],
        compliance: [
          "Use only EURUSD, GBPUSD (liquid pairs)",
          "Trade only London/NY overlap (8 AM - 5 PM EST)",
          "Risk max 1% per trade",
          "Close trade manually - don't rely on targets",
          "Journal entry: what price action you saw"
        ]
      },
      // BEGINNERS - LONG TERM
      {
        id: "beginner-lt-4h-support",
        title: "🟡 Beginners: Support/Resistance Bounce (Long Term - 4H/Daily)",
        steps: [
          "On Daily chart, mark previous swing lows as SUPPORT (red line)",
          "Mark previous swing highs as RESISTANCE (green line)",
          "When price drops to support, wait for it to bounce",
          "Enter on 4H chart when price bounces from support + closes above it",
          "Stop loss: 20 pips below support",
          "Hold trade for 2-4 days, target: next resistance level",
        ],
        compliance: [
          "Wait 24-48 hours before entering (patience = edge)",
          "Check daily/weekly trend direction first",
          "Risk: 1% max per trade",
          "Don't add to winning positions",
          "Exits: take profit at resistance or 2% account gains"
        ]
      },
      // AMATEURS - SHORT TERM
      {
        id: "amateur-st-smart-money",
        title: "🔵 Amateurs: Smart Money Liquidity Sweep (Short Term - 15m/1H)",
        steps: [
          "Identify recent swing high (resistance above price) - this is LIQUIDITY ZONE",
          "On 1H chart, watch for breakout ABOVE the swing high with volume",
          "After breakout, price will often return DOWN to 'sweep' traders",
          "Enter SHORT when price comes back down to the broken level (smart money shakes out longs)",
          "Stop loss: 10 pips above the swing high",
          "Target: 30-50 pips down to the previous support",
        ],
        compliance: [
          "Confirm with volume profile or tick volume increase",
          "Use 1-minute chart to time exact entry",
          "Risk: 1-2% per trade",
          "Exit early if structure breaks",
          "Don't chase - wait for proper setup"
        ]
      },
      // AMATEURS - LONG TERM
      {
        id: "amateur-lt-order-block",
        title: "🟣 Amateurs: Order Block Reversal (Long Term - 4H/Daily)",
        steps: [
          "Identify recent STRONG downtrend on Daily (at least 100+ pips)",
          "Find the candle that STARTED the downtrend (this is the ORDER BLOCK)",
          "Mark high and low of that candle as a zone",
          "When price falls back to this zone after pullup, it's a reversal point",
          "Enter LONG at order block zone when 2-3 bullish candles form",
          "Stop loss: 20 pips below order block",
          "Target: 100-150 pips up to previous resistance"
        ],
        compliance: [
          "Order blocks work better in strong trending markets",
          "Confirm RSI is oversold (<30) at entry",
          "Hold 3-7 days minimum",
          "Risk: 1-2% per trade",
          "Key: patience and structure"
        ]
      },
      // PROFESSIONALS - SHORT TERM
      {
        id: "pro-st-fvg-mitigacion",
        title: "💎 Professionals: Fair Value Gap + Mitigated Block (Short Term - 15m/1H)",
        steps: [
          "Identify 3-candle Fair Value Gap (FVG): candle 1 & 3 form gap, candle 2 is inside",
          "On 1H chart, when FVG forms, smart money will come back to FILL it (mitigation)",
          "As price approaches FVG, identify the ORDER BLOCK that caused the move",
          "Enter SHORT at the ORDER BLOCK when price mitigates the FVG with wick rejection",
          "Stop loss: 5 pips above order block high",
          "Targets: Fibonacci levels (61.8%, 78.6%) of previous structure"
        ],
        compliance: [
          "Use Advanced Smart Money concepts (FVG + block confluence)",
          "Confirm with Volume Profile imbalance",
          "Risk: 2-3% per trade (higher win rate justifies it)",
          "Trade only major pairs with 2+ pip spreads",
          "Keep trade journal with exact levels and logic"
        ]
      },
      // PROFESSIONALS - LONG TERM
      {
        id: "pro-lt-breaker-block",
        title: "💎 Professionals: Breaker Block + Macro Structure (Long Term - Daily/Weekly)",
        steps: [
          "On Weekly chart, identify multi-week downtrend structure",
          "Find the BREAKER BLOCK: the candle that closed BELOW the previous lower low",
          "This block becomes support for future bounces",
          "On Daily chart, when price returns to breaker block after pullup, it's a buy zone",
          "Enter LONG when price creates higher lows around breaker block (3+ rejections)",
          "Stop loss: 5-10 pips below breaker block (use tight stops due to macro levels)",
          "Target: Fibonacci extensions (127%, 161.8%) from major swings"
        ],
        compliance: [
          "Breaker blocks have highest win rates in smart money trading",
          "Combine with macro analysis: Fed policy, economic cycles",
          "Hold 1-4 weeks for institutional moves",
          "Risk: 1-2% per trade (but high-probability setup)",
          "Track major news events and macro timings"
        ]
      },
      // PROFESSIONALS - MULTI-TIMEFRAME
      {
        id: "pro-multi-confluence",
        title: "💎 Professionals: Multi-Timeframe Confluence (All Timeframes)",
        steps: [
          "Weekly: Identify major trend and key levels (macro structure)",
          "Daily: Find order blocks and breaker levels",
          "4H: Confirm FVG and liquidity zones align with daily levels",
          "1H/15m: Execute only when price is at CONFLUENCE of 2+ timeframes",
          "Example: Daily order block + Weekly support + 4H FVG at same price = STRONG entry",
          "Risk: Minimal stop loss (3-5 pips) due to confluence validation",
          "Reward: 100-200+ pips (macro level moves)"
        ],
        compliance: [
          "This is the most advanced and profitable setup",
          "Requires experience reading all 4+ timeframes simultaneously",
          "Risk: 2-3% per trade (institutional-grade setup)",
          "High win rate (65%+) justifies larger risk",
          "Use only for major pairs with tight spreads"
        ]
      }
    ];

    content = (
      <div className="space-y-6 px-6 py-4 h-full overflow-y-auto">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent text-center">Setups & Frameworks</h2>
        <p className="text-sm text-gray-400 text-center mb-4">Your decision frameworks and compliance checklists</p>
        <div className="space-y-4">
          {setups.map((s) => (
            <div key={s.id} className="p-4 rounded-lg border border-gray-700/30 bg-gray-900/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">{s.title}</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Steps</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                    {s.steps.map((st: string, i: number) => <li key={i}>{st}</li>)}
                  </ol>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Compliance</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    {s.compliance.map((c: string, i: number) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } else {
    // generic section context
    content = (
      <div className="space-y-4 px-6 py-4 text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          {selectedSection || 'Info'}
        </h2>
        <p className="text-sm text-gray-300 max-w-2xl mx-auto">
          {selectedSection
            ? `You're viewing the ${selectedSection} section. Relevant info will appear here.`
            : ''}
        </p>
      </div>
    );
  }

  if (isMobile) {
    // Mobile drawer overlay
    const closeHandler = () => {
      if (isErrorOpen) selectErrorType(null);
      if (isNewsOpen) selectSection("");
    };

    return (isErrorOpen || isNewsOpen || selectedSection === "News") ? (
      <div className="fixed inset-0 z-30 lg:hidden">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={closeHandler}
        />
        
        {/* Drawer */}
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/95 backdrop-blur-sm overflow-y-auto pt-14 pb-6">
          <div className="px-6">
            {content}
          </div>
          <div className="px-6 py-4 border-t border-gray-700 flex justify-end mt-6">
            <button
              onClick={closeHandler}
              className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    ) : null;
  }

  // Desktop panel
  if (!(isErrorOpen || isNewsOpen || selectedSection === "News")) {
    return null;
  }

  return (
    <div className="hidden lg:flex flex-col h-full flex-1 bg-gradient-to-br from-purple-950/40 via-black/50 to-purple-950/40 backdrop-blur-xl border-r border-purple-500/30 overflow-y-auto shadow-2xl shadow-purple-500/10">
      <div className="flex-1 flex flex-col items-center justify-start w-full py-8">
        <div className="w-full max-w-3xl">
          {content}
        </div>
      </div>
    </div>
  );
}
