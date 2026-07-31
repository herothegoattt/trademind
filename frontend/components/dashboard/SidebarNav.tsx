"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardStore } from "../../lib/store";
import { useRequireAuth } from "../../lib/use-require-auth";
import { useT } from "../../lib/i18n";
import { Section } from "../../lib/types";
import { cn } from "../../lib/utils";
import {
  BookOpen, Settings, Activity, Globe, FileText,
  Compass, User, TrendingUp, AlertTriangle, FlaskConical,
  MoreHorizontal, X, BarChart2,
} from "lucide-react";

/* ── Per-item color config ────────────────────────────────────── */
const COLOR: Record<string, { icon: string; active: string; bar: string; glow: string }> = {
  "/journal":         { icon: "#22d3ee", active: "rgba(34,211,238,0.09)",  bar: "#22d3ee", glow: "34,211,238"  },
  "/setups":          { icon: "#818cf8", active: "rgba(129,140,248,0.09)", bar: "#818cf8", glow: "129,140,248" },
  "/daily-bias":      { icon: "#fbbf24", active: "rgba(251,191,36,0.09)",  bar: "#fbbf24", glow: "251,191,36"  },
  "/markets":         { icon: "#60a5fa", active: "rgba(96,165,250,0.09)",  bar: "#60a5fa", glow: "96,165,250"  },
  "/news":            { icon: "#a78bfa", active: "rgba(167,139,250,0.09)", bar: "#a78bfa", glow: "167,139,250" },
  "/community-edge":  { icon: "#34d399", active: "rgba(52,211,153,0.09)",  bar: "#34d399", glow: "52,211,153"  },
  "/trader-dna":      { icon: "#c084fc", active: "rgba(192,132,252,0.09)", bar: "#c084fc", glow: "192,132,252" },
  "/investing":       { icon: "#4ade80", active: "rgba(74,222,128,0.09)",  bar: "#4ade80", glow: "74,222,128"  },
  "/analytics-lab":   { icon: "#fb923c", active: "rgba(251,146,60,0.09)",  bar: "#fb923c", glow: "251,146,60"  },
  "/decision-errors": { icon: "#f59e0b", active: "rgba(245,158,11,0.09)",  bar: "#f59e0b", glow: "245,158,11"  },
  "/backtesting":     { icon: "#22d3ee", active: "rgba(34,211,238,0.09)",  bar: "#22d3ee", glow: "34,211,238"  },
};

const navGroups = [
  {
    label: "Workspace",
    items: [
      { section: "Journal",        path: "/journal",        Icon: BookOpen,      labelKey: "section_journal"        },
      { section: "Setups",         path: "/setups",         Icon: Settings,      labelKey: "section_setups"         },
      { section: "Daily Bias",     path: "/daily-bias",     Icon: Compass,       labelKey: "section_daily_bias"     },
    ],
  },
  {
    label: "Markets",
    items: [
      { section: "Markets",        path: "/markets",        Icon: Globe,         labelKey: "section_markets"        },
      { section: "News",           path: "/news",           Icon: FileText,      labelKey: "section_news"           },
    ],
  },
  {
    label: "Insights",
    items: [
      { section: "Community Edge", path: "/community-edge", Icon: Activity,      labelKey: "section_community_edge" },
      { section: "Trader DNA",     path: "/trader-dna",     Icon: User,          labelKey: "section_trader_dna"     },
      { section: "Investing",      path: "/investing",      Icon: TrendingUp,    labelKey: "section_investing"      },
      { section: "Analytics Lab",  path: "/analytics-lab",  Icon: FlaskConical,  labelKey: "section_analytics_lab"  },
      { section: "Decision Errors",path: "/decision-errors",Icon: AlertTriangle, labelKey: "decision_errors"        },
      { section: "Backtesting",    path: "/backtesting",    Icon: BarChart2,     labelKey: "section_backtesting"    },
    ],
  },
];

const mobileItems = [
  { section: "Journal",    path: "/journal",    Icon: BookOpen, labelKey: "section_journal"    },
  { section: "Setups",     path: "/setups",     Icon: Settings, labelKey: "section_setups"     },
  { section: "Markets",    path: "/markets",    Icon: Globe,    labelKey: "section_markets"    },
  { section: "News",       path: "/news",       Icon: FileText, labelKey: "section_news"       },
  { section: "Daily Bias", path: "/daily-bias", Icon: Compass,  labelKey: "section_daily_bias" },
];

