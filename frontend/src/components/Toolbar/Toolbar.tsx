import React from "react";
import "./Toolbar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVectorSquare, faLocationArrow, faTape } from "@fortawesome/free-solid-svg-icons";

type ToolbarProps = {
    onSelectTool: (tool: string) => void;
};

const Toolbar: React.FC<ToolbarProps> = ({ onSelectTool }) => {
    return (
        <div className="toolbar">
            <button onClick={() => onSelectTool("zones")} className="toolbar-button">
                <FontAwesomeIcon icon={faVectorSquare} />
            </button>
            <button onClick={() => onSelectTool("position")} className="toolbar-button">
                <FontAwesomeIcon icon={faLocationArrow} />
            </button>
            <button onClick={() => onSelectTool("measure")} className="toolbar-button">
                <FontAwesomeIcon icon={faTape} />
            </button>
        </div>
    );
};

export default Toolbar;
