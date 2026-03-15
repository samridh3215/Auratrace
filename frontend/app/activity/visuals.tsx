import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions, ScrollView, Image, Animated, PanResponder } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Image as ImageIcon, Share as ShareIcon, Type, Map as MapIcon, Maximize, CheckSquare, Square } from 'lucide-react-native';
import Svg, { Polyline as SvgPolyline } from 'react-native-svg';
import polylineLib from '@mapbox/polyline';
import * as ImagePicker from 'expo-image-picker';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { GlobalActivityCache } from '../cache';

// Shared SVG helpers
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

const normalizeCoordsForSvg = (coords: { latitude: number, longitude: number }[], width = 300, height = 300, padding = 40) => {
    if (coords.length === 0) return "";
    const { minLat, maxLat, minLng, maxLng } = getBoundingBox(coords);
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const usableWidth = width - (padding * 2);
    const usableHeight = height - (padding * 2);
    const scaleX = lngDiff === 0 ? 1 : usableWidth / lngDiff;
    const scaleY = latDiff === 0 ? 1 : usableHeight / latDiff;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (width - (lngDiff * scale)) / 2;
    const offsetY = (height - (latDiff * scale)) / 2;
    return coords.map(coord => {
        const x = ((coord.longitude - minLng) * scale) + offsetX;
        const invertedLat = maxLat - coord.latitude;
        const y = (invertedLat * scale) + offsetY;
        return `${x},${y}`;
    }).join(" ");
};

const formatDistance = (meters: number) => (meters / 1000).toFixed(2);
const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
const formatPace = (speedMs: number) => {
    if (!speedMs) return '0:00';
    const sPerKm = 1000 / speedMs;
    const m = Math.floor(sPerKm / 60);
    const s = Math.floor(sPerKm % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const COLORS = ['#FFFFFF', '#000000', '#FC4C02', '#2D60FF', '#4ADE80', '#F2215A', '#FDE047'];
const FONTS = Platform.OS === 'ios' ? ['System', 'Georgia', 'Courier', 'Trebuchet MS'] : ['sans-serif', 'serif', 'monospace', 'sans-serif-condensed'];
const RATIOS = ['1:1', '4:5', '9:16', '16:9'];

const getAspectDimensions = (ratio: string, maxWidth: number) => {
    switch (ratio) {
        case '4:5': return { width: maxWidth * 0.8, height: maxWidth };
        case '9:16': return { width: maxWidth * (9 / 16), height: maxWidth };
        case '16:9': return { width: maxWidth, height: maxWidth * (9 / 16) };
        case '1:1':
        default: return { width: maxWidth, height: maxWidth };
    }
};

const Draggable = ({ children, initialX = 0, initialY = 0 }: any) => {
    const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: () => {
                pan.flattenOffset();
            }
        })
    ).current;

    return (
        <Animated.View style={{ transform: [{ translateX: pan.x }, { translateY: pan.y }], position: 'absolute' }} {...panResponder.panHandlers}>
            {children}
        </Animated.View>
    );
};

