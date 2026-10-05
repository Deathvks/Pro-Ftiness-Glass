import React, { useRef, useEffect } from 'react';
import { View, Pressable, Animated, StyleSheet, ViewStyle } from 'react-native';
import { GlassView } from 'expo-glass-effect';

const AnimatedGlassBackground = Animated.createAnimatedComponent(View);

interface GlassButtonProps {
    onPress: () => void;
    children: React.ReactNode;
    theme: 'light' | 'dark' | 'oled' | 'galaxy' | 'ocean' | 'desert' | string;
    style?: ViewStyle | ViewStyle[];
    color?: string;
    colors?: any;
    noShadow?: boolean;
    disabled?: boolean;
}

export function GlassButton({ onPress, children, theme, style, color, noShadow, disabled }: GlassButtonProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    const isLight = ['light', 'ocean', 'desert'].includes(theme);
    const baseOpacity = isLight ? 0.5 : 0.15;
    const pressedOpacity = isLight ? 0.7 : 0.3;
    
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
    
    const hasPadding = flattenedUserStyle.padding !== undefined || flattenedUserStyle.paddingHorizontal !== undefined;
    
    if (flattenedUserStyle.width === undefined && flattenedUserStyle.flex === undefined && !hasPadding) {
        defaultStyle.width = 36;
    }
    if (flattenedUserStyle.height === undefined && !hasPadding) {
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
                width: finalStyle.width !== undefined ? '100%' : undefined,   // Forzamos que llene el Pressable horizontalmente si hay width fijo
                height: finalStyle.height || '100%', // Forzamos que llene verticalmente
                borderRadius: finalBorderRadius, // FIX: Aplica el border radius al contenedor que tiene el borde
                transform: [{ scale: scaleAnim }],
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: (isLight && !noShadow) ? 0.35 : 0,
                shadowRadius: 15,
                borderWidth: isLight ? 1 : 0,
                borderColor: isLight ? 'rgba(255,255,255,0.7)' : 'transparent',
                elevation: (isLight && !noShadow) ? 4 : 0,
            }]}>
                <GlassView 
                    glassEffectStyle="regular"
                    colorScheme={isLight ? 'light' : 'dark'}
                    style={[StyleSheet.absoluteFill, { borderRadius: finalBorderRadius }]} 
                />
                <Animated.View style={[
                    StyleSheet.absoluteFill,
                    { 
                        borderRadius: finalBorderRadius,
                        backgroundColor: color || (isLight ? '#ffffff' : '#000000'),
                        opacity: bgOpacityAnim
                    }
                ]} />
                
                {children}
            </Animated.View>
        </Pressable>
    );
}
