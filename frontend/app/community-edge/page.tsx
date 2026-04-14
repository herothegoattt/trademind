"use client";

export const dynamic = 'force-dynamic';

import CommunityEdge from "../../components/dashboard/CommunityEdge";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function CommunityEdgePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-black/95 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-emerald-500/20 bg-black/50 backdrop-blur-lg">
        <div className="flex items-center justify-between px-3 py-3 sm:p-6 max-w-7xl mx-auto">
          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link href="/app" className="p-2 hover:bg-emerald-500/10 rounded transition-colors">
              <ArrowLeft className="w-5 h-5 text-emerald-400" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg blur-md opacity-40" />
                <Users className="w-7 h-7 text-emerald-400 relative" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Community Edge
              </h1>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Background Grid Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-transparent to-cyan-500" />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        <motion.div 
          className="mb-8 space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-gray-400">
            Discover, share, and discuss trading strategies with the community. Upvote ideas you believe in and collaborate with fellow traders.
          </p>
        </motion.div>

        <CommunityEdge />
      </div>
    </div>
  );
}
