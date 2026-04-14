'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, TrendingUp, TrendingDown, DollarSign,
  BarChart2, Edit2, Trash2, ChevronDown, ChevronUp,
  Target, Activity, Award
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, ReferenceLine,
} from 'recharts';
import {
  usePortfolio, Position, calcPnL, calcPnLPct,
  posInvested, posCurrentValue,
} from '../../lib/portfolioContext';

// ─── Colors ───────────────────────────────────────────────────────────────────
export const CAT_COLORS: Record<string, string> = {
  crypto: '#f97316', stocks: '#06b6d4', forex: '#8b5cf6',
  commodities: '#f59e0b', etf: '#10b981', other: '#64748b',
};

// ─── Form defaults ────────────────────────────────────────────────────────────
const EMPTY_FORM: Omit<Position, 'id'> = {
  symbol: '', type: 'spot', direction: 'long',
  entryPrice: 0, currentPrice: 0, exitPrice: undefined,
  quantity: 0, leverage: 1,
  entryDate: new Date().toISOString().split('T')[0],
  exitDate: undefined,
  status: 'open', notes: '', category: 'stocks',
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string; sub?: string; color: string; icon: any;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-black mt-1.5 ${color}`}>{value}</p>
          {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
        </div>
        <div className="p-2.5 bg-slate-800 rounded-lg">
          <Icon size={18} className={color} />
        </div>
      </div>
    </div>
  );
}

type Rec = 'trade' | 'avoid' | 'watch';

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InvestingPortfolio() {
  const {
    positions, stats, allocation, performance,
    addPosition, updatePosition, deletePosition, closePosition,
  } = usePortfolio();

  const [showForm,    setShowForm]    = useState(false);
  const [editId,      setEditId]      = useState<string | null>(null);
  const [form,        setForm]        = useState<Omit<Position, 'id'>>(EMPTY_FORM);
  const [filterStatus,setFilterStatus]= useState<'all'|'open'|'closed'>('all');
  const [filterType,  setFilterType]  = useState<'all'|'spot'|'futures'>('all');
  const [sortBy,      setSortBy]      = useState<'date'|'pnl'|'size'>('date');
  const [expandedId,  setExpandedId]  = useState<string|null>(null);

  const openForm = (pos?: Position) => {
    if (pos) { setEditId(pos.id); setForm({ ...pos }); }
    else      { setEditId(null);  setForm({ ...EMPTY_FORM, entryDate: new Date().toISOString().split('T')[0] }); }
    setShowForm(true);
  };

  const submitForm = () => {
    if (!form.symbol || form.entryPrice <= 0 || form.quantity <= 0) return;
    if (editId) updatePosition(editId, form);
    else        addPosition(form);
    setShowForm(false);
  };

  const filtered = useMemo(() => {
    let ps = positions;
    if (filterStatus !== 'all') ps = ps.filter(p => p.status === filterStatus);
    if (filterType   !== 'all') ps = ps.filter(p => p.type   === filterType);
    return [...ps].sort((a, b) => {
      if (sortBy === 'pnl')  return calcPnL(b) - calcPnL(a);
      if (sortBy === 'size') return posInvested(b) - posInvested(a);
      return new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime();
    });
  }, [positions, filterStatus, filterType, sortBy]);

  const pnlBarData = useMemo(() =>
    filtered.slice(0, 14).map(p => ({
      name: p.symbol,
      pnl:  parseFloat(calcPnL(p).toFixed(2)),
      fill: calcPnL(p) >= 0 ? '#10b981' : '#ef4444',
    })), [filtered]);

  const allocData = allocation.map(a => ({
    name: a.category, value: a.currentValue, color: CAT_COLORS[a.category] || '#64748b',
  }));

  const fmt = (n: number) =>
    Math.abs(n) >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n.toFixed(0)}`;
  const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

  return (
    <div className="space-y-6">

      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-white">My Investing Portfolio</h2>
          <p className="text-slate-400 text-sm mt-0.5">Track long-term spot & futures positions — feeds all other tabs</p>
        </div>
        <button onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500/20 border border-orange-500/40 text-orange-300 rounded-xl font-bold text-sm hover:bg-orange-500/30 transition-all">
          <Plus size={16} /> Add Position
        </button>
      </div>

      {/* ── Stats ── */}
      {positions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Invested"      value={fmt(stats.totalInvested)}   color="text-slate-100" icon={DollarSign} />
          <StatCard label="Current Value" value={fmt(stats.totalCurrentVal)}
            sub={pct(stats.totalReturnPct)}
            color={stats.totalCurrentVal >= stats.totalInvested ? 'text-emerald-400' : 'text-rose-400'} icon={Activity} />
          <StatCard label="Unrealized P&L" value={fmt(stats.unrealizedPnL)}
            sub={`${stats.openCount} open`}
            color={stats.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'} icon={TrendingUp} />
          <StatCard label="Realized P&L"  value={fmt(stats.realizedPnL)}
            sub={`${stats.closedCount} closed`}
            color={stats.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'} icon={Target} />
          <StatCard label="Total P&L"     value={fmt(stats.totalPnL)}
            color={stats.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'} icon={BarChart2} />
          <StatCard label="Win Rate"      value={`${stats.winRate.toFixed(0)}%`}
            sub={`${positions.filter(p=>calcPnL(p)>0).length}W / ${positions.filter(p=>calcPnL(p)<0).length}L`}
            color={stats.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'} icon={Award} />
        </div>
      )}

      {/* ── Charts ── */}
      {positions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Cumulative P&L line */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-300 mb-4">Cumulative P&L Over Time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={performance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                  formatter={(v: any) => [`$${Number(v).toFixed(0)}`, 'Cumul. P&L']} />
                <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="cumulativePnL" stroke="#f97316" strokeWidth={2}
                  dot={{ fill: '#f97316', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Allocation Pie */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-300 mb-4">Allocation by Category</h3>
            {allocData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={allocData} cx="50%" cy="50%" innerRadius={42} outerRadius={65}
                      paddingAngle={2} dataKey="value">
                      {allocData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                      formatter={(v: any) => [`$${Number(v).toFixed(0)}`]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-1">
                  {allocData.map((e, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                        <span className="text-slate-400 capitalize">{e.name}</span>
                      </div>
                      <span className="text-slate-300 font-mono">{fmt(e.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-600 text-sm">No open positions</div>
            )}
          </div>

          {/* P&L per trade */}
          {pnlBarData.length > 0 && (
            <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-slate-300 mb-4">P&L by Position</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={pnlBarData} barSize={26}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#475569" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                    formatter={(v: any) => [`$${Number(v).toFixed(0)}`, 'P&L']} />
                  <ReferenceLine y={0} stroke="#475569" />
                  <Bar dataKey="pnl" radius={[4,4,0,0]}>
                    {pnlBarData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
          {(['all','open','closed'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all capitalize ${filterStatus===s ? 'bg-orange-500/20 text-orange-300' : 'text-slate-500 hover:text-slate-300'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
          {(['all','spot','futures'] as const).map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all capitalize ${filterType===t ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500 hover:text-slate-300'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
          <span className="px-2 py-1.5 text-xs text-slate-600">Sort:</span>
          {([['date','Date'],['pnl','P&L'],['size','Size']] as const).map(([v,l]) => (
            <button key={v} onClick={() => setSortBy(v)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${sortBy===v ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Positions List ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-slate-400 text-sm mb-4">No positions yet. Add your first long-term trade — all tabs will update automatically.</p>
          <button onClick={() => openForm()}
            className="px-4 py-2 bg-orange-500/20 border border-orange-500/30 text-orange-300 rounded-lg text-sm font-bold hover:bg-orange-500/30 transition-all">
            + Add Position
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(pos => {
            const pnl     = calcPnL(pos);
            const pnlPct  = calcPnLPct(pos);
            const isGreen = pnl >= 0;
            const isOpen  = pos.status === 'open';
            const isExp   = expandedId === pos.id;

            return (
              <motion.div key={pos.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-slate-700/50 bg-slate-900/80 overflow-hidden">

                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpandedId(isExp ? null : pos.id)}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CAT_COLORS[pos.category] || '#64748b' }} />

                  <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                    <span className="font-black text-white text-sm">{pos.symbol}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.type === 'futures' ? 'bg-purple-500/20 text-purple-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
                      {pos.type.toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.direction === 'long' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                      {pos.direction.toUpperCase()}
                    </span>
                    {pos.type === 'futures' && pos.leverage > 1 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">{pos.leverage}x</span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${isOpen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                      {isOpen ? 'OPEN' : 'CLOSED'}
                    </span>
                  </div>

                  <div className="hidden sm:flex flex-col items-end text-xs text-slate-500 min-w-[80px]">
                    <span className="font-mono">${pos.entryPrice.toLocaleString()}</span>
                    <span>×{pos.quantity}</span>
                  </div>

                  <div className="flex flex-col items-end min-w-[80px]">
                    <span className={`font-black text-sm ${isGreen ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isGreen ? '+' : ''}{fmt(pnl)}
                    </span>
                    <span className={`text-[10px] font-bold ${isGreen ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {pct(pnlPct)}
                    </span>
                  </div>
                  <span className="text-slate-700 ml-1">{isExp ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</span>
                </div>

                <AnimatePresence initial={false}>
                  {isExp && (
                    <motion.div key="d" initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
                      exit={{ height:0, opacity:0 }} transition={{ duration: 0.2 }} className="overflow-hidden border-t border-slate-800/50">
                      <div className="px-4 py-4 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          {[
                            { label: 'Entry Price',    val: `$${pos.entryPrice.toLocaleString()}`  },
                            { label: 'Current Price',  val: `$${pos.currentPrice.toLocaleString()}`},
                            { label: 'Quantity',       val: String(pos.quantity)                   },
                            { label: 'Invested',       val: fmt(posInvested(pos))                  },
                            { label: 'Current Value',  val: fmt(posCurrentValue(pos))              },
                            { label: 'Entry Date',     val: pos.entryDate                          },
                            ...(pos.exitDate  ? [{ label: 'Exit Date',  val: pos.exitDate  }] : []),
                            ...(pos.exitPrice ? [{ label: 'Exit Price', val: `$${pos.exitPrice.toLocaleString()}` }] : []),
                          ].map(({ label, val }) => (
                            <div key={label} className="bg-slate-800/40 rounded-lg px-3 py-2">
                              <div className="text-slate-600 mb-0.5">{label}</div>
                              <div className="text-slate-200 font-mono font-bold">{val}</div>
                            </div>
                          ))}
                        </div>
                        {pos.notes && <p className="text-xs text-slate-400 bg-slate-800/30 rounded-lg px-3 py-2">{pos.notes}</p>}
                        <div className="flex items-center gap-2 pt-1">
                          <button onClick={() => openForm(pos)}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all">
                            <Edit2 size={12}/> Edit
                          </button>
                          {isOpen && (
                            <button onClick={() => closePosition(pos.id)}
                              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition-all">
                              <Target size={12}/> Close Position
                            </button>
                          )}
                          <button onClick={() => deletePosition(pos.id)}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all ml-auto">
                            <Trash2 size={12}/> Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Form Modal ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }}
              exit={{ scale:0.95, opacity:0 }} transition={{ duration:0.18 }}
              className="w-full max-w-lg bg-[#0d1117] border border-slate-700 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white">{editId ? 'Edit Position' : 'Add Position'}</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Symbol</label>
                  <input value={form.symbol}
                    onChange={e => setForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))}
                    placeholder="e.g. BTC, AAPL, EURUSD, SPY"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-orange-500/60 focus:outline-none placeholder-slate-600"/>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Type</label>
                  <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
                    {(['spot','futures'] as const).map(t => (
                      <button key={t} onClick={() => setForm(f => ({ ...f, type: t, leverage: t==='spot' ? 1 : f.leverage, direction: t==='spot'?'long':f.direction }))}
                        className={`flex-1 py-1.5 rounded text-xs font-bold transition-all capitalize ${form.type===t ? 'bg-orange-500/20 text-orange-300' : 'text-slate-500'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Direction</label>
                  <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
                    {(['long','short'] as const).map(d => (
                      <button key={d} onClick={() => setForm(f => ({ ...f, direction: d }))}
                        disabled={form.type==='spot' && d==='short'}
                        className={`flex-1 py-1.5 rounded text-xs font-bold transition-all capitalize ${form.direction===d ? d==='long'?'bg-emerald-500/20 text-emerald-300':'bg-rose-500/20 text-rose-300' : 'text-slate-500'} disabled:opacity-30`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none">
                    {['crypto','stocks','forex','commodities','etf','other'].map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Status</label>
                  <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
                    {(['open','closed'] as const).map(s => (
                      <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                        className={`flex-1 py-1.5 rounded text-xs font-bold transition-all capitalize ${form.status===s ? 'bg-slate-600 text-white' : 'text-slate-500'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Entry Price ($)</label>
                  <input type="number" min="0" step="any" value={form.entryPrice || ''}
                    onChange={e => setForm(f => ({ ...f, entryPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-orange-500/60 focus:outline-none"/>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Current Price ($)</label>
                  <input type="number" min="0" step="any" value={form.currentPrice || ''}
                    onChange={e => setForm(f => ({ ...f, currentPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-orange-500/60 focus:outline-none"/>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Quantity</label>
                  <input type="number" min="0" step="any" value={form.quantity || ''}
                    onChange={e => setForm(f => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-orange-500/60 focus:outline-none"/>
                </div>

                {form.type === 'futures' && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Leverage</label>
                    <input type="number" min="1" max="125" step="1" value={form.leverage}
                      onChange={e => setForm(f => ({ ...f, leverage: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-orange-500/60 focus:outline-none"/>
                  </div>
                )}

                {form.status === 'closed' && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Exit Price ($)</label>
                    <input type="number" min="0" step="any" value={form.exitPrice || ''}
                      onChange={e => setForm(f => ({ ...f, exitPrice: parseFloat(e.target.value) || undefined }))}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-orange-500/60 focus:outline-none"/>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Entry Date</label>
                  <input type="date" value={form.entryDate}
                    onChange={e => setForm(f => ({ ...f, entryDate: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-orange-500/60 focus:outline-none"/>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Notes</label>
                  <textarea rows={2} value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Strategy thesis, target, stop..."
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-orange-500/60 focus:outline-none placeholder-slate-600 resize-none"/>
                </div>
              </div>

              {/* Live preview */}
              {form.entryPrice > 0 && form.currentPrice > 0 && form.quantity > 0 && (() => {
                const preview = calcPnL({ ...form, id: '' });
                const pp = calcPnLPct({ ...form, id: '' });
                return (
                  <div className={`rounded-xl p-3 border text-sm font-bold ${preview >= 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                    P&L Preview: {preview >= 0 ? '+' : ''}{fmt(preview)} ({pp >= 0 ? '+' : ''}{pp.toFixed(1)}%)
                  </div>
                );
              })()}

              <button onClick={submitForm}
                className="w-full py-3 bg-orange-500/20 border border-orange-500/40 text-orange-300 rounded-xl font-black text-sm hover:bg-orange-500/30 transition-all">
                {editId ? 'Save Changes' : 'Add Position'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
