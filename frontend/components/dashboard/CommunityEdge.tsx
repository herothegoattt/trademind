"use client";
import { useState, useRef } from "react";
import {
  Heart, MessageCircle, TrendingUp, Plus, X, Image as ImageIcon,
  Crown, Medal, Flame, Send, Hash,
  Lightbulb, MessagesSquare, ArrowUp, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "../../lib/i18n";

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

const NEON_AVATAR_COLORS: Record<string, string> = {
  IV: "#22d3ee", AT: "#a78bfa", MK: "#f472b6", QM: "#34d399",
  CA: "#fb923c", HK: "#fbbf24", MP: "#e879f9", RM: "#38bdf8",
  HO: "#22d3ee",
};

function Avatar({ initials, size = 32 }: { initials: string; size?: number }) {
  const color = NEON_AVATAR_COLORS[initials] || "#a78bfa";
  return (
    <div
      className="rounded-full flex items-center justify-center text-xs font-bold shrink-0 select-none"
      style={{
        width: size, height: size,
        background: `${color}18`,
        border: `1.5px solid ${color}60`,
        color,
        boxShadow: `0 0 8px ${color}30`,
      }}
    >
      {initials}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={14} className="text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" />;
  if (rank === 2) return <Medal size={14} className="text-slate-300 drop-shadow-[0_0_6px_rgba(203,213,225,0.6)]" />;
  if (rank === 3) return <Medal size={14} className="text-orange-400 drop-shadow-[0_0_6px_rgba(251,146,60,0.7)]" />;
  return <span className="text-xs text-gray-500 font-mono w-4 text-center">{rank}</span>;
}

function LikeButton({
  count, liked, onLike, small = false,
}: { count: number; liked: boolean; onLike: () => void; small?: boolean }) {
  return (
    <motion.button
      onClick={(e) => { e.stopPropagation(); onLike(); }}
      whileTap={{ scale: 0.85 }}
      className={`flex items-center gap-1 rounded-lg transition-all ${
        small ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-xs font-semibold"
      } ${
        liked
          ? "bg-pink-500/20 text-pink-400 border border-pink-500/40"
          : "bg-white/5 text-gray-400 border border-white/10 hover:border-pink-500/30 hover:text-pink-400"
      }`}
      style={liked ? { boxShadow: "0 0 10px rgba(236,72,153,0.25)" } : {}}
    >
      <Heart
        size={small ? 11 : 13}
        className={liked ? "fill-pink-400" : ""}
        style={liked ? { filter: "drop-shadow(0 0 4px rgba(236,72,153,0.7))" } : {}}
      />
      <span>{count}</span>
    </motion.button>
  );
}

// ─── Comment item ─────────────────────────────────────────────────────────────

function CommentItem({
  comment, rank, onLike,
}: { comment: Comment; rank: number; onLike: () => void }) {
  const timeAgo = useTimeAgo();
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <Avatar initials={comment.avatar} size={28} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {rank <= 3 && <RankBadge rank={rank} />}
          <span className="text-xs font-semibold text-cyan-300">@{comment.author}</span>
          <span className="text-xs text-gray-600">{timeAgo(comment.created_at)}</span>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{comment.text}</p>
        <div className="mt-2">
          <LikeButton count={comment.likes} liked={comment.likedByMe} onLike={onLike} small />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({
  post, rank, onLike, onOpen,
}: { post: Post; rank: number; onLike: () => void; onOpen: () => void }) {
  const t = useT();
  const timeAgo = useTimeAgo();
  const accentColor = post.type === "idea" ? "#22d3ee" : "#a78bfa";
  const isTop3 = rank <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      onClick={onOpen}
      className="relative rounded-xl cursor-pointer overflow-hidden transition-all"
      style={{
        background: "rgba(2,4,20,0.85)",
        border: `1px solid ${isTop3 ? accentColor + "50" : "rgba(255,255,255,0.06)"}`,
        boxShadow: isTop3 ? `0 0 20px ${accentColor}15, inset 0 0 20px ${accentColor}05` : "none",
      }}
    >
      {isTop3 && (
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)` }}
        />
      )}

      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex items-center gap-2 mt-0.5">
            <RankBadge rank={rank} />
            <Avatar initials={post.avatar} size={30} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-xs font-semibold" style={{ color: accentColor }}>@{post.author}</span>
              <span className="text-xs text-gray-600">{timeAgo(post.created_at)}</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}30` }}
              >
                {post.tag}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white leading-snug line-clamp-2 hover:text-cyan-300 transition-colors">
              {post.title}
            </h4>
          </div>
        </div>

        {post.image && (
          <div className="mb-3 rounded-lg overflow-hidden border border-white/10">
            <img src={post.image} alt="" className="w-full h-32 object-cover" />
          </div>
        )}

        <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">{post.body}</p>

        <div className="flex items-center gap-2 pt-3 border-t border-white/5">
          <LikeButton count={post.likes} liked={post.likedByMe} onLike={onLike} />
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-white/5 text-gray-400 border border-white/10 hover:border-purple-500/30 hover:text-purple-400 transition-all"
          >
            <MessageCircle size={12} />
            <span>{post.comments.length}</span>
          </button>
          {post.likes >= 20 && (
            <div className="flex items-center gap-1 text-xs text-orange-400 ml-auto">
              <Flame size={11} className="drop-shadow-[0_0_4px_rgba(251,146,60,0.8)]" />
              <span>{t("ce_hot")}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Post detail modal ────────────────────────────────────────────────────────

function PostModal({
  post, onClose, onLikePost, onLikeComment, onAddComment,
}: {
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
  const accentColor = post.type === "idea" ? "#22d3ee" : "#a78bfa";

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, rgba(6,8,30,0.98) 0%, rgba(2,4,20,0.99) 100%)",
          border: `1px solid ${accentColor}40`,
          boxShadow: `0 0 40px ${accentColor}15, 0 25px 50px rgba(0,0,0,0.6)`,
        }}
      >
        <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}90, transparent)` }} />

        {/* Header */}
        <div className="flex items-start gap-3 p-6 pb-4">
          <Avatar initials={post.avatar} size={38} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-bold" style={{ color: accentColor }}>@{post.author}</span>
              <span className="text-xs text-gray-500">{timeAgo(post.created_at)}</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}25` }}
              >
                {post.tag}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white leading-tight">{post.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 space-y-5" style={{ scrollbarWidth: "thin" }}>
          <div
            className="p-4 rounded-xl text-sm text-gray-200 leading-relaxed"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {post.body}
          </div>

          {post.image && (
            <div className="rounded-xl overflow-hidden border border-white/10">
              <img src={post.image} alt="" className="w-full max-h-64 object-contain" style={{ background: "#000" }} />
            </div>
          )}

          <div className="flex items-center gap-3">
            <LikeButton count={post.likes} liked={post.likedByMe} onLike={onLikePost} />
            <span className="text-xs text-gray-500">{post.comments.length} {t("ce_comments")}</span>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
              <ArrowUp size={10} className="text-pink-400" />
              {t("ce_top_by_likes")}
            </span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* Comments */}
          <div className="space-y-4 pb-2">
            {sortedComments.length === 0 ? (
              <p className="text-center text-gray-600 text-sm py-6">{t("ce_be_first")}</p>
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

        {/* Comment input */}
        <div
          className="p-4 border-t"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(2,4,20,0.8)" }}
        >
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder={t("ce_comment_ph")}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${text ? accentColor + "50" : "rgba(255,255,255,0.08)"}`,
              }}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={submit}
              disabled={!text.trim()}
              className="px-3 py-2.5 rounded-xl transition-all disabled:opacity-30"
              style={{
                background: text.trim() ? `${accentColor}25` : "rgba(255,255,255,0.05)",
                border: `1px solid ${text.trim() ? accentColor + "50" : "rgba(255,255,255,0.08)"}`,
                color: text.trim() ? accentColor : "#6b7280",
              }}
            >
              <Send size={16} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── New post form ─────────────────────────────────────────────────────────────

function NewPostForm({
  type, onClose, onSubmit,
}: {
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
  const accentColor = type === "idea" ? "#22d3ee" : "#a78bfa";

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
      tag: tag.trim() || (type === "idea" ? "Idea" : "Discussion"),
      author: "you",
      avatar: "HO",
      image: type === "idea" ? image : undefined,
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -12, height: 0 }}
      className="overflow-hidden"
    >
      <div
        className="rounded-2xl p-5 mb-6"
        style={{
          background: "rgba(2,4,20,0.9)",
          border: `1px solid ${accentColor}35`,
          boxShadow: `0 0 24px ${accentColor}10`,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {type === "idea"
              ? <Lightbulb size={16} style={{ color: accentColor }} />
              : <MessagesSquare size={16} style={{ color: accentColor }} />
            }
            <span className="font-bold text-white text-sm">
              {type === "idea" ? t("new_idea") : t("ce_new_discussion")}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("ce_title_ph")}
            className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${title ? accentColor + "50" : "rgba(255,255,255,0.08)"}`,
            }}
          />

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={type === "idea" ? t("ce_idea_ph") : t("ce_disc_ph")}
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none resize-none transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${body ? accentColor + "50" : "rgba(255,255,255,0.08)"}`,
            }}
          />

          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder={type === "idea" ? t("ce_idea_tag_ph") : t("ce_disc_tag_ph")}
            className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          />

          {type === "idea" && (
            <div>
              {image ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                  <img src={image} alt="" className="w-full h-36 object-cover" />
                  <button
                    onClick={() => setImage("")}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs"
                  >
                    <X size={12} />
                    {t("ce_remove_img")}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-3 rounded-xl border border-dashed text-xs text-gray-500 flex items-center justify-center gap-2 hover:border-cyan-500/40 hover:text-cyan-400 transition-all"
                  style={{ borderColor: "rgba(255,255,255,0.1)" }}
                >
                  <ImageIcon size={14} />
                  {t("ce_attach_img")}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={submit}
            disabled={!title.trim() || !body.trim()}
            className="w-full py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-30"
            style={{
              background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}15)`,
              border: `1px solid ${accentColor}50`,
              color: accentColor,
              boxShadow: `0 0 16px ${accentColor}15`,
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
  const medals = [
    { color: "#fbbf24", glow: "rgba(251,191,36,0.6)", icon: <Crown size={14} /> },
    { color: "#94a3b8", glow: "rgba(148,163,184,0.5)", icon: <Medal size={14} /> },
    { color: "#fb923c", glow: "rgba(251,146,60,0.6)", icon: <Medal size={14} /> },
  ];

  return (
    <div
      className="rounded-2xl p-5 mb-6"
      style={{
        background: "linear-gradient(135deg, rgba(6,8,30,0.9) 0%, rgba(2,4,20,0.95) 100%)",
        border: "1px solid rgba(250,204,21,0.15)",
        boxShadow: "0 0 30px rgba(250,204,21,0.06)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={15} className="text-yellow-400" style={{ filter: "drop-shadow(0 0 6px rgba(250,204,21,0.8))" }} />
        <span className="text-sm font-bold text-yellow-400">{t("ce_top_label")}</span>
        <span className="text-xs text-gray-600 ml-auto">{t("ce_by_likes")}</span>
      </div>

      <div className="space-y-2.5">
        {top3.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: `${medals[i].color}15`,
                border: `1px solid ${medals[i].color}40`,
                color: medals[i].color,
                filter: `drop-shadow(0 0 4px ${medals[i].glow})`,
              }}
            >
              {medals[i].icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-200 truncate">{p.title}</p>
              <span className="text-xs text-gray-600">@{p.author}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-pink-400">
              <Heart size={10} className="fill-pink-400" />
              {p.likes}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function CommunityEdge() {
  const t = useT();
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

  return (
    <div className="space-y-0">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl"
              style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)" }}
            >
              <TrendingUp size={18} style={{ color: "#22d3ee", filter: "drop-shadow(0 0 6px rgba(34,211,238,0.7))" }} />
            </div>
            <div>
              <h2
                className="text-2xl font-black tracking-tight"
                style={{
                  background: "linear-gradient(90deg, #22d3ee, #a78bfa, #f472b6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 8px rgba(34,211,238,0.3))",
                }}
              >
                Community Edge
              </h2>
              <p className="text-xs text-gray-500">{t("ce_subtitle")}</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: showForm ? "rgba(239,68,68,0.15)" : "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(167,139,250,0.15))",
              border: showForm ? "1px solid rgba(239,68,68,0.35)" : "1px solid rgba(34,211,238,0.35)",
              color: showForm ? "#f87171" : "#22d3ee",
              boxShadow: showForm ? "0 0 12px rgba(239,68,68,0.15)" : "0 0 12px rgba(34,211,238,0.12)",
            }}
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? t("cancel") : t("ce_create")}
          </motion.button>
        </div>
      </div>

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
        className="flex rounded-xl p-1 mb-5"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {(["ideas", "discussions"] as const).map((tabKey) => {
          const active = tab === tabKey;
          const accentColor = tabKey === "ideas" ? "#22d3ee" : "#a78bfa";
          const Icon = tabKey === "ideas" ? Lightbulb : MessagesSquare;
          const label = tabKey === "ideas" ? t("ce_ideas_tab") : t("ce_discussions_tab");
          const count = tabKey === "ideas" ? ideas.length : discussions.length;
          return (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={
                active
                  ? {
                      background: `${accentColor}15`,
                      color: accentColor,
                      border: `1px solid ${accentColor}35`,
                      boxShadow: `0 0 14px ${accentColor}15`,
                    }
                  : { color: "#4b5563", border: "1px solid transparent" }
              }
            >
              <Icon size={14} />
              {label}
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={
                  active
                    ? { background: `${accentColor}20`, color: accentColor }
                    : { background: "rgba(255,255,255,0.05)", color: "#6b7280" }
                }
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab description */}
      <div className="mb-5 px-1">
        {tab === "ideas" ? (
          <p className="text-xs text-gray-600 flex items-center gap-1.5">
            <ImageIcon size={11} className="text-cyan-500/60" />
            {t("ce_ideas_desc")}
          </p>
        ) : (
          <p className="text-xs text-gray-600 flex items-center gap-1.5">
            <Hash size={11} className="text-purple-500/60" />
            {t("ce_discussions_desc")}
          </p>
        )}
      </div>

      {/* Posts grid */}
      <div className={tab === "ideas" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-3"}>
        {currentList.length === 0 ? (
          <div className="col-span-2 text-center py-16 text-gray-600">
            <div className="text-4xl mb-3">🌐</div>
            <p className="text-sm">{t("ce_empty")}</p>
          </div>
        ) : (
          currentList.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              rank={rankOf(p.id)}
              onLike={() => likePost(p.id)}
              onOpen={() => setOpenPost(p.id)}
            />
          ))
        )}
      </div>

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
    </div>
  );
}

export default CommunityEdge;
