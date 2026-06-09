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
  pointValue?: number;   // manual USD/point/lot override (crosses & non-standard instruments)
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

/* ───────────────────────────────────────────────────────────────────────────
   Instrument specification — what "1 lot" means per asset class.

   The P&L of a trade depends entirely on the instrument:
     • Forex     1 lot  = 100,000 units of the base currency
     • Metals    1 lot  = 100 oz (gold) / 5,000 oz (silver)
     • Energy    1 lot  = 1,000 barrels
     • Indices   1 lot  = 1 contract worth $1 per index point
     • Crypto    "lot"  = number of coins (1 unit = 1 coin)
     • Stocks    "lot"  = number of shares (1 unit = 1 share)

   Encoding this here is what lets the same Lot field produce a correct P&L
   regardless of whether you traded EURUSD, XAUUSD, BTCUSD or AAPL.
   ─────────────────────────────────────────────────────────────────────────── */
export type InstrumentClass = 'forex' | 'metal' | 'index' | 'energy' | 'crypto' | 'stock';

export interface SymbolSpec {
  instrument: InstrumentClass;
  contractSize: number;            // units represented by one 1.00 lot
  quoteCurrency: 'USD' | 'other';  // 'other' → P&L is in a non-USD currency, needs conversion
  quote: string;                   // 3-letter quote currency code (forex only), else ''
  usdBase: boolean;                // forex pair where USD is the base (USDxxx) → /exit is exact
  lotLabel: string;                // UI noun for the size field
  lotStep: number;                 // sensible input increment
  lotPlaceholder: string;          // example value for the input
}

// Currencies that form a forex pair (used to auto-detect any FX pair, not just majors)
const FIAT = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD',
  'SEK', 'NOK', 'DKK', 'SGD', 'HKD', 'MXN', 'ZAR', 'TRY',
  'PLN', 'CNH', 'CZK', 'HUF',
]);

// Stable / fiat quotes used by crypto pairs
const CRYPTO_QUOTES = ['USDT', 'USDC', 'BUSD', 'DAI', 'USD', 'PERP'];

// Common crypto bases — only needed to distinguish crypto from stocks (math is identical)
const CRYPTO_BASES = new Set([
  'BTC', 'XBT', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'BNB', 'AVAX', 'DOT',
  'LINK', 'MATIC', 'LTC', 'BCH', 'TRX', 'ATOM', 'UNI', 'ETC', 'XLM', 'NEAR',
  'APT', 'ARB', 'OP', 'SUI', 'TON', 'SHIB', 'PEPE', 'FIL', 'ICP', 'INJ',
  'RNDR', 'IMX', 'AAVE', 'MKR', 'ALGO', 'VET', 'GRT', 'SAND', 'AXS', 'FTM',
]);

// Explicit specs for instruments that aren't auto-detectable from a currency pair.
const EXPLICIT: Record<string, SymbolSpec> = {
  // Metals
  XAUUSD: spec('metal',  100,    'USD'),
  XAGUSD: spec('metal',  5_000,  'USD'),
  XPTUSD: spec('metal',  100,    'USD'),
  XPDUSD: spec('metal',  100,    'USD'),
  // Energy
  USOIL:    spec('energy', 1_000, 'USD'),
  WTIUSD:   spec('energy', 1_000, 'USD'),
  BRENTOIL: spec('energy', 1_000, 'USD'),
  XBRUSD:   spec('energy', 1_000, 'USD'),
  UKOIL:    spec('energy', 1_000, 'USD'),
  XNGUSD:   spec('energy', 10_000, 'USD'),
  // US indices ($1 / point)
  US30:   spec('index', 1, 'USD'),
  NAS100: spec('index', 1, 'USD'),
  SPX500: spec('index', 1, 'USD'),
  SP500:  spec('index', 1, 'USD'),
  US500:  spec('index', 1, 'USD'),
  US100:  spec('index', 1, 'USD'),
  // Non-USD indices (P&L approximated to USD via exit)
  DE40:  spec('index', 1, 'other'),
  GER40: spec('index', 1, 'other'),
  UK100: spec('index', 1, 'other'),
  JP225: spec('index', 1, 'other'),
  FR40:  spec('index', 1, 'other'),
  EU50:  spec('index', 1, 'other'),
};

function spec(
  instrument: InstrumentClass,
  contractSize: number,
  quoteCurrency: 'USD' | 'other',
  extra: Partial<Pick<SymbolSpec, 'quote' | 'usdBase'>> = {},
): SymbolSpec {
  const ui = {
    forex:  { lotLabel: 'lots',      lotStep: 0.01,   lotPlaceholder: '0.10' },
    metal:  { lotLabel: 'lots',      lotStep: 0.01,   lotPlaceholder: '0.10' },
    energy: { lotLabel: 'lots',      lotStep: 0.01,   lotPlaceholder: '0.10' },
    index:  { lotLabel: 'contracts', lotStep: 1,      lotPlaceholder: '1' },
    crypto: { lotLabel: 'units',     lotStep: 0.0001, lotPlaceholder: '0.50' },
    stock:  { lotLabel: 'shares',    lotStep: 1,      lotPlaceholder: '100' },
  }[instrument];
  return { instrument, contractSize, quoteCurrency, quote: '', usdBase: false, ...ui, ...extra };
}

