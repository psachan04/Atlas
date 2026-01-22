"""
NPS Expedition Planner DAG
--------------------------
Orchestrates the National Park "Hike Strategist" data pipeline:
1. Ingest alerts from NPS API
2. Ingest weather forecasts from weather.gov
3. Run dbt to build fct_hike_readiness
"""

from datetime import datetime
from airflow.decorators import dag, task
from airflow.operators.bash import BashOperator


@dag(
    dag_id="nps_expedition_planner",
    start_date=datetime(2024, 1, 1),
    schedule="@daily",
    catchup=False,
    tags=["nps", "hiking", "weather"],
)
def nps_expedition_planner():
    """
    Pipeline to ingest NPS alerts, weather data, and transform into hike readiness facts.
    """

    @task()
    def ingest_nps_alerts():
        """Fetch Zion National Park alerts from NPS API."""
        from src.ingestion.nps_client import sync_zion_alerts
        sync_zion_alerts()
        return "NPS alerts synced"

    @task()
    def ingest_weather():
        """Fetch weather forecast for Zion from weather.gov."""
        from src.ingestion.weather_client import sync_weather, ZION_LAT, ZION_LON
        sync_weather("zion", ZION_LAT, ZION_LON)
        return "Weather data synced"

    # dbt transformation task using BashOperator
    run_dbt = BashOperator(
        task_id="run_dbt_transform",
        bash_command="cd /opt/airflow/transform && dbt run --profiles-dir . --select fct_hike_readiness",
    )

    # Define task dependencies: ingest in parallel, then transform
    [ingest_nps_alerts(), ingest_weather()] >> run_dbt


# Instantiate the DAG
nps_expedition_planner()
