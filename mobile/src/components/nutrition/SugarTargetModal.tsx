import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { X, IceCream, AlertTriangle, Info } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';

interface SugarTargetModalProps {
  visible: boolean;
  currentSugar: number;
  maxSugar: number;
  onClose: () => void;
}

export const SugarTargetModal: React.FC<SugarTargetModalProps> = ({
  visible,
  currentSugar,
  maxSugar,
  onClose,
}) => {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const percentage = maxSugar > 0 ? Math.min(100, Math.max(0, (currentSugar / maxSugar) * 100)) : 0;
  const isOverLimit = currentSugar >= maxSugar;

  const themeColor = isOverLimit ? '#ef4444' : '#ec4899';

  // SVG Ring calculation
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (percentage / 100) * circumference;

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
          <Pressable
            onPress={e => e.stopPropagation()}
            style={[
              styles.cardWrapper,
              {
                backgroundColor: colors.card,
                borderColor: isOverLimit ? '#ef4444' : colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isOverLimit ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                },
              ]}
            >
              {/* Close Button */}
              <TouchableOpacity
                onPress={handleClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
                activeOpacity={0.7}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Title Header */}
              <View style={styles.titleRow}>
                {isOverLimit ? (
                  <AlertTriangle size={24} color="#ef4444" />
                ) : (
                  <IceCream size={24} color="#ec4899" />
                )}
                <Text style={[styles.title, { color: themeColor }]}>Objetivo de Azúcar</Text>
              </View>

              {/* Circular Ring Gauge */}
              <View style={styles.ringContainer}>
                <Svg width={140} height={140} viewBox="0 0 140 140" style={{ transform: [{ rotate: '-90deg' }] }}>
                  {/* Background Track */}
                  <Circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke={colors.border}
                    strokeWidth="10"
                    fill="none"
                  />
                  {/* Progress Arc */}
                  <Circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke={themeColor}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    fill="none"
                  />
                </Svg>
                <View style={styles.ringCenterText}>
                  <Text style={[styles.ringPct, { color: themeColor }]}>{Math.round(percentage)}%</Text>
                  <Text style={[styles.ringSub, { color: colors.textMuted }]}>Del Límite</Text>
                </View>
              </View>

              {/* Comparison stats box */}
              <View
                style={[
                  styles.statsRowBox,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.statCol}>
                  <Text style={[styles.statColSub, { color: colors.textSecondary }]}>Consumido</Text>
                  <Text style={[styles.statColVal, { color: themeColor }]}>{currentSugar.toFixed(1)}g</Text>
                </View>
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: colors.border },
                  ]}
                />
                <View style={styles.statCol}>
                  <Text style={[styles.statColSub, { color: colors.textSecondary }]}>Límite Diario</Text>
                  <Text style={[styles.statColVal, { color: colors.text }]}>{maxSugar}g</Text>
                </View>
              </View>

              {/* Info recommendation box */}
              <View
                style={[
                  styles.infoBox,
                  {
                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                    borderColor: 'rgba(59, 130, 246, 0.2)',
                  },
                ]}
              >
                <Info size={18} color="#3b82f6" style={{ marginTop: 2 }} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  La <Text style={{ fontWeight: '700', color: colors.text }}>OMS</Text> recomienda
                  reducir el consumo de azúcares libres a menos del{' '}
                  <Text style={{ fontWeight: '700', color: colors.text }}>10%</Text> de la ingesta
                  calórica total para una salud óptima.
                </Text>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                onPress={handleClose}
                style={[
                  styles.closeBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.closeBtnText, { color: themeColor }]}>Entendido</Text>
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
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  ringContainer: {
    width: 140,
    height: 140,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  ringCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPct: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  ringSub: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statsRowBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  statCol: {
    alignItems: 'center',
  },
  statColSub: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  statColVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  divider: {
    width: 1,
    height: 28,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    width: '100%',
  },
  infoText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  closeBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
