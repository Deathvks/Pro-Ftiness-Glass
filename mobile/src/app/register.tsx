import React, { useState } from 'react';
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
import { Sparkles, UserPlus, ArrowRight, CheckCircle2, Eye, EyeOff, Mail, Check, ShieldCheck, Scale, FileText } from 'lucide-react-native';
import { FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastColor } from '@/utils/colorUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { LinearGradient } from 'expo-linear-gradient';
import useAppStore from '@/store/useAppStore';
import { registerUser, verifyEmail, resendVerificationEmail } from '@/services/authService';
import { EMAIL_CONSENT_VERSION, EMAIL_CONSENT_TEXT } from '@/config/emailConsent';
import { LegalDocumentModal, LegalDocType } from '@/components/modals/LegalDocumentModal';

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

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // RGPD & Consentimientos legales (idéntico al frontend)
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingEmailConsent, setMarketingEmailConsent] = useState(false);
  const [coachingEmailConsent, setCoachingEmailConsent] = useState(false);

  // Modal Legal
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalDocType, setLegalDocType] = useState<LegalDocType>('privacy');

  // Verification state
  const [needsVerification, setNeedsVerification] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(10);
  const inputRefs = React.useRef<Array<any>>([]);

  const router = useRouter();
  const colors = useAppColors();
  const theme = colors;
  const currentStoreTheme = useAppStore(state => state.theme);
  const isDark = !['light', 'ocean', 'desert'].includes(currentStoreTheme);
  const contrastColor = getContrastColor(theme.tint, currentStoreTheme);
  const colorScheme = useDeviceColorScheme();
  const insets = useSafeAreaInsets();

  const handleGoogleLogin = useAppStore(state => state.handleGoogleLogin);
  const handleDiscordLogin = useAppStore(state => state.handleDiscordLogin);
  const handleXLogin = useAppStore(state => state.handleXLogin);
  const handleGithubLogin = useAppStore(state => state.handleGithubLogin);

  // Requisitos interactivos de contraseña
  const reqs = [
    { id: 'length', label: 'Al menos 12 caracteres', valid: password.length >= 12 },
    { id: 'upper', label: 'Una mayúscula', valid: /[A-Z]/.test(password) },
    { id: 'lower', label: 'Una minúscula', valid: /[a-z]/.test(password) },
    { id: 'special', label: 'Un carácter especial (!@#$...)', valid: /[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/'`]/.test(password) },
    { id: 'digits', label: 'No más de 3 números seguidos', valid: !/\d{4,}/.test(password) && password.length > 0 },
  ];
  const isValidPassword = reqs.every(r => r.valid);
  const isMatchingPassword = confirmPassword.length > 0 && password === confirmPassword;

  // Lógica para 6 cuadros de código de verificación
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, e: any) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (resendCooldown > 0 && needsVerification) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown, needsVerification]);

  React.useEffect(() => {
    const savedNeedsVerification = typeof localStorage !== 'undefined' ? localStorage.getItem('needs_verification') : null;
    const savedEmail = typeof localStorage !== 'undefined' ? localStorage.getItem('verification_email') : null;
    if (savedNeedsVerification === 'true' && savedEmail) {
      setNeedsVerification(true);
      setEmail(savedEmail);
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

  const openLegalModal = (doc: LegalDocType | 'cookies') => {
    if (doc === 'terms') router.push('/terms');
    else if (doc === 'legalNotice') router.push('/legal-notice');
    else if (doc === 'cookies') router.push('/cookies');
    else router.push('/privacy');
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
    if (!username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido.';
    } else if (username.length < 3 || username.length > 30) {
      newErrors.username = 'Debe tener entre 3 y 30 caracteres.';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      newErrors.username = 'Sin espacios ni caracteres extraños.';
    }

    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es requerido.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Correo electrónico no válido.';
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida.';
    } else if (!isValidPassword) {
      newErrors.password = 'La contraseña no cumple todos los requisitos.';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    if (!acceptedTerms) {
      newErrors.acceptedTerms = 'Debes aceptar los Términos de Servicio y la Política de Privacidad para continuar.';
    }

    return newErrors;
  };

  const handleRegisterSubmit = async () => {
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      const firstError = Object.values(formErrors)[0];
      alert(firstError);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const currentRef = typeof localStorage !== 'undefined' ? localStorage.getItem('pending_ref') : null;

      await registerUser({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        social_privacy: 'private',
        consentAccepted: true,
        consentTimestamp: new Date().toISOString(),
        marketingEmailConsent,
        coachingEmailConsent,
        emailConsentVersion: EMAIL_CONSENT_VERSION,
        referralCode: currentRef || undefined,
      });

      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('pending_ref');
      }

      startVerification(email.trim().toLowerCase());
    } catch (error: any) {
      const errorMessage = error.message || 'Error al registrarse. Inténtalo de nuevo.';
      setErrors({ api: errorMessage });
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async () => {
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      alert('El código debe tener 6 dígitos');
      return;
    }
    setIsLoading(true);
    try {
      await verifyEmail({ email, code: verificationCode });
      alert('¡Cuenta verificada exitosamente! Ya puedes iniciar sesión.');
      clearVerification();
      router.replace('/login');
    } catch (error: any) {
      alert('Código incorrecto o expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      await resendVerificationEmail(email);
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
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!needsVerification ? (
          <>
            <Image
              source={require('@/../assets/images/logo.webp')}
              style={{ width: 72, height: 72, alignSelf: 'center', marginBottom: 12 }}
              resizeMode="contain"
            />

            {/* BADGE "100% Gratis y Sin Anuncios" */}
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
                <Text style={[styles.badgeText, { color: theme.text }]}>100% GRATIS Y SIN ANUNCIOS</Text>
              </View>
            </View>

            {/* HEADER TEXTS */}
            <View style={styles.headerTextContainer}>
              <Text style={[styles.title, { color: theme.text }]}>Crea tu cuenta</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Empieza tu transformación hoy mismo.
              </Text>
            </View>

            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={[styles.glassCard, { borderColor: theme.border }]}
            >
              <View style={styles.form}>
                {errors.api ? (
                  <View style={[styles.errorBanner, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <Text style={{ color: '#ef4444', fontSize: 12, textAlign: 'center', fontWeight: '600' }}>
                      {errors.api}
                    </Text>
                  </View>
                ) : null}

                {/* USERNAME INPUT */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                        borderColor:
                          errors.username
                            ? '#ef4444'
                            : focusedInput === 'username'
                            ? theme.tint
                            : isDark
                            ? 'rgba(255, 255, 255, 0.12)'
                            : 'rgba(0, 0, 0, 0.07)',
                        color: theme.text,
                      },
                    ]}
                    placeholder="Nombre de usuario"
                    placeholderTextColor={theme.textSecondary}
                    value={username}
                    onChangeText={val => {
                      setUsername(val);
                      if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
                    }}
                    onFocus={() => setFocusedInput('username')}
                    onBlur={() => setFocusedInput(null)}
                    autoCapitalize="none"
                    maxLength={30}
                  />
                  {errors.username ? <Text style={styles.fieldErrorText}>{errors.username}</Text> : null}
                </View>

                {/* EMAIL INPUT */}
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
                    placeholder="Correo electrónico"
                    placeholderTextColor={theme.textSecondary}
                    value={email}
                    onChangeText={val => {
                      setEmail(val);
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    autoCapitalize="none"
                    keyboardType="email-address"
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

                  {/* Requirements checklist in real time */}
                  {password.length > 0 && (
                    <View style={styles.reqGrid}>
                      {reqs.map(r => (
                        <View key={r.id} style={styles.reqItem}>
                          {r.valid ? (
                            <CheckCircle2 size={12} color="#10B981" />
                          ) : (
                            <View style={[styles.reqDot, { borderColor: theme.border }]} />
                          )}
                          <Text style={[styles.reqText, { color: r.valid ? theme.text : theme.textSecondary }]}>
                            {r.label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* CONFIRM PASSWORD INPUT */}
                <View style={styles.inputWrapper}>
                  <View style={{ position: 'relative', justifyContent: 'center' }}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                          borderColor:
                            errors.confirmPassword
                              ? '#ef4444'
                              : focusedInput === 'confirm'
                              ? theme.tint
                              : isDark
                              ? 'rgba(255, 255, 255, 0.12)'
                              : 'rgba(0, 0, 0, 0.07)',
                          color: theme.text,
                          paddingRight: 44,
                        },
                      ]}
                      placeholder="Confirmar contraseña"
                      placeholderTextColor={theme.textSecondary}
                      value={confirmPassword}
                      onChangeText={val => {
                        setConfirmPassword(val);
                        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                      }}
                      onFocus={() => setFocusedInput('confirm')}
                      onBlur={() => setFocusedInput(null)}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={{ position: 'absolute', right: 14 }}
                    >
                      {showConfirmPassword ? <EyeOff size={19} color={theme.textSecondary} /> : <Eye size={19} color={theme.textSecondary} />}
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword ? <Text style={styles.fieldErrorText}>{errors.confirmPassword}</Text> : null}

                  {confirmPassword.length > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingHorizontal: 4 }}>
                      {isMatchingPassword ? (
                        <>
                          <CheckCircle2 size={12} color="#10B981" />
                          <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '600' }}>Las contraseñas coinciden</Text>
                        </>
                      ) : (
                        <>
                          <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: '#ef4444' }} />
                          <Text style={{ fontSize: 11, color: '#ef4444', fontWeight: '500' }}>Las contraseñas aún no coinciden</Text>
                        </>
                      )}
                    </View>
                  )}
                </View>

                {/* CHECKBOX OBLIGATORIO DE CONSENTIMIENTO RGPD / LOPDGDD */}
                <View style={styles.consentBlock}>
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    activeOpacity={0.8}
                    onPress={() => {
                      const next = !acceptedTerms;
                      setAcceptedTerms(next);
                      if (next && errors.acceptedTerms) {
                        setErrors(prev => ({ ...prev, acceptedTerms: '' }));
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.customCheckbox,
                        {
                          borderColor: acceptedTerms ? theme.tint : isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)',
                          backgroundColor: acceptedTerms ? theme.tint : isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                        },
                      ]}
                    >
                      {acceptedTerms && <Check size={13} color="#000" strokeWidth={3} />}
                    </View>

                    <Text style={[styles.consentText, { color: theme.textSecondary }]}>
                      He leído y acepto los{' '}
                      <Text
                        onPress={() => openLegalModal('terms')}
                        style={[styles.legalInlineLink, { color: theme.tint }]}
                      >
                        Términos de Servicio
                      </Text>{' '}
                      y la{' '}
                      <Text
                        onPress={() => openLegalModal('privacy')}
                        style={[styles.legalInlineLink, { color: theme.tint }]}
                      >
                        Política de Privacidad
                      </Text>
                      . Confirmo tener al menos 14 años y autorizo el tratamiento de mis datos de entrenamiento y nutrición.
                    </Text>
                  </TouchableOpacity>
                  {errors.acceptedTerms ? (
                    <Text style={[styles.fieldErrorText, { color: '#ef4444' }]}>{errors.acceptedTerms}</Text>
                  ) : null}
                </View>

                {/* CHECKBOXES OPCIONALES DE CORREOS */}
                <View style={{ gap: 8, marginTop: 4 }}>
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    activeOpacity={0.8}
                    onPress={() => setMarketingEmailConsent(!marketingEmailConsent)}
                  >
                    <View
                      style={[
                        styles.customCheckbox,
                        {
                          borderColor: marketingEmailConsent ? theme.tint : isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)',
                          backgroundColor: marketingEmailConsent ? theme.tint : isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                        },
                      ]}
                    >
                      {marketingEmailConsent && <Check size={13} color="#000" strokeWidth={3} />}
                    </View>
                    <Text style={[styles.consentText, { color: theme.textSecondary }]}>
                      {EMAIL_CONSENT_TEXT.training}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.checkboxRow}
                    activeOpacity={0.8}
                    onPress={() => setCoachingEmailConsent(!coachingEmailConsent)}
                  >
                    <View
                      style={[
                        styles.customCheckbox,
                        {
                          borderColor: coachingEmailConsent ? theme.tint : isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)',
                          backgroundColor: coachingEmailConsent ? theme.tint : isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                        },
                      ]}
                    >
                      {coachingEmailConsent && <Check size={13} color="#000" strokeWidth={3} />}
                    </View>
                    <Text style={[styles.consentText, { color: theme.textSecondary }]}>
                      {EMAIL_CONSENT_TEXT.coaching}
                    </Text>
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
                      marginTop: 10,
                      opacity: isLoading || !isValidPassword || !isMatchingPassword || !acceptedTerms ? 0.6 : 1,
                    },
                  ]}
                  onPress={handleRegisterSubmit}
                  disabled={isLoading || !isValidPassword || !isMatchingPassword || !acceptedTerms}
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
                      <UserPlus color={theme.tint} size={18} style={{ marginRight: 8 }} />
                      <Text style={[styles.loginButtonText, { color: theme.tint }]}>Registrarse</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* O REGÍSTRATE CON */}
                <View style={styles.dividerRow}>
                  <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                  <Text style={[styles.dividerText, { color: theme.textSecondary }]}>O regístrate con</Text>
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

                {/* TEST INTERACTIVO */}
                <TouchableOpacity
                  onPress={() => router.push('/onboarding')}
                  style={[styles.quizCard, { borderColor: theme.border }]}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={[theme.tint + '90', theme.card]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.quizInner}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12 }}>
                        <Sparkles size={16} color="#FDE047" />
                      </View>
                      <View>
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 }}>TEST INTERACTIVO</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, marginTop: 2 }}>Tu plan ideal en &lt; 2 min.</Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: '#fff', padding: 8, borderRadius: 12 }}>
                      <ArrowRight size={16} color={theme.tint} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {/* FOOTER */}
                <View style={styles.footer}>
                  <Text style={[styles.footerText, { color: theme.textSecondary }]}>¿Ya tienes cuenta? </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/login')}
                    hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                  >
                    <Text style={[styles.registerText, { color: theme.tint }]}>Inicia sesión</Text>
                  </TouchableOpacity>
                </View>

                {/* DISCLAIMER RGPD / LOPDGDD Y ENLACES LEGALES */}
                <View style={[styles.legalFooterContainer, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                  <Text style={[styles.legalNoticeText, { color: colors.textMuted }]}>
                    Pro Fitness Glass cumple con el RGPD y la LOPDGDD. Consulta nuestros{' '}
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
                    <Text style={[styles.legalDot, { color: colors.textMuted }]}>•</Text>
                    <TouchableOpacity onPress={() => router.push('/cookies')}>
                      <Text style={[styles.legalLink, { color: colors.textSecondary }]}>Cookies</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </GlassView>
          </>
        ) : (
          /* PANTALLA DE VERIFICACIÓN DE EMAIL */
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
              <Text style={[styles.title, { color: theme.text, fontSize: 28, marginBottom: 8 }]}>Verificar Email</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary, paddingHorizontal: 20 }]}>
                Hemos enviado un código de 6 dígitos a <Text style={{ color: theme.text, fontWeight: 'bold' }}>{email}</Text>
              </Text>
            </View>

            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={[styles.glassCard, { borderColor: theme.border }]}
            >
              <View style={[styles.form, { paddingHorizontal: 8 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 8 }}>
                  {code.map((digit, index) => (
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
                            focusedInput === `code${index}`
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
                      onChangeText={val => handleCodeChange(index, val)}
                      onKeyPress={e => handleKeyPress(index, e)}
                      onFocus={() => setFocusedInput(`code${index}`)}
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
                      opacity: code.some(d => d === '') || isLoading ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleVerifySubmit}
                  disabled={isLoading || code.some(d => d === '')}
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
                    <Text style={[styles.loginButtonText, { color: theme.tint }]}>Verificar Código</Text>
                  )}
                </TouchableOpacity>

                <View style={[styles.footer, { marginTop: 20 }]}>
                  <Text style={[styles.footerText, { color: theme.textSecondary }]}>¿No has recibido el código? </Text>
                  <TouchableOpacity
                    onPress={handleResendCode}
                    disabled={resendCooldown > 0 || isLoading}
                    hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                  >
                    <Text style={[styles.registerText, { color: resendCooldown > 0 ? theme.textSecondary : theme.tint }]}>
                      {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={{ alignSelf: 'center', marginTop: 18 }} onPress={clearVerification}>
                  <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '600' }}>Volver al registro</Text>
                </TouchableOpacity>
              </View>
            </GlassView>
          </View>
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
  errorBanner: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  reqGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 6,
    columnGap: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '47%',
    gap: 5,
  },
  reqDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  reqText: {
    fontSize: 10,
    fontWeight: '500',
  },
  consentBlock: {
    marginTop: 2,
    gap: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  customCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  consentText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  legalInlineLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
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
  quizCard: {
    marginTop: 6,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  quizInner: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
