import os
import httpx
import logging
from fastapi import HTTPException
from app.types.zone_types import ZoneBBox

logger = logging.getLogger(__name__)

OPEN_WEATHER_API_KEY = os.getenv("OPEN_WEATHER_API_KEY")


async def get_weather_by_bbox(bbox: ZoneBBox):
    mid_lat = (bbox.south_west.lat + bbox.north_east.lat) / 2
    mid_lon = (bbox.south_west.lon + bbox.north_east.lon) / 2

    return await get_weather_by_coordinates(mid_lat, mid_lon)


async def get_weather_by_coordinates(lat: float, lon: float):
    if not OPEN_WEATHER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenWeather API key not found")

    url = (
        f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={OPEN_WEATHER_API_KEY}"
    )
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        logging.info(f"GET {url} - {response.status_code}")

    response.raise_for_status()

    return response.json()
