"use client";
import { useEffect, useState, ReactNode } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/auth-store";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { isAuthenticated, fetchCurrentUser } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetchCurrentUser().finally(() => setChecking(false));
  }, []);

  // Show loading screen while token is being verified
  if (checking) {
    return (
      <div
        className="h-screen w-screen flex items-center justify-center"
        style={{ background: "#020308" }}
      >
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-12 h-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full"
              style={{
                border: "2px solid transparent",
                borderTopColor: "#22d3ee",
                borderRightColor: "rgba(34,211,238,0.15)",
                borderBottomColor: "#a78bfa",
                borderLeftColor: "rgba(167,139,250,0.15)",
              }}
            />
            <motion.div
              animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-2 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(6,182,212,0.3), transparent)" }}
            />
          </div>
          <p
            className="text-xs tracking-[0.4em]"
            style={{ color: "rgba(100,116,139,0.8)" }}
          >
            ИНИЦИАЛИЗАЦИЯ
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
