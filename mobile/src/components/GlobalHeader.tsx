import React, { useRef, useEffect } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { User, Sparkles, Bell, ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { Colors } from '@/constants/theme';
import { GlassButton } from '@/components/ui/GlassButton';
import { AiInfoModal } from '@/components/modals/AiInfoModal';
import { GlassView } from 'expo-glass-effect';
import { BACKEND_BASE_URL } from '@/services/apiClient';

export default function GlobalHeader({ title, scrollY, showBackButton, hideRightButtons }: { title?: string, scrollY?: Animated.Value, showBackButton?: boolean, hideRightButtons?: boolean }) {
    const [showAiModal, setShowAiModal] = React.useState(false);
    const [isScrolled, setIsScrolled] = React.useState(false);
    const isScrolledRef = React.useRef(false);

    const insets = useSafeAreaInsets();
    const headerHeight = insets.top + 70;

    const [isHeaderHidden, setIsHeaderHidden] = React.useState(false);
    const isHiddenRef = React.useRef(false);
    const lastScrollYRef = React.useRef(0);
    const headerTranslateY = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (!scrollY) {
            setIsScrolled(true);
            isScrolledRef.current = true;
            return;
        }

        const listener = scrollY.addListener(({ value }) => {
            const currentY = value;
            const diff = currentY - lastScrollYRef.current;

            // Detección de fondo / blur scrolled
            if (currentY > 5 && !isScrolledRef.current) {
                isScrolledRef.current = true;
                setIsScrolled(true);
            } else if (currentY <= 5 && isScrolledRef.current) {
                isScrolledRef.current = false;
                setIsScrolled(false);
            }

            // Al estar arriba del todo (zona inicial de 20px o pull-to-refresh), siempre visible
            if (currentY <= 20) {
                if (isHiddenRef.current) {
                    isHiddenRef.current = false;
                    setIsHeaderHidden(false);
                    Animated.timing(headerTranslateY, {
                        toValue: 0,
                        duration: 200,
                        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                        useNativeDriver: true,
                    }).start();
                }
                lastScrollYRef.current = currentY;
                return;
            }

            // Al descender (scroll hacia abajo con intención de lectura): ocultar header
            if (diff > 8 && !isHiddenRef.current) {
                isHiddenRef.current = true;
                setIsHeaderHidden(true);
                Animated.timing(headerTranslateY, {
                    toValue: -headerHeight,
                    duration: 250,
                    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                    useNativeDriver: true,
                }).start();
            } 
            // Al ascender (scroll hacia arriba con intención): mostrar header inmediatamente
            else if (diff < -8 && isHiddenRef.current) {
                isHiddenRef.current = false;
                setIsHeaderHidden(false);
                Animated.timing(headerTranslateY, {
                    toValue: 0,
                    duration: 200,
                    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                    useNativeDriver: true,
                }).start();
            }

            lastScrollYRef.current = currentY;
        });

        return () => {
            scrollY.removeListener(listener);
        };
    }, [scrollY, headerHeight]);

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

    const headerOpacity = headerTranslateY.interpolate({
        inputRange: [-headerHeight, 0],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    return (
        <Animated.View 
            pointerEvents={isHeaderHidden ? 'none' : 'auto'}
            style={{ 
                position: 'relative',
                transform: [{ translateY: headerTranslateY }],
                opacity: headerOpacity,
            }}
        >
            <GlassView 
                glassEffectStyle="regular"
                colorScheme={colorScheme as any}
                style={StyleSheet.absoluteFill}
            />
            <View 
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: colorScheme === 'dark' ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.45)',
                    }
                ]}
            />
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)' }} />
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
        </Animated.View>
    );
}
