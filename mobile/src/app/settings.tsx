import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  ActivityIndicator,
  Alert,
  Share,
  useWindowDimensions,
  Platform,
  ScrollView,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import {
  Timer,
  WifiOff,
  User,
  BellRing,
  Shield,
  Users,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Volume2,
  Vibrate,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Mail,
  ShieldAlert,
  MailWarning,
  Smartphone,
  Cookie,
  Info,
  Scale,
  Eye,
  Trophy,
  Medal,
  MapPin,
  Globe,
  Lock,
  Check,
  Dumbbell,
  Flame,
  Trash2,
  Share2,
  Play,
} from 'lucide-react-native';
import { File as ExpoFile, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import GlobalHeader from '@/components/GlobalHeader';
import ThemeBackground from '@/components/ThemeBackground';
import { LiquidGlassSwitch } from '@/components/ui/LiquidGlassSwitch';
import { WorkoutDataTransferModal } from '@/components/modals/WorkoutDataTransferModal';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getThemeBaseBackground } from '@/constants/theme';
import { getContrastTextColor } from '@/utils/colorUtils';
import * as userService from '@/services/userService';
import * as sessionService from '@/services/sessionService';
import * as notificationService from '@/services/notificationService';
import { logoutUser, disable2FA } from '@/services/authService';
import { getExerciseList } from '@/services/exerciseService';
import {
  SETTINGS_SECTIONS,
  SettingsSection,
  PUSH_OPTIONS,
  PUSH_CONSENT_VERSION,
  EMAIL_CONSENT_VERSION,
  EMAIL_CONSENT_TEXT,
} from '@/config/settingsSections';

function GlassSurface({
  radius = 24,
  isDark,
  borderColor,
  style,
  children,
}: {
  radius?: number;
  isDark: boolean;
  borderColor: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const innerRadius = Math.max(0, radius - 1);
  return (
    <View style={[{ borderRadius: radius, borderWidth: 1, borderColor, overflow: 'hidden' }, style]}>
      <GlassView
        glassEffectStyle="regular"
        colorScheme={isDark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, { borderRadius: innerRadius }]}
      />
      {children}
    </View>
  );
}

// Icon mapper helper
function renderSectionIcon(name: string, size = 20, color = '#ffffff') {
  switch (name) {
    case 'Timer':
      return <Timer size={size} color={color} strokeWidth={2.4} />;
    case 'WifiOff':
      return <WifiOff size={size} color={color} strokeWidth={2.4} />;
    case 'User':
      return <User size={size} color={color} strokeWidth={2.4} />;
    case 'BellRing':
      return <BellRing size={size} color={color} strokeWidth={2.4} />;
    case 'Shield':
      return <Shield size={size} color={color} strokeWidth={2.4} />;
    case 'Users':
      return <Users size={size} color={color} strokeWidth={2.4} />;
    case 'LogOut':
      return <LogOut size={size} color={color} strokeWidth={2.4} />;
    default:
      return <Info size={size} color={color} strokeWidth={2.4} />;
  }
}

