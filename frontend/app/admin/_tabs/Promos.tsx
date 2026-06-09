"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Power, Ticket } from "lucide-react";
import { PromoRow, adminFetch, fmtDate, cap } from "../../../lib/admin";
import { Panel, Spinner, Empty, ErrorBanner, Badge } from "../_components/ui";

const EMPTY = {
  code: "",
  description: "",
  discount_type: "percent" as "percent" | "fixed",
  discount_value: "",
  applies_to: "" as "" | "edge" | "apex",
  billing_cycle: "" as "" | "monthly" | "annual",
  max_uses: "",
  expires_at: "",
};

export default function Promos() {
  const [rows, setRows] = useState<PromoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [creating, setCreating] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await adminFetch<PromoRow[]>("/promos"));
    } catch (e: any) {
      setError(e.message ?? "Failed to load promos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormErr(null);
    try {
      const value = parseFloat(form.discount_value);
      if (!form.code.trim() || Number.isNaN(value)) {
        throw new Error("Code and discount value are required");
      }
      await adminFetch<PromoRow>("/promos", {
        method: "POST",
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          description: form.description || null,
          discount_type: form.discount_type,
          discount_value: form.discount_type === "fixed" ? Math.round(value * 100) : value,
          applies_to: form.applies_to || null,
          billing_cycle: form.billing_cycle || null,
          max_uses: form.max_uses ? parseInt(form.max_uses, 10) : null,
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        }),
      });
      setForm({ ...EMPTY });
      setShowForm(false);
      load();
    } catch (e: any) {
      setFormErr(e.message ?? "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (p: PromoRow) => {
    await adminFetch(`/promos/${p.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: !p.is_active }),
    }).catch(() => {});
    load();
  };

  const remove = async (p: PromoRow) => {
    if (!window.confirm(`Delete promo ${p.code}? This cannot be undone.`)) return;
    await adminFetch(`/promos/${p.id}`, { method: "DELETE" }).catch(() => {});
    load();
  };

  const discountLabel = (p: PromoRow) =>
    p.discount_type === "percent" ? `${p.discount_value}% off` : `$${(p.discount_value / 100).toFixed(0)} off`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-300">
          <Ticket className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold">Promo codes</span>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30"
        >
          <Plus className="w-4 h-4" /> New code
        </button>
      </div>

      {showForm && (
        <Panel className="p-4">
          <form onSubmit={create} className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Input label="Code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} placeholder="LAUNCH50" mono />
            <SelectField label="Type" value={form.discount_type} onChange={(v) => setForm({ ...form, discount_type: v as any })}>
              <option value="percent">Percent %</option>
              <option value="fixed">Fixed $</option>
            </SelectField>
            <Input
              label={form.discount_type === "percent" ? "Value (%)" : "Value ($)"}
              value={form.discount_value}
              onChange={(v) => setForm({ ...form, discount_value: v })}
              placeholder={form.discount_type === "percent" ? "25" : "29"}
            />
            <Input label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Launch offer" />
            <SelectField label="Applies to" value={form.applies_to} onChange={(v) => setForm({ ...form, applies_to: v as any })}>
              <option value="">Any plan</option>
              <option value="edge">Edge</option>
              <option value="apex">Apex</option>
            </SelectField>
            <SelectField label="Billing" value={form.billing_cycle} onChange={(v) => setForm({ ...form, billing_cycle: v as any })}>
              <option value="">Any cycle</option>
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </SelectField>
            <Input label="Max uses" value={form.max_uses} onChange={(v) => setForm({ ...form, max_uses: v })} placeholder="∞" />
            <Input label="Expires" type="date" value={form.expires_at} onChange={(v) => setForm({ ...form, expires_at: v })} />
            <div className="flex items-end">
              <button
                type="submit"
                disabled={creating}
                className="w-full text-sm px-4 py-2.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
            {formErr && <p className="col-span-full text-sm text-red-400">{formErr}</p>}
          </form>
        </Panel>
      )}

      <Panel>
        {error && <ErrorBanner message={error} />}
        <div className="grid grid-cols-[1fr_100px_1fr_90px_70px_auto] gap-3 px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06]">
          {["Code", "Discount", "Scope", "Uses", "Expires", ""].map((h, i) => (
            <span key={i} className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{h}</span>
          ))}
        </div>
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <Empty label="No promo codes yet" />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {rows.map((p) => (
              <div key={p.id} className={`grid grid-cols-[1fr_100px_1fr_90px_70px_auto] gap-3 px-4 py-3 items-center ${!p.is_active ? "opacity-50" : ""}`}>
                <div className="min-w-0">
                  <p className="text-sm font-mono font-semibold text-gray-200 flex items-center gap-2">
                    {p.code}
                    {!p.is_active && <Badge tone="gray">off</Badge>}
                  </p>
                  {p.description && <p className="text-[11px] text-gray-500 truncate">{p.description}</p>}
                </div>
                <span className="text-[12px] font-semibold text-amber-300">{discountLabel(p)}</span>
                <div className="flex gap-1.5 flex-wrap">
                  {p.applies_to ? <Badge tone="cyan">{cap(p.applies_to)}</Badge> : <Badge>Any plan</Badge>}
                  {p.billing_cycle && <Badge>{p.billing_cycle}</Badge>}
                </div>
                <span className="text-[12px] font-mono text-gray-400">
                  {p.uses_count}{p.max_uses != null ? ` / ${p.max_uses}` : ""}
                </span>
                <span className="text-[11px] text-gray-500">{fmtDate(p.expires_at)}</span>
                <div className="flex items-center gap-1 justify-end">
                  <button
                    title={p.is_active ? "Disable" : "Enable"}
                    onClick={() => toggle(p)}
                    className={`p-1.5 rounded-md hover:bg-white/[0.06] ${p.is_active ? "text-emerald-400/70 hover:text-emerald-400" : "text-gray-600 hover:text-gray-300"}`}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <button
                    title="Delete"
                    onClick={() => remove(p)}
                    className="p-1.5 rounded-md text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-gray-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1 w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 ${mono ? "font-mono" : ""}`}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-gray-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50 cursor-pointer"
      >
        {children}
      </select>
    </label>
  );
}
