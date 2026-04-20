'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader, Brain, User, Sparkles, TrendingUp, BarChart2, Shield, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { investingApi } from '../../lib/investing-api';
import { usePortfolio } from '../../lib/portfolioContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  { icon: RefreshCw,   label: 'Rebalancing advice',    q: 'Should I rebalance my portfolio now?',             color: '34,211,238' },
  { icon: TrendingUp,  label: 'Best growth sectors',   q: 'What sectors offer the best long-term growth?',    color: '52,211,153' },
  { icon: Shield,      label: 'Reduce volatility',     q: 'How can I reduce portfolio volatility?',           color: '167,139,250' },
  { icon: BarChart2,   label: 'Rate environment',      q: 'How should I adjust for the current rate environment?', color: '245,158,11' },
];

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: 'rgba(34,211,238,0.7)' }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export default function InvestmentCoach() {
  const { positions, stats, isEmpty } = usePortfolio();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "I'm your AI Investment Coach — specialized in long-term portfolio strategy and wealth building. I can analyze your portfolio, suggest rebalancing strategies, and help you navigate market conditions. What would you like to explore?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || isLoading) return;

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: q, timestamp: new Date() }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await investingApi.coach.chat(q);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: res.response, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: "I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const showSuggestions = messages.length === 1 && !isLoading;

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden"
      style={{
        height: '72vh',
        background: 'rgba(5,7,15,0.98)',
        border: '1px solid rgba(34,211,238,0.15)',
        boxShadow: '0 0 40px rgba(34,211,238,0.04), inset 0 0 80px rgba(34,211,238,0.015)',
      }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(7,10,20,0.8)' }}>
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.25)' }}>
              <Brain size={18} className="text-cyan-400" />
            </div>
            <motion.div
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
              style={{ background: '#22d3ee', border: '2px solid #05070f' }}
              animate={{ boxShadow: ['0 0 0px rgba(34,211,238,0.4)', '0 0 8px rgba(34,211,238,0.8)', '0 0 0px rgba(34,211,238,0.4)'] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">AI Investment Coach</p>
            <p className="text-[10px] text-cyan-400 font-medium tracking-wide">ONLINE · Powered by Claude</p>
          </div>
        </div>

        {/* Portfolio context chip */}
        {!isEmpty && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
            style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#6ee7b7' }}>
            <Sparkles size={11} />
            <span>{positions.length} positions loaded</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(34,211,238,0.1) transparent' }}>
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 mt-1 w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}>
                  <Brain size={14} className="text-cyan-400" />
                </div>
              )}

              <div className={`relative max-w-[78%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'rounded-tr-sm'
                  : 'rounded-tl-sm'
              }`}
                style={msg.role === 'user'
                  ? { background: 'linear-gradient(135deg, rgba(129,140,248,0.25), rgba(167,139,250,0.2))', border: '1px solid rgba(129,140,248,0.3)' }
                  : { background: 'rgba(7,10,20,0.95)', border: '1px solid rgba(34,211,238,0.12)' }
                }
              >
                {msg.role === 'assistant' && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-full"
                    style={{ background: 'linear-gradient(to bottom, rgba(34,211,238,0.5), rgba(34,211,238,0.1))' }} />
                )}
                <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">{msg.content}</p>
                <p className="text-[10px] mt-2 text-slate-600">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {msg.role === 'user' && (
                <div className="flex-shrink-0 mt-1 w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.25)' }}>
                  <User size={14} className="text-indigo-400" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2.5 justify-start"
          >
            <div className="flex-shrink-0 mt-1 w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}>
              <Brain size={14} className="text-cyan-400" />
            </div>
            <div className="rounded-2xl rounded-tl-sm px-4 py-3.5"
              style={{ background: 'rgba(7,10,20,0.95)', border: '1px solid rgba(34,211,238,0.12)' }}>
              <ThinkingDots />
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestion cards */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-3 flex-shrink-0"
          >
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2 px-1">Quick Questions</p>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTIONS.map(({ icon: Icon, label, q, color }, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ scale: 1.02, borderColor: `rgba(${color},0.4)` }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => send(q)}
                  className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-colors"
                  style={{ background: `rgba(${color},0.05)`, border: `1px solid rgba(${color},0.15)` }}
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `rgba(${color},0.12)` }}>
                    <Icon size={13} style={{ color: `rgb(${color})` }} />
                  </div>
                  <span className="text-xs text-slate-300 leading-tight">{label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="px-4 pb-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <form onSubmit={onSubmit} className="flex items-end gap-2 mt-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
              onKeyDown={onKeyDown}
              placeholder="Ask about your portfolio, strategies, risk..."
              disabled={isLoading}
              rows={1}
              className="w-full resize-none rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 disabled:opacity-40 transition-all focus:outline-none"
              style={{
                background: 'rgba(7,10,20,0.9)',
                border: '1px solid rgba(255,255,255,0.09)',
                outline: 'none',
                scrollbarWidth: 'none',
                lineHeight: '1.5',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(34,211,238,0.35)'; e.target.style.boxShadow = '0 0 0 3px rgba(34,211,238,0.06)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <motion.button
            type="submit"
            disabled={isLoading || !input.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
            style={{
              background: input.trim() && !isLoading ? 'linear-gradient(135deg, rgba(34,211,238,0.8), rgba(99,102,241,0.7))' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(34,211,238,0.3)',
            }}
          >
            {isLoading ? <Loader size={16} className="animate-spin text-cyan-400" /> : <Send size={16} className="text-white" />}
          </motion.button>
        </form>
        <p className="text-[10px] text-slate-700 mt-2 text-center">For educational purposes only — not financial advice</p>
      </div>
    </div>
  );
}
