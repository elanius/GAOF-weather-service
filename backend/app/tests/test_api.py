from bson import ObjectId
from pymongo.collection import Collection
from app.tests.zone_client import ZoneClient
from app.types.zone_types import (
    AutoGroupPayload,
    AutoGroupRequest,
    CreateZoneRequest,
    Restriction,
    Threshold,
    Zone,
    ZoneType,
    type_mapping,
)


def test_near_zones(zone_client: ZoneClient, zone_collection: Collection, auto_group_zone: Zone):
    zones = zone_client.get_near_zones(lat=51.5577, lon=0.3871, radius=10000)
    assert len(zones) == 1
    found_zone = zones[0]
    assert found_zone.zone_type == ZoneType.TEMPERATURE
    assert found_zone.name == "temperature-group_0_0"
    assert found_zone.active is False


def test_near_zone_with_restrictions(zone_client: ZoneClient, zone_collection: Collection, auto_group_zone: Zone):
    zones = zone_client.get_near_zones(
        lat=51.5577,
        lon=0.3871,
        radius=10000,
        restrictions=[
            Restriction(name="temp", limit=6.6, condition=">"),
            Restriction(name="humidity", limit=65, condition=">="),
        ],
    )
    assert len(zones) == 2
    found_zone = zones[0]
    assert found_zone.zone_type == ZoneType.TEMPERATURE
    assert found_zone.name == "temperature-group_0_0"
    assert found_zone.active is False

    found_zone = zones[1]
    assert found_zone.zone_type == ZoneType.TEMPERATURE
    assert found_zone.name == "temperature-group_1_0"
    assert found_zone.active is False


def test_list_zones(zone_client: ZoneClient, default_zones: list[Zone]):
    zones = zone_client.list_all()
    assert len(zones) == len(default_zones)

    for zone in zones:
        assert zone in default_zones


def test_delete_zone(zone_client: ZoneClient, default_zones: list[Zone], zone_collection: Collection):
    del_zone = default_zones.pop()
    response = zone_client.delete(zone_id=del_zone.id)
    assert response["status"] in ["success", "error"]

    # check if zone was removed from db
    remaining_zones = zone_collection.find().to_list()
    assert len(remaining_zones) == len(default_zones)
    for zone in remaining_zones:
        assert Zone(**zone) in default_zones


def test_create_zone(zone_client: ZoneClient, zone_collection: Collection):
    zone_rect = [51.43603249210615, 0.2943841187722374, 51.49912573429843, 0.4798380110186385]
    zone = zone_client.create(
        CreateZoneRequest(
            zone_rect=zone_rect,
            zone_name="test_zone",
            zone_type=ZoneType.RAIN,
        )
    )
    zone_doc = zone_collection.find_one({"_id": ObjectId(zone.id)})
    assert Zone(**zone_doc) == zone
    assert type(zone.payload) is type_mapping[ZoneType.RAIN]


def test_edit_zone(zone_client: ZoneClient, default_zones: list[Zone], zone_collection: Collection):
    edit_zone = default_zones[0]
    zone = zone_client.edit(zone_id=edit_zone.id, zone_name="new_zone_name", zone_type=ZoneType.VISIBILITY)

    zone_doc = zone_collection.find_one({"_id": ObjectId(edit_zone.id)})
    assert Zone(**zone_doc) == zone


def test_refresh_zone(zone_client: ZoneClient, default_zones: list[Zone], zone_collection: Collection):
    refresh_zone = default_zones[0]
    zone = zone_client.refresh(zone_id=refresh_zone.id)

    assert zone.payload is not None
    assert type(zone.payload) in type_mapping.values()
    zone_doc = zone_collection.find_one({"_id": ObjectId(refresh_zone.id)})
    assert Zone(**zone_doc) == zone


def test_create_auto_group_zone(zone_client: ZoneClient, zone_collection: Collection):
    request_data = AutoGroupRequest(
        name="autozone",
        rect=[51.43603249210615, 0.2943841187722374, 51.49912573429843, 0.4798380110186385],
        sampling_size=4000,
        refresh_rate=5,
        threshold={
            "precipitation": Threshold(limit=2.5, condition=">"),
        },
        sub_zone_type=ZoneType.RAIN,
    )
    zone = zone_client.create_auto_group(request_data=request_data)
    zone_doc = zone_collection.find_one({"_id": ObjectId(zone.id)})
    assert Zone(**zone_doc) == zone

    payload: AutoGroupPayload = zone.payload
    assert payload.sub_zone_type is ZoneType.RAIN
    assert len(payload.zones) == 3
