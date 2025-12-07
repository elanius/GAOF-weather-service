import os
import requests
from fastapi import APIRouter, HTTPException

router = APIRouter()

OPEN_WEATHER_API_KEY = os.getenv("OPEN_WEATHER_API_KEY")


# example
# http://127.0.0.1:8001/weather?lat=40.4774&lon=-74.2591
@router.get("/weather")
def get_weather(lat: float, lon: float):
    if not OPEN_WEATHER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenWeather API key not found")

    url = (
        f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={OPEN_WEATHER_API_KEY}"
    )
    response = requests.get(url)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json())

    return response.json()


# example
# http://127.0.0.1:8001/weather_zone?lon_left=-74.2591&lat_bottom=40.4774&lon_right=-73.7002&lat_top=40.9176
@router.get("/weather_zone")
def get_weather_zone(lon_left: float, lat_bottom: float, lon_right: float, lat_top: float):
    if not OPEN_WEATHER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenWeather API key not found")

    zoom = 10
    bbox = f"{lon_left},{lat_bottom},{lon_right},{lat_top},{zoom}"

    url = f"https://api.openweathermap.org/data/2.5/box/city?bbox={bbox}&appid={OPEN_WEATHER_API_KEY}"
    response = requests.get(url)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json())

    return response.json()
