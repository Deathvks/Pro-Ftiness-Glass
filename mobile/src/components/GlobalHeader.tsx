import React, { useRef, useEffect } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, Pressable, Animated } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { User, Sparkles, Bell } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';

const AnimatedGlassBackground = Animated.createAnimatedComponent(View);

const GlassButton = ({ onPress, children, theme, style }: any) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    // Base opacity: 0.4 for light mode, 0.15 for dark mode (using white tint)
    const bgOpacityAnim = useRef(new Animated.Value(theme === 'light' ? 0.4 : 0.15)).current;

    useEffect(() => {
        Animated.timing(bgOpacityAnim, {
            toValue: theme === 'light' ? 0.4 : 0.15,
            duration: 200,
            useNativeDriver: false
        }).start();
    }, [theme]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 1.15,
            useNativeDriver: true,
            friction: 5,
            tension: 100
        }).start();
        Animated.timing(bgOpacityAnim, {
            toValue: theme === 'light' ? 0.6 : 0.3,
            duration: 150,
            useNativeDriver: false
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 5,
            tension: 100
        }).start();
        Animated.timing(bgOpacityAnim, {
            toValue: theme === 'light' ? 0.4 : 0.15,
            duration: 150,
            useNativeDriver: false
        }).start();
    };

    const defaultStyle = {
        width: 36, height: 36, 
        alignItems: 'center', justifyContent: 'center'
    };

    const finalStyle = style ? { ...defaultStyle, ...style } : defaultStyle;
    const finalBorderRadius = style?.borderRadius ?? 18;

    return (
        <Pressable 
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Animated.View style={[finalStyle, {
                position: 'relative', 
                transform: [{ scale: scaleAnim }]
            }]}>
                <View style={[StyleSheet.absoluteFill, { borderRadius: finalBorderRadius, overflow: 'hidden' }]}>
                    <BlurView 
                        tint={theme === 'light' ? 'light' : 'dark'} 
                        intensity={100}
                        experimentalBlurMethod="dimezisBlurView"
                        style={StyleSheet.absoluteFill} 
                    />
                    <AnimatedGlassBackground style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,1)', opacity: bgOpacityAnim }]} />
                </View>
                
                <View style={[StyleSheet.absoluteFill, { borderWidth: 1, borderColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.2)', borderRadius: finalBorderRadius }]} pointerEvents="none" />
                
                {children}
            </Animated.View>
        </Pressable>
    );
};

export default function GlobalHeader() {
    const router = useRouter();
    const segments = useSegments();
    const insets = useSafeAreaInsets();
    
    const theme = useAppStore(state => state.theme) || 'oled';
    const colors = Colors[theme] || Colors.oled;
    
    const isDashboard = segments[segments.length - 1] === 'index' || segments.length === 1;

    const gamification = useAppStore(state => state.gamification) || {};
    const aiLimit = gamification.ai_queries_limit || 5;
    const aiRemaining = gamification.ai_queries_remaining ?? aiLimit;

    const notifications = useAppStore(state => state.notifications) || [];
    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            paddingHorizontal: 16, 
            paddingVertical: 12, 
        }}>
            {/* Left: Profile */}
            <GlassButton onPress={() => router.push('/profile')} theme={theme} colors={colors}>
                <User size={20} color={colors.textSecondary} />
            </GlassButton>

            {/* Center: Logo (Only Dashboard) */}
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                {isDashboard && (
                    <Image source={require('@/assets/images/logo.webp')} style={{ width: 160, height: 40, resizeMode: 'contain', borderRadius: 8 }} />
                )}
            </View>

            {/* Right: Sparkles & Notifications */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 2 }}>
                <GlassButton 
                    onPress={() => {}} 
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
        </View>
    );
}
