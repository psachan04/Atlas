"use client";

import { Shield, Radio } from "lucide-react";

interface HeaderProps {
  fetchedAt: string;
}

export function Header({ fetchedAt }: HeaderProps) {
  const timestamp = fetchedAt
    ? new Date(fetchedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : "—";

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
      {/* Left: Branding */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)]">
          <Shield className="w-5 h-5 text-[#10b981]" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-[0.15em] uppercase text-[#e8e8e8]">
            NPS Command Center
          </h1>
          <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#707070] font-mono">
            Atlas Expedition Intelligence
          </p>
        </div>
      </div>

      {/* Right: Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.12)]">
          <div className="status-dot" />
          <span className="text-[0.7rem] font-mono font-medium tracking-wider uppercase text-[#10b981]">
            Live
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[#707070]">
          <Radio className="w-3.5 h-3.5" />
          <span className="text-[0.7rem] font-mono tracking-wider">
            {timestamp}
          </span>
        </div>
      </div>
    </header>
  );
}
