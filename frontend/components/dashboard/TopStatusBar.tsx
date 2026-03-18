"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useDashboardStore } from "../../lib/store";
import { t, setLang, useT } from "../../lib/i18n";
import { Tooltip } from "../ui/tooltip";
import { ProfileModal } from "./ProfileModal";
import { BottomSheetSettings } from "./BottomSheetSettings";
import { Bell, Settings, User, Menu } from "lucide-react";
import { cn } from "../../lib/utils";

export function TopStatusBar() {
  const openRightPanel = useDashboardStore((s: any) => s.openRightPanelDrawer);
  const language = useDashboardStore((s: any) => s.language);
  const setLanguage = useDashboardStore((s: any) => s.setLanguage);
  const [mounted, setMounted] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const t = useT();

  useEffect(() => {
    useDashboardStore.getState().initDashboard();
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const title = "TradeMind";
  const letters = title.split("");

  return (
    <>
      <div className="fixed top-0 left-56 right-0 z-50 flex items-center justify-between h-16 px-8 bg-slate-950 border-b border-slate-800 shadow-sm">
        {/* Left - Empty Space for Future */}
        <div className="flex-1" />

        {/* Center - Animated title */}
        <div className="flex-1 flex items-center justify-center">
          <span className="text-lg font-semibold tracking-wide text-white flex gap-1">
            {letters.map((letter, idx) => (
              <motion.span
                key={`${letter}-${idx}`}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.04, duration: 0.35, ease: "easeOut" }}
                className="inline-block"
              >
                {letter}
              </motion.span>
            ))}
          </span>
        </div>

        {/* Right - Controls */}
        <div className="flex-1 flex items-center justify-end gap-3">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen((o) => !o)}
              className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-white hover:bg-slate-800"
              title={t("language")}
            >
              <span className="text-xl block">
                {language === "ru"
                  ? "🇷🇺"
                  : language === "uz"
                    ? "🇺🇿"
                    : "🇺🇸"}
              </span>
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-slate-900 border border-slate-800 rounded-lg shadow-lg">
                {[
                  { code: "en", flag: "🇺🇸", label: "English" },
                  { code: "ru", flag: "🇷🇺", label: "Русский" },
                  { code: "uz", flag: "🇺🇿", label: "Ўзбек" },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setLang(lang.code as any);
                      setLangMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 flex items-center gap-2 text-sm text-gray-200 hover:bg-slate-800"
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="font-medium">{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <Tooltip content={t("notifications")}>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={cn(
                "p-2 rounded-lg border",
                notificationsEnabled
                  ? "bg-cyan-500/15 border-cyan-500/40"
                  : "bg-slate-700/20 border-slate-600/20"
              )}
            >
              <Bell
                size={18}
                className={
                  notificationsEnabled
                    ? "text-teal-300 drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]"
                    : "text-slate-500"
                }
              />
            </button>
          </Tooltip>

          {/* Settings */}
          <Tooltip content={t("settings")}>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-white hover:bg-slate-800"
            >
              <Settings
                size={18}
                className="text-teal-300 drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]"
              />
            </button>
          </Tooltip>

          {/* Profile */}
          <Tooltip content={t("profile")}>
            <button
              onClick={() => setProfileOpen(true)}
              className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-white hover:bg-slate-800"
            >
              <User
                size={18}
                className="text-teal-300 drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]"
              />
            </button>
          </Tooltip>

          {/* Mobile Menu */}
          <div className="xl:hidden">
            <Tooltip content={t("insights")}>
              <button
                onClick={openRightPanel}
                className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-white hover:bg-slate-800"
              >
                <Menu
                  size={18}
                  className="text-teal-300 drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]"
                />
              </button>
            </Tooltip>
          </div>
        </div>      </div>

      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      <BottomSheetSettings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}