import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Info, CheckCircle, AlertTriangle, AlertCircle, UserPlus, Users, Zap, Award, CheckCheck, Trash2 } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';
import AnimatedScreen from '@/components/AnimatedScreen';

export default function NotificationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const theme = useAppStore(state => state.theme) || 'oled';
    const colors = Colors[theme] || Colors.oled;

    const notifications = useAppStore(state => state.notifications) || [];
    const markNotificationAsRead = useAppStore(state => state.markNotificationAsRead);
    const deleteNotification = useAppStore(state => state.deleteNotification);
    const markAllNotificationsAsRead = useAppStore(state => state.markAllNotificationsAsRead);

    const getIcon = (type, subType) => {
        if (subType === 'friend_request') return <UserPlus size={20} color={colors.tint} />;
        if (subType === 'friend_accept') return <Users size={20} color="#10b981" />;
        if (subType === 'xp' || subType === 'level_up') return <Zap size={20} color="#fbbf24" fill="#fbbf24" />;
        if (subType === 'badge') return <Award size={20} color="#f59e0b" />;

        switch (type) {
            case 'success': return <CheckCircle size={20} color="#10b981" />;
            case 'warning': return <AlertTriangle size={20} color="#eab308" />;
            case 'alert': return <AlertCircle size={20} color="#ef4444" />;
            default: return <Info size={20} color={colors.tint} />;
        }
    };

    const getIconBg = (type, subType) => {
        if (subType === 'friend_request') return colors.tint + '15';
        if (subType === 'friend_accept') return '#10b98115';
        if (subType === 'xp' || subType === 'level_up') return '#fbbf2415';
        if (subType === 'badge') return '#f59e0b15';

        switch (type) {
            case 'success': return '#10b98115';
            case 'warning': return '#eab30815';
            case 'alert': return '#ef444415';
            default: return colors.tint + '15';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return `${d.toLocaleDateString()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    const handleNotificationPress = async (notif) => {
        if (!notif.is_read) {
            await markNotificationAsRead(notif.id);
        }
    };

    const headerContent = (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={{ width: 40 }} />
        </View>
    );

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <AnimatedScreen header={headerContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 16 }}>
                <View>
                    <Text style={{ fontSize: 32, fontWeight: '900', color: colors.text }}>Notificaciones</Text>
                    <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 4 }}>
                        Tienes {unreadCount} sin leer
                    </Text>
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity 
                        onPress={() => { if(markAllNotificationsAsRead) markAllNotificationsAsRead(); }}
                        style={{ backgroundColor: colors.tint + '20', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 }}
                    >
                        <CheckCheck size={20} color={colors.tint} />
                    </TouchableOpacity>
                )}
            </View>

            {notifications.length === 0 ? (
                <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 60, opacity: 0.5 }}>
                    <Info size={48} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, marginTop: 16, fontSize: 16, fontWeight: 'bold' }}>No tienes notificaciones</Text>
                </View>
            ) : (
                <View style={{ gap: 12 }}>
                    {notifications.map((notif) => (
                        <TouchableOpacity 
                            key={notif.id}
                            onPress={() => handleNotificationPress(notif)}
                            style={{
                                flexDirection: 'row',
                                backgroundColor: colors.card,
                                borderRadius: 24,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: colors.border,
                                opacity: notif.is_read ? 0.6 : 1,
                                alignItems: 'center'
                            }}
                        >
                            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: getIconBg(notif.type, notif.sub_type), alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                {getIcon(notif.type, notif.sub_type)}
                            </View>
                            
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 }}>
                                    {notif.title}
                                </Text>
                                <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
                                    {notif.message}
                                </Text>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8, fontWeight: '600' }}>
                                    {formatDate(notif.created_at)}
                                </Text>
                            </View>

                            <TouchableOpacity 
                                onPress={() => deleteNotification(notif.id)}
                                style={{ padding: 8 }}
                            >
                                <Trash2 size={20} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </AnimatedScreen>
    );
}
