from pydantic import BaseModel, Field
from typing import Optional, List
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.orm import declarative_base
from datetime import datetime

# --- DATABASE MODEL (The Vault) ---
# This defines the table structure in PostgreSQL.
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

# --- VALIDATION MODELS (The Filter) ---
# This checks the data coming in from the API before it hits the DB.
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