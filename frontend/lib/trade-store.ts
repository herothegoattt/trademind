import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TradeUI {
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
}

interface TradeStore {
  trades: TradeUI[];
  addTrade: (trade: Omit<TradeUI, 'id' | 'createdAt'>) => TradeUI;
  updateTrade: (id: string, updates: Partial<Omit<TradeUI, 'id' | 'createdAt'>>) => void;
  deleteTrade: (id: string) => void;
}

export const useTradeStore = create<TradeStore>()(
  persist(
    (set, get) => ({
      trades: [],

      addTrade: (trade) => {
        const newTrade: TradeUI = {
          ...trade,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        set({ trades: [newTrade, ...get().trades] });
        return newTrade;
      },

      updateTrade: (id, updates) => {
        set({
          trades: get().trades.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        });
      },

      deleteTrade: (id) => {
        set({ trades: get().trades.filter((t) => t.id !== id) });
      },
    }),
    { name: 'trademind-trades' }
  )
);

export function calculatePnL(
  entry: number,
  exit: number,
  type: 'long' | 'short',
  accountSize?: number
): { pnl: number; pnlPercent: number } | null {
  if (!exit || entry === 0) return null;
  const diff = exit - entry;
  const direction = type === 'long' ? 1 : -1;
  let pnl: number;
  if (accountSize) {
    pnl = (diff / entry) * accountSize * direction;
  } else {
    pnl = diff * direction;
  }
  const pnlPercent = accountSize
    ? (pnl / accountSize) * 100
    : (diff / entry) * 100 * direction;
  return { pnl: Number(pnl.toFixed(2)), pnlPercent: Number(pnlPercent.toFixed(2)) };
}
