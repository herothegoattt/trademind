'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Loader, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { investingApi } from '../../lib/investing-api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SuggestedQuestion {
  id: string;
  question: string;
}

export default function InvestmentCoach() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "I'm your AI Investment Coach, specialized in long-term portfolio strategy and wealth building. I can help you with questions about portfolio rebalancing, asset allocation, investment opportunities, risk management, and strategic planning. What would you like to discuss today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions: SuggestedQuestion[] = [
    {
      id: '1',
      question: 'Should I rebalance my portfolio now?',
    },
    {
      id: '2',
      question: 'How should I adjust for rising interest rates?',
    },
    {
      id: '3',
      question: 'What sectors offer the best long-term growth?',
    },
    {
      id: '4',
      question: 'How can I reduce portfolio volatility?',
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent | string) => {
    if (typeof e === 'string') {
      setInput(e);
      // Will process on next send
      return;
    }

    e.preventDefault();

    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call Claude via backend API
      const response = await investingApi.coach.chat(userMessage.content);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden contains-layout will-change-auto">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 will-change-auto">
        <AnimatePresence mode="wait">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} will-change-auto`}
            >
              <div
                className={`max-w-[70%] rounded-xl p-4 ${
                  message.role === 'user'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-100 border border-slate-700'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-cyan-100' : 'text-slate-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex justify-start will-change-auto"
          >
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-2">
              <Loader className="text-cyan-400 animate-spin" size={16} />
              <span className="text-slate-300 text-sm">Investment Coach is thinking...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="px-6 py-4 border-t border-slate-800 will-change-auto"
        >
          <p className="text-xs text-slate-400 font-medium mb-3">SUGGESTED QUESTIONS:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 will-change-auto">
            {suggestedQuestions.map((q, idx) => (
              <motion.button
                key={q.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.05 + idx * 0.05 }}
                onClick={() => {
                  setInput(q.question);
                  setTimeout(() => {
                    handleSendMessage(q.question);
                  }, 100);
                }}
                className="text-left text-xs p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-slate-100 transition-colors duration-200"
              >
                {q.question}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Input Area */}
      <div className="border-t border-slate-800 bg-slate-800/50 p-4 will-change-auto">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about portfolio strategy, opportunities, or risk management..."
            disabled={isLoading}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50 transition-colors duration-200"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors duration-200 flex items-center justify-center will-change-auto"
          >
            {isLoading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
        <p className="text-xs text-slate-400 mt-2">
          You&apos;re chatting with Claude AI Investment Coach. Responses are for educational purposes.
        </p>
      </div>
    </div>
  );
}