const moreItems = [
  { section: "Community Edge",  path: "/community-edge",  Icon: Activity,      labelKey: "section_community_edge" },
  { section: "Trader DNA",      path: "/trader-dna",      Icon: User,          labelKey: "section_trader_dna"     },
  { section: "Investing",       path: "/investing",        Icon: TrendingUp,    labelKey: "section_investing"      },
  { section: "Analytics Lab",   path: "/analytics-lab",    Icon: FlaskConical,  labelKey: "section_analytics_lab"  },
  { section: "Decision Errors", path: "/decision-errors",  Icon: AlertTriangle, labelKey: "decision_errors"        },
  { section: "Backtesting",     path: "/backtesting",      Icon: BarChart2,     labelKey: "section_backtesting"    },
];

/* Icon with animated neon glow when active */
function NeonIcon({ Icon, active, color, glow }: { Icon: any; active: boolean; color: string; glow: string }) {
  return (
    <motion.span
      className="mr-2.5 flex-shrink-0"
      animate={active ? {
        filter: [
          `drop-shadow(0 0 2px rgba(${glow},0.7)) drop-shadow(0 0 6px rgba(${glow},0.35))`,
          `drop-shadow(0 0 5px rgba(${glow},1))   drop-shadow(0 0 14px rgba(${glow},0.6)) drop-shadow(0 0 28px rgba(${glow},0.2))`,
          `drop-shadow(0 0 2px rgba(${glow},0.7)) drop-shadow(0 0 6px rgba(${glow},0.35))`,
        ],
        color,
      } : {
        filter: "none",
        color: "rgba(71,85,105,0.8)",
      }}
      transition={active ? {
        filter: { duration: 4, repeat: Infinity, ease: "easeInOut" },
        color:  { duration: 0.2 },
      } : { duration: 0.2 }}
    >
      <Icon size={15} strokeWidth={active ? 2 : 1.7} />
    </motion.span>
  );
}

