import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowRight, ShieldCheck } from 'lucide-react-native';

import { LiquidCloseButton } from '@/components/ui/GlassButton';
import { SwipeableBottomSheet } from '@/components/ui/SwipeableBottomSheet';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

interface TwoFactorPromoModalProps {
  visible: boolean;
  onConfigure: () => void;
  onClose: () => void;
}

export function TwoFactorPromoModal({ visible, onConfigure, onClose }: TwoFactorPromoModalProps) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const contrastText = getContrastTextColor(colors.tint);

  return (
    <SwipeableBottomSheet visible={visible} onClose={onClose} isDark={isDark} maxHeight="75%">
      <View style={styles.content}>
        <LiquidCloseButton
          onPress={onClose}
          accessibilityLabel="Cerrar aviso 2FA"
          iconColor={colors.textSecondary}
          style={styles.closeBtn}
        />

        <View style={[styles.iconCircle, { backgroundColor: colors.tint + '1A', borderColor: colors.tint + '44' }]}>
          <ShieldCheck size={34} color={colors.tint} strokeWidth={2.3} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>¡Nueva Seguridad!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Protege tu cuenta activando la{' '}
          <Text style={{ color: colors.tint, fontWeight: '800' }}>Verificación en 2 Pasos</Text>. Evita accesos no autorizados incluso si alguien conoce tu contraseña.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onConfigure}
          style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
        >
          <Text style={[styles.primaryText, { color: contrastText }]}>Configurar ahora</Text>
          <ArrowRight size={17} color={contrastText} />
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} style={styles.laterBtn}>
          <Text style={[styles.laterText, { color: colors.textSecondary }]}>Quizás más tarde</Text>
        </TouchableOpacity>
      </View>
    </SwipeableBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 4,
    right: 20,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  primaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 15,
  },
  primaryText: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  laterBtn: {
    width: '100%',
    paddingVertical: 11,
    alignItems: 'center',
  },
  laterText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
});

export default TwoFactorPromoModal;
