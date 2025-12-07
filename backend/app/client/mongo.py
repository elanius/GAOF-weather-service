import logging
import os
from typing import Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from app.types.zone_types import Zone

logger = logging.getLogger(__name__)

MONGODB_CONNECTION_STRING = os.getenv("MONGODB_CONNECTION_STRING")


class MongoDB(object):
    def __init__(self) -> None:
        if not MONGODB_CONNECTION_STRING:
            raise ValueError("MONGODB_CONNECTION_STRING is not set. Please set it in your environment variables.")

        self._client = AsyncIOMotorClient(MONGODB_CONNECTION_STRING, uuidRepresentation="standard")
        self._db = self._client["gaof-db"]
        self._zones = self._db["zones"]

    async def get_zone(self, zone_id: str) -> Optional[Zone]:
        zone_doc = await self._zones.find_one({"_id": ObjectId(zone_id)})
        if zone_doc:
            return Zone(**zone_doc)

        return None

    async def insert_zone(self, zone: Zone) -> Zone:
        zone_dict = zone.model_dump(exclude_none=True, exclude={"id"}, by_alias=True)
        result = await self._zones.insert_one(zone_dict)
        zone.id = str(result.inserted_id)
        return zone

    async def update_zone(self, zone: Zone) -> bool:
        zone_dict = zone.model_dump(exclude_none=True, by_alias=True)
        zone_id = zone_dict.pop("_id")
        result = await self._zones.update_one({"_id": ObjectId(zone_id)}, {"$set": zone_dict})
        return result.matched_count > 0

    async def get_all_zones(self) -> list[Zone]:
        return [Zone(**zone_doc) for zone_doc in await self._zones.find().to_list()]

    async def delete_zone(self, zone_id: str) -> bool:
        result = await self._zones.delete_one({"_id": ObjectId(zone_id)})
        return result.deleted_count > 0


mongo_db = MongoDB()
