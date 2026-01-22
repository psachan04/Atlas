# FieldGuide 🌲

**FieldGuide** is an end-to-end data + AI system that acts as a personal expedition strategist for visiting U.S. National Parks.

The goal of this project is to **learn how to design and build a production-style data pipeline**—from raw data ingestion to AI-powered decision support—using modern data engineering tools.

---

## 🧠 Project Vision

FieldGuide goes beyond a static list of parks. It continuously ingests live park alerts and weather data, transforms it into actionable insights, and allows natural-language questions like:

> *“Based on current alerts in Zion and the 3-day forecast, what is the best window for a 10-mile hike?”*

---

## 🏗️ Architecture Overview

**Extract**
- Python API clients
- National Park Service (NPS) API (alerts, visitor centers, park news)
- Weather API (forecast + historical data)

**Load**
- PostgreSQL database
- Schema-on-write design

**Transform**
- dbt models
- Join weather + alerts
- Compute a **Ready-to-Hike score**

**Orchestration**
- Apache Airflow
- Dockerized setup
- Daily scheduled pipelines

**AI Layer**
- Retrieval-Augmented Generation (RAG)
- LLM queries structured data
- Natural-language recommendations based on real conditions

---

## 🧪 Project Status

🚧 **In Progress**

Current focus:
- Environment setup on macOS
- Understanding system architecture
- Building each component step-by-step

---

## 🎯 Learning Goals

- Design a real-world ETL pipeline
- Work with APIs and structured data ingestion
- Use dbt for analytics engineering
- Orchestrate workflows with Airflow + Docker
- Build a basic RAG system on top of a relational database
- Think like a data + ML engineer, not just write code

---

## 📚 Documentation & References

Documentation links and learning notes will be added progressively as each component is implemented.

---

## 📌 Notes

This project prioritizes **clarity, correctness, and learning** over premature optimization.  
The system is designed to be simple first, scalable later.

