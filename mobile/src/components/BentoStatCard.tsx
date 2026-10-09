import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Info } from 'lucide-react-native';

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
    const color = iconColor || themeColors?.tint || '#22c55e';
    const CardWrapper = onPress ? TouchableOpacity : View;

    return (
        <CardWrapper 
            onPress={onPress}
            activeOpacity={0.8}
            style={{ 
                backgroundColor: themeColors?.card, 
                borderRadius: 28, 
                padding: 20, 
                flex: 1, 
                minHeight: 160, 
                justifyContent: 'space-between', 
                borderWidth: 1, 
                borderColor: themeColors?.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 2
            }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 20, 
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                }}>
                    {Icon && <Icon size={24} color={color} />}
                </View>
            </View>

            <View style={{ marginTop: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ 
                        fontSize: 10, 
                        fontWeight: '700', 
                        color: themeColors?.textSecondary, 
                        textTransform: 'uppercase', 
                        letterSpacing: 1.5 
                    }}>
                        {title}
                    </Text>
                    {onInfoPress && (
                        <TouchableOpacity onPress={onInfoPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Info size={12} color={themeColors?.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                    <Text style={{ 
                        fontSize: 28, 
                        fontWeight: '900', 
                        color: themeColors?.text, 
                        letterSpacing: -0.5 
                    }}>
                        {value}
                    </Text>
                    {unit && (
                        <Text style={{ 
                            fontSize: 12, 
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
                        fontSize: 10, 
                        fontWeight: '500', 
                        color: themeColors?.textSecondary, 
                        opacity: 0.6, 
                        marginTop: 2 
                    }}>
                        {subtext}
                    </Text>
                )}
            </View>
        </CardWrapper>
    );
}