import React, { useState, useEffect } from "react";
import "../SidePanel/SidePanel.css";
import "../../styles/ButtonStyles.css";
import { useZoneContext, ZoneType } from "../../context/ZoneContext";
import ZoneProperty from "./ZoneProperty";

const ZoneProperties: React.FC = () => {
    const { selectedZoneId, editingZone, editZone, deleteZone, selectedZone } = useZoneContext();
    const zone = selectedZone();
    const [newZoneName, setNewZoneName] = useState<string>(zone ? zone.name : "");
    const [zoneType, setZoneType] = useState<string>(zone ? zone.type : "");

    useEffect(() => {
        if (zone) {
            setNewZoneName(zone.name);
            setZoneType(zone.type);
        }
    }, [zone, selectedZoneId]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewZoneName(e.target.value);
    };

    const handleZoneTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setZoneType(e.target.value);
    };

    const handleSave = () => {
        editZone(selectedZoneId!, newZoneName, zoneType as ZoneType);
    };

    const handleCancel = () => {
        if (zone) {
            if (zone.isCreating) {
                deleteZone(selectedZoneId!);
            } else if (zone.isEditing) {
                editingZone(selectedZoneId!, false);
                setNewZoneName(zone.name);
                setZoneType(zone.type);
            }
        }
    };

    if (zone !== null) {
        return (
            <div className="side-panel-bottom">
                <table className="property-table">
                    <thead>
                        <tr>
                            <th colSpan={2}>
                                <h3>Zone properties</h3>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="property-name">Name</td>
                            <td className="property-value">
                                <input
                                    type="text"
                                    value={newZoneName}
                                    onChange={handleNameChange}
                                    disabled={!zone.isEditing}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="property-name">Type</td>
                            <td className="property-value">
                                <select value={zoneType} onChange={handleZoneTypeChange} disabled={!zone.isEditing}>
                                    {Object.values(ZoneType).map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </td>
                        </tr>

                        <ZoneProperty propName="SW Corner Latitude" propValue={zone.bounds.getSouthWest().lat} />
                        <ZoneProperty propName="SW Corner Longitude" propValue={zone.bounds.getSouthWest().lng} />
                        <ZoneProperty propName="NE Corner Latitude" propValue={zone.bounds.getNorthEast().lat} />
                        <ZoneProperty propName="NE Corner Longitude" propValue={zone.bounds.getNorthEast().lng} />

                        {zone.payload &&
                            Object.entries(zone.payload).map(([key, value]) => (
                                <ZoneProperty propName={key} propValue={value} additionalStyle="payload" />
                            ))}
                        {zone.isEditing && (
                            <tr>
                                <td colSpan={2} className="property-value">
                                    <button onClick={handleSave} className="button accept">
                                        {zone.isCreating ? "Create" : "Save"}
                                    </button>
                                    <button onClick={handleCancel} className="button cancel">
                                        Cancel
                                    </button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    }

    return <></>;
};

export default ZoneProperties;
