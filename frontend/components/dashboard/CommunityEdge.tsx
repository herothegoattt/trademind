"use client";
import { useState, useRef } from "react";
import {
  Heart, MessageCircle, TrendingUp, Plus, X, Image as ImageIcon,
  Crown, Medal, Flame, Send, Hash, Lock,
  Lightbulb, MessagesSquare, ArrowUp, Sparkles, Users, Zap, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "../../lib/i18n";
import { usePlanLimits } from "../../lib/plan-limits";
import { SubscriptionModal } from "./SubscriptionModal";
import { useAuthStore } from "../../lib/auth-store";
import type { Plan } from "../../lib/auth-store";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  likes: number;
  likedByMe: boolean;
  created_at: number;
}

interface Post {
  id: string;
  type: "idea" | "discussion";
  title: string;
  author: string;
  avatar: string;
  body: string;
  image?: string;
  likes: number;
  likedByMe: boolean;
  comments: Comment[];
  tag: string;
  created_at: number;
}

// ─── Mock seed data ──────────────────────────────────────────────────────────

const SEED: Post[] = [
  {
    id: "i1", type: "idea",
    title: "EURUSD pullback long — структурная поддержка",
    author: "trader_ivan", avatar: "IV",
    body: "Покупка на откат к 1.0850, стоп ниже 1.0820, цель 1.0950. Дневной тренд восходящий, ищу вход на M15 по паттерну OB + FVG.",
    image: "",
    likes: 24, likedByMe: false,
    comments: [
      { id: "c1", author: "anna_trades", avatar: "AT", text: "Отличный RR! Стоп логичный, поддержу идею.", likes: 8, likedByMe: false, created_at: Date.now() - 3600000 },
      { id: "c2", author: "mark42", avatar: "MK", text: "Следите за ликвидностью на 1.09, там сильное сопротивление.", likes: 5, likedByMe: false, created_at: Date.now() - 7200000 },
      { id: "c3", author: "quant_maria", avatar: "QM", text: "COT данные подтверждают, крупные лонгуют с прошлой недели.", likes: 12, likedByMe: false, created_at: Date.now() - 1800000 },
    ],
    tag: "Momentum + SMC", created_at: Date.now() - 172800000,
  },
  {
    id: "i2", type: "idea",
    title: "BTC пробой 72k — краткосрочный шорт",
    author: "crypto_alex", avatar: "CA",
    body: "После пробоя 72k жду ретест снизу вверх и вход в шорт с целью 68k. Объёмы падают при росте — медвежья дивергенция на RSI(14).",
    image: "",
    likes: 18, likedByMe: false,
    comments: [
      { id: "c4", author: "hodl_king", avatar: "HK", text: "Рискованно, но идея разумная. Ставь стоп выше 73.5.", likes: 6, likedByMe: false, created_at: Date.now() - 5400000 },
    ],
    tag: "Reversal + Volume", created_at: Date.now() - 86400000,
  },
  {
    id: "d1", type: "discussion",
    title: "Как вы управляете эмоциями во время просадки?",
    author: "mindset_pro", avatar: "MP",
    body: "После серии из 4 стоп-аутов подряд я заметил, что начинаю нарушать свои правила входа. Как вы справляетесь с психологией в такие периоды?",
    image: undefined,
    likes: 31, likedByMe: false,
    comments: [
      { id: "c5", author: "anna_trades", avatar: "AT", text: "Делаю паузу на 24 часа после 3 стопов подряд. Правило спасло мне депозит дважды.", likes: 15, likedByMe: false, created_at: Date.now() - 2700000 },
      { id: "c6", author: "trader_ivan", avatar: "IV", text: "Веду дневник сделок. Возвращаюсь к записям из прибыльных месяцев — это перезагружает мышление.", likes: 9, likedByMe: false, created_at: Date.now() - 9000000 },
      { id: "c7", author: "risk_master", avatar: "RM", text: "Уменьшаю размер позиции вдвое на время просадки, пока не вернётся уверенность.", likes: 7, likedByMe: false, created_at: Date.now() - 3600000 },
    ],
    tag: "Psychology", created_at: Date.now() - 43200000,
  },
  {
    id: "d2", type: "discussion",
    title: "Scalping vs Swing — что эффективнее в 2024?",
    author: "quant_maria", avatar: "QM",
    body: "Провела бэктест на EURUSD за 2023-2024. Scalping (1-5m) показал win rate 62% но R:R 1:1. Swing (H4-D1) — 44% WR с R:R 1:3. Делитесь своей статистикой!",
    image: undefined,
    likes: 42, likedByMe: false,
    comments: [
      { id: "c8", author: "mark42", avatar: "MK", text: "Swing определённо даёт лучший результат при учёте комиссий и свопов.", likes: 18, likedByMe: false, created_at: Date.now() - 1200000 },
      { id: "c9", author: "crypto_alex", avatar: "CA", text: "На крипте scalping работает лучше из-за высокой волатильности.", likes: 11, likedByMe: false, created_at: Date.now() - 7200000 },
    ],
    tag: "Strategy", created_at: Date.now() - 21600000,
  },
  {
    id: "i3", type: "idea",
    title: "Gold — покупка от 2280 зоны",
    author: "anna_trades", avatar: "AT",
    body: "Зона 2280-2295 — сильная структурная поддержка. ФРС сигналит о паузе в повышении ставок. Долгосрочный лонг с целью 2450.",
    image: "",
    likes: 15, likedByMe: false,
    comments: [
      { id: "c10", author: "risk_master", avatar: "RM", text: "Согласен с зоной, но новости по инфляции могут поломать сетап.", likes: 4, likedByMe: false, created_at: Date.now() - 4500000 },
    ],
    tag: "Macro + Structure", created_at: Date.now() - 259200000,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useTimeAgo() {
  const t = useT();
  return (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return t("ce_just_now");
    if (diff < 3600000) return `${Math.floor(diff / 60000)} ${t("ce_min_ago")}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ${t("ce_h_ago")}`;
    return `${Math.floor(diff / 86400000)} ${t("ce_d_ago")}`;
  };
}

const AVATAR_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  IV: { bg: "rgba(34,211,238,0.12)", border: "rgba(34,211,238,0.45)", text: "#22d3ee", glow: "rgba(34,211,238,0.3)" },
  AT: { bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.45)", text: "#a78bfa", glow: "rgba(167,139,250,0.3)" },
  MK: { bg: "rgba(244,114,182,0.12)", border: "rgba(244,114,182,0.45)", text: "#f472b6", glow: "rgba(244,114,182,0.3)" },
  QM: { bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.45)", text: "#34d399", glow: "rgba(52,211,153,0.3)" },
  CA: { bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.45)", text: "#fb923c", glow: "rgba(251,146,60,0.3)" },
  HK: { bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.45)", text: "#fbbf24", glow: "rgba(251,191,36,0.3)" },
  MP: { bg: "rgba(232,121,249,0.12)", border: "rgba(232,121,249,0.45)", text: "#e879f9", glow: "rgba(232,121,249,0.3)" },
  RM: { bg: "rgba(56,189,248,0.12)", border: "rgba(56,189,248,0.45)", text: "#38bdf8", glow: "rgba(56,189,248,0.3)" },
  HO: { bg: "rgba(34,211,238,0.12)", border: "rgba(34,211,238,0.45)", text: "#22d3ee", glow: "rgba(34,211,238,0.3)" },
};
const DEFAULT_AVATAR = { bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.45)", text: "#a78bfa", glow: "rgba(167,139,250,0.3)" };

function Avatar({ initials, size = 32 }: { initials: string; size?: number }) {
  const c = AVATAR_COLORS[initials] || DEFAULT_AVATAR;
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0 select-none"
      style={{
        width: size, height: size,
        background: c.bg,
        border: `1.5px solid ${c.border}`,
        color: c.text,
        boxShadow: `0 0 10px ${c.glow}`,
        fontSize: size < 30 ? "10px" : "12px",
      }}
    >
      {initials}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
      style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)" }}>
      <Crown size={11} className="text-yellow-400" style={{ filter: "drop-shadow(0 0 4px rgba(251,191,36,0.9))" }} />
    </div>
  );
  if (rank === 2) return (
    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
      style={{ background: "rgba(148,163,184,0.15)", border: "1px solid rgba(148,163,184,0.4)" }}>
      <Medal size={11} className="text-slate-300" style={{ filter: "drop-shadow(0 0 4px rgba(203,213,225,0.7))" }} />
    </div>
  );
  if (rank === 3) return (
    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
      style={{ background: "rgba(251,146,60,0.15)", border: "1px solid rgba(251,146,60,0.4)" }}>
      <Medal size={11} className="text-orange-400" style={{ filter: "drop-shadow(0 0 4px rgba(251,146,60,0.8))" }} />
    </div>
  );
  return (
    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <span className="text-[10px] text-gray-500 font-mono">{rank}</span>
    </div>
  );
}

