# Project Atlas: AI Instructions

## Tech Stack
- **Orchestrator:** Apache Airflow (Dockerized)
- **Data Layer:** PostgreSQL with dbt (Medallion Architecture: Bronze/Silver/Gold)
- **Dependency Manager:** uv

## Critical Environment Rules
- **Database URLs:** Use `src/shared/database.py` for all connections. It handles the "Smart Routing" between internal `db:5432` and external `localhost:8000`.
- **Imports:** Always include `__init__.py` in new subdirectories to maintain the `src` package structure.
- **dbt Execution:** Run dbt commands via the Airflow BashOperator or inside the container using `docker exec`.

## Guardrails
- Never hardcode API keys; use the `.env` file.
- Do not modify `docker-compose.yaml` without verifying port mappings.