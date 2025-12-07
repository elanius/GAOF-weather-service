import React from "react";
import PositionList from "../PositionList/PositionList";
import PositionProperties from "../PositionProperties/PositionProperties";
import "./Position.css";

const Position: React.FC = () => {
    return (
        <>
            <PositionList />
            <PositionProperties />
        </>
    );
};

export default Position;
