"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, ChevronDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { ActionRow, adminFetch, fmtDateTime } from "../../../lib/admin";
import { Panel, Spinner, Empty, ErrorBanner } from "../_components/ui";

export default function Activity() {
  const [rows, setRows] = useState<ActionRow[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [type, setType] = useState("");
  const [status, setStatus] = useState<"" | "success" | "error">("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (type) params.set("action_type", type);
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      setRows(await adminFetch<ActionRow[]>(`/activity?${params}`));
    } catch (e: any) {
      setError(e.message ?? "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [type, status, search]);

  useEffect(() => {
    adminFetch<string[]>("/activity/types").then(setTypes).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <form
          onSubmit={(e) => { e.preventDefault(); load(); }}
          className="relative flex-1 min-w-[220px]"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description or type…  (Enter)"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
          />
        </form>
        <Select value={type} onChange={setType}>
          <option value="">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
        <Select value={status} onChange={(v) => setStatus(v as any)}>
          <option value="">All status</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
        </Select>
      </div>

      <Panel>
        {error && <ErrorBanner message={error} />}
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <Empty label="No activity" />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {rows.map((a) => (
              <div key={a.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-white/[0.02]">
                {a.status === "error" ? (
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500/70 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-200">{a.action_type}</span>
                    {a.resource_type && (
                      <span className="text-[10px] text-gray-500 px-1.5 py-0.5 rounded bg-white/[0.05]">{a.resource_type}</span>
                    )}
                    <span className="text-[11px] text-gray-600 truncate">{a.user_email || `user #${a.user_id}`}</span>
                  </div>
                  {(a.description || a.error_message) && (
                    <p className={`text-[12px] mt-0.5 truncate ${a.status === "error" ? "text-red-400/80" : "text-gray-500"}`}>
                      {a.error_message || a.description}
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-gray-600 whitespace-nowrap mt-0.5">{fmtDateTime(a.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <p className="text-center text-[11px] text-gray-700">{rows.length} events</p>
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white/[0.04] border border-white/[0.08] rounded-lg pl-3 pr-8 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-purple-500/50 cursor-pointer max-w-[200px]"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
    </div>
  );
}
