import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { X, Droplets, Plus, Minus, GlassWater } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastTextColor } from '@/utils/colorUtils';

interface WaterLogModalProps {
  visible: boolean;
  initialQuantity?: number;
  isLoading?: boolean;
  onClose: () => void;
  onSave: (quantity_ml: number) => void;
}

export const WaterLogModal: React.FC<WaterLogModalProps> = ({
  visible,
  initialQuantity = 0,
  isLoading = false,
  onClose,
  onSave,
}) => {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const [quantity, setQuantity] = useState(initialQuantity);
  const [mode, setMode] = useState<'ml' | 'glasses'>('ml');

  const glasses = useMemo(() => Math.floor(quantity / 250), [quantity]);
  const glassSize = 250;

  const handleAdjustMl = (amount: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setQuantity(prev => Math.max(0, prev + amount));
  };

  const handleAdjustGlasses = (amount: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setQuantity(prev => Math.max(0, prev + amount * glassSize));
  };

  const handleSave = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onSave(quantity);
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
          <Pressable
            onPress={e => e.stopPropagation()}
            style={[
              styles.cardWrapper,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.08)',
                borderWidth: 1,
              },
            ]}
          >
            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.card}>
              {/* Close Button (Liquid Glass) */}
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={[
                  styles.closeButton,
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

              {/* Icon badge (Liquid Glass) */}
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                    borderColor: isDark ? 'rgba(59, 130, 246, 0.35)' : 'rgba(59, 130, 246, 0.25)',
                  },
                ]}
              >
                <GlassView
                  glassEffectStyle="regular"
                  colorScheme={isDark ? 'dark' : 'light'}
                  style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
                />
                <Droplets size={32} color="#3b82f6" strokeWidth={1.8} />
              </View>

              <Text style={[styles.title, { color: colors.text }]}>Registro de Agua</Text>

              {/* Mode Switcher (Liquid Glass Capsule) */}
              <View
                style={[
                  styles.modeSwitcher,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
              >
                <GlassView
                  glassEffectStyle="regular"
                  colorScheme={isDark ? 'dark' : 'light'}
                  style={[StyleSheet.absoluteFill, { borderRadius: 9999 }]}
                />
                <TouchableOpacity
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                    setMode('ml');
                  }}
                  style={[
                    styles.modeBtn,
                    mode === 'ml' && {
                      backgroundColor: colors.tint,
                      shadowColor: colors.tint,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.35,
                      shadowRadius: 5,
                      elevation: 3,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.modeBtnText,
                      { color: mode === 'ml' ? getContrastTextColor(colors.tint) : colors.textSecondary },
                    ]}
                  >
                    Mililitros
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                    setMode('glasses');
                  }}
                  style={[
                    styles.modeBtn,
                    mode === 'glasses' && {
                      backgroundColor: colors.tint,
                      shadowColor: colors.tint,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.35,
                      shadowRadius: 5,
                      elevation: 3,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.modeBtnText,
                      { color: mode === 'glasses' ? getContrastTextColor(colors.tint) : colors.textSecondary },
                    ]}
                  >
                    Vasos
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Main Adjuster Row (Liquid Glass Buttons) */}
              <View style={styles.counterRow}>
                <TouchableOpacity
                  onPress={() => (mode === 'ml' ? handleAdjustMl(-250) : handleAdjustGlasses(-1))}
                  style={[
                    styles.adjustCircle,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <GlassView
                    glassEffectStyle="regular"
                    colorScheme={isDark ? 'dark' : 'light'}
                    style={[StyleSheet.absoluteFill, { borderRadius: 25 }]}
                  />
                  <Minus size={22} color={colors.text} strokeWidth={2.5} />
                </TouchableOpacity>

                <View style={styles.counterDisplay}>
                  {mode === 'ml' ? (
                    <View style={styles.valWithUnit}>
                      <Text style={[styles.mainNum, { color: colors.text }]}>{quantity}</Text>
                      <Text style={[styles.unitLabel, { color: colors.textMuted }]}>ml</Text>
                    </View>
                  ) : (
                    <View style={styles.valWithUnit}>
                      <Text style={[styles.mainNum, { color: colors.text }]}>{glasses}</Text>
                      <Text style={[styles.unitLabel, { color: colors.textMuted }]}>
                        {glasses === 1 ? 'vaso' : 'vasos'}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => (mode === 'ml' ? handleAdjustMl(250) : handleAdjustGlasses(1))}
                  style={[
                    styles.adjustCircle,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <GlassView
                    glassEffectStyle="regular"
                    colorScheme={isDark ? 'dark' : 'light'}
                    style={[StyleSheet.absoluteFill, { borderRadius: 25 }]}
                  />
                  <Plus size={22} color={colors.text} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              {/* Quick Add Presets (Liquid Glass Chips) */}
              <View style={styles.presetsGrid}>
                {mode === 'ml'
                  ? [250, 500, 750].map(amount => (
                      <TouchableOpacity
                        key={amount}
                        onPress={() => handleAdjustMl(amount)}
                        style={[
                          styles.presetBtn,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.6)',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
                          },
                        ]}
                        activeOpacity={0.7}
                      >
                        <GlassView
                          glassEffectStyle="regular"
                          colorScheme={isDark ? 'dark' : 'light'}
                          style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                        />
                        <Text style={[styles.presetText, { color: colors.text }]}>
                          +{amount}
                        </Text>
                      </TouchableOpacity>
                    ))
                  : [1, 2, 3].map(amount => (
                      <TouchableOpacity
                        key={amount}
                        onPress={() => handleAdjustGlasses(amount)}
                        style={[
                          styles.presetBtn,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.6)',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
                          },
                        ]}
                        activeOpacity={0.7}
                      >
                        <GlassView
                          glassEffectStyle="regular"
                          colorScheme={isDark ? 'dark' : 'light'}
                          style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                        />
                        <View style={styles.presetWithIcon}>
                          <Text style={[styles.presetText, { color: colors.text }]}>
                            +{amount}
                          </Text>
                          <GlassWater size={13} color={colors.textSecondary} />
                        </View>
                      </TouchableOpacity>
                    ))}
              </View>

              {/* Save Button (Liquid Glass Action) */}
              <TouchableOpacity
                onPress={handleSave}
                disabled={isLoading}
                activeOpacity={0.75}
                style={[
                  styles.saveBtn,
                  {
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.65)',
                    opacity: isLoading ? 0.6 : 1,
                  },
                ]}
              >
                <GlassView
                  glassEffectStyle="regular"
                  colorScheme={isDark ? 'dark' : 'light'}
                  style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                />
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: colors.tint + (isDark ? '25' : '18'),
                      borderRadius: 20,
                    },
                  ]}
                />
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.tint} />
                ) : (
                  <Text style={[styles.saveBtnText, { color: colors.tint }]}>
                    Guardar Registro
                  </Text>
                )}
              </TouchableOpacity>
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
  },
  card: {
    padding: 24,
    borderRadius: 32,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 14,
    marginTop: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 16,
  },
  modeSwitcher: {
    flexDirection: 'row',
    borderRadius: 9999,
    padding: 3,
    borderWidth: 1,
    marginBottom: 24,
    width: 220,
    overflow: 'hidden',
    position: 'relative',
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 24,
    width: '100%',
  },
  adjustCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  counterDisplay: {
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valWithUnit: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  mainNum: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1,
  },
  unitLabel: {
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  presetsGrid: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 24,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  presetWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  saveBtn: {
    width: '100%',
    height: 52,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
