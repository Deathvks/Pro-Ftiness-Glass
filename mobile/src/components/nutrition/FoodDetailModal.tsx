import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Image,
  ScrollView,
} from 'react-native';
import { X, Beef, Wheat, Salad, IceCream, Scale, Utensils } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { BACKEND_BASE_URL } from '@/services/apiClient';

interface FoodDetailModalProps {
  visible: boolean;
  food: any;
  onClose: () => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({
  visible,
  food,
  onClose,
}) => {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  if (!food) return null;

  const getFullImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BACKEND_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const imgUrl = getFullImageUrl(food.image_url);

  const protein = Number(food.protein_g || food.protein || 0).toFixed(1).replace(/\.0$/, '');
  const carbs = Number(food.carbs_g || food.carbs || 0).toFixed(1).replace(/\.0$/, '');
  const fats = Number(food.fats_g || food.fat || food.fats || 0).toFixed(1).replace(/\.0$/, '');
  const sugars = Number(food.sugars_g || food.sugar_g || food.sugars || 0).toFixed(1).replace(/\.0$/, '');

  const handleClose = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill}>
        <Pressable
          style={[
            StyleSheet.absoluteFill,
            {
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.25)',
            },
          ]}
          onPress={onClose}
        >
          <Pressable onPress={e => e.stopPropagation()} style={[styles.cardWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.card}>
              {/* Image banner */}
              <View
                style={[
                  styles.imageHeader,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                    borderColor: colors.border,
                  },
                ]}
              >
                {imgUrl ? (
                  <Image source={{ uri: imgUrl }} style={styles.bannerImage} resizeMode="contain" />
                ) : (
                  <Utensils size={54} color={colors.textMuted} />
                )}

                <TouchableOpacity
                  onPress={handleClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={[
                    styles.closeBtn,
                    {
                      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <X size={18} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Title & Calories / Weight */}
              <ScrollView style={styles.scrollContent} contentContainerStyle={{ padding: 20 }}>
                <Text style={[styles.foodTitle, { color: colors.text }]}>{food.description || food.name}</Text>

                <View
                  style={[
                    styles.summaryRow,
                    {
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View>
                    <Text style={[styles.subText, { color: colors.textSecondary }]}>CALORÍAS</Text>
                    <Text style={[styles.caloriesVal, { color: colors.tint }]}>
                      {Math.round(food.calories)}{' '}
                      <Text style={[styles.caloriesUnit, { color: colors.textMuted }]}>kcal</Text>
                    </Text>
                  </View>

                  {food.weight_g ? (
                    <View style={styles.weightCol}>
                      <View style={styles.weightLabelRow}>
                        <Scale size={13} color={colors.textSecondary} />
                        <Text style={[styles.subText, { color: colors.textSecondary }]}>PESO</Text>
                      </View>
                      <Text style={[styles.weightVal, { color: colors.text }]}>{Math.round(food.weight_g)}g</Text>
                    </View>
                  ) : null}
                </View>

                {/* Macro cards grid */}
                <Text style={[styles.macrosTitle, { color: colors.textSecondary }]}>MACRONUTRIENTES</Text>

                <View style={styles.macroGrid}>
                  {/* Proteínas */}
                  <View
                    style={[
                      styles.macroCard,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={[styles.macroIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                      <Beef size={18} color="#ef4444" />
                    </View>
                    <Text style={[styles.macroGrams, { color: '#ef4444' }]}>{protein}g</Text>
                    <Text style={[styles.macroName, { color: colors.textSecondary }]}>Proteínas</Text>
                  </View>

                  {/* Carbos */}
                  <View
                    style={[
                      styles.macroCard,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={[styles.macroIconBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                      <Wheat size={18} color="#3b82f6" />
                    </View>
                    <Text style={[styles.macroGrams, { color: '#3b82f6' }]}>{carbs}g</Text>
                    <Text style={[styles.macroName, { color: colors.textSecondary }]}>Carbos</Text>
                  </View>

                  {/* Grasas */}
                  <View
                    style={[
                      styles.macroCard,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={[styles.macroIconBadge, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                      <Salad size={18} color="#22c55e" />
                    </View>
                    <Text style={[styles.macroGrams, { color: '#22c55e' }]}>{fats}g</Text>
                    <Text style={[styles.macroName, { color: colors.textSecondary }]}>Grasas</Text>
                  </View>

                  {/* Azúcar */}
                  <View
                    style={[
                      styles.macroCard,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={[styles.macroIconBadge, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                      <IceCream size={18} color="#ec4899" />
                    </View>
                    <Text style={[styles.macroGrams, { color: '#ec4899' }]}>{sugars}g</Text>
                    <Text style={[styles.macroName, { color: colors.textSecondary }]}>Azúcar</Text>
                  </View>
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  onPress={handleClose}
                  style={[
                    styles.bottomCloseBtn,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                      borderColor: colors.border,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.bottomCloseText, { color: colors.text }]}>Cerrar</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </GlassView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 32,
    overflow: 'hidden',
    maxHeight: '88%',
  },
  card: {
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageHeader: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottomWidth: 1,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    maxHeight: 400,
  },
  foodTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  subText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  caloriesVal: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  caloriesUnit: {
    fontSize: 14,
    fontWeight: '600',
  },
  weightCol: {
    alignItems: 'flex-end',
  },
  weightLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  weightVal: {
    fontSize: 22,
    fontWeight: '800',
  },
  macrosTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  macroCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
  },
  macroIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  macroGrams: {
    fontSize: 14,
    fontWeight: '800',
  },
  macroName: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bottomCloseBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCloseText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
