/* mobile/src/components/nutrition/PromoBanner.tsx */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Sparkles, ChevronRight } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';

interface PromoBannerProps {
  type?: 'nutrition' | 'training' | 'routines';
  onPress: () => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({
  type = 'nutrition',
  onPress,
}) => {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const userProfile = useAppStore(state => state.userProfile);

  // If user already has a trainer, hide the promotional banner
  if (userProfile?.trainer_id) return null;

  const content =
    type === 'nutrition'
      ? {
          title: '¿Dudas sobre qué comer?',
          desc: 'Da el paso definitivo con un plan nutricional a medida y resuelve todas tus dudas por chat 24/7.',
        }
      : {
          title: '¿Estancado con los pesos?',
          desc: 'Desbloquea tu potencial con rutinas hiper-personalizadas y análisis técnico con tu preparador.',
        };

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onPress();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.88}
        style={[
          styles.glassWrapper,
          {
            borderColor: colors.tint + '35',
            backgroundColor: colors.card,
          },
        ]}
      >
        {/* iOS Liquid Glass layer */}
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        {/* Ambient subtle glow background */}
        <View
          style={[
            styles.ambientGlow,
            { backgroundColor: colors.tint + (isDark ? '18' : '10') },
          ]}
          pointerEvents="none"
        />

        <View style={styles.contentRow}>
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]}>
                {content.title}
              </Text>
              <Sparkles size={16} color={colors.tint} style={{ marginLeft: 6 }} />
            </View>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {content.desc}
            </Text>
          </View>

          <View style={[styles.chevronCircle, { backgroundColor: colors.tint }]}>
            <ChevronRight size={18} color="#000" strokeWidth={3} />
          </View>
        </View>
      </TouchableOpacity>
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
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  chevronCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});
