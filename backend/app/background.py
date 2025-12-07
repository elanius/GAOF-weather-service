import asyncio
import datetime
import logging
from app.client.mongo import mongo_db
from app.client.weather import get_weather_by_bbox
from app.types.zone_types import AutoGroupPayload, Threshold, Zone, ZoneType

logger = logging.getLogger(__name__)


class Background:
    _refresh_event = asyncio.Event()
    WAKEUP_TIMEOUT = 60

    def __init__(self):
        self._shutdown_event = asyncio.Event()
        self._background_task: asyncio.Task = None

    async def __aenter__(self):
        self._background_task = asyncio.create_task(self.run())
        return self

    async def __aexit__(self, _exc_type, _exc, _tb):
        self._shutdown_event.set()
        await self._background_task

    @classmethod
    def refresh_zones(cls):
        cls._refresh_event.set()

    async def _event_aware_wait(self, timeout) -> bool:
        countdown = timeout
        while countdown > 0:
            await asyncio.sleep(1)
            countdown -= 1
            if self._shutdown_event.is_set():
                return False
            elif self._refresh_event.is_set():
                self._refresh_event.clear()
                return True

        return True

    def _load_zones_for_refresh(self):
        return mongo_db._zones.find(
            {
                "zone_type": ZoneType.AUTO_GROUP,
                "payload.next_refresh": {"$lt": datetime.datetime.now()},
            }
        )

    async def run(self):
        while await self._event_aware_wait(Background.WAKEUP_TIMEOUT):
            async for zone_doc in self._load_zones_for_refresh():
                zone = Zone(**zone_doc)
                logging.info(f"Refreshing weather for zone {zone.name} - {str(zone.id)}")
                payload: AutoGroupPayload = zone.payload
                await self._refresh_zone_weather(payload.zones)
                # self._evaluate_weather_thresholds(payload.zones, payload.threshold)
                payload.next_refresh = datetime.datetime.now() + datetime.timedelta(seconds=payload.refresh_rate)
                await mongo_db.update_zone(zone)

    async def _refresh_zone_weather(self, zones: list[Zone]):
        for zone in zones:
            weather = await get_weather_by_bbox(zone.bbox)
            zone.set_weather_payload(weather)

    def _evaluate_weather_thresholds(self, zones: list[Zone], thresholds: dict[str, Threshold]):
        for zone in zones:
            zone.active = False  # inactivate before evaluation

            for field, threshold in thresholds.items():
                if not getattr(zone.payload, field):
                    continue

                active = False
                if threshold.condition == ">":
                    active = getattr(zone.payload, field) > threshold.limit
                elif threshold.condition == ">=":
                    active = getattr(zone.payload, field) >= threshold.limit
                elif threshold.condition == "<":
                    active = getattr(zone.payload, field) < threshold.limit
                elif threshold.condition == "<=":
                    active = getattr(zone.payload, field) <= threshold.limit

                if active is True:
                    zone.active = True
                    break  # don't evaluate other thresholds
