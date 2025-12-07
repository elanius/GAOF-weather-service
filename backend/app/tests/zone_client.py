import logging
from fastapi.testclient import TestClient
from app.types.zone_types import AutoGroupRequest, CreateZoneRequest, Restriction, Zone
from typing import List, Dict

logger = logging.getLogger(__name__)


class ZoneClient:
    def __init__(self, client: TestClient):
        self.client = client

    def get_near_zones(self, lat: float, lon: float, radius: float, restrictions: list[Restriction] = []) -> List[Zone]:
        response = self.client.post(
            "/near_zones",
            params={
                "lat": lat,
                "lon": lon,
                "radius": radius,
            },
            json=[restriction.model_dump() for restriction in restrictions] if restrictions else None,
        )
        response.raise_for_status()
        return [Zone(**zone) for zone in response.json()]

    def list_all(self) -> List[Zone]:
        response = self.client.get("/list_zones")
        response.raise_for_status()
        return [Zone(**zone) for zone in response.json()]

    def delete(self, zone_id: str) -> Dict:
        response = self.client.delete("/delete_zone", params={"zone_id": zone_id})
        response.raise_for_status()
        return response.json()

    def create(self, request_data: CreateZoneRequest) -> Zone:
        response = self.client.post("/create_zone", json=request_data.model_dump())
        response.raise_for_status()
        return Zone(**response.json())

    def create_auto_group(self, request_data: AutoGroupRequest) -> Zone:
        response = self.client.post("/create_auto_group_zone", json=request_data.model_dump())
        response.raise_for_status()
        return Zone(**response.json())

    def edit(self, zone_id: str, zone_name: str, zone_type: str) -> Zone:
        response = self.client.put(
            "/edit_zone", params={"zone_id": zone_id, "zone_name": zone_name, "zone_type": zone_type}
        )
        response.raise_for_status()
        return Zone(**response.json())

    def refresh(self, zone_id: str) -> Zone:
        response = self.client.put("/refresh_zone", params={"zone_id": zone_id})
        response.raise_for_status()
        return Zone(**response.json())
