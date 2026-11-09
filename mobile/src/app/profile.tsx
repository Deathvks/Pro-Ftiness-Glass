/* mobile/src/app/profile.tsx */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  ChevronRight,
  User,
  UserCircle,
  AtSign,
  Key,
  LayoutTemplate,
  Trash2,
  AlertTriangle,
  Trophy,
  Flame,
  Dumbbell,
  Crown,
  Star,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  Zap,
  Medal,
  Sparkles,
  Award,
} from 'lucide-react-native';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import AnimatedScreen from '@/components/AnimatedScreen';
import GlobalHeader from '@/components/GlobalHeader';
import { getContrastTextColor } from '@/utils/colorUtils';
import { BACKEND_BASE_URL } from '@/services/apiClient';
import { getUserRoleRingConfig } from '@/utils/userRoleUtils';
import { updateUserAccount, deleteMyData, deleteMyAccount } from '@/services/userService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- Configuración Completa de Insignias Idéntica al Frontend ---
const BADGE_DETAILS: Record<string, { name: string; desc: string; icon: any; color: string; bg: string }> = {
  first_login: { name: 'Primer Paso', desc: 'Inicia sesión por primera vez', icon: User, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  first_workout: { name: 'Primer Sudor', desc: 'Completa tu primer entrenamiento', icon: Dumbbell, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  streak_3: { name: 'En Llamas', desc: 'Racha de 3 días', icon: Flame, color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
  streak_7: { name: 'Imparable', desc: 'Racha de 7 días', icon: Flame, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  streak_30: { name: 'Leyenda', desc: 'Racha de 30 días', icon: Crown, color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' },
  nutrition_master: { name: 'Chef', desc: 'Registra 5 comidas', icon: Star, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
  milestone_10: { name: 'Plata (Lvl 10)', desc: 'Alcanza el nivel 10', icon: Medal, color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.15)' },
  milestone_20: { name: 'Oro (Lvl 20)', desc: 'Alcanza el nivel 20', icon: Trophy, color: '#FFD700', bg: 'rgba(255, 215, 0, 0.15)' },
  milestone_30: { name: 'Platino (Lvl 30)', desc: 'Alcanza el nivel 30', icon: Star, color: '#5F9EA0', bg: 'rgba(95, 158, 160, 0.15)' },
  milestone_40: { name: 'Diamante (Lvl 40)', desc: 'Alcanza el nivel 40', icon: Award, color: '#00FFFF', bg: 'rgba(0, 255, 255, 0.15)' },
  milestone_50: { name: 'Maestro (Lvl 50)', desc: 'Alcanza el nivel 50', icon: Zap, color: '#9370DB', bg: 'rgba(147, 112, 219, 0.15)' },
  milestone_60: { name: 'Gran Maestro (Lvl 60)', desc: 'Alcanza el nivel 60', icon: Flame, color: '#FF69B4', bg: 'rgba(255, 105, 180, 0.15)' },
  milestone_70: { name: 'Épico (Lvl 70)', desc: 'Alcanza el nivel 70', icon: Crown, color: '#FF4500', bg: 'rgba(255, 69, 0, 0.15)' },
  milestone_80: { name: 'Leyenda (Lvl 80)', desc: 'Alcanza el nivel 80', icon: Sparkles, color: '#FFD700', bg: 'rgba(255, 215, 0, 0.15)' },
  default: { name: 'Insignia', desc: 'Logro desbloqueado', icon: Trophy, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
};

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const userProfile = useAppStore(state => state.userProfile || (state as any).user);
  const gamification = useAppStore(state => state.gamification);
  const handleLogout = useAppStore(state => (state as any).handleLogout);

  const [username, setUsername] = useState(userProfile?.username || '');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (userProfile?.username) {
      setUsername(userProfile.username);
    }
  }, [userProfile?.username]);

  // Manejo de dirty state
  const handleUsernameChange = (text: string) => {
    setUsername(text);
    setIsDirty(text.trim() !== (userProfile?.username || '') || selectedImageUri !== null);
  };

  // Configuración del rol para el anillo de avatar y badge
  const roleConfig = useMemo(() => {
    return getUserRoleRingConfig(userProfile, userProfile);
  }, [userProfile]);

  // URL final de imagen
  const displayImageUri = useMemo(() => {
    if (selectedImageUri) return selectedImageUri;
    const raw = userProfile?.profile_image_url;
    if (!raw) return null;
    if (raw.startsWith('http') || raw.startsWith('blob:')) return raw;
    const sep = raw.startsWith('/') ? '' : '/';
    return `${BACKEND_BASE_URL}${sep}${raw}`;
  }, [selectedImageUri, userProfile?.profile_image_url]);

  // Selección de foto de perfil con ImagePicker nativo
  const handlePickImage = async () => {
    try {
      Haptics.selectionAsync();
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Se necesita acceso a tus fotos para cambiar la imagen de perfil.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0].uri);
        setIsDirty(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo seleccionar la foto.');
    }
  };

  // Guardar Cambios
  const handleSave = async () => {
    if (!isDirty || isSaving) return;
    setIsSaving(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const formData = new FormData();
      if (username.trim() && username.trim() !== userProfile?.username) {
        formData.append('username', username.trim());
      }
      if (selectedImageUri) {
        const filename = selectedImageUri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('profileImage', {
          uri: selectedImageUri,
          name: filename,
          type,
        } as any);
      }

      await updateUserAccount(formData);
      await useAppStore.getState().fetchInitialData();
      setIsDirty(false);
      setSelectedImageUri(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('¡Éxito!', 'Perfil actualizado correctamente.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  // Acciones de Zona de Peligro
  const handleDeleteData = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      '¿Borrar historial de datos?',
      'Esta acción eliminará todos tus entrenamientos registrados, historial de peso y métricas. Tu cuenta de usuario permanecerá activa.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar Datos',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMyData('');
              await useAppStore.getState().fetchInitialData();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Historial borrado', 'Se han eliminado tus registros correctamente.');
            } catch (e: any) {
              Alert.alert('Error', e.message || 'No se pudo borrar el historial.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert(
      '¿Eliminar cuenta definitivamente?',
      'Esta acción es completamente irreversible. Se eliminará tu cuenta, progreso, insignias y toda tu información de forma permanente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Cuenta',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMyAccount('');
              if (handleLogout) handleLogout();
              router.replace('/login');
            } catch (e: any) {
              Alert.alert('Error', e.message || 'No se pudo eliminar la cuenta.');
            }
          },
        },
      ]
    );
  };

  const btnTextColor = getContrastTextColor(colors.tint);
  const unlockedBadges = gamification?.unlockedBadges || [];

  return (
    <AnimatedScreen header={<GlobalHeader title="Editar Perfil" showBackButton />} paddingHorizontal={16} paddingBottom={insets.bottom + 100}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* 1. SECCIÓN DE IDENTIDAD & AVATAR ESTILO FRONTEND */}
          <View style={styles.identitySection}>
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.9} style={styles.avatarTouch}>
              <LinearGradient
                colors={roleConfig.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradientRing}
              >
                <View style={[styles.avatarInnerPadding, { backgroundColor: isDark ? '#121214' : '#ffffff' }]}>
                  <View style={[styles.avatarImageWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                    {displayImageUri ? (
                      <Image source={{ uri: displayImageUri }} style={styles.avatarImage} />
                    ) : (
                      <User size={46} color={colors.textSecondary} strokeWidth={1.8} style={{ opacity: 0.6 }} />
                    )}
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.7} style={styles.editPhotoBtn}>
              <Text style={[styles.editPhotoText, { color: colors.tint }]}>Editar foto</Text>
            </TouchableOpacity>

            <View style={styles.nameRow}>
              <Text style={[styles.displayName, { color: colors.text }]} numberOfLines={1}>
                {username || userProfile?.username || 'Usuario'}
              </Text>
              <View style={[styles.roleBadge, { backgroundColor: roleConfig.badgeBg, borderColor: roleConfig.badgeBorder }]}>
                <Text style={[styles.roleBadgeText, { color: roleConfig.badgeText }]}>
                  {roleConfig.label}
                </Text>
              </View>
            </View>

            <Text style={[styles.displayEmail, { color: colors.textSecondary }]}>
              {userProfile?.email || 'Sin correo asociado'}
            </Text>
          </View>

          {/* 2. GRUPO: DATOS BÁSICOS (Grouped Card iOS Style) */}
          <View style={styles.groupSection}>
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>DATOS BÁSICOS</Text>
            <View
              style={[
                styles.groupedCard,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <GlassView glassEffectStyle="regular" colorScheme={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

              {/* Fila: Nombre de Usuario */}
              <View style={styles.rowItem}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconSquircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                    <UserCircle size={18} color={colors.text} strokeWidth={2} />
                  </View>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>Usuario</Text>
                </View>
                <TextInput
                  style={[styles.rowInput, { color: colors.textSecondary }]}
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="Tu usuario"
                  placeholderTextColor={colors.textSecondary}
                  textAlign="right"
                  autoCapitalize="none"
                />
              </View>

              <View style={[styles.rowDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

              {/* Fila: Correo Electrónico (Solo lectura como en frontend) */}
              <View style={styles.rowItem}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconSquircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                    <AtSign size={18} color={colors.text} strokeWidth={2} />
                  </View>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>Email</Text>
                </View>
                <Text style={[styles.rowStaticValue, { color: colors.textSecondary }]} numberOfLines={1}>
                  {userProfile?.email || '-'}
                </Text>
              </View>
            </View>
          </View>

          {/* 3. GRUPO: SEGURIDAD (Cambiar contraseña modal) */}
          <View style={styles.groupSection}>
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>SEGURIDAD</Text>
            <View
              style={[
                styles.groupedCard,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <GlassView glassEffectStyle="regular" colorScheme={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

              <TouchableOpacity
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  setShowPasswordModal(true);
                }}
                activeOpacity={0.7}
                style={styles.rowItemTouchable}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconSquircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                    <Key size={18} color={colors.text} strokeWidth={2} />
                  </View>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>Cambiar contraseña</Text>
                </View>
                <ChevronRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* BOTÓN GUARDAR CAMBIOS (Visible solo si hay modificaciones, estilo frontend) */}
          {isDirty && (
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.85}
              style={[
                styles.saveChangesBtn,
                {
                  backgroundColor: colors.tint,
                  shadowColor: colors.tint,
                },
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color={btnTextColor} />
              ) : (
                <Text style={[styles.saveChangesText, { color: btnTextColor }]}>Guardar Cambios</Text>
              )}
            </TouchableOpacity>
          )}

          {/* 4. GRUPO: PERFIL SOCIAL */}
          <View style={styles.groupSection}>
            <View
              style={[
                styles.groupedCard,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <GlassView glassEffectStyle="regular" colorScheme={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

              <TouchableOpacity
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  router.push('/(tabs)/social');
                }}
                activeOpacity={0.7}
                style={styles.rowItemTouchable}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconSquircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                    <LayoutTemplate size={18} color={colors.text} strokeWidth={2} />
                  </View>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>Ver mi perfil en comunidad</Text>
                </View>
                <ChevronRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 5. GRUPO: MIS INSIGNIAS (Grid 3 columnas como en frontend) */}
          <View style={styles.groupSection}>
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>MIS INSIGNIAS</Text>

            {unlockedBadges.length > 0 ? (
              <View style={styles.badgeGrid}>
                {unlockedBadges.map((badgeId: string) => {
                  const badge = BADGE_DETAILS[badgeId] || BADGE_DETAILS.default;
                  const IconComponent = badge.icon;
                  return (
                    <View
                      key={badgeId}
                      style={[
                        styles.badgeCard,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                        },
                      ]}
                    >
                      <GlassView glassEffectStyle="regular" colorScheme={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                      <View style={[styles.badgeIconSquircle, { backgroundColor: badge.bg }]}>
                        <IconComponent size={20} color={badge.color} strokeWidth={2} />
                      </View>
                      <Text style={[styles.badgeName, { color: colors.text }]} numberOfLines={2}>
                        {badge.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View
                style={[
                  styles.emptyBadgeCard,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
              >
                <GlassView glassEffectStyle="regular" colorScheme={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                <Trophy size={28} color={colors.textSecondary} style={{ marginBottom: 8, opacity: 0.6 }} />
                <Text style={[styles.emptyBadgeTitle, { color: colors.text }]}>Aún no tienes insignias</Text>
                <Text style={[styles.emptyBadgeSub, { color: colors.textSecondary }]}>
                  Entrena y completa retos para desbloquear recompensas exclusivas.
                </Text>
              </View>
            )}
          </View>

          {/* 6. GRUPO: ZONA DE PELIGRO (Lista iOS en rojo como en frontend) */}
          <View style={styles.groupSection}>
            <Text style={[styles.sectionHeader, { color: '#ef4444' }]}>ZONA DE PELIGRO</Text>
            <View
              style={[
                styles.groupedCard,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.04)' : 'rgba(255, 255, 255, 0.8)',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.2)',
                },
              ]}
            >
              <GlassView glassEffectStyle="regular" colorScheme={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

              {/* Borrar historial */}
              <TouchableOpacity onPress={handleDeleteData} activeOpacity={0.7} style={styles.rowItemTouchable}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconSquircle, { backgroundColor: 'rgba(249, 115, 22, 0.12)' }]}>
                    <Trash2 size={18} color="#f97316" strokeWidth={2} />
                  </View>
                  <Text style={[styles.rowLabel, { color: '#f97316' }]}>Borrar mi historial de datos</Text>
                </View>
                <ChevronRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={[styles.rowDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

              {/* Borrar cuenta */}
              <TouchableOpacity onPress={handleDeleteAccount} activeOpacity={0.7} style={styles.rowItemTouchable}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconSquircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                    <AlertTriangle size={18} color="#ef4444" strokeWidth={2} />
                  </View>
                  <Text style={[styles.rowLabel, { color: '#ef4444' }]}>Borrar cuenta definitivamente</Text>
                </View>
                <ChevronRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* --- MODAL CAMBIAR CONTRASEÑA ESTILO FRONTEND --- */}
      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        hasPassword={Boolean((userProfile as any)?.hasPassword ?? true)}
      />
    </AnimatedScreen>
  );
}

// --- SUB-COMPONENTE: MODAL CAMBIAR CONTRASEÑA ---
interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  hasPassword: boolean;
}

function ChangePasswordModal({ visible, onClose, hasPassword }: ChangePasswordModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (visible) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMessage('');
      setIsLoading(false);
    }
  }, [visible]);

  // Validaciones del Frontend
  const reqs = useMemo(
    () => [
      { id: 'length', label: 'Al menos 12 caracteres', valid: newPassword.length >= 12 },
      { id: 'upper', label: 'Una mayúscula', valid: /[A-Z]/.test(newPassword) },
      { id: 'lower', label: 'Una minúscula', valid: /[a-z]/.test(newPassword) },
      { id: 'special', label: 'Un carácter especial (!@#$...)', valid: /[!@#$%^&*(),.?":{}|<>\-_+=\x5B\x5D\x2F\x5C'`]/.test(newPassword) },
      { id: 'digits', label: 'No más de 3 números seguidos', valid: !/\d{4,}/.test(newPassword) && newPassword.length > 0 },
    ],
    [newPassword]
  );

  const allReqsMet = reqs.every(r => r.valid);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = allReqsMet && passwordsMatch && (!hasPassword || currentPassword.length > 0);

  const handleSubmit = async () => {
    if (!canSubmit || isLoading) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const data = new FormData();
      if (hasPassword && currentPassword) {
        data.append('currentPassword', currentPassword);
      }
      data.append('newPassword', newPassword);

      await updateUserAccount(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Contraseña actualizada',
        'Tu contraseña ha sido actualizada con éxito.',
        [{ text: 'Aceptar', onPress: onClose }]
      );
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMessage(e.message || 'Error al actualizar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const btnTextColor = getContrastTextColor(colors.tint);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDark ? '#141418' : '#ffffff',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
              paddingBottom: Math.max(insets.bottom + 16, 24),
            },
          ]}
        >
          <GlassView glassEffectStyle="regular" colorScheme={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

          {/* Manija superior iOS */}
          <View style={[styles.sheetHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={[styles.modalIconWrap, { backgroundColor: colors.tint + '18' }]}>
              <Key size={26} color={colors.tint} strokeWidth={2} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {hasPassword ? 'Cambiar Contraseña' : 'Crear Contraseña'}
            </Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Protege el acceso a tu cuenta con una clave segura.
            </Text>
          </View>

          {errorMessage ? (
            <View style={styles.modalErrorBox}>
              <Text style={styles.modalErrorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Campo: Contraseña Actual */}
          {hasPassword ? (
            <View style={styles.inputBlock}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>1. Contraseña actual</Text>
              <View style={[styles.modalInputWrap, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                <TextInput
                  style={[styles.modalInput, { color: colors.text }]}
                  placeholder="Tu contraseña actual"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showCurrent}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  {showCurrent ? <EyeOff size={18} color={colors.textSecondary} /> : <Eye size={18} color={colors.textSecondary} />}
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* Campo: Nueva Contraseña */}
          <View style={styles.inputBlock}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>2. Elige una nueva contraseña</Text>
            <View style={[styles.modalInputWrap, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
              <TextInput
                style={[styles.modalInput, { color: colors.text }]}
                placeholder="Nueva contraseña"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                {showNew ? <EyeOff size={18} color={colors.textSecondary} /> : <Eye size={18} color={colors.textSecondary} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Requisitos estilo Frontend */}
          <View style={styles.reqsGrid}>
            {reqs.map(r => (
              <View key={r.id} style={styles.reqItem}>
                {r.valid ? (
                  <CheckCircle2 size={13} color="#22c55e" strokeWidth={2.5} />
                ) : (
                  <View style={[styles.reqCircleEmpty, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }]} />
                )}
                <Text style={[styles.reqText, { color: r.valid ? colors.text : colors.textSecondary }]}>
                  {r.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Campo: Repetir Contraseña */}
          <View style={styles.inputBlock}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>3. Repite la nueva contraseña</Text>
            <View style={[styles.modalInputWrap, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
              <TextInput
                style={[styles.modalInput, { color: colors.text }]}
                placeholder="Repite la nueva contraseña"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                {showConfirm ? <EyeOff size={18} color={colors.textSecondary} /> : <Eye size={18} color={colors.textSecondary} />}
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && (
              <View style={[styles.reqItem, { marginTop: 6 }]}>
                {passwordsMatch ? (
                  <CheckCircle2 size={13} color="#22c55e" strokeWidth={2.5} />
                ) : (
                  <View style={[styles.reqCircleEmpty, { borderColor: '#ef4444' }]} />
                )}
                <Text style={[styles.reqText, { color: passwordsMatch ? '#22c55e' : '#ef4444' }]}>
                  {passwordsMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                </Text>
              </View>
            )}
          </View>

          {/* Botones de acción */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit || isLoading}
              activeOpacity={0.85}
              style={[
                styles.modalSubmitBtn,
                {
                  backgroundColor: canSubmit ? colors.tint : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  opacity: canSubmit ? 1 : 0.6,
                },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color={btnTextColor} />
              ) : (
                <Text style={[styles.modalSubmitText, { color: canSubmit ? btnTextColor : colors.textSecondary }]}>
                  Guardar Contraseña
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={[styles.modalCancelBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
              <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
  },
  // --- IDENTIDAD ---
  identitySection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarTouch: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGradientRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarInnerPadding: {
    width: '100%',
    height: '100%',
    borderRadius: 56.5,
    padding: 2.5,
    overflow: 'hidden',
  },
  avatarImageWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 54,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  editPhotoBtn: {
    marginTop: 8,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  editPhotoText: {
    fontSize: 15,
    fontWeight: '700',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  roleBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  displayEmail: {
    fontSize: 14,
    fontWeight: '500',
  },

  // --- GRUPOS LISTA IOS ---
  groupSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  groupedCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 54,
  },
  rowItemTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 54,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconSquircle: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
    marginLeft: 16,
  },
  rowStaticValue: {
    fontSize: 15,
    fontWeight: '500',
    maxWidth: '55%',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 62,
  },

  // --- BOTÓN GUARDAR CAMBIOS ---
  saveChangesBtn: {
    height: 52,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  saveChangesText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // --- BADGES GRID (3 COLUMNAS) ---
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCard: {
    width: (SCREEN_WIDTH - 32 - 20) / 3,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badgeIconSquircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },
  emptyBadgeCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emptyBadgeTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyBadgeSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  // --- MODAL CONTRASEÑA ---
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalCard: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    padding: 24,
    overflow: 'hidden',
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 18,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 18,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    textAlign: 'center',
  },
  modalErrorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 14,
  },
  modalErrorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputBlock: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginLeft: 4,
  },
  modalInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
  },
  modalInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  reqsGrid: {
    gap: 4,
    marginVertical: 8,
    paddingHorizontal: 4,
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reqCircleEmpty: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  reqText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalActions: {
    gap: 10,
    marginTop: 16,
  },
  modalSubmitBtn: {
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalCancelBtn: {
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
