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
    
    // Base opacity: 0.25 for light mode, 0.15 for dark mode (using white tint)
    const baseOpacity = 0;
    const pressedOpacity = (['light', 'ocean', 'desert'].includes(theme)) ? 0.15 : 0.1;
    
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
            toValue: 0.94,
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
                transform: [{ scale: scaleAnim }],
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: (['light', 'ocean', 'desert'].includes(theme)) ? 0.08 : 0,
                shadowRadius: 8,
                elevation: (['light', 'ocean', 'desert'].includes(theme)) ? 2 : 0,
            }]}>
                <View style={[StyleSheet.absoluteFill, { borderRadius: finalBorderRadius, overflow: 'hidden' }]}>
                    <BlurView 
                        tint={(['light', 'ocean', 'desert'].includes(theme)) ? 'systemThickMaterialLight' : 'systemThickMaterialDark'} 
                        intensity={(['light', 'ocean', 'desert'].includes(theme)) ? 80 : 100}
                        experimentalBlurMethod="dimezisBlurView"
                        style={StyleSheet.absoluteFill} 
                    />
                    <AnimatedGlassBackground style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,1)', opacity: bgOpacityAnim }]} />
                </View>
                
                {children}
            </Animated.View>
        </Pressable>
    );
}