export default function VisualsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [activity, setActivity] = useState<any>(null);
    const [routeCoords, setRouteCoords] = useState<any[]>([]);

    // Editor State
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [textColor, setTextColor] = useState(COLORS[0]);
    const [mapColor, setMapColor] = useState(COLORS[2]);
    const [fontFamily, setFontFamily] = useState(FONTS[0]);
    const [activeTab, setActiveTab] = useState<'layout' | 'metrics' | 'image' | 'style'>('layout');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [metrics, setMetrics] = useState({
        title: true,
        map: true,
        distance: true,
        time: true,
        elevation: true,
        pace: false,
        heartrate: false,
        calories: false
    });

    const viewShotRef = useRef<any>(null);

    useEffect(() => {
        if (id && GlobalActivityCache[id]) {
            const sourceItem = GlobalActivityCache[id];
            setActivity(sourceItem);
            if (sourceItem.map?.summary_polyline) {
                const points = polylineLib.decode(sourceItem.map.summary_polyline);
                setRouteCoords(points.map(p => ({ latitude: p[0], longitude: p[1] })));
            }
        }
    }, [id]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 1,
        });
        if (!result.canceled) {
            setBackgroundImage(result.assets[0].uri);
        }
    };

    const shareVisual = async () => {
        if (!viewShotRef.current) return;
        try {
            const uri = await viewShotRef.current.capture();
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                alert("Sharing is not available on this platform");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleMetric = (key: keyof typeof metrics) => {
        setMetrics(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (!activity) return <View style={styles.container}><Text style={{ color: '#FFF' }}>Loading...</Text></View>;

    const screenWidth = Dimensions.get('window').width;
    const canvasMaxWidth = screenWidth - 40;
    const { width: canvasWidth, height: canvasHeight } = getAspectDimensions(aspectRatio, canvasMaxWidth);
    const hasRoute = routeCoords.length > 0;
    const totalCal = activity.calories || activity.kilojoules || Math.round(activity.distance * 0.08);

    const StatBlock = ({ label, value }: { label: string, value: string | number }) => (
        <View style={styles.statBlock}>
            <Text style={[styles.overlayStatVal, { color: textColor, fontFamily }]}>{value}</Text>
            <Text style={[styles.overlayStatLabel, { color: textColor, opacity: 0.8, fontFamily }]}>{label}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable style={styles.headerIconBtn} onPress={() => router.back()}>
                    <ChevronLeft color="#FFF" size={24} />
                </Pressable>
                <Text style={styles.headerTitle}>Create Visual</Text>
                <Pressable style={styles.headerIconBtn} onPress={shareVisual}>
                    <ShareIcon color="#FFF" size={20} />
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Visual Canvas Viewer */}
                <View style={styles.canvasWrapper}>
                    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
                        <View style={[styles.canvas, { width: canvasWidth, height: canvasHeight }]}>
                            {backgroundImage ? (
                                <Image source={{ uri: backgroundImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                            ) : (
                                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1C1C24' }]} />
                            )}

                            {/* Overlay Gradient for readability */}
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)' }]} pointerEvents="none" />

                            {/* Map Trace (Draggable) */}
                            {hasRoute && metrics.map && (
                                <Draggable initialX={canvasWidth * 0.1} initialY={canvasHeight * 0.1}>
                                    <View style={{ width: canvasWidth * 0.8, height: canvasHeight * 0.6 }}>
                                        <Svg width="100%" height="100%">
                                            <SvgPolyline
                                                points={normalizeCoordsForSvg(routeCoords, canvasWidth * 0.8, canvasHeight * 0.6, 20)}
                                                fill="none"
                                                stroke={mapColor}
                                                strokeWidth="6"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </Svg>
                                    </View>
                                </Draggable>
                            )}

                            {/* Title (Draggable) */}
                            {metrics.title && (
                                <Draggable initialX={20} initialY={20}>
                                    <Text style={[styles.overlayTitle, { color: textColor, fontFamily }]}>{activity.name}</Text>
                                </Draggable>
                            )}

                            {/* Independent Draggable Stats */}
                            {metrics.distance && (
                                <Draggable initialX={20} initialY={canvasHeight - 80}>
                                    <StatBlock label="Distance" value={`${formatDistance(activity.distance)} km`} />
                                </Draggable>
                            )}

                            {metrics.time && (
                                <Draggable initialX={canvasWidth / 2 - 40} initialY={canvasHeight - 80}>
                                    <StatBlock label="Time" value={formatDuration(activity.moving_time)} />
                                </Draggable>
                            )}

                            {metrics.elevation && (
                                <Draggable initialX={canvasWidth - 100} initialY={canvasHeight - 80}>
                                    <StatBlock label="Elevation" value={`${activity.total_elevation_gain || 0}m`} />
                                </Draggable>
                            )}

                            {metrics.pace && (
                                <Draggable initialX={20} initialY={canvasHeight - 140}>
                                    <StatBlock label="Pace" value={`${formatPace(activity.average_speed)}/km`} />
                                </Draggable>
                            )}

                            {metrics.heartrate && (
                                <Draggable initialX={canvasWidth / 2 - 40} initialY={canvasHeight - 140}>
                                    <StatBlock label="Heart Rate" value={`${Math.round(activity.average_heartrate || 0)} bpm`} />
                                </Draggable>
                            )}

                            {metrics.calories && (
                                <Draggable initialX={canvasWidth - 100} initialY={canvasHeight - 140}>
                                    <StatBlock label="Calories" value={totalCal} />
                                </Draggable>
                            )}

                        </View>
                    </ViewShot>
                </View>

                <Text style={styles.hintText}>Tip: Drag any metric or trace to reposition it!</Text>

                {/* Editor Controls */}
                <View style={styles.editorControls}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
                        <Pressable style={[styles.tabBtn, activeTab === 'layout' && styles.tabBtnActive]} onPress={() => setActiveTab('layout')}>
                            <Maximize size={16} color={activeTab === 'layout' ? '#FFF' : '#8A8D9F'} />
                            <Text style={[styles.tabText, activeTab === 'layout' && styles.tabTextActive]}>Layout</Text>
                        </Pressable>
                        <Pressable style={[styles.tabBtn, activeTab === 'metrics' && styles.tabBtnActive]} onPress={() => setActiveTab('metrics')}>
                            <CheckSquare size={16} color={activeTab === 'metrics' ? '#FFF' : '#8A8D9F'} />
                            <Text style={[styles.tabText, activeTab === 'metrics' && styles.tabTextActive]}>Metrics</Text>
                        </Pressable>
                        <Pressable style={[styles.tabBtn, activeTab === 'image' && styles.tabBtnActive]} onPress={() => setActiveTab('image')}>
                            <ImageIcon size={16} color={activeTab === 'image' ? '#FFF' : '#8A8D9F'} />
                            <Text style={[styles.tabText, activeTab === 'image' && styles.tabTextActive]}>Photo</Text>
                        </Pressable>
                        <Pressable style={[styles.tabBtn, activeTab === 'style' && styles.tabBtnActive]} onPress={() => setActiveTab('style')}>
                            <MapIcon size={16} color={activeTab === 'style' ? '#FFF' : '#8A8D9F'} />
                            <Text style={[styles.tabText, activeTab === 'style' && styles.tabTextActive]}>Style</Text>
                        </Pressable>
                    </ScrollView>

                    <View style={styles.tabContentPanel}>
                        {activeTab === 'layout' && (
                            <View>
                                <Text style={styles.controlSectionLabel}>Canvas Aspect Ratio</Text>
                                <View style={styles.ratiosGrid}>
                                    {RATIOS.map(r => (
                                        <Pressable key={r} onPress={() => setAspectRatio(r)} style={[styles.ratioBtn, aspectRatio === r && styles.ratioBtnActive]}>
                                            <Text style={[styles.ratioBtnText, aspectRatio === r && { color: '#FFF' }]}>{r}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        )}

                        {activeTab === 'metrics' && (
                            <View>
                                <Text style={styles.controlSectionLabel}>Select Overlay Metrics</Text>
                                <View style={styles.metricsGrid}>
                                    {Object.entries(metrics).map(([key, isActive]) => (
                                        <Pressable key={key} onPress={() => toggleMetric(key as any)} style={[styles.metricToggleBtn, isActive && styles.metricToggleBtnActive]}>
                                            {isActive ? <CheckSquare size={16} color="#2D60FF" /> : <Square size={16} color="#8A8D9F" />}
                                            <Text style={[styles.metricToggleText, isActive && { color: '#FFF' }]}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        )}

                        {activeTab === 'image' && (
                            <View>
                                <Pressable style={styles.actionBtn} onPress={pickImage}>
                                    <ImageIcon size={20} color="#FFF" />
                                    <Text style={styles.actionBtnText}>{backgroundImage ? 'Change Background Image' : 'Select Background Image'}</Text>
                                </Pressable>
                                {backgroundImage && (
                                    <Pressable style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => setBackgroundImage(null)}>
                                        <Text style={styles.actionBtnDangerText}>Remove Image</Text>
                                    </Pressable>
                                )}
                            </View>
                        )}

                        {activeTab === 'style' && (
                            <View>
                                <Text style={styles.controlSectionLabel}>Text Color</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
                                    {COLORS.map(c => (
                                        <Pressable key={`t-${c}`} onPress={() => setTextColor(c)} style={[styles.colorSwatch, { backgroundColor: c }, textColor === c && styles.colorSwatchActive]} />
                                    ))}
                                </ScrollView>

                                <Text style={[styles.controlSectionLabel, { marginTop: 20 }]}>Trace Color</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
                                    {COLORS.map(c => (
                                        <Pressable key={`m-${c}`} onPress={() => setMapColor(c)} style={[styles.colorSwatch, { backgroundColor: c }, mapColor === c && styles.colorSwatchActive]} />
                                    ))}
                                </ScrollView>

                                <Text style={[styles.controlSectionLabel, { marginTop: 20 }]}>Font Name</Text>
                                <View style={styles.metricsGrid}>
                                    {FONTS.map(f => (
                                        <Pressable key={f} onPress={() => setFontFamily(f)} style={[styles.fontBtn, fontFamily === f && styles.fontBtnActive]}>
                                            <Text style={[styles.fontBtnText, { fontFamily: f }, fontFamily === f && { color: '#FFF' }]}>{f}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        )}

                    </View>
                </View>

            </ScrollView>
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
    },
    scrollContent: {
        paddingBottom: 60,
    },
    canvasWrapper: {
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 10,
    },
    canvas: {
        backgroundColor: '#1C1C24',
        borderRadius: 0,
        overflow: 'hidden',
        position: 'relative',
    },
    hintText: {
        textAlign: 'center',
        color: '#8A8D9F',
        fontSize: 13,
        marginBottom: 20,
    },
    statBlock: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    overlayTitle: {
        fontSize: 28,
        fontWeight: '800',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
        padding: 8,
    },
    overlayStatVal: {
        fontSize: 22,
        fontWeight: '800',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 5
    },
    overlayStatLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    editorControls: {
        paddingHorizontal: 20,
    },
    tabsRow: {
        flexDirection: 'row',
        backgroundColor: '#1C1C24',
        borderRadius: 16,
        padding: 4,
        marginBottom: 20,
    },
    tabBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 6,
    },
    tabBtnActive: {
        backgroundColor: '#2D3246',
    },
    tabText: {
        color: '#8A8D9F',
        fontSize: 13,
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#FFF',
    },
    tabContentPanel: {
        backgroundColor: '#1C1C24',
        borderRadius: 24,
        padding: 20,
    },
    actionBtn: {
        backgroundColor: '#2D60FF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 10,
    },
    actionBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    actionBtnDanger: {
        backgroundColor: 'rgba(242, 33, 90, 0.1)',
        marginTop: 12,
        borderWidth: 1,
        borderColor: 'rgba(242, 33, 90, 0.3)',
    },
    actionBtnDangerText: {
        color: '#F2215A',
        fontSize: 15,
        fontWeight: '600',
    },
    controlSectionLabel: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 12,
    },
    colorRow: {
        flexDirection: 'row',
        paddingBottom: 8,
    },
    colorSwatch: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 16,
        borderWidth: 2,
        borderColor: '#1C1C24',
    },
    colorSwatchActive: {
        borderColor: '#FFF',
        transform: [{ scale: 1.1 }],
    },
    ratiosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    ratioBtn: {
        width: '47%',
        backgroundColor: '#12131A',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2D3246',
    },
    ratioBtnActive: {
        borderColor: '#2D60FF',
        backgroundColor: 'rgba(45, 96, 255, 0.1)',
    },
    ratioBtnText: {
        color: '#8A8D9F',
        fontSize: 16,
        fontWeight: '700',
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    metricToggleBtn: {
        width: '47%',
        flexDirection: 'row',
        backgroundColor: '#12131A',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2D3246',
        gap: 8,
    },
    metricToggleBtnActive: {
        borderColor: '#2D60FF',
        backgroundColor: 'rgba(45, 96, 255, 0.1)',
    },
    metricToggleText: {
        color: '#8A8D9F',
        fontSize: 13,
        fontWeight: '600',
    },
    fontBtn: {
        width: '47%',
        backgroundColor: '#12131A',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2D3246',
    },
    fontBtnActive: {
        borderColor: '#2D60FF',
        backgroundColor: 'rgba(45, 96, 255, 0.1)',
    },
    fontBtnText: {
        color: '#8A8D9F',
        fontSize: 14,
    }
});
