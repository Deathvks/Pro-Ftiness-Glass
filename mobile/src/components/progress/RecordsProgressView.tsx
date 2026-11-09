import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { ContentCardBackdrop } from '@/components/ui/ContentCardBackdrop';
import {
  Trophy,
  Calendar as CalendarIcon,
  Weight,
  Award,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import {
  getPersonalRecords,
  getPersonalRecordExerciseNames,
} from '@/services/personalRecordService';

export function RecordsProgressView() {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [exerciseNames, setExerciseNames] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('all');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);

  useEffect(() => {
    async function loadExerciseNames() {
      try {
        const names = await getPersonalRecordExerciseNames();
        setExerciseNames(names || []);
      } catch (err) {
        console.error('Error fetching exercise names for records:', err);
      }
    }
    loadExerciseNames();
  }, []);

  useEffect(() => {
    async function fetchRecords() {
      try {
        setLoading(true);
        const response = await getPersonalRecords(currentPage, selectedExercise);
        setRecords(response.records || []);
        setTotalPages(response.totalPages || 1);
      } catch (err) {
        console.error('Error fetching records:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecords();
  }, [currentPage, selectedExercise]);

  const handleSelectFilter = (ex: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setSelectedExercise(ex);
    setCurrentPage(1);
    setShowFilterModal(false);
  };

  const getExerciseIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (
      lower.includes('press') ||
      lower.includes('bench') ||
      lower.includes('sentadilla') ||
      lower.includes('peso muerto')
    ) {
      return <Weight size={20} color="#eab308" />;
    }
    return <Award size={20} color="#eab308" />;
  };

  return (
    <View style={styles.container}>
      {/* Top Bar: Title & Filter Button */}
      <View style={styles.topBar}>
        <View style={styles.titleWrap}>
          <View style={styles.trophyIconBox}>
            <Trophy size={18} color="#eab308" />
          </View>
          <Text style={[styles.heading, { color: colors.text }]}>
            Récords Personales
          </Text>
        </View>

        {exerciseNames.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowFilterModal(true)}
            style={[
              styles.filterBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.05)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <Text
              style={[styles.filterBtnText, { color: colors.text }]}
              numberOfLines={1}
            >
              {selectedExercise === 'all' ? 'Todos los ejercicios' : selectedExercise}
            </Text>
            <ChevronDown size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : records.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.04)'
                : 'rgba(0, 0, 0, 0.02)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          <View style={styles.emptyIconBox}>
            <Trophy size={32} color="#eab308" opacity={0.8} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {selectedExercise === 'all'
              ? 'No tienes récords registrados aún'
              : 'No se encontraron récords para este ejercicio'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Sigue entrenando para superar tus límites.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {records.map(record => {
            const formattedDate = new Date(record.date).toLocaleDateString(
              'es-ES',
              {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }
            );

            return (
              <View
                key={record.id}
                style={[
                  styles.recordCard,
                  {
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
              >
                <ContentCardBackdrop
                  colorScheme={isDark ? 'dark' : 'light'}
                  style={StyleSheet.absoluteFill}
                />

                <View style={styles.cardLeft}>
                  <View style={styles.recordIconWrap}>
                    {getExerciseIcon(record.exercise_name)}
                  </View>
                  <View style={styles.recordTextWrap}>
                    <Text
                      style={[styles.recordName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {record.exercise_name}
                    </Text>
                    <View style={styles.dateRow}>
                      <CalendarIcon size={12} color={colors.textSecondary} />
                      <Text
                        style={[styles.dateText, { color: colors.textSecondary }]}
                      >
                        {formattedDate}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardRight}>
                  <Text style={[styles.weightText, { color: colors.tint }]}>
                    {record.weight_kg}
                    <Text style={[styles.unitText, { color: colors.textSecondary }]}>
                      kg
                    </Text>
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  setCurrentPage(p => Math.max(p - 1, 1));
                }}
                disabled={currentPage === 1}
                style={[
                  styles.pageBtn,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                  },
                  currentPage === 1 && { opacity: 0.3 },
                ]}
              >
                <ChevronLeft size={18} color={colors.text} />
              </TouchableOpacity>

              <Text style={[styles.pageIndicator, { color: colors.textSecondary }]}>
                Página <Text style={{ color: colors.text }}>{currentPage}</Text> /{' '}
                {totalPages}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  setCurrentPage(p => Math.min(p + 1, totalPages));
                }}
                disabled={currentPage === totalPages}
                style={[
                  styles.pageBtn,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                  },
                  currentPage === totalPages && { opacity: 0.3 },
                ]}
              >
                <ChevronRight size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill}>
          <View style={styles.modalOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setShowFilterModal(false)}
            />
            <View
              style={[
                styles.modalCard,
                {
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(0, 0, 0, 0.1)',
                },
              ]}
            >
              <ContentCardBackdrop
                colorScheme={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius: 32 }]}
              />

              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Filtrar por ejercicio
                </Text>
                <TouchableOpacity
                  onPress={() => setShowFilterModal(false)}
                  style={styles.modalCloseBtn}
                >
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 20, gap: 6 }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelectFilter('all')}
                  style={[
                    styles.filterOption,
                    selectedExercise === 'all' && {
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      {
                        color:
                          selectedExercise === 'all' ? colors.tint : colors.text,
                        fontWeight: selectedExercise === 'all' ? '800' : '600',
                      },
                    ]}
                  >
                    Todos los ejercicios
                  </Text>
                </TouchableOpacity>

                {exerciseNames.map(name => {
                  const isSelected = selectedExercise === name;
                  return (
                    <TouchableOpacity
                      key={name}
                      activeOpacity={0.7}
                      onPress={() => handleSelectFilter(name)}
                      style={[
                        styles.filterOption,
                        isSelected && {
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          {
                            color: isSelected ? colors.tint : colors.text,
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </GlassView>
      </Modal>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  trophyIconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 160,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  loadingWrap: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    overflow: 'hidden',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recordIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordTextWrap: {
    flex: 1,
  },
  recordName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardRight: {
    paddingLeft: 8,
  },
  weightText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  unitText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 2,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageIndicator: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '75%',
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  filterOptionText: {
    fontSize: 14,
  },
});
