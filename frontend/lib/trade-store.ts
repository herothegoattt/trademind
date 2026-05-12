import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TradeUI {
  id: string;
  symbol: string;
  type: 'long' | 'short';
  entry: number;
  exit?: number;
  lots?: number;
  accountSize?: number;
  pnl?: number;
  pnlPercent?: number;
  duration: string;
  notes: string;
  images?: string[];
  createdAt: string;
}

interface TradeStore {
  trades: TradeUI[];
  addTrade: (trade: Omit<TradeUI, 'id' | 'createdAt'>) => TradeUI;
  updateTrade: (id: string, updates: Partial<Omit<TradeUI, 'id' | 'createdAt'>>) => void;
  deleteTrade: (id: string) => void;
}

interface SymbolSpec {
  contractSize: number;
  // 'USD' = quote currency is USD (P&L direct in USD)
  // 'other' = non-USD quote, approximate via exit price
  quoteCurrency: 'USD' | 'other';
}

const SYMBOL_SPECS: Record<string, SymbolSpec> = {
  // Majors — USD quote
  EURUSD:   { contractSize: 100_000, quoteCurrency: 'USD' },
  GBPUSD:   { contractSize: 100_000, quoteCurrency: 'USD' },
  AUDUSD:   { contractSize: 100_000, quoteCurrency: 'USD' },
  NZDUSD:   { contractSize: 100_000, quoteCurrency: 'USD' },
  // USD base — non-USD quote (divide by exit to get USD)
  USDJPY:   { contractSize: 100_000, quoteCurrency: 'other' },
  USDCHF:   { contractSize: 100_000, quoteCurrency: 'other' },
  USDCAD:   { contractSize: 100_000, quoteCurrency: 'other' },
  // Cross JPY
  EURJPY:   { contractSize: 100_000, quoteCurrency: 'other' },
  GBPJPY:   { contractSize: 100_000, quoteCurrency: 'other' },
  AUDJPY:   { contractSize: 100_000, quoteCurrency: 'other' },
  NZDJPY:   { contractSize: 100_000, quoteCurrency: 'other' },
  CHFJPY:   { contractSize: 100_000, quoteCurrency: 'other' },
  CADJPY:   { contractSize: 100_000, quoteCurrency: 'other' },
  // Cross non-USD
  EURGBP:   { contractSize: 100_000, quoteCurrency: 'other' },
  EURCHF:   { contractSize: 100_000, quoteCurrency: 'other' },
  EURCAD:   { contractSize: 100_000, quoteCurrency: 'other' },
  EURNZD:   { contractSize: 100_000, quoteCurrency: 'other' },
  GBPCHF:   { contractSize: 100_000, quoteCurrency: 'other' },
  GBPCAD:   { contractSize: 100_000, quoteCurrency: 'other' },
  GBPNZD:   { contractSize: 100_000, quoteCurrency: 'other' },
  GBPAUD:   { contractSize: 100_000, quoteCurrency: 'other' },
  AUDCAD:   { contractSize: 100_000, quoteCurrency: 'other' },
  AUDCHF:   { contractSize: 100_000, quoteCurrency: 'other' },
  AUDNZD:   { contractSize: 100_000, quoteCurrency: 'other' },
  NZDCHF:   { contractSize: 100_000, quoteCurrency: 'other' },
  NZDCAD:   { contractSize: 100_000, quoteCurrency: 'other' },
  CADCHF:   { contractSize: 100_000, quoteCurrency: 'other' },
  // Metals
  XAUUSD:   { contractSize: 100,     quoteCurrency: 'USD' },
  XAGUSD:   { contractSize: 5_000,   quoteCurrency: 'USD' },
  XPTUSD:   { contractSize: 100,     quoteCurrency: 'USD' },
  // Oil
  USOIL:    { contractSize: 1_000,   quoteCurrency: 'USD' },
  BRENTOIL: { contractSize: 1_000,   quoteCurrency: 'USD' },
  XBRUSD:   { contractSize: 1_000,   quoteCurrency: 'USD' },
  UKOIL:    { contractSize: 1_000,   quoteCurrency: 'USD' },
  WTIUSD:   { contractSize: 1_000,   quoteCurrency: 'USD' },
  // US Indices (1 contract = $1/point)
  US30:     { contractSize: 1,       quoteCurrency: 'USD' },
  NAS100:   { contractSize: 1,       quoteCurrency: 'USD' },
  SPX500:   { contractSize: 1,       quoteCurrency: 'USD' },
  SP500:    { contractSize: 1,       quoteCurrency: 'USD' },
  US500:    { contractSize: 1,       quoteCurrency: 'USD' },
  // EU Indices
  DE40:     { contractSize: 1,       quoteCurrency: 'other' },
  UK100:    { contractSize: 1,       quoteCurrency: 'other' },
  JP225:    { contractSize: 1,       quoteCurrency: 'other' },
  FR40:     { contractSize: 1,       quoteCurrency: 'other' },
};

export function getSymbolSpec(symbol: string): SymbolSpec {
  const key = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return SYMBOL_SPECS[key] ?? { contractSize: 100_000, quoteCurrency: 'USD' };
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

/**
 * Calculates P&L using proper forex/CFD lot-based arithmetic.
 *
 * For USD-quoted instruments (EURUSD, XAUUSD, etc.):
 *   P&L = priceDiff * contractSize * lots
 *
 * For non-USD-quoted instruments (USDJPY, EURJPY, etc.):
 *   P&L ≈ priceDiff * contractSize * lots / exitPrice
 *   (approximation — avoids needing a live USD cross rate)
 *
 * Falls back to percentage-based estimate if no lot size is provided.
 */
export function calculatePnL(
  entry: number,
  exit: number,
  type: 'long' | 'short',
  symbol: string,
  lots?: number,
  accountSize?: number
): { pnl: number; pnlPercent: number } | null {
  if (!exit || entry === 0) return null;

  const direction = type === 'long' ? 1 : -1;
  const priceDiff = (exit - entry) * direction;
  let pnl: number;

  if (lots && lots > 0) {
    const spec = getSymbolSpec(symbol);
    pnl = priceDiff * spec.contractSize * lots;
    if (spec.quoteCurrency !== 'USD') {
      pnl = pnl / exit;
    }
  } else if (accountSize && accountSize > 0) {
    pnl = (priceDiff / entry) * accountSize;
  } else {
    pnl = priceDiff;
  }

  const pnlPercent =
    accountSize && accountSize > 0
      ? (pnl / accountSize) * 100
      : (priceDiff / entry) * 100;

  return {
    pnl: Number(pnl.toFixed(2)),
    pnlPercent: Number(pnlPercent.toFixed(2)),
  };
}
