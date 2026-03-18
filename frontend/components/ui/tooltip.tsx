"use client";
import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../../lib/utils";

export const Tooltip = ({
  children,
  content,
  side = "top",
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}) => (
  <TooltipPrimitive.Provider delayDuration={200}>
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Content
        side={side}
        className={cn(
          "rounded-md bg-gray-800 px-2 py-1 text-xs text-gray-100 shadow-lg",
          "data-[state=open]:animate-fade-in"
        )}
      >
        {content}
        <TooltipPrimitive.Arrow className="fill-gray-800" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Root>
  </TooltipPrimitive.Provider>
);
