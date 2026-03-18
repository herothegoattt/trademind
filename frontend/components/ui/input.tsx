"use client";
import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-gray-500/40 bg-slate-900/50 px-4 py-2.5 text-sm",
        "placeholder:text-gray-500",
        "focus:outline-none focus:ring-2 focus:ring-cyan-500/70 focus:border-cyan-400/60",
        "focus:bg-slate-900 focus:shadow-lg focus:shadow-cyan-500/20",
        "transition-all duration-300",
        "hover:border-gray-400/60",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
