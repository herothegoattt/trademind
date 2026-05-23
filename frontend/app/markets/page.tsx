"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { TradingViewWidget } from "../../components/TradingViewWidget";
import { useDashboardStore } from "../../lib/store";
import { ArrowLeft, ChevronDown, X } from "lucide-react";

/* ── Types & data ─────────────────────────────────────────────── */
type Category = "Forex" | "Crypto" | "Indices" | "Commodities" | "Stocks";

interface Sym { label: string; value: string }

const SYMBOLS: Record<Category, Sym[]> = {
  Forex: [
    { label: "EUR/USD", value: "OANDA:EURUSD" }, { label: "GBP/USD", value: "OANDA:GBPUSD" },
    { label: "USD/JPY", value: "OANDA:USDJPY" }, { label: "AUD/USD", value: "OANDA:AUDUSD" },
    { label: "USD/CAD", value: "OANDA:USDCAD" }, { label: "USD/CHF", value: "OANDA:USDCHF" },
    { label: "NZD/USD", value: "OANDA:NZDUSD" }, { label: "EUR/GBP", value: "OANDA:EURGBP" },
    { label: "EUR/JPY", value: "OANDA:EURJPY" }, { label: "GBP/JPY", value: "OANDA:GBPJPY" },
    { label: "AUD/JPY", value: "OANDA:AUDJPY" }, { label: "EUR/CHF", value: "OANDA:EURCHF" },
    { label: "CAD/JPY", value: "OANDA:CADJPY" }, { label: "EUR/AUD", value: "OANDA:EURAUD" },
    { label: "GBP/CHF", value: "OANDA:GBPCHF" }, { label: "USD/SGD", value: "OANDA:USDSGD" },
  ],
  Crypto: [
    { label: "BTC/USDT",  value: "BINANCE:BTCUSDT"  }, { label: "ETH/USDT",  value: "BINANCE:ETHUSDT"  },
    { label: "BNB/USDT",  value: "BINANCE:BNBUSDT"  }, { label: "SOL/USDT",  value: "BINANCE:SOLUSDT"  },
    { label: "XRP/USDT",  value: "BINANCE:XRPUSDT"  }, { label: "ADA/USDT",  value: "BINANCE:ADAUSDT"  },
    { label: "DOGE/USDT", value: "BINANCE:DOGEUSDT"  }, { label: "AVAX/USDT", value: "BINANCE:AVAXUSDT" },
    { label: "LINK/USDT", value: "BINANCE:LINKUSDT"  }, { label: "DOT/USDT",  value: "BINANCE:DOTUSDT"  },
    { label: "MATIC/USDT",value: "BINANCE:MATICUSDT" }, { label: "LTC/USDT",  value: "BINANCE:LTCUSDT"  },
  ],
  Indices: [
    { label: "S&P 500",     value: "CME_MINI:ES1!"  }, { label: "NASDAQ 100", value: "CME_MINI:NQ1!"  },
    { label: "DOW JONES",   value: "CBOT_MINI:YM1!" }, { label: "DAX 40",     value: "XETR:DAX"       },
    { label: "FTSE 100",    value: "SPREADEX:UK100" }, { label: "Nikkei 225", value: "OSE:NK225"       },
    { label: "CAC 40",      value: "EURONEXT:PX1"   }, { label: "Russell 2k", value: "CME_MINI:RTY1!" },
  ],
  Commodities: [
    { label: "Gold",     value: "OANDA:XAUUSD" }, { label: "Silver",   value: "OANDA:XAGUSD" },
    { label: "WTI Oil",  value: "NYMEX:CL1!"   }, { label: "Brent",    value: "NYMEX:BB1!"   },
    { label: "Nat Gas",  value: "NYMEX:NG1!"   }, { label: "Copper",   value: "COMEX:HG1!"   },
    { label: "Platinum", value: "NYMEX:PL1!"   }, { label: "Wheat",    value: "CBOT:ZW1!"    },
    { label: "Corn",     value: "CBOT:ZC1!"    }, { label: "Coffee",   value: "ICEUS:KC1!"   },
  ],
  Stocks: [
    { label: "AAPL",  value: "NASDAQ:AAPL"  }, { label: "TSLA",  value: "NASDAQ:TSLA"  },
    { label: "NVDA",  value: "NASDAQ:NVDA"  }, { label: "MSFT",  value: "NASDAQ:MSFT"  },
    { label: "GOOGL", value: "NASDAQ:GOOGL" }, { label: "META",  value: "NASDAQ:META"  },
    { label: "AMZN",  value: "NASDAQ:AMZN"  }, { label: "NFLX",  value: "NASDAQ:NFLX"  },
    { label: "AMD",   value: "NASDAQ:AMD"   }, { label: "COIN",  value: "NASDAQ:COIN"  },
    { label: "JPM",   value: "NYSE:JPM"     }, { label: "BABA",  value: "NYSE:BABA"    },
  ],
};

