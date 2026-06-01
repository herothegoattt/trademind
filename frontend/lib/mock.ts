// lib/mock.ts
import {
  TopError,
  DailyBias,
  Section,
  ErrorType,
  ErrorDetails,
  ChatMessage,
} from "./types";

export const topErrors: TopError[] = [
  { name: "Revenge Decision", pct: 24 },
  { name: "FOMO", pct: 18 },
  { name: "Overconfidence", pct: 12 },
];

export const dailyBias: DailyBias = {
  tone: "Neutral",
  confidence: 0.63,
  summary: "Mixed market signals with slight bullish tilt",
};

export const suggestedQuestionsBySection: Record<Section, string[]> = {
  "Journal": [
    "What did I learn from yesterday?",
    "How did I manage risk this week?",
  ],
  "Setups": [
    "Which framework worked best last month?",
    "How can I adapt my entry rules?",
  ],
  "Community Edge": [
    "Are there correlations I'm missing?",
    "What indicators are underperforming?",
  ],
  "Markets": [
    "Which sectors are overheating?",
    "Where is liquidity drying up?",
  ],
  "News": [
    "What recent headlines could move my positions?",
    "How is sentiment shifting?",
  ],
  "Daily Bias": [
    "Should I lean long or short today?",
    "What macro themes are strongest?",
  ],
  "Trader DNA": [
    "What are my best trading pairs?",
    "What are my recurring mistakes and risk profile?",
  ],
  "Investing": [
    "What should I focus on for long-term portfolio growth?",
    "How can I balance risk across different asset classes?",
  ],
  "Analytics Lab": [
    "What are my strongest statistical edges?",
    "Which setups have the highest expectancy?",
  ],
  "Backtesting": [
    "What can I learn from replaying this setup?",
    "How would my rules have performed historically?",
  ],
};

export const warningZonesBySection: Record<Section, string[]> = {
  "Journal": [
    "Avoid revenge trading after losses",
    "Watch for overtrading",
  ],
  "Setups": [
    "Do not force weak setups",
    "Keep stop distances realistic",
  ],
  "Community Edge": [
    "Avoid confirmation bias in indicators",
    "Check data sources for reliability",
  ],
  "Markets": [
    "Beware of low-volume spikes",
    "Watch for geopolitical events",
  ],
  "News": [
    "Fake headlines can mislead",
    "Don't react to unconfirmed reports",
  ],
  "Daily Bias": [
    "Bias can lag price action",
    "Don't overcommit to one view",
  ],
  "Trader DNA": [
    "Your profile is unique - respect your limits",
    "Don't try to copy others' styles blindly",
  ],
  "Investing": [
    "Stay diversified across sectors and asset classes",
    "Review your allocation at least quarterly",
  ],
  "Analytics Lab": [
    "Don't over-optimize on past data",
    "Watch for survivorship bias in backtests",
  ],
  "Backtesting": [
    "Replay objectively — don't retrofit the story",
    "Mark entries before seeing the outcome",
  ],
};

export const errorDetails: Record<ErrorType, ErrorDetails> = {
  "FOMO": {
    description: "Fear of missing out leads to impulsive entries.",
    recognitionSignals: [
      "Entering after a big move",
      "Ignoring your own plan",
      "Overtrading when market moves without you",
    ],
    correctiveRule: "Set strict entry criteria and wait; if unsure, stay out.",
  },
  "Overconfidence": {
    description: "Overestimating your edge after wins.",
    recognitionSignals: [
      "Increasing size after a streak",
      "Ignoring market warnings",
      "Chasing unrealistic returns",
    ],
    correctiveRule: "Revert to base position sizing and review at end of day.",
  },
  "Decision Under Fatigue": {
    description: "Tiredness causing poor judgment.",
    recognitionSignals: [
      "Making decisions late at night",
      "Skipping analysis steps",
      "Regretting impulsive trades",
    ],
    correctiveRule: "Take breaks; stop trading after prolonged sessions.",
  },
  "Revenge Decision": {
    description: "Trying to win back losses quickly.",
    recognitionSignals: [
      "Doubling down after a loss",
      "Rushing into trades",
      "Ignoring risk limits",
    ],
    correctiveRule: "Pause 24h after a loss and review emotion.",
  },
  "Confirmation Bias": {
    description: "Seeing only data that supports your view.",
    recognitionSignals: [
      "Ignoring contradicting indicators",
      "Selective news reading",
      "Cherry-picking timeframes",
    ],
    correctiveRule: "Actively seek disconfirming evidence before deciding.",
  },
  "Risk Miscalculation": {
    description: "Misjudging position size or stop.",
    recognitionSignals: [
      "Targets too tight/loose",
      "Ignoring volatility",
      "Overleveraging",
    ],
    correctiveRule: "Use fixed risk % per trade and always calculate before entry.",
  },
  "Ignoring Invalid Signals": {
    description: "Acting on noise or false breakouts.",
    recognitionSignals: [
      "Filling gaps without confirmation",
      "Jumping on spikes",
      "Neglecting higher timeframes",
    ],
    correctiveRule: "Require confirmation from multiple sources before entry.",
  },
};

