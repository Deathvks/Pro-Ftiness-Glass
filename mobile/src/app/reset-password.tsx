import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, CheckCircle2, Dumbbell, KeyRound } from 'lucide-react-native';

import AnimatedScreen from '@/components/AnimatedScreen';
import GlobalHeader from '@/components/GlobalHeader';
import { SEOHead } from '@/components/SEOHead';
import { getAppleCardSurfaceStyle, shouldUseContentGlass } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { useToast } from '@/hooks/useToast';
import { resetPassword } from '@/services/authService';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const useGlass = shouldUseContentGlass(theme);
  const contrastText = getContrastTextColor(colors.tint);
  const { showToast } = useToast();

  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const rawToken = typeof params.token === 'string' && params.token.trim() ? params.token.trim() : null;
    if (rawToken) {
      setToken(rawToken);
    } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const fromSearch = new URLSearchParams(window.location.search).get('token');
      if (fromSearch) setToken(fromSearch);
      else showToast('Token de restablecimiento no encontrado.', 'error');
    } else {
      showToast('Token de restablecimiento no encontrado.', 'error');
    }
  }, [params.token, showToast]);

  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 3000);
    return () => clearTimeout(timer);
  }, [isSuccess, router]);

  const validate = () => {
    const next: { password?: string; confirmPassword?: string } = {};
    if (!password) next.password = 'La contraseña es requerida.';
    else if (password.length < 6) next.password = 'La contraseña debe tener al menos 6 caracteres.';
    if (password !== confirmPassword) next.confirmPassword = 'Las contraseñas no coinciden.';
    return next;
  };

  const handleSubmit = async () => {
    const formErrors = validate();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    if (!token) {
      showToast('Falta el token de restablecimiento.', 'error');
      return;
    }

    setErrors({});
    setIsLoading(true);
    try {
      const response = await resetPassword({ token, password });
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      showToast(response?.message || 'Contraseña restablecida con éxito.', 'success');
      setIsSuccess(true);
    } catch (err: any) {
      showToast(err?.message || 'Error al restablecer la contraseña.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedScreen
      paddingBottom={48}
      keyboardShouldPersistTaps="handled"
      header={
        <GlobalHeader
          title="Restablecer Contraseña"
          showBackButton
          hideRightButtons
          onBackPress={() => router.replace('/login')}
        />
      }
    >
      <SEOHead
        title={isSuccess ? 'Contraseña Restablecida - Pro Fitness Glass' : 'Restablecer Contraseña - Pro Fitness Glass'}
        route={isSuccess ? 'reset-password/success' : 'reset-password'}
        noIndex
      />

      <View style={styles.container}>
        <View
          style={[
            getAppleCardSurfaceStyle(theme, 28),
            styles.card,
            Platform.OS !== 'ios' && { borderWidth: 1, borderColor: colors.border },
          ]}
        >
          {useGlass && (
            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderRadius: 27 }]}
            />
          )}

          {isSuccess ? (
            <View style={styles.successWrap}>
              <View style={styles.successBadge}>
                <CheckCircle2 size={44} color="#10b981" />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>Contraseña Actualizada</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Tu contraseña ha sido restablecida con éxito. Redirigiendo al inicio de sesión...
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.replace('/login')}
                style={[styles.submitBtn, { backgroundColor: colors.tint }]}
              >
                <Text style={[styles.submitText, { color: contrastText }]}>Ir a Iniciar Sesión ahora</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formWrap}>
              <View style={styles.headerBlock}>
                <View style={[styles.logoBox, { backgroundColor: colors.tint + '1A' }]}>
                  <Dumbbell size={26} color={colors.tint} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>Nueva Contraseña</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Introduce tu nueva contraseña segura para acceder de nuevo a Pro Fitness Glass.
                </Text>
              </View>

              <View style={styles.fieldGroup}>
                <TextInput
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Nueva contraseña (mín. 6 caracteres)"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: errors.password ? '#ef4444' : colors.border,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    },
                  ]}
                />
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
              </View>

              <View style={styles.fieldGroup}>
                <TextInput
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirmar nueva contraseña"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: errors.confirmPassword ? '#ef4444' : colors.border,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    },
                  ]}
                />
                {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isLoading || !token}
                onPress={() => void handleSubmit()}
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: colors.tint,
                    opacity: isLoading || !token ? 0.55 : 1,
                  },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={contrastText} />
                ) : (
                  <>
                    <KeyRound size={18} color={contrastText} />
                    <Text style={[styles.submitText, { color: contrastText }]}>Guardar Contraseña</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => router.replace('/login')}
          style={[styles.backPill, { borderColor: colors.border }]}
        >
          <ArrowLeft size={16} color={colors.textSecondary} />
          <Text style={[styles.backPillText, { color: colors.textSecondary }]}>Volver a Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 18, paddingTop: 12, gap: 18 },
  card: { padding: 22, overflow: 'hidden' },
  successWrap: { alignItems: 'center', gap: 12 },
  successBadge: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formWrap: { gap: 14 },
  headerBlock: { alignItems: 'center', gap: 8, marginBottom: 4 },
  logoBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 23, fontWeight: '900', letterSpacing: -0.4, textAlign: 'center' },
  subtitle: { fontSize: 13.5, lineHeight: 19, fontWeight: '500', textAlign: 'center' },
  fieldGroup: { gap: 5 },
  input: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: { fontSize: 12, fontWeight: '700', color: '#ef4444', paddingHorizontal: 6 },
  submitBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    marginTop: 4,
  },
  submitText: { fontSize: 15, fontWeight: '800' },
  backPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
  },
  backPillText: { fontSize: 13.5, fontWeight: '700' },
});
