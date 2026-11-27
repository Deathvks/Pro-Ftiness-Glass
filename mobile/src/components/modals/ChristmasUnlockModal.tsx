import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gift, LockOpen, Palette, Snowflake, Sparkles, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SnowFlakeSpec {
  id: number;
  startX: number;
  size: number;
  duration: number;
  delay: number;
  sway: number;
  opacity: number;
  spinDeg: number;
  isFrost: boolean;
}

function ModalSnowFlake({
  spec,
  fallDistance,
  visible,
}: {
  spec: SnowFlakeSpec;
  fallDistance: number;
  visible: boolean;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      progress.stopAnimation();
      return;
    }

    progress.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(spec.delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: spec.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [progress, spec.delay, spec.duration, visible]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-28, fallDistance],
  });

  const translateX = progress.interpolate({
    inputRange: [0, 0.35, 0.7, 1],
    outputRange: [0, spec.sway, -spec.sway * 0.7, spec.sway * 0.25],
  });

  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${spec.spinDeg}deg`],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: spec.startX,
        top: 0,
        opacity: spec.opacity,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    >
      <Snowflake
        size={spec.size}
        color={spec.isFrost ? '#bae6fd' : '#ffffff'}
        strokeWidth={1.8}
      />
    </Animated.View>
  );
}

export function ChristmasUnlockModal() {
  const visible = useAppStore((state) => Boolean((state as any).showChristmasUnlockModal));
  const closeChristmasUnlockModal = useAppStore(
    (state) => (state as any).closeChristmasUnlockModal
  );

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } catch {}
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [opacityAnim, scaleAnim, visible]);

  const backdropFlakes = useMemo<SnowFlakeSpec[]>(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        startX: ((i * 61 + 9) % 94) * (SCREEN_WIDTH / 100),
        size: 12 + (i % 4) * 3,
        duration: 6800 + (i % 4) * 1600,
        delay: (i % 5) * 800,
        sway: i % 2 === 0 ? 18 : -18,
        opacity: 0.28 + (i % 3) * 0.14,
        spinDeg: i % 2 === 0 ? 180 : -180,
        isFrost: i % 2 === 0,
      })),
    []
  );

  const cardWidth = Math.min(SCREEN_WIDTH - 32, 400);
  const cardFlakes = useMemo<SnowFlakeSpec[]>(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        id: i + 100,
        startX: ((i * 53 + 12) % 90) * (cardWidth / 100),
        size: 10 + (i % 3) * 3,
        duration: 5200 + (i % 4) * 1200,
        delay: (i % 5) * 650,
        sway: i % 2 === 0 ? 12 : -12,
        opacity: 0.24 + (i % 3) * 0.1,
        spinDeg: i % 2 === 0 ? 180 : -180,
        isFrost: i % 3 === 0,
      })),
    [cardWidth]
  );

  const handleClose = () => {
    closeChristmasUnlockModal?.();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        {/* Copos cayendo por el fondo */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {backdropFlakes.map((flake) => (
            <ModalSnowFlake
              key={flake.id}
              spec={flake}
              fallDistance={SCREEN_HEIGHT + 30}
              visible={visible}
            />
          ))}
        </View>

        <Animated.View
          style={[
            styles.cardWrap,
            {
              width: cardWidth,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#07131e', '#0b2232', '#1b0d1b']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(16,185,129,0.22)', 'transparent', 'rgba(225,29,72,0.26)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Copos cayendo dentro de la propia tarjeta */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {cardFlakes.map((flake) => (
              <ModalSnowFlake
                key={flake.id}
                spec={flake}
                fallDistance={480}
                visible={visible}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={handleClose}
            accessibilityLabel="Cerrar"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.closeBtn}
          >
            <X size={20} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>

          <View style={styles.emblemWrap}>
            <LinearGradient
              colors={['rgba(225,29,72,0.34)', 'rgba(56,189,248,0.20)', 'rgba(16,185,129,0.20)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emblemBox}
            >
              <Snowflake size={42} color="#ffffff" strokeWidth={1.8} />
            </LinearGradient>
            <LinearGradient
              colors={['#e11d48', '#f59e0b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.giftBadge}
            >
              <Gift size={14} color="#ffffff" />
            </LinearGradient>
          </View>

          <View style={styles.seasonPill}>
            <Sparkles size={11} color="#fbbf24" />
            <Text style={styles.seasonPillText}>EDICIÓN NAVIDAD 2026</Text>
          </View>

          <Text style={styles.title}>¡Tema Navidad Desbloqueado!</Text>

          <Text style={styles.subtitle}>
            Has reclamado <Text style={{ fontWeight: '800', color: '#ffffff' }}>Invierno Glass</Text>{' '}
            antes del 6 de enero. Ya queda guardado en tu cuenta{' '}
            <Text style={{ fontWeight: '800', color: '#fda4af' }}>para siempre</Text>.
          </Text>

          <View style={styles.featuresRow}>
            <View style={styles.featureTile}>
              <Snowflake size={16} color="#bae6fd" />
              <Text style={styles.featureLabel}>Nieve cristalina</Text>
            </View>
            <View style={styles.featureTile}>
              <Palette size={16} color="#fb7185" />
              <Text style={styles.featureLabel}>Rojo Navidad</Text>
            </View>
            <View style={styles.featureTile}>
              <LockOpen size={16} color="#6ee7b7" />
              <Text style={styles.featureLabel}>Para siempre</Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleClose} activeOpacity={0.85} style={styles.ctaWrap}>
            <LinearGradient
              colors={['#e11d48', '#f43f5e', '#f59e0b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaBtn}
            >
              <Text style={styles.ctaText}>¡A disfrutarlo!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 10, 18, 0.84)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  cardWrap: {
    borderRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(186, 230, 253, 0.24)',
    shadowColor: '#e11d48',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 20,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  emblemWrap: {
    position: 'relative',
    marginBottom: 16,
    marginTop: 4,
  },
  emblemBox: {
    width: 86,
    height: 86,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  giftBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  seasonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(225, 29, 72, 0.26)',
    borderWidth: 1,
    borderColor: 'rgba(253, 164, 175, 0.35)',
    marginBottom: 10,
  },
  seasonPillText: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#ffe4e6',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    color: 'rgba(226, 232, 240, 0.9)',
    textAlign: 'center',
    marginBottom: 18,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 20,
  },
  featureTile: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    gap: 6,
  },
  featureLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f1f5f9',
    textAlign: 'center',
  },
  ctaWrap: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
});
