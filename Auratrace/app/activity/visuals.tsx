import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions, ScrollView, Image, Animated, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated2, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import {
    ChevronLeft,
    Image as ImageIcon,
    Share as ShareIcon,
    Trash2,
    Layers,
    Grid,
    Plus,
    ChevronRight,
    Eye,
    Info,
    X,
    Maximize2,
    Minimize2,
    Download,
    Activity as ActivityIcon,
    Timer,
    Zap,
    Map as MapIcon,
    Type,
    TrendingUp,
    BarChart2,
    Settings
} from 'lucide-react-native';
import Svg, { Polyline as SvgPolyline } from 'react-native-svg';
import polylineLib from '@mapbox/polyline';
import * as ImagePicker from 'expo-image-picker';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { LineChart } from 'react-native-chart-kit';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// --- HSL Helpers ---
const hslaToHex = (h: number, s: number, l: number, a: number = 1) => {
    l /= 100;
    const aFactor = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - aFactor * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    const alpha = Math.round(a * 255).toString(16).padStart(2, '0');
    return `#${f(0)}${f(8)}${f(4)}${alpha}`;
};

const hexToHsla = (hex: string) => {
    if (!hex || hex === 'transparent') return { h: 0, s: 0, l: 100, a: 0 };
    let r = 0, g = 0, b = 0, a = 1;
    if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    } else if (hex.length === 9) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
        a = parseInt(hex.slice(7, 9), 16) / 255;
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100, a };
};

// --- Types ---
type ElementType = 'title' | 'map' | 'stat' | 'graph';

const RATIOS = ['1:1', '4:5', '9:16', '16:9'];

interface CanvasElement {
    id: string;
    type: ElementType;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    color: string;
    colors?: string[]; // Multiple colors for overlay
    visible: boolean;
    label?: string;
    value?: string | number;
    opacity?: number;
    // Graph specific
    metricType?: 'speed' | 'altitude' | 'heartrate' | 'cadence' | 'pace';
    isOverlay?: boolean;
    overlayMetrics?: string[];
    // Map specific
    strokeWidth?: number;
}

const METRIC_LABELS: Record<string, string> = {
    speed: 'SPEED',
    altitude: 'ELEVATION',
    heartrate: 'HR',
    cadence: 'CADENCE',
    pace: 'PACE'
};

const METRIC_UNITS: Record<string, string> = {
    speed: 'km/h',
    altitude: 'm',
    heartrate: 'bpm',
    cadence: 'rpm',
    pace: '/km'
};

// --- Advanced Color Picker ---
const AdvancedColorPicker = ({ color, onColorChange }: { color: string, onColorChange: (c: string) => void }) => {
    const hsl = hexToHsla(color);
    const [h, setH] = useState(hsl.h);
    const [s, setS] = useState(hsl.s);
    const [l, setL] = useState(hsl.l);
    const [hex, setHex] = useState(color);

    const hueX = useSharedValue((hsl.h / 360) * 200);
    const slX = useSharedValue((hsl.s / 100) * 150);
    const slY = useSharedValue((1 - hsl.l / 100) * 100);

    useEffect(() => {
        const nextHsl = hexToHsla(color);
        hueX.value = (nextHsl.h / 360) * 200;
        slX.value = (nextHsl.s / 100) * 150;
        slY.value = (1 - nextHsl.l / 100) * 100;
        setH(nextHsl.h); setS(nextHsl.s); setL(nextHsl.l); setHex(color);
    }, [color]);

    const updateColor = (newH: number, newS: number, newL: number) => {
        const newHex = hslaToHex(newH, newS, newL);
        setHex(newHex);
        onColorChange(newHex);
    };

    const hueGesture = Gesture.Pan()
        .onUpdate((e) => {
            const nextX = Math.min(200, Math.max(0, e.x));
            hueX.value = nextX;
            const nextH = (nextX / 200) * 360;
            runOnJS(setH)(nextH);
            runOnJS(updateColor)(nextH, s, l);
        });

    const slGesture = Gesture.Pan()
        .onUpdate((e) => {
            const nextX = Math.min(150, Math.max(0, e.x));
            const nextY = Math.min(100, Math.max(0, e.y));
            slX.value = nextX;
            slY.value = nextY;
            const nextS = (nextX / 150) * 100;
            const nextL = 100 - (nextY / 100) * 100;
            runOnJS(setS)(nextS);
            runOnJS(setL)(nextL);
            runOnJS(updateColor)(h, nextS, nextL);
        });

    const animatedHueStyle = useAnimatedStyle(() => ({
        left: hueX.value
    }));

    const animatedSLStyle = useAnimatedStyle(() => ({
        left: slX.value,
        top: slY.value
    }));

    return (
        <View style={styles.cpContainer}>
            <View style={[styles.cpArea, { backgroundColor: hslaToHex(h, 100, 50) }]}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'white', opacity: 1 - s / 100 }]} />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'black', opacity: 1 - l / 100 }]} />
                <GestureDetector gesture={slGesture}>
                    <View style={StyleSheet.absoluteFill}>
                        <Pressable
                            onPress={(e) => {
                                const { locationX, locationY } = e.nativeEvent;
                                slX.value = locationX;
                                slY.value = locationY;
                                const nextS = Math.min(100, Math.max(0, (locationX / 150) * 100));
                                const nextL = Math.min(100, Math.max(0, 100 - (locationY / 100) * 100));
                                setS(nextS); setL(nextL);
                                updateColor(h, nextS, nextL);
                            }}
                            style={StyleSheet.absoluteFill}
                        />
                    </View>
                </GestureDetector>
                <Animated2.View style={[styles.cpCursor, { borderColor: l > 50 ? '#000' : '#FFF' }, animatedSLStyle]} />
            </View>

            <View style={styles.cpBarContainer}>
                <View style={styles.cpSpectrum}>
                    {Array.from({ length: 36 }).map((_, i) => (
                        <View
                            key={i}
                            style={{ flex: 1, backgroundColor: hslaToHex(i * 10, 100, 50), height: 16 }}
                        />
                    ))}
                </View>
                <GestureDetector gesture={hueGesture}>
                    <View style={StyleSheet.absoluteFill}>
                        <Pressable
                            onPress={(e) => {
                                const { locationX } = e.nativeEvent;
                                const nextH = Math.min(360, Math.max(0, (locationX / 200) * 360));
                                hueX.value = locationX;
                                setH(nextH);
                                updateColor(nextH, s, l);
                            }}
                            style={StyleSheet.absoluteFill}
                        />
                    </View>
                </GestureDetector>
                <Animated2.View style={[styles.cpHueSlider, animatedHueStyle]} />
            </View>

            <View style={styles.cpInputRow}>
                <View style={[styles.cpPreview, { backgroundColor: hex }]} />
                <TextInput
                    style={styles.cpInput}
                    value={hex}
                    onChangeText={setHex}
                    onSubmitEditing={() => {
                        if (/^#[0-9A-Fa-f]{3,8}$/i.test(hex)) {
                            const next = hexToHsla(hex);
                            hueX.value = (next.h / 360) * 200;
                            slX.value = (next.s / 100) * 150;
                            slY.value = (1 - next.l / 100) * 100;
                            setH(next.h); setS(next.s); setL(next.l);
                            onColorChange(hex);
                        }
                    }}
                    autoCapitalize="characters"
                />
                <TouchableOpacity
                    onPress={() => {
                        if (/^#[0-9A-Fa-f]{3,8}$/i.test(hex)) {
                            const next = hexToHsla(hex);
                            hueX.value = (next.h / 360) * 200;
                            slX.value = (next.s / 100) * 150;
                            slY.value = (1 - next.l / 100) * 100;
                            setH(next.h); setS(next.s); setL(next.l);
                            onColorChange(hex);
                        }
                    }}
                    style={styles.cpOkBtn}
                >
                    <Text style={styles.cpOkText}>SET</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
};

