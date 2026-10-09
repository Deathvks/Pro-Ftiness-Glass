import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Plus, Trash2, Edit2, Utensils } from 'lucide-react-native';
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
      <View style={styles.glassWrapper}>
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.card,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.4)',
            },
          ]}
        >
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
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.65)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                      },
                    ]}
                  >
                    {/* Image / Thumbnail */}
                    <View
                      style={[
                        styles.thumbContainer,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
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
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.3)',
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
    borderRadius: 26,
    overflow: 'hidden',
  },
  card: {
    padding: 16,
    borderRadius: 26,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  kcalTotal: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    gap: 10,
  },
  thumbContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  foodInfo: {
    flex: 1,
    gap: 4,
  },
  foodTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  foodKcal: {
    fontSize: 13,
    fontWeight: '800',
  },
  foodKcalUnit: {
    fontSize: 10,
    fontWeight: '500',
  },
  macroPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  macroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  macroDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  macroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  weightText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyAddText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
