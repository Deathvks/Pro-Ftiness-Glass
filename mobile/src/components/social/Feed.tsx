import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Heart, MessageCircle, Clock, Zap, Dumbbell, Download, Trash2, Activity } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastColor } from '@/utils/colorUtils';
import apiClient from '@/services/apiClient';

const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} d`;
    return date.toLocaleDateString();
};

export function Feed() {
    const theme = useAppStore(state => state.theme);
    const colors = useAppColors();
    const [feed, setFeed] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadFeed = async () => {
        try {
            const data = await apiClient('/social/feed');
            setFeed(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFeed();
    }, []);

    const handleToggleLike = async (workoutId: string) => {
        setFeed(prev => prev.map(item => {
            if (item.id === workoutId) {
                const hasLiked = !item.hasLiked;
                const likesCount = item.likesCount + (hasLiked ? 1 : -1);
                return { ...item, hasLiked, likesCount };
            }
            return item;
        }));
        
        try {
            await apiClient(`/social/toggle-like/${workoutId}`, { method: 'POST' });
        } catch (e) {
            loadFeed();
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                <ActivityIndicator size="large" color={getContrastColor(colors.tint, theme)} />
            </View>
        );
    }

    if (feed.length === 0) {
        return (
            <View style={{ padding: 40, alignItems: 'center' }}>
                <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Activity size={32} color={colors.textSecondary} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>El muro está vacío</Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>Agrega amigos para ver sus entrenamientos aquí.</Text>
            </View>
        );
    }

    const renderItem = ({ item: log }: { item: any }) => {
        const user = log.user || {};
        const avatarUrl = user.profile_image_url;
        const displayUsername = user.username?.includes('@') ? user.username.split('@')[0] : (user.username || 'Usuario');

        return (
            <View style={{ marginBottom: 16, borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                <GlassView glassEffectStyle="regular" colorScheme={['light', 'ocean', 'desert'].includes(theme) ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
                
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: colors.tint + '20', overflow: 'hidden', marginRight: 12 }}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: getContrastColor(colors.tint, theme) }}>{displayUsername.charAt(0).toUpperCase()}</Text>
                            </View>
                        )}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }} numberOfLines={1}>{displayUsername}</Text>
                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>{timeAgo(log.end_time)}</Text>
                    </View>
                </View>

                <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
                    <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 12 }}>{log.routine_name}</Text>
                    
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                            <Clock size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.text }}>{Math.floor(log.duration_seconds / 60)} min</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                            <Dumbbell size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.text }}>{log.total_volume} kg</Text>
                        </View>
                    </View>

                    {log.exercises && log.exercises.length > 0 && (
                        <View style={{ gap: 4 }}>
                            {log.exercises.slice(0, 3).map((ex: any, idx: number) => (
                                <Text key={idx} style={{ fontSize: 14, color: colors.textSecondary }} numberOfLines={1}>
                                    <Text style={{ fontWeight: 'bold', color: colors.text }}>{ex.sets?.length || 0}x</Text> {ex.name || 'Ejercicio'}
                                </Text>
                            ))}
                            {log.exercises.length > 3 && (
                                <Text style={{ fontSize: 14, color: getContrastColor(colors.tint, theme), fontWeight: 'bold', marginTop: 2 }}>
                                    + {log.exercises.length - 3} ejercicios más
                                </Text>
                            )}
                        </View>
                    )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
                    <TouchableOpacity 
                        onPress={() => handleToggleLike(log.id)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, backgroundColor: log.hasLiked ? colors.tint + '15' : 'transparent' }}
                    >
                        <Heart size={20} color={log.hasLiked ? getContrastColor(colors.tint, theme) : colors.textSecondary} fill={log.hasLiked ? getContrastColor(colors.tint, theme) : 'transparent'} />
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: log.hasLiked ? getContrastColor(colors.tint, theme) : colors.textSecondary }}>{log.likesCount || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16 }}>
                        <MessageCircle size={20} color={colors.textSecondary} />
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.textSecondary }}>{(log.comments || []).length}</Text>
                    </TouchableOpacity>
                    
                    {log.routine_id && (
                        <TouchableOpacity style={{ marginLeft: 'auto', width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
                            <Download size={18} color={colors.text} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <FlatList
            data={feed}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
        />
    );
}



