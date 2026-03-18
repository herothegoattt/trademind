"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Sun, Moon, Bell, Download, LogOut, 
  Settings2, DollarSign, AlertCircle, Key,
  Zap, Clock, TrendingUp
} from "lucide-react";
import { cn } from "../../lib/utils";

interface BottomSheetSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BottomSheetSettings({ isOpen, onClose }: BottomSheetSettingsProps) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [notifications, setNotifications] = useState(true);
  const [activeTab, setActiveTab] = useState<"general" | "trading" | "alerts" | "api">("general");
  
  // Trading settings
  const [positionSize, setPositionSize] = useState(0.1);
  const [maxRisk, setMaxRisk] = useState(2);
  const [leverage, setLeverage] = useState("1:1");
  const [stopLossPercent, setStopLossPercent] = useState(2);
  const [takeProfitPercent, setTakeProfitPercent] = useState(4);
  
  // Alert settings
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [signalAlerts, setSignalAlerts] = useState(true);
  const [newsAlerts, setNewsAlerts] = useState(false);
  const [maxDailyLoss, setMaxDailyLoss] = useState(500);
  
  // API settings
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  const handleDownloadData = () => {
    console.log("Download data clicked");
  };

  const handleLogout = () => {
    console.log("Logout clicked");
    onClose();
  };

  const handleSaveApiKey = () => {
    console.log("API Key saved:", apiKey);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl max-h-[85vh]"
          >
            <div className={cn(
              "relative rounded-t-2xl border-t border-l border-r border-cyan-400/40 bg-black/90 backdrop-blur-xl",
              "shadow-2xl flex flex-col h-full"
            )}>
              {/* Header */}
              <div className="relative border-b border-cyan-400/20 px-6 py-5 flex items-center justify-between flex-shrink-0">
                <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  ⚙️ Advanced Settings
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-cyan-400/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-cyan-400" />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-2 px-6 pt-4 border-b border-gray-700/50 flex-shrink-0 overflow-x-auto">
                {[
                  { id: "general", label: "General", icon: Settings2 },
                  { id: "trading", label: "Trading", icon: TrendingUp },
                  { id: "alerts", label: "Alerts", icon: Bell },
                  { id: "api", label: "API", icon: Key },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as typeof activeTab)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all",
                      activeTab === id
                        ? "border-cyan-400 text-cyan-300"
                        : "border-transparent text-gray-400 hover:text-gray-300"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Content - Scrollable */}
              <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1">
                {/* GENERAL TAB */}
                {activeTab === "general" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Theme Setting */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                        <Sun className="w-4 h-4 text-yellow-400" />
                        Theme
                      </label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setTheme("dark")}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all",
                            theme === "dark"
                              ? "border-purple-400 bg-purple-400/10 text-purple-300"
                              : "border-gray-600/50 bg-gray-900/50 text-gray-400 hover:border-gray-500"
                          )}
                        >
                          <Moon className="w-4 h-4" />
                          <span className="text-sm">Dark</span>
                        </button>
                        <button
                          onClick={() => setTheme("light")}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all",
                            theme === "light"
                              ? "border-yellow-400 bg-yellow-400/10 text-yellow-300"
                              : "border-gray-600/50 bg-gray-900/50 text-gray-400 hover:border-gray-500"
                          )}
                        >
                          <Sun className="w-4 h-4" />
                          <span className="text-sm">Light</span>
                        </button>
                      </div>
                    </div>

                    {/* Notifications Setting */}
                    <div className="space-y-3 pb-4 border-b border-gray-700/50">
                      <label className="text-sm font-semibold text-gray-300 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-cyan-400" />
                          Push Notifications
                        </span>
                        <button
                          onClick={() => setNotifications(!notifications)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            notifications ? "bg-purple-500" : "bg-gray-700"
                          )}
                        >
                          <motion.span
                            layout
                            className="inline-block h-4 w-4 transform rounded-full bg-white"
                            animate={{ x: notifications ? 20 : 2 }}
                            transition={{ type: "spring", stiffness: 500, damping: 40 }}
                          />
                        </button>
                      </label>
                      <p className="text-xs text-gray-500 ml-6">
                        {notifications
                          ? "Get alerts for news and trading signals"
                          : "All notifications disabled"}
                      </p>
                    </div>

                    {/* Data Export */}
                    <button
                      onClick={handleDownloadData}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg",
                        "border border-cyan-400/20 hover:border-cyan-400/50 hover:bg-cyan-400/5",
                        "text-cyan-300 hover:text-cyan-200 transition-all"
                      )}
                    >
                      <Download className="w-4 h-4" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Export Data</div>
                        <div className="text-xs text-cyan-400/60">Download your decisions & history</div>
                      </div>
                    </button>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg",
                        "border border-pink-400/20 hover:border-pink-400/50 hover:bg-pink-400/5",
                        "text-pink-300 hover:text-pink-200 transition-all"
                      )}
                    >
                      <LogOut className="w-4 h-4" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Logout</div>
                        <div className="text-xs text-pink-400/60">Sign out of your account</div>
                      </div>
                    </button>
                  </motion.div>
                )}

                {/* TRADING TAB */}
                {activeTab === "trading" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5"
                  >
                    <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3 flex gap-2 text-xs text-blue-300">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>All monetary values are in your account currency</span>
                    </div>

                    {/* Position Size */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        Position Size (Lots)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0.01"
                          max="1000"
                          step="0.1"
                          value={positionSize}
                          onChange={(e) => setPositionSize(parseFloat(e.target.value))}
                          className="flex-1 bg-gray-900/50 border border-gray-700 rounded px-3 py-2 text-gray-200 text-sm"
                        />
                        <span className="text-cyan-400 font-mono text-sm min-w-fit">{positionSize.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Max Risk */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-orange-400" />
                          Max Risk Per Trade
                        </span>
                        <span className="text-orange-400 font-mono text-sm">{maxRisk}%</span>
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={maxRisk}
                        onChange={(e) => setMaxRisk(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                      <p className="text-xs text-gray-500">Recommended: 1-2%</p>
                    </div>

                    {/* Leverage */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        Leverage
                      </label>
                      <select
                        value={leverage}
                        onChange={(e) => setLeverage(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gray-700 rounded px-3 py-2 text-gray-200 text-sm"
                      >
                        {["1:1", "1:5", "1:10", "1:50", "1:100", "1:500"].map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>

                    {/* Stop Loss */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          ⛔ Stop Loss
                        </span>
                        <span className="text-red-400 font-mono text-sm">{stopLossPercent}%</span>
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={stopLossPercent}
                        onChange={(e) => setStopLossPercent(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                      />
                    </div>

                    {/* Take Profit */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          ✅ Take Profit
                        </span>
                        <span className="text-green-400 font-mono text-sm">{takeProfitPercent}%</span>
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="20"
                        step="0.1"
                        value={takeProfitPercent}
                        onChange={(e) => setTakeProfitPercent(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                      />
                    </div>

                    {/* Risk Reward */}
                    <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-3">
                      <div className="text-xs font-semibold text-purple-300 mb-2">Risk/Reward Ratio</div>
                      <div className="text-2xl font-bold text-purple-400">
                        1:{(takeProfitPercent / stopLossPercent).toFixed(2)}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ALERTS TAB */}
                {activeTab === "alerts" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Price Alerts */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900/30 border border-gray-700/50">
                      <div>
                        <div className="text-sm font-semibold text-gray-300">Price Alerts</div>
                        <div className="text-xs text-gray-500">Get notified on price movements</div>
                      </div>
                      <button
                        onClick={() => setPriceAlerts(!priceAlerts)}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                          priceAlerts ? "bg-green-500" : "bg-gray-700"
                        )}
                      >
                        <motion.span
                          layout
                          className="inline-block h-4 w-4 transform rounded-full bg-white"
                          animate={{ x: priceAlerts ? 20 : 2 }}
                          transition={{ type: "spring", stiffness: 500, damping: 40 }}
                        />
                      </button>
                    </div>

                    {/* Signal Alerts */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900/30 border border-gray-700/50">
                      <div>
                        <div className="text-sm font-semibold text-gray-300">Trading Signals</div>
                        <div className="text-xs text-gray-500">AI-detected buy/sell signals</div>
                      </div>
                      <button
                        onClick={() => setSignalAlerts(!signalAlerts)}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                          signalAlerts ? "bg-blue-500" : "bg-gray-700"
                        )}
                      >
                        <motion.span
                          layout
                          className="inline-block h-4 w-4 transform rounded-full bg-white"
                          animate={{ x: signalAlerts ? 20 : 2 }}
                          transition={{ type: "spring", stiffness: 500, damping: 40 }}
                        />
                      </button>
                    </div>

                    {/* News Alerts */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900/30 border border-gray-700/50">
                      <div>
                        <div className="text-sm font-semibold text-gray-300">Market News</div>
                        <div className="text-xs text-gray-500">Important announcements alert</div>
                      </div>
                      <button
                        onClick={() => setNewsAlerts(!newsAlerts)}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                          newsAlerts ? "bg-yellow-500" : "bg-gray-700"
                        )}
                      >
                        <motion.span
                          layout
                          className="inline-block h-4 w-4 transform rounded-full bg-white"
                          animate={{ x: newsAlerts ? 20 : 2 }}
                          transition={{ type: "spring", stiffness: 500, damping: 40 }}
                        />
                      </button>
                    </div>

                    {/* Max Daily Loss */}
                    <div className="space-y-2 pt-3 border-t border-gray-700/50">
                      <label className="text-sm font-semibold text-gray-300 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-red-400" />
                          Max Daily Loss
                        </span>
                        <span className="text-red-400 font-mono">${maxDailyLoss}</span>
                      </label>
                      <input
                        type="number"
                        min="100"
                        step="50"
                        value={maxDailyLoss}
                        onChange={(e) => setMaxDailyLoss(parseInt(e.target.value))}
                        className="w-full bg-gray-900/50 border border-gray-700 rounded px-3 py-2 text-gray-200 text-sm"
                      />
                      <p className="text-xs text-gray-500">Trading stops when this limit is reached</p>
                    </div>
                  </motion.div>
                )}

                {/* API TAB */}
                {activeTab === "api" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-3 flex gap-2 text-xs text-yellow-300">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>Never share your API key with anyone. Keep it private!</span>
                    </div>

                    {/* API Key Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                        <Key className="w-4 h-4 text-purple-400" />
                        Trading Platform API Key
                      </label>
                      <div className="flex gap-2">
                        <input
                          type={showApiKey ? "text" : "password"}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="sk_live_51..."
                          className="flex-1 bg-gray-900/50 border border-gray-700 rounded px-3 py-2 text-gray-200 text-sm"
                        />
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="px-3 py-2 bg-gray-900/50 border border-gray-700 rounded hover:border-gray-600 transition-all"
                        >
                          {showApiKey ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    {/* Save Key Button */}
                    <button
                      onClick={handleSaveApiKey}
                      className="w-full py-2 px-4 rounded-lg font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                    >
                      Save API Key
                    </button>

                    {/* API Status */}
                    <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-300">Connection Status</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-xs text-green-400">Connected</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-300">Last Sync</span>
                        <span className="text-xs text-blue-400 font-mono">2 min ago</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-700/50 px-6 py-4 flex gap-3 flex-shrink-0 bg-black/50">
                <button
                  onClick={onClose}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-lg border border-gray-600/50 text-gray-300",
                    "hover:border-gray-500 hover:bg-gray-900/50 transition-all"
                  )}
                >
                  Close
                </button>
                <button
                  onClick={onClose}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-lg font-medium",
                    "bg-gradient-to-r from-cyan-500 to-purple-500 text-white",
                    "hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                  )}
                >
                  Save All
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
