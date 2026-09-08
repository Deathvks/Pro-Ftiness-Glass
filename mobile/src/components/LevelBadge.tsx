import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Medal, Star, Trophy, Crown, Flame, Zap, Sparkles, Gem as Diamond, Shield } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const getTier = (level) => {
    if (level < 10) return { name: 'Bronce', colors: ['#CD7F32', '#8B4513'], icon: Shield };
    if (level < 20) return { name: 'Plata', colors: ['#E5E4E2', '#9CA3AF'], icon: Medal };
    if (level < 30) return { name: 'Oro', colors: ['#FFD700', '#B8860B'], icon: Trophy };
    if (level < 40) return { name: 'Platino', colors: ['#E5E4E2', '#5F9EA0'], icon: Star };
    if (level < 50) return { name: 'Diamante', colors: ['#00FFFF', '#00008B'], icon: Diamond };
    if (level < 60) return { name: 'Maestro', colors: ['#9370DB', '#4B0082'], icon: Zap };
    if (level < 70) return { name: 'Gran Maestro', colors: ['#FF69B4', '#C71585'], icon: Flame };
    if (level < 80) return { name: 'Épico', colors: ['#FF4500', '#8B0000'], icon: Crown };
    if (level < 90) return { name: 'Leyenda', colors: ['#FFD700', '#8B0000'], icon: Sparkles };
    if (level < 100) return { name: 'Mítico', colors: ['#00FFFF', '#FF1493'], icon: Crown };
    return { name: 'Inmortal', colors: ['#FDE047', '#9333EA'], icon: Crown };
};

export default function LevelBadge({ level = 1, size = 'md', showName = false, bgTheme }) {
    const tier = getTier(level);
    const Icon = tier.icon;
    
    // sizes mapping
    let wrapperSize = 70;
    let innerSize = 64;
    let textSize = 30;
    let iconBoxSize = 28;
    let iconSize = 14;

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <LinearGradient colors={tier.colors} style={{ width: wrapperSize, height: wrapperSize, borderRadius: wrapperSize/2, alignItems: 'center', justifyContent: 'center', elevation: 10 }}>
                <View style={{ width: innerSize, height: innerSize, borderRadius: innerSize/2, backgroundColor: bgTheme, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: textSize, fontWeight: '900', color: tier.colors[0] }}>{level}</Text>
                </View>
                <View style={{ position: 'absolute', bottom: -8, width: iconBoxSize, height: iconBoxSize, borderRadius: iconBoxSize/2, backgroundColor: bgTheme, padding: 2 }}>
                    <LinearGradient colors={tier.colors} style={{ flex: 1, borderRadius: iconBoxSize/2, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={iconSize} color="#fff" />
                    </LinearGradient>
                </View>
            </LinearGradient>
            {showName && <Text style={{ marginTop: 14, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', color: tier.colors[0], letterSpacing: 1 }}>{tier.name}</Text>}
        </View>
    );
}