"use client";
import { useEffect, ReactNode } from "react";
import { useAuthStore } from "@/lib/auth-store";

interface ProtectedLayoutProps {
  children: ReactNode;
}

/**
 * The app shell is open to everyone — visitors can browse without an account.
 * We never force a redirect to /login here; individual feature categories gate
 * themselves on click (see useRequireAuth). If a token is present we refresh the
 * user profile in the background so a returning user sees their data instantly.
 */
export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser);

  useEffect(() => {
    const hasToken =
      typeof window !== "undefined" &&
      (!!useAuthStore.getState().token || !!localStorage.getItem("access_token"));
    if (hasToken) fetchCurrentUser();
  }, [fetchCurrentUser]);

  return <>{children}</>;
}
