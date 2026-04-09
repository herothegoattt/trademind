// lib/auth-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import posthog from "posthog-js";

function identifyUser(user: { id: number; email: string; name?: string }) {
  if (typeof window === "undefined") return;
  posthog.identify(String(user.id), {
    email: user.email,
    name: user.name ?? undefined,
  });
}

export type Plan = "core" | "edge" | "apex";

export interface TradingViewConnection {
  username: string;
  connected_at: string;
  last_sync?: string;
  status: "connected" | "syncing" | "error";
}

export interface TradingStats {
  total_trades: number;
  win_rate: number;
  profit_factor: number;
  total_pnl: number;
  avg_rr: number;
  best_trade: number;
  worst_trade: number;
  avg_hold_time: string;
  streak: number;
  monthly_pnl: { month: string; pnl: number }[];
  top_pairs: { symbol: string; trades: number; pnl: number }[];
}

export interface User {
  id: number;
  email: string;
  name?: string;
  avatar_url?: string;
  verified: boolean;
  created_at?: string;
  plan?: Plan;
  tradingview?: TradingViewConnection | null;
  trading_stats?: TradingStats | null;
  is_onboarded?: boolean;
  preferred_market?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: (accessToken: string) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
  setToken: (token: string | null) => void;
  markOnboarded: (preferredMarket?: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      setToken: (token: string | null) => {
        set({ token });
        if (token) {
          localStorage.setItem("access_token", token);
        } else {
          localStorage.removeItem("access_token");
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, name }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Registration failed");
          }

          const userData = await response.json();

          // Auto-login after registration to get the token
          const loginResponse = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          if (!loginResponse.ok) {
            throw new Error("Auto-login failed after registration");
          }

          const { access_token } = await loginResponse.json();

          // Set auth state only after both steps succeed
          get().setToken(access_token);
          set({ user: userData, isAuthenticated: true, isLoading: false });
          identifyUser(userData);
          posthog.capture("signed_up", { email: userData.email });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Registration failed";
          set({ error: errorMessage, isLoading: false, isAuthenticated: false, user: null });
          throw error;
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Invalid email or password");
          }

          const { access_token } = await response.json();
          get().setToken(access_token);

          // Fetch user data
          const userResponse = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          });

          if (!userResponse.ok) {
            throw new Error("Failed to fetch user data");
          }

          const userData = await userResponse.json();
          set({ user: userData, isAuthenticated: true, isLoading: false });
          identifyUser(userData);
          posthog.capture("logged_in", { email: userData.email });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Login failed";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      loginWithGoogle: async (accessToken: string) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token: accessToken }),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Google login failed");
          }

          const { access_token: jwt, user: userData } = await res.json();
          get().setToken(jwt);
          set({ user: userData, isAuthenticated: true, isLoading: false });
          identifyUser(userData);
          posthog.capture("logged_in", { method: "google", email: userData.email });
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Google login failed";
          set({ error: msg, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        if (typeof window !== "undefined") posthog.reset();
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem("access_token");
      },

      fetchCurrentUser: async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }

        try {
          const response = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch user");
          }

          const user = await response.json();
          set({ user, isAuthenticated: true, token, isLoading: false });
          identifyUser(user);
        } catch (error) {
          // Silently fail - user is not authenticated
          set({ isAuthenticated: false, token: null, user: null, isLoading: false });
          localStorage.removeItem("access_token");
        }
      },

      clearError: () => set({ error: null }),

      markOnboarded: async (preferredMarket?: string) => {
        const token = get().token || localStorage.getItem("access_token");
        if (!token) return;
        try {
          const res = await fetch("/api/auth/onboarding", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(preferredMarket ? { preferred_market: preferredMarket } : {}),
          });
          if (res.ok) {
            const updated = await res.json();
            set((s) => ({
              user: s.user
                ? { ...s.user, is_onboarded: true, preferred_market: updated.preferred_market }
                : s.user,
            }));
          }
        } catch {
          // silently fail — don't block onboarding UX
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
