/* mobile/src/components/workout/CalorieInputModal.tsx */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import {
  Flame,
  Watch,
  CheckCircle,
  X,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';

interface CalorieInputModalProps {
  visible: boolean;
  estimatedCalories: number;
  onComplete: (calories: number) => void;
  onCancel: () => void;
}

export const CalorieInputModal: React.FC<CalorieInputModalProps> = ({
  visible,
  estimatedCalories,
  onComplete,
  onCancel,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const [mode, setMode] = useState<'estimated' | 'custom'>('estimated');
  const [customVal, setCustomVal] = useState('');

  const handleSubmit = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    if (mode === 'custom') {
      const parsed = parseInt(customVal, 10);
      if (!isNaN(parsed) && parsed > 0) {
        onComplete(parsed);
      } else {
        onComplete(estimatedCalories);
      }
    } else {
      onComplete(estimatedCalories);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.35)' }]} onPress={onCancel}>
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

          <TouchableOpacity
            onPress={onCancel}
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
            <View style={[styles.flameCircle, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
              <Flame size={24} color="#f97316" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Registrar Calorías</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              ¿Has medido las calorías quemadas con tu reloj inteligente?
            </Text>
          </View>

          {/* Opción 1: Estimación calculada */}
          <TouchableOpacity
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              setMode('estimated');
            }}
            style={[
              styles.optionCard,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                borderColor: mode === 'estimated' ? colors.tint : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              },
              mode === 'estimated' && { borderWidth: 1.5 },
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.optionRow}>
              <View style={[styles.checkCircle, { borderColor: mode === 'estimated' ? colors.tint : colors.textSecondary }]}>
                {mode === 'estimated' ? <View style={[styles.checkInner, { backgroundColor: colors.tint }]} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  Usar estimación calculada
                </Text>
                <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                  Aproximadamente <Text style={{ color: colors.tint, fontWeight: '800' }}>{estimatedCalories} kcal</Text>
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Opción 2: Entrada manual */}
          <TouchableOpacity
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              setMode('custom');
            }}
            style={[
              styles.optionCard,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                borderColor: mode === 'custom' ? colors.tint : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              },
              mode === 'custom' && { borderWidth: 1.5 },
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.optionRow}>
              <View style={[styles.checkCircle, { borderColor: mode === 'custom' ? colors.tint : colors.textSecondary }]}>
                {mode === 'custom' ? <View style={[styles.checkInner, { backgroundColor: colors.tint }]} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  Introducir valor manual
                </Text>
                <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                  Usa el valor exacto de Apple Watch, Garmin o tu pulsera
                </Text>
              </View>
            </View>

            {mode === 'custom' ? (
              <TextInput
                keyboardType="number-pad"
                placeholder="Ej: 380 (kcal)"
                placeholderTextColor={colors.textSecondary + '70'}
                value={customVal}
                onChangeText={setCustomVal}
                autoFocus
                style={[
                  styles.customInput,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)',
                    color: colors.text,
                  },
                ]}
              />
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            style={[
              styles.continueBtn,
              {
                backgroundColor: colors.tint,
                shadowColor: colors.tint,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: 5,
              },
            ]}
            activeOpacity={0.82}
          >
            <Text style={styles.continueBtnText}>Continuar a Revisión</Text>
          </TouchableOpacity>
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
    marginBottom: 20,
  },
  flameCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  optionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
  },
  customInput: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '700',
  },
  continueBtn: {
    height: 50,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
});
