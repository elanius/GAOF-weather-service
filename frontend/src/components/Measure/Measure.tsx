import React, { useState } from "react";
import "./Measure.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useMeasureContext } from "../../context/MeasureContext";

const Measure: React.FC = () => {
    const { measurements, isCreatingMeasure, startCreatingMeasure, stopCreatingMeasure } = useMeasureContext();
    const [selectedMeasureId, setSelectedMeasureId] = useState<string | null>(null);

    return (
        <div className="side-panel-top">
            <table className="side-panel-table">
                <thead>
                    <tr>
                        <th>
                            <h3>Measurements</h3>
                        </th>
                        <th>
                            <button
                                onClick={() => {
                                    if (!isCreatingMeasure) {
                                        startCreatingMeasure();
                                    } else {
                                        stopCreatingMeasure();
                                    }
                                }}
                                className={`button ${isCreatingMeasure ? "pressed" : ""}`}
                            >
                                <FontAwesomeIcon icon={faPlus} />
                            </button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {measurements.map((measure) => (
                        <tr
                            key={measure.id}
                            className={selectedMeasureId === measure.id ? "selected" : ""}
                            onClick={() => setSelectedMeasureId(measure.id)}
                        >
                            <td>{measure.name}</td>
                            <td>{measure.distance.toFixed(2)} m</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Measure;
