import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { File as ExpoFile } from 'expo-file-system';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Sparkles, Upload, X, Zap } from 'lucide-react-native';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getAppleCardSurfaceStyle, shouldUseContentGlass } from '@/constants/theme';
import { getContrastTextColor } from '@/utils/colorUtils';
import { scanFoodImage } from '@/services/aiService';

export interface ScannedAIFoodResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  description?: string;
  imageUri?: string;
}

interface FoodScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanComplete: (food: ScannedAIFoodResult) => void;
  embedded?: boolean;
}

export const FoodScannerModal: React.FC<FoodScannerModalProps> = ({
  visible,
  onClose,
  onScanComplete,
  embedded = false,
}) => {
  const insets = useSafeAreaInsets();
  const theme = useAppStore((s: any) => s.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isIOS = Platform.OS === 'ios';
  const useGlass = shouldUseContentGlass(theme);
  const tintText = getContrastTextColor(colors.tint);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const previewBoxHeight = useRef(260);

  useEffect(() => {
    if (visible) {
      setImagePreview(null);
      setIsScanning(false);
      setError('');
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !isScanning) return;
    scanLineAnim.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, isScanning, scanLineAnim]);

  const extractBase64 = async (asset: ImagePicker.ImagePickerAsset): Promise<string> => {
    if (asset.base64) {
      return asset.base64;
    }
    const file = new ExpoFile(asset.uri);
    return file.base64();
  };

  const scanAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    setError('');
    setImagePreview(asset.uri);
    setIsScanning(true);

    try {
      const mimeType = asset.mimeType || 'image/jpeg';
      const base64Data = await extractBase64(asset);

      if (!base64Data) {
        setError('No se pudo leer la imagen seleccionada.');
        setIsScanning(false);
        return;
      }

      const response = await scanFoodImage(base64Data, mimeType);
      if (response?.success && response?.data) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        onScanComplete({
          ...response.data,
          imageUri: asset.uri,
        });
        onClose();
      } else {
        setError(response?.error || 'Hubo un problema al analizar la imagen.');
      }
    } catch (err: any) {
      setError(err?.message || 'No se pudo conectar con la IA.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleLaunchCamera = async () => {
    if (isScanning) return;
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permiso de cámara requerido',
          'Necesitamos acceso a la cámara para fotografiar tu comida y analizar sus macros con IA.',
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.72,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        await scanAsset(result.assets[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'No se pudo abrir la cámara.');
    }
  };

  const handlePickFromGallery = async () => {
    if (isScanning) return;
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            'Permiso de galería requerido',
            'Necesitamos acceso a tus fotos para elegir una imagen del plato.',
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.72,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        await scanAsset(result.assets[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'No se pudo seleccionar la imagen.');
    }
  };

  const handleChooseSource = () => {
    if (isScanning) return;
    if (Platform.OS === 'web') {
      void handlePickFromGallery();
      return;
    }
    Alert.alert('Escáner Nutricional IA', 'Elige cómo aportar la foto del plato', [
      { text: 'Tomar foto', onPress: () => void handleLaunchCamera() },
      { text: 'Elegir de galería', onPress: () => void handlePickFromGallery() },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  if (!visible) return null;

  const scanTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(120, previewBoxHeight.current - 6)],
  });

  const content = (
    <View style={[styles.backdrop, embedded && styles.embeddedBackdrop]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={!isScanning ? onClose : undefined}
      />

      <View
        style={[
          styles.sheet,
          {
            paddingBottom: Math.max(24, insets.bottom + 16),
            backgroundColor: colors.card,
            borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)',
            ...(isIOS ? getAppleCardSurfaceStyle(theme, 32) : null),
          },
        ]}
      >
        {useGlass && (
          <GlassView
            pointerEvents="none"
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 32, borderTopRightRadius: 32 }]}
          />
        )}

        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View
            style={[
              styles.handleBar,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.14)' },
            ]}
          />
        </View>

        {/* Close Button */}
        <TouchableOpacity
          onPress={onClose}
          disabled={isScanning}
          hitSlop={10}
          accessibilityLabel="Cerrar escáner nutricional IA"
          style={[
            styles.closeBtn,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              opacity: isScanning ? 0.45 : 1,
            },
          ]}
        >
          <X size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Zap Icon Badge */}
        <LinearGradient
          colors={[colors.tint, '#3b82f6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroIconBadge, { shadowColor: colors.tint }]}
        >
          <Zap size={30} color="#ffffff" fill="#ffffff" />
        </LinearGradient>

        <Text style={[styles.title, { color: colors.text }]}>Escáner Nutricional IA</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sube o toma una foto de tu comida y la IA extraerá los macros mágicamente.
        </Text>

        {Boolean(error) && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Dashed Image Preview / Drop Box */}
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isScanning}
          onPress={handleChooseSource}
          onLayout={e => {
            const h = e.nativeEvent.layout.height;
            if (h > 0) previewBoxHeight.current = h;
          }}
          style={[
            styles.previewBox,
            {
              borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.12)',
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            },
          ]}
        >
          {imagePreview ? (
            <>
              <Image
                source={{ uri: imagePreview }}
                style={[styles.previewImage, isScanning && { opacity: 0.45 }]}
                resizeMode="cover"
              />
              {isScanning && (
                <View style={styles.scanningOverlay}>
                  <Animated.View
                    style={[
                      styles.scanLaser,
                      {
                        backgroundColor: colors.tint,
                        shadowColor: colors.tint,
                        transform: [{ translateY: scanTranslateY }],
                      },
                    ]}
                  />
                  <ActivityIndicator size="large" color={colors.tint} />
                  <View style={styles.analyzingPill}>
                    <Sparkles size={14} color={colors.tint} />
                    <Text style={styles.analyzingText}>Analizando...</Text>
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyPreviewInner}>
              <Camera size={46} color={colors.textMuted || colors.textSecondary} strokeWidth={1.6} />
              <Text style={[styles.emptyPreviewTitle, { color: colors.textSecondary }]}>
                Toca para tomar una foto{'\n'}o subir desde la galería
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Action Buttons Row */}
        {!isScanning && (
          <View style={styles.actionsRow}>
            {Platform.OS !== 'web' && (
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={handleLaunchCamera}
                style={[styles.primaryActionBtn, { backgroundColor: colors.tint }]}
              >
                <Camera size={17} color={tintText} strokeWidth={2.3} />
                <Text style={[styles.primaryActionText, { color: tintText }]}>
                  {imagePreview ? 'Otra foto' : 'Tomar foto'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePickFromGallery}
              style={[
                styles.secondaryActionBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                },
              ]}
            >
              <Upload size={17} color={colors.text} strokeWidth={2.2} />
              <Text style={[styles.secondaryActionText, { color: colors.text }]}>
                {imagePreview ? 'Elegir otra foto' : 'Galería'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  if (embedded) {
    return content;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={!isScanning ? onClose : undefined}
    >
      {content}
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    justifyContent: 'flex-end',
  },
  embeddedBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 50,
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 22,
    paddingTop: 12,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 18,
  },
  handleRow: {
    alignItems: 'center',
    marginBottom: 14,
  },
  handleBar: {
    width: 46,
    height: 5,
    borderRadius: 3,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  heroIconBadge: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 10,
  },
  errorBanner: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.45)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  previewBox: {
    width: '100%',
    height: 250,
    borderRadius: 26,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  scanLaser: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  analyzingPill: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  analyzingText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },
  emptyPreviewInner: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  emptyPreviewTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 21,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 16,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 16,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default FoodScannerModal;
