import React, { createContext, ReactNode, useContext, useState } from "react";
import { LatLng } from "leaflet";

interface Measurement {
    id: string;
    name: string;
    distance: number;
    points: LatLng[];
}

interface MeasureContextProps {
    measurements: Measurement[];
    isCreatingMeasure: boolean;
    startCreatingMeasure: () => void;
    stopCreatingMeasure: () => void;
    addMeasurement: (points: LatLng[]) => void;
}

const MeasureContext = createContext<MeasureContextProps | undefined>(undefined);

export const MeasureProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const [isCreatingMeasure, setIsCreatingMeasure] = useState(false);

    const startCreatingMeasure = () => setIsCreatingMeasure(true);
    const stopCreatingMeasure = () => setIsCreatingMeasure(false);

    const addMeasurement = (points: LatLng[]) => {
        const distance = points.reduce((acc, point, index) => {
            if (index === 0) return acc;
            return acc + points[index - 1].distanceTo(point);
        }, 0);

        const newMeasurement: Measurement = {
            id: `${Date.now()}`,
            name: `Measurement ${measurements.length + 1}`,
            distance,
            points,
        };

        setMeasurements((prev) => [...prev, newMeasurement]);
        stopCreatingMeasure();
    };

    return (
        <MeasureContext.Provider
            value={{
                measurements,
                isCreatingMeasure,
                startCreatingMeasure,
                stopCreatingMeasure,
                addMeasurement,
            }}
        >
            {children}
        </MeasureContext.Provider>
    );
};

export const useMeasureContext = (): MeasureContextProps => {
    const context = useContext(MeasureContext);
    if (!context) {
        throw new Error("useMeasureContext must be used within a MeasureProvider");
    }
    return context;
};
