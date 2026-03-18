"use client";
import { useDashboardStore } from "../../lib/store";
import { Button } from "../ui/button";
import { Lightbulb, AlertCircle } from "lucide-react";

export function PromptChips() {
  const suggested = useDashboardStore((s: any) => s.suggestedQuestions);
  const selectedErrorType = useDashboardStore((s: any) => s.selectedErrorType);
  const insertPrompt = useDashboardStore((s: any) => s.insertPrompt);

  const errorQuestions = {
    "FOMO": "Why do I keep entering too early? How do I wait for confirmation?",
    "Overconfidence": "How do I prevent overtrading after wins? What's my max position size?",
    "Decision Under Fatigue": "When am I most alert? What are my best trading hours?",
    "Revenge Decision": "How do I control emotions after losses? What's my exit plan?",
    "Confirmation Bias": "How do I avoid just looking for bullish signals? What bearish setup looks like?",
    "Risk Miscalculation": "Is my position size correct? What's my max risk per trade?",
    "Ignoring Invalid Signals": "Which signals are still valid? What changed in the market?",
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Suggested Questions Grid */}
      {suggested.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Lightbulb size={16} className="text-yellow-400" />
            <p className="text-xs uppercase font-bold text-gray-300 tracking-wider">Suggested Topics</p>
            <Lightbulb size={16} className="text-yellow-400" />
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggested.map((q: string, i: number) => (
              <button
                key={i}
                onClick={() => insertPrompt(q)}
                className="group relative text-xs px-4 py-2 h-auto overflow-hidden rounded-lg transition-all duration-300 hover:scale-105"
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 via-blue-500/20 to-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 border border-cyan-500/40 group-hover:border-cyan-500/70 rounded-lg transition-colors" />
                
                <span className="relative text-cyan-300 group-hover:text-cyan-100 font-medium transition-colors block whitespace-nowrap">
                  {q}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error-specific insight button */}
      {selectedErrorType && (
        <button
          onClick={() =>
            insertPrompt(
              errorQuestions[selectedErrorType as keyof typeof errorQuestions] ||
              `Explain why this is ${selectedErrorType} and give a corrective rule`
            )
          }
          className="group relative w-full overflow-hidden rounded-xl transition-all duration-300 hover:scale-105"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/40 via-purple-500/30 to-pink-500/40 opacity-80 group-hover:opacity-100 transition-opacity blur-sm" />
          <div className="absolute inset-0 border border-red-500/60 group-hover:border-red-400/80 rounded-xl transition-colors" />
          
          <div className="relative bg-gradient-to-r from-red-950/90 to-purple-950/90 px-4 py-3 flex items-center justify-center gap-2">
            <AlertCircle size={18} className="text-red-400 group-hover:text-red-300 transition-colors" />
            <span className="text-sm font-bold text-red-300 group-hover:text-red-100 transition-colors">
              🚨 Analyze {selectedErrorType} Bias
            </span>
            <AlertCircle size={18} className="text-red-400 group-hover:text-red-300 transition-colors" />
          </div>
        </button>
      )}
    </div>
  );
}
