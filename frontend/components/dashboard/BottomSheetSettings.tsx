"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Sun, Moon, Bell, BellOff, Download, LogOut,
  Settings2, AlertCircle, Key,
  TrendingUp, ChevronRight, Send, PlayCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useDashboardStore } from "../../lib/store";
import { setLang, useT } from "../../lib/i18n";
import { usePush } from "../../lib/use-push";
import { useAuthStore } from "@/lib/auth-store";

interface BottomSheetSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const LANGS = [
  { code: "en", flag: "🇺🇸", label: "English" },
  { code: "ru", flag: "🇷🇺", label: "Русский" },
  { code: "uz", flag: "🇺🇿", label: "Ўзбек" },
];

const TABS = [
  { id: "general",  labelKey: "tab_general",  icon: Settings2  },
  { id: "trading",  labelKey: "tab_trading",  icon: TrendingUp },
  { id: "alerts",   labelKey: "tab_alerts",   icon: Bell       },
  { id: "api",      labelKey: "tab_api",      icon: Key        },
] as const;

type Tab = typeof TABS[number]["id"];

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200",
        on ? "bg-cyan-500" : "bg-white/10"
      )}
    >
      <motion.span
        layout
        className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow"
        animate={{ x: on ? 18 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 40 }}
      />
    </button>
  );
}

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-white/[0.05] last:border-0">
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-200">{label}</div>
        {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export function BottomSheetSettings({ isOpen, onClose }: BottomSheetSettingsProps) {
  const language    = useDashboardStore((s: any) => s.language);
  const setLanguage = useDashboardStore((s: any) => s.setLanguage);
  const theme       = useDashboardStore((s: any) => s.theme) as "dark" | "light";
  const setTheme    = useDashboardStore((s: any) => s.setTheme);

  const [activeTab,    setActiveTab]    = useState<Tab>("general");
  const [positionSize, setPositionSize] = useState(0.1);
  const [maxRisk,      setMaxRisk]      = useState(2);
  const [leverage,     setLeverage]     = useState("1:1");
  const [stopLoss,     setStopLoss]     = useState(2);
  const [takeProfit,   setTakeProfit]   = useState(4);
  const [maxDailyLoss, setMaxDailyLoss] = useState(500);
  const [apiKey,       setApiKey]       = useState("");
  const [showApiKey,   setShowApiKey]   = useState(false);
  const [testSent,     setTestSent]     = useState(false);

  const { permission, subscribed, prefs, busy, toggle, updatePrefs } = usePush();
  const token = useAuthStore((s) => s.token);

  const sendTest = async () => {
    setTestSent(false);
    await fetch("/api/push/send", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "TradeMind",
        body:  "Push notifications are working correctly ✓",
        url:   "/app",
        tag:   "test",
      }),
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const t = useT();

  const handleLang = (code: string) => {
    setLang(code as any);
    setLanguage(code);
  };

  return (
    <>
    <style>{`@keyframes tmSpin { to { transform: rotate(360deg); } }`}</style>
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: "var(--bg-modal)",
                border: "1px solid var(--border)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(6,182,212,0.06)",
                maxHeight: "min(88vh, 680px)",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.2)" }}
                  >
                    <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <span className="text-sm font-semibold text-white">{t("settings")}</span>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/08"
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Body: sidebar + content */}
              <div className="flex flex-1 min-h-0">
                {/* Sidebar */}
                <div
                  className="w-40 flex-shrink-0 py-3 flex flex-col gap-0.5"
                  style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}
                >
                  {TABS.map(({ id, labelKey, icon: Icon }) => {
                    const active = activeTab === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={cn(
                          "mx-2 flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                          active
                            ? "bg-cyan-500/10 text-cyan-300"
                            : "text-gray-500 hover:text-gray-300 hover:bg-white/04"
                        )}
                      >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-medium">{t(labelKey)}</span>
                        {active && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
                      </button>
                    );
                  })}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <AnimatePresence mode="wait">
                    {/* ── GENERAL ─────────────────────────────────── */}
                    {activeTab === "general" && (
                      <motion.div
                        key="general"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-1"
                      >
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t("appearance")}</p>

                        {/* Theme */}
                        <Row label={t("theme")} sub={t("interface_color_scheme")}>
                          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                            <button
                              onClick={() => setTheme("dark")}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all",
                                theme === "dark"
                                  ? "bg-white/10 text-white"
                                  : "text-gray-500 hover:text-gray-300"
                              )}
                            >
                              <Moon className="w-3.5 h-3.5" />
                              {t("dark")}
                            </button>
                            <button
                              onClick={() => setTheme("light")}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all",
                                theme === "light"
                                  ? "bg-white/10 text-white"
                                  : "text-gray-500 hover:text-gray-300"
                              )}
                            >
                              <Sun className="w-3.5 h-3.5" />
                              {t("light")}
                            </button>
                          </div>
                        </Row>

                        {/* Language */}
                        <Row label={t("language")} sub={t("interface_language")}>
                          <div className="flex gap-1">
                            {LANGS.map((lang) => {
                              const active = language === lang.code;
                              return (
                                <button
                                  key={lang.code}
                                  onClick={() => handleLang(lang.code)}
                                  className={cn(
                                    "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                                    active
                                      ? "bg-cyan-500/15 text-cyan-300"
                                      : "text-gray-500 hover:text-gray-300 hover:bg-white/05"
                                  )}
                                  style={active ? { border: "1px solid rgba(6,182,212,0.3)" } : { border: "1px solid transparent" }}
                                >
                                  <span>{lang.flag}</span>
                                  <span>{lang.code.toUpperCase()}</span>
                                </button>
                              );
                            })}
                          </div>
                        </Row>

                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-5 mb-3">{t("account")}</p>

                        <button
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/05 transition-all"
                          style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          <Download className="w-4 h-4 text-cyan-400" />
                          <div className="text-left">
                            <div className="font-medium">{t("export_data")}</div>
                            <div className="text-xs text-gray-500">{t("download_history")}</div>
                          </div>
                        </button>

                        <button
                          onClick={onClose}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/08 transition-all mt-1"
                          style={{ border: "1px solid rgba(239,68,68,0.12)" }}
                        >
                          <LogOut className="w-4 h-4" />
                          <div className="text-left">
                            <div className="font-medium">{t("sign_out")}</div>
                            <div className="text-xs text-red-400/60">{t("log_out_account")}</div>
                          </div>
                        </button>
                      </motion.div>
                    )}

                    {/* ── TRADING ─────────────────────────────────── */}
                    {activeTab === "trading" && (
                      <motion.div
                        key="trading"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-1"
                      >
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t("risk_management")}</p>

                        <Row label={t("position_size")} sub={t("default_lot_size")}>
                          <input
                            type="number"
                            min="0.01"
                            step="0.1"
                            value={positionSize}
                            onChange={(e) => setPositionSize(parseFloat(e.target.value))}
                            className="w-20 text-right bg-white/05 border border-white/08 rounded-lg px-3 py-1.5 text-sm text-gray-200 outline-none focus:border-cyan-500/50"
                          />
                        </Row>

                        <Row label={t("max_risk_per_trade")} sub={`${maxRisk}%`}>
                          <div className="flex items-center gap-3 w-40">
                            <input
                              type="range" min="0.1" max="5" step="0.1"
                              value={maxRisk}
                              onChange={(e) => setMaxRisk(parseFloat(e.target.value))}
                              className="flex-1 h-1.5 rounded-full accent-orange-500 cursor-pointer"
                              style={{ background: "rgba(255,255,255,0.1)" }}
                            />
                            <span className="text-xs font-mono text-orange-400 w-8 text-right">{maxRisk}%</span>
                          </div>
                        </Row>

                        <Row label={t("leverage")} sub={t("trading_leverage_ratio")}>
                          <select
                            value={leverage}
                            onChange={(e) => setLeverage(e.target.value)}
                            className="bg-white/05 border border-white/08 rounded-lg px-3 py-1.5 text-sm text-gray-200 outline-none focus:border-cyan-500/50"
                          >
                            {["1:1", "1:5", "1:10", "1:50", "1:100", "1:500"].map((l) => (
                              <option key={l} value={l} style={{ background: "#0d0f1a" }}>{l}</option>
                            ))}
                          </select>
                        </Row>

                        <Row label={t("stop_loss")} sub={`${stopLoss}%`}>
                          <div className="flex items-center gap-3 w-40">
                            <input
                              type="range" min="0.1" max="10" step="0.1"
                              value={stopLoss}
                              onChange={(e) => setStopLoss(parseFloat(e.target.value))}
                              className="flex-1 h-1.5 rounded-full accent-red-500 cursor-pointer"
                              style={{ background: "rgba(255,255,255,0.1)" }}
                            />
                            <span className="text-xs font-mono text-red-400 w-8 text-right">{stopLoss}%</span>
                          </div>
                        </Row>

                        <Row label={t("take_profit")} sub={`${takeProfit}%`}>
                          <div className="flex items-center gap-3 w-40">
                            <input
                              type="range" min="0.1" max="20" step="0.1"
                              value={takeProfit}
                              onChange={(e) => setTakeProfit(parseFloat(e.target.value))}
                              className="flex-1 h-1.5 rounded-full accent-green-500 cursor-pointer"
                              style={{ background: "rgba(255,255,255,0.1)" }}
                            />
                            <span className="text-xs font-mono text-green-400 w-8 text-right">{takeProfit}%</span>
                          </div>
                        </Row>

                        <div
                          className="mt-4 flex items-center justify-between px-3 py-3 rounded-xl"
                          style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}
                        >
                          <span className="text-xs text-purple-400 font-medium">{t("risk_reward")}</span>
                          <span className="text-lg font-bold text-purple-300 font-mono">
                            1:{(takeProfit / stopLoss).toFixed(2)}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* ── ALERTS ──────────────────────────────────── */}
                    {activeTab === "alerts" && (
                      <motion.div
                        key="alerts"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-1"
                      >
                        {/* Push status banner */}
                        {permission === "denied" && (
                          <div className="flex gap-2 px-3 py-2.5 rounded-xl text-xs text-orange-300 mb-3"
                            style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.2)" }}>
                            <BellOff className="w-3.5 h-3.5 shrink-0 mt-0.5 text-orange-400" />
                            Push blocked by browser. Open browser settings → Site permissions → Notifications → Allow.
                          </div>
                        )}
                        {permission === "unsupported" && (
                          <div className="flex gap-2 px-3 py-2.5 rounded-xl text-xs text-gray-400 mb-3"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            Push notifications are not supported in this browser.
                          </div>
                        )}

                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                          Push Notifications
                        </p>

                        {/* Master push toggle */}
                        <Row
                          label="Enable Push"
                          sub={subscribed ? "Active — receiving notifications" : "Click to subscribe"}
                        >
                          {busy ? (
                            <span style={{
                              display: "inline-block", width: 16, height: 16,
                              borderRadius: "50%",
                              border: "1.5px solid rgba(45,212,191,0.2)",
                              borderTopColor: "#2dd4bf",
                              animation: "tmSpin 0.7s linear infinite",
                            }} />
                          ) : (
                            <Toggle
                              on={subscribed}
                              onChange={() => permission !== "unsupported" && toggle(token ?? undefined)}
                            />
                          )}
                        </Row>

                        {/* Per-channel prefs — only shown when subscribed */}
                        {subscribed && (
                          <>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-5 mb-3">
                              Channels
                            </p>
                            <Row label="Daily Bias" sub="Morning market direction alert">
                              <Toggle on={prefs.daily_bias} onChange={() => updatePrefs({ daily_bias: !prefs.daily_bias })} />
                            </Row>
                            <Row label="Trading Signals" sub="AI buy/sell signal alerts">
                              <Toggle on={prefs.trading_signals} onChange={() => updatePrefs({ trading_signals: !prefs.trading_signals })} />
                            </Row>
                            <Row label="Price Alerts" sub="Notify on price movements">
                              <Toggle on={prefs.price_alerts} onChange={() => updatePrefs({ price_alerts: !prefs.price_alerts })} />
                            </Row>
                            <Row label="Market News" sub="Important announcements">
                              <Toggle on={prefs.news} onChange={() => updatePrefs({ news: !prefs.news })} />
                            </Row>

                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-5 mb-3">
                              Test
                            </p>
                            <button
                              onClick={sendTest}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/05 transition-all"
                              style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                            >
                              <Send className="w-4 h-4 text-cyan-400" />
                              <div className="text-left">
                                <div className="font-medium">
                                  {testSent ? "Sent ✓" : "Send test notification"}
                                </div>
                                <div className="text-xs text-gray-500">Delivers a sample push right now</div>
                              </div>
                            </button>
                          </>
                        )}

                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-5 mb-3">{t("limits")}</p>

                        <Row label={t("max_daily_loss")} sub={t("stop_trading_threshold")}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-500">$</span>
                            <input
                              type="number" min="100" step="50"
                              value={maxDailyLoss}
                              onChange={(e) => setMaxDailyLoss(parseInt(e.target.value))}
                              className="w-20 text-right bg-white/05 border border-white/08 rounded-lg px-3 py-1.5 text-sm text-gray-200 outline-none focus:border-cyan-500/50"
                            />
                          </div>
                        </Row>
                      </motion.div>
                    )}

                    {/* ── API ─────────────────────────────────────── */}
                    {activeTab === "api" && (
                      <motion.div
                        key="api"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-4"
                      >
                        <div
                          className="flex gap-2.5 px-3 py-2.5 rounded-xl text-xs text-amber-300"
                          style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}
                        >
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-400" />
                          {t("api_key_warning")}
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-400">{t("trading_platform_api_key")}</label>
                          <div className="flex gap-2">
                            <input
                              type={showApiKey ? "text" : "password"}
                              value={apiKey}
                              onChange={(e) => setApiKey(e.target.value)}
                              placeholder="sk_live_..."
                              className="flex-1 bg-white/05 border border-white/08 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-cyan-500/50 font-mono"
                            />
                            <button
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="px-3 py-2 text-xs text-gray-400 hover:text-gray-200 bg-white/05 border border-white/08 rounded-lg hover:border-white/15 transition-all"
                            >
                              {showApiKey ? t("hide") : t("show")}
                            </button>
                          </div>
                        </div>

                        <button className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-600 to-purple-600 text-white hover:opacity-90 transition-opacity">
                          {t("save_api_key")}
                        </button>

                        <div
                          className="px-3 py-3 rounded-xl space-y-2"
                          style={{ background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.1)" }}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">{t("connection")}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                              <span className="text-green-400 font-medium">{t("connected")}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">{t("last_sync")}</span>
                            <span className="text-gray-400 font-mono">2 min ago</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Replay tour — hidden in footer area */}
              <div className="px-6 pt-3 pb-1">
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("restart-tour"));
                    onClose();
                  }}
                  className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-400 transition-colors"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  Replay product tour
                </button>
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between px-6 py-3 flex-shrink-0"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="text-xs text-gray-600">TradeMind v1.0</span>
                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-1.5 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-white/05 transition-all"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-600 to-purple-600 text-white hover:opacity-90 transition-opacity"
                  >
                    {t("save")}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}

