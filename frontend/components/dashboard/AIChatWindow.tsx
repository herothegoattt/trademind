"use client";

import React, { useEffect, useRef, useState } from "react";
import { useDashboardStore } from "../../lib/store";
import { cn } from "../../lib/utils";
import { MessageCircle, Sparkles, Send, Brain, Image, Paperclip } from "lucide-react";

interface AIChatWindowProps {
  isCompact?: boolean;
}

export const AIChatWindow: React.FC<AIChatWindowProps> = ({ isCompact = false }) => {
  const messages = useDashboardStore((s) => s.chatMessages) || [];
  const isSending = useDashboardStore((s) => s.isSending) || false;
  const draft = useDashboardStore((s) => s.chatDraft) || "";
  const setDraft = useDashboardStore((s) => s.setChatDraft) || (() => {});
  const sendChat = useDashboardStore((s) => s.sendChat) || (() => {});

  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Всегда прокручиваем к последнему сообщению, чтобы история была видна
    scrollToBottom();
  }, [messages, isSending]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight <= 120;
      setIsAtBottom(atBottom);
      setShowScrollButton(!atBottom);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  };

  return (
    <div className="w-full h-full flex items-stretch justify-stretch">
      {/* Галактическое ядро по центру */}
      <div className="relative w-full h-full min-h-0 flex items-center justify-center">
        {/* Фон ядра с внешним пунктирным кольцом */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.35),rgba(99,102,241,0.2)_32%,rgba(14,165,233,0.22)_60%,rgba(15,23,42,0.98))] shadow-[0_0_90px_rgba(236,72,153,0.35)] animate-glow-pulse border-2 border-cyan-400/35 border-dashed" />
        <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
          <div className="absolute -top-16 left-1/3 w-48 h-48 rounded-full bg-pink-500/25 blur-3xl" />
          <div className="absolute -bottom-16 right-1/3 w-56 h-56 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute top-1/4 left-1/2 w-40 h-40 -translate-x-1/2 rounded-full bg-violet-500/20 blur-2xl" />
        </div>

        {/* Пульсирующее ядро в центре */}
        <div className="absolute w-28 h-28 rounded-full bg-white/10 border border-pink-400/40 shadow-[0_0_40px_rgba(236,72,153,0.7)] flex items-center justify-center animate-pulseSubtle pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 shadow-[0_0_24px_rgba(236,72,153,0.8)]" />
        </div>

        {/* Небольшое окно чата по центру ядра */}
        <div className="relative z-10 w-full h-full min-h-0 bg-slate-950/96 border border-cyan-400/50 rounded-3xl backdrop-blur-xl shadow-[0_0_35px_rgba(14,165,233,0.35)] overflow-hidden flex flex-col">
          <div className="flex flex-col w-full h-full min-h-0 bg-transparent">
            <div className={cn("flex-shrink-0 bg-slate-900/80 border-b border-slate-700/60", isCompact ? "px-3 py-1" : "px-3 py-1")}> 
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={cn("relative overflow-hidden", isCompact ? "w-28" : "w-32")}> 
                    <div className="absolute inset-0 bg-black/60" />
                    <div className="relative flex items-center h-8">
                      <div className="inline-flex whitespace-nowrap text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.4)]">
                        {"TRADEMIND AI".split("").map((letter, index) => (
                          <span
                            key={index}
                            className="inline-block px-1 animate-marquee"
                            style={{ animationDelay: `${index * 0.15}s` }}
                          >
                            {letter}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {!isCompact && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-300">Online</span>
                    </div>
                  )}
                </div>
                {!isCompact && (
                  <p className="text-slate-200/80 text-xs">Профессиональный торговый ассистент</p>
                )}
              </div>
            </div>

            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
            >
              <div className={cn("scroll-smooth pb-3", isCompact ? "px-3 py-2 space-y-2" : "px-4 py-3 space-y-3")}> 
                {messages.length === 0 && !isSending && (
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center h-full text-center",
                      isCompact ? "space-y-3 py-2" : "space-y-10 py-12"
                    )}
                  >
                    <div className={cn("relative", isCompact && "hidden")}> 
                    <div className="absolute inset-0 w-36 h-36 bg-gradient-to-r from-pink-500/30 via-purple-500/12 to-cyan-500/18 rounded-full blur-3xl" />
                      <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-pink-500/20 via-purple-500/12 to-blue-500/20 border border-pink-400/40 flex items-center justify-center shadow-xl" style={{ boxShadow: '0 0 35px rgba(236, 72, 153, 0.4), inset 0 0 24px rgba(236, 72, 153, 0.12)' }}>
                        <Brain size={72} className="text-pink-200" />
                      </div>
                    </div>

                    {!isCompact && (
                      <div className="max-w-sm">
                        <p className="text-lg font-semibold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                          {"Добро пожаловать в TradeMind AI!".split("").map((letter, index) => (
                            <span
                              key={index}
                              className="inline-block animate-slide-in-from-top"
                              style={{
                                animationDelay: `${index * 0.05}s`,
                                animationFillMode: "forwards",
                              }}
                            >
                              {letter === " " ? "\u00A0" : letter}
                            </span>
                          ))}
                        </p>
                        <p className="text-xs text-gray-300 leading-relaxed mt-1.5">
                          Я ваш личный торговый коуч. Готов помочь вам с анализом рынков, стратегиями и управлением рисками.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {messages.map((message: any) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0 h-9 w-9 rounded-full bg-purple-600/90 flex items-center justify-center shadow-md">
                        <Sparkles size={18} className="text-white" />
                      </div>
                    )}

                    <div className="max-w-xl">
                      <div
                        className={cn(
                          "px-5 py-4 rounded-2xl text-sm leading-relaxed break-words border-2",
                          message.role === "user"
                            ? "bg-pink-600/90 text-white border-pink-400 rounded-br-none"
                            : "bg-slate-800/90 text-white border-cyan-400 rounded-bl-none"
                        )}
                      >
                        <p className="whitespace-pre-wrap font-medium">{message.text}</p>
                      </div>
                    </div>

                    {message.role === "user" && (
                      <div className="flex-shrink-0 h-9 w-9 rounded-full bg-blue-600/90 flex items-center justify-center shadow-md">
                        <MessageCircle size={18} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {isSending && (
                  <div className="flex gap-5">
                    <div className="flex-shrink-0 h-11 w-11 rounded-full bg-purple-600 flex items-center justify-center">
                      <Sparkles size={20} className="text-white animate-spin" />
                    </div>
                    <div className="px-7 py-5 rounded-2xl bg-slate-800/70 border border-purple-400 text-gray-200">
                      AI анализирует ваш запрос...
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {showScrollButton && (
              <button
                onClick={scrollToBottom}
                className="absolute right-4 bottom-20 z-30 p-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white shadow-lg hover:opacity-90 transition text-xs"
              >
                ↓
              </button>
            )}

            {/* Компактный блок ввода внизу — одна строка: вложения + поле + кнопка */}
            <div className={cn("mt-auto flex-shrink-0 bg-slate-900/80 border-t border-slate-700/60", isCompact ? "px-3 py-2" : "px-3 py-2")}>
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button className="h-7 w-7 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 flex items-center justify-center text-slate-300 transition" title="Прикрепить файл">
                    <Paperclip className="h-3 w-3" />
                  </button>
                  <button className="h-7 w-7 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 flex items-center justify-center text-slate-300 transition" title="Изображение">
                    <Image className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex-1 min-w-0 flex items-end gap-2 bg-slate-800/70 border border-slate-600/50 rounded-xl pl-3 pr-2 py-1.5">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder={isCompact ? "Вопрос..." : "Напишите ваш вопрос..."}
                    className={cn(
                      "flex-1 min-h-[32px] max-h-24 bg-transparent text-slate-100 placeholder-slate-400 border-0 resize-none focus:outline-none leading-relaxed font-medium selection:bg-slate-600 selection:text-slate-100 py-1.5",
                      isCompact ? "text-xs" : "text-sm"
                    )}
                  />
                  <button
                    onClick={sendChat}
                    disabled={!draft.trim() || isSending}
                    className={cn(
                      "flex-shrink-0 h-8 w-8 rounded-lg font-bold flex items-center justify-center",
                      !draft.trim() || isSending
                        ? "bg-slate-700/30 text-slate-600 cursor-not-allowed"
                        : "bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:opacity-90 text-white"
                    )}
                  >
                    {isSending ? <Sparkles size={14} /> : <Send size={14} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-1 mt-1 text-[10px] text-slate-500">
                {draft.length > 0 && <span>{draft.length} симв.</span>}
                <span>Enter — отправить · Shift+Enter — новая строка</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
