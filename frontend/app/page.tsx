"use client";
import Link from "next/link";
import { Brain, ArrowRight, Shield, Zap, BarChart3 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-[#0b0b12] overflow-hidden">
      {/* Minimal background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 via-[#0b0b12] to-purple-950/10 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-8 text-center px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/10 border border-purple-500/30">
            <Brain className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            TradeMind AI
          </h1>
        </div>

        {/* Main heading */}
        <div className="space-y-4 max-w-xl">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Your AI Trading Coach
          </h2>
          <p className="text-lg text-gray-300">
            Real-time AI guidance, eliminate emotional bias, trade smarter
          </p>
        </div>

        {/* Try Demo Button */}
        <div className="flex flex-col gap-3 pt-4">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-gradient-to-r from-purple-500/30 to-purple-600/30 hover:from-purple-500/40 hover:to-purple-600/40 border border-purple-500/50 text-purple-300 font-semibold transition-all duration-300 shadow-lg hover:shadow-purple-500/20 group"
          >
            Try Demo Application
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-sm text-gray-500">
            ✨ No sign-up required to explore • Unlimited demo access
          </p>
        </div>

        {/* Features section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-purple-500/20">
          {/* Feature 1 */}
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-semibold text-white">Real-time Analysis</h3>
            <p className="text-sm text-gray-400">AI-powered trading insights</p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-semibold text-white">Decision History</h3>
            <p className="text-sm text-gray-400">Track all your trades</p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-semibold text-white">Performance Tracking</h3>
            <p className="text-sm text-gray-400">Monitor your progress</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-8 pt-8 text-sm text-gray-400 border-t border-purple-500/20 w-full justify-center">
          <div className="text-center">
            <div className="text-xl font-bold text-purple-400">10K+</div>
            <div>Active Traders</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-400">99.2%</div>
            <div>Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-400">24/7</div>
            <div>AI Support</div>
          </div>
        </div>
      </div>
    </div>
  );
}
