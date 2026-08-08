"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Play, Pause, SkipBack, SkipForward,
  ChevronsLeft, ChevronsRight, RefreshCw, TrendingUp,
  TrendingDown, BarChart3, Clock, ChevronDown, RotateCcw,
  MousePointer2, Pencil, Minus, ArrowUpRight, Eraser, Trash2, Search, X,
  RotateCcw as Reset, Layers, Wallet, Activity, NotebookPen, PieChart,
  Target, Plus, Check, CircleDot, Save, Maximize2, Minimize2, Timer, Zap,
} from "lucide-react";
import type { OHLCVBar, DrawingTool, Drawing } from "../../components/backtesting/ReplayChart";

const ReplayChart = dynamic(
  () => import("../../components/backtesting/ReplayChart").then((m) => m.ReplayChart),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center"><RefreshCw className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.25)" }} /></div> }
);

/* ── FX Replay style palette ───────────────────────────────────── */
const FX = {
  bg:      "#0d1117",
  panel:   "#0f1420",
  panel2:  "#121a2a",
  bar:     "#0b0f17",
  border:  "rgba(255,255,255,0.07)",
  border2: "rgba(255,255,255,0.12)",
  text:    "#d3dbe8",
  muted:   "#8b96ab",
  dim:     "#5b667d",
  green:   "#22c55e",
  red:     "#ef4444",
  up:      "#22c55e",
  down:    "#ef4444",
  blue:    "#3b82f6",
};

/* ── Data ─────────────────────────────────────────────────────── */
type Category = "Stocks" | "ETFs" | "Indices" | "Forex" | "Crypto" | "Commodities";

