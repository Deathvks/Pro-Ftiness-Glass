import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { X, Ruler } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';
import { SwipeableBottomSheet } from '@/components/ui/SwipeableBottomSheet';

export const MEASUREMENT_TYPES = [
  { value: 'cintura', label: 'Cintura' },
  { value: 'pecho', label: 'Pecho' },
  { value: 'biceps', label: 'Bíceps' },
  { value: 'muslos', label: 'Muslos' },
  { value: 'caderas', label: 'Caderas' },
  { value: 'hombros', label: 'Hombros' },
  { value: 'gemelos', label: 'Gemelos' },
  { value: 'cuello', label: 'Cuello' },
  { value: 'antebrazos', label: 'Antebrazos' },
];

interface BodyMeasurementModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { measure_type: string; value: number }) => void;
}

export function BodyMeasurementModal({
  visible,
  onClose,
  onSave,
}: BodyMeasurementModalProps) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentText = getContrastTextColor(colors.tint);

  const [measureType, setMeasureType] = useState('cintura');
  const [val, setVal] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    const parsed = parseFloat(val.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      onSave({ measure_type: measureType, value: parsed });
      setVal('');
      setError('');
      onClose();
    } else {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      setError('Por favor, introduce un valor válido');
    }
  };

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={onClose}
      isDark={isDark}
      backgroundColor={colors.card}
      avoidKeyboard
    >
      <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 }}>
            {/* Header */}
            <View style={styles.header}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
              >
                <Ruler size={22} color={colors.tint} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                Registrar Medida
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Zone Selector */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Zona del Cuerpo
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.zonesScroll}
            >
              {MEASUREMENT_TYPES.map(type => {
                const isSelected = measureType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    activeOpacity={0.8}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch {}
                      setMeasureType(type.value);
                    }}
                    style={[
                      styles.zonePill,
                      {
                        backgroundColor: isSelected
                          ? colors.tint
                          : isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : 'rgba(0, 0, 0, 0.04)',
                        borderColor: isSelected
                          ? colors.tint
                          : isDark
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.08)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.zonePillText,
                        {
                          color: isSelected ? accentText : colors.text,
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Value Input */}
            <Text
              style={[
                styles.sectionLabel,
                { color: colors.textSecondary, marginTop: 16 },
              ]}
            >
              Medida en centímetros (cm)
            </Text>
            <View
              style={[
                styles.inputWrap,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.05)',
                  borderColor: error
                    ? '#f43f5e'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <TextInput
                value={val}
                onChangeText={t => {
                  setVal(t);
                  if (error) setError('');
                }}
                placeholder="Ej. 82.5"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                style={[styles.input, { color: colors.text }]}
                autoFocus
              />
              <Text style={[styles.unitText, { color: colors.textSecondary }]}>
                cm
              </Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Save Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: colors.tint }]}
            >
              <Text style={[styles.saveBtnText, { color: accentText }]}>
                Guardar Medida
              </Text>
            </TouchableOpacity>
      </View>
    </SwipeableBottomSheet>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    flex: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  zonesScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  zonePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  zonePillText: {
    fontSize: 13,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    padding: 0,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  errorText: {
    fontSize: 12,
    color: '#f43f5e',
    fontWeight: '600',
    marginBottom: 8,
  },
  saveBtn: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '900',
  },
});
