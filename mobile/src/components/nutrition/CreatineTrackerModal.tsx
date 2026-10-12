import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  X,
  Zap,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastTextColor } from '@/utils/colorUtils';
import {
  formatDateForDisplay,
  formatDateToShort,
  formatDateForQuery,
} from '@/utils/dateUtils';
import * as creatinaService from '@/services/creatinaService';

interface CreatineTrackerModalProps {
  visible: boolean;
  selectedDate: string;
  creatineTarget: string | number;
  onClose: () => void;
  onRefresh: () => void;
}

export const CreatineTrackerModal: React.FC<CreatineTrackerModalProps> = ({
  visible,
  selectedDate,
  creatineTarget,
  onClose,
  onRefresh,
}) => {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const fetchNotifications = useAppStore(state => state.fetchNotifications);
  const fetchInitialData = useAppStore(state => state.fetchInitialData);

  // States
  const [grams, setGrams] = useState(String(creatineTarget || '5'));
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [creatinaLogs, setCreatinaLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<{
    totalDays: number;
    currentStreak: number;
    averageGrams: number;
    thisWeekDays: number;
  }>({
    totalDays: 0,
    currentStreak: 0,
    averageGrams: 0,
    thisWeekDays: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [editingLog, setEditingLog] = useState<any | null>(null);
  const [editGrams, setEditGrams] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  // Pagination for Recent History
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const totalPages = Math.max(1, Math.ceil(creatinaLogs.length / itemsPerPage));
  const paginatedLogs = useMemo(() => {
    return creatinaLogs.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [creatinaLogs, currentPage]);

  useEffect(() => {
    if (visible) {
      loadCreatineData();
      setGrams(String(creatineTarget || '5'));
    }
  }, [visible, selectedDate]);

  const loadCreatineData = async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - offset);

      const startDate = formatDateForQuery(startOfWeek);
      const endDate = formatDateForQuery(today);

      const [logsRes, statsRes, dailyRes] = await Promise.all([
        creatinaService.getCreatinaLogs({ limit: 40 }),
        creatinaService.getCreatinaStats().catch(() => null),
        creatinaService.getCreatinaLogs({ startDate: selectedDate, endDate: selectedDate }),
      ]);

      setCreatinaLogs(logsRes?.data || []);
      if (statsRes?.data) {
        setStats({
          totalDays: statsRes.data.totalDays ?? 0,
          currentStreak: statsRes.data.currentStreak ?? 0,
          averageGrams: statsRes.data.averageGrams ?? 0,
          thisWeekDays: statsRes.data.thisWeekDays ?? 0,
        });
      }
      setDailyLogs(dailyRes?.data || []);
      setCurrentPage(1);
    } catch (e) {
      console.warn('Error loading creatine data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLog = async () => {
    const num = parseFloat(grams);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Valor inválido', 'Por favor ingresa una cantidad válida de gramos.');
      return;
    }
    if (num > 50) {
      Alert.alert('Límite excedido', 'La cantidad máxima permitida es 50g.');
      return;
    }

    setIsSubmitting(true);
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}

      const response = await creatinaService.createCreatinaLog({
        grams: num,
        log_date: selectedDate,
      });

      setGrams(String(creatineTarget || '5'));
      await loadCreatineData();
      onRefresh();

      if (fetchNotifications) fetchNotifications();
      if (fetchInitialData) fetchInitialData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error al guardar el registro de creatina.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (log: any) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setEditingLog(log);
    setEditGrams(String(log.grams));
    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setEditingLog(null);
    setEditGrams('');
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;
    const num = parseFloat(editGrams);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Valor inválido', 'Por favor ingresa una cantidad válida de gramos.');
      return;
    }
    if (num > 50) {
      Alert.alert('Límite excedido', 'La cantidad máxima permitida es 50g.');
      return;
    }

    setIsSubmitting(true);
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}

      await creatinaService.updateCreatinaLog(editingLog.id, {
        grams: num,
      });

      handleCloseEdit();
      await loadCreatineData();
      onRefresh();

      if (fetchNotifications) fetchNotifications();
      if (fetchInitialData) fetchInitialData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error al actualizar el registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = (log: any) => {
    Alert.alert(
      'Eliminar toma',
      `¿Deseas eliminar el registro de ${log.grams}g?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              } catch {}
              await creatinaService.deleteCreatinaLog(log.id);
              await loadCreatineData();
              onRefresh();
              if (fetchNotifications) fetchNotifications();
              if (fetchInitialData) fetchInitialData();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Error al eliminar el registro.');
            }
          },
        },
      ]
    );
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return '#22c55e';
    if (streak >= 14) return '#3b82f6';
    if (streak >= 7) return '#eab308';
    return colors.textMuted;
  };

  const formattedSelectedDate = useMemo(() => {
    const str = formatDateForDisplay(selectedDate);
    if (!str) return selectedDate;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, [selectedDate]);

  const formatLogWeekday = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.toLocaleDateString('es-ES', { weekday: 'long' });
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={StyleSheet.absoluteFill}
          >
            <Pressable
              style={[
                StyleSheet.absoluteFill,
                styles.modalOverlay,
                {
                  backgroundColor: isDark ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0.25)',
                },
              ]}
              onPress={onClose}
            >
              <Pressable
                onPress={e => e.stopPropagation()}
                style={[
                  styles.cardWrapper,
                  {
                    backgroundColor: colors.card,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
              >
                <GlassView
                  glassEffectStyle="regular"
                  colorScheme={isDark ? 'dark' : 'light'}
                  style={StyleSheet.absoluteFill}
                />

                <View style={styles.card}>
                  {/* Header (Liquid Glass) */}
                  <View
                    style={[
                      styles.header,
                      {
                        borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                  >
                    <View style={styles.headerLeft}>
                      <View
                        style={[
                          styles.headerIconBadge,
                          {
                            backgroundColor: 'rgba(168, 85, 247, 0.15)',
                            borderColor: 'rgba(168, 85, 247, 0.35)',
                          },
                        ]}
                      >
                        <GlassView
                          glassEffectStyle="regular"
                          colorScheme={isDark ? 'dark' : 'light'}
                          style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                        />
                        <Zap size={22} color="#a855f7" strokeWidth={2.5} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                          Creatina
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                          Dosis recomendada: ~{creatineTarget}g/día
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={onClose}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={[
                        styles.closeBtn,
                        {
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <GlassView
                        glassEffectStyle="regular"
                        colorScheme={isDark ? 'dark' : 'light'}
                        style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
                      />
                      <X size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Body Content */}
                  <ScrollView
                    style={styles.scrollBody}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                  {/* 1. STATS BENTO GRID (Identical to Frontend) */}
                  <View style={styles.statsGrid}>
                    {/* Días Totales */}
                    <View
                      style={[
                        styles.statCard,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.85)',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
                        },
                      ]}
                    >
                      <GlassView
                        glassEffectStyle="regular"
                        colorScheme={isDark ? 'dark' : 'light'}
                        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                      />
                      <Calendar size={22} color="#3b82f6" strokeWidth={2} />
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {stats.totalDays}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Días totales
                      </Text>
                    </View>

                    {/* Racha Actual */}
                    <View
                      style={[
                        styles.statCard,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.85)',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
                        },
                      ]}
                    >
                      <GlassView
                        glassEffectStyle="regular"
                        colorScheme={isDark ? 'dark' : 'light'}
                        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                      />
                      <TrendingUp size={22} color={getStreakColor(stats.currentStreak)} strokeWidth={2} />
                      <Text style={[styles.statValue, { color: getStreakColor(stats.currentStreak) }]}>
                        {stats.currentStreak}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Racha actual
                      </Text>
                    </View>

                    {/* Promedio */}
                    <View
                      style={[
                        styles.statCard,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.85)',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
                        },
                      ]}
                    >
                      <GlassView
                        glassEffectStyle="regular"
                        colorScheme={isDark ? 'dark' : 'light'}
                        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                      />
                      <Zap size={22} color="#a855f7" strokeWidth={2} />
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {stats.averageGrams ? stats.averageGrams.toFixed(1) : '0.0'}
                        <Text style={{ fontSize: 14 }}>g</Text>
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Promedio
                      </Text>
                    </View>

                    {/* Esta Semana */}
                    <View
                      style={[
                        styles.statCard,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.85)',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
                        },
                      ]}
                    >
                      <GlassView
                        glassEffectStyle="regular"
                        colorScheme={isDark ? 'dark' : 'light'}
                        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                      />
                      <Calendar size={22} color="#22c55e" strokeWidth={2} />
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {stats.thisWeekDays}/7
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Esta semana
                      </Text>
                    </View>
                  </View>

                  {/* 2. FORMULARIO PARA AÑADIR TOMA (Identical to Frontend) */}
                  <View
                    style={[
                      styles.sectionCard,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.75)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
                      },
                    ]}
                  >
                    <GlassView
                      glassEffectStyle="regular"
                      colorScheme={isDark ? 'dark' : 'light'}
                      style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
                    />

                    {/* Header de fecha seleccionada */}
                    <View style={styles.sectionHeaderRow}>
                      <Calendar size={18} color="#a855f7" strokeWidth={2.5} />
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        {formattedSelectedDate}
                      </Text>
                    </View>

                    {dailyLogs.length < 2 ? (
                      <View style={{ gap: 14 }}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                          Añadir nueva toma ({dailyLogs.length + 1} de 2)
                        </Text>

                        {/* Input Box Liquid Glass */}
                        <View
                          style={[
                            styles.inputWrapper,
                            {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.95)',
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)',
                            },
                          ]}
                        >
                          <TextInput
                            value={grams}
                            onChangeText={setGrams}
                            keyboardType="numeric"
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Ej: 5.0"
                            placeholderTextColor={colors.textMuted}
                            editable={!isSubmitting}
                          />
                          <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>gramos</Text>
                        </View>

                        {/* Presets Chips Liquid Glass */}
                        <View style={styles.presetsRow}>
                          {['3', '5', '7', '10'].map(val => {
                            const isSelected = grams === val;
                            return (
                              <TouchableOpacity
                                key={val}
                                onPress={() => {
                                  try {
                                    Haptics.selectionAsync();
                                  } catch {}
                                  setGrams(val);
                                }}
                                style={[
                                  styles.presetChip,
                                  {
                                    borderColor: isSelected
                                      ? '#a855f7'
                                      : isDark
                                      ? 'rgba(255, 255, 255, 0.16)'
                                      : 'rgba(0, 0, 0, 0.1)',
                                    backgroundColor: isSelected
                                      ? '#a855f7'
                                      : isDark
                                      ? 'rgba(255, 255, 255, 0.07)'
                                      : 'rgba(0, 0, 0, 0.04)',
                                  },
                                ]}
                                activeOpacity={0.75}
                              >
                                <Text
                                  style={[
                                    styles.presetChipText,
                                    {
                                      color: isSelected ? '#ffffff' : colors.text,
                                    },
                                  ]}
                                >
                                  {val}g
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        {/* Action Button Liquid Glass */}
                        <TouchableOpacity
                          onPress={handleAddLog}
                          disabled={isSubmitting || !grams}
                          activeOpacity={0.85}
                          style={[
                            styles.actionBtn,
                            {
                              backgroundColor: '#a855f7',
                              borderColor: 'rgba(255, 255, 255, 0.25)',
                              opacity: isSubmitting || !grams ? 0.45 : 1,
                              shadowColor: '#a855f7',
                              shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: isDark ? 0.45 : 0.25,
                              shadowRadius: 10,
                              elevation: 6,
                            },
                          ]}
                        >
                          {isSubmitting ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <View style={styles.btnContentRow}>
                              <Plus size={19} color="#ffffff" strokeWidth={2.8} />
                              <Text style={[styles.actionBtnText, { color: '#ffffff' }]}>
                                Añadir Toma
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : (
                      /* Límite diario alcanzado */
                      <View
                        style={[
                          styles.dailyLimitBadge,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                          },
                        ]}
                      >
                        <Check size={26} color="#22c55e" strokeWidth={2.5} style={{ marginBottom: 4 }} />
                        <Text style={[styles.dailyLimitTitle, { color: colors.text }]}>
                          Límite diario alcanzado
                        </Text>
                        <Text style={[styles.dailyLimitSubtitle, { color: colors.textMuted }]}>
                          Has registrado las 2 tomas de hoy.
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* 3. HISTORIAL RECIENTE (Identical to Frontend) */}
                  <View
                    style={[
                      styles.sectionCard,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.6)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                  >
                    <GlassView
                      glassEffectStyle="regular"
                      colorScheme={isDark ? 'dark' : 'light'}
                      style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
                    />

                    <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 14 }]}>
                      Historial Reciente
                    </Text>

                    {isLoading ? (
                      <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                        <ActivityIndicator size="small" color="#a855f7" />
                        <Text style={{ marginTop: 8, fontSize: 12, fontWeight: '700', color: colors.textMuted }}>
                          Cargando...
                        </Text>
                      </View>
                    ) : creatinaLogs.length > 0 ? (
                      <View style={{ gap: 10 }}>
                        {paginatedLogs.map((log: any) => (
                          <View
                            key={log.id}
                            style={[
                              styles.historyItem,
                              {
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.85)',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
                              },
                            ]}
                          >
                            <GlassView
                              glassEffectStyle="regular"
                              colorScheme={isDark ? 'dark' : 'light'}
                              style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
                            />

                            {/* Grams Badge */}
                            <View
                              style={[
                                styles.gramsBadge,
                                {
                                  backgroundColor: isDark ? 'rgba(168, 85, 247, 0.22)' : 'rgba(168, 85, 247, 0.14)',
                                  borderColor: isDark ? 'rgba(168, 85, 247, 0.35)' : 'rgba(168, 85, 247, 0.25)',
                                  borderWidth: 1,
                                },
                              ]}
                            >
                              <Text style={[styles.gramsBadgeText, { color: isDark ? '#c084fc' : '#9333ea' }]}>
                                {log.grams}g
                              </Text>
                            </View>

                            {/* Date info */}
                            <View style={styles.historyInfo}>
                              <Text style={[styles.historyDate, { color: colors.text }]}>
                                {formatDateToShort(log.log_date)}
                              </Text>
                              <Text style={[styles.historyWeekday, { color: colors.textSecondary }]}>
                                {formatLogWeekday(log.log_date)}
                              </Text>
                            </View>

                            {/* Actions (Edit & Delete) */}
                            <View style={styles.historyActions}>
                              <TouchableOpacity
                                onPress={() => handleOpenEdit(log)}
                                style={[
                                  styles.historyActionBtn,
                                  {
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                                  },
                                ]}
                                hitSlop={6}
                                activeOpacity={0.7}
                              >
                                <GlassView
                                  glassEffectStyle="regular"
                                  colorScheme={isDark ? 'dark' : 'light'}
                                  style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
                                />
                                <Edit2 size={15} color={colors.text} />
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() => handleDeleteLog(log)}
                                style={[
                                  styles.historyActionBtn,
                                  {
                                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                                    borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                                  },
                                ]}
                                hitSlop={6}
                                activeOpacity={0.7}
                              >
                                <GlassView
                                  glassEffectStyle="regular"
                                  colorScheme={isDark ? 'dark' : 'light'}
                                  style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
                                />
                                <Trash2 size={15} color="#ef4444" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <View
                            style={[
                              styles.paginationRow,
                              {
                                borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                              },
                            ]}
                          >
                            <TouchableOpacity
                              onPress={() => {
                                try {
                                  Haptics.selectionAsync();
                                } catch {}
                                setCurrentPage(p => Math.max(1, p - 1));
                              }}
                              disabled={currentPage === 1}
                              style={[
                                styles.pageBtn,
                                {
                                  opacity: currentPage === 1 ? 0.35 : 1,
                                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.1)',
                                },
                              ]}
                              activeOpacity={0.7}
                            >
                              <ChevronLeft size={18} color={colors.text} />
                            </TouchableOpacity>

                            <Text style={[styles.pageInfoText, { color: colors.textSecondary }]}>
                              {currentPage} / {totalPages}
                            </Text>

                            <TouchableOpacity
                              onPress={() => {
                                try {
                                  Haptics.selectionAsync();
                                } catch {}
                                setCurrentPage(p => Math.min(totalPages, p + 1));
                              }}
                              disabled={currentPage === totalPages}
                              style={[
                                styles.pageBtn,
                                {
                                  opacity: currentPage === totalPages ? 0.35 : 1,
                                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.1)',
                                },
                              ]}
                              activeOpacity={0.7}
                            >
                              <ChevronRight size={18} color={colors.text} />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    ) : (
                      /* Empty state */
                      <View style={styles.emptyContainer}>
                        <Zap size={36} color={colors.textMuted} style={{ opacity: 0.4, marginBottom: 8 }} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No hay registros</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                          ¡Comienza tu seguimiento!
                        </Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </GlassView>
    </Modal>

      {/* 4. MODAL DE EDICIÓN (Liquid Glass) */}
      {showEditModal && editingLog && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={handleCloseEdit}>
          <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={[
                StyleSheet.absoluteFill,
                styles.modalOverlay,
                {
                  backgroundColor: isDark ? 'rgba(0, 0, 0, 0.55)' : 'rgba(255, 255, 255, 0.35)',
                },
              ]}
            >
              <Pressable
                onPress={handleCloseEdit}
                style={StyleSheet.absoluteFill}
              />
              <Pressable
                onPress={e => e.stopPropagation()}
                style={[
                  styles.editModalWrapper,
                  {
                    backgroundColor: colors.card,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
              >
                <GlassView
                  glassEffectStyle="regular"
                  colorScheme={isDark ? 'dark' : 'light'}
                  style={StyleSheet.absoluteFill}
                />

                <View style={styles.editModalContent}>
                  {/* Header */}
                  <View
                    style={[
                      styles.header,
                      {
                        borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                  >
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Editar Registro</Text>
                    <TouchableOpacity
                      onPress={handleCloseEdit}
                      style={[
                        styles.closeBtn,
                        {
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <GlassView
                        glassEffectStyle="regular"
                        colorScheme={isDark ? 'dark' : 'light'}
                        style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
                      />
                      <X size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={{ gap: 14 }}>
                    {/* Fecha (Read-only) */}
                    <View style={{ gap: 6 }}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>FECHA</Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                            opacity: 0.85,
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                          {formatDateForDisplay(editingLog.log_date)}
                        </Text>
                      </View>
                    </View>

                    {/* Gramos de creatina */}
                    <View style={{ gap: 6 }}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                        GRAMOS DE CREATINA
                      </Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
                          },
                        ]}
                      >
                        <TextInput
                          value={editGrams}
                          onChangeText={setEditGrams}
                          keyboardType="numeric"
                          style={[styles.input, { color: colors.text }]}
                          autoFocus
                          editable={!isSubmitting}
                        />
                        <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>gramos</Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.editActionButtons}>
                      <TouchableOpacity
                        onPress={handleCloseEdit}
                        disabled={isSubmitting}
                        style={[
                          styles.editCancelBtn,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
                          },
                        ]}
                        activeOpacity={0.7}
                      >
                        <GlassView
                          glassEffectStyle="regular"
                          colorScheme={isDark ? 'dark' : 'light'}
                          style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
                        />
                        <Text style={[styles.editCancelText, { color: colors.text }]}>Cancelar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleSaveEdit}
                        disabled={isSubmitting || !editGrams}
                        style={[
                          styles.editSaveBtn,
                          {
                            backgroundColor: '#a855f7',
                            borderColor: 'rgba(255, 255, 255, 0.25)',
                            opacity: isSubmitting || !editGrams ? 0.45 : 1,
                            shadowColor: '#a855f7',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: isDark ? 0.45 : 0.25,
                            shadowRadius: 10,
                            elevation: 6,
                          },
                        ]}
                        activeOpacity={0.85}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <View style={styles.btnContentRow}>
                            <Save size={16} color="#ffffff" strokeWidth={2.5} />
                            <Text style={[styles.actionBtnText, { color: '#ffffff' }]}>
                              Guardar Cambios
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Pressable>
            </KeyboardAvoidingView>
          </GlassView>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 440,
    height: '86%',
    maxHeight: 740,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
  },
  card: {
    flex: 1,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 14,
    flexShrink: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  headerIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionCard: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  input: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  inputUnit: {
    fontSize: 13,
    fontWeight: '700',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipText: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionBtn: {
    height: 52,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  dailyLimitBadge: {
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  dailyLimitTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  dailyLimitSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  gramsBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  gramsBadgeText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#a855f7',
  },
  historyInfo: {
    flex: 1,
    gap: 2,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '800',
  },
  historyWeekday: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  historyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  pageInfoText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  editModalWrapper: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  editModalContent: {
    padding: 20,
  },
  editActionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  editCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  editCancelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  editSaveBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
});
