import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Plus, Ruler } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { MeasurementChart } from './ProgressCharts';
import {
  BodyMeasurementModal,
  MEASUREMENT_TYPES,
} from './BodyMeasurementModal';
import { getContrastColor } from '@/utils/colorUtils';

export function MeasurementsProgressView() {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentText = getContrastColor(colors.tint, theme);

  const bodyMeasurementsLog = useAppStore(state => state.bodyMeasurementsLog) || [];
  const logBodyMeasurement = useAppStore(state => state.logBodyMeasurement);

  const [selectedType, setSelectedType] = useState('cintura');
  const [showModal, setShowModal] = useState(false);

  const chartData = useMemo(() => {
    return bodyMeasurementsLog
      .filter((l: any) => l.measure_type === selectedType)
      .map((l: any) => {
        const time = new Date(l.log_date).getTime();
        const val = parseFloat(l.value);
        if (isNaN(time) || isNaN(val)) return null;
        return { timestamp: time, value: val };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.timestamp - b.timestamp);
  }, [bodyMeasurementsLog, selectedType]);

  const activeLabel =
    MEASUREMENT_TYPES.find(t => t.value === selectedType)?.label || selectedType;

  const handleSave = (data: { measure_type: string; value: number }) => {
    if (logBodyMeasurement) {
      logBodyMeasurement(data);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Action & Zone Pills */}
      <View style={styles.topRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.zonesScroll}
        >
          {MEASUREMENT_TYPES.map(type => {
            const isSelected = selectedType === type.value;
            return (
              <TouchableOpacity
                key={type.value}
                activeOpacity={0.8}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  setSelectedType(type.value);
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
                      : 'rgba(0, 0, 0, 0.06)',
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

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            setShowModal(true);
          }}
          style={[styles.addBtn, { backgroundColor: colors.tint }]}
        >
          <Plus size={18} color={accentText} strokeWidth={2.5} />
          <Text style={[styles.addBtnText, { color: accentText }]}>
            Registrar Medida
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chart */}
      <MeasurementChart data={chartData} measureLabel={activeLabel} />

      {/* Modal */}
      <BodyMeasurementModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },
  topRow: {
    gap: 12,
  },
  zonesScroll: {
    gap: 8,
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
