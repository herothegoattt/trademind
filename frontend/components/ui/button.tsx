"use client";
import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "primary";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";
    const variants: Record<string, string> = {
      default: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105",
      primary: "bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-500 hover:to-cyan-500 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105",
      outline: "border-2 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all",
      ghost: "text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-l-2 hover:border-l-cyan-500 pl-2",
    };
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], className ?? "")}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
