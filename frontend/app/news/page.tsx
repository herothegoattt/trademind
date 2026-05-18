"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft, Search, RefreshCw, AlertCircle, Clock,
  Calendar, TrendingUp, TrendingDown, Minus, X, Zap,
} from "lucide-react";
import { NewsItem } from "../../lib/newsProvider";
import { useDashboardStore } from "../../lib/store";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const REFRESH_MS = 15 * 60 * 1000;

const IC = {
  high:   { hex: "#ef4444", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.30)",  short: "HIGH", label: "High Impact"   },
  medium: { hex: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.30)", short: "MED",  label: "Medium Impact" },
  low:    { hex: "#10b981", bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.30)", short: "LOW",  label: "Low Impact"    },
} as const;

const FLAGS: Record<string, string> = {
  USD:"🇺🇸", CAD:"🇨🇦", MXN:"🇲🇽", BRL:"🇧🇷",
  EUR:"🇪🇺", GBP:"🇬🇧", CHF:"🇨🇭", SEK:"🇸🇪", NOK:"🇳🇴", DKK:"🇩🇰",
  CNY:"🇨🇳", JPY:"🇯🇵", AUD:"🇦🇺", NZD:"🇳🇿", SGD:"🇸🇬",
  KRW:"🇰🇷", HKD:"🇭🇰", INR:"🇮🇳", ZAR:"🇿🇦",
};

const REGION: Record<string, string> = {
  USD:"Americas", CAD:"Americas", MXN:"Americas", BRL:"Americas",
  EUR:"Europe",   GBP:"Europe",   CHF:"Europe",   SEK:"Europe",   NOK:"Europe", DKK:"Europe",
  CNY:"Asia",     JPY:"Asia",     AUD:"Asia",     NZD:"Asia",     SGD:"Asia",   HKD:"Asia",  KRW:"Asia",
};

const TABS = ["All News", "High Impact", "Americas", "Europe", "Asia"] as const;
type Tab = typeof TABS[number];

// ─────────────────────────────────────────────────────────────────────────────
// Instrument mapping
// ─────────────────────────────────────────────────────────────────────────────

interface Instruments { forex: string[]; metals: string[]; indices: string[] }

const FOREX_BASE: Record<string, string[]> = {
  USD: ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "USD/CAD"],
  EUR: ["EUR/USD", "EUR/GBP", "EUR/JPY", "EUR/CHF"],
  GBP: ["GBP/USD", "EUR/GBP", "GBP/JPY", "GBP/CHF"],
  JPY: ["USD/JPY", "EUR/JPY", "GBP/JPY", "CHF/JPY"],
  CAD: ["USD/CAD", "CAD/JPY", "AUD/CAD"],
  AUD: ["AUD/USD", "AUD/JPY", "AUD/NZD", "AUD/CAD"],
  NZD: ["NZD/USD", "AUD/NZD", "NZD/JPY"],
  CHF: ["USD/CHF", "EUR/CHF", "GBP/CHF", "CHF/JPY"],
  CNY: ["USD/CNH", "AUD/USD"],
  SGD: ["USD/SGD"],
};

const METALS_BASE: Record<string, string[]> = {
  USD: ["XAU/USD", "XAG/USD"],
  EUR: ["XAU/EUR"],
  JPY: ["XAU/JPY"],
  GBP: ["XAU/GBP"],
};

const INDICES_BASE: Record<string, string[]> = {
  USD: ["SPX500", "NAS100", "US30"],
  EUR: ["DAX40",  "EURO50", "FRA40"],
  GBP: ["FTSE100"],
  JPY: ["JP225"],
  CNY: ["CN50"],
  AUD: ["AUS200"],
  CAD: ["TSX60"],
  HKD: ["HK50"],
  KRW: ["KR200"],
};

function getInstruments(country?: string, title?: string): Instruments {
  const t = (title ?? "").toLowerCase();
  const c = country ?? "";

  let forex   = [...(FOREX_BASE[c]   ?? [])];
  let metals  = [...(METALS_BASE[c]  ?? [])];
  let indices = [...(INDICES_BASE[c] ?? [])];

  // Title keyword overrides ─────────────────────────────────────────────────
  if (t.match(/\bgold\b|xau/))                    { metals.unshift("XAU/USD"); }
  if (t.match(/\bsilver\b|xag/))                  { metals.push("XAG/USD"); }
  if (t.match(/platinum|xpt/))                    { metals.push("XPT/USD"); }
  if (t.match(/palladium/))                       { metals.push("XPD/USD"); }
  if (t.match(/oil|crude|wti/))                   { metals.push("WTI/USD"); }
  if (t.match(/brent/))                           { metals.push("BRENT"); }
  if (t.match(/natural gas/))                     { metals.push("NATGAS"); }
  if (t.match(/bitcoin|btc|crypto/))              { metals.push("BTC/USD"); }
  if (t.match(/nasdaq|tech|high.tech/))           { indices.unshift("NAS100"); }
  if (t.match(/s&p|spx/))                         { indices.unshift("SPX500"); }
  if (t.match(/dow |djia/))                       { indices.unshift("US30"); }
  if (t.match(/dax|german/))                      { indices.unshift("DAX40"); }
  if (t.match(/ftse/))                            { indices.unshift("FTSE100"); }
  if (t.match(/nikkei|japan/))                    { indices.unshift("JP225"); }

  // Rate decisions / central bank ─────────────────────────────────────────
  if (t.match(/rate|fomc|fed |ecb|boe|boj|rba|rbnz/) && (c === "USD" || c === "EUR" || c === "GBP")) {
    if (c === "USD") {
      metals  = ["XAU/USD", "XAG/USD", ...metals];
      indices = ["SPX500", "NAS100", "US30", ...indices];
    }
    if (c === "EUR") indices = ["DAX40", "EURO50", ...indices];
    if (c === "GBP") indices = ["FTSE100", ...indices];
  }

  return {
    forex:   [...new Set(forex)].slice(0, 3),
    metals:  [...new Set(metals)].slice(0, 2),
    indices: [...new Set(indices)].slice(0, 3),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function ic(impact?: string) {
  return IC[(impact as keyof typeof IC) ?? "low"] ?? IC.low;
}

function getEventType(title?: string): string {
  const t = (title ?? "").toLowerCase();
  if (t.match(/rate|fomc|fed |ecb|boe|boj|rba|central bank|monetary/)) return "Central Bank";
  if (t.match(/cpi|inflation|pce|price index|deflator/))                return "Inflation";
  if (t.match(/gdp|gross domestic/))                                    return "GDP";
  if (t.match(/nfp|non.farm|payroll|employment|unemployment|jobless/))  return "Employment";
  if (t.match(/retail|consumer spend/))                                 return "Retail";
  if (t.match(/pmi|manufacturing|services|composite/))                  return "PMI";
  if (t.match(/trade|current account|balance of/))                      return "Trade";
  if (t.match(/housing|home sales|building|permit/))                    return "Housing";
  if (t.match(/gold|oil|crude|wti|commodity/))                          return "Commodities";
  if (t.match(/speech|speaks|testimony|conference|press/))              return "Speech";
  if (t.match(/bond|auction|treasury|yield/))                           return "Bonds";
  return "Economic Data";
}

function relTime(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(Math.abs(d) / 60000);
  const f = d < 0;
  if (m < 60)  return f ? `in ${m}m`              : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return f ? `in ${h}h`              : `${h}h ago`;
  return f ? `in ${Math.floor(h / 24)}d` : `${Math.floor(h / 24)}d ago`;
}

function parseDelta(actual?: string, forecast?: string) {
  if (!actual || !forecast) return null;
  const a = parseFloat(actual.replace(/[^0-9.-]/g, ""));
  const f = parseFloat(forecast.replace(/[^0-9.-]/g, ""));
  if (isNaN(a) || isNaN(f)) return null;
  const diff = a - f;
  const pct  = f !== 0 ? (diff / Math.abs(f)) * 100 : 0;
  return { diff, pct, beat: diff > 0 ? "beat" as const : diff < 0 ? "miss" as const : "inline" as const };
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const evDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const n = new Date();
  const todayDay = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
  const diff = evDay - todayDay;
  if (diff === 0) return "Today";
  if (diff === 86400000) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function NewsPage() {
  const selectSection = useDashboardStore((s: any) => s.selectSection);
  useEffect(() => { selectSection("News"); }, [selectSection]);

  const [items,        setItems]        = useState<NewsItem[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [lastUpdated,  setLastUpdated]  = useState<Date | null>(null);
  const [nextRefresh,  setNextRefresh]  = useState(REFRESH_MS / 1000);
  const [activeTab,    setActiveTab]    = useState<Tab>("All News");
  const [search,       setSearch]       = useState("");
  const [visibleCount, setVisibleCount] = useState(12);
  const [selected,     setSelected]     = useState<NewsItem | null>(null);

  const fetchData = useCallback(async (manual = false) => {
    manual ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/news?limit=60&t=${Date.now()}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      setItems(d.items || []);
      setLastUpdated(new Date());
      setNextRefresh(REFRESH_MS / 1000);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const id = setInterval(() => fetchData(), REFRESH_MS); return () => clearInterval(id); }, [fetchData]);
  useEffect(() => { const id = setInterval(() => setNextRefresh(p => p <= 1 ? REFRESH_MS / 1000 : p - 1), 1000); return () => clearInterval(id); }, []);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    const list = items.filter(i => {
      if (activeTab === "High Impact" && i.impact !== "high")                    return false;
      if (activeTab === "Americas" && REGION[i.country ?? ""] !== "Americas")   return false;
      if (activeTab === "Europe"   && REGION[i.country ?? ""] !== "Europe")     return false;
      if (activeTab === "Asia"     && REGION[i.country ?? ""] !== "Asia")       return false;
      if (search && !i.title.toLowerCase().includes(search.toLowerCase()))      return false;
      return true;
    });
    // Always sort by impact first, then time
    const ord = { high: 3, medium: 2, low: 1 };
    return list.sort((a, b) => {
      const io = (ord[b.impact as keyof typeof ord] || 0) - (ord[a.impact as keyof typeof ord] || 0);
      if (io !== 0) return io;
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });
  }, [items, activeTab, search]);

  // For "All News": group into High / Medium / Low sections
  const impactGroups = useMemo(() => {
    if (activeTab !== "All News") return null;
    const g = { high: [] as NewsItem[], medium: [] as NewsItem[], low: [] as NewsItem[] };
    filtered.forEach(i => { (g[(i.impact ?? "low") as keyof typeof g] ??= []).push(i); });
    return g;
  }, [filtered, activeTab]);

  // Upcoming events for sidebar — next available (no hard 24h cap)
  const sidebarEvents = useMemo(() => {
    const now = Date.now();
    const ord = { high: 3, medium: 2, low: 1 };
    return items
      .filter(i => new Date(i.time).getTime() > now)
      .sort((a, b) => {
        // sort by impact DESC first, then time ASC
        const io = (ord[b.impact as keyof typeof ord] || 0) - (ord[a.impact as keyof typeof ord] || 0);
        if (io !== 0) return io;
        return new Date(a.time).getTime() - new Date(b.time).getTime();
      })
      .slice(0, 12);
  }, [items]);

  // Group sidebar events by date label
  const sidebarGroups = useMemo(() => {
    const groups: Record<string, NewsItem[]> = {};
    sidebarEvents.forEach(ev => {
      const label = dayLabel(ev.time);
      if (!groups[label]) groups[label] = [];
      groups[label].push(ev);
    });
    return Object.entries(groups);
  }, [sidebarEvents]);

  const mins = Math.floor(nextRefresh / 60);
  const secs = String(nextRefresh % 60).padStart(2, "0");

  return (
    <div className="h-full overflow-y-auto pb-14 md:pb-0" style={{ background: "#070A12", color: "#fff" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20"
        style={{ background: "rgba(7,10,18,0.97)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <Link href="/app" className="p-1.5 rounded-md hover:bg-white/5 transition-colors">
                <ArrowLeft className="w-4 h-4 text-gray-500" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-semibold text-white">Market News</h1>
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                    style={{ background:"rgba(52,211,153,0.08)", border:"1px solid rgba(52,211,153,0.22)" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Live</span>
                  </span>
                </div>
                {lastUpdated && (
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Updated {lastUpdated.toLocaleTimeString()} · Next in {mins}:{secs}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600"/>
                <input type="text" placeholder="Search events…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none w-44"
                  style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}/>
              </div>
              <button onClick={() => fetchData(true)} disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-500 hover:text-gray-300 transition-all disabled:opacity-40"
                style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                <RefreshCw className={`w-3 h-3 ${refreshing?"animate-spin":""}`}/>
                <span className="hidden sm:inline">{refreshing?"Updating…":"Refresh"}</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center overflow-x-auto scrollbar-none px-4 sm:px-6">
            {TABS.map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); setVisibleCount(12); }}
                className={`relative flex-shrink-0 px-4 py-2.5 text-xs font-semibold transition-colors ${activeTab===tab?"text-white":"text-gray-500 hover:text-gray-300"}`}>
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                    style={{ background:"linear-gradient(90deg,#f97316,#ef4444)" }}/>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        {error && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg text-red-400 text-sm"
            style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.15)" }}>
            <AlertCircle size={14} className="flex-shrink-0"/>{error}
          </div>
        )}

        <div className="flex gap-5 items-start">

          {/* ── Main feed ─────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {loading && items.length === 0 ? (
              <div className="flex justify-center py-28">
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"/>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-600 text-sm">No events match this filter</div>
            ) : impactGroups ? (
              /* "All News" — three impact sections */
              <div className="space-y-5">
                {(["high","medium","low"] as const).map(level => {
                  const evts = impactGroups[level];
                  if (!evts.length) return null;
                  const c = IC[level];
                  const visible = evts.slice(0, visibleCount);
                  return (
                    <div key={level}>
                      {/* Section header */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.hex }}/>
                        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: c.hex }}>
                          {c.label}
                        </span>
                        <span className="text-[11px] text-gray-600">· {evts.length} events</span>
                        <div className="flex-1 h-px ml-1" style={{ background: `linear-gradient(90deg, ${c.hex}40, transparent)` }}/>
                      </div>
                      <div style={{ border:`1px solid ${c.border}`, borderRadius:"12px", overflow:"hidden" }}>
                        {visible.map((item, idx) => (
                          <NewsCard key={item.id} item={item} index={idx}
                            isLast={idx === visible.length - 1}
                            onClick={() => setSelected(item)}/>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {visibleCount < filtered.length && (
                  <div className="text-center pt-1">
                    <button onClick={() => setVisibleCount(c => c + 12)}
                      className="px-6 py-2.5 text-xs font-semibold text-gray-400 hover:text-white rounded-xl transition-colors"
                      style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
                      Load More
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Single-impact tab — flat list */
              <>
                <div style={{ border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", overflow:"hidden" }}>
                  {filtered.slice(0, visibleCount).map((item, idx) => (
                    <NewsCard key={item.id} item={item} index={idx}
                      isLast={idx === Math.min(visibleCount, filtered.length) - 1}
                      onClick={() => setSelected(item)}/>
                  ))}
                </div>
                {visibleCount < filtered.length && (
                  <div className="mt-4 text-center">
                    <button onClick={() => setVisibleCount(c => c + 12)}
                      className="px-6 py-2.5 text-xs font-semibold text-gray-400 hover:text-white rounded-xl transition-colors"
                      style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Sidebar ───────────────────────────────────────── */}
          <div className="hidden lg:block w-60 xl:w-64 flex-shrink-0">
            <div className="sticky top-28 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-orange-400"/>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Upcoming</span>
                </div>
                <span className="text-[10px] text-gray-600">{sidebarEvents.length} events</span>
              </div>

              {sidebarGroups.length === 0 ? (
                <div className="px-4 py-8 text-xs text-gray-600 text-center rounded-xl"
                  style={{ border:"1px solid rgba(255,255,255,0.06)" }}>
                  No upcoming events
                </div>
              ) : (
                <div className="space-y-3">
                  {sidebarGroups.map(([label, evts]) => (
                    <div key={label}>
                      <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5 px-1">{label}</div>
                      <div style={{ border:"1px solid rgba(255,255,255,0.06)", borderRadius:"10px", overflow:"hidden" }}>
                        {evts.map((ev, idx) => {
                          const c = ic(ev.impact);
                          const instr = getInstruments(ev.country, ev.title);
                          const topPair = instr.forex[0] ?? instr.metals[0] ?? instr.indices[0] ?? "";
                          return (
                            <div key={ev.id} onClick={() => setSelected(ev)}
                              className="flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors"
                              style={{ background:"rgba(255,255,255,0.015)", borderBottom: idx < evts.length-1 ? "1px solid rgba(255,255,255,0.04)":"none" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.04)"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.015)"; }}>
                              {/* Impact stripe */}
                              <div className="w-0.5 self-stretch flex-shrink-0 rounded-full" style={{ background: c.hex }}/>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-medium text-gray-300 truncate">{ev.title}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[9px] font-bold text-gray-600">{FLAGS[ev.country??""]} {ev.country}</span>
                                  {topPair && (
                                    <span className="text-[9px] font-mono text-gray-600">{topPair}</span>
                                  )}
                                  <span className="text-[9px] text-gray-700 ml-auto">
                                    {new Date(ev.time).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <AnimatePresence>
        {selected && <NewsDetailModal item={selected} onClose={() => setSelected(null)}/>}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NewsCard
// ─────────────────────────────────────────────────────────────────────────────

function NewsCard({ item, index, isLast, onClick }: {
  item: NewsItem; index: number; isLast: boolean; onClick: () => void;
}) {
  const c     = ic(item.impact);
  const flag  = FLAGS[item.country ?? ""] ?? "🌐";
  const instr = getInstruments(item.country, item.title);
  const type  = getEventType(item.title);
  const delta = parseDelta(item.actual, item.forecast);
  const isPast = new Date(item.time) < new Date();
  const hasInstr = instr.forex.length + instr.metals.length + instr.indices.length > 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.4) }}
      onClick={onClick}
      className="flex items-stretch cursor-pointer group transition-colors"
      style={{ background:"rgba(255,255,255,0.018)", borderBottom: isLast?"none":"1px solid rgba(255,255,255,0.05)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.038)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.018)"; }}>

      {/* Left stripe */}
      <div className="w-[3px] flex-shrink-0"
        style={{ background:`linear-gradient(to bottom,${c.hex},${c.hex}33)`, borderRadius:"3px 0 0 3px" }}/>

      {/* Body */}
      <div className="flex-1 min-w-0 px-4 sm:px-5 py-4 sm:py-5 space-y-2.5">

        {/* Row 1 — meta */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm leading-none">{flag}</span>
          <span className="text-[11px] font-bold text-gray-300">{item.country ?? "—"}</span>
          <span className="text-gray-700">·</span>
          <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
            style={{ color:c.hex, background:c.bg, border:`1px solid ${c.border}` }}>
            {c.short}
          </span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded text-gray-500"
            style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)" }}>
            {type}
          </span>
          <span className="ml-auto text-[11px] text-gray-600 tabular-nums">{relTime(item.time)}</span>
        </div>

        {/* Row 2 — title */}
        <h3 className="text-sm sm:text-[15px] font-semibold text-white leading-snug group-hover:text-orange-300 transition-colors">
          {item.title}
        </h3>

        {/* Row 3 — data values */}
        <div className="flex items-end gap-4 sm:gap-6 flex-wrap">
          {item.forecast && (
            <div>
              <div className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Forecast</div>
              <div className="text-[13px] font-mono font-semibold text-blue-400">{item.forecast}</div>
            </div>
          )}
          {item.actual ? (
            <div>
              <div className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Actual</div>
              <div className={`flex items-center gap-1 text-[13px] font-mono font-bold ${
                delta?.beat==="beat"?"text-emerald-400":delta?.beat==="miss"?"text-red-400":"text-gray-200"}`}>
                {delta?.beat==="beat"?<TrendingUp size={11}/>:delta?.beat==="miss"?<TrendingDown size={11}/>:<Minus size={11}/>}
                {item.actual}
              </div>
            </div>
          ) : item.forecast ? (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-600 pb-0.5">
              <Zap size={10} className="text-amber-500"/><span>Pending release</span>
            </div>
          ) : null}
          {item.previous && (
            <div>
              <div className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Previous</div>
              <div className="text-[13px] font-mono text-gray-500">{item.previous}</div>
            </div>
          )}
          {/* Beat/miss delta pill */}
          {delta && delta.beat !== "inline" && (
            <div className={`ml-auto px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 ${
              delta.beat==="beat"?"text-emerald-400":"text-red-400"}`}
              style={{ background:delta.beat==="beat"?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)",
                       border:`1px solid ${delta.beat==="beat"?"rgba(16,185,129,0.25)":"rgba(239,68,68,0.25)"}` }}>
              {delta.beat==="beat"?<TrendingUp size={10}/>:<TrendingDown size={10}/>}
              {delta.beat==="beat"?"Beat":"Miss"} {Math.abs(delta.pct).toFixed(1)}%
            </div>
          )}
        </div>

        {/* Row 4 — instruments */}
        {hasInstr && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-gray-600 flex-shrink-0">Affects:</span>
            {/* Forex */}
            {instr.forex.map(p => (
              <span key={p} className="text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded text-gray-300 tabular-nums"
                style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.10)" }}>
                {p}
              </span>
            ))}
            {/* Metals — gold tint */}
            {instr.metals.map(m => (
              <span key={m} className="text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded tabular-nums"
                style={{ color:"#fbbf24", background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.22)" }}>
                {m}
              </span>
            ))}
            {/* Indices — blue tint */}
            {instr.indices.map(i => (
              <span key={i} className="text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded tabular-nums"
                style={{ color:"#60a5fa", background:"rgba(96,165,250,0.08)", border:"1px solid rgba(96,165,250,0.22)" }}>
                {i}
              </span>
            ))}
          </div>
        )}

        {/* Row 5 — footer */}
        <div className="flex items-center gap-2 text-[11px] text-gray-600 pt-0.5">
          <span className="font-semibold text-gray-500">ForexFactory</span>
          <span>·</span>
          <Clock size={10}/>
          <span>{fmtShort(item.time)}</span>
          {isPast && !item.actual && (
            <><span>·</span><span className="text-gray-700">No data released</span></>
          )}
        </div>
      </div>

      {/* Thumbnail */}
      <div className="hidden sm:flex flex-col items-center justify-center w-[82px] xl:w-[92px] flex-shrink-0 m-3 rounded-xl select-none"
        style={{ background:"linear-gradient(145deg,#0d1120,#080c18)", border:"1px solid rgba(255,255,255,0.07)",
                 boxShadow:`inset 0 0 28px ${c.hex}12` }}>
        <span className="text-2xl leading-none">{flag}</span>
        <div className="mt-2 space-y-1 px-1.5 w-full">
          {/* Top forex pair */}
          {instr.forex[0] && (
            <div className="text-center text-[8px] font-bold font-mono rounded px-1 py-0.5 truncate"
              style={{ background:"rgba(255,255,255,0.06)", color:"#d1d5db" }}>
              {instr.forex[0]}
            </div>
          )}
          {/* Top metal */}
          {instr.metals[0] && (
            <div className="text-center text-[8px] font-bold font-mono rounded px-1 py-0.5 truncate"
              style={{ background:"rgba(251,191,36,0.10)", color:"#fbbf24" }}>
              {instr.metals[0]}
            </div>
          )}
          {/* Top index */}
          {instr.indices[0] && (
            <div className="text-center text-[8px] font-bold font-mono rounded px-1 py-0.5 truncate"
              style={{ background:"rgba(96,165,250,0.10)", color:"#60a5fa" }}>
              {instr.indices[0]}
            </div>
          )}
        </div>
        <div className="mt-2 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm"
          style={{ color:c.hex, background:`${c.hex}22` }}>
          {c.short}
        </div>
      </div>
    </motion.article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Modal
// ─────────────────────────────────────────────────────────────────────────────

function NewsDetailModal({ item, onClose }: { item: NewsItem; onClose: () => void }) {
  const c     = ic(item.impact);
  const flag  = FLAGS[item.country ?? ""] ?? "🌐";
  const instr = getInstruments(item.country, item.title);
  const type  = getEventType(item.title);
  const delta = parseDelta(item.actual, item.forecast);

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background:"rgba(0,0,0,0.82)", backdropFilter:"blur(12px)" }}
      onClick={onClose}>
      <motion.div
        initial={{y:30,opacity:0}} animate={{y:0,opacity:1}} exit={{y:30,opacity:0}}
        transition={{type:"spring",damping:30,stiffness:320}}
        className="w-full sm:max-w-lg overflow-hidden rounded-t-2xl sm:rounded-2xl"
        style={{ background:"#0C1020", border:"1px solid rgba(255,255,255,0.09)" }}
        onClick={e => e.stopPropagation()}>

        <div className="h-[2px]" style={{ background:`linear-gradient(90deg,${c.hex},${c.hex}44,transparent)` }}/>

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-start gap-3 mb-5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xl">{flag}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{color:c.hex,background:c.bg,border:`1px solid ${c.border}`}}>{c.label}</span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded text-gray-400"
                  style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)"}}>
                  {type}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-snug">{item.title}</h2>
              <p className="text-xs text-gray-600 mt-1">
                {item.country} · {new Date(item.time).toLocaleString("en-US",{
                  weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"
                })} · {relTime(item.time)}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0">
              <X size={15} className="text-gray-600"/>
            </button>
          </div>

          {/* Instruments */}
          {(instr.forex.length + instr.metals.length + instr.indices.length) > 0 && (
            <div className="mb-4 p-3.5 rounded-xl space-y-2"
              style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"}}>
              <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Affected Instruments</div>
              <div className="flex flex-wrap gap-1.5">
                {instr.forex.map(p=>(
                  <span key={p} className="text-[11px] font-semibold font-mono px-2 py-1 rounded-lg text-gray-200"
                    style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)"}}>
                    {p}
                  </span>
                ))}
                {instr.metals.map(m=>(
                  <span key={m} className="text-[11px] font-semibold font-mono px-2 py-1 rounded-lg"
                    style={{color:"#fbbf24",background:"rgba(251,191,36,0.10)",border:"1px solid rgba(251,191,36,0.25)"}}>
                    {m}
                  </span>
                ))}
                {instr.indices.map(i=>(
                  <span key={i} className="text-[11px] font-semibold font-mono px-2 py-1 rounded-lg"
                    style={{color:"#60a5fa",background:"rgba(96,165,250,0.10)",border:"1px solid rgba(96,165,250,0.25)"}}>
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Data grid */}
          {(item.forecast || item.actual || item.previous) && (
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {item.forecast && (
                <div className="p-3.5 rounded-xl" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)"}}>
                  <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Forecast</div>
                  <div className="text-xl font-mono font-bold text-blue-400">{item.forecast}</div>
                </div>
              )}
              {item.actual ? (
                <div className="p-3.5 rounded-xl" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)"}}>
                  <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Actual</div>
                  <div className={`text-xl font-mono font-bold flex items-center gap-1 ${
                    delta?.beat==="beat"?"text-emerald-400":delta?.beat==="miss"?"text-red-400":"text-gray-200"}`}>
                    {item.actual}
                    {delta?.beat==="beat"?<TrendingUp size={14}/>:delta?.beat==="miss"?<TrendingDown size={14}/>:null}
                  </div>
                  {delta && delta.beat!=="inline" && (
                    <div className={`text-[10px] font-bold mt-0.5 ${delta.beat==="beat"?"text-emerald-500":"text-red-500"}`}>
                      {delta.beat==="beat"?"+":""}{delta.pct.toFixed(1)}% vs forecast
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl flex flex-col items-center justify-center"
                  style={{background:"rgba(255,255,255,0.02)",border:"1px dashed rgba(255,255,255,0.08)"}}>
                  <Zap size={16} className="text-amber-500 mb-1"/>
                  <div className="text-[10px] text-gray-600 text-center">Awaiting</div>
                </div>
              )}
              {item.previous && (
                <div className="p-3.5 rounded-xl" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)"}}>
                  <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Previous</div>
                  <div className="text-xl font-mono font-bold text-gray-500">{item.previous}</div>
                </div>
              )}
            </div>
          )}

          {/* Note */}
          <div className="p-3.5 rounded-xl mb-4"
            style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)"}}>
            <p className="text-xs text-gray-500 leading-relaxed">
              {c.short==="HIGH"
                ?"High impact — major volatility expected. Spreads may widen. Watch the instruments above closely."
                :c.short==="MED"
                ?"Medium impact — moderate price action. Good for breakout setups on the listed pairs."
                :"Low impact release. Minimal deviation from consensus expected under normal conditions."}
            </p>
          </div>

          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-white transition-colors"
            style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
