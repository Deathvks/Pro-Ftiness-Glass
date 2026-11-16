import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react-native';

import { SwipeableBottomSheet, getAppleSheetCardStyle } from '@/components/ui/SwipeableBottomSheet';
import { useAppColors } from '@/hooks/useAppColors';
import apiClient from '@/services/apiClient';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

export function ForcePasswordResetModal({ visible }: { visible: boolean }) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const fetchInitialData = useAppStore(state => state.fetchInitialData);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const contrastText = getContrastTextColor(colors.tint);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reqs = [
    { id: 'length', label: 'Al menos 12 caracteres', valid: password.length >= 12 },
    { id: 'upper', label: 'Una mayúscula', valid: /[A-Z]/.test(password) },
    { id: 'lower', label: 'Una minúscula', valid: /[a-z]/.test(password) },
    { id: 'special', label: 'Un carácter especial (!@#$...)', valid: /[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/'`]/.test(password) },
    { id: 'digits', label: 'No más de 3 números seguidos', valid: !/\d{4,}/.test(password) && password.length > 0 },
  ];

  const handleSubmit = async () => {
    const failed = reqs.find(r => !r.valid);
    if (failed) {
      setError(`Requisito pendiente: ${failed.label}.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await apiClient('/auth/force-reset', { method: 'POST', body: { newPassword: password } });
      setSuccess(true);
      setTimeout(() => {
        void fetchInitialData?.();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Error al cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={() => {}}
      dismissible={false}
      isDark={isDark}
      scrollable
      avoidKeyboard
      maxHeight="92%"
    >
      <ScrollView
        style={{ flexShrink: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {success ? (
          <View style={styles.successWrap}>
            <View style={styles.successCircle}>
              <CheckCircle2 size={38} color="#10b981" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Contraseña Actualizada</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Ya puedes entrar con seguridad a tu cuenta.
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.lockCircle, { backgroundColor: colors.tint + '1F' }]}>
              <Lock size={28} color={colors.tint} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Seguridad Obligatoria</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Tu cuenta fue creada por un entrenador personal. Por seguridad, establece una nueva contraseña antes de continuar.
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputRow}>
              <TextInput
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholder="Nueva contraseña segura"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              />
              <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeBtn}>
                {showPassword ? <EyeOff size={18} color={colors.textSecondary} /> : <Eye size={18} color={colors.textSecondary} />}
              </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirmar contraseña"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(p => !p)} style={styles.eyeBtn}>
                {showConfirmPassword ? <EyeOff size={18} color={colors.textSecondary} /> : <Eye size={18} color={colors.textSecondary} />}
              </TouchableOpacity>
            </View>

            <View style={[styles.reqsCard, getAppleSheetCardStyle(isDark, 16, theme)]}>
              {reqs.map(r => (
                <View key={r.id} style={styles.reqRow}>
                  <CheckCircle2 size={14} color={r.valid ? '#10b981' : colors.textSecondary} />
                  <Text style={[styles.reqText, { color: r.valid ? '#10b981' : colors.textSecondary }]}>
                    {r.label}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={loading}
              onPress={() => void handleSubmit()}
              style={[styles.submitBtn, { backgroundColor: colors.tint, opacity: loading ? 0.6 : 1 }]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={contrastText} />
              ) : (
                <Text style={[styles.submitText, { color: contrastText }]}>Guardar Nueva Contraseña</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SwipeableBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 20, alignItems: 'center', gap: 12 },
  lockCircle: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  successWrap: { paddingVertical: 24, alignItems: 'center', gap: 10 },
  successCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  subtitle: { fontSize: 13.5, lineHeight: 19, textAlign: 'center' },
  errorBox: {
    width: '100%',
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  errorText: { fontSize: 12.5, fontWeight: '700', color: '#ef4444', textAlign: 'center' },
  inputRow: { width: '100%', position: 'relative', justifyContent: 'center' },
  input: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingRight: 44,
    fontSize: 14.5,
    fontWeight: '600',
  },
  eyeBtn: { position: 'absolute', right: 12, padding: 4 },
  reqsCard: { width: '100%', padding: 12, gap: 7 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reqText: { fontSize: 12.5, fontWeight: '600' },
  submitBtn: { width: '100%', paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  submitText: { fontSize: 15, fontWeight: '800' },
});

export default ForcePasswordResetModal;
