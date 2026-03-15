import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Map as MapIcon, Info, Route, Flame, Heart, Zap, Play, Activity as ActivityIcon } from 'lucide-react-native';
import Svg, { Polyline as SvgPolyline } from 'react-native-svg';
import polylineLib from '@mapbox/polyline';
import RouteMap from '../components/RouteMap';
import { GlobalActivityCache } from '../cache';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { LineChart } from 'react-native-chart-kit';

const API_URL = process.env.EXPO_PUBLIC_API_URL as string;

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
    kilojoules?: number;
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
    const { id, itemData } = useLocalSearchParams<{ id: string, itemData?: string }>();
    const router = useRouter();
    const mapRef = useRef<any>(null);
    const [activity, setActivity] = useState<ActivityData | null>(null);
    const [routeCoords, setRouteCoords] = useState<{ latitude: number, longitude: number }[]>([]);

    const [viewMode, setViewMode] = useState<'map' | 'trace'>('trace');

    // Charts logic
    const [streamsLoaded, setStreamsLoaded] = useState(false);
    const [chartsLoading, setChartsLoading] = useState(false);
    const [streamsData, setStreamsData] = useState<any>(null);

    const fetchStreams = async () => {
        if (!id) return;
        setChartsLoading(true);
        try {
            const token = Platform.OS === 'web'
                ? localStorage.getItem('user_token')
                : await SecureStore.getItemAsync('user_token');

            if (!token) throw new Error('No token found');

            const res = await axios.get(`${API_URL}/strava/activities/${id}/streams`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data) {
                setStreamsData(res.data);
                setStreamsLoaded(true);
            }
        } catch (error: any) {
            console.error('Failed to load streams', error);
            if (error.response?.status === 404) {
                // Strava returns 404 if streams are unavailable (e.g. manual entry)
                setStreamsData(null);
            }
        } finally {
            setChartsLoading(false);
        }
    };

    useEffect(() => {
        let sourceItem: ActivityData | null = null;

        if (id && GlobalActivityCache[id]) {
            sourceItem = GlobalActivityCache[id] as ActivityData;
        } else if (itemData) {
            try {
                sourceItem = JSON.parse(itemData) as ActivityData;
            } catch (e) {
                console.error("Failed to parse activity data from url params", e);
            }
        }

        if (sourceItem) {
            setActivity(sourceItem);

            if (sourceItem.map?.summary_polyline) {
                // Decode points
                const points = polylineLib.decode(sourceItem.map.summary_polyline);
                const coords = points.map(point => ({
                    latitude: point[0],
                    longitude: point[1]
                }));
                setRouteCoords(coords);
            }
        }
    }, [id, itemData]);

    const hasRoute = routeCoords.length > 0;
    const platform = Platform.OS;
    const windowWidth = Dimensions.get('window').width;
    const mapHeight = Dimensions.get('window').height * 0.40;

    // Fit map to coordinates on load
    useEffect(() => {
        if (hasRoute && viewMode === 'map' && mapRef.current && platform !== 'web') {
            // Small delay to ensure map has mounted and sized
            setTimeout(() => {
                mapRef.current?.fitToCoordinates(routeCoords, {
                    edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                    animated: true,
                });
            }, 300);
        }
    }, [hasRoute, routeCoords, viewMode, platform]);

    if (!activity) {
        return (
            <View style={styles.container}>
                <Text style={{ color: '#FFF', alignSelf: 'center', marginTop: 100 }}>Loading...</Text>
            </View>
        );
    }

    const totalCal = activity.calories || activity.kilojoules || Math.round(activity.distance * 0.08);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable style={styles.headerIconBtn} onPress={() => router.back()}>
                    <ChevronLeft color="#FFF" size={24} />
                </Pressable>
                <Text style={styles.headerTitle} numberOfLines={1}>{activity.name}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* 1. Map/Trace Card */}
                <View style={styles.card}>
                    {hasRoute && platform !== 'web' ? (
                        <View style={[styles.mapContainer, { height: mapHeight }]}>
                            {viewMode === 'map' ? (
                                <RouteMap
                                    ref={mapRef}
                                    style={styles.map}
                                    initialRegion={{
                                        latitude: routeCoords[0].latitude,
                                        longitude: routeCoords[0].longitude,
                                        latitudeDelta: 0.05,
                                        longitudeDelta: 0.05,
                                    }}
                                    routeCoords={routeCoords}
                                />
                            ) : (
                                <View style={[styles.traceContainer, { width: '100%', height: mapHeight }]}>
                                    <Svg width="100%" height="100%">
                                        <SvgPolyline
                                            points={normalizeCoordsForSvg(routeCoords, windowWidth - 48, mapHeight, 30)}
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
                </View>

                {/* 2. Stats Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Stats</Text>
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

                        <View style={styles.statBox}>
                            <Zap color="#8A8D9F" size={20} style={styles.statIcon} />
                            <Text style={styles.statValue}>{activity.average_speed ? formatPace(activity.average_speed) : '--:--'}</Text>
                            <Text style={styles.statLabel}>Pace (/km)</Text>
                        </View>

                        <View style={styles.statBox}>
                            <MapIcon color="#8A8D9F" size={20} style={styles.statIcon} />
                            <Text style={styles.statValue}>{activity.total_elevation_gain || 0}m</Text>
                            <Text style={styles.statLabel}>Elevation</Text>
                        </View>

                        <View style={styles.statBox}>
                            <Heart color="#F2215A" size={20} style={styles.statIcon} />
                            <Text style={styles.statValue}>{activity.average_heartrate ? Math.round(activity.average_heartrate) : '--'}</Text>
                            <Text style={styles.statLabel}>Avg HR</Text>
                        </View>

                        <View style={styles.statBox}>
                            <Flame color="#FC4C02" size={20} style={styles.statIcon} />
                            <Text style={styles.statValue}>{totalCal}</Text>
                            <Text style={styles.statLabel}>Calories</Text>
                        </View>
                    </View>
                </View>

                {/* 3. Charts Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Charts</Text>

                    {!streamsLoaded && !chartsLoading && (
                        <Pressable style={styles.loadChartsButton} onPress={fetchStreams}>
                            <Zap color="#FFF" size={20} />
                            <Text style={styles.loadChartsText}>Load Advanced Metrics</Text>
                        </Pressable>
                    )}

                    {chartsLoading && (
                        <View style={styles.chartPlaceholder}>
                            <Text style={styles.chartText}>Loading stream data...</Text>
                        </View>
                    )}

                    {streamsLoaded && streamsData && (
                        <View>
                            {streamsData.heartrate && streamsData.heartrate.data.length > 0 && (
                                <View style={styles.chartWrapper}>
                                    <Text style={styles.chartLabel}>Heart Rate (bpm)</Text>
                                    <LineChart
                                        data={{
                                            labels: [],
                                            datasets: [{ data: streamsData.heartrate.data.filter((_: any, i: number) => i % Math.ceil(streamsData.heartrate.data.length / 50) === 0) }]
                                        }}
                                        width={windowWidth - 64}
                                        height={180}
                                        withDots={false}
                                        withInnerLines={false}
                                        chartConfig={{
                                            backgroundColor: '#1C1C24',
                                            backgroundGradientFrom: '#1C1C24',
                                            backgroundGradientTo: '#1C1C24',
                                            color: (opacity = 1) => `rgba(242, 33, 90, ${opacity})`,
                                            strokeWidth: 2,
                                        }}
                                        bezier
                                        style={styles.chartStyle}
                                    />
                                </View>
                            )}

                            {streamsData.altitude && streamsData.altitude.data.length > 0 && (
                                <View style={styles.chartWrapper}>
                                    <Text style={styles.chartLabel}>Elevation (m)</Text>
                                    <LineChart
                                        data={{
                                            labels: [],
                                            datasets: [{ data: streamsData.altitude.data.filter((_: any, i: number) => i % Math.ceil(streamsData.altitude.data.length / 50) === 0) }]
                                        }}
                                        width={windowWidth - 64}
                                        height={180}
                                        withDots={false}
                                        withInnerLines={false}
                                        chartConfig={{
                                            backgroundColor: '#1C1C24',
                                            backgroundGradientFrom: '#1C1C24',
                                            backgroundGradientTo: '#1C1C24',
                                            color: (opacity = 1) => `rgba(138, 141, 159, ${opacity})`,
                                            strokeWidth: 2,
                                        }}
                                        bezier
                                        style={styles.chartStyle}
                                    />
                                </View>
                            )}
                        </View>
                    )}
                </View>

            </ScrollView>

            {/* Footer floating button */}
            <View style={styles.footer}>
                <Pressable
                    style={styles.createVisualsButton}
                    onPress={() => router.push({ pathname: '/activity/visuals', params: { id: activity.id } })}
                >
                    <Text style={styles.createVisualsText}>Create Visuals</Text>
                </Pressable>
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
        paddingBottom: 16,
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
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 120, // Leave space for sticky footer
        paddingTop: 8,
    },
    card: {
        backgroundColor: '#1C1C24',
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#2D3246',
        overflow: 'hidden',
    },
    mapContainer: {
        width: '100%',
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
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
    },
    noMapText: {
        color: '#8A8D9F',
        marginTop: 12,
        fontSize: 14,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 16,
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 16,
    },
    statBox: {
        width: '32%',
        alignItems: 'center',
        paddingVertical: 12,
    },
    statIcon: {
        marginBottom: 8,
    },
    statLabel: {
        color: '#8A8D9F',
        fontSize: 13,
        fontWeight: '500',
        marginTop: 4,
    },
    statValue: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '800',
    },
    chartPlaceholder: {
        height: 100,
        backgroundColor: '#12131A',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1C1D26',
        alignItems: 'center',
        justifyContent: 'center',
    },
    chartText: {
        color: '#4A4C59',
        fontSize: 14,
        fontWeight: '600',
    },
    loadChartsButton: {
        backgroundColor: '#12131A',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2D60FF',
        gap: 8,
    },
    loadChartsText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
    chartWrapper: {
        marginTop: 16,
    },
    chartLabel: {
        color: '#8A8D9F',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    chartStyle: {
        borderRadius: 16,
        marginLeft: -10, // Adjust layout for react-native-chart-kit default padding
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        paddingTop: 16,
        backgroundColor: 'rgba(10, 10, 14, 0.95)',
        borderTopWidth: 1,
        borderTopColor: '#1C1D26',
    },
    createVisualsButton: {
        backgroundColor: '#FFF',
        paddingVertical: 16,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createVisualsText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    }
});