const SYMBOLS: Record<Category, { label: string; ticker: string }[]> = {
  Stocks: [
    { label: "AAPL",  ticker: "AAPL"  }, { label: "MSFT",  ticker: "MSFT"  },
    { label: "NVDA",  ticker: "NVDA"  }, { label: "GOOGL", ticker: "GOOGL" },
    { label: "META",  ticker: "META"  }, { label: "AMZN",  ticker: "AMZN"  },
    { label: "TSLA",  ticker: "TSLA"  }, { label: "AVGO",  ticker: "AVGO"  },
    { label: "AMD",   ticker: "AMD"   }, { label: "INTC",  ticker: "INTC"  },
    { label: "ORCL",  ticker: "ORCL"  }, { label: "CRM",   ticker: "CRM"   },
    { label: "ADBE",  ticker: "ADBE"  }, { label: "QCOM",  ticker: "QCOM"  },
    { label: "TXN",   ticker: "TXN"   }, { label: "MU",    ticker: "MU"    },
    { label: "AMAT",  ticker: "AMAT"  }, { label: "NFLX",  ticker: "NFLX"  },
    { label: "UBER",  ticker: "UBER"  }, { label: "PLTR",  ticker: "PLTR"  },
    { label: "JPM",   ticker: "JPM"   }, { label: "BAC",   ticker: "BAC"   },
    { label: "GS",    ticker: "GS"    }, { label: "MS",    ticker: "MS"    },
    { label: "V",     ticker: "V"     }, { label: "MA",    ticker: "MA"    },
    { label: "PYPL",  ticker: "PYPL"  }, { label: "COIN",  ticker: "COIN"  },
    { label: "WMT",   ticker: "WMT"   }, { label: "COST",  ticker: "COST"  },
    { label: "HD",    ticker: "HD"    }, { label: "MCD",   ticker: "MCD"   },
    { label: "SBUX",  ticker: "SBUX"  }, { label: "NKE",   ticker: "NKE"   },
    { label: "AMGN",  ticker: "AMGN"  }, { label: "DIS",   ticker: "DIS"   },
    { label: "JNJ",   ticker: "JNJ"   }, { label: "UNH",   ticker: "UNH"   },
    { label: "PFE",   ticker: "PFE"   }, { label: "ABBV",  ticker: "ABBV"  },
    { label: "XOM",   ticker: "XOM"   }, { label: "CVX",   ticker: "CVX"   },
    { label: "BABA",  ticker: "BABA"  }, { label: "BIDU",  ticker: "BIDU"  },
    { label: "JD",    ticker: "JD"    }, { label: "NIO",   ticker: "NIO"   },
  ],

  ETFs: [
    { label: "SPY",   ticker: "SPY"   }, { label: "QQQ",   ticker: "QQQ"   },
    { label: "IWM",   ticker: "IWM"   }, { label: "DIA",   ticker: "DIA"   },
    { label: "VTI",   ticker: "VTI"   }, { label: "VOO",   ticker: "VOO"   },
    { label: "XLK",   ticker: "XLK"   }, { label: "XLF",   ticker: "XLF"   },
    { label: "XLE",   ticker: "XLE"   }, { label: "XLV",   ticker: "XLV"   },
    { label: "XLY",   ticker: "XLY"   }, { label: "XLI",   ticker: "XLI"   },
    { label: "SOXX",  ticker: "SOXX"  }, { label: "ARKK",  ticker: "ARKK"  },
    { label: "TLT",   ticker: "TLT"   }, { label: "HYG",   ticker: "HYG"   },
    { label: "UVXY",  ticker: "UVXY"  }, { label: "VXX",   ticker: "VXX"   },
    { label: "GLD",   ticker: "GLD"   }, { label: "SLV",   ticker: "SLV"   },
    { label: "USO",   ticker: "USO"   }, { label: "PDBC",  ticker: "PDBC"  },
    { label: "TQQQ",  ticker: "TQQQ"  }, { label: "SQQQ",  ticker: "SQQQ"  },
    { label: "SPXL",  ticker: "SPXL"  }, { label: "SPXS",  ticker: "SPXS"  },
  ],

  Indices: [
    { label: "S&P 500",  ticker: "^GSPC"  }, { label: "Nasdaq",   ticker: "^IXIC"  },
    { label: "Dow Jones",ticker: "^DJI"   }, { label: "Russell",  ticker: "^RUT"   },
    { label: "Nasdaq 100",ticker:"^NDX"   }, { label: "VIX",      ticker: "^VIX"   },
    { label: "FTSE 100", ticker: "^FTSE"  }, { label: "DAX",      ticker: "^GDAXI" },
    { label: "CAC 40",   ticker: "^FCHI"  }, { label: "IBEX 35",  ticker: "^IBEX"  },
    { label: "AEX",      ticker: "^AEX"   }, { label: "SMI",      ticker: "^SSMI"  },
    { label: "Nikkei",   ticker: "^N225"  }, { label: "Hang Seng",ticker: "^HSI"   },
    { label: "ASX 200",  ticker: "^AXJO"  }, { label: "Kospi",    ticker: "^KS11"  },
    { label: "CSI 300",  ticker: "000300.SS" }, { label: "Sensex", ticker: "^BSESN" },
  ],

  Forex: [
    { label: "EUR/USD", ticker: "EURUSD=X" }, { label: "GBP/USD", ticker: "GBPUSD=X" },
    { label: "USD/JPY", ticker: "USDJPY=X" }, { label: "AUD/USD", ticker: "AUDUSD=X" },
    { label: "USD/CHF", ticker: "USDCHF=X" }, { label: "USD/CAD", ticker: "USDCAD=X" },
    { label: "NZD/USD", ticker: "NZDUSD=X" },
    { label: "EUR/GBP", ticker: "EURGBP=X" }, { label: "EUR/JPY", ticker: "EURJPY=X" },
    { label: "EUR/CHF", ticker: "EURCHF=X" }, { label: "EUR/AUD", ticker: "EURAUD=X" },
    { label: "EUR/CAD", ticker: "EURCAD=X" }, { label: "GBP/JPY", ticker: "GBPJPY=X" },
    { label: "GBP/CHF", ticker: "GBPCHF=X" }, { label: "GBP/AUD", ticker: "GBPAUD=X" },
    { label: "GBP/CAD", ticker: "GBPCAD=X" }, { label: "AUD/JPY", ticker: "AUDJPY=X" },
    { label: "AUD/CAD", ticker: "AUDCAD=X" }, { label: "CAD/JPY", ticker: "CADJPY=X" },
    { label: "CHF/JPY", ticker: "CHFJPY=X" }, { label: "NZD/JPY", ticker: "NZDJPY=X" },
    { label: "USD/MXN", ticker: "USDMXN=X" }, { label: "USD/BRL", ticker: "USDBRL=X" },
    { label: "USD/ZAR", ticker: "USDZAR=X" }, { label: "USD/TRY", ticker: "USDTRY=X" },
    { label: "USD/SGD", ticker: "USDSGD=X" }, { label: "USD/HKD", ticker: "USDHKD=X" },
    { label: "USD/SEK", ticker: "USDSEK=X" }, { label: "USD/NOK", ticker: "USDNOK=X" },
  ],

  Crypto: [
    { label: "BTC",   ticker: "BTC-USD"  }, { label: "ETH",   ticker: "ETH-USD"  },
    { label: "BNB",   ticker: "BNB-USD"  }, { label: "SOL",   ticker: "SOL-USD"  },
    { label: "XRP",   ticker: "XRP-USD"  }, { label: "ADA",   ticker: "ADA-USD"  },
    { label: "AVAX",  ticker: "AVAX-USD" }, { label: "DOGE",  ticker: "DOGE-USD" },
    { label: "DOT",   ticker: "DOT-USD"  }, { label: "LINK",  ticker: "LINK-USD" },
    { label: "MATIC", ticker: "MATIC-USD"}, { label: "LTC",   ticker: "LTC-USD"  },
    { label: "BCH",   ticker: "BCH-USD"  }, { label: "ATOM",  ticker: "ATOM-USD" },
    { label: "NEAR",  ticker: "NEAR-USD" }, { label: "UNI",   ticker: "UNI-USD"  },
    { label: "AAVE",  ticker: "AAVE-USD" }, { label: "MKR",   ticker: "MKR-USD"  },
    { label: "INJ",   ticker: "INJ-USD"  }, { label: "SUI",   ticker: "SUI-USD"  },
    { label: "APT",   ticker: "APT-USD"  }, { label: "ARB",   ticker: "ARB-USD"  },
    { label: "OP",    ticker: "OP-USD"   }, { label: "STX",   ticker: "STX-USD"  },
    { label: "RUNE",  ticker: "RUNE-USD" }, { label: "TIA",   ticker: "TIA-USD"  },
    { label: "SEI",   ticker: "SEI-USD"  }, { label: "JUP",   ticker: "JUP-USD"  },
    { label: "IMX",   ticker: "IMX-USD"  }, { label: "GALA",  ticker: "GALA-USD" },
    { label: "SHIB",  ticker: "SHIB-USD" }, { label: "PEPE",  ticker: "PEPE-USD" },
    { label: "FLOKI", ticker: "FLOKI-USD"}, { label: "WIF",   ticker: "WIF-USD"  },
    { label: "BONK",  ticker: "BONK-USD" }, { label: "BOME",  ticker: "BOME-USD" },
    { label: "LDO",   ticker: "LDO-USD"  }, { label: "GMX",   ticker: "GMX-USD"  },
    { label: "DYDX",  ticker: "DYDX-USD" }, { label: "SNX",   ticker: "SNX-USD"  },
    { label: "CRV",   ticker: "CRV-USD"  }, { label: "COMP",  ticker: "COMP-USD" },
    { label: "XLM",   ticker: "XLM-USD"  }, { label: "XMR",   ticker: "XMR-USD"  },
    { label: "ETC",   ticker: "ETC-USD"  }, { label: "TRX",   ticker: "TRX-USD"  },
    { label: "VET",   ticker: "VET-USD"  }, { label: "ALGO",  ticker: "ALGO-USD" },
    { label: "HBAR",  ticker: "HBAR-USD" }, { label: "FIL",   ticker: "FIL-USD"  },
  ],

  Commodities: [
    { label: "Gold",     ticker: "GC=F"  }, { label: "Silver",   ticker: "SI=F"  },
    { label: "Platinum", ticker: "PL=F"  }, { label: "Palladium",ticker: "PA=F"  },
    { label: "Copper",   ticker: "HG=F"  },
    { label: "Oil WTI",  ticker: "CL=F"  }, { label: "Oil Brent",ticker: "BZ=F"  },
    { label: "Nat Gas",  ticker: "NG=F"  }, { label: "Gasoline", ticker: "RB=F"  },
    { label: "Heating Oil",ticker:"HO=F" },
    { label: "Wheat",    ticker: "ZW=F"  }, { label: "Corn",     ticker: "ZC=F"  },
    { label: "Soybeans", ticker: "ZS=F"  }, { label: "Coffee",   ticker: "KC=F"  },
    { label: "Sugar",    ticker: "SB=F"  }, { label: "Cotton",   ticker: "CT=F"  },
    { label: "Cocoa",    ticker: "CC=F"  }, { label: "Lumber",   ticker: "LBS=F" },
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
  { label: "1×",   ms: 1200 },
  { label: "2×",   ms: 700  },
  { label: "3×",   ms: 400  },
  { label: "5×",   ms: 220  },
  { label: "10×",  ms: 110  },
];

const ALL_SYMBOLS = (Object.keys(SYMBOLS) as Category[]).flatMap((cat) =>
  SYMBOLS[cat].map((s) => ({ ...s, category: cat }))
);

/* ── Helpers ──────────────────────────────────────────────────── */
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

function fmtMoney(n: number): string {
  const sign = n < 0 ? "-" : "";
  const a = Math.abs(n);
  return `${sign}$${a.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function barDate(ts: number, interval: string): string {
  const d = new Date(ts * 1000);
  if (interval === "1d" || interval === "1wk")
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const SEP = () => (
  <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.09)", flexShrink: 0 }} />
);

/* ── Trading state types ──────────────────────────────────────── */
type Side = "buy" | "sell";
interface OpenPos {
  id: string;
  side: Side;
  size: number;
  entry: number;
  sl: number | null;
  tp: number | null;
  openBar: number;
  openTime: number;
}
interface ClosedTrade {
  id: string;
  side: Side;
  size: number;
  entry: number;
  exit: number;
  sl: number | null;
  tp: number | null;
  pnl: number;
  reason: "TP" | "SL" | "Manual" | "Session End";
  openTime: number;
  closeTime: number;
}
interface JournalEntry {
  id: string;
  time: number;
  text: string;
  kind: "open" | "close" | "note";
  pnl?: number;
}

const CONTRACT = 100;
const START_BALANCE = 10000;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/* ── Main page ────────────────────────────────────────────────── */
export default function BacktestPage() {
  const [ticker,      setTicker]      = useState("EURUSD=X");
  const [tickerLabel, setTickerLabel] = useState("EUR/USD");
  const [interval,    setInterval]    = useState("1h");
  const [period,      setPeriod]      = useState("1y");

  const [allBars,    setAllBars]    = useState<OHLCVBar[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const [isPlaying,    setIsPlaying]    = useState(false);
  const [speedIdx,     setSpeedIdx]     = useState(2);
  const [speedOpen,    setSpeedOpen]    = useState(false);
  const [periodOpen,   setPeriodOpen]   = useState(false);
  const [panelOpen,    setPanelOpen]    = useState(true);
  const [userTab,      setUserTab]      = useState<"trade" | "positions" | "journal" | "stats">("trade");

  const [searchOpen,   setSearchOpen]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");

  const [activeTool,      setActiveTool]      = useState<DrawingTool>("pointer");
  const [drawColor,       setDrawColor]       = useState("#3b82f6");
  const [drawWidth,       setDrawWidth]       = useState(2);
  const [drawings,        setDrawings]        = useState<Drawing[]>([]);
  const [candleUpColor,   setCandleUpColor]   = useState("#22c55e");
  const [candleDownColor, setCandleDownColor] = useState("#ef4444");
  const [liveBar,         setLiveBar]         = useState<OHLCVBar | null>(null);

  const [orderSide, setOrderSide] = useState<Side>("buy");
  const [orderSize, setOrderSize] = useState(1);
  const [orderSL,   setOrderSL]   = useState("");
  const [orderTP,   setOrderTP]   = useState("");

  const [positions, setPositions] = useState<OpenPos[]>([]);
  const [closed,    setClosed]    = useState<ClosedTrade[]>([]);
  const [journal,   setJournal]   = useState<JournalEntry[]>([]);
  const [notice,    setNotice]    = useState<string | null>(null);
  const [noteText,  setNoteText]  = useState("");

  const playRef       = useRef<number | null>(null);
  const allBarsRef    = useRef<OHLCVBar[]>([]);
  const positionsRef  = useRef<OpenPos[]>([]);
  const searchRef     = useRef<HTMLDivElement>(null);
  const searchInputRef= useRef<HTMLInputElement>(null);
  const periodRef     = useRef<HTMLDivElement>(null);
  const speedRef      = useRef<HTMLDivElement>(null);
  const lastScanIdx   = useRef(0);
  const noticeTimer   = useRef<number | null>(null);

  /* outside-click for dropdowns */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) { setSearchOpen(false); setSearchQuery(""); }
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
      if (speedRef.current  && !speedRef.current.contains(e.target as Node))  setSpeedOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 40); }, [searchOpen]);
  useEffect(() => () => { if (noticeTimer.current) window.clearTimeout(noticeTimer.current); }, []);

  const flashNotice = useCallback((msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 2600);
  }, []);

  /* filtered symbols */
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

  /* data fetch → new session */
  const loadData = useCallback(async (sym: string, iv: string, per: string) => {
    setLoading(true); setError(null); setIsPlaying(false); setLiveBar(null);
    if (playRef.current !== null) window.clearInterval(playRef.current);
    try {
      const res  = await fetch(`/api/backtesting/ohlcv?symbol=${encodeURIComponent(sym)}&interval=${iv}&period=${per}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Failed to load data");
      const bars: OHLCVBar[] = json.candles;
      setAllBars(bars);
      setCurrentIdx(bars.length > 1 ? Math.floor(bars.length * 0.55) : 0);
      lastScanIdx.current = bars.length > 1 ? Math.floor(bars.length * 0.55) : 0;
      positionsRef.current = [];
      setPositions([]);
      setClosed([]);
      setJournal([{
        id: uid(), time: Date.now() / 1000, kind: "note",
        text: `New session — ${sym} · ${iv} · ${per}. Balance ${fmtMoney(START_BALANCE)}`,
      }]);
    } catch (e: any) {
      setError(e.message ?? "Unknown error"); setAllBars([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (!allBars.length) loadData(ticker, interval, period); }, []); // eslint-disable-line

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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") setCurrentIdx((p) => Math.min(p + 1, allBars.length - 1));
      if (e.key === "ArrowLeft")  setCurrentIdx((p) => Math.max(p - 1, 0));
      if (e.key === " ")          { e.preventDefault(); setIsPlaying((p) => !p); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [allBars.length]);

  /* live quote polling */
  const isAtEnd = allBars.length > 0 && currentIdx >= allBars.length - 1;
  const isAtEndRef = useRef(false);
  useEffect(() => { isAtEndRef.current = isAtEnd; }, [isAtEnd]);
  useEffect(() => { allBarsRef.current = allBars; }, [allBars]);
  useEffect(() => { positionsRef.current = positions; }, [positions]);

  useEffect(() => {
    if (!allBars.length) return;
    let cancelled = false;
    const poll = async () => {
      if (!isAtEndRef.current) return;
      try {
        const res = await fetch(`/api/backtesting/quote?symbol=${encodeURIComponent(ticker)}`);
        if (!res.ok || cancelled) return;
        const d = await res.json();
        const bars = allBarsRef.current;
        const lastBarTime = bars.length > 0 ? bars[bars.length - 1].time : 0;
        const computedTime = barOpenTime(d.time, interval);
        const safeTime = Math.max(computedTime, lastBarTime);
        setLiveBar({
          time: safeTime, open: d.open, high: d.high,
          low: d.low, close: d.price, volume: d.volume,
        });
      } catch { /* skip */ }
    };
    poll();
    const iv = window.setInterval(poll, 5000);
    return () => { cancelled = true; window.clearInterval(iv); };
  }, [allBars.length, ticker, interval]);

  /* SL/TP engine — sweep un-scanned bars */
  useEffect(() => {
    if (!allBars.length) return;
    if (currentIdx <= lastScanIdx.current) return;

    const newlyClosed: ClosedTrade[] = [];
    let remaining = positionsRef.current.slice();

    for (let i = lastScanIdx.current + 1; i <= currentIdx; i++) {
      const b = allBars[i];
      if (!b) break;
      const still: OpenPos[] = [];
      for (const p of remaining) {
        let exit: number | null = null;
        let reason: ClosedTrade["reason"] | null = null;
        if (p.side === "buy") {
          if (p.sl !== null && b.low <= p.sl)      { exit = p.sl; reason = "SL"; }
          else if (p.tp !== null && b.high >= p.tp) { exit = p.tp; reason = "TP"; }
        } else {
          if (p.sl !== null && b.high >= p.sl)      { exit = p.sl; reason = "SL"; }
          else if (p.tp !== null && b.low <= p.tp)  { exit = p.tp; reason = "TP"; }
        }
        if (exit !== null && reason !== null) {
          const dir = p.side === "buy" ? 1 : -1;
          const pnl = dir * (exit - p.entry) * p.size * CONTRACT;
          newlyClosed.push({ id: p.id, side: p.side, size: p.size, entry: p.entry, exit, sl: p.sl, tp: p.tp, pnl, reason, openTime: p.openTime, closeTime: b.time });
        } else {
          still.push(p);
        }
      }
      remaining = still;
      if (!remaining.length) break;
    }
    lastScanIdx.current = currentIdx;
    if (newlyClosed.length) {
      positionsRef.current = remaining;
      setPositions(remaining);
      setClosed((prev) => [...newlyClosed, ...prev]);
      const entries: JournalEntry[] = newlyClosed.map((c) => ({
        id: uid(), time: c.closeTime, kind: "close", pnl: c.pnl,
        text: `${c.side.toUpperCase()} ${c.size} → ${c.reason} ${fmtMoney(c.pnl)}`,
      }));
      setJournal((prev) => [...entries, ...prev]);
    }
  }, [currentIdx, allBars]);

  /* derived */
  const visibleBars = allBars.slice(0, currentIdx + 1);
  const currentBar  = visibleBars[visibleBars.length - 1];
  const firstBar    = visibleBars[0];
  const changePct   = currentBar && firstBar ? ((currentBar.close - firstBar.open) / firstBar.open) * 100 : null;
  const sessionHigh = visibleBars.length ? Math.max(...visibleBars.map((b) => b.high)) : null;
  const sessionLow  = visibleBars.length ? Math.min(...visibleBars.map((b) => b.low))  : null;
  const atr         = visibleBars.length >= 2 ? calcATR(visibleBars) : null;
  const progress    = allBars.length > 1 ? (currentIdx / (allBars.length - 1)) * 100 : 0;

  const execPrice = currentBar ? currentBar.close : 0;
  const unrealized = positions.reduce((s, p) => {
    if (!currentBar) return s;
    const dir = p.side === "buy" ? 1 : -1;
    return s + dir * (execPrice - p.entry) * p.size * CONTRACT;
  }, 0);
  const realized = closed.reduce((s, c) => s + c.pnl, 0);
  const balance  = START_BALANCE + realized;
  const equity   = balance + unrealized;

  const wins   = closed.filter((c) => c.pnl > 0).length;
  const grossW = closed.filter((c) => c.pnl > 0).reduce((s, c) => s + c.pnl, 0);
  const grossL = Math.abs(closed.filter((c) => c.pnl < 0).reduce((s, c) => s + c.pnl, 0));
  const pf     = grossL > 0 ? grossW / grossL : grossW > 0 ? Infinity : 0;

  const move = (delta: number) => setCurrentIdx((p) => Math.max(0, Math.min(p + delta, allBars.length - 1)));

  /* symbol pick */
  const pickSymbol = (sym: { label: string; ticker: string }) => {
    setTicker(sym.ticker); setTickerLabel(sym.label);
    setSearchOpen(false); setSearchQuery("");
    loadData(sym.ticker, interval, period);
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (filteredSymbols.length > 0) { pickSymbol(filteredSymbols[0]); return; }
      const t = searchQuery.trim().toUpperCase();
      if (t) { setTicker(t); setTickerLabel(t); setSearchOpen(false); setSearchQuery(""); loadData(t, interval, period); }
    }
    if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
  };

  /* trading actions */
  const placeOrder = (side: Side) => {
    if (!currentBar || !allBars.length) return;
    if (orderSize <= 0) { flashNotice("Position size must be > 0"); return; }
    const sl = orderSL ? Number(orderSL) : null;
    const tp = orderTP ? Number(orderTP) : null;
    const pos: OpenPos = {
      id: uid(), side, size: orderSize, entry: execPrice,
      sl, tp, openBar: currentIdx, openTime: currentBar.time,
    };
    positionsRef.current = [...positionsRef.current, pos];
    setPositions(positionsRef.current);
    setJournal((prev) => [{
      id: uid(), time: currentBar.time, kind: "open",
      text: `${side.toUpperCase()} ${orderSize} lot @ ${fmtPrice(execPrice)}${sl ? ` · SL ${fmtPrice(sl)}` : ""}${tp ? ` · TP ${fmtPrice(tp)}` : ""}`,
    }, ...prev]);
    flashNotice(`${side.toUpperCase()} ${orderSize} lot @ ${fmtPrice(execPrice)}`);
  };

  const closePos = (id: string) => {
    const p = positionsRef.current.find((x) => x.id === id);
    if (!p || !currentBar) return;
    const dir = p.side === "buy" ? 1 : -1;
    const pnl = dir * (execPrice - p.entry) * p.size * CONTRACT;
    const rest = positionsRef.current.filter((x) => x.id !== id);
    positionsRef.current = rest;
    setPositions(rest);
    setClosed((prev) => [{
      id: p.id, side: p.side, size: p.size, entry: p.entry, exit: execPrice,
      sl: p.sl, tp: p.tp, pnl, reason: "Manual",
      openTime: p.openTime, closeTime: currentBar.time,
    }, ...prev]);
    setJournal((prev) => [{
      id: uid(), time: currentBar.time, kind: "close", pnl,
      text: `${p.side.toUpperCase()} ${p.size} lot closed @ ${fmtPrice(execPrice)} · ${fmtMoney(pnl)}`,
    }, ...prev]);
  };

  const resetSession = () => {
    setIsPlaying(false);
    positionsRef.current = [];
    setPositions([]); setClosed([]); setJournal([]);
    setCurrentIdx(0); lastScanIdx.current = 0;
    if (allBars.length) setCurrentIdx(Math.max(0, Math.floor(allBars.length * 0.55)));
    flashNotice("Session reset");
  };

  const addNote = () => {
    if (!noteText.trim()) return;
    setJournal((prev) => [{ id: uid(), time: Date.now() / 1000, kind: "note", text: noteText.trim() }, ...prev]);
    setNoteText("");
  };

  return (
    <div
      className="flex flex-col h-screen select-none overflow-hidden"
      style={{ background: FX.bg, color: FX.text }}
    >
      {/* ── Top app bar ─────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center gap-1.5 px-2 h-[46px]"
        style={{ borderBottom: `1px solid ${FX.border}`, background: FX.panel }}
      >
        <Link
          href="/app"
          className="flex items-center justify-center rounded-lg flex-shrink-0 transition-colors hover:bg-white/5"
          style={{ width: 30, height: 30 }}
        >
          <ArrowLeft className="w-4 h-4" style={{ color: "rgba(148,163,184,0.7)" }} />
        </Link>

        <div className="flex items-center gap-2 pl-1 pr-2 flex-shrink-0">
          <div
            className="flex items-center justify-center rounded-md"
            style={{ width: 24, height: 24, background: "linear-gradient(135deg,#3b82f6,#22d3ee)", color: "#fff" }}
          >
            {activeTool !== "pointer" ? <Pencil className="w-3.5 h-3.5" /> : <BarChart3 className="w-3.5 h-3.5" />}
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[12px] font-bold" style={{ color: "#fff" }}>Backtest</span>
            <span className="text-[8px] font-semibold tracking-[0.16em]" style={{ color: FX.dim }}>TRADING LAB</span>
          </div>
        </div>

        <SEP />

        {/* Symbol picker */}
        <div ref={searchRef} className="relative flex-shrink-0">
          <button
            onClick={() => setSearchOpen((p) => !p)}
            className="flex items-center gap-2 px-2.5 rounded-lg h-8 transition-all"
            style={{
              background: searchOpen ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.04)",
              border: searchOpen ? "1px solid rgba(59,130,246,0.45)" : `1px solid ${FX.border2}`,
              minWidth: 100,
            }}
          >
            <span className="text-[13px] font-bold" style={{ color: "#fff" }}>{tickerLabel}</span>
            <ChevronDown className="w-3 h-3 transition-transform" style={{ color: "rgba(100,116,139,0.5)", transform: searchOpen ? "rotate(180deg)" : "none" }} />
          </button>

          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.13 }}
                className="absolute top-full mt-1.5 left-0 z-50 rounded-2xl overflow-hidden"
                style={{
                  width: 360,
                  background: "rgba(15,20,32,0.99)",
                  border: `1px solid ${FX.border2}`,
                  boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
                }}
              >
                <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: `1px solid ${FX.border}` }}>
                  <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: FX.dim }} />
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKey}
                    placeholder="Search by name or ticker…"
                    className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-slate-700"
                    style={{ color: "#fff", caretColor: FX.blue }}
                  />
                  {searchQuery ? (
                    <button onClick={() => setSearchQuery("")}><X className="w-3 h-3" style={{ color: FX.dim }} /></button>
                  ) : (
                    <span className="text-[9px] font-mono flex-shrink-0" style={{ color: FX.dim }}>{ALL_SYMBOLS.length} symbols</span>
                  )}
                </div>
                <SymbolDropdown
                  grouped={grouped}
                  filteredSymbols={filteredSymbols}
                  searchQuery={searchQuery}
                  ticker={ticker}
                  onPick={pickSymbol}
                  onCustom={() => {
                    const t = searchQuery.trim().toUpperCase();
                    if (t) { setTicker(t); setTickerLabel(t); setSearchOpen(false); setSearchQuery(""); loadData(t, interval, period); }
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <SEP />

        {/* Timeframe chips */}
        <div className="hidden md:flex items-center gap-0.5 flex-shrink-0">
          {INTERVALS.map((tf) => {
            const active = interval === tf.value;
            return (
              <button
                key={tf.value}
                onClick={() => setInterval(tf.value)}
                className="h-8 px-2 rounded-md text-[10px] font-bold transition-all"
                style={{
                  background:  active ? "rgba(59,130,246,0.14)" : "transparent",
                  color:       active ? "#60a5fa" : "rgba(148,163,184,0.45)",
                  border:      active ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
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
            className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-[10px] font-bold transition-all"
            style={{
              background: periodOpen ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${FX.border2}`,
              color: "rgba(148,163,184,0.6)",
            }}
          >
            {PERIODS.find((p) => p.value === period)?.label ?? period}
            <ChevronDown className="w-3 h-3" style={{ color: FX.dim }} />
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
                  background: "rgba(15,20,32,0.99)",
                  border: `1px solid ${FX.border2}`,
                  minWidth: 84,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                }}
              >
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => { setPeriod(p.value); setPeriodOpen(false); }}
                    className="w-full text-left px-3 py-2 text-[10px] font-bold transition-colors"
                    style={{
                      color: period === p.value ? "#60a5fa" : "rgba(148,163,184,0.55)",
                      background: period === p.value ? "rgba(59,130,246,0.08)" : "transparent",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Load session */}
        <button
          onClick={() => loadData(ticker, interval, period)}
          disabled={loading}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-bold transition-all flex-shrink-0"
          style={{
            background: loading ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.16)",
            border: "1px solid rgba(59,130,246,0.35)",
            color: loading ? "rgba(96,165,250,0.5)" : "#93c5fd",
          }}
        >
          {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
          {loading ? "Loading" : "Session"}
        </button>

        <div className="flex-1" />

        {/* Account readouts */}
        <MoneyChip label="Balance" value={fmtMoney(balance)} color="#fff" />
        <MoneyChip label="Equity" value={fmtMoney(equity)} color={unrealized >= 0 ? FX.up : FX.down} />
        <MoneyChip label="Un. P&L" value={fmtMoney(unrealized)} color={unrealized >= 0 ? FX.up : FX.down} />

        <SEP />

        {/* OHLC */}
        {currentBar && (
          <div className="hidden xl:flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-mono" style={{ color: FX.dim }}>{barDate(currentBar.time, interval)}</span>
            <span className="text-[10px] font-mono tracking-wide" style={{ color: "rgba(148,163,184,0.5)" }}>
              O <span style={{ color: "#94a3b8" }}>{fmtPrice(currentBar.open)}</span>
              {" "}H <span style={{ color: FX.up }}>{fmtPrice(currentBar.high)}</span>
              {" "}L <span style={{ color: FX.down }}>{fmtPrice(currentBar.low)}</span>
              {" "}C <span style={{ color: currentBar.close >= currentBar.open ? FX.up : FX.down }}>{fmtPrice(currentBar.close)}</span>
            </span>
          </div>
        )}

        {/* Change badge */}
        {changePct !== null && (
          <div
            className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-bold font-mono flex-shrink-0"
            style={{
              background: changePct >= 0 ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
              border: changePct >= 0 ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(239,68,68,0.25)",
              color: changePct >= 0 ? FX.up : FX.down,
            }}
          >
            {changePct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
          </div>
        )}

        {/* Panel toggle */}
        <button
          onClick={() => setPanelOpen((p) => !p)}
          title="Toggle trading panel"
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors flex-shrink-0"
          style={{
            background: panelOpen ? "rgba(59,130,246,0.12)" : "transparent",
            border: panelOpen ? "1px solid rgba(59,130,246,0.3)" : `1px solid ${FX.border2}`,
            color: panelOpen ? "#60a5fa" : "rgba(148,163,184,0.5)",
          }}
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* ── Replay player bar ────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center gap-1.5 px-2 h-[42px]"
        style={{ borderBottom: `1px solid ${FX.border}`, background: FX.bar }}
      >
        <PlayerBtn title="Jump to start" onClick={() => { setIsPlaying(false); setCurrentIdx(0); lastScanIdx.current = 0; }} disabled={!allBars.length}>
          <SkipBack className="w-3.5 h-3.5" />
        </PlayerBtn>
        <PlayerBtn title="Back 5 bars" onClick={() => move(-5)} disabled={!allBars.length}>
          <ChevronsLeft className="w-3.5 h-3.5" />
          <span className="text-[9px] font-bold">5</span>
        </PlayerBtn>
        <PlayerBtn title="Back 1 bar" onClick={() => move(-1)} disabled={!allBars.length}>
          <SkipBack className="w-3.5 h-3.5" />
        </PlayerBtn>

        <button
          onClick={() => setIsPlaying((p) => !p)}
          disabled={!allBars.length}
          className="flex items-center justify-center rounded-xl transition-all flex-shrink-0"
          style={{
            width: 36, height: 36,
            background: isPlaying ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.14)",
            border: "1px solid rgba(59,130,246,0.4)",
            color: "#93c5fd",
            boxShadow: isPlaying ? "0 0 12px rgba(59,130,246,0.3)" : "none",
            opacity: allBars.length ? 1 : 0.35,
          }}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <PlayerBtn title="Forward 1 bar" onClick={() => move(1)} disabled={!allBars.length}>
          <SkipForward className="w-3.5 h-3.5" />
        </PlayerBtn>
        <PlayerBtn title="Forward 5 bars" onClick={() => move(5)} disabled={!allBars.length}>
          <ChevronsRight className="w-3.5 h-3.5" />
          <span className="text-[9px] font-bold">5</span>
        </PlayerBtn>

        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

        {/* Speed */}
        <div ref={speedRef} className="relative flex-shrink-0">
          <button
            onClick={() => setSpeedOpen((p) => !p)}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[10px] font-bold transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${FX.border2}`,
              color: "rgba(148,163,184,0.6)",
            }}
          >
            <Timer className="w-3 h-3" />
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
                  background: "rgba(15,20,32,0.99)",
                  border: `1px solid ${FX.border2}`,
                  minWidth: 78,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                }}
              >
                {SPEEDS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setSpeedIdx(i); setSpeedOpen(false); }}
                    className="w-full px-3 py-2 text-left text-[11px] font-bold transition-colors"
                    style={{
                      color: speedIdx === i ? "#60a5fa" : "rgba(148,163,184,0.55)",
                      background: speedIdx === i ? "rgba(59,130,246,0.08)" : "transparent",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress */}
        <div className="flex-1 flex items-center gap-2.5 min-w-40">
          <span className="text-[10px] font-mono flex-shrink-0" style={{ color: FX.dim }}>{currentIdx + 1}</span>
          <div className="flex-1 relative h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full pointer-events-none"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg,#3b82f6,#22d3ee)",
                boxShadow: "0 0 8px rgba(59,130,246,0.4)",
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
          <span className="text-[10px] font-mono flex-shrink-0" style={{ color: FX.dim }}>{allBars.length}</span>
        </div>

        {/* Current bar date */}
        <span className="text-[10px] font-mono flex-shrink-0 hidden md:block" style={{ color: "rgba(148,163,184,0.5)" }}>
          {currentBar ? barDate(currentBar.time, interval) : "—"}
        </span>

        <button
          onClick={resetSession}
          title="Reset session"
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 hover:bg-white/5"
          style={{ color: FX.dim }}
        >
          <Reset className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Main workspace ───────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex">
        {/* Chart */}
        <div className="flex-1 min-w-0 flex flex-col relative">
          {/* Drawing toolbar (floating at top-left of the chart) */}
          <div
            className="absolute top-2 left-2 z-20 flex items-center gap-1.5 rounded-xl px-1.5 py-1"
            style={{ background: "rgba(10,14,23,0.85)", border: `1px solid ${FX.border}`, backdropFilter: "blur(8px)" }}
          >
            <DrawTools
              tool={activeTool}
              onTool={setActiveTool}
              color={drawColor}
              onColor={setDrawColor}
              width={drawWidth}
              onWidth={setDrawWidth}
              onClear={() => setDrawings([])}
              drawingsCount={drawings.length}
            />
          </div>

          {/* Chart */}
          <div className="flex-1 min-h-0 relative">
            {!allBars.length && !loading && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <motion.div animate={{ opacity: [0.25, 0.6, 0.25] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                  <BarChart3 className="w-9 h-9" style={{ color: "rgba(59,130,246,0.35)" }} />
                </motion.div>
                <p className="text-[13px]" style={{ color: "rgba(148,163,184,0.45)" }}>
                  Pick a symbol and start a <span style={{ color: "#60a5fa" }}>session</span>
                </p>
                <p className="text-[11px]" style={{ color: "rgba(100,116,139,0.5)" }}>
                  ← → arrow keys · Space to play/pause
                </p>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <p className="text-[13px]" style={{ color: FX.down }}>Failed to load: {error}</p>
                <button
                  onClick={() => loadData(ticker, interval, period)}
                  className="text-[12px] px-4 py-2 rounded-lg"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: FX.down }}
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

          {/* Notices */}
          <AnimatePresence>
            {notice && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg text-[11px] font-semibold"
                style={{ background: "rgba(13,18,30,0.9)", border: `1px solid ${FX.border2}`, color: "#fff", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}
              >
                {notice}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right trading panel ─────────────────────────────────── */}
        {panelOpen && (
          <div
            className="w-[300px] flex-shrink-0 flex flex-col min-h-0"
            style={{ borderLeft: `1px solid ${FX.border}`, background: FX.panel }}
          >
            <TradePanel
              userTab={userTab}
              setUserTab={setUserTab}
              orderSide={orderSide}
              setOrderSide={setOrderSide}
              orderSize={orderSize}
              setOrderSize={setOrderSize}
              orderSL={orderSL}
              setOrderSL={setOrderSL}
              orderTP={orderTP}
              setOrderTP={setOrderTP}
              onPlace={placeOrder}
              execPrice={execPrice}
              positions={positions}
              onClosePos={closePos}
              closed={closed}
              journal={journal}
              noteText={noteText}
              setNoteText={setNoteText}
              onAddNote={addNote}
              balance={balance}
              equity={equity}
              realized={realized}
              wins={wins}
              closedCount={closed.length}
              pf={pf}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Account money chip ───────────────────────────────────────── */
function MoneyChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="hidden sm:flex flex-col px-2.5 py-1 rounded-lg mr-1 flex-shrink-0"
      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${FX.border}` }}
    >
      <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: FX.dim }}>{label}</span>
      <span className="text-[11px] font-bold font-mono mt-0.5" style={{ color }}>{value}</span>
    </div>
  );
}

/* ── Player control button ────────────────────────────────────── */
function PlayerBtn({ children, onClick, disabled, title }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center justify-center gap-0.5 rounded-lg transition-all flex-shrink-0"
      style={{
        width: 30, height: 30,
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${FX.border}`,
        color: disabled ? "rgba(56,70,92,0.4)" : "rgba(148,163,184,0.7)",
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

/* ── Symbol dropdown ──────────────────────────────────────────── */
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
        <p className="text-[11px]" style={{ color: FX.dim }}>No preset match</p>
        <button
          onClick={onCustom}
          className="mt-2 text-[11px] font-semibold px-3 py-1.5 rounded-lg"
          style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa" }}
        >
          Load &quot;{searchQuery.toUpperCase()}&quot;
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
      {isSearching && filteredSymbols.length > 0 && (
        <div className="px-3 pt-2 pb-1">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: FX.dim }}>
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
            <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cc.color, boxShadow: `0 0 5px ${cc.color}55` }} />
              <span className="text-[9px] font-bold uppercase tracking-widest flex-1" style={{ color: FX.dim }}>{cat}</span>
              <span className="text-[9px] font-mono" style={{ color: FX.dim }}>{items.length}</span>
            </div>

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
                      border: active ? `1px solid rgba(${cc.rgb},0.25)` : "1px solid transparent",
                    }}
                    title={sym.ticker}
                  >
                    {sym.label}
                  </button>
                );
              })}
            </div>

            {!isSearching && items.length > PREVIEW_COUNT && (
              <button
                onClick={() => setExpanded((p) => ({ ...p, [cat]: !isExpanded }))}
                className="w-full text-center py-1 mb-1 text-[10px] font-semibold transition-colors"
                style={{ color: isExpanded ? FX.dim : cc.color }}
              >
                {isExpanded ? "Show less" : `+${items.length - PREVIEW_COUNT} more`}
              </button>
            )}

            <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 12px" }} />
          </div>
        );
      })}

      {isSearching && filteredSymbols.length > 0 && (
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="text-[10px]" style={{ color: FX.dim }}>Not listed?</span>
          <button onClick={onCustom} className="text-[10px] font-semibold" style={{ color: "#60a5fa" }}>
            Use &quot;{searchQuery.toUpperCase()}&quot; →
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Drawing tools ────────────────────────────────────────────── */
const DRAW_TOOLS: { tool: DrawingTool; icon: React.ReactNode; title: string }[] = [
  { tool: "pointer", icon: <MousePointer2 className="w-3.5 h-3.5" />, title: "Pointer"          },
  { tool: "pen",     icon: <Pencil        className="w-3.5 h-3.5" />, title: "Pen"              },
  { tool: "line",    icon: <TrendingUp    className="w-3.5 h-3.5" />, title: "Trend Line"       },
  { tool: "hline",   icon: <Minus         className="w-3.5 h-3.5" />, title: "Horizontal Line"  },
  { tool: "ray",     icon: <ArrowUpRight  className="w-3.5 h-3.5" />, title: "Ray"              },
  { tool: "eraser",  icon: <Eraser        className="w-3.5 h-3.5" />, title: "Eraser"           },
];

const PRESET_COLORS = ["#22d3ee", "#3b82f6", "#22c55e", "#ef4444", "#f59e0b", "#a78bfa", "#f8fafc"];

function DrawTools({
  tool, onTool, color, onColor, width, onWidth, onClear, drawingsCount,
}: {
  tool: DrawingTool;
  onTool: (t: DrawingTool) => void;
  color: string;
  onColor: (c: string) => void;
  width: number;
  onWidth: (w: number) => void;
  onClear: () => void;
  drawingsCount: number;
}) {
  return (
    <>
      <div className="flex items-center gap-0.5">
        {DRAW_TOOLS.map(({ tool: t, icon, title }) => (
          <button
            key={t}
            title={title}
            onClick={() => onTool(t)}
            className="flex items-center justify-center rounded-md transition-all"
            style={{
              width: 26, height: 26,
              background: tool === t ? "rgba(59,130,246,0.16)" : "transparent",
              border: tool === t ? "1px solid rgba(59,130,246,0.4)" : "1px solid transparent",
              color: tool === t ? "#60a5fa" : "rgba(148,163,184,0.45)",
            }}
          >
            {icon}
          </button>
        ))}
      </div>

      <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

      <div className="flex items-center gap-1">
        {PRESET_COLORS.slice(0, 5).map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => onColor(c)}
            className="rounded-full transition-all flex-shrink-0"
            style={{ width: 11, height: 11, background: c, outline: color === c ? `2px solid ${c}` : "2px solid transparent", outlineOffset: 1 }}
          />
        ))}
        <label title="Custom color" className="cursor-pointer flex-shrink-0" style={{ width: 11, height: 11 }}>
          <input type="color" value={color} onChange={(e) => onColor(e.target.value)} className="opacity-0 absolute w-0 h-0" />
          <div className="w-full h-full rounded-full" style={{ background: color, outline: "1.5px solid rgba(255,255,255,0.25)", outlineOffset: 1 }} />
        </label>
      </div>

      <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

      <div className="flex items-center gap-1">
        {[1, 2, 3].map((w) => (
          <button
            key={w}
            title={`Width ${w}`}
            onClick={() => onWidth(w)}
            className="flex items-center justify-center rounded transition-all flex-shrink-0"
            style={{ width: 20, height: 20, background: width === w ? "rgba(59,130,246,0.12)" : "transparent", border: width === w ? "1px solid rgba(59,130,246,0.4)" : "1px solid transparent" }}
          >
            <div className="rounded-full" style={{ width: 6 + w * 2, height: w, background: width === w ? "#60a5fa" : "rgba(148,163,184,0.35)" }} />
          </button>
        ))}
      </div>

      {drawingsCount > 0 && (
        <>
          <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
          <button
            title="Clear all drawings"
            onClick={onClear}
            className="flex items-center gap-1 px-1.5 h-6 rounded text-[9px] font-semibold transition-all flex-shrink-0"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "rgba(248,113,113,0.7)" }}
          >
            <Trash2 className="w-3 h-3" />
            {drawingsCount}
          </button>
        </>
      )}
    </>
  );
}

