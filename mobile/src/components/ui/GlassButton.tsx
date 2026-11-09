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

    const flattenedUserStyle: ViewStyle = (style ? StyleSheet.flatten(style) : {}) || {};
    
    // Si no tiene flex ni width, le damos width fijo. Si tiene flex, forzamos width 100% interno.
    const hasPadding = flattenedUserStyle.padding !== undefined || flattenedUserStyle.paddingHorizontal !== undefined;
    
    let defaultWidth: number | undefined = undefined;
    let defaultHeight: number | undefined = undefined;
    if (flattenedUserStyle.width === undefined && flattenedUserStyle.flex === undefined && !hasPadding) {
        defaultWidth = 36;
    }
    if (flattenedUserStyle.height === undefined && !hasPadding) {
        defaultHeight = 36;
    }

    const finalStyle: ViewStyle = { 
        alignItems: 'center', 
        justifyContent: 'center',
        ...(defaultWidth !== undefined ? { width: defaultWidth } : {}),
        ...(defaultHeight !== undefined ? { height: defaultHeight } : {}),
        ...flattenedUserStyle 
    };
    const finalBorderRadius = (finalStyle.borderRadius as number) ?? 18;

    return (
        <Pressable 
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[{ flex: finalStyle.flex, width: finalStyle.width, height: finalStyle.height, alignSelf: finalStyle.alignSelf }]}
        >
            <Animated.View style={[finalStyle, {
                position: 'relative', 
                flex: undefined, // Quitamos el flex interno para que no se estire verticalmente de forma extraña
                width: finalStyle.width !== undefined ? '100%' : undefined,   // Forzamos que llene el Pressable horizontalmente si hay width fijo
                height: finalStyle.height || '100%', // Forzamos que llene verticalmente
                borderRadius: finalBorderRadius, // FIX: Aplica el border radius al contenedor que tiene el borde
                transform: [{ scale: scaleAnim }],
                borderWidth: finalStyle.borderWidth !== undefined ? finalStyle.borderWidth : 1,
                borderColor: finalStyle.borderColor !== undefined ? finalStyle.borderColor : (isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.12)'),
            }]}>
                <GlassView 
                    pointerEvents="none"
                    glassEffectStyle="regular"
                    colorScheme={isLight ? 'light' : 'dark'}
                    style={[StyleSheet.absoluteFill, { borderRadius: finalBorderRadius }]} 
                />
                <Animated.View 
                    pointerEvents="none"
                    style={[
                        StyleSheet.absoluteFill,
                        { 
                            borderRadius: finalBorderRadius,
                            backgroundColor: color || (isLight ? '#ffffff' : '#000000'),
                            opacity: bgOpacityAnim
                        }
                    ]} 
                />
                
                {children}
            </Animated.View>
        </Pressable>
    );
}
