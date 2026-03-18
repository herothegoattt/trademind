"use client";
import { KeyboardEvent } from "react";
import { useDashboardStore } from "../../lib/store";
import { useT } from "../../lib/i18n";
import { Textarea } from "../ui/textarea";
import { IconButton } from "../ui/icon-button";
import { Send, Paperclip, Sparkles } from "lucide-react";
import { Tooltip } from "../ui/tooltip";

export function ChatInput() {
  const draft = useDashboardStore((s: any) => s.chatDraft);
  const setDraft = useDashboardStore((s: any) => s.setChatDraft);
  const sendChat = useDashboardStore((s: any) => s.sendChat);
  const isSending = useDashboardStore((s: any) => s.isSending);
  const t = useT();

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  };

  return (
    <div className="w-full">
      <div className="relative">
        <div className="relative bg-slate-900 rounded-2xl p-4 border border-slate-800">
          <div className="flex items-end gap-3">
            <Tooltip content={t('attach_chart')}>
              <button 
                onClick={() => {}}
                className="flex-shrink-0 p-2 rounded-lg bg-slate-800 text-purple-300 hover:bg-slate-700 transition-colors"
                aria-label="Attach chart"
              >
                <Paperclip size={20} />
              </button>
            </Tooltip>
            
            <Textarea
              value={draft}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              placeholder={t('chat_placeholder')}
              className="flex-1 bg-transparent text-white placeholder-gray-500 border-0 resize-none focus:outline-none text-sm leading-relaxed"
            />
            
            <button
              onClick={sendChat}
              disabled={!draft.trim() || isSending}
              className={`flex-shrink-0 p-2.5 rounded-lg font-semibold flex items-center justify-center gap-1 ${
                !draft.trim() || isSending
                  ? "bg-slate-700/50 text-gray-500 cursor-not-allowed"
                  : "bg-cyan-500 text-white"
              }`}
              aria-label="Send message"
            >
              {isSending ? (
                <Sparkles size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
