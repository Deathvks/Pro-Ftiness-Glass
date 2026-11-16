import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { AlertTriangle, ExternalLink, Info, ShieldCheck, X } from 'lucide-react-native';

import { SwipeableBottomSheet, getAppleSheetCardStyle } from '@/components/ui/SwipeableBottomSheet';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

interface GoogleTermsModalProps {
  visible: boolean;
  previouslyDeclined?: boolean;
  onAccept: () => void;
  onClose: () => void;
}

export function GoogleTermsModal({
  visible,
  previouslyDeclined = false,
  onAccept,
  onClose,
}: GoogleTermsModalProps) {
  const router = useRouter();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const handleAcceptCookies = useAppStore((s: any) => s.handleAcceptCookies);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const contrastText = getContrastTextColor(colors.tint);

  if (!visible) return null;

  const handleContinue = () => {
    if (!previouslyDeclined) {
      AsyncStorage.setItem('cookie_consent', 'accepted').catch(() => {});
      handleAcceptCookies?.();
    }
    onAccept();
  };

  return (
    <SwipeableBottomSheet visible={visible} onClose={onClose} isDark={isDark} maxHeight="85%">
      <View style={styles.content}>
        <TouchableOpacity
          onPress={onClose}
          style={[
            styles.closeBtn,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
          ]}
        >
          <X size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: previouslyDeclined ? 'rgba(249, 115, 22, 0.14)' : colors.tint + '1A',
            },
          ]}
        >
          {previouslyDeclined ? (
            <AlertTriangle size={34} color="#f97316" />
          ) : (
            <ShieldCheck size={34} color={colors.tint} />
          )}
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {previouslyDeclined ? 'Aviso de Privacidad' : 'Privacidad y Google'}
        </Text>

        {previouslyDeclined ? (
          <View style={styles.warningBox}>
            <View style={styles.warningHead}>
              <Info size={15} color="#f97316" />
              <Text style={styles.warningTitle}>Has rechazado las cookies</Text>
            </View>
            <Text style={[styles.warningBody, { color: colors.textSecondary }]}>
              Al continuar aquí, permites el acceso puntual con Google, pero no se activarán las funciones opcionales rechazadas en Ajustes.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              Para iniciar sesión con Google es necesario habilitar el almacenamiento local de sesión segura.
            </Text>
            <View style={[styles.legalBox, getAppleSheetCardStyle(isDark, 16, theme)]}>
              <Text style={[styles.legalText, { color: colors.textSecondary }]}>
                Al continuar confirmas tener al menos 14 años y aceptas nuestros{' '}
                <Text
                  style={{ color: colors.tint, fontWeight: '800', textDecorationLine: 'underline' }}
                  onPress={() => {
                    onClose();
                    router.push('/terms' as any);
                  }}
                >
                  Términos de Servicio <ExternalLink size={11} color={colors.tint} />
                </Text>{' '}
                y{' '}
                <Text
                  style={{ color: colors.tint, fontWeight: '800', textDecorationLine: 'underline' }}
                  onPress={() => {
                    onClose();
                    router.push('/privacy' as any);
                  }}
                >
                  Política de Privacidad
                </Text>
                .
              </Text>
            </View>
          </>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleContinue}
          style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
        >
          <Text style={[styles.primaryText, { color: contrastText }]}>
            {previouslyDeclined ? 'Continuar (Solo Login)' : 'Aceptar y Continuar con Google'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </SwipeableBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 16, alignItems: 'center', gap: 12 },
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
  iconCircle: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  title: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  body: { fontSize: 13.5, lineHeight: 20, textAlign: 'center' },
  warningBox: {
    width: '100%',
    padding: 13,
    borderRadius: 14,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.35)',
    gap: 5,
  },
  warningHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  warningTitle: { fontSize: 13.5, fontWeight: '800', color: '#f97316' },
  warningBody: { fontSize: 12.5, lineHeight: 18 },
  legalBox: { width: '100%', padding: 13 },
  legalText: { fontSize: 12.5, lineHeight: 18 },
  primaryBtn: { width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  primaryText: { fontSize: 14.5, fontWeight: '800' },
  cancelBtn: { width: '100%', paddingVertical: 10, alignItems: 'center' },
  cancelText: { fontSize: 13.5, fontWeight: '700' },
});

export default GoogleTermsModal;