function clean(symbol: string): string {
  return symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Resolve the full instrument spec for any symbol the user might type. */
export function getInstrumentInfo(symbol: string): SymbolSpec {
  const key = clean(symbol);
  if (!key) return spec('forex', 100_000, 'USD');

  // 1. Explicit metals / energy / indices
  if (EXPLICIT[key]) return EXPLICIT[key];

  // 2. Forex — any 6-char pair built from two known currencies
  if (key.length === 6 && FIAT.has(key.slice(0, 3)) && FIAT.has(key.slice(3))) {
    const base = key.slice(0, 3);
    const quote = key.slice(3);
    const usdQuote = quote === 'USD';
    return spec('forex', 100_000, usdQuote ? 'USD' : 'other', {
      quote: usdQuote ? '' : quote,
      usdBase: base === 'USD',
    });
  }

  // 3. Crypto — known base with (or without) a fiat/stable quote
  const cryptoQuote = CRYPTO_QUOTES.find(q => key.endsWith(q) && key.length > q.length);
  if (cryptoQuote && CRYPTO_BASES.has(key.slice(0, key.length - cryptoQuote.length))) {
    return spec('crypto', 1, 'USD');
  }
  if (CRYPTO_BASES.has(key)) return spec('crypto', 1, 'USD');

  // 4. Everything else → treated as a stock / share-like instrument (1 unit = 1 share)
  return spec('stock', 1, 'USD');
}

/** Backwards-compatible accessor (kept for existing callers). */
export function getSymbolSpec(symbol: string): SymbolSpec {
  return getInstrumentInfo(symbol);
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

export interface PnLOptions {
  /** USD value of a 1.0 price move, per 1 lot — overrides the instrument table entirely. */
  pointValue?: number;
  /** Live rate to convert the quote currency into USD (quote→USD), e.g. JPYUSD for *JPY pairs. */
  quoteToUsdRate?: number;
}

export interface PnLResult {
  pnl: number;
  pnlPercent: number;
  /** True when a non-USD-quoted P&L was converted with a rough estimate (no live/exact rate). */
  approximate: boolean;
}

/**
 * Calculates trade P&L using instrument-aware, lot-based arithmetic.
 *
 * Money value of the position = contractSize × lots (resolved from the instrument),
 * unless `opts.pointValue` is supplied, in which case it is used directly (USD/point/lot).
 *
 *   USD-quoted (EURUSD, XAUUSD, BTCUSD, AAPL, US30):
 *     P&L = priceDiff × contractSize × lots                              (exact)
 *
 *   Non-USD-quoted → convert quote currency into USD:
 *     • opts.quoteToUsdRate given → P&L_quote × rate                     (exact, live)
 *     • USD-base pair (USDJPY…)   → P&L_quote / exit                     (exact)
 *     • cross pair (EURJPY…)      → P&L_quote / exit  → flagged approximate
 *
 * Fallbacks when no lot size is given:
 *   • accountSize present → percentage-of-account model
 *   • otherwise          → raw price difference
 */
export function calculatePnL(
  entry: number,
  exit: number,
  type: 'long' | 'short',
  symbol: string,
  lots?: number,
  accountSize?: number,
  opts: PnLOptions = {}
): PnLResult | null {
  if (!exit || entry === 0) return null;

  const direction = type === 'long' ? 1 : -1;
  const priceDiff = (exit - entry) * direction;
  let pnl: number;
  let approximate = false;

  if (lots && lots > 0) {
    if (opts.pointValue && opts.pointValue > 0) {
      // Manual override — already expressed in USD per point per lot.
      pnl = priceDiff * opts.pointValue * lots;
    } else {
      const spec = getInstrumentInfo(symbol);
      pnl = priceDiff * spec.contractSize * lots;
      if (spec.quoteCurrency !== 'USD') {
        if (opts.quoteToUsdRate && opts.quoteToUsdRate > 0) {
          pnl = pnl * opts.quoteToUsdRate;      // quote → USD, exact (live rate)
        } else if (spec.usdBase) {
          pnl = pnl / exit;                     // USDxxx pair → exact
        } else {
          pnl = pnl / exit;                     // cross pair → rough estimate
          approximate = true;
        }
      }
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
    approximate,
  };
}

/** Whether a symbol's P&L needs a live quote→USD rate to be exact (cross-currency pairs). */
export function quoteConversion(symbol: string): { needsLiveRate: boolean; quote: string } {
  const s = getInstrumentInfo(symbol);
  if (s.instrument === 'forex' && s.quoteCurrency === 'other' && !s.usdBase) {
    return { needsLiveRate: true, quote: s.quote };
  }
  return { needsLiveRate: false, quote: '' };
}

/** Fetches the quote-currency → USD rate (e.g. 'JPY' → JPYUSD=X) via the quote API. */
export async function fetchQuoteToUsdRate(quote: string): Promise<number | null> {
  if (!quote || quote === 'USD') return null;
  try {
    const r = await fetch(`/api/backtesting/quote?symbol=${encodeURIComponent(`${quote}USD=X`)}`);
    if (!r.ok) return null;
    const d = await r.json();
    const p = Number(d?.price);
    return Number.isFinite(p) && p > 0 ? p : null;
  } catch {
    return null;
  }
}
