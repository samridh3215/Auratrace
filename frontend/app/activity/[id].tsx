import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Map as MapIcon, Info, Route, Flame, Heart, Zap, Play, Activity as ActivityIcon } from 'lucide-react-native';
import MapView, { Polyline } from 'react-native-maps';
import Svg, { Polyline as SvgPolyline } from 'react-native-svg';
import polylineLib from '@mapbox/polyline';

type ActivityData = {
    id: number;
    name: string;
    type: string;
    distance: number;
    moving_time: number;
    total_elevation_gain?: number;
    average_heartrate?: number;
    max_heartrate?: number;
    calories?: number;
    average_speed?: number;
    kudos_count?: number;
    suffer_score?: number;
    map?: {
        id: string;
        summary_polyline: string;
    };
};

const formatPace = (speedMs: number) => {
    if (!speedMs || speedMs === 0) return '0:00';
    const paceSecondsPerKm = 1000 / speedMs;
    const minutes = Math.floor(paceSecondsPerKm / 60);
    const seconds = Math.floor(paceSecondsPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// SVG Normalization functions
const getBoundingBox = (coords: { latitude: number, longitude: number }[]) => {
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    coords.forEach(coord => {
        if (coord.latitude < minLat) minLat = coord.latitude;
        if (coord.latitude > maxLat) maxLat = coord.latitude;
        if (coord.longitude < minLng) minLng = coord.longitude;
        if (coord.longitude > maxLng) maxLng = coord.longitude;
    });

    return { minLat, maxLat, minLng, maxLng };
};

const normalizeCoordsForSvg = (
    coords: { latitude: number, longitude: number }[],
    width = 300,
    height = 300,
    padding = 20
) => {
    if (coords.length === 0) return "";

    const { minLat, maxLat, minLng, maxLng } = getBoundingBox(coords);

    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;

    // Determine the scale factor to fit the bounding box within the SVG
    // We want to maintain aspect ratio, so we take the smaller scale
    const usableWidth = width - (padding * 2);
    const usableHeight = height - (padding * 2);

    const scaleX = lngDiff === 0 ? 1 : usableWidth / lngDiff;
    const scaleY = latDiff === 0 ? 1 : usableHeight / latDiff;
    const scale = Math.min(scaleX, scaleY);

    // Calculate offsets to center the trace in the SVG
    const offsetX = (width - (lngDiff * scale)) / 2;
    const offsetY = (height - (latDiff * scale)) / 2;

    const svgPoints = coords.map(coord => {
        // x maps directly to longitude
        const x = ((coord.longitude - minLng) * scale) + offsetX;

        // y needs to be inverted because SVG y goes down, but latitude goes up
        const invertedLat = maxLat - coord.latitude;
        const y = (invertedLat * scale) + offsetY;

        return `${x},${y}`;
    });

    return svgPoints.join(" ");
};

export default function ActivityDetailScreen() {
    const { id, itemData } = useLocalSearchParams<{ id: string, itemData: string }>();
    const router = useRouter();
    const mapRef = React.useRef<MapView>(null);
    const [activity, setActivity] = useState<ActivityData | null>(null);
    const [routeCoords, setRouteCoords] = useState<{ latitude: number, longitude: number }[]>([]);
    const [viewMode, setViewMode] = useState<'map' | 'trace'>('map');

    useEffect(() => {
        if (itemData) {
            try {
                const parsed = JSON.parse(itemData) as ActivityData;
                setActivity(parsed);

                if (parsed.map?.summary_polyline) {
                    // Decode points
                    const points = polylineLib.decode(parsed.map.summary_polyline);
                    const coords = points.map(point => ({
                        latitude: point[0],
                        longitude: point[1]
                    }));
                    setRouteCoords(coords);
                }
            } catch (e) {
                console.error("Failed to parse activity data", e);
            }
        }
    }, [itemData]);

    if (!activity) {
        return (
            <View style={styles.container}>
                <Text style={{ color: '#FFF' }}>Loading...</Text>
            </View>
        );
    }

    const hasRoute = routeCoords.length > 0;

    // Fit map to coordinates on load
    useEffect(() => {
        if (hasRoute && mapRef.current && platform !== 'web') {
            // Small delay to ensure map has mounted and sized
            setTimeout(() => {
                mapRef.current?.fitToCoordinates(routeCoords, {
                    edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                    animated: true,
                });
            }, 500);
        }
    }, [hasRoute, routeCoords, viewMode]);

    const platform = Platform.OS;
    const windowWidth = Dimensions.get('window').width;
    const mapHeight = Dimensions.get('window').height * 0.45;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable style={styles.headerIconBtn} onPress={() => router.back()}>
                    <ChevronLeft color="#FFF" size={24} />
                </Pressable>
                <Text style={styles.headerTitle} numberOfLines={1}>{activity.name}</Text>
                <View style={{ width: 44 }} />
            </View>

            {hasRoute && platform !== 'web' ? (
                <View style={[styles.mapContainer, { height: mapHeight }]}>
                    {viewMode === 'map' ? (
                        <MapView
                            ref={mapRef}
                            style={styles.map}
                            // Default region before fitToCoordinates kicks in
                            initialRegion={{
                                latitude: routeCoords[0].latitude,
                                longitude: routeCoords[0].longitude,
                                latitudeDelta: 0.05,
                                longitudeDelta: 0.05,
                            }}
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
                    ) : (
                        <View style={[styles.traceContainer, { width: windowWidth, height: mapHeight }]}>
                            <Svg width="100%" height="100%">
                                <SvgPolyline
                                    points={normalizeCoordsForSvg(routeCoords, windowWidth, mapHeight, 30)}
                                    fill="none"
                                    stroke="#FC4C02"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </Svg>
                        </View>
                    )}

                    {/* View Toggle Button */}
                    <Pressable
                        style={styles.toggleButton}
                        onPress={() => setViewMode(prev => prev === 'map' ? 'trace' : 'map')}
                    >
                        {viewMode === 'map' ? (
                            <ActivityIcon color="#FFF" size={20} />
                        ) : (
                            <MapIcon color="#FFF" size={20} />
                        )}
                    </Pressable>
                </View>
            ) : (
                <View style={[styles.mapContainer, styles.noMapContainer, { height: mapHeight }]}>
                    <Route size={48} color="#4A4C59" />
                    <Text style={styles.noMapText}>
                        {platform === 'web'
                            ? "Map preview is not supported on web."
                            : "No GPS route available for this activity."}
                    </Text>
                </View>
            )}

            <View style={styles.detailsContainer}>
                <Text style={styles.sectionTitle}>Activity Metrics</Text>
                <View style={styles.metricsGrid}>
                    <View style={styles.statBox}>
                        <Route color="#8A8D9F" size={20} style={styles.statIcon} />
                        <Text style={styles.statValue}>{(activity.distance / 1000).toFixed(2)}</Text>
                        <Text style={styles.statLabel}>Distance (km)</Text>
                    </View>

                    <View style={styles.statBox}>
                        <Play color="#8A8D9F" size={20} style={styles.statIcon} />
                        <Text style={styles.statValue}>{formatDuration(activity.moving_time)}</Text>
                        <Text style={styles.statLabel}>Time</Text>
                    </View>

                    {activity.average_speed ? (
                        <View style={styles.statBox}>
                            <Zap color="#8A8D9F" size={20} style={styles.statIcon} />
                            <Text style={styles.statValue}>{formatPace(activity.average_speed)}</Text>
                            <Text style={styles.statLabel}>Pace (/km)</Text>
                        </View>
                    ) : null}

                    {activity.total_elevation_gain !== undefined ? (
                        <View style={styles.statBox}>
                            <MapIcon color="#8A8D9F" size={20} style={styles.statIcon} />
                            <Text style={styles.statValue}>{activity.total_elevation_gain}m</Text>
                            <Text style={styles.statLabel}>Elevation</Text>
                        </View>
                    ) : null}

                    {activity.average_heartrate ? (
                        <View style={styles.statBox}>
                            <Heart color="#F2215A" size={20} style={styles.statIcon} />
                            <Text style={styles.statValue}>{Math.round(activity.average_heartrate)}</Text>
                            <Text style={styles.statLabel}>Avg HR</Text>
                        </View>
                    ) : null}

                    {activity.calories ? (
                        <View style={styles.statBox}>
                            <Flame color="#FC4C02" size={20} style={styles.statIcon} />
                            <Text style={styles.statValue}>{activity.calories}</Text>
                            <Text style={styles.statLabel}>Calories</Text>
                        </View>
                    ) : null}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0E',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'web' ? 24 : 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#0A0A0E',
        zIndex: 10,
    },
    headerIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#1C1C24',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    mapContainer: {
        width: '100%',
        position: 'relative',
        backgroundColor: '#0D0E14',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    traceContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    toggleButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(28, 28, 36, 0.8)',
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#2D3246',
        zIndex: 10,
    },
    noMapContainer: {
        backgroundColor: '#12131A',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#1C1D26',
    },
    noMapText: {
        color: '#8A8D9F',
        marginTop: 12,
        fontSize: 14,
        fontWeight: '500',
    },
    detailsContainer: {
        flex: 1,
        padding: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 24,
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    statBox: {
        width: '47%', // roughly half width minus gap
        backgroundColor: '#1C1C24',
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2D3246',
    },
    statIcon: {
        marginBottom: 12,
    },
    statLabel: {
        color: '#8A8D9F',
        fontSize: 13,
        fontWeight: '500',
        marginTop: 4,
    },
    statValue: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '800',
    }
});
