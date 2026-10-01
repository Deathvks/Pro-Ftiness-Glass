import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Trophy, Medal } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import apiClient from '@/services/apiClient';
import LevelBadge from '@/components/LevelBadge';

export function Leaderboard() {
    const theme = useAppStore(state => state.theme);
    const colors = useAppColors();
    const userProfile = useAppStore(state => state.userProfile);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadLeaderboard = async () => {
        try {
            const data = await apiClient('/social/leaderboard');
            setLeaderboard(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLeaderboard();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    const renderHeader = () => (
        <View style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#EAB30820', alignItems: 'center', justifyContent: 'center' }}>
                        <Trophy size={18} color="#EAB308" />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>Ranking Global</Text>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: colors.tint + '15' }}>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: colors.tint, textTransform: 'uppercase', letterSpacing: 1 }}>Top 50</Text>
                </View>
            </View>
            
            <View style={{ flexDirection: 'row', paddingHorizontal: 4, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ width: 28, textAlign: 'center', fontSize: 9, fontWeight: 'bold', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>#</Text>
                <Text style={{ flex: 1, paddingLeft: 6, fontSize: 9, fontWeight: 'bold', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>Atleta</Text>
                <Text style={{ width: 50, textAlign: 'right', fontSize: 9, fontWeight: 'bold', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>Nivel</Text>
                <Text style={{ width: 64, textAlign: 'right', fontSize: 9, fontWeight: 'bold', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>XP</Text>
            </View>
        </View>
    );

    const renderItem = ({ item: user, index }: { item: any, index: number }) => {
        const isMe = user.id === userProfile?.id;
        const displayUsername = user.username?.includes('@') ? user.username.split('@')[0] : (user.username || 'Usuario');
        const avatarUrl = user.profile_image_url || user.avatar;
        
        let rankIcon = null;
        if (index === 0) rankIcon = <Medal size={18} color="#FBBF24" />;
        else if (index === 1) rankIcon = <Medal size={18} color="#9CA3AF" />;
        else if (index === 2) rankIcon = <Medal size={18} color="#B45309" />;
        else rankIcon = <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.textSecondary, opacity: 0.6 }}>#{index + 1}</Text>;

        return (
            <TouchableOpacity 
                activeOpacity={0.7}
                style={{ 
                    flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8, borderRadius: 16, marginBottom: 4,
                    backgroundColor: isMe ? colors.tint + '15' : 'transparent',
                    borderWidth: 1, borderColor: isMe ? colors.tint + '30' : 'transparent'
                }}
            >
                <View style={{ width: 28, alignItems: 'center', justifyContent: 'center' }}>
                    {rankIcon}
                </View>
                
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: 4, gap: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.card, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.tint }}>{displayUsername.charAt(0).toUpperCase()}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={{ flexShrink: 1, fontSize: 13, fontWeight: isMe ? '900' : 'bold', color: isMe ? colors.tint : colors.text }} numberOfLines={1}>
                        {displayUsername} {isMe && '(Tú)'}
                    </Text>
                </View>
                
                <View style={{ width: 50, alignItems: 'flex-end', justifyContent: 'center' }}>
                    <View style={{ transform: [{ scale: 0.45 }], transformOrigin: 'right center' }}>
                        <LevelBadge level={user.level || 1} size="sm" bgTheme={colors.background} />
                    </View>
                </View>
                
                <View style={{ width: 64, alignItems: 'flex-end', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', fontFamily: 'monospace', color: colors.text }}>
                        {user.xp?.toLocaleString()}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ flex: 1, padding: 16, paddingBottom: 100 }}>
            <GlassView 
                glassEffectStyle="regular" 
                colorScheme={['light', 'ocean', 'desert'].includes(theme) ? 'light' : 'dark'} 
                style={{ flex: 1, borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}
            >
                <FlatList
                    data={leaderboard}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={{ padding: 16 }}
                    showsVerticalScrollIndicator={false}
                />
            </GlassView>
        </View>
    );
}

