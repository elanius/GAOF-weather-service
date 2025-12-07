import React from "react";

// Define a dictionary with units
const units: { [key: string]: string } = {
    wind_speed: "m/s",
    wind_direction: "°",
    precipitation: "mm/h",
    distance: "m",
    temp: "°C",
    temp_min: "°C",
    temp_max: "°C",
    pressure: "hPa",
    humidity: "%",
};

type ZonePropertyProps = {
    propName: string;
    propValue: number;
    additionalStyle?: string;
};

const ZoneProperty: React.FC<ZonePropertyProps> = ({ propName, propValue, additionalStyle = "" }) => {
    // Append unit to propValue if propName matches any key in the dictionary
    const valueWithUnit = `${propValue}${units[propName] ? ` [${units[propName]}]` : ""}`;

    return (
        <tr>
            <td className={`property-name ${additionalStyle}`}>{propName}</td>
            <td className={`property-value ${additionalStyle}`}>{valueWithUnit}</td>
        </tr>
    );
};

export default ZoneProperty;
