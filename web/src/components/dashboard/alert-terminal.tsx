"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "lucide-react";
import type { Alert } from "@/lib/queries";

interface AlertTerminalProps {
  alerts: Alert[];
}

const categoryColor: Record<string, string> = {
  Danger: "#ef4444",
  Caution: "#f59e0b",
  "Park Closure": "#ef4444",
  Information: "#6366f1",
  default: "#707070",
};

function getCategoryColor(category: string): string {
  return categoryColor[category] || categoryColor.default;
}

function formatTimestamp(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "——/——";
  }
}

export function AlertTerminal({ alerts }: AlertTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="bento-card p-5 animate-fade-in-up"
      style={{ animationDelay: "400ms" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#10b981]" />
          <span className="text-[0.7rem] font-mono font-medium tracking-[0.15em] uppercase text-[#707070]">
            Alert Feed
          </span>
        </div>
        <span className="text-[0.65rem] font-mono text-[#555]">
          {alerts.length} active
        </span>
      </div>

      {/* Terminal Output */}
      <div
        ref={scrollRef}
        className="terminal-feed h-[240px] overflow-y-auto pr-1"
      >
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <span className="text-[#555] font-mono text-sm">
              No active alerts
            </span>
            <span className="text-[#10b981] font-mono text-xs animate-blink">
              █
            </span>
          </div>
        ) : (
          <>
            {/* System Boot */}
            <div className="terminal-line text-[#555]">
              <span className="text-[#10b981]">SYS</span>
              {" > "}
              Alert feed initialized — {alerts.length} entries loaded
            </div>
            <div className="terminal-line text-[#555]">
              <span className="text-[#10b981]">SYS</span>
              {" > "}
              ————————————————————————————————
            </div>

            {/* Alert Lines */}
            {alerts.map((alert, i) => {
              const color = getCategoryColor(alert.category);
              return (
                <div key={alert.id || i} className="terminal-line">
                  <span className="text-[#555]">
                    [{formatTimestamp(alert.updated_at)}]
                  </span>{" "}
                  <span
                    className="font-semibold"
                    style={{ color: "#10b981" }}
                  >
                    {alert.park_code.toUpperCase()}
                  </span>{" "}
                  <span
                    className="font-semibold"
                    style={{ color }}
                  >
                    {alert.category.toUpperCase()}
                  </span>
                  <span className="text-[#888]">:</span>{" "}
                  <span className="text-[#ccc]">
                    {alert.title}
                  </span>
                </div>
              );
            })}

            {/* Blinking cursor */}
            <div className="terminal-line">
              <span className="text-[#10b981] animate-blink">█</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
