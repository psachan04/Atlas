from src.shared.database import engine
from src.models.schemas import Base

def initialize_database():
    print("Connecting")
    # This looks for all classes inheriting from 'Base' and creates them
    Base.metadata.create_all(bind=engine)
    print("Success")

if __name__ == "__main__":
    initialize_database()