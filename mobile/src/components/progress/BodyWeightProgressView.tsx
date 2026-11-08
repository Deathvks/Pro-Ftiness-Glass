import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Scale } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { BodyWeightChart } from './ProgressCharts';
import { BodyWeightModal } from '@/components/modals/BodyWeightModal';
import { getContrastColor } from '@/utils/colorUtils';

export function BodyWeightProgressView() {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentText = getContrastColor(colors.tint, theme);

  const bodyWeightLog = useAppStore(state => state.bodyWeightLog) || [];
  const logBodyWeight = useAppStore(state => state.logBodyWeight);

  const [showModal, setShowModal] = useState<boolean>(false);

  const chartData = useMemo(() => {
    return bodyWeightLog
      .map((log: any) => {
        const weight = parseFloat(log.weight_kg);
        const time = new Date(log.log_date).getTime();
        if (isNaN(weight) || isNaN(time)) return null;
        return {
          timestamp: time,
          'Peso (kg)': weight,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.timestamp - b.timestamp);
  }, [bodyWeightLog]);

  const handleSaveWeight = (data: { weight: number }) => {
    if (logBodyWeight) {
      logBodyWeight(data.weight);
    }
  };

  return (
    <View style={styles.container}>
      {/* Action Button: Registrar Peso */}
      <View style={styles.actionRow}>
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
            Registrar Peso
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chart */}
      <BodyWeightChart data={chartData} />

      {/* Modal */}
      <BodyWeightModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveWeight}
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
