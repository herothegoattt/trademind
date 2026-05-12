"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { TradingViewWidget } from "../../components/TradingViewWidget";
import { useDashboardStore } from "../../lib/store";
import { ArrowLeft, BarChart3, Wifi } from "lucide-react";

type Category = "Forex" | "Crypto" | "Indices" | "Commodities" | "Stocks";

interface Sym { label: string; value: string }

const SYMBOLS: Record<Category, Sym[]> = {
  Forex: [
    { label:"EUR/USD", value:"OANDA:EURUSD" }, { label:"GBP/USD", value:"OANDA:GBPUSD" },
    { label:"USD/JPY", value:"OANDA:USDJPY" }, { label:"AUD/USD", value:"OANDA:AUDUSD" },
    { label:"USD/CAD", value:"OANDA:USDCAD" }, { label:"USD/CHF", value:"OANDA:USDCHF" },
    { label:"NZD/USD", value:"OANDA:NZDUSD" }, { label:"EUR/GBP", value:"OANDA:EURGBP" },
    { label:"EUR/JPY", value:"OANDA:EURJPY" }, { label:"GBP/JPY", value:"OANDA:GBPJPY" },
    { label:"AUD/JPY", value:"OANDA:AUDJPY" }, { label:"EUR/CHF", value:"OANDA:EURCHF" },
    { label:"CAD/JPY", value:"OANDA:CADJPY" }, { label:"EUR/AUD", value:"OANDA:EURAUD" },
    { label:"GBP/CHF", value:"OANDA:GBPCHF" }, { label:"USD/SGD", value:"OANDA:USDSGD" },
  ],
  Crypto: [
    { label:"BTC/USDT",  value:"BINANCE:BTCUSDT"  }, { label:"ETH/USDT",  value:"BINANCE:ETHUSDT"  },
    { label:"BNB/USDT",  value:"BINANCE:BNBUSDT"  }, { label:"SOL/USDT",  value:"BINANCE:SOLUSDT"  },
    { label:"XRP/USDT",  value:"BINANCE:XRPUSDT"  }, { label:"ADA/USDT",  value:"BINANCE:ADAUSDT"  },
    { label:"DOGE/USDT", value:"BINANCE:DOGEUSDT" }, { label:"AVAX/USDT", value:"BINANCE:AVAXUSDT" },
    { label:"LINK/USDT", value:"BINANCE:LINKUSDT" }, { label:"DOT/USDT",  value:"BINANCE:DOTUSDT"  },
    { label:"MATIC/USDT",value:"BINANCE:MATICUSDT"}, { label:"LTC/USDT",  value:"BINANCE:LTCUSDT"  },
  ],
  Indices: [
    { label:"S&P 500",    value:"CME_MINI:ES1!"   }, { label:"NASDAQ 100", value:"CME_MINI:NQ1!"   },
    { label:"DOW JONES",  value:"CBOT_MINI:YM1!"  }, { label:"DAX 40",     value:"XETR:DAX"        },
    { label:"FTSE 100",   value:"SPREADEX:UK100"  }, { label:"Nikkei 225", value:"OSE:NK225"        },
    { label:"CAC 40",     value:"EURONEXT:PX1"    }, { label:"Russell 2000",value:"CME_MINI:RTY1!" },
  ],
  Commodities: [
    { label:"Gold",        value:"OANDA:XAUUSD"  }, { label:"Silver",      value:"OANDA:XAGUSD"  },
    { label:"WTI Oil",     value:"NYMEX:CL1!"    }, { label:"Brent Oil",   value:"NYMEX:BB1!"    },
    { label:"Natural Gas", value:"NYMEX:NG1!"    }, { label:"Copper",      value:"COMEX:HG1!"    },
    { label:"Platinum",    value:"NYMEX:PL1!"    }, { label:"Palladium",   value:"NYMEX:PA1!"    },
    { label:"Wheat",       value:"CBOT:ZW1!"     }, { label:"Corn",        value:"CBOT:ZC1!"     },
  ],
  Stocks: [
    { label:"AAPL", value:"NASDAQ:AAPL" }, { label:"TSLA", value:"NASDAQ:TSLA" },
    { label:"NVDA", value:"NASDAQ:NVDA" }, { label:"MSFT", value:"NASDAQ:MSFT" },
    { label:"GOOGL",value:"NASDAQ:GOOGL"}, { label:"META", value:"NASDAQ:META" },
    { label:"AMZN", value:"NASDAQ:AMZN" }, { label:"NFLX", value:"NASDAQ:NFLX" },
    { label:"AMD",  value:"NASDAQ:AMD"  }, { label:"COIN", value:"NASDAQ:COIN" },
    { label:"JPM",  value:"NYSE:JPM"    }, { label:"BABA", value:"NYSE:BABA"   },
  ],
};

