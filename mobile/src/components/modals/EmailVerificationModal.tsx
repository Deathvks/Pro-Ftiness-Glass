import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react-native';

import { SwipeableBottomSheet, getAppleSheetCardStyle } from '@/components/ui/SwipeableBottomSheet';
import { useAppColors } from '@/hooks/useAppColors';
import { useToast } from '@/hooks/useToast';
import { resendVerificationEmail, updateEmailForVerification } from '@/services/authService';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

interface EmailVerificationModalProps {
  visible: boolean;
  currentEmail?: string | null;
  onEmailUpdated: (email: string) => void;
  onCodeSent: () => void;
  onClose?: () => void;
}

export function EmailVerificationModal({
  visible,
  currentEmail,
  onEmailUpdated,
  onCodeSent,
  onClose,
}: EmailVerificationModalProps) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const contrastText = getContrastTextColor(colors.tint);
  const { showToast } = useToast();

  const isDummyEmail = !currentEmail || currentEmail.endsWith('@x-auth.local');
  const [isChangingEmail, setIsChangingEmail] = useState(isDummyEmail);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!currentEmail || currentEmail.endsWith('@x-auth.local')) {
      setIsChangingEmail(true);
    }
  }, [currentEmail]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0 || isDummyEmail || !currentEmail) return;
    setIsLoading(true);
    try {
      await resendVerificationEmail(currentEmail);
      showToast('Código de verificación enviado.', 'success');
      setResendCooldown(10);
      onCodeSent();
    } catch (error: any) {
      showToast(error?.message || 'Error al enviar el código', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !/\S+@\S+\.\S+/.test(newEmail)) {
      showToast('Introduce un email válido.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await updateEmailForVerification(newEmail.trim());
      showToast(`Código enviado a ${newEmail.trim()}`, 'success');
      onEmailUpdated(newEmail.trim());
    } catch (error: any) {
      showToast(error?.message || 'Error al vincular email', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={onClose || (() => {})}
      dismissible={Boolean(onClose)}
      isDark={isDark}
      avoidKeyboard
      maxHeight="85%"
    >
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.tint }]}>
          {isDummyEmail ? (
            <ShieldCheck size={30} color={contrastText} />
          ) : (
            <Mail size={30} color={contrastText} />
          )}
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {isDummyEmail ? 'Vincular Email' : 'Verificar Email'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isDummyEmail
            ? 'Tu cuenta necesita un correo real para recibir el código de seguridad.'
            : 'Confirma tu identidad para poder continuar.'}
        </Text>

        {!isChangingEmail ? (
          <View style={styles.block}>
            <View style={[styles.emailBox, getAppleSheetCardStyle(isDark, 16, theme)]}>
              <Text style={[styles.emailLabel, { color: colors.textSecondary }]}>Email actual:</Text>
              <Text style={[styles.emailVal, { color: colors.text }]}>{currentEmail}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isLoading || resendCooldown > 0}
              onPress={() => void handleResend()}
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.tint, opacity: isLoading || resendCooldown > 0 ? 0.65 : 1 },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={contrastText} />
              ) : (
                <Text style={[styles.primaryText, { color: contrastText }]}>
                  {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Enviar código'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsChangingEmail(true)} style={styles.linkBtn}>
              <Text style={[styles.linkText, { color: colors.tint }]}>Cambiar dirección de email</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.block}>
            <TextInput
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="tu@email.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                },
              ]}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isLoading || !newEmail.trim()}
              onPress={() => void handleChangeEmail()}
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.tint, opacity: isLoading || !newEmail.trim() ? 0.65 : 1 },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={contrastText} />
              ) : (
                <Text style={[styles.primaryText, { color: contrastText }]}>Vincular y Enviar</Text>
              )}
            </TouchableOpacity>

            {!isDummyEmail && (
              <TouchableOpacity onPress={() => setIsChangingEmail(false)} style={styles.backRow}>
                <ArrowLeft size={15} color={colors.textSecondary} />
                <Text style={[styles.linkText, { color: colors.textSecondary }]}>Volver</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SwipeableBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 18, alignItems: 'center', gap: 12 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.4, textAlign: 'center' },
  subtitle: { fontSize: 13.5, lineHeight: 19, textAlign: 'center' },
  block: { width: '100%', gap: 12, marginTop: 4 },
  emailBox: { padding: 14, alignItems: 'center', gap: 4 },
  emailLabel: { fontSize: 12, fontWeight: '600' },
  emailVal: { fontSize: 15, fontWeight: '800' },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  primaryBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  primaryText: { fontSize: 15, fontWeight: '800' },
  linkBtn: { paddingVertical: 6, alignItems: 'center' },
  linkText: { fontSize: 13.5, fontWeight: '700' },
  backRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
});

export default EmailVerificationModal;
