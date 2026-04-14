"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDashboardStore } from "../../lib/store";
import { useT } from "../../lib/i18n";
import { Card } from "../ui/card";
import TraderDNA from "./TraderDNA";
import { Badge } from "../ui/badge";
import { getErrorDetails } from "../../lib/api";
import { ErrorDetails } from "../../lib/types";

export function RightInsightPanel({ inline }: { inline?: boolean } = {}) {
  const [mounted, setMounted] = useState(false);
  const selectedSection = useDashboardStore((s: any) => s.selectedSection);
  const selectedErrorType = useDashboardStore((s: any) => s.selectedErrorType);
  const suggestedQuestions = useDashboardStore((s: any) => s.suggestedQuestions);
  const warningZones = useDashboardStore((s: any) => s.warningZones);
  const rightPanelOpen = useDashboardStore((s: any) => s.rightPanelOpen);
  const closeRightPanel = useDashboardStore((s: any) => s.closeRightPanelDrawer);
  const [details, setDetails] = useState<ErrorDetails | null>(null);
  const [newsItems, setNewsItems] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedErrorType) {
      getErrorDetails(selectedErrorType).then(setDetails);
    } else {
      setDetails(null);
    }
  }, [selectedErrorType]);

  useEffect(() => {
    // fetch news when News section selected
    if (selectedSection === "News") {
      import("../../lib/api").then(({ getNews }) => {
        getNews(10).then(setNewsItems);
      });
    } else {
      setNewsItems([]);
    }
  }, [selectedSection]);

  const t = useT();

  if (!mounted) return null;

  const panel = (
    <motion.div
      key="panel"
      initial={inline ? { opacity: 0, y: -8 } : { x: -400, opacity: 0 }}
      animate={inline ? { opacity: 1, y: 0 } : { x: 0, opacity: 1 }}
      exit={inline ? { opacity: 0, y: -8 } : { x: -400, opacity: 0 }}
      className="w-80 p-5 space-y-5 h-full overflow-auto"
    >
      {selectedSection === "News" ? (
        <Card>
          <h3 className="font-semibold">{t("latest_news")}</h3>
          <ul className="text-sm space-y-2">
            {newsItems.map((n, i) => (
              <li key={i} className="border-b border-gray-700 pb-1">
                <strong>{n.title}</strong> <span className="text-xs text-gray-400">({n.impact})</span>
                {n.summary && <p className="text-xs text-gray-300">{n.summary}</p>}
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        selectedSection === "Trader DNA" ? (
          <Card>
            <h3 className="font-semibold">{t("section_trader_dna")}</h3>
            <TraderDNA />
          </Card>
        ) : (
          <Card>
            <h3 className="font-semibold">{t("tone")}</h3>
            <p>{useDashboardStore.getState().dailyBias?.tone}</p>
          </Card>
        )
      )}

      <Card>
        <h3 className="font-semibold">{t("suggested_questions")}</h3>
        <ul className="list-disc list-inside text-sm">
          {suggestedQuestions.map((q: string, i: number) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <h3 className="font-semibold">{t("todays_warning_zones")}</h3>
        <ul className="list-disc list-inside text-sm">
          {warningZones.map((w: string, i: number) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      </Card>

      {selectedErrorType && details && (
        <Card>
          <h3 className="font-semibold">{t("detected_pattern")}</h3>
          <p className="text-sm font-bold">{selectedErrorType}</p>
          <h4 className="mt-2 font-semibold">{t("how_to_recognize")}</h4>
          <ul className="list-disc list-inside text-sm">
            {details.recognitionSignals.map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          <div className="mt-2 p-2 bg-gray-800 rounded">
            <strong>{t("corrective_rule")}:</strong> {details.correctiveRule}
          </div>
        </Card>
      )}
    </motion.div>
  );

  return (
    <>
      {/* inline (placed by parent) */}
      {inline ? (
        <div className="hidden xl:block">{panel}</div>
      ) : (
        <>
          {/* desktop always visible on right */}
          <div className="hidden xl:block fixed right-0 top-0 bottom-0 bg-gradient-to-l from-black/50 to-transparent pt-6">{panel}</div>
          {/* mobile drawer from right */}
          <AnimatePresence>
            {rightPanelOpen && (
              <motion.div
                key="drawer"
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-30"
                onClick={closeRightPanel}
              >
                <div
                  className="absolute right-0 top-0 bottom-0 bg-black/70 w-80 p-4"
                  onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                >
                  {panel}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
}