const CAT: Record<Category, { color: string; rgb: string; icon: string; dimColor: string }> = {
  Forex:       { color:"#22d3ee", rgb:"34,211,238",  icon:"💱", dimColor:"rgba(34,211,238,0.55)"  },
  Crypto:      { color:"#fb923c", rgb:"251,146,60",  icon:"₿",  dimColor:"rgba(251,146,60,0.55)"  },
  Indices:     { color:"#818cf8", rgb:"129,140,248", icon:"📈", dimColor:"rgba(129,140,248,0.55)" },
  Commodities: { color:"#fbbf24", rgb:"251,191,36",  icon:"🥇", dimColor:"rgba(251,191,36,0.55)"  },
  Stocks:      { color:"#4ade80", rgb:"74,222,128",  icon:"📊", dimColor:"rgba(74,222,128,0.55)"  },
};

const INTERVALS = [
  { label:"1m", value:"1" }, { label:"5m",  value:"5"   },
  { label:"15m",value:"15"}, { label:"1h",  value:"60"  },
  { label:"4h", value:"240"},{ label:"1D",  value:"D"   },
  { label:"1W", value:"W"  },
];

export default function MarketsPage() {
  const selectSection = useDashboardStore((s: any) => s.selectSection);
  useEffect(() => { selectSection("Markets"); }, [selectSection]);

  const [category, setCategory]       = useState<Category>("Forex");
  const [symbol,   setSymbol]         = useState(SYMBOLS.Forex[0].value);
  const [symbolLabel, setSymbolLabel] = useState(SYMBOLS.Forex[0].label);
  const [interval, setInterval]       = useState("60");

  const cfg  = CAT[category];
  const syms = SYMBOLS[category];

  const pickCategory = (cat: Category) => {
    setCategory(cat);
    setSymbol(SYMBOLS[cat][0].value);
    setSymbolLabel(SYMBOLS[cat][0].label);
  };

  return (
    <div className="flex flex-col md:flex-row h-full text-white" style={{ background:"#070a12" }}>

      {/* ══════════════════════ DESKTOP SIDEBAR ══════════════════════ */}
      <aside
        className="hidden md:flex flex-shrink-0 flex-col"
        style={{ width:224, background:"rgba(6,9,17,0.95)", borderRight:"1px solid rgba(255,255,255,0.05)" }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2.5 px-4 py-3.5 flex-shrink-0"
          style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}
        >
          <Link href="/app" className="p-1 rounded-lg transition-colors flex-shrink-0"
            style={{ background:"rgba(255,255,255,0.04)" }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.08)"}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.04)"}
          >
            <ArrowLeft className="w-3.5 h-3.5" style={{ color:"rgba(148,163,184,0.6)" }} />
          </Link>
          <BarChart3 className="w-3.5 h-3.5 flex-shrink-0" style={{ color:"#818cf8" }} />
          <span className="text-[13px] font-semibold" style={{ color:"#e2e8f0" }}>Markets</span>
          <motion.div
            className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background:"#4ade80", boxShadow:"0 0 6px #4ade80" }}
            animate={{ opacity:[0.6,1,0.6] }}
            transition={{ duration:2, repeat:Infinity, ease:"easeInOut" }}
          />
        </div>

        {/* Category tabs */}
        <div className="px-2 pt-3 pb-2 flex flex-col gap-0.5 flex-shrink-0">
          <p className="px-2 mb-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color:"rgba(100,116,139,0.5)" }}>
            Markets
          </p>
          {(Object.keys(SYMBOLS) as Category[]).map(cat => {
            const c = CAT[cat];
            const active = category === cat;
            return (
              <button key={cat} onClick={() => pickCategory(cat)}
                className="relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all"
                style={{
                  background: active ? `rgba(${c.rgb},0.1)` : "transparent",
                  border:     active ? `1px solid rgba(${c.rgb},0.22)` : "1px solid transparent",
                }}
                onMouseEnter={e=>{ if(!active)(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.04)"; }}
                onMouseLeave={e=>{ if(!active)(e.currentTarget as HTMLElement).style.background="transparent"; }}
              >
                {active && (
                  <motion.div layoutId="cat-bar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
                    style={{ background:c.color, boxShadow:`0 0 6px ${c.color}` }}
                    transition={{ type:"spring", stiffness:400, damping:30 }}
                  />
                )}
                <span className="text-base leading-none">{c.icon}</span>
                <span className="text-[13px] font-medium flex-1" style={{ color: active ? c.color : "rgba(100,116,139,0.8)" }}>
                  {cat}
                </span>
                <span className="text-[10px] font-mono" style={{ color:`rgba(${c.rgb},${active?0.7:0.3})` }}>
                  {SYMBOLS[cat].length}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ height:1, background:"rgba(255,255,255,0.05)", margin:"0 12px" }} />

        {/* Symbol list */}
        <div className="flex-1 overflow-y-auto py-2 px-2" style={{ scrollbarWidth:"thin", scrollbarColor:"rgba(255,255,255,0.06) transparent" }}>
          <p className="px-2 mb-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color:"rgba(100,116,139,0.5)" }}>
            Symbols
          </p>
          <AnimatePresence mode="wait">
            <motion.div key={category} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.15 }}
              className="flex flex-col gap-0.5">
              {syms.map(sym => {
                const active = symbol === sym.value;
                return (
                  <button key={sym.value} onClick={() => { setSymbol(sym.value); setSymbolLabel(sym.label); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all"
                    style={{
                      background: active ? `rgba(${cfg.rgb},0.09)` : "transparent",
                      border:     active ? `1px solid rgba(${cfg.rgb},0.2)` : "1px solid transparent",
                    }}
                    onMouseEnter={e=>{ if(!active)(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.04)"; }}
                    onMouseLeave={e=>{ if(!active)(e.currentTarget as HTMLElement).style.background="transparent"; }}
                  >
                    <span className="text-[12px] font-mono font-semibold" style={{ color: active ? cfg.color : "rgba(148,163,184,0.7)" }}>
                      {sym.label}
                    </span>
                    {active && (
                      <motion.div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background:cfg.color, boxShadow:`0 0 5px ${cfg.color}` }}
                        animate={{ opacity:[0.6,1,0.6] }}
                        transition={{ duration:2, repeat:Infinity, ease:"easeInOut" }}
                      />
                    )}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Timeframe */}
        <div className="flex-shrink-0 px-3 py-3" style={{ borderTop:"1px solid rgba(255,255,255,0.05)" }}>
          <p className="mb-2 text-[9px] font-bold uppercase tracking-widest" style={{ color:"rgba(100,116,139,0.5)" }}>
            Timeframe
          </p>
          <div className="grid grid-cols-4 gap-1">
            {INTERVALS.map(tf => {
              const active = interval === tf.value;
              return (
                <button key={tf.value} onClick={() => setInterval(tf.value)}
                  className="py-1.5 rounded-lg text-[10px] font-bold transition-all"
                  style={{
                    background: active ? "rgba(129,140,248,0.18)" : "rgba(255,255,255,0.03)",
                    border:     active ? "1px solid rgba(129,140,248,0.4)" : "1px solid rgba(255,255,255,0.05)",
                    color:      active ? "#a5b4fc" : "rgba(100,116,139,0.6)",
                    boxShadow:  active ? "0 0 8px rgba(129,140,248,0.15)" : "none",
                  }}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ══════════════════════ CHART AREA ══════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Desktop header */}
        <div
          className="hidden md:flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(6,9,17,0.8)" }}
        >
          <div className="flex items-center gap-3">
            {/* Category icon + color dot */}
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{cfg.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold" style={{ color:"#f1f5f9" }}>{symbolLabel}</span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full font-mono"
                    style={{ background:`rgba(${cfg.rgb},0.12)`, border:`1px solid rgba(${cfg.rgb},0.3)`, color:cfg.color }}
                  >
                    {category.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background:"#4ade80", boxShadow:"0 0 5px #4ade80" }}
                    animate={{ opacity:[0.5,1,0.5] }} transition={{ duration:1.8, repeat:Infinity, ease:"easeInOut" }} />
                  <span className="text-[10px]" style={{ color:"rgba(100,116,139,0.6)" }}>
                    Live · {INTERVALS.find(i => i.value === interval)?.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side: active symbol quick switcher (top-3 in category) */}
          <div className="flex items-center gap-1.5">
            {syms.slice(0, 5).map(sym => (
              <button key={sym.value} onClick={() => { setSymbol(sym.value); setSymbolLabel(sym.label); }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all"
                style={{
                  background: symbol === sym.value ? `rgba(${cfg.rgb},0.14)` : "rgba(255,255,255,0.04)",
                  border:     symbol === sym.value ? `1px solid rgba(${cfg.rgb},0.35)` : "1px solid rgba(255,255,255,0.07)",
                  color:      symbol === sym.value ? cfg.color : "rgba(100,116,139,0.65)",
                }}
              >
                {sym.label}
              </button>
            ))}
            <span className="text-[10px]" style={{ color:"rgba(100,116,139,0.35)" }}>+{syms.length - 5}</span>
          </div>
        </div>

        {/* ══════════ MOBILE CONTROLS ══════════ */}
        <div className="md:hidden flex-shrink-0" style={{ background:"rgba(6,9,17,0.98)", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>

          {/* Top bar */}
          <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            <Link href="/app" className="p-1.5 rounded-lg" style={{ background:"rgba(255,255,255,0.05)" }}>
              <ArrowLeft className="w-3.5 h-3.5" style={{ color:"rgba(148,163,184,0.6)" }} />
            </Link>
            <BarChart3 className="w-3.5 h-3.5" style={{ color:"#818cf8" }} />
            <span className="text-sm font-semibold flex-1" style={{ color:"#e2e8f0" }}>Markets</span>
            <span className="text-sm font-bold font-mono" style={{ color:cfg.color }}>{symbolLabel}</span>
            <motion.div className="w-1.5 h-1.5 rounded-full ml-1" style={{ background:"#4ade80", boxShadow:"0 0 5px #4ade80" }}
              animate={{ opacity:[0.5,1,0.5] }} transition={{ duration:2, repeat:Infinity }} />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 px-3 py-2 overflow-x-auto" style={{ scrollbarWidth:"none" }}>
            {(Object.keys(SYMBOLS) as Category[]).map(cat => {
              const c = CAT[cat]; const active = category === cat;
              return (
                <button key={cat} onClick={() => pickCategory(cat)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: active ? `rgba(${c.rgb},0.14)` : "rgba(255,255,255,0.04)",
                    border:     active ? `1px solid rgba(${c.rgb},0.35)` : "1px solid rgba(255,255,255,0.07)",
                    color:      active ? c.color : "rgba(100,116,139,0.6)",
                  }}
                >
                  <span className="text-sm leading-none">{c.icon}</span>{cat}
                </button>
              );
            })}
          </div>

          {/* Symbol + TF */}
          <div className="flex gap-2 px-3 pb-2.5 overflow-x-auto" style={{ scrollbarWidth:"none" }}>
            {syms.map(sym => {
              const active = symbol === sym.value;
              return (
                <button key={sym.value} onClick={() => { setSymbol(sym.value); setSymbolLabel(sym.label); }}
                  className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold transition-all"
                  style={{
                    background: active ? `rgba(${cfg.rgb},0.14)` : "rgba(255,255,255,0.04)",
                    border:     active ? `1px solid rgba(${cfg.rgb},0.35)` : "1px solid rgba(255,255,255,0.07)",
                    color:      active ? cfg.color : "rgba(100,116,139,0.6)",
                  }}
                >
                  {sym.label}
                </button>
              );
            })}
            <div className="w-px flex-shrink-0 self-stretch" style={{ background:"rgba(255,255,255,0.07)", margin:"0 4px" }} />
            {INTERVALS.map(tf => {
              const active = interval === tf.value;
              return (
                <button key={tf.value} onClick={() => setInterval(tf.value)}
                  className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                  style={{
                    background: active ? "rgba(129,140,248,0.18)" : "rgba(255,255,255,0.04)",
                    border:     active ? "1px solid rgba(129,140,248,0.4)" : "1px solid rgba(255,255,255,0.07)",
                    color:      active ? "#a5b4fc" : "rgba(100,116,139,0.6)",
                  }}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0">
          <TradingViewWidget symbol={symbol} interval={interval} theme="dark" />
        </div>
      </main>
    </div>
  );
}
