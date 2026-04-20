"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "./auth-store";

/**
 * Redirects unauthenticated users to /auth/login.
 * Uses the persisted Zustand token as a fast synchronous check,
 * so users with a valid session never see the redirect flash.
 */
export function useAuthGuard() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    // Also check localStorage directly in case Zustand hydration is delayed
    const localToken =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    if (!isAuthenticated && !token && !localToken) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, token, router]);

  const hasToken =
    typeof window !== "undefined"
      ? !!(token || localStorage.getItem("access_token"))
      : isAuthenticated;

  return isAuthenticated || hasToken;
}
