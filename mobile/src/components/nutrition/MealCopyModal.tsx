/* mobile/src/components/nutrition/MealCopyModal.tsx */
import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import {
  X,
  Copy,
  Calendar,
  Utensils,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import * as nutritionService from '@/services/nutritionService';
import { BACKEND_BASE_URL } from '@/services/apiClient';
import { FoodLogItem } from './MealSection';

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Snacks',
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

  // Reset state when opening
  useEffect(() => {
    if (visible) {
      setSourceDate(destinationDate);
      setSourceMealType(destinationMealType);
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

  const handleShiftDate = (days: number) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    const d = new Date(sourceDate);
    d.setDate(d.getDate() + days);
    setSourceDate(d.toISOString().split('T')[0]);
  };

  const getFullImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BACKEND_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const isSameSourceAndDest =
    sourceDate === destinationDate && sourceMealType === destinationMealType;

  const handleCopy = async () => {
    if (isCopying || sourceLogs.length === 0 || isSameSourceAndDest) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setIsCopying(true);

    try {
      const results = await Promise.allSettled(
        sourceLogs.map(item =>
          nutritionService.addFoodLog({
            description: item.description,
            calories: item.calories,
            protein_g: item.protein_g,
            carbs_g: item.carbs_g,
            fats_g: item.fats_g,
            sugars_g: item.sugars_g ?? item.sugar_g,
            weight_g: item.weight_g,
            image_url: item.image_url,
            calories_per_100g: item.calories_per_100g,
            protein_per_100g: item.protein_per_100g,
            carbs_per_100g: item.carbs_per_100g,
            fat_per_100g: item.fat_per_100g,
            sugars_per_100g: item.sugars_per_100g,
            log_date: destinationDate,
            meal_type: destinationMealType,
          })
        )
      );

      const successfulCount = results.filter(r => r.status === 'fulfilled').length;

      if (successfulCount > 0) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        await onCopySuccess();
        onClose();
      } else {
        Alert.alert('Error', 'No se pudieron copiar los alimentos.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error al copiar los alimentos.');
    } finally {
      setIsCopying(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => !isCopying && onClose()}
        />

        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? 'rgba(20, 20, 22, 0.96)' : 'rgba(250, 250, 252, 0.98)',
              borderColor: colors.border,
            },
          ]}
        >
          {/* iOS Liquid Glass Effect layer */}
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />

          {/* Grabber */}
          <View style={styles.grabberContainer}>
            <View
              style={[
                styles.grabber,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' },
              ]}
            />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={styles.titleRow}>
                <Copy size={18} color={colors.tint} style={{ marginRight: 6 }} />
                <Text style={[styles.title, { color: colors.text }]}>Copiar Comida</Text>
              </View>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Añadir al {MEAL_LABELS[destinationMealType]?.toLowerCase()} del {destinationDate}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              disabled={isCopying}
              style={[
                styles.closeButton,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
              ]}
              activeOpacity={0.7}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Date Selector */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                COPIAR DESDE LA FECHA:
              </Text>

              <View
                style={[
                  styles.dateRow,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: colors.border,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleShiftDate(-1)}
                  style={styles.arrowBtn}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={20} color={colors.text} />
                </TouchableOpacity>

                <View style={styles.dateInfo}>
                  <Calendar size={16} color={colors.tint} style={{ marginRight: 6 }} />
                  <Text style={[styles.dateText, { color: colors.text }]}>
                    {sourceDate === destinationDate
                      ? `Hoy (${sourceDate})`
                      : sourceDate}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleShiftDate(1)}
                  style={styles.arrowBtn}
                  activeOpacity={0.7}
                >
                  <ChevronRight size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Source Meal Type Selector */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                TIPO DE COMIDA A COPIAR:
              </Text>

              <View style={styles.mealTypesRow}>
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
                      }}
                      style={[
                        styles.mealChip,
                        {
                          backgroundColor: isSelected
                            ? colors.tint + '22'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.03)',
                          borderColor: isSelected ? colors.tint : colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.mealChipText,
                          {
                            color: isSelected ? colors.tint : colors.textSecondary,
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {MEAL_LABELS[key]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Same source and dest warning */}
            {isSameSourceAndDest && (
              <Text style={[styles.warningText, { color: '#f59e0b' }]}>
                Selecciona otra comida o fecha para copiar.
              </Text>
            )}

            {/* 3. Source Items Preview List */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                ALIMENTOS ENCONTRADOS:
              </Text>

              <View
                style={[
                  styles.previewBox,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                    borderColor: colors.border,
                  },
                ]}
              >
                {isLoading ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="small" color={colors.tint} />
                    <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                      Cargando alimentos...
                    </Text>
                  </View>
                ) : sourceLogs.length > 0 ? (
                  <View style={styles.logsList}>
                    <Text style={[styles.countBadge, { color: colors.tint }]}>
                      {sourceLogs.length} alimentos de {MEAL_LABELS[sourceMealType]?.toLowerCase()}
                    </Text>

                    {sourceLogs.map(log => {
                      const img = getFullImageUrl(log.image_url);
                      return (
                        <View
                          key={log.id}
                          style={[
                            styles.logItem,
                            {
                              backgroundColor: isDark
                                ? 'rgba(255, 255, 255, 0.05)'
                                : 'rgba(0, 0, 0, 0.03)',
                              borderColor: colors.border,
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
                                style={styles.itemThumbImg}
                                resizeMode="cover"
                              />
                            ) : (
                              <Utensils size={16} color={colors.textMuted} />
                            )}
                          </View>

                          <View style={styles.itemDetails}>
                            <Text
                              style={[styles.itemTitle, { color: colors.text }]}
                              numberOfLines={1}
                            >
                              {log.description}
                            </Text>
                            <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                              {Math.round(log.calories)} kcal • {Math.round(log.weight_g || 0)}g
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyBox}>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                      No hay alimentos registrados en esa comida y fecha.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              onPress={onClose}
              disabled={isCopying}
              style={[
                styles.cancelButton,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCopy}
              disabled={isCopying || isLoading || sourceLogs.length === 0 || isSameSourceAndDest}
              style={[
                styles.copyButton,
                {
                  backgroundColor:
                    sourceLogs.length > 0 && !isSameSourceAndDest
                      ? colors.tint
                      : isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
              activeOpacity={0.8}
            >
              {isCopying ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Copy size={16} color="#000" strokeWidth={2.5} style={{ marginRight: 6 }} />
                  <Text
                    style={[
                      styles.copyButtonText,
                      {
                        color:
                          sourceLogs.length > 0 && !isSameSourceAndDest
                            ? '#000'
                            : colors.textMuted,
                      },
                    ]}
                  >
                    Copiar {sourceLogs.length > 0 ? sourceLogs.length : ''}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '88%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeButton: {
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
    padding: 18,
    gap: 16,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
  },
  mealTypesRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  mealChip: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealChipText: {
    fontSize: 12,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  previewBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    minHeight: 100,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  logsList: {
    gap: 8,
  },
  countBadge: {
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  itemThumb: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemThumbImg: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  copyButton: {
    flex: 1.4,
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
  copyButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
