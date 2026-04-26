"use server";

import {
  getHikeReadiness,
  getReadinessStats,
  getActiveAlerts,
  getWeatherTrend,
} from "@/lib/queries";
import type {
  HikeReadiness,
  ReadinessStats,
  Alert,
  WeatherPoint,
} from "@/lib/queries";

export interface DashboardData {
  stats: ReadinessStats;
  readiness: HikeReadiness[];
  alerts: Alert[];
  weatherTrend: WeatherPoint[];
  fetchedAt: string;
}

/**
 * Fetch all dashboard data in a single server action.
 * Queries run in parallel for speed.
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  try {
    const [stats, readiness, alerts, weatherTrend] = await Promise.all([
      getReadinessStats(),
      getHikeReadiness(),
      getActiveAlerts(),
      getWeatherTrend(),
    ]);

    return {
      stats,
      readiness,
      alerts,
      weatherTrend,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return {
      stats: {
        total_parks: 0,
        ready_count: 0,
        caution_count: 0,
        danger_count: 0,
        ready_pct: 0,
        avg_temperature: 0,
        total_alerts: 0,
      },
      readiness: [],
      alerts: [],
      weatherTrend: [],
      fetchedAt: new Date().toISOString(),
    };
  }
}
