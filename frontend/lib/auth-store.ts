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
        localStorage.removeItem("trademind-trades");
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, name }),
          });

          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.detail || "Registration failed");
          }

          // The register route returns { ...user, access_token } in one shot
          const { access_token, ...userData } = await response.json();
          if (!access_token) throw new Error("No token returned from server");

          get().setToken(access_token);
          set({ user: userData as User, isAuthenticated: true, isLoading: false });
          // Eligible for the product tour: only a fresh sign-up sets this flag,
          // so existing users who merely log in never see the tour again.
          try {
            localStorage.setItem("tm_new_user", "1");
            localStorage.removeItem("tm_onboarded");
          } catch {}
          identifyUser(userData as User);
          posthog.capture("signed_up", { email: userData.email });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Registration failed";
          set({ error: errorMessage, isLoading: false, isAuthenticated: false, user: null });
          throw error;
        }
      },

      login: async (email: string, password: string) => {
        localStorage.removeItem("trademind-trades");
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || "Invalid email or password");
          }

          const { access_token } = await response.json();
          if (!access_token) throw new Error("No token returned from server");
          get().setToken(access_token);
          // The token is valid the moment the server issues it — consider the
          // user logged in immediately. A hiccup loading the profile below must
          // never undo a successful authentication.
          set({ isAuthenticated: true });

          // Fetch the profile — tolerate transient failures (5xx / network).
          let userResponse: Response | null = null;
          try {
            userResponse = await fetch("/api/auth/me", {
              headers: { Authorization: `Bearer ${access_token}` },
            });
          } catch {
            userResponse = null; // network blip — keep the session, fill profile later
          }

          if (userResponse && userResponse.ok) {
            const userData = await userResponse.json();
            set({ user: userData, isAuthenticated: true, isLoading: false });
            identifyUser(userData);
            posthog.capture("logged_in", { email: userData.email });
            return;
          }

          if (userResponse && (userResponse.status === 401 || userResponse.status === 403)) {
            // The server rejected a token it just issued — a genuine failure.
            throw new Error("Account could not be verified. Please try again.");
          }

          // Transient backend error: stay logged in, ProtectedLayout will retry /me.
          set({ isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Login failed";
          get().setToken(null);
          set({ error: errorMessage, isLoading: false, isAuthenticated: false, user: null });
          throw error;
        }
      },

      loginWithGoogle: async (accessToken: string) => {
        localStorage.removeItem("trademind-trades");
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
        localStorage.removeItem("trademind-trades");
      },

      fetchCurrentUser: async () => {
        const token = get().token || localStorage.getItem("access_token");
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

          if (response.ok) {
            const user = await response.json();
            set({ user, isAuthenticated: true, token, isLoading: false });
            identifyUser(user);
            return;
          }

          // Only a genuine auth failure (expired/invalid token) ends the session.
          if (response.status === 401 || response.status === 403) {
            set({ isAuthenticated: false, token: null, user: null, isLoading: false });
            localStorage.removeItem("access_token");
            return;
          }

          // Transient backend error (5xx, cold start, proxy down): keep the
          // token and the persisted user so a server hiccup doesn't log us out.
          set((s) => ({ token, isAuthenticated: !!s.user, isLoading: false }));
        } catch {
          // Network error / timeout — same: never drop a valid session over a blip.
          set((s) => ({ token, isAuthenticated: !!s.user, isLoading: false }));
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
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Backfill the token from the standalone key in case the persisted blob lost it.
        if (!state.token && typeof window !== "undefined") {
          const t = localStorage.getItem("access_token");
          if (t) state.token = t;
        }
        // A persisted token means the user was logged in — mark them authenticated
        // right away so reloads never bounce to /login. fetchCurrentUser() then
        // validates in the background and only a real 401/403 ends the session.
        if (state.token) state.isAuthenticated = true;
      },
    }
  )
);