// --- Helpers ---
const formatDistance = (meters: number) => (meters / 1000).toFixed(2);
const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const normalizeCoordsForSvg = (coords: { latitude: number, longitude: number }[], width: number, height: number, padding: number) => {
    if (coords.length === 0) return "";
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    coords.forEach(coord => {
        if (coord.latitude < minLat) minLat = coord.latitude;
        if (coord.latitude > maxLat) maxLat = coord.latitude;
        if (coord.longitude < minLng) minLng = coord.longitude;
        if (coord.longitude > maxLng) maxLng = coord.longitude;
    });
    const latDiff = Math.max(maxLat - minLat, 0.00001);
    const lngDiff = Math.max(maxLng - minLng, 0.00001);
    const usableWidth = width - (padding * 2);
    const usableHeight = height - (padding * 2);
    const scale = Math.min(usableWidth / lngDiff, usableHeight / latDiff);
    const offsetX = (width - (lngDiff * scale)) / 2;
    const offsetY = (height - (latDiff * scale)) / 2;
    return coords.map(coord => {
        const x = ((coord.longitude - minLng) * scale) + offsetX;
        const invertedLat = maxLat - coord.latitude;
        const y = (invertedLat * scale) + offsetY;
        if (isNaN(x) || isNaN(y)) return "0,0";
        return `${x},${y}`;
    }).join(" ");
};

const downsample = (data: number[], limit: number) => {
    if (!data || data.length === 0) return [0];
    if (data.length <= limit) return data;
    const factor = Math.max(1, Math.floor(data.length / limit));
    const result = data.filter((_, i) => i % factor === 0).slice(0, limit);
    return result.length > 0 ? result : [0];
};

const getMetricData = (streams: any, type: string) => {
    if (!streams) return [];
    if (type === 'speed') return streams.velocity_smooth?.data?.map((v: number) => v * 3.6) || [];
    if (type === 'altitude') return streams.altitude?.data || [];
    if (type === 'heartrate') return streams.heartrate?.data || [];
    if (type === 'cadence') return streams.cadence?.data || [];
    if (type === 'pace') {
        return streams.velocity_smooth?.data?.map((v: number) => {
            if (v <= 0.1) return 0; // Cap slow speeds
            const paceMinPerKm = 16.66667 / v;
            return Math.min(paceMinPerKm, 20); // Cap at 20 min/km
        }) || [];
    }
    return [];
};

// --- Grid Overlay Component ---
const GridOverlay = ({ type, width, height }: { type: string, width: number, height: number }) => {
    if (!type || type === 'none') return null;

    const renderThirds = () => (
        <>
            <View style={[styles.gridLineV, { left: '33.33%', height: '100%' }]} />
            <View style={[styles.gridLineV, { left: '66.66%', height: '100%' }]} />
            <View style={[styles.gridLineH, { top: '33.33%', width: '100%' }]} />
            <View style={[styles.gridLineH, { top: '66.66%', width: '100%' }]} />
        </>
    );

    const renderSquares = () => {
        const rows = 8;
        const cols = 8;
        return (
            <>
                {Array.from({ length: rows - 1 }).map((_, i) => (
                    <View key={`h-${i}`} style={[styles.gridLineH, { top: `${(i + 1) * (100 / rows)}%`, width: '100%' }]} />
                ))}
                {Array.from({ length: cols - 1 }).map((_, i) => (
                    <View key={`v-${i}`} style={[styles.gridLineV, { left: `${(i + 1) * (100 / cols)}%`, height: '100%' }]} />
                ))}
            </>
        );
    };

    const renderGolden = () => {
        const phi = 0.618;
        const invPhi = 1 - phi;
        return (
            <>
                <View style={[styles.gridLineV, { left: `${invPhi * 100}%`, height: '100%' }]} />
                <View style={[styles.gridLineV, { left: `${phi * 100}%`, height: '100%' }]} />
                <View style={[styles.gridLineH, { top: `${invPhi * 100}%`, width: '100%' }]} />
                <View style={[styles.gridLineH, { top: `${phi * 100}%`, width: '100%' }]} />
            </>
        );
    };

    return (
        <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
            {type === 'thirds' && renderThirds()}
            {type === 'squares' && renderSquares()}
            {type === 'golden' && renderGolden()}
        </View>
    );
};

