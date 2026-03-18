"use client";
import { useEffect, ReactNode } from "react";
import { useAuthStore } from "@/lib/auth-store";

interface ProtectedLayoutProps {
  children: ReactNode;
}

/**
 * Optional Protection Layout
 * Attempts to load user authentication but allows access even if not authenticated
 * Actual protection happens at the action level (save/delete operations)
 */
export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    // Try to load current user if logged in
    // This is non-blocking - app works either way
    fetchCurrentUser().catch(() => {
      // Silently fail - user is not authenticated, that's OK
    });
  }, []);

  // Always render children - protection is at the action level
  return children;
}
