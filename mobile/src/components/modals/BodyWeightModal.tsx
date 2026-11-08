import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Scale } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastColor } from '@/utils/colorUtils';

interface BodyWeightModalProps {
  visible: boolean;
  existingLog?: any;
  onClose: () => void;
  onSave: (data: { weight: number }) => void;
}

export function BodyWeightModal({
  visible,
  existingLog,
  onClose,
  onSave,
}: BodyWeightModalProps) {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentText = getContrastColor(colors.tint, theme);

  const [weight, setWeight] = useState('');

  useEffect(() => {
    if (existingLog) {
      setWeight(String(existingLog.weight_kg || existingLog.weight || ''));
    } else {
      setWeight('');
    }
  }, [existingLog, visible]);

  const handleSave = () => {
    const parsed = parseFloat(String(weight).replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      onSave({ weight: parsed });
      onClose();
    } else {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlay}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <Pressable
            onPress={e => e.stopPropagation()}
            style={[
              styles.card,
              {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
              },
            ]}
          >
            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderRadius: 32 }]}
            />

            <View style={styles.header}>
              <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}>
                <Scale size={24} color={colors.tint} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                {existingLog ? 'Editar Peso de Hoy' : 'Registrar Peso Corporal'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.body}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Peso en kilogramos (kg)
              </Text>
              <View style={[styles.inputWrap, { borderColor: colors.tint + '50', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
                <TextInput
                  value={weight}
                  onChangeText={txt => setWeight(txt.replace(',', '.'))}
                  keyboardType="decimal-pad"
                  placeholder="Ej: 78.5"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { color: colors.text }]}
                  autoFocus
                  selectTextOnFocus
                />
                <Text style={[styles.unit, { color: colors.textSecondary }]}>kg</Text>
              </View>

              <TouchableOpacity
                onPress={handleSave}
                style={[styles.saveBtn, { backgroundColor: colors.tint }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.saveBtnText, { color: accentText }]}>
                  Guardar Registro
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </GlassView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    marginLeft: 12,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    gap: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  input: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    minWidth: 120,
  },
  unit: {
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 6,
  },
  saveBtn: {
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