// --- Premium Graph Component ---
const PremiumGraph = ({ element, streamsData }: { element: CanvasElement, streamsData: any }) => {
    const metrics = element.isOverlay ? (element.overlayMetrics || ['pace', 'heartrate', 'altitude']) : [element.metricType || 'speed'];
    const colors = element.isOverlay ? (element.colors || ['#8A8D9F', '#F2215A', '#4ADE80']) : [element.color];

    const getNormalizedData = (m: string): number[] => {
        const raw = getMetricData(streamsData, m);
        if (!raw || raw.length === 0) return [0];
        if (!element.isOverlay || metrics.length === 1) return raw;

        const max = Math.max(...raw, 1);
        const min = Math.min(...raw);
        const range = max - min || 1;
        return raw.map((v: number) => ((v - min) / range) * 100);
    };

    const getMinMax = (m: string) => {
        const raw = getMetricData(streamsData, m);
        const max = Math.max(...raw, 0);
        const min = Math.min(...raw, 0);

        const formatValue = (v: number) => {
            if (m === 'pace') {
                const mins = Math.floor(v);
                const secs = Math.round((v - mins) * 60);
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            }
            return Math.round(v);
        };

        return { max: formatValue(max), min: formatValue(min) };
    };

    return (
        <View style={styles.graphContainer}>
            <View style={styles.graphHeader}>
                {metrics.map((m, i) => {
                    const data = getMetricData(streamsData, m);
                    const avg = data.length > 0 ? Math.round(data.reduce((a: number, b: number) => a + b, 0) / data.length) : 0;

                    let displayAvg = avg.toString();
                    if (m === 'pace') {
                        const min = Math.floor(avg);
                        const sec = Math.round((avg - min) * 60);
                        displayAvg = `${min}:${sec.toString().padStart(2, '0')}`;
                    }

                    return (
                        <View key={m} style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: colors[i % colors.length], shadowColor: colors[i % colors.length], shadowRadius: 4, shadowOpacity: 0.8, elevation: 4 }]} />
                            <Text style={[styles.legendText, { color: colors[i % colors.length] }]}>
                                {METRIC_LABELS[m]}
                                <Text style={{ fontWeight: '400', opacity: 0.8 }}>
                                    {` ${displayAvg}${METRIC_UNITS[m]}`}
                                </Text>
                            </Text>
                        </View>
                    );
                })}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginLeft: -35 }}>
                <View style={{ flex: 1 }}>
                    <LineChart
                        data={{
                            labels: [],
                            datasets: metrics.map((m, idx) => ({
                                data: downsample(getNormalizedData(m), 40),
                                color: (opacity = 1) => colors[idx % colors.length],
                                strokeWidth: element.strokeWidth || 1
                            }))
                        }}
                        width={260}
                        height={150}
                        chartConfig={{
                            backgroundColor: 'transparent',
                            backgroundGradientFrom: 'transparent',
                            backgroundGradientFromOpacity: 0,
                            backgroundGradientTo: 'transparent',
                            backgroundGradientToOpacity: 0,
                            fillShadowGradient: 'transparent',
                            fillShadowGradientOpacity: 0,
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                            style: { borderRadius: 16 },
                            propsForDots: { r: "0" }
                        }}
                        bezier
                        withInnerLines={false}
                        withOuterLines={false}
                        withVerticalLabels={false}
                        withHorizontalLabels={false}
                        style={{ marginVertical: 8, borderRadius: 16 }}
                    />
                </View>

                <View style={styles.yAxis}>
                    {metrics.map((m, i) => {
                        const { max, min } = getMinMax(m);
                        return (
                            <View key={`y-${m}`} style={styles.yCol}>
                                <Text style={[styles.yText, { color: colors[i % colors.length] }]}>{max}</Text>
                                <View style={{ flex: 1 }} />
                                <Text style={[styles.yText, { color: colors[i % colors.length] }]}>{min}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};

const DraggableWrapper = ({ element, selected, onSelect, onMove, onScale, onRotate, children }: any) => {
    const translationX = useSharedValue(element.x);
    const translationY = useSharedValue(element.y);
    const scale = useSharedValue(element.scale);
    const savedScale = useSharedValue(element.scale);
    const rotation = useSharedValue(element.rotation || 0);
    const savedRotation = useSharedValue(element.rotation || 0);

    useEffect(() => {
        translationX.value = element.x;
        translationY.value = element.y;
        scale.value = element.scale;
        savedScale.value = element.scale;
        rotation.value = element.rotation || 0;
        savedRotation.value = element.rotation || 0;
    }, [element.x, element.y, element.scale, element.rotation]);

    const tapGesture = Gesture.Tap()
        .onEnd(() => {
            if (onSelect) runOnJS(onSelect)(element.id);
        });

    const panGesture = Gesture.Pan()
        .onStart(() => {
            if (onSelect) runOnJS(onSelect)(element.id);
        })
        .onChange((event) => {
            translationX.value += event.changeX;
            translationY.value += event.changeY;
        })
        .onEnd(() => {
            if (onMove) runOnJS(onMove)(element.id, translationX.value, translationY.value);
        });

    const pinchGesture = Gesture.Pinch()
        .onStart(() => {
            if (onSelect) runOnJS(onSelect)(element.id);
        })
        .onChange((event) => {
            scale.value = Math.max(0.1, savedScale.value * event.scale);
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            if (onScale) runOnJS(onScale)(element.id, scale.value);
        });

    const rotationGesture = Gesture.Rotation()
        .onStart(() => {
            if (onSelect) runOnJS(onSelect)(element.id);
        })
        .onChange((event) => {
            rotation.value = savedRotation.value + (event.rotation * 180 / Math.PI);
        })
        .onEnd(() => {
            savedRotation.value = rotation.value;
            if (onRotate) runOnJS(onRotate)(element.id, rotation.value);
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translationX.value },
            { translateY: translationY.value },
            { scale: scale.value },
            { rotate: `${rotation.value}deg` }
        ],
        zIndex: selected ? 100 : 1
    }));

    const composed = Gesture.Simultaneous(panGesture, pinchGesture, rotationGesture);
    const combined = Gesture.Exclusive(composed, tapGesture);

    return (
        <GestureDetector gesture={combined}>
            <Animated2.View style={[styles.draggable, animatedStyle]}>
                <View style={[selected && styles.selectedBorderOutline, { opacity: element.opacity ?? 1 }]}>
                    {selected && (
                        <>
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                        </>
                    )}
                    {children}
                </View>
            </Animated2.View>
        </GestureDetector>
    );
};

