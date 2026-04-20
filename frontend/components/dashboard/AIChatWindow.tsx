"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardStore } from "../../lib/store";
import { cn } from "../../lib/utils";
import {
  Send,
  Brain,
  Sparkles,
  MessageCircle,
  ChevronDown,
  Zap,
  Paperclip,
  X,
  FileVideo,
  FileImage,
  ShieldAlert,
  BarChart2,
  Globe,
  HeartPulse,
} from "lucide-react";

/* Neon animated wrapper for text */
const neonCyanVariants = {
  animate: {
    textShadow: [
      "0 0 4px rgba(34,211,238,0.5), 0 0 12px rgba(34,211,238,0.2)",
      "0 0 8px rgba(34,211,238,0.9), 0 0 22px rgba(34,211,238,0.5), 0 0 48px rgba(34,211,238,0.15)",
      "0 0 4px rgba(34,211,238,0.5), 0 0 12px rgba(34,211,238,0.2)",
    ],
  },
  transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const },
};

interface AIChatWindowProps {
  isCompact?: boolean;
}

const SUGGESTIONS = [
  {
    label: "Analyze my risk exposure",
    sub: "Position sizing & drawdown",
    Icon: ShieldAlert,
    color: "251,146,60",
    border: "rgba(251,146,60,0.18)",
    bg: "rgba(251,146,60,0.06)",
    bgHover: "rgba(251,146,60,0.12)",
  },
  {
    label: "Review my recent setups",
    sub: "Pattern & entry analysis",
    Icon: BarChart2,
    color: "129,140,248",
    border: "rgba(129,140,248,0.18)",
    bg: "rgba(129,140,248,0.06)",
    bgHover: "rgba(129,140,248,0.12)",
  },
  {
    label: "Market outlook for today",
    sub: "Bias & key levels",
    Icon: Globe,
    color: "34,211,238",
    border: "rgba(34,211,238,0.18)",
    bg: "rgba(34,211,238,0.06)",
    bgHover: "rgba(34,211,238,0.12)",
  },
  {
    label: "Trading psychology tips",
    sub: "Mindset & discipline",
    Icon: HeartPulse,
    color: "192,132,252",
    border: "rgba(192,132,252,0.18)",
    bg: "rgba(192,132,252,0.06)",
    bgHover: "rgba(192,132,252,0.12)",
  },
];

