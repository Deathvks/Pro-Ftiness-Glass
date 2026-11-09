import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { X, Droplets, Plus, Minus, GlassWater } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastTextColor } from '@/utils/colorUtils';
import { SwipeableBottomSheet, getAppleSheetCardStyle } from '@/components/ui/SwipeableBottomSheet';

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
  const isIOS = Platform.OS === 'ios';

  const [quantity, setQuantity] = useState(initialQuantity);
  const [mode, setMode] = useState<'ml' | 'glasses'>('ml');

  useEffect(() => {
    if (visible) {
      setQuantity(initialQuantity);
    }
  }, [visible, initialQuantity]);

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
    <SwipeableBottomSheet
      visible={visible}
      onClose={onClose}
      isDark={isDark}
      backgroundColor={colors.card}
    >
      <View style={styles.card}>
        {/* Close Button */}
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[
            styles.closeButton,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
          activeOpacity={0.7}
        >
          <X size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Icon badge */}
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.16)' : 'rgba(59, 130, 246, 0.12)',
              borderColor: isDark ? 'rgba(59, 130, 246, 0.35)' : 'rgba(59, 130, 246, 0.25)',
              borderWidth: isIOS ? 0 : 1.5,
            },
          ]}
        >
          <Droplets size={30} color="#3b82f6" strokeWidth={2} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Registro de Agua</Text>

        {/* Mode Switcher */}
        <View
          style={[
            styles.modeSwitcher,
            {
              backgroundColor: isIOS
                ? isDark
                  ? 'rgba(118, 118, 128, 0.24)'
                  : 'rgba(118, 118, 128, 0.12)'
                : isDark
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(0, 0, 0, 0.04)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
              borderWidth: isIOS ? 0 : 1,
            },
          ]}
        >
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
                backgroundColor: isIOS ? (isDark ? '#636366' : '#FFFFFF') : colors.tint,
              },
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.modeBtnText,
                {
                  color:
                    mode === 'ml'
                      ? isIOS
                        ? colors.text
                        : getContrastTextColor(colors.tint)
                      : colors.textSecondary,
                },
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
                backgroundColor: isIOS ? (isDark ? '#636366' : '#FFFFFF') : colors.tint,
              },
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.modeBtnText,
                {
                  color:
                    mode === 'glasses'
                      ? isIOS
                        ? colors.text
                        : getContrastTextColor(colors.tint)
                      : colors.textSecondary,
                },
              ]}
            >
              Vasos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Adjuster Row */}
        <View style={styles.counterRow}>
          <TouchableOpacity
            onPress={() => (mode === 'ml' ? handleAdjustMl(-250) : handleAdjustGlasses(-1))}
            style={[
              styles.adjustCircle,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                borderWidth: isIOS ? 0 : 1,
              },
              getAppleSheetCardStyle(isDark, 25),
            ]}
            activeOpacity={0.7}
          >
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
                borderWidth: isIOS ? 0 : 1,
              },
              getAppleSheetCardStyle(isDark, 25),
            ]}
            activeOpacity={0.7}
          >
            <Plus size={22} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Quick Add Presets */}
        <View style={styles.presetsGrid}>
          {mode === 'ml'
            ? [250, 500, 750].map(amount => (
                <TouchableOpacity
                  key={amount}
                  onPress={() => handleAdjustMl(amount)}
                  style={[
                    styles.presetBtn,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(255, 255, 255, 0.6)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
                      borderWidth: isIOS ? 0 : 1,
                    },
                    getAppleSheetCardStyle(isDark, 14),
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetText, { color: colors.text }]}>+{amount}</Text>
                </TouchableOpacity>
              ))
            : [1, 2, 3].map(amount => (
                <TouchableOpacity
                  key={amount}
                  onPress={() => handleAdjustGlasses(amount)}
                  style={[
                    styles.presetBtn,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(255, 255, 255, 0.6)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
                      borderWidth: isIOS ? 0 : 1,
                    },
                    getAppleSheetCardStyle(isDark, 14),
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.presetWithIcon}>
                    <Text style={[styles.presetText, { color: colors.text }]}>+{amount}</Text>
                    <GlassWater size={13} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading}
          activeOpacity={0.8}
          style={[
            styles.saveBtn,
            {
              backgroundColor: colors.tint,
              opacity: isLoading ? 0.6 : 1,
            },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={getContrastTextColor(colors.tint)} />
          ) : (
            <Text style={[styles.saveBtnText, { color: getContrastTextColor(colors.tint) }]}>
              Guardar Registro
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SwipeableBottomSheet>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 12,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 6,
    right: 20,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  title: {
    fontSize: 21,
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    letterSpacing: -0.4,
    marginBottom: 16,
  },
  modeSwitcher: {
    flexDirection: 'row',
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 3,
    marginBottom: 24,
    width: 220,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderCurve: 'continuous',
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
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '800',
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
    marginBottom: 22,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
