import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Activity } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function LoginScreen() {
    const router = useRouter();

    useEffect(() => {
        checkExistingAuth();
    }, []);

    const checkExistingAuth = async () => {
        const token = Platform.OS === 'web'
            ? localStorage.getItem('user_token')
            : await SecureStore.getItemAsync('user_token');

        if (token) {
            router.replace('/dashboard');
        }
    };

    const handleLogin = async () => {
        const device = Platform.OS === 'web' ? 'web' : 'mobile';
        const loginUrl = `${API_URL}/strava/login?device=${device}`;

        if (Platform.OS === 'web') {
            window.location.href = loginUrl;
        } else {
            try {
                await WebBrowser.openBrowserAsync(loginUrl);
            } catch (error) {
                console.error("Error opening browser:", error);
            }
        }
    };

    return (
        <View style={styles.container}>
            {/* Background glowing effects mockup using absolute positioning */}
            <View style={styles.glow1} />
            <View style={styles.glow2} />

            <View style={styles.content}>
                <View style={styles.header}>
                    <Activity size={100} color="#2D60FF" strokeWidth={1} />
                    <Text style={styles.title}>Auratrace</Text>
                    <Text style={styles.subtitle}>Relive every step.</Text>
                </View>

                <Pressable
                    style={({ pressed }) => [
                        styles.button,
                        pressed && styles.buttonPressed
                    ]}
                    onPress={handleLogin}
                >
                    <Text style={styles.buttonText}>Connect with Strava</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0E',
        overflow: 'hidden',
    },
    glow1: {
        position: 'absolute',
        top: -100,
        left: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(45, 96, 255, 0.4)',
        filter: 'blur(80px)' as any,
    },
    glow2: {
        position: 'absolute',
        bottom: -150,
        right: -100,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: 'rgba(252, 76, 2, 0.15)',
        filter: 'blur(100px)' as any,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        zIndex: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 80,
    },
    title: {
        fontSize: 48,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: 24,
        letterSpacing: -2,
    },
    subtitle: {
        fontSize: 18,
        color: '#8A8D9F',
        marginTop: 8,
        fontWeight: '500',
    },
    button: {
        backgroundColor: '#1C1C24',
        borderWidth: 1,
        borderColor: '#2D3246',
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 40,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FC4C02',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    buttonText: {
        color: '#FAFAFA',
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    }
});