function LikeButton({
  count, liked, onLike, small = false,
}: { count: number; liked: boolean; onLike: () => void; small?: boolean }) {
  return (
    <motion.button
      onClick={(e) => { e.stopPropagation(); onLike(); }}
      whileTap={{ scale: 0.82 }}
      whileHover={{ scale: 1.05 }}
      className={`flex items-center gap-1.5 rounded-lg transition-all ${
        small ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs font-semibold"
      } ${
        liked
          ? "bg-pink-500/15 text-pink-400"
          : "text-gray-500 hover:text-pink-400"
      }`}
      style={{
        border: liked ? "1px solid rgba(236,72,153,0.4)" : "1px solid rgba(255,255,255,0.08)",
        boxShadow: liked ? "0 0 12px rgba(236,72,153,0.2)" : "none",
        background: liked ? "rgba(236,72,153,0.1)" : "rgba(255,255,255,0.04)",
      }}
    >
      <Heart
        size={small ? 10 : 12}
        className={liked ? "fill-pink-400" : ""}
        style={liked ? { filter: "drop-shadow(0 0 3px rgba(236,72,153,0.8))" } : {}}
      />
      <span>{count}</span>
    </motion.button>
  );
}

// ─── Comment item ─────────────────────────────────────────────────────────────

const RANK_ACCENT: Record<number, { border: string; bg: string; label: string; labelColor: string }> = {
  1: { border: "rgba(251,191,36,0.5)",  bg: "rgba(251,191,36,0.06)",  label: "#1", labelColor: "#fbbf24" },
  2: { border: "rgba(148,163,184,0.4)", bg: "rgba(148,163,184,0.04)", label: "#2", labelColor: "#94a3b8" },
  3: { border: "rgba(251,146,60,0.45)", bg: "rgba(251,146,60,0.05)",  label: "#3", labelColor: "#fb923c" },
};

