"use client";

import React from "react";

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  shimmerColor?: string;
}

export function ShinyText({
  text,
  disabled = false,
  speed = 4,
  className = "",
  shimmerColor = "rgba(255, 255, 255, 0.8)",
}: ShinyTextProps) {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`relative inline-block overflow-hidden ${
        disabled ? "" : "animate-shiny-text"
      } ${className}`}
      style={{
        backgroundImage: disabled
          ? "none"
          : `linear-gradient(120deg, currentColor 0%, currentColor 38%, ${shimmerColor} 50%, currentColor 62%, currentColor 100%)`,
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: disabled ? "inherit" : "transparent",
        animationDuration,
      }}
    >
      {text}
    </span>
  );
}
