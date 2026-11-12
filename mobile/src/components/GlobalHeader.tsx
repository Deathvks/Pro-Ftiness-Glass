import React, { useMemo } from 'react';
import { View, Image, Text, StyleSheet, Animated, Platform, TouchableOpacity } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Sparkles, Bell, ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAppStore from '@/store/useAppStore';
import { selectHasUnseenStory } from '@/store/storySlice';
import { useAppColors } from '@/hooks/useAppColors';
import { GlassButton } from '@/components/ui/GlassButton';
import { AiInfoModal } from '@/components/modals/AiInfoModal';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { SocialUserAvatar } from '@/components/social/SocialUserAvatar';
import { getThemeBaseBackground } from '@/constants/theme';
import { androidHeaderBlurAvailable, type HeaderBlurRef } from '@/components/AndroidHeaderBlur';

// Tinte de fondo para el efecto cristal en web
const getHeaderThemeBg = (theme: string) => {
    switch (theme) {
        case 'oled':
            return 'rgba(0, 0, 0, 0.88)';
        case 'dark':
            return 'rgba(15, 23, 42, 0.88)';
        case 'galaxy':
            return 'rgba(10, 10, 26, 0.88)';
        case 'ocean-dark':
            return 'rgba(8, 47, 73, 0.88)';
        case 'desert-dark':
            return 'rgba(44, 30, 22, 0.88)';
        case 'ocean':
            return 'rgba(240, 249, 255, 0.85)';
        case 'desert':
            return 'rgba(253, 248, 245, 0.85)';
        case 'light':
        default:
            return Platform.OS === 'ios' ? 'rgba(242, 242, 247, 0.82)' : 'rgba(243, 244, 246, 0.85)';
    }
};

