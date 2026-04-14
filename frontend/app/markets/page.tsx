"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { TradingViewWidget } from "../../components/TradingViewWidget";
import { useDashboardStore } from "../../lib/store";
import { ArrowLeft, BarChart3, Clock } from "lucide-react";

type Category = "Forex" | "Crypto" | "Indices" | "Commodities" | "Stocks";

interface Sym {
  label: string;
  value: string;
}

const SYMBOLS: Record<Category, Sym[]> = {
  Forex: [
    { label: "EUR/USD", value: "OANDA:EURUSD" },
    { label: "GBP/USD", value: "OANDA:GBPUSD" },
    { label: "USD/JPY", value: "OANDA:USDJPY" },
    { label: "AUD/USD", value: "OANDA:AUDUSD" },
    { label: "USD/CAD", value: "OANDA:USDCAD" },
    { label: "USD/CHF", value: "OANDA:USDCHF" },
    { label: "NZD/USD", value: "OANDA:NZDUSD" },
    { label: "EUR/GBP", value: "OANDA:EURGBP" },
    { label: "EUR/JPY", value: "OANDA:EURJPY" },
    { label: "GBP/JPY", value: "OANDA:GBPJPY" },
    { label: "AUD/JPY", value: "OANDA:AUDJPY" },
    { label: "EUR/CHF", value: "OANDA:EURCHF" },
    { label: "CAD/JPY", value: "OANDA:CADJPY" },
    { label: "USD/SGD", value: "OANDA:USDSGD" },
    { label: "EUR/AUD", value: "OANDA:EURAUD" },
    { label: "GBP/CHF", value: "OANDA:GBPCHF" },
  ],
  Crypto: [
    { label: "BTC/USDT", value: "BINANCE:BTCUSDT" },
    { label: "ETH/USDT", value: "BINANCE:ETHUSDT" },
    { label: "BNB/USDT", value: "BINANCE:BNBUSDT" },
    { label: "SOL/USDT", value: "BINANCE:SOLUSDT" },
    { label: "XRP/USDT", value: "BINANCE:XRPUSDT" },
    { label: "ADA/USDT", value: "BINANCE:ADAUSDT" },
    { label: "DOGE/USDT", value: "BINANCE:DOGEUSDT" },
    { label: "AVAX/USDT", value: "BINANCE:AVAXUSDT" },
    { label: "LINK/USDT", value: "BINANCE:LINKUSDT" },
    { label: "DOT/USDT", value: "BINANCE:DOTUSDT" },
    { label: "MATIC/USDT", value: "BINANCE:MATICUSDT" },
    { label: "LTC/USDT", value: "BINANCE:LTCUSDT" },
  ],
  Indices: [
    { label: "S&P 500", value: "CME_MINI:ES1!" },
    { label: "NASDAQ 100", value: "CME_MINI:NQ1!" },
    { label: "DOW JONES", value: "CBOT_MINI:YM1!" },
    { label: "DAX 40", value: "XETR:DAX" },
    { label: "FTSE 100", value: "SPREADEX:UK100" },
    { label: "Nikkei 225", value: "OSE:NK225" },
    { label: "CAC 40", value: "EURONEXT:PX1" },
    { label: "Russell 2000", value: "CME_MINI:RTY1!" },
  ],
  Commodities: [
    { label: "Gold", value: "OANDA:XAUUSD" },
    { label: "Silver", value: "OANDA:XAGUSD" },
    { label: "WTI Oil", value: "NYMEX:CL1!" },
    { label: "Brent Oil", value: "NYMEX:BB1!" },
    { label: "Natural Gas", value: "NYMEX:NG1!" },
    { label: "Copper", value: "COMEX:HG1!" },
    { label: "Platinum", value: "NYMEX:PL1!" },
    { label: "Palladium", value: "NYMEX:PA1!" },
    { label: "Wheat", value: "CBOT:ZW1!" },
    { label: "Corn", value: "CBOT:ZC1!" },
  ],
  Stocks: [
    { label: "AAPL", value: "NASDAQ:AAPL" },
    { label: "TSLA", value: "NASDAQ:TSLA" },
    { label: "NVDA", value: "NASDAQ:NVDA" },
    { label: "MSFT", value: "NASDAQ:MSFT" },
    { label: "GOOGL", value: "NASDAQ:GOOGL" },
    { label: "META", value: "NASDAQ:META" },
    { label: "AMZN", value: "NASDAQ:AMZN" },
    { label: "NFLX", value: "NASDAQ:NFLX" },
    { label: "AMD", value: "NASDAQ:AMD" },
    { label: "COIN", value: "NASDAQ:COIN" },
    { label: "JPM", value: "NYSE:JPM" },
    { label: "BABA", value: "NYSE:BABA" },
  ],
};

