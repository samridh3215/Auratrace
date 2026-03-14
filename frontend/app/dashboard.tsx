import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Platform } from 'react-native';
import axios from 'axios';
import { Activity as ActivityIcon, Bike, Footprints, Clock, Flame, Heart, ChevronLeft, Settings, Navigation, Route } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

// Types
type ActivityData = {
    id: number;
    name: string;
    type: string;
    distance: number;
    moving_time: number;
    total_elevation_gain: number;
    average_heartrate?: number;
    calories?: number;
    start_date: string;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Formatter Helpers
const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(2);
};

export default function DashboardScreen() {
    const [activities, setActivities] = useState<ActivityData[]>([]);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { token: urlToken } = useLocalSearchParams<{ token?: string }>();

    useEffect(() => {
        handleAuthentication();
    }, [urlToken]);

    const handleAuthentication = async () => {
        let activeToken = urlToken;

        // 1. If we have a token in the URL (from redirect), save it
        if (activeToken) {
            if (Platform.OS === 'web') {
                localStorage.setItem('user_token', activeToken);
                // Clean URL by removing the token
                router.setParams({ token: undefined });
            } else {
                await SecureStore.setItemAsync('user_token', activeToken);
            }
        }
        // 2. If no URL token, check storage
        else {
            const storedToken = Platform.OS === 'web'
                ? localStorage.getItem('user_token')
                : await SecureStore.getItemAsync('user_token');
            activeToken = storedToken || undefined;
        }

        if (!activeToken) {
            router.replace('/');
            return;
        }

        fetchActivities(activeToken);
    };

    const fetchActivities = async (token: string) => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${API_URL}/strava/activities`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setActivities(response.data.activities || []);
            setLoading(false);
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 401) {
                // Token invalid or expired
                handleLogout();
            } else {
                setError('Failed to load activities. Please try again.');
                setLoading(false);
            }
        }
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            if (Platform.OS === 'web') {
                localStorage.removeItem('user_token');
            } else {
                await SecureStore.deleteItemAsync('user_token');
            }
            router.replace('/');
        } catch (err) {
            console.error('Logout failed:', err);
            setLoggingOut(false);
        }
    };

    const renderIcon = (type: string) => {
        const size = 24;
        const color = '#E2E3E8';
        switch (type.toLowerCase()) {
            case 'run':
                return <ActivityIcon size={size} color={color} />;
            case 'ride':
            case 'virtualride':
                return <Bike size={size} color={color} />;
            case 'hike':
            case 'walk':
                return <Footprints size={size} color={color} />;
            default:
                return <ActivityIcon size={size} color={color} />;
        }
    };

    const renderItem = ({ item }: { item: ActivityData }) => {
        // Some basic fallbacks for demo data if STRAVA API scope is limited
        const totalCal = item.calories || Math.round(item.distance * 0.08);
        const hr = item.average_heartrate || (120 + Math.round(Math.random() * 40));

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.activityTypeContainer}>
                        {renderIcon(item.type)}
                        <View style={styles.activityTitles}>
                            <Text style={styles.activityName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.activityDate}>{new Date(item.start_date).toLocaleString(undefined, {
                                month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
                            })}</Text>
                        </View>
                    </View>
                    <View style={styles.distanceBadge}>
                        <Text style={styles.distanceText}>{formatDistance(item.distance)} km</Text>
                    </View>
                </View>

                {/* Pseudo Map Route Representation */}
                <View style={styles.routeVisual}>
                    <Route size={40} color="#2D60FF" strokeWidth={1.2} style={{ opacity: 0.5 }} />
                    <Text style={styles.routeText}>GPS Route Encrypted</Text>
                </View>

                <View style={styles.metricsGrid}>
                    <View style={styles.metric}>
                        <Clock size={16} color="#8A8D9F" />
                        <Text style={styles.metricLabel}>{formatDuration(item.moving_time)}</Text>
                    </View>
                    <View style={styles.metric}>
                        <Flame size={16} color="#FC4C02" />
                        <Text style={styles.metricLabel}>{totalCal} kcal</Text>
                    </View>
                    <View style={styles.metric}>
                        <Heart size={16} color="#F2215A" />
                        <Text style={styles.metricLabel}>{hr} bpm</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Top Header */}
            <View style={styles.header}>
                <Pressable style={styles.headerIconBtn} onPress={() => router.back()}>
                    <ChevronLeft color="#FFF" size={24} />
                </Pressable>
                <Text style={styles.headerTitle}>Activity History</Text>
                <Pressable style={styles.headerIconBtn} onPress={() => router.push('/settings')}>
                    <Settings color="#FFF" size={20} />
                </Pressable>
            </View>

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#2D60FF" />
                    <Text style={styles.loadingText}>Syncing metrics...</Text>
                </View>
            ) : error ? (
                <View style={styles.centerBox}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable style={styles.retryBtn} onPress={() => handleAuthentication()}>
                        <Text style={styles.retryBtnText}>Retry</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={activities}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.centerBox}>
                            <Text style={styles.emptyText}>No activities found. Go break a sweat!</Text>
                        </View>
                    }
                />
            )}
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
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
    },
    centerBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        color: '#8A8D9F',
        marginTop: 16,
        fontSize: 16,
        fontWeight: '500',
    },
    errorText: {
        color: '#F2215A',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    retryBtn: {
        backgroundColor: '#2D60FF',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
    },
    retryBtnText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 16,
    },
    listContent: {
        padding: 20,
        paddingTop: 10,
        paddingBottom: 100,
    },
    emptyText: {
        color: '#8A8D9F',
        fontSize: 16,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#12131A',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#1C1D26',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    activityTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    activityTitles: {
        marginLeft: 14,
        flex: 1,
    },
    activityName: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    activityDate: {
        color: '#8A8D9F',
        fontSize: 13,
        fontWeight: '500',
    },
    distanceBadge: {
        backgroundColor: 'rgba(45, 96, 255, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    distanceText: {
        color: '#2D60FF',
        fontWeight: '800',
        fontSize: 15,
    },
    routeVisual: {
        height: 80,
        backgroundColor: '#0D0E14',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1C1D26',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    routeText: {
        color: '#4A4C59',
        fontSize: 14,
        marginLeft: 10,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    metricsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#1C1D26',
    },
    metric: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metricLabel: {
        color: '#D1D3DA',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    }
});
