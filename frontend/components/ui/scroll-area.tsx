"use client";
import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "../../lib/utils";

interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  children?: React.ReactNode;
}

export const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(({ className, children, ...props }: ScrollAreaProps, ref) => {
  return (
    <ScrollAreaPrimitive.Root className={cn("w-full h-full", className)} {...props} ref={ref}>
      <ScrollAreaPrimitive.Viewport className="w-full h-full">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar orientation="vertical" className="flex touch-none select-none p-0.5">
        <ScrollAreaPrimitive.Thumb className="bg-gray-600 rounded-full flex-1" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Corner className="bg-transparent" />
    </ScrollAreaPrimitive.Root>
  );
});
ScrollArea.displayName = "ScrollArea";
