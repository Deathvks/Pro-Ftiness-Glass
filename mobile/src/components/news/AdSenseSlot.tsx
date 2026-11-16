import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Sparkles } from 'lucide-react-native';

import { getAppleCardSurfaceStyle } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

interface AdSenseSlotProps {
  slotId?: string;
}

/**
 * Bloque adaptable equivalente a AdSenseSlot.jsx.
 * En mobile nativo y desarrollo muestra la tarjeta promocional de captación adaptada al tema.
 */
export function AdSenseSlot({ slotId: _slotId }: AdSenseSlotProps) {
  const router = useRouter();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const contrastText = getContrastTextColor(colors.tint);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.kicker, { color: colors.textSecondary }]}>RECOMENDADO</Text>
      <View
        style={[
          getAppleCardSurfaceStyle(theme, 20),
          styles.card,
          {
            borderColor: colors.tint + '44',
            borderWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 1,
          },
        ]}
      >
        <View style={styles.leftRow}>
          <View style={[styles.iconBox, { backgroundColor: colors.tint + '20' }]}>
            <Sparkles size={19} color={colors.tint} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[styles.title, { color: colors.text }]}>
              Registra tu progreso gratis en Pro Fitness Glass
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Rutinas personalizadas, seguimiento de macros con IA y gráficas de récords.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push((isAuthenticated ? '/(tabs)/routines' : '/register') as any)}
          style={[styles.cta, { backgroundColor: colors.tint }]}
        >
          <Text style={[styles.ctaText, { color: contrastText }]}>
            {isAuthenticated ? 'Mis rutinas' : 'Empezar gratis'}
          </Text>
          <ArrowRight size={14} color={contrastText} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginVertical: 14,
    gap: 6,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
    opacity: 0.7,
  },
  card: {
    padding: 15,
    gap: 12,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 999,
  },
  ctaText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
});

export default AdSenseSlot;