export default function VisualsScreen() {
    const params = useLocalSearchParams<{ id?: string; activityId?: string }>();
    const id = params.activityId || params.id;
    const router = useRouter();

    console.log('[visuals] params:', JSON.stringify(params), 'resolved id:', id);
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

    const [activity, setActivity] = useState<any>(null);
    const [routeCoords, setRouteCoords] = useState<any[]>([]);
    const [streamsData, setStreamsData] = useState<any>(null);

    // Canvas State
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [transparentMode, setTransparentMode] = useState(false);
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [elements, setElements] = useState<CanvasElement[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Editor UI State
    const [loading, setLoading] = useState(true);
    const [showSetup, setShowSetup] = useState(false);
    const [setupSelection, setSetupSelection] = useState<string[]>(['title', 'map', 'stats']);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [activeTab, setActiveTab] = useState<'layout' | 'elements' | 'style' | null>(null);
    const [gridType, setGridType] = useState<'none' | 'thirds' | 'squares' | 'golden'>('none');

    const viewShotRef = useRef<any>(null);
    const canvasViewRef = useRef<View>(null);

    // Initial Load
    useEffect(() => {
        const loadInitialData = async () => {
            if (!id) return;
            try {
                const token = Platform.OS === 'web'
                    ? localStorage.getItem('user_token')
                    : await SecureStore.getItemAsync('user_token');
                if (!token) return;

                const actRes = await axios.get(`${API_URL}/strava/activities/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                const act = actRes.data;
                setActivity(act);

                if (act.map?.summary_polyline) {
                    const points = polylineLib.decode(act.map.summary_polyline);
                    setRouteCoords(points.map(p => ({ latitude: p[0], longitude: p[1] })));
                }

                if (elements.length === 0) {
                    setShowSetup(true);
                }

                try {
                    const streamRes = await axios.get(`${API_URL}/strava/activities/${id}/streams`, { headers: { Authorization: `Bearer ${token}` } });
                    setStreamsData(streamRes.data);
                } catch (streamErr: any) {
                    // 404 is expected for manual/GPS-less activities — not an error
                    if (streamErr?.response?.status !== 404) {
                        console.error('[visuals] streams fetch failed:', streamErr);
                    }
                }
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        loadInitialData();
    }, [id]);

    const { canvasWidth, canvasHeight } = useMemo(() => {
        const headerH = 100;
        const footerH = 100;

        let availW = screenWidth - 30;
        let availH = screenHeight - headerH - footerH;

        let hRatio = 1;
        if (aspectRatio === '4:5') hRatio = 1.25;
        else if (aspectRatio === '9:16') hRatio = 1.7778;
        else if (aspectRatio === '16:9') hRatio = 0.5625;

        let targetW = availW;
        let targetH = targetW * hRatio;

        if (targetH > availH) {
            targetH = availH;
            targetW = targetH / hRatio;
        }

        return { canvasWidth: targetW, canvasHeight: targetH };
    }, [aspectRatio, screenWidth, screenHeight]);

    const mapPath = useMemo(() => {
        if (routeCoords.length === 0) return "";
        return normalizeCoordsForSvg(routeCoords, 250, 250, 20);
    }, [routeCoords]);

    const handleMove = (id: string, x: number, y: number) => setElements(prev => prev.map(el => el.id === id ? { ...el, x, y } : el));
    const handleScale = (id: string, scale: number) => setElements(prev => prev.map(el => el.id === id ? { ...el, scale } : el));
    const handleRotate = (id: string, rotation: number) => setElements(prev => prev.map(el => el.id === id ? { ...el, rotation } : el));
    const updateElement = (id: string | null, updates: Partial<CanvasElement>) => id && setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    const toggleElement = (id: string) => setElements(prev => prev.map(el => el.id === id ? { ...el, visible: !el.visible } : el));

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 1 });
        if (!result.canceled) { setBackgroundImage(result.assets[0].uri); setTransparentMode(false); }
    };

    const addElement = (type: string) => {
        const id = `${type}-${Date.now()}`;
        let newEl: any = { id, type: 'stat', x: 50, y: 50, scale: 1, rotation: 0, color: '#FFF', visible: true, opacity: 1 };

        if (type === 'title') { newEl.type = 'title'; newEl.label = 'Title'; }
        else if (type === 'map') { newEl.type = 'map'; newEl.label = 'Map'; newEl.strokeWidth = 6; }
        else if (type === 'dist') { newEl.label = 'Distance'; newEl.value = `${formatDistance(activity.distance)} km`; }
        else if (type === 'time') { newEl.label = 'Time'; newEl.value = formatDuration(activity.moving_time); }
        else if (type === 'cal') { newEl.label = 'Calories'; newEl.value = activity.calories || 0; }
        else if (type === 'pace') {
            const paceSec = activity.moving_time / (activity.distance / 1000);
            const min = Math.floor(paceSec / 60);
            const sec = Math.floor(paceSec % 60);
            newEl.label = 'Pace'; newEl.value = `${min}:${sec.toString().padStart(2, '0')}/km`;
        }
        else if (type === 'graph-single') {
            newEl.type = 'graph'; newEl.label = 'Single Graph'; newEl.metricType = 'speed'; newEl.strokeWidth = 1;
        }
        else if (type === 'graph-overlay') {
            newEl.type = 'graph'; newEl.label = 'Overlay Graph'; newEl.isOverlay = true;
            newEl.overlayMetrics = ['pace', 'heartrate', 'altitude'];
            newEl.colors = ['#8A8D9F', '#F2215A', '#4ADE80'];
            newEl.strokeWidth = 1;
        }

        const existing = elements.find(el => el.id.startsWith(type) || (el.label === newEl.label && el.type === newEl.type));
        if (existing) {
            setElements(prev => prev.map(el => el.id === existing.id ? { ...el, visible: true } : el));
            setSelectedId(existing.id);
        } else {
            setElements([...elements, newEl]);
            setSelectedId(id);
        }
        setShowAddMenu(false);
        setActiveTab('style'); // Open style tab automatically to show options
    };

    const shareVisual = async () => {
        if (!viewShotRef.current) return;
        const currentGrid = gridType;
        setGridType('none');
        setTimeout(async () => {
            try {
                const uri = await viewShotRef.current.capture({ format: 'png', quality: 1 });
                if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
            } catch (err) { console.error(err); } finally { setGridType(currentGrid); }
        }, 100);
    };

    const saveVisual = async () => {
        if (!viewShotRef.current) return;
        const currentGrid = gridType;
        setGridType('none');
        setTimeout(async () => {
            try {
                const { status } = await MediaLibrary.requestPermissionsAsync(true);
                if (status !== 'granted') {
                    alert('Permission to access library is required to save photos.');
                    return;
                }
                const uri = await viewShotRef.current.capture({ format: 'png', quality: 1 });
                await MediaLibrary.saveToLibraryAsync(uri);
                alert('Visual saved to your library!');
            } catch (err) { console.error(err); } finally { setGridType(currentGrid); }
        }, 100);
    };

    if (loading || !activity) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2D60FF" /></View>;
    }

    const selectedElement = elements.find(el => el.id === selectedId);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                {!isFullScreen && (
                    <View style={styles.header}>
                        <Pressable onPress={() => router.back()} style={styles.iconBtn}><ChevronLeft color="#FFF" size={24} /></Pressable>
                        <Text style={styles.headerTitle}>Design Canvas</Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Pressable onPress={() => setIsFullScreen(true)} style={styles.iconBtn}><Maximize2 color="#FFF" size={20} /></Pressable>
                            <Pressable onPress={saveVisual} style={styles.iconBtn}><Download color="#FFF" size={20} /></Pressable>
                            <Pressable onPress={shareVisual} style={[styles.iconBtn, { backgroundColor: '#2D60FF' }]}><ShareIcon color="#FFF" size={20} /></Pressable>
                        </View>
                    </View>
                )}

                {showSetup && (
                    <View style={styles.overlay}>
                        <View style={styles.setupCard}>
                            <Text style={styles.setupTitle}>Setup Your Canvas</Text>
                            <Text style={styles.setupSub}>Choose elements to start with:</Text>
                            {[
                                { id: 'title', label: 'Activity Title' },
                                { id: 'map', label: 'Route Map' },
                                { id: 'stats', label: 'Core Stats (Dist, Time, Cal)' }
                            ].map(item => {
                                const isSelected = setupSelection.includes(item.id);
                                return (
                                    <Pressable
                                        key={item.id}
                                        onPress={() => {
                                            if (isSelected) setSetupSelection(prev => prev.filter(x => x !== item.id));
                                            else setSetupSelection(prev => [...prev, item.id]);
                                        }}
                                        style={[styles.setupItem, isSelected && { borderColor: '#2D60FF', backgroundColor: 'rgba(45, 96, 255, 0.1)' }]}
                                    >
                                        <Text style={{ color: isSelected ? '#FFF' : '#8A8D9F' }}>{item.label}</Text>
                                        <View style={[styles.setupCheck, { backgroundColor: isSelected ? '#2D60FF' : '#4A4C59' }]} />
                                    </Pressable>
                                );
                            })}
                            <Pressable
                                style={styles.setupStartBtn}
                                onPress={() => {
                                    const initialEls: CanvasElement[] = [];
                                    if (setupSelection.includes('title')) initialEls.push({ id: 'title', type: 'title', x: (canvasWidth / 2) - 100, y: 40, scale: 1.2, rotation: 0, color: '#FFF', visible: true });
                                    if (setupSelection.includes('map')) initialEls.push({ id: 'map', type: 'map', x: 50, y: 100, scale: 1, rotation: 0, color: '#FC4C02', visible: true, strokeWidth: 6 });
                                    if (setupSelection.includes('stats')) {
                                        initialEls.push({ id: 'dist', type: 'stat', x: 40, y: canvasHeight - 80, scale: 1, rotation: 0, color: '#FFF', visible: true, label: 'DISTANCE', value: formatDistance(activity.distance) + ' km' });
                                        initialEls.push({ id: 'time', type: 'stat', x: (canvasWidth / 2) - 40, y: canvasHeight - 80, scale: 1, rotation: 0, color: '#FFF', visible: true, label: 'TIME', value: formatDuration(activity.moving_time) });

                                        const paceSec = activity.moving_time / (activity.distance / 1000);
                                        const pMin = Math.floor(paceSec / 60);
                                        const pSec = Math.floor(paceSec % 60);
                                        initialEls.push({ id: 'pace', type: 'stat', x: canvasWidth - 120, y: canvasHeight - 80, scale: 1, rotation: 0, color: '#FFF', visible: true, label: 'PACE', value: `${pMin}:${pSec.toString().padStart(2, '0')}/km` });
                                    }
                                    setElements(initialEls);
                                    setShowSetup(false);
                                }}
                            >
                                <Text style={styles.setupStartText}>Generate Canvas</Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                <Pressable
                    style={styles.canvasMainArea}
                    onPress={() => {
                        setSelectedId(null);
                        setActiveTab(null);
                    }}
                >
                    <View style={[styles.canvasWrapper, { backgroundColor: 'transparent' }]}>
                        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={{ backgroundColor: 'transparent' }}>
                            <View
                                ref={canvasViewRef}
                                style={[styles.canvas, {
                                    width: canvasWidth,
                                    height: canvasHeight,
                                    backgroundColor: transparentMode ? 'transparent' : '#12131A',
                                    borderColor: transparentMode ? 'transparent' : '#2D3246',
                                    borderWidth: transparentMode ? 0 : 1
                                }]}
                            >
                                {backgroundImage && !transparentMode && <Image source={{ uri: backgroundImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
                                {!transparentMode && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />}

                                <GridOverlay type={gridType} width={canvasWidth} height={canvasHeight} />

                                {isFullScreen && (
                                    <Pressable onPress={() => setIsFullScreen(false)} style={styles.exitFullBtn}>
                                        <Minimize2 color="#FFF" size={16} />
                                        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>EXIT</Text>
                                    </Pressable>
                                )}

                                {elements.map(el => el.visible ? (
                                    <View key={el.id}>
                                        <Pressable
                                            onStartShouldSetResponder={() => true}
                                            onResponderTerminationRequest={() => false}
                                            onPress={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
                                        >
                                            <DraggableWrapper
                                                element={el}
                                                selected={selectedId === el.id}
                                                onSelect={setSelectedId}
                                                onMove={handleMove}
                                                onScale={handleScale}
                                                onRotate={handleRotate}
                                            >
                                                {el.type === 'title' && <Text style={[styles.titleText, { color: el.color }]}>{activity.name}</Text>}
                                                {el.type === 'map' && routeCoords.length > 0 && (
                                                    <View style={{ width: 250, height: 250 }}>
                                                        <Svg width="100%" height="100%">
                                                            <SvgPolyline points={mapPath} fill="none" stroke={el.color} strokeWidth={el.strokeWidth || 6} strokeLinecap="round" strokeLinejoin="round" />
                                                        </Svg>
                                                    </View>
                                                )}
                                                {el.type === 'stat' && (
                                                    <View style={{ alignItems: 'center' }}>
                                                        <Text style={[styles.statVal, { color: el.color }]}>{el.value}</Text>
                                                        <Text style={[styles.statLabel, { color: el.color, opacity: 0.7 }]}>{el.label}</Text>
                                                    </View>
                                                )}
                                                {el.type === 'graph' && streamsData && (
                                                    <PremiumGraph element={el} streamsData={streamsData} />
                                                )}
                                            </DraggableWrapper>
                                        </Pressable>
                                    </View>
                                ) : null)}
                            </View>
                        </ViewShot>
                    </View>
                </Pressable>

                {!isFullScreen && (
                    <View style={styles.floatingToolbarContainer}>
                        <View style={styles.tabBar}>
                            {[
                                { id: 'layout', icon: Grid },
                                { id: 'elements', icon: Layers },
                                { id: 'style', icon: Droplets }
                            ].map((t: any) => (
                                <Pressable key={t.id} onPress={() => setActiveTab(activeTab === t.id ? null : t.id)} style={[styles.tabBtn, activeTab === t.id && styles.activeTabBtn]}>
                                    <t.icon size={24} color={activeTab === t.id ? '#FFF' : '#8A8D9F'} />
                                </Pressable>
                            ))}
                        </View>
                    </View>
                )}

                {activeTab && !isFullScreen && (
                    <View style={styles.modalOverlay}>
                        <Pressable style={StyleSheet.absoluteFill} onPress={() => setActiveTab(null)} />
                        <View style={styles.editorModal}>
                            <View style={styles.panelHeader}>
                                <Text style={styles.modalTitle}>{activeTab.toUpperCase()}</Text>
                                <Pressable onPress={() => setActiveTab(null)}><X size={20} color="#FFF" /></Pressable>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {activeTab === 'layout' && (
                                    <View>
                                        <Text style={styles.modalSub}>ASPECT RATIO</Text>
                                        <View style={styles.ratioGrid}>
                                            {RATIOS.map(r => (
                                                <Pressable key={r} onPress={() => setAspectRatio(r)} style={[styles.ratioBtn, aspectRatio === r && styles.activeRatioBtn]}>
                                                    <Text style={[styles.ratioText, aspectRatio === r && { color: '#FFF' }]}>{r}</Text>
                                                </Pressable>
                                            ))}
                                        </View>

                                        <Text style={styles.modalSub}>CANVAS BACKGROUND</Text>
                                        <View style={styles.actionRow}>
                                            <Pressable onPress={pickImage} style={styles.fullBtn}><ImageIcon size={18} color="#FFF" /><Text style={styles.btnText}>Photo</Text></Pressable>
                                            <Pressable onPress={() => setTransparentMode(!transparentMode)} style={[styles.fullBtn, transparentMode && { backgroundColor: '#FC4C02' }]}><Text style={styles.btnText}>Transparent</Text></Pressable>
                                        </View>

                                        <Text style={styles.modalSub}>COMPOSITION GRIDS</Text>
                                        <View style={styles.ratioGrid}>
                                            {[
                                                { id: 'none', label: 'None' },
                                                { id: 'thirds', label: 'Thirds' },
                                                { id: 'squares', label: 'Squares' },
                                                { id: 'golden', label: 'Golden' }
                                            ].map(g => (
                                                <Pressable key={g.id} onPress={() => setGridType(g.id as any)} style={[styles.ratioBtn, gridType === g.id && styles.activeRatioBtn]}>
                                                    <Text style={[styles.ratioText, gridType === g.id && { color: '#FFF' }]}>{g.label}</Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {activeTab === 'elements' && (
                                    <View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                            <Text style={styles.modalSub}>ACTIVE LAYERS</Text>
                                            <Pressable style={styles.addTrigger} onPress={() => setShowAddMenu(true)}>
                                                <Plus size={20} color="#2D60FF" />
                                            </Pressable>
                                        </View>

                                        <View style={{ gap: 8 }}>
                                            {elements.map(el => (
                                                <View key={el.id} style={[styles.layerItem, selectedId === el.id && styles.activeLayer]}>
                                                    <Pressable onPress={() => setSelectedId(el.id)} style={{ flex: 1 }}>
                                                        <Text style={{ color: selectedId === el.id ? '#FFF' : '#8A8D9F', fontWeight: '800' }}>{el.label || el.type.toUpperCase()}</Text>
                                                    </Pressable>
                                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                                        <Pressable onPress={() => toggleElement(el.id)}>{el.visible ? <Eye size={18} color="#2D60FF" /> : <X size={18} color="#4A4C59" />}</Pressable>
                                                        <Pressable onPress={() => setElements(prev => prev.filter(x => x.id !== el.id))}><Trash2 size={18} color="#F2215A" /></Pressable>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {activeTab === 'style' && (
                                    selectedElement ? (
                                        <View>
                                            <Text style={styles.modalSub}>ROTATION: {Math.round(selectedElement.rotation || 0)}°</Text>
                                            <View style={styles.sRow}>
                                                <Pressable onPress={() => updateElement(selectedId, { rotation: (selectedElement.rotation || 0) - 15 })} style={styles.sBtn}><Text style={{ color: '#FFF' }}>-</Text></Pressable>
                                                <View style={styles.sTrack}><View style={[styles.sFill, { width: `${((selectedElement.rotation || 0) + 180) / 360 * 100}%` }]} /></View>
                                                <Pressable onPress={() => updateElement(selectedId, { rotation: (selectedElement.rotation || 0) + 15 })} style={styles.sBtn}><Text style={{ color: '#FFF' }}>+</Text></Pressable>
                                            </View>

                                            {(selectedElement.type === 'map' || selectedElement.type === 'graph') && (
                                                <View style={{ marginBottom: 20 }}>
                                                    <Text style={styles.modalSub}>LINE THICKNESS</Text>
                                                    <View style={styles.sRow}>
                                                        <Pressable onPress={() => updateElement(selectedId, { strokeWidth: Math.max(1, (selectedElement.strokeWidth ?? (selectedElement.type === 'map' ? 6 : 3)) - 1) })} style={styles.sBtn}><Text style={{ color: '#FFF' }}>-</Text></Pressable>
                                                        <View style={styles.sTrack}><View style={[styles.sFill, { width: `${((selectedElement.strokeWidth ?? (selectedElement.type === 'map' ? 6 : 3)) / 20) * 100}%` }]} /></View>
                                                        <Pressable onPress={() => updateElement(selectedId, { strokeWidth: Math.min(20, (selectedElement.strokeWidth ?? (selectedElement.type === 'map' ? 6 : 3)) + 1) })} style={styles.sBtn}><Text style={{ color: '#FFF' }}>+</Text></Pressable>
                                                    </View>
                                                </View>
                                            )}

                                            {selectedElement.type === 'graph' && selectedElement.isOverlay && (
                                                <View style={{ marginBottom: 20 }}>
                                                    <Text style={styles.modalSub}>OVERLAY METRICS (MAX 3)</Text>
                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                                                        {Object.keys(METRIC_LABELS).map(m => {
                                                            const isIncluded = selectedElement.overlayMetrics?.includes(m);
                                                            return (
                                                                <Pressable
                                                                    key={m}
                                                                    onPress={() => {
                                                                        let next = [...(selectedElement.overlayMetrics || [])];
                                                                        if (isIncluded) {
                                                                            next = next.filter(x => x !== m);
                                                                        } else if (next.length < 3) {
                                                                            next.push(m);
                                                                        }
                                                                        updateElement(selectedId, { overlayMetrics: next });
                                                                    }}
                                                                    style={[styles.ratioBtn, isIncluded && styles.activeRatioBtn, { paddingHorizontal: 15 }]}
                                                                >
                                                                    <Text style={[styles.ratioText, isIncluded && { color: '#FFF' }]}>{METRIC_LABELS[m]}</Text>
                                                                </Pressable>
                                                            );
                                                        })}
                                                    </View>

                                                    <Text style={[styles.modalSub, { marginTop: 20 }]}>METRIC COLORS</Text>
                                                    {(selectedElement.overlayMetrics || []).map((m, i) => (
                                                        <View key={`clr-${m}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                                                            <Text style={{ color: '#8A8D9F', fontSize: 10, fontWeight: '800', width: 80 }}>{METRIC_LABELS[m]}</Text>
                                                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                                                {['#8A8D9F', '#F2215A', '#4ADE80', '#2D60FF', '#FC4C02', '#FFD700'].map(c => (
                                                                    <Pressable
                                                                        key={c}
                                                                        onPress={() => {
                                                                            const nextClrs = [...(selectedElement.colors || [])];
                                                                            nextClrs[i] = c;
                                                                            updateElement(selectedId, { colors: nextClrs });
                                                                        }}
                                                                        style={[styles.dot, { backgroundColor: c, borderWidth: 2, borderColor: selectedElement.colors?.[i] === c ? '#FFF' : 'transparent' }]}
                                                                    />
                                                                ))}
                                                            </View>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}

                                            {selectedElement.type === 'graph' && !selectedElement.isOverlay && (
                                                <View style={{ marginBottom: 20 }}>
                                                    <Text style={styles.modalSub}>GRAPH METRICS</Text>
                                                    <View style={styles.ratioGrid}>
                                                        {['speed', 'altitude', 'heartrate', 'cadence'].map(m => {
                                                            const isSelected = selectedElement.isOverlay
                                                                ? selectedElement.overlayMetrics?.includes(m)
                                                                : selectedElement.metricType === m;
                                                            return (
                                                                <Pressable
                                                                    key={m}
                                                                    onPress={() => {
                                                                        if (selectedElement.isOverlay) {
                                                                            const current = selectedElement.overlayMetrics || [];
                                                                            const next = current.includes(m)
                                                                                ? current.filter(x => x !== m)
                                                                                : [...current, m].slice(0, 2);
                                                                            updateElement(selectedId, { overlayMetrics: next });
                                                                        } else {
                                                                            updateElement(selectedId, { metricType: m as any });
                                                                        }
                                                                    }}
                                                                    style={[styles.ratioBtn, isSelected && styles.activeRatioBtn]}
                                                                >
                                                                    <Text style={[styles.ratioText, isSelected && { color: '#FFF' }]}>{m.toUpperCase()}</Text>
                                                                </Pressable>
                                                            );
                                                        })}
                                                    </View>
                                                </View>
                                            )}

                                            <Text style={styles.modalSub}>OPACITY</Text>
                                            <View style={styles.sRow}>
                                                <Pressable onPress={() => updateElement(selectedId, { opacity: Math.max(0, (selectedElement.opacity ?? 1) - 0.1) })} style={styles.sBtn}><Text style={{ color: '#FFF' }}>-</Text></Pressable>
                                                <View style={styles.sTrack}><View style={[styles.sFill, { width: `${(selectedElement.opacity ?? 1) * 100}%` }]} /></View>
                                                <Pressable onPress={() => updateElement(selectedId, { opacity: Math.min(1, (selectedElement.opacity ?? 1) + 0.1) })} style={styles.sBtn}><Text style={{ color: '#FFF' }}>+</Text></Pressable>
                                            </View>

                                            <Text style={styles.modalSub}>COLOR CUSTOMIZATION</Text>
                                            <AdvancedColorPicker
                                                color={selectedElement.isOverlay ? (selectedElement.colors?.[0] || '#FFF') : selectedElement.color}
                                                onColorChange={(c) => {
                                                    if (selectedElement.isOverlay) {
                                                        const next = [...(selectedElement.colors || ['#FFF', '#FFF', '#FFF'])];
                                                        next[0] = c;
                                                        updateElement(selectedId, { colors: next });
                                                    } else {
                                                        updateElement(selectedId, { color: c });
                                                    }
                                                }}
                                            />

                                            {selectedElement.isOverlay && (selectedElement.overlayMetrics || []).length > 1 && (
                                                <View style={{ marginTop: 15 }}>
                                                    <Text style={styles.modalSub}>SECONDARY METRIC COLOR</Text>
                                                    <AdvancedColorPicker
                                                        color={selectedElement.colors?.[1] || '#FFF'}
                                                        onColorChange={(c) => {
                                                            const next = [...(selectedElement.colors || ['#FFF', '#FFF', '#FFF'])];
                                                            next[1] = c;
                                                            updateElement(selectedId, { colors: next });
                                                        }}
                                                    />
                                                </View>
                                            )}
                                        </View>
                                    ) : (
                                        <View style={{ padding: 40, alignItems: 'center' }}>
                                            <Info size={32} color="#2D3246" />
                                            <Text style={styles.emptyMsg}>Tap an item on your canvas to modify its style</Text>
                                        </View>
                                    )
                                )}
                            </ScrollView>
                        </View>
                    </View>
                )}

                {showAddMenu && (
                    <View style={styles.overFullScreenAdd}>
                        <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowAddMenu(false)} />
                        <View style={styles.modalContent}>
                            <View style={[styles.panelHeader, { marginBottom: 20 }]}>
                                <Text style={styles.modalTitle}>ADD TO CANVAS</Text>
                                <Pressable onPress={() => setShowAddMenu(false)}><X size={24} color="#FFF" /></Pressable>
                            </View>
                            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
                                <Text style={styles.modalSub}>BASICS</Text>
                                <Pressable style={styles.modalItem} onPress={() => addElement('title')}><Type size={20} color="#2D60FF" /><Text style={styles.modalItemText}>Activity Title</Text></Pressable>
                                <Pressable style={styles.modalItem} onPress={() => addElement('map')}><MapIcon size={20} color="#2D60FF" /><Text style={styles.modalItemText}>Route Map</Text></Pressable>

                                <Text style={styles.modalSub}>METRICS</Text>
                                <Pressable style={styles.modalItem} onPress={() => addElement('dist')}><ActivityIcon size={20} color="#2D60FF" /><Text style={styles.modalItemText}>Total Distance</Text></Pressable>
                                <Pressable style={styles.modalItem} onPress={() => addElement('time')}><Timer size={20} color="#2D60FF" /><Text style={styles.modalItemText}>Moving Time</Text></Pressable>
                                <Pressable style={styles.modalItem} onPress={() => addElement('cal')}><Zap size={20} color="#2D60FF" /><Text style={styles.modalItemText}>Calories Burnt</Text></Pressable>
                                <Pressable style={styles.modalItem} onPress={() => addElement('pace')}><TrendingUp size={20} color="#2D60FF" /><Text style={styles.modalItemText}>Average Pace</Text></Pressable>

                                <Text style={styles.modalSub}>GRAPHS</Text>
                                <Pressable style={styles.modalItem} onPress={() => addElement('graph-single')}><BarChart2 size={20} color="#F2215A" /><Text style={styles.modalItemText}>Single Metric Graph</Text></Pressable>
                                <Pressable style={styles.modalItem} onPress={() => addElement('graph-overlay')}><Layers size={20} color="#F2215A" /><Text style={styles.modalItemText}>Overlay Multiple Graphs</Text></Pressable>
                            </ScrollView>
                        </View>
                    </View>
                )}

            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0E' },
    loadingContainer: { flex: 1, backgroundColor: '#0A0A0E', alignItems: 'center', justifyContent: 'center' },
    header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'web' ? 20 : 60, paddingHorizontal: 20, paddingBottom: 15, backgroundColor: 'rgba(10,10,14,0.7)' },
    iconBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(28,28,36,0.8)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
    canvasMainArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    canvasWrapper: { marginTop: 40 },
    canvas: { borderRadius: 12, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: '#2D3246' },
    exitFullBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 1000 },
    draggable: { position: 'absolute' },
    selectedBorderOutline: { borderStyle: 'solid', borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', borderRadius: 4 },
    corner: { position: 'absolute', width: 8, height: 8, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#2D60FF', zIndex: 101, borderRadius: 4 },
    topLeft: { left: -4, top: -4 },
    topRight: { right: -4, top: -4 },
    bottomLeft: { left: -4, bottom: -4 },
    bottomRight: { right: -4, bottom: -4 },
    titleText: { fontSize: 24, fontWeight: '900', padding: 5, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
    statVal: { fontSize: 20, fontWeight: '900' },
    statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

    // Graph Styles
    graphCard: {
        width: 300,
        backgroundColor: 'transparent',
        borderRadius: 16,
        padding: 5,
    },
    graphHeader: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 5,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 10,
        fontWeight: '900',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 3,
    },

    yAxis: {
        width: 45,
        height: 130,
        marginTop: 10,
        flexDirection: 'row',
        gap: 4,
    },
    yCol: { alignItems: 'center', justifyContent: 'space-between' },
    yText: {
        fontSize: 9,
        fontWeight: '900',
        width: 28,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,1)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 4,
    },

    floatingToolbarContainer: { position: 'absolute', bottom: 30, width: '100%', alignItems: 'center', zIndex: 1000 },
    tabBar: { flexDirection: 'row', backgroundColor: 'rgba(28,28,36,0.95)', borderRadius: 32, padding: 8, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    tabBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
    activeTabBtn: { backgroundColor: '#2D60FF' },

    modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2000, alignItems: 'center', justifyContent: 'center', padding: 20 },
    editorModal: { backgroundColor: '#1C1C24', borderRadius: 32, padding: 25, width: '100%', maxWidth: 450, maxHeight: '80%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    modalTitle: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
    modalSub: { color: '#8A8D9F', fontSize: 10, fontWeight: '900', marginTop: 15, marginBottom: 10, letterSpacing: 1 },

    overFullScreenAdd: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 3000, alignItems: 'center', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#1C1C24', borderRadius: 32, padding: 25, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modalItem: { flexDirection: 'row', alignItems: 'center', gap: 15, backgroundColor: '#12131A', padding: 18, borderRadius: 18, marginBottom: 8 },
    modalItemText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

    ratioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
    ratioBtn: { flex: 1, minWidth: '45%', backgroundColor: 'rgba(18,19,26,0.8)', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2D3246' },
    activeRatioBtn: { borderColor: '#2D60FF', backgroundColor: 'rgba(45, 96, 255, 0.1)' },
    ratioText: { color: '#8A8D9F', fontWeight: '800', fontSize: 13 },

    actionRow: { flexDirection: 'row', gap: 8 },
    fullBtn: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(18,19,26,0.8)', padding: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#2D3246' },
    btnText: { color: '#FFF', fontWeight: '700', fontSize: 12 },

    addTrigger: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#12131A', alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
    layerItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(18,19,26,0.8)', padding: 14, borderRadius: 14, marginBottom: 6 },
    activeLayer: { borderColor: '#2D60FF', borderWidth: 1 },

    sRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    sBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#12131A', alignItems: 'center', justifyContent: 'center' },
    sTrack: { flex: 1, height: 4, backgroundColor: '#12131A', borderRadius: 2 },
    sFill: { height: '100%', backgroundColor: '#2D60FF', borderRadius: 2 },
    dot: { width: 32, height: 32, borderRadius: 16, marginRight: 10, borderWidth: 2, borderColor: 'transparent' },
    activeDot: { borderColor: '#FFF' },
    hueRow: { marginTop: 5 },
    hueBox: { width: 28, height: 28, borderRadius: 6, marginRight: 6 },

    cpContainer: { marginTop: 10, marginBottom: 20 },
    cpArea: { width: 150, height: 100, borderRadius: 8, overflow: 'hidden', alignSelf: 'center', borderWidth: 1, borderColor: '#333' },
    cpCursor: { position: 'absolute', width: 12, height: 12, borderRadius: 6, borderWidth: 2, marginLeft: -6, marginTop: -6 },
    cpBarContainer: { marginTop: 15, height: 16, borderRadius: 8, overflow: 'visible', width: 200, alignSelf: 'center' },
    cpSpectrum: { flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden' },
    cpHueSlider: { position: 'absolute', width: 4, height: 20, backgroundColor: '#FFF', borderRadius: 2, top: -2, marginLeft: -2, borderWidth: 1, borderColor: '#000' },
    cpInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, gap: 10 },
    cpPreview: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
    cpInput: { flex: 1, height: 40, backgroundColor: '#12131A', borderRadius: 8, paddingHorizontal: 12, color: '#FFF', fontSize: 13, fontWeight: '800', borderWidth: 1, borderColor: '#333' },
    cpOkBtn: { backgroundColor: '#2D60FF', paddingHorizontal: 15, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    cpOkText: { color: '#FFF', fontWeight: '900', fontSize: 11 },

    emptyMsg: { color: '#4A4C59', textAlign: 'center', padding: 10, fontSize: 13 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10000, alignItems: 'center', justifyContent: 'center', padding: 20 },
    setupCard: { backgroundColor: '#1C1C24', padding: 25, borderRadius: 24, width: '100%', maxWidth: 350 },
    setupTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
    setupSub: { color: '#8A8D9F', fontSize: 13, textAlign: 'center', marginBottom: 20 },
    setupItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#12131A', padding: 15, borderRadius: 12, marginBottom: 10 },
    setupCheck: { width: 16, height: 16, borderRadius: 8 },
    setupStartBtn: { backgroundColor: '#2D60FF', padding: 16, borderRadius: 16, marginTop: 15, alignItems: 'center' },
    setupStartText: { color: '#FFF', fontSize: 14, fontWeight: '900' },

    graphContainer: {
        width: 300,
        backgroundColor: 'transparent',
        padding: 10,
    },
    gridLineV: { position: 'absolute', width: 1, backgroundColor: 'rgba(255,255,255,0.15)', top: 0, bottom: 0, borderStyle: 'dotted' },
    gridLineH: { position: 'absolute', height: 1, backgroundColor: 'rgba(255,255,255,0.15)', left: 0, right: 0, borderStyle: 'dotted' }
});
