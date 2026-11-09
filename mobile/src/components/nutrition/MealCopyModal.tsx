/* mobile/src/components/nutrition/MealCopyModal.tsx */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
} from 'react-native';
import {
  X,
  Copy,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Utensils,
  Check,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { SwipeableBottomSheet } from '@/components/ui/SwipeableBottomSheet';
import * as nutritionService from '@/services/nutritionService';
import { BACKEND_BASE_URL } from '@/services/apiClient';
import { FoodLogItem } from './MealSection';

export const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Snack',
};

const parseLocalDate = (value: string): Date => {
  if (!value) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const toDateValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatSpanishDate = (dateStr: string): string => {
  const d = parseLocalDate(dateStr);
  const months = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
};

interface MealCopyModalProps {
  visible: boolean;
  destinationMealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  destinationDate: string;
  currentDayLogs?: FoodLogItem[];
  onClose: () => void;
  onCopySuccess: () => Promise<void> | void;
}

export const MealCopyModal: React.FC<MealCopyModalProps> = ({
  visible,
  destinationMealType,
  destinationDate,
  currentDayLogs = [],
  onClose,
  onCopySuccess,
}) => {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const [sourceDate, setSourceDate] = useState<string>(destinationDate);
  const [sourceMealType, setSourceMealType] = useState<string>(destinationMealType);
  const [sourceLogs, setSourceLogs] = useState<FoodLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopying, setIsCopying] = useState<boolean>(false);

  // Pickers toggle
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [isMealSelectOpen, setIsMealSelectOpen] = useState<boolean>(false);

  // Month navigation for date picker
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => {
    const d = parseLocalDate(destinationDate);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Reset state when opening
  useEffect(() => {
    if (visible) {
      setSourceDate(destinationDate);
      setSourceMealType(destinationMealType);
      setIsDatePickerOpen(false);
      setIsMealSelectOpen(false);
      const d = parseLocalDate(destinationDate);
      setVisibleMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [visible, destinationDate, destinationMealType]);

  // Load source logs
  useEffect(() => {
    if (!visible) return;

    if (sourceDate === destinationDate) {
      const filtered = currentDayLogs.filter(item => item.meal_type === sourceMealType);
      setSourceLogs(filtered);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setSourceLogs([]);

    nutritionService
      .getNutritionLogsByDate(sourceDate)
      .then(data => {
        if (!isMounted) return;
        const list = Array.isArray(data?.nutrition) ? data.nutrition : [];
        setSourceLogs(list.filter((item: any) => item.meal_type === sourceMealType));
      })
      .catch(err => {
        if (!isMounted) return;
        console.warn('Error fetching source meal logs', err);
        setSourceLogs([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [visible, sourceDate, sourceMealType, destinationDate, currentDayLogs]);

  // Calendar calculations
  const maxDateObj = useMemo(() => parseLocalDate(destinationDate), [destinationDate]);

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Monday as first day: (getDay() + 6) % 7
    const leadingDays = (new Date(year, month, 1).getDay() + 6) % 7;
    const items: { key: string; date: Date | null }[] = [];

    for (let i = 0; i < leadingDays; i++) {
      items.push({ key: `empty-${i}`, date: null });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      items.push({ key: toDateValue(d), date: d });
    }
    return items;
  }, [visibleMonth]);

  const monthLabel = useMemo(() => {
    const months = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    return `${months[visibleMonth.getMonth()]} ${visibleMonth.getFullYear()}`;
  }, [visibleMonth]);

  const moveMonth = (amount: number) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const isAfterMaxMonth = useMemo(() => {
    return (
      visibleMonth.getFullYear() > maxDateObj.getFullYear() ||
      (visibleMonth.getFullYear() === maxDateObj.getFullYear() &&
        visibleMonth.getMonth() >= maxDateObj.getMonth())
    );
  }, [visibleMonth, maxDateObj]);

  const getFullImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BACKEND_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const isSameSourceAndDest =
    sourceDate === destinationDate && sourceMealType === destinationMealType;

  // Quick select helper
  const handleSelectQuickDate = (daysAgo: number) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    const d = parseLocalDate(destinationDate);
    d.setDate(d.getDate() - daysAgo);
    const dateStr = toDateValue(d);
    setSourceDate(dateStr);
    setVisibleMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setIsDatePickerOpen(false);
  };

  const handleCopy = async () => {
    if (
      isCopying ||
      isLoading ||
      sourceLogs.length === 0 ||
      isSameSourceAndDest
    ) {
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setIsCopying(true);

    try {
      const responses = await Promise.allSettled(
        sourceLogs.map(log =>
          nutritionService.addFoodLog({
            description: log.description,
            calories: log.calories,
            protein_g: log.protein_g,
            carbs_g: log.carbs_g,
            fats_g: log.fats_g,
            sugars_g: log.sugars_g ?? log.sugar_g,
            weight_g: log.weight_g,
            image_url: log.image_url,
            micronutrients: log.micronutrients,
            calories_per_100g: log.calories_per_100g,
            protein_per_100g: log.protein_per_100g,
            carbs_per_100g: log.carbs_per_100g,
            fat_per_100g: log.fat_per_100g,
            sugars_per_100g: log.sugars_per_100g,
            log_date: destinationDate,
            meal_type: destinationMealType,
          })
        )
      );

      const copiedCount = responses.filter(r => r.status === 'fulfilled').length;

      if (copiedCount > 0) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        await onCopySuccess();
        const destinationName =
          MEAL_TYPE_LABELS[destinationMealType]?.toLowerCase() || destinationMealType;
        Alert.alert(
          'Comida copiada',
          copiedCount === sourceLogs.length
            ? `Se copiaron ${copiedCount} alimentos al ${destinationName}.`
            : `Se copiaron ${copiedCount} de ${sourceLogs.length} alimentos al ${destinationName}.`
        );
        onClose();
      } else {
        Alert.alert('Error', 'No se pudieron copiar los alimentos.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudieron copiar los alimentos.');
    } finally {
      setIsCopying(false);
    }
  };

  if (!visible) return null;

  const destinationName =
    MEAL_TYPE_LABELS[destinationMealType]?.toLowerCase() || destinationMealType;
  const sourceMealName =
    MEAL_TYPE_LABELS[sourceMealType]?.toLowerCase() || sourceMealType;

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={() => !isCopying && onClose()}
      isDark={isDark}
      backgroundColor={colors.card}
      maxHeight="90%"
    >
      <View style={{ paddingBottom: 12 }}>
          {/* Header (Matching frontend 1:1) */}
          <View style={styles.header}>
            <View style={styles.headerTextGroup}>
              <Text style={[styles.title, { color: colors.text }]}>Copiar comida</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Añade los alimentos a {destinationName} del {destinationDate}.
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={isCopying}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
              ]}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Selector de Fecha con Calendario Desplegable */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Copiar desde la fecha
              </Text>

              {/* Trigger Button */}
              <TouchableOpacity
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  setIsDatePickerOpen(prev => !prev);
                  setIsMealSelectOpen(false);
                }}
                activeOpacity={0.75}
                style={[
                  styles.triggerBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                    borderColor: isDatePickerOpen ? colors.tint : colors.border,
                  },
                ]}
              >
                <View style={styles.triggerLeft}>
                  <CalendarDays size={18} color={colors.tint} />
                  <Text style={[styles.triggerText, { color: colors.text }]}>
                    {formatSpanishDate(sourceDate)}
                  </Text>
                </View>
                <ChevronDown
                  size={16}
                  color={colors.textSecondary}
                  style={isDatePickerOpen ? { transform: [{ rotate: '180deg' }] } : undefined}
                />
              </TouchableOpacity>

              {/* Quick Date Pills */}
              <View style={styles.quickPillsRow}>
                {[
                  { label: 'Hoy', days: 0 },
                  { label: 'Ayer', days: 1 },
                  { label: '-2 días', days: 2 },
                  { label: '-3 días', days: 3 },
                  { label: '-7 días', days: 7 },
                ].map(pill => {
                  const pillDateObj = parseLocalDate(destinationDate);
                  pillDateObj.setDate(pillDateObj.getDate() - pill.days);
                  const pillDateStr = toDateValue(pillDateObj);
                  const isPillActive = sourceDate === pillDateStr;

                  return (
                    <TouchableOpacity
                      key={pill.label}
                      onPress={() => handleSelectQuickDate(pill.days)}
                      style={[
                        styles.quickPill,
                        {
                          backgroundColor: isPillActive
                            ? colors.tint + '22'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.03)',
                          borderColor: isPillActive ? colors.tint : colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.quickPillText,
                          {
                            color: isPillActive ? colors.tint : colors.textSecondary,
                            fontWeight: isPillActive ? '800' : '600',
                          },
                        ]}
                      >
                        {pill.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Calendario Mensual Desplegable */}
              {isDatePickerOpen && (
                <View
                  style={[
                    styles.calendarPopup,
                    {
                      backgroundColor: isDark ? 'rgba(30, 30, 34, 0.98)' : 'rgba(250, 250, 252, 0.98)',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {/* Mes / Año + Flechas */}
                  <View style={styles.monthHeaderRow}>
                    <TouchableOpacity
                      onPress={() => moveMonth(-1)}
                      style={styles.monthArrow}
                      activeOpacity={0.7}
                    >
                      <ChevronLeft size={20} color={colors.text} />
                    </TouchableOpacity>

                    <Text style={[styles.monthLabelText, { color: colors.text }]}>
                      {monthLabel}
                    </Text>

                    <TouchableOpacity
                      onPress={() => moveMonth(1)}
                      disabled={isAfterMaxMonth}
                      style={[styles.monthArrow, isAfterMaxMonth && { opacity: 0.3 }]}
                      activeOpacity={0.7}
                    >
                      <ChevronRight size={20} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  {/* Días de la semana */}
                  <View style={styles.weekDaysRow}>
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
                      <Text key={i} style={[styles.weekDayText, { color: colors.textMuted }]}>
                        {d}
                      </Text>
                    ))}
                  </View>

                  {/* Grid de días */}
                  <View style={styles.daysGrid}>
                    {calendarDays.map(item => {
                      if (!item.date) {
                        return <View key={item.key} style={styles.dayCellEmpty} />;
                      }

                      const dateVal = toDateValue(item.date);
                      const isSelected = dateVal === sourceDate;
                      const isFuture = item.date.getTime() > maxDateObj.getTime();

                      return (
                        <TouchableOpacity
                          key={item.key}
                          disabled={isFuture}
                          onPress={() => {
                            try {
                              Haptics.selectionAsync();
                            } catch {}
                            setSourceDate(dateVal);
                            setIsDatePickerOpen(false);
                          }}
                          style={[
                            styles.dayCell,
                            isSelected && { backgroundColor: colors.tint },
                            isFuture && { opacity: 0.25 },
                          ]}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dayCellText,
                              {
                                color: isSelected
                                  ? '#000'
                                  : isFuture
                                  ? colors.textMuted
                                  : colors.text,
                                fontWeight: isSelected ? '900' : '600',
                              },
                            ]}
                          >
                            {item.date.getDate()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* 2. Selector de Tipo de Comida (CustomSelect) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Tipo de comida que quieres copiar
              </Text>

              <TouchableOpacity
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  setIsMealSelectOpen(prev => !prev);
                  setIsDatePickerOpen(false);
                }}
                activeOpacity={0.75}
                style={[
                  styles.triggerBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                    borderColor: isMealSelectOpen ? colors.tint : colors.border,
                  },
                ]}
              >
                <View style={styles.triggerLeft}>
                  <Utensils size={18} color={colors.tint} />
                  <Text style={[styles.triggerText, { color: colors.text }]}>
                    {MEAL_TYPE_LABELS[sourceMealType]}
                  </Text>
                </View>
                <ChevronDown
                  size={16}
                  color={colors.textSecondary}
                  style={isMealSelectOpen ? { transform: [{ rotate: '180deg' }] } : undefined}
                />
              </TouchableOpacity>

              {/* Dropdown Options */}
              {isMealSelectOpen && (
                <View
                  style={[
                    styles.selectPopup,
                    {
                      backgroundColor: isDark ? 'rgba(30, 30, 34, 0.98)' : 'rgba(250, 250, 252, 0.98)',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(key => {
                    const isSelected = sourceMealType === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        onPress={() => {
                          try {
                            Haptics.selectionAsync();
                          } catch {}
                          setSourceMealType(key);
                          setIsMealSelectOpen(false);
                        }}
                        style={[
                          styles.selectOption,
                          isSelected && {
                            backgroundColor: colors.tint + '18',
                          },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.selectOptionText,
                            {
                              color: isSelected ? colors.tint : colors.text,
                              fontWeight: isSelected ? '800' : '600',
                            },
                          ]}
                        >
                          {MEAL_TYPE_LABELS[key]}
                        </Text>
                        {isSelected && <Check size={16} color={colors.tint} strokeWidth={2.5} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Aviso si origen y destino son idénticos */}
            {isSameSourceAndDest && (
              <Text style={styles.sameWarningText}>
                Selecciona otra fecha o tipo de comida para realizar la copia.
              </Text>
            )}

            {/* 3. Preview Box (Matching Frontend: rounded-[16px] bg-black/5 dark:bg-white/5 p-3 min-h-14) */}
            <View
              style={[
                styles.previewBox,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: colors.border,
                },
              ]}
            >
              {isLoading ? (
                <View style={styles.spinnerWrap}>
                  <ActivityIndicator size="small" color={colors.tint} />
                </View>
              ) : sourceLogs.length > 0 ? (
                <View style={styles.logsContainer}>
                  <Text style={[styles.previewCountTitle, { color: colors.text }]}>
                    {sourceLogs.length} alimentos de {sourceMealName}
                  </Text>

                  <View style={styles.logsScrollList}>
                    {sourceLogs.map(log => {
                      const img = getFullImageUrl(log.image_url);
                      return (
                        <View
                          key={log.id}
                          style={[
                            styles.previewItemRow,
                            {
                              backgroundColor: isDark
                                ? 'rgba(255, 255, 255, 0.06)'
                                : 'rgba(0, 0, 0, 0.03)',
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.itemThumb,
                              {
                                backgroundColor: isDark
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : 'rgba(0, 0, 0, 0.05)',
                              },
                            ]}
                          >
                            {img ? (
                              <Image
                                source={{ uri: img }}
                                style={styles.thumbImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <Utensils size={18} color={colors.textMuted} />
                            )}
                          </View>

                          <View style={styles.itemInfo}>
                            <Text
                              style={[styles.itemTitle, { color: colors.text }]}
                              numberOfLines={1}
                            >
                              {log.description}
                            </Text>
                            <Text style={[styles.itemKcal, { color: colors.textSecondary }]}>
                              {Math.round(log.calories || 0)} kcal
                              {log.weight_g ? ` • ${Math.round(log.weight_g)}g` : ''}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <Text style={[styles.emptyPreviewText, { color: colors.textMuted }]}>
                  No hay alimentos de ese tipo en esa fecha.
                </Text>
              )}
            </View>
          </ScrollView>

          {/* 4. Footer Buttons (Matching Frontend: flex gap-3 mt-5) */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              onPress={onClose}
              disabled={isCopying}
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCopy}
              disabled={
                isCopying ||
                isLoading ||
                sourceLogs.length === 0 ||
                isSameSourceAndDest
              }
              style={[
                styles.copyBtn,
                {
                  backgroundColor: colors.tint,
                  opacity:
                    isCopying ||
                    isLoading ||
                    sourceLogs.length === 0 ||
                    isSameSourceAndDest
                      ? 0.5
                      : 1,
                },
              ]}
              activeOpacity={0.8}
            >
              {isCopying ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Copy size={16} color="#000" strokeWidth={2.5} style={{ marginRight: 6 }} />
                  <Text style={styles.copyBtnText}>
                    Copiar {sourceLogs.length > 0 ? sourceLogs.length : ''}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
      </View>
    </SwipeableBottomSheet>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '90%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 24,
  },
  grabberContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerTextGroup: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
    lineHeight: 18,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  triggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  quickPill: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickPillText: {
    fontSize: 11,
  },
  calendarPopup: {
    marginTop: 8,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  monthArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabelText: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  weekDayText: {
    width: 32,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 36,
  },
  dayCellText: {
    fontSize: 13,
  },
  selectPopup: {
    marginTop: 6,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectOptionText: {
    fontSize: 13.5,
  },
  sameWarningText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#f59e0b',
    textAlign: 'center',
  },
  previewBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    minHeight: 64,
    justifyContent: 'center',
  },
  spinnerWrap: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logsContainer: {
    gap: 8,
  },
  previewCountTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  logsScrollList: {
    maxHeight: 180,
    gap: 6,
  },
  previewItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    gap: 10,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  itemKcal: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  emptyPreviewText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 6,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  copyBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000',
  },
});
