# Project Atlas: AI Agent Instructions

## Project Overview

**Atlas** is an end-to-end data + AI system that acts as a personal expedition strategist for U.S. National Parks. It ingests live park alerts and weather data, transforms it into actionable insights using the Medallion Architecture, and enables natural-language queries via **RangerGPT** (a RAG-based AI assistant).

---

## Tech Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| **Orchestrator** | Apache Airflow 2.10.0 | Dockerized, LocalExecutor |
| **Database** | PostgreSQL 16 + pgvector | Vector similarity search for RAG |
| **Transformations** | dbt-postgres 1.10+ | Medallion Architecture |
| **Dependency Manager** | uv | Fast Python package management |
| **AI/LLM** | Google Gemini | Embeddings + chat completion |
| **Containerization** | Docker Compose | Multi-service orchestration |

---

## Medallion Architecture

### Layer Definitions

| Layer | Location | Purpose |
|-------|----------|---------|
| **Bronze** | `alerts`, `weather_history` tables | Raw ingested data from NPS & Weather APIs |
| **Silver** | `transform/models/staging/` | Cleaned, validated, source-aligned data |
| **Gold** | `transform/models/marts/` | Business logic, aggregations, ready for consumption |

### dbt Models Location

All dbt models MUST be stored in:
```
transform/models/
├── staging/          # Silver layer - source definitions & cleaning
│   └── sources.yml   # Defines bronze sources
├── marts/            # Gold layer - business logic
│   └── fct_hike_readiness.sql
└── example/          # Reference models (can be removed)
```

### Current Models

- **`fct_hike_readiness`**: Computes park readiness status by joining weather + alerts
  - "Ready": Temp > 50°F AND no critical alerts
  - "Danger": More than 2 active alerts
  - "Proceed with Caution": Default

---

## Smart Database URL Routing

**File**: `src/shared/database.py`

This module detects execution context and routes to the correct database address:

```python
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Smart Routing: Detect if running inside Docker container
if os.path.exists("/.dockerenv"):
    # Inside Docker container - use internal network hostname
    DATABASE_URL = "postgresql+psycopg2://atlas_admin:atlas123@db:5432/nps_db"
else:
    # Running on local machine - use exposed port
    DATABASE_URL = "postgresql+psycopg2://atlas_admin:atlas123@localhost:8000/nps_db"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Why This Matters

- **Inside containers** (Airflow, RangerGPT): Use `db:5432` (Docker network hostname)
- **Local development**: Use `localhost:8000` (exposed port from docker-compose)
- **NEVER hardcode** `localhost` in code that runs inside containers

---

## Commands Reference

### Docker Compose

```bash
# Start all services (PostgreSQL, Airflow, RangerGPT)
docker compose up -d

# Start with rebuild
docker compose up -d --build

# View logs
docker compose logs -f airflow
docker compose logs -f db
docker compose logs -f rangergpt

# Stop all services
docker compose down

# Stop and remove volumes (DESTRUCTIVE - clears database)
docker compose down -v
```

### dbt Commands

```bash
# From LOCAL machine (uses profiles.yml 'dev' target)
cd transform && dbt run --profiles-dir .

# Inside Airflow container (uses 'docker' target)
docker exec -it nps_airflow bash -c "cd /opt/airflow/transform && dbt run --profiles-dir . --target docker"

# Run specific model
docker exec -it nps_airflow bash -c "cd /opt/airflow/transform && dbt run --select fct_hike_readiness --profiles-dir . --target docker"

# Test models
docker exec -it nps_airflow bash -c "cd /opt/airflow/transform && dbt test --profiles-dir . --target docker"

# Generate docs
docker exec -it nps_airflow bash -c "cd /opt/airflow/transform && dbt docs generate --profiles-dir . --target docker"
```

### Airflow DAG Operations

```bash
# Access Airflow UI
open http://localhost:8080
# Credentials: admin / admin

# Trigger DAG manually via CLI
docker exec -it nps_airflow airflow dags trigger nps_expedition_planner

# List DAGs
docker exec -it nps_airflow airflow dags list

# Check DAG status
docker exec -it nps_airflow airflow dags state nps_expedition_planner <execution_date>

# Pause/Unpause DAG
docker exec -it nps_airflow airflow dags pause nps_expedition_planner
docker exec -it nps_airflow airflow dags unpause nps_expedition_planner
```

### RangerGPT Operations

```bash
# Run interactive chat
docker exec -it nps_rangergpt python -m src.rangergpt.chat

# Backfill embeddings
docker exec -it nps_rangergpt python -c "from src.rangergpt.embedding_generator import backfill_embeddings; backfill_embeddings()"

# Test similarity search
docker exec -it nps_rangergpt python -c "from src.rangergpt.embedding_generator import test_similarity_search; test_similarity_search('fire danger')"
```

### Database Operations

```bash
# Connect to PostgreSQL
docker exec -it nps_postgres psql -U atlas_admin -d nps_db

# Run migrations
docker exec -it nps_rangergpt python scripts/run_migrations.py

# Setup tables (SQLAlchemy)
docker exec -it nps_rangergpt python scripts/setup_db.py
```

### uv Package Management

```bash
# Sync dependencies
uv sync

# Add new package
uv add <package-name>

# Run Python with uv
uv run python main.py
```

---

## Project Structure

```
Atlas/
├── .claude/agents/           # Sub-agent configurations
├── dags/                     # Airflow DAGs
│   └── nps_strategist_dag.py
├── src/
│   ├── ingestion/           # API clients (NPS, Weather)
│   ├── models/              # SQLAlchemy/Pydantic schemas
│   ├── rangergpt/           # RAG AI assistant
│   └── shared/              # Shared utilities (database.py)
├── transform/               # dbt project
│   ├── models/              # Bronze/Silver/Gold models
│   ├── migrations/          # SQL migrations
│   ├── dbt_project.yml
│   └── profiles.yml
├── scripts/                 # Database utilities
├── docker-compose.yaml
├── Dockerfile               # Airflow image
├── Dockerfile.rangergpt     # RangerGPT image
├── .env                     # Environment variables
└── pyproject.toml          # Python project config
```

---

## Guardrails

1. **Never hardcode API keys** - Use `.env` file exclusively
2. **Never modify `docker-compose.yaml`** without verifying port mappings
3. **Always use `src/shared/database.py`** for database connections
4. **Always include `__init__.py`** in new subdirectories under `src/`
5. **dbt models go in `transform/models/`** following medallion conventions
6. **Test dbt changes** with `dbt run --select <model>` before committing

---

## DAG Workflow

The `nps_expedition_planner` DAG runs daily:

```
get_active_parks()
       │
       ▼
┌──────┴──────┐
▼             ▼
ingest_nps    ingest_weather
_alerts()     _data()
│             │
└──────┬──────┘
       ▼
run_dbt_transform()
       │
       ▼
generate_embeddings()
```

---

## Port Mappings

| Service | Container Port | Host Port | URL |
|---------|---------------|-----------|-----|
| PostgreSQL | 5432 | 8000 | `localhost:8000` |
| Airflow | 8080 | 8080 | `http://localhost:8080` |

---

## Environment Variables

Required in `.env`:
```
NPS_API_KEY=<your-nps-api-key>
GEMINI_API_KEY=<your-gemini-api-key>
DATABASE_URL=postgresql://atlas_admin:atlas123@localhost:8000/nps_db
```

Container-specific (set in docker-compose.yaml):
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
