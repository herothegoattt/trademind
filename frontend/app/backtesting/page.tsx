"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Play, Pause, SkipBack, SkipForward,
  ChevronsLeft, ChevronsRight, RefreshCw, TrendingUp,
  TrendingDown, BarChart2, Clock, ChevronDown,
  MousePointer2, Pencil, Minus, TrendingUp as TrendLine,
  ArrowUpRight, Eraser, Trash2, Search, X,
} from "lucide-react";
import type { OHLCVBar, DrawingTool, Drawing } from "../../components/backtesting/ReplayChart";

const ReplayChart = dynamic(
  () => import("../../components/backtesting/ReplayChart").then((m) => m.ReplayChart),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center"><RefreshCw className="w-5 h-5 animate-spin" style={{ color: "rgba(16,185,129,0.4)" }} /></div> }
);

/* ── Data ─────────────────────────────────────────────────────── */
type Category = "Stocks" | "ETFs" | "Indices" | "Forex" | "Crypto" | "Commodities";

const SYMBOLS: Record<Category, { label: string; ticker: string }[]> = {
  Stocks: [
    // Mega-cap tech
    { label: "AAPL",  ticker: "AAPL"  }, { label: "MSFT",  ticker: "MSFT"  },
    { label: "NVDA",  ticker: "NVDA"  }, { label: "GOOGL", ticker: "GOOGL" },
    { label: "META",  ticker: "META"  }, { label: "AMZN",  ticker: "AMZN"  },
    { label: "TSLA",  ticker: "TSLA"  }, { label: "AVGO",  ticker: "AVGO"  },
    // Tech
    { label: "AMD",   ticker: "AMD"   }, { label: "INTC",  ticker: "INTC"  },
    { label: "ORCL",  ticker: "ORCL"  }, { label: "CRM",   ticker: "CRM"   },
    { label: "ADBE",  ticker: "ADBE"  }, { label: "QCOM",  ticker: "QCOM"  },
    { label: "TXN",   ticker: "TXN"   }, { label: "MU",    ticker: "MU"    },
    { label: "AMAT",  ticker: "AMAT"  }, { label: "NFLX",  ticker: "NFLX"  },
    { label: "UBER",  ticker: "UBER"  }, { label: "PLTR",  ticker: "PLTR"  },
    // Finance
    { label: "JPM",   ticker: "JPM"   }, { label: "BAC",   ticker: "BAC"   },
    { label: "GS",    ticker: "GS"    }, { label: "MS",    ticker: "MS"    },
    { label: "V",     ticker: "V"     }, { label: "MA",    ticker: "MA"    },
    { label: "PYPL",  ticker: "PYPL"  }, { label: "COIN",  ticker: "COIN"  },
    // Consumer / Retail
    { label: "WMT",   ticker: "WMT"   }, { label: "COST",  ticker: "COST"  },
    { label: "HD",    ticker: "HD"    }, { label: "MCD",   ticker: "MCD"   },
    { label: "SBUX",  ticker: "SBUX"  }, { label: "NKE",   ticker: "NKE"   },
    { label: "AMGN",  ticker: "AMGN"  }, { label: "DIS",   ticker: "DIS"   },
    // Healthcare / Energy
    { label: "JNJ",   ticker: "JNJ"   }, { label: "UNH",   ticker: "UNH"   },
    { label: "PFE",   ticker: "PFE"   }, { label: "ABBV",  ticker: "ABBV"  },
    { label: "XOM",   ticker: "XOM"   }, { label: "CVX",   ticker: "CVX"   },
    // China ADR
    { label: "BABA",  ticker: "BABA"  }, { label: "BIDU",  ticker: "BIDU"  },
    { label: "JD",    ticker: "JD"    }, { label: "NIO",   ticker: "NIO"   },
  ],

  ETFs: [
    // US broad market
    { label: "SPY",   ticker: "SPY"   }, { label: "QQQ",   ticker: "QQQ"   },
    { label: "IWM",   ticker: "IWM"   }, { label: "DIA",   ticker: "DIA"   },
    { label: "VTI",   ticker: "VTI"   }, { label: "VOO",   ticker: "VOO"   },
    // Sector
    { label: "XLK",   ticker: "XLK"   }, { label: "XLF",   ticker: "XLF"   },
    { label: "XLE",   ticker: "XLE"   }, { label: "XLV",   ticker: "XLV"   },
    { label: "XLY",   ticker: "XLY"   }, { label: "XLI",   ticker: "XLI"   },
    { label: "SOXX",  ticker: "SOXX"  }, { label: "ARKK",  ticker: "ARKK"  },
    // Bonds / Vol
    { label: "TLT",   ticker: "TLT"   }, { label: "HYG",   ticker: "HYG"   },
    { label: "UVXY",  ticker: "UVXY"  }, { label: "VXX",   ticker: "VXX"   },
    // Commodities ETF
    { label: "GLD",   ticker: "GLD"   }, { label: "SLV",   ticker: "SLV"   },
    { label: "USO",   ticker: "USO"   }, { label: "PDBC",  ticker: "PDBC"  },
    // Leveraged
    { label: "TQQQ",  ticker: "TQQQ"  }, { label: "SQQQ",  ticker: "SQQQ"  },
    { label: "SPXL",  ticker: "SPXL"  }, { label: "SPXS",  ticker: "SPXS"  },
  ],

  Indices: [
    // US
    { label: "S&P 500",  ticker: "^GSPC"  }, { label: "Nasdaq",   ticker: "^IXIC"  },
    { label: "Dow Jones",ticker: "^DJI"   }, { label: "Russell",  ticker: "^RUT"   },
    { label: "Nasdaq 100",ticker:"^NDX"   }, { label: "VIX",      ticker: "^VIX"   },
    // Europe
    { label: "FTSE 100", ticker: "^FTSE"  }, { label: "DAX",      ticker: "^GDAXI" },
    { label: "CAC 40",   ticker: "^FCHI"  }, { label: "IBEX 35",  ticker: "^IBEX"  },
    { label: "AEX",      ticker: "^AEX"   }, { label: "SMI",      ticker: "^SSMI"  },
    // Asia / Pacific
    { label: "Nikkei",   ticker: "^N225"  }, { label: "Hang Seng",ticker: "^HSI"   },
    { label: "ASX 200",  ticker: "^AXJO"  }, { label: "Kospi",    ticker: "^KS11"  },
    { label: "CSI 300",  ticker: "000300.SS" }, { label: "Sensex", ticker: "^BSESN" },
  ],

  Forex: [
    // Majors
    { label: "EUR/USD", ticker: "EURUSD=X" }, { label: "GBP/USD", ticker: "GBPUSD=X" },
    { label: "USD/JPY", ticker: "USDJPY=X" }, { label: "AUD/USD", ticker: "AUDUSD=X" },
    { label: "USD/CHF", ticker: "USDCHF=X" }, { label: "USD/CAD", ticker: "USDCAD=X" },
    { label: "NZD/USD", ticker: "NZDUSD=X" },
    // Crosses
    { label: "EUR/GBP", ticker: "EURGBP=X" }, { label: "EUR/JPY", ticker: "EURJPY=X" },
    { label: "EUR/CHF", ticker: "EURCHF=X" }, { label: "EUR/AUD", ticker: "EURAUD=X" },
    { label: "EUR/CAD", ticker: "EURCAD=X" }, { label: "GBP/JPY", ticker: "GBPJPY=X" },
    { label: "GBP/CHF", ticker: "GBPCHF=X" }, { label: "GBP/AUD", ticker: "GBPAUD=X" },
    { label: "GBP/CAD", ticker: "GBPCAD=X" }, { label: "AUD/JPY", ticker: "AUDJPY=X" },
    { label: "AUD/CAD", ticker: "AUDCAD=X" }, { label: "CAD/JPY", ticker: "CADJPY=X" },
    { label: "CHF/JPY", ticker: "CHFJPY=X" }, { label: "NZD/JPY", ticker: "NZDJPY=X" },
    // Exotic
    { label: "USD/MXN", ticker: "USDMXN=X" }, { label: "USD/BRL", ticker: "USDBRL=X" },
    { label: "USD/ZAR", ticker: "USDZAR=X" }, { label: "USD/TRY", ticker: "USDTRY=X" },
    { label: "USD/SGD", ticker: "USDSGD=X" }, { label: "USD/HKD", ticker: "USDHKD=X" },
    { label: "USD/SEK", ticker: "USDSEK=X" }, { label: "USD/NOK", ticker: "USDNOK=X" },
  ],

  Crypto: [
    // Large cap
    { label: "BTC",   ticker: "BTC-USD"  }, { label: "ETH",   ticker: "ETH-USD"  },
    { label: "BNB",   ticker: "BNB-USD"  }, { label: "SOL",   ticker: "SOL-USD"  },
    { label: "XRP",   ticker: "XRP-USD"  }, { label: "ADA",   ticker: "ADA-USD"  },
    { label: "AVAX",  ticker: "AVAX-USD" }, { label: "DOGE",  ticker: "DOGE-USD" },
    { label: "DOT",   ticker: "DOT-USD"  }, { label: "LINK",  ticker: "LINK-USD" },
    { label: "MATIC", ticker: "MATIC-USD"}, { label: "LTC",   ticker: "LTC-USD"  },
    { label: "BCH",   ticker: "BCH-USD"  }, { label: "ATOM",  ticker: "ATOM-USD" },
    // Mid cap
    { label: "NEAR",  ticker: "NEAR-USD" }, { label: "UNI",   ticker: "UNI-USD"  },
    { label: "AAVE",  ticker: "AAVE-USD" }, { label: "MKR",   ticker: "MKR-USD"  },
    { label: "INJ",   ticker: "INJ-USD"  }, { label: "SUI",   ticker: "SUI-USD"  },
    { label: "APT",   ticker: "APT-USD"  }, { label: "ARB",   ticker: "ARB-USD"  },
    { label: "OP",    ticker: "OP-USD"   }, { label: "STX",   ticker: "STX-USD"  },
    { label: "RUNE",  ticker: "RUNE-USD" }, { label: "TIA",   ticker: "TIA-USD"  },
    { label: "SEI",   ticker: "SEI-USD"  }, { label: "JUP",   ticker: "JUP-USD"  },
    { label: "IMX",   ticker: "IMX-USD"  }, { label: "GALA",  ticker: "GALA-USD" },
    // Meme / new
    { label: "SHIB",  ticker: "SHIB-USD" }, { label: "PEPE",  ticker: "PEPE-USD" },
    { label: "FLOKI", ticker: "FLOKI-USD"}, { label: "WIF",   ticker: "WIF-USD"  },
    { label: "BONK",  ticker: "BONK-USD" }, { label: "BOME",  ticker: "BOME-USD" },
    // DeFi / infra
    { label: "LDO",   ticker: "LDO-USD"  }, { label: "GMX",   ticker: "GMX-USD"  },
    { label: "DYDX",  ticker: "DYDX-USD" }, { label: "SNX",   ticker: "SNX-USD"  },
    { label: "CRV",   ticker: "CRV-USD"  }, { label: "COMP",  ticker: "COMP-USD" },
    // L1 classics
    { label: "XLM",   ticker: "XLM-USD"  }, { label: "XMR",   ticker: "XMR-USD"  },
    { label: "ETC",   ticker: "ETC-USD"  }, { label: "TRX",   ticker: "TRX-USD"  },
    { label: "VET",   ticker: "VET-USD"  }, { label: "ALGO",  ticker: "ALGO-USD" },
    { label: "HBAR",  ticker: "HBAR-USD" }, { label: "FIL",   ticker: "FIL-USD"  },
  ],

  Commodities: [
    // Metals
    { label: "Gold",     ticker: "GC=F"  }, { label: "Silver",   ticker: "SI=F"  },
    { label: "Platinum", ticker: "PL=F"  }, { label: "Palladium",ticker: "PA=F"  },
    { label: "Copper",   ticker: "HG=F"  },
    // Energy
    { label: "Oil WTI",  ticker: "CL=F"  }, { label: "Oil Brent",ticker: "BZ=F"  },
    { label: "Nat Gas",  ticker: "NG=F"  }, { label: "Gasoline", ticker: "RB=F"  },
    { label: "Heating Oil",ticker:"HO=F" },
    // Agriculture
    { label: "Wheat",    ticker: "ZW=F"  }, { label: "Corn",     ticker: "ZC=F"  },
    { label: "Soybeans", ticker: "ZS=F"  }, { label: "Coffee",   ticker: "KC=F"  },
    { label: "Sugar",    ticker: "SB=F"  }, { label: "Cotton",   ticker: "CT=F"  },
    { label: "Cocoa",    ticker: "CC=F"  }, { label: "Lumber",   ticker: "LBS=F" },
    // Livestock
    { label: "Cattle",   ticker: "LE=F"  }, { label: "Hogs",     ticker: "HE=F"  },
  ],
};

