"use client";
import * as React from "react";
import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("card-glass rounded-2xl p-4", className)}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";
