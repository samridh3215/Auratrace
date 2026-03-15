import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Image } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL is not defined in the environment.");
}

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
        // This will create 'http://localhost:8081' on web 
        // and 'exp://192.168.x.x:8081' or 'auratrace://' on mobile
        const redirectUri = Linking.createURL('/');
        const loginUrl = `${API_URL}/strava/login?redirect_uri=${encodeURIComponent(redirectUri)}`;

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
                    <Image source={require('../assets/images/app-icon.png')} style={styles.logo} resizeMode="contain" />
                    <Text style={styles.title}>Auratrace</Text>
                    <Text style={styles.subtitle}>Relive every step.</Text>
                </View>

                <Pressable
                    style={({ pressed }) => [
                        styles.stravaButton,
                        pressed && styles.buttonPressed
                    ]}
                    onPress={handleLogin}
                >
                    <Image
                        source={require('../assets/images/strava_login.png')}
                        style={styles.stravaButtonImage}
                        resizeMode="contain"
                    />
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
    logo: {
        width: 120,
        height: 120,
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
    stravaButton: {
        width: '100%',
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stravaButtonImage: {
        width: '100%',
        height: '100%',
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    }
});