/* Pulsing neon dot */
function NeonDot({ color, glow }: { color: string; glow: string }) {
  return (
    <motion.span
      className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
      style={{ background: color }}
      animate={{
        boxShadow: [
          `0 0 4px rgba(${glow},0.8), 0 0 10px rgba(${glow},0.4)`,
          `0 0 8px rgba(${glow},1),   0 0 20px rgba(${glow},0.7), 0 0 36px rgba(${glow},0.25)`,
          `0 0 4px rgba(${glow},0.8), 0 0 10px rgba(${glow},0.4)`,
        ],
        opacity: [0.8, 1, 0.8],
      }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/* Active bar with neon glow */
function NeonBar({ color, glow }: { color: string; glow: string }) {
  return (
    <motion.span
      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
      style={{ background: color }}
      animate={{
        boxShadow: [
          `0 0 4px rgba(${glow},0.7), 2px 0 8px rgba(${glow},0.3)`,
          `0 0 8px rgba(${glow},1),   4px 0 16px rgba(${glow},0.5), 6px 0 30px rgba(${glow},0.15)`,
          `0 0 4px rgba(${glow},0.7), 2px 0 8px rgba(${glow},0.3)`,
        ],
      }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function SidebarNav() {
  const t = useT();
  const selectSection = useDashboardStore((s: any) => s.selectSection);
  const theme = useDashboardStore((s: any) => s.theme) as "dark" | "light";
  const requireAuth = useRequireAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    useDashboardStore.getState().initDashboard();
  }, []);

  // Close "More" drawer on route change
  useEffect(() => { setMoreOpen(false); }, [pathname]);

  if (!mounted) return null;

  return (
    <>
      {/* ── Desktop ─────────────────────────────────────────── */}
      <nav
        data-entrance="rail"
        className="hidden md:flex fixed inset-y-0 left-0 z-20 w-56 flex-col"
        style={{
          background: "linear-gradient(180deg, #06091180 0%, #07091480 100%), #060810",
          borderRight: "1px solid rgba(255,255,255,0.055)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center px-4 h-16 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.048)" }}
        >
          <Link href="/app" className="flex items-center gap-2.5 select-none">
            <motion.div
              className="relative flex-shrink-0 rounded-xl overflow-hidden"
              animate={{
                boxShadow: [
                  "0 0 0 1px rgba(255,255,255,0.1), 0 0 0 rgba(34,211,238,0), 0 2px 10px rgba(0,0,0,0.5)",
                  "0 0 0 1px rgba(34,211,238,0.3), 0 0 14px rgba(34,211,238,0.18), 0 2px 10px rgba(0,0,0,0.5)",
                  "0 0 0 1px rgba(255,255,255,0.1), 0 0 0 rgba(34,211,238,0), 0 2px 10px rgba(0,0,0,0.5)",
                ],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image src={theme === "light" ? "/logo-light.jpg" : "/logo.jpg"} alt="TradeMind" width={30} height={30} className="object-cover block" />
            </motion.div>
            <div className="flex flex-col leading-none">
              <span className="text-[13px] font-semibold tracking-tight neon-white" style={{ color: "var(--text-strong)" }}>
                TradeMind
              </span>
              <span className="text-[10px] mt-0.5 font-medium neon-cyan">AI Coach</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden pb-14 pt-4 px-2 gap-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              {/* Shimmering category label */}
              <p className="px-3 pb-2 text-[12.5px] font-bold uppercase tracking-[0.13em] nav-label-shimmer">
                {group.label}
              </p>

              <div className="flex flex-col gap-0.5">
                {group.items.map(({ section, path, Icon, labelKey }) => {
                  const active = pathname === path;
                  const clr = COLOR[path] ?? { icon: "#94a3b8", active: "rgba(255,255,255,0.06)", bar: "#94a3b8", glow: "148,163,184" };
                  return (
                    <Link
                      key={section}
                      href={path}
                      onClick={(e) => { if (!requireAuth(e)) return; if (section !== "Decision Errors") selectSection(section as Section); }}
                      className="block w-full"
                    >
                      <div
                        className="nav-item"
                        style={{ background: active ? clr.active : undefined }}
                      >
                        {/* Active neon bar */}
                        {active && <NeonBar color={clr.bar} glow={clr.glow} />}

                        {/* Neon icon */}
                        <NeonIcon Icon={Icon} active={active} color={clr.icon} glow={clr.glow} />

                        {/* Label */}
                        <motion.span
                          className={cn("text-[13px] font-medium truncate", !active && "nav-item-label-shimmer")}
                          animate={active ? {
                            textShadow: [
                              `0 0 3px rgba(${clr.glow},0.3), 0 0 8px rgba(${clr.glow},0.12)`,
                              `0 0 6px rgba(${clr.glow},0.6), 0 0 16px rgba(${clr.glow},0.25)`,
                              `0 0 3px rgba(${clr.glow},0.3), 0 0 8px rgba(${clr.glow},0.12)`,
                            ],
                            color: "var(--text-strong)",
                          } : { textShadow: "none", color: "transparent" }}
                          transition={active ? {
                            textShadow: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
                            color: { duration: 0.15 },
                          } : { duration: 0.15 }}
                        >
                          {t(labelKey)}
                        </motion.span>

                        {/* Neon dot */}
                        {active && <NeonDot color={clr.icon} glow={clr.glow} />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="absolute bottom-0 left-0 right-0 px-4 py-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="flex items-center justify-center gap-3">
            {[
              { label: "Terms",   href: "/terms",       external: true  },
              { label: "Support", href: "/app/support", external: false },
              { label: "Privacy", href: "/privacy",     external: true  },
            ].map((item, i, arr) => (
              <span key={item.label} className="flex items-center gap-3">
                <Link
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  className="text-[10px] transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-base)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  {item.label}
                </Link>
                {i < arr.length - 1 && (
                  <span style={{ color: "var(--border-strong)", fontSize: 10 }}>·</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Mobile bottom nav ───────────────────────────────── */}
      <nav
        data-entrance="dock"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex"
        style={{
          background: "var(--bg-bar)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid var(--sidebar-border)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {mobileItems.map(({ section, path, Icon, labelKey }) => {
          const active = pathname === path;
          const clr = COLOR[path] ?? { icon: "#94a3b8", active: "", bar: "#94a3b8", glow: "148,163,184" };
          return (
            <Link
              key={section}
              href={path}
              onClick={(e) => { if (!requireAuth(e)) return; selectSection(section as Section); }}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-1 min-h-[56px]"
            >
              <motion.span
                animate={active ? {
                  filter: [
                    `drop-shadow(0 0 2px rgba(${clr.glow},0.7))`,
                    `drop-shadow(0 0 6px rgba(${clr.glow},1)) drop-shadow(0 0 14px rgba(${clr.glow},0.5))`,
                    `drop-shadow(0 0 2px rgba(${clr.glow},0.7))`,
                  ],
                  color: clr.icon,
                } : { filter: "none", color: "rgba(56,70,92,0.9)" }}
                transition={active ? {
                  filter: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                  color: { duration: 0.2 },
                } : { duration: 0.2 }}
              >
                <Icon size={17} strokeWidth={active ? 2 : 1.7} />
              </motion.span>
              <motion.span
                className="text-[10px] font-medium"
                animate={active ? {
                  textShadow: [
                    `0 0 4px rgba(${clr.glow},0.5)`,
                    `0 0 8px rgba(${clr.glow},0.9), 0 0 20px rgba(${clr.glow},0.35)`,
                    `0 0 4px rgba(${clr.glow},0.5)`,
                  ],
                  color: clr.icon,
                } : { textShadow: "none", color: "rgba(56,70,92,0.9)" }}
                transition={active ? {
                  textShadow: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.3 },
                  color: { duration: 0.2 },
                } : { duration: 0.2 }}
              >
                {t(labelKey).split(" ")[0]}
              </motion.span>
            </Link>
          );
        })}

        {/* "More" button — reveals hidden sections */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-3 gap-1 min-h-[56px]"
        >
          <MoreHorizontal size={17} strokeWidth={1.7} style={{ color: "rgba(56,70,92,0.9)" }} />
          <span className="text-[10px] font-medium" style={{ color: "rgba(56,70,92,0.9)" }}>More</span>
        </button>
      </nav>

      {/* ── More drawer (mobile only) ────────────────────────── */}
      <AnimatePresence>
        {moreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-[60]"
              style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
              onClick={() => setMoreOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 38 }}
              className="md:hidden fixed left-0 right-0 z-[70] rounded-t-3xl"
              style={{
                bottom: 0,
                background: "var(--bg-modal)",
                borderTop: "1px solid var(--border)",
                paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: "var(--border-strong)" }} />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(100,116,139,0.55)" }}>
                  All Sections
                </p>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(100,116,139,0.7)" }}
                >
                  <X size={13} />
                </button>
              </div>

              {/* Grid of section items */}
              <div className="grid grid-cols-3 gap-2.5 px-4 pb-2">
                {moreItems.map(({ section, path, Icon, labelKey }) => {
                  const active = pathname === path;
                  const clr = COLOR[path] ?? { icon: "#94a3b8", active: "rgba(255,255,255,0.06)", bar: "#94a3b8", glow: "148,163,184" };
                  return (
                    <Link
                      key={section}
                      href={path}
                      onClick={(e) => {
                        if (!requireAuth(e)) { setMoreOpen(false); return; }
                        if (section !== "Decision Errors") selectSection(section as Section);
                        setMoreOpen(false);
                      }}
                      className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-all"
                      style={{
                        background: active ? clr.active : "rgba(255,255,255,0.03)",
                        border: active ? `1px solid rgba(${clr.glow},0.22)` : "1px solid rgba(255,255,255,0.065)",
                      }}
                    >
                      <motion.span
                        animate={active ? {
                          filter: [
                            `drop-shadow(0 0 2px rgba(${clr.glow},0.7))`,
                            `drop-shadow(0 0 6px rgba(${clr.glow},1))`,
                            `drop-shadow(0 0 2px rgba(${clr.glow},0.7))`,
                          ],
                          color: clr.icon,
                        } : { filter: "none", color: "rgba(71,85,105,0.7)" }}
                        transition={active ? { filter: { duration: 3, repeat: Infinity, ease: "easeInOut" }, color: { duration: 0.2 } } : { duration: 0.2 }}
                      >
                        <Icon size={20} strokeWidth={active ? 2 : 1.6} />
                      </motion.span>
                      <span
                        className="text-[10px] font-medium text-center leading-tight"
                        style={{ color: active ? clr.icon : "rgba(71,85,105,0.8)" }}
                      >
                        {t(labelKey)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
