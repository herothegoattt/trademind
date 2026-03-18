"use client";
import { AICoreBg } from "./AICoreBg";
import { AIChatWindow } from "./AIChatWindow";

export function CoreHub() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <AICoreBg />
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <AIChatWindow isCompact={false} />
      </div>
    </div>
  );
}
