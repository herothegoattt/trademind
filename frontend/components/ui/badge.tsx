"use client";
import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold",
          "bg-gradient-to-r from-cyan-500/20 to-blue-500/20",
          "border border-cyan-500/40",
          "text-cyan-300",
          "hover:from-cyan-500/30 hover:to-blue-500/30 hover:border-cyan-400/60",
          "transition-all duration-300 ease-out",
          "shadow-lg shadow-cyan-500/10",
          "hover:shadow-cyan-500/20",
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";
