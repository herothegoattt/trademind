"use client";
import { AICoreBg } from "./AICoreBg";
import { AIChatWindow } from "./AIChatWindow";

export function CoreHub() {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: "#020308" }}
    >
      <AICoreBg />
      <div className="absolute inset-0 z-10">
        <AIChatWindow isCompact={false} />
      </div>
    </div>
  );
}