export const initialChatMessages: ChatMessage[] = [
  {
    id: "1",
    role: "user",
    text: "I took a trade after a loss and increased size.",
    ts: Date.now() - 100000,
  },
  {
    id: "2",
    role: "assistant",
    text: "Detected pattern: Revenge Decision (87%). Rule: pause 24h.",
    ts: Date.now() - 90000,
  },
];

// Mock trade history used for Trader DNA analysis
export const mockTradeHistory = [
  { id: 't1', pair: 'EURUSD', pnl: 120, win: true, riskPercent: 1.2, accountSize: 10000, entryAt: Date.now() - 1000 * 60 * 60 * 24 * 10, exitAt: Date.now() - 1000 * 60 * 60 * 24 * 9 },
  { id: 't2', pair: 'AAPL', pnl: -80, win: false, riskPercent: 2.5, entryAt: Date.now() - 1000 * 60 * 60 * 24 * 9, exitAt: Date.now() - 1000 * 60 * 60 * 24 * 9 + 1000 * 60 * 30 },
  { id: 't3', pair: 'EURUSD', pnl: 40, win: true, riskPercent: 1.0, entryAt: Date.now() - 1000 * 60 * 60 * 24 * 8, exitAt: Date.now() - 1000 * 60 * 60 * 24 * 7 },
  { id: 't4', pair: 'BTC', pnl: 300, win: true, riskPercent: 3.5, entryAt: Date.now() - 1000 * 60 * 60 * 24 * 7, exitAt: Date.now() - 1000 * 60 * 60 * 24 * 6 },
  { id: 't5', pair: 'EURUSD', pnl: -50, win: false, riskPercent: 2.0, accountSize: 8000, entryAt: Date.now() - 1000 * 60 * 60 * 24 * 6, exitAt: Date.now() - 1000 * 60 * 60 * 24 * 6 + 1000 * 60 * 10 },
  { id: 't6', pair: 'AAPL', pnl: 60, win: true, riskPercent: 1.5, entryAt: Date.now() - 1000 * 60 * 60 * 24 * 5, exitAt: Date.now() - 1000 * 60 * 60 * 24 * 5 + 1000 * 60 * 120 },
  { id: 't7', pair: 'BTC', pnl: -150, win: false, riskPercent: 4.0, entryAt: Date.now() - 1000 * 60 * 60 * 24 * 4, exitAt: Date.now() - 1000 * 60 * 60 * 24 * 4 + 1000 * 60 * 20 },
  { id: 't8', pair: 'EURUSD', pnl: 80, win: true, riskPercent: 1.1, entryAt: Date.now() - 1000 * 60 * 60 * 24 * 3, exitAt: Date.now() - 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 60 },
  { id: 't9', pair: 'AAPL', pnl: -30, win: false, riskPercent: 2.2, entryAt: Date.now() - 1000 * 60 * 60 * 24 * 2, exitAt: Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 5 },
  { id: 't10', pair: 'BTC', pnl: 220, win: true, riskPercent: 3.0, entryAt: Date.now() - 1000 * 60 * 60 * 24 * 1, exitAt: Date.now() - 1000 * 60 * 60 * 24 * 1 + 1000 * 60 * 60 * 6 },
];

export const communityProposals = [
  {
    id: 'p1',
    title: 'EURUSD pullback long idea',
    author: 'trader_ivan',
    summary: 'Buying dip to 1.0850 with tight stop below 1.0820, target 1.0950. Trend on daily is up.',
    votes: 12,
    comments: [
      { author: 'anna_trades', text: 'Love the risk management here, stop looks good.' },
      { author: 'mark42', text: 'Watch liquidity at 1.09, may be resistance.' },
    ],
    approach: 'Momentum + structure',
    created_at: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: 'p2',
    title: 'AAPL swing short after earnings pop',
    author: 'quant_maria',
    summary: 'Expect reversion after spike, short to 150 area with 2% account risk.',
    votes: 8,
    comments: [
      { author: 'trader_ivan', text: 'Be careful with after-hours liquidity.' },
    ],
    approach: 'Mean reversion, size control',
    created_at: Date.now() - 1000 * 60 * 60 * 24 * 1,
  },
];
