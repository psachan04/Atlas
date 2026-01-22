import httpx
import os
from dotenv import load_dotenv
from src.models.schemas import NPSResponse

load_dotenv()

NPS_API_KEY = os.getenv("NPS_API_KEY")
BASE_URL = "https://developer.nps.gov/api/v1/alerts"


def fetch_park_alerts(park_code: str):
    params = {
        "parkCode": park_code,
        "api_key": NPS_API_KEY
    }

    with httpx.Client() as client:
        response = client.get(BASE_URL, params=params)
        response.raise_for_status()  # Raise error if API is down

        # Validate data against our schema
        validated_data = NPSResponse(**response.json())
        return validated_data.data


if __name__ == "__main__":
    # Test it with Zion (ZION)
    alerts = fetch_park_alerts("zion")
    for alert in alerts:
        print(f"[{alert.category}] {alert.title}")