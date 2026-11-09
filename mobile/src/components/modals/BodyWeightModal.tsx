import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { X, Scale } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastTextColor } from '@/utils/colorUtils';
import { SwipeableBottomSheet, getAppleSheetCardStyle } from '@/components/ui/SwipeableBottomSheet';

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
  const isIOS = Platform.OS === 'ios';
  const accentText = getContrastTextColor(colors.tint);

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
    <SwipeableBottomSheet
      visible={visible}
      onClose={onClose}
      isDark={isDark}
      backgroundColor={colors.card}
      avoidKeyboard
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: colors.tint + '18',
              },
            ]}
          >
            <Scale size={24} color={colors.tint} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {existingLog ? 'Editar Peso de Hoy' : 'Registrar Peso Corporal'}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.closeBtn,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Peso en kilogramos (kg)
          </Text>
          <View
            style={[
              styles.inputWrap,
              {
                borderColor: colors.tint + '50',
                borderWidth: isIOS ? 0 : 1.5,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              },
              getAppleSheetCardStyle(isDark, 20),
            ]}
          >
            <TextInput
              value={weight}
              onChangeText={txt => setWeight(txt.replace(',', '.'))}
              keyboardType="decimal-pad"
              placeholder="78.5"
              placeholderTextColor={colors.textSecondary + '80'}
              style={[styles.input, { color: colors.text }]}
              selectTextOnFocus
            />
            <Text style={[styles.unit, { color: colors.textSecondary }]}>kg</Text>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveBtn, { backgroundColor: colors.tint }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.saveBtnText, { color: accentText }]}>Guardar Registro</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SwipeableBottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 14,
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
    borderRadius: 15,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    letterSpacing: -0.3,
    flex: 1,
    marginLeft: 12,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderCurve: 'continuous',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  input: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 120,
  },
  unit: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 6,
  },
  saveBtn: {
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
