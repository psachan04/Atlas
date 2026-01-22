import httpx
from datetime import datetime
from src.models.schemas import WeatherTable
from src.shared.database import SessionLocal

# Zion Coordinates
ZION_LAT = 37.2982
ZION_LON = -113.0263


def sync_weather(park_code: str, lat: float, lon: float):
    headers = {"User-Agent": "Atlas-Project (prajavalsachan239@gmail.com)"}

    with httpx.Client(headers=headers) as client:
        # Step 1: Get the forecast URL for these coordinates
        points_url = f"https://api.weather.gov/points/{lat},{lon}"
        points_res = client.get(points_url)
        points_res.raise_for_status()
        forecast_url = points_res.json()["properties"]["forecast"]

        # Step 2: Get the actual 3-day forecast
        forecast_res = client.get(forecast_url)
        forecast_res.raise_for_status()
        periods = forecast_res.json()["properties"]["periods"]

    # Step 3: Save to DB
    db = SessionLocal()
    try:
        for p in periods[:6]:  # Get the next ~3 days (6 periods of day/night)
            new_weather = WeatherTable(
                park_code=park_code,
                forecast_date=datetime.fromisoformat(p["startTime"]),
                temperature=p["temperature"],
                wind_speed=p["windSpeed"],
                short_forecast=p["shortForecast"]
            )
            db.add(new_weather)
        db.commit()
        print(f" Success: Synced {len(periods[:6])} weather periods for {park_code}.")
    finally:
        db.close()


if __name__ == "__main__":
    sync_weather("zion", ZION_LAT, ZION_LON)