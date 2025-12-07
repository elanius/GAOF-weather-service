import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faMapMarkerAlt, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import "../SidePanel/SidePanel.css";
import "../../styles/ButtonStyles.css";
import { usePositionContext } from "../../context/PositionContext";

const PositionList: React.FC = () => {
    const {
        positionMarks,
        selectedPositionId,
        isCreatingPosition,
        creatingPosition,
        selectPosition,
        deletePositionMark,
        localizeMark,
    } = usePositionContext();

    return (
        <div className="side-panel-top">
            <table className="side-panel-table">
                <thead>
                    <tr>
                        <th>
                            <h3>Positions</h3>
                        </th>
                        <th>
                            <button
                                onClick={() => {
                                    if (!isCreatingPosition) {
                                        creatingPosition(true);
                                    }
                                }}
                                className={`button ${isCreatingPosition ? "pressed" : ""}`}
                                disabled={isCreatingPosition}
                            >
                                <FontAwesomeIcon icon={faPlus} />
                            </button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {Object.values(positionMarks).map((mark) => (
                        <tr
                            key={mark.id}
                            className={`list-item-item ${selectedPositionId === mark.id ? "selected" : ""}`}
                            onClick={() => selectPosition(mark.id)}
                        >
                            <td className="list-item-name">{mark.name}</td>
                            <td className="list-item-actions">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        localizeMark(mark.id);
                                    }}
                                    className="button item-action"
                                >
                                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(`${mark.lat}, ${mark.lon}`);
                                    }}
                                    className="button item-action"
                                >
                                    <FontAwesomeIcon icon={faCopy} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deletePositionMark(mark.id);
                                    }}
                                    className="button delete"
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PositionList;