const CAT_COLOR: Record<Category, { color: string; rgb: string }> = {
  Stocks:      { color: "#4ade80", rgb: "74,222,128"  },
  ETFs:        { color: "#818cf8", rgb: "129,140,248" },
  Indices:     { color: "#38bdf8", rgb: "56,189,248"  },
  Forex:       { color: "#22d3ee", rgb: "34,211,238"  },
  Crypto:      { color: "#fb923c", rgb: "251,146,60"  },
  Commodities: { color: "#fbbf24", rgb: "251,191,36"  },
};

const INTERVALS = [
  { label: "1m",  value: "1m"  }, { label: "5m",  value: "5m"  },
  { label: "15m", value: "15m" }, { label: "1h",  value: "1h"  },
  { label: "4h",  value: "4h"  }, { label: "1D",  value: "1d"  },
  { label: "1W",  value: "1wk" },
];

const PERIODS = [
  { label: "1 mo",  value: "1mo"  }, { label: "3 mo",  value: "3mo"  },
  { label: "6 mo",  value: "6mo"  }, { label: "1 yr",  value: "1y"   },
  { label: "2 yr",  value: "2y"   }, { label: "5 yr",  value: "5y"   },
];

const SPEEDS = [
  { label: "0.5×", ms: 1200 },
  { label: "1×",   ms: 600  },
  { label: "2×",   ms: 280  },
  { label: "5×",   ms: 100  },
];

