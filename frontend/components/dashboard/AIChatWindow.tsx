"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardStore } from "../../lib/store";
import { cn } from "../../lib/utils";
import { Send, Brain, Sparkles, MessageCircle, ChevronDown, Zap, Paperclip, Image } from "lucide-react";

interface AIChatWindowProps {
  isCompact?: boolean;
}

export const AIChatWindow: React.FC<AIChatWindowProps> = ({ isCompact = false }) => {
  const messages   = useDashboardStore((s) => s.chatMessages) ?? [];
  const isSending  = useDashboardStore((s) => s.isSending)    ?? false;
  const draft      = useDashboardStore((s) => s.chatDraft)    ?? "";
  const setDraft   = useDashboardStore((s) => s.setChatDraft);
  const sendChat   = useDashboardStore((s) => s.sendChat);

  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef       = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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

      {/* ── GLASS BACKGROUND ────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "rgba(2, 4, 20, 0.72)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
        }}
      />
      {/* Subtle gradient border overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(139,92,246,0.06) 50%, rgba(236,72,153,0.04) 100%)",
        }}
      />

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div
        className="relative z-10 flex-shrink-0 flex items-center justify-between px-5 py-2.5"
        style={{
          borderBottom: "1px solid rgba(6,182,212,0.18)",
          background: "rgba(2,4,20,0.55)",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Nucleus icon */}
          <div className="relative w-8 h-8 flex-shrink-0">
            <motion.div
              animate={{ scale: [1, 1.45, 1], opacity: [0.45, 0.85, 0.45] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full"
              style={{ background: "rgba(6,182,212,0.35)", filter: "blur(5px)" }}
            />
            <div
              className="relative w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(6,182,212,0.55), rgba(139,92,246,0.55))",
                border: "1px solid rgba(6,182,212,0.4)",
                boxShadow: "0 0 12px rgba(6,182,212,0.3)",
              }}
            >
              <Brain size={14} className="text-white" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-bold tracking-widest"
                style={{
                  background: "linear-gradient(90deg, #67e8f9, #a78bfa, #f472b6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                NEURAL CORE
              </span>
              <motion.div
                animate={{ opacity: [1, 0.25, 1], scale: [1, 0.75, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: "#10b981", boxShadow: "0 0 6px #10b981" }}
              />
              <span className="text-[10px] text-emerald-400 font-semibold tracking-widest">
                ONLINE
              </span>
            </div>
            {!isCompact && (
              <div className="mt-0.5 space-y-0.5">
                <p className="text-[9px] text-slate-500 tracking-widest">
                  TRADING INTELLIGENCE SYSTEM v2.0
                </p>
                <p className="text-[10px] text-slate-400/70 font-medium">
                  TradeMind Coach
                </p>
              </div>
            )}
          </div>
        </div>

        {!isCompact && (
          <div className="flex items-center gap-3">
            {/* EKG waveform accent */}
            <motion.svg
              width="48" height="14" viewBox="0 0 48 14" fill="none"
              animate={{ opacity: [0.25, 0.55, 0.25] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <path
                d="M0 7 L7 7 L11 1 L15 13 L19 1 L23 13 L27 7 L34 7 L38 4 L42 10 L48 7"
                stroke="#06b6d4" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
              />
            </motion.svg>
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-md"
              style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.15)" }}
            >
              <Zap size={11} className="text-cyan-400" />
              <span className="text-[9px] text-cyan-400/80 tracking-widest font-medium">
                TRADEMIND AI
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── MESSAGES ────────────────────────────────────────────── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="relative z-10 flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(6,182,212,0.15) transparent" }}
      >
        {/* ── Empty state — fills full height, no scroll ── */}
        {messages.length === 0 && !isSending && !isCompact ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">

              {/* Radar / sonar visualization */}
              <div className="relative flex items-center justify-center mb-8" style={{ width: 160, height: 160 }}>

                {/* Outward ripple rings */}
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: 56, height: 56,
                      top: "50%", left: "50%",
                      marginTop: -28, marginLeft: -28,
                      border: "1px solid rgba(6,182,212,0.45)",
                    }}
                    animate={{ scale: [1, 2.7], opacity: [0.4, 0] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut", delay: i * 0.87 }}
                  />
                ))}

                {/* Slow-rotating dashed orbit */}
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    width: 128, height: 128,
                    top: "50%", left: "50%",
                    marginTop: -64, marginLeft: -64,
                    border: "1px dashed rgba(6,182,212,0.1)",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />

                {/* Purple counter-orbit */}
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    width: 100, height: 100,
                    top: "50%", left: "50%",
                    marginTop: -50, marginLeft: -50,
                    border: "1px dashed rgba(139,92,246,0.08)",
                  }}
                  animate={{ rotate: -360 }}
                  transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
                />

                {/* Brain icon — center */}
                <motion.div
                  className="relative z-10 rounded-full flex items-center justify-center"
                  style={{
                    width: 56, height: 56,
                    background: "linear-gradient(135deg, rgba(6,182,212,0.18), rgba(139,92,246,0.18))",
                    border: "1px solid rgba(6,182,212,0.35)",
                  }}
                  animate={{
                    boxShadow: [
                      "0 0 18px rgba(6,182,212,0.18)",
                      "0 0 38px rgba(6,182,212,0.42)",
                      "0 0 18px rgba(6,182,212,0.18)",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Brain size={24} className="text-cyan-300" />
                </motion.div>
              </div>

              {/* Terminal status card */}
              <div
                className="px-5 py-3.5 rounded-lg mb-5"
                style={{
                  background: "rgba(6,182,212,0.03)",
                  border: "1px solid rgba(6,182,212,0.1)",
                  fontFamily: "monospace",
                  minWidth: "240px",
                }}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] text-cyan-400/80 tracking-widest">NEURAL CORE</span>
                  <div className="flex items-center gap-1.5">
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "#10b981", boxShadow: "0 0 5px #10b981" }}
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <span className="text-[9px] text-emerald-400 tracking-widest">OPERATIONAL</span>
                  </div>
                </div>
                <div className="space-y-1.5 border-t border-white/[0.04] pt-2.5">
                  <div className="flex justify-between gap-6">
                    <span className="text-[9px] text-slate-600">MODEL</span>
                    <span className="text-[9px] text-slate-500">TradeMind</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="text-[9px] text-slate-600">MODE</span>
                    <span className="text-[9px] text-slate-500">TRADING ANALYSIS</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="text-[9px] text-slate-600">STREAM</span>
                    <span className="text-[9px] text-emerald-600">ENABLED</span>
                  </div>
                </div>
              </div>

              <p className="text-[9px] text-slate-600 tracking-widest uppercase">
                Задайте вопрос о стратегии или анализе рынка
              </p>
            </div>
        ) : (
          <div className={cn("pb-4", isCompact ? "px-3 py-2 space-y-2" : "px-5 py-4 space-y-4")}>

          {/* ── Message bubbles ── */}
          <AnimatePresence initial={false}>
            {messages.map((message: any) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={cn("flex gap-2.5", message.role === "user" ? "justify-end" : "justify-start")}
              >
                {/* AI avatar */}
                {message.role === "assistant" && (
                  <motion.div
                    animate={{
                      boxShadow: [
                        "0 0 8px rgba(6,182,212,0.35)",
                        "0 0 20px rgba(6,182,212,0.7)",
                        "0 0 8px rgba(6,182,212,0.35)",
                      ],
                    }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center self-end mb-1"
                    style={{
                      background: "linear-gradient(135deg, rgba(6,182,212,0.45), rgba(139,92,246,0.45))",
                      border: "1px solid rgba(6,182,212,0.45)",
                    }}
                  >
                    <Sparkles size={13} className="text-cyan-200" />
                  </motion.div>
                )}

                <div className={cn("max-w-[78%]", isCompact && "max-w-[88%]")}>
                  <div
                    className={cn(
                      "px-4 py-3 text-sm leading-relaxed break-words",
                      isCompact && "text-xs px-3 py-2",
                      message.role === "user" ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm"
                    )}
                    style={
                      message.role === "user"
                        ? {
                            background:
                              "linear-gradient(135deg, rgba(139,92,246,0.65), rgba(236,72,153,0.55))",
                            border: "1px solid rgba(236,72,153,0.35)",
                            boxShadow: "0 0 22px rgba(139,92,246,0.18)",
                            color: "white",
                          }
                        : {
                            background: "rgba(3,8,32,0.75)",
                            border: "1px solid rgba(6,182,212,0.28)",
                            boxShadow: "0 0 18px rgba(6,182,212,0.08)",
                            color: "#e2e8f0",
                          }
                    }
                  >
                    <p className="whitespace-pre-wrap font-medium">{message.text}</p>
                  </div>
                  <p className="text-[9px] text-slate-700 mt-1 px-1">
                    {new Date(message.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                {/* User avatar */}
                {message.role === "user" && (
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center self-end mb-1"
                    style={{
                      background: "rgba(139,92,246,0.28)",
                      border: "1px solid rgba(139,92,246,0.38)",
                    }}
                  >
                    <MessageCircle size={13} className="text-purple-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* ── Sending / pulsar indicator ── */}
          <AnimatePresence>
            {isSending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex gap-2.5 items-end"
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 8px rgba(6,182,212,0.35)",
                      "0 0 22px rgba(6,182,212,0.8)",
                      "0 0 8px rgba(6,182,212,0.35)",
                    ],
                  }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(6,182,212,0.5), rgba(139,92,246,0.5))",
                    border: "1px solid rgba(6,182,212,0.5)",
                  }}
                >
                  <Sparkles size={13} className="text-cyan-200" />
                </motion.div>

                <div
                  className="px-5 py-3.5 rounded-2xl rounded-bl-sm flex items-center gap-3"
                  style={{
                    background: "rgba(3,8,32,0.75)",
                    border: "1px solid rgba(6,182,212,0.28)",
                  }}
                >
                  <span className="text-xs text-slate-400 tracking-wide">
                    Ядро обрабатывает запрос
                  </span>
                  <div className="flex gap-1.5 items-center">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ scale: [0.5, 1.3, 0.5], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.22, ease: "easeInOut" }}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: "rgba(6,182,212,0.85)",
                          boxShadow: "0 0 5px rgba(6,182,212,0.6)",
                        }}
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

      {/* ── Scroll-to-bottom button ── */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.75 }}
            onClick={scrollToBottom}
            className="absolute right-5 bottom-24 z-20 w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(6,182,212,0.2)",
              border: "1px solid rgba(6,182,212,0.45)",
              boxShadow: "0 0 14px rgba(6,182,212,0.28)",
            }}
          >
            <ChevronDown size={14} className="text-cyan-300" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── INPUT AREA ──────────────────────────────────────────── */}
      <div
        className="relative z-10 flex-shrink-0 px-4 py-3"
        style={{
          borderTop: "1px solid rgba(6,182,212,0.18)",
          background: "rgba(2,4,20,0.78)",
        }}
      >
        <div
          className="flex items-end gap-2 px-3 py-2 rounded-xl transition-all"
          style={{
            background: "rgba(6,182,212,0.04)",
            border: "1px solid rgba(6,182,212,0.22)",
          }}
        >
          {/* Attachments */}
          <div className="flex items-center gap-1 flex-shrink-0 pb-1">
            <button
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)" }}
              title="Прикрепить файл"
            >
              <Paperclip size={12} className="text-slate-400" />
            </button>
            <button
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)" }}
              title="Изображение"
            >
              <Image size={12} className="text-slate-400" />
            </button>
          </div>

          {/* Textarea */}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Передайте запрос ядру..."
            className="flex-1 min-h-[34px] max-h-28 bg-transparent border-0 resize-none focus:outline-none leading-relaxed py-1.5 placeholder-slate-600 text-slate-100"
            style={{ fontSize: isCompact ? "12px" : "13px" }}
          />

          {/* Send button */}
          <button
            onClick={() => sendChat()}
            disabled={!draft.trim() || isSending}
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all"
            style={
              !draft.trim() || isSending
                ? { background: "rgba(20,22,40,0.6)", cursor: "not-allowed" }
                : {
                    background:
                      "linear-gradient(135deg, rgba(6,182,212,0.65), rgba(139,92,246,0.65))",
                    boxShadow: "0 0 18px rgba(6,182,212,0.38)",
                    cursor: "pointer",
                  }
            }
          >
            {isSending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles size={14} className="text-cyan-300" />
              </motion.div>
            ) : (
              <Send size={14} className={draft.trim() ? "text-white" : "text-slate-700"} />
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
