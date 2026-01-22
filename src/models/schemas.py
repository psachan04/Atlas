from pydantic import BaseModel, Field
from typing import Optional, List
from sqlalchemy import Column, String, Text, DateTime, Integer
from sqlalchemy.orm import declarative_base
from datetime import datetime

# Defines the table structure in PostgreSQL.
Base = declarative_base()

class AlertTable(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True)  # NPS provides a unique UUID
    park_code = Column(String, index=True)
    title = Column(String)
    description = Column(Text)
    category = Column(String)
    url = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)

# Checks the data coming in from the API before it hits the DB.
class NPSAlert(BaseModel):
    id: str
    parkCode: str
    title: str
    description: str
    category: str
    url: Optional[str] = None

class NPSResponse(BaseModel):
    """The NPS API always returns a dictionary with a 'data' list."""
    data: List[NPSAlert]

class WeatherTable(Base):
    __tablename__ = "weather_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    park_code = Column(String, index=True)
    forecast_date = Column(DateTime)
    temperature = Column(Integer)
    wind_speed = Column(String)
    short_forecast = Column(String)
    extracted_at = Column(DateTime, default=datetime.utcnow)

# --- Add this to your Pydantic Models ---
class WeatherPeriod(BaseModel):
    startTime: datetime
    temperature: int
    windSpeed: str
    shortForecast: str

class WeatherForecastResponse(BaseModel):
    properties: dict  # Extract the 'periods' list from this dict