import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, useColorScheme as useDeviceColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Dumbbell, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastColor } from '@/utils/colorUtils';
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
  const contrastColor = getContrastColor(theme.tint, currentStoreTheme);
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
      <LinearGradient
        colors={[theme.tint + '15', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />
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
            <BlurView intensity={50} tint={blurTint} style={[styles.glassCard, { backgroundColor: theme.card + '40', borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)' }]}>
              <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
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
                style={[styles.submitButton, { backgroundColor: theme.tint, shadowColor: theme.tint }]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={contrastColor} />
                ) : (
                  <>
                    <Mail color={contrastColor} size={20} style={{ marginRight: 8 }} />
                    <Text style={[styles.submitButtonText, { color: contrastColor }]}>Enviar Enlace</Text>
                  </>
                )}
              </TouchableOpacity>
            </BlurView>
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
