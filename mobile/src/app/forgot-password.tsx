import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, useColorScheme as useDeviceColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Dumbbell, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastColor, getContrastTextColor } from '@/utils/colorUtils';
import { GlassView } from 'expo-glass-effect';
import useAppStore from '@/store/useAppStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { forgotPassword } from '@/services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const router = useRouter();
  const colors = useAppColors();
  const theme = colors;
  const currentStoreTheme = useAppStore(state => state.theme);
  const isDark = !['light', 'ocean', 'desert'].includes(currentStoreTheme);
  const contrastColor = getContrastColor(theme.tint, currentStoreTheme);
  const contrastTextColor = getContrastTextColor(theme.tint);
  const insets = useSafeAreaInsets();
  
  const colorScheme = useDeviceColorScheme();
  const blurTint = colorScheme === 'light' ? 'light' : 'dark';

  const handleSubmit = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      alert('Por favor, introduce un email válido.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await forgotPassword(email);
      alert(response.message || 'Correo enviado exitosamente.');
      setIsSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Error al enviar la solicitud.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Orbes de brillo ambiental para difracción de Liquid Glass */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={[theme.tint + (isDark ? '35' : '22'), 'transparent']}
          style={{
            position: 'absolute',
            top: -40,
            left: -60,
            width: 320,
            height: 320,
            borderRadius: 160,
          }}
        />
        <LinearGradient
          colors={[isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.18)', 'transparent']}
          style={{
            position: 'absolute',
            top: 250,
            right: -80,
            width: 340,
            height: 340,
            borderRadius: 170,
          }}
        />
        <LinearGradient
          colors={[isDark ? 'rgba(168, 85, 247, 0.20)' : 'rgba(168, 85, 247, 0.14)', 'transparent']}
          style={{
            position: 'absolute',
            bottom: 40,
            left: -40,
            width: 280,
            height: 280,
            borderRadius: 140,
          }}
        />
      </View>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
          
          <View style={styles.header}>
            {isSubmitted ? (
              <View style={[styles.iconContainer, { backgroundColor: theme.tint + '20', borderColor: theme.tint + '50' }]}>
                <CheckCircle2 size={40} color={theme.tint} strokeWidth={1.5} />
              </View>
            ) : (
              <Image 
                source={require('../../assets/images/logo.webp')} 
                style={styles.logo} 
                resizeMode="contain"
              />
            )}
            <Text style={[styles.title, { color: theme.text }]}>
              {isSubmitted ? 'Revisa tu correo' : 'Recuperar Contraseña'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {isSubmitted 
                ? `Si existe una cuenta con ${email}, hemos enviado un enlace para restablecer tu contraseña.` 
                : 'Introduce el email asociado a tu cuenta para recibir un enlace de recuperación.'}
            </Text>
          </View>

          {!isSubmitted && (
            <View style={[styles.glassCard, { 
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.25)', 
              borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.75)',
              borderTopColor: isDark ? 'rgba(255, 255, 255, 0.40)' : 'rgba(255, 255, 255, 0.95)',
              borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              borderWidth: 1.5,
              overflow: 'hidden',
            }]}>
              <BlurView
                intensity={Platform.OS === 'ios' ? 70 : 45}
                tint={blurTint}
                style={[StyleSheet.absoluteFill, { borderRadius: 32 }]}
              />
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius: 32 }]}
              />
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(255, 255, 255, 0.10)', 'rgba(255, 255, 255, 0.01)']
                    : ['rgba(255, 255, 255, 0.65)', 'rgba(255, 255, 255, 0.12)']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 32 }]}
                pointerEvents="none"
              />
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 20,
                  right: 20,
                  height: 1,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.40)' : 'rgba(255, 255, 255, 0.95)',
                }}
              />
              <View style={[styles.inputContainer, { 
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)', 
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.07)' 
              }]}>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Tu correo electrónico"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity 
                style={[
                  styles.submitButton, 
                  { 
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.6)',
                    borderWidth: 1,
                    backgroundColor: 'transparent',
                    shadowColor: theme.tint,
                    opacity: isLoading ? 0.7 : 1,
                  }
                ]}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <GlassView
                  glassEffectStyle="regular"
                  colorScheme={isDark ? 'dark' : 'light'}
                  style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                />
                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: theme.tint,
                      opacity: isDark ? 0.82 : 0.88,
                      borderRadius: 20,
                    }
                  ]}
                />
                {isLoading ? (
                  <ActivityIndicator color={contrastTextColor} />
                ) : (
                  <>
                    <Mail color={contrastTextColor} size={20} style={{ marginRight: 8 }} />
                    <Text style={[styles.submitButtonText, { color: contrastTextColor }]}>Enviar Enlace</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={18} color={theme.textSecondary} style={{ marginRight: 8 }} />
            <Text style={[styles.backButtonText, { color: theme.textSecondary }]}>
              Volver a Iniciar Sesión
            </Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  glassCard: {
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputContainer: {
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 20,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 100,
    borderWidth: 1,
    alignSelf: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
