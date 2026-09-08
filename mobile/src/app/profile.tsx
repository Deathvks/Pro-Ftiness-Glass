import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, KeyboardAvoidingView, Platform, StyleSheet, Animated, Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { ChevronLeft, Camera, User, Mail, Shield, Save, Eye, Trophy, AlertTriangle, Dumbbell, Flame, Crown, Star, Medal, Zap, Sparkles, Award } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';
import AnimatedScreen from '@/components/AnimatedScreen';

const AnimatedGlassBackground = Animated.createAnimatedComponent(View);

const GlassButton = ({ onPress, children, theme, style, contentStyle }: any) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const bgOpacityAnim = useRef(new Animated.Value(theme === 'light' ? 0.4 : 0.15)).current;

    useEffect(() => {
        Animated.timing(bgOpacityAnim, {
            toValue: theme === 'light' ? 0.4 : 0.15,
            duration: 200,
            useNativeDriver: false
        }).start();
    }, [theme]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 1.05, // reduced scale for wider buttons
            useNativeDriver: true,
            friction: 5,
            tension: 100
        }).start();
        Animated.timing(bgOpacityAnim, {
            toValue: theme === 'light' ? 0.6 : 0.3,
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
            toValue: theme === 'light' ? 0.4 : 0.15,
            duration: 150,
            useNativeDriver: false
        }).start();
    };

    const defaultStyle = {
        width: 40, height: 40, 
        alignItems: 'center', justifyContent: 'center'
    };

    const finalStyle = style ? { ...defaultStyle, ...style } : defaultStyle;
    const finalBorderRadius = style?.borderRadius ?? 20;

    return (
        <Pressable 
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Animated.View style={[finalStyle, {
                position: 'relative', 
                transform: [{ scale: scaleAnim }],
                zIndex: 10
            }]}>
                <View style={[StyleSheet.absoluteFill, { borderRadius: finalBorderRadius, overflow: 'hidden' }]}>
                    <BlurView 
                        tint={theme === 'light' ? 'light' : 'dark'} 
                        intensity={100}
                        experimentalBlurMethod="dimezisBlurView"
                        style={StyleSheet.absoluteFill} 
                    />
                    <AnimatedGlassBackground style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,1)', opacity: bgOpacityAnim }]} />
                </View>
                
                <View style={[StyleSheet.absoluteFill, { borderWidth: 1, borderColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.2)', borderRadius: finalBorderRadius }]} pointerEvents="none" />
                
                <View style={contentStyle || { flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    {children}
                </View>
            </Animated.View>
        </Pressable>
    );
};

const BADGE_DETAILS = {
    first_login: { name: 'Primer Paso', desc: 'Inicia sesión por primera vez', icon: User, color: '#3b82f6', bg: '#3b82f615' },
    first_workout: { name: 'Primer Sudor', desc: 'Completa tu primer entrenamiento', icon: Dumbbell, color: '#22c55e', bg: '#22c55e15' },
    streak_3: { name: 'En Llamas', desc: 'Racha de 3 días', icon: Flame, color: '#f97316', bg: '#f9731615' },
    streak_7: { name: 'Imparable', desc: 'Racha de 7 días', icon: Flame, color: '#ef4444', bg: '#ef444415' },
    streak_30: { name: 'Leyenda', desc: 'Racha de 30 días', icon: Crown, color: '#eab308', bg: '#eab30815' },
    nutrition_master: { name: 'Chef', desc: 'Registra 5 comidas', icon: Star, color: '#a855f7', bg: '#a855f715' },
    milestone_10: { name: 'Plata (Lvl 10)', desc: 'Alcanza el nivel 10', icon: Medal, color: '#9CA3AF', bg: '#9CA3AF15' },
    milestone_20: { name: 'Oro (Lvl 20)', desc: 'Alcanza el nivel 20', icon: Trophy, color: '#FFD700', bg: '#FFD70015' },
    milestone_30: { name: 'Platino (Lvl 30)', desc: 'Alcanza el nivel 30', icon: Star, color: '#5F9EA0', bg: '#5F9EA015' },
    milestone_40: { name: 'Diamante (Lvl 40)', desc: 'Alcanza el nivel 40', icon: Award, color: '#00FFFF', bg: '#00FFFF15' },
    milestone_50: { name: 'Maestro (Lvl 50)', desc: 'Alcanza el nivel 50', icon: Zap, color: '#9370DB', bg: '#9370DB15' },
    milestone_60: { name: 'Gran Maestro (Lvl 60)', desc: 'Alcanza el nivel 60', icon: Flame, color: '#FF69B4', bg: '#FF69B415' },
    milestone_70: { name: 'Épico (Lvl 70)', desc: 'Alcanza el nivel 70', icon: Crown, color: '#FF4500', bg: '#FF450015' },
    milestone_80: { name: 'Leyenda (Lvl 80)', desc: 'Alcanza el nivel 80', icon: Sparkles, color: '#FFD700', bg: '#f9731615' },
    default: { name: 'Insignia', desc: 'Logro desbloqueado', icon: Trophy, color: '#f59e0b', bg: '#f59e0b15' }
};

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const theme = useAppStore(state => state.theme) || 'oled';
    const colors = Colors[theme] || Colors.oled;
    
    const userProfile = useAppStore(state => state.userProfile || state.user);
    const bodyWeightLog = useAppStore(state => state.bodyWeightLog) || [];
    const latestWeight = bodyWeightLog.length > 0 ? parseFloat(bodyWeightLog[0].weight_kg).toFixed(1) : (userProfile?.weight || '');

    const [username, setUsername] = useState(userProfile?.username || '');
    const [newPassword, setNewPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const gamification = useAppStore(state => state.gamification);

    const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
    const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
    
    const imageUrl = userProfile?.profile_image_url ? 
        (userProfile.profile_image_url.startsWith('http') ? userProfile.profile_image_url : `${BACKEND_BASE_URL}${userProfile.profile_image_url}`) 
        : null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const formData = new FormData();
            if (username !== userProfile.username) {
                formData.append('username', username);
            }
            if (newPassword) {
                formData.append('newPassword', newPassword);
            }

            // Llamar al endpoint
            const { updateUserAccount } = require('@/services/userService');
            await updateUserAccount(formData);

            // Refrescar datos
            await useAppStore.getState().fetchInitialData();
            
            setNewPassword('');
            alert('¡Perfil actualizado con éxito!');
        } catch (error) {
            console.error(error);
            alert(error.message || 'Error al actualizar el perfil');
        } finally {
            setIsSaving(false);
        }
    };

    const headerContent = (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
            <GlassButton onPress={() => router.back()} theme={theme}>
                <ChevronLeft size={24} color={colors.text} />
            </GlassButton>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>Perfil</Text>
            <View style={{ width: 40 }} />
        </View>
    );

    return (
        <AnimatedScreen header={headerContent} paddingHorizontal={24} paddingBottom={100}>
            {/* Imagen de Perfil */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
                <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%', borderRadius: 60 }} />
                    ) : (
                        <View style={{ width: '100%', height: '100%', borderRadius: 60, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
                            <User size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                        </View>
                    )}
                    <TouchableOpacity style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.tint, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.background }}>
                        <Camera size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
                <Text style={{ marginTop: 16, fontSize: 24, fontWeight: '900', color: colors.text }}>{username || 'Atleta'}</Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>{userProfile?.email}</Text>
            </View>

            {/* Datos Básicos */}
            <View style={{ backgroundColor: colors.card, borderRadius: 32, padding: 24, borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 20 }}>Datos Básicos</Text>
                
                <View style={{ gap: 16 }}>
                    <View>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>Nombre de usuario</Text>
                        <TextInput 
                            style={styles(colors).input} 
                            value={username} 
                            onChangeText={setUsername} 
                            placeholder="Tu nombre"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    <View>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>Correo Electrónico</Text>
                        <TextInput 
                            style={styles(colors).input} 
                            value={userProfile?.email} 
                            editable={false}
                            placeholder="Tu correo"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>
                </View>

                {/* Contraseña */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, marginTop: 32 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.tint + '20', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={20} color={colors.tint} />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>Restablecer Contraseña</Text>
                </View>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 20, lineHeight: 20 }}>
                    Añade o cambia tu contraseña para iniciar sesión directamente con tu correo electrónico.
                </Text>
                
                <View style={{ gap: 16 }}>
                    <View>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>Contraseña Nueva</Text>
                        <TextInput 
                            style={styles(colors).input} 
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="Escribe una nueva contraseña"
                            placeholderTextColor={colors.textSecondary}
                            secureTextEntry
                        />
                    </View>
                </View>

                {/* Botón de Guardar */}
                <View style={{ marginTop: 12 }}>
                    <GlassButton 
                        onPress={handleSave}
                        disabled={isSaving}
                        theme={theme}
                        style={{ width: '100%', height: 56, borderRadius: 20 }}
                        contentStyle={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </Text>
                    </GlassButton>
                </View>
            </View>
            <View style={{ backgroundColor: colors.card, borderRadius: 32, padding: 24, borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.tint + '20', alignItems: 'center', justifyContent: 'center' }}>
                        <Eye size={20} color={colors.tint} />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>Perfil Social Público</Text>
                </View>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 24, lineHeight: 20 }}>
                    Así es como otros usuarios ven tu perfil, logros y estadísticas en la comunidad. Puedes personalizar qué información compartir desde la sección de privacidad en Ajustes.
                </Text>
                
                <TouchableOpacity 
                    onPress={() => router.push(`/publicProfile?id=${userProfile?.id}`)}
                    style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, paddingVertical: 14, borderRadius: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                >
                    <User size={18} color={colors.text} />
                    <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>
                        Previsualizar Mi Perfil
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Mis Insignias */}
            <View style={{ backgroundColor: colors.card, borderRadius: 32, padding: 24, borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.tint + '20', alignItems: 'center', justifyContent: 'center' }}>
                        <Trophy size={20} color={colors.tint} />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>Mis Insignias</Text>
                </View>

                {gamification?.unlockedBadges && gamification.unlockedBadges.length > 0 ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
                        {gamification.unlockedBadges.map((badgeId) => {
                            const badge = BADGE_DETAILS[badgeId] || BADGE_DETAILS.default;
                            const IconComp = badge.icon;
                            return (
                                <View key={badgeId} style={{ width: '31%', backgroundColor: colors.background, borderRadius: 20, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                                    <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: badge.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                        <IconComp size={24} color={badge.color} />
                                    </View>
                                    <Text style={{ fontSize: 12, fontWeight: '900', color: colors.text, textAlign: 'center', marginBottom: 4 }}>{badge.name}</Text>
                                    <Text style={{ fontSize: 10, color: colors.textSecondary, textAlign: 'center' }}>{badge.desc}</Text>
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                        <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: 'bold' }}>¡Sigue entrenando para desbloquear recompensas!</Text>
                    </View>
                )}
            </View>

            {/* Zona de Peligro */}
            <View style={{ backgroundColor: '#ef444410', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: '#ef444430', marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#ef444420', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertTriangle size={20} color="#ef4444" />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#ef4444' }}>Zona de Peligro</Text>
                </View>
                
                <View style={{ backgroundColor: colors.background, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: colors.text, textTransform: 'uppercase', marginBottom: 8 }}>Borrar Mis Datos</Text>
                    <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 20, lineHeight: 20 }}>
                        Elimina todo tu historial de entrenamientos, rutinas y nutrición, pero conserva tu perfil de usuario.
                    </Text>
                    <GlassButton 
                        onPress={() => Alert.alert('Confirmación', '¿Estás seguro de que deseas borrar tu historial?')}
                        theme={theme}
                        style={{ width: '100%', height: 50, borderRadius: 20 }}
                        contentStyle={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>Borrar Historial</Text>
                    </GlassButton>
                </View>

                <View style={{ backgroundColor: colors.background, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#ef444430' }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#ef4444', textTransform: 'uppercase', marginBottom: 8 }}>Borrar Cuenta Definitivamente</Text>
                    <Text style={{ fontSize: 14, color: '#ef4444', opacity: 0.8, marginBottom: 20, lineHeight: 20 }}>
                        Elimina permanentemente tu cuenta y todos tus datos. Esta acción no se puede deshacer.
                    </Text>
                    <GlassButton 
                        onPress={() => Alert.alert('Peligro', 'Esta acción eliminará tu cuenta para siempre. ¿Continuar?')}
                        theme={theme}
                        style={{ width: '100%', height: 50, borderRadius: 20 }}
                        contentStyle={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Text style={{ fontSize: 16, fontWeight: '900', color: '#ef4444' }}>Borrar Cuenta</Text>
                    </GlassButton>
                </View>
            </View>

        </AnimatedScreen>
    );
}

const styles = (colors) => StyleSheet.create({
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    chip: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: colors.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    chipActive: {
        backgroundColor: colors.tint + '20',
        borderColor: colors.tint,
    },
    chipText: {
        color: colors.textSecondary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    chipTextActive: {
        color: colors.tint,
    }
});
