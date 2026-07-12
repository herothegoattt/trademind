"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useDashboardStore } from "../../lib/store";
import { useT } from "../../lib/i18n";
import { ProfileModal } from "./ProfileModal";
import { BottomSheetSettings } from "./BottomSheetSettings";
import { Bell, BellOff, Settings, User, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { usePush } from "../../lib/use-push";
import { useAuthStore } from "@/lib/auth-store";

const PAGE_LABELS: Record<string, string> = {
  "/app":             "Dashboard",
  "/journal":         "Journal",
  "/setups":          "Setups",
  "/daily-bias":      "Daily Bias",
  "/markets":         "Markets",
  "/news":            "News",
  "/community-edge":  "Community Edge",
  "/trader-dna":      "Trader DNA",
  "/investing":       "Investing",
  "/analytics-lab":   "Analytics Lab",
  "/decision-errors": "Decision Errors",
};

export function TopStatusBar() {
  const t = useT();
  const pathname = usePathname();

  const [mounted,      setMounted]      = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { permission, subscribed, busy, toggle } = usePush();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    useDashboardStore.getState().initDashboard();
    setMounted(true);
  }, []);

  const bellLabel =
    permission === "unsupported" ? "Push not supported in this browser" :
    permission === "denied"      ? "Push blocked — enable in browser settings" :
    subscribed                   ? "Notifications on — click to disable" :
                                   "Enable push notifications";

  const bellActive = subscribed && permission === "granted";
  const pageLabel = PAGE_LABELS[pathname] ?? "TradeMind";

  if (!mounted) return null;

  return (
    <>
      <div
        data-entrance="bar"
        className="fixed top-0 left-0 md:left-56 right-0 z-50 flex items-center h-16 px-4 md:px-5"
        style={{
          background: "var(--bg-bar)",
          borderBottom: "1px solid rgba(255,255,255,0.055)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* ── LEFT — page title (desktop) / logo (mobile) ─── */}
        <div className="flex-1 flex items-center">
          {/* Mobile: logo */}
          <Link href="/app" className="flex md:hidden items-center gap-2 select-none">
            <Image
              src="/logo.jpg"
              alt="TradeMind"
              width={28}
              height={28}
              className="rounded-lg object-cover"
              style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.1)" }}
            />
            <span className="text-sm font-semibold tracking-tight neon-white" style={{ color: "#edf0f5" }}>
              TradeMind
            </span>
          </Link>

          {/* Desktop: page title */}
          <div className="hidden md:flex items-center gap-3">
            {pathname === "/app" ? (
              /* AI Core indicator — replaces plain "Dashboard" text */
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, rgba(34,211,238,0.14), rgba(99,102,246,0.10))",
                    border: "1px solid rgba(34,211,238,0.22)",
                  }}
                  animate={{
                    boxShadow: [
                      "0 0 6px rgba(34,211,238,0.18)",
                      "0 0 14px rgba(34,211,238,0.42), 0 0 28px rgba(34,211,238,0.1)",
                      "0 0 6px rgba(34,211,238,0.18)",
                    ],
                  }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.span
                    animate={{ filter: [
                      "drop-shadow(0 0 2px rgba(34,211,238,0.7))",
                      "drop-shadow(0 0 5px rgba(34,211,238,1)) drop-shadow(0 0 10px rgba(34,211,238,0.4))",
                      "drop-shadow(0 0 2px rgba(34,211,238,0.7))",
                    ]}}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Brain size={11} style={{ color: "#22d3ee" }} />
                  </motion.span>
                </motion.div>
                <motion.h1
                  className="text-[13px] font-semibold neon-cyan"
                  animate={{
                    textShadow: [
                      "0 0 4px rgba(34,211,238,0.5), 0 0 10px rgba(34,211,238,0.2)",
                      "0 0 7px rgba(34,211,238,0.9), 0 0 18px rgba(34,211,238,0.45), 0 0 36px rgba(34,211,238,0.12)",
                      "0 0 4px rgba(34,211,238,0.5), 0 0 10px rgba(34,211,238,0.2)",
                    ],
                    color: "#22d3ee",
                  }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  AI Core
                </motion.h1>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                  style={{
                    background: "rgba(34,211,238,0.07)",
                    border: "1px solid rgba(34,211,238,0.13)",
                    color: "rgba(34,211,238,0.65)",
                    fontFamily: "monospace",
                    letterSpacing: "0.12em",
                  }}
                >
                  LIVE
                </span>
              </div>
            ) : (
              <>
                <h1 className="text-[13px] font-semibold neon-white" style={{ color: "#edf0f5" }}>
                  {pageLabel}
                </h1>
                <span
                  className="hidden lg:block text-[11px] font-medium px-2 py-0.5 rounded-md neon-cyan"
                  style={{
                    background: "rgba(34,211,238,0.08)",
                    border: "1px solid rgba(34,211,238,0.14)",
                  }}
                >
                  AI-powered
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT — controls ───────────────────────────────── */}
        <div className="flex items-center gap-1">
          <style>{`@keyframes tmSpin { to { transform: rotate(360deg); } }`}</style>

          {/* Bell */}
          <button
            onClick={() => permission !== "unsupported" && !busy && toggle(token ?? undefined)}
            disabled={permission === "unsupported" || busy}
            title={bellLabel}
            className={cn(
              "hidden sm:flex w-8 h-8 items-center justify-center rounded-lg transition-all",
              bellActive
                ? "text-cyan-400"
                : permission === "denied"
                ? "text-orange-400/50"
                : "text-slate-500 hover:text-slate-300",
              permission === "unsupported" && "opacity-30 cursor-not-allowed",
            )}
            style={{
              background: bellActive ? "rgba(34,211,238,0.07)" : "transparent",
              border: bellActive ? "1px solid rgba(34,211,238,0.14)" : "1px solid transparent",
            }}
          >
            {busy ? (
              <span style={{
                display: "inline-block", width: 13, height: 13,
                borderRadius: "50%",
                border: "1.5px solid rgba(34,211,238,0.2)",
                borderTopColor: "#22d3ee",
                animation: "tmSpin 0.7s linear infinite",
              }} />
            ) : bellActive ? (
              <Bell size={14} />
            ) : permission === "denied" ? (
              <BellOff size={14} />
            ) : (
              <Bell size={14} />
            )}
          </button>

          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            title={t("settings")}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-all"
            style={{ border: "1px solid transparent" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.borderColor = "transparent";
            }}
          >
            <Settings size={14} />
          </button>

          {/* Profile */}
          <button
            onClick={() => setProfileOpen(true)}
            title={t("profile")}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-all"
            style={{ border: "1px solid transparent" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.borderColor = "transparent";
            }}
          >
            <User size={14} />
          </button>
        </div>
      </div>

      <ProfileModal  isOpen={profileOpen}  onClose={() => setProfileOpen(false)}  />
      <BottomSheetSettings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
