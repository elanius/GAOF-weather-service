from typing import Callable
from geopy.distance import geodesic
from app.types.zone_types import Restriction, Zone


def filter_by_radius(zones: list[Zone], lat: float, lon: float, radius: float) -> list[Zone]:
    """
    Filters a list of zones by a given radius from a point (lat, lon).
    """
    filtered_zones = []
    for zone in zones:
        if is_zone_in_radius(zone, lat, lon, radius):
            filtered_zones.append(zone)
    return filtered_zones


def filter_by_restrictions(zones: list[Zone], restrictions: list[Restriction]) -> list[Zone]:
    filtered_zones = []

    for zone in zones:
        for restriction in restrictions:
            eval_func = get_eval_function(restriction.condition)
            if hasattr(zone.payload, restriction.name):
                if eval_func(getattr(zone.payload, restriction.name), restriction.limit) is True:
                    filtered_zones.append(zone)
                    break

    return filtered_zones


def get_eval_function(condition: str) -> Callable[[float, float], bool]:
    """
    Returns a function that evaluates a condition.
    """
    if condition == ">":
        return lambda x, y: x > y
    elif condition == ">=":
        return lambda x, y: x >= y
    elif condition == "<":
        return lambda x, y: x < y
    elif condition == "<=":
        return lambda x, y: x <= y
    else:
        raise ValueError(f"Unknown condition: {condition}")


def is_zone_in_radius(zone: Zone, lat: float, lon: float, radius: float):
    zone_center_lat = (zone.bbox.south_west.lat + zone.bbox.north_east.lat) / 2
    zone_center_lon = (zone.bbox.south_west.lon + zone.bbox.north_east.lon) / 2
    zone_radius = (
        geodesic(
            (zone.bbox.south_west.lat, zone.bbox.south_west.lon), (zone.bbox.north_east.lat, zone.bbox.north_east.lon)
        ).meters
        / 2
    )
    distance = geodesic((lat, lon), (zone_center_lat, zone_center_lon)).meters

    return distance <= radius + zone_radius
