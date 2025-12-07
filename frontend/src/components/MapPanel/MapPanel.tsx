import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Rectangle, Marker, Popup } from "react-leaflet";
import L, { latLngBounds, Map } from "leaflet";
import { useZoneContext, Zone, getExpandedZones } from "../../context/ZoneContext";
import { usePositionContext } from "../../context/PositionContext";
import { useMeasureContext } from "../../context/MeasureContext";
import "leaflet/dist/leaflet.css";
import "./MapPanel.css";

const getZoneColor = (zone: Zone, selectedZoneId: string) => {
    if (selectedZoneId === zone.id) {
        return {
            color: "red",
            weight: 2,
        };
    }

    if (zone.active == false) {
        return {
            color: "gray",
            weight: 2,
        };
    }

    if (zone.type == "auto_group") {
        return {
            color: "#1fe053",
            weight: 2,
            fillColor: "none",
        };
    }

    return {
        color: "blue",
        weight: 2,
    };
};

const MapPanel: React.FC = () => {
    const { zones, selectedZoneId, isCreatingZone, isLocalizingZone, addNewZone, selectZone, localizeZone } =
        useZoneContext();
    const {
        positionMarks,
        isCreatingPosition,
        isLocalizingMark,
        selectedPositionId,
        addPositionMark,
        localizeMark,
        creatingPosition,
    } = usePositionContext();
    const { isCreatingMeasure, addMeasurement } = useMeasureContext();
    const mapRef = useRef<Map | null>(null);
    const [waitForAccept, setWaitForAccept] = useState(false);
    const [tempLine, setTempLine] = useState<L.Polyline | null>(null);
    const [startPoint, setStartPoint] = useState<L.LatLng | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;

        if (isCreatingZone) {
            map.dragging.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
        } else {
            map.dragging.enable();
            map.doubleClickZoom.enable();
            map.scrollWheelZoom.enable();
            setWaitForAccept(false);
        }

        const handleMouseDown = (e: L.LeafletMouseEvent) => {
            if (!isCreatingZone || waitForAccept) return;

            const start = e.latlng;
            const tempRect = L.rectangle(latLngBounds(start, start), { color: "blue", weight: 2 }).addTo(map);

            const moveHandler = (moveEvent: L.LeafletMouseEvent) => {
                const bounds = latLngBounds(start, moveEvent.latlng);
                tempRect.setBounds(bounds);
            };

            const upHandler = () => {
                const finalBounds = tempRect.getBounds();
                addNewZone(finalBounds);
                setWaitForAccept(true);
                map.off("mousemove", moveHandler);
                map.off("mouseup", upHandler);
                map.removeLayer(tempRect);
            };

            map.on("mousemove", moveHandler);
            map.on("mouseup", upHandler);
        };

        map.on("mousedown", handleMouseDown);

        return () => {
            map.off("mousedown", handleMouseDown);
            map.dragging.enable();
            map.doubleClickZoom.enable();
            map.scrollWheelZoom.enable();
        };
    }, [isCreatingZone, addNewZone, waitForAccept]);

    useEffect(() => {
        if (!mapRef.current || !selectedZoneId || !isLocalizingZone) return;
        const map = mapRef.current;
        const zone = getExpandedZones(zones)[selectedZoneId];
        if (zone) {
            const bounds = zone.bounds;
            map.fitBounds(bounds, { padding: [200, 200] }); // Add padding to zoom out a little bit
        } else {
            console.warn(`Zone with ID ${selectedZoneId} not found in expanded zones.`);
        }
        localizeZone(selectedZoneId, false);
    }, [selectedZoneId, zones, isLocalizingZone]);

    useEffect(() => {
        if (!mapRef.current || !selectedPositionId || !isLocalizingMark) return;
        const map = mapRef.current;
        const mark = positionMarks[selectedPositionId];
        if (mark) {
            const bounds = L.latLng(mark.lat, mark.lon);
            map.setView(bounds, map.getZoom(), { animate: true }); // Focus on the mark position with animation
        }
        localizeMark(selectedPositionId, false);
    }, [selectedPositionId, positionMarks, isLocalizingMark]);

    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;

        if (isCreatingPosition) {
            map.dragging.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
        } else {
            map.dragging.enable();
            map.doubleClickZoom.enable();
            map.scrollWheelZoom.enable();
        }

        const handleMapClick = (e: L.LeafletMouseEvent) => {
            if (isCreatingPosition) {
                addPositionMark("New Position", e.latlng.lat, e.latlng.lng);
                creatingPosition(false); // Disable creating position after a mark is created
            }
        };

        map.on("click", handleMapClick);

        return () => {
            map.off("click", handleMapClick);
            map.dragging.enable();
            map.doubleClickZoom.enable();
            map.scrollWheelZoom.enable();
        };
    }, [isCreatingPosition, addPositionMark]);

    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;

        if (isCreatingMeasure) {
            map.dragging.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
        } else {
            map.dragging.enable();
            map.doubleClickZoom.enable();
            map.scrollWheelZoom.enable();
            if (tempLine) {
                map.removeLayer(tempLine);
                setTempLine(null);
                setStartPoint(null);
            }
        }

        const handleMouseDown = (e: L.LeafletMouseEvent) => {
            if (!isCreatingMeasure) return;

            const start = e.latlng;
            setStartPoint(start);

            const newLine = L.polyline([start, start], { color: "blue", weight: 2 }).addTo(map);
            setTempLine(newLine);
        };

        const handleMouseMove = (e: L.LeafletMouseEvent) => {
            if (!isCreatingMeasure || !startPoint || !tempLine) return;

            const currentPoint = e.latlng;
            tempLine.setLatLngs([startPoint, currentPoint]);
        };

        const handleMouseUp = (e: L.LeafletMouseEvent) => {
            if (!isCreatingMeasure || !startPoint || !tempLine) return;

            const endPoint = e.latlng;
            addMeasurement([startPoint, endPoint]);

            map.removeLayer(tempLine);
            setTempLine(null);
            setStartPoint(null);
        };

        map.on("mousedown", handleMouseDown);
        map.on("mousemove", handleMouseMove);
        map.on("mouseup", handleMouseUp);

        return () => {
            map.off("mousedown", handleMouseDown);
            map.off("mousemove", handleMouseMove);
            map.off("mouseup", handleMouseUp);
            map.dragging.enable();
            map.doubleClickZoom.enable();
            map.scrollWheelZoom.enable();
        };
    }, [isCreatingMeasure, tempLine, startPoint, addMeasurement]);

    return (
        <MapContainer
            center={[48.946518848754174, 21.16296710612785]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            ref={(mapInstance) => {
                if (mapInstance) {
                    mapRef.current = mapInstance as unknown as Map;
                }
            }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {Object.entries(getExpandedZones(zones)).map(([id, zone]) => (
                <Rectangle
                    key={id}
                    bounds={zone.bounds}
                    pathOptions={getZoneColor(zone, selectedZoneId || "")}
                    eventHandlers={{
                        click: () => selectZone(id),
                    }}
                />
            ))}
            {Object.values(positionMarks).map((mark) => (
                <Marker
                    key={mark.id}
                    position={[mark.lat, mark.lon]}
                    // eventHandlers={{
                    //     click: () => focusPositionMark(mark.id),
                    // }}
                >
                    <Popup>{mark.name}</Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapPanel;
