/* mobile/src/components/workout/WorkoutExerciseDetailModal.tsx */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Pressable,
} from 'react-native';
import {
  X,
  Dumbbell,
  Repeat,
  Clock,
  Target,
  Sparkles,
  FileText,
  AlertCircle,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { ExerciseMediaPreview } from '@/components/routines/ExerciseMediaPreview';
import { askTrainerAI } from '@/services/aiService';

interface WorkoutExerciseDetailModalProps {
  exercise: any;
  onClose: () => void;
}

export const WorkoutExerciseDetailModal: React.FC<WorkoutExerciseDetailModalProps> = ({
  exercise,
  onClose,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const getOrFetchAllExercises = useAppStore(state => state.getOrFetchAllExercises);
  const gamification = useAppStore(state => state.gamification || {});

  const [localDetails, setLocalDetails] = useState<any>(exercise?.exercise_details || {});
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Estados del Entrenador IA
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [remainingUses, setRemainingUses] = useState<number | null>(
    gamification?.ai_queries_remaining !== undefined ? gamification.ai_queries_remaining : 5
  );

  // Sincronizar ejercicio base cuando cambia la selección
  useEffect(() => {
    if (!exercise) {
      setLocalDetails({});
      setAiExplanation(null);
      setAiError(null);
      return;
    }

    const initDetails = {
      ...(exercise.exercise_details || {}),
      ...exercise,
    };
    setLocalDetails(initDetails);
    setAiExplanation(null);
    setAiError(null);

    // Auto-enriquecimiento: si faltan datos descriptivos o multimedia, buscar en allExercises
    const hasMissingData =
      (!initDetails.description && !initDetails.description_es) ||
      (!initDetails.video_url && !initDetails.youtube_id && !initDetails.images?.length);

    if (hasMissingData && getOrFetchAllExercises) {
      setIsLoadingDetails(true);
      getOrFetchAllExercises()
        .then((fullList: any[]) => {
          if (Array.isArray(fullList)) {
            const match = fullList.find(
              (e: any) =>
                (e.id && e.id === exercise.id) ||
                (e.name && exercise.name && e.name.toLowerCase().trim() === exercise.name.toLowerCase().trim())
            );
            if (match) {
              setLocalDetails((prev: any) => ({
                ...match,
                ...prev,
                description: match.description_es || match.description || prev.description,
              }));
            }
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingDetails(false));
    }
  }, [exercise, getOrFetchAllExercises]);

  const mergedDetails = {
    ...(exercise || {}),
    ...(localDetails || {}),
  };

  // Limpieza y formateo de descripción (remueve tags html residuales como <p>, </p>, <br>)
  const rawDescription =
    mergedDetails.description_es ||
    mergedDetails.description ||
    'Realiza el movimiento controlando la fase excéntrica y manteniendo una técnica sólida en cada repetición.';
  const cleanDescription = rawDescription.replace(/<\/?[^>]+(>|$)/g, '').trim();

  const muscleLabel =
    mergedDetails.muscle_group ||
    mergedDetails.muscles ||
    mergedDetails.target ||
    'General';

  const setsCount = exercise?.sets || mergedDetails.sets || 3;
  const repsCount = exercise?.reps || mergedDetails.reps || 10;
  const restTime = exercise?.rest_seconds || mergedDetails.rest_seconds || 90;

  // Manejador de Consulta con IA
  const handleAskAI = async () => {
    if (!exercise?.name) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setIsAiLoading(true);
    setAiError(null);

    const prompt = `Actúa como un entrenador personal y biomecánico experto. Explica detalladamente el ejercicio "${exercise.name}". 
Incluye:
1. Técnica correcta paso a paso y posición de inicio.
2. Músculos principales y secundarios implicados.
3. Los 2 errores más comunes al ejecutarlo y cómo evitarlos.
4. Un "Pro Tip" final para maximizar hipertrofia o fuerza.
Sé directo, motivador y usa un formato limpio con viñetas.`;

    try {
      const res = await askTrainerAI(prompt);
      const text = res?.response || res?.text || (typeof res === 'string' ? res : '');
      setAiExplanation(text);
      if (res?.remaining !== undefined) {
        setRemainingUses(res.remaining);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Error al conectar con el entrenador IA.';
      setAiError(msg);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <Modal
      visible={Boolean(exercise)}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {exercise ? (
        <Pressable
          style={[
            styles.overlay,
            { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0.28)' },
          ]}
          onPress={onClose}
        >
          <Pressable
            onPress={e => e.stopPropagation()}
            style={[
              styles.modalSheet,
              {
                backgroundColor: isDark ? 'rgba(22, 22, 28, 0.75)' : 'rgba(255, 255, 255, 0.82)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.88)',
              },
            ]}
          >
            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />

            {/* Barra de arrastre superior tipo cápsula Apple */}
            <View style={styles.dragIndicatorWrapper}>
              <View
                style={[
                  styles.dragIndicator,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.22)' },
                ]}
              />
            </View>

            {/* Cabecera con efecto Liquid Glass */}
            <View style={[styles.modalHeader, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.06)' }]}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[styles.exerciseTitle, { color: colors.text }]} numberOfLines={2}>
                  {exercise.name}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  onClose();
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.24)' : 'rgba(0, 0, 0, 0.10)',
                  },
                ]}
              >
                <GlassView
                  glassEffectStyle="regular"
                  colorScheme={isDark ? 'dark' : 'light'}
                  style={StyleSheet.absoluteFill}
                />
                <X size={18} color={colors.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Contenido en Scroll */}
            <ScrollView
              contentContainerStyle={styles.scrollBody}
              showsVerticalScrollIndicator={false}
            >
              {/* 1. Reproductor de Vídeo / Formato Shorts 9:16 con marco Glass */}
              <View style={styles.mediaContainerWrapper}>
                <View
                  style={[
                    styles.mediaHeroCard,
                    {
                      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.50)' : 'rgba(0, 0, 0, 0.04)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.12)',
                    },
                  ]}
                >
                  <GlassView
                    glassEffectStyle="regular"
                    colorScheme={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                  />
                  {isLoadingDetails ? (
                    <View style={styles.loadingCenter}>
                      <ActivityIndicator size="large" color={colors.tint} />
                    </View>
                  ) : (
                    <ExerciseMediaPreview
                      item={mergedDetails}
                      details={mergedDetails}
                      fitMode="contain"
                      playYouTube={true}
                    />
                  )}
                </View>
              </View>

              {/* 2. Grid de 4 Métricas Clave Liquid Glass */}
              <View style={styles.metricsGrid}>
                {/* Músculo */}
                <View
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.65)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                >
                  <GlassView
                    glassEffectStyle="regular"
                    colorScheme={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={[styles.metricIconWrap, { backgroundColor: colors.tint + '18' }]}>
                    <Target size={18} color={colors.tint} strokeWidth={2.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metricLabel}>MÚSCULO</Text>
                    <Text style={[styles.metricValue, { color: colors.text }]} numberOfLines={1}>
                      {muscleLabel}
                    </Text>
                  </View>
                </View>

                {/* Series */}
                <View
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.65)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                >
                  <GlassView
                    glassEffectStyle="regular"
                    colorScheme={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={[styles.metricIconWrap, { backgroundColor: colors.tint + '18' }]}>
                    <Dumbbell size={18} color={colors.tint} strokeWidth={2.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metricLabel}>SERIES</Text>
                    <Text style={[styles.metricValue, { color: colors.text }]} numberOfLines={1}>
                      {setsCount} series
                    </Text>
                  </View>
                </View>

                {/* Reps */}
                <View
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.65)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                >
                  <GlassView
                    glassEffectStyle="regular"
                    colorScheme={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={[styles.metricIconWrap, { backgroundColor: colors.tint + '18' }]}>
                    <Repeat size={18} color={colors.tint} strokeWidth={2.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metricLabel}>REPS</Text>
                    <Text style={[styles.metricValue, { color: colors.text }]} numberOfLines={1}>
                      {repsCount} reps
                    </Text>
                  </View>
                </View>

                {/* Descanso */}
                <View
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.65)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                >
                  <GlassView
                    glassEffectStyle="regular"
                    colorScheme={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={[styles.metricIconWrap, { backgroundColor: colors.tint + '18' }]}>
                    <Clock size={18} color={colors.tint} strokeWidth={2.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metricLabel}>DESCANSO</Text>
                    <Text style={[styles.metricValue, { color: colors.text }]} numberOfLines={1}>
                      {restTime}s
                    </Text>
                  </View>
                </View>
              </View>

              {/* Píldora Liquid Glass de Equipamiento */}
              {mergedDetails.equipment ? (
                <View style={styles.equipmentRow}>
                  <View
                    style={[
                      styles.equipmentPill,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.65)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.08)',
                      },
                    ]}
                  >
                    <GlassView
                      glassEffectStyle="regular"
                      colorScheme={isDark ? 'dark' : 'light'}
                      style={StyleSheet.absoluteFill}
                    />
                    <Dumbbell size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                    <Text style={[styles.equipmentText, { color: colors.textSecondary }]}>
                      Equipamiento: {mergedDetails.equipment}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* 3. Instrucciones de Ejecución / Descripción en Tarjeta Liquid Glass */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.sectionIconBadge, { backgroundColor: colors.tint + '18' }]}>
                    <FileText size={17} color={colors.tint} strokeWidth={2.5} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Instrucciones de Ejecución
                  </Text>
                </View>

                <View
                  style={[
                    styles.descBox,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.65)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                >
                  <GlassView
                    glassEffectStyle="regular"
                    colorScheme={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={[styles.descBody, { color: colors.text }]}>
                    {cleanDescription}
                  </Text>
                </View>
              </View>

              {/* 4. Entrenador IA: Técnica y Consejos */}
              <View style={[styles.sectionBlock, styles.aiSectionTopBorder]}>
                <View style={styles.aiHeaderRow}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={[styles.sectionIconBadge, { backgroundColor: colors.tint + '18' }]}>
                      <Sparkles size={17} color={colors.tint} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Técnica y Consejos IA
                    </Text>
                  </View>

                  {remainingUses !== null ? (
                    <View style={styles.aiQuotaTag}>
                      <Text style={[styles.aiQuotaText, { color: colors.tint }]}>
                        Usos: {remainingUses}/5
                      </Text>
                    </View>
                  ) : null}
                </View>

                {!aiExplanation && !isAiLoading && (
                  <TouchableOpacity
                    onPress={handleAskAI}
                    activeOpacity={0.82}
                    style={[
                      styles.aiAskButton,
                      {
                        backgroundColor: colors.tint,
                        borderColor: 'rgba(255, 255, 255, 0.35)',
                        shadowColor: colors.tint,
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.45,
                        shadowRadius: 14,
                        elevation: 6,
                      },
                    ]}
                  >
                    <Sparkles size={18} color="#ffffff" strokeWidth={2.5} style={{ marginRight: 8 }} />
                    <Text style={styles.aiAskButtonText}>Pedir explicación experta</Text>
                  </TouchableOpacity>
                )}

                {isAiLoading && (
                  <View
                    style={[
                      styles.aiLoadingBox,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.65)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                  >
                    <GlassView
                      glassEffectStyle="regular"
                      colorScheme={isDark ? 'dark' : 'light'}
                      style={StyleSheet.absoluteFill}
                    />
                    <ActivityIndicator size="small" color={colors.tint} />
                    <Text style={[styles.aiLoadingText, { color: colors.textSecondary }]}>
                      Analizando biomecánica del ejercicio...
                    </Text>
                  </View>
                )}

                {aiError ? (
                  <View style={styles.aiErrorBox}>
                    <AlertCircle size={18} color="#ef4444" strokeWidth={2.5} style={{ marginRight: 8 }} />
                    <Text style={styles.aiErrorText}>{aiError}</Text>
                  </View>
                ) : null}

                {aiExplanation ? (
                  <View
                    style={[
                      styles.aiResponseCard,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.65)',
                        borderColor: colors.tint + '45',
                      },
                    ]}
                  >
                    <GlassView
                      glassEffectStyle="regular"
                      colorScheme={isDark ? 'dark' : 'light'}
                      style={StyleSheet.absoluteFill}
                    />
                    <Text style={[styles.aiResponseText, { color: colors.text }]}>
                      {aiExplanation}
                    </Text>
                  </View>
                ) : null}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      ) : null}
    </Modal>
  );
};

const { height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: screenHeight * 0.92,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  dragIndicatorWrapper: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  dragIndicator: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: 20,
    paddingBottom: 40,
  },
  mediaContainerWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mediaHeroCard: {
    width: 250,
    maxWidth: '100%',
    height: 290,
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 10,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#8e8e93',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  equipmentRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  equipmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  equipmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionBlock: {
    marginBottom: 22,
  },
  aiSectionTopBorder: {
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  aiQuotaTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  aiQuotaText: {
    fontSize: 11,
    fontWeight: '800',
  },
  descBox: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  descBody: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    opacity: 0.9,
  },
  aiAskButton: {
    height: 50,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAskButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  aiLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 10,
  },
  aiLoadingText: {
    fontSize: 13,
    fontWeight: '700',
  },
  aiErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginTop: 8,
  },
  aiErrorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  aiResponseCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  aiResponseText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
});
