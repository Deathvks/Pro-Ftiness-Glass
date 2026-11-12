import React, { useRef, useEffect, useMemo } from 'react';
import { View, Pressable, Animated, StyleSheet, ViewStyle, Platform } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';

interface GlassButtonProps {
    onPress: () => void;
    children: React.ReactNode;
    theme: 'light' | 'dark' | 'oled' | 'galaxy' | 'ocean' | 'desert' | string;
    style?: ViewStyle | ViewStyle[];
    color?: string;
    colors?: any;
    noShadow?: boolean;
    disabled?: boolean;
    accessibilityLabel?: string;
}

export function GlassButton({ onPress, children, theme, style, color, noShadow, disabled, accessibilityLabel }: GlassButtonProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    const isLight = ['light', 'ocean', 'desert'].includes(theme);
    const nativeGlassAvailable = useMemo(() => {
        if (Platform.OS !== 'ios') return false;
        try {
            return isLiquidGlassAvailable();
        } catch {
            return false;
        }
    }, []);

    // Detect if color already contains an alpha channel (e.g. #RRGGBBAA or rgba(...))
    const colorHasAlpha = useMemo(() => {
        if (!color) return false;
        const c = color.trim();
        return (c.startsWith('#') && c.length === 9) || c.startsWith('rgba(');
    }, [color]);

    const baseOpacity = nativeGlassAvailable
        ? (color ? (colorHasAlpha ? 1 : 0.26) : 0)
        : (colorHasAlpha ? 1 : (isLight ? 0.5 : 0.15));
    const pressedOpacity = nativeGlassAvailable
        ? (color ? (colorHasAlpha ? 0.85 : 0.36) : 0.18)
        : (colorHasAlpha ? 0.85 : (isLight ? 0.7 : 0.3));
    
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
            toValue: 0.96,
            useNativeDriver: true,
            friction: 6,
            tension: 120
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
            friction: 6,
            tension: 120
        }).start();
        Animated.timing(bgOpacityAnim, {
            toValue: baseOpacity,
            duration: 150,
            useNativeDriver: false
        }).start();
    };

    const flattenedUserStyle: ViewStyle = (style ? StyleSheet.flatten(style) : {}) || {};
    
    const hasPadding =
        flattenedUserStyle.padding !== undefined ||
        flattenedUserStyle.paddingHorizontal !== undefined ||
        flattenedUserStyle.paddingVertical !== undefined ||
        flattenedUserStyle.paddingTop !== undefined ||
        flattenedUserStyle.paddingBottom !== undefined;
    
    // Normalize 'auto' height/width so React Native Yoga never sets height: '100%' inside an 'auto' parent
    const rawWidth = flattenedUserStyle.width === 'auto' ? undefined : flattenedUserStyle.width;
    const rawHeight = flattenedUserStyle.height === 'auto' ? undefined : flattenedUserStyle.height;

    let defaultWidth: number | undefined = undefined;
    let defaultHeight: number | undefined = undefined;
    if (rawWidth === undefined && flattenedUserStyle.flex === undefined && !hasPadding) {
        defaultWidth = 36;
    }
    if (rawHeight === undefined && !hasPadding) {
        defaultHeight = 36;
    }

    const resolvedWidth = rawWidth !== undefined ? rawWidth : defaultWidth;
    const resolvedHeight = rawHeight !== undefined ? rawHeight : defaultHeight;

    const finalStyle: ViewStyle = { 
        alignItems: 'center', 
        justifyContent: 'center',
        ...flattenedUserStyle,
        width: resolvedWidth,
        height: resolvedHeight,
    };
    const finalBorderRadius = (finalStyle.borderRadius as number) ?? 18;

    const defaultBorderWidth = nativeGlassAvailable ? 0 : StyleSheet.hairlineWidth;

    return (
        <Pressable 
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[{
                flex: finalStyle.flex,
                width: resolvedWidth,
                height: resolvedHeight,
                minHeight: finalStyle.minHeight,
                alignSelf: finalStyle.alignSelf,
                margin: finalStyle.margin,
                marginTop: finalStyle.marginTop,
                marginBottom: finalStyle.marginBottom,
                marginLeft: finalStyle.marginLeft,
                marginRight: finalStyle.marginRight,
                marginVertical: finalStyle.marginVertical,
                marginHorizontal: finalStyle.marginHorizontal,
                opacity: disabled ? 0.5 : 1,
            }]}
        >
            <Animated.View style={[finalStyle, {
                position: 'relative', 
                flex: undefined,
                width: (resolvedWidth !== undefined || finalStyle.flex !== undefined) ? '100%' : undefined,
                height: typeof resolvedHeight === 'number' ? resolvedHeight : undefined,
                margin: undefined,
                marginTop: undefined,
                marginBottom: undefined,
                marginLeft: undefined,
                marginRight: undefined,
                marginVertical: undefined,
                marginHorizontal: undefined,
                borderRadius: finalBorderRadius,
                borderCurve: 'continuous',
                transform: [{ scale: scaleAnim }],
                borderWidth: finalStyle.borderWidth !== undefined ? finalStyle.borderWidth : defaultBorderWidth,
                borderColor: finalStyle.borderColor !== undefined ? finalStyle.borderColor : (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.14)'),
            }]}>
                {Platform.OS === 'ios' ? (
                    <GlassView 
                        pointerEvents="none"
                        glassEffectStyle="regular"
                        isInteractive
                        colorScheme={isLight ? 'light' : 'dark'}
                        style={[StyleSheet.absoluteFill, { borderRadius: finalBorderRadius, borderCurve: 'continuous' }]} 
                    />
                ) : (
                    <BlurView
                        pointerEvents="none"
                        intensity={Platform.OS === 'android' ? 50 : 25}
                        tint={isLight ? 'light' : 'dark'}
                        style={[StyleSheet.absoluteFill, { borderRadius: finalBorderRadius, overflow: 'hidden' }]}
                    />
                )}
                <Animated.View 
                    pointerEvents="none"
                    style={[
                        StyleSheet.absoluteFill,
                        { 
                            borderRadius: finalBorderRadius,
                            borderCurve: 'continuous',
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
