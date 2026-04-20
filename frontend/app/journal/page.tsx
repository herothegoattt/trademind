'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Edit2, TrendingUp, TrendingDown, Filter, X, BookOpen } from 'lucide-react';
import { useT } from '../../lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradeStore, TradeUI, calculatePnL } from '../../lib/trade-store';
import { usePlanLimits } from '../../lib/plan-limits';
import { UpgradeGate } from '../../components/ui/UpgradeGate';

export default function JournalPage() {
  const { trades, addTrade, updateTrade, deleteTrade } = useTradeStore();
  const limits = usePlanLimits();
  const tradeLimit = limits.journal_max_trades;
  const atLimit = tradeLimit !== null && trades.length >= tradeLimit;
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'long' | 'short'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'best' | 'worst'>('newest');
  const [formData, setFormData] = useState({
    symbol: '', type: 'long' as 'long' | 'short',
    entry: '', exit: '', accountSize: '', duration: '', notes: '',
  });
  const t = useT();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry = parseFloat(formData.entry);
    const exit = formData.exit ? parseFloat(formData.exit) : undefined;
    const accountSize = formData.accountSize ? parseFloat(formData.accountSize) : undefined;
    const pnlResult = exit ? calculatePnL(entry, exit, formData.type, accountSize) : null;
    const tradeData = {
      symbol: formData.symbol.toUpperCase(), type: formData.type,
      entry, exit, accountSize, duration: formData.duration, notes: formData.notes,
      pnl: pnlResult?.pnl, pnlPercent: pnlResult?.pnlPercent,
    };
    if (editId) { updateTrade(editId, tradeData); setEditId(null); }
    else addTrade(tradeData);
    setFormData({ symbol: '', type: 'long', entry: '', exit: '', accountSize: '', duration: '', notes: '' });
    setShowForm(false);
  };

  const handleEdit = (trade: TradeUI) => {
    setFormData({
      symbol: trade.symbol, type: trade.type, entry: trade.entry.toString(),
      exit: trade.exit?.toString() || '', accountSize: trade.accountSize?.toString() || '',
      duration: trade.duration, notes: trade.notes,
    });
    setEditId(trade.id);
    setShowForm(true);
  };

  let filteredTrades = trades.filter(t => filterType === 'all' ? true : t.type === filterType);
  filteredTrades = [...filteredTrades].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === 'best')  return (b.pnl || 0) - (a.pnl || 0);
    if (sortBy === 'worst') return (a.pnl || 0) - (b.pnl || 0);
    return 0;
  });

  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winningTrades = trades.filter(t => (t.pnl || 0) > 0).length;
  const losingTrades  = trades.filter(t => (t.pnl || 0) < 0).length;
  const winRate = trades.length > 0 ? ((winningTrades / trades.length) * 100).toFixed(1) : '0.0';
  const avgWin  = winningTrades > 0
    ? (trades.filter(t => (t.pnl || 0) > 0).reduce((s, t) => s + (t.pnl || 0), 0) / winningTrades).toFixed(2)
    : '0.00';
  const avgLoss = losingTrades > 0
    ? (trades.filter(t => (t.pnl || 0) < 0).reduce((s, t) => s + (t.pnl || 0), 0) / losingTrades).toFixed(2)
    : '0.00';

  return (
    <div
      className="h-full overflow-y-auto pb-14 md:pb-0 text-white page-bg"
    >
      {/* Header */}
      <div
        className="sticky top-0 z-20"
        style={{
          background: "rgba(7,10,18,0.94)",
          borderBottom: "1px solid rgba(255,255,255,0.065)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center justify-between px-5 py-3.5 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(100,116,139,0.8)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color="#e2e8f0"; (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.06)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color="rgba(100,116,139,0.8)"; (e.currentTarget as HTMLElement).style.background="transparent"; }}
            >
              <ArrowLeft size={14} />
            </Link>
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(34,211,238,0.18), rgba(34,211,238,0.08))",
                  border: "1px solid rgba(34,211,238,0.25)",
                  boxShadow: "0 0 16px rgba(34,211,238,0.12)",
                }}
              >
                <BookOpen size={14} style={{ color: "#22d3ee" }} />
              </div>
              <div>
                <h1 className="text-[14px] font-semibold neon-cyan">Trading Journal</h1>
                <p className="text-[10px]" style={{ color: "rgba(71,85,105,0.8)" }}>Track & analyze your trades</p>
              </div>
            </div>
          </div>

          {atLimit ? (
            <UpgradeGate requiredPlan="edge" feature={`Journal (${tradeLimit} trade limit)`} blurContent={false}>
              <button
                disabled
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 cursor-not-allowed"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <Plus size={14} />
                New Trade
              </button>
            </UpgradeGate>
          ) : (
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditId(null);
                setFormData({ symbol: '', type: 'long', entry: '', exit: '', accountSize: '', duration: '', notes: '' });
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, rgba(34,211,238,0.18), rgba(34,211,238,0.08))",
                border: "1px solid rgba(34,211,238,0.3)",
                color: "#22d3ee",
                boxShadow: "0 0 16px rgba(34,211,238,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <Plus size={13} />
              New Trade
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
          <StatCard label="Total P&L" value={`${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}`}
            positive={totalPnL > 0} negative={totalPnL < 0}
            icon={totalPnL >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />} />
          <StatCard label="Trades"   value={trades.length.toString()} />
          <StatCard label="Win Rate" value={`${winRate}%`} accent />
          <StatCard label="Avg Win"  value={`+${avgWin}`} positive />
          <StatCard label="Avg Loss" value={avgLoss} negative />
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <TradeFormModal
              isOpen={showForm}
              onClose={() => { setShowForm(false); setEditId(null); }}
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              isEditing={!!editId}
            />
          )}
        </AnimatePresence>

        {/* Filters */}
        <div
          className="flex items-center gap-4 mb-5 pb-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-slate-600" />
            <span className="text-[11px] text-slate-600 uppercase tracking-wider font-medium">Type</span>
          </div>
          <div className="flex items-center gap-1.5">
            {(['all', 'long', 'short'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
                style={
                  filterType === type
                    ? type === 'long'  ? { background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ade80" }
                    : type === 'short' ? { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }
                    :                    { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#e2e8f0" }
                    : { background: "transparent", border: "1px solid rgba(255,255,255,0.06)", color: "#6b7280" }
                }
              >
                {type === 'all' ? 'All' : type === 'long' ? 'Long' : 'Short'}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-slate-600 uppercase tracking-wider font-medium">Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs text-slate-300 rounded-lg focus:outline-none transition-colors"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="best">Best P&L</option>
              <option value="worst">Worst P&L</option>
            </select>
          </div>
        </div>

        {/* Trades */}
        {filteredTrades.length === 0 ? (
          <div className="text-center py-20">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <BookOpen size={20} className="text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm mb-4">No trades recorded yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-cyan-400 transition-all hover:bg-cyan-500/08"
              style={{ border: "1px solid rgba(34,211,238,0.2)" }}
            >
              Record your first trade
            </button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredTrades.map((trade, idx) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                onEdit={() => handleEdit(trade)}
                onDelete={() => deleteTrade(trade.id)}
                onClick={() => setSelectedTrade(trade.id)}
                index={idx}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
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
            onDelete={() => { deleteTrade(selectedTrade); setSelectedTrade(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Stat Card ────────────────────────────────────────────────── */
function StatCard({ label, value, positive, negative, neutral, accent, icon }: any) {
  const cfg = positive
    ? { text: "#4ade80",  bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.22)",  glowRgb: "34,197,94",    iconBg: "rgba(34,197,94,0.14)"  }
    : negative
    ? { text: "#f87171",  bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.22)",  glowRgb: "239,68,68",    iconBg: "rgba(239,68,68,0.14)"  }
    : accent
    ? { text: "#22d3ee",  bg: "rgba(34,211,238,0.1)",  border: "rgba(34,211,238,0.22)", glowRgb: "34,211,238",   iconBg: "rgba(34,211,238,0.14)" }
    : { text: "#94a3b8",  bg: "rgba(255,255,255,0.04)",border: "rgba(255,255,255,0.09)",glowRgb: "148,163,184",  iconBg: "rgba(255,255,255,0.07)" };

  const neonText = [
    `0 0 4px rgba(${cfg.glowRgb},0.5), 0 0 14px rgba(${cfg.glowRgb},0.2)`,
    `0 0 8px rgba(${cfg.glowRgb},0.9), 0 0 24px rgba(${cfg.glowRgb},0.45), 0 0 50px rgba(${cfg.glowRgb},0.12)`,
    `0 0 4px rgba(${cfg.glowRgb},0.5), 0 0 14px rgba(${cfg.glowRgb},0.2)`,
  ];

  return (
    <motion.div
      className="rounded-2xl p-4 relative overflow-hidden flex flex-col gap-2"
      style={{
        background: `linear-gradient(145deg, ${cfg.bg}, rgba(255,255,255,0.015))`,
        border: `1px solid ${cfg.border}`,
        inset: "0 1px 0 rgba(255,255,255,0.06)",
      }}
      animate={{
        boxShadow: [
          `0 4px 20px rgba(${cfg.glowRgb},0.1), inset 0 1px 0 rgba(255,255,255,0.06)`,
          `0 4px 32px rgba(${cfg.glowRgb},0.22), 0 0 0 1px rgba(${cfg.glowRgb},0.08), inset 0 1px 0 rgba(255,255,255,0.08)`,
          `0 4px 20px rgba(${cfg.glowRgb},0.1), inset 0 1px 0 rgba(255,255,255,0.06)`,
        ],
      }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Top shimmer */}
      <div className="absolute top-0 left-6 right-6 h-px" style={{
        background: `linear-gradient(90deg, transparent, ${cfg.border}, transparent)`,
      }} />

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "rgba(90,104,128,0.85)" }}>
          {label}
        </span>
        {icon && (
          <motion.span
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: cfg.iconBg, color: cfg.text }}
            animate={{ filter: [
              `drop-shadow(0 0 2px rgba(${cfg.glowRgb},0.5))`,
              `drop-shadow(0 0 5px rgba(${cfg.glowRgb},1)) drop-shadow(0 0 10px rgba(${cfg.glowRgb},0.4))`,
              `drop-shadow(0 0 2px rgba(${cfg.glowRgb},0.5))`,
            ]}}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            {icon}
          </motion.span>
        )}
      </div>

      <motion.div
        className="text-[22px] font-bold font-mono tabular-nums leading-none"
        style={{ color: cfg.text }}
        animate={{ textShadow: neonText }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        {value}
      </motion.div>
    </motion.div>
  );
}

/* ── Trade Card ───────────────────────────────────────────────── */
function TradeCard({ trade, onEdit, onDelete, onClick, index }: any) {
  const isWin  = (trade.pnl || 0) > 0;
  const isLoss = (trade.pnl || 0) < 0;

  const cfg = isWin
    ? { text: "#4ade80", stripe: "#4ade80",  border: "rgba(34,197,94,0.2)",  bg: "rgba(34,197,94,0.05)",    typeBg: "rgba(34,197,94,0.12)",  typeText: "#86efac" }
    : isLoss
    ? { text: "#f87171", stripe: "#f87171",  border: "rgba(239,68,68,0.2)",  bg: "rgba(239,68,68,0.05)",    typeBg: "rgba(239,68,68,0.12)",  typeText: "#fca5a5" }
    : { text: "#94a3b8", stripe: "#475569",  border: "rgba(255,255,255,0.08)",bg: "rgba(255,255,255,0.025)", typeBg: "rgba(255,255,255,0.08)", typeText: "#94a3b8" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.22, ease: "easeOut" }}
      onClick={onClick}
      className="group relative rounded-2xl p-4 cursor-pointer overflow-hidden"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      whileHover={{ scale: 1.01, boxShadow: `0 8px 32px rgba(0,0,0,0.2)` }}
    >
      {/* Left accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
        style={{ background: `linear-gradient(180deg, ${cfg.stripe}bb, ${cfg.stripe}44)` }}
      />

      {/* Top shimmer line */}
      <div className="absolute top-0 left-8 right-8 h-px" style={{
        background: `linear-gradient(90deg, transparent, ${cfg.border}, transparent)`,
      }} />

      {/* Symbol + Type + P&L row */}
      <div className="flex items-start justify-between mb-3 ml-2">
        <div>
          <h3 className="text-[15px] font-bold" style={{ color: "#edf0f5" }}>{trade.symbol}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
              style={{ background: cfg.typeBg, color: cfg.typeText }}
            >
              {trade.type}
            </span>
            {trade.duration && (
              <span className="text-[10px]" style={{ color: "rgba(71,85,105,0.8)" }}>{trade.duration}</span>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[17px] font-bold font-mono tabular-nums" style={{ color: cfg.text }}>
            {trade.pnl != null ? `${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}` : '—'}
          </div>
          {trade.pnlPercent != null && (
            <div
              className="text-[11px] font-semibold font-mono"
              style={{
                color: cfg.text,
                background: `${cfg.typeBg}`,
                borderRadius: 4,
                padding: "1px 5px",
                display: "inline-block",
                marginTop: 2,
              }}
            >
              {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      {/* Entry / Exit row */}
      <div
        className="grid grid-cols-2 gap-3 py-2.5 ml-2 mb-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.055)", borderBottom: "1px solid rgba(255,255,255,0.055)" }}
      >
        <div>
          <span className="text-[9px] uppercase tracking-widest font-semibold block mb-0.5" style={{ color: "rgba(71,85,105,0.7)" }}>Entry</span>
          <span className="font-mono text-[13px] font-medium" style={{ color: "#c4cdd8" }}>{trade.entry.toFixed(4)}</span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-widest font-semibold block mb-0.5" style={{ color: "rgba(71,85,105,0.7)" }}>Exit</span>
          <span className="font-mono text-[13px] font-medium" style={{ color: "#c4cdd8" }}>{trade.exit ? trade.exit.toFixed(4) : '—'}</span>
        </div>
      </div>

      {trade.notes && (
        <p className="text-[11px] ml-2 mb-3 line-clamp-2 leading-relaxed" style={{ color: "rgba(90,104,128,0.85)" }}>
          {trade.notes}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 ml-2">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all"
          style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(100,116,139,0.9)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#e2e8f0"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(100,116,139,0.9)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
        >
          <Edit2 size={11} /> Edit
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all"
          style={{ border: "1px solid rgba(239,68,68,0.12)", color: "rgba(239,68,68,0.6)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f87171"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.25)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(239,68,68,0.6)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.12)"; }}
        >
          <Trash2 size={11} /> Delete
        </button>
      </div>
    </motion.div>
  );
}

/* ── Trade Form Modal ─────────────────────────────────────────── */
function TradeFormModal({ isOpen, onClose, formData, setFormData, onSubmit, isEditing }: any) {
  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 10,
    color: "white",
    padding: "10px 12px",
    fontSize: 13,
    width: "100%",
    outline: "none",
    transition: "border-color 150ms ease",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.97, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl p-6"
        style={{ background: "#0f0f17", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-white">
            {isEditing ? 'Edit Trade' : 'New Trade'}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 uppercase tracking-wider font-medium block mb-1.5">Symbol *</label>
              <input style={inputStyle} type="text" placeholder="EURUSD"
                value={formData.symbol} onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                onFocus={e => e.target.style.borderColor = "rgba(34,211,238,0.35)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
                required />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 uppercase tracking-wider font-medium block mb-1.5">Type *</label>
              <select style={{ ...inputStyle, appearance: "none" }} value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 uppercase tracking-wider font-medium block mb-1.5">Entry Price *</label>
              <input style={inputStyle} type="number" placeholder="0.0000" step="any"
                value={formData.entry} onChange={e => setFormData({ ...formData, entry: e.target.value })}
                onFocus={e => e.target.style.borderColor = "rgba(34,211,238,0.35)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
                required />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 uppercase tracking-wider font-medium block mb-1.5">Exit Price</label>
              <input style={inputStyle} type="number" placeholder="optional" step="any"
                value={formData.exit} onChange={e => setFormData({ ...formData, exit: e.target.value })}
                onFocus={e => e.target.style.borderColor = "rgba(34,211,238,0.35)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 uppercase tracking-wider font-medium block mb-1.5">Account Size ($)</label>
              <input style={inputStyle} type="number" placeholder="10000" step="any"
                value={formData.accountSize} onChange={e => setFormData({ ...formData, accountSize: e.target.value })}
                onFocus={e => e.target.style.borderColor = "rgba(34,211,238,0.35)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"} />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 uppercase tracking-wider font-medium block mb-1.5">Duration</label>
              <input style={inputStyle} type="text" placeholder="2h 30m"
                value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })}
                onFocus={e => e.target.style.borderColor = "rgba(34,211,238,0.35)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"} />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-500 uppercase tracking-wider font-medium block mb-1.5">Notes & Analysis</label>
            <textarea
              style={{ ...inputStyle, resize: "none", height: 96 }}
              placeholder="Document your trade setup and observations..."
              value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
              onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = "rgba(34,211,238,0.35)"}
              onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = "rgba(255,255,255,0.09)"}
            />
          </div>

          <div
            className="flex gap-3 pt-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.25)", color: "#22d3ee" }}>
              {isEditing ? 'Update Trade' : 'Add Trade'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ── Trade Detail Modal ───────────────────────────────────────── */
function TradeDetailModal({ trade, onClose, onEdit, onDelete }: any) {
  if (!trade) return null;
  const isWin  = (trade.pnl || 0) > 0;
  const isLoss = (trade.pnl || 0) < 0;
  const pnlColor = isWin ? "#4ade80" : isLoss ? "#f87171" : "#94a3b8";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.97, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-lg rounded-2xl p-6"
        style={{
          background: "#0f0f17",
          border: `1px solid ${isWin ? "rgba(34,197,94,0.2)" : isLoss ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1.5">{trade.symbol}</h2>
            <div className="flex items-center gap-2.5">
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider"
                style={
                  trade.type === 'long'
                    ? { background: "rgba(34,197,94,0.12)", color: "#86efac" }
                    : { background: "rgba(239,68,68,0.12)", color: "#fca5a5" }
                }
              >
                {trade.type}
              </span>
              <span className="text-lg font-bold font-mono" style={{ color: pnlColor }}>
                {trade.pnl != null ? `${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}` : '—'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Price grid */}
        <div
          className="grid grid-cols-2 gap-3 pb-4 mb-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          {[
            { label: "Entry Price",  value: trade.entry.toFixed(4), mono: true },
            { label: "Exit Price",   value: trade.exit ? trade.exit.toFixed(4) : '—', mono: true },
            { label: "Account Size", value: trade.accountSize ? `$${trade.accountSize.toFixed(2)}` : '—' },
            { label: "Duration",     value: trade.duration || '—' },
          ].map(item => (
            <div
              key={item.label}
              className="p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-[10px] text-slate-600 uppercase tracking-wider block mb-1.5">{item.label}</span>
              <span className={`text-lg font-bold text-slate-200 ${item.mono ? 'font-mono' : ''}`}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* P&L */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: "P&L Amount", value: trade.pnl != null ? `${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}` : '—' },
            { label: "P&L %",      value: trade.pnlPercent != null ? `${trade.pnlPercent >= 0 ? '+' : ''}${trade.pnlPercent.toFixed(2)}%` : '—' },
          ].map(item => (
            <div
              key={item.label}
              className="p-3 rounded-xl"
              style={{
                background: isWin ? "rgba(34,197,94,0.07)" : isLoss ? "rgba(239,68,68,0.07)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isWin ? "rgba(34,197,94,0.15)" : isLoss ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <span className="text-[10px] text-slate-600 uppercase tracking-wider block mb-1.5">{item.label}</span>
              <span className="text-xl font-bold font-mono" style={{ color: pnlColor }}>{item.value}</span>
            </div>
          ))}
        </div>

        {trade.notes && (
          <div
            className="mb-4 p-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-[10px] text-slate-600 uppercase tracking-wider block mb-2">Notes</span>
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{trade.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2.5">
          <button onClick={onEdit}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.09)" }}>
            <Edit2 className="w-3.5 h-3.5 inline mr-1.5" />Edit
          </button>
          <button onClick={onDelete}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-red-500/60 hover:text-red-400 transition-all"
            style={{ border: "1px solid rgba(239,68,68,0.12)" }}>
            <Trash2 className="w-3.5 h-3.5 inline mr-1.5" />Delete
          </button>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-300 transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
