"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { TradingViewWidget } from "../../components/TradingViewWidget";
import { useDashboardStore } from "../../lib/store";
import { ArrowLeft, TrendingUp, Zap, Activity, BarChart3, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SYMBOLS = [
  { label: "EUR/USD", value: "OANDA:EURUSD", type: "Forex", icon: "💶", price: "1.0850", change: "+0.15%" },
  { label: "GBP/USD", value: "OANDA:GBPUSD", type: "Forex", icon: "💷", price: "1.2750", change: "+0.08%" },
  { label: "USD/JPY", value: "OANDA:USDJPY", type: "Forex", icon: "¥", price: "149.50", change: "-0.22%" },
  { label: "XAU/USD", value: "OANDA:XAUUSD", type: "Commodity", icon: "🥇", price: "2045.60", change: "+0.55%" },
  { label: "BTC/USDT", value: "BINANCE:BTCUSDT", type: "Crypto", icon: "₿", price: "42850", change: "+2.15%" },
  { label: "SPX", value: "CME_MINI:ES1!", type: "Index", icon: "📈", price: "5125.40", change: "+0.45%" },
];

const INTERVALS = [
  { label: "1m", value: "1", duration: "1 Minute" },
  { label: "5m", value: "5", duration: "5 Minutes" },
  { label: "15m", value: "15", duration: "15 Minutes" },
  { label: "1h", value: "60", duration: "1 Hour" },
  { label: "4h", value: "240", duration: "4 Hours" },
  { label: "1D", value: "D", duration: "1 Day" },
];

export default function MarketsPage() {
  const selectSection = useDashboardStore((s: any) => s.selectSection);
  useEffect(() => {
    selectSection("Markets");
  }, [selectSection]);

  const [symbol, setSymbol] = useState(SYMBOLS[0].value);
  const [interval, setInterval] = useState(INTERVALS[3].value);
  const [selectedSymbolData, setSelectedSymbolData] = useState(SYMBOLS[0]);
  const [showSymbolInfo, setShowSymbolInfo] = useState(false);

  const selectedInterval = INTERVALS.find(i => i.value === interval);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-black/95 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-purple-500/20 bg-black/50 backdrop-blur-lg">
        <div className="flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link href="/app" className="p-2 hover:bg-purple-500/10 rounded transition-colors">
              <ArrowLeft className="w-5 h-5 text-purple-400" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur-md opacity-40" />
                <BarChart3 className="w-7 h-7 text-purple-400 relative" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                Market Data
              </h1>
            </div>
          </motion.div>

          <motion.div
            className="text-right"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">TIMEFRAME</div>
            <div className="text-lg font-bold text-purple-400">{selectedInterval?.duration || '1 Hour'}</div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <motion.div
            className="lg:col-span-1 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Symbols Section */}
            <div className="rounded-lg border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-transparent p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-5">
                <Zap className="w-5 h-5 text-purple-400" />
                <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Available Symbols</h2>
              </div>

              <div className="space-y-2">
                {SYMBOLS.map((sym, idx) => (
                  <motion.button
                    key={sym.value}
                    onClick={() => {
                      setSymbol(sym.value);
                      setSelectedSymbolData(sym);
                      setShowSymbolInfo(true);
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ x: 4 }}
                    className={`w-full text-left px-3.5 py-3 rounded-lg border transition-all ${
                      symbol === sym.value
                        ? 'bg-gradient-to-r from-purple-500/30 to-transparent border-purple-400 shadow-lg shadow-purple-500/20'
                        : 'bg-gray-800/20 border-gray-700/30 hover:border-purple-500/40 hover:bg-purple-500/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span className="text-lg">{sym.icon}</span>
                          {sym.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{sym.type}</div>
                      </div>
                      {symbol === sym.value && (
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Current Symbol Info */}
            <AnimatePresence>
              {showSymbolInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="rounded-lg border border-purple-500/30 bg-gradient-to-b from-purple-500/15 to-gray-900/50 p-5 backdrop-blur-sm"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">{selectedSymbolData.icon}</div>
                    <h3 className="font-bold text-lg text-white mb-1">{selectedSymbolData.label}</h3>
                    <div className="text-xs text-gray-400 mb-4 uppercase tracking-wider">{selectedSymbolData.type}</div>
                    
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                        <div className="text-xs text-gray-500 mb-1">Price</div>
                        <div className="text-2xl font-bold text-purple-400 font-mono">${selectedSymbolData.price}</div>
                      </div>
                      
                      <div className={`p-3 rounded-lg border ${
                        selectedSymbolData.change.includes('-')
                          ? 'bg-red-500/10 border-red-500/30'
                          : 'bg-green-500/10 border-green-500/30'
                      }`}>
                        <div className="text-xs text-gray-500 mb-1">Change (24h)</div>
                        <div className={`text-2xl font-bold font-mono ${
                          selectedSymbolData.change.includes('-')
                            ? 'text-red-400'
                            : 'text-green-400'
                        }`}>
                          {selectedSymbolData.change.includes('-') ? '📉' : '📈'} {selectedSymbolData.change}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Timeframe Selection */}
            <div className="rounded-lg border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-transparent p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-5">
                <Clock className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Timeframe</h3>
              </div>
              
              <div className="space-y-2">
                {INTERVALS.map((tf, idx) => (
                  <motion.button
                    key={tf.value}
                    onClick={() => setInterval(tf.value)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full px-3.5 py-2.5 rounded-lg border transition-all font-semibold ${
                      interval === tf.value
                        ? 'bg-gradient-to-r from-purple-500/40 to-pink-500/20 border-purple-400 text-purple-200 shadow-lg shadow-purple-500/20'
                        : 'bg-gray-800/20 border-gray-700/30 text-gray-300 hover:border-purple-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{tf.label}</span>
                      {interval === tf.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-1.5 h-1.5 bg-purple-400 rounded-full"
                        />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="text-xs text-gray-500 mb-1">Selected Timeframe</div>
                <div className="text-sm font-bold text-purple-300">{selectedInterval?.duration}</div>
              </div>
            </div>
          </motion.div>

          {/* Chart Area */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative rounded-lg border border-purple-500/20 bg-gradient-to-br from-black/50 to-purple-500/5 p-1 overflow-hidden backdrop-blur-sm">
              {/* Animated Border */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent pointer-events-none" />
              
              <div className="relative rounded-lg overflow-hidden bg-black/80">
                <TradingViewWidget symbol={symbol} interval={interval} theme="dark" />
              </div>
            </div>

            {/* Chart Info Footer */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 grid grid-cols-3 gap-3"
            >
              <div className="p-4 rounded-lg border border-gray-700/30 bg-gray-800/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-gray-400 uppercase">Live Chart</span>
                </div>
                <p className="text-xs text-gray-500">Real-time market data from TradingView</p>
              </div>

              <div className="p-4 rounded-lg border border-gray-700/30 bg-gray-800/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-gray-400 uppercase">Updates</span>
                </div>
                <p className="text-xs text-gray-500">Market data updates every minute</p>
              </div>

              <div className="p-4 rounded-lg border border-gray-700/30 bg-gray-800/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-gray-400 uppercase">Symbols</span>
                </div>
                <p className="text-xs text-gray-500">{SYMBOLS.length} pairs available</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
