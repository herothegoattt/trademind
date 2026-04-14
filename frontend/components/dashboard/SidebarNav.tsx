"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboardStore } from "../../lib/store";
import { ErrorType, Section } from "../../lib/types";
import { cn } from "../../lib/utils";
import {
  BookOpen,
  Settings,
  Activity,
  Globe,
  FileText,
  Compass,
  Pin,
  Search,
  User,
  TrendingUp,
  FlaskConical,
} from "lucide-react";
import { Tooltip } from "../ui/tooltip";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { ErrorDetailsModal } from "./ErrorDetailsModal";

const sectionIcons: Record<Section, React.ReactNode> = {
  Journal: <BookOpen size={20} />,
  Setups: <Settings size={20} />,
  "Community Edge": <Activity size={20} />,
  Markets: <Globe size={20} />,
  News: <FileText size={20} />,
  "Daily Bias": <Compass size={20} />,
  "Trader DNA": <User size={20} />,
  Investing: <TrendingUp size={20} />,
  "Analytics Lab": <FlaskConical size={20} />,
};

// inside component later


const errorList: ErrorType[] = [
  "FOMO",
  "Overconfidence",
  "Decision Under Fatigue",
  "Revenge Decision",
  "Confirmation Bias",
  "Risk Miscalculation",
  "Ignoring Invalid Signals",
];

export function SidebarNav() {
  const selectedSection = useDashboardStore((s: any) => s.selectedSection);
  const selectedErrorType = useDashboardStore((s: any) => s.selectedErrorType);
  const selectSection = useDashboardStore((s: any) => s.selectSection);
  const selectErrorType = useDashboardStore((s: any) => s.selectErrorType);
  const pathname = usePathname();
  const topErrors = useDashboardStore((s: any) => s.topErrors);
  const dailyBias = useDashboardStore((s: any) => s.dailyBias);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState("");
  const [errorsCollapsed, setErrorsCollapsed] = useState(true);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedErrorForDetails, setSelectedErrorForDetails] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    useDashboardStore.getState().initDashboard();
  }, []);

  // Keep sidebar size fixed for stable UI (no hover-expansion)
  const expanded = true;

  const filteredErrors = useMemo(() => {
    if (!filter) return errorList;
    return errorList.filter((e: string) =>
      e.toLowerCase().includes(filter.toLowerCase())
    );
  }, [filter]);

  if (!mounted) return null;

  return (
    <nav className="fixed inset-y-0 left-0 z-20 w-56 flex flex-col bg-slate-950 border-r border-slate-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <span className="text-sm font-bold uppercase tracking-wider text-gray-200">TradeMind</span>
      </div>



      <div className="flex-1 overflow-y-auto flex flex-col gap-2 px-2 py-4">
        {Object.keys(sectionIcons).map((sec: string) => {
          const section = sec as Section;
          const Icon = sectionIcons[section];
          const path = section === 'Markets' ? '/markets' : section === 'News' ? '/news' : section === 'Journal' ? '/journal' : section === 'Setups' ? '/setups' : section === 'Daily Bias' ? '/daily-bias' : section === 'Trader DNA' ? '/trader-dna' : section === 'Community Edge' ? '/community-edge' : section === 'Investing' ? '/investing' : null;
          const active = path ? pathname === path : selectedSection === section && !selectedErrorType;
          const content = (
            <div
              className={cn(
                "flex items-center w-full px-3 py-3 rounded-lg transition-all",
                active
                  ? "bg-teal-400/15 border border-teal-400/40 shadow-[0_0_18px_rgba(45,212,191,0.4)]"
                  : "border border-transparent hover:border-teal-400/30 hover:bg-teal-400/10 hover:shadow-[0_0_12px_rgba(45,212,191,0.25)]"
              )}
            >
              <span className="relative z-10 mr-3 text-teal-200 drop-shadow-[0_0_10px_rgba(45,212,191,0.65)]">{Icon}</span>
              {expanded && <span className="relative z-10 text-sm font-medium text-teal-100 drop-shadow-[0_0_10px_rgba(45,212,191,0.35)]">{section}</span>}
              {expanded && active && (
                <span className="absolute right-2 w-1.5 h-1.5 bg-teal-300 rounded-full shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
              )}
            </div>
          );
          const item = path ? (
            <Link key={section} href={path} onClick={() => selectSection(section)} className="w-full">
              {content}
            </Link>
          ) : (
            <button
              key={section}
              onClick={() => selectSection(section)}
              className="w-full text-left"
            >
              {content}
            </button>
          );
          return expanded ? (
            item
          ) : (
            <Tooltip key={section} content={section}>
              {item}
            </Tooltip>
          );
        })}

        {/* error library */}
        <div className="mt-auto px-2 border-t border-cyan-500/10 pt-4">
          {expanded && (
            <button
              onClick={() => setErrorsCollapsed((v) => !v)}
              className="w-full flex items-center justify-between px-2 py-2.5 rounded-lg hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-colors"
            >
              <span className="text-xs uppercase font-bold text-cyan-400/80 tracking-wider">Decision Errors</span>
              <span className="text-xs text-cyan-300">{errorsCollapsed ? '▸' : '▾'}</span>
            </button>
          )}

          {expanded && !errorsCollapsed && (
            <div className="mb-3 mt-3">
              <Input
                value={filter}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)}
                placeholder="Search errors..."
                size={16}
                className="text-xs py-2.5 bg-black/40 border-cyan-500/20 focus:border-cyan-500/40"
              />
            </div>
          )}

          <div className="space-y-2">
            {(!errorsCollapsed ? filteredErrors : []).map((err: string) => {
              const active = selectedErrorType === err;
              const item = (
                <button
                  key={err}
                  onClick={() => {
                    selectErrorType(err);
                    setSelectedErrorForDetails(err);
                    setIsDetailsOpen(true);
                  }}
                  className={cn(
                    "flex items-center w-full px-3 py-2.5 rounded-lg text-xs font-medium",
                    active
                      ? "bg-purple-500/15 border border-purple-500/50"
                      : "border border-transparent hover:border-purple-500/30 hover:bg-purple-500/10"
                  )}
                >
                  <span className="relative z-10 text-purple-200">
                    {expanded ? err : err.charAt(0)}
                  </span>
                  {expanded && active && (
                    <span className="absolute right-2 w-1.5 h-1.5 bg-purple-400 rounded-full" />
                  )}
                </button>
              );
              return expanded ? (
                item
              ) : (
                <Tooltip key={err} content={err}>
                  {item}
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>

      <ErrorDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        errorType={selectedErrorForDetails}
      />


    </nav>
  );
}
