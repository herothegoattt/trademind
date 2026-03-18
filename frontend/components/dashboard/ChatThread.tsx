"use client";
// ChatThread is now integrated into AIChatWindow component
// This file is kept for backward compatibility but is no longer actively used

import { useEffect, useRef } from "react";
import { useDashboardStore } from "../../lib/store";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../../lib/utils";
import { MessageCircle, Sparkles, Zap, Brain } from "lucide-react";

export function ChatThread() {
  const messages = useDashboardStore((s: any) => s.chatMessages);
  const isSending = useDashboardStore((s: any) => s.isSending);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      const scrollElement = viewportRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        setTimeout(() => {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }, 0);
      }
    }
  }, [messages, isSending]);

  if (messages.length === 0 && !isSending) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-lg opacity-30" />
          <Brain size={48} className="text-cyan-400 relative" />
        </div>
        <div>
          <p className="text-lg font-semibold text-white mb-1">TradeMind AI Coach</p>
          <p className="text-sm text-gray-400">Ask me anything about your trading strategy</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 min-h-40 rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-slate-950/50 to-slate-900/70 backdrop-blur-xl shadow-2xl shadow-cyan-500/10">
      <div ref={viewportRef} className="flex flex-col space-y-4 p-5">
        {messages.map((m: any) => (
          <div
            key={m.id}
            className={cn(
              "flex gap-3 animate-slideUp",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {m.role === "assistant" && (
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mt-0.5 shadow-lg shadow-purple-500/50">
                <Sparkles size={16} className="text-white" />
              </div>
            )}
            <div
              className={cn(
                "max-w-md px-5 py-3.5 rounded-2xl text-sm leading-relaxed relative backdrop-blur-sm",
                m.role === "user"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-br-none shadow-lg shadow-blue-500/40 border border-blue-400/50"
                  : "bg-gradient-to-br from-slate-800/90 to-slate-900/90 text-gray-100 border border-cyan-500/40 rounded-bl-none shadow-lg shadow-cyan-500/20"
              )}
            >
              <div className="break-words">{m.text}</div>
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex gap-3 animate-slideUp justify-start">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mt-0.5 shadow-lg shadow-purple-500/50">
              <Brain size={16} className="text-white animate-pulse" />
            </div>
            <div className="px-5 py-3.5 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-cyan-500/40 rounded-bl-none shadow-lg shadow-cyan-500/20">
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-400">Analyzing...</span>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
