import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { ChevronLeft, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function SettingsScreen() {
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await axios.get(`${API_URL}/strava/logout`, { withCredentials: true });
            router.replace('/');
        } catch (err) {
            console.error('Logout failed:', err);
            setLoggingOut(false);
            // Optionally could still redirect or show error toast
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.headerIconBtn} onPress={() => router.back()}>
                    <ChevronLeft color="#FFF" size={24} />
                </Pressable>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={styles.headerRightSpacer} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>

                    <Pressable
                        style={({ pressed }) => [
                            styles.actionButton,
                            styles.dangerButton,
                            pressed && styles.buttonPressed
                        ]}
                        onPress={handleLogout}
                        disabled={loggingOut}
                    >
                        {loggingOut ? (
                            <ActivityIndicator size="small" color="#F2215A" />
                        ) : (
                            <>
                                <LogOut size={20} color="#F2215A" />
                                <Text style={styles.dangerButtonText}>Sign Out from Strava</Text>
                            </>
                        )}
                    </Pressable>
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
        borderBottomWidth: 1,
        borderBottomColor: '#1C1D26',
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
    headerRightSpacer: {
        width: 44, // Matches headerIconBtn to keep title centered
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8A8D9F',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
        marginLeft: 4,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#12131A',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1C1D26',
        gap: 12,
    },
    dangerButton: {
        borderColor: 'rgba(242, 33, 90, 0.3)',
        backgroundColor: 'rgba(242, 33, 90, 0.05)',
    },
    buttonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    dangerButtonText: {
        color: '#F2215A',
        fontSize: 16,
        fontWeight: '600',
    }
});
