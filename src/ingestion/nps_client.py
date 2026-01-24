import httpx
import os
from dotenv import load_dotenv
from src.models.schemas import NPSResponse, AlertTable
from src.shared.database import SessionLocal

load_dotenv()
NPS_API_KEY = os.getenv("NPS_API_KEY")

def sync_alerts(park_code="zion"):
    # 1. Fetch from API
    url = "https://developer.nps.gov/api/v1/alerts"
    params = {"parkCode": park_code, "api_key": NPS_API_KEY}

    with httpx.Client() as client:
        response = client.get(url, params=params)
        response.raise_for_status()
        # Pass raw JSON into our Pydantic filter
        validated_data = NPSResponse(**response.json())

    # 2. Save to Postgres
    db = SessionLocal()
    try:
        for item in validated_data.data:
            # Idempotency: Only add if ID doesn't exist
            exists = db.query(AlertTable).filter(AlertTable.id == item.id).first()
            if not exists:
                new_row = AlertTable(
                    id=item.id,
                    park_code=item.parkCode,
                    title=item.title,
                    description=item.description,
                    category=item.category,
                    url=item.url
                )
                db.add(new_row)
        db.commit()
        print(f"Synced {len(validated_data.data)} alerts for Zion.")
    except Exception as e:
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    sync_alerts()