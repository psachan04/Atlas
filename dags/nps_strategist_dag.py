import sys
import os
from pathlib import Path
from datetime import datetime, timedelta, time

# Add the root directory to sys.path so Airflow can find your 'src' folder
sys.path.append("/opt/airflow")

from airflow.decorators import dag, task
from src.ingestion.nps_client import sync_alerts
from src.ingestion.weather_client import sync_weather
import subprocess
import psycopg2

default_args = {
    'owner': 'atlas',
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}


@dag(
    dag_id='nps_expedition_planner',
    default_args=default_args,
    description='Sync NPS alerts, weather for all 63 National Parks, run dbt, and generate embeddings',
    schedule_interval='@hourly',
    start_date=datetime(2025, 1, 1),
    catchup=False,
    tags=['nps', 'analytics', 'rangergpt'],
)
def nps_expedition_planner():
    @task()
    def get_active_parks():
        """Fetch list of all active parks from dim_parks table"""
        # Use direct psycopg2 connection (works in Airflow container)
        conn = psycopg2.connect(
            host="db",
            port=5432,
            database="nps_db",
            user="atlas_admin",
            password="atlas123"
        )

        with conn.cursor() as cur:
            cur.execute("""
                        SELECT park_code, full_name, latitude, longitude
                        FROM dim_parks
                        WHERE is_active = TRUE
                        ORDER BY park_code
            """)
            parks = cur.fetchall()

        conn.close()

        print(f"Found {len(parks)} active parks to process")
        return [
            {
                'park_code': row[0],
                'full_name': row[1],
                'latitude': float(row[2]) if row[2] else None,
                'longitude': float(row[3]) if row[3] else None
            }
            for row in parks
        ]

    @task()
    def ingest_nps_alerts(parks):
        """Ingest NPS alerts for all parks"""
        successful = 0
        failed = 0

        for park in parks:
            try:
                print(f"Fetching alerts for {park['full_name']} ({park['park_code']})...")
                sync_alerts(park['park_code'])
                successful += 1
                time.sleep(1)
            except Exception as e:
                print(f"Failed to fetch alerts for {park['park_code']}: {e}")
                failed += 1

        print(f"✓ Alerts ingestion complete: {successful} succeeded, {failed} failed")
        return {'successful': successful, 'failed': failed}

    @task()
    def ingest_weather_data(parks):
        """Ingest weather data for all parks with coordinates"""
        successful = 0
        failed = 0
        skipped = 0

        for park in parks:
            if park['latitude'] is None or park['longitude'] is None:
                print(f"Skipping {park['park_code']} - no coordinates")
                skipped += 1
                continue

            try:
                print(f"Fetching weather for {park['full_name']} ({park['park_code']})...")
                sync_weather(park['park_code'], park['latitude'], park['longitude'])
                successful += 1
            except Exception as e:
                print(f"Failed to fetch weather for {park['park_code']}: {e}")
                failed += 1

        print(f"✓ Weather ingestion complete: {successful} succeeded, {failed} failed, {skipped} skipped")
        return {'successful': successful, 'failed': failed, 'skipped': skipped}

    @task()
    def run_dbt_transform():
        """Run dbt transformations"""
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
        return "dbt run completed successfully"

    @task()
    def generate_embeddings():
        """Generate embeddings for new alerts using RangerGPT"""
        result = subprocess.run(
            [
                "docker", "exec", "nps_rangergpt",
                "python", "-m", "src.rangergpt.embedding_generator", "backfill"
            ],
            capture_output=True, text=True
        )

        if result.returncode != 0:
            print(f"Warning: Embedding generation had issues: {result.stderr}")
            print(result.stdout)
        else:
            print(result.stdout)

        return "Embedding generation attempted"

    # Define the workflow
    parks = get_active_parks()

    # Ingest data in parallel
    alerts_result = ingest_nps_alerts(parks)
    weather_result = ingest_weather_data(parks)

    # Run transformations after both ingestions complete
    dbt_result = run_dbt_transform()

    # Generate embeddings after transformations
    embeddings_result = generate_embeddings()

    # Set dependencies
    [alerts_result, weather_result] >> dbt_result >> embeddings_result


nps_expedition_planner()