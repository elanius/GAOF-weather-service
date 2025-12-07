import datetime
import logging
from enum import StrEnum
from bson import ObjectId
from pydantic import BaseModel, Field, ValidationInfo, field_validator
from typing import Any, Optional

# from bson import ObjectId

logger = logging.getLogger(__name__)


class GeoPoint(BaseModel):
    lat: float
    lon: float


class ZoneType(StrEnum):
    EMPTY = "empty"
    WIND = "wind"
    RAIN = "rain"
    VISIBILITY = "visibility"
    TEMPERATURE = "temperature"
    AUTO_GROUP = "auto_group"
    # SPEED_LIMIT = "speed_limit"
    # ALTITUDE_LIMIT = "altitude_limit"
    # NO_FLY = "no_fly"


class ZoneBBox(BaseModel):
    south_west: GeoPoint
    north_east: GeoPoint


class Zone(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None, exclude_none=True, serialization_alias="_id")
    name: str
    zone_type: ZoneType
    bbox: ZoneBBox
    active: bool = True
    payload: Optional[Any] = None

    @field_validator("id", mode="before")
    def convert_objectid_to_str(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v

    @field_validator("payload", mode="before")
    def typecast_to_payload_type(cls, v, values: ValidationInfo):
        if v:
            fields = values.data
            if "zone_type" in fields and fields["zone_type"] in type_mapping:
                payload_class = type_mapping[fields["zone_type"]]
                return payload_class(**v) if isinstance(v, dict) else v
        return v

    def set_weather_payload(self, payload: dict):
        if self.zone_type == ZoneType.EMPTY or not payload:
            self.payload = None
        elif self.zone_type == ZoneType.WIND:
            self.payload = WindPayload(
                wind_speed=payload["wind"]["speed"],
                wind_direction=payload["wind"]["deg"],
            )
        elif self.zone_type == ZoneType.RAIN:
            self.payload = RainPayload(
                precipitation=payload["rain"]["1h"] if "rain" in payload else 0,
            )
        elif self.zone_type == ZoneType.VISIBILITY:
            self.payload = VisibilityPayload(
                distance=payload["visibility"],
            )
        elif self.zone_type == ZoneType.TEMPERATURE:
            self.payload = TemperaturePayload(
                temp=payload["main"]["temp"],
                temp_min=payload["main"]["temp_min"],
                temp_max=payload["main"]["temp_max"],
                pressure=payload["main"]["pressure"],
                humidity=payload["main"]["humidity"],
            )

        logging.info(f"Zone {self.name} updated with weather data: {self.payload}")


class WindPayload(BaseModel):
    wind_speed: float  # meter/second
    wind_direction: float


class RainPayload(BaseModel):
    precipitation: float  # mm/hour


class VisibilityPayload(BaseModel):
    distance: int  # meters


class TemperaturePayload(BaseModel):
    temp: float
    temp_min: float
    temp_max: float
    pressure: int
    humidity: int


class Threshold(BaseModel):
    limit: float
    condition: str


class AutoGroupPayload(BaseModel):
    sampling_size: int
    refresh_rate: int
    next_refresh: datetime.datetime = Field(default_factory=lambda: datetime.datetime.now())
    # threshold: dict[str, Threshold]
    sub_zone_type: ZoneType
    zones: list[Zone]


class CreateZoneRequest(BaseModel):
    zone_rect: list[float]
    zone_name: str
    zone_type: ZoneType


class AutoGroupRequest(BaseModel):
    name: str
    rect: list[float]
    sampling_size: int
    refresh_rate: int
    sub_zone_type: ZoneType


class LocalSituationRequest(BaseModel):
    lat: float
    lon: float
    width: int
    height: int
    sampling_size: int
    refresh_rate: int
    weather_types: list[ZoneType]


class Restriction(BaseModel):
    """
    Restriction defines condition when zone is activated.
    Activated zone means that conditions inside zone are not suitable for a drone.
    Evaluation of zone is done by comparing zone attribute in payload with limit.

        active = zone.payload[zone_attribute] (condition operator) limit
        e.g. active = zone.payload["precipitation"] > 2.5

    Attributes:
        name (str): The name of the zone attribute which is compared to limit.
        limit (float): The numerical limit associated with the restriction.
        condition (str): The condition under which the restriction applies.
    """

    name: str
    limit: float
    condition: str


type_mapping = {
    ZoneType.WIND: WindPayload,
    ZoneType.RAIN: RainPayload,
    ZoneType.VISIBILITY: VisibilityPayload,
    ZoneType.TEMPERATURE: TemperaturePayload,
    ZoneType.AUTO_GROUP: AutoGroupPayload,
}


def create_zone_bbox(zone_rect: list[float]) -> ZoneBBox:
    return ZoneBBox(
        south_west=GeoPoint(lat=zone_rect[0], lon=zone_rect[1]),
        north_east=GeoPoint(lat=zone_rect[2], lon=zone_rect[3]),
    )


def zone_factory(zone_id: str, zone_name: str, zone_type: ZoneType, zone_bbox: ZoneBBox, payload: dict = None) -> Zone:
    zone = Zone(
        id=zone_id,
        name=zone_name,
        zone_type=zone_type,
        bbox=zone_bbox,
    )

    if payload:
        zone.set_weather_payload(payload)

    return zone
