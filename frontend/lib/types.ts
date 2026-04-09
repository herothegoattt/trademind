// lib/types.ts

export type Section =
  | "Journal"
  | "Setups"
  | "Community Edge"
  | "Markets"
  | "News"
  | "Daily Bias"
  | "Trader DNA"
  | "Investing"
  | "Analytics Lab";

export type ErrorType =
  | "FOMO"
  | "Overconfidence"
  | "Decision Under Fatigue"
  | "Revenge Decision"
  | "Confirmation Bias"
  | "Risk Miscalculation"
  | "Ignoring Invalid Signals";

export interface TopError {
  name: ErrorType;
  pct: number;
}

export interface DailyBias {
  tone: "Bullish" | "Neutral" | "Bearish";
  confidence: number; // 0-1
  summary: string;
}

export interface ErrorDetails {
  description: string;
  recognitionSignals: string[];
  correctiveRule: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  ts: number;
}

// placeholders for future backend types
export interface DecisionObject {
  // details of a decision
}

export interface InsightOutput {
  // whatever insights the backend returns
}

// journal trade record used in internal pages
export interface JournalTrade {
  id: string;
  symbol: string;
  type: 'long' | 'short';
  entry: number;
  exit?: number;
  accountSize?: number;
  pnl?: number;
  pnlPercent?: number;
  duration: string;
  notes: string;
  createdAt: string;
  exitAt?: string;
}
