import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Info } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import useAppStore from '@/store/useAppStore';
import { getAppleCardSurfaceStyle, shouldUseContentGlass } from '@/constants/theme';

export default function BentoStatCard({ 
    title, 
    value, 
    unit, 
    icon: Icon, 
    subtext, 
    iconColor, 
    themeColors, 
    isDark = true,
    onPress, 
    onInfoPress 
}: any) {
    const theme = useAppStore(state => state.theme) || 'oled';
    const isIOS = Platform.OS === 'ios';
    const useGlass = shouldUseContentGlass(theme);
    const color = iconColor || themeColors?.tint || '#22c55e';
    const CardWrapper = onPress ? TouchableOpacity : View;

    return (
        <CardWrapper 
            onPress={onPress}
            activeOpacity={0.8}
            style={[
                { 
                    backgroundColor: 'transparent', 
                    borderRadius: isIOS ? 20 : 28,
                    borderCurve: 'continuous',
                    padding: isIOS ? 18 : 20, 
                    flex: 1, 
                    minHeight: isIOS ? 150 : 160, 
                    justifyContent: 'space-between', 
                    borderWidth: 1, 
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                    overflow: 'hidden',
                },
                isIOS && getAppleCardSurfaceStyle(theme, 20),
            ]}
        >
            {useGlass && (
                <GlassView 
                    glassEffectStyle="regular" 
                    colorScheme={isDark ? 'dark' : 'light'} 
                    style={[StyleSheet.absoluteFill, { borderRadius: isIOS ? 20 : 28 }]} 
                />
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ 
                    width: isIOS ? 40 : 48, 
                    height: isIOS ? 40 : 48, 
                    borderRadius: isIOS ? 12 : 20,
                    borderCurve: 'continuous',
                    backgroundColor: isIOS ? color + '1F' : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'), 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                }}>
                    {Icon && <Icon size={isIOS ? 21 : 24} color={color} strokeWidth={2.2} />}
                </View>
            </View>

            <View style={{ marginTop: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ 
                        fontSize: isIOS ? 12 : 10, 
                        fontWeight: isIOS ? '600' : '700', 
                        color: themeColors?.textSecondary, 
                        textTransform: isIOS ? 'none' : 'uppercase', 
                        letterSpacing: isIOS ? -0.1 : 1.5 
                    }}>
                        {title}
                    </Text>
                    {onInfoPress && (
                        <TouchableOpacity onPress={onInfoPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Info size={12} color={themeColors?.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 3 }}>
                    <Text style={{ 
                        fontSize: isIOS ? 26 : 28, 
                        fontWeight: isIOS ? '700' : '900', 
                        color: themeColors?.text, 
                        letterSpacing: -0.5 
                    }}>
                        {value}
                    </Text>
                    {unit && (
                        <Text style={{ 
                            fontSize: 13, 
                            fontWeight: '600', 
                            color: themeColors?.textSecondary, 
                            marginLeft: 4 
                        }}>
                            {unit}
                        </Text>
                    )}
                </View>

                {subtext && (
                    <Text style={{ 
                        fontSize: isIOS ? 12 : 10, 
                        fontWeight: isIOS ? '400' : '500', 
                        color: themeColors?.textSecondary, 
                        opacity: isIOS ? 0.85 : 0.6, 
                        marginTop: 2 
                    }}>
                        {subtext}
                    </Text>
                )}
            </View>
        </CardWrapper>
    );
}
