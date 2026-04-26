import { query } from "./db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HikeReadiness {
  park_code: string;
  forecast_date: string;
  temperature: number;
  short_forecast: string;
  alert_count: number;
  readiness_status: "Ready" | "Danger" | "Proceed with Caution";
  calculated_at: string;
}

export interface Alert {
  id: string;
  park_code: string;
  title: string;
  description: string;
  category: string;
  url: string | null;
  updated_at: string;
}

export interface WeatherPoint {
  forecast_date: string;
  temperature: number;
  short_forecast: string;
  extracted_at: string;
}

export interface ReadinessStats {
  total_parks: number;
  ready_count: number;
  caution_count: number;
  danger_count: number;
  ready_pct: number;
  avg_temperature: number;
  total_alerts: number;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch all rows from fct_hike_readiness (materialized by dbt).
 */
export async function getHikeReadiness(): Promise<HikeReadiness[]> {
  return query<HikeReadiness>(`
    SELECT
      park_code,
      forecast_date,
      temperature,
      short_forecast,
      alert_count,
      readiness_status,
      calculated_at
    FROM fct_hike_readiness
    ORDER BY readiness_status DESC, park_code ASC
  `);
}

/**
 * Aggregate stats across all parks for KPI cards.
 */
export async function getReadinessStats(): Promise<ReadinessStats> {
  const rows = await query<ReadinessStats>(`
    SELECT
      COUNT(*)::int as total_parks,
      COUNT(*) FILTER (WHERE readiness_status = 'Ready')::int as ready_count,
      COUNT(*) FILTER (WHERE readiness_status = 'Proceed with Caution')::int as caution_count,
      COUNT(*) FILTER (WHERE readiness_status = 'Danger')::int as danger_count,
      ROUND(
        (COUNT(*) FILTER (WHERE readiness_status = 'Ready')::numeric / NULLIF(COUNT(*), 0)) * 100
      )::int as ready_pct,
      ROUND(AVG(temperature))::int as avg_temperature,
      SUM(alert_count)::int as total_alerts
    FROM fct_hike_readiness
  `);
  return (
    rows[0] || {
      total_parks: 0,
      ready_count: 0,
      caution_count: 0,
      danger_count: 0,
      ready_pct: 0,
      avg_temperature: 0,
      total_alerts: 0,
    }
  );
}

/**
 * Fetch the latest 50 active alerts ordered by most recent.
 */
export async function getActiveAlerts(): Promise<Alert[]> {
  return query<Alert>(`
    SELECT
      id,
      park_code,
      title,
      description,
      category,
      url,
      updated_at
    FROM alerts
    WHERE category != 'Information'
    ORDER BY updated_at DESC
    LIMIT 50
  `);
}

/**
 * Fetch weather history for sparkline (last 3 days, all parks).
 */
export async function getWeatherTrend(): Promise<WeatherPoint[]> {
  return query<WeatherPoint>(`
    SELECT
      forecast_date,
      ROUND(AVG(temperature))::int as temperature,
      MODE() WITHIN GROUP (ORDER BY short_forecast) as short_forecast,
      MAX(extracted_at) as extracted_at
    FROM weather_history
    WHERE extracted_at >= NOW() - INTERVAL '3 days'
    GROUP BY forecast_date
    ORDER BY forecast_date ASC
  `);
}
