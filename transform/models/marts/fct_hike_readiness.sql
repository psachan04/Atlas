{{ config(materialized='table') }}

WITH latest_weather AS (
    SELECT
        park_code,
        forecast_date,
        temperature,
        short_forecast,
        extracted_at
    FROM {{ source('public', 'weather_history') }}
    WHERE extracted_at = (SELECT MAX(extracted_at) FROM {{ source('public', 'weather_history') }})
),

active_alerts AS (
    SELECT
        park_code,
        COUNT(*) as alert_count
    FROM {{ source('public', 'alerts') }}
    WHERE category != 'Information'
    GROUP BY 1
)

SELECT
    w.park_code,
    w.forecast_date,
    w.temperature,
    w.short_forecast,
    COALESCE(a.alert_count, 0) as alert_count,
    -- Simple logic: High temp and low alerts = High readiness
    CASE
        WHEN w.temperature > 50 AND COALESCE(a.alert_count, 0) = 0 THEN 'Ready'
        WHEN COALESCE(a.alert_count, 0) > 2 THEN 'Danger'
        ELSE 'Proceed with Caution'
    END as readiness_status,
    CURRENT_TIMESTAMP as calculated_at
FROM latest_weather w
LEFT JOIN active_alerts a ON w.park_code = a.park_code