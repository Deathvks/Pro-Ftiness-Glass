import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
  useColorScheme as useDeviceColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import {
  LogIn,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  Mail,
  Smartphone,
  ArrowLeft,
  Wrench,
} from 'lucide-react-native';
import { FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastColor } from '@/utils/colorUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import useAppStore from '@/store/useAppStore';
import { verifyEmail, resendVerificationEmail, resend2FACode } from '@/services/authService';
import { LegalDocumentModal, LegalDocType } from '@/components/modals/LegalDocumentModal';
import { BACKEND_BASE_URL } from '@/services/apiClient';

WebBrowser.maybeCompleteAuthSession();

const GoogleIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <Path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <Path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
    <Path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
  </Svg>
);

const DiscordIcon = ({ size, color }: { size: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 640 512">
    <Path fill={color} d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z" />
  </Svg>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Legal Modal
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalDocType, setLegalDocType] = useState<LegalDocType>('privacy');

  // Verification state (cuentas pendientes de verificar)
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(10);
  const inputRefs = useRef<Array<any>>([]);

  // 2FA state (desde Zustand authSlice)
  const twoFactorPending = useAppStore(state => state.twoFactorPending);
  const handleVerify2FA = useAppStore(state => state.handleVerify2FA);
  const cancelTwoFactor = useAppStore(state => state.cancelTwoFactor);
  const [otp2FA, setOtp2FA] = useState(['', '', '', '', '', '']);
  const otp2FARefs = useRef<Array<any>>([]);

  const handleLogin = useAppStore(state => state.handleLogin);
  const handleGoogleLogin = useAppStore(state => state.handleGoogleLogin);
  const handleDiscordLogin = useAppStore(state => state.handleDiscordLogin);
  const handleXLogin = useAppStore(state => state.handleXLogin);
  const handleGithubLogin = useAppStore(state => state.handleGithubLogin);

  const router = useRouter();
  const colors = useAppColors();
  const theme = colors;
  const currentStoreTheme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(currentStoreTheme);
  const contrastColor = getContrastColor(theme.tint, currentStoreTheme);
  const colorScheme = useDeviceColorScheme();
  const insets = useSafeAreaInsets();

  // Comprobar modo mantenimiento
  useEffect(() => {
    fetch(`${BACKEND_BASE_URL}/auth/login`, { method: 'HEAD' })
      .then(res => {
        if (res.status === 503) setMaintenanceMode(true);
      })
      .catch(() => {});
  }, []);

  // Cooldown del reenviar
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (resendCooldown > 0 && (needsVerification || twoFactorPending)) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown, needsVerification, twoFactorPending]);

  // Recuperar verificación pendiente guardada
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const savedNeedsVerification = localStorage.getItem('needs_verification');
      const savedEmail = localStorage.getItem('verification_email');
      if (savedNeedsVerification === 'true' && savedEmail) {
        setNeedsVerification(true);
        setEmail(savedEmail);
      }
    }
  }, []);

  const startVerification = (emailAddress: string) => {
    setNeedsVerification(true);
    setResendCooldown(10);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('needs_verification', 'true');
      localStorage.setItem('verification_email', emailAddress);
    }
  };

  const clearVerification = () => {
    setNeedsVerification(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('needs_verification');
      localStorage.removeItem('verification_email');
    }
  };

  const openLegalModal = (doc: LegalDocType) => {
    setLegalDocType(doc);
    setShowLegalModal(true);
  };

  // Manejo de códigos OTP de 6 dígitos
  const handleCodeChange = (index: number, value: string, is2FA = false) => {
    if (!/^\d*$/.test(value)) return;
    const targetArr = is2FA ? [...otp2FA] : [...verificationCode];
    targetArr[index] = value.slice(-1);
    if (is2FA) {
      setOtp2FA(targetArr);
      if (value && index < 5) otp2FARefs.current[index + 1]?.focus();
    } else {
      setVerificationCode(targetArr);
      if (value && index < 5) inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, e: any, is2FA = false) => {
    if (e.nativeEvent.key === 'Backspace') {
      const targetArr = is2FA ? otp2FA : verificationCode;
      if (!targetArr[index] && index > 0) {
        if (is2FA) {
          otp2FARefs.current[index - 1]?.focus();
        } else {
          inputRefs.current[index - 1]?.focus();
        }
      }
    }
  };

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'mobile' });

  const startAsync = async ({ authUrl, returnUrl }: { authUrl: string; returnUrl: string }) => {
    const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);
    if (result.type === 'success' && result.url) {
      const params: Record<string, string> = {};
      const queryPart = result.url.includes('#') ? result.url.split('#')[1] : result.url.split('?')[1];
      if (queryPart) {
        queryPart.split('&').forEach(pair => {
          const [key, value] = pair.split('=');
          if (key) params[key] = decodeURIComponent(value || '');
        });
      }
      return { type: 'success' as const, params, url: result.url };
    }
    return result;
  };

  const handleGoogleClick = async () => {
    try {
      const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=email%20profile&state=google`;
      const result = await startAsync({ authUrl, returnUrl: redirectUri });
      if (result.type === 'success' && 'params' in result && result.params.access_token) {
        setIsLoading(true);
        await handleGoogleLogin({ token: result.params.access_token });
      }
    } catch (e: any) {
      alert('Error conectando con Google: ' + (e.message || e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscordClick = async () => {
    try {
      const DISCORD_CLIENT_ID = process.env.EXPO_PUBLIC_DISCORD_CLIENT_ID;
      const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=identify%20email&state=discord`;
      const result = await startAsync({ authUrl, returnUrl: redirectUri });
      if (result.type === 'success' && 'params' in result && result.params.access_token) {
        setIsLoading(true);
        await handleDiscordLogin({ token: result.params.access_token });
      }
    } catch (e: any) {
      alert('Error conectando con Discord: ' + (e.message || e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleXClick = async () => {
    try {
      const X_CLIENT_ID = process.env.EXPO_PUBLIC_X_CLIENT_ID;
      const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${X_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=tweet.read%20users.read&state=x&code_challenge=challenge&code_challenge_method=plain`;
      const result = await startAsync({ authUrl, returnUrl: redirectUri });
      if (result.type === 'success' && 'params' in result && result.params.code) {
        setIsLoading(true);
        await handleXLogin({ code: result.params.code, redirectUri, codeVerifier: 'challenge' });
      }
    } catch (e: any) {
      alert('Error conectando con X: ' + (e.message || e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubClick = async () => {
    try {
      const GITHUB_CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID;
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=github`;
      const result = await startAsync({ authUrl, returnUrl: redirectUri });
      if (result.type === 'success' && 'params' in result && result.params.code) {
        setIsLoading(true);
        await handleGithubLogin({ code: result.params.code });
      }
    } catch (e: any) {
      alert('Error conectando con Github: ' + (e.message || e));
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = 'El email o nombre de usuario es requerido.';
    if (!password) newErrors.password = 'La contraseña es requerida.';
    return newErrors;
  };

  const handleLoginSubmit = async () => {
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      alert(Object.values(formErrors)[0]);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await handleLogin({
        email: email.trim(),
        password,
        rememberMe,
      });
    } catch (error: any) {
      if (error?.data?.requiresVerification) {
        startVerification(email.trim());
        alert('Tu cuenta no está verificada. Por favor, verifica tu email con el código enviado.');
      } else {
        const errorMsg = error.message || 'Error al iniciar sesión. Revisa tus credenciales.';
        setErrors({ api: errorMsg });
        alert(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2FA Submit
  const handle2FASubmit = async () => {
    const codeStr = otp2FA.join('');
    if (codeStr.length !== 6) {
      alert('Introduce el código de 6 dígitos.');
      return;
    }
    setIsLoading(true);
    try {
      await handleVerify2FA({
        userId: twoFactorPending.userId,
        method: twoFactorPending.method,
        token: twoFactorPending.method === 'app' ? codeStr : undefined,
        code: twoFactorPending.method === 'email' ? codeStr : undefined,
        rememberMe,
      });
    } catch (err: any) {
      alert(err.message || 'Código incorrecto o expirado.');
      setOtp2FA(['', '', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend2FA = async () => {
    if (resendCooldown > 0 || !twoFactorPending?.email) return;
    setIsLoading(true);
    try {
      await resend2FACode({ email: twoFactorPending.email, userId: twoFactorPending.userId });
      setResendCooldown(60);
      alert('Código reenviado a tu correo.');
    } catch (err: any) {
      alert(err.message || 'Error al reenviar el código.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verification Code Submit
  const handleVerifySubmit = async () => {
    const verificationCodeStr = verificationCode.join('');
    if (verificationCodeStr.length !== 6) {
      alert('El código debe tener 6 dígitos');
      return;
    }
    setIsLoading(true);
    try {
      await verifyEmail({ email: email.trim(), code: verificationCodeStr });
      alert('¡Cuenta verificada exitosamente! Iniciando sesión...');
      clearVerification();
      await handleLogin({ email: email.trim(), password, rememberMe });
    } catch (error: any) {
      alert('Código incorrecto o expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      await resendVerificationEmail(email.trim());
      setResendCooldown(60);
      alert('Se ha enviado un nuevo código a tu correo.');
    } catch (error: any) {
      alert('Error al reenviar el código. Inténtalo de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <GlassView
        glassEffectStyle="regular"
        colorScheme={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={[
          styles.contentWrapper,
          {
            paddingTop: insets.top + 28,
            paddingBottom: insets.bottom + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* PANTALLA 2FA */}
        {twoFactorPending ? (
          <View style={{ width: '100%', maxWidth: 440, alignItems: 'center' }}>
            <View style={styles.headerTextContainer}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  backgroundColor: theme.tint,
                  borderRadius: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                {twoFactorPending.method === 'email' ? (
                  <Mail color={contrastColor} size={32} />
                ) : (
                  <Smartphone color={contrastColor} size={32} />
                )}
              </View>
              <Text style={[styles.title, { color: theme.text, fontSize: 26, marginBottom: 8 }]}>
                Verificación en Dos Pasos
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary, paddingHorizontal: 20 }]}>
                {twoFactorPending.method === 'email'
                  ? `Introduce el código enviado a ${twoFactorPending.email || email}`
                  : 'Introduce el código generado por tu aplicación autenticadora'}
              </Text>
            </View>

            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={[styles.glassCard, { borderColor: theme.border }]}
            >
              <View style={[styles.form, { paddingHorizontal: 8 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 8 }}>
                  {otp2FA.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={el => {
                        otp2FARefs.current[index] = el;
                      }}
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                          borderColor:
                            focusedInput === `otp${index}`
                              ? theme.tint
                              : isDark
                              ? 'rgba(255, 255, 255, 0.12)'
                              : 'rgba(0, 0, 0, 0.07)',
                          color: theme.text,
                          textAlign: 'center',
                          fontSize: 22,
                          fontWeight: 'bold',
                          flex: 1,
                          paddingHorizontal: 0,
                          height: 54,
                        },
                      ]}
                      value={digit}
                      onChangeText={val => handleCodeChange(index, val, true)}
                      onKeyPress={e => handleKeyPress(index, e, true)}
                      onFocus={() => setFocusedInput(`otp${index}`)}
                      onBlur={() => setFocusedInput(null)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectionColor={theme.tint}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    {
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.65)',
                      borderWidth: 1,
                      backgroundColor: 'transparent',
                      marginTop: 8,
                      overflow: 'hidden',
                      opacity: otp2FA.some(d => d === '') || isLoading ? 0.7 : 1,
                    },
                  ]}
                  onPress={handle2FASubmit}
                  disabled={isLoading || otp2FA.some(d => d === '')}
                  activeOpacity={0.85}
                >
                  <GlassView
                    glassEffectStyle="regular"
                    colorScheme={isDark ? 'dark' : 'light'}
                    style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                  />
                  <View
                    pointerEvents="none"
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        backgroundColor: theme.tint,
                        opacity: isDark ? 0.32 : 0.22,
                        borderRadius: 16,
                      },
                    ]}
                  />
                  {isLoading ? (
                    <ActivityIndicator color={theme.tint} />
                  ) : (
                    <Text style={[styles.loginButtonText, { color: theme.tint }]}>Verificar y Acceder</Text>
                  )}
                </TouchableOpacity>

                {twoFactorPending.method === 'email' && (
                  <TouchableOpacity
                    onPress={handleResend2FA}
                    disabled={resendCooldown > 0 || isLoading}
                    style={{ alignSelf: 'center', marginTop: 18 }}
                  >
                    <Text style={{ color: resendCooldown > 0 ? theme.textSecondary : theme.tint, fontSize: 13, fontWeight: '600' }}>
                      {resendCooldown > 0 ? `Reenviar código en ${resendCooldown}s` : '¿No recibiste el código? Reenviar'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={{ alignSelf: 'center', marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  onPress={cancelTwoFactor}
                >
                  <ArrowLeft size={16} color={theme.textSecondary} />
                  <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '600' }}>Volver al inicio de sesión</Text>
                </TouchableOpacity>
              </View>
            </GlassView>
          </View>
        ) : needsVerification ? (
          /* PANTALLA DE CUENTA NO VERIFICADA */
          <View style={{ width: '100%', maxWidth: 440, alignItems: 'center' }}>
            <View style={styles.headerTextContainer}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  backgroundColor: theme.tint,
                  borderRadius: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Mail color={contrastColor} size={32} />
              </View>
              <Text style={[styles.title, { color: theme.text, fontSize: 26, marginBottom: 8 }]}>Verificar Cuenta</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary, paddingHorizontal: 20 }]}>
                Introduce el código de verificación enviado a <Text style={{ color: theme.text, fontWeight: 'bold' }}>{email}</Text>
              </Text>
            </View>

            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={[styles.glassCard, { borderColor: theme.border }]}
            >
              <View style={[styles.form, { paddingHorizontal: 8 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 8 }}>
                  {verificationCode.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={el => {
                        inputRefs.current[index] = el;
                      }}
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                          borderColor:
                            focusedInput === `ver${index}`
                              ? theme.tint
                              : isDark
                              ? 'rgba(255, 255, 255, 0.12)'
                              : 'rgba(0, 0, 0, 0.07)',
                          color: theme.text,
                          textAlign: 'center',
                          fontSize: 22,
                          fontWeight: 'bold',
                          flex: 1,
                          paddingHorizontal: 0,
                          height: 54,
                        },
                      ]}
                      value={digit}
                      onChangeText={val => handleCodeChange(index, val, false)}
                      onKeyPress={e => handleKeyPress(index, e, false)}
                      onFocus={() => setFocusedInput(`ver${index}`)}
                      onBlur={() => setFocusedInput(null)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectionColor={theme.tint}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    {
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.65)',
                      borderWidth: 1,
                      backgroundColor: 'transparent',
                      marginTop: 8,
                      overflow: 'hidden',
                      opacity: verificationCode.some(d => d === '') || isLoading ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleVerifySubmit}
                  disabled={isLoading || verificationCode.some(d => d === '')}
                  activeOpacity={0.85}
                >
                  <GlassView
                    glassEffectStyle="regular"
                    colorScheme={isDark ? 'dark' : 'light'}
                    style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                  />
                  <View
                    pointerEvents="none"
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        backgroundColor: theme.tint,
                        opacity: isDark ? 0.32 : 0.22,
                        borderRadius: 16,
                      },
                    ]}
                  />
                  {isLoading ? (
                    <ActivityIndicator color={theme.tint} />
                  ) : (
                    <Text style={[styles.loginButtonText, { color: theme.tint }]}>Verificar y Entrar</Text>
                  )}
                </TouchableOpacity>

                <View style={[styles.footer, { marginTop: 20 }]}>
                  <Text style={[styles.footerText, { color: theme.textSecondary }]}>¿No has recibido el código? </Text>
                  <TouchableOpacity
                    onPress={handleResendVerification}
                    disabled={resendCooldown > 0 || isLoading}
                    hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                  >
                    <Text style={[styles.registerText, { color: resendCooldown > 0 ? theme.textSecondary : theme.tint }]}>
                      {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={{ alignSelf: 'center', marginTop: 18 }} onPress={clearVerification}>
                  <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '600' }}>Volver al login</Text>
                </TouchableOpacity>
              </View>
            </GlassView>
          </View>
        ) : (
          /* PANTALLA PRINCIPAL DE LOGIN */
          <>
            <Image
              source={require('@/../assets/images/logo.webp')}
              style={{ width: 72, height: 72, alignSelf: 'center', marginBottom: 12 }}
              resizeMode="contain"
            />

            {/* BADGE "Gratis y Sin Anuncios" */}
            <View style={styles.badgeContainer}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: 'transparent',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.65)',
                    borderWidth: 1,
                    overflow: 'hidden',
                  },
                ]}
              >
                <GlassView
                  glassEffectStyle="regular"
                  colorScheme={isDark ? 'dark' : 'light'}
                  style={[StyleSheet.absoluteFill, { borderRadius: 9999 }]}
                />
                <Sparkles color={theme.tint} size={15} style={{ marginRight: 6 }} />
                <Text style={[styles.badgeText, { color: theme.text }]}>GRATIS Y SIN ANUNCIOS</Text>
              </View>
            </View>

            {/* HEADER TEXTS */}
            <View style={styles.headerTextContainer}>
              <Text style={[styles.title, { color: theme.text }]}>Bienvenido de nuevo</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Inicia sesión para continuar con tu progreso.
              </Text>
            </View>

            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={[styles.glassCard, { borderColor: theme.border }]}
            >
              <View style={styles.form}>
                {maintenanceMode && (
                  <View style={[styles.maintenanceBanner, { backgroundColor: 'rgba(234, 179, 8, 0.15)', borderColor: 'rgba(234, 179, 8, 0.35)' }]}>
                    <Wrench size={16} color="#eab308" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#eab308', fontSize: 12, fontWeight: '700' }}>Estamos en mantenimiento</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                        Volvemos enseguida, ¡gracias por tu paciencia!
                      </Text>
                    </View>
                  </View>
                )}

                {errors.api ? (
                  <View style={[styles.errorBanner, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <Text style={{ color: '#ef4444', fontSize: 12, textAlign: 'center', fontWeight: '600' }}>
                      {errors.api}
                    </Text>
                  </View>
                ) : null}

                {/* EMAIL / USERNAME INPUT */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                        borderColor:
                          errors.email
                            ? '#ef4444'
                            : focusedInput === 'email'
                            ? theme.tint
                            : isDark
                            ? 'rgba(255, 255, 255, 0.12)'
                            : 'rgba(0, 0, 0, 0.07)',
                        color: theme.text,
                      },
                    ]}
                    placeholder="Email o nombre de usuario"
                    placeholderTextColor={theme.textSecondary}
                    value={email}
                    onChangeText={val => {
                      setEmail(val);
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    autoCapitalize="none"
                  />
                  {errors.email ? <Text style={styles.fieldErrorText}>{errors.email}</Text> : null}
                </View>

                {/* PASSWORD INPUT */}
                <View style={styles.inputWrapper}>
                  <View style={{ position: 'relative', justifyContent: 'center' }}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                          borderColor:
                            errors.password
                              ? '#ef4444'
                              : focusedInput === 'password'
                              ? theme.tint
                              : isDark
                              ? 'rgba(255, 255, 255, 0.12)'
                              : 'rgba(0, 0, 0, 0.07)',
                          color: theme.text,
                          paddingRight: 44,
                        },
                      ]}
                      placeholder="Contraseña"
                      placeholderTextColor={theme.textSecondary}
                      value={password}
                      onChangeText={val => {
                        setPassword(val);
                        if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                      }}
                      onFocus={() => setFocusedInput('password')}
                      onBlur={() => setFocusedInput(null)}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={{ position: 'absolute', right: 14 }}
                    >
                      {showPassword ? <EyeOff size={19} color={theme.textSecondary} /> : <Eye size={19} color={theme.textSecondary} />}
                    </TouchableOpacity>
                  </View>
                  {errors.password ? <Text style={styles.fieldErrorText}>{errors.password}</Text> : null}
                </View>

                {/* RECORDAR SESIÓN & OLVIDASTE CONTRASEÑA */}
                <View style={styles.rememberRow}>
                  <TouchableOpacity
                    style={styles.rememberCheckbox}
                    activeOpacity={0.8}
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <View
                      style={[
                        styles.customCheckbox,
                        {
                          borderColor: rememberMe ? theme.tint : isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)',
                          backgroundColor: rememberMe ? theme.tint : isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                        },
                      ]}
                    >
                      {rememberMe && <Check size={12} color="#000" strokeWidth={3} />}
                    </View>
                    <Text style={[styles.rememberText, { color: theme.textSecondary }]}>Recordar sesión</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => router.push('/forgot-password')}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Text style={[styles.forgotText, { color: theme.textSecondary }]}>¿Olvidaste tu contraseña?</Text>
                  </TouchableOpacity>
                </View>

                {/* SUBMIT BUTTON */}
                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    {
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.65)',
                      borderWidth: 1,
                      backgroundColor: 'transparent',
                      overflow: 'hidden',
                      marginTop: 4,
                      opacity: isLoading ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleLoginSubmit}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  <GlassView
                    glassEffectStyle="regular"
                    colorScheme={isDark ? 'dark' : 'light'}
                    style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                  />
                  <View
                    pointerEvents="none"
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        backgroundColor: theme.tint,
                        opacity: isDark ? 0.32 : 0.22,
                        borderRadius: 16,
                      },
                    ]}
                  />
                  {isLoading ? (
                    <ActivityIndicator color={theme.tint} />
                  ) : (
                    <>
                      <LogIn color={theme.tint} size={18} style={{ marginRight: 8 }} />
                      <Text style={[styles.loginButtonText, { color: theme.tint }]}>Iniciar Sesión</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* O CONTINÚA CON */}
                <View style={styles.dividerRow}>
                  <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                  <Text style={[styles.dividerText, { color: theme.textSecondary }]}>O continúa con</Text>
                  <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                </View>

                {/* SOCIAL BUTTONS */}
                <View style={styles.socialContainer}>
                  <TouchableOpacity
                    onPress={handleGoogleClick}
                    disabled={isLoading}
                    style={[
                      styles.socialButton,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.75)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                      },
                    ]}
                  >
                    <GoogleIcon size={22} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleDiscordClick}
                    disabled={isLoading}
                    style={[styles.socialButton, { backgroundColor: '#5865F2', borderColor: '#5865F2' }]}
                  >
                    <DiscordIcon size={22} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleXClick}
                    disabled={isLoading}
                    style={[
                      styles.socialButton,
                      {
                        backgroundColor: colorScheme === 'light' ? '#000' : '#fff',
                        borderColor: colorScheme === 'light' ? '#000' : '#fff',
                      },
                    ]}
                  >
                    <FontAwesome6 name="x-twitter" size={18} color={colorScheme === 'light' ? '#fff' : '#000'} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleGithubClick}
                    disabled={isLoading}
                    style={[
                      styles.socialButton,
                      {
                        backgroundColor: colorScheme === 'light' ? '#333' : '#fff',
                        borderColor: colorScheme === 'light' ? '#333' : '#fff',
                      },
                    ]}
                  >
                    <FontAwesome5 name="github" size={22} color={colorScheme === 'light' ? '#fff' : '#333'} />
                  </TouchableOpacity>
                </View>

                {/* FOOTER */}
                <View style={styles.footer}>
                  <Text style={[styles.footerText, { color: theme.textSecondary }]}>¿Aún no tienes cuenta? </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/register')}
                    hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                  >
                    <Text style={[styles.registerText, { color: theme.tint }]}>Regístrate ahora</Text>
                  </TouchableOpacity>
                </View>

                {/* DISCLAIMER LEGAL Y ENLACES */}
                <View style={[styles.legalFooterContainer, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                  <Text style={[styles.legalNoticeText, { color: colors.textMuted }]}>
                    Al continuar, aceptas nuestros{' '}
                    <Text onPress={() => openLegalModal('terms')} style={{ color: theme.tint, fontWeight: '700' }}>
                      Términos de Servicio
                    </Text>{' '}
                    y nuestra{' '}
                    <Text onPress={() => openLegalModal('privacy')} style={{ color: theme.tint, fontWeight: '700' }}>
                      Política de Privacidad
                    </Text>
                    .
                  </Text>

                  <View style={styles.legalLinksRow}>
                    <TouchableOpacity onPress={() => openLegalModal('privacy')}>
                      <Text style={[styles.legalLink, { color: colors.textSecondary }]}>Política de Privacidad</Text>
                    </TouchableOpacity>
                    <Text style={[styles.legalDot, { color: colors.textMuted }]}>•</Text>
                    <TouchableOpacity onPress={() => openLegalModal('terms')}>
                      <Text style={[styles.legalLink, { color: colors.textSecondary }]}>Términos del Servicio</Text>
                    </TouchableOpacity>
                    <Text style={[styles.legalDot, { color: colors.textMuted }]}>•</Text>
                    <TouchableOpacity onPress={() => openLegalModal('legalNotice')}>
                      <Text style={[styles.legalLink, { color: colors.textSecondary }]}>Aviso Legal</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </GlassView>
          </>
        )}
      </ScrollView>

      {/* MODAL DE INFORMACIÓN LEGAL */}
      <LegalDocumentModal
        visible={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        initialDoc={legalDocType}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  badgeContainer: {
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTextContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  glassCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  form: {
    width: '100%',
    gap: 12,
  },
  maintenanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 4,
  },
  errorBanner: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  inputWrapper: {
    width: '100%',
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  fieldErrorText: {
    color: '#ef4444',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
    paddingHorizontal: 4,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 2,
    paddingHorizontal: 2,
  },
  rememberCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customCheckbox: {
    width: 17,
    height: 17,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberText: {
    fontSize: 12,
    fontWeight: '600',
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loginButton: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 13,
  },
  registerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  legalFooterContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  legalNoticeText: {
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  legalLink: {
    fontSize: 10,
    fontWeight: '600',
  },
  legalDot: {
    fontSize: 10,
    opacity: 0.5,
  },
});
