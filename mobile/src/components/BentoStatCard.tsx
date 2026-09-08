import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Info } from 'lucide-react-native';

export default function BentoStatCard({ title, value, unit, icon: Icon, subtext, iconColor, themeColors }) {
    const color = iconColor || '#3b82f6';
    return (
        <View style={{ backgroundColor: themeColors.card, borderRadius: 28, padding: 20, flex: 1, minHeight: 160, justifyContent: 'space-between', borderWidth: 1, borderColor: themeColors.border }}>
            <View style={{ width: 48, height: 48, borderRadius: 20, backgroundColor: color + '15', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={24} color={color} />
            </View>
            <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: themeColors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                    <Text style={{ fontSize: 24, fontWeight: '900', color: themeColors.text }}>{value}</Text>
                    {unit && <Text style={{ fontSize: 14, fontWeight: 'bold', color: themeColors.textSecondary, marginLeft: 4 }}>{unit}</Text>}
                </View>
                {subtext && <Text style={{ fontSize: 12, color: themeColors.textSecondary, marginTop: 4 }}>{subtext}</Text>}
            </View>
        </View>
    );
}