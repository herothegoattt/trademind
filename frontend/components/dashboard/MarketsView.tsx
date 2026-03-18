"use client";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, GripHorizontal } from "lucide-react";
import { cn } from "../../lib/utils";
import { useEffect, useState } from "react";

interface MarketData {
  instrument: string;
  bid: number;
  ask: number;
  high?: number;
  low?: number;
  change?: number;
  change_pct?: number;
  category?: string;
}

const FALLBACK_MARKETS: MarketData[] = [
  { instrument: "EUR/USD", bid: 1.0845, ask: 1.0847, high: 1.0912, low: 1.0798, change: 0.0042, change_pct: 0.39, category: "Forex" },
  { instrument: "GBP/USD", bid: 1.2634, ask: 1.2636, high: 1.2721, low: 1.2567, change: -0.0028, change_pct: -0.22, category: "Forex" },
  { instrument: "USD/JPY", bid: 149.34, ask: 149.36, high: 150.12, low: 148.56, change: 0.65, change_pct: 0.44, category: "Forex" },
  { instrument: "SPY", bid: 578.42, ask: 578.44, high: 582.15, low: 574.32, change: 3.18, change_pct: 0.55, category: "Stocks" },
  { instrument: "AAPL", bid: 182.35, ask: 182.37, high: 184.92, low: 180.54, change: 1.82, change_pct: 1.01, category: "Stocks" },
  { instrument: "Gold (XAU/USD)", bid: 2087.50, ask: 2087.75, high: 2095.30, low: 2068.45, change: 12.50, change_pct: 0.60, category: "Commodities" },
  { instrument: "Crude Oil (WTI)", bid: 89.45, ask: 89.67, high: 91.23, low: 87.89, change: 2.12, change_pct: 2.42, category: "Commodities" },
];

