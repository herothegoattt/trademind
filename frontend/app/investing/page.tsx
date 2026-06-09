'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, BarChart3, Lightbulb, Shield, MessageSquare, RefreshCw, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useT } from '../../lib/i18n';
import PortfolioOverview from '../../components/investing/PortfolioOverview';
import MarketIntelligence from '../../components/investing/MarketIntelligence';
import LongTermOpportunities from '../../components/investing/LongTermOpportunities';
import RiskAnalysis from '../../components/investing/RiskAnalysis';
import InvestmentCoach from '../../components/investing/InvestmentCoach';
import InvestingPortfolio from '../../components/investing/InvestingPortfolio';
import { PortfolioProvider } from '../../lib/portfolioContext';

function InvestingPageInner() {
  const t = useT();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'overview' | 'market' | 'opportunities' | 'risk' | 'coach'>('portfolio');
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: 'portfolio',     label: 'My Portfolio',            icon: Wallet      },
    { id: 'overview',      label: 'Portfolio Overview',      icon: TrendingUp  },
    { id: 'market',        label: 'Market Intelligence',     icon: BarChart3   },
    { id: 'opportunities', label: 'Long-Term Opportunities', icon: Lightbulb   },
    { id: 'risk',          label: 'Risk & Diversification',  icon: Shield      },
    { id: 'coach',         label: 'AI Investment Coach',     icon: MessageSquare },
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate refresh - would trigger data updates in each component
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  return (
    <div className="h-full overflow-y-auto pb-14 md:pb-0 page-bg">
      {/* Header - Fixed */}
      <div
        className="fixed top-0 left-0 right-0 z-40 will-change-auto"
        style={{ background: 'rgba(7,10,18,0.82)', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
      >
        <div className="max-w-7xl mx-auto px-3 py-3 sm:px-6 sm:py-5">
          <div className="flex items-center justify-between mb-3 sm:mb-5">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <Link
                href="/app"
                aria-label="Back to dashboard"
                className="grid place-items-center w-9 h-9 rounded-xl text-slate-400 hover:text-slate-100 transition-colors flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <ArrowLeft size={18} />
              </Link>
              <div
                className="hidden sm:grid place-items-center w-10 h-10 rounded-xl flex-shrink-0"
                style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.22)' }}
              >
                <Wallet size={19} className="text-cyan-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-slate-100 leading-tight truncate">
                  Investment Portfolio
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5 truncate">
                  Long-term wealth building &amp; capital growth
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label="Refresh data"
              className="grid place-items-center w-9 h-9 rounded-xl text-slate-400 hover:text-cyan-300 transition-colors disabled:opacity-50 flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Navigation Tabs — segmented, single accent */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 contains-layout -mx-1 px-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl font-medium text-xs sm:text-[13px] whitespace-nowrap transition-colors duration-200 ${
                    active ? 'text-cyan-200' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  style={
                    active
                      ? { background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.28)' }
                      : { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }
                  }
                >
                  <Icon size={15} className={active ? 'text-cyan-300' : 'text-slate-500'} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area - With layout containment */}
      <div className="pt-32 sm:pt-44 pb-20 px-3 sm:px-6 contains-layout">
        <div className="max-w-7xl mx-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.28,
              ease: 'easeOut',
            }}
            className="will-change-auto"
          >
            <div className="min-h-[60vh]">
              {activeTab === 'portfolio'     && <InvestingPortfolio />}
              {activeTab === 'overview'      && <PortfolioOverview />}
              {activeTab === 'market'        && <MarketIntelligence />}
              {activeTab === 'opportunities' && <LongTermOpportunities />}
              {activeTab === 'risk'          && <RiskAnalysis />}
              {activeTab === 'coach'         && <InvestmentCoach />}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function InvestingPage() {
  return (
    <PortfolioProvider>
      <InvestingPageInner />
    </PortfolioProvider>
  );
}
