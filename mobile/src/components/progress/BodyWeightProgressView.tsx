import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Scale } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { BodyWeightChart } from './ProgressCharts';
import { BodyWeightModal } from '@/components/modals/BodyWeightModal';
import { getContrastColor } from '@/utils/colorUtils';

export function BodyWeightProgressView() {
  const colors = useAppColors();
  const theme = useAppStore((state: any) => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentText = getContrastColor(colors.tint, theme);

  const bodyWeightLog = useAppStore((state: any) => state.bodyWeightLog) || [];
  const logBodyWeight = useAppStore((state: any) => state.logBodyWeight);

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

  const latestWeight = chartData.length > 0 ? chartData[chartData.length - 1]['Peso (kg)'] : null;

  const handleSaveWeight = (data: { weight: number }) => {
    if (logBodyWeight) {
      logBodyWeight(data.weight);
    }
  };

  return (
    <View style={styles.container}>
      {chartData.length === 0 ? (
        /* Empty State Responsivo con Liquid Glass */
        <View
          style={[
            styles.emptyCard,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
          />
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.tint + '18' }]}>
            <Scale size={32} color={colors.tint} strokeWidth={2.2} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Sin registros de peso corporal
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            Registra tu peso con frecuencia para seguir tu tendencia, evaluar tu composición corporal y visualizar medias y fluctuaciones en gráficas interactivas estilo Apple Health.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              setShowModal(true);
            }}
            style={[styles.emptyCtaBtn, { backgroundColor: colors.tint }]}
          >
            <Plus size={18} color={accentText} strokeWidth={2.5} />
            <Text style={[styles.emptyCtaText, { color: accentText }]}>
              Registrar Mi Primer Peso
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Action Row con resumen y botón */}
          <View style={styles.actionRow}>
            {latestWeight !== null && (
              <View
                style={[
                  styles.latestPill,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
              >
                <Scale size={14} color={colors.tint} />
                <Text style={[styles.latestText, { color: colors.text }]}>
                  Último: <Text style={{ fontWeight: '800', color: colors.tint }}>{latestWeight} kg</Text>
                </Text>
              </View>
            )}

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
              <Plus size={16} color={accentText} strokeWidth={2.5} />
              <Text style={[styles.addBtnText, { color: accentText }]}>
                Registrar Peso
              </Text>
            </TouchableOpacity>
          </View>

          {/* Chart */}
          <BodyWeightChart data={chartData} />
        </>
      )}

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
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  latestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  latestText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    marginLeft: 'auto',
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyCard: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 320,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
  },
  emptyCtaText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
