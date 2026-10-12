/* mobile/src/components/workout/PlateCalculatorModal.tsx */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import { Calculator, X, Disc } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';

interface PlateCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
  initialWeight?: string;
}

const AVAILABLE_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

const BAR_OPTIONS = [
  { value: 20, label: 'Barra Olímpica (20 kg)' },
  { value: 15, label: 'Barra Femenina (15 kg)' },
  { value: 10, label: 'Barra Técnica (10 kg)' },
  { value: 0, label: 'Solo Discos (0 kg)' },
];

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({
  visible,
  onClose,
  initialWeight = '',
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const [targetWeight, setTargetWeight] = useState(initialWeight);
  const [barWeight, setBarWeight] = useState(20);

  const { plates, remainder, errorMsg } = useMemo(() => {
    if (!targetWeight || targetWeight.trim() === '') {
      return { plates: [], remainder: 0, errorMsg: '' };
    }

    const weight = parseFloat(targetWeight.replace(',', '.'));
    if (isNaN(weight)) {
      return { plates: [], remainder: 0, errorMsg: 'Peso inválido' };
    }

    if (weight < barWeight) {
      return {
        plates: [],
        remainder: 0,
        errorMsg: `El peso debe ser mayor a la barra (${barWeight}kg)`,
      };
    }

    if (weight === barWeight) {
      return { plates: [], remainder: 0, errorMsg: 'Barra vacía' };
    }

    let weightPerSide = (weight - barWeight) / 2;
    const calculatedPlates: number[] = [];

    AVAILABLE_PLATES.forEach(plate => {
      const count = Math.floor(weightPerSide / plate);
      if (count > 0) {
        for (let i = 0; i < count; i++) calculatedPlates.push(plate);
        weightPerSide = parseFloat((weightPerSide - count * plate).toFixed(2));
      }
    });

    return {
      plates: calculatedPlates,
      remainder: weightPerSide * 2,
      errorMsg: '',
    };
  }, [targetWeight, barWeight]);

  const getPlateColor = (weight: number) => {
    if (weight >= 25) return '#ef4444'; // Rojo
    if (weight >= 20) return '#3b82f6'; // Azul
    if (weight >= 15) return '#eab308'; // Amarillo
    if (weight >= 10) return '#22c55e'; // Verde
    if (weight >= 5) return '#f8fafc';  // Blanco
    if (weight >= 2.5) return '#64748b'; // Gris
    return '#94a3b8'; // Gris claro
  };

  const getPlateHeight = (weight: number) => {
    if (weight >= 25) return 80;
    if (weight >= 20) return 76;
    if (weight >= 15) return 66;
    if (weight >= 10) return 56;
    if (weight >= 5) return 48;
    if (weight >= 2.5) return 40;
    return 34;
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.35)' }]} onPress={onClose}>
        <Pressable
          onPress={e => e.stopPropagation()}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />

          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[
              styles.closeBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: colors.tint + '18' }]}>
              <Calculator size={22} color={colors.tint} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Calculadora de Discos</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Distribución exacta por cada lado de la barra
            </Text>
          </View>

          {/* Selector de barra */}
          <View style={styles.barSelectorRow}>
            {BAR_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  setBarWeight(opt.value);
                }}
                style={[
                  styles.barChip,
                  {
                    backgroundColor: barWeight === opt.value
                      ? colors.tint
                      : isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.04)',
                    borderColor: barWeight === opt.value
                      ? colors.tint
                      : isDark
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.06)',
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.barChipText,
                    { color: barWeight === opt.value ? '#fff' : colors.text },
                  ]}
                >
                  {opt.value}kg
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input peso objetivo */}
          <TextInput
            keyboardType="decimal-pad"
            placeholder="Peso total (ej: 100)"
            placeholderTextColor={colors.textSecondary + '70'}
            value={targetWeight}
            onChangeText={setTargetWeight}
            autoFocus
            style={[
              styles.weightInput,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
                color: colors.text,
              },
            ]}
          />

          {errorMsg ? (
            <Text style={[styles.errorText, { color: '#ef4444' }]}>{errorMsg}</Text>
          ) : null}

          {/* Visual Barbell Discs Display */}
          {plates.length > 0 ? (
            <View style={styles.resultsArea}>
              <Text style={[styles.platesPerSideLabel, { color: colors.textSecondary }]}>
                DISCOS POR LADO (CARGA LATERAL):
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barbellVisualRow}>
                {/* Visual Barbell sleeve */}
                <View style={[styles.sleeve, { backgroundColor: isDark ? '#475569' : '#94a3b8' }]} />

                {plates.map((plateWeight, pIdx) => {
                  const pColor = getPlateColor(plateWeight);
                  const pHeight = getPlateHeight(plateWeight);
                  const isWhitePlate = plateWeight === 5;

                  return (
                    <View
                      key={pIdx}
                      style={[
                        styles.visualPlate,
                        {
                          height: pHeight,
                          backgroundColor: pColor,
                          borderColor: isWhitePlate ? '#cbd5e1' : pColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.plateText,
                          { color: isWhitePlate ? '#0f172a' : '#ffffff' },
                        ]}
                      >
                        {plateWeight}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>

              <View style={styles.platesSummaryChips}>
                {plates.map((p, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.plateChipBadge,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                      },
                    ]}
                  >
                    <Disc size={12} color={getPlateColor(p)} style={{ marginRight: 4 }} />
                    <Text style={[styles.plateChipText, { color: colors.text }]}>{p} kg</Text>
                  </View>
                ))}
              </View>

              {remainder > 0 ? (
                <Text style={[styles.remainderNotice, { color: '#f59e0b' }]}>
                  Sobra residual: {remainder} kg (no divisible con discos estándar)
                </Text>
              ) : null}
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 32,
    borderWidth: 1,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  barSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  barChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  barChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  weightInput: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  resultsArea: {
    alignItems: 'center',
    marginTop: 6,
  },
  platesPerSideLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  barbellVisualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 5,
  },
  sleeve: {
    width: 20,
    height: 16,
    borderRadius: 3,
  },
  visualPlate: {
    width: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateText: {
    fontSize: 9,
    fontWeight: '900',
    transform: [{ rotate: '-90deg' }],
  },
  platesSummaryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
  },
  plateChipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  plateChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  remainderNotice: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
});
