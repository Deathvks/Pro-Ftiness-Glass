import React, { useRef, useEffect } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, Pressable, Animated } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { User, Sparkles, Bell, ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';
import { GlassButton } from '@/components/ui/GlassButton';
import { AiInfoModal } from '@/components/modals/AiInfoModal';
import { BlurView } from 'expo-blur';

export default function GlobalHeader({ title, scrollY, showBackButton, hideRightButtons }: { title?: string, scrollY?: Animated.Value, showBackButton?: boolean, hideRightButtons?: boolean }) {
    const [showAiModal, setShowAiModal] = React.useState(false);
    const router = useRouter();
    const segments = useSegments();
    
    const theme = useAppStore(state => state.theme) || 'oled';
    const colors = Colors[theme as keyof typeof Colors] || Colors.oled;
    
    const isDashboard = segments[segments.length - 1] === 'index' || segments.length === 1;

    const gamification = useAppStore(state => state.gamification) || {};
    const aiLimit = gamification.ai_queries_limit || 5;
    const aiRemaining = gamification.ai_queries_remaining ?? aiLimit;

    const notifications = useAppStore(state => state.notifications) || [];
    const unreadCount = notifications.filter(n => !n.is_read).length;

    const insets = useSafeAreaInsets();
    
    const userProfile = useAppStore(state => state.userProfile);
    const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
    const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
    const imageUrl = userProfile?.profile_image_url ? 
        (userProfile.profile_image_url.startsWith('http') ? userProfile.profile_image_url : `${BACKEND_BASE_URL}${userProfile.profile_image_url}`) 
        : null;

    const blurTint = theme === 'light' ? 'light' : theme === 'dark' ? 'dark' : 'default';

    // If scrollY is provided, we animate the background opacity
    const bgOpacity = scrollY ? scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 1],
        extrapolate: 'clamp'
    }) : 1; // Default to fully visible if no scrollY provided

    const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

    return (
        <View style={{ position: 'relative' }}>
            <AnimatedBlurView 
                intensity={theme === 'oled' ? 50 : 80}
                tint={blurTint as any}
                style={[StyleSheet.absoluteFill, { opacity: bgOpacity, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
            />
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
                    }} theme={theme} colors={colors}>
                        <ChevronLeft size={24} color={colors.text} />
                    </GlassButton>
                ) : (
                    <GlassButton 
                        onPress={() => router.push('/profile')} 
                        theme={theme}
                        style={{
                            width: 40, height: 40, borderRadius: 20, 
                            alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        {imageUrl ? (
                            <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%', borderRadius: 20 }} />
                        ) : (
                            <User size={20} color={colors.textSecondary} />
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
                        style={{ width: 'auto', height: 36, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 18 }}
                    >
                        <Sparkles size={14} color={colors.text} />
                        <Text style={{ color: colors.text, fontSize: 12, fontWeight: '900' }}>{aiRemaining}/{aiLimit}</Text>
                    </GlassButton>

                    <GlassButton onPress={() => router.push('/notifications')} theme={theme} colors={colors}>
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
