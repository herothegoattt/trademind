"use client";

import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { ReferralRow, adminFetch, money } from "../../../lib/admin";
import { Panel, Spinner, Empty, ErrorBanner } from "../_components/ui";

export default function Referrals() {
  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setRows(await adminFetch<ReferralRow[]>("/referrals"));
      } catch (e: any) {
        setError(e.message ?? "Failed to load referrals");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totals = rows.reduce(
    (acc, r) => ({
      clicks: acc.clicks + r.total_clicks,
      signups: acc.signups + r.total_signups,
      conversions: acc.conversions + r.total_conversions,
      earned: acc.earned + r.total_earned_cents,
    }),
    { clicks: 0, signups: 0, conversions: 0, earned: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Clicks", totals.clicks.toLocaleString(), "text-cyan-400"],
          ["Signups", totals.signups.toLocaleString(), "text-emerald-400"],
          ["Conversions", totals.conversions.toLocaleString(), "text-purple-400"],
          ["Paid out", money(totals.earned), "text-amber-400"],
        ].map(([label, value, accent]) => (
          <div key={label as string} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{label}</span>
            <p className={`text-2xl font-bold font-mono mt-1 ${accent}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-gray-300">
        <Gift className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-semibold">Top referrers</span>
      </div>

      <Panel>
        {error && <ErrorBanner message={error} />}
        <div className="grid grid-cols-[40px_1fr_120px_80px_80px_90px] gap-3 px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06]">
          {["#", "User", "Code", "Signups", "Conv.", "Earned"].map((h) => (
            <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{h}</span>
          ))}
        </div>
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <Empty label="No referral activity yet" />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {rows.map((r, i) => (
              <div key={r.code} className="grid grid-cols-[40px_1fr_120px_80px_80px_90px] gap-3 px-4 py-3 items-center hover:bg-white/[0.02]">
                <span className={`text-sm font-bold font-mono ${i < 3 ? "text-amber-400" : "text-gray-600"}`}>{i + 1}</span>
                <span className="text-sm text-gray-300 truncate">{r.user_email || `user #${r.user_id}`}</span>
                <span className="text-[12px] font-mono text-cyan-400 truncate">{r.code}</span>
                <span className="text-[12px] font-mono text-gray-300">{r.total_signups}</span>
                <span className="text-[12px] font-mono text-purple-300">{r.total_conversions}</span>
                <span className="text-[12px] font-mono text-emerald-400">{money(r.total_earned_cents)}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
