"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  ChevronDown,
  Check,
  Ban,
  RotateCcw,
  X,
  Shield,
  Gift,
} from "lucide-react";
import {
  UserRow,
  UserDetail,
  Plan,
  PLANS,
  PLAN_STYLE,
  adminFetch,
  fmtDate,
  fmtDateTime,
  money,
  cap,
} from "../../../lib/admin";
import { Panel, Spinner, Empty, ErrorBanner, Badge } from "../_components/ui";

type StatusFilter = "" | "active" | "banned";
type SortKey = "recent" | "queries" | "name";

export default function Users({ onChanged }: { onChanged?: () => void }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<"" | Plan>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pending, setPending] = useState<Record<number, Plan>>({});
  const [busy, setBusy] = useState<Record<number, boolean>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [rowErr, setRowErr] = useState<Record<number, string>>({});

  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "200", sort });
      if (search) params.set("search", search);
      if (planFilter) params.set("plan", planFilter);
      if (statusFilter) params.set("status", statusFilter);
      const data = await adminFetch<UserRow[]>(`/users?${params}`);
      setUsers(data);
      setPending({});
    } catch (e: any) {
      setError(e.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, planFilter, statusFilter, sort]);

  // Reload on filter/sort change (not on every keystroke — search is submit-driven).
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planFilter, statusFilter, sort]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flashSaved = (id: number) => {
    setSaved((s) => ({ ...s, [id]: true }));
    setTimeout(() => setSaved((s) => { const n = { ...s }; delete n[id]; return n; }), 1800);
  };

  const patchRow = (updated: UserRow) => {
    setUsers((us) => us.map((u) => (u.id === updated.id ? updated : u)));
    onChanged?.();
  };

  const run = async (id: number, fn: () => Promise<UserRow>) => {
    setBusy((b) => ({ ...b, [id]: true }));
    setRowErr((e) => { const n = { ...e }; delete n[id]; return n; });
    try {
      patchRow(await fn());
      flashSaved(id);
    } catch (e: any) {
      setRowErr((s) => ({ ...s, [id]: e?.message || "Failed" }));
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  };

  const savePlan = (id: number) => {
    const plan = pending[id];
    if (!plan) return;
    run(id, async () => {
      const u = await adminFetch<UserRow>(`/users/${id}/plan`, {
        method: "PATCH",
        body: JSON.stringify({ plan }),
      });
      setPending((p) => { const n = { ...p }; delete n[id]; return n; });
      return u;
    });
  };

  const toggleBan = (u: UserRow) =>
    run(u.id, () =>
      adminFetch<UserRow>(`/users/${u.id}/active`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !u.is_active }),
      })
    );

  const resetQuota = (id: number) =>
    run(id, () => adminFetch<UserRow>(`/users/${id}/reset-quota`, { method: "POST" }));

  const addCredits = (id: number) => {
    const dollars = window.prompt("Adjust referral credits by how many dollars? (use - to subtract)");
    if (dollars == null) return;
    const cents = Math.round(parseFloat(dollars) * 100);
    if (Number.isNaN(cents)) return;
    run(id, () =>
      adminFetch<UserRow>(`/users/${id}/credits`, {
        method: "POST",
        body: JSON.stringify({ delta_cents: cents }),
      })
    );
  };

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      setDetail(await adminFetch<UserDetail>(`/users/${id}`));
    } catch {
      /* ignore */
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <form
          onSubmit={(e) => { e.preventDefault(); load(); }}
          className="relative flex-1 min-w-[220px]"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email or name…  (Enter)"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
          />
        </form>
        <Select value={planFilter} onChange={(v) => setPlanFilter(v as any)}>
          <option value="">All plans</option>
          {PLANS.map((p) => (
            <option key={p} value={p}>{cap(p)}</option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(v) => setStatusFilter(v as StatusFilter)}>
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </Select>
        <Select value={sort} onChange={(v) => setSort(v as SortKey)}>
          <option value="recent">Newest</option>
          <option value="queries">Most queries</option>
          <option value="name">Name A–Z</option>
        </Select>
      </div>

      <Panel>
        {error && <ErrorBanner message={error} />}
        <div className="grid grid-cols-[1fr_110px_70px_90px_auto] gap-3 px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06]">
          {["User", "Plan", "Queries", "Joined", "Actions"].map((h) => (
            <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{h}</span>
          ))}
        </div>

        {loading ? (
          <Spinner />
        ) : users.length === 0 ? (
          <Empty label="No users found" />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {users.map((u) => {
              const plan = pending[u.id] ?? u.plan;
              const changed = pending[u.id] && pending[u.id] !== u.plan;
              const st = PLAN_STYLE[plan];
              return (
                <div
                  key={u.id}
                  className={`grid grid-cols-[1fr_110px_70px_90px_auto] gap-3 px-4 py-3 items-center hover:bg-white/[0.02] ${!u.is_active ? "opacity-60" : ""}`}
                >
                  {/* user */}
                  <button onClick={() => openDetail(u.id)} className="min-w-0 text-left group">
                    <p className="text-sm font-medium text-gray-200 truncate flex items-center gap-2 group-hover:text-white">
                      {u.name || "—"}
                      {!u.is_active && <Badge tone="red">banned</Badge>}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">{u.email}</p>
                  </button>

                  {/* plan */}
                  <div className="relative">
                    <select
                      value={plan}
                      onChange={(e) => setPending((p) => ({ ...p, [u.id]: e.target.value as Plan }))}
                      className={`appearance-none w-full text-[12px] font-semibold px-2.5 py-1.5 pr-6 rounded-md border ${st.text} ${st.border} ${st.bg} bg-transparent cursor-pointer focus:outline-none`}
                    >
                      {PLANS.map((p) => (
                        <option key={p} value={p} className="bg-[#0d1117] text-gray-200">{cap(p)}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600 pointer-events-none" />
                  </div>

                  <span className="text-[12px] font-mono text-gray-400 text-center">{u.ai_queries_this_month}</span>
                  <span className="text-[11px] text-gray-500">{fmtDate(u.created_at)}</span>

                  {/* actions */}
                  <div className="flex items-center gap-1.5 justify-end">
                    {changed && (
                      <button
                        onClick={() => savePlan(u.id)}
                        disabled={busy[u.id]}
                        className="text-[11px] px-2.5 py-1.5 rounded-md border border-purple-500/50 text-purple-300 bg-purple-500/10 hover:bg-purple-500/20"
                      >
                        {busy[u.id] ? "…" : "Save plan"}
                      </button>
                    )}
                    {saved[u.id] && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400"><Check className="w-3.5 h-3.5" /></span>
                    )}
                    <IconBtn title="Reset AI quota" onClick={() => resetQuota(u.id)} disabled={busy[u.id]}>
                      <RotateCcw className="w-3.5 h-3.5" />
                    </IconBtn>
                    <IconBtn title="Adjust credits" onClick={() => addCredits(u.id)} disabled={busy[u.id]}>
                      <Gift className="w-3.5 h-3.5" />
                    </IconBtn>
                    <IconBtn
                      title={u.is_active ? "Ban user" : "Unban user"}
                      onClick={() => toggleBan(u)}
                      disabled={busy[u.id]}
                      tone={u.is_active ? "red" : "green"}
                    >
                      {u.is_active ? <Ban className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                    </IconBtn>
                    {rowErr[u.id] && (
                      <span className="text-[10px] text-red-400 max-w-[90px] truncate" title={rowErr[u.id]}>{rowErr[u.id]}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
      <p className="text-center text-[11px] text-gray-700">{users.length} users</p>

      {/* Detail drawer */}
      {(detail || detailLoading) && (
        <UserDrawer
          detail={detail}
          loading={detailLoading}
          onClose={() => { setDetail(null); setDetailLoading(false); }}
        />
      )}
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
        className="appearance-none bg-white/[0.04] border border-white/[0.08] rounded-lg pl-3 pr-8 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-purple-500/50 cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  disabled,
  tone = "gray",
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "gray" | "red" | "green";
}) {
  const tones: Record<string, string> = {
    gray: "text-gray-500 hover:text-gray-200 hover:bg-white/[0.06]",
    red: "text-red-400/70 hover:text-red-400 hover:bg-red-500/10",
    green: "text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-500/10",
  };
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function UserDrawer({
  detail,
  loading,
  onClose,
}: {
  detail: UserDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md h-full bg-[#0b0e16] border-l border-white/10 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 bg-[#0b0e16]/95 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-gray-200">User detail</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-500 hover:text-gray-200 hover:bg-white/[0.06]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading || !detail ? (
          <Spinner />
        ) : (
          <div className="p-5 space-y-5">
            <div>
              <p className="text-lg font-semibold text-white">{detail.user.name || "—"}</p>
              <p className="text-sm text-gray-500">{detail.user.email}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge tone={detail.user.plan === "apex" ? "purple" : detail.user.plan === "edge" ? "cyan" : "gray"}>
                  {cap(detail.user.plan)}
                </Badge>
                <Badge tone={detail.user.is_active ? "green" : "red"}>
                  {detail.user.is_active ? "active" : "banned"}
                </Badge>
                {detail.user.is_onboarded && <Badge tone="cyan">onboarded</Badge>}
                <Badge>id {detail.user.id}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Joined" value={fmtDate(detail.user.created_at)} />
              <Field label="Plan expires" value={fmtDate(detail.user.plan_expires_at)} />
              <Field label="AI queries / mo" value={String(detail.user.ai_queries_this_month)} />
              <Field label="Referral credits" value={money(detail.user.referral_credits_cents)} />
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                ["Decisions", detail.decisions],
                ["Trades", detail.trades],
                ["Setups", detail.setups],
                ["Actions", detail.actions],
              ].map(([l, v]) => (
                <div key={l} className="rounded-lg border border-white/[0.07] bg-white/[0.02] py-3">
                  <p className="text-lg font-bold font-mono text-white">{v as number}</p>
                  <p className="text-[10px] uppercase tracking-wider text-gray-600">{l as string}</p>
                </div>
              ))}
            </div>

            {detail.referral_code && (
              <div className="rounded-lg border border-purple-500/20 bg-purple-500/[0.06] p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Referral</p>
                <p className="text-sm text-gray-200 font-mono">{detail.referral_code}</p>
                <p className="text-[11px] text-gray-500 mt-1">
                  {detail.referral_signups} signups · {money(detail.referral_earned_cents)} earned
                </p>
              </div>
            )}

            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-2">Recent activity</p>
              <div className="space-y-1.5">
                {detail.recent_actions.length === 0 && (
                  <p className="text-xs text-gray-600">No activity logged.</p>
                )}
                {detail.recent_actions.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full ${a.status === "error" ? "bg-red-500" : "bg-emerald-500"}`} />
                    <span className="text-gray-300 font-medium">{a.action_type}</span>
                    {a.resource_type && <span className="text-gray-600">· {a.resource_type}</span>}
                    <span className="ml-auto text-gray-600">{fmtDateTime(a.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-600">{label}</p>
      <p className="text-gray-200">{value}</p>
    </div>
  );
}
