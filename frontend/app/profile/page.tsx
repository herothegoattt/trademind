"use client";
import { useAuthStore } from "@/lib/auth-store";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Calendar, Brain, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
    setMounted(true);
  }, [isAuthenticated, router]);

  if (!mounted || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0b12]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#0b0b12] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Banner */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {"TradeMind AI".split("").map((letter, index) => (
              <span
                key={index}
                className="inline-block animate-slide-in-from-top"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: "forwards",
                }}
              >
                {letter === " " ? "\u00A0" : letter}
              </span>
            ))}
          </h1>
          <p className="text-lg text-gray-300 mt-2">Your Trading Profile</p>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/app"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h2 className="text-2xl font-bold text-white">
              My Profile
            </h2>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Profile Card */}
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg border border-purple-500/20 bg-purple-950/20 backdrop-blur-xl p-8 shadow-2xl">
            {/* Avatar */}
            <div className="flex items-center justify-center mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/png?seed=${user.email}`}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full"
                />
              </div>
            </div>

            {/* User Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">Full Name</p>
                  <p className="text-lg font-semibold">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <p className="text-lg font-semibold">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">Member Since</p>
                  <p className="text-lg font-semibold">
                    {new Date(user.created_at || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">Trading AI Access</p>
                  <p className="text-lg font-semibold text-green-400">Active</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-6 border-t border-purple-500/20">
              <div className="flex gap-4">
                <Link
                  href="/app"
                  className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-semibold text-center transition-all duration-300"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}