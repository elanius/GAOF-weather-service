import React from "react";
import MapPanel from "./components/MapPanel/MapPanel";
import SidePanel from "./components/SidePanel/SidePanel";
import { ZoneProvider } from "./context/ZoneContext";
import { PositionProvider } from "./context/PositionContext";
import { MeasureProvider } from "./context/MeasureContext";
import "./App.css";

const App: React.FC = () => {
    return (
        <MeasureProvider>
            <PositionProvider>
                <div className="app-container">
                    <ZoneProvider>
                        <MapPanel />
                        <SidePanel />
                    </ZoneProvider>
                </div>
            </PositionProvider>
        </MeasureProvider>
    );
};

export default App;
