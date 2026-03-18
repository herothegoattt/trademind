"use client";
import * as React from "react";

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  vertical?: boolean;
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, vertical = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={
          vertical
            ? "w-px bg-gray-700 mx-2"
            : "h-px bg-gray-700 my-2"
        }
        {...props}
      />
    );
  }
);
Separator.displayName = "Separator";
