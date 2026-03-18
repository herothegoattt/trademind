"use client";
import { useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { X, Lock, ArrowRight, Mail, User } from "lucide-react";

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

/**
 * Modal that appears when user tries to perform an action requiring authentication
 */
export function AuthRequiredModal({
  isOpen,
  onClose,
  title = "Sign In to Continue",
  message = "You need to create an account or sign in to save your data.",
}: AuthRequiredModalProps) {
  const router = useRouter();
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError("");

    if (isLogin) {
      if (!email || !password) {
        setLocalError("Please fill in all fields");
        return;
      }
      try {
        await login(email, password);
        router.push("/profile");
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Login failed");
      }
    } else {
      if (!email || !password || !name) {
        setLocalError("Please fill in all fields");
        return;
      }
      if (password !== confirmPassword) {
        setLocalError("Passwords don't match");
        return;
      }
      if (password.length < 6) {
        setLocalError("Password must be at least 6 characters");
        return;
      }
      try {
        await register(email, password, name);
        router.push("/profile");
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Registration failed");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-gradient-to-br from-purple-950/90 to-slate-900/90 rounded-lg border border-purple-500/30 shadow-2xl max-w-md w-full p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tabs */}
        <div className="flex mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 rounded-l-lg font-semibold transition-colors ${
              isLogin
                ? "bg-purple-500/30 text-purple-300 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 rounded-r-lg font-semibold transition-colors ${
              !isLogin
                ? "bg-purple-500/30 text-purple-300 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Messages */}
        {(error || localError) && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-300 text-sm">{error || localError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-purple-400/60" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-purple-500/30 bg-purple-950/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-purple-400/60" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-purple-500/30 bg-purple-950/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-purple-400/60" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-purple-500/30 bg-purple-950/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-all"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-purple-400/60" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-purple-500/30 bg-purple-950/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 disabled:from-purple-500/50 disabled:to-purple-600/50 text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2"
          >
            {isLoading ? (isLogin ? "Signing In..." : "Creating Account...") : (isLogin ? "Sign In" : "Create Account")}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Info */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Your data is encrypted and secure
        </p>
      </div>
    </div>
  );
}
