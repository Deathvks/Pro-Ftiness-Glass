import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Plus, Trash2, Edit2, Utensils, Copy } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { BACKEND_BASE_URL } from '@/services/apiClient';

export interface FoodLogItem {
  id: number;
  description: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fats_g?: number;
  sugars_g?: number;
  sugar_g?: number;
  weight_g?: number;
  meal_type: string;
  image_url?: string;
  [key: string]: any;
}

interface MealSectionProps {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  title: string;
  totalCalories: number;
  logs: FoodLogItem[];
  onAddFood: () => void;
  onEditFood: (log: FoodLogItem) => void;
  onDeleteFood: (log: FoodLogItem) => void;
  onClearMeal: () => void;
  onViewFood: (log: FoodLogItem) => void;
  onCopyMeal?: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
}

export const MealSection: React.FC<MealSectionProps> = ({
  mealType,
  title,
  totalCalories,
  logs,
  onAddFood,
  onEditFood,
  onDeleteFood,
  onClearMeal,
  onViewFood,
  onCopyMeal,
}) => {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const getFullImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BACKEND_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.glassWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              {totalCalories > 0 && (
                <Text style={[styles.kcalTotal, { color: colors.textMuted }]}>
                  ({totalCalories.toLocaleString('es-ES')} kcal)
                </Text>
              )}
            </View>

            <View style={styles.headerActions}>
              {onCopyMeal && (
                <TouchableOpacity
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                    onCopyMeal(mealType);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={[
                    styles.actionIconBtn,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Copy size={15} color={colors.textSecondary} />
                </TouchableOpacity>
              )}

              {logs.length > 1 && (
                <TouchableOpacity
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    } catch {}
                    onClearMeal();
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={[styles.actionIconBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}
                  activeOpacity={0.7}
                >
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  onAddFood();
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[
                  styles.actionIconBtn,
                  {
                    backgroundColor: colors.tint + '18',
                    borderColor: colors.tint + '35',
                    borderWidth: 1,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Plus size={18} color={colors.tint} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Food Items List */}
          {logs.length > 0 ? (
            <View style={styles.list}>
              {logs.map(log => {
                const imgUrl = getFullImageUrl(log.image_url);
                const protein = Math.round(log.protein_g || 0);
                const carbs = Math.round(log.carbs_g || 0);
                const fats = Math.round(log.fats_g || 0);
                const sugars = Math.round(log.sugars_g || log.sugar_g || 0);

                return (
                  <TouchableOpacity
                    key={log.id}
                    onPress={() => {
                      try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      } catch {}
                      onViewFood(log);
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.foodCard,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {/* Image / Thumbnail */}
                    <View
                      style={[
                        styles.thumbContainer,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      {imgUrl ? (
                        <Image
                          source={{ uri: imgUrl }}
                          style={styles.thumbImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Utensils size={18} color={colors.textMuted} />
                      )}
                    </View>

                    {/* Middle Info */}
                    <View style={styles.foodInfo}>
                      <View style={styles.foodTopRow}>
                        <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={1}>
                          {log.description}
                        </Text>
                        <Text style={[styles.foodKcal, { color: colors.tint }]}>
                          {Math.round(log.calories)}{' '}
                          <Text style={[styles.foodKcalUnit, { color: colors.textMuted }]}>kcal</Text>
                        </Text>
                      </View>

                      {/* Macros row */}
                      <View style={styles.macroPillRow}>
                        <View style={styles.macroBadge}>
                          <View style={[styles.macroDot, { backgroundColor: '#ef4444' }]} />
                          <Text style={[styles.macroBadgeText, { color: '#ef4444' }]}>{protein}p</Text>
                        </View>
                        <View style={styles.macroBadge}>
                          <View style={[styles.macroDot, { backgroundColor: '#3b82f6' }]} />
                          <Text style={[styles.macroBadgeText, { color: '#3b82f6' }]}>{carbs}c</Text>
                        </View>
                        <View style={styles.macroBadge}>
                          <View style={[styles.macroDot, { backgroundColor: '#22c55e' }]} />
                          <Text style={[styles.macroBadgeText, { color: '#22c55e' }]}>{fats}g</Text>
                        </View>
                        <View style={styles.macroBadge}>
                          <View style={[styles.macroDot, { backgroundColor: '#ec4899' }]} />
                          <Text style={[styles.macroBadgeText, { color: '#ec4899' }]}>{sugars}a</Text>
                        </View>

                        {log.weight_g ? (
                          <Text style={[styles.weightText, { color: colors.textMuted }]}>
                            {Math.round(log.weight_g)}g
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    {/* Actions: Edit & Delete */}
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        onPress={e => {
                          e.stopPropagation();
                          try {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          } catch {}
                          onEditFood(log);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.itemActionBtn}
                        activeOpacity={0.7}
                      >
                        <Edit2 size={15} color={colors.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={e => {
                          e.stopPropagation();
                          try {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          } catch {}
                          onDeleteFood(log);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.itemActionBtn}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={15} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            /* Empty state */
            <View
              style={[
                styles.emptyBox,
                {
                  borderColor: colors.border,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                },
              ]}
            >
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Sin registros</Text>
              <TouchableOpacity
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  onAddFood();
                }}
                style={[
                  styles.emptyAddBtn,
                  {
                    backgroundColor: colors.tint + '18',
                    borderColor: colors.tint + '30',
                  },
                ]}
                activeOpacity={0.7}
              >
                <Plus size={14} color={colors.tint} />
                <Text style={[styles.emptyAddText, { color: colors.tint }]}>Añadir Comida</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  glassWrapper: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  card: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  kcalTotal: {
    fontSize: 13,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: 10,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  thumbContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  foodInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  foodTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 4,
  },
  foodName: {
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  foodKcal: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  foodKcalUnit: {
    fontSize: 10,
    fontWeight: '500',
  },
  macroPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  macroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  macroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  macroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  weightText: {
    fontSize: 10.5,
    fontWeight: '600',
    marginLeft: 2,
  },
  itemActions: {
    flexDirection: 'column',
    gap: 4,
    paddingLeft: 4,
  },
  itemActionBtn: {
    padding: 4,
  },
  emptyBox: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  emptyAddText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
