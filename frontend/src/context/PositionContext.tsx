import React, { createContext, useContext, useState, ReactNode } from "react";

type PositionMark = {
    id: string;
    name: string;
    lat: number;
    lon: number;
    isEditing?: boolean;
};

type PositionContextType = {
    positionMarks: { [id: string]: PositionMark };
    addPositionMark: (name: string, lat: number, lon: number) => void;
    editPositionMark: (id: string, name: string, lat: number, lon: number) => void;
    deletePositionMark: (id: string) => void;
    localizeMark: (id: string, enable?: boolean) => void;
    selectedPositionId: string | null;
    isCreatingPosition: boolean;
    isLocalizingMark: boolean;
    creatingPosition: (state: boolean) => void;
    selectPosition: (id: string | null) => void;
    editingPosition: (id: string, editing?: boolean) => void;
    selectedPosition: () => PositionMark | null;
};

const PositionContext = createContext<PositionContextType | undefined>(undefined);

export const PositionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [positionMarks, setPositionMarks] = useState<{ [id: string]: PositionMark }>({});
    const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
    const [isCreatingPosition, setIsCreatingPosition] = useState(false);
    const [isLocalizingMark, setIsLocalizingMark] = useState(false);

    const addPositionMark = (name: string, lat: number, lon: number) => {
        const id = Date.now().toString();
        const newMark: PositionMark = { id, name, lat, lon };
        setPositionMarks((prev) => ({ ...prev, [id]: newMark }));
    };

    const editPositionMark = (id: string, name: string, lat: number, lon: number) => {
        setPositionMarks((prev) => ({
            ...prev,
            [id]: { ...prev[id], name, lat, lon },
        }));
    };

    const deletePositionMark = (id: string) => {
        setPositionMarks((prev) => {
            const { [id]: _, ...rest } = prev;
            return rest;
        });
    };

    const localizeMark = (id: string, enable: boolean = true) => {
        setIsLocalizingMark(enable);
        selectPosition(id);
    };

    const creatingPosition = (state: boolean) => {
        setIsCreatingPosition(state);
    };

    const selectPosition = (id: string | null) => {
        setSelectedPositionId(id);
        setIsCreatingPosition(false);
    };

    const editingPosition = (id: string, editing: boolean = true) => {
        setPositionMarks((prev) => ({
            ...prev,
            [id]: { ...prev[id], isEditing: editing },
        }));
    };

    const selectedPosition = () => {
        return selectedPositionId ? positionMarks[selectedPositionId] || null : null;
    };

    return (
        <PositionContext.Provider
            value={{
                positionMarks,
                addPositionMark,
                editPositionMark,
                deletePositionMark,
                localizeMark,
                selectedPositionId,
                isCreatingPosition,
                isLocalizingMark,
                creatingPosition,
                selectPosition,
                editingPosition,
                selectedPosition,
            }}
        >
            {children}
        </PositionContext.Provider>
    );
};

export const usePositionContext = () => {
    const context = useContext(PositionContext);
    if (context === undefined) {
        throw new Error("usePositionContext must be used within a PositionProvider");
    }
    return context;
};