export default function SettingsScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const isMobile = windowWidth < 600;

  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const userProfile = useAppStore(state => state.userProfile);
  const setUserProfile = useAppStore(state => state.setUserProfile);
  const handleLogout = useAppStore(state => state.handleLogout);

  const hapticsEnabled = useAppStore(state => state.hapticsEnabled);
  const setHapticsEnabled = useAppStore(state => state.setHapticsEnabled);
  const restSoundEnabled = useAppStore(state => state.restSoundEnabled);
  const setRestSoundEnabled = useAppStore(state => state.setRestSoundEnabled);

  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const glassBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
  const subtleItemBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
  const activeTintContrast = getContrastTextColor(colors.tint);

  // activeTab es null al inicio para mostrar la lista vertical exactamente como pide el usuario
  const [activeTab, setActiveTab] = useState<SettingsSection['id'] | null>(null);

  // Modales
  const [showDataTransferModal, setShowDataTransferModal] = useState(false);
  const [dataTransferTab, setDataTransferTab] = useState<'import' | 'export'>('import');

  // Estados de preferencias sociales y muro
  const [workoutVisibility, setWorkoutVisibility] = useState<'public' | 'friends' | 'private'>('friends');
  const [notifyFriendsOnWorkout, setNotifyFriendsOnWorkout] = useState(true);
  const [defaultFeedScope, setDefaultFeedScope] = useState<'global' | 'gym' | 'friends'>('global');

  // Estados de push
  const [pushEnabled, setPushEnabled] = useState(true);
  const [pushPreferences, setPushPreferences] = useState<Record<string, boolean>>({
    training: true,
    coaching: true,
    news: false,
  });
  const [updatingPushPurpose, setUpdatingPushPurpose] = useState<string | null>(null);

  // Estados de privacidad y email
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [isUpdatingEmailPref, setIsUpdatingEmailPref] = useState(false);

  // Sesiones activas
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<number | string | null>(null);

  // Modo offline stats
  const [offlineDownloaded, setOfflineDownloaded] = useState(false);
  const [exerciseCount, setExerciseCount] = useState(160);
  const [isDownloadingOffline, setIsDownloadingOffline] = useState(false);
  const [offlineProgress, setOfflineProgress] = useState(0);

  // Cargar estado inicial almacenado
  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const savedVis = localStorage.getItem('globalWorkoutVisibility');
        if (savedVis === 'public' || savedVis === 'friends' || savedVis === 'private') {
          setWorkoutVisibility(savedVis);
        }
        const savedNotify = localStorage.getItem('globalNotifyFriends');
        if (savedNotify !== null) {
          setNotifyFriendsOnWorkout(savedNotify !== 'false');
        }
        const savedScope = localStorage.getItem('pfg_social_feed_scope');
        if (savedScope === 'global' || savedScope === 'gym' || savedScope === 'friends') {
          setDefaultFeedScope(savedScope);
        }
        const savedOffline = localStorage.getItem('pfg_offline_exercises_ready');
        if (savedOffline === 'true') {
          setOfflineDownloaded(true);
        }
        const savedCount = localStorage.getItem('pfg_offline_exercises_count');
        if (savedCount) {
          setExerciseCount(parseInt(savedCount, 10) || 160);
        }
      }
    } catch {}
  }, []);

  // Cargar preferencias push al entrar en la pestaña notificaciones
  useEffect(() => {
    if (activeTab === 'notifications' && userProfile?.id) {
      notificationService
        .getPushPreferences()
        .then(prefs => {
          if (prefs && typeof prefs === 'object') {
            setPushPreferences(prev => ({ ...prev, ...prefs }));
          }
        })
        .catch(() => {});
    }
  }, [activeTab, userProfile?.id]);

  // Cargar sesiones al entrar en la pestaña sesión
  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const data = await sessionService.getSessions();
      if (Array.isArray(data)) {
        setSessions(data);
      }
    } catch (err) {
      console.warn('Error cargando sesiones:', err);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'session') {
      loadSessions();
    }
  }, [activeTab, loadSessions]);

  // Handlers para la navegación
  const handleSelectSection = (sectionId: SettingsSection['id']) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setActiveTab(sectionId);
  };

  const handleBackToMenu = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setActiveTab(null);
  };

  // Guardar visibilidad en Muro
  const handleChangeWorkoutVisibility = (val: 'public' | 'friends' | 'private') => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setWorkoutVisibility(val);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('globalWorkoutVisibility', val);
      }
    } catch {}
    const labels = {
      public: 'Todo el mundo (Global, Mi Gimnasio y Amigos)',
      friends: 'Solo Amigos',
      private: 'Privado (No subir al muro)',
    };
    useAppStore.getState().showToast?.(`Visibilidad: ${labels[val]}`);
  };

  const handleToggleNotifyFriends = (next: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setNotifyFriendsOnWorkout(next);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('globalNotifyFriends', String(next));
      }
    } catch {}
    useAppStore.getState().showToast?.(
      next ? 'Aviso a amigos al terminar entreno activado' : 'Aviso a amigos desactivado'
    );
  };

  const handleChangeDefaultFeedScope = (scope: 'global' | 'gym' | 'friends') => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setDefaultFeedScope(scope);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pfg_social_feed_scope', scope);
      }
    } catch {}
    const names = {
      global: 'Global (Comunidad)',
      gym: 'Mi Gimnasio / Ciudad',
      friends: 'Amigos',
    };
    useAppStore.getState().showToast?.(`Pestaña inicial: ${names[scope]}`);
  };

  // Toggle de preferencias de perfil / privacidad en el servidor
  const handleToggleProfileField = async (
    field: string,
    label: string,
    defaultValue = false,
    consentVersion?: string
  ) => {
    if (isUpdatingPrivacy) return;
    setIsUpdatingPrivacy(true);
    const currentVal = userProfile?.[field] !== undefined ? Boolean(userProfile[field]) : defaultValue;
    const nextVal = !currentVal;

    setUserProfile({ ...userProfile, [field]: nextVal });

    try {
      const updatePayload: Record<string, any> = { [field]: nextVal };
      if (nextVal && consentVersion) {
        updatePayload.emailConsentVersion = consentVersion;
      }
      await userService.updateUserProfile(updatePayload);
      useAppStore.getState().showToast?.(`${label}: ${nextVal ? 'activado' : 'desactivado'}`);
    } catch (err) {
      setUserProfile({ ...userProfile, [field]: currentVal });
      Alert.alert('Error', `No se pudo actualizar ${label.toLowerCase()}.`);
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  // Toggle de alertas de inicio de sesión por correo
  const handleToggleLoginEmail = async () => {
    if (!userProfile?.two_factor_enabled) {
      Alert.alert(
        'Requiere 2FA',
        'Para activar alertas de inicio de sesión por correo debes tener habilitada la verificación en dos pasos (2FA).'
      );
      return;
    }
    setIsUpdatingEmailPref(true);
    const nextVal = !userProfile.login_email_notifications;
    setUserProfile({ ...userProfile, login_email_notifications: nextVal });

    try {
      await userService.updateUserProfile({ login_email_notifications: nextVal });
      useAppStore.getState().showToast?.(
        nextVal ? 'Alertas de login por email activadas' : 'Alertas de login desactivadas'
      );
    } catch {
      setUserProfile({ ...userProfile, login_email_notifications: !nextVal });
      Alert.alert('Error', 'No se pudo actualizar la preferencia de email.');
    } finally {
      setIsUpdatingEmailPref(false);
    }
  };

  // Toggle preferencias push
  const handleTogglePushPurpose = async (purpose: string) => {
    if (updatingPushPurpose) return;
    setUpdatingPushPurpose(purpose);
    const current = pushPreferences[purpose] === true;
    const nextVal = !current;
    setPushPreferences(prev => ({ ...prev, [purpose]: nextVal }));

    try {
      await notificationService.updatePushPreferences(purpose, nextVal, PUSH_CONSENT_VERSION);
      useAppStore.getState().showToast?.(`Preferencia push ${nextVal ? 'activada' : 'desactivada'}`);
    } catch {
      setPushPreferences(prev => ({ ...prev, [purpose]: current }));
      Alert.alert('Error', 'No se pudo guardar la preferencia push.');
    } finally {
      setUpdatingPushPurpose(null);
    }
  };

  // Exportar datos JSON / CSV
  const handleExportData = async (format: 'json' | 'csv') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      useAppStore.getState().showToast?.(`Generando archivo ${format.toUpperCase()}...`);
      const blob = await userService.exportMyData(format);
      const textData = await blob.text();
      const filename = `profitnessglass_datos_${new Date().toISOString().slice(0, 10)}.${format}`;
      const exportFile = new ExpoFile(Paths.cache, filename);
      await exportFile.write(textData);

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(exportFile.uri, {
          mimeType: format === 'json' ? 'application/json' : 'text/csv',
          dialogTitle: `Exportar datos completos (${format.toUpperCase()})`,
        });
      } else {
        await Share.share({
          title: `Copia de Seguridad Pro Fitness Glass (${format.toUpperCase()})`,
          message: textData,
        });
      }
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    } catch (err) {
      console.warn('Error exportando datos:', err);
      Alert.alert('Exportar Datos', 'No se pudo completar la exportación de datos.');
    }
  };

  // Modo offline: descarga real de ejercicios y guardado local
  const handleStartOfflineDownload = async () => {
    if (isDownloadingOffline) return;
    setIsDownloadingOffline(true);
    setOfflineProgress(15);
    try {
      useAppStore.getState().showToast?.('Descargando catálogo completo de ejercicios...');
      const data = await getExerciseList();
      const exercises = Array.isArray(data) ? data : [];
      setOfflineProgress(70);

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pfg_offline_exercises_cache', JSON.stringify(exercises));
        localStorage.setItem('pfg_offline_exercises_count', String(exercises.length));
        localStorage.setItem('pfg_offline_exercises_ready', 'true');
        localStorage.setItem('pfg_offline_exercises_date', new Date().toISOString());
      }
      setOfflineProgress(100);
      setOfflineDownloaded(true);
      setExerciseCount(exercises.length);
      useAppStore.getState().showToast?.(`¡Biblioteca offline lista: ${exercises.length} ejercicios guardados!`);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    } catch (err) {
      console.warn('Error descargando biblioteca offline:', err);
      Alert.alert('Descarga Offline', 'No se pudieron descargar los ejercicios. Comprueba tu conexión e inténtalo de nuevo.');
    } finally {
      setIsDownloadingOffline(false);
    }
  };

  const handleDeleteOfflineCache = () => {
    Alert.alert(
      'Liberar espacio offline',
      '¿Seguro que deseas eliminar todos los ejercicios guardados en la memoria local?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar y liberar espacio',
          style: 'destructive',
          onPress: () => {
            try {
              if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('pfg_offline_exercises_cache');
                localStorage.removeItem('pfg_offline_exercises_count');
                localStorage.removeItem('pfg_offline_exercises_ready');
                localStorage.removeItem('pfg_offline_exercises_date');
              }
            } catch {}
            setOfflineDownloaded(false);
            useAppStore.getState().showToast?.('Espacio offline liberado correctamente.');
          },
        },
      ]
    );
  };

  // Gestión de 2FA
  const handleManage2FA = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (userProfile?.two_factor_enabled) {
      Alert.alert(
        'Seguridad 2FA Activa',
        'Tu cuenta está protegida con verificación en dos pasos mediante códigos de seguridad.\n\n¿Deseas desactivar la verificación en dos pasos?',
        [
          { text: 'Mantener activo', style: 'cancel' },
          {
            text: 'Desactivar 2FA',
            style: 'destructive',
            onPress: async () => {
              try {
                await disable2FA();
                setUserProfile({ ...userProfile, two_factor_enabled: false });
                useAppStore.getState().showToast?.('2FA desactivado correctamente');
              } catch {
                Alert.alert('Error', 'No se pudo desactivar el 2FA. Inténtalo de nuevo.');
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Verificación en 2 pasos (2FA)',
        'La verificación en dos pasos añade una capa extra de protección a tu cuenta solicitando un código temporal al iniciar sesión desde dispositivos nuevos.\n\nPuedes activarla vinculando tu cuenta de correo o una aplicación autenticadora (Google Authenticator, Authy, etc.).',
        [
          { text: 'Entendido', style: 'default' },
        ]
      );
    }
  };

  // Sesiones: revocar
  const handleRevokeSession = (sessionId: number | string, isCurrent: boolean) => {
    if (isCurrent) {
      Alert.alert('Sesión Actual', 'Esta es tu sesión activa en este dispositivo móvil.');
      return;
    }
    Alert.alert('Cerrar sesión', '¿Deseas revocar el acceso a este dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          setRevokingSessionId(sessionId);
          try {
            await sessionService.revokeSession(sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            useAppStore.getState().showToast?.('Sesión cerrada con éxito.');
          } catch {
            Alert.alert('Error', 'No se pudo cerrar la sesión.');
          } finally {
            setRevokingSessionId(null);
          }
        },
      },
    ]);
  };

  const handleRevokeAllOtherSessions = () => {
    Alert.alert(
      'Cerrar todas las demás sesiones',
      '¿Deseas desconectar tu cuenta de todos los demás navegadores y dispositivos excepto este?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar todas',
          style: 'destructive',
          onPress: async () => {
            try {
              await sessionService.revokeAllOtherSessions();
              await loadSessions();
              useAppStore.getState().showToast?.('Se han cerrado todas las otras sesiones.');
            } catch {
              Alert.alert('Error', 'No se pudieron revocar las otras sesiones.');
            }
          },
        },
      ]
    );
  };

  // Logout con confirmación nativa
  const handleConfirmLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de tu cuenta en este dispositivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch {}
            try {
              await logoutUser();
            } catch {}
            handleLogout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  // Título para el header según el estado
  const currentSection = SETTINGS_SECTIONS.find(s => s.id === activeTab);
  const headerTitle = activeTab && currentSection ? currentSection.label : 'Ajustes';

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background === 'transparent' ? getThemeBaseBackground(theme) : colors.background,
      }}
    >
      <ThemeBackground />

      {/* Header fijo superior */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }} pointerEvents="box-none">
        <GlobalHeader
          title={headerTitle}
          scrollY={scrollY}
          showBackButton={true}
          onBackPress={activeTab ? handleBackToMenu : undefined}
        />
      </View>

      <Animated.ScrollView
        contentContainerStyle={{
          paddingHorizontal: isMobile ? 14 : Math.max(16, (windowWidth - 640) / 2),
          paddingTop: insets.top + 52,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      >
        {/* ========================================================= */}
        {/* CASO 1: LISTA VERTICAL INICIAL DE SECCIONES (activeTab == null) */}
        {/* ========================================================= */}
        {activeTab === null && (
          <View style={styles.verticalListContainer}>
            <GlassSurface radius={26} isDark={isDark} borderColor={glassBorder} style={styles.menuCard}>
              <View style={styles.menuList}>
                {SETTINGS_SECTIONS.map((section, idx) => {
                  const isLast = idx === SETTINGS_SECTIONS.length - 1;
                  const isDanger = Boolean(section.danger);
                  const iconBg = isDanger ? 'rgba(239, 68, 68, 0.12)' : colors.tint + '1A';
                  const iconColor = isDanger ? '#ef4444' : colors.tint;

                  return (
                    <TouchableOpacity
                      key={section.id}
                      onPress={() => handleSelectSection(section.id)}
                      activeOpacity={0.7}
                      style={[
                        styles.menuRow,
                        !isLast && {
                          borderBottomWidth: 1,
                          borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        },
                      ]}
                    >
                      <View style={[styles.menuIconBox, { backgroundColor: iconBg }]}>
                        {renderSectionIcon(section.iconName, 18, iconColor)}
                      </View>

                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text
                          style={[
                            styles.menuRowTitle,
                            { color: isDanger ? '#ef4444' : colors.text },
                          ]}
                        >
                          {section.label}
                        </Text>
                        <Text style={[styles.menuRowSubtitle, { color: colors.textSecondary }]}>
                          {section.subtitle}
                        </Text>
                      </View>

                      <ChevronRight
                        size={18}
                        color={isDanger ? '#ef4444' : colors.textSecondary}
                        style={{ opacity: 0.6 }}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </GlassSurface>

            {/* Versión de la App y Atajos */}
            <View style={styles.footerInfoBox}>
              <Text style={[styles.footerInfoText, { color: colors.textSecondary }]}>
                Pro Fitness Glass • v7.16.27
              </Text>
              <Text style={[styles.footerSubText, { color: colors.textSecondary }]}>
                Diseño Liquid Glass y Alto Rendimiento
              </Text>
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* CASO 2: CONTENIDO DE CADA SECCIÓN (activeTab !== null)    */}
        {/* ========================================================= */}
        {activeTab !== null && (
          <View style={styles.sectionDetailContainer}>
            {/* Botón rápido Volver al Menú */}
            <TouchableOpacity
              onPress={handleBackToMenu}
              activeOpacity={0.7}
              style={[
                styles.backBreadcrumb,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: glassBorder,
                },
              ]}
            >
              <ChevronLeft size={16} color={colors.textSecondary} />
              <Text style={[styles.backBreadcrumbText, { color: colors.textSecondary }]}>
                Volver a Ajustes
              </Text>
            </TouchableOpacity>

            {/* ================= 1. ENTRENAMIENTO ================= */}
            {activeTab === 'workout' && (
              <View style={styles.cardsStack}>
                <GlassSurface radius={26} isDark={isDark} borderColor={glassBorder} style={styles.cardPadding}>
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardHeaderIcon, { backgroundColor: colors.tint + '1E' }]}>
                      <Timer size={22} color={colors.tint} strokeWidth={2.4} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>
                        Temporizador de descanso
                      </Text>
                      <Text style={[styles.cardHeaderSubtitle, { color: colors.textSecondary }]}>
                        Configura los avisos automáticos entre series
                      </Text>
                    </View>
                  </View>

                  <View style={styles.switchItemsList}>
                    {/* Sonido de descanso */}
                    <View style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}>
                      <View style={[styles.rowIconCircle, { backgroundColor: restSoundEnabled ? colors.tint + '1A' : 'rgba(255, 255, 255, 0.05)' }]}>
                        <Volume2 size={20} color={restSoundEnabled ? colors.tint : colors.textSecondary} />
                      </View>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>
                          Sonido de Fin de Descanso
                        </Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          Aviso sonoro al terminar la cuenta atrás entre series
                        </Text>
                      </View>
                      <LiquidGlassSwitch
                        value={restSoundEnabled}
                        onValueChange={val => {
                          setRestSoundEnabled(val);
                          useAppStore.getState().showToast?.(val ? 'Sonido de descanso activado' : 'Sonido desactivado');
                        }}
                        tintColor={colors.tint}
                        isDark={isDark}
                      />
                    </View>

                    {/* Vibración háptica */}
                    <View style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}>
                      <View style={[styles.rowIconCircle, { backgroundColor: hapticsEnabled ? colors.tint + '1A' : 'rgba(255, 255, 255, 0.05)' }]}>
                        <Vibrate size={20} color={hapticsEnabled ? colors.tint : colors.textSecondary} />
                      </View>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>
                          Vibración Háptica
                        </Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          Vibración en el bolsillo al terminar el descanso y feedback táctil
                        </Text>
                      </View>
                      <LiquidGlassSwitch
                        value={hapticsEnabled}
                        onValueChange={val => {
                          setHapticsEnabled(val);
                          useAppStore.getState().showToast?.(val ? 'Vibración háptica activada' : 'Vibración desactivada');
                        }}
                        tintColor={colors.tint}
                        isDark={isDark}
                      />
                    </View>
                  </View>
                </GlassSurface>

                {/* Copias de seguridad y migración */}
                <GlassSurface radius={26} isDark={isDark} borderColor={glassBorder} style={styles.cardPadding}>
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardHeaderIcon, { backgroundColor: colors.tint + '1E' }]}>
                      <UploadCloud size={22} color={colors.tint} strokeWidth={2.4} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>
                        Migración y Copias de Seguridad
                      </Text>
                      <Text style={[styles.cardHeaderSubtitle, { color: colors.textSecondary }]}>
                        Transfiere tu historial desde otras plataformas
                      </Text>
                    </View>
                  </View>

                  <View style={styles.switchItemsList}>
                    <TouchableOpacity
                      onPress={() => setActiveTab('offline')}
                      activeOpacity={0.7}
                      style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}
                    >
                      <View style={[styles.rowIconCircle, { backgroundColor: colors.tint + '15' }]}>
                        <WifiOff size={20} color={colors.tint} />
                      </View>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>
                          Modo sin conexión y Búnker
                        </Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          {offlineDownloaded ? 'Biblioteca offline guardada (~45 MB)' : 'Descarga los ejercicios para entrenar sin cobertura'}
                        </Text>
                      </View>
                      <ChevronRight size={18} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setDataTransferTab('import');
                        setShowDataTransferModal(true);
                      }}
                      activeOpacity={0.7}
                      style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}
                    >
                      <View style={[styles.rowIconCircle, { backgroundColor: colors.tint + '15' }]}>
                        <UploadCloud size={20} color={colors.tint} />
                      </View>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>
                          Importar desde Hevy o Strong (CSV)
                        </Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          Migra todos tus entrenamientos históricos sin perder tus marcas
                        </Text>
                      </View>
                      <ChevronRight size={18} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setDataTransferTab('export');
                        setShowDataTransferModal(true);
                      }}
                      activeOpacity={0.7}
                      style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}
                    >
                      <View style={[styles.rowIconCircle, { backgroundColor: colors.tint + '15' }]}>
                        <Download size={20} color={colors.tint} />
                      </View>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>
                          Exportar Historial Completo (Excel / CSV)
                        </Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          Descarga tus sesiones, series y notas en un archivo CSV
                        </Text>
                      </View>
                      <ChevronRight size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </GlassSurface>
              </View>
            )}

            {/* ================= 2. MODO SIN CONEXIÓN ================= */}
            {activeTab === 'offline' && (
              <View style={styles.cardsStack}>
                <GlassSurface radius={26} isDark={isDark} borderColor={glassBorder} style={styles.cardPadding}>
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardHeaderIcon, { backgroundColor: colors.tint + '1E' }]}>
                      <WifiOff size={22} color={colors.tint} strokeWidth={2.4} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>
                        Descargas para entrenar
                      </Text>
                      <Text style={[styles.cardHeaderSubtitle, { color: colors.textSecondary }]}>
                        Biblioteca completa de ejercicios y técnica sin gastar datos
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.sectionParagraph, { color: colors.textSecondary }]}>
                    Descarga los ejercicios, GIFs y técnicas en la memoria local de tu teléfono.
                    Ideal para sótanos de gimnasio o entrenar sin cobertura.
                  </Text>

                  {/* Estado de almacenamiento */}
                  <View
                    style={[
                      styles.storageStatusBox,
                      {
                        backgroundColor: subtleItemBg,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                  >
                    <View style={styles.storageStatusHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View
                          style={[
                            styles.statusDotBox,
                            {
                              backgroundColor: offlineDownloaded
                                ? 'rgba(16, 185, 129, 0.2)'
                                : isDownloadingOffline
                                ? colors.tint + '20'
                                : 'rgba(245, 158, 11, 0.2)',
                            },
                          ]}
                        >
                          {offlineDownloaded ? (
                            <CheckCircle2 size={20} color="#10b981" />
                          ) : isDownloadingOffline ? (
                            <RefreshCw size={20} color={colors.tint} />
                          ) : (
                            <AlertCircle size={20} color="#f59e0b" />
                          )}
                        </View>
                        <View>
                          <Text style={[styles.storageStatusTitle, { color: colors.text }]}>
                            {isDownloadingOffline
                              ? `Descargando... ${offlineProgress}%`
                              : offlineDownloaded
                              ? 'Biblioteca offline lista'
                              : 'Sin descargar en este dispositivo'}
                          </Text>
                          <Text style={[styles.storageStatusSub, { color: colors.textSecondary }]}>
                            Memoria interna local del dispositivo
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.storagePill,
                          {
                            backgroundColor: offlineDownloaded
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.storagePillText,
                            { color: offlineDownloaded ? '#10b981' : '#f59e0b' },
                          ]}
                        >
                          {offlineDownloaded ? 'Disponible' : 'Pendiente'}
                        </Text>
                      </View>
                    </View>

                    {/* Métricas */}
                    <View style={styles.metricsGrid}>
                      <View style={[styles.metricItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' }]}>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>EJERCICIOS</Text>
                        <Text style={[styles.metricValue, { color: colors.text }]}>
                          {offlineDownloaded ? exerciseCount : `${exerciseCount}+`}
                        </Text>
                        <Text style={[styles.metricSub, { color: colors.textSecondary }]}>
                          {offlineDownloaded ? 'Guardados' : 'Disponibles'}
                        </Text>
                      </View>
                      <View style={[styles.metricItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' }]}>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>MULTIMEDIA</Text>
                        <Text style={[styles.metricValue, { color: colors.text }]}>GIFs / Vídeos</Text>
                        <Text style={[styles.metricSub, { color: colors.textSecondary }]}>Técnicas HD</Text>
                      </View>
                      <View style={[styles.metricItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' }]}>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>ESPACIO</Text>
                        <Text style={[styles.metricValue, { color: colors.text }]}>~45 MB</Text>
                        <Text style={[styles.metricSub, { color: colors.textSecondary }]}>Memoria local</Text>
                      </View>
                      <View style={[styles.metricItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' }]}>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>ESTADO</Text>
                        <Text style={[styles.metricValue, { color: offlineDownloaded ? '#10b981' : '#f59e0b' }]}>
                          {offlineDownloaded ? 'Activo' : 'Sin bajar'}
                        </Text>
                        <Text style={[styles.metricSub, { color: colors.textSecondary }]}>Almacén</Text>
                      </View>
                    </View>

                    {/* Acciones de descarga */}
                    <View style={styles.offlineActionsRow}>
                      {!offlineDownloaded && !isDownloadingOffline && (
                        <TouchableOpacity
                          onPress={handleStartOfflineDownload}
                          activeOpacity={0.8}
                          style={[styles.primaryActionBtn, { backgroundColor: colors.tint }]}
                        >
                          <Download size={18} color={activeTintContrast} style={{ marginRight: 6 }} />
                          <Text style={[styles.primaryActionBtnText, { color: activeTintContrast }]}>
                            Descargar biblioteca (~45 MB)
                          </Text>
                        </TouchableOpacity>
                      )}

                      {isDownloadingOffline && (
                        <View style={styles.downloadingProgressBarContainer}>
                          <View style={[styles.downloadingProgressBarTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]}>
                            <View style={[styles.downloadingProgressBarFill, { width: `${offlineProgress}%`, backgroundColor: colors.tint }]} />
                          </View>
                          <Text style={[styles.downloadingText, { color: colors.textSecondary }]}>
                            Guardando recursos en memoria... {offlineProgress}%
                          </Text>
                        </View>
                      )}

                      {offlineDownloaded && (
                        <TouchableOpacity
                          onPress={handleDeleteOfflineCache}
                          activeOpacity={0.8}
                          style={[styles.dangerActionBtn, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                        >
                          <Trash2 size={16} color="#ef4444" style={{ marginRight: 6 }} />
                          <Text style={styles.dangerActionBtnText}>Liberar espacio / Borrar caché</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </GlassSurface>
              </View>
            )}

            {/* ================= 3. PERFIL ================= */}
            {activeTab === 'profile' && (
              <View style={styles.cardsStack}>
                <GlassSurface radius={26} isDark={isDark} borderColor={glassBorder} style={styles.cardPadding}>
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardHeaderIcon, { backgroundColor: colors.tint + '1E' }]}>
                      <User size={22} color={colors.tint} strokeWidth={2.4} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>
                        Perfil de Atleta
                      </Text>
                      <Text style={[styles.cardHeaderSubtitle, { color: colors.textSecondary }]}>
                        Datos biométricos, objetivos y marcas personales
                      </Text>
                    </View>
                  </View>

                  {/* Resumen del perfil del atleta */}
                  <View
                    style={[
                      styles.storageStatusBox,
                      {
                        backgroundColor: subtleItemBg,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        marginBottom: 12,
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={[styles.rowIconCircle, { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.tint + '22' }]}>
                        <User size={24} color={colors.tint} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text, fontSize: 16 }]}>
                          {userProfile?.username || userProfile?.name || 'Atleta Pro'}
                        </Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          {userProfile?.email || 'Cuenta vinculada'}
                        </Text>
                      </View>
                      <View style={[styles.badgePill, { backgroundColor: colors.tint + '18' }]}>
                        <Text style={[styles.badgePillText, { color: colors.tint }]}>
                          {(userProfile?.role || 'user').toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.metricsGrid}>
                      <View style={[styles.metricItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' }]}>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>PESO</Text>
                        <Text style={[styles.metricValue, { color: colors.text }]}>
                          {userProfile?.weight ? `${userProfile.weight} kg` : '--'}
                        </Text>
                      </View>
                      <View style={[styles.metricItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' }]}>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>ALTURA</Text>
                        <Text style={[styles.metricValue, { color: colors.text }]}>
                          {userProfile?.height ? `${userProfile.height} cm` : '--'}
                        </Text>
                      </View>
                      <View style={[styles.metricItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' }]}>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>OBJETIVO</Text>
                        <Text style={[styles.metricValue, { color: colors.tint, fontSize: 11 }]} numberOfLines={1}>
                          {userProfile?.goal ? userProfile.goal.toUpperCase() : 'SALUD'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.switchItemsList}>
                    <TouchableOpacity
                      onPress={() => router.push('/profile')}
                      activeOpacity={0.7}
                      style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}
                    >
                      <View style={[styles.rowIconCircle, { backgroundColor: colors.tint + '15' }]}>
                        <User size={20} color={colors.tint} />
                      </View>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>
                          Editar Datos Físicos y Objetivos
                        </Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          Modificar peso, altura, calorías objetivo y nivel de entreno
                        </Text>
                      </View>
                      <ChevronRight size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </GlassSurface>
              </View>
            )}

            {/* ================= 4. NOTIFICACIONES ================= */}
            {activeTab === 'notifications' && (
              <View style={styles.cardsStack}>
                {/* Push */}
                <GlassSurface radius={26} isDark={isDark} borderColor={glassBorder} style={styles.cardPadding}>
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardHeaderIcon, { backgroundColor: colors.tint + '1E' }]}>
                      <BellRing size={22} color={colors.tint} strokeWidth={2.4} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>
                        Notificaciones Push
                      </Text>
                      <Text style={[styles.cardHeaderSubtitle, { color: colors.textSecondary }]}>
                        Avisos en tiempo real en tu dispositivo móvil
                      </Text>
                    </View>
                  </View>

                  <View style={styles.switchItemsList}>
                    <View style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}>
                      <View style={[styles.rowIconCircle, { backgroundColor: pushEnabled ? colors.tint + '1A' : 'rgba(255, 255, 255, 0.05)' }]}>
                        <BellRing size={20} color={pushEnabled ? colors.tint : colors.textSecondary} />
                      </View>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>
                          Activar en este dispositivo
                        </Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          Recibir avisos de actividad y avisos importantes
                        </Text>
                      </View>
                      <LiquidGlassSwitch
                        value={pushEnabled}
                        onValueChange={val => {
                          setPushEnabled(val);
                          useAppStore.getState().showToast?.(val ? 'Push activadas' : 'Push pausadas');
                        }}
                        tintColor={colors.tint}
                        isDark={isDark}
                      />
                    </View>

                    {PUSH_OPTIONS.map(opt => (
                      <View key={opt.purpose} style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}>
                        <View style={[styles.rowIconCircle, { backgroundColor: pushPreferences[opt.purpose] ? colors.tint + '1A' : 'rgba(255, 255, 255, 0.05)' }]}>
                          <Sparkles size={18} color={pushPreferences[opt.purpose] ? colors.tint : colors.textSecondary} />
                        </View>
                        <View style={{ flex: 1, marginRight: 12 }}>
                          <Text style={[styles.rowItemTitle, { color: colors.text }]}>
                            {opt.title}
                          </Text>
                          <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                            {opt.description}
                          </Text>
                        </View>
                        <LiquidGlassSwitch
                          value={Boolean(pushPreferences[opt.purpose])}
                          onValueChange={() => handleTogglePushPurpose(opt.purpose)}
                          tintColor={colors.tint}
                          isDark={isDark}
                          disabled={!pushEnabled || updatingPushPurpose === opt.purpose}
                        />
                      </View>
                    ))}
                  </View>
                </GlassSurface>

                {/* Email */}
                <GlassSurface radius={26} isDark={isDark} borderColor={glassBorder} style={styles.cardPadding}>
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardHeaderIcon, { backgroundColor: colors.tint + '1E' }]}>
                      <Mail size={22} color={colors.tint} strokeWidth={2.4} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>
                        Correo Electrónico
                      </Text>
                      <Text style={[styles.cardHeaderSubtitle, { color: colors.textSecondary }]}>
                        Avisos y recordatorios por email
                      </Text>
                    </View>
                  </View>

                  <View style={styles.switchItemsList}>
                    {/* Alertas de inicio de sesión */}
                    <View style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}>
                      <View style={[styles.rowIconCircle, { backgroundColor: userProfile?.two_factor_enabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                        {userProfile?.two_factor_enabled ? (
                          <ShieldAlert size={20} color="#10b981" />
                        ) : (
                          <MailWarning size={20} color="#ef4444" />
                        )}
                      </View>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>
                          Alertas de inicio de sesión
                        </Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          {userProfile?.two_factor_enabled ? 'Email al iniciar sesión' : 'Requiere 2FA'}
                        </Text>
                      </View>
                      <LiquidGlassSwitch
                        value={Boolean(userProfile?.login_email_notifications)}
                        onValueChange={handleToggleLoginEmail}
                        tintColor={colors.tint}
                        isDark={isDark}
                        disabled={!userProfile?.two_factor_enabled || isUpdatingEmailPref}
                      />
                    </View>

                    {/* Avisos de actividad */}
                    <View style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}>
                      <View style={[styles.rowIconCircle, { backgroundColor: colors.tint + '15' }]}>
                        <Mail size={20} color={colors.tint} />
                      </View>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>
                          Avisos de actividad
                        </Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          Avisos de nuevos mensajes y novedades de asesoría
                        </Text>
                      </View>
                      <LiquidGlassSwitch
                        value={userProfile?.email_activity_notifications !== false}
                        onValueChange={() =>
                          handleToggleProfileField(
                            'email_activity_notifications',
                            'Avisos de actividad por correo',
                            true
                          )
                        }
                        tintColor={colors.tint}
                        isDark={isDark}
                        disabled={isUpdatingPrivacy}
                      />
                    </View>

                    {/* Recordatorios de entrenamiento */}
                    <View style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}>
                      <View style={[styles.rowIconCircle, { backgroundColor: colors.tint + '15' }]}>
                        <Mail size={20} color={colors.tint} />
                      </View>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>
                          Recordatorios de entrenamiento
                        </Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          {EMAIL_CONSENT_TEXT.training}
                        </Text>
                      </View>
                      <LiquidGlassSwitch
                        value={Boolean(userProfile?.email_marketing_consent)}
                        onValueChange={() =>
                          handleToggleProfileField(
                            'email_marketing_consent',
                            'Recordatorios de entrenamiento',
                            false,
                            EMAIL_CONSENT_VERSION
                          )
                        }
                        tintColor={colors.tint}
                        isDark={isDark}
                        disabled={isUpdatingPrivacy}
                      />
                    </View>

                    {/* Recordatorios de asesoría */}
                    <View style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}>
                      <View style={[styles.rowIconCircle, { backgroundColor: colors.tint + '15' }]}>
                        <Mail size={20} color={colors.tint} />
                      </View>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>
                          Recordatorios de asesoría
                        </Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          {EMAIL_CONSENT_TEXT.coaching}
                        </Text>
                      </View>
                      <LiquidGlassSwitch
                        value={Boolean(userProfile?.email_coaching_consent)}
                        onValueChange={() =>
                          handleToggleProfileField(
                            'email_coaching_consent',
                            'Recordatorios de asesoría',
                            false,
                            EMAIL_CONSENT_VERSION
                          )
                        }
                        tintColor={colors.tint}
                        isDark={isDark}
                        disabled={isUpdatingPrivacy}
                      />
                    </View>
                  </View>
                </GlassSurface>
              </View>
            )}

            {/* ================= 5. SEGURIDAD ================= */}
            {activeTab === 'security' && (
              <View style={styles.cardsStack}>
                <GlassSurface radius={26} isDark={isDark} borderColor={glassBorder} style={styles.cardPadding}>
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardHeaderIcon, { backgroundColor: colors.tint + '1E' }]}>
                      <Shield size={22} color={colors.tint} strokeWidth={2.4} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>
                        Seguridad y Privacidad Legal
                      </Text>
                      <Text style={[styles.cardHeaderSubtitle, { color: colors.textSecondary }]}>
                        Protección de cuenta y documentos legales
                      </Text>
                    </View>
                  </View>

                  <View style={styles.switchItemsList}>
                    {/* 2FA */}
                    <TouchableOpacity
                      onPress={handleManage2FA}
                      activeOpacity={0.7}
                      style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}
                    >
                      <View style={[styles.rowIconCircle, { backgroundColor: colors.tint + '15' }]}>
                        <Smartphone size={20} color={colors.tint} />
                      </View>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>
                          Verificación en 2 pasos (2FA)
                        </Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          {userProfile?.two_factor_enabled
                            ? 'Protegido con aplicación autenticadora (Toca para gestionar)'
                            : 'Mayor seguridad para tu cuenta (Toca para info)'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.badgePill,
                          {
                            backgroundColor: userProfile?.two_factor_enabled
                              ? 'rgba(16, 185, 129, 0.2)'
                              : 'rgba(255, 255, 255, 0.1)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgePillText,
                            {
                              color: userProfile?.two_factor_enabled ? '#10b981' : colors.textSecondary,
                            },
                          ]}
                        >
                          {userProfile?.two_factor_enabled ? 'ACTIVADO' : 'DESACTIVADO'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Exportar datos */}
                    <View style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}>
                      <View style={[styles.rowIconCircle, { backgroundColor: colors.tint + '15' }]}>
                        <Download size={20} color={colors.tint} />
                      </View>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>
                          Exportar Datos y Entrenamientos
                        </Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          Copia de seguridad en formato JSON o CSV
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity
                          onPress={() => handleExportData('json')}
                          activeOpacity={0.8}
                          style={[styles.smallFormatBtn, { backgroundColor: colors.tint + '22' }]}
                        >
                          <Text style={[styles.smallFormatBtnText, { color: colors.tint }]}>JSON</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleExportData('csv')}
                          activeOpacity={0.8}
                          style={[styles.smallFormatBtn, { backgroundColor: colors.tint + '22' }]}
                        >
                          <Text style={[styles.smallFormatBtnText, { color: colors.tint }]}>CSV</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Cookies */}
                    <TouchableOpacity
                      onPress={() => router.push('/cookies')}
                      activeOpacity={0.7}
                      style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}
                    >
                      <View style={[styles.rowIconCircle, { backgroundColor: colors.tint + '15' }]}>
                        <Cookie size={20} color={colors.tint} />
                      </View>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>Cookies y Almacenamiento</Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          Gestionar consentimiento de cookies y datos locales
                        </Text>
                      </View>
                      <ChevronRight size={18} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Privacidad */}
                    <TouchableOpacity
                      onPress={() => router.push('/privacy')}
                      activeOpacity={0.7}
                      style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}
                    >
                      <View style={[styles.rowIconCircle, { backgroundColor: colors.tint + '15' }]}>
                        <Shield size={20} color={colors.tint} />
                      </View>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>Política de Privacidad</Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          Cómo tratamos y protegemos tus datos personales
                        </Text>
                      </View>
                      <ChevronRight size={18} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Términos */}
                    <TouchableOpacity
                      onPress={() => router.push('/terms')}
                      activeOpacity={0.7}
                      style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}
                    >
                      <View style={[styles.rowIconCircle, { backgroundColor: colors.tint + '15' }]}>
                        <Info size={20} color={colors.tint} />
                      </View>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>Términos y Condiciones</Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          Reglas de uso y servicio de la app
                        </Text>
                      </View>
                      <ChevronRight size={18} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Aviso Legal */}
                    <TouchableOpacity
                      onPress={() => router.push('/legal-notice')}
                      activeOpacity={0.7}
                      style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}
                    >
                      <View style={[styles.rowIconCircle, { backgroundColor: colors.tint + '15' }]}>
                        <Scale size={20} color={colors.tint} />
                      </View>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>Aviso Legal (LSSI-CE)</Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          Datos del prestador y titularidad de la plataforma
                        </Text>
                      </View>
                      <ChevronRight size={18} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Tutoriales y Guías */}
                    <TouchableOpacity
                      onPress={() => {
                        try {
                          if (typeof localStorage !== 'undefined') {
                            localStorage.setItem('open_tutorials_on_hub', 'true');
                          }
                        } catch {}
                        router.push('/(tabs)/hub');
                      }}
                      activeOpacity={0.7}
                      style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}
                    >
                      <View style={[styles.rowIconCircle, { backgroundColor: colors.tint + '15' }]}>
                        <Play size={20} color={colors.tint} />
                      </View>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>Tutoriales y Guías</Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          Guías visuales y ayuda interactiva en el Hub
                        </Text>
                      </View>
                      <ChevronRight size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </GlassSurface>
              </View>
            )}

            {/* ================= 6. PRIVACIDAD SOCIAL ================= */}
            {activeTab === 'privacy' && (
              <View style={styles.cardsStack}>
                {/* Visibilidad perfil */}
                <GlassSurface radius={26} isDark={isDark} borderColor={glassBorder} style={styles.cardPadding}>
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardHeaderIcon, { backgroundColor: colors.tint + '1E' }]}>
                      <Users size={22} color={colors.tint} strokeWidth={2.4} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>
                        Visibilidad de tu perfil
                      </Text>
                      <Text style={[styles.cardHeaderSubtitle, { color: colors.textSecondary }]}>
                        Controla qué información ven otros atletas
                      </Text>
                    </View>
                  </View>

                  <View style={styles.switchItemsList}>
                    <View style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}>
                      <View style={[styles.rowIconCircle, { backgroundColor: colors.tint + '15' }]}>
                        <Eye size={20} color={colors.tint} />
                      </View>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>Perfil Público</Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          Aparecer en el Muro Global, Mi Gimnasio, Ranking y búsquedas
                        </Text>
                      </View>
                      <LiquidGlassSwitch
                        value={Boolean(userProfile?.is_public_profile)}
                        onValueChange={() =>
                          handleToggleProfileField('is_public_profile', 'Perfil público')
                        }
                        tintColor={colors.tint}
                        isDark={isDark}
                        disabled={isUpdatingPrivacy}
                      />
                    </View>

                    <View style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}>
                      <View style={[styles.rowIconCircle, { backgroundColor: colors.tint + '15' }]}>
                        <Trophy size={20} color={colors.tint} />
                      </View>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>Mostrar Nivel y XP</Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          Visible en tu tarjeta de perfil y publicaciones
                        </Text>
                      </View>
                      <LiquidGlassSwitch
                        value={Boolean(userProfile?.show_level_xp)}
                        onValueChange={() =>
                          handleToggleProfileField('show_level_xp', 'Nivel y XP')
                        }
                        tintColor={colors.tint}
                        isDark={isDark}
                        disabled={isUpdatingPrivacy || !userProfile?.is_public_profile}
                      />
                    </View>

                    <View style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}>
                      <View style={[styles.rowIconCircle, { backgroundColor: colors.tint + '15' }]}>
                        <Medal size={20} color={colors.tint} />
                      </View>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>Mostrar Insignias</Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          Compartir tus logros y medallas desbloqueadas
                        </Text>
                      </View>
                      <LiquidGlassSwitch
                        value={Boolean(userProfile?.show_badges)}
                        onValueChange={() =>
                          handleToggleProfileField('show_badges', 'Insignias')
                        }
                        tintColor={colors.tint}
                        isDark={isDark}
                        disabled={isUpdatingPrivacy || !userProfile?.is_public_profile}
                      />
                    </View>

                    <View style={[styles.settingRowItem, { backgroundColor: subtleItemBg }]}>
                      <View style={[styles.rowIconCircle, { backgroundColor: colors.tint + '15' }]}>
                        <MapPin size={20} color={colors.tint} />
                      </View>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>
                          Aparecer en Mi Gimnasio y Ciudad
                        </Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          Mostrar tu gimnasio en el radar de compañeros de centro
                        </Text>
                      </View>
                      <LiquidGlassSwitch
                        value={userProfile?.show_gym !== false}
                        onValueChange={() =>
                          handleToggleProfileField('show_gym', 'Visibilidad en Mi Gimnasio', true)
                        }
                        tintColor={colors.tint}
                        isDark={isDark}
                        disabled={isUpdatingPrivacy || !userProfile?.is_public_profile}
                      />
                    </View>
                  </View>
                </GlassSurface>

                {/* Muro y visibilidad de entrenamientos */}
                <GlassSurface radius={26} isDark={isDark} borderColor={glassBorder} style={styles.cardPadding}>
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardHeaderIcon, { backgroundColor: colors.tint + '1E' }]}>
                      <Globe size={22} color={colors.tint} strokeWidth={2.4} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>
                        Muro de Comunidad
                      </Text>
                      <Text style={[styles.cardHeaderSubtitle, { color: colors.textSecondary }]}>
                        ¿Quién puede ver tus entrenamientos terminados?
                      </Text>
                    </View>
                  </View>

                  {/* Selector de visibilidad de entrenamientos */}
                  <View style={styles.scopeSelectorContainer}>
                    {[
                      {
                        key: 'public',
                        title: 'Todo el mundo',
                        sub: 'Aparece en Global, Mi Gimnasio y Amigos',
                        icon: Globe,
                      },
                      {
                        key: 'friends',
                        title: 'Solo Amigos',
                        sub: 'Solo visible en la pestaña Amigos (nunca en Global)',
                        icon: Users,
                      },
                      {
                        key: 'private',
                        title: 'No subir (Privado)',
                        sub: 'Se guarda en tu diario sin publicarse en ningún muro',
                        icon: Lock,
                      },
                    ].map(item => {
                      const isSelected = workoutVisibility === item.key;
                      const IconComp = item.icon;

                      return (
                        <TouchableOpacity
                          key={item.key}
                          onPress={() => handleChangeWorkoutVisibility(item.key as any)}
                          activeOpacity={0.8}
                          style={[
                            styles.scopeOptionCard,
                            {
                              backgroundColor: isSelected ? colors.tint + '1A' : subtleItemBg,
                              borderColor: isSelected ? colors.tint : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                            },
                          ]}
                        >
                          <View style={styles.scopeOptionTopRow}>
                            <View
                              style={[
                                styles.scopeOptionIcon,
                                {
                                  backgroundColor: isSelected ? colors.tint : 'rgba(255, 255, 255, 0.08)',
                                },
                              ]}
                            >
                              <IconComp size={16} color={isSelected ? activeTintContrast : colors.textSecondary} />
                            </View>
                            {isSelected && <CheckCircle2 size={18} color={colors.tint} />}
                          </View>
                          <Text
                            style={[
                              styles.scopeOptionTitle,
                              { color: isSelected ? colors.tint : colors.text },
                            ]}
                          >
                            {item.title}
                          </Text>
                          <Text style={[styles.scopeOptionSubtitle, { color: colors.textSecondary }]}>
                            {item.sub}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Switch avisar a amigos */}
                  {workoutVisibility !== 'private' && (
                    <View style={[styles.settingRowItem, { backgroundColor: subtleItemBg, marginTop: 12 }]}>
                      <View style={[styles.rowIconCircle, { backgroundColor: notifyFriendsOnWorkout ? colors.tint + '1A' : 'rgba(255, 255, 255, 0.05)' }]}>
                        <BellRing size={20} color={notifyFriendsOnWorkout ? colors.tint : colors.textSecondary} />
                      </View>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={[styles.rowItemTitle, { color: colors.text }]}>
                          Notificar a mis amigos al terminar
                        </Text>
                        <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                          Enviar aviso cuando compartas un nuevo entreno en el muro
                        </Text>
                      </View>
                      <LiquidGlassSwitch
                        value={notifyFriendsOnWorkout}
                        onValueChange={handleToggleNotifyFriends}
                        tintColor={colors.tint}
                        isDark={isDark}
                      />
                    </View>
                  )}

                  {/* Apartado inicial al abrir el Muro */}
                  <Text style={[styles.miniHeaderTitle, { color: colors.textSecondary, marginTop: 18 }]}>
                    APARTADO INICIAL AL ABRIR EL MURO
                  </Text>
                  <View style={styles.feedScopeRow}>
                    {[
                      { id: 'global', label: 'Global', desc: 'Comunidad', icon: Globe },
                      { id: 'gym', label: 'Gimnasio', desc: 'Tu centro', icon: MapPin },
                      { id: 'friends', label: 'Amigos', desc: 'Tu círculo', icon: Users },
                    ].map(opt => {
                      const active = defaultFeedScope === opt.id;
                      const IconComp = opt.icon;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          onPress={() => handleChangeDefaultFeedScope(opt.id as any)}
                          activeOpacity={0.8}
                          style={[
                            styles.feedScopeCard,
                            {
                              backgroundColor: active ? colors.tint + '1E' : subtleItemBg,
                              borderColor: active ? colors.tint : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                            },
                          ]}
                        >
                          <IconComp size={16} color={active ? colors.tint : colors.textSecondary} />
                          <Text style={[styles.feedScopeCardTitle, { color: active ? colors.tint : colors.text }]}>
                            {opt.label}
                          </Text>
                          <Text style={[styles.feedScopeCardSub, { color: colors.textSecondary }]}>
                            {opt.desc}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </GlassSurface>
              </View>
            )}

            {/* ================= 7. SESIÓN ================= */}
            {activeTab === 'session' && (
              <View style={styles.cardsStack}>
                {/* Dispositivos y sesiones activas */}
                <GlassSurface radius={26} isDark={isDark} borderColor={glassBorder} style={styles.cardPadding}>
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardHeaderIcon, { backgroundColor: colors.tint + '1E' }]}>
                      <Smartphone size={22} color={colors.tint} strokeWidth={2.4} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>
                        Sesiones Activas
                      </Text>
                      <Text style={[styles.cardHeaderSubtitle, { color: colors.textSecondary }]}>
                        Dispositivos que han iniciado sesión en tu cuenta
                      </Text>
                    </View>
                  </View>

                  {loadingSessions ? (
                    <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                      <ActivityIndicator size="small" color={colors.tint} />
                      <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary, marginTop: 8 }]}>
                        Consultando sesiones activas...
                      </Text>
                    </View>
                  ) : sessions.length > 0 ? (
                    <View style={{ gap: 10, marginTop: 10 }}>
                      {sessions.map((sess, idx) => {
                        const isCurrent = Boolean(sess.is_current || idx === 0);
                        const isRevoking = revokingSessionId === sess.id;

                        return (
                          <View
                            key={sess.id || idx}
                            style={[
                              styles.sessionCardItem,
                              {
                                backgroundColor: subtleItemBg,
                                borderColor: isCurrent ? colors.tint + '44' : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                              },
                            ]}
                          >
                            <View style={[styles.rowIconCircle, { backgroundColor: isCurrent ? colors.tint + '20' : 'rgba(255, 255, 255, 0.05)' }]}>
                              <Smartphone size={20} color={isCurrent ? colors.tint : colors.textSecondary} />
                            </View>

                            <View style={{ flex: 1, marginRight: 8 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={[styles.sessionDeviceTitle, { color: colors.text }]}>
                                  {sess.device || sess.userAgent || 'Dispositivo móvil'}
                                </Text>
                                {isCurrent && (
                                  <View style={[styles.currentDevicePill, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                                    <Text style={styles.currentDevicePillText}>ESTE DISPOSITIVO</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={[styles.sessionIpText, { color: colors.textSecondary }]}>
                                {sess.ip_address || sess.ip || 'Red protegida'} • {sess.last_activity ? new Date(sess.last_activity).toLocaleDateString() : 'Activa recientemente'}
                              </Text>
                            </View>

                            {!isCurrent && (
                              <TouchableOpacity
                                onPress={() => handleRevokeSession(sess.id, isCurrent)}
                                disabled={isRevoking}
                                activeOpacity={0.7}
                                style={styles.revokeSessionBtn}
                              >
                                {isRevoking ? (
                                  <ActivityIndicator size="small" color="#ef4444" />
                                ) : (
                                  <Trash2 size={16} color="#ef4444" />
                                )}
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })}

                      {sessions.length > 1 && (
                        <TouchableOpacity
                          onPress={handleRevokeAllOtherSessions}
                          activeOpacity={0.8}
                          style={[styles.dangerOutlineBtn, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                        >
                          <LogOut size={16} color="#ef4444" style={{ marginRight: 6 }} />
                          <Text style={styles.dangerOutlineBtnText}>
                            Cerrar todas las demás sesiones
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary, marginTop: 10 }]}>
                      Tu sesión actual es la única activa en este momento.
                    </Text>
                  )}
                </GlassSurface>

                {/* Cerrar Sesión Manual */}
                <GlassSurface radius={26} isDark={isDark} borderColor="rgba(239, 68, 68, 0.2)" style={styles.cardPadding}>
                  <TouchableOpacity
                    onPress={handleConfirmLogout}
                    activeOpacity={0.7}
                    style={styles.logoutBtnRow}
                  >
                    <View style={[styles.rowIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                      <LogOut size={20} color="#ef4444" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
                      <Text style={[styles.rowItemSubtitle, { color: colors.textSecondary }]}>
                        Desconectar tu cuenta de este teléfono
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#ef4444" />
                  </TouchableOpacity>
                </GlassSurface>
              </View>
            )}
          </View>
        )}
      </Animated.ScrollView>

      {/* Modal de importación y exportación de entrenamientos CSV */}
      <WorkoutDataTransferModal
        visible={showDataTransferModal}
        isOpen={showDataTransferModal}
        onClose={() => setShowDataTransferModal(false)}
        initialTab={dataTransferTab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  verticalListContainer: {
    paddingBottom: 24,
  },
  menuCard: {
    padding: 6,
    marginBottom: 20,
  },
  menuList: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuRowTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  menuRowSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  footerInfoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  footerInfoText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  footerSubText: {
    fontSize: 11,
    opacity: 0.7,
  },
  sectionDetailContainer: {
    gap: 16,
    paddingBottom: 30,
  },
  backBreadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 6,
  },
  backBreadcrumbText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardsStack: {
    gap: 16,
  },
  cardPadding: {
    padding: 18,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardHeaderSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  switchItemsList: {
    gap: 10,
  },
  settingRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
  },
  rowIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowItemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  rowItemSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  sectionParagraph: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  storageStatusBox: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
  },
  storageStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusDotBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storageStatusTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  storageStatusSub: {
    fontSize: 11,
    marginTop: 1,
  },
  storagePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  storagePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricItem: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  metricSub: {
    fontSize: 9,
    marginTop: 1,
  },
  offlineActionsRow: {
    marginTop: 4,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  downloadingProgressBarContainer: {
    gap: 6,
  },
  downloadingProgressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  downloadingProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  downloadingText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  dangerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  dangerActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ef4444',
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  smallFormatBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  smallFormatBtnText: {
    fontSize: 11,
    fontWeight: '900',
  },
  scopeSelectorContainer: {
    gap: 8,
  },
  scopeOptionCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  scopeOptionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  scopeOptionIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeOptionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  scopeOptionSubtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  miniHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  feedScopeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  feedScopeCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  feedScopeCardTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  feedScopeCardSub: {
    fontSize: 10,
  },
  sessionCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  sessionDeviceTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  currentDevicePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentDevicePillText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#10b981',
    letterSpacing: 0.3,
  },
  sessionIpText: {
    fontSize: 11,
    marginTop: 2,
  },
  revokeSessionBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  dangerOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    marginTop: 6,
  },
  dangerOutlineBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ef4444',
  },
  logoutBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ef4444',
  },
});