/* ── Trading panel ────────────────────────────────────────────── */
const PANEL_TABS: { id: "trade" | "positions" | "journal" | "stats"; label: string; icon: React.ReactNode }[] = [
  { id: "trade",     label: "Trade",     icon: <Zap className="w-3 h-3" />      },
  { id: "positions", label: "Positions", icon: <Wallet className="w-3 h-3" />    },
  { id: "journal",   label: "Journal",   icon: <NotebookPen className="w-3 h-3" /> },
  { id: "stats",     label: "Stats",     icon: <PieChart className="w-3 h-3" />   },
];

function TradePanel({
  userTab, setUserTab,
  orderSide, setOrderSide,
  orderSize, setOrderSize,
  orderSL, setOrderSL,
  orderTP, setOrderTP,
  onPlace, execPrice,
  positions, onClosePos,
  closed, journal, noteText, setNoteText, onAddNote,
  balance, equity, realized, wins, closedCount, pf,
}: {
  userTab: "trade" | "positions" | "journal" | "stats";
  setUserTab: (t: "trade" | "positions" | "journal" | "stats") => void;
  orderSide: Side; setOrderSide: (s: Side) => void;
  orderSize: number; setOrderSize: (n: number) => void;
  orderSL: string; setOrderSL: (s: string) => void;
  orderTP: string; setOrderTP: (s: string) => void;
  onPlace: (s: Side) => void;
  execPrice: number;
  positions: OpenPos[];
  onClosePos: (id: string) => void;
  closed: ClosedTrade[];
  journal: JournalEntry[];
  noteText: string; setNoteText: (s: string) => void; onAddNote: () => void;
  balance: number; equity: number; realized: number; wins: number; closedCount: number; pf: number;
}) {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Account summary */}
      <div
        className="grid grid-cols-3 gap-px flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.05)", borderBottom: `1px solid ${FX.border}` }}
      >
        <MiniStat label="Balance" value={fmtMoney(balance)} />
        <MiniStat label="Equity" value={fmtMoney(equity)} idx={1} />
        <MiniStat label="Realized" value={fmtMoney(realized)} up={realized >= 0} />
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex items-stretch px-1.5 pt-1.5 gap-1" style={{ background: FX.panel }}>
        {PANEL_TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setUserTab(id)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-t-lg text-[10px] font-bold transition-all"
            style={{
              background: userTab === id ? "rgba(59,130,246,0.1)" : "transparent",
              color: userTab === id ? "#60a5fa" : "rgba(148,163,184,0.45)",
              borderBottom: userTab === id ? `2px solid ${FX.blue}` : "2px solid transparent",
            }}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2" style={{ background: FX.panel2 }}>
        {userTab === "trade" && (
          <div className="flex flex-col gap-2">
            {/* Buy / Sell */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onPlace("buy")}
                className="py-2.5 rounded-lg font-bold text-[12px] transition-all"
                style={{
                  background: orderSide === "buy" ? "rgba(34,197,94,0.18)" : "rgba(34,197,94,0.1)",
                  border: `1px solid ${orderSide === "buy" ? "rgba(34,197,94,0.5)" : "rgba(34,197,94,0.25)"}`,
                  color: "#4ade80",
                  boxShadow: orderSide === "buy" ? "0 0 12px rgba(34,197,94,0.2)" : "none",
                }}
                onMouseEnter={() => setOrderSide("buy")}
              >
                BUY
              </button>
              <button
                onClick={() => onPlace("sell")}
                className="py-2.5 rounded-lg font-bold text-[12px] transition-all"
                style={{
                  background: orderSide === "sell" ? "rgba(239,68,68,0.18)" : "rgba(239,68,68,0.1)",
                  border: `1px solid ${orderSide === "sell" ? "rgba(239,68,68,0.5)" : "rgba(239,68,68,0.25)"}`,
                  color: "#f87171",
                  boxShadow: orderSide === "sell" ? "0 0 12px rgba(239,68,68,0.2)" : "none",
                }}
                onMouseEnter={() => setOrderSide("sell")}
              >
                SELL
              </button>
            </div>

            {/* Entry price */}
            <div className="mt-1 flex items-center justify-between px-2 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${FX.border}` }}>
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: FX.dim }}>Market price</span>
              <span className="text-[12px] font-bold font-mono" style={{ color: "#fff" }}>{execPrice ? fmtPrice(execPrice) : "—"}</span>
            </div>

            {/* Size */}
            <SizeBlock orderSize={orderSize} setOrderSize={setOrderSize} />

            {/* SL / TP */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <LabelInput label="Stop Loss" value={orderSL} onChange={setOrderSL} placeholder="auto" color={FX.down} />
              <LabelInput label="Take Profit" value={orderTP} onChange={setOrderTP} placeholder="—" color={FX.up} />
            </div>

            <p className="text-[8px] mt-1.5 text-center" style={{ color: FX.dim }}>
              P&L = (exit − entry) × {CONTRACT} × lots · balance starts at {fmtMoney(START_BALANCE)}
            </p>
          </div>
        )}

        {userTab === "positions" && (
          <div className="flex flex-col gap-1.5">
            <p className="text-[9px] font-bold uppercase tracking-widest px-1" style={{ color: FX.dim }}>
              Open · {positions.length}
            </p>
            {positions.length === 0 && (
              <div className="text-center py-8">
                <Wallet className="w-6 h-6 mx-auto mb-2" style={{ color: FX.dim }} />
                <p className="text-[11px]" style={{ color: FX.dim }}>No open positions</p>
                <p className="text-[9px]" style={{ color: "rgba(71,85,105,0.5)" }}>Go to Trade to place an order</p>
              </div>
            )}
            {positions.map((p) => {
              const dir = p.side === "buy" ? 1 : -1;
              const pnl = dir * (execPrice - p.entry) * p.size * CONTRACT;
              return (
                <div key={p.id} className="rounded-xl p-2" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${FX.border}` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold" style={{ color: p.side === "buy" ? FX.up : FX.down }}>
                      {p.side === "buy" ? "LONG" : "SHORT"} · {p.size} lots
                    </span>
                    <span className="text-[11px] font-bold font-mono" style={{ color: pnl >= 0 ? FX.up : FX.down }}>{fmtMoney(pnl)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] font-mono" style={{ color: FX.dim }}>Entry {fmtPrice(p.entry)}</span>
                    <span className="text-[9px] font-mono" style={{ color: FX.dim }}>
                      {p.sl ? `SL ${fmtPrice(p.sl)}` : ""}{p.sl && p.tp ? " · " : ""}{p.tp ? `TP ${fmtPrice(p.tp)}` : ""}
                    </span>
                  </div>
                  <button
                    onClick={() => onClosePos(p.id)}
                    className="mt-1.5 w-full py-1 text-[10px] font-bold rounded-lg"
                    style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa" }}
                  >
                    Close → {fmtPrice(execPrice)}
                  </button>
                </div>
              );
            })}

            <p className="text-[9px] font-bold uppercase tracking-widest px-1 mt-2" style={{ color: FX.dim }}>
              Closed · {closed.length}
            </p>
            {closed.slice(0, 12).map((c) => (
              <div key={c.id} className="rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${FX.border}` }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold" style={{ color: c.side === "buy" ? FX.up : FX.down }}>
                    {c.side === "buy" ? "LONG" : "SHORT"}
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: c.pnl >= 0 ? FX.up : FX.down }}>{fmtMoney(c.pnl)}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[9px] font-mono" style={{ color: FX.dim }}>
                    {fmtPrice(c.entry)} → {fmtPrice(c.exit)}
                  </span>
                  <span className="text-[8px] font-semibold" style={{ color: FX.dim }}>{c.reason}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {userTab === "journal" && (
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-col gap-1.5">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Journal note… (e.g. why this trade)"
                className="w-full bg-transparent text-[11px] outline-none resize-none rounded-lg px-2 py-1.5"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${FX.border}`, color: "#fff", minHeight: 56 }}
              />
              <button
                onClick={onAddNote}
                className="py-1 text-[10px] font-bold rounded-lg"
                style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa" }}
              >
                Add note
              </button>
            </div>
            <div className="flex flex-col gap-1 mt-1">
              {journal.map((e) => (
                <div key={e.id} className="rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${FX.border}` }}>
                  <p className="text-[10px] leading-snug" style={{ color: e.kind === "close" ? (e.pnl && e.pnl >= 0 ? FX.up : e.pnl && e.pnl < 0 ? FX.down : "#e2e8f0") : "#e2e8f0" }}>
                    {e.text}
                  </p>
                  <span className="text-[8px] font-mono" style={{ color: FX.dim }}>
                    {new Date(e.time * 1000).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {userTab === "stats" && (
          <div className="flex flex-col gap-1.5">
            <StatRow label="Total trades" value={String(closedCount)} />
            <StatRow label="Wins" value={String(wins)} />
            <StatRow label="Win rate" value={closedCount ? `${((wins / closedCount) * 100).toFixed(1)}%` : "—"} />
            <StatRow label="Profit factor" value={pf === Infinity ? "∞" : closedCount ? pf.toFixed(2) : "—"} />
            <StatRow label="Net P&L" value={fmtMoney(realized)} up={realized >= 0} />
            <div className="mt-1 rounded-lg p-2" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${FX.border}` }}>
              <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: FX.dim }}>Session</p>
              <p className="text-[10px] mt-1" style={{ color: FX.muted }}>Replay candles to execute fake trades. P&L uses a fixed {CONTRACT} monetary scale per lot — good for practising structure, entries and risk management.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, idx, up }: { label: string; value: string; idx?: number; up?: boolean }) {
  return (
    <div className="flex flex-col px-2 py-1.5" style={{ background: "rgba(11,15,23,0.6)" }}>
      <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: FX.dim }}>{label}</span>
      <span className="text-[11px] font-bold font-mono mt-0.5" style={{ color: up !== undefined ? (up ? FX.up : FX.down) : idx === 1 ? FX.up : "#fff" }}>
        {value}
      </span>
    </div>
  );
}

function SizeBlock({ orderSize, setOrderSize }: { orderSize: number; setOrderSize: (n: number) => void }) {
  const sizes = [0.25, 0.5, 1, 2, 5, 10];
  return (
    <div className="mt-1.5">
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: FX.dim }}>Size</span>
        <span className="text-[11px] font-bold font-mono" style={{ color: "#fff" }}>{orderSize} lots</span>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {sizes.map((s) => (
          <button
            key={s}
            onClick={() => setOrderSize(s)}
            className="py-1 text-[9px] font-bold rounded-md transition-all"
            style={{
              background: orderSize === s ? "rgba(59,130,246,0.14)" : "rgba(255,255,255,0.03)",
              border: orderSize === s ? "1px solid rgba(59,130,246,0.4)" : `1px solid ${FX.border}`,
              color: orderSize === s ? "#60a5fa" : "rgba(148,163,184,0.55)",
            }}
          >
            {s}
          </button>
        ))}
      </div>
      <input
        type="range"
        min={0.1}
        max={10}
        step={0.1}
        value={orderSize}
        onChange={(e) => setOrderSize(Number(e.target.value))}
        className="w-full mt-1.5"
        style={{ accentColor: FX.blue }}
      />
    </div>
  );
}

function LabelInput({ label, value, onChange, placeholder, color }: {
  label: string; value: string; onChange: (s: string) => void; placeholder?: string; color?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: FX.dim }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type="text"
        className="w-full bg-transparent text-[11px] font-mono outline-none rounded-lg px-2 py-1.5"
        style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${FX.border}`, color: color ?? "#fff" }}
      />
    </label>
  );
}

function StatRow({ label, value, up }: { label: string; value: string; up?: boolean }) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${FX.border}` }}>
      <span className="text-[10px]" style={{ color: FX.dim }}>{label}</span>
      <span className="text-[11px] font-bold font-mono" style={{ color: up !== undefined ? (up ? FX.up : FX.down) : "#d3dbe8" }}>{value}</span>
    </div>
  );
}