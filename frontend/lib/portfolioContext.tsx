'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

// ─── Types (shared) ───────────────────────────────────────────────────────────
export type TradeType   = 'spot' | 'futures';
export type TradeDir    = 'long' | 'short';
export type TradeStatus = 'open' | 'closed';

export interface Position {
  id: string;
  symbol: string;
  type: TradeType;
  direction: TradeDir;
  entryPrice: number;
  currentPrice: number;
  exitPrice?: number;
  quantity: number;
  leverage: number;
  entryDate: string;
  exitDate?: string;
  status: TradeStatus;
  notes: string;
  category: string;
}

// ─── P&L Helpers (shared) ────────────────────────────────────────────────────
export function calcPnL(pos: Position): number {
  const price = pos.status === 'closed' && pos.exitPrice != null ? pos.exitPrice : pos.currentPrice;
  const diff  = pos.direction === 'long' ? price - pos.entryPrice : pos.entryPrice - price;
  return diff * pos.quantity * (pos.type === 'futures' ? pos.leverage : 1);
}

export function calcPnLPct(pos: Position): number {
  const inv = pos.entryPrice * pos.quantity;
  return inv === 0 ? 0 : (calcPnL(pos) / inv) * 100;
}

export function posInvested(pos: Position)     { return pos.entryPrice  * pos.quantity; }
export function posCurrentValue(pos: Position) { return pos.currentPrice * pos.quantity; }

// ─── Computed Stats ────────────────────────────────────────────────────────────
export interface PortfolioStats {
  totalInvested:   number;
  totalCurrentVal: number;
  unrealizedPnL:   number;
  realizedPnL:     number;
  totalPnL:        number;
  totalReturnPct:  number;
  winRate:         number;
  openCount:       number;
  closedCount:     number;
  best:  Position | null;
  worst: Position | null;
}

export interface CategoryAlloc {
  category: string;
  invested: number;
  currentValue: number;
  pnl: number;
  count: number;
  pct: number;
}

export interface PerformancePoint {
  date: string;
  cumulativePnL: number;
  totalValue: number;
}

function computeStats(positions: Position[]): PortfolioStats {
  const open   = positions.filter(p => p.status === 'open');
  const closed = positions.filter(p => p.status === 'closed');

  const totalInvested   = open.reduce((s, p) => s + posInvested(p), 0);
  const totalCurrentVal = open.reduce((s, p) => s + posCurrentValue(p), 0);
  const unrealizedPnL   = open.reduce((s, p) => s + calcPnL(p), 0);
  const realizedPnL     = closed.reduce((s, p) => s + calcPnL(p), 0);
  const totalPnL        = unrealizedPnL + realizedPnL;
  const totalReturnPct  = totalInvested > 0 ? ((totalCurrentVal / totalInvested) - 1) * 100 : 0;

  const winners  = positions.filter(p => calcPnL(p) > 0);
  const winRate  = positions.length > 0 ? (winners.length / positions.length) * 100 : 0;

  const sorted = [...positions].sort((a, b) => calcPnL(b) - calcPnL(a));
  const best   = sorted.length > 0 ? sorted[0] : null;
  // only show worst when it is a different position than best
  const worst  = sorted.length >= 2 ? sorted[sorted.length - 1] : null;

  return {
    totalInvested, totalCurrentVal, unrealizedPnL, realizedPnL, totalPnL,
    totalReturnPct, winRate,
    openCount: open.length, closedCount: closed.length,
    best, worst,
  };
}

function computeAllocation(positions: Position[]): CategoryAlloc[] {
  const map: Record<string, CategoryAlloc> = {};
  const totalVal = positions.filter(p => p.status === 'open').reduce((s, p) => s + posCurrentValue(p), 0);

  positions.forEach(pos => {
    const cat = pos.category || 'other';
    if (!map[cat]) map[cat] = { category: cat, invested: 0, currentValue: 0, pnl: 0, count: 0, pct: 0 };
    map[cat].invested     += posInvested(pos);
    map[cat].currentValue += pos.status === 'open' ? posCurrentValue(pos) : 0;
    map[cat].pnl          += calcPnL(pos);
    map[cat].count        += 1;
    map[cat].pct           = totalVal > 0 ? (map[cat].currentValue / totalVal) * 100 : 0;
  });

  return Object.values(map).sort((a, b) => b.currentValue - a.currentValue);
}

function computePerformanceCurve(positions: Position[]): PerformancePoint[] {
  const sorted = [...positions].sort((a, b) =>
    new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

  let cum = 0;
  let totalVal = 0;
  return sorted.map(p => {
    cum      += calcPnL(p);
    totalVal += posCurrentValue(p);
    return { date: p.entryDate.slice(5), cumulativePnL: parseFloat(cum.toFixed(2)), totalValue: parseFloat(totalVal.toFixed(2)) };
  });
}

// ─── Context ──────────────────────────────────────────────────────────────────
const LS_KEY = 'tm_invest_positions';

interface PortfolioCtx {
  positions:   Position[];
  stats:       PortfolioStats;
  allocation:  CategoryAlloc[];
  performance: PerformancePoint[];
  addPosition:    (pos: Omit<Position, 'id'>) => void;
  updatePosition: (id: string, pos: Omit<Position, 'id'>) => void;
  deletePosition: (id: string) => void;
  closePosition:  (id: string) => void;
  isEmpty: boolean;
}

const defaultStats: PortfolioStats = {
  totalInvested: 0, totalCurrentVal: 0, unrealizedPnL: 0,
  realizedPnL: 0, totalPnL: 0, totalReturnPct: 0,
  winRate: 0, openCount: 0, closedCount: 0, best: null, worst: null,
};

const Ctx = createContext<PortfolioCtx>({
  positions: [], stats: defaultStats, allocation: [], performance: [],
  addPosition: () => {}, updatePosition: () => {}, deletePosition: () => {}, closePosition: () => {},
  isEmpty: true,
});

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setPositions(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = useCallback((ps: Position[]) => {
    setPositions(ps);
    localStorage.setItem(LS_KEY, JSON.stringify(ps));
  }, []);

  const addPosition    = useCallback((pos: Omit<Position, 'id'>) => persist([{ ...pos, id: Date.now().toString() }, ...positions]), [positions, persist]);
  const updatePosition = useCallback((id: string, pos: Omit<Position, 'id'>) => persist(positions.map(p => p.id === id ? { ...pos, id } : p)), [positions, persist]);
  const deletePosition = useCallback((id: string) => persist(positions.filter(p => p.id !== id)), [positions, persist]);
  const closePosition  = useCallback((id: string) => persist(positions.map(p =>
    p.id === id ? { ...p, status: 'closed', exitPrice: p.currentPrice, exitDate: new Date().toISOString().split('T')[0] } : p
  )), [positions, persist]);

  const stats       = useMemo(() => computeStats(positions),         [positions]);
  const allocation  = useMemo(() => computeAllocation(positions),    [positions]);
  const performance = useMemo(() => computePerformanceCurve(positions), [positions]);

  return (
    <Ctx.Provider value={{ positions, stats, allocation, performance, addPosition, updatePosition, deletePosition, closePosition, isEmpty: positions.length === 0 }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePortfolio() { return useContext(Ctx); }
