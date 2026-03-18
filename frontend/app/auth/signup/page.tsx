"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Lock, Mail, User, ArrowRight, Brain } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError("");

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
      router.push("/app");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0b12] px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 via-[#0b0b12] to-purple-950/10" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/10 border border-purple-500/30">
            <Brain className="w-6 h-6 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            TradeMind AI
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-purple-500/20 bg-purple-950/20 backdrop-blur-xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-gray-400 mb-6">Join TradeMind to start trading smarter</p>

          {/* Error Messages */}
          {(error || localError) && (
            <div className="-mx-8 -mt-6 mb-6 p-4 bg-red-500/10 border-b border-red-500/20">
              <p className="text-red-300 text-sm">{error || localError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
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

            {/* Email */}
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

            {/* Password */}
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
              <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
            </div>

            {/* Confirm Password */}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 disabled:from-purple-500/50 disabled:to-purple-600/50 text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-purple-500/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-purple-950/20 text-gray-400">Already have an account?</span>
            </div>
          </div>

          {/* Login Link */}
          <Link
            href="/auth/login"
            className="block w-full py-2.5 rounded-lg border border-purple-500/30 bg-transparent hover:bg-purple-500/10 text-purple-300 font-semibold transition-all text-center"
          >
            Sign In
          </Link>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
