import sys
import os
from pathlib import Path
from datetime import datetime, timedelta

# Add the root directory to sys.path so Airflow can find your 'src' folder
sys.path.append("/opt/airflow")

from airflow.decorators import dag, task
from src.ingestion.nps_client import sync_alerts
from src.ingestion.weather_client import sync_weather
import subprocess

default_args = {
    'owner': 'atlas',
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

@dag(
    dag_id='nps_expedition_planner',
    default_args=default_args,
    description='Sync NPS alerts, weather, and run dbt transformations',
    schedule_interval='@daily',
    start_date=datetime(2025, 1, 1),
    catchup=False,
    tags=['nps', 'analytics'],
)
def nps_expedition_planner():

    @task()
    def ingest_nps_data():
        # Using Zion (ZION) as our primary test park
        sync_alerts("zion")

    @task()
    def ingest_weather_data():
        # Zion coordinates
        sync_weather("zion", 37.2982, -113.0263)

    @task()
    def run_dbt_transform():
        import os
        import subprocess
        # Run dbt inside the container
        result = subprocess.run(
            [
                "dbt", "run",
                "--profiles-dir", "/opt/airflow/transform",
                "--project-dir", "/opt/airflow/transform",
                "--target", "docker"
            ],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            print(result.stdout)
            raise Exception(f"dbt failed: {result.stderr}")
        print(result.stdout)

    # Define the sequence
    ingest_nps_data() >> ingest_weather_data() >> run_dbt_transform()

nps_expedition_planner()