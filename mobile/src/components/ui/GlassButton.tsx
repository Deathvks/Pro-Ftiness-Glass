import React, { useRef, useEffect } from 'react';
import { View, Pressable, Animated, StyleSheet, ViewStyle } from 'react-native';
import { GlassView } from 'expo-glass-effect';

const AnimatedGlassBackground = Animated.createAnimatedComponent(View);

interface GlassButtonProps {
    onPress: () => void;
    children: React.ReactNode;
    theme: 'light' | 'dark' | 'oled' | 'galaxy' | 'ocean' | 'desert' | string;
    style?: ViewStyle | ViewStyle[];
    colors?: any;
}

export function GlassButton({ onPress, children, theme, style }: GlassButtonProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    const isLight = ['light', 'ocean', 'desert'].includes(theme);
    const baseOpacity = isLight ? 0.25 : 0.15;
    const pressedOpacity = isLight ? 0.4 : 0.3;
    
    const bgOpacityAnim = useRef(new Animated.Value(baseOpacity)).current;

    useEffect(() => {
        Animated.timing(bgOpacityAnim, {
            toValue: baseOpacity,
            duration: 200,
            useNativeDriver: false
        }).start();
    }, [theme, baseOpacity]);

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

    const flattenedUserStyle = style ? StyleSheet.flatten(style) : {};
    
    // Si no tiene flex ni width, le damos width fijo. Si tiene flex, forzamos width 100% interno.
    const defaultStyle: ViewStyle = {
        alignItems: 'center', 
        justifyContent: 'center'
    };
    
    if (flattenedUserStyle.width === undefined && flattenedUserStyle.flex === undefined) {
        defaultStyle.width = 36;
    }
    if (flattenedUserStyle.height === undefined) {
        defaultStyle.height = 36;
    }

    const finalStyle = { ...defaultStyle, ...flattenedUserStyle };
    const finalBorderRadius = (finalStyle.borderRadius as number) ?? 18;

    return (
        <Pressable 
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[{ flex: finalStyle.flex, width: finalStyle.width, alignSelf: finalStyle.alignSelf }]}
        >
            <Animated.View style={[finalStyle, {
                position: 'relative', 
                flex: undefined, // Quitamos el flex interno para que no se estire verticalmente de forma extraña
                width: '100%',   // Forzamos que llene el Pressable horizontalmente
                height: finalStyle.height || '100%', // Forzamos que llene verticalmente
                transform: [{ scale: scaleAnim }],
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isLight ? 0.08 : 0,
                shadowRadius: 8,
                elevation: isLight ? 2 : 0,
            }]}>
                <GlassView 
                    glassEffectStyle="regular"
                    colorScheme={isLight ? 'light' : 'dark'}
                    style={[StyleSheet.absoluteFill, { borderRadius: finalBorderRadius }]} 
                />
                
                {children}
            </Animated.View>
        </Pressable>
    );
}
