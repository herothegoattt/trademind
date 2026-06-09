'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, TrendingUp, DollarSign,
  BarChart2, Edit2, Trash2, ChevronDown,
  Target, Activity, Award, Wallet,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, ReferenceLine,
} from 'recharts';
import {
  usePortfolio, Position, calcPnL, calcPnLPct,
  posInvested, posCurrentValue,
} from '../../lib/portfolioContext';
import {
  Panel, StatTile, EmptyState, PrimaryButton,
  microLabel, tooltipStyle, CAT_RGB, ACCENT,
} from './_ui';

// ─── Category colors (hex — re-exported for sibling tabs) ──────────────────────
export const CAT_COLORS: Record<string, string> = {
  crypto: '#f59e0b', stocks: '#22d3ee', forex: '#818cf8',
  commodities: '#d4a853', etf: '#34d399', other: '#94a3b8',
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
      fill: calcPnL(p) >= 0 ? '#34d399' : '#f87171',
    })), [filtered]);

  const allocData = allocation.map(a => ({
    name: a.category, value: a.currentValue, color: CAT_COLORS[a.category] || '#94a3b8',
  }));

  const fmt = (n: number, sign = false): string => {
    const abs = Math.abs(n);
    const p = n < 0 ? '-' : sign ? '+' : '';
    return abs >= 1000 ? `${p}$${(abs / 1000).toFixed(1)}k` : `${p}$${abs.toFixed(0)}`;
  };
  const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

  const tone = (n: number) => (n >= 0 ? 'text-emerald-400' : 'text-rose-400');

  return (
    <div className="space-y-6">

      {/* ── Top Bar ── */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-100">My Investing Portfolio</h2>
          <p className="text-slate-500 text-sm mt-1">Track long-term spot &amp; futures positions — feeds every other tab</p>
        </div>
        <PrimaryButton onClick={() => openForm()}>
          <Plus size={16} /> Add Position
        </PrimaryButton>
      </div>

      {/* ── Stats ── */}
      {positions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatTile index={0} label="Invested"      value={fmt(stats.totalInvested)}   icon={DollarSign} />
          <StatTile index={1} label="Current Value" value={fmt(stats.totalCurrentVal)}
            valueClass={tone(stats.totalCurrentVal - stats.totalInvested)}
            delta={pct(stats.totalReturnPct)} deltaTone={stats.totalReturnPct >= 0 ? 'gain' : 'loss'} icon={Activity} />
          <StatTile index={2} label="Unrealized P&L" value={fmt(stats.unrealizedPnL, true)}
            valueClass={tone(stats.unrealizedPnL)}
            delta={`${stats.openCount} open`} deltaTone="muted" icon={TrendingUp} />
          <StatTile index={3} label="Realized P&L"  value={fmt(stats.realizedPnL, true)}
            valueClass={tone(stats.realizedPnL)}
            delta={`${stats.closedCount} closed`} deltaTone="muted" icon={Target} />
          <StatTile index={4} label="Total P&L"     value={fmt(stats.totalPnL, true)}
            valueClass={tone(stats.totalPnL)} icon={BarChart2} />
          <StatTile index={5} label="Win Rate"      value={`${stats.winRate.toFixed(0)}%`}
            valueClass={tone(stats.winRate - 50)}
            delta={`${positions.filter(p=>calcPnL(p)>0).length}W · ${positions.filter(p=>calcPnL(p)<0).length}L`} deltaTone="muted" icon={Award} />
        </div>
      )}

      {/* ── Charts ── */}
      {positions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Cumulative P&L area */}
          <Panel className="lg:col-span-2 p-5">
            <h3 className={`${microLabel} mb-4`}>Cumulative P&amp;L Over Time</h3>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={performance} margin={{ top: 4, right: 6, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="pnlFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(34,211,238)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="rgb(34,211,238)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={48} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'rgba(34,211,238,0.3)' }}
                  formatter={(v: any) => [`$${Number(v).toFixed(0)}`, 'Cumulative P&L']} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="cumulativePnL" stroke="rgb(34,211,238)" strokeWidth={2}
                  fill="url(#pnlFill)" dot={false} activeDot={{ r: 4, fill: 'rgb(34,211,238)' }} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          {/* Allocation Pie */}
          <Panel className="p-5">
            <h3 className={`${microLabel} mb-4`}>Allocation by Category</h3>
            {allocData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={allocData} cx="50%" cy="50%" innerRadius={44} outerRadius={66}
                      paddingAngle={3} dataKey="value" stroke="none">
                      {allocData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle}
                      formatter={(v: any, _n: any, p: any) => [`$${Number(v).toFixed(0)}`, p?.payload?.name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {allocData.map((e, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                        <span className="text-slate-400 capitalize">{e.name}</span>
                      </div>
                      <span className="text-slate-300 tabular-nums">{fmt(e.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-40 grid place-items-center text-slate-600 text-sm">No open positions</div>
            )}
          </Panel>

          {/* P&L per position */}
          {pnlBarData.length > 0 && (
            <Panel className="lg:col-span-3 p-5">
              <h3 className={`${microLabel} mb-4`}>P&amp;L by Position</h3>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={pnlBarData} barSize={24} margin={{ top: 4, right: 6, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={48} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    formatter={(v: any) => [`$${Number(v).toFixed(0)}`, 'P&L']} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" />
                  <Bar dataKey="pnl" radius={[4,4,0,0]}>
                    {pnlBarData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          )}
        </div>
      )}

      {/* ── Filters ── */}
      {positions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Segmented value={filterStatus} onChange={v => setFilterStatus(v)} options={['all','open','closed'] as const} />
          <Segmented value={filterType} onChange={v => setFilterType(v)} options={['all','spot','futures'] as const} />
          <div className="ml-auto flex items-center gap-2">
            <span className={microLabel}>Sort</span>
            <Segmented value={sortBy} onChange={v => setSortBy(v)} options={['date','pnl','size'] as const} labels={{ pnl: 'P&L' }} />
          </div>
        </div>
      )}

      {/* ── Positions List ── */}
      {filtered.length === 0 ? (
        <Panel className="p-2">
          <EmptyState
            icon={Wallet}
            title={positions.length === 0 ? 'No positions yet' : 'No positions match these filters'}
            action={positions.length === 0 ? (
              <PrimaryButton onClick={() => openForm()}><Plus size={16} /> Add your first position</PrimaryButton>
            ) : undefined}
          >
            {positions.length === 0
              ? 'Add your first long-term trade — every tab updates automatically from your holdings.'
              : 'Try adjusting the status or type filters above.'}
          </EmptyState>
        </Panel>
      ) : (
        <div className="space-y-2">
          {filtered.map(pos => {
            const pnl     = calcPnL(pos);
            const pnlPct  = calcPnLPct(pos);
            const isGreen = pnl >= 0;
            const isOpen  = pos.status === 'open';
            const isExp   = expandedId === pos.id;
            const catRgb  = CAT_RGB[pos.category] || CAT_RGB.other;

            return (
              <motion.div key={pos.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Panel className={isExp ? '' : 'hover:border-white/[0.12]'}>
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" onClick={() => setExpandedId(isExp ? null : pos.id)}>
                    <span className="w-1 h-9 rounded-full flex-shrink-0" style={{ background: `rgb(${catRgb})` }} />

                    <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                      <span className="font-semibold text-slate-100 text-sm">{pos.symbol}</span>
                      <Tag tone={pos.type === 'futures' ? 'violet' : 'cyan'}>{pos.type.toUpperCase()}</Tag>
                      <Tag tone={pos.direction === 'long' ? 'emerald' : 'rose'}>{pos.direction.toUpperCase()}</Tag>
                      {pos.type === 'futures' && pos.leverage > 1 && <Tag tone="amber">{pos.leverage}x</Tag>}
                      <Tag tone={isOpen ? 'emerald' : 'slate'} soft>{isOpen ? 'OPEN' : 'CLOSED'}</Tag>
                    </div>

                    <div className="hidden sm:flex flex-col items-end text-xs text-slate-500 min-w-[80px]">
                      <span className="tabular-nums">${pos.entryPrice.toLocaleString()}</span>
                      <span className="tabular-nums">×{pos.quantity}</span>
                    </div>

                    <div className="flex flex-col items-end min-w-[84px]">
                      <span className={`font-semibold text-sm tabular-nums ${isGreen ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {fmt(pnl, true)}
                      </span>
                      <span className={`text-[11px] font-medium tabular-nums ${isGreen ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                        {pct(pnlPct)}
                      </span>
                    </div>
                    <motion.span className="text-slate-600 ml-1" animate={{ rotate: isExp ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={15} />
                    </motion.span>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExp && (
                      <motion.div key="d" initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
                        exit={{ height:0, opacity:0 }} transition={{ duration: 0.2 }} className="overflow-hidden"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="px-4 py-4 space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
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
                              <div key={label} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
                                <div className="text-slate-200 font-medium tabular-nums">{val}</div>
                              </div>
                            ))}
                          </div>
                          {pos.notes && (
                            <p className="text-xs text-slate-400 rounded-xl px-3 py-2.5 leading-relaxed" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                              {pos.notes}
                            </p>
                          )}
                          <div className="flex items-center gap-2 pt-0.5">
                            <ActionButton onClick={() => openForm(pos)} icon={Edit2}>Edit</ActionButton>
                            {isOpen && (
                              <ActionButton onClick={() => closePosition(pos.id)} icon={Target} tone="amber">Close Position</ActionButton>
                            )}
                            <ActionButton onClick={() => deletePosition(pos.id)} icon={Trash2} tone="rose" className="ml-auto">Delete</ActionButton>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Panel>
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
            <motion.div initial={{ scale:0.97, opacity:0, y: 8 }} animate={{ scale:1, opacity:1, y: 0 }}
              exit={{ scale:0.97, opacity:0 }} transition={{ duration:0.18 }}
              className="w-full max-w-lg rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
              style={{ background: 'rgba(10,13,24,0.98)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px -16px rgba(0,0,0,0.8)' }}
              onClick={e => e.stopPropagation()}>

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight text-slate-100">{editId ? 'Edit Position' : 'Add Position'}</h3>
                <button onClick={() => setShowForm(false)} className="grid place-items-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-200 transition-colors" style={{ background: 'rgba(255,255,255,0.04)' }}><X size={18}/></button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <FieldLabel>Symbol</FieldLabel>
                  <input value={form.symbol}
                    onChange={e => setForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))}
                    placeholder="e.g. BTC, AAPL, EURUSD, SPY"
                    className={inputCls}/>
                </div>

                <div>
                  <FieldLabel>Type</FieldLabel>
                  <ModalSegmented value={form.type} options={['spot','futures']}
                    onChange={t => setForm(f => ({ ...f, type: t as any, leverage: t==='spot' ? 1 : f.leverage, direction: t==='spot'?'long':f.direction }))} />
                </div>

                <div>
                  <FieldLabel>Direction</FieldLabel>
                  <ModalSegmented value={form.direction} options={['long','short']}
                    disabledOption={form.type === 'spot' ? 'short' : undefined}
                    tones={{ long: 'emerald', short: 'rose' }}
                    onChange={d => setForm(f => ({ ...f, direction: d as any }))} />
                </div>

                <div>
                  <FieldLabel>Category</FieldLabel>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className={inputCls}>
                    {['crypto','stocks','forex','commodities','etf','other'].map(c => (
                      <option key={c} value={c} className="bg-slate-900">{c.charAt(0).toUpperCase()+c.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>Status</FieldLabel>
                  <ModalSegmented value={form.status} options={['open','closed']}
                    onChange={s => setForm(f => ({ ...f, status: s as any }))} />
                </div>

                <div>
                  <FieldLabel>Entry Price ($)</FieldLabel>
                  <input type="number" min="0" step="any" value={form.entryPrice || ''}
                    onChange={e => setForm(f => ({ ...f, entryPrice: parseFloat(e.target.value) || 0 }))} className={inputCls}/>
                </div>

                <div>
                  <FieldLabel>Current Price ($)</FieldLabel>
                  <input type="number" min="0" step="any" value={form.currentPrice || ''}
                    onChange={e => setForm(f => ({ ...f, currentPrice: parseFloat(e.target.value) || 0 }))} className={inputCls}/>
                </div>

                <div>
                  <FieldLabel>Quantity</FieldLabel>
                  <input type="number" min="0" step="any" value={form.quantity || ''}
                    onChange={e => setForm(f => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))} className={inputCls}/>
                </div>

                {form.type === 'futures' && (
                  <div>
                    <FieldLabel>Leverage</FieldLabel>
                    <input type="number" min="1" max="125" step="1" value={form.leverage}
                      onChange={e => setForm(f => ({ ...f, leverage: parseInt(e.target.value) || 1 }))} className={inputCls}/>
                  </div>
                )}

                {form.status === 'closed' && (
                  <div>
                    <FieldLabel>Exit Price ($)</FieldLabel>
                    <input type="number" min="0" step="any" value={form.exitPrice || ''}
                      onChange={e => setForm(f => ({ ...f, exitPrice: parseFloat(e.target.value) || undefined }))} className={inputCls}/>
                  </div>
                )}

                <div>
                  <FieldLabel>Entry Date</FieldLabel>
                  <input type="date" value={form.entryDate}
                    onChange={e => setForm(f => ({ ...f, entryDate: e.target.value }))} className={inputCls}/>
                </div>

                <div className="col-span-2">
                  <FieldLabel>Notes</FieldLabel>
                  <textarea rows={2} value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Strategy thesis, target, stop..."
                    className={`${inputCls} resize-none`}/>
                </div>
              </div>

              {/* Live preview */}
              {form.entryPrice > 0 && form.currentPrice > 0 && form.quantity > 0 && (() => {
                const preview = calcPnL({ ...form, id: '' });
                const pp = calcPnLPct({ ...form, id: '' });
                const up = preview >= 0;
                return (
                  <div className="rounded-xl px-4 py-3 flex items-center justify-between"
                    style={{ background: up ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)', border: `1px solid ${up ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}` }}>
                    <span className={microLabel}>P&amp;L Preview</span>
                    <span className={`text-sm font-semibold tabular-nums ${up ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {fmt(preview, true)} <span className="opacity-70">({pp >= 0 ? '+' : ''}{pp.toFixed(1)}%)</span>
                    </span>
                  </div>
                );
              })()}

              <button onClick={submitForm}
                className="w-full py-3 rounded-xl font-semibold text-sm text-cyan-100 transition-all hover:brightness-110"
                style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.35)' }}>
                {editId ? 'Save Changes' : 'Add Position'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Local helpers ──────────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/40';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block mb-1.5 text-[10.5px] font-semibold text-slate-400 uppercase tracking-[0.12em]">{children}</label>;
}

const TONE_MAP: Record<string, string> = {
  cyan: '34,211,238', violet: '129,140,248', emerald: '52,211,153',
  rose: '248,113,113', amber: '245,158,11', slate: '148,163,184',
};

function Tag({ children, tone = 'slate', soft = false }: { children: React.ReactNode; tone?: keyof typeof TONE_MAP; soft?: boolean }) {
  const rgb = TONE_MAP[tone];
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
      style={{ background: `rgba(${rgb},${soft ? 0.1 : 0.14})`, color: `rgb(${rgb})`, border: `1px solid rgba(${rgb},0.22)` }}>
      {children}
    </span>
  );
}

function ActionButton({
  children, onClick, icon: Icon, tone = 'slate', className = '',
}: { children: React.ReactNode; onClick: () => void; icon: any; tone?: 'slate'|'amber'|'rose'; className?: string }) {
  const styles = {
    slate: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1' },
    amber: { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fcd34d' },
    rose:  { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#fca5a5' },
  }[tone];
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:brightness-110 ${className}`} style={styles}>
      <Icon size={12} /> {children}
    </button>
  );
}

function Segmented<T extends string>({
  value, onChange, options, labels = {},
}: { value: T; onChange: (v: T) => void; options: readonly T[]; labels?: Partial<Record<T, string>> }) {
  return (
    <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      {options.map(o => {
        const active = value === o;
        return (
          <button key={o} onClick={() => onChange(o)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${active ? 'text-cyan-200' : 'text-slate-500 hover:text-slate-300'}`}
            style={active ? { background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.28)' } : { border: '1px solid transparent' }}>
            {labels[o] ?? o}
          </button>
        );
      })}
    </div>
  );
}

function ModalSegmented({
  value, options, onChange, disabledOption, tones = {},
}: {
  value: string; options: string[]; onChange: (v: string) => void;
  disabledOption?: string; tones?: Record<string, keyof typeof TONE_MAP>;
}) {
  return (
    <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {options.map(o => {
        const active = value === o;
        const rgb = tones[o] ? TONE_MAP[tones[o]] : ACCENT;
        return (
          <button key={o} onClick={() => onChange(o)} disabled={disabledOption === o}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors disabled:opacity-30 ${active ? '' : 'text-slate-500'}`}
            style={active ? { background: `rgba(${rgb},0.14)`, color: `rgb(${rgb})`, border: `1px solid rgba(${rgb},0.3)` } : { border: '1px solid transparent' }}>
            {o}
          </button>
        );
      })}
    </div>
  );
}
