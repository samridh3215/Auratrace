import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions, ScrollView, Image, Animated, PanResponder, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Image as ImageIcon, Share as ShareIcon, Trash2, Layers, Droplets, Grid, Filter, Plus, ChevronRight, Eye, Info } from 'lucide-react-native';
import Svg, { Polyline as SvgPolyline } from 'react-native-svg';
import polylineLib from '@mapbox/polyline';
import * as ImagePicker from 'expo-image-picker';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
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
    color: string;
    visible: boolean;
    label?: string;
    value?: string | number;
    metrics?: { name: string, color: string }[]; // for merged graphs
    opacity?: number;
}

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
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const usableWidth = width - (padding * 2);
    const usableHeight = height - (padding * 2);
    const scale = Math.min(usableWidth / (lngDiff || 1), usableHeight / (latDiff || 1));
    const offsetX = (width - (lngDiff * scale)) / 2;
    const offsetY = (height - (latDiff * scale)) / 2;
    return coords.map(coord => {
        const x = ((coord.longitude - minLng) * scale) + offsetX;
        const invertedLat = maxLat - coord.latitude;
        const y = (invertedLat * scale) + offsetY;
        return `${x},${y}`;
    }).join(" ");
};

const DraggableWrapper = ({ element, selected, onSelect, onMove, children }: any) => {
    const pan = useRef(new Animated.ValueXY({ x: element.x, y: element.y })).current;

    useEffect(() => {
        pan.setValue({ x: element.x, y: element.y });
    }, [element.x, element.y]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                onSelect(element.id);
                pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
            onPanResponderRelease: () => {
                pan.flattenOffset();
                onMove(element.id, (pan.x as any)._value, (pan.y as any)._value);
            }
        })
    ).current;

    return (
        <Animated.View
            style={[
                styles.draggable,
                {
                    transform: [
                        { translateX: pan.x },
                        { translateY: pan.y },
                        { scale: element.scale }
                    ],
                    zIndex: selected ? 100 : 1
                }
            ]}
            {...panResponder.panHandlers}
        >
            <View style={[selected && styles.selectedBorder]}>
                {children}
            </View>
        </Animated.View>
    );
};

