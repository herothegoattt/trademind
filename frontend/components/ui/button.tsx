"use client";
import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "primary" | "subtle";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent disabled:opacity-40 disabled:pointer-events-none select-none";

    const sizes: Record<string, string> = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9 px-4 text-sm gap-2",
      lg: "h-11 px-6 text-sm gap-2.5",
    };

    const variants: Record<string, string> = {
      default: [
        "text-white",
        "bg-gradient-to-r from-cyan-500 to-cyan-600",
        "hover:from-cyan-400 hover:to-cyan-500",
        "shadow-[0_0_0_1px_rgba(34,211,238,0.3),0_4px_16px_rgba(34,211,238,0.2)]",
        "hover:shadow-[0_0_0_1px_rgba(34,211,238,0.45),0_6px_24px_rgba(34,211,238,0.3)]",
        "active:scale-[0.98]",
      ].join(" "),

      primary: [
        "text-white",
        "bg-gradient-to-r from-indigo-500 to-violet-500",
        "hover:from-indigo-400 hover:to-violet-400",
        "shadow-[0_0_0_1px_rgba(99,102,241,0.3),0_4px_16px_rgba(99,102,241,0.2)]",
        "hover:shadow-[0_0_0_1px_rgba(99,102,241,0.45),0_6px_24px_rgba(99,102,241,0.3)]",
        "active:scale-[0.98]",
      ].join(" "),

      outline: [
        "text-cyan-300",
        "bg-transparent",
        "border border-cyan-500/30",
        "hover:bg-cyan-500/08 hover:border-cyan-400/50 hover:text-cyan-200",
        "active:scale-[0.98]",
      ].join(" "),

      ghost: [
        "text-slate-400",
        "bg-transparent",
        "hover:bg-white/[0.05] hover:text-slate-200",
        "active:scale-[0.98]",
      ].join(" "),

      subtle: [
        "text-slate-300",
        "bg-white/[0.05]",
        "border border-white/[0.08]",
        "hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-white",
        "active:scale-[0.98]",
      ].join(" "),
    };

    return (
      <button
        ref={ref}
        className={cn(base, sizes[size], variants[variant], className ?? "")}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
