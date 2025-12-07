import math
import logging
from fastapi import APIRouter, HTTPException
from geopy.distance import geodesic
from bson import ObjectId

from app.types.zone_types import (
    AutoGroupPayload,
    AutoGroupRequest,
    CreateZoneRequest,
    LocalSituationRequest,
    Restriction,
    Zone,
    ZoneType,
    create_zone_bbox,
)
from app.client.weather import get_weather_by_bbox
from app.client.mongo import mongo_db
from app.zone_filters import filter_by_radius, filter_by_restrictions
from app.background import Background


logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/near_zones")
async def near_zones(lat: float, lon: float, radius: float, restrictions: list[Restriction] = []):
    """
    Find zones within a specified radius of a given latitude and longitude.

    Args:
        lat (float): The latitude of the point to search around.
        lon (float): The longitude of the point to search around.
        radius (float): The radius within which to search for zones in meters.
        restrictions (list[Restriction]): A list of restrictions to filter the zones.

    Returns:
        list: A list of zones that are within the specified radius of the given point,
              optionally filtered by the provided restrictions.
    """

    zones = await mongo_db.get_all_zones()
    expanded_zones: list[Zone] = []
    for zone in zones:
        if zone.zone_type == ZoneType.AUTO_GROUP:
            expanded_zones.extend(zone.payload.zones)
        else:
            expanded_zones.append(zone)

    zones_in_radius = filter_by_radius(expanded_zones, lat, lon, radius)
    if restrictions:
        return filter_by_restrictions(zones_in_radius, restrictions)
    else:
        return zones_in_radius


@router.get("/list_zones")
async def list_zones():
    """
    Retrieve a list of all zones.

    Returns:
        list: A list of all zones from the database.
    """

    out_zones = list()
    zones = await mongo_db.get_all_zones()
    for zone in zones:
        out_zones.append(zone.model_dump(exclude_none=True))

    return out_zones


@router.delete("/delete_zone")
async def delete_zone(zone_id: str):
    """
    Delete a zone by its ID.

    Args:
        zone_id (str): The ID of the zone to delete.

    Returns:
        dict: A dictionary with the status of the operation.
                If successful, returns {"status": "success"}.
                If an error occurs, returns {"status": "error", "message": str(e)}.
    """
    try:
        if await mongo_db.delete_zone(zone_id) is False:
            raise HTTPException(status_code=404, detail={"status": "error", "message": "Zone not found"})
    except Exception as e:
        logger.error("Error creating zone", exc_info=e)
        raise HTTPException(status_code=500, detail={"status": "error", "message": str(e)})

    return {"status": "success"}


@router.post("/create_zone")
async def create_zone(request: CreateZoneRequest):
    """
    Create a zone with specified parameters.

    Args:
        zone_rect (list[float]): A list of four floats representing the bounding box of the zone.
            The list should contain [south_west_lat, south_west_lon, north_east_lat, north_east_lon].
        zone_name (str): The name of the zone.
        zone_type (ZoneType): The type of the zone (wind, rain, fog).

    Returns:
        dict: A dictionary with the status of the operation and weather data.
              If successful, returns {"status": "success", "weather": weather_data}.
              If an error occurs, returns {"status": "error", "message": str(e)}.
    """

    try:
        weather = None
        zone_bbox = create_zone_bbox(request.zone_rect)
        if request.zone_type != ZoneType.EMPTY:
            weather = await get_weather_by_bbox(zone_bbox)

        zone = Zone(
            name=request.zone_name,
            zone_type=request.zone_type,
            bbox=zone_bbox,
        )

        zone.set_weather_payload(weather)

        new_zone = await mongo_db.insert_zone(zone)
        return new_zone.model_dump(exclude_none=True)

    except Exception as e:
        logger.error("Error creating zone", exc_info=e)
        raise HTTPException(status_code=500, detail={"status": "error", "message": str(e)})


@router.post("/create_auto_group_zone")
async def create_auto_group_zone(request: AutoGroupRequest):
    """
    Creates an auto group zone based on the provided request parameters.
    Validates the sampling size and refresh rate, ensuring they meet minimum requirements.
    Constructs a Zone object with the specified name, type, and bounding box.
    Generates an AutoGroupPayload containing sampling size, refresh rate, sub-zone type, and sub-zones.
    Inserts the new zone into the MongoDB database and triggers a background refresh of zones.
    Args:
        request (AutoGroupRequest): The request object containing zone creation parameters.
    Raises:
        HTTPException: If sampling size is less than 1000 or refresh rate is less than 600.
        HTTPException: For any other errors encountered during zone creation.
    Returns:
        Zone: The created zone object.
    """

    try:
        if request.sampling_size < 1000:
            raise HTTPException(
                status_code=400,
                detail={"status": "error", "message": "Sampling size must be greater than 1000."},
            )

        if request.refresh_rate < 600:
            raise HTTPException(
                status_code=400,
                detail={"status": "error", "message": "Refresh rate must be greater than 600."},
            )

        zone = Zone(
            name=request.name,
            zone_type=ZoneType.AUTO_GROUP,
            bbox=create_zone_bbox(request.rect),
        )

        payload = AutoGroupPayload(
            sampling_size=request.sampling_size,
            refresh_rate=request.refresh_rate,
            sub_zone_type=request.sub_zone_type,
            zones=create_sub_zones(request.name, request.sub_zone_type, request.rect, request.sampling_size),
        )

        zone.payload = payload
        await mongo_db.insert_zone(zone)

        Background.refresh_zones()

        return zone

    except Exception as e:
        logger.error("Error creating zone", exc_info=e)
        raise HTTPException(status_code=500, detail={"status": "error", "message": str(e)})


