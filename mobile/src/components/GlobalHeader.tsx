import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Image, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { User, Sparkles, Bell, ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { GlassButton } from '@/components/ui/GlassButton';
import { AiInfoModal } from '@/components/modals/AiInfoModal';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BACKEND_BASE_URL } from '@/services/apiClient';

// Tinte de fondo adaptado exactamente a cada tema para el efecto cristal en Web y Android
const getHeaderThemeBg = (theme: string) => {
    switch (theme) {
        case 'oled':
            return 'rgba(0, 0, 0, 0.70)';
        case 'dark':
            return 'rgba(15, 23, 42, 0.75)';
        case 'galaxy':
            return 'rgba(10, 10, 26, 0.75)';
        case 'ocean-dark':
            return 'rgba(8, 47, 73, 0.75)';
        case 'desert-dark':
            return 'rgba(44, 30, 22, 0.75)';
        case 'ocean':
            return 'rgba(240, 249, 255, 0.80)';
        case 'desert':
            return 'rgba(253, 248, 245, 0.80)';
        case 'light':
        default:
            return 'rgba(243, 244, 246, 0.80)';
    }
};

export default function GlobalHeader({ title, scrollY, showBackButton, hideRightButtons }: { title?: string, scrollY?: Animated.Value, showBackButton?: boolean, hideRightButtons?: boolean }) {
    const [showAiModal, setShowAiModal] = React.useState(false);
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const segments = useSegments();
    
    const theme = useAppStore(state => state.theme) || 'oled';
    const colors = useAppColors();
    
    const isDashboard = (segments[segments.length - 1] as string) === 'index' || segments.length === 1;

    const gamification = useAppStore(state => state.gamification) || {};
    const aiLimit = gamification.ai_queries_limit || 5;
    const aiRemaining = gamification.ai_queries_remaining ?? aiLimit;

    const notifications = useAppStore(state => state.notifications) || [];
    const unreadCount = notifications.filter((n: any) => !n.is_read).length;

    const userProfile = useAppStore(state => state.userProfile);
    const imageUrl = userProfile?.profile_image_url ? 
        (userProfile.profile_image_url.startsWith('http') ? userProfile.profile_image_url : `${BACKEND_BASE_URL}${userProfile.profile_image_url}`) 
        : null;

    const isDark = !['light', 'ocean', 'desert'].includes(theme);
    const colorScheme = isDark ? 'dark' : 'light';
    const headerThemeBg = getHeaderThemeBg(theme);

    // ¿El dispositivo soporta UIGlassEffect (iOS 26+)? En web siempre es false.
    const glassAvailable = useMemo(() => {
        if (Platform.OS === 'web') return false;
        try {
            return isLiquidGlassAvailable();
        } catch {
            return false;
        }
    }, []);

    // Para iOS nativo con UIGlassEffect (iOS 26+)
    const [isScrolled, setIsScrolled] = useState(!scrollY);
    const isScrolledRef = useRef(!scrollY);

    useEffect(() => {
        if (!scrollY || !glassAvailable) return;
        const id = scrollY.addListener(({ value }) => {
            // Histeresis: se activa al pasar de 8px y solo se apaga si vuelve a <= 2px para evitar parpadeos
            const next = isScrolledRef.current ? value > 2 : value > 8;
            if (next !== isScrolledRef.current) {
                isScrolledRef.current = next;
                setIsScrolled(next);
            }
        });
        return () => scrollY.removeListener(id);
    }, [scrollY, glassAvailable]);

    // Opacidad fluida directa del scroll para Web y dispositivos sin UIGlassEffect (0 re-renders, 0 jitter)
    const fallbackOpacity = useMemo(() => {
        if (!scrollY) return new Animated.Value(1);
        return scrollY.interpolate({
            inputRange: [0, 20],
            outputRange: [0, 1],
            extrapolate: 'clamp',
        });
    }, [scrollY]);

    return (
        <View style={{ position: 'relative', zIndex: 100 }}>
            {/* Fondo Liquid Glass nativo (UIGlassEffect) en iOS 26+ */}
            {glassAvailable ? (
                <GlassView
                    pointerEvents="none"
                    glassEffectStyle={{
                        style: isScrolled ? 'regular' : 'none',
                        animate: true,
                        animationDuration: 0.15,
                    }}
                    colorScheme={colorScheme as any}
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            borderBottomWidth: isScrolled ? StyleSheet.hairlineWidth : 0,
                            borderBottomColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                        }
                    ]}
                />
            ) : (
                /* Fondo Liquid Glass adaptativo para Web y Android con desenfoque + tinte del tema */
                <Animated.View
                    pointerEvents="none"
                    style={[
                        StyleSheet.absoluteFill, 
                        { 
                            overflow: 'hidden', 
                            opacity: fallbackOpacity,
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderBottomColor: colors.border || (colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'),
                        }
                    ]}
                >
                    <BlurView
                        intensity={80}
                        tint={colorScheme === 'dark' ? 'dark' : 'light'}
                        style={StyleSheet.absoluteFill}
                    />
                    <View 
                        style={[
                            StyleSheet.absoluteFill, 
                            { backgroundColor: headerThemeBg }
                        ]} 
                    />
                </Animated.View>
            )}

            <View 
                style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    paddingHorizontal: 16, 
                    paddingBottom: 12,
                    paddingTop: insets.top + 12, 
                }}
            >
            {/* Left: Profile or Back Button & Title */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {showBackButton ? (
                    <GlassButton onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace('/');
                        }
                    }} theme={theme} colors={colors} noShadow>
                        <ChevronLeft size={24} color={colors.text} />
                    </GlassButton>
                ) : (
                    <GlassButton 
                        onPress={() => router.push('/profile')} 
                        theme={theme}
                        noShadow
                        style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden', padding: 0 }}
                    >
                        {imageUrl ? (
                            <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <User size={20} color={colors.text} />
                        )}
                    </GlassButton>
                )}
                {title && (
                    <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>{title}</Text>
                )}
            </View>

            {/* Center: Logo (Only Dashboard) */}
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: insets.top, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                {isDashboard && !title && (
                    <Image source={require('@/assets/images/logo.webp')} style={{ width: 160, height: 40, resizeMode: 'contain', borderRadius: 8 }} />
                )}
            </View>

            {/* Right: Sparkles & Notifications */}
            {!hideRightButtons && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 2 }}>
                    <GlassButton 
                        onPress={() => setShowAiModal(true)} 
                        theme={theme}
                        noShadow
                        style={{ height: 36, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 18 }}
                    >
                        <Sparkles size={14} color={colors.text} />
                        <Text style={{ color: colors.text, fontSize: 12, fontWeight: '900' }}>{aiRemaining}/{aiLimit}</Text>
                    </GlassButton>

                    <GlassButton onPress={() => router.push('/notifications')} theme={theme} colors={colors} noShadow>
                        <Bell size={18} color={colors.text} />
                        {unreadCount > 0 && (
                            <View style={{ position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.tint, borderWidth: 2, borderColor: colors.background }} />
                        )}
                    </GlassButton>
                </View>
            )}

            <AiInfoModal visible={showAiModal} onClose={() => setShowAiModal(false)} />
            </View>
        </View>
    );
}
