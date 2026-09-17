import React, { useRef, useEffect } from 'react';
import { View, Pressable, Animated, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

const AnimatedGlassBackground = Animated.createAnimatedComponent(View);

interface GlassButtonProps {
    onPress: () => void;
    children: React.ReactNode;
    theme: 'light' | 'dark' | 'oled';
    style?: ViewStyle | ViewStyle[];
    colors?: any;
}

export function GlassButton({ onPress, children, theme, style }: GlassButtonProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    // Base opacity: 0.4 for light mode, 0.15 for dark mode (using white tint)
    const baseOpacity = theme === 'light' ? 0.4 : 0.15;
    const pressedOpacity = theme === 'light' ? 0.6 : 0.3;
    
    const bgOpacityAnim = useRef(new Animated.Value(baseOpacity)).current;

    useEffect(() => {
        Animated.timing(bgOpacityAnim, {
            toValue: baseOpacity,
            duration: 200,
            useNativeDriver: false
        }).start();
    }, [theme]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
            friction: 5,
            tension: 100
        }).start();
        Animated.timing(bgOpacityAnim, {
            toValue: pressedOpacity,
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
            toValue: baseOpacity,
            duration: 150,
            useNativeDriver: false
        }).start();
    };

    const defaultStyle: ViewStyle = {
        width: 36, height: 36, 
        alignItems: 'center', justifyContent: 'center'
    };

    const finalStyle = style ? { ...defaultStyle, ...StyleSheet.flatten(style) } : defaultStyle;
    const finalBorderRadius = (finalStyle.borderRadius as number) ?? 18;

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
}
