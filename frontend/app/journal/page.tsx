'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Edit2, TrendingUp, TrendingDown, Calendar, Filter, X } from 'lucide-react';
import { useT } from '../../lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { tradeAPI, Trade } from '../../lib/trade-api';

interface TradeUI {
  id: string;
  symbol: string;
  type: 'long' | 'short';
  entry: number;
  exit?: number;
  accountSize?: number;
  pnl?: number;
  pnlPercent?: number;
  duration: string;
  notes: string;
  createdAt: string;
  exitAt?: string;
}

export default function JournalPage() {
  const [trades, setTrades] = useState<TradeUI[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'long' | 'short'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'best' | 'worst'>('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    symbol: '',
    type: 'long' as 'long' | 'short',
    entry: '',
    exit: '',
    accountSize: '',
    duration: '',
    notes: '',
  });
  const t = useT();

  // Load trades from API
  useEffect(() => {
    const loadTrades = async () => {
      setIsLoading(true);
      try {
        const apiTrades = await tradeAPI.listTrades();
        const convertedTrades = apiTrades.map(t => ({
          id: t.id || '',
          symbol: t.symbol,
          type: t.type,
          entry: t.entry,
          exit: t.exit,
          accountSize: t.account_size,
          pnl: t.pnl,
          pnlPercent: t.pnl_percent,
          duration: t.duration,
          notes: t.notes,
          createdAt: t.created_at || new Date().toISOString(),
          exitAt: t.updated_at || undefined,
        }));
        setTrades(convertedTrades);
      } catch (error) {
        console.error('Error loading trades:', error);
        // Fallback to localStorage for development
        const stored = localStorage.getItem('trades');
        if (stored) {
          setTrades(JSON.parse(stored));
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadTrades();
  }, []);

  const calculatePnL = (
    entry: number,
    exit: number,
    type: 'long' | 'short',
    accountSize?: number
  ) => {
    if (!exit) return null;
    const diff = exit - entry;
    let pnl: number;
    if (accountSize && entry !== 0) {
      const movePct = diff / entry;
      pnl = movePct * accountSize * (type === 'long' ? 1 : -1);
    } else {
      pnl = type === 'long' ? diff : -diff;
    }
    const pnlPercent = accountSize
      ? (pnl / accountSize) * 100
      : (pnl / entry) * 100;
    return { pnl, pnlPercent };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const entry = parseFloat(formData.entry);
    const exit = formData.exit ? parseFloat(formData.exit) : undefined;
    const accountSize = formData.accountSize ? parseFloat(formData.accountSize) : undefined;
    const pnlResult = exit ? calculatePnL(entry, exit, formData.type, accountSize) : null;

    try {
      if (editId) {
        // Update existing trade
        const updated = await tradeAPI.updateTrade(editId, {
          symbol: formData.symbol,
          type: formData.type,
          entry,
          exit,
          account_size: accountSize,
          duration: formData.duration,
          notes: formData.notes,
          pnl: pnlResult?.pnl,
          pnl_percent: pnlResult?.pnlPercent,
        });
        
        if (updated) {
          setTrades(trades.map(t => t.id === editId ? {
            id: editId,
            symbol: formData.symbol,
            type: formData.type,
            entry,
            exit,
            accountSize,
            duration: formData.duration,
            notes: formData.notes,
            pnl: pnlResult?.pnl,
            pnlPercent: pnlResult?.pnlPercent,
            createdAt: t.createdAt,
          } : t));
        }
        setEditId(null);
      } else {
        // Create new trade
        const newTradeData = {
          symbol: formData.symbol,
          type: formData.type,
          entry,
          exit,
          account_size: accountSize,
          duration: formData.duration,
          notes: formData.notes,
          pnl: pnlResult?.pnl,
          pnl_percent: pnlResult?.pnlPercent,
        };
        
        console.log('Creating trade:', newTradeData);
        const created = await tradeAPI.createTrade(newTradeData);
        console.log('Created trade:', created);
        
        if (created) {
          const newTrade: TradeUI = {
            id: created.id || Date.now().toString(),
            symbol: formData.symbol,
            type: formData.type,
            entry,
            exit,
            accountSize,
            duration: formData.duration,
            notes: formData.notes,
            pnl: pnlResult?.pnl,
            pnlPercent: pnlResult?.pnlPercent,
            createdAt: new Date().toISOString(),
          };
          setTrades([newTrade, ...trades]);
        }
      }

      setFormData({ symbol: '', type: 'long', entry: '', exit: '', accountSize: '', duration: '', notes: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Error saving trade:', error);
    }
  };

  const handleEdit = (trade: TradeUI) => {
    setFormData({
      symbol: trade.symbol,
      type: trade.type,
      entry: trade.entry.toString(),
      exit: trade.exit?.toString() || '',
      accountSize: trade.accountSize?.toString() || '',
      duration: trade.duration,
      notes: trade.notes,
    });
    setEditId(trade.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await tradeAPI.deleteTrade(id);
      if (success) {
        setTrades(trades.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Error deleting trade:', error);
    }
  };

  // Filter and sort
  let filteredTrades = trades.filter(t => 
    filterType === 'all' ? true : t.type === filterType
  );

  filteredTrades = filteredTrades.sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === 'best') return (b.pnl || 0) - (a.pnl || 0);
    if (sortBy === 'worst') return (a.pnl || 0) - (b.pnl || 0);
    return 0;
  });

  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winningTrades = trades.filter(t => (t.pnl || 0) > 0).length;
  const losingTrades = trades.filter(t => (t.pnl || 0) < 0).length;
  const winRate = trades.length > 0 ? ((winningTrades / trades.length) * 100).toFixed(1) : 0;
  const avgWin = winningTrades > 0 ? (trades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades).toFixed(2) : 0;
  const avgLoss = losingTrades > 0 ? (trades.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades).toFixed(2) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-black/95 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-blue-500/20 bg-black/50 backdrop-blur-lg">
        <div className="flex items-center justify-between p-6 max-w-7xl mx-auto">
          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link href="/app" className="p-2 hover:bg-blue-500/10 rounded transition-colors">
              <ArrowLeft className="w-5 h-5 text-blue-400" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur-md opacity-40" />
                <Calendar className="w-7 h-7 text-blue-400 relative" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Trading Journal
              </h1>
            </div>
          </motion.div>
          <motion.button
            onClick={() => {
              setShowForm(!showForm);
              setEditId(null);
              setFormData({ symbol: '', type: 'long', entry: '', exit: '', accountSize: '', duration: '', notes: '' });
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-semibold text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all"
          >
            <Plus size={18} />
            New Trade
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <StatCard
            label="Total P&L"
            value={`${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}`}
            color={totalPnL >= 0 ? 'emerald' : 'red'}
            icon={totalPnL >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          />
          <StatCard label="Trades" value={trades.length.toString()} color="blue" />
          <StatCard label="Win Rate" value={`${winRate}%`} color="cyan" />
          <StatCard 
            label="Avg Win" 
            value={`+${avgWin}`} 
            color="green"
            size="small"
          />
          <StatCard 
            label="Avg Loss" 
            value={`${avgLoss}`} 
            color="red"
            size="small"
          />
        </motion.div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <TradeFormModal
              isOpen={showForm}
              onClose={() => {
                setShowForm(false);
                setEditId(null);
                setFormData({ symbol: '', type: 'long', entry: '', exit: '', accountSize: '', duration: '', notes: '' });
              }}
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              isEditing={!!editId}
            />
          )}
        </AnimatePresence>

        {/* Filters */}
        <motion.div
          className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Filter size={18} className="text-blue-400" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Type:</span>
            {(['all', 'long', 'short'] as const).map(type => (
              <motion.button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  filterType === type
                    ? type === 'long' ? 'bg-green-500/30 border border-green-400 text-green-300'
                      : type === 'short' ? 'bg-red-500/30 border border-red-400 text-red-300'
                      : 'bg-blue-500/30 border border-blue-400 text-blue-300'
                    : 'bg-gray-800/30 border border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {type === 'all' ? '📊 All' : type === 'long' ? '🟢 Long' : '🔴 Short'}
              </motion.button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-xs font-semibold text-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="best">Best P&L</option>
              <option value="worst">Worst P&L</option>
            </select>
          </div>
        </motion.div>

        {/* Trades Grid / List */}
        {filteredTrades.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-400 mb-4">No trades recorded yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg font-semibold hover:bg-blue-500/30 transition-colors"
            >
              Create Your First Trade
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTrades.map((trade, idx) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                onEdit={() => handleEdit(trade)}
                onDelete={() => handleDelete(trade.id)}
                onClick={() => setSelectedTrade(trade.id)}
                index={idx}
              />
            ))}
          </div>
        )}
      </div>

      {/* Trade Detail Modal */}
      <AnimatePresence>
        {selectedTrade && (
          <TradeDetailModal
            trade={trades.find(t => t.id === selectedTrade)}
            onClose={() => setSelectedTrade(null)}
            onEdit={() => {
              const trade = trades.find(t => t.id === selectedTrade);
              if (trade) handleEdit(trade);
              setSelectedTrade(null);
            }}
            onDelete={() => {
              handleDelete(selectedTrade);
              setSelectedTrade(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, color = 'gray', icon, size = 'normal' }: any) {
  const colors = {
    emerald: 'from-emerald-500/10 to-transparent border-emerald-500/30',
    red: 'from-red-500/10 to-transparent border-red-500/30',
    blue: 'from-blue-500/10 to-transparent border-blue-500/30',
    cyan: 'from-cyan-500/10 to-transparent border-cyan-500/30',
    green: 'from-green-500/10 to-transparent border-green-500/30',
  };

  const textColors = {
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    cyan: 'text-cyan-400',
    green: 'text-green-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative overflow-hidden rounded-lg border bg-gradient-to-br ${colors[color]} p-4 backdrop-blur-sm ${size === 'small' ? 'md:col-span-1' : ''}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
          {icon && <div className={textColors[color]}>{icon}</div>}
        </div>
        <div className={`text-2xl font-bold ${textColors[color]}`}>{value}</div>
      </div>
    </motion.div>
  );
}

function TradeCard({ trade, onEdit, onDelete, onClick, index }: any) {
  const isWin = (trade.pnl || 0) > 0;
  const borderColor = isWin ? 'border-green-500/30' : trade.pnl === 0 ? 'border-gray-500/30' : 'border-red-500/30';
  const bgColor = isWin ? 'bg-green-500/5' : trade.pnl === 0 ? 'bg-gray-500/5' : 'bg-red-500/5';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-lg border ${borderColor} ${bgColor} p-5 cursor-pointer transition-all hover:border-opacity-60 backdrop-blur-sm`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
              {trade.symbol}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                trade.type === 'long' 
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-red-500/20 text-red-300'
              }`}>
                {trade.type === 'long' ? '📈 Long' : '📉 Short'}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-400">{trade.duration || 'N/A'}</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-2xl font-bold ${isWin ? 'text-green-400' : trade.pnl === 0 ? 'text-gray-400' : 'text-red-400'}`}>
              {trade.pnl ? (trade.pnl >= 0 ? '+' : '') + trade.pnl.toFixed(2) : '—'}
            </div>
            <div className={`text-sm font-semibold ${isWin ? 'text-green-400' : trade.pnl === 0 ? 'text-gray-400' : 'text-red-400'}`}>
              {trade.pnlPercent ? (trade.pnlPercent >= 0 ? '+' : '') + trade.pnlPercent.toFixed(1) + '%' : '—'}
            </div>
          </div>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-700/50">
          <div>
            <span className="text-xs text-gray-500 block mb-1">Entry</span>
            <span className="font-mono text-sm text-gray-300">{trade.entry.toFixed(4)}</span>
          </div>
          <div>
            <span className="text-xs text-gray-500 block mb-1">Exit</span>
            <span className="font-mono text-sm text-gray-300">{trade.exit ? trade.exit.toFixed(4) : '—'}</span>
          </div>
        </div>

        {/* Notes */}
        {trade.notes && (
          <div className="mb-3 p-2 rounded bg-black/30 border border-gray-700/30">
            <p className="text-xs text-gray-400 line-clamp-2">{trade.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-700/50">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold transition-colors"
          >
            <Edit2 size={14} />
            Edit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function TradeFormModal({ isOpen, onClose, formData, setFormData, onSubmit, isEditing }: any) {
  const t = useT();

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
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-blue-500/30 bg-gradient-to-b from-black to-gray-900/50 p-6 backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {isEditing ? '✏️ Edit Trade' : '➕ New Trade'}
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </motion.button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Symbol *
              </label>
              <input
                type="text"
                placeholder="e.g., EURUSD"
                className="w-full px-3 py-2.5 bg-gray-800/50 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
                value={formData.symbol}
                onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Type *
              </label>
              <select
                className="w-full px-3 py-2.5 bg-gray-800/50 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as 'long' | 'short' })}
              >
                <option value="long">🟢 Long</option>
                <option value="short">🔴 Short</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Entry Price *
              </label>
              <input
                type="number"
                placeholder="0.0000"
                className="w-full px-3 py-2.5 bg-gray-800/50 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
                step="0.0001"
                value={formData.entry}
                onChange={e => setFormData({ ...formData, entry: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Exit Price
              </label>
              <input
                type="number"
                placeholder="0.0000 (optional)"
                className="w-full px-3 py-2.5 bg-gray-800/50 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
                step="0.0001"
                value={formData.exit}
                onChange={e => setFormData({ ...formData, exit: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Account Size ($)
              </label>
              <input
                type="number"
                placeholder="10000"
                className="w-full px-3 py-2.5 bg-gray-800/50 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
                step="0.01"
                value={formData.accountSize}
                onChange={e => setFormData({ ...formData, accountSize: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Duration
              </label>
              <input
                type="text"
                placeholder="e.g., 2h 30m"
                className="w-full px-3 py-2.5 bg-gray-800/50 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Trade Notes & Analysis
            </label>
            <textarea
              placeholder="Document your trade setup, entry reason, and observations..."
              className="w-full px-3 py-2.5 bg-gray-800/50 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors resize-none h-24"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-bold text-white transition-all shadow-lg shadow-blue-500/20"
            >
              {isEditing ? 'Update Trade' : 'Add Trade'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold text-white transition-all"
            >
              Cancel
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function TradeDetailModal({ trade, onClose, onEdit, onDelete }: any) {
  if (!trade) return null;

  const isWin = (trade.pnl || 0) > 0;

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
        className={`w-full max-w-2xl rounded-xl border backdrop-blur-sm p-6 bg-gradient-to-b from-gray-900 to-gray-900/50 ${
          isWin ? 'border-green-500/30' : trade.pnl === 0 ? 'border-gray-500/30' : 'border-red-500/30'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">{trade.symbol}</h2>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-lg text-sm font-bold uppercase tracking-wider ${
                trade.type === 'long' 
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-red-500/20 text-red-300'
              }`}>
                {trade.type === 'long' ? '📈 Long' : '📉 Short'}
              </span>
              <span className={`text-lg font-bold ${isWin ? 'text-green-400' : trade.pnl === 0 ? 'text-gray-400' : 'text-red-400'}`}>
                {trade.pnl ? (trade.pnl >= 0 ? '+' : '') + trade.pnl.toFixed(2) : '—'}
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-700">
          <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Entry Price</span>
            <span className="text-2xl font-bold text-blue-400 font-mono">{trade.entry.toFixed(4)}</span>
          </div>
          <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Exit Price</span>
            <span className="text-2xl font-bold text-cyan-400 font-mono">{trade.exit ? trade.exit.toFixed(4) : '—'}</span>
          </div>
          <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Account Size</span>
            <span className="text-2xl font-bold text-gray-300">${trade.accountSize ? trade.accountSize.toFixed(2) : '—'}</span>
          </div>
          <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Duration</span>
            <span className="text-2xl font-bold text-gray-300">{trade.duration || '—'}</span>
          </div>
        </div>

        {/* P&L Details */}
        <div className="flex gap-3 mb-6">
          <div className={`flex-1 p-4 rounded-lg border ${
            isWin ? 'bg-green-500/10 border-green-500/30' : trade.pnl === 0 ? 'bg-gray-500/10 border-gray-500/30' : 'bg-red-500/10 border-red-500/30'
          }`}>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">P&L Amount</span>
            <span className={`text-2xl font-bold ${isWin ? 'text-green-400' : trade.pnl === 0 ? 'text-gray-400' : 'text-red-400'}`}>
              {trade.pnl ? (trade.pnl >= 0 ? '+' : '') + trade.pnl.toFixed(2) : '—'}
            </span>
          </div>
          <div className={`flex-1 p-4 rounded-lg border ${
            isWin ? 'bg-green-500/10 border-green-500/30' : trade.pnl === 0 ? 'bg-gray-500/10 border-gray-500/30' : 'bg-red-500/10 border-red-500/30'
          }`}>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">P&L %</span>
            <span className={`text-2xl font-bold ${isWin ? 'text-green-400' : trade.pnl === 0 ? 'text-gray-400' : 'text-red-400'}`}>
              {trade.pnlPercent ? (trade.pnlPercent >= 0 ? '+' : '') + trade.pnlPercent.toFixed(2) + '%' : '—'}
            </span>
          </div>
        </div>

        {/* Notes */}
        {trade.notes && (
          <div className="mb-6 p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Trade Notes</h3>
            <p className="text-gray-300 whitespace-pre-wrap text-sm">{trade.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onEdit}
            className="flex-1 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg font-bold transition-colors"
          >
            <Edit2 className="w-4 h-4 inline mr-2" />
            Edit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDelete}
            className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg font-bold transition-colors"
          >
            <Trash2 className="w-4 h-4 inline mr-2" />
            Delete
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-bold transition-colors"
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
