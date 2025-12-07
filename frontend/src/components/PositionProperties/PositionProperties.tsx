import React, { useState, useEffect } from "react";
import "../SidePanel/SidePanel.css";
import "../../styles/ButtonStyles.css";
import { usePositionContext } from "../../context/PositionContext";

const PositionProperties: React.FC = () => {
    const { selectedPositionId, editingPosition, editPositionMark, selectedPosition } = usePositionContext();
    const position = selectedPosition();
    const [newName, setNewName] = useState<string>(position ? position.name : "");
    const [latitude, setLatitude] = useState<number>(position ? position.lat : 0);
    const [longitude, setLongitude] = useState<number>(position ? position.lon : 0);

    useEffect(() => {
        if (position) {
            setNewName(position.name);
            setLatitude(position.lat);
            setLongitude(position.lon);
        }
    }, [position, selectedPositionId]);

    const handleSave = () => {
        editPositionMark(selectedPositionId!, newName, latitude, longitude);
    };

    const handleCancel = () => {
        if (position) {
            editingPosition(selectedPositionId!, false);
            setNewName(position.name);
            setLatitude(position.lat);
            setLongitude(position.lon);
        }
    };

    if (position !== null) {
        return (
            <div className="side-panel-bottom">
                <table className="property-table">
                    <thead>
                        <tr>
                            <th colSpan={2}>
                                <h3>Position Properties</h3>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="property-name">Name</td>
                            <td className="property-value">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    disabled={!position.isEditing}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="property-name">Latitude</td>
                            <td className="property-value">{latitude}</td>
                        </tr>
                        <tr>
                            <td className="property-name">Longitude</td>
                            <td className="property-value">{longitude}</td>
                        </tr>
                        {position.isEditing && (
                            <tr>
                                <td colSpan={2} className="property-value">
                                    <button onClick={handleSave} className="button accept">
                                        Save
                                    </button>
                                    <button onClick={handleCancel} className="button delete">
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

export default PositionProperties;
