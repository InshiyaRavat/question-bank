"use client";
import React from "react";

export const ScrollArea = React.forwardRef(({ children, className = "", style = {}, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`overflow-auto ${className}`}
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "#cbd5e0 #f7fafc",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
});

ScrollArea.displayName = "ScrollArea";