function CommentItem({ comment, rank, onLike }: { comment: Comment; rank: number; onLike: () => void }) {
  const timeAgo = useTimeAgo();
  const c = AVATAR_COLORS[comment.avatar] || DEFAULT_AVATAR;
  const ra = RANK_ACCENT[rank];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="relative rounded-xl overflow-hidden group"
      style={{
        background: ra ? ra.bg : "rgba(255,255,255,0.02)",
        border: `1px solid ${ra ? ra.border : "rgba(255,255,255,0.05)"}`,
      }}
    >
      {/* Rank left stripe */}
      {ra && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
          style={{ background: `linear-gradient(180deg, ${ra.border} 0%, transparent 100%)` }}
        />
      )}

      <div className="px-4 py-3 pl-5">
        {/* Author row */}
        <div className="flex items-center gap-2 mb-2">
          <Avatar initials={comment.avatar} size={24} />
          <span className="text-xs font-bold leading-none" style={{ color: c.text }}>
            {comment.author}
          </span>
          {ra && (
            <span
              className="text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none"
              style={{ background: `${ra.border}30`, color: ra.labelColor, border: `1px solid ${ra.border}` }}
            >
              {ra.label}
            </span>
          )}
          <span className="text-[10px] text-gray-600 ml-auto tabular-nums">
            {timeAgo(comment.created_at)}
          </span>
        </div>

        {/* Text — main readable content */}
        <p className="text-[13px] text-gray-200 leading-[1.6] mb-3 pl-[32px]">
          {comment.text}
        </p>

        {/* Footer */}
        <div className="pl-[32px] flex items-center gap-2">
          <motion.button
            onClick={(e) => { e.stopPropagation(); onLike(); }}
            whileTap={{ scale: 0.85 }}
            className="flex items-center gap-1.5 text-[11px] font-semibold transition-all px-2.5 py-1 rounded-lg"
            style={{
              background: comment.likedByMe ? "rgba(236,72,153,0.12)" : "rgba(255,255,255,0.04)",
              border: comment.likedByMe ? "1px solid rgba(236,72,153,0.35)" : "1px solid rgba(255,255,255,0.06)",
              color: comment.likedByMe ? "#f472b6" : "#6b7280",
            }}
          >
            <Heart
              size={10}
              className={comment.likedByMe ? "fill-pink-400" : ""}
              style={comment.likedByMe ? { filter: "drop-shadow(0 0 3px rgba(236,72,153,0.7))" } : {}}
            />
            <span>{comment.likes}</span>
          </motion.button>
          <span className="text-[10px] text-gray-700 group-hover:text-gray-600 transition-colors">
            helpful?
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post, rank, onLike, onOpen }: { post: Post; rank: number; onLike: () => void; onOpen: () => void }) {
  const t = useT();
  const timeAgo = useTimeAgo();
  const isIdea = post.type === "idea";
  const accent = isIdea ? "#22d3ee" : "#a78bfa";
  const isTop = rank <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onOpen}
      className="relative rounded-2xl cursor-pointer overflow-hidden group"
      style={{
        background: "linear-gradient(145deg, rgba(8,10,28,0.95) 0%, rgba(4,6,18,0.98) 100%)",
        border: `1px solid ${isTop ? accent + "40" : "rgba(255,255,255,0.07)"}`,
        boxShadow: isTop
          ? `0 4px 24px ${accent}10, 0 1px 0 ${accent}20 inset`
          : "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1.5px]"
        style={{
          background: isTop
            ? `linear-gradient(90deg, transparent 0%, ${accent}90 40%, ${accent}90 60%, transparent 100%)`
            : `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)`,
        }}
      />

      {/* Type indicator stripe */}
      <div
        className="absolute top-0 left-0 w-[3px] h-full rounded-l-2xl"
        style={{ background: `linear-gradient(180deg, ${accent}80 0%, ${accent}20 100%)` }}
      />

      <div className="p-5 pl-6">
        {/* Author row */}
        <div className="flex items-center gap-2.5 mb-3">
          <Avatar initials={post.avatar} size={32} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold" style={{ color: accent }}>@{post.author}</span>
              <span className="text-[10px] text-gray-600">{timeAgo(post.created_at)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <RankBadge rank={rank} />
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium hidden sm:inline-flex"
              style={{ background: `${accent}12`, color: accent, border: `1px solid ${accent}25` }}
            >
              {post.tag}
            </span>
          </div>
        </div>

        {/* Title */}
        <h4
          className="text-sm font-bold text-white leading-snug mb-2 line-clamp-2 group-hover:opacity-90 transition-opacity"
          style={{ textShadow: `0 0 20px ${accent}15` }}
        >
          {post.title}
        </h4>

        {/* Body */}
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">{post.body}</p>

        {/* Tag mobile */}
        <div className="sm:hidden mb-3">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: `${accent}12`, color: accent, border: `1px solid ${accent}25` }}
          >
            {post.tag}
          </span>
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-2 pt-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <LikeButton count={post.likes} liked={post.likedByMe} onLike={onLike} />
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg text-gray-500 hover:text-purple-400 transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <MessageCircle size={11} />
            <span>{post.comments.length}</span>
          </button>

          <div className="ml-auto flex items-center gap-2">
            {post.likes >= 20 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 text-[10px] font-bold text-orange-400 px-2 py-0.5 rounded-full"
                style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.25)" }}
              >
                <Flame size={9} style={{ filter: "drop-shadow(0 0 4px rgba(251,146,60,0.8))" }} />
                {t("ce_hot")}
              </motion.div>
            )}
            <div
              className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-gray-600"
            >
              <ChevronRight size={12} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Post detail modal ────────────────────────────────────────────────────────

