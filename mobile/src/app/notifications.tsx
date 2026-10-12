import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  Pressable, 
  Platform, 
  ActivityIndicator, 
  StyleSheet 
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  X, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  Smartphone, 
  Globe, 
  Clock, 
  Shield, 
  UserPlus, 
  Users, 
  Zap, 
  Award, 
  MessageCircle 
} from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import AnimatedScreen from '@/components/AnimatedScreen';
import GlobalHeader from '@/components/GlobalHeader';
import { GlassView } from 'expo-glass-effect';
import { getContrastTextColor } from '@/utils/colorUtils';

// --- Helpers de Fecha Robustos ---
const parseDateSafe = (dateStr: any) => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  let normalized = String(dateStr).replace(' ', 'T');
  if (!/Z$|[+-]\d{2}(:?\d{2})?$/.test(normalized)) {
    normalized += 'Z';
  }
  const parsed = new Date(normalized);
  return isNaN(parsed.getTime()) ? new Date(dateStr) : parsed;
};

const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const isToday = (d: Date) => isSameDay(d, new Date());
const isYesterday = (d: Date) => {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return isSameDay(d, y);
};

const getTimeDisplay = (dateStr: any) => {
  const d = parseDateSafe(dateStr);
  if (isToday(d) || isYesterday(d)) {
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

const formatDateFull = (d: Date) => {
  try {
    return d.toLocaleString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return d.toLocaleString();
  }
};

export default function NotificationsScreen() {
  const router = useRouter();
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentTextColor = getContrastTextColor(colors.tint);

  // Store actions & state
  const notifications = useAppStore(state => state.notifications) || [];
  const unreadCount = notifications.filter((n: any) => !n.is_read).length;
  const notificationsLoading = useAppStore(state => (state as any).notificationsLoading);
  const notificationPage = useAppStore(state => (state as any).notificationPage) || 1;
  const notificationTotalPages = useAppStore(state => (state as any).notificationTotalPages) || 1;

  const fetchNotifications = useAppStore(state => (state as any).fetchNotifications);
  const markNotificationAsRead = useAppStore(state => state.markNotificationAsRead);
  const markAllNotificationsAsRead = useAppStore(state => state.markAllNotificationsAsRead);
  const removeNotification = useAppStore(state => state.deleteNotification || (state as any).removeNotification);
  const clearAllNotifications = useAppStore(state => (state as any).clearAllNotifications);

  // Estados locales
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [deleteAction, setDeleteAction] = useState<{ type: 'single' | 'all'; id?: string } | null>(null);

  useEffect(() => {
    if (fetchNotifications) {
      fetchNotifications(1);
    }
  }, []);

  const handleNotificationClick = (notif: any) => {
    if (!notif.is_read && markNotificationAsRead) {
      markNotificationAsRead(notif.id);
    }

    if (notif.data && (notif.data.ip || notif.data.userAgent)) {
      setSelectedNotification(notif);
      return;
    }

    if (notif.data?.url) {
      const url = notif.data.url;
      try {
        router.push(url as any);
      } catch (e) {
        console.warn('Navigation error:', e);
      }
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || notificationPage >= notificationTotalPages || !fetchNotifications) return;
    setIsLoadingMore(true);
    await fetchNotifications(notificationPage + 1);
    setIsLoadingMore(false);
  };

  const confirmDelete = async () => {
    if (!deleteAction) return;
    if (deleteAction.type === 'all' && clearAllNotifications) {
      await clearAllNotifications();
    } else if (deleteAction.type === 'single' && deleteAction.id && removeNotification) {
      await removeNotification(deleteAction.id);
    }
    setDeleteAction(null);
  };

  // Filtros idénticos al frontend
  const filters = [
    { id: 'all', label: 'Todas' },
    { id: 'unread', label: 'No leídas' },
    { id: 'xp', label: 'XP' },
    { id: 'info', label: 'Info' },
    { id: 'success', label: 'Éxito' },
    { id: 'alert', label: 'Alertas' },
  ];

  const filteredList = useMemo(() => {
    return notifications.filter((n: any) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'unread') return !n.is_read;
      if (activeFilter === 'xp') {
        const title = n.title?.toLowerCase() || '';
        const message = n.message?.toLowerCase() || '';
        return title.includes('xp') || message.includes('xp') || n.data?.type === 'xp';
      }
      if (activeFilter === 'success') return n.type === 'success';
      if (activeFilter === 'alert') return ['warning', 'alert'].includes(n.type);
      if (activeFilter === 'info') return !['success', 'warning', 'alert'].includes(n.type);
      return true;
    });
  }, [notifications, activeFilter]);

  // Agrupación de fechas idéntica al frontend: Hoy, Ayer, Anterior
  const groupedNotifications = useMemo(() => {
    const groups: { hoy: any[]; ayer: any[]; anterior: any[] } = { hoy: [], ayer: [], anterior: [] };
    filteredList.forEach((n: any) => {
      const date = parseDateSafe(n.created_at);
      if (isToday(date)) groups.hoy.push(n);
      else if (isYesterday(date)) groups.ayer.push(n);
      else groups.anterior.push(n);
    });
    return groups;
  }, [filteredList]);

  // Iconos idénticos al frontend (forma redondeada 14px, colores exactos)
  const renderNotificationIcon = (n: any) => {
    const subType = n.data?.type || n.type;

    let icon = <Info size={20} color={colors.tint} />;
    let bg = colors.tint + '18';

    if (subType === 'friend_request') {
      icon = <UserPlus size={20} color={colors.tint} />;
      bg = colors.tint + '18';
    } else if (subType === 'friend_accept') {
      icon = <Users size={20} color="#22c55e" />;
      bg = 'rgba(34, 197, 94, 0.15)';
    } else if (subType === 'xp' || subType === 'level_up') {
      icon = <Zap size={20} color="#f59e0b" fill="#f59e0b" />;
      bg = 'rgba(245, 158, 11, 0.15)';
    } else if (subType === 'badge') {
      icon = <Award size={20} color="#f59e0b" />;
      bg = 'rgba(245, 158, 11, 0.15)';
    } else if (n.type === 'chat_message') {
      icon = <MessageCircle size={20} color="#3b82f6" />;
      bg = 'rgba(59, 130, 246, 0.15)';
    } else if (n.type === 'success') {
      icon = <CheckCircle size={20} color="#22c55e" />;
      bg = 'rgba(34, 197, 94, 0.15)';
    } else if (n.type === 'warning') {
      icon = <AlertTriangle size={20} color="#eab308" />;
      bg = 'rgba(234, 179, 8, 0.15)';
    } else if (n.type === 'alert') {
      icon = <AlertCircle size={20} color="#ef4444" />;
      bg = 'rgba(239, 68, 68, 0.15)';
    }

    return (
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
    );
  };

  const hasNotifications = notifications.length > 0;
  const isListEmpty = filteredList.length === 0;
  const canLoadMore = notificationPage < notificationTotalPages && activeFilter === 'all';

  const headerContent = <GlobalHeader title="Notificaciones" showBackButton hideRightButtons />;

  return (
    <AnimatedScreen header={headerContent}>
      {/* ================= HEADER SECCIÓN NOVEDADES / ACCIONES ================= */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, marginTop: 8 }}>
        <View>
          <Text style={{ fontSize: 26, fontWeight: '900', color: colors.text, letterSpacing: -0.5 }}>
            {unreadCount > 0 ? 'Novedades' : 'Al día'}
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: 3 }}>
            {unreadCount > 0 ? `${unreadCount} pendientes` : 'No hay alertas'}
          </Text>
        </View>

        {hasNotifications && (
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            borderRadius: 9999, 
            padding: 4,
            overflow: 'hidden',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            position: 'relative',
          }}>
            <GlassView 
              glassEffectStyle="regular" 
              colorScheme={isDark ? 'dark' : 'light'} 
              style={[StyleSheet.absoluteFill, { borderRadius: 9999 }]} 
            />

            <TouchableOpacity 
              onPress={() => { if (markAllNotificationsAsRead) markAllNotificationsAsRead(); }}
              style={{ padding: 8, borderRadius: 9999 }}
              hitSlop={8}
            >
              <CheckCheck size={18} color={colors.tint} />
            </TouchableOpacity>

            <View style={{ width: 1, height: 16, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)', marginHorizontal: 2 }} />

            <TouchableOpacity 
              onPress={() => setDeleteAction({ type: 'all' })}
              style={{ padding: 8, borderRadius: 9999 }}
              hitSlop={8}
            >
              <Trash2 size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ================= FILTROS PÍLDORAS FLOTANTES SIN BORDES (LIQUID GLASS) ================= */}
      {hasNotifications && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingTop: 6, paddingBottom: 16, paddingHorizontal: 4 }}
          style={{ marginBottom: 4 }}
        >
          {filters.map(f => {
            const isActive = activeFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setActiveFilter(f.id)}
                activeOpacity={0.75}
                style={{
                  position: 'relative',
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 9999,
                  overflow: 'hidden',
                  backgroundColor: isActive 
                    ? colors.tint 
                    : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'),
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: isActive ? colors.tint : 'transparent',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: isActive ? 0.35 : 0,
                  shadowRadius: 6,
                  elevation: isActive ? 3 : 0,
                }}
              >
                {/* Capa Liquid Glass Nativa de Apple con radio cápsula completo */}
                {!isActive && (
                  <GlassView
                    glassEffectStyle="regular"
                    colorScheme={isDark ? 'dark' : 'light'}
                    style={[StyleSheet.absoluteFill, { borderRadius: 9999 }]}
                  />
                )}

                {/* Texto del filtro: contraste perfecto garantizado */}
                <Text style={{
                  fontSize: 13,
                  fontWeight: 'bold',
                  letterSpacing: -0.2,
                  color: isActive ? accentTextColor : colors.textSecondary,
                }}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ================= ESTADO VACÍO ================= */}
      {!hasNotifications ? (
        <View style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.65)',
          borderRadius: 32,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          padding: 36,
          alignItems: 'center',
          marginTop: 20,
          overflow: 'hidden',
        }}>
          <GlassView glassEffectStyle="regular" colorScheme={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={{ 
            width: 72, 
            height: 72, 
            borderRadius: 24, 
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: 16 
          }}>
            <Bell size={32} color={colors.textSecondary} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>No tienes notificaciones</Text>
          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginTop: 6, textAlign: 'center' }}>
            Te avisaremos cuando ocurra algo importante.
          </Text>
        </View>
      ) : isListEmpty ? (
        <View style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.65)',
          borderRadius: 32,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          padding: 36,
          alignItems: 'center',
          marginTop: 20,
          overflow: 'hidden',
        }}>
          <GlassView glassEffectStyle="regular" colorScheme={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={{ 
            width: 72, 
            height: 72, 
            borderRadius: 24, 
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: 16 
          }}>
            <Filter size={32} color={colors.textSecondary} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>No hay notificaciones</Text>
          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginTop: 6, textAlign: 'center' }}>
            Prueba a cambiar el filtro superior.
          </Text>
        </View>
      ) : (
        /* ================= LISTA AGRUPADA POR FECHA (HOY / AYER / ANTERIOR) ================= */
        <View style={{ gap: 24, marginTop: 8 }}>
          {(['hoy', 'ayer', 'anterior'] as const).map(key => {
            const list = groupedNotifications[key];
            if (!list || list.length === 0) return null;
            const titleGroup = key === 'hoy' ? 'Hoy' : key === 'ayer' ? 'Ayer' : 'Anterior';

            return (
              <View key={key}>
                <Text style={{ 
                  fontSize: 11, 
                  fontWeight: '800', 
                  color: colors.textMuted || colors.textSecondary, 
                  textTransform: 'uppercase', 
                  letterSpacing: 1.5, 
                  marginBottom: 12, 
                  paddingLeft: 6 
                }}>
                  {titleGroup}
                </Text>

                <View style={{ gap: 12 }}>
                  {list.map((n: any) => {
                    const isUnread = !n.is_read;
                    return (
                      <TouchableOpacity
                        key={n.id}
                        onPress={() => handleNotificationClick(n)}
                        activeOpacity={0.85}
                        style={{
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.65)',
                          borderRadius: 24,
                          padding: 16,
                          borderWidth: isUnread ? 2 : 1,
                          borderColor: isUnread ? colors.tint : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'),
                          opacity: isUnread ? 1 : 0.85,
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <GlassView 
                          glassEffectStyle="regular" 
                          colorScheme={isDark ? 'dark' : 'light'} 
                          style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} 
                        />

                        {/* Fila principal: icono y textos */}
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                          {renderNotificationIcon(n)}

                          <View style={{ flex: 1 }}>
                            <Text style={{ 
                              fontSize: 15, 
                              fontWeight: '700', 
                              color: isUnread ? colors.text : colors.textSecondary, 
                              marginBottom: 4 
                            }}>
                              {n.title}
                            </Text>

                            <Text style={{ 
                              fontSize: 13, 
                              fontWeight: '500', 
                              color: isUnread ? colors.textSecondary : (colors.textMuted || colors.textSecondary), 
                              lineHeight: 19 
                            }}>
                              {n.message}
                            </Text>

                            {/* Píldoras de acción interactiva (Liquid Glass) */}
                            {n.data && (n.data.ip || n.data.userAgent) && (
                              <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 9999,
                                marginTop: 10,
                                alignSelf: 'flex-start',
                                overflow: 'hidden',
                                position: 'relative',
                                borderWidth: 1,
                                borderColor: colors.tint + '35',
                              }}>
                                <GlassView 
                                  glassEffectStyle="regular" 
                                  colorScheme={isDark ? 'dark' : 'light'} 
                                  style={[StyleSheet.absoluteFill, { borderRadius: 9999 }]} 
                                />
                                <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.tint + '15' }]} />
                                <Shield size={12} color={colors.tint} />
                                <Text style={{ fontSize: 10, fontWeight: '800', color: colors.tint, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                                  Detalles de sesión
                                </Text>
                                <ChevronRight size={12} color={colors.tint} />
                              </View>
                            )}

                            {n.data?.url && (
                              <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 9999,
                                marginTop: 10,
                                alignSelf: 'flex-start',
                                overflow: 'hidden',
                                position: 'relative',
                                borderWidth: 1,
                                borderColor: colors.tint + '35',
                              }}>
                                <GlassView 
                                  glassEffectStyle="regular" 
                                  colorScheme={isDark ? 'dark' : 'light'} 
                                  style={[StyleSheet.absoluteFill, { borderRadius: 9999 }]} 
                                />
                                <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.tint + '15' }]} />
                                <Text style={{ fontSize: 10, fontWeight: '800', color: colors.tint, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                                  Ver contenido
                                </Text>
                                <ChevronRight size={12} color={colors.tint} />
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Fila inferior: Fecha/Hora y botón eliminar */}
                        <View style={{ 
                          flexDirection: 'row', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          marginTop: 14, 
                          paddingTop: 10, 
                          borderTopWidth: StyleSheet.hairlineWidth, 
                          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' 
                        }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted || colors.textSecondary }}>
                            {getTimeDisplay(n.created_at)}
                          </Text>

                          <TouchableOpacity
                            onPress={() => setDeleteAction({ type: 'single', id: n.id })}
                            hitSlop={10}
                            style={{ padding: 4 }}
                          >
                            <Trash2 size={16} color={colors.textMuted || colors.textSecondary} />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}

          {/* ================= BOTÓN CARGAR ANTERIORES ================= */}
          {canLoadMore && (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <TouchableOpacity
                onPress={handleLoadMore}
                disabled={isLoadingMore}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 28,
                  paddingVertical: 13,
                  borderRadius: 9999,
                  overflow: 'hidden',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  position: 'relative',
                }}
              >
                <GlassView 
                  glassEffectStyle="regular" 
                  colorScheme={isDark ? 'dark' : 'light'} 
                  style={[StyleSheet.absoluteFill, { borderRadius: 9999 }]} 
                />

                {isLoadingMore ? (
                  <ActivityIndicator size="small" color={colors.tint} />
                ) : (
                  <>
                    <ChevronDown size={18} color={colors.textSecondary} />
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textSecondary }}>Cargar Anteriores</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ================= MODAL: DETALLES DE INICIO DE SESIÓN (TRUE LIQUID GLASS) ================= */}
      <Modal 
        visible={!!selectedNotification} 
        transparent 
        animationType="fade" 
        onRequestClose={() => setSelectedNotification(null)}
      >
        <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill}>
          <Pressable 
            style={[
              StyleSheet.absoluteFill,
              { 
                justifyContent: 'center', 
                alignItems: 'center', 
                padding: 20,
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.25)',
              }
            ]}
            onPress={() => setSelectedNotification(null)}
          >
            <Pressable 
              style={{ 
                width: '100%', 
                maxWidth: 400, 
                borderRadius: 32, 
                overflow: 'hidden',
                position: 'relative',
              }}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Capa Liquid Glass de la tarjeta */}
              <GlassView 
                glassEffectStyle="regular" 
                colorScheme={isDark ? 'dark' : 'light'} 
                style={[StyleSheet.absoluteFill, { borderRadius: 32 }]} 
              />
              
              <View style={{
                padding: 26,
                borderRadius: 32,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.65)',
              }}>
                {/* Botón cerrar Liquid Glass */}
                <TouchableOpacity 
                  onPress={() => setSelectedNotification(null)}
                  style={{ 
                    position: 'absolute', 
                    top: 20, 
                    right: 20, 
                    width: 36, 
                    height: 36, 
                    borderRadius: 18, 
                    overflow: 'hidden',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    zIndex: 10 
                  }}
                >
                  <GlassView glassEffectStyle="regular" colorScheme={isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
                  <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Encabezado */}
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                  <View style={{ 
                    width: 64, 
                    height: 64, 
                    borderRadius: 22, 
                    backgroundColor: colors.tint + '18', 
                    borderWidth: 1.5, 
                    borderColor: colors.tint + '35', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginBottom: 14,
                    overflow: 'hidden',
                    position: 'relative',
                  }}>
                    <GlassView glassEffectStyle="regular" colorScheme={isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { borderRadius: 22 }]} />
                    <Shield size={32} color={colors.tint} strokeWidth={1.5} />
                  </View>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.4 }}>Detalles de Inicio</Text>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
                    Información del dispositivo registrado
                  </Text>
                </View>

                {/* Contenedor de datos Liquid Glass */}
                <View style={{ 
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)', 
                  borderRadius: 24, 
                  padding: 18, 
                  gap: 16,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <GlassView glassEffectStyle="regular" colorScheme={isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} />

                  {/* Dispositivo */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(59, 130, 246, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                      <Smartphone size={20} color="#3b82f6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted || colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        Dispositivo / Navegador
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 2 }}>
                        {selectedNotification?.data?.userAgent || 'Desconocido'}
                      </Text>
                    </View>
                  </View>

                  {/* IP */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(168, 85, 247, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                      <Globe size={20} color="#a855f7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted || colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        Dirección IP
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                        {selectedNotification?.data?.ip || 'Desconocida'}
                      </Text>
                    </View>
                  </View>

                  {/* Fecha */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(34, 197, 94, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={20} color="#22c55e" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted || colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        Fecha y Hora
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 2 }}>
                        {formatDateFull(parseDateSafe(selectedNotification?.data?.date || selectedNotification?.created_at))}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Botón Entendido */}
                <TouchableOpacity 
                  onPress={() => setSelectedNotification(null)}
                  activeOpacity={0.8}
                  style={{
                    height: 52,
                    borderRadius: 20,
                    backgroundColor: colors.tint,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 24,
                    shadowColor: colors.tint,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.35,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: accentTextColor }}>Entendido</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </GlassView>
      </Modal>

      {/* ================= MODAL: ELIMINAR NOTIFICACIÓN (TRUE LIQUID GLASS) ================= */}
      <Modal 
        visible={!!deleteAction} 
        transparent 
        animationType="fade" 
        onRequestClose={() => setDeleteAction(null)}
      >
        <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill}>
          <Pressable 
            style={[
              StyleSheet.absoluteFill,
              { 
                justifyContent: 'center', 
                alignItems: 'center', 
                padding: 20,
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.25)',
              }
            ]}
            onPress={() => setDeleteAction(null)}
          >
            <Pressable 
              style={{ 
                width: '100%', 
                maxWidth: 380, 
                borderRadius: 32, 
                overflow: 'hidden',
                position: 'relative',
              }}
              onPress={(e) => e.stopPropagation()}
            >
              <GlassView 
                glassEffectStyle="regular" 
                colorScheme={isDark ? 'dark' : 'light'} 
                style={[StyleSheet.absoluteFill, { borderRadius: 32 }]} 
              />

              <View style={{
                padding: 26,
                borderRadius: 32,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.65)',
                alignItems: 'center',
              }}>
                <View style={{ 
                  width: 64, 
                  height: 64, 
                  borderRadius: 22, 
                  backgroundColor: 'rgba(239, 68, 68, 0.15)', 
                  borderWidth: 1.5,
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: 16,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <GlassView glassEffectStyle="regular" colorScheme={isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { borderRadius: 22 }]} />
                  <Trash2 size={30} color="#ef4444" />
                </View>

                <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center', letterSpacing: -0.3 }}>
                  {deleteAction?.type === 'all' ? '¿Eliminar todas?' : '¿Eliminar notificación?'}
                </Text>

                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
                  {deleteAction?.type === 'all'
                    ? 'Esta acción borrará permanentemente todas tus notificaciones. No se puede deshacer.'
                    : 'Esta notificación se eliminará permanentemente.'}
                </Text>

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 26, width: '100%' }}>
                  <TouchableOpacity
                    onPress={() => setDeleteAction(null)}
                    activeOpacity={0.75}
                    style={{
                      flex: 1,
                      height: 50,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <GlassView glassEffectStyle="regular" colorScheme={isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={confirmDelete}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      height: 50,
                      borderRadius: 18,
                      backgroundColor: '#ef4444',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#ef4444',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.35,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#ffffff' }}>
                      {deleteAction?.type === 'all' ? 'Eliminar todas' : 'Eliminar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </GlassView>
      </Modal>
    </AnimatedScreen>
  );
}
