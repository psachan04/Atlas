import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv() # Loads variables from your .env file

if os.path.exists("/.dockerenv"):
    DATABASE_URL = "postgresql+psycopg2://atlas_admin:atlas123@db:5432/nps_db"
else:
    DATABASE_URL = "postgresql+psycopg2://atlas_admin:atlas123@localhost:8000/nps_db"

# The 'engine' is the actual connection to the DB
engine = create_engine(DATABASE_URL)

# The 'SessionLocal' is what we use to perform transactions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()