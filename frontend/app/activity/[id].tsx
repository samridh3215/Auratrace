import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Map as MapIcon, Info, Route } from 'lucide-react-native';
import MapView, { Polyline } from 'react-native-maps';
import polylineLib from '@mapbox/polyline';

type ActivityData = {
    id: number;
    name: string;
    type: string;
    distance: number;
    moving_time: number;
    map?: {
        id: string;
        summary_polyline: string;
    };
};

export default function ActivityDetailScreen() {
    const { id, itemData } = useLocalSearchParams<{ id: string, itemData: string }>();
    const router = useRouter();
    const [activity, setActivity] = useState<ActivityData | null>(null);
    const [routeCoords, setRouteCoords] = useState<{ latitude: number, longitude: number }[]>([]);

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

    // Get initial region centered roughly around the first coordinate or a default
    const initialRegion = hasRoute ? {
        latitude: routeCoords[0].latitude,
        longitude: routeCoords[0].longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    } : {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable style={styles.headerIconBtn} onPress={() => router.back()}>
                    <ChevronLeft color="#FFF" size={24} />
                </Pressable>
                <Text style={styles.headerTitle} numberOfLines={1}>{activity.name}</Text>
                <View style={{ width: 44 }} />
            </View>

            {hasRoute && Platform.OS !== 'web' ? (
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        initialRegion={initialRegion}
                        // Need dark mode map styling or default map
                        userInterfaceStyle="dark"
                    >
                        <Polyline
                            coordinates={routeCoords}
                            strokeColor="#FC4C02" // Strava Orange
                            strokeWidth={4}
                            lineJoin="round"
                            lineCap="round"
                        />
                    </MapView>
                </View>
            ) : (
                <View style={[styles.mapContainer, styles.noMapContainer]}>
                    <Route size={48} color="#4A4C59" />
                    <Text style={styles.noMapText}>
                        {Platform.OS === 'web'
                            ? "Map preview is not supported on web."
                            : "No GPS route available for this activity."}
                    </Text>
                </View>
            )}

            <View style={styles.detailsContainer}>
                <Text style={styles.sectionTitle}>Activity Summary</Text>
                <View style={styles.statRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Distance</Text>
                        <Text style={styles.statValue}>{(activity.distance / 1000).toFixed(2)} km</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Time</Text>
                        <Text style={styles.statValue}>{Math.floor(activity.moving_time / 60)}m</Text>
                    </View>
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
        height: Dimensions.get('window').height * 0.5,
        width: '100%',
    },
    map: {
        width: '100%',
        height: '100%',
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
        marginBottom: 20,
    },
    statRow: {
        flexDirection: 'row',
        gap: 16,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#1C1C24',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
    },
    statLabel: {
        color: '#8A8D9F',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    statValue: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '800',
    }
});