export default function GlobalHeader({ 
    title, 
    scrollY, 
    showBackButton, 
    hideRightButtons,
    onBackPress,
    hideBottomBorder,
    showBackground = true,
    androidBlurTarget,
}: { 
    title?: string, 
    scrollY?: Animated.Value, 
    showBackButton?: boolean, 
    hideRightButtons?: boolean,
    onBackPress?: () => void,
    hideBottomBorder?: boolean,
    showBackground?: boolean,
    androidBlurTarget?: HeaderBlurRef,
}) {
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
    const hasUnseenStory = useAppStore(state => selectHasUnseenStory(state, state.userProfile?.id));

    const isDark = !['light', 'ocean', 'desert'].includes(theme);
    const colorScheme = isDark ? 'dark' : 'light';
    const headerThemeBg = getHeaderThemeBg(theme);
    const isIOS = Platform.OS === 'ios';
    const isAndroid = Platform.OS === 'android';
    const androidTint = getThemeBaseBackground(theme);

    // ¿El dispositivo soporta UIGlassEffect (iOS 26+)? En web siempre es false.
    const glassAvailable = useMemo(() => {
        if (!isIOS) return false;
        try {
            return isLiquidGlassAvailable();
        } catch {
            return false;
        }
    }, [isIOS]);

    // Opacidad fluida directa del scroll para Web y dispositivos sin UIGlassEffect
    const fallbackOpacity = useMemo(() => {
        if (!scrollY) return new Animated.Value(isIOS ? 0 : isAndroid ? 0.85 : 1);
        if (isIOS) {
            return scrollY.interpolate({
                inputRange: [0, 28],
                outputRange: [0, 0.92],
                extrapolate: 'clamp',
            });
        }
        if (isAndroid) {
            return scrollY.interpolate({
                inputRange: [0, 20, 56],
                outputRange: [0, 0.65, 1],
                extrapolate: 'clamp',
            });
        }
        return scrollY.interpolate({
            inputRange: [0, 20],
            outputRange: [isDark ? 0.88 : 0.65, 1],
            extrapolate: 'clamp',
        });
    }, [scrollY, isDark, isIOS, isAndroid]);

    return (
        <View style={{ position: 'relative', zIndex: 100 }} pointerEvents="box-none">
            {/* En iOS 26-27 el header no lleva barra de vidrio completa para no apilar Liquid Glass sobre Liquid Glass;
                solo muestra un velo difuminado suave cuando el contenido pasa por debajo */}
            {showBackground && (isIOS ? (
                <Animated.View
                    pointerEvents="none"
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            overflow: 'hidden',
                            opacity: fallbackOpacity,
                        },
                    ]}
                >
                    <BlurView
                        intensity={55}
                        tint={colorScheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
            ) : isAndroid ? (
                <Animated.View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, { bottom: -10, opacity: fallbackOpacity }]}
                >
                    {androidHeaderBlurAvailable && androidBlurTarget && (
                        <BlurView
                            blurTarget={androidBlurTarget}
                            blurMethod="dimezisBlurViewSdk31Plus"
                            intensity={28}
                            tint={colorScheme}
                            style={[StyleSheet.absoluteFill, { bottom: 10, opacity: 0.42 }]}
                        />
                    )}
                    <LinearGradient
                        colors={[`${androidTint}E0`, `${androidTint}B8`, `${androidTint}00`]}
                        locations={[0, 0.82, 1]}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
            ) : (
                /* Fondo adaptativo para web con desenfoque y tinte del tema */
                <Animated.View
                    pointerEvents="none"
                    style={[
                        StyleSheet.absoluteFill, 
                        { 
                            overflow: 'hidden', 
                            opacity: fallbackOpacity,
                            borderBottomWidth: (!hideBottomBorder && !isDark && !scrollY) ? StyleSheet.hairlineWidth : 0,
                            borderBottomColor: 'rgba(0, 0, 0, 0.08)',
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
            ))}

            <View 
                pointerEvents="box-none"
                style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    paddingHorizontal: 16, 
                    paddingBottom: 8,
                    paddingTop: insets.top + 6, 
                }}
            >
            {/* Left: Profile or Back Button & Title */}
            <View pointerEvents="box-none" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 8 }}>
                {showBackButton ? (
                    <GlassButton 
                        onPress={() => {
                            try {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            } catch {}
                            if (onBackPress) {
                                onBackPress();
                            } else if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace('/(tabs)');
                            }
                        }} 
                        theme={theme} 
                        colors={colors} 
                        noShadow
                        style={{ width: 40, height: 40, borderRadius: 20 }}
                    >
                        <ChevronLeft size={23} color={colors.text} strokeWidth={2.3} />
                    </GlassButton>
                ) : (
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={hasUnseenStory ? 'Ver mi historia' : 'Mi perfil'}
                        onPress={() => {
                            if (!hasUnseenStory || !useAppStore.getState().openStory(userProfile?.id)) router.push('/profile');
                        }}
                        activeOpacity={0.72}
                    >
                        <SocialUserAvatar user={userProfile} size={40} openStoryOnPress={false} />
                    </TouchableOpacity>
                )}
                {title && (
                    <Text
                        numberOfLines={1}
                        style={{
                            color: colors.text,
                            fontSize: isIOS ? 20 : 22,
                            fontWeight: isIOS ? '700' : '900',
                            letterSpacing: isIOS ? -0.45 : -0.5,
                            flexShrink: 1,
                        }}
                    >
                        {title}
                    </Text>
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
                isIOS ? (
                    /* Cápsula unificada Liquid Glass nativa de iOS 26-27 para acciones relacionadas de la barra superior */
                    <View
                        style={{
                            height: 40,
                            borderRadius: 20,
                            borderCurve: 'continuous',
                            flexDirection: 'row',
                            alignItems: 'center',
                            overflow: 'hidden',
                            borderWidth: glassAvailable ? 0 : StyleSheet.hairlineWidth,
                            borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)',
                            zIndex: 2,
                        }}
                    >
                        <GlassView
                            pointerEvents="none"
                            glassEffectStyle="regular"
                            isInteractive
                            colorScheme={colorScheme as any}
                            style={[StyleSheet.absoluteFill, { borderRadius: 20, borderCurve: 'continuous' }]}
                        />
                        <TouchableOpacity
                            activeOpacity={0.65}
                            onPress={() => {
                                try {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                } catch {}
                                setShowAiModal(true);
                            }}
                            style={{
                                height: '100%',
                                paddingLeft: 13,
                                paddingRight: 10,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 5,
                            }}
                        >
                            <Sparkles size={14} color={colors.tint} strokeWidth={2.2} />
                            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600', letterSpacing: -0.2 }}>
                                {aiRemaining}/{aiLimit}
                            </Text>
                        </TouchableOpacity>

                        <View
                            style={{
                                width: StyleSheet.hairlineWidth,
                                height: 18,
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(60, 60, 67, 0.2)',
                            }}
                        />

                        <TouchableOpacity
                            activeOpacity={0.65}
                            onPress={() => {
                                try {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                } catch {}
                                router.push('/notifications');
                            }}
                            style={{
                                height: '100%',
                                paddingLeft: 10,
                                paddingRight: 13,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <View style={{ position: 'relative' }}>
                                <Bell size={17} color={colors.text} strokeWidth={2.1} />
                                {unreadCount > 0 && (
                                    <View
                                        style={{
                                            position: 'absolute',
                                            top: -2,
                                            right: -3,
                                            width: 9,
                                            height: 9,
                                            borderRadius: 4.5,
                                            backgroundColor: colors.tint,
                                            borderWidth: 1.5,
                                            borderColor: isDark ? '#1C1C1E' : '#FFFFFF',
                                        }}
                                    />
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                ) : (
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
                )
            )}

            <AiInfoModal visible={showAiModal} onClose={() => setShowAiModal(false)} />
            </View>
        </View>
    );
}
