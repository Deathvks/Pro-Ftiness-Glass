import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { X, Zap, Plus, Trash2, Check, Flame } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import * as creatinaService from '@/services/creatinaService';

interface CreatineTrackerModalProps {
  visible: boolean;
  selectedDate: string;
  creatineTarget: string | number;
  onClose: () => void;
  onRefresh: () => void;
}

export const CreatineTrackerModal: React.FC<CreatineTrackerModalProps> = ({
  visible,
  selectedDate,
  creatineTarget,
  onClose,
  onRefresh,
}) => {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const [grams, setGrams] = useState(String(creatineTarget || '5'));
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCreatineData();
    }
  }, [visible, selectedDate]);

  const loadCreatineData = async () => {
    setIsLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        creatinaService.getCreatinaLogs({ startDate: selectedDate, endDate: selectedDate }),
        creatinaService.getCreatinaStats().catch(() => null),
      ]);
      setLogs(logsRes?.data || []);
      if (statsRes?.data) setStats(statsRes.data);
    } catch (e) {
      console.warn('Error loading creatine logs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLog = async () => {
    const num = parseFloat(grams);
    if (isNaN(num) || num <= 0) return;

    setIsSubmitting(true);
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}

      await creatinaService.createCreatinaLog({
        grams: num,
        log_date: selectedDate,
      });
      await loadCreatineData();
      onRefresh();
    } catch (e) {
      console.error('Error logging creatine:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (id: number) => {
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
      await creatinaService.deleteCreatinaLog(id);
      await loadCreatineData();
      onRefresh();
    } catch (e) {
      console.error('Error deleting creatine log:', e);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill}>
        <Pressable
          style={[
            StyleSheet.absoluteFill,
            {
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.25)',
            },
          ]}
          onPress={onClose}
        >
          <Pressable onPress={e => e.stopPropagation()} style={[styles.cardWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.card}>
              {/* Close Button */}
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
                activeOpacity={0.7}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Icon badge */}
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor: 'rgba(168, 85, 247, 0.15)',
                    borderColor: 'rgba(168, 85, 247, 0.3)',
                  },
                ]}
              >
                <Zap size={30} color="#a855f7" />
              </View>

              <Text style={[styles.title, { color: colors.text }]}>Control de Creatina</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Dosis diaria recomendada: ~{creatineTarget}g
              </Text>

              {/* Input & Quick Presets */}
              <View style={styles.inputContainer}>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      borderColor: colors.border,
                      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.04)',
                    },
                  ]}
                >
                  <TextInput
                    value={grams}
                    onChangeText={setGrams}
                    keyboardType="numeric"
                    style={[styles.input, { color: colors.text }]}
                    placeholder="5"
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>gramos</Text>
                </View>

                {/* Quick Presets */}
                <View style={styles.presetsRow}>
                  {['3', '5', '7'].map(val => (
                    <TouchableOpacity
                      key={val}
                      onPress={() => {
                        try {
                          Haptics.selectionAsync();
                        } catch {}
                        setGrams(val);
                      }}
                      style={[
                        styles.presetChip,
                        grams === val && {
                          backgroundColor: '#a855f7',
                          borderColor: '#a855f7',
                        },
                        grams !== val && {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                          borderColor: colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          { color: grams === val ? '#ffffff' : colors.textSecondary },
                        ]}
                      >
                        {val}g
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  onPress={handleAddLog}
                  disabled={isSubmitting}
                  style={[
                    styles.addBtn,
                    {
                      backgroundColor: '#a855f7',
                      opacity: isSubmitting ? 0.6 : 1,
                    },
                  ]}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.addBtnText}>Registrar Toma</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Logs for selectedDate */}
              <View style={styles.logsSection}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  Tomas del Día ({logs.length})
                </Text>

                {isLoading ? (
                  <ActivityIndicator size="small" color="#a855f7" style={{ marginVertical: 12 }} />
                ) : logs.length > 0 ? (
                  <ScrollView style={styles.logsList} contentContainerStyle={{ gap: 8 }}>
                    {logs.map(log => (
                      <View
                        key={log.id}
                        style={[
                          styles.logItem,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <View style={styles.logLeft}>
                          <View style={styles.logCheckBadge}>
                            <Check size={14} color="#a855f7" strokeWidth={3} />
                          </View>
                          <Text style={[styles.logGrams, { color: colors.text }]}>{log.grams}g</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteLog(log.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          activeOpacity={0.7}
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={[styles.emptyLogs, { color: colors.textMuted }]}>
                    No hay tomas registradas para este día.
                  </Text>
                )}
              </View>

              {/* Stats card if available */}
              {stats && (
                <View
                  style={[
                    styles.statsBox,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.statCol}>
                    <Text style={[styles.statVal, { color: colors.text }]}>{stats.currentStreak || 0}</Text>
                    <Text style={[styles.statSub, { color: colors.textMuted }]}>Racha (días)</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={[styles.statVal, { color: colors.text }]}>{stats.totalDays || 0}</Text>
                    <Text style={[styles.statSub, { color: colors.textMuted }]}>Total Días</Text>
                  </View>
                </View>
              )}
            </View>
          </Pressable>
        </Pressable>
      </GlassView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 32,
    overflow: 'hidden',
  },
  card: {
    padding: 22,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 12,
    marginTop: 4,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 18,
  },
  inputContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  input: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  inputUnit: {
    fontSize: 14,
    fontWeight: '700',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  addBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  logsSection: {
    width: '100%',
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  logsList: {
    maxHeight: 120,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logCheckBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logGrams: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyLogs: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 10,
  },
  statsBox: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 16,
    paddingVertical: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  statSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
});
