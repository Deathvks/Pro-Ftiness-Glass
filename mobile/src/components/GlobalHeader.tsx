import React, { useMemo } from 'react';
import { View, Image, Text, StyleSheet, Animated, Platform } from 'react-native';
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

    // Interpolación nativa para la opacidad del fondo:
    // - Arriba del todo (<= 0): 0 (desaparece el fondo, 100% transparente).
    // - Al descender (> 0): aparece progresivamente hasta 1 en los primeros 20px.
    // - Por más que baje (> 20px): se mantiene en 1 permanentemente, nunca desaparece el header ni su fondo.
    // - Si no hay scrollY (ej. modales o pantallas fijas): fondo visible por defecto.
    const bgOpacity = useMemo(() => {
        if (scrollY && typeof scrollY.interpolate === 'function') {
            return scrollY.interpolate({
                inputRange: [0, 20],
                outputRange: [0, 1],
                extrapolate: 'clamp',
            });
        }
        return 1;
    }, [scrollY]);

    const blurTint = Platform.OS === 'ios'
        ? (colorScheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight')
        : (colorScheme === 'dark' ? 'dark' : 'light');

    const ambientTint = colorScheme === 'dark'
        ? (theme === 'oled' ? 'rgba(0, 0, 0, 0.40)' : theme === 'galaxy' ? 'rgba(8, 8, 20, 0.35)' : 'rgba(15, 23, 42, 0.35)')
        : 'rgba(255, 255, 255, 0.35)';

    return (
        <View style={{ position: 'relative', zIndex: 100 }}>
            {/* Fondo Liquid Glass nativo de Apple (desaparece arriba, permanente al descender) */}
            <Animated.View 
                pointerEvents="none"
                style={[
                    StyleSheet.absoluteFill,
                    { 
                        opacity: bgOpacity,
                        overflow: 'hidden',
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                    }
                ]}
            >
                {/* 1. BlurView: Apple UIVisualEffectView nativo en iOS y backdrop-filter en Web */}
                <BlurView 
                    intensity={Platform.OS === 'ios' ? 85 : 95}
                    tint={blurTint as any}
                    style={StyleSheet.absoluteFill}
                />

                {/* 2. GlassView: UIGlassEffect nativo de Apple vía expo-glass-effect */}
                <GlassView 
                    glassEffectStyle="regular"
                    colorScheme={colorScheme as any}
                    style={StyleSheet.absoluteFill}
                />

                {/* 3. Tinte translúcido adaptativo para refracción del tema (True Liquid Glass) */}
                <View 
                    style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: ambientTint }
                    ]} 
                />

                {/* 4. Resplandor especular superior de Liquid Glass */}
                <View 
                    style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        height: StyleSheet.hairlineWidth, 
                        backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.85)' 
                    }} 
                />
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
