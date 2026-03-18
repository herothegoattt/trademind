"use client";
import * as React from "react";
import { cn } from "../../lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-gray-500/40 bg-slate-900/50 px-4 py-3 text-sm",
        "placeholder:text-gray-500 text-gray-100",
        "focus:outline-none focus:ring-2 focus:ring-cyan-500/70 focus:border-cyan-400/60",
        "focus:bg-slate-900 focus:shadow-lg focus:shadow-cyan-500/20",
        "transition-all duration-300 resize-none",
        "hover:border-gray-400/60",
        "scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
