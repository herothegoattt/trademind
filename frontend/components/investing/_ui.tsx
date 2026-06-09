'use client';

/* ───────────────────────────────────────────────────────────────────────────
   Shared design primitives for the Investing section.
   One cohesive glass system, cyan accent + emerald/rose P&L semantics —
   aligned with the product's global tokens (--accent #22d3ee).
   ─────────────────────────────────────────────────────────────────────────── */

import { ReactNode, ElementType } from 'react';
import { motion } from 'framer-motion';

/* ── Color tokens (rgb triplets for rgba() composition) ──────────────────── */
export const ACCENT = '34,211,238';   // cyan
export const GAIN   = '52,211,153';   // emerald
export const LOSS   = '248,113,113';  // rose
export const NEUTRAL = '148,163,184'; // slate

/* Category palette — desaturated, professional (no neon orange) */
export const CAT_RGB: Record<string, string> = {
  crypto:      '245,158,11',  // amber
  stocks:      '34,211,238',  // cyan
  forex:       '129,140,248', // indigo
  commodities: '212,168,83',  // muted gold
  etf:         '52,211,153',  // emerald
  other:       '148,163,184', // slate
};

/* Surfaces */
export const SURFACE = 'linear-gradient(180deg, rgba(255,255,255,0.026), rgba(255,255,255,0.006)), rgba(8,11,20,0.55)';
export const HAIRLINE = 'rgba(255,255,255,0.07)';

/* Shared className fragments */
export const microLabel = 'text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-500';
export const numeric = 'tabular-nums';

/* Recharts tooltip — consistent across every chart */
export const tooltipStyle = {
  background: 'rgba(8,11,20,0.96)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  fontSize: 12,
  padding: '8px 12px',
} as const;

/* ── Panel: the canonical glass surface ──────────────────────────────────── */
export function Panel({
  children, className = '', accent, glow = false, hover = false, onClick,
}: {
  children: ReactNode; className?: string; accent?: string;
  glow?: boolean; hover?: boolean; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl overflow-hidden ${hover ? 'transition-all duration-200 hover:-translate-y-px' : ''} ${className}`}
      style={{
        background: SURFACE,
        border: `1px solid ${accent ? `rgba(${accent},0.18)` : HAIRLINE}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 32px -16px rgba(0,0,0,0.6)',
      }}
    >
      {glow && accent && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ background: `radial-gradient(120% 90% at 100% 0%, rgb(${accent}), transparent 60%)` }}
        />
      )}
      {children}
    </div>
  );
}

/* ── Section header: icon chip + title + optional right slot ──────────────── */
export function SectionHeader({
  icon: Icon, title, subtitle, accent = ACCENT, right,
}: {
  icon: ElementType; title: string; subtitle?: string; accent?: string; right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3">
        <div
          className="grid place-items-center w-9 h-9 rounded-xl flex-shrink-0"
          style={{ background: `rgba(${accent},0.1)`, border: `1px solid rgba(${accent},0.22)` }}
        >
          <Icon size={17} style={{ color: `rgb(${accent})` }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-100 tracking-tight leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

/* ── Stat tile: premium metric card ──────────────────────────────────────── */
export function StatTile({
  label, value, delta, deltaTone, icon: Icon, accent = ACCENT, valueClass, index = 0,
}: {
  label: string; value: string; delta?: string;
  deltaTone?: 'gain' | 'loss' | 'muted';
  icon: ElementType; accent?: string; valueClass?: string; index?: number;
}) {
  const deltaColor =
    deltaTone === 'gain' ? 'text-emerald-400'
    : deltaTone === 'loss' ? 'text-rose-400'
    : 'text-slate-500';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: 'easeOut' }}
    >
      <Panel hover className="p-4 sm:p-5 h-full">
        <div className="flex items-start justify-between gap-2">
          <span className={microLabel}>{label}</span>
          <div
            className="grid place-items-center w-7 h-7 rounded-lg flex-shrink-0"
            style={{ background: `rgba(${accent},0.1)`, border: `1px solid rgba(${accent},0.18)` }}
          >
            <Icon size={13} style={{ color: `rgb(${accent})` }} />
          </div>
        </div>
        <p className={`mt-3 text-[26px] leading-none font-semibold tracking-tight tabular-nums ${valueClass ?? 'text-slate-100'}`}>
          {value}
        </p>
        {delta && <p className={`mt-2 text-xs font-medium tabular-nums ${deltaColor}`}>{delta}</p>}
      </Panel>
    </motion.div>
  );
}

/* ── Empty state: iconography, never emoji ───────────────────────────────── */
export function EmptyState({
  icon: Icon, title, children, action, accent = ACCENT,
}: {
  icon: ElementType; title: string; children?: ReactNode; action?: ReactNode; accent?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="grid place-items-center w-16 h-16 rounded-2xl mb-5"
        style={{ background: `rgba(${accent},0.08)`, border: `1px solid rgba(${accent},0.2)` }}
      >
        <Icon size={28} style={{ color: `rgb(${accent})` }} />
      </div>
      <h3 className="text-lg font-semibold text-slate-200 mb-2 tracking-tight">{title}</h3>
      {children && <div className="text-slate-400 text-sm max-w-sm leading-relaxed">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ── Primary / ghost buttons ─────────────────────────────────────────────── */
export function PrimaryButton({
  children, onClick, className = '', type = 'button', disabled,
}: {
  children: ReactNode; onClick?: () => void; className?: string;
  type?: 'button' | 'submit'; disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-cyan-200 transition-all hover:text-cyan-100 disabled:opacity-40 ${className}`}
      style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)' }}
    >
      {children}
    </button>
  );
}

/* ── P&L delta chip ──────────────────────────────────────────────────────── */
export function DeltaChip({ value, suffix = '%', size = 'sm' }: { value: number; suffix?: string; size?: 'sm' | 'xs' }) {
  const up = value >= 0;
  const rgb = up ? GAIN : LOSS;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold tabular-nums ${size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'}`}
      style={{ background: `rgba(${rgb},0.12)`, color: `rgb(${rgb})`, border: `1px solid rgba(${rgb},0.25)` }}
    >
      {up ? '+' : ''}{value.toFixed(1)}{suffix}
    </span>
  );
}
