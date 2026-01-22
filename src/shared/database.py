import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv() # Loads variables from your .env file

DATABASE_URL = os.getenv("DATABASE_URL")

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