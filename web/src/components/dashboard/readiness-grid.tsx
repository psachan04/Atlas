"use client";

import { Thermometer, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { HikeReadiness } from "@/lib/queries";

interface ReadinessGridProps {
  data: HikeReadiness[];
}

const statusConfig = {
  Ready: {
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.08)",
    border: "rgba(16, 185, 129, 0.2)",
    icon: CheckCircle2,
    label: "READY",
  },
  Danger: {
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.08)",
    border: "rgba(239, 68, 68, 0.2)",
    icon: ShieldAlert,
    label: "DANGER",
  },
  "Proceed with Caution": {
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.2)",
    icon: AlertTriangle,
    label: "CAUTION",
  },
};

export function ReadinessGrid({ data }: ReadinessGridProps) {
  return (
    <div className="bento-card p-5 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[0.7rem] font-mono font-medium tracking-[0.15em] uppercase text-[#707070]">
          Park Readiness Matrix
        </span>
        <span className="text-[0.65rem] font-mono text-[#555]">
          {data.length} parks
        </span>
      </div>

      {/* Grid */}
      <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
        {data.length === 0 ? (
          <div className="text-center py-8 text-[#555] font-mono text-sm">
            No readiness data available
          </div>
        ) : (
          data.map((park, i) => {
            const config = statusConfig[park.readiness_status];
            const StatusIcon = config.icon;

            return (
              <div
                key={park.park_code}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg transition-all duration-200 hover:bg-[rgba(255,255,255,0.02)] group"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Park Code */}
                <div className="flex items-center gap-3 min-w-[120px]">
                  <StatusIcon
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: config.color }}
                  />
                  <span className="font-mono font-bold text-sm tracking-wider text-[#e8e8e8]">
                    {park.park_code.toUpperCase()}
                  </span>
                </div>

                {/* Temperature */}
                <div className="flex items-center gap-1.5 text-[#888]">
                  <Thermometer className="w-3 h-3" />
                  <span className="font-mono text-xs">
                    {park.temperature}°F
                  </span>
                </div>

                {/* Alerts */}
                <div className="flex items-center gap-1.5">
                  {park.alert_count > 0 && (
                    <span
                      className="font-mono text-[0.65rem] px-1.5 py-0.5 rounded"
                      style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)" }}
                    >
                      {park.alert_count} alert{park.alert_count > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Status Badge */}
                <div
                  className="px-2.5 py-1 rounded-md text-[0.65rem] font-mono font-semibold tracking-wider"
                  style={{
                    color: config.color,
                    background: config.bg,
                    border: `1px solid ${config.border}`,
                  }}
                >
                  {config.label}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
