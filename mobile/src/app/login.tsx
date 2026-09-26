import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, useColorScheme as useDeviceColorScheme, ScrollView } from 'react-native';
import useAppStore from '@/store/useAppStore';
import { useRouter, Link } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LogIn, Sparkles, Eye, EyeOff, CheckCircle2, Mail } from 'lucide-react-native';
import { FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { LinearGradient } from 'expo-linear-gradient';
import * as Google from 'expo-auth-session/providers/google';
import { verifyEmail, resendVerificationEmail } from '@/services/authService';

WebBrowser.maybeCompleteAuthSession();

const GoogleIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <Path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <Path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
    <Path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
  </Svg>
);

const DiscordIcon = ({ size, color }: { size: number, color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 640 512">
    <Path fill={color} d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z" />
  </Svg>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Verification state
  const [needsVerification, setNeedsVerification] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);

  const [googleRequest, googleResponse, promptAsyncGoogle] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  });

  const handleGoogleLogin = useAppStore(state => state.handleGoogleLogin);

  React.useEffect(() => {
    if (googleResponse?.type === 'success' && googleResponse.authentication?.accessToken) {
      setIsLoading(true);
      handleGoogleLogin({ token: googleResponse.authentication.accessToken }).finally(() => {
        setIsLoading(false);
      });
    }
  }, [googleResponse]);
  const [resendCooldown, setResendCooldown] = useState(10);
  const inputRefs = React.useRef<Array<TextInput | null>>([]);

  // Lógica para manejar el cambio en cada uno de los 6 cuadros
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Solo números
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus al siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, e: any) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle cooldown timer
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0 && needsVerification) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown, needsVerification]);

  // Load saved verification state on mount
  React.useEffect(() => {
    const savedNeedsVerification = localStorage.getItem('needs_verification');
    const savedEmail = localStorage.getItem('verification_email');
    if (savedNeedsVerification === 'true' && savedEmail) {
      setNeedsVerification(true);
      setEmail(savedEmail);
    }
  }, []);

  const startVerification = (emailAddress: string) => {
    setNeedsVerification(true);
    setResendCooldown(10);
    localStorage.setItem('needs_verification', 'true');
    localStorage.setItem('verification_email', emailAddress);
  };

  const clearVerification = () => {
    setNeedsVerification(false);
    localStorage.removeItem('needs_verification');
    localStorage.removeItem('verification_email');
  };

  const handleLogin = useAppStore(state => state.handleLogin);
  
  const handleDiscordLogin = useAppStore(state => state.handleDiscordLogin);
  const handleXLogin = useAppStore(state => state.handleXLogin);
  const handleGithubLogin = useAppStore(state => state.handleGithubLogin);

  const router = useRouter();
  const theme = useTheme();
  
  // Expo BlurView tint
  const colorScheme = useDeviceColorScheme();
  const blurTint = colorScheme === 'light' ? 'light' : 'dark';
  const insets = useSafeAreaInsets();

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'mobile' });

  // Custom helper to replace the removed AuthSession.startAsync
  const startAsync = async ({ authUrl, returnUrl }: { authUrl: string, returnUrl: string }) => {
    const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);
    if (result.type === 'success' && result.url) {
      const params: Record<string, string> = {};
      // OAuth variables are usually after ? or #
      const queryPart = result.url.includes('#') ? result.url.split('#')[1] : result.url.split('?')[1];
      if (queryPart) {
        queryPart.split('&').forEach(pair => {
          const [key, value] = pair.split('=');
          if (key) params[key] = decodeURIComponent(value || '');
        });
      }
      return { type: 'success', params, url: result.url };
    }
    return result;
  };

  const handleGoogleClick = () => {
    promptAsyncGoogle();
  };

  const handleDiscordClick = async () => {
    try {
      const DISCORD_CLIENT_ID = process.env.EXPO_PUBLIC_DISCORD_CLIENT_ID;
      const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=identify%20email&state=discord`;
      const result = await startAsync({ authUrl, returnUrl: redirectUri });
      if (result.type === 'success' && result.params.access_token) {
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
      if (result.type === 'success' && result.params.code) {
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
      if (result.type === 'success' && result.params.code) {
        setIsLoading(true);
        await handleGithubLogin({ code: result.params.code });
      }
    } catch (e: any) {
      alert('Error conectando con Github: ' + (e.message || e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async () => {
    if (!email || !password) {
      alert('Por favor, rellena todos los campos');
      return;
    }
    setIsLoading(true);
    try {
      await handleLogin({ email, password });
    } catch (error: any) {
      if (error?.data?.requiresVerification) {
        startVerification(email);
        alert('Tu cuenta no está verificada. Por favor, verifica tu email.');
      } else {
        alert('Error al iniciar sesión: ' + (error.message || 'Credenciales incorrectas'));
      }
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
      alert('¡Cuenta verificada exitosamente! Iniciando sesión...');
      clearVerification();
      // After successful verify, log them in automatically
      await handleLogin({ email, password });
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
      await resendVerificationEmail({ email });
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
      <LinearGradient
        colors={[theme.tint + '15', 'transparent']} // Equivalente a accent/5 aprox
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView 
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={[
          styles.contentWrapper, 
          { 
            flexGrow: 1, 
            paddingTop: 80, 
            paddingBottom: 60
          }
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={{ flex: 1, minHeight: 20 }} />
        
        {/* LOGO */}
        <Image 
          source={require('../../assets/images/logo.webp')} 
          style={styles.logo} 
          resizeMode="contain"
        />

        {/* BADGE "Gratis y Sin Anuncios" */}
        <View style={styles.badgeContainer}>
          <BlurView intensity={40} tint={blurTint} style={[styles.badge, { 
            backgroundColor: theme.card + '60', // 40% opacity del color de la tarjeta
            borderColor: theme.border + '80' 
          }]}>
            <Sparkles color={theme.tint} size={16} style={{ marginRight: 6 }} />
            <Text style={[styles.badgeText, { color: theme.text }]}>
              GRATIS Y SIN ANUNCIOS
            </Text>
          </BlurView>
        </View>

        {needsVerification ? (
          <>
            <View style={styles.headerTextContainer}>
              <View style={{ width: 64, height: 64, backgroundColor: theme.tint, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Mail color={theme.background} size={32} />
              </View>
              <Text style={[styles.title, { color: theme.text, fontSize: 32, marginBottom: 8 }]}>Verificar Email</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary, paddingHorizontal: 20 }]}>
                Hemos enviado un código de 6 dígitos a <Text style={{ color: theme.text, fontWeight: 'bold' }}>{email}</Text>
              </Text>
            </View>
            <View style={styles.glassCardWrapper}>
              <BlurView intensity={50} tint={blurTint} style={[styles.glassCard, { 
                backgroundColor: theme.card + '40',
                borderColor: theme.border + '80'
              }]}>
                <View style={[styles.form, { paddingHorizontal: 16 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 8 }}>
                    {code.map((digit, index) => (
                      <TextInput 
                        key={index}
                        ref={(el) => inputRefs.current[index] = el}
                        style={[
                          styles.input, 
                          { 
                            backgroundColor: theme.background + '80',
                            borderColor: focusedInput === `code${index}` ? theme.tint : theme.border,
                            color: theme.text,
                            textAlign: 'center',
                            fontSize: 24,
                            fontWeight: 'bold',
                            flex: 1,
                            paddingHorizontal: 0,
                            height: 56
                          }
                        ]}
                        value={digit}
                        onChangeText={(val) => handleCodeChange(index, val)}
                        onKeyPress={(e) => handleKeyPress(index, e)}
                        onFocus={() => setFocusedInput(`code${index}`)}
                        onBlur={() => setFocusedInput(null)}
                        keyboardType='number-pad'
                        maxLength={1}
                      />
                    ))}
                  </View>

                  <TouchableOpacity 
                    style={[styles.loginButton, { backgroundColor: theme.tint, shadowColor: theme.tint, marginTop: 12, opacity: code.some(d => d === '') ? 0.7 : 1 }]}
                    onPress={handleVerifySubmit}
                    disabled={isLoading || code.some(d => d === '')}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#0f172a" />
                    ) : (
                      <Text style={styles.loginButtonText}>Verificar Código</Text>
                    )}
                  </TouchableOpacity>

                  <View style={[styles.footer, { marginTop: 24, borderTopWidth: 0, paddingTop: 0 }]}>
                    <Text style={[styles.footerText, { color: theme.textSecondary }]}>¿No has recibido el código? </Text>
                    <TouchableOpacity 
                      onPress={handleResendCode}
                      disabled={resendCooldown > 0 || isLoading}
                      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                      style={{ padding: 4 }}
                    >
                      <Text style={[styles.registerText, { color: resendCooldown > 0 ? theme.textSecondary : theme.tint }]}>
                        {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity 
                    style={{ alignSelf: 'center', marginTop: 24 }}
                    onPress={clearVerification}
                  >
                    <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Volver al inicio de sesión</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </View>
          </>
        ) : (
          <>
            {/* HEADER TEXTS */}
            <View style={styles.headerTextContainer}>
              <Text style={[styles.title, { color: theme.text }]}>Pro Fitness Glass</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Inicia sesión para continuar con tu progreso.</Text>
            </View>

            {/* GLASSCARD WRAPPER PARA SOMBRA */}
            <View style={styles.glassCardWrapper}>
              <BlurView intensity={50} tint={blurTint} style={[styles.glassCard, { 
                backgroundColor: theme.card + '40', // 25% opacity para que se note el blur de fondo
                borderColor: theme.border + '80'
              }]}>
                <View style={styles.form}>
                  
                  {/* EMAIL INPUT */}
                  <View style={styles.inputWrapper}>
                    <TextInput 
                      style={[
                        styles.input, 
                        { 
                          backgroundColor: theme.background + '80', // 50% opacity
                          borderColor: focusedInput === 'email' ? theme.tint : theme.border,
                          color: theme.text 
                        }
                      ]}
                      placeholder='Email o nombre de usuario'
                      placeholderTextColor={theme.textSecondary}
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setFocusedInput('email')}
                      onBlur={() => setFocusedInput(null)}
                      autoCapitalize='none'
                      keyboardType='email-address'
                    />
                  </View>

                  {/* PASSWORD INPUT */}
                  <View style={styles.inputWrapper}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TextInput 
                        style={[
                          styles.input, 
                          { 
                            backgroundColor: theme.background + '80', 
                            borderColor: focusedInput === 'password' ? theme.tint : theme.border,
                            color: theme.text,
                            flex: 1,
                            paddingRight: 40
                          }
                        ]}
                        placeholder='Contraseña'
                        placeholderTextColor={theme.textSecondary}
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setFocusedInput('password')}
                        onBlur={() => setFocusedInput(null)}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity 
                        onPress={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: 12 }}
                      >
                        {showPassword ? <EyeOff size={20} color={theme.textSecondary} /> : <Eye size={20} color={theme.textSecondary} />}
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.passwordFooter}>
                      <TouchableOpacity 
                        style={styles.forgotPassword}
                        onPress={() => router.push('/forgot-password')}
                      >
                        <Text style={[styles.forgotText, { color: theme.textSecondary }]}>¿Olvidaste tu contraseña?</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* SUBMIT BUTTON */}
                  <TouchableOpacity 
                    style={[styles.loginButton, { backgroundColor: theme.tint, shadowColor: theme.tint }]}
                    onPress={handleLoginSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#0f172a" />
                    ) : (
                      <>
                        <LogIn color="#0f172a" size={18} style={{ marginRight: 8 }} />
                        <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* DIVIDER */}
                  <View style={styles.divider}>
                    <View style={[styles.line, { backgroundColor: theme.border }]} />
                    <Text style={[styles.dividerText, { color: theme.textSecondary }]}>O continúa con</Text>
                    <View style={[styles.line, { backgroundColor: theme.border }]} />
                  </View>

                  {/* SOCIAL BUTTONS */}
                  <View style={styles.socialContainer}>
                    {/* Google */}
                    <TouchableOpacity 
                      onPress={handleGoogleClick} 
                      disabled={isLoading} 
                      style={[styles.socialButton, { 
                        backgroundColor: theme.card + '80',
                        borderColor: theme.border 
                      }]}
                    >
                      <GoogleIcon size={24} />
                    </TouchableOpacity>
                    
                    {/* Discord */}
                    <TouchableOpacity onPress={handleDiscordClick} disabled={isLoading} style={[styles.socialButton, {backgroundColor: '#5865F2', borderColor: '#5865F2'}]}>
                      <DiscordIcon size={24} color="#fff" />
                    </TouchableOpacity>
                    
                    {/* X / Twitter */}
                    <TouchableOpacity onPress={handleXClick} disabled={isLoading} style={[
                      styles.socialButton, 
                      {backgroundColor: colorScheme === 'light' ? '#000' : '#fff', borderColor: colorScheme === 'light' ? '#000' : '#fff'}
                    ]}>
                      <FontAwesome6 name="x-twitter" size={20} color={colorScheme === 'light' ? '#fff' : '#000'} />
                    </TouchableOpacity>
                    
                    {/* Github */}
                    <TouchableOpacity onPress={handleGithubClick} disabled={isLoading} style={[
                      styles.socialButton, 
                      {backgroundColor: colorScheme === 'light' ? '#333' : '#fff', borderColor: colorScheme === 'light' ? '#333' : '#fff'}
                    ]}>
                      <FontAwesome5 name="github" size={24} color={colorScheme === 'light' ? '#fff' : '#333'} />
                    </TouchableOpacity>
                  </View>

                  {/* FOOTER */}
                  <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.textSecondary }]}>¿Aún no tienes cuenta? </Text>
                    <TouchableOpacity 
                      onPress={() => router.push('/register')}
                      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                      style={{ padding: 4 }}
                    >
                      <Text style={[styles.registerText, { color: theme.tint }]}>Regístrate ahora</Text>
                    </TouchableOpacity>
                  </View>
                  
                </View>
              </BlurView>
            </View>
          </>
        )}

        <View style={{ flex: 1 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  badgeContainer: {
    marginBottom: 24,
    alignItems: 'center',
    width: '100%',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerTextContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  glassCardWrapper: {
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 10,
    borderRadius: 32,
    backgroundColor: 'transparent', // The BlurView provides the glass
  },
  glassCard: {
    width: '100%',
    borderRadius: 32,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  form: {
    gap: 20,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  passwordFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  forgotPassword: {
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loginButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  loginButtonText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  registerText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