const CAT: Record<Category, { color: string; rgb: string; dim: string }> = {
  Forex:       { color: "#22d3ee", rgb: "34,211,238",  dim: "rgba(34,211,238,0.12)"  },
  Crypto:      { color: "#fb923c", rgb: "251,146,60",  dim: "rgba(251,146,60,0.12)"  },
  Indices:     { color: "#818cf8", rgb: "129,140,248", dim: "rgba(129,140,248,0.12)" },
  Commodities: { color: "#fbbf24", rgb: "251,191,36",  dim: "rgba(251,191,36,0.12)"  },
  Stocks:      { color: "#4ade80", rgb: "74,222,128",  dim: "rgba(74,222,128,0.12)"  },
};

const INTERVALS = [
  { label: "1m", value: "1"   }, { label: "5m",  value: "5"   },
  { label: "15m",value: "15"  }, { label: "1h",  value: "60"  },
  { label: "4h", value: "240" }, { label: "1D",  value: "D"   },
  { label: "1W", value: "W"   },
];

const CATS = Object.keys(SYMBOLS) as Category[];

/* ── Page ─────────────────────────────────────────────────────── */
export default function MarketsPage() {
  const selectSection = useDashboardStore((s: any) => s.selectSection);
  useEffect(() => { selectSection("Markets"); }, [selectSection]);

  const [category, setCategory] = useState<Category>("Forex");
  const [symbol,   setSymbol]   = useState(SYMBOLS.Forex[0].value);
  const [symLabel, setSymLabel] = useState(SYMBOLS.Forex[0].label);
  const [interval, setInterval] = useState("60");
  const [symOpen,  setSymOpen]  = useState(false);

  const symRef = useRef<HTMLDivElement>(null);

  /* close dropdown on outside click */
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (symRef.current && !symRef.current.contains(e.target as Node)) setSymOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const pickCategory = (cat: Category) => {
    setCategory(cat);
    setSymbol(SYMBOLS[cat][0].value);
    setSymLabel(SYMBOLS[cat][0].label);
    setSymOpen(false);
  };

  const pickSymbol = (s: Sym) => {
    setSymbol(s.value);
    setSymLabel(s.label);
    setSymOpen(false);
  };

  const cfg  = CAT[category];
  const syms = SYMBOLS[category];

  return (
    <div className="flex flex-col h-full" style={{ background: "#070a12" }}>

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center gap-0 h-11 relative"
        style={{ background: "rgba(6,9,17,0.98)", borderBottom: "1px solid rgba(255,255,255,0.055)" }}
      >
        {/* Back */}
        <div className="flex items-center px-2 flex-shrink-0">
          <Link
            href="/app"
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{ width: 28, height: 28, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" style={{ color: "rgba(148,163,184,0.5)" }} />
          </Link>
        </div>

        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />

        {/* Category tabs */}
        <div className="flex items-center px-1.5 gap-0.5 flex-shrink-0">
          {CATS.map((cat) => {
            const c = CAT[cat];
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => pickCategory(cat)}
                className="relative h-7 px-2.5 rounded-lg text-[11px] font-semibold transition-all"
                style={{
                  color: active ? c.color : "rgba(100,116,139,0.45)",
                  background: active ? c.dim : "transparent",
                }}
              >
                {active && (
                  <motion.div
                    layoutId="cat-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: c.dim, border: `1px solid rgba(${c.rgb},0.22)` }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </button>
            );
          })}
        </div>

        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />

        {/* Symbol combobox */}
        <div ref={symRef} className="relative flex-shrink-0 px-2">
          <button
            onClick={() => setSymOpen((p) => !p)}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg transition-all"
            style={{
              background: symOpen ? cfg.dim : "rgba(255,255,255,0.04)",
              border: symOpen ? `1px solid rgba(${cfg.rgb},0.3)` : "1px solid rgba(255,255,255,0.08)",
              minWidth: 96,
            }}
          >
            <span className="text-[12px] font-bold font-mono" style={{ color: "#e2e8f0" }}>
              {symLabel}
            </span>
            <ChevronDown
              className="w-3 h-3 ml-auto transition-transform"
              style={{ color: "rgba(100,116,139,0.45)", transform: symOpen ? "rotate(180deg)" : "none" }}
            />
          </button>

          <AnimatePresence>
            {symOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.13 }}
                className="absolute top-full mt-1.5 left-0 z-50 rounded-xl overflow-hidden"
                style={{
                  width: 260,
                  background: "rgba(7,10,18,0.99)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  boxShadow: `0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(${cfg.rgb},0.06)`,
                }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between px-3 py-2"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color, boxShadow: `0 0 5px ${cfg.color}` }} />
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(100,116,139,0.4)" }}>
                      {category} · {syms.length} pairs
                    </span>
                  </div>
                  <button onClick={() => setSymOpen(false)}>
                    <X className="w-3 h-3" style={{ color: "rgba(100,116,139,0.35)" }} />
                  </button>
                </div>

                {/* Symbol grid */}
                <div className="grid grid-cols-3 gap-px p-2">
                  {syms.map((s) => {
                    const active = symbol === s.value;
                    return (
                      <button
                        key={s.value}
                        onClick={() => pickSymbol(s)}
                        className="text-left px-2.5 py-2 rounded-lg text-[11px] font-mono font-semibold transition-all truncate"
                        style={{
                          color: active ? cfg.color : "rgba(148,163,184,0.6)",
                          background: active ? `rgba(${cfg.rgb},0.12)` : "transparent",
                          border: active ? `1px solid rgba(${cfg.rgb},0.22)` : "1px solid transparent",
                        }}
                        title={s.label}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />

        {/* Timeframe chips */}
        <div className="flex items-center gap-0.5 px-2 flex-shrink-0">
          {INTERVALS.map((tf) => {
            const active = interval === tf.value;
            return (
              <button
                key={tf.value}
                onClick={() => setInterval(tf.value)}
                className="h-7 px-2 rounded text-[10px] font-bold transition-all"
                style={{
                  background: active ? cfg.dim : "transparent",
                  color: active ? cfg.color : "rgba(100,116,139,0.42)",
                  border: active ? `1px solid rgba(${cfg.rgb},0.28)` : "1px solid transparent",
                }}
              >
                {tf.label}
              </button>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Live badge */}
        <div className="flex items-center gap-2 pr-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#10b981", boxShadow: "0 0 6px #10b981" }}
              animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-[10px] font-semibold" style={{ color: "rgba(16,185,129,0.7)" }}>
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* ── Category accent line ─────────────────────────────────── */}
      <div className="flex-shrink-0 relative overflow-hidden" style={{ height: 2 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={category}
            className="absolute inset-0"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${cfg.color} 20%, ${cfg.color} 80%, transparent 100%)`,
              boxShadow: `0 0 12px ${cfg.color}88`,
            }}
          />
        </AnimatePresence>
      </div>

      {/* ── Mobile controls ──────────────────────────────────────── */}
      <div
        className="md:hidden flex-shrink-0 flex flex-col gap-0"
        style={{ background: "rgba(6,9,17,0.98)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Category pills */}
        <div className="flex gap-1.5 px-3 pt-2.5 pb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {CATS.map((cat) => {
            const c = CAT[cat];
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => pickCategory(cat)}
                className="flex-shrink-0 h-7 px-3 rounded-lg text-[11px] font-semibold transition-all"
                style={{
                  background: active ? c.dim : "rgba(255,255,255,0.04)",
                  border: active ? `1px solid rgba(${c.rgb},0.28)` : "1px solid rgba(255,255,255,0.06)",
                  color: active ? c.color : "rgba(100,116,139,0.55)",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Symbols + TF strip */}
        <div className="flex gap-1 px-3 pb-2.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {syms.map((s) => {
            const active = symbol === s.value;
            return (
              <button
                key={s.value}
                onClick={() => pickSymbol(s)}
                className="flex-shrink-0 h-7 px-2.5 rounded-lg text-[10px] font-mono font-semibold transition-all"
                style={{
                  background: active ? `rgba(${cfg.rgb},0.12)` : "rgba(255,255,255,0.03)",
                  border: active ? `1px solid rgba(${cfg.rgb},0.28)` : "1px solid rgba(255,255,255,0.05)",
                  color: active ? cfg.color : "rgba(100,116,139,0.55)",
                }}
              >
                {s.label}
              </button>
            );
          })}

          <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.07)", margin: "0 4px", flexShrink: 0 }} />

          {INTERVALS.map((tf) => {
            const active = interval === tf.value;
            return (
              <button
                key={tf.value}
                onClick={() => setInterval(tf.value)}
                className="flex-shrink-0 h-7 px-2.5 rounded-lg text-[10px] font-bold transition-all"
                style={{
                  background: active ? cfg.dim : "rgba(255,255,255,0.03)",
                  border: active ? `1px solid rgba(${cfg.rgb},0.28)` : "1px solid rgba(255,255,255,0.05)",
                  color: active ? cfg.color : "rgba(100,116,139,0.5)",
                }}
              >
                {tf.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Chart ───────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        <TradingViewWidget symbol={symbol} interval={interval} theme="dark" />
      </div>
    </div>
  );
}
