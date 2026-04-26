"use client";

import { useEffect, useState } from "react";
import { Mountain, Shield, AlertTriangle, type LucideIcon } from "lucide-react";

type IconName = "mountain" | "shield" | "alert-triangle";

interface KPICardProps {
  label: string;
  value: number;
  suffix?: string;
  iconName: IconName;
  variant: "emerald" | "amber" | "danger";
  subtitle?: string;
  delay?: number;
}

const iconMap: Record<IconName, LucideIcon> = {
  mountain: Mountain,
  shield: Shield,
  "alert-triangle": AlertTriangle,
};

const variantConfig = {
  emerald: {
    color: "#10b981",
    glowClass: "glow-emerald",
    textGlow: "glow-text-emerald",
    bg: "rgba(16, 185, 129, 0.06)",
    border: "rgba(16, 185, 129, 0.12)",
    iconBg: "rgba(16, 185, 129, 0.1)",
  },
  amber: {
    color: "#f59e0b",
    glowClass: "glow-amber",
    textGlow: "glow-text-amber",
    bg: "rgba(245, 158, 11, 0.06)",
    border: "rgba(245, 158, 11, 0.12)",
    iconBg: "rgba(245, 158, 11, 0.1)",
  },
  danger: {
    color: "#ef4444",
    glowClass: "glow-danger",
    textGlow: "glow-text-danger",
    bg: "rgba(239, 68, 68, 0.06)",
    border: "rgba(239, 68, 68, 0.12)",
    iconBg: "rgba(239, 68, 68, 0.1)",
  },
};

export function KPICard({
  label,
  value,
  suffix = "",
  iconName,
  variant,
  subtitle,
  delay = 0,
}: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const config = variantConfig[variant];
  const Icon = iconMap[iconName];

  // Animated count-up
  useEffect(() => {
    if (value === 0) return;
    const duration = 1200;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        step++;
        current = Math.min(Math.round(increment * step), value);
        setDisplayValue(current);
        if (step >= steps) clearInterval(interval);
      }, duration / steps);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div
      className={`bento-card p-5 animate-fade-in-up ${config.glowClass} animate-pulse-glow`}
      style={{
        animationDelay: `${delay}ms`,
        background: config.bg,
        borderColor: config.border,
      }}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[0.7rem] font-mono font-medium tracking-[0.15em] uppercase text-[#707070]">
          {label}
        </span>
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ background: config.iconBg }}
        >
          <Icon className="w-4 h-4" style={{ color: config.color }} />
        </div>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1">
        <span
          className={`text-4xl font-mono font-bold tracking-tight ${config.textGlow}`}
          style={{ color: config.color }}
        >
          {displayValue}
        </span>
        {suffix && (
          <span
            className="text-xl font-mono font-medium"
            style={{ color: config.color, opacity: 0.7 }}
          >
            {suffix}
          </span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="mt-2 text-[0.7rem] font-mono text-[#555]">{subtitle}</p>
      )}
    </div>
  );
}
