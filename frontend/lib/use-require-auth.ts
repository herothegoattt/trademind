"use client";
import { useRouter } from "next/navigation";
import { useAuthStore } from "./auth-store";

/**
 * Returns a guard function to call on a category/nav click.
 *
 * The app shell itself is open to everyone — but feature categories require an
 * account. If the visitor isn't authenticated the guard cancels the navigation
 * and sends them to /auth/login. Returns `true` when navigation may proceed.
 */
export function useRequireAuth() {
  const router = useRouter();
  return (e?: { preventDefault: () => void }): boolean => {
    const s = useAuthStore.getState();
    const authed =
      s.isAuthenticated ||
      !!s.token ||
      (typeof window !== "undefined" && !!localStorage.getItem("access_token"));
    if (!authed) {
      e?.preventDefault?.();
      router.push("/auth/login");
      return false;
    }
    return true;
  };
}
