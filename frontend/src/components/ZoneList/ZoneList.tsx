import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faPlus, faMinus, faTrash, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import "../SidePanel/SidePanel.css";
import "../../styles/ButtonStyles.css";
import { useZoneContext, Zone } from "../../context/ZoneContext";

const ZoneList: React.FC = () => {
    const { zones, selectedZoneId, isCreatingZone, creatingZone, selectZone, deleteZone, editingZone, localizeZone } =
        useZoneContext();
    const [expandedZones, setExpandedZones] = useState<{ [id: string]: boolean }>({});

    const toggleExpand = (id: string) => {
        setExpandedZones((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    return (
        <div className="side-panel-top">
            <table className="side-panel-table">
                <thead>
                    <tr>
                        <th>
                            <h3>Zones</h3>
                        </th>
                        <th>
                            <button
                                onClick={() => {
                                    if (!isCreatingZone) {
                                        creatingZone();
                                    }
                                }}
                                className={`button ${isCreatingZone ? "pressed" : ""}`}
                                disabled={isCreatingZone}
                            >
                                <FontAwesomeIcon icon={faPlus} />
                            </button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(zones).map(([id, zone]) => (
                        <React.Fragment key={id}>
                            <tr
                                className={`list-item ${selectedZoneId === id ? "selected" : ""}`}
                                onClick={() => {
                                    if (zones[id]) {
                                        selectZone(id); // Ensure the zone exists before selecting
                                    }
                                }}
                            >
                                <td className="list-item-name">
                                    {zone.type === "auto_group" && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleExpand(id);
                                            }}
                                            className="button collapse"
                                        >
                                            <FontAwesomeIcon
                                                icon={expandedZones[id] ? faMinus : faPlus}
                                                className="collapse-icon"
                                            />
                                        </button>
                                    )}
                                    {zone.name}
                                </td>
                                <td className="list-item-actions">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            localizeZone(id);
                                        }}
                                        className="button item-action"
                                    >
                                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                                    </button>
                                    {zone.type !== "auto_group" && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                selectZone(id);
                                                editingZone(id);
                                            }}
                                            className="button item-action"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteZone(id);
                                        }}
                                        className="button delete"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </td>
                            </tr>
                            {zone.type === "auto_group" &&
                                expandedZones[id] &&
                                zone.payload?.zones &&
                                Object.entries(zone.payload.zones as Record<string, Zone>).map(([_, subZone]) => (
                                    <tr
                                        key={subZone.id}
                                        className={`list-item sub-zone ${
                                            selectedZoneId === subZone.id ? "selected" : ""
                                        }`}
                                        onClick={() => selectZone(subZone.id)}
                                    >
                                        <td className="list-item-name">- {subZone.name}</td>
                                        <td className="list-item-actions">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    localizeZone(subZone.id);
                                                }}
                                                className="button item-action"
                                            >
                                                <FontAwesomeIcon icon={faMapMarkerAlt} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ZoneList;
