import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Sparkles, Star, Trophy } from 'lucide-react-native';

import { getTier } from '@/components/LevelBadge';
import {
  ModalThemeBackground,
  getThemedModalBorderColor,
  getThemedModalSurfaceColor,
} from '@/components/ui/ModalThemeBackground';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';

interface MilestoneLevelUpModalProps {
  visible: boolean;
  level: number;
  onClose: () => void;
}

const LIVING_ACCENTS = [
  { title: 'Supernova', colors: ['#7c3aed', '#ec4899', '#3b82f6'] as const },
  { title: 'Plasma Cuántico', colors: ['#10b981', '#06b6d4', '#3b82f6'] as const },
  { title: 'Llama Eterna', colors: ['#ef4444', '#f97316', '#facc15'] as const },
  { title: 'Vórtice Abisal', colors: ['#1d4ed8', '#6366f1', '#14b8a6'] as const },
  { title: 'Oro Cósmico', colors: ['#d97706', '#fef08a', '#b45309'] as const },
];

export function MilestoneLevelUpModal({ visible, level, onClose }: MilestoneLevelUpModalProps) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const tier = getTier(level || 10);
  const Icon = tier.icon || Trophy;

  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    scaleAnim.setValue(0.88);
    opacityAnim.setValue(0);
    spinAnim.setValue(0);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 14,
        stiffness: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [visible, scaleAnim, opacityAnim, spinAnim]);

  if (!visible) return null;

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible={visible} transparent statusBarTranslucent navigationBarTranslucent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.haloWrap, { transform: [{ rotate }] }]} pointerEvents="none">
          <LinearGradient
            colors={[tier.colors[0] + '33', 'transparent', tier.colors[1] + '33', 'transparent']}
            style={styles.haloCircle}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: getThemedModalSurfaceColor(theme),
              borderColor: getThemedModalBorderColor(theme),
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <ModalThemeBackground theme={theme} />

          <View style={styles.floatingRow}>
            <Sparkles size={20} color={tier.colors[0]} />
            <Star size={18} color={tier.colors[0]} fill={tier.colors[0]} />
          </View>

          <LinearGradient colors={tier.colors} style={styles.badgeOuter}>
            <View style={[styles.badgeInner, { backgroundColor: getThemedModalSurfaceColor(theme) }]}>
              <Icon size={34} color={colors.text} strokeWidth={1.6} />
              <Text style={[styles.levelNum, { color: tier.colors[0] }]}>{level}</Text>
            </View>
          </LinearGradient>

          <Text style={[styles.rankTitle, { color: tier.colors[0] }]}>
            ¡Rango {tier.name}!
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Has alcanzado el asombroso nivel {level}. Tu dedicación está rindiendo frutos. ¡Sigue así!
          </Text>

          {level === 20 && (
            <View style={[styles.rewardBox, { borderColor: colors.border }]}>
              <Text style={styles.rewardTitle}>✨ ¡Recompensa Desbloqueada: 5 Acentos!</Text>
              <View style={styles.accentsRow}>
                {LIVING_ACCENTS.map(item => (
                  <LinearGradient
                    key={item.title}
                    colors={item.colors}
                    style={styles.accentDot}
                  />
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity activeOpacity={0.85} onPress={onClose} style={styles.ctaWrap}>
            <LinearGradient colors={tier.colors} style={styles.ctaBtn}>
              <Text style={styles.ctaText}>¡ACEPTAR RECOMPENSA!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  haloWrap: {
    position: 'absolute',
    width: 360,
    height: 360,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloCircle: {
    width: 360,
    height: 360,
    borderRadius: 180,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 30,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    gap: 12,
  },
  floatingRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  badgeOuter: {
    width: 124,
    height: 124,
    borderRadius: 62,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInner: {
    width: '100%',
    height: '100%',
    borderRadius: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNum: {
    fontSize: 34,
    fontWeight: '900',
    marginTop: 2,
  },
  rankTitle: {
    fontSize: 28,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: '500',
    textAlign: 'center',
  },
  rewardBox: {
    width: '100%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    gap: 10,
  },
  rewardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fcd34d',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  accentsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  accentDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  ctaWrap: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 6,
  },
  ctaBtn: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
});

export default MilestoneLevelUpModal;