const ALL_SYMBOLS = (Object.keys(SYMBOLS) as Category[]).flatMap((cat) =>
  SYMBOLS[cat].map((s) => ({ ...s, category: cat }))
);

/* ── Helpers ──────────────────────────────────────────────────── */
// round a Unix-second timestamp down to the open of its bar for a given interval
function barOpenTime(ts: number, iv: string): number {
  if (iv === "1wk") return Math.floor(ts / (7 * 86400)) * (7 * 86400);
  if (iv === "1d")  return Math.floor(ts / 86400) * 86400;
  const secs: Record<string, number> = { "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 14400 };
  const s = secs[iv] ?? 86400;
  return Math.floor(ts / s) * s;
}

function calcATR(bars: OHLCVBar[], n = 14): number {
  if (bars.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const { high, low } = bars[i];
    const pc = bars[i - 1].close;
    trs.push(Math.max(high - low, Math.abs(high - pc), Math.abs(low - pc)));
  }
  const slice = trs.slice(-n);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(0);
}

function fmtPrice(n: number): string {
  return n < 0.01 ? n.toFixed(6) : n < 1 ? n.toFixed(4) : n.toFixed(2);
}

function barDate(ts: number, interval: string): string {
  const d = new Date(ts * 1000);
  if (interval === "1d" || interval === "1wk")
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const SEP = () => (
  <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />
);

/* ── Page ─────────────────────────────────────────────────────── */
export default function BacktestingPage() {
  const [ticker,      setTicker]      = useState("AAPL");
  const [tickerLabel, setTickerLabel] = useState("AAPL");
  const [interval,    setInterval]    = useState("1d");
  const [period,      setPeriod]      = useState("2y");

  const [allBars,    setAllBars]    = useState<OHLCVBar[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const [isPlaying,    setIsPlaying]    = useState(false);
  const [speedIdx,     setSpeedIdx]     = useState(1);
  const [speedOpen,    setSpeedOpen]    = useState(false);
  const [periodOpen,   setPeriodOpen]   = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");

  const [activeTool,      setActiveTool]      = useState<DrawingTool>("pointer");
  const [drawColor,       setDrawColor]       = useState("#22d3ee");
  const [drawWidth,       setDrawWidth]       = useState(2);
  const [drawings,        setDrawings]        = useState<Drawing[]>([]);
  const [candleUpColor,   setCandleUpColor]   = useState("#10b981");
  const [candleDownColor, setCandleDownColor] = useState("#ef4444");
  const [liveBar,         setLiveBar]         = useState<OHLCVBar | null>(null);
  const [marketState,     setMarketState]     = useState<string>("CLOSED");

  const playRef       = useRef<number | null>(null);
  const allBarsRef    = useRef<OHLCVBar[]>([]);
  const searchRef     = useRef<HTMLDivElement>(null);
  const searchInputRef= useRef<HTMLInputElement>(null);
  const periodRef     = useRef<HTMLDivElement>(null);
  const speedRef      = useRef<HTMLDivElement>(null);

  /* close dropdowns on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false); setSearchQuery("");
      }
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
      if (speedRef.current  && !speedRef.current.contains(e.target as Node))  setSpeedOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 40);
  }, [searchOpen]);

  /* filtered symbols for search */
  const q = searchQuery.toLowerCase();
  const filteredSymbols = q
    ? ALL_SYMBOLS.filter((s) => s.label.toLowerCase().includes(q) || s.ticker.toLowerCase().includes(q))
    : ALL_SYMBOLS;

  const grouped = (Object.keys(SYMBOLS) as Category[]).reduce(
    (acc, cat) => {
      const items = filteredSymbols.filter((s) => s.category === cat);
      if (items.length) acc[cat] = items;
      return acc;
    },
    {} as Partial<Record<Category, typeof ALL_SYMBOLS>>
  );

  /* data fetch */
  const loadData = useCallback(async (sym: string, iv: string, per: string) => {
    setLoading(true); setError(null); setIsPlaying(false); setLiveBar(null);
    if (playRef.current !== null) window.clearInterval(playRef.current);
    try {
      const res  = await fetch(`/api/backtesting/ohlcv?symbol=${encodeURIComponent(sym)}&interval=${iv}&period=${per}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Failed to load data");
      const bars: OHLCVBar[] = json.candles;
      setAllBars(bars);
      // start at the latest bar (today) — user scrubs left to pick a replay start point
      setCurrentIdx(bars.length - 1);
    } catch (e: any) {
      setError(e.message ?? "Unknown error"); setAllBars([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* auto-play */
  useEffect(() => {
    if (playRef.current !== null) window.clearInterval(playRef.current);
    if (!isPlaying) return;
    playRef.current = window.setInterval(() => {
      setCurrentIdx((prev) => {
        const next = prev + 1;
        if (next >= allBars.length) { setIsPlaying(false); return prev; }
        return next;
      });
    }, SPEEDS[speedIdx].ms) as unknown as number;
    return () => { if (playRef.current !== null) window.clearInterval(playRef.current); };
  }, [isPlaying, speedIdx, allBars.length]);

  /* keyboard */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowRight") setCurrentIdx((p) => Math.min(p + 1, allBars.length - 1));
      if (e.key === "ArrowLeft")  setCurrentIdx((p) => Math.max(p - 1, 0));
      if (e.key === " ")          { e.preventDefault(); setIsPlaying((p) => !p); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [allBars.length]);

  /* live quote polling — runs whenever data is loaded, updates last bar in real time */
  const isAtEnd = allBars.length > 0 && currentIdx >= allBars.length - 1;
  const isAtEndRef = useRef(false);
  useEffect(() => { isAtEndRef.current = isAtEnd; }, [isAtEnd]);
  useEffect(() => { allBarsRef.current = allBars; }, [allBars]);

  useEffect(() => {
    if (!allBars.length) return;
    let cancelled = false;
    const poll = async () => {
      if (!isAtEndRef.current) return; // don't update if user scrolled back in history
      try {
        const res = await fetch(`/api/backtesting/quote?symbol=${encodeURIComponent(ticker)}`);
        if (!res.ok || cancelled) return;
        const d = await res.json();
        setMarketState(d.marketState ?? "CLOSED");
        const bars = allBarsRef.current;
        const lastBarTime = bars.length > 0 ? bars[bars.length - 1].time : 0;
        const computedTime = barOpenTime(d.time, interval);
        const safeTime = Math.max(computedTime, lastBarTime);
        setLiveBar({
          time:   safeTime,
          open:   d.open,
          high:   d.high,
          low:    d.low,
          close:  d.price,
          volume: d.volume,
        });
      } catch { /* network error — silently skip */ }
    };
    poll();
    const iv = window.setInterval(poll, 5000);
    return () => { cancelled = true; window.clearInterval(iv); };
  }, [allBars.length, ticker, interval]); // restart only on new data / symbol / interval

  /* derived */
  const visibleBars = allBars.slice(0, currentIdx + 1);
  const currentBar  = visibleBars[visibleBars.length - 1];
  const firstBar    = visibleBars[0];
  const changePct   = currentBar && firstBar ? ((currentBar.close - firstBar.open) / firstBar.open) * 100 : null;
  const sessionHigh = visibleBars.length ? Math.max(...visibleBars.map((b) => b.high)) : null;
  const sessionLow  = visibleBars.length ? Math.min(...visibleBars.map((b) => b.low))  : null;
  const atr         = visibleBars.length >= 2 ? calcATR(visibleBars) : null;
  const avgVol      = visibleBars.length ? visibleBars.reduce((a, b) => a + b.volume, 0) / visibleBars.length : null;
  const progress    = allBars.length > 1 ? (currentIdx / (allBars.length - 1)) * 100 : 0;

  const move = (delta: number) => setCurrentIdx((p) => Math.max(0, Math.min(p + delta, allBars.length - 1)));

  const pickSymbol = (sym: { label: string; ticker: string }) => {
    setTicker(sym.ticker); setTickerLabel(sym.label);
    setSearchOpen(false); setSearchQuery("");
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (filteredSymbols.length > 0) { pickSymbol(filteredSymbols[0]); return; }
      const t = searchQuery.trim().toUpperCase();
      if (t) { setTicker(t); setTickerLabel(t); setSearchOpen(false); setSearchQuery(""); }
    }
    if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
  };

  /* ══════════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col h-screen select-none" style={{ background: "#070a12" }}>

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center gap-1.5 px-2 h-11"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(6,9,17,0.98)" }}
      >
        {/* Back */}
        <Link
          href="/app"
          className="flex items-center justify-center rounded-lg flex-shrink-0 transition-colors"
          style={{ width: 28, height: 28, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" style={{ color: "rgba(148,163,184,0.55)" }} />
        </Link>

        <SEP />

        {/* Symbol combobox */}
        <div ref={searchRef} className="relative flex-shrink-0">
          <button
            onClick={() => setSearchOpen((p) => !p)}
            className="flex items-center gap-2 px-2.5 rounded-lg h-7 transition-all"
            style={{
              background: searchOpen ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.04)",
              border: searchOpen ? "1px solid rgba(16,185,129,0.28)" : "1px solid rgba(255,255,255,0.08)",
              minWidth: 80,
            }}
          >
            <span className="text-[13px] font-bold font-mono" style={{ color: "#e2e8f0" }}>
              {tickerLabel}
            </span>
            <ChevronDown
              className="w-3 h-3 transition-transform"
              style={{ color: "rgba(100,116,139,0.45)", transform: searchOpen ? "rotate(180deg)" : "none" }}
            />
          </button>

          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.14 }}
                className="absolute top-full mt-1.5 left-0 z-50 rounded-2xl overflow-hidden"
                style={{
                  width: 340,
                  background: "rgba(7,10,18,0.99)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)",
                }}
              >
                {/* Search input */}
                <div
                  className="flex items-center gap-2 px-3 py-2.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(100,116,139,0.45)" }} />
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKey}
                    placeholder="Search by name or ticker…"
                    className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-slate-700"
                    style={{ color: "#e2e8f0", caretColor: "#10b981" }}
                  />
                  {searchQuery ? (
                    <button onClick={() => setSearchQuery("")}>
                      <X className="w-3 h-3" style={{ color: "rgba(100,116,139,0.4)" }} />
                    </button>
                  ) : (
                    <span className="text-[9px] font-mono flex-shrink-0" style={{ color: "rgba(71,85,105,0.5)" }}>
                      {ALL_SYMBOLS.length} symbols
                    </span>
                  )}
                </div>

                {/* Results */}
                <SymbolDropdown
                  grouped={grouped}
                  filteredSymbols={filteredSymbols}
                  searchQuery={searchQuery}
                  ticker={ticker}
                  onPick={pickSymbol}
                  onCustom={() => {
                    const t = searchQuery.trim().toUpperCase();
                    setTicker(t); setTickerLabel(t); setSearchOpen(false); setSearchQuery("");
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <SEP />

        {/* Timeframe chips */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {INTERVALS.map((tf) => {
            const active = interval === tf.value;
            return (
              <button
                key={tf.value}
                onClick={() => setInterval(tf.value)}
                className="h-7 px-2 rounded text-[10px] font-bold transition-all"
                style={{
                  background:  active ? "rgba(16,185,129,0.12)" : "transparent",
                  color:       active ? "#34d399" : "rgba(100,116,139,0.45)",
                  border:      active ? "1px solid rgba(16,185,129,0.28)" : "1px solid transparent",
                }}
              >
                {tf.label}
              </button>
            );
          })}
        </div>

        <SEP />

        {/* Period dropdown */}
        <div ref={periodRef} className="relative flex-shrink-0">
          <button
            onClick={() => setPeriodOpen((p) => !p)}
            className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[10px] font-bold transition-all"
            style={{
              background: periodOpen ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "rgba(148,163,184,0.55)",
            }}
          >
            {PERIODS.find((p) => p.value === period)?.label ?? period}
            <ChevronDown className="w-3 h-3" style={{ color: "rgba(100,116,139,0.35)" }} />
          </button>
          <AnimatePresence>
            {periodOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.1 }}
                className="absolute top-full mt-1.5 left-0 z-50 rounded-xl overflow-hidden"
                style={{
                  background: "rgba(7,10,18,0.99)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  minWidth: 90,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                }}
              >
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => { setPeriod(p.value); setPeriodOpen(false); }}
                    className="w-full text-left px-3 py-2 text-[11px] font-bold transition-colors"
                    style={{
                      color: period === p.value ? "#34d399" : "rgba(148,163,184,0.55)",
                      background: period === p.value ? "rgba(16,185,129,0.08)" : "transparent",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Load */}
        <button
          onClick={() => loadData(ticker, interval, period)}
          disabled={loading}
          className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-bold transition-all flex-shrink-0"
          style={{
            background: loading ? "rgba(16,185,129,0.05)" : "rgba(16,185,129,0.12)",
            border: "1px solid rgba(16,185,129,0.28)",
            color: loading ? "rgba(52,211,153,0.35)" : "#34d399",
          }}
        >
          {loading
            ? <RefreshCw className="w-3 h-3 animate-spin" />
            : <BarChart2 className="w-3 h-3" />
          }
          Load
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Live indicator */}
        {isAtEnd && liveBar && (
          <div className="flex items-center gap-1.5 flex-shrink-0 px-2 h-6 rounded-md"
            style={{
              background: marketState === "REGULAR" ? "rgba(16,185,129,0.1)" : "rgba(100,116,139,0.07)",
              border: `1px solid ${marketState === "REGULAR" ? "rgba(16,185,129,0.3)" : "rgba(100,116,139,0.15)"}`,
            }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
              background: marketState === "REGULAR" ? "#10b981" : "rgba(100,116,139,0.5)",
              boxShadow: marketState === "REGULAR" ? "0 0 6px #10b981" : "none",
              animation: marketState === "REGULAR" ? "tmPulse 1.4s infinite" : "none",
              display: "inline-block",
            }} />
            <span className="text-[9px] font-bold font-mono tracking-widest" style={{
              color: marketState === "REGULAR" ? "#34d399" : "rgba(100,116,139,0.45)",
            }}>
              {marketState === "REGULAR" ? "LIVE" : marketState === "PRE" ? "PRE" : marketState === "POST" ? "POST" : "CLOSED"}
            </span>
          </div>
        )}

        {/* OHLC readout */}
        {currentBar && (
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            <span className="text-[10px] font-mono" style={{ color: "rgba(71,85,105,0.65)" }}>
              {barDate(currentBar.time, interval)}
            </span>
            <span className="text-[10px] font-mono tracking-wide" style={{ color: "rgba(100,116,139,0.5)" }}>
              O <span style={{ color: "#94a3b8" }}>{fmtPrice(currentBar.open)}</span>
              {" "}H <span style={{ color: "#10b981" }}>{fmtPrice(currentBar.high)}</span>
              {" "}L <span style={{ color: "#ef4444" }}>{fmtPrice(currentBar.low)}</span>
              {" "}C <span style={{ color: currentBar.close >= currentBar.open ? "#10b981" : "#ef4444" }}>{fmtPrice(currentBar.close)}</span>
            </span>
          </div>
        )}

        {/* Change badge */}
        {changePct !== null && (
          <div
            className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-bold font-mono flex-shrink-0"
            style={{
              background: changePct >= 0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
              border: changePct >= 0 ? "1px solid rgba(16,185,129,0.22)" : "1px solid rgba(239,68,68,0.22)",
              color: changePct >= 0 ? "#10b981" : "#ef4444",
            }}
          >
            {changePct >= 0
              ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />
            }
            {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
          </div>
        )}
      </div>

      {/* ── Drawing toolbar ──────────────────────────────────────── */}
      <DrawToolbar
        tool={activeTool}
        onTool={setActiveTool}
        color={drawColor}
        onColor={setDrawColor}
        width={drawWidth}
        onWidth={setDrawWidth}
        onClear={() => setDrawings([])}
        drawingsCount={drawings.length}
        candleUpColor={candleUpColor}
        candleDownColor={candleDownColor}
        onCandleUp={setCandleUpColor}
        onCandleDown={setCandleDownColor}
      />

      {/* ── Chart ───────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 relative">
        {!allBars.length && !loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <motion.div
              animate={{ opacity: [0.25, 0.6, 0.25] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <BarChart2 className="w-9 h-9" style={{ color: "rgba(16,185,129,0.3)" }} />
            </motion.div>
            <p className="text-[13px]" style={{ color: "rgba(100,116,139,0.45)" }}>
              Pick a symbol and click <span style={{ color: "#34d399" }}>Load</span>
            </p>
            <p className="text-[11px]" style={{ color: "rgba(71,85,105,0.5)" }}>
              ← → arrow keys · Space to play/pause
            </p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <p className="text-[13px]" style={{ color: "#ef4444" }}>Failed to load: {error}</p>
            <button
              onClick={() => loadData(ticker, interval, period)}
              className="text-[12px] px-4 py-2 rounded-lg"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
            >
              Retry
            </button>
          </div>
        )}
        {allBars.length > 0 && (
          <ReplayChart
            candles={allBars}
            visibleCount={currentIdx + 1}
            tool={activeTool}
            drawColor={drawColor}
            drawWidth={drawWidth}
            drawings={drawings}
            onDrawingsChange={setDrawings}
            candleUpColor={candleUpColor}
            candleDownColor={candleDownColor}
            liveBarOverride={isAtEnd && liveBar ? liveBar : undefined}
          />
        )}
      </div>

      {/* ── Metrics strip ───────────────────────────────────────── */}
      {allBars.length > 0 && (
        <div
          className="flex-shrink-0 grid grid-cols-3 md:grid-cols-6 gap-px"
          style={{ background: "rgba(255,255,255,0.035)", borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {[
            {
              label: "Price",
              value: currentBar ? fmtPrice(currentBar.close) : "—",
              sub: currentBar ? (currentBar.close >= currentBar.open ? "▲ bullish" : "▼ bearish") : "",
              col: currentBar ? (currentBar.close >= currentBar.open ? "#10b981" : "#ef4444") : "#64748b",
            },
            {
              label: "Change",
              value: changePct !== null ? `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%` : "—",
              sub: "from start",
              col: changePct !== null ? (changePct >= 0 ? "#10b981" : "#ef4444") : "#64748b",
            },
            { label: "High",     value: sessionHigh !== null ? fmtPrice(sessionHigh) : "—", sub: "session", col: "#10b981" },
            { label: "Low",      value: sessionLow  !== null ? fmtPrice(sessionLow)  : "—", sub: "session", col: "#ef4444" },
            { label: "ATR (14)", value: atr !== null ? fmtPrice(atr) : "—", sub: "avg true range", col: "#a78bfa" },
            {
              label: "Volume",
              value: currentBar ? fmt(currentBar.volume) : "—",
              sub: avgVol ? `avg ${fmt(avgVol)}` : "",
              col: "#60a5fa",
            },
          ].map((m) => (
            <div key={m.label} className="flex flex-col px-4 py-2" style={{ background: "rgba(6,9,17,0.92)" }}>
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(100,116,139,0.35)" }}>
                {m.label}
              </span>
              <span className="text-[13px] font-bold font-mono mt-0.5" style={{ color: m.col }}>
                {m.value}
              </span>
              {m.sub && (
                <span className="text-[9px] mt-0.5" style={{ color: "rgba(71,85,105,0.55)" }}>
                  {m.sub}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Replay controls ──────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-4 py-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(6,9,17,0.98)" }}
      >
        {/* Progress */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] font-mono w-8 text-right flex-shrink-0" style={{ color: "rgba(71,85,105,0.65)" }}>
            {currentIdx + 1}
          </span>
          <div className="flex-1 relative h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full pointer-events-none"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg,#10b981,#34d399)",
                boxShadow: "0 0 6px rgba(16,185,129,0.35)",
              }}
            />
            <input
              type="range"
              min={0}
              max={Math.max(0, allBars.length - 1)}
              value={currentIdx}
              onChange={(e) => setCurrentIdx(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
              style={{ height: "100%" }}
            />
          </div>
          <span className="text-[10px] font-mono w-8 flex-shrink-0" style={{ color: "rgba(71,85,105,0.65)" }}>
            {allBars.length}
          </span>
        </div>

        {/* Buttons row */}
        <div className="flex items-center justify-between">
          {/* Nav */}
          <div className="flex items-center gap-1">
            <CtrlBtn onClick={() => move(-10)} title="-10 bars" disabled={!allBars.length}>
              <ChevronsLeft className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">10</span>
            </CtrlBtn>
            <CtrlBtn onClick={() => move(-1)} title="-1 bar" disabled={!allBars.length}>
              <SkipBack className="w-3.5 h-3.5" />
            </CtrlBtn>

            {/* Play/Pause */}
            <button
              onClick={() => setIsPlaying((p) => !p)}
              disabled={!allBars.length}
              className="flex items-center justify-center rounded-xl transition-all"
              style={{
                width: 34, height: 34,
                background: isPlaying ? "rgba(16,185,129,0.18)" : "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.35)",
                color: "#34d399",
                boxShadow: isPlaying ? "0 0 10px rgba(16,185,129,0.25)" : "none",
                opacity: allBars.length ? 1 : 0.35,
              }}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>

            <CtrlBtn onClick={() => move(1)} title="+1 bar" disabled={!allBars.length}>
              <SkipForward className="w-3.5 h-3.5" />
            </CtrlBtn>
            <CtrlBtn onClick={() => move(10)} title="+10 bars" disabled={!allBars.length}>
              <span className="text-[10px] font-bold">10</span>
              <ChevronsRight className="w-3.5 h-3.5" />
            </CtrlBtn>
          </div>

          {/* Speed + info */}
          <div className="flex items-center gap-2">
            <div ref={speedRef} className="relative">
              <button
                onClick={() => setSpeedOpen((p) => !p)}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[10px] font-bold transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "rgba(148,163,184,0.55)",
                }}
              >
                <Clock className="w-3 h-3" />
                {SPEEDS[speedIdx].label}
                <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {speedOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.1 }}
                    className="absolute bottom-full mb-1.5 left-0 z-50 rounded-xl overflow-hidden"
                    style={{
                      background: "rgba(7,10,18,0.99)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      minWidth: 80,
                      boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                    }}
                  >
                    {SPEEDS.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => { setSpeedIdx(i); setSpeedOpen(false); }}
                        className="w-full px-3 py-2 text-left text-[11px] font-bold transition-colors"
                        style={{
                          color: speedIdx === i ? "#34d399" : "rgba(148,163,184,0.55)",
                          background: speedIdx === i ? "rgba(16,185,129,0.08)" : "transparent",
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span className="text-[10px] font-mono hidden sm:block" style={{ color: "rgba(56,70,92,0.7)" }}>
              {currentIdx + 1} / {allBars.length}
            </span>
            <span className="text-[9px] hidden md:block" style={{ color: "rgba(56,70,92,0.5)" }}>
              ← → · Space
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Symbol dropdown ─────────────────────────────────────────── */
const PREVIEW_COUNT = 8;

function SymbolDropdown({
  grouped, filteredSymbols, searchQuery, ticker, onPick, onCustom,
}: {
  grouped: Partial<Record<Category, typeof ALL_SYMBOLS>>;
  filteredSymbols: typeof ALL_SYMBOLS;
  searchQuery: string;
  ticker: string;
  onPick: (s: { label: string; ticker: string }) => void;
  onCustom: () => void;
}) {
  const [expanded, setExpanded] = useState<Partial<Record<Category, boolean>>>({});
  const isSearching = searchQuery.length > 0;
  const noResults = Object.keys(grouped).length === 0;

  if (noResults && isSearching) {
    return (
      <div className="px-3 py-6 text-center">
        <p className="text-[11px]" style={{ color: "rgba(100,116,139,0.45)" }}>No preset match</p>
        <button
          onClick={onCustom}
          className="mt-2 text-[11px] font-semibold px-3 py-1.5 rounded-lg"
          style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}
        >
          Load "{searchQuery.toUpperCase()}"
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
      {isSearching && filteredSymbols.length > 0 && (
        <div className="px-3 pt-2 pb-1">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(71,85,105,0.5)" }}>
            {filteredSymbols.length} result{filteredSymbols.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {(Object.keys(SYMBOLS) as Category[]).map((cat) => {
        const items = grouped[cat];
        if (!items || items.length === 0) return null;
        const cc = CAT_COLOR[cat];
        const isExpanded = expanded[cat] ?? false;
        const shown = isSearching || isExpanded ? items : items.slice(0, PREVIEW_COUNT);
        const hasMore = !isSearching && !isExpanded && items.length > PREVIEW_COUNT;

        return (
          <div key={cat}>
            {/* Category header */}
            <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: cc.color, boxShadow: `0 0 5px ${cc.color}55` }}
              />
              <span className="text-[9px] font-bold uppercase tracking-widest flex-1" style={{ color: "rgba(100,116,139,0.4)" }}>
                {cat}
              </span>
              <span className="text-[9px] font-mono" style={{ color: "rgba(71,85,105,0.45)" }}>
                {items.length}
              </span>
            </div>

            {/* Symbol grid */}
            <div className="grid grid-cols-4 gap-px px-2 pb-1">
              {shown.map((sym) => {
                const active = ticker === sym.ticker;
                return (
                  <button
                    key={sym.ticker}
                    onClick={() => onPick(sym)}
                    className="text-left px-2 py-1.5 rounded-lg text-[11px] font-mono font-semibold transition-all truncate"
                    style={{
                      color: active ? cc.color : "rgba(148,163,184,0.6)",
                      background: active ? `rgba(${cc.rgb},0.12)` : "transparent",
                      border: active ? `1px solid rgba(${cc.rgb},0.2)` : "1px solid transparent",
                    }}
                    title={sym.ticker}
                  >
                    {sym.label}
                  </button>
                );
              })}
            </div>

            {/* Show more / less */}
            {!isSearching && items.length > PREVIEW_COUNT && (
              <button
                onClick={() => setExpanded((p) => ({ ...p, [cat]: !isExpanded }))}
                className="w-full text-center py-1 mb-1 text-[10px] font-semibold transition-colors"
                style={{ color: isExpanded ? "rgba(100,116,139,0.4)" : cc.color }}
              >
                {isExpanded ? "Show less" : `+${items.length - PREVIEW_COUNT} more`}
              </button>
            )}

            {/* Separator */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "0 12px" }} />
          </div>
        );
      })}

      {/* Custom ticker hint */}
      {isSearching && filteredSymbols.length > 0 && (
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="text-[10px]" style={{ color: "rgba(71,85,105,0.5)" }}>
            Not listed?
          </span>
          <button
            onClick={onCustom}
            className="text-[10px] font-semibold"
            style={{ color: "#10b981" }}
          >
            Use "{searchQuery.toUpperCase()}" →
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Drawing toolbar ─────────────────────────────────────────── */
const DRAW_TOOLS: { tool: DrawingTool; icon: React.ReactNode; title: string }[] = [
  { tool: "pointer", icon: <MousePointer2 className="w-3.5 h-3.5" />, title: "Pointer"          },
  { tool: "pen",     icon: <Pencil        className="w-3.5 h-3.5" />, title: "Pen"              },
  { tool: "line",    icon: <TrendLine     className="w-3.5 h-3.5" />, title: "Trend Line"       },
  { tool: "hline",   icon: <Minus         className="w-3.5 h-3.5" />, title: "Horizontal Line"  },
  { tool: "ray",     icon: <ArrowUpRight  className="w-3.5 h-3.5" />, title: "Ray"              },
  { tool: "eraser",  icon: <Eraser        className="w-3.5 h-3.5" />, title: "Eraser"           },
];

const PRESET_COLORS = ["#22d3ee", "#10b981", "#ef4444", "#f59e0b", "#a78bfa", "#f8fafc"];

function DrawToolbar({
  tool, onTool, color, onColor, width, onWidth, onClear, drawingsCount,
  candleUpColor, candleDownColor, onCandleUp, onCandleDown,
}: {
  tool: DrawingTool;
  onTool: (t: DrawingTool) => void;
  color: string;
  onColor: (c: string) => void;
  width: number;
  onWidth: (w: number) => void;
  onClear: () => void;
  drawingsCount: number;
  candleUpColor: string;
  candleDownColor: string;
  onCandleUp: (c: string) => void;
  onCandleDown: (c: string) => void;
}) {
  return (
    <div
      className="flex-shrink-0 flex items-center gap-2 px-3 h-9 overflow-x-auto"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(6,9,17,0.95)" }}
    >
      {/* Tools */}
      <div className="flex items-center gap-0.5">
        {DRAW_TOOLS.map(({ tool: t, icon, title }) => (
          <button
            key={t}
            title={title}
            onClick={() => onTool(t)}
            className="flex items-center justify-center rounded-md transition-all"
            style={{
              width: 26, height: 26,
              background: tool === t ? "rgba(16,185,129,0.15)" : "transparent",
              border: tool === t ? "1px solid rgba(16,185,129,0.4)" : "1px solid transparent",
              color: tool === t ? "#34d399" : "rgba(148,163,184,0.45)",
            }}
          >
            {icon}
          </button>
        ))}
      </div>

      <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />

      {/* Color presets */}
      <div className="flex items-center gap-1.5">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => onColor(c)}
            className="rounded-full transition-all flex-shrink-0"
            style={{
              width: 12, height: 12,
              background: c,
              outline: color === c ? `2px solid ${c}` : "2px solid transparent",
              outlineOffset: 1.5,
            }}
          />
        ))}
        <label title="Custom color" className="cursor-pointer flex-shrink-0" style={{ width: 12, height: 12 }}>
          <input type="color" value={color} onChange={(e) => onColor(e.target.value)} className="opacity-0 absolute w-0 h-0" />
          <div className="w-full h-full rounded-full" style={{ background: color, outline: "1.5px solid rgba(255,255,255,0.2)", outlineOffset: 1 }} />
        </label>
      </div>

      <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />

      {/* Width */}
      <div className="flex items-center gap-1">
        {[1, 2, 3].map((w) => (
          <button
            key={w}
            title={`Width ${w}`}
            onClick={() => onWidth(w)}
            className="flex items-center justify-center rounded transition-all flex-shrink-0"
            style={{
              width: 22, height: 22,
              background: width === w ? "rgba(16,185,129,0.12)" : "transparent",
              border: width === w ? "1px solid rgba(16,185,129,0.35)" : "1px solid transparent",
            }}
          >
            <div
              className="rounded-full"
              style={{
                width: 8 + w * 2, height: w,
                background: width === w ? "#34d399" : "rgba(148,163,184,0.35)",
              }}
            />
          </button>
        ))}
      </div>

      {/* Clear drawings */}
      {drawingsCount > 0 && (
        <>
          <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />
          <button
            title="Clear all drawings"
            onClick={onClear}
            className="flex items-center gap-1 px-2 h-6 rounded text-[10px] font-semibold transition-all flex-shrink-0"
            style={{
              background: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "rgba(239,68,68,0.65)",
            }}
          >
            <Trash2 className="w-3 h-3" />
            {drawingsCount}
          </button>
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Candle colors */}
      <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(71,85,105,0.5)" }}>
          Candles
        </span>
        {/* Bull */}
        <label className="flex items-center gap-1 cursor-pointer" title="Bull candle color">
          <input
            type="color"
            value={candleUpColor}
            onChange={(e) => onCandleUp(e.target.value)}
            className="opacity-0 absolute w-0 h-0"
          />
          <div
            className="flex items-center gap-1 px-1.5 h-5 rounded transition-all"
            style={{
              background: `${candleUpColor}18`,
              border: `1px solid ${candleUpColor}55`,
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: 2, background: candleUpColor }} />
            <span className="text-[9px] font-bold" style={{ color: candleUpColor }}>Bull</span>
          </div>
        </label>
        {/* Bear */}
        <label className="flex items-center gap-1 cursor-pointer" title="Bear candle color">
          <input
            type="color"
            value={candleDownColor}
            onChange={(e) => onCandleDown(e.target.value)}
            className="opacity-0 absolute w-0 h-0"
          />
          <div
            className="flex items-center gap-1 px-1.5 h-5 rounded transition-all"
            style={{
              background: `${candleDownColor}18`,
              border: `1px solid ${candleDownColor}55`,
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: 2, background: candleDownColor }} />
            <span className="text-[9px] font-bold" style={{ color: candleDownColor }}>Bear</span>
          </div>
        </label>
      </div>
    </div>
  );
}

/* ── Control button ──────────────────────────────────────────── */
function CtrlBtn({ children, onClick, disabled, title }: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center justify-center gap-0.5 rounded-lg transition-all"
      style={{
        width: 28, height: 28,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        color: disabled ? "rgba(56,70,92,0.4)" : "rgba(148,163,184,0.65)",
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {children}
    </button>
  );
}
