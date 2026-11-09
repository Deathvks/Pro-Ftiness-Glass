import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Animated,
  useWindowDimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ContentCardBackdrop } from '@/components/ui/ContentCardBackdrop';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import {
  ShieldCheck,
  Smartphone,
  Mail,
  Copy,
  Unlock,
  HelpCircle,
  X,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react-native';

import GlobalHeader from '@/components/GlobalHeader';
import ThemeBackground from '@/components/ThemeBackground';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getThemeBaseBackground } from '@/constants/theme';
import { getContrastTextColor } from '@/utils/colorUtils';
import * as authService from '@/services/authService';

function GlassSurface({
  radius = 24,
  isDark,
  borderColor,
  style,
  children,
}: {
  radius?: number;
  isDark: boolean;
  borderColor: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const innerRadius = Math.max(0, radius - 1);
  return (
    <View style={[{ borderRadius: radius, borderWidth: 1, borderColor, overflow: 'hidden' }, style]}>
      <ContentCardBackdrop
        colorScheme={isDark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, { borderRadius: innerRadius }]}
      />
      {children}
    </View>
  );
}

export default function TwoFactorSetupScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const isMobile = windowWidth < 600;

  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const glassBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
  const subtleItemBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
  const activeTintContrast = getContrastTextColor(colors.tint);

  const userProfile = useAppStore(state => state.userProfile);
  const setUserProfile = useAppStore(state => state.setUserProfile);
  const fetchInitialData = useAppStore(state => state.fetchInitialData);

  const [mode, setMode] = useState<'menu' | 'app' | 'email'>('menu');
  const [isLoading, setIsLoading] = useState(false);
  const [infoModal, setInfoModal] = useState<'app' | 'email' | null>(null);
  const [showDisableModal, setShowDisableModal] = useState(false);

  // Setup data
  const [qrData, setQrData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const otpInputRef = useRef<any>(null);

  const handleBack = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (mode === 'menu' || userProfile?.two_factor_enabled) {
      router.back();
    } else {
      setMode('menu');
      setQrData(null);
      setVerifyCode('');
    }
  };

  const startAppSetup = async () => {
    setIsLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const data = await authService.setup2FAApp();
      setQrData(data);
      setVerifyCode('');
      setMode('app');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo iniciar la configuración de la app.');
    } finally {
      setIsLoading(false);
    }
  };

  const startEmailSetup = async () => {
    setIsLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await authService.setup2FAEmail();
      setVerifyCode('');
      setMode('email');
      useAppStore.getState().showToast?.('Código enviado a tu correo electrónico.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo enviar el código de verificación.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (verifyCode.length < 6) {
      Alert.alert('Código incompleto', 'Por favor, introduce los 6 dígitos del código de seguridad.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'app') {
        if (!qrData?.secret) throw new Error('Falta el secreto de configuración.');
        await authService.enable2FAApp({ token: verifyCode, secret: qrData.secret });
      } else {
        await authService.enable2FAEmail({ code: verifyCode });
      }

      try {
        await fetchInitialData?.();
      } catch {}
      setUserProfile({
        ...userProfile,
        two_factor_enabled: true,
        two_factor_method: mode === 'app' ? 'app' : 'email',
      });

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      useAppStore.getState().showToast?.('¡Verificación en dos pasos activada con éxito!');
      router.back();
    } catch (err: any) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      Alert.alert('Código incorrecto', err?.message || 'El código introducido no es válido o ha caducado.');
      setVerifyCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDisable = async () => {
    setIsLoading(true);
    try {
      await authService.disable2FA();
      try {
        await fetchInitialData?.();
      } catch {}
      setUserProfile({
        ...userProfile,
        two_factor_enabled: false,
        two_factor_method: null,
      });

      setShowDisableModal(false);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {}
      useAppStore.getState().showToast?.('Verificación en dos pasos desactivada.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo desactivar la verificación en dos pasos.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      useAppStore.getState().showToast?.('Clave secreta copiada al portapapeles');
    } catch {
      useAppStore.getState().showToast?.('Copiado');
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background === 'transparent' ? getThemeBaseBackground(theme) : colors.background,
      }}
    >
      <ThemeBackground />

      {/* Header fijo superior */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }} pointerEvents="box-none">
        <GlobalHeader
          title="Seguridad 2FA"
          scrollY={scrollY}
          showBackButton={true}
          onBackPress={handleBack}
        />
      </View>

      <Animated.ScrollView
        contentContainerStyle={{
          paddingHorizontal: isMobile ? 16 : Math.max(16, (windowWidth - 600) / 2),
          paddingTop: insets.top + 72,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      >
        {/* ========================================================= */}
        {/* CASO A: YA ESTÁ ACTIVO                                    */}
        {/* ========================================================= */}
        {userProfile?.two_factor_enabled ? (
          <View style={{ gap: 20, paddingTop: 10 }}>
            <GlassSurface radius={28} isDark={isDark} borderColor={glassBorder} style={styles.cardPaddingCenter}>
              <View style={[styles.largeIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <ShieldCheck size={48} color="#10b981" strokeWidth={1.8} />
              </View>

              <Text style={[styles.mainTitle, { color: colors.text }]}>
                Protección Activada
              </Text>

              <Text style={[styles.bodyDescription, { color: colors.textSecondary }]}>
                Tu cuenta está protegida con verificación en dos pasos mediante{' '}
                <Text style={{ fontWeight: '800', color: colors.text }}>
                  {userProfile.two_factor_method === 'email' ? 'Correo Electrónico' : 'Aplicación Autenticadora'}
                </Text>
                .
              </Text>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' },
                ]}
              />

              <TouchableOpacity
                onPress={() => setShowDisableModal(true)}
                activeOpacity={0.8}
                disabled={isLoading}
                style={[styles.dangerBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <>
                    <Unlock size={18} color="#ef4444" strokeWidth={2.4} />
                    <Text style={styles.dangerBtnText}>Desactivar 2FA</Text>
                  </>
                )}
              </TouchableOpacity>
            </GlassSurface>
          </View>
        ) : mode === 'menu' ? (
          /* ========================================================= */
          /* CASO B: MENÚ DE SELECCIÓN (APP O EMAIL)                   */
          /* ========================================================= */
          <View style={{ gap: 16, paddingTop: 6 }}>
            <View style={{ marginBottom: 4 }}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                Verificación en 2 Pasos
              </Text>
              <Text style={[styles.sectionSubheading, { color: colors.textSecondary }]}>
                Añade una capa extra de seguridad a tu cuenta eligiendo un método de verificación.
              </Text>
            </View>

            {/* Tarjeta Opción 1: Aplicación Autenticadora (Recomendado) */}
            <TouchableOpacity onPress={startAppSetup} activeOpacity={0.8}>
              <GlassSurface
                radius={26}
                isDark={isDark}
                borderColor={colors.tint + '55'}
                style={[styles.menuOptionCard, { backgroundColor: colors.tint + '0C' }]}
              >
                {/* Badge Recomendado */}
                <View style={[styles.recommendedBadge, { backgroundColor: colors.tint }]}>
                  <Text style={[styles.recommendedBadgeText, { color: activeTintContrast }]}>
                    RECOMENDADO
                  </Text>
                </View>

                {/* Botón de Ayuda */}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setInfoModal('app');
                  }}
                  activeOpacity={0.7}
                  style={styles.helpIconBtn}
                >
                  <HelpCircle size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <View style={[styles.optionIconBox, { backgroundColor: colors.tint + '20' }]}>
                  <Smartphone size={32} color={colors.tint} strokeWidth={2} />
                </View>

                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  Aplicación Autenticadora
                </Text>
                <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
                  Usa Google Authenticator, Authy, Microsoft Authenticator u 1Password.
                </Text>

                <View style={[styles.actionRow, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                  <Text style={[styles.actionRowText, { color: colors.tint }]}>
                    CONFIGURAR
                  </Text>
                  <ArrowRight size={16} color={colors.tint} strokeWidth={2.4} />
                </View>
              </GlassSurface>
            </TouchableOpacity>

            {/* Tarjeta Opción 2: Correo Electrónico */}
            <TouchableOpacity onPress={startEmailSetup} activeOpacity={0.8}>
              <GlassSurface
                radius={26}
                isDark={isDark}
                borderColor={glassBorder}
                style={[styles.menuOptionCard, { backgroundColor: subtleItemBg }]}
              >
                {/* Botón de Ayuda */}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setInfoModal('email');
                  }}
                  activeOpacity={0.7}
                  style={styles.helpIconBtn}
                >
                  <HelpCircle size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <View style={[styles.optionIconBox, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}>
                  <Mail size={32} color={colors.tint} strokeWidth={2} />
                </View>

                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  Correo Electrónico
                </Text>
                <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
                  Recibe un código en tu correo registrado cada vez que inicies sesión.
                </Text>

                <View style={[styles.actionRow, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                  <Text style={[styles.actionRowText, { color: colors.tint }]}>
                    CONFIGURAR
                  </Text>
                  <ArrowRight size={16} color={colors.tint} strokeWidth={2.4} />
                </View>
              </GlassSurface>
            </TouchableOpacity>
          </View>
        ) : (
          /* ========================================================= */
          /* CASO C: PROCESO DE INTRODUCCIÓN DE CÓDIGO (APP O EMAIL)   */
          /* ========================================================= */
          <View style={{ gap: 20, paddingTop: 6 }}>
            <GlassSurface radius={28} isDark={isDark} borderColor={glassBorder} style={styles.cardPadding}>
              <View style={styles.setupHeaderRow}>
                <View style={[styles.setupHeaderIcon, { backgroundColor: colors.tint + '1E' }]}>
                  {mode === 'app' ? (
                    <Smartphone size={24} color={colors.tint} strokeWidth={2.2} />
                  ) : (
                    <Mail size={24} color={colors.tint} strokeWidth={2.2} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.setupHeaderTitle, { color: colors.text }]}>
                    {mode === 'app' ? 'Configurar App' : 'Verificar Email'}
                  </Text>
                  <Text style={[styles.setupHeaderSub, { color: colors.textSecondary }]}>
                    {mode === 'app'
                      ? 'Escanea el código QR o copia la clave'
                      : `Código enviado a ${userProfile?.email || 'tu email'}`}
                  </Text>
                </View>
              </View>

              {/* Si es APP, mostrar QR y Secreto */}
              {mode === 'app' && qrData && (
                <View style={styles.qrContainer}>
                  <View style={styles.qrWhiteBox}>
                    <Image
                      source={{ uri: qrData.qrCodeUrl }}
                      style={{ width: 180, height: 180 }}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={[styles.qrHelpText, { color: colors.textSecondary }]}>
                    Escanea este código QR con tu aplicación autenticadora favorita.
                  </Text>

                  {/* Clave de texto con botón Copiar */}
                  <View style={[styles.secretBox, { backgroundColor: subtleItemBg, borderColor: glassBorder }]}>
                    <Text
                      style={[styles.secretText, { color: colors.text }]}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {qrData.secret}
                    </Text>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(qrData.secret)}
                      activeOpacity={0.7}
                      style={[styles.copyBtn, { backgroundColor: colors.tint + '20' }]}
                    >
                      <Copy size={16} color={colors.tint} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Si es EMAIL, mostrar icono y mensaje */}
              {mode === 'email' && (
                <View style={styles.emailContainer}>
                  <View style={[styles.emailNoticeBox, { backgroundColor: colors.tint + '12', borderColor: colors.tint + '30' }]}>
                    <Mail size={28} color={colors.tint} style={{ marginBottom: 6 }} />
                    <Text style={[styles.emailNoticeTitle, { color: colors.text }]}>
                      Comprueba tu bandeja de entrada
                    </Text>
                    <Text style={[styles.emailNoticeSub, { color: colors.textSecondary }]}>
                      Hemos enviado un código de 6 dígitos a{' '}
                      <Text style={{ fontWeight: '800', color: colors.tint }}>{userProfile?.email}</Text>.
                    </Text>
                  </View>
                </View>
              )}

              {/* CÓDIGO OTP (6 DÍGITOS) */}
              <View style={styles.otpSection}>
                <Text style={[styles.otpLabel, { color: colors.textSecondary }]}>
                  CÓDIGO DE VERIFICACIÓN (6 DÍGITOS)
                </Text>

                {/* Cajas interactivas para los 6 dígitos */}
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => otpInputRef.current?.focus()}
                  style={styles.otpBoxesRow}
                >
                  {[0, 1, 2, 3, 4, 5].map(idx => {
                    const digit = verifyCode[idx] || '';
                    const isFocused = verifyCode.length === idx;
                    return (
                      <View
                        key={idx}
                        style={[
                          styles.otpBox,
                          {
                            backgroundColor: subtleItemBg,
                            borderColor: digit
                              ? colors.tint
                              : isFocused
                              ? colors.tint + '99'
                              : isDark
                              ? 'rgba(255, 255, 255, 0.12)'
                              : 'rgba(0, 0, 0, 0.1)',
                          },
                          digit ? { borderWidth: 2 } : null,
                        ]}
                      >
                        <Text style={[styles.otpBoxText, { color: digit ? colors.tint : colors.text }]}>
                          {digit}
                        </Text>
                      </View>
                    );
                  })}
                </TouchableOpacity>

                {/* Input oculto real que captura el teclado numérico */}
                <TextInput
                  ref={otpInputRef}
                  value={verifyCode}
                  onChangeText={val => {
                    const clean = val.replace(/\D/g, '').slice(0, 6);
                    setVerifyCode(clean);
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.hiddenOtpInput}
                  autoFocus={true}
                />

                <TouchableOpacity
                  onPress={handleVerifyAndEnable}
                  activeOpacity={0.8}
                  disabled={verifyCode.length < 6 || isLoading}
                  style={[
                    styles.primaryActionBtn,
                    {
                      backgroundColor: colors.tint,
                      opacity: verifyCode.length < 6 || isLoading ? 0.5 : 1,
                    },
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={activeTintContrast} />
                  ) : (
                    <>
                      <CheckCircle2 size={20} color={activeTintContrast} style={{ marginRight: 6 }} />
                      <Text style={[styles.primaryActionBtnText, { color: activeTintContrast }]}>
                        Verificar y Activar
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setMode('menu');
                    setVerifyCode('');
                  }}
                  activeOpacity={0.7}
                  style={styles.cancelTextBtn}
                >
                  <Text style={[styles.cancelTextBtnLabel, { color: colors.textSecondary }]}>
                    Cancelar y volver al menú
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassSurface>
          </View>
        )}
      </Animated.ScrollView>

      {/* ========================================================= */}
      {/* MODAL DE INFORMACIÓN (APP / EMAIL)                       */}
      {/* ========================================================= */}
      <Modal visible={infoModal !== null} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <GlassSurface radius={28} isDark={isDark} borderColor={glassBorder} style={styles.infoModalCard}>
            <View style={styles.infoModalTopRow}>
              <View style={[styles.setupHeaderIcon, { backgroundColor: colors.tint + '20' }]}>
                {infoModal === 'app' ? (
                  <Smartphone size={24} color={colors.tint} />
                ) : (
                  <Mail size={24} color={colors.tint} />
                )}
              </View>
              <Text style={[styles.infoModalTitle, { color: colors.text }]}>
                {infoModal === 'app' ? 'Autenticación por App' : 'Autenticación por Email'}
              </Text>
              <TouchableOpacity
                onPress={() => setInfoModal(null)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.infoModalText, { color: colors.textSecondary }]}>
              {infoModal === 'app'
                ? `Este método es el más seguro y recomendado.\n\nFunciona mediante una aplicación externa (Google Authenticator, Authy o Microsoft Authenticator) instalada en tu móvil.\n\n1. Escaneas el código QR o copias la clave secreta.\n2. La app generará códigos temporales de 6 dígitos cada 30 segundos.\n3. Funciona incluso sin cobertura ni internet.\n\nDeberás introducir uno de estos códigos cada vez que inicies sesión.`
                : `Este método utiliza tu correo electrónico como segundo factor de seguridad.\n\n1. Cada vez que inicies sesión, te enviaremos un código único a tu email registrado.\n2. Revisa tu bandeja de entrada e introdúcelo para acceder.\n\nEs una opción cómoda que no requiere instalar aplicaciones adicionales.`}
            </Text>

            <TouchableOpacity
              onPress={() => setInfoModal(null)}
              activeOpacity={0.8}
              style={[styles.primaryActionBtn, { backgroundColor: colors.tint, marginTop: 16 }]}
            >
              <Text style={[styles.primaryActionBtnText, { color: activeTintContrast }]}>
                Entendido
              </Text>
            </TouchableOpacity>
          </GlassSurface>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL DE CONFIRMACIÓN DE DESACTIVACIÓN                   */}
      {/* ========================================================= */}
      <Modal visible={showDisableModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <GlassSurface radius={28} isDark={isDark} borderColor="rgba(239, 68, 68, 0.3)" style={styles.infoModalCard}>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <View style={[styles.largeIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)', width: 64, height: 64, borderRadius: 20 }]}>
                <ShieldAlert size={34} color="#ef4444" />
              </View>
              <Text style={[styles.infoModalTitle, { color: colors.text, marginTop: 10 }]}>
                ¿Desactivar 2FA?
              </Text>
              <Text style={[styles.infoModalText, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
                Si desactivas la verificación en dos pasos, tu cuenta será menos segura. Solo necesitarás tu contraseña para entrar.
              </Text>
            </View>

            <View style={{ gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                onPress={confirmDisable}
                activeOpacity={0.8}
                disabled={isLoading}
                style={[styles.dangerBtn, { backgroundColor: '#ef4444', borderColor: 'transparent' }]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={[styles.dangerBtnText, { color: '#ffffff' }]}>Sí, desactivar 2FA</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowDisableModal(false)}
                activeOpacity={0.7}
                style={[styles.cancelBtn, { borderColor: glassBorder }]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </GlassSurface>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  cardPadding: {
    padding: 20,
  },
  cardPaddingCenter: {
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
  },
  largeIconBadge: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 8,
  },
  bodyDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 20,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  dangerBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ef4444',
  },
  sectionHeading: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  sectionSubheading: {
    fontSize: 13,
    lineHeight: 18,
  },
  menuOptionCard: {
    padding: 22,
    alignItems: 'center',
    position: 'relative',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopLeftRadius: 26,
    borderBottomRightRadius: 16,
    zIndex: 10,
  },
  recommendedBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  helpIconBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
    zIndex: 10,
  },
  optionIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionRowText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  setupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  setupHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  setupHeaderSub: {
    fontSize: 12,
    marginTop: 2,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  qrWhiteBox: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  qrHelpText: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 280,
  },
  secretBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 6,
  },
  secretText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
    flex: 1,
    marginRight: 8,
  },
  copyBtn: {
    padding: 8,
    borderRadius: 10,
  },
  emailContainer: {
    marginBottom: 20,
  },
  emailNoticeBox: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    textAlign: 'center',
  },
  emailNoticeTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  emailNoticeSub: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  otpSection: {
    width: '100%',
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxText: {
    fontSize: 22,
    fontWeight: '800',
  },
  hiddenOtpInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 18,
  },
  primaryActionBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  cancelTextBtn: {
    paddingVertical: 12,
    marginTop: 4,
  },
  cancelTextBtnLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoModalCard: {
    width: '100%',
    maxWidth: 420,
    padding: 22,
  },
  infoModalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  infoModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
  },
  modalCloseBtn: {
    padding: 6,
  },
  infoModalText: {
    fontSize: 13,
    lineHeight: 19,
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
