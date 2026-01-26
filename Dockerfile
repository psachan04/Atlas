# Use the same base image you have in your compose file
FROM apache/airflow:2.10.0-python3.11

USER root
# Install any system-level dependencies if needed
RUN apt-get update && apt-get install -y git && apt-get clean

USER airflow
# Install dbt-postgres directly into the airflow user environment
RUN pip install --no-cache-dir dbt-postgres
