/**
 * Plan limits and feature gates for TradeMind.
 *
 * Core  — free tier
 * Edge  — $29/mo  (all core + AI + unlimited)
 * Apex  — $79/mo  (all edge + priority AI + export)
 */

import { useAuthStore } from "./auth-store";
import type { Plan } from "./auth-store";

// ─── Limit definitions ────────────────────────────────────────────────────────
export interface PlanLimits {
  // Journal
  journal_max_trades: number | null;       // null = unlimited
  journal_ai_analysis: boolean;
  journal_export: boolean;

  // Setups
  setups_can_create: boolean;
  setups_max: number | null;
  setups_compliance_check: boolean;
  setups_ai_review: boolean;

  // Community Edge
  community_can_post: boolean;
  community_can_comment: boolean;

  // Daily Bias
  daily_bias_assets: number | null;        // null = unlimited
  daily_bias_ai_brief: boolean;

  // Trader DNA
  trader_dna_basic: boolean;
  trader_dna_ai_full: boolean;

  // Analytics Lab
  analytics_basic: boolean;
  analytics_montecarlo: boolean;
  analytics_advanced: boolean;

  // Investing
  investing_max_positions: number | null;
  investing_ai_analysis: boolean;

  // News
  news_basic: boolean;
  news_filters: boolean;

  // Markets
  markets_basic: boolean;
  markets_advanced: boolean;

  // AI chat (queries/month)
  ai_queries_per_month: number | null;     // null = unlimited

  // Export
  export_data: boolean;
}

const LIMITS: Record<Plan, PlanLimits> = {
  core: {
    journal_max_trades: 20,
    journal_ai_analysis: false,
    journal_export: false,

    setups_can_create: false,
    setups_max: 0,
    setups_compliance_check: false,
    setups_ai_review: false,

    community_can_post: false,
    community_can_comment: false,

    daily_bias_assets: 3,
    daily_bias_ai_brief: false,

    trader_dna_basic: true,
    trader_dna_ai_full: false,

    analytics_basic: true,
    analytics_montecarlo: false,
    analytics_advanced: false,

    investing_max_positions: 3,
    investing_ai_analysis: false,

    news_basic: true,
    news_filters: false,

    markets_basic: true,
    markets_advanced: false,

    ai_queries_per_month: 5,

    export_data: false,
  },

  edge: {
    journal_max_trades: null,
    journal_ai_analysis: true,
    journal_export: false,

    setups_can_create: true,
    setups_max: null,
    setups_compliance_check: true,
    setups_ai_review: true,

    community_can_post: true,
    community_can_comment: true,

    daily_bias_assets: null,
    daily_bias_ai_brief: true,

    trader_dna_basic: true,
    trader_dna_ai_full: true,

    analytics_basic: true,
    analytics_montecarlo: true,
    analytics_advanced: false,

    investing_max_positions: null,
    investing_ai_analysis: true,

    news_basic: true,
    news_filters: true,

    markets_basic: true,
    markets_advanced: true,

    ai_queries_per_month: 100,

    export_data: false,
  },

  apex: {
    journal_max_trades: null,
    journal_ai_analysis: true,
    journal_export: true,

    setups_can_create: true,
    setups_max: null,
    setups_compliance_check: true,
    setups_ai_review: true,

    community_can_post: true,
    community_can_comment: true,

    daily_bias_assets: null,
    daily_bias_ai_brief: true,

    trader_dna_basic: true,
    trader_dna_ai_full: true,

    analytics_basic: true,
    analytics_montecarlo: true,
    analytics_advanced: true,

    investing_max_positions: null,
    investing_ai_analysis: true,

    news_basic: true,
    news_filters: true,

    markets_basic: true,
    markets_advanced: true,

    ai_queries_per_month: null,

    export_data: true,
  },
};

/** Returns plan limits for the current authenticated user. */
export function usePlanLimits(): PlanLimits {
  const plan = (useAuthStore.getState().user?.plan as Plan) || "core";
  return LIMITS[plan] ?? LIMITS.core;
}

/** Synchronous helper — use outside React (e.g. in API calls). */
export function getPlanLimits(plan: Plan = "core"): PlanLimits {
  return LIMITS[plan] ?? LIMITS.core;
}

/** All limits by plan — useful for feature comparison tables. */
export { LIMITS as ALL_PLAN_LIMITS };
