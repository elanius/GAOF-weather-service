import React from "react";
import { useMapEvents } from "react-leaflet";
import L, { LatLngBounds, latLngBounds } from "leaflet";

type RectangleDrawerProps = {
    onBoundsChange: (bounds: LatLngBounds) => void;
};

const RectangleDrawer: React.FC<RectangleDrawerProps> = ({ onBoundsChange }) => {
    const map = useMapEvents({
        mousedown(e) {
            const start = e.latlng;

            // Create a temporary rectangle to visualize the bounds being drawn
            const tempRect = L.rectangle(latLngBounds(start, start), { color: "blue", weight: 2 }).addTo(map);

            // Mouse move handler to update rectangle bounds
            const moveHandler = (moveEvent: L.LeafletMouseEvent) => {
                const bounds = latLngBounds(start, moveEvent.latlng);
                tempRect.setBounds(bounds);
            };

            // Mouse up handler to finalize the rectangle and save bounds
            const upHandler = () => {
                onBoundsChange(tempRect.getBounds()); // Save final bounds
                map.off("mousemove", moveHandler); // Remove mousemove listener
                map.off("mouseup", upHandler); // Remove mouseup listener
                map.removeLayer(tempRect); // Remove temporary rectangle from map
            };

            // Attach event listeners
            map.on("mousemove", moveHandler);
            map.on("mouseup", upHandler);
        },
    });

    return null; // This component does not render anything directly
};

export default RectangleDrawer;
