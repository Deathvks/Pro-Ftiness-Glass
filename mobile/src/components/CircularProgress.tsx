import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export default function CircularProgress({ value, maxValue, label, icon: Icon, color, displayText, themeColors }) {
    const validValue = isNaN(value) ? 0 : value;
    const validMax = isNaN(maxValue) || maxValue === 0 ? 1 : maxValue;
    const percentage = Math.min((validValue / validMax) * 100, 100);
    
    const size = 96;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;
    const finalColor = color || '#3b82f6';

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                    <Circle stroke={themeColors.border} fill="none" cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth} />
                    <Circle stroke={finalColor} fill="none" cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
                </Svg>
                <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
                    {Icon && <Icon size={24} color={finalColor} />}
                </View>
            </View>
            <View style={{ alignItems: 'center', marginTop: 8 }}>
                {displayText ? (
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: finalColor }}>{displayText}</Text>
                ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: finalColor }}>{value.toLocaleString('es-ES')}</Text>
                        <Text style={{ fontSize: 14, color: themeColors.textSecondary, marginLeft: 2 }}>/{maxValue > 0 ? maxValue.toLocaleString('es-ES') : '--'}</Text>
                    </View>
                )}
                <Text style={{ fontSize: 12, color: themeColors.textSecondary }}>{label}</Text>
            </View>
        </View>
    );
}