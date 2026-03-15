import React, { forwardRef } from 'react';
import MapView, { Polyline } from 'react-native-maps';

type RouteMapProps = {
    style: any;
    initialRegion: any;
    routeCoords: { latitude: number, longitude: number }[];
};

const RouteMap = forwardRef<MapView, RouteMapProps>(({ style, initialRegion, routeCoords }, ref) => {
    return (
        <MapView
            ref={ref}
            style={style}
            initialRegion={initialRegion}
            userInterfaceStyle="dark"
        >
            <Polyline
                coordinates={routeCoords}
                strokeColor="#FC4C02"
                strokeWidth={4}
                lineJoin="round"
                lineCap="round"
            />
        </MapView>
    );
});

export default RouteMap;
