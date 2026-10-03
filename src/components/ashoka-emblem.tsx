"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AshokaEmblemProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  variant?: "gold" | "monochrome" | "navy" | "silver";
  showMotto?: boolean;
}

/**
 * High-dignity vector rendition of the State Emblem of India (Lion Capital of Ashoka)
 * With authentic abacus detailing, Ashoka Chakra, lotus base, and "सत्यमेव जयते" motto.
 */
export function AshokaEmblem({
  size = "md",
  className,
  variant = "gold",
  showMotto = true,
}: AshokaEmblemProps) {
  const sizeMap = {
    xs: { w: 24, h: 32 },
    sm: { w: 32, h: 42 },
    md: { w: 44, h: 58 },
    lg: { w: 60, h: 80 },
    xl: { w: 84, h: 110 },
  };

  const { w, h } = sizeMap[size];

  // Palette gradients based on variant
  const getGradients = () => {
    switch (variant) {
      case "navy":
        return {
          primary: "#1E3A8A",
          secondary: "#3B82F6",
          accent: "#1D4ED8",
          stroke: "#172554",
          text: "#1E3A8A",
        };
      case "silver":
        return {
          primary: "#E2E8F0",
          secondary: "#94A3B8",
          accent: "#CBD5E1",
          stroke: "#64748B",
          text: "#F8FAFC",
        };
      case "monochrome":
        return {
          primary: "currentColor",
          secondary: "currentColor",
          accent: "currentColor",
          stroke: "currentColor",
          text: "currentColor",
        };
      case "gold":
        return {
          primary: "#B45309",
          secondary: "#D97706",
          accent: "#78350F",
          stroke: "#451A03",
          text: "#78350F",
        };
      case "navy":
      default:
        return {
          primary: "#0B4F9C",
          secondary: "#1E3A8A",
          accent: "#172554",
          stroke: "#0F172A",
          text: "#0F172A",
        };
    }
  };

  const palette = getGradients();

  return (
    <div className={cn("inline-flex flex-col items-center select-none", className)}>
      <svg
        width={w}
        height={h}
        viewBox="0 0 100 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm transition-transform duration-300"
      >
        <defs>
          <linearGradient id={`goldGrad-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.secondary} />
            <stop offset="50%" stopColor={palette.primary} />
            <stop offset="100%" stopColor={palette.accent} />
          </linearGradient>
          <linearGradient id={`glowGrad-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={palette.secondary} stopOpacity="0.8" />
            <stop offset="100%" stopColor={palette.accent} stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Central Crown / Lion heads group */}
        <g id="lions">
          {/* Center Lion Head */}
          <path
            d="M 50 14 C 44 14, 40 18, 38 23 C 37 27, 38 31, 39 34 C 41 38, 44 42, 50 43 C 56 42, 59 38, 61 34 C 62 31, 63 27, 62 23 C 60 18, 56 14, 50 14 Z"
            fill={`url(#goldGrad-${variant})`}
            stroke={palette.stroke}
            strokeWidth="1.2"
          />
          {/* Center Lion Mane details */}
          <path
            d="M 43 20 C 46 16, 54 16, 57 20 M 41 26 C 45 23, 55 23, 59 26 M 42 32 C 46 30, 54 30, 58 32 M 46 37 L 50 41 L 54 37"
            stroke={palette.stroke}
            strokeWidth="1"
            strokeLinecap="round"
          />
          {/* Center Lion Ears */}
          <path d="M 40 16 L 37 13 L 42 14 Z M 60 16 L 63 13 L 58 14 Z" fill={palette.secondary} stroke={palette.stroke} strokeWidth="0.8" />
          {/* Center Lion Eyes & Muzzle */}
          <circle cx="46" cy="27" r="1.5" fill={palette.stroke} />
          <circle cx="54" cy="27" r="1.5" fill={palette.stroke} />
          <polygon points="50,30 48,33 52,33" fill={palette.stroke} />

          {/* Left Profile Lion */}
          <path
            d="M 37 24 C 33 21, 27 24, 25 29 C 24 33, 26 38, 29 42 C 32 46, 37 47, 40 46 C 39 42, 38 36, 38 31 Z"
            fill={`url(#goldGrad-${variant})`}
            stroke={palette.stroke}
            strokeWidth="1.2"
          />
          {/* Left lion ear & eye */}
          <path d="M 28 23 L 25 20 L 29 22 Z" fill={palette.secondary} stroke={palette.stroke} strokeWidth="0.8" />
          <circle cx="30" cy="30" r="1.3" fill={palette.stroke} />
          <path d="M 24 33 C 27 34, 30 32, 33 34" stroke={palette.stroke} strokeWidth="0.9" strokeLinecap="round" />

          {/* Right Profile Lion */}
          <path
            d="M 63 24 C 67 21, 73 24, 75 29 C 76 33, 74 38, 71 42 C 68 46, 63 47, 60 46 C 61 42, 62 36, 62 31 Z"
            fill={`url(#goldGrad-${variant})`}
            stroke={palette.stroke}
            strokeWidth="1.2"
          />
          {/* Right lion ear & eye */}
          <path d="M 72 23 L 75 20 L 71 22 Z" fill={palette.secondary} stroke={palette.stroke} strokeWidth="0.8" />
          <circle cx="70" cy="30" r="1.3" fill={palette.stroke} />
          <path d="M 76 33 C 73 34, 70 32, 67 34" stroke={palette.stroke} strokeWidth="0.9" strokeLinecap="round" />

          {/* Lion bodies / Torso pillar */}
          <path
            d="M 32 46 C 30 52, 32 60, 34 68 C 42 70, 58 70, 66 68 C 68 60, 70 52, 68 46 C 62 48, 38 48, 32 46 Z"
            fill={`url(#goldGrad-${variant})`}
            stroke={palette.stroke}
            strokeWidth="1.2"
          />
          {/* Paws and musculature lines */}
          <line x1="42" y1="48" x2="40" y2="69" stroke={palette.stroke} strokeWidth="1" strokeDasharray="3 2" />
          <line x1="58" y1="48" x2="60" y2="69" stroke={palette.stroke} strokeWidth="1" strokeDasharray="3 2" />
          <line x1="50" y1="45" x2="50" y2="69" stroke={palette.stroke} strokeWidth="1.2" />
        </g>

        {/* Abacus platform */}
        <g id="abacus">
          {/* Upper abacus trim */}
          <rect x="20" y="70" width="60" height="4" rx="1.5" fill={palette.secondary} stroke={palette.stroke} strokeWidth="1" />

          {/* Abacus frieze band */}
          <rect x="18" y="74" width="64" height="18" rx="2" fill={`url(#goldGrad-${variant})`} stroke={palette.stroke} strokeWidth="1.2" />

          {/* Ashoka Chakra in Center of Abacus */}
          <g transform="translate(50, 83)">
            <circle cx="0" cy="0" r="7.5" fill="#FFFFFF" stroke="#1E3A8A" strokeWidth="1" />
            <circle cx="0" cy="0" r="1.8" fill="#1E3A8A" />
            {/* 12 spokes simplified for crisp rendering at small scale */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <line
                key={deg}
                x1="0"
                y1="0"
                x2={6.5 * Math.cos((deg * Math.PI) / 180)}
                y2={6.5 * Math.sin((deg * Math.PI) / 180)}
                stroke="#1E3A8A"
                strokeWidth="0.75"
              />
            ))}
          </g>

          {/* Left Frieze: Galloping Horse silhouette */}
          <path
            d="M 27 86 C 25 84, 26 81, 29 80 C 32 80, 34 83, 37 82 C 38 85, 36 88, 33 87 Z"
            fill={palette.stroke}
            opacity="0.85"
          />

          {/* Right Frieze: Standing Bull silhouette */}
          <path
            d="M 64 87 C 62 85, 63 81, 67 80 C 70 81, 72 83, 75 82 C 76 86, 73 88, 70 87 Z"
            fill={palette.stroke}
            opacity="0.85"
          />

          {/* Lower abacus rim */}
          <rect x="16" y="92" width="68" height="4" rx="1.5" fill={palette.secondary} stroke={palette.stroke} strokeWidth="1" />
        </g>

        {/* Bell-shaped inverted Lotus Base */}
        <g id="lotus-base">
          <path
            d="M 20 96 C 24 103, 34 107, 50 107 C 66 107, 76 103, 80 96 Z"
            fill={`url(#goldGrad-${variant})`}
            stroke={palette.stroke}
            strokeWidth="1.2"
          />
          {/* Lotus petal fluting lines */}
          <path
            d="M 28 97 C 32 103, 38 105, 42 106 M 50 97 L 50 107 M 72 97 C 68 103, 62 105, 58 106"
            stroke={palette.stroke}
            strokeWidth="0.9"
            strokeLinecap="round"
          />
        </g>
      </svg>

      {/* Devanagari Motto: सत्यमेव जयते */}
      {showMotto && (
        <span
          className={cn(
            "font-serif tracking-widest text-center mt-1 uppercase font-bold select-none",
            size === "xs" && "text-[7px]",
            size === "sm" && "text-[8.5px]",
            size === "md" && "text-[10px]",
            size === "lg" && "text-xs",
            size === "xl" && "text-sm"
          )}
          style={{
            color: palette.text,
            letterSpacing: "0.22em",
            textShadow: variant === "gold" ? "0 1px 3px rgba(0,0,0,0.6)" : "none",
          }}
        >
          सत्यमेव जयते
        </span>
      )}
    </div>
  );
}

