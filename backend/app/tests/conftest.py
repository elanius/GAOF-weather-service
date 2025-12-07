import os
import pytest
import random
import pymongo
from pymongo.collection import Collection
from fastapi.testclient import TestClient
from app.main import app
from app.types.zone_types import AutoGroupPayload, GeoPoint, Threshold, Zone, ZoneBBox, ZoneType
from app.client.mongo import mongo_db
from .zone_client import ZoneClient

MONGODB_CONNECTION_STRING = os.getenv("MONGODB_CONNECTION_STRING")


# Fixture changes collection used by mongo_db which is used by app
@pytest.fixture(scope="function", autouse=True)
def update_app_database():
    mongo_db._db = mongo_db._client["gaof-db-test"]
    mongo_db._zones = mongo_db._db["zones"]
    yield


@pytest.fixture
def zone_collection():
    client = pymongo.MongoClient(MONGODB_CONNECTION_STRING)
    db = client["gaof-db-test"]
    db.drop_collection("zones")
    yield db["zones"]
    client.close()


@pytest.fixture
def http_client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def zone_client(http_client: TestClient) -> ZoneClient:
    return ZoneClient(http_client)


@pytest.fixture
def default_zones(zone_collection: Collection) -> list[Zone]:
    zone_types = [ZoneType.WIND, ZoneType.RAIN, ZoneType.TEMPERATURE]
    zones = [
        Zone(
            name=f"Zone {i + 1}",
            zone_type=random.choice(zone_types),
            bbox=ZoneBBox(south_west=GeoPoint(lat=0.0, lon=0.0), north_east=GeoPoint(lat=1.0, lon=1.0)),
        ).model_dump(exclude_none=True)
        for i in range(3)
    ]

    zone_collection.insert_many(zones)

    return [Zone(**zone) for zone in zone_collection.find().to_list()]


@pytest.fixture
def auto_group_zone(zone_collection: Collection) -> list[Zone]:
    # Create a zone directly using the Zone type
    zone = Zone(
        name="temperature-group",
        zone_type=ZoneType.AUTO_GROUP,
        bbox={
            "south_west": {"lat": 51.43603249210615, "lon": 0.2943841187722374},
            "north_east": {"lat": 51.49912573429843, "lon": 0.4798380110186385},
        },
        active=True,
        payload=AutoGroupPayload(
            sampling_size=4000,
            refresh_rate=60,
            next_refresh="2025-03-11T19:54:26.260Z",
            threshold={
                "temp": Threshold(limit=10.2, condition=">"),
                "humidity": Threshold(limit=61, condition="<="),
                "pressure": Threshold(limit=1010, condition=">="),
            },
            sub_zone_type=ZoneType.TEMPERATURE,
            zones=[
                Zone(
                    name="temperature-group_0_0",
                    zone_type=ZoneType.TEMPERATURE,
                    bbox={
                        "south_west": {"lat": 51.43603249210615, "lon": 0.2943841187722374},
                        "north_east": {"lat": 51.49909014943684, "lon": 0.3563286787551236},
                    },
                    active=False,
                    payload={
                        "temp": 6.66,
                        "temp_min": 4.91,
                        "temp_max": 7.03,
                        "pressure": 1007,
                        "humidity": 64,
                    },
                ),
                Zone(
                    name="temperature-group_1_0",
                    zone_type=ZoneType.TEMPERATURE,
                    bbox={
                        "south_west": {"lat": 51.43603249210615, "lon": 0.3563286787551236},
                        "north_east": {"lat": 51.49909014943684, "lon": 0.41827323873800976},
                    },
                    active=False,
                    payload={
                        "temp": 6.43,
                        "temp_min": 4.91,
                        "temp_max": 7.03,
                        "pressure": 1007,
                        "humidity": 65,
                    },
                ),
                Zone(
                    name="temperature-group_2_0",
                    zone_type=ZoneType.TEMPERATURE,
                    bbox={
                        "south_west": {"lat": 51.43603249210615, "lon": 0.41827323873800976},
                        "north_east": {"lat": 51.49909014943684, "lon": 0.4802177987208959},
                    },
                    active=True,
                    payload={
                        "temp": 6.58,
                        "temp_min": 5.27,
                        "temp_max": 7.03,
                        "pressure": 1007,
                        "humidity": 60,
                    },
                ),
            ],
        ),
    )

    # Insert the zone into the database
    zone_collection.insert_one(zone.model_dump(exclude_none=True))

    return zone
