# Project Atlas - Claude Code Configuration

See @AGENTS.md for complete project rules, architecture, and commands.

## Quick Reference

- **Project**: NPS Expedition Strategist with RangerGPT AI Assistant
- **Architecture**: Medallion (Bronze/Silver/Gold) with pgvector for RAG
- **Orchestration**: Apache Airflow in Docker

## Critical Rules

1. **Database Connections**: ALWAYS use `src/shared/database.py` - never hardcode connection strings
2. **API Keys**: Use `.env` file exclusively - never commit secrets
3. **dbt Commands**: Execute via `docker exec` or Airflow BashOperator
4. **Package Structure**: Include `__init__.py` in all new subdirectories under `src/`

## Sub-Agents

See `.claude/agents/` for specialized agents:
- `data-engineer.md` - Handles dbt transformations and medallion layer modeling
