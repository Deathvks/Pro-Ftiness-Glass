import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Plus,
  Scale,
  Calendar,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Edit3,
  ChevronDown,
  ChevronUp,
  Activity,
  Target,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { BodyWeightChart } from './ProgressCharts';
import { BodyWeightModal } from '@/components/modals/BodyWeightModal';
import { getContrastTextColor } from '@/utils/colorUtils';

export function BodyWeightProgressView() {
  const colors = useAppColors();
  const theme = useAppStore((state: any) => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentContrastText = getContrastTextColor(colors.tint);

  const bodyWeightLog = useAppStore((state: any) => state.bodyWeightLog) || [];
  const logBodyWeight = useAppStore((state: any) => state.logBodyWeight);
  const updateTodayBodyWeight = useAppStore((state: any) => state.updateTodayBodyWeight);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [showAllHistory, setShowAllHistory] = useState<boolean>(false);

  // Chronological chart data
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

  // Overall key metrics
  const stats = useMemo(() => {
    if (!chartData.length) return null;
    const weights = chartData.map((d: any) => d['Peso (kg)']);
    const first = weights[0];
    const current = weights[weights.length - 1];
    const totalDelta = Math.round((current - first) * 10) / 10;
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const avg = Math.round((weights.reduce((a: number, b: number) => a + b, 0) / weights.length) * 10) / 10;
    return { first, current, totalDelta, min, max, avg, count: weights.length };
  }, [chartData]);

  // Check if today has a recorded entry
  const todayEntry = useMemo(() => {
    const today = new Date();
    return bodyWeightLog.find((l: any) => {
      const d = new Date(l.log_date);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    });
  }, [bodyWeightLog]);

  // History list sorted descending (newest first) with delta vs previous chronological entry
  const historyList = useMemo(() => {
    const valid = bodyWeightLog
      .map((log: any, idx: number) => {
        const weight = parseFloat(log.weight_kg);
        const time = new Date(log.log_date).getTime();
        if (isNaN(weight) || isNaN(time)) return null;
        return {
          id: log.log_id || log.id || `bw-${time}-${idx}`,
          weight,
          time,
          raw: log,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.time - a.time);

    return valid.map((item: any, i: number) => {
      const nextOlder = valid[i + 1];
      const delta = nextOlder ? Math.round((item.weight - nextOlder.weight) * 10) / 10 : null;
      return {
        ...item,
        delta,
      };
    });
  }, [bodyWeightLog]);

  const displayedHistory = showAllHistory ? historyList : historyList.slice(0, 5);

  const handleOpenNewModal = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setEditingLog(null);
    setShowModal(true);
  };

  const handleEditToday = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setEditingLog(todayEntry);
    setShowModal(true);
  };

  const handleSaveWeight = async (data: { weight: number }) => {
    if (editingLog && updateTodayBodyWeight) {
      await updateTodayBodyWeight({ weight: data.weight });
    } else if (logBodyWeight) {
      await logBodyWeight({ weight: data.weight });
    }
    setEditingLog(null);
  };

  const formatDateLabel = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isYesterday =
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate();

    if (isToday) return 'Hoy';
    if (isYesterday) return 'Ayer';

    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
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
            <Scale size={34} color={colors.tint} strokeWidth={2.2} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Sin registros de peso corporal
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            Registra tu peso con frecuencia para seguir tu tendencia, evaluar tu composición corporal y visualizar medias y fluctuaciones en gráficas interactivas estilo Apple Health.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenNewModal}
            style={[styles.emptyCtaBtn, { backgroundColor: colors.tint }]}
          >
            <Plus size={18} color={accentContrastText} strokeWidth={2.5} />
            <Text style={[styles.emptyCtaText, { color: accentContrastText }]}>
              Registrar Mi Primer Peso
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Action Row con resumen rápido y botón de registro */}
          <View style={styles.actionRow}>
            {stats && (
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
                  Último: <Text style={{ fontWeight: '800', color: colors.tint }}>{stats.current} kg</Text>
                </Text>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={todayEntry ? handleEditToday : handleOpenNewModal}
              style={[styles.addBtn, { backgroundColor: colors.tint }]}
            >
              {todayEntry ? (
                <>
                  <Edit3 size={15} color={accentContrastText} strokeWidth={2.5} />
                  <Text style={[styles.addBtnText, { color: accentContrastText }]}>
                    Editar Peso Hoy
                  </Text>
                </>
              ) : (
                <>
                  <Plus size={16} color={accentContrastText} strokeWidth={2.5} />
                  <Text style={[styles.addBtnText, { color: accentContrastText }]}>
                    Registrar Peso
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Gráfica interactiva Apple Health */}
          <BodyWeightChart data={chartData} />

          {/* Resumen de Métricas Generales (Apple Health KPI Grid) */}
          {stats && (
            <View
              style={[
                styles.kpiCard,
                {
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
              />
              <View style={styles.kpiRow}>
                {/* Primer peso */}
                <View style={styles.kpiCol}>
                  <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>INICIAL</Text>
                  <Text style={[styles.kpiValue, { color: colors.text }]}>
                    {stats.first} <Text style={styles.kpiUnit}>kg</Text>
                  </Text>
                </View>

                {/* Cambio total */}
                <View style={styles.kpiCol}>
                  <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>CAMBIO TOTAL</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text
                      style={[
                        styles.kpiValue,
                        {
                          color:
                            stats.totalDelta < 0
                              ? '#10b981'
                              : stats.totalDelta > 0
                              ? '#f59e0b'
                              : colors.text,
                        },
                      ]}
                    >
                      {stats.totalDelta > 0 ? `+${stats.totalDelta}` : stats.totalDelta}
                      <Text style={styles.kpiUnit}> kg</Text>
                    </Text>
                  </View>
                </View>

                {/* Promedio */}
                <View style={styles.kpiCol}>
                  <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>PROMEDIO</Text>
                  <Text style={[styles.kpiValue, { color: colors.text }]}>
                    {stats.avg} <Text style={styles.kpiUnit}>kg</Text>
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Historial Detallado de Registros (Apple Health Style) */}
          <View
            style={[
              styles.historyCard,
              {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
            />

            {/* Header del Historial */}
            <View style={styles.historyHeader}>
              <View style={styles.historyTitleRow}>
                <View
                  style={[
                    styles.historyIconWrap,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                >
                  <Calendar size={18} color={colors.tint} strokeWidth={2.2} />
                </View>
                <Text style={[styles.historyTitle, { color: colors.text }]}>
                  Historial de Registros
                </Text>
              </View>

              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: colors.tint + '15',
                  },
                ]}
              >
                <Text style={[styles.countBadgeText, { color: colors.tint }]}>
                  {historyList.length} {historyList.length === 1 ? 'registro' : 'registros'}
                </Text>
              </View>
            </View>

            {/* Lista de Registros */}
            <View style={styles.historyList}>
              {displayedHistory.map((item: any, index: number) => {
                const isItemToday = formatDateLabel(item.time) === 'Hoy';
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.historyRow,
                      index > 0 && {
                        borderTopWidth: 1,
                        borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                      },
                    ]}
                  >
                    <View style={styles.historyDateCol}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.historyDateText, { color: colors.text }]}>
                          {formatDateLabel(item.time)}
                        </Text>
                        {isItemToday && (
                          <View
                            style={[
                              styles.todayBadge,
                              { backgroundColor: colors.tint + '20' },
                            ]}
                          >
                            <Text style={[styles.todayBadgeText, { color: colors.tint }]}>
                              ACTUAL
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.historySubDate, { color: colors.textSecondary }]}>
                        {new Date(item.time).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>

                    <View style={styles.historyRightCol}>
                      <Text style={[styles.historyWeightVal, { color: colors.text }]}>
                        {item.weight}{' '}
                        <Text style={[styles.historyWeightUnit, { color: colors.textSecondary }]}>
                          kg
                        </Text>
                      </Text>

                      {item.delta !== null ? (
                        <View
                          style={[
                            styles.deltaPill,
                            {
                              backgroundColor:
                                item.delta < 0
                                  ? 'rgba(16, 185, 129, 0.12)'
                                  : item.delta > 0
                                  ? 'rgba(245, 158, 11, 0.12)'
                                  : isDark
                                  ? 'rgba(255, 255, 255, 0.06)'
                                  : 'rgba(0, 0, 0, 0.04)',
                            },
                          ]}
                        >
                          {item.delta < 0 ? (
                            <ArrowDownRight size={11} color="#10b981" strokeWidth={2.5} />
                          ) : item.delta > 0 ? (
                            <ArrowUpRight size={11} color="#f59e0b" strokeWidth={2.5} />
                          ) : (
                            <Minus size={11} color={colors.textSecondary} strokeWidth={2.5} />
                          )}
                          <Text
                            style={[
                              styles.deltaText,
                              {
                                color:
                                  item.delta < 0
                                    ? '#10b981'
                                    : item.delta > 0
                                    ? '#f59e0b'
                                    : colors.textSecondary,
                              },
                            ]}
                          >
                            {item.delta > 0 ? `+${item.delta}` : item.delta} kg
                          </Text>
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.deltaPill,
                            {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                            },
                          ]}
                        >
                          <Text style={[styles.deltaText, { color: colors.textSecondary }]}>
                            Primer registro
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Botón Ver Más / Ver Menos */}
            {historyList.length > 5 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  setShowAllHistory(!showAllHistory);
                }}
                style={[
                  styles.expandBtn,
                  {
                    borderTopWidth: 1,
                    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
              >
                <Text style={[styles.expandBtnText, { color: colors.tint }]}>
                  {showAllHistory
                    ? 'Mostrar menos'
                    : `Ver todos (${historyList.length} registros)`}
                </Text>
                {showAllHistory ? (
                  <ChevronUp size={16} color={colors.tint} />
                ) : (
                  <ChevronDown size={16} color={colors.tint} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      {/* Modal para Registrar / Editar Peso */}
      <BodyWeightModal
        visible={showModal}
        existingLog={editingLog}
        onClose={() => {
          setShowModal(false);
          setEditingLog(null);
        }}
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
    flexGrow: 1,
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
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    minHeight: 380,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 320,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 22,
  },
  emptyCtaText: {
    fontSize: 14,
    fontWeight: '800',
  },
  kpiCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiCol: {
    flex: 1,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  kpiUnit: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  historyCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  historyList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  historyDateCol: {
    flex: 1,
  },
  historyDateText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  historySubDate: {
    fontSize: 11,
    marginTop: 2,
  },
  todayBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  historyRightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  historyWeightVal: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  historyWeightUnit: {
    fontSize: 11,
    fontWeight: '600',
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  deltaText: {
    fontSize: 10,
    fontWeight: '800',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
  },
  expandBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