/**
 * 24-Spoked Ashoka Chakra SVG with fine symmetry
 */
export function AshokaChakra({
  size = 24,
  className,
  color = "#1E3A8A",
  spin = false,
}: {
  size?: number;
  className?: string;
  color?: string;
  spin?: boolean;
}) {
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("select-none", spin && "animate-spin duration-1000", className)}
    >
      {/* Outer Ring */}
      <circle cx="50" cy="50" r="46" stroke={color} strokeWidth="4.5" />
      <circle cx="50" cy="50" r="41" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" />

      {/* Center Hub */}
      <circle cx="50" cy="50" r="10" fill={color} />
      <circle cx="50" cy="50" r="4.5" fill="#FFFFFF" />

      {/* 24 Spokes */}
      {spokes.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x2 = 50 + 40 * Math.cos(rad);
        const y2 = 50 + 40 * Math.sin(rad);
        return (
          <line
            key={deg}
            x1="50"
            y1="50"
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

/**
 * Sovereign Tricolor Ribbon with Kesari Saffron, Pure White, and India Green
 */
export function SovereignTricolorRibbon({
  className,
  height = "h-1.5",
}: {
  className?: string;
  height?: string;
}) {
  return (
    <div
      className={cn(
        "w-full flex shrink-0 overflow-hidden relative shadow-sm z-50",
        height,
        className
      )}
      role="presentation"
    >
      <div className="flex-1 bg-[#FF9933]" title="Kesari / Courage" />
      <div className="flex-1 bg-[#FFFFFF] relative flex items-center justify-center">
        <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A] block shadow-xs" />
      </div>
      <div className="flex-1 bg-[#138808]" title="India Green / Prosperity" />
      {/* Subtle gold bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 h-[0.5px] bg-[#E5A93C]/40" />
    </div>
  );
}
