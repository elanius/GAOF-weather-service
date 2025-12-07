import React, { useState } from "react";
import ZoneList from "../ZoneList/ZoneList";
import ZoneProperties from "../ZoneProperties/ZoneProperties";
import Position from "../Position/Position";
import Toolbar from "../Toolbar/Toolbar";
import Measure from "../Measure/Measure";
import "./SidePanel.css";

const SidePanel: React.FC = () => {
    const [selectedTool, setSelectedTool] = useState<string>("zones");

    const renderContent = () => {
        switch (selectedTool) {
            case "zones":
                return (
                    <>
                        <ZoneList />
                        <ZoneProperties />
                    </>
                );
            case "position":
                return <Position />;
            case "measure":
                return <Measure />;
            default:
                return null;
        }
    };

    return (
        <div className="side-panel-container">
            <div className="side-panel">{renderContent()}</div>
            <Toolbar onSelectTool={setSelectedTool} />
        </div>
    );
};

export default SidePanel;