function PostModal({ post, onClose, onLikePost, onLikeComment, onAddComment }: {
  post: Post;
  onClose: () => void;
  onLikePost: () => void;
  onLikeComment: (cId: string) => void;
  onAddComment: (text: string) => void;
}) {
  const t = useT();
  const timeAgo = useTimeAgo();
  const [text, setText] = useState("");
  const sortedComments = [...post.comments].sort((a, b) => b.likes - a.likes);
  const isIdea = post.type === "idea";
  const accent = isIdea ? "#22d3ee" : "#a78bfa";
  const TypeIcon = isIdea ? Lightbulb : MessagesSquare;

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAddComment(trimmed);
    setText("");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, rgba(8,10,28,0.99) 0%, rgba(4,6,20,0.99) 100%)",
          border: `1px solid ${accent}35`,
          boxShadow: `0 0 60px ${accent}12, 0 30px 60px rgba(0,0,0,0.7)`,
        }}
      >
        {/* Top accent */}
        <div className="h-[2px] w-full shrink-0" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-2 pb-0 sm:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/10" />
        </div>

        {/* Header */}
        <div
          className="px-5 pt-4 pb-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-start gap-3">
            <div
              className="p-2 rounded-xl shrink-0"
              style={{ background: `${accent}12`, border: `1px solid ${accent}25` }}
            >
              <TypeIcon size={16} style={{ color: accent }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Avatar initials={post.avatar} size={22} />
                <span className="text-xs font-bold" style={{ color: accent }}>@{post.author}</span>
                <span className="text-[10px] text-gray-600">{timeAgo(post.created_at)}</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: `${accent}12`, color: accent, border: `1px solid ${accent}22` }}
                >
                  {post.tag}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white leading-snug">{post.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-600 hover:text-white hover:bg-white/8 transition-all shrink-0"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: "thin", scrollbarColor: `${accent}25 transparent` }}>

          {/* Post body */}
          <div className="px-5 pt-4 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div
              className="rounded-xl p-4 text-[13px] text-gray-200 leading-[1.7]"
              style={{ background: `${accent}06`, border: `1px solid ${accent}14` }}
            >
              {post.body}
            </div>

            {post.image && (
              <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
                <img src={post.image} alt="" className="w-full max-h-56 object-contain" style={{ background: "#000" }} />
              </div>
            )}

            {/* Like row */}
            <div className="flex items-center gap-3 mt-3">
              <LikeButton count={post.likes} liked={post.likedByMe} onLike={onLikePost} />
              <span className="text-[11px] text-gray-600 flex items-center gap-1">
                <MessageCircle size={11} />
                {post.comments.length} {t("ce_comments")}
              </span>
            </div>
          </div>

          {/* Comments section */}
          <div>
            {/* Sticky comments header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-5 py-2.5"
              style={{
                background: "rgba(4,6,18,0.97)",
                backdropFilter: "blur(12px)",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div className="flex items-center gap-2">
                <MessageCircle size={12} style={{ color: accent }} />
                <span className="text-xs font-bold text-white">
                  {t("ce_comments")}
                  <span className="ml-1.5 text-[10px] font-normal text-gray-600">
                    ({sortedComments.length})
                  </span>
                </span>
              </div>
              {sortedComments.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-gray-600">
                  <ArrowUp size={9} className="text-pink-500" />
                  {t("ce_top_by_likes")}
                </div>
              )}
            </div>

            {/* Comment list */}
            <div className="px-5 py-3 space-y-2 pb-4">
              {sortedComments.length === 0 ? (
                <div className="text-center py-10 flex flex-col items-center gap-2">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <MessageCircle size={20} className="text-gray-700" />
                  </div>
                  <p className="text-gray-600 text-sm">{t("ce_be_first")}</p>
                </div>
              ) : (
                sortedComments.map((c, i) => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    rank={i + 1}
                    onLike={() => onLikeComment(c.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Comment input */}
        <div
          className="px-5 py-4 shrink-0"
          style={{ borderTop: `1px solid ${accent}15`, background: "rgba(4,6,18,0.9)" }}
        >
          <div className="flex gap-2 items-center">
            <div className="flex-1 relative">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
                placeholder={t("ce_comment_ph")}
                className="w-full px-4 py-2.5 pr-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${text ? accent + "45" : "rgba(255,255,255,0.07)"}`,
                  boxShadow: text ? `0 0 0 1px ${accent}15` : "none",
                }}
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={submit}
              disabled={!text.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
              style={{
                background: text.trim() ? `${accent}20` : "rgba(255,255,255,0.05)",
                border: `1px solid ${text.trim() ? accent + "45" : "rgba(255,255,255,0.07)"}`,
                color: text.trim() ? accent : "#4b5563",
                boxShadow: text.trim() ? `0 0 12px ${accent}20` : "none",
              }}
            >
              <Send size={15} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── New post form ─────────────────────────────────────────────────────────────

function NewPostForm({ type, onClose, onSubmit }: {
  type: "idea" | "discussion";
  onClose: () => void;
  onSubmit: (p: Omit<Post, "id" | "likes" | "likedByMe" | "comments" | "created_at">) => void;
}) {
  const t = useT();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("");
  const [image, setImage] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const isIdea = type === "idea";
  const accent = isIdea ? "#22d3ee" : "#a78bfa";
  const TypeIcon = isIdea ? Lightbulb : MessagesSquare;

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!title.trim() || !body.trim()) return;
    onSubmit({
      type,
      title: title.trim(),
      body: body.trim(),
      tag: tag.trim() || (isIdea ? "Idea" : "Discussion"),
      author: "you",
      avatar: "HO",
      image: isIdea ? image : undefined,
    });
    onClose();
  };

  const fieldStyle = (hasValue: boolean) => ({
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${hasValue ? accent + "45" : "rgba(255,255,255,0.07)"}`,
    outline: "none",
    transition: "border-color 0.2s",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
    >
      <div
        className="rounded-2xl p-5 mb-5"
        style={{
          background: "linear-gradient(145deg, rgba(8,10,28,0.97) 0%, rgba(4,6,18,0.98) 100%)",
          border: `1px solid ${accent}30`,
          boxShadow: `0 0 30px ${accent}08, 0 8px 32px rgba(0,0,0,0.4)`,
        }}
      >
        {/* Form header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `${accent}15`, border: `1px solid ${accent}35` }}
            >
              <TypeIcon size={15} style={{ color: accent }} />
            </div>
            <div>
              <span className="font-bold text-white text-sm block">
                {isIdea ? t("new_idea") : t("ce_new_discussion")}
              </span>
              <span className="text-[10px] text-gray-600">
                {isIdea ? "Share your trade setup" : "Start a conversation"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/8 transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("ce_title_ph")}
            className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600"
            style={fieldStyle(!!title)}
          />

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={isIdea ? t("ce_idea_ph") : t("ce_disc_ph")}
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 resize-none"
            style={fieldStyle(!!body)}
          />

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder={isIdea ? t("ce_idea_tag_ph") : t("ce_disc_tag_ph")}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600"
                style={fieldStyle(!!tag)}
              />
            </div>

            {isIdea && (
              <button
                onClick={() => fileRef.current?.click()}
                className="px-3 py-2.5 rounded-xl text-xs text-gray-500 hover:text-cyan-400 transition-all flex items-center gap-1.5 shrink-0"
                style={{
                  background: image ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.04)",
                  border: image ? "1px solid rgba(34,211,238,0.35)" : "1px solid rgba(255,255,255,0.07)",
                  color: image ? "#22d3ee" : undefined,
                }}
              >
                <ImageIcon size={13} />
                {image ? "1 img" : t("ce_attach_img")}
              </button>
            )}
          </div>

          {image && (
            <div className="relative rounded-xl overflow-hidden border border-white/10 group">
              <img src={image} alt="" className="w-full h-32 object-cover" />
              <button
                onClick={() => setImage("")}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={11} /> {t("ce_remove_img")}
              </button>
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            onClick={submit}
            disabled={!title.trim() || !body.trim()}
            className="w-full py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-25"
            style={{
              background: `linear-gradient(135deg, ${accent}25 0%, ${accent}12 100%)`,
              border: `1px solid ${accent}45`,
              color: accent,
              boxShadow: `0 0 20px ${accent}12`,
            }}
          >
            {t("ce_publish")}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

function Leaderboard({ posts }: { posts: Post[] }) {
  const t = useT();
  const top3 = [...posts].sort((a, b) => b.likes - a.likes).slice(0, 3);
  const podium = [
    { color: "#fbbf24", glow: "rgba(251,191,36,0.5)", icon: <Crown size={12} />, label: "1st" },
    { color: "#94a3b8", glow: "rgba(148,163,184,0.4)", icon: <Medal size={12} />, label: "2nd" },
    { color: "#fb923c", glow: "rgba(251,146,60,0.5)", icon: <Medal size={12} />, label: "3rd" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl overflow-hidden mb-5"
      style={{
        background: "linear-gradient(145deg, rgba(8,10,28,0.97) 0%, rgba(4,6,18,0.98) 100%)",
        border: "1px solid rgba(251,191,36,0.18)",
        boxShadow: "0 0 40px rgba(251,191,36,0.05)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center gap-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(251,191,36,0.04)" }}
      >
        <Sparkles size={13} className="text-yellow-400" style={{ filter: "drop-shadow(0 0 6px rgba(251,191,36,0.8))" }} />
        <span className="text-xs font-bold text-yellow-400 tracking-wide uppercase">{t("ce_top_label")}</span>
        <div className="flex-1" />
        <span className="text-[10px] text-gray-600 uppercase tracking-wider">{t("ce_by_likes")}</span>
      </div>

      {/* Entries */}
      <div className="p-4 space-y-2">
        {top3.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.07 }}
            className="flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-white/[0.025]"
            style={{ cursor: "default" }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: `${podium[i].color}15`,
                border: `1px solid ${podium[i].color}35`,
                color: podium[i].color,
                boxShadow: `0 0 8px ${podium[i].glow}`,
              }}
            >
              {podium[i].icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-200 truncate">{p.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Avatar initials={p.avatar} size={14} />
                <span className="text-[10px] text-gray-600">@{p.author}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    background: p.type === "idea" ? "rgba(34,211,238,0.08)" : "rgba(167,139,250,0.08)",
                    color: p.type === "idea" ? "#22d3ee" : "#a78bfa",
                  }}
                >
                  {p.type}
                </span>
              </div>
            </div>
            <div
              className="flex items-center gap-1 text-xs font-bold shrink-0 px-2 py-1 rounded-lg"
              style={{ background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.2)", color: "#f472b6" }}
            >
              <Heart size={9} className="fill-pink-400" />
              {p.likes}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Community stats bar ──────────────────────────────────────────────────────

function StatsBar({ posts }: { posts: Post[] }) {
  const totalLikes = posts.reduce((s, p) => s + p.likes, 0);
  const totalComments = posts.reduce((s, p) => s + p.comments.length, 0);
  const stats = [
    { icon: <Users size={12} />, value: "847", label: "Members", color: "#22d3ee" },
    { icon: <Lightbulb size={12} />, value: posts.filter(p => p.type === "idea").length.toString(), label: "Ideas", color: "#22d3ee" },
    { icon: <MessagesSquare size={12} />, value: posts.filter(p => p.type === "discussion").length.toString(), label: "Discussions", color: "#a78bfa" },
    { icon: <Heart size={12} />, value: totalLikes.toString(), label: "Likes", color: "#f472b6" },
    { icon: <MessageCircle size={12} />, value: totalComments.toString(), label: "Comments", color: "#34d399" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 overflow-x-auto pb-1 mb-5 no-scrollbar"
    >
      {stats.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 * i }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0"
          style={{
            background: `${s.color}08`,
            border: `1px solid ${s.color}18`,
          }}
        >
          <span style={{ color: s.color }}>{s.icon}</span>
          <div>
            <div className="text-xs font-bold text-white leading-none">{s.value}</div>
            <div className="text-[9px] text-gray-600 leading-none mt-0.5">{s.label}</div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function CommunityEdge() {
  const t = useT();
  const limits = usePlanLimits();
  const user = useAuthStore((s) => s.user);
  const currentPlan = (user?.plan as Plan) || "core";
  const [subOpen, setSubOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>(SEED);
  const [tab, setTab] = useState<"ideas" | "discussions">("ideas");
  const [showForm, setShowForm] = useState(false);
  const [openPost, setOpenPost] = useState<string | null>(null);

  const ideas = [...posts.filter((p) => p.type === "idea")].sort((a, b) => b.likes - a.likes);
  const discussions = [...posts.filter((p) => p.type === "discussion")].sort((a, b) => b.likes - a.likes);
  const allSorted = [...posts].sort((a, b) => b.likes - a.likes);
  const rankOf = (id: string) => allSorted.findIndex((p) => p.id === id) + 1;

  const likePost = (id: string) => {
    setPosts((ps) =>
      ps.map((p) =>
        p.id === id
          ? { ...p, likes: p.likedByMe ? p.likes - 1 : p.likes + 1, likedByMe: !p.likedByMe }
          : p
      )
    );
  };

  const likeComment = (postId: string, commentId: string) => {
    setPosts((ps) =>
      ps.map((p) =>
        p.id !== postId ? p : {
          ...p,
          comments: p.comments.map((c) =>
            c.id !== commentId ? c : { ...c, likes: c.likedByMe ? c.likes - 1 : c.likes + 1, likedByMe: !c.likedByMe }
          ),
        }
      )
    );
  };

  const addComment = (postId: string, text: string) => {
    setPosts((ps) =>
      ps.map((p) =>
        p.id !== postId ? p : {
          ...p,
          comments: [
            ...p.comments,
            { id: `c${Date.now()}`, author: "you", avatar: "HO", text, likes: 0, likedByMe: false, created_at: Date.now() },
          ],
        }
      )
    );
  };

  const addPost = (data: Omit<Post, "id" | "likes" | "likedByMe" | "comments" | "created_at">) => {
    const newPost: Post = { ...data, id: `post-${Date.now()}`, likes: 0, likedByMe: false, comments: [], created_at: Date.now() };
    setPosts((ps) => [newPost, ...ps]);
  };

  const openPostData = posts.find((p) => p.id === openPost);
  const currentList = tab === "ideas" ? ideas : discussions;
  const isIdeasTab = tab === "ideas";

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(167,139,250,0.1))",
                border: "1px solid rgba(34,211,238,0.3)",
                boxShadow: "0 0 20px rgba(34,211,238,0.15)",
              }}
            >
              <TrendingUp size={20} style={{ color: "#22d3ee", filter: "drop-shadow(0 0 6px rgba(34,211,238,0.8))" }} />
            </div>
            <div>
              <h2
                className="text-2xl sm:text-3xl font-black tracking-tight leading-none"
                style={{
                  background: "linear-gradient(90deg, #22d3ee 0%, #a78bfa 50%, #f472b6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 20px rgba(34,211,238,0.2))",
                }}
              >
                Community Edge
              </h2>
              <p className="text-xs text-gray-500 mt-1">{t("ce_subtitle")}</p>
            </div>
          </div>

          {limits.community_can_post ? (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0"
              style={
                showForm
                  ? { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }
                  : {
                      background: "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(167,139,250,0.1))",
                      border: "1px solid rgba(34,211,238,0.35)",
                      color: "#22d3ee",
                      boxShadow: "0 0 16px rgba(34,211,238,0.12)",
                    }
              }
            >
              {showForm ? <X size={14} /> : <Plus size={14} />}
              {showForm ? t("cancel") : t("ce_create")}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSubOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0"
              style={{ background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.15)", color: "rgba(34,211,238,0.4)" }}
            >
              <Lock size={13} />
              Edge required
            </motion.button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <StatsBar posts={posts} />

      {/* Leaderboard */}
      <Leaderboard posts={posts} />

      {/* New post form */}
      <AnimatePresence>
        {showForm && (
          <NewPostForm
            type={tab === "ideas" ? "idea" : "discussion"}
            onClose={() => setShowForm(false)}
            onSubmit={addPost}
          />
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-2xl mb-4"
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {(["ideas", "discussions"] as const).map((tabKey) => {
          const active = tab === tabKey;
          const tabAccent = tabKey === "ideas" ? "#22d3ee" : "#a78bfa";
          const Icon = tabKey === "ideas" ? Lightbulb : MessagesSquare;
          const label = tabKey === "ideas" ? t("ce_ideas_tab") : t("ce_discussions_tab");
          const count = tabKey === "ideas" ? ideas.length : discussions.length;

          return (
            <motion.button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className="relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ color: active ? tabAccent : "#4b5563" }}
            >
              {active && (
                <motion.div
                  layoutId="tabBg"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: `${tabAccent}12`,
                    border: `1px solid ${tabAccent}30`,
                    boxShadow: `0 0 16px ${tabAccent}12`,
                  }}
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <Icon size={14} />
                {label}
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={
                    active
                      ? { background: `${tabAccent}20`, color: tabAccent }
                      : { background: "rgba(255,255,255,0.05)", color: "#4b5563" }
                  }
                >
                  {count}
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Tab description */}
      <div className="mb-4 px-1">
        <AnimatePresence mode="wait">
          <motion.p
            key={tab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="text-xs text-gray-600 flex items-center gap-1.5"
          >
            {isIdeasTab
              ? <><ImageIcon size={11} className="text-cyan-500/50" />{t("ce_ideas_desc")}</>
              : <><Hash size={11} className="text-purple-500/50" />{t("ce_discussions_desc")}</>
            }
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Posts */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className={isIdeasTab ? "grid grid-cols-1 md:grid-cols-2 gap-3" : "flex flex-col gap-3"}
        >
          {currentList.length === 0 ? (
            <div className="col-span-2 text-center py-20 text-gray-600">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                {isIdeasTab ? <Lightbulb size={24} className="text-gray-700" /> : <MessagesSquare size={24} className="text-gray-700" />}
              </div>
              <p className="text-sm">{t("ce_empty")}</p>
            </div>
          ) : (
            currentList.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <PostCard
                  post={p}
                  rank={rankOf(p.id)}
                  onLike={() => likePost(p.id)}
                  onOpen={() => setOpenPost(p.id)}
                />
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* Post modal */}
      <AnimatePresence>
        {openPost && openPostData && (
          <PostModal
            post={openPostData}
            onClose={() => setOpenPost(null)}
            onLikePost={() => likePost(openPost)}
            onLikeComment={(cId) => likeComment(openPost, cId)}
            onAddComment={(text) => addComment(openPost, text)}
          />
        )}
      </AnimatePresence>

      {/* Upgrade modal */}
      <SubscriptionModal
        isOpen={subOpen}
        onClose={() => setSubOpen(false)}
        currentPlan={currentPlan}
        onUpgrade={() => setSubOpen(false)}
      />
    </div>
  );
}

export default CommunityEdge;
