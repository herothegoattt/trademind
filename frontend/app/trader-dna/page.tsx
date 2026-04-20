"use client";
import Link from "next/link";
import TraderDNA from "../../components/dashboard/TraderDNA";
import { ArrowLeft, Brain } from "lucide-react";
import { motion } from "framer-motion";

export default function TraderDNAPage() {
  return (
    <div className="h-full overflow-y-auto pb-14 md:pb-0 page-bg text-white">
      {/* Header */}
      <div className="sticky top-0 z-20" style={{ background: "rgba(7,10,18,0.94)", borderBottom: "1px solid rgba(192,132,252,0.15)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center justify-between px-3 py-3 sm:p-6 max-w-7xl mx-auto">
          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link href="/app" className="p-2 hover:bg-cyan-500/10 rounded transition-colors">
              <ArrowLeft className="w-5 h-5 text-cyan-400" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg blur-md opacity-40" />
                <Brain className="w-7 h-7 text-cyan-400 relative" />
              </div>
              <h1 className="text-xl sm:text-3xl font-bold text-gradient neon-white" style={{ animationDuration: "6s" }}>
                Trader DNA
              </h1>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <motion.div 
          className="mb-8 space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-sm text-gray-400">AI-powered analysis of your trading patterns and behavioral profile</p>
          <p className="text-xs text-gray-500">Based on your Trading Journal entries</p>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Full width on left */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <TraderDNA />
          </motion.div>
          
          {/* Right Sidebar - Tips */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="sticky top-24 rounded-lg border border-blue-500/20 bg-blue-500/5 p-5 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-blue-300 mb-3 flex items-center gap-2">
                <span className="text-lg">💡</span> Quick Tips
              </h3>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex gap-2">
                  <span className="text-blue-400 flex-shrink-0">→</span>
                  <span>Keep your Trading Journal updated for accurate analysis</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 flex-shrink-0">→</span>
                  <span>High risk levels may indicate revenge trading patterns</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 flex-shrink-0">→</span>
                  <span>Focus on your weaknesses to improve win rate</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 flex-shrink-0">→</span>
                  <span>Specialize in 2-3 pairs for better edge</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
