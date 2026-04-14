"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDashboardStore } from "../../lib/store";
import { useT } from "../../lib/i18n";
import { Tooltip } from "../ui/tooltip";
import { ProfileModal } from "./ProfileModal";
import { BottomSheetSettings } from "./BottomSheetSettings";
import { Bell, BellOff, Settings, User } from "lucide-react";
import { cn } from "../../lib/utils";
import { usePush } from "../../lib/use-push";
import { useAuthStore } from "@/lib/auth-store";

// ─── NEON CONFIG ─────────────────────────────────────────────────────────────
const TITLE = "TradeMind";

// Each letter → gradient from deep blue → indigo → violet
const NEON: { color: string; glow: string }[] = [
  { color: "#3b82f6", glow: "rgba(59,130,246,0.9)"  },  // T  blue-500
  { color: "#5b70f5", glow: "rgba(91,112,245,0.9)"  },  // r  blue-indigo
  { color: "#6366f1", glow: "rgba(99,102,241,0.9)"  },  // a  indigo-500
  { color: "#7c5cf8", glow: "rgba(124,92,248,0.9)"  },  // d  indigo-violet
  { color: "#8b5cf6", glow: "rgba(139,92,246,0.9)"  },  // e  violet-500
  { color: "#9333ea", glow: "rgba(147,51,234,0.9)"  },  // M  purple-600
  { color: "#a855f7", glow: "rgba(168,85,247,0.9)"  },  // i  purple-500
  { color: "#a78bfa", glow: "rgba(167,139,250,0.9)" },  // n  violet-400
  { color: "#c084fc", glow: "rgba(192,132,252,0.9)" },  // d  purple-400
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function TopStatusBar() {
  const t = useT();

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
    subscribed                   ? "Push notifications on — click to disable" :
                                   "Enable push notifications";

  const bellActive = subscribed && permission === "granted";

  if (!mounted) return null;

  return (
    <>
      <div
        className="fixed top-0 left-0 md:left-56 right-0 z-50 flex items-center justify-between h-16 px-4 md:px-8"
        style={{
          background: "rgba(2,4,20,0.94)",
          borderBottom: "1px solid rgba(6,182,212,0.12)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
        }}
      >
        {/* ── LEFT (reserved) ──────────────────────────────── */}
        <div className="flex-1" />

        {/* ── CENTER — neon title ───────────────────────────── */}
        <div className="flex-1 flex items-center justify-center">
          <Link href="/app" className="relative flex items-center gap-3 select-none cursor-pointer group">

            {/* background aura */}
            <div
              className="absolute pointer-events-none"
              style={{
                inset: "-10px -30px",
                background:
                  "radial-gradient(ellipse at center, rgba(99,102,241,0.22), transparent 68%)",
                filter: "blur(14px)",
              }}
            />

            {/* Logo */}
            <Image
              src="/logo.jpg"
              alt="TradeMind Logo"
              width={34}
              height={34}
              className="rounded-full object-cover shrink-0 relative z-10 ring-1 ring-violet-500/40"
            />

            {/* Static neon letters */}
            <div className="flex items-baseline relative z-10" style={{ gap: "2px" }}>
              {TITLE.split("").map((char, idx) => {
                const { color, glow } = NEON[idx];
                return (
                  <span
                    key={idx}
                    style={{
                      display:      "inline-block",
                      width:        "1.05rem",
                      textAlign:    "center",
                      fontWeight:   800,
                      fontSize:     "1.45rem",
                      lineHeight:   1,
                      color:        "#ffffff",
                      textShadow:   `0 0 7px ${glow}, 0 0 18px ${color}bb, 0 0 38px ${color}55`,
                    }}
                  >
                    {char}
                  </span>
                );
              })}
            </div>

          </Link>
        </div>

        {/* ── RIGHT — controls ─────────────────────────────── */}
        <div className="flex-1 flex items-center justify-end gap-1.5 sm:gap-2.5">

          {/* Bell — hidden on mobile to save space */}
          <Tooltip content={bellLabel}>
            <button
              onClick={() => permission !== "unsupported" && !busy && toggle(token ?? undefined)}
              disabled={permission === "unsupported" || busy}
              className={cn(
                "hidden sm:flex p-2 rounded-lg border transition-colors relative",
                bellActive
                  ? "bg-cyan-500/10 border-cyan-500/25 hover:bg-cyan-500/15"
                  : permission === "denied"
                  ? "border-orange-500/25 bg-orange-500/5 hover:bg-orange-500/10"
                  : "border-slate-700/25 bg-slate-800/20 hover:bg-slate-800/40",
                (permission === "unsupported") && "opacity-40 cursor-not-allowed",
              )}
            >
              {busy ? (
                <span style={{
                  display: "inline-block",
                  width: 17, height: 17,
                  borderRadius: "50%",
                  border: "1.5px solid rgba(45,212,191,0.2)",
                  borderTopColor: "#2dd4bf",
                  animation: "tmSpin 0.7s linear infinite",
                }} />
              ) : bellActive ? (
                <Bell size={17} style={{ color: "#2dd4bf", filter: "drop-shadow(0 0 7px rgba(45,212,191,0.65))" }} />
              ) : permission === "denied" ? (
                <BellOff size={17} style={{ color: "#f97316" }} />
              ) : (
                <Bell size={17} style={{ color: "#64748b" }} />
              )}
            </button>
          </Tooltip>
          <style>{`@keyframes tmSpin { to { transform: rotate(360deg); } }`}</style>

          {/* Settings */}
          <Tooltip content={t("settings")}>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg border border-slate-700/25 bg-slate-800/20 hover:bg-slate-800/40 transition-colors"
            >
              <Settings size={17} style={{ color: "#2dd4bf", filter: "drop-shadow(0 0 7px rgba(45,212,191,0.65))" }} />
            </button>
          </Tooltip>

          {/* Profile */}
          <Tooltip content={t("profile")}>
            <button
              onClick={() => setProfileOpen(true)}
              className="p-2 rounded-lg border border-slate-700/25 bg-slate-800/20 hover:bg-slate-800/40 transition-colors"
            >
              <User size={17} style={{ color: "#2dd4bf", filter: "drop-shadow(0 0 7px rgba(45,212,191,0.65))" }} />
            </button>
          </Tooltip>
        </div>
      </div>

      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      <BottomSheetSettings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
