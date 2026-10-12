import React, { useRef, useEffect } from 'react';
import { View, Image, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { User, Sparkles, Bell, ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { GlassButton } from '@/components/ui/GlassButton';
import { AiInfoModal } from '@/components/modals/AiInfoModal';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import { BACKEND_BASE_URL } from '@/services/apiClient';

export default function GlobalHeader({ title, scrollY, showBackButton, hideRightButtons }: { title?: string, scrollY?: Animated.Value, showBackButton?: boolean, hideRightButtons?: boolean }) {
    const [showAiModal, setShowAiModal] = React.useState(false);
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const segments = useSegments();
    
    const theme = useAppStore(state => state.theme);
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

    const colorScheme = ['light', 'ocean', 'desert'].includes(theme) ? 'light' : 'dark';

    // Color translúcido idéntico al 'bg-bg-primary/70' del header web
    const headerBgColor = React.useMemo(() => {
        if (theme === 'oled') return 'rgba(0, 0, 0, 0.70)';
        if (theme === 'galaxy') return 'rgba(8, 8, 20, 0.70)';
        if (theme === 'ocean-dark') return 'rgba(8, 47, 73, 0.70)';
        if (theme === 'desert-dark') return 'rgba(44, 30, 22, 0.70)';
        if (colorScheme === 'dark') return 'rgba(15, 23, 42, 0.70)';
        if (theme === 'ocean') return 'rgba(240, 249, 255, 0.75)';
        if (theme === 'desert') return 'rgba(253, 248, 245, 0.75)';
        return 'rgba(248, 250, 252, 0.75)';
    }, [theme, colorScheme]);

    const isScrolledRef = React.useRef(false);
    const bgOpacityAnim = React.useRef(new Animated.Value(scrollY ? 0 : 1)).current;

    React.useEffect(() => {
        if (!scrollY) {
            bgOpacityAnim.setValue(1);
            return;
        }

        const listener = scrollY.addListener(({ value }) => {
            const currentY = value;

            // Desaparece el fondo solo arriba del todo (<= 4).
            // Al bajar (> 4), aparece el liquid glass y se mantiene por más que baje.
            if (currentY > 4 && !isScrolledRef.current) {
                isScrolledRef.current = true;
                Animated.timing(bgOpacityAnim, {
                    toValue: 1,
                    duration: 180,
                    easing: Easing.bezier(0.28, 0.11, 0.32, 1),
                    useNativeDriver: true,
                }).start();
            } else if (currentY <= 4 && isScrolledRef.current) {
                isScrolledRef.current = false;
                Animated.timing(bgOpacityAnim, {
                    toValue: 0,
                    duration: 180,
                    easing: Easing.bezier(0.28, 0.11, 0.32, 1),
                    useNativeDriver: true,
                }).start();
            }
        });

        return () => {
            scrollY.removeListener(listener);
        };
    }, [scrollY]);

    return (
        <View style={{ position: 'relative' }}>
            {/* Fondo Liquid Glass nativo idéntico al web (desaparece arriba del todo, visible y persistente al bajar) */}
            <Animated.View 
                pointerEvents="none"
                style={[
                    StyleSheet.absoluteFill,
                    { 
                        opacity: bgOpacityAnim,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: colorScheme === 'dark' ? 0.25 : 0.08,
                        shadowRadius: 8,
                        elevation: 3,
                    }
                ]}
            >
                <View 
                    style={[
                        StyleSheet.absoluteFill, 
                        { 
                            overflow: 'hidden',
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderBottomColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                        }
                    ]}
                >
                    {/* 1. Backdrop blur de cristal */}
                    <BlurView 
                        intensity={Platform.OS === 'ios' ? 80 : 90}
                        tint={colorScheme === 'dark' ? 'dark' : 'light'}
                        style={StyleSheet.absoluteFill}
                    />

                    {/* 2. GlassView nativo de expo-glass-effect */}
                    <GlassView 
                        glassEffectStyle="regular"
                        colorScheme={colorScheme as any}
                        style={StyleSheet.absoluteFill}
                    />

                    {/* 3. Tinte translúcido reactivo (bg-bg-primary/70 como en la web) */}
                    <View 
                        style={[
                            StyleSheet.absoluteFill,
                            { backgroundColor: headerBgColor }
                        ]}
                    />
                </View>
            </Animated.View>

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
