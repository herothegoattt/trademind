"use client";
import * as React from "react";
import { cn } from "../../lib/utils";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: number;
}

export const IconButton = React.forwardRef<
  HTMLButtonElement,
  IconButtonProps
>(({ className, children, size = 20, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md p-1 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-500",
        className
      )}
      {...props}
    >
      {typeof children === "string" ? (
        <span style={{ fontSize: size }}>{children}</span>
      ) : (
        React.cloneElement(children as React.ReactElement, { size })
      )}
    </button>
  );
});
IconButton.displayName = "IconButton";