const CATEGORY_COLORS: Record<Category, string> = {
  Forex:       "text-blue-400 border-blue-500/40 bg-blue-500/10",
  Crypto:      "text-orange-400 border-orange-500/40 bg-orange-500/10",
  Indices:     "text-purple-400 border-purple-500/40 bg-purple-500/10",
  Commodities: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
  Stocks:      "text-green-400 border-green-500/40 bg-green-500/10",
};

const CATEGORY_ACTIVE: Record<Category, string> = {
  Forex:       "bg-blue-500/25 border-blue-400 text-blue-300",
  Crypto:      "bg-orange-500/25 border-orange-400 text-orange-300",
  Indices:     "bg-purple-500/25 border-purple-400 text-purple-300",
  Commodities: "bg-yellow-500/25 border-yellow-400 text-yellow-300",
  Stocks:      "bg-green-500/25 border-green-400 text-green-300",
};

const INTERVALS = [
  { label: "1m",  value: "1" },
  { label: "5m",  value: "5" },
  { label: "15m", value: "15" },
  { label: "1h",  value: "60" },
  { label: "4h",  value: "240" },
  { label: "1D",  value: "D" },
  { label: "1W",  value: "W" },
];

export default function MarketsPage() {
  const selectSection = useDashboardStore((s: any) => s.selectSection);
  useEffect(() => { selectSection("Markets"); }, [selectSection]);

  const [category, setCategory] = useState<Category>("Forex");
  const [symbol, setSymbol] = useState(SYMBOLS.Forex[0].value);
  const [symbolLabel, setSymbolLabel] = useState(SYMBOLS.Forex[0].label);
  const [interval, setInterval] = useState("60");

  const symbols = SYMBOLS[category];

  return (
    <div className="flex h-full bg-[#080810] text-white">

      {/* ── Sidebar ── */}
      <aside className="w-52 flex-shrink-0 flex flex-col border-r border-white/[0.05] bg-[#0b0b16]">

        {/* Back + title */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-white/[0.04]">
          <Link href="/app" className="p-1 rounded hover:bg-white/[0.05] transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </Link>
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-white">Markets</span>
          </div>
        </div>

        {/* Category tabs */}
        <div className="px-3 pt-3 pb-2 space-y-1">
          {(Object.keys(SYMBOLS) as Category[]).map(cat => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                setSymbol(SYMBOLS[cat][0].value);
                setSymbolLabel(SYMBOLS[cat][0].label);
              }}
              className={`w-full text-left px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                category === cat
                  ? CATEGORY_ACTIVE[cat]
                  : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]"
              }`}
            >
              {cat}
              <span className="ml-1 text-[10px] opacity-60">({SYMBOLS[cat].length})</span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-3 border-t border-white/[0.05]" />

        {/* Symbol list — scrollable */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {symbols.map(sym => (
            <button
              key={sym.value}
              onClick={() => { setSymbol(sym.value); setSymbolLabel(sym.label); }}
              className={`w-full text-left px-3 py-2 rounded-md text-xs transition-all ${
                symbol === sym.value
                  ? `font-semibold ${CATEGORY_COLORS[category]} border`
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{sym.label}</span>
                {symbol === sym.value && (
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 animate-pulse" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Timeframe — bottom, fixed */}
        <div className="px-3 py-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-1 mb-2">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Timeframe</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {INTERVALS.map(tf => (
              <button
                key={tf.value}
                onClick={() => setInterval(tf.value)}
                className={`py-1 rounded text-[10px] font-bold transition-all ${
                  interval === tf.value
                    ? "bg-purple-500/30 text-purple-300 border border-purple-500/40"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Chart Area ── */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Chart header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04] flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-white">{symbolLabel}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${CATEGORY_COLORS[category]}`}>
              {category}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            Live · {INTERVALS.find(i => i.value === interval)?.label}
          </div>
        </div>

        {/* TradingView chart fills the rest */}
        <div className="flex-1 min-h-0">
          <TradingViewWidget symbol={symbol} interval={interval} theme="dark" />
        </div>
      </main>
    </div>
  );
}