def create_sub_zones(zone_name: str, zone_type: ZoneType, rect: list[float], sampling_size: int) -> list[Zone]:
    # Calculate the width and height of the zone in meters
    width = geodesic((rect[0], rect[1]), (rect[0], rect[3])).meters
    height = geodesic((rect[0], rect[1]), (rect[2], rect[1])).meters

    # Calculate the number of rectangles along width and height
    num_rects_width = int(width / sampling_size) if width >= sampling_size else 1
    num_rects_height = int(height / sampling_size) if height >= sampling_size else 1

    # Create the set of rectangles
    rect_width = width / num_rects_width
    rect_height = height / num_rects_height

    zones = list()
    for i in range(num_rects_width):
        for j in range(num_rects_height):
            sw_lat = rect[0] + (j * rect_height / 111320)  # Convert meters to degrees
            sw_lon = rect[1] + (i * rect_width / (111320 * math.cos(math.radians(rect[0]))))
            ne_lat = sw_lat + (rect_height / 111320)
            ne_lon = sw_lon + (rect_width / (111320 * math.cos(math.radians(sw_lat))))
            zones.append(
                Zone(
                    _id=ObjectId(),
                    name=f"{zone_name}_{i}_{j}",
                    zone_type=zone_type,
                    bbox=create_zone_bbox([sw_lat, sw_lon, ne_lat, ne_lon]),
                    active=False,  # sub-zones are inactive by default
                )
            )

    return zones


@router.put("/edit_zone")
async def edit_zone(zone_id: str, zone_type: ZoneType, zone_name: str = ""):
    """
    Edit a zone by its ID.

    Args:
        zone_id (str): The ID of the zone to edit.
        zone_name (str): The new name of the zone.
        zone_type (ZoneType): The new type of the zone.

    Returns:
        dict: A dictionary with the status of the operation.
              If successful, returns {"status": "success"}.
              If an error occurs, returns {"status": "error", "message": str(e)}.
    """
    try:
        if (zone := await mongo_db.get_zone(zone_id)) is None:
            raise HTTPException(status_code=404, detail={"status": "error", "message": "Zone not found"})

        update = False
        if zone.name != zone_name:
            zone.name = zone_name
            update = True

        if zone.zone_type != zone_type:
            zone.zone_type = zone_type
            if zone.zone_type in {ZoneType.WIND, ZoneType.RAIN, ZoneType.VISIBILITY, ZoneType.TEMPERATURE}:
                weather = await get_weather_by_bbox(zone.bbox)
                zone.set_weather_payload(weather)
            update = True

        if update:
            if await mongo_db.update_zone(zone) is False:
                raise HTTPException(status_code=404, detail={"status": "error", "message": "Zone not found"})
    except Exception as e:
        logger.error("Error creating zone", exc_info=e)
        raise HTTPException(status_code=500, detail={"status": "error", "message": str(e)})

    return zone.model_dump(exclude_none=True)


@router.put("/refresh_zone")
async def refresh_zone(zone_id: str):
    """
    Refresh weather data for a zone by its ID.

    Args:
        zone_id (str): The ID of the zone to refresh.

    Returns:
        dict: A dictionary with the status of the operation and updated zone data.
                If successful, returns {"status": "success", "zone": zone}.
                If an error occurs, returns {"status": "error", "message": str(e)}.
    """
    try:
        if (zone := await mongo_db.get_zone(zone_id)) is None:
            return {"status": "error", "message": "Zone not found"}

        weather = await get_weather_by_bbox(zone.bbox)
        zone.set_weather_payload(weather)

        if await mongo_db.update_zone(zone) is False:
            return {"status": "error", "message": "Failed to update zone"}

    except Exception as e:
        logger.error("Error creating zone", exc_info=e)
        raise HTTPException(status_code=500, detail={"status": "error", "message": str(e)})

    return zone


@router.post("/local_situation")
async def local_situation(request: LocalSituationRequest):
    """
    Creates local weather situation zones based on the provided request parameters.
    Args:
        request (LocalSituationRequest): The request object containing location, dimensions, weather types, and other parameters.
    Returns:
        list: A list of created zone objects for each specified weather type.
    Raises:
        HTTPException: If invalid weather types are provided or if any error occurs during zone creation.
    Notes:
        - Validates that the requested weather types are supported.
        - Calculates a rectangular geographic area centered at the specified latitude and longitude.
        - For each weather type, creates a zone using the calculated rectangle and request parameters.
    """

    try:
        # Validate weather types
        valid_weather_types = {ZoneType.WIND, ZoneType.RAIN, ZoneType.VISIBILITY, ZoneType.TEMPERATURE}
        if not set(request.weather_types).issubset(valid_weather_types):
            raise HTTPException(
                status_code=400,
                detail={"status": "error", "message": "Invalid weather types provided."},
            )

        # Calculate rectangle bounds
        half_width_deg = (request.width / 2) / (111320 * math.cos(math.radians(request.lat)))
        half_height_deg = (request.height / 2) / 111320
        rect = [
            request.lat - half_height_deg,
            request.lon - half_width_deg,
            request.lat + half_height_deg,
            request.lon + half_width_deg,
        ]

        created_zones = []
        for weather_type in request.weather_types:
            zone_name = f"local_{weather_type.value}"
            request = AutoGroupRequest(
                name=zone_name,
                rect=rect,
                sampling_size=request.sampling_size,
                refresh_rate=request.refresh_rate,
                sub_zone_type=weather_type,
            )
            created_zone = await create_auto_group_zone(request)
            created_zones.append(created_zone)

        return created_zones

    except Exception as e:
        logger.error("Error creating local situation zones", exc_info=e)
        raise HTTPException(status_code=500, detail={"status": "error", "message": str(e)})