export function MarketsView() {
  const [markets, setMarkets] = useState<MarketData[]>(FALLBACK_MARKETS);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Forex");
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null);
  const [tvLoadError, setTvLoadError] = useState(false);

  useEffect(() => {
    // reset selected instrument when switching categories
    setSelectedInstrument(null);
    // reset tradingview error state
    setTvLoadError(false);
  }, [selectedCategory]);

  useEffect(() => {
    let mounted = true;
    const fetchMarkets = async () => {
      try {
        const resp = await fetch("/api/v1/markets");
        if (resp.ok) {
          const data = await resp.json();
          if (mounted && Array.isArray(data)) setMarkets(data);
        }
      } catch (e) {
        // ignore, fallback used
        console.warn("Markets fetch failed, using fallback", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMarkets();
    const id = setInterval(fetchMarkets, 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const categories = ["Forex", "Stocks", "Commodities", "Indices"];
  const filtered = markets.filter((m) => m.category === selectedCategory);

  // Map instrument to TradingView symbol
  const mapToTV = (instr: string | undefined, category?: string) => {
    if (!instr) return "OANDA:EURUSD";
    if (category === "Forex" && instr.includes("/")) {
      return `OANDA:${instr.replace("/", "").replace(" ", "")}`;
    }
    if (category === "Stocks") {
      // naive map to NASDAQ
      const sym = instr.split(" ")[0];
      return `NASDAQ:${sym}`;
    }
    // fallback
    return instr.replace("/", "");
  };

  // TradingView widget loader
  const TradingViewWidget = ({ symbol }: { symbol: string }) => {
    const refId = `tradingview_${symbol.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const containerRef = (el: HTMLDivElement | null) => {
      if (!el) return;
      // load script if needed
      const win = window as any;
      let created = false;
      const createWidget = () => {
        try {
          if (win.TradingView && typeof win.TradingView.widget === "function") {
            // clear container
            el.innerHTML = "";
            new win.TradingView.widget({
              container_id: refId,
              autosize: true,
              symbol,
              interval: "60",
              timezone: "Etc/UTC",
              theme: "dark",
              style: "1",
              locale: "en",
              toolbar_bg: "#1f2937",
              hide_side_toolbar: false,
              enable_publishing: false,
              allow_symbol_change: true,
            });
            created = true;
            setTvLoadError(false);
          }
        } catch (e) {
          console.warn("TradingView widget error", e);
          setTvLoadError(true);
        }
      };

      if (!(window as any).TradingView) {
        const s = document.createElement("script");
        s.src = "https://s3.tradingview.com/tv.js";
        s.onload = () => setTimeout(createWidget, 300);
        document.head.appendChild(s);
      } else {
        createWidget();
      }
      // fallback: if widget not created within 3s, mark load error
      setTimeout(() => {
        if (!created) setTvLoadError(true);
      }, 3000);
    };

    return (
      <div id={refId} ref={containerRef} className="w-full h-[420px] rounded-lg overflow-hidden border border-gray-700/30 mb-4" />
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-6 px-6 py-4 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GripHorizontal className="w-5 h-5 text-cyan-300" />
          <h3 className="text-lg font-semibold text-cyan-300">Market Overview</h3>
        </div>
        <p className="text-xs text-gray-400">Real-time pricing (OANDA fallback)</p>
      </div>

      <div className="flex gap-2 justify-center flex-wrap max-w-3xl mx-auto">
        {categories.map((cat) => (
          <motion.button
            key={cat}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-6 py-2 rounded-full transition-all font-semibold text-sm backdrop-blur-sm",
              selectedCategory === cat
                ? "bg-purple-500/30 border border-purple-400/60 text-purple-300 shadow-lg"
                : "bg-slate-700/20 border border-slate-600/40 text-gray-400 hover:border-purple-400/40 hover:bg-purple-500/10 hover:shadow-md"
            )}
            style={{
              boxShadow: selectedCategory === cat 
                ? "0 4px 20px rgba(168, 85, 247, 0.3), 0 0 15px rgba(168, 85, 247, 0.2)"
                : "0 2px 10px rgba(168, 85, 247, 0.1)"
            }}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 max-w-3xl mx-auto w-full max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading market data...</div>
        ) : filtered.length > 0 ? (
          <>
            {/* TradingView chart for selected instrument / first in category */}
            <div className="w-full">
              <TradingViewWidget symbol={mapToTV(selectedInstrument ?? filtered[0].instrument, selectedCategory)} />
              {tvLoadError && (
                <div className="text-center text-sm text-gray-400 mb-4">TradingView failed to load. External scripts may be blocked — using static market snapshots below.</div>
              )}
            </div>
            {filtered.map((m) => (
              <MarketCard key={m.instrument} market={m} onSelect={() => setSelectedInstrument(m.instrument)} />
            ))}
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">No data available for {selectedCategory}</div>
        )}
      </div>

      <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/5 text-sm text-blue-300 text-center max-w-3xl mx-auto">
        <p className="font-semibold mb-1">💡 Live Trading Data</p>
        <p>Market data refreshes every 5 seconds. TradingView replaced with OANDA fallback.</p>
      </div>
    </motion.div>
  );
}

function MarketCard({ market, onSelect }: { market: MarketData; onSelect?: () => void }) {
  const mid = (market.bid + market.ask) / 2;
  const isPositive = (market.change_pct ?? 0) >= 0;
  const spread = Math.abs(market.ask - market.bid).toFixed(5);

  return (
    <motion.div onClick={onSelect} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="cursor-pointer p-4 rounded-lg border border-gray-700/40 hover:border-cyan-500/40 bg-gray-900/20 hover:bg-gray-900/40 transition-all">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-semibold text-white text-base">{market.instrument}</h4>
          <div className="text-xs text-gray-400 mt-1">Bid/Ask: {market.bid.toFixed(5)} / {market.ask.toFixed(5)}</div>
          {market.high && market.low && <div className="text-xs text-gray-400 mt-1">Day Range: {market.low.toFixed(4)} - {market.high.toFixed(4)}</div>}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-bold text-white">{mid.toFixed(5)}</div>
          <div className={cn("flex items-center gap-1 justify-end mt-2 text-sm font-semibold", isPositive ? "text-green-400" : "text-red-400")}>
            {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            {market.change_pct ? `${isPositive ? "+" : ""}${market.change_pct.toFixed(2)}%` : "--"}
          </div>
          <div className="text-xs text-gray-500 mt-1">Spread: {spread}</div>
        </div>
      </div>
    </motion.div>
  );
}
