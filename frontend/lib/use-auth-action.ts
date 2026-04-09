// lib/use-auth-action.ts
import { useState, useCallback } from "react";
import { useAuthStore } from "./auth-store";

/**
 * Hook to require authentication for an action
 * Shows AuthRequiredModal if user is not authenticated
 * 
 * Usage:
 * const { requireAuth, showModal, closeModal } = useAuthAction();
 * 
 * const handleSave = async () => {
 *   if (!requireAuth()) return; // User not authenticated
 *   // Proceed with save...
 * };
 */
export function useAuthAction() {
  const { isAuthenticated } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const requireAuth = useCallback(() => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return false; // Action blocked - requires auth
    }
    return true; // User is authenticated - proceed
  }, [isAuthenticated]);

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  return {
    requireAuth,
    showAuthModal,
    closeAuthModal,
  };
}
