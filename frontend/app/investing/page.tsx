'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, BarChart3, Lightbulb, Shield, MessageSquare, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useT } from '../../lib/i18n';
import PortfolioOverview from '../../components/investing/PortfolioOverview';
import MarketIntelligence from '../../components/investing/MarketIntelligence';
import LongTermOpportunities from '../../components/investing/LongTermOpportunities';
import RiskAnalysis from '../../components/investing/RiskAnalysis';
import InvestmentCoach from '../../components/investing/InvestmentCoach';

export default function InvestingPage() {
  const t = useT();
  const [activeTab, setActiveTab] = useState<'overview' | 'market' | 'opportunities' | 'risk' | 'coach'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Portfolio Overview', icon: TrendingUp },
    { id: 'market', label: 'Market Intelligence', icon: BarChart3 },
    { id: 'opportunities', label: 'Long-Term Opportunities', icon: Lightbulb },
    { id: 'risk', label: 'Risk & Diversification', icon: Shield },
    { id: 'coach', label: 'AI Investment Coach', icon: MessageSquare },
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate refresh - would trigger data updates in each component
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  return (
    <div className="w-full min-h-screen bg-black">
      {/* Header - Fixed */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-black via-slate-950 to-transparent border-b border-slate-800 will-change-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/app"
                className="p-2 hover:bg-slate-900 rounded-lg transition-colors duration-200 text-slate-400 hover:text-slate-200"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-slate-100">
                  Investment Portfolio
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Long-term wealth building & capital growth
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2.5 hover:bg-slate-900 rounded-lg transition-colors duration-200 text-slate-400 hover:text-slate-200 disabled:opacity-50"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 contains-layout">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-slate-800 text-slate-100 border border-slate-700'
                      : 'bg-slate-900/50 text-slate-400 border border-slate-800 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area - With layout containment */}
      <div className="pt-52 pb-20 px-6 contains-layout">
        <div className="max-w-7xl mx-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.4,
              ease: 'easeInOut',
            }}
            className="will-change-auto"
          >
            <div className="min-h-screen">
              {activeTab === 'overview' && <PortfolioOverview />}
              {activeTab === 'market' && <MarketIntelligence />}
              {activeTab === 'opportunities' && <LongTermOpportunities />}
              {activeTab === 'risk' && <RiskAnalysis />}
              {activeTab === 'coach' && <InvestmentCoach />}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
