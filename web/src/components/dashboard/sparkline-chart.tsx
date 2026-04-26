"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import type { WeatherPoint } from "@/lib/queries";

interface SparklineChartProps {
  data: WeatherPoint[];
}

export function SparklineChart({ data }: SparklineChartProps) {
  const chartData = data.map((d) => ({
    date: new Date(d.forecast_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    temp: d.temperature,
    forecast: d.short_forecast,
  }));

  const avgTemp =
    chartData.length > 0
      ? Math.round(
          chartData.reduce((a, b) => a + b.temp, 0) / chartData.length
        )
      : 0;

  // Determine chart color based on average temp
  const chartColor =
    avgTemp > 50 ? "#10b981" : avgTemp > 32 ? "#f59e0b" : "#ef4444";
  const chartColorFaded =
    avgTemp > 50
      ? "rgba(16,185,129,0.15)"
      : avgTemp > 32
        ? "rgba(245,158,11,0.15)"
        : "rgba(239,68,68,0.15)";

  return (
    <div
      className="bento-card p-5 animate-fade-in-up"
      style={{ animationDelay: "200ms" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[0.7rem] font-mono font-medium tracking-[0.15em] uppercase text-[#707070]">
            Temperature Trend
          </span>
          <TrendingUp className="w-3.5 h-3.5 text-[#555]" />
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className="font-mono text-lg font-bold"
            style={{ color: chartColor }}
          >
            {avgTemp}
          </span>
          <span className="font-mono text-xs text-[#555]">°F avg</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[160px]">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#555] font-mono text-sm">
            No weather data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="tempGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop
                    offset="100%"
                    stopColor={chartColor}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 10,
                  fontFamily: "JetBrains Mono",
                  fill: "#555",
                }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 10,
                  fontFamily: "JetBrains Mono",
                  fill: "#555",
                }}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  background: "#1a1a1a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  fontFamily: "JetBrains Mono",
                  fontSize: "12px",
                  color: "#e8e8e8",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }}
                labelStyle={{ color: "#707070", marginBottom: "4px" }}
                formatter={(value) => [`${value}°F`, "Temp"]}
              />
              <Area
                type="monotone"
                dataKey="temp"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#tempGradient)"
                dot={{
                  r: 3,
                  fill: chartColor,
                  stroke: "#141414",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 5,
                  fill: chartColor,
                  stroke: chartColorFaded,
                  strokeWidth: 8,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
