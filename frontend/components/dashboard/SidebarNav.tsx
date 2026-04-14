"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useDashboardStore } from "../../lib/store";
import { useT } from "../../lib/i18n";
import { Section } from "../../lib/types";
import { cn } from "../../lib/utils";
import {
  BookOpen,
  Settings,
  Activity,
  Globe,
  FileText,
  Compass,
  User,
  TrendingUp,
  AlertTriangle,
  FlaskConical,
} from "lucide-react";
import { Tooltip } from "../ui/tooltip";

const navItems: { section: Section | "Decision Errors"; path: string; icon: React.ReactNode; labelKey: string }[] = [
  { section: "Journal",          path: "/journal",          icon: <BookOpen size={20} />,      labelKey: "section_journal"         },
  { section: "Setups",           path: "/setups",           icon: <Settings size={20} />,      labelKey: "section_setups"          },
  { section: "Community Edge",   path: "/community-edge",   icon: <Activity size={20} />,      labelKey: "section_community_edge"  },
  { section: "Markets",          path: "/markets",          icon: <Globe size={20} />,         labelKey: "section_markets"         },
  { section: "News",             path: "/news",             icon: <FileText size={20} />,      labelKey: "section_news"            },
  { section: "Daily Bias",       path: "/daily-bias",       icon: <Compass size={20} />,       labelKey: "section_daily_bias"      },
  { section: "Trader DNA",       path: "/trader-dna",       icon: <User size={20} />,          labelKey: "section_trader_dna"      },
  { section: "Investing",        path: "/investing",        icon: <TrendingUp size={20} />,    labelKey: "section_investing"       },
  { section: "Analytics Lab",    path: "/analytics-lab",    icon: <FlaskConical size={20} />,  labelKey: "section_analytics_lab"   },
  { section: "Decision Errors",  path: "/decision-errors",  icon: <AlertTriangle size={20} />, labelKey: "decision_errors"         },
];

export function SidebarNav() {
  const t = useT();
  const selectSection = useDashboardStore((s: any) => s.selectSection);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    useDashboardStore.getState().initDashboard();
  }, []);

  if (!mounted) return null;

  const mobileNav = [
    navItems[0], // Journal
    navItems[1], // Setups
    navItems[3], // Markets
    navItems[4], // News
    navItems[5], // Daily Bias
  ];

  return (
    <>
    <nav className="hidden md:flex fixed inset-y-0 left-0 z-20 w-56 flex-col bg-slate-950 border-r border-slate-800">
      {/* Logo */}
      <div className="flex items-center px-4 py-3 border-b border-slate-800">
        <Link href="/app" className="flex items-center gap-2 select-none">
          <Image
            src="/logo.jpg"
            alt="TradeMind Logo"
            width={28}
            height={28}
            className="rounded-full object-cover shrink-0"
          />
          <span
            className="text-sm font-bold uppercase tracking-wider"
            style={{
              color: "#ffffff",
              textShadow:
                "0 0 6px rgba(139,92,246,0.9), 0 0 16px rgba(99,102,241,0.7), 0 0 30px rgba(139,92,246,0.4)",
            }}
          >
            TradeMind
          </span>
        </Link>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-3 px-2 pt-4 pb-14 overflow-hidden">
        {navItems.map(({ section, path, icon, labelKey }) => {
          const active = pathname === path;
          const isError = section === "Decision Errors";
          const item = (
            <Link
              key={section}
              href={path}
              onClick={() => { if (section !== "Decision Errors") selectSection(section as Section); }}
              className="w-full"
            >
              <div
                className={cn(
                  "flex items-center w-full px-3 py-2.5 rounded-lg transition-all",
                  active
                    ? isError
                      ? "bg-amber-500/15 border border-amber-500/40 shadow-[0_0_18px_rgba(245,158,11,0.3)]"
                      : "bg-teal-400/15 border border-teal-400/40 shadow-[0_0_18px_rgba(45,212,191,0.4)]"
                    : isError
                      ? "border border-transparent hover:border-amber-500/30 hover:bg-amber-500/10"
                      : "border border-transparent hover:border-teal-400/30 hover:bg-teal-400/10 hover:shadow-[0_0_12px_rgba(45,212,191,0.25)]"
                )}
              >
                <span className={cn(
                  "relative z-10 mr-3 drop-shadow-[0_0_10px_rgba(45,212,191,0.65)]",
                  isError
                    ? active ? "text-amber-300" : "text-amber-500/60"
                    : "text-teal-200"
                )}>
                  {icon}
                </span>
                <span className={cn(
                  "relative z-10 text-sm font-medium",
                  isError
                    ? active ? "text-amber-200" : "text-zinc-500"
                    : "text-teal-100 drop-shadow-[0_0_10px_rgba(45,212,191,0.35)]"
                )}>
                  {t(labelKey)}
                </span>
                {active && (
                  <span className={cn(
                    "absolute right-2 w-1.5 h-1.5 rounded-full",
                    isError
                      ? "bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                      : "bg-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.8)]"
                  )} />
                )}
              </div>
            </Link>
          );
          return item;
        })}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 border-t border-white/[0.04] bg-slate-950">
        <div className="flex items-center justify-center gap-2.5">
          {[
            { label: "Terms",   href: "/terms",       external: true  },
            { label: "Support", href: "/app/support", external: false },
            { label: "Privacy", href: "/privacy",     external: true  },
          ].map((item, i, arr) => (
            <span key={item.label} className="flex items-center gap-2.5">
              <Link
                href={item.href}
                target={item.external ? "_blank" : undefined}
                className="text-[10px] font-medium tracking-wide transition-all duration-200"
                style={{ color: "rgba(100,116,139,0.45)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "rgba(45,212,191,0.7)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "rgba(100,116,139,0.45)";
                }}
              >
                {item.label}
              </Link>
              {i < arr.length - 1 && (
                <span style={{ color: "rgba(100,116,139,0.2)", fontSize: 10 }}>·</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </nav>

    {/* Mobile bottom navigation */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 flex" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {mobileNav.map(({ section, path, icon, labelKey }) => {
        const active = pathname === path;
        return (
          <Link
            key={section}
            href={path}
            onClick={() => selectSection(section as Section)}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 min-h-[56px]"
          >
            <span className={cn(
              "transition-colors",
              active ? "text-teal-300 drop-shadow-[0_0_8px_rgba(45,212,191,0.7)]" : "text-slate-500"
            )}>
              {icon}
            </span>
            <span className={cn(
              "text-[10px] font-medium",
              active ? "text-teal-300" : "text-slate-600"
            )}>
              {t(labelKey).split(" ")[0]}
            </span>
          </Link>
        );
      })}
    </nav>
    </>
  );
}