export const AIChatWindow: React.FC<AIChatWindowProps> = ({ isCompact = false }) => {
  const messages  = useDashboardStore((s) => s.chatMessages) ?? [];
  const isSending = useDashboardStore((s) => s.isSending)    ?? false;
  const draft     = useDashboardStore((s) => s.chatDraft)    ?? "";
  const setDraft  = useDashboardStore((s) => s.setChatDraft);
  const sendChat  = useDashboardStore((s) => s.sendChat);

  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [attachments, setAttachments]     = useState<File[]>([]);
  const [previews, setPreviews]           = useState<string[]>([]);
  const messagesEndRef       = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef         = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newFiles = [...attachments, ...files].slice(0, 5);
    setAttachments(newFiles);
    newFiles.forEach((f, i) => {
      if (previews[i]) return;
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews((p) => { const n = [...p]; n[i] = ev.target?.result as string; return n; });
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  const removeAttachment = (i: number) => {
    setAttachments((a) => a.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => { scrollToBottom(); }, [messages, isSending]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 110);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
  };

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">

      {/* Background glaze */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "rgba(5,8,16,0.88)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
        }}
      />
      {/* Scan-lines overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)",
          backgroundSize: "100% 4px",
        }}
      />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div
        className="relative z-10 flex-shrink-0 flex items-center justify-between px-5 py-3.5"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(7,10,18,0.7)",
        }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(99,102,246,0.1))",
              border: "1px solid rgba(34,211,238,0.2)",
            }}
            animate={{
              boxShadow: [
                "0 0 8px rgba(34,211,238,0.15), 0 0 0px rgba(34,211,238,0)",
                "0 0 16px rgba(34,211,238,0.4), 0 0 32px rgba(34,211,238,0.12)",
                "0 0 8px rgba(34,211,238,0.15), 0 0 0px rgba(34,211,238,0)",
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.span
              animate={{ filter: [
                "drop-shadow(0 0 2px rgba(34,211,238,0.7))",
                "drop-shadow(0 0 6px rgba(34,211,238,1)) drop-shadow(0 0 12px rgba(34,211,238,0.4))",
                "drop-shadow(0 0 2px rgba(34,211,238,0.7))",
              ]}}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Brain size={14} style={{ color: "#22d3ee" }} />
            </motion.span>
          </motion.div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <motion.span
                className="text-[13px] font-semibold"
                style={{ color: "#22d3ee" }}
                animate={neonCyanVariants.animate}
                transition={neonCyanVariants.transition}
              >
                TradeMind AI
              </motion.span>
              <span className="flex items-center gap-1.5">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#10b981" }}
                  animate={{
                    boxShadow: [
                      "0 0 4px rgba(16,185,129,0.7), 0 0 10px rgba(16,185,129,0.3)",
                      "0 0 8px rgba(16,185,129,1),   0 0 20px rgba(16,185,129,0.6), 0 0 36px rgba(16,185,129,0.2)",
                      "0 0 4px rgba(16,185,129,0.7), 0 0 10px rgba(16,185,129,0.3)",
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.span
                  className="text-[10px] font-medium"
                  style={{ color: "#34d399" }}
                  animate={{ textShadow: [
                    "0 0 4px rgba(52,211,153,0.4)",
                    "0 0 8px rgba(52,211,153,0.8), 0 0 16px rgba(52,211,153,0.3)",
                    "0 0 4px rgba(52,211,153,0.4)",
                  ]}}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  online
                </motion.span>
              </span>
            </div>
            {!isCompact && (
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(90,104,128,0.9)" }}>
                Trading analysis & coaching
              </p>
            )}
          </div>
        </div>

        {!isCompact && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{
              background: "rgba(34,211,238,0.06)",
              border: "1px solid rgba(34,211,238,0.12)",
            }}
          >
            <Zap size={10} style={{ color: "rgba(34,211,238,0.7)" }} />
            <span className="text-[10px] font-medium" style={{ color: "rgba(34,211,238,0.65)" }}>
              AI
            </span>
          </div>
        )}
      </div>

      {/* ── MESSAGES ───────────────────────────────────────────── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="relative z-10 flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.07) transparent" }}
      >
        {/* Empty state */}
        {messages.length === 0 && !isSending && !isCompact ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-5 overflow-hidden">

            {/* Ambient radial glow */}
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                className="absolute left-1/2 -translate-x-1/2"
                style={{ top: "15%", width: 320, height: 320, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(34,211,238,0.055) 0%, rgba(99,102,246,0.03) 50%, transparent 70%)",
                  filter: "blur(30px)" }}
                animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            {/* Hero icon with rings */}
            <motion.div
              className="relative flex items-center justify-center mb-5"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* Outer pulse ring */}
              <motion.div
                className="absolute rounded-full border"
                style={{ width: 96, height: 96, borderColor: "rgba(34,211,238,0.1)" }}
                animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Mid ring */}
              <motion.div
                className="absolute rounded-full border"
                style={{ width: 74, height: 74, borderColor: "rgba(34,211,238,0.18)" }}
                animate={{ scale: [1, 1.07, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              />
              {/* Orbiting dot */}
              <motion.div
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{ background: "#22d3ee", top: 6, left: "50%", marginLeft: -3,
                  boxShadow: "0 0 6px rgba(34,211,238,0.9), 0 0 12px rgba(34,211,238,0.4)" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                transformTemplate={({ rotate }) => `rotate(${rotate}) translateY(-37px)`}
              />
              {/* Icon box */}
              <motion.div
                className="w-[58px] h-[58px] rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(34,211,238,0.13), rgba(99,102,246,0.1))",
                  border: "1px solid rgba(34,211,238,0.28)",
                }}
                animate={{
                  boxShadow: [
                    "0 0 18px rgba(34,211,238,0.1), 0 0 40px rgba(34,211,238,0.04)",
                    "0 0 30px rgba(34,211,238,0.22), 0 0 60px rgba(34,211,238,0.1)",
                    "0 0 18px rgba(34,211,238,0.1), 0 0 40px rgba(34,211,238,0.04)",
                  ],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.div
                  animate={{ filter: [
                    "drop-shadow(0 0 3px rgba(34,211,238,0.6))",
                    "drop-shadow(0 0 8px rgba(34,211,238,1)) drop-shadow(0 0 18px rgba(34,211,238,0.4))",
                    "drop-shadow(0 0 3px rgba(34,211,238,0.6))",
                  ]}}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Brain size={26} style={{ color: "#22d3ee" }} />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h3
              className="text-[15px] font-semibold mb-1.5 text-center"
              style={{ color: "#edf0f5" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              Your AI Trading Coach
            </motion.h3>
            <motion.p
              className="text-[12px] text-center max-w-[240px] leading-relaxed mb-6"
              style={{ color: "rgba(90,104,128,0.85)" }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.4 }}
            >
              Ask anything about your trades, strategy, or market conditions.
            </motion.p>

            {/* Suggestion cards — 2×2 grid */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-[300px]">
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={s.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.07, duration: 0.35, ease: "easeOut" }}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setDraft(s.label)}
                  className="flex flex-col items-start gap-2 p-3 rounded-xl text-left transition-colors"
                  style={{ background: s.bg, border: `1px solid ${s.border}` }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = s.bgHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = s.bg; }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `rgba(${s.color},0.12)`, border: `1px solid rgba(${s.color},0.2)` }}
                  >
                    <s.Icon size={13} style={{ color: `rgba(${s.color},1)` }} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold leading-tight mb-0.5" style={{ color: "#dde3ed" }}>
                      {s.label}
                    </p>
                    <p className="text-[10px] leading-tight" style={{ color: `rgba(${s.color},0.7)` }}>
                      {s.sub}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className={cn("pb-4", isCompact ? "px-3 py-2 space-y-2" : "px-5 py-4 space-y-4")}>

            <AnimatePresence initial={false}>
              {messages.map((message: any) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className={cn("flex gap-2.5", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  {/* AI avatar */}
                  {message.role === "assistant" && (
                    <div
                      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center self-end mb-1"
                      style={{
                        background: "linear-gradient(135deg, rgba(34,211,238,0.12), rgba(99,102,246,0.08))",
                        border: "1px solid rgba(34,211,238,0.18)",
                      }}
                    >
                      <Sparkles size={11} style={{ color: "#22d3ee" }} />
                    </div>
                  )}

                  <div className={cn("max-w-[76%]", isCompact && "max-w-[88%]")}>
                    <div
                      className={cn(
                        "px-3.5 py-2.5 text-sm leading-relaxed break-words",
                        isCompact && "text-xs px-3 py-2",
                        message.role === "user" ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm"
                      )}
                      style={
                        message.role === "user"
                          ? {
                              background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(67,56,202,0.12))",
                              border: "1px solid rgba(99,102,241,0.22)",
                              color: "#e2e8f0",
                            }
                          : {
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.07)",
                              color: "var(--text-base)",
                            }
                      }
                    >
                      <p className="whitespace-pre-wrap">{message.text}</p>
                    </div>
                    <p
                      className="text-[10px] mt-1 px-1"
                      style={{ color: "rgba(71,85,105,0.7)" }}
                    >
                      {new Date(message.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  {/* User avatar */}
                  {message.role === "user" && (
                    <div
                      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center self-end mb-1"
                      style={{
                        background: "rgba(99,102,241,0.1)",
                        border: "1px solid rgba(99,102,241,0.18)",
                      }}
                    >
                      <MessageCircle size={11} style={{ color: "#818cf8" }} />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Thinking indicator */}
            <AnimatePresence>
              {isSending && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex gap-2.5 items-end"
                >
                  <div
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, rgba(34,211,238,0.12), rgba(99,102,246,0.08))",
                      border: "1px solid rgba(34,211,238,0.18)",
                    }}
                  >
                    <Sparkles size={11} style={{ color: "#22d3ee" }} />
                  </div>

                  <div
                    className="px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-2.5"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <span className="text-xs" style={{ color: "rgba(90,104,128,0.9)" }}>
                      Thinking
                    </span>
                    <div className="flex gap-1 items-center">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ scale: [0.5, 1.2, 0.5], opacity: [0.3, 0.9, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                          className="w-1 h-1 rounded-full"
                          style={{ background: "rgba(34,211,238,0.6)" }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Scroll-to-bottom */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute right-5 bottom-24 z-20 w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
            }}
          >
            <ChevronDown size={12} style={{ color: "rgba(148,163,184,0.8)" }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── INPUT AREA ─────────────────────────────────────────── */}
      <div
        className="relative z-10 flex-shrink-0 px-4 py-3.5"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.055)",
          background: "rgba(7,10,18,0.85)",
        }}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.txt,.csv,.xlsx,.docx"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Attachment previews */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 mb-2.5 overflow-hidden"
            >
              {attachments.map((file, i) => {
                const isVideo = file.type.startsWith("video/");
                const isImage = file.type.startsWith("image/");
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    className="relative flex-shrink-0 rounded-xl overflow-hidden"
                    style={{
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    {isImage && previews[i] ? (
                      <img
                        src={previews[i]}
                        alt={file.name}
                        className="w-16 h-16 object-cover block"
                      />
                    ) : isVideo ? (
                      <div className="w-16 h-16 flex flex-col items-center justify-center gap-1">
                        <FileVideo size={20} style={{ color: "rgba(167,139,250,0.8)" }} />
                        <span className="text-[9px] text-center px-1 truncate w-full"
                          style={{ color: "rgba(148,163,184,0.7)" }}>
                          {file.name.slice(0, 10)}
                        </span>
                      </div>
                    ) : (
                      <div className="w-16 h-16 flex flex-col items-center justify-center gap-1">
                        <FileImage size={20} style={{ color: "rgba(34,211,238,0.7)" }} />
                        <span className="text-[9px] text-center px-1 truncate w-full"
                          style={{ color: "rgba(148,163,184,0.7)" }}>
                          {file.name.slice(0, 10)}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(i)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.65)" }}
                    >
                      <X size={9} style={{ color: "#e2e8f0" }} />
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="flex items-end gap-2 px-3 py-2.5 rounded-2xl input-glow transition-all"
          style={{
            background: "rgba(255,255,255,0.035)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Attach button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all mb-0.5"
            style={{
              background: attachments.length ? "rgba(167,139,250,0.1)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${attachments.length ? "rgba(167,139,250,0.25)" : "rgba(255,255,255,0.07)"}`,
              color: attachments.length ? "rgba(167,139,250,0.9)" : "rgba(71,85,105,0.7)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(167,139,250,0.1)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(167,139,250,0.25)";
              (e.currentTarget as HTMLElement).style.color = "rgba(167,139,250,0.9)";
            }}
            onMouseLeave={(e) => {
              if (attachments.length) return;
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
              (e.currentTarget as HTMLElement).style.color = "rgba(71,85,105,0.7)";
            }}
          >
            <Paperclip size={13} />
          </button>

          {/* Textarea */}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask about your trades or the market…"
            className="flex-1 min-h-[32px] max-h-28 bg-transparent border-0 resize-none focus:outline-none leading-relaxed py-0.5"
            style={{
              fontSize: isCompact ? "12px" : "13px",
              color: "#c4cdd8",
            }}
          />

          {/* Send button */}
          <button
            onClick={() => sendChat()}
            disabled={!draft.trim() && !attachments.length || isSending}
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={
              (draft.trim() || attachments.length) && !isSending
                ? {
                    background: "linear-gradient(135deg, rgba(34,211,238,0.18), rgba(99,102,246,0.12))",
                    border: "1px solid rgba(34,211,238,0.28)",
                    color: "#22d3ee",
                    boxShadow: "0 0 12px rgba(34,211,238,0.12)",
                  }
                : {
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "rgba(71,85,105,0.7)",
                    cursor: "not-allowed",
                  }
            }
          >
            {isSending ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Sparkles size={13} style={{ color: "#22d3ee" }} />
              </motion.div>
            ) : (
              <Send size={13} />
            )}
          </button>
        </div>

        <p
          className="text-[10px] text-center mt-2"
          style={{ color: "rgba(56,70,92,0.8)" }}
        >
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
