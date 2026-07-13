// Shared types, API helpers and formatters for the admin panel (/admin).

export const ADMIN_EMAIL = "rem.vafin.08@gmail.com";

export function isAdminUser(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export const PLANS = ["core", "edge", "apex"] as const;
export type Plan = (typeof PLANS)[number];

export interface TimePoint {
  date: string;
  count: number;
}

export interface Stats {
  total_users: number;
  active_users: number;
  banned_users: number;
  by_plan: Record<string, number>;
  new_users_today: number;
  new_users_7d: number;
  new_users_30d: number;
  mrr_cents: number;
  paying_users: number;
  ai_queries_month: number;
  actions_today: number;
  total_decisions: number;
  total_trades: number;
  total_setups: number;
  total_news: number;
  referral_signups: number;
  referral_earned_cents: number;
  active_promos: number;
  signups_30d: TimePoint[];
}

export interface UserRow {
  id: number;
  email: string;
  name: string | null;
  plan: Plan;
  ai_queries_this_month: number;
  is_active: boolean;
  is_onboarded: boolean;
  referral_credits_cents: number;
  created_at: string | null;
  plan_expires_at: string | null;
}

export interface ActionRow {
  id: number;
  user_id: number;
  user_email: string | null;
  action_type: string;
  resource_type: string | null;
  description: string | null;
  status: string;
  error_message: string | null;
  created_at: string | null;
}

export interface UserDetail {
  user: UserRow;
  decisions: number;
  trades: number;
  setups: number;
  actions: number;
  referral_code: string | null;
  referral_signups: number;
  referral_earned_cents: number;
  recent_actions: ActionRow[];
}

export interface PromoRow {
  id: number;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  applies_to: string | null;
  billing_cycle: string | null;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string | null;
}

export interface ReferralRow {
  code: string;
  user_id: number;
  user_email: string | null;
  total_clicks: number;
  total_signups: number;
  total_conversions: number;
  total_earned_cents: number;
  created_at: string | null;
}

// ── API ──────────────────────────────────────────────────────────────────────

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

/** Thin wrapper around fetch for /api/v1/admin/* that throws on non-2xx. */
export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/v1/admin${path}`, { ...init, headers: authHeaders() });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

// ── Formatters ───────────────────────────────────────────────────────────────

export const PLAN_STYLE: Record<Plan, { text: string; border: string; bg: string }> = {
  core: { text: "text-gray-400", border: "border-gray-600", bg: "bg-gray-500/10" },
  edge: { text: "text-cyan-400", border: "border-cyan-600", bg: "bg-cyan-500/10" },
  apex: { text: "text-purple-400", border: "border-purple-600", bg: "bg-purple-500/10" },
};

export const money = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const moneyExact = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
    : "—";

export const fmtDateTime = (d: string | null) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