export default function VisualsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [activity, setActivity] = useState<any>(null);
    const [routeCoords, setRouteCoords] = useState<any[]>([]);
    const [streamsData, setStreamsData] = useState<any>(null);

    // Canvas State
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [transparentMode, setTransparentMode] = useState(false);
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [elements, setElements] = useState<CanvasElement[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [canvasScale, setCanvasScale] = useState(1);

    // Editor UI State
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'layout' | 'elements' | 'style' | 'graph'>('layout');

    const viewShotRef = useRef<any>(null);
    const screenWidth = Dimensions.get('window').width;

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

                const streamRes = await axios.get(`${API_URL}/strava/activities/${id}/streams`, { headers: { Authorization: `Bearer ${token}` } });
                setStreamsData(streamRes.data);

                setElements([
                    { id: 'title', type: 'title', x: 20, y: 20, scale: 1, color: '#FFFFFF', visible: true },
                    { id: 'map', type: 'map', x: 40, y: 60, scale: 1, color: '#FC4C02', visible: true },
                    { id: 'dist', type: 'stat', x: 20, y: 280, scale: 1, color: '#FFFFFF', visible: true, label: 'Distance', value: `${formatDistance(act.distance)} km` },
                    { id: 'time', type: 'stat', x: 130, y: 280, scale: 1, color: '#FFFFFF', visible: true, label: 'Time', value: formatDuration(act.moving_time) },
                    { id: 'cal', type: 'stat', x: 230, y: 280, scale: 1, color: '#FFFFFF', visible: true, label: 'Calories', value: act.calories || 0 }
                ]);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        loadInitialData();
    }, [id]);

    const canvasWidth = useMemo(() => {
        const maxWidth = screenWidth - 40;
        if (aspectRatio === '4:5') return maxWidth * 0.8;
        if (aspectRatio === '9:16') return maxWidth * 0.5625;
        return maxWidth;
    }, [aspectRatio, screenWidth]);

    const canvasHeight = useMemo(() => {
        const maxWidth = screenWidth - 40;
        if (aspectRatio === '16:9') return maxWidth * 0.5625;
        return maxWidth;
    }, [aspectRatio, screenWidth]);

    const handleMove = (id: string, x: number, y: number) => setElements(prev => prev.map(el => el.id === id ? { ...el, x, y } : el));
    const updateElement = (id: string | null, updates: Partial<CanvasElement>) => id && setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    const toggleElement = (id: string) => setElements(prev => prev.map(el => el.id === id ? { ...el, visible: !el.visible } : el));

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 1 });
        if (!result.canceled) { setBackgroundImage(result.assets[0].uri); setTransparentMode(false); }
    };

    const shareVisual = async () => {
        if (!viewShotRef.current) return;
        try {
            const uri = await viewShotRef.current.capture();
            if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
        } catch (err) { console.error(err); }
    };

    if (loading || !activity) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2D60FF" /></View>;
    }

    const selectedElement = elements.find(el => el.id === selectedId);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.iconBtn}><ChevronLeft color="#FFF" size={24} /></Pressable>
                <Text style={styles.headerTitle}>Design Canvas</Text>
                <Pressable onPress={shareVisual} style={[styles.iconBtn, { backgroundColor: '#2D60FF' }]}><ShareIcon color="#FFF" size={20} /></Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
                <View style={styles.canvasWrapper}>
                    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
                        <View style={[styles.canvas, { width: canvasWidth, height: canvasHeight, backgroundColor: transparentMode ? 'transparent' : '#12131A' }]}>
                            {backgroundImage && !transparentMode && <Image source={{ uri: backgroundImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
                            {!transparentMode && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />}

                            {elements.map(el => (el.visible && (
                                <DraggableWrapper key={el.id} element={el} selected={selectedId === el.id} onSelect={setSelectedId} onMove={handleMove}>
                                    {el.type === 'title' && <Text style={[styles.titleText, { color: el.color }]}>{activity.name}</Text>}
                                    {el.type === 'map' && routeCoords.length > 0 && (
                                        <View style={{ width: 250, height: 250 }}>
                                            <Svg width="100%" height="100%">
                                                <SvgPolyline points={normalizeCoordsForSvg(routeCoords, 250, 250, 20)} fill="none" stroke={el.color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
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
                                        <View style={{ width: 250, height: 120, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 15, padding: 10 }}>
                                            <LineChart
                                                data={{
                                                    labels: [],
                                                    datasets: (el.metrics || []).map(m => ({
                                                        data: streamsData[m.name]?.data?.filter((_: any, i: number) => i % 40 === 0) || [0, 0, 0],
                                                        color: () => m.color
                                                    }))
                                                }}
                                                width={230} height={100} withDots={false} withInnerLines={false} withVerticalLines={false} withHorizontalLines={false} withVerticalLabels={false} withHorizontalLabels={false}
                                                chartConfig={{ backgroundColor: 'transparent', backgroundGradientFrom: 'transparent', backgroundGradientTo: 'transparent', decimalPlaces: 0, color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})` }}
                                                bezier
                                            />
                                        </View>
                                    )}
                                </DraggableWrapper>
                            )))}
                        </View>
                    </ViewShot>
                </View>

                <View style={styles.editor}>
                    <View style={styles.tabRow}>
                        {['layout', 'elements', 'style', 'graph'].map((t: any) => (
                            <Pressable key={t} onPress={() => setActiveTab(t)} style={[styles.tab, activeTab === t && styles.activeTab]}>
                                {t === 'layout' && <Grid size={18} color={activeTab === t ? '#FFF' : '#8A8D9F'} />}
                                {t === 'elements' && <Layers size={18} color={activeTab === t ? '#FFF' : '#8A8D9F'} />}
                                {t === 'style' && <Droplets size={18} color={activeTab === t ? '#FFF' : '#8A8D9F'} />}
                                {t === 'graph' && <Filter size={18} color={activeTab === t ? '#FFF' : '#8A8D9F'} />}
                            </Pressable>
                        ))}
                    </View>

                    <View style={styles.panel}>
                        {activeTab === 'layout' && (
                            <View>
                                <Text style={styles.panelTitle}>Canvas Layout</Text>
                                <View style={styles.grid}>
                                    {RATIOS.map(r => (
                                        <Pressable key={r} onPress={() => setAspectRatio(r)} style={[styles.gridBtn, aspectRatio === r && styles.activeGridBtn]}>
                                            <Text style={[styles.gridBtnText, aspectRatio === r && { color: '#FFF' }]}>{r}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                                <View style={styles.actionRow}>
                                    <Pressable onPress={pickImage} style={styles.fullBtn}><ImageIcon size={18} color="#FFF" /><Text style={styles.btnText}>Change Photo</Text></Pressable>
                                    <Pressable onPress={() => setTransparentMode(!transparentMode)} style={[styles.fullBtn, transparentMode && { backgroundColor: '#FC4C02' }]}><Text style={styles.btnText}>Transparent</Text></Pressable>
                                </View>
                            </View>
                        )}

                        {activeTab === 'elements' && (
                            <View>
                                <Text style={styles.panelTitle}>Canvas Elements</Text>
                                <View style={styles.elementsList}>
                                    {elements.map(el => (
                                        <Pressable key={el.id} onPress={() => toggleElement(el.id)} style={[styles.elementItem, el.visible && styles.activeElementItem]}>
                                            <Text style={[styles.elementItemText, el.visible && { color: '#FFF' }]}>{el.id.toUpperCase()}</Text>
                                            {el.visible ? <Eye size={16} color="#2D60FF" /> : <Info size={16} color="#8A8D9F" />}
                                        </Pressable>
                                    ))}
                                    <Pressable style={styles.addBtn} onPress={() => {
                                        const newId = `graph-${Date.now()}`;
                                        setElements([...elements, { id: newId, type: 'graph', x: 50, y: 150, scale: 1, color: '#4ADE80', visible: true, metrics: [{ name: 'heartrate', color: '#F2215A' }] }]);
                                    }}><Plus size={18} color="#FFF" /><Text style={styles.btnText}>Add Graph Overlay</Text></Pressable>
                                </View>
                            </View>
                        )}

                        {activeTab === 'style' && selectedElement ? (
                            <View>
                                <View style={styles.panelHeader}>
                                    <Text style={styles.panelTitle}>Styling: {selectedElement.id}</Text>
                                    <Pressable onPress={() => updateElement(selectedId, { scale: 1 })}><Text style={{ color: '#8A8D9F' }}>Reset Scale</Text></Pressable>
                                </View>

                                <Text style={styles.label}>Size Scale: {selectedElement.scale.toFixed(2)}x</Text>
                                <View style={styles.sliderRow}>
                                    <Pressable onPress={() => updateElement(selectedId, { scale: Math.max(0.1, selectedElement.scale - 0.1) })} style={styles.stepBtn}><Text style={{ color: '#FFF' }}>-</Text></Pressable>
                                    <View style={styles.track}><View style={[styles.fill, { width: `${(selectedElement.scale / 3) * 100}%` }]} /></View>
                                    <Pressable onPress={() => updateElement(selectedId, { scale: Math.min(3, selectedElement.scale + 0.1) })} style={styles.stepBtn}><Text style={{ color: '#FFF' }}>+</Text></Pressable>
                                </View>

                                <Text style={[styles.label, { marginTop: 20 }]}>Select Color (Presets)</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorsRow} contentContainerStyle={{ paddingVertical: 10 }}>
                                    {['#FFFFFF', '#000000', '#FC4C02', '#2D60FF', '#4ADE80', '#F2215A', '#FDE047', '#A855F7', '#EC4899', 'transparent'].map(c => (
                                        <Pressable key={c} onPress={() => updateElement(selectedId, { color: c })} style={[styles.swatch, { backgroundColor: c === 'transparent' ? '#333' : c }, selectedElement.color === c && styles.activeSwatch]} />
                                    ))}
                                </ScrollView>

                                <Text style={[styles.label, { marginTop: 10 }]}>Precise Color (HSLA)</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hueRow}>
                                    {Array.from({ length: 36 }).map((_, i) => (
                                        <Pressable key={i} onPress={() => {
                                            const hsla = hexToHsla(selectedElement.color);
                                            updateElement(selectedId, { color: hslaToHex(i * 10, hsla.s || 80, hsla.l || 50, hsla.a) });
                                        }} style={[styles.hueChip, { backgroundColor: hslaToHex(i * 10, 80, 50) }]} />
                                    ))}
                                </ScrollView>

                                <View style={styles.footerBtns}>
                                    <Pressable style={styles.footerBtn}><Droplets size={16} color="#FFF" /><Text style={styles.btnText}>Eyedropper</Text></Pressable>
                                    <Pressable onPress={() => setSelectedId(null)} style={[styles.footerBtn, { backgroundColor: '#2D3246' }]}><Text style={styles.btnText}>Deselect</Text></Pressable>
                                </View>
                            </View>
                        ) : activeTab === 'style' ? (
                            <Text style={styles.emptyText}>Tap an element on the canvas to edit its style.</Text>
                        ) : null}

                        {activeTab === 'graph' && selectedElement?.type === 'graph' ? (
                            <View>
                                <Text style={styles.panelTitle}>Configure Merged Graph</Text>
                                {['heartrate', 'altitude', 'velocity_smooth', 'cadence'].map(m => {
                                    const metrics = selectedElement.metrics || [];
                                    const isActive = metrics.some(x => x.name === m);
                                    return (
                                        <Pressable key={m} onPress={() => {
                                            const next = isActive ? metrics.filter(x => x.name !== m) : [...metrics, { name: m, color: '#FFFFFF' }];
                                            updateElement(selectedId, { metrics: next });
                                        }} style={[styles.metricRow, isActive && styles.activeMetricRow]}>
                                            <Text style={{ color: isActive ? '#FFF' : '#8A8D9F', fontWeight: 'bold' }}>{m.replace('_', ' ').toUpperCase()}</Text>
                                            {isActive && (
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: 10 }}>
                                                    {['#F2215A', '#2D60FF', '#4ADE80', '#FFFFFF'].map(c => (
                                                        <Pressable key={c} onPress={() => {
                                                            const next = metrics.map(x => x.name === m ? { ...x, color: c } : x);
                                                            updateElement(selectedId, { metrics: next });
                                                        }} style={[styles.smallSwatch, { backgroundColor: c }]} />
                                                    ))}
                                                </ScrollView>
                                            )}
                                            {!isActive && <Plus size={18} color="#4A4C59" />}
                                        </Pressable>
                                    );
                                })}
                            </View>
                        ) : activeTab === 'graph' ? (
                            <Text style={styles.emptyText}>Select a Graph element on the canvas to configure overlays.</Text>
                        ) : null}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0E' },
    loadingContainer: { flex: 1, backgroundColor: '#0A0A0E', alignItems: 'center', justifyContent: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'web' ? 20 : 60, paddingHorizontal: 20, paddingBottom: 15 },
    iconBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1C1C24', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
    canvasWrapper: { alignItems: 'center', marginVertical: 15 },
    canvas: { borderRadius: 8, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: '#2D3246' },
    draggable: { position: 'absolute' },
    selectedBorder: { borderWidth: 2, borderColor: '#2D60FF', borderRadius: 6, borderStyle: 'dashed' },
    titleText: { fontSize: 24, fontWeight: '900', padding: 5, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
    statVal: { fontSize: 20, fontWeight: '900' },
    statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    editor: { paddingHorizontal: 20 },
    tabRow: { flexDirection: 'row', backgroundColor: '#1C1C24', borderRadius: 18, padding: 5, marginBottom: 15 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14 },
    activeTab: { backgroundColor: '#2D3246' },
    panel: { backgroundColor: '#1C1C24', borderRadius: 24, padding: 20, minHeight: 250 },
    panelTitle: { color: '#FFF', fontSize: 14, fontWeight: '800', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    gridBtn: { flex: 1, minWidth: '45%', backgroundColor: '#12131A', padding: 15, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#2D3246' },
    activeGridBtn: { borderColor: '#2D60FF', backgroundColor: 'rgba(45, 96, 255, 0.1)' },
    gridBtnText: { color: '#8A8D9F', fontWeight: '700' },
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
    fullBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#12131A', padding: 15, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#2D3246' },
    btnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
    elementsList: { gap: 8 },
    elementItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#12131A', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#2D3246' },
    activeElementItem: { borderColor: '#2D60FF' },
    elementItemText: { color: '#8A8D9F', fontWeight: '700', fontSize: 12 },
    addBtn: { backgroundColor: '#2D3246', padding: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
    panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    label: { color: '#8A8D9F', fontSize: 12, fontWeight: '700', marginBottom: 8 },
    sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stepBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#12131A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2D3246' },
    track: { flex: 1, height: 8, backgroundColor: '#12131A', borderRadius: 4, overflow: 'hidden' },
    fill: { height: '100%', backgroundColor: '#2D60FF' },
    colorsRow: { flexDirection: 'row' },
    swatch: { width: 48, height: 48, borderRadius: 24, marginRight: 12, borderWidth: 2, borderColor: 'transparent' },
    activeSwatch: { borderColor: '#FFF', transform: [{ scale: 1.1 }] },
    hueRow: { flexDirection: 'row', marginTop: 5 },
    hueChip: { width: 34, height: 34, borderRadius: 17, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    footerBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
    footerBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#2D60FF', padding: 15, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 8 },
    metricRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#12131A', padding: 15, borderRadius: 15, marginBottom: 8, borderWidth: 1, borderColor: '#2D3246' },
    activeMetricRow: { borderColor: '#2D60FF' },
    smallSwatch: { width: 24, height: 24, borderRadius: 12, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    emptyText: { color: '#4A4C59', textAlign: 'center', marginTop: 50, fontSize: 14 },
    loadingText: { color: '#FFF', marginTop: 10, fontWeight: '700' }
});
