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
import { getContrastTextColor } from '@/utils/colorUtils';

export function MeasurementsProgressView() {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentContrastText = getContrastTextColor(colors.tint);

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
      {/* Top Action & Full-Width Zone Selector Bar */}
      <View style={styles.topControls}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            setShowModal(true);
          }}
          style={[styles.addBtn, { backgroundColor: colors.tint }]}
        >
          <Plus size={18} color={accentContrastText} strokeWidth={2.5} />
          <Text style={[styles.addBtnText, { color: accentContrastText }]}>
            Registrar Medida
          </Text>
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.zonesScrollView}
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
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                    borderColor: isSelected
                      ? colors.tint
                      : isDark
                      ? 'rgba(255, 255, 255, 0.14)'
                      : 'rgba(0, 0, 0, 0.1)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.zonePillText,
                    {
                      color: isSelected ? accentContrastText : colors.text,
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
  topControls: {
    gap: 12,
  },
  zonesScrollView: {
    width: '100%',
  },
  zonesScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
    paddingRight: 8,
  },
  zonePill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  zonePillText: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
  addBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
