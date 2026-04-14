"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Newspaper, Filter, Search, Clock, AlertCircle, X, RefreshCw } from "lucide-react";
import { NewsItem } from "../../lib/newsProvider";
import { useDashboardStore } from "../../lib/store";
import { motion, AnimatePresence } from "framer-motion";

const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export default function NewsPage() {
  const selectSection = useDashboardStore((s: any) => s.selectSection);
  useEffect(() => {
    selectSection("News");
  }, [selectSection]);

  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nextRefreshIn, setNextRefreshIn] = useState(REFRESH_INTERVAL_MS / 1000);

  const [filterCountry, setFilterCountry] = useState("");
  const [filterImpact, setFilterImpact] = useState<"" | "low" | "medium" | "high">("");
  const [sortBy, setSortBy] = useState<"newest" | "impact">('newest');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/news?limit=50&t=${Date.now()}`);
      if (!resp.ok) throw new Error(`status ${resp.status}`);
      const data = await resp.json();
      setItems(data.items || []);
      setLastUpdated(new Date());
      setNextRefreshIn(REFRESH_INTERVAL_MS / 1000);
    } catch (e: any) {
      setError(e.message || 'failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => fetchData(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Countdown to next refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setNextRefreshIn(prev => (prev <= 1 ? REFRESH_INTERVAL_MS / 1000 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  let filtered = items.filter(i => {
    if (filterCountry && !(i.country || '').toLowerCase().includes(filterCountry.toLowerCase())) return false;
    if (filterImpact && i.impact !== filterImpact) return false;
    if (searchQuery && !i.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (sortBy === 'impact') {
    const impactOrder = { high: 3, medium: 2, low: 1 };
    filtered = filtered.sort((a, b) => (impactOrder[b.impact as keyof typeof impactOrder] || 0) - (impactOrder[a.impact as keyof typeof impactOrder] || 0));
  } else {
    filtered = filtered.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }

  const getCountries = () => [...new Set(items.map(i => i.country).filter(Boolean))];
  const countries = getCountries();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-black/95 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-orange-500/20 bg-black/50 backdrop-blur-lg">
        <div className="flex items-center justify-between px-3 py-3 sm:p-6 max-w-7xl mx-auto">
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link href="/app" className="p-2 hover:bg-orange-500/10 rounded transition-colors">
              <ArrowLeft className="w-5 h-5 text-orange-400" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg blur-md opacity-40" />
                <Newspaper className="w-7 h-7 text-orange-400 relative" />
              </div>
              <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-orange-400 via-yellow-400 to-red-400 bg-clip-text text-transparent">
                Economic Calendar
              </h1>
              {/* LIVE badge */}
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/30">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Live</span>
              </span>
            </div>
          </motion.div>

          {/* Right: last updated + refresh button */}
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-500">Updated {lastUpdated.toLocaleTimeString()}</p>
                <p className="text-xs text-gray-600">
                  Next in {Math.floor(nextRefreshIn / 60)}:{String(nextRefreshIn % 60).padStart(2, '0')}
                </p>
              </div>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg text-orange-400 text-xs font-semibold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Updating...' : 'Refresh'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        {/* Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 flex items-center gap-2"
          >
            <AlertCircle size={18} />
            {error}
          </motion.div>
        )}

        {/* Search & Filters */}
        <motion.div
          className="mb-8 space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400/50 w-5 h-5" />
            <input
              type="text"
              placeholder="Search news by title..."
              className="w-full pl-12 pr-4 py-3 bg-gray-800/40 border border-orange-500/20 text-white rounded-lg focus:border-orange-500/60 focus:outline-none transition-colors placeholder-gray-500"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-700 flex-wrap">
            <Filter size={18} className="text-orange-400" />
            
            {/* Country Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Country:</span>
              <div className="flex gap-2 flex-wrap">
                <motion.button
                  onClick={() => setFilterCountry("")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                    filterCountry === ''
                      ? 'bg-orange-500/30 border border-orange-400 text-orange-300'
                      : 'bg-gray-800/30 border border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  All
                </motion.button>
                {countries.map(country => (
                  <motion.button
                    key={country}
                    onClick={() => setFilterCountry(country || "")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                      filterCountry === country
                        ? 'bg-orange-500/30 border border-orange-400 text-orange-300'
                        : 'bg-gray-800/30 border border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {country}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Impact Filter */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Impact:</span>
              <div className="flex gap-2">
                {(['all', 'low', 'medium', 'high'] as const).map(level => (
                  <motion.button
                    key={level}
                    onClick={() => setFilterImpact(level === 'all' ? '' : level)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                      (level === 'all' ? filterImpact === '' : filterImpact === level)
                        ? level === 'high' ? 'bg-red-500/30 border border-red-400 text-red-300'
                          : level === 'medium' ? 'bg-yellow-500/30 border border-yellow-400 text-yellow-300'
                          : level === 'low' ? 'bg-green-500/30 border border-green-400 text-green-300'
                          : 'bg-orange-500/30 border border-orange-400 text-orange-300'
                        : 'bg-gray-800/30 border border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {level === 'all' ? '📊 All' : level === 'high' ? '🔴 High' : level === 'medium' ? '🟡 Medium' : '🟢 Low'}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-xs font-semibold text-gray-300 focus:border-orange-500 focus:outline-none transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="impact">By Impact</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="inline-block">
              <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-gray-400 mt-4">Loading economic calendar...</p>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-5xl mb-4">📰</div>
            <p className="text-gray-400 mb-4">No news items match your filters</p>
            <button
              onClick={() => {
                setFilterCountry("");
                setFilterImpact("");
                setSearchQuery("");
              }}
              className="px-4 py-2 bg-orange-500/20 text-orange-300 rounded-lg font-semibold hover:bg-orange-500/30 transition-colors"
            >
              Clear Filters
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item, idx) => (
              <NewsCard
                key={item.id}
                item={item}
                index={idx}
                onClick={() => setSelectedNews(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedNews && (
          <NewsDetailModal
            item={selectedNews}
            onClose={() => setSelectedNews(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NewsCard({ item, index, onClick }: { item: NewsItem; index: number; onClick: () => void }) {
  const impactColors = {
    high: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300' },
    medium: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300' },
    low: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', badge: 'bg-green-500/20 text-green-300' },
  };

  const colors = impactColors[item.impact as keyof typeof impactColors] || impactColors.low;

  const isPast = new Date(item.time) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-lg border ${colors.border} ${colors.bg} p-5 cursor-pointer transition-all backdrop-blur-sm`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-orange-400 group-hover:to-red-400 group-hover:bg-clip-text transition-colors line-clamp-2 flex-1">
            {item.title}
          </h3>
          <span className={`ml-2 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap flex-shrink-0 ${colors.badge}`}>
            {item.impact === 'high' ? '🔴' : item.impact === 'medium' ? '🟡' : '🟢'} {item.impact}
          </span>
        </div>

        {/* Country & Time */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-700/50">
          <span className="text-xs font-semibold text-gray-300 bg-gray-800/50 px-2.5 py-1 rounded">
            {item.country || 'Global'}
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock size={12} />
            {new Date(item.time).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          {isPast && <span className="text-xs text-gray-500">✓ Released</span>}
        </div>

        {/* Data Grid */}
        <div className="space-y-2 mb-4">
          {item.forecast && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Forecast:</span>
              <span className="font-mono font-semibold text-gray-300">{item.forecast}</span>
            </div>
          )}
          {item.actual && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Actual:</span>
              <span className={`font-mono font-semibold ${
                item.actual > item.forecast ? 'text-green-400' : item.actual < item.forecast ? 'text-red-400' : 'text-gray-300'
              }`}>
                {item.actual}
              </span>
            </div>
          )}
          {item.previous && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Previous:</span>
              <span className="font-mono font-semibold text-gray-300">{item.previous}</span>
            </div>
          )}
        </div>

        {/* Impact Bar */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-700/50">
          <span className="text-xs text-gray-500">Impact:</span>
          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: item.impact === 'high' ? '100%' : item.impact === 'medium' ? '66%' : '33%' }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={`h-full ${item.impact === 'high' ? 'bg-gradient-to-r from-red-500 to-red-400' : item.impact === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 'bg-gradient-to-r from-green-500 to-green-400'}`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function NewsDetailModal({ item, onClose }: { item: NewsItem; onClose: () => void }) {
  const impactColors = {
    high: 'border-red-500/30 bg-gradient-to-b from-red-500/5 to-gray-900/50',
    medium: 'border-yellow-500/30 bg-gradient-to-b from-yellow-500/5 to-gray-900/50',
    low: 'border-green-500/30 bg-gradient-to-b from-green-500/5 to-gray-900/50',
  };

  const colors = impactColors[item.impact as keyof typeof impactColors];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`w-full max-w-2xl rounded-xl border ${colors} p-8 backdrop-blur-sm`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">{item.title}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-3 py-1 rounded-lg text-sm font-bold uppercase tracking-wider ${
                item.impact === 'high' ? 'bg-red-500/20 text-red-300'
                  : item.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-300'
                  : 'bg-green-500/20 text-green-300'
              }`}>
                {item.impact === 'high' ? '🔴' : item.impact === 'medium' ? '🟡' : '🟢'} {item.impact.toUpperCase()} IMPACT
              </span>
              <span className="text-gray-400 flex items-center gap-1">
                <Clock size={16} />
                {new Date(item.time).toLocaleString()}
              </span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </motion.button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-700">
          <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Country</span>
            <span className="text-xl font-bold text-gray-300">{item.country || 'Global'}</span>
          </div>
          <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Time</span>
            <span className="text-xl font-bold text-gray-300">{new Date(item.time).toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Data Values */}
        <div className="space-y-4 mb-6">
          {item.forecast && (
            <div className="p-4 rounded-lg bg-gray-800/20 border border-gray-700/30">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Forecast Value</div>
              <div className="font-mono text-2xl font-bold text-blue-400">{item.forecast}</div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {item.actual && (
              <div className="p-4 rounded-lg bg-gray-800/20 border border-gray-700/30">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Actual Value</div>
                <div className="font-mono text-xl font-bold text-green-400">{item.actual}</div>
              </div>
            )}
            {item.previous && (
              <div className="p-4 rounded-lg bg-gray-800/20 border border-gray-700/30">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Previous</div>
                <div className="font-mono text-xl font-bold text-gray-400">{item.previous}</div>
              </div>
            )}
          </div>
        </div>

        {/* Impact Analysis */}
        <div className="p-4 rounded-lg bg-gray-800/20 border border-gray-700/30 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Impact Level</span>
            <span className={`text-lg font-bold ${
              item.impact === 'high' ? 'text-red-400'
                : item.impact === 'medium' ? 'text-yellow-400'
                : 'text-green-400'
            }`}>
              {item.impact.toUpperCase()}
            </span>
          </div>
          <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: item.impact === 'high' ? '100%' : item.impact === 'medium' ? '66%' : '33%' }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className={`h-full ${item.impact === 'high' ? 'bg-gradient-to-r from-red-500 to-red-400' : item.impact === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 'bg-gradient-to-r from-green-500 to-green-400'}`}
            />
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {item.impact === 'high' ? '🔴 High impact events can cause significant volatility in the market. Monitor closely.' : item.impact === 'medium' ? '🟡 Medium impact events may cause moderate market movements. Watch for opportunities.' : '🟢 Low impact events have minimal effect on markets. Good for steady trading.'}
          </p>
        </div>

        {/* Close Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-bold transition-colors"
        >
          Close
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
