{{ config(materialized='table') }}

with weather as (
    select * from {{ source('public', 'weather_history') }}
)
select
    park_code,
    forecast_date,
    temperature,
    short_forecast,
    case
        when short_forecast ilike '%Sunny%' then 100
        when short_forecast ilike '%Cloudy%' then 80
        when short_forecast ilike '%Rain%' then 40
        else 60
    end as readiness_score
from weather