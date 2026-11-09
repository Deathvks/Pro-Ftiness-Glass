import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  X,
  Zap,
  ZapOff,
  Camera as CameraIcon,
  ScanBarcode,
  Keyboard,
  RotateCw,
  Search,
} from 'lucide-react-native';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastTextColor } from '@/utils/colorUtils';
import * as nutritionService from '@/services/nutritionService';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onFoodScanned: (food: any) => void;
  onManualCreate?: (barcode: string) => void;
  embedded?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_FRAME_WIDTH = Math.min(SCREEN_WIDTH - 64, 290);
const SCAN_FRAME_HEIGHT = 200;

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  visible,
  onClose,
  onFoodScanned,
  onManualCreate,
  embedded = false,
}) => {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [isSearching, setIsSearching] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);

  // Manual barcode entry modal
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const isScanningRef = useRef(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Animación del láser escáner
  useEffect(() => {
    if (visible && !isSearching) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [visible, isSearching, scanLineAnim]);

  // Reset states on open/close
  useEffect(() => {
    if (visible) {
      setTorchEnabled(false);
      setScannedBarcode(null);
      setIsSearching(false);
      isScanningRef.current = false;
      setShowManualInput(false);
      setManualCode('');
    }
  }, [visible]);

  const processBarcode = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code || isScanningRef.current) return;

    isScanningRef.current = true;
    setScannedBarcode(code);
    setIsSearching(true);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    try {
      const response = await nutritionService.searchByBarcode(code);
      const product = response?.product;

      if (!product) {
        throw new Error('Alimento no encontrado');
      }

      const nutriments = product.nutriments || {};

      const cal100 =
        parseFloat(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? 0) ||
        0;
      const prot100 =
        parseFloat(nutriments['proteins_100g'] ?? nutriments['proteins'] ?? 0) || 0;
      const carb100 =
        parseFloat(nutriments['carbohydrates_100g'] ?? nutriments['carbohydrates'] ?? 0) ||
        0;
      const fat100 =
        parseFloat(
          nutriments['fat_100g'] ?? nutriments['fat'] ?? nutriments['fats_100g'] ?? 0
        ) || 0;
      const sug100 =
        parseFloat(nutriments['sugars_100g'] ?? nutriments['sugars'] ?? 0) || 0;

      const servingW = parseFloat(product.serving_quantity) || 100;
      const factor = servingW / 100;

      const foodItem = {
        id: `scanned-${code}`,
        name: (
          product.product_name_es ||
          product.product_name ||
          product.name ||
          `Producto ${code}`
        ).trim(),
        description: (
          product.product_name_es ||
          product.product_name ||
          product.name ||
          `Producto ${code}`
        ).trim(),
        brand: product.brand || (product.brands ? product.brands.split(',')[0].trim() : null),
        image_url: product.image_url || null,
        barcode: product.barcode || code,
        weight_g: servingW,
        serving_weight_g: servingW,
        calories: Math.round(cal100 * factor),
        protein_g: parseFloat((prot100 * factor).toFixed(1)),
        carbs_g: parseFloat((carb100 * factor).toFixed(1)),
        fats_g: parseFloat((fat100 * factor).toFixed(1)),
        sugars_g: parseFloat((sug100 * factor).toFixed(1)),
        calories_per_100g: cal100,
        protein_per_100g: prot100,
        carbs_per_100g: carb100,
        fat_per_100g: fat100,
        sugars_per_100g: sug100,
        origin: 'search',
      };

      onFoodScanned(foodItem);
      onClose();
    } catch (err: any) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {}

      Alert.alert(
        'Producto no encontrado',
        `No se encontró información nutricional en OpenFoodFacts ni en la base de datos para el código:\n\n${code}\n\n¿Quieres crearlo manualmente?`,
        [
          {
            text: 'Reintentar',
            style: 'cancel',
            onPress: () => {
              setTimeout(() => {
                isScanningRef.current = false;
                setScannedBarcode(null);
                setIsSearching(false);
              }, 700);
            },
          },
          {
            text: 'Crear Manualmente',
            onPress: () => {
              onClose();
              if (onManualCreate) {
                onManualCreate(code);
              }
            },
          },
        ]
      );
    }
  };

  const handleBarcodeScanned = (scanningResult: BarcodeScanningResult) => {
    if (isSearching || isScanningRef.current) return;
    if (scanningResult?.data) {
      processBarcode(scanningResult.data);
    }
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    setShowManualInput(false);
    processBarcode(manualCode.trim());
  };

  if (!visible) return null;

  // Pantalla de solicitud de permisos
  if (!permission?.granted) {
    const permContent = (
      <View style={styles.modalBackdrop}>
        <BlurView intensity={isDark ? 50 : 65} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View
          style={[
            styles.permissionCard,
            {
              backgroundColor: isDark ? 'rgba(24, 24, 27, 0.90)' : 'rgba(255, 255, 255, 0.92)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <View style={[styles.permissionIconBadge, { backgroundColor: colors.tint + '18' }]}>
            <CameraIcon size={34} color={colors.tint} strokeWidth={2.2} />
          </View>

          <Text style={[styles.permissionTitle, { color: colors.text }]}>Permiso de Cámara Requerido</Text>
          <Text style={[styles.permissionDesc, { color: colors.textSecondary }]}>
            Para poder leer códigos de barras de alimentos en iOS y Android, ProFitnessGlass necesita acceder a la cámara de tu dispositivo.
          </Text>

          <TouchableOpacity
            onPress={async () => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              } catch {}
              const res = await requestPermission();
              if (!res.granted) {
                Alert.alert(
                  'Acceso Denegado',
                  'Puedes habilitar el permiso de cámara en los Ajustes de tu dispositivo o introducir el código de barras manualmente.',
                  [{ text: 'Entendido' }]
                );
              }
            }}
            style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryBtnText, { color: getContrastTextColor(colors.tint) }]}>
              Permitir Acceso a la Cámara
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowManualInput(true)}
            style={[
              styles.secondaryBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
            activeOpacity={0.75}
          >
            <Keyboard size={16} color={colors.text} style={{ marginRight: 8 }} />
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Introducir código manualmente</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
            <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );

    if (embedded) {
      return (
        <View style={styles.fullContainer}>
          {permContent}
          {renderManualInputModal()}
        </View>
      );
    }

    return (
      <Modal visible={visible} animationType="slide" transparent={true}>
        {permContent}
        {renderManualInputModal()}
      </Modal>
    );
  }

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_FRAME_HEIGHT - 6],
  });

  function renderManualInputModal() {
    return (
      <Modal visible={showManualInput} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.manualInputBackdrop}
        >
          <View
            style={[
              styles.manualInputCard,
              {
                backgroundColor: isDark ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.96)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.10)',
              },
            ]}
          >
            <View style={styles.manualInputHeader}>
              <ScanBarcode size={22} color={colors.tint} />
              <Text style={[styles.manualInputTitle, { color: colors.text }]}>Código de Barras Manual</Text>
              <TouchableOpacity onPress={() => setShowManualInput(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.manualInputDesc, { color: colors.textSecondary }]}>
              Escribe los dígitos que aparecen bajo el código de barras (ej. 8480000086679):
            </Text>

            <View
              style={[
                styles.manualInputBox,
                {
                  backgroundColor: isDark ? 'rgba(0, 0, 0, 0.40)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
                },
              ]}
            >
              <TextInput
                value={manualCode}
                onChangeText={setManualCode}
                placeholder="Ej. 8480000086679"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                autoFocus
                style={[styles.manualTextInput, { color: colors.text }]}
                onSubmitEditing={handleManualSubmit}
              />
            </View>

            <TouchableOpacity
              onPress={handleManualSubmit}
              disabled={!manualCode.trim()}
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: manualCode.trim() ? colors.tint : colors.tint + '40',
                  marginTop: 16,
                },
              ]}
              activeOpacity={0.85}
            >
              <Search size={16} color={getContrastTextColor(colors.tint)} style={{ marginRight: 6 }} />
              <Text style={[styles.primaryBtnText, { color: getContrastTextColor(colors.tint) }]}>
                Buscar Alimento
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  const scannerBody = (
    <View style={styles.fullContainer}>
        {/* Vista nativa de la cámara */}
        <CameraView
          style={StyleSheet.absoluteFill}
          facing={facing}
          enableTorch={torchEnabled}
          barcodeScannerSettings={{
            barcodeTypes: [
              'ean13',
              'ean8',
              'upc_a',
              'upc_e',
              'code128',
              'code39',
              'code93',
              'itf14',
              'codabar',
              'qr',
            ],
          }}
          onBarcodeScanned={scannedBarcode || isSearching ? undefined : handleBarcodeScanned}
        />

        {/* Máscara de cristal oscura circundante con recorte del visor */}
        <View style={styles.overlayMaskContainer} pointerEvents="box-none">
          {/* Top Mask */}
          <View style={styles.maskTop} />

          {/* Middle Row con Frame central */}
          <View style={styles.maskMiddleRow}>
            <View style={styles.maskSide} />

            {/* VISOR DE ESCANEO */}
            <View style={styles.scanTargetFrame}>
              {/* Esquinas Liquid Glass de alta visibilidad */}
              <View style={[styles.cornerBracket, styles.cornerTL, { borderColor: colors.tint }]} />
              <View style={[styles.cornerBracket, styles.cornerTR, { borderColor: colors.tint }]} />
              <View style={[styles.cornerBracket, styles.cornerBL, { borderColor: colors.tint }]} />
              <View style={[styles.cornerBracket, styles.cornerBR, { borderColor: colors.tint }]} />

              {/* Láser de escaneo animado con resplandor neón */}
              {!isSearching && (
                <Animated.View
                  style={[
                    styles.laserLine,
                    {
                      backgroundColor: colors.tint,
                      shadowColor: colors.tint,
                      transform: [{ translateY: scanLineTranslate }],
                    },
                  ]}
                />
              )}
            </View>

            <View style={styles.maskSide} />
          </View>

          {/* Bottom Mask */}
          <View style={styles.maskBottom}>
            {/* Indicador de ayuda */}
            <View style={styles.instructionPill}>
              <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
              <ScanBarcode size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.instructionText}>Apunta al código de barras del producto</Text>
            </View>

            {/* Botón de entrada manual */}
            <TouchableOpacity
              onPress={() => setShowManualInput(true)}
              style={styles.manualEntryBtn}
              activeOpacity={0.8}
            >
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <Keyboard size={16} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.manualEntryBtnText}>Escribir código manual</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Barra superior flotante de controles */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              onClose();
            }}
            style={styles.glassCircleBtn}
            activeOpacity={0.8}
          >
            <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
            <X size={20} color="#ffffff" strokeWidth={2.4} />
          </TouchableOpacity>

          <View style={styles.topCenterPill}>
            <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
            <Text style={styles.topCenterTitle}>Escáner de Alimentos</Text>
          </View>

          <View style={styles.topRightActions}>
            <TouchableOpacity
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                setTorchEnabled(prev => !prev);
              }}
              style={[
                styles.glassCircleBtn,
                torchEnabled && { backgroundColor: colors.tint },
              ]}
              activeOpacity={0.8}
            >
              <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
              {torchEnabled ? (
                <ZapOff size={18} color="#ffffff" />
              ) : (
                <Zap size={18} color="#ffffff" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                setFacing(prev => (prev === 'back' ? 'front' : 'back'));
              }}
              style={[styles.glassCircleBtn, { marginLeft: 8 }]}
              activeOpacity={0.8}
            >
              <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
              <RotateCw size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* OVERLAY DE BÚSQUEDA EN CURSO */}
        {isSearching && (
          <View style={styles.searchingOverlay}>
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.searchingCard}>
              <ActivityIndicator size="large" color={colors.tint} />
              <Text style={styles.searchingTitle}>Consultando Producto...</Text>
              <Text style={styles.searchingCode}>{scannedBarcode}</Text>
              <Text style={styles.searchingSubtitle}>
                Buscando información nutricional en OpenFoodFacts...
              </Text>
            </View>
          </View>
        )}

        {/* Modal de entrada manual */}
        {renderManualInputModal()}
    </View>
  );

  if (embedded) {
    return scannerBody;
  }

  return (
    <Modal visible={visible} animationType="fade" transparent={false} statusBarTranslucent={true}>
      {scannerBody}
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullContainer: {
    ...StyleSheet.absoluteFill as any,
    backgroundColor: '#000000',
    zIndex: 99999,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    borderWidth: 1,
    padding: 26,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  permissionIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  permissionDesc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 22,
  },
  primaryBtn: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    width: '100%',
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  glassCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
  topCenterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  topCenterTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlayMaskContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
  },
  maskTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
  },
  maskMiddleRow: {
    height: SCAN_FRAME_HEIGHT,
    flexDirection: 'row',
  },
  maskSide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
  },
  scanTargetFrame: {
    width: SCAN_FRAME_WIDTH,
    height: SCAN_FRAME_HEIGHT,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  cornerBracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderWidth: 3.5,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 18,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 18,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 18,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 18,
  },
  laserLine: {
    width: '100%',
    height: 2.5,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  maskBottom: {
    flex: 1.3,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    alignItems: 'center',
    paddingTop: 28,
  },
  instructionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    marginBottom: 20,
  },
  instructionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  manualEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  manualEntryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  searchingOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  searchingCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  searchingTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 6,
  },
  searchingCode: {
    color: 'rgba(255, 255, 255, 0.70)',
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  searchingSubtitle: {
    color: 'rgba(255, 255, 255, 0.60)',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 240,
  },
  manualInputBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  manualInputCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  manualInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  manualInputTitle: {
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
    marginLeft: 10,
  },
  manualInputDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  manualInputBox: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  manualTextInput: {
    fontSize: 16,
    fontWeight: '700',
  },
});
