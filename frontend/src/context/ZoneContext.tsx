import React, { createContext, useContext, useState, ReactNode } from "react";
import { LatLngBounds } from "leaflet";
import axios from "axios";

axios.defaults.baseURL = "http://localhost:8001/";

export enum ZoneType {
    empty = "empty",
    wind = "wind",
    rain = "rain",
    visibility = "visibility",
    temperature = "temperature",
    auto_group = "auto_group",
}

export type Zone = {
    id: string;
    name: string;
    bounds: LatLngBounds;
    active: boolean;
    isEditing: boolean;
    isCreating: boolean;
    type: ZoneType;
    payload?: { [key: string]: any };
};

type ZoneContextType = {
    zones: { [id: string]: Zone };
    exp_zones: { [id: string]: Zone };
    selectedZoneId: string | null;
    isCreatingZone: boolean;
    isLocalizingZone: boolean;
    creatingZone: () => void;
    addNewZone: (bounds: LatLngBounds) => void;
    selectZone: (id: string | null) => void;
    editingZone: (id: string, editing?: boolean) => void;
    editZone: (id: string, newName: string, newType: ZoneType) => void;
    deleteZone: (id: string) => void;
    selectedZone(): Zone | null;
    localizeZone: (id: string, enable?: boolean) => void;
};

const ZoneContext = createContext<ZoneContextType | undefined>(undefined);

export const ZoneProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [zones, setZones] = useState<{ [id: string]: Zone }>({});
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
    const [isCreatingZone, setIsCreatingZone] = useState(false);
    const [isLocalizingZone, setIsLocalizingZone] = useState(false);

    const fetchZones = async () => {
        try {
            const response = await axios.get("/list_zones");
            const zonesData = response.data;
            const zonesMap = Object.keys(zonesData).reduce((acc: { [id: string]: Zone }, key: string) => {
                const zone = zonesData[key];
                acc[zone.id] = {
                    id: zone.id,
                    name: zone.name,
                    bounds: new LatLngBounds(
                        [zone.bbox.south_west.lat, zone.bbox.south_west.lon],
                        [zone.bbox.north_east.lat, zone.bbox.north_east.lon]
                    ),
                    active: zone.active,
                    isEditing: false,
                    isCreating: false,
                    type: zone.zone_type as ZoneType,
                    payload: zone.payload,
                };
                return acc;
            }, {});

            setZones(zonesMap);
        } catch (error) {
            console.error("Error fetching zones:", error);
        }
    };

    React.useEffect(() => {
        fetchZones();
    }, []);

    const creatingZone = () => {
        setIsCreatingZone(true);
    };

    const addNewZone = async (bounds: LatLngBounds) => {
        try {
            const response = await axios.post(
                "/create_zone",
                {
                    zone_rect: [
                        bounds.getSouthWest().lat,
                        bounds.getSouthWest().lng,
                        bounds.getNorthEast().lat,
                        bounds.getNorthEast().lng,
                    ],
                    zone_name: "New Zone",
                    zone_type: ZoneType.empty,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            const newZone = response.data;
            const zoneObject = {
                id: newZone.id,
                name: newZone.name,
                bounds: new LatLngBounds(
                    [newZone.bbox.south_west.lat, newZone.bbox.south_west.lon],
                    [newZone.bbox.north_east.lat, newZone.bbox.north_east.lon]
                ),
                isEditing: true,
                isCreating: true,
                type: newZone.zone_type,
                payload: newZone.payload,
            };

            setZones((prevZones) => ({
                ...prevZones,
                [newZone.id]: zoneObject,
            }));

            selectZone(newZone.id); // Ensure the new zone is selected
        } catch (error) {
            console.error("Error creating zone:", error);
        }
    };

    const selectZone = (id: string | null) => {
        console.log("Selecting Zone ID:", id);
        setSelectedZoneId(id);
    };

    const editingZone = (id: string, editing: boolean = true) => {
        setZones({
            ...zones,
            [id]: {
                ...zones[id],
                isEditing: editing,
            },
        });
    };

    const editZone = async (id: string, newName: string, newType: ZoneType) => {
        try {
            const response = await axios.put(`/edit_zone`, null, {
                params: {
                    zone_id: id,
                    zone_name: newName,
                    zone_type: newType,
                },
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const updatedZone = response.data;
            setZones({
                ...zones,
                [id]: {
                    ...zones[id],
                    name: updatedZone.name,
                    type: updatedZone.zone_type,
                    payload: updatedZone.payload,
                    isEditing: false,
                    isCreating: false,
                },
            });
            if (isCreatingZone) {
                setIsCreatingZone(false);
            }
            selectZone(id); // Trigger re-render by selecting the updated zone
        } catch (error) {
            console.error("Error editing zone:", error);
        }
    };

    const deleteZone = async (id: string) => {
        console.log("Deleting Zone ID:", id);
        try {
            await axios.delete("/delete_zone", {
                params: {
                    zone_id: id,
                },
            });
            const { [id]: _, ...rest } = zones;
            setZones(rest);
            if (selectedZoneId === id) {
                setSelectedZoneId(null);
            }
            if (isCreatingZone) {
                setIsCreatingZone(false);
            }
        } catch (error) {
            console.error("Error deleting zone:", error);
        }
    };

    const selectedZone = () => {
        return selectedZoneId ? getExpandedZones(zones)[selectedZoneId] : null;
    };

    const localizeZone = (id: string, enable: boolean = true) => {
        setIsLocalizingZone(enable);
        selectZone(id);
    };

    return (
        <ZoneContext.Provider
            value={{
                zones,
                exp_zones: getExpandedZones(zones), // Replace exp_zones with dynamic function
                selectedZoneId,
                isCreatingZone,
                isLocalizingZone,
                creatingZone,
                addNewZone,
                selectZone,
                editingZone,
                editZone,
                deleteZone,
                selectedZone,
                localizeZone,
            }}
        >
            {children}
        </ZoneContext.Provider>
    );
};

export const useZoneContext = () => {
    const context = useContext(ZoneContext);
    if (context === undefined) {
        throw new Error("useZoneContext must be used within a ZoneProvider");
    }
    return context;
};

export const getExpandedZones = (zones: { [id: string]: Zone }) => {
    const expandedZones = { ...zones };
    Object.values(zones).forEach((zone) => {
        if (zone.type === ZoneType.auto_group && zone.payload?.zones) {
            zone.payload.zones.forEach((subZone: any) => {
                expandedZones[subZone.id] = {
                    id: subZone.id,
                    name: subZone.name,
                    bounds: new LatLngBounds(
                        [subZone.bbox.south_west.lat, subZone.bbox.south_west.lon],
                        [subZone.bbox.north_east.lat, subZone.bbox.north_east.lon]
                    ),
                    active: subZone.active,
                    isEditing: false,
                    isCreating: false,
                    type: subZone.zone_type as ZoneType,
                    payload: subZone.payload,
                };
            });
        }
    });
    return expandedZones;
};
