/* mobile/src/components/workout/WorkoutExerciseDetailModal.tsx */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import {
  X,
  Dumbbell,
  Repeat,
  Play,
  Clock,
  Target,
  Sparkles,
  FileText,
  AlertCircle,
} from 'lucide-react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import { getThemeBaseBackground } from '@/constants/theme';
import { SwipeableSheetModal } from '@/components/ui/SwipeableBottomSheet';
import { ModalThemeBackground, getThemedModalBorderColor } from '@/components/ui/ModalThemeBackground';
import { GlassButton } from '@/components/ui/GlassButton';
import { getContrastTextColor } from '@/utils/colorUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { ExerciseMediaPreview } from '@/components/routines/ExerciseMediaPreview';
import { askTrainerAI } from '@/services/aiService';

interface ModalGlassBackdropProps {
  isDark: boolean;
  borderRadius: number;
  interactive?: boolean;
}

function ModalGlassBackdrop({ isDark, borderRadius, interactive = false }: ModalGlassBackdropProps) {
  const supportsNativeGlass = useMemo(() => {
    if (Platform.OS !== 'ios') return false;
    try {
      return isLiquidGlassAvailable();
    } catch {
      return false;
    }
  }, []);

  if (supportsNativeGlass) {
    return (
      <GlassView
        pointerEvents="none"
        glassEffectStyle="regular"
        isInteractive={interactive}
        colorScheme={isDark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, { borderRadius, borderCurve: 'continuous' }]}
      />
    );
  }

  return (
    <BlurView
      pointerEvents="none"
      intensity={Platform.OS === 'android' ? 45 : 35}
      tint={isDark ? 'dark' : 'light'}
      style={[StyleSheet.absoluteFill, { borderRadius, overflow: 'hidden' }]}
    />
  );
}

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
  const glassBorder = isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)';
  const contrastText = getContrastTextColor(colors.tint);
  const insets = useSafeAreaInsets();

  const allExercises = useAppStore(state => state.allExercises) || [];
  const getOrFetchAllExercises = useAppStore(state => state.getOrFetchAllExercises);
  const gamification = useAppStore(state => state.gamification || {});

  const [localDetails, setLocalDetails] = useState<any>(exercise?.exercise_details || {});
  const isLoadingDetails = false;

  // Asegurar que el catálogo completo de ejercicios esté disponible para multimedia y técnica
  useEffect(() => {
    if (allExercises.length === 0 && getOrFetchAllExercises) {
      getOrFetchAllExercises().catch(() => {});
    }
  }, [allExercises.length, getOrFetchAllExercises]);

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
  }, [exercise]);

  // Buscar coincidencia en el catálogo completo de ejercicios
  const matchedFromStore = useMemo(() => {
    if (!exercise) return null;
    const rawSub = exercise.exercise_details || exercise.exercise || {};
    const catalogId =
      exercise.exercise_list_id ||
      exercise.exercise_id ||
      rawSub.exercise_list_id ||
      rawSub.id ||
      (!exercise.routine_id ? exercise.id : null);
    const targetName = (exercise.name || exercise.exercise_name || rawSub.name || '')
      .trim()
      .toLowerCase();

    return allExercises.find((ex: any) => {
      if (!ex) return false;
      if (
        catalogId !== undefined &&
        catalogId !== null &&
        (String(ex.id) === String(catalogId) ||
          (ex.exercise_list_id && String(ex.exercise_list_id) === String(catalogId)))
      ) {
        return true;
      }
      if (targetName && ex.name?.trim().toLowerCase() === targetName) return true;
      return false;
    });
  }, [exercise, allExercises]);

  const mergedDetails = useMemo(() => {
    const rawEx = exercise || {};
    const rawLoc = localDetails || {};
    const rawMatch = matchedFromStore || {};
    const rawSubEx = rawEx.exercise_details || rawEx.exercise || {};
    const rawSubMatch = rawMatch.exercise_details || rawMatch.exercise || {};

    const video_url =
      rawEx.video_url ||
      rawSubEx.video_url ||
      rawLoc.video_url ||
      rawMatch.video_url ||
      rawSubMatch.video_url ||
      null;

    const youtube_id =
      rawEx.youtube_id ||
      rawSubEx.youtube_id ||
      rawLoc.youtube_id ||
      rawMatch.youtube_id ||
      rawSubMatch.youtube_id ||
      null;

    const parseImagesArray = (raw: any): string[] => {
      if (!raw) return [];
      if (Array.isArray(raw)) {
        return raw
          .map(item => (typeof item === 'string' ? item : item?.image))
          .filter((u): u is string => typeof u === 'string' && u.trim() !== '' && !u.includes('/muscle_groups/'));
      }
      if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (!trimmed || trimmed === '[]') return [];
        if (trimmed.startsWith('[')) {
          try {
            return parseImagesArray(JSON.parse(trimmed));
          } catch {
            return [];
          }
        }
        return trimmed
          .split(',')
          .map(s => s.trim())
          .filter(u => u && !u.includes('/muscle_groups/'));
      }
      return [];
    };

    const collectedImages = Array.from(
      new Set([
        ...parseImagesArray(rawEx.images),
        ...parseImagesArray(rawSubEx.images),
        ...parseImagesArray(rawLoc.images),
        ...parseImagesArray(rawMatch.images),
        ...parseImagesArray(rawSubMatch.images),
        ...[
          rawEx.image_url_start,
          rawEx.image_url_end,
          rawEx.image_url,
          rawEx.image,
          rawSubEx.image_url_start,
          rawSubEx.image_url_end,
          rawSubEx.image_url,
          rawSubEx.image,
          rawLoc.image_url_start,
          rawLoc.image_url_end,
          rawLoc.image_url,
          rawLoc.image,
          rawMatch.image_url_start,
          rawMatch.image_url_end,
          rawMatch.image_url,
          rawMatch.image,
          rawSubMatch.image_url_start,
          rawSubMatch.image_url_end,
          rawSubMatch.image_url,
          rawSubMatch.image,
        ].filter((u): u is string => typeof u === 'string' && u.trim() !== '' && u !== 'null' && !u.includes('/muscle_groups/')),
      ])
    );

    const images = collectedImages;

    const image_url =
      collectedImages[0] ||
      null;

    const description =
      rawLoc.description_es ||
      rawLoc.description ||
      rawEx.description_es ||
      rawEx.description ||
      rawMatch.description_es ||
      rawMatch.description ||
      null;

    const muscle_group =
      rawLoc.muscle_group ||
      rawLoc.muscles ||
      rawEx.muscle_group ||
      rawEx.muscles ||
      rawMatch.muscle_group ||
      rawMatch.muscles ||
      'General';

    return {
      ...rawMatch,
      ...rawLoc,
      ...rawEx,
      video_url,
      youtube_id,
      images,
      image_url,
      description,
      description_es: rawMatch.description_es || rawLoc.description_es || rawEx.description_es,
      muscle_group,
    };
  }, [exercise, localDetails, matchedFromStore]);

  // Detección de disponibilidad de Video y Animación de fotos
  const hasVideo = Boolean(
    mergedDetails.video_url ||
    mergedDetails.youtube_id ||
    mergedDetails.video ||
    mergedDetails.youtube_url ||
    mergedDetails.exercise_details?.video_url ||
    mergedDetails.exercise_details?.youtube_id ||
    mergedDetails.exercise_details?.video
  );

  const hasImages = Boolean(
    (Array.isArray(mergedDetails.images) && mergedDetails.images.length > 0) ||
    mergedDetails.image_url
  );

  // Modo multimedia activo: deriva de la selección del usuario para el ejercicio actual o prioriza vídeo si existe
  const exerciseMediaKey = `${exercise?.id ?? ''}-${exercise?.name ?? ''}`;
  const [manualMediaSelection, setManualMediaSelection] = useState<{
    key: string;
    mode: 'video' | 'images';
  } | null>(null);
  const mediaMode: 'video' | 'images' =
    manualMediaSelection?.key === exerciseMediaKey
      ? manualMediaSelection.mode
      : hasVideo
      ? 'video'
      : 'images';

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
    <SwipeableSheetModal
      visible={Boolean(exercise)}
      onClose={onClose}
      backdropColor={isDark ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0.28)'}
      dragAreaHeight={84}
      sheetStyle={[
        styles.modalSheet,
        {
          backgroundColor: getThemeBaseBackground(theme),
          borderColor: getThemedModalBorderColor(theme),
        },
      ]}
    >
      {exercise ? (
        <>
          <ModalThemeBackground theme={theme} />

          {/* Barra de arrastre superior tipo cápsula Apple (Swipe down to dismiss) */}
          <View pointerEvents="none" style={styles.dragIndicatorWrapper}>
            <View
              style={[
                styles.dragIndicator,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.40)' : 'rgba(0, 0, 0, 0.25)' },
              ]}
            />
          </View>

          {/* Cabecera con efecto Liquid Glass y arrastre hacia abajo */}
          <View
            style={[styles.modalHeader, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.06)' }]}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.exerciseTitle, { color: colors.text }]} numberOfLines={2}>
                {exercise.name}
              </Text>
            </View>

            <GlassButton
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                onClose();
              }}
              theme={theme}
              style={styles.closeButton}
              accessibilityLabel="Cerrar detalle del ejercicio"
            >
              <X size={18} color={colors.text} strokeWidth={2.5} />
            </GlassButton>
          </View>

          {/* Contenido en Scroll */}
          <ScrollView
            style={{ flexShrink: 1 }}
            contentContainerStyle={[
              styles.scrollBody,
              { paddingBottom: Math.max(insets.bottom + 24, 36) },
            ]}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            bounces={true}
          >
            {/* 1. Selector Vídeo / Animación + Reproductor Multimedia */}
            <View style={styles.mediaContainerWrapper}>
              {hasVideo && hasImages && (
                <View
                  style={[
                    styles.mediaModeSelector,
                    {
                      borderColor: glassBorder,
                      backgroundColor: 'transparent',
                    },
                  ]}
                >
                  <ModalGlassBackdrop isDark={isDark} borderRadius={24} interactive />
                  <Pressable
                    hitSlop={6}
                    onPress={() => {
                      try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      } catch {}
                      setManualMediaSelection({ key: exerciseMediaKey, mode: 'video' });
                    }}
                    style={[
                      styles.mediaModeTab,
                      mediaMode === 'video' && [styles.mediaModeTabActive, { backgroundColor: colors.tint }],
                    ]}
                  >
                    <Play
                      size={11}
                      color={mediaMode === 'video' ? contrastText : colors.textSecondary}
                      fill={mediaMode === 'video' ? contrastText : 'transparent'}
                    />
                    <Text
                      style={[
                        styles.mediaModeTabText,
                        { color: mediaMode === 'video' ? contrastText : colors.textSecondary },
                      ]}
                    >
                      Vídeo
                    </Text>
                  </Pressable>

                  <Pressable
                    hitSlop={6}
                    onPress={() => {
                      try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      } catch {}
                      setManualMediaSelection({ key: exerciseMediaKey, mode: 'images' });
                    }}
                    style={[
                      styles.mediaModeTab,
                      mediaMode === 'images' && [styles.mediaModeTabActive, { backgroundColor: colors.tint }],
                    ]}
                  >
                    <Repeat
                      size={11}
                      color={mediaMode === 'images' ? contrastText : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.mediaModeTabText,
                        { color: mediaMode === 'images' ? contrastText : colors.textSecondary },
                      ]}
                    >
                      Animación
                    </Text>
                  </Pressable>
                </View>
              )}

              <View
                style={[
                  mediaMode === 'video' ? styles.mediaHeroCardVideo : styles.mediaHeroCardImages,
                  {
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.50)' : 'rgba(0, 0, 0, 0.04)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
              >
                {isLoadingDetails ? (
                  <View style={styles.loadingCenter}>
                    <ActivityIndicator size="large" color={colors.tint} />
                  </View>
                ) : (
                  <ExerciseMediaPreview
                    key={`detail-media-${exercise?.id || exercise?.name}-${mediaMode}`}
                    item={mergedDetails}
                    details={mergedDetails}
                    fitMode="contain"
                    playYouTube={mediaMode === 'video'}
                    forceImageMode={mediaMode === 'images'}
                    showImageCounter={false}
                  />
                )}
              </View>
            </View>

            {/* 2. Grid de 4 Métricas Clave (Liquid Glass real) */}
            <View style={styles.metricsGrid}>
              {[
                { key: 'muscle', label: 'MÚSCULO', value: muscleLabel, Icon: Target },
                { key: 'sets', label: 'SERIES', value: `${setsCount} series`, Icon: Dumbbell },
                { key: 'reps', label: 'REPS', value: `${repsCount} reps`, Icon: Repeat },
                { key: 'rest', label: 'DESCANSO', value: `${restTime}s`, Icon: Clock },
              ].map(({ key, label, value, Icon }) => (
                <View
                  key={key}
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: 'transparent',
                      borderColor: glassBorder,
                    },
                  ]}
                >
                  <ModalGlassBackdrop isDark={isDark} borderRadius={18} />
                  <View style={[styles.metricIconWrap, { backgroundColor: colors.tint + '1F' }]}>
                    <Icon size={18} color={colors.tint} strokeWidth={2.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metricLabel}>{label}</Text>
                    <Text style={[styles.metricValue, { color: colors.text }]} numberOfLines={1}>
                      {value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Píldora de Equipamiento */}
            {mergedDetails.equipment ? (
              <View style={styles.equipmentRow}>
                <View
                  style={[
                    styles.equipmentPill,
                    {
                      backgroundColor: 'transparent',
                      borderColor: glassBorder,
                    },
                  ]}
                >
                  <ModalGlassBackdrop isDark={isDark} borderRadius={12} />
                  <Dumbbell size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.equipmentText, { color: colors.textSecondary }]}>
                    Equipamiento: {mergedDetails.equipment}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* 3. Instrucciones de Ejecución / Descripción */}
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
                    backgroundColor: 'transparent',
                    borderColor: glassBorder,
                  },
                ]}
              >
                <ModalGlassBackdrop isDark={isDark} borderRadius={20} />
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
                  <View
                    style={[
                      styles.aiQuotaTag,
                      {
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: glassBorder,
                        backgroundColor: 'transparent',
                      },
                    ]}
                  >
                    <ModalGlassBackdrop isDark={isDark} borderRadius={8} />
                    <Text style={[styles.aiQuotaText, { color: colors.tint }]}>
                      Usos: {remainingUses}/5
                    </Text>
                  </View>
                ) : null}
              </View>

              {!aiExplanation && !isAiLoading && (
                <GlassButton
                  onPress={handleAskAI}
                  theme={theme}
                  color={colors.tint}
                  style={styles.aiAskButton}
                >
                  <Sparkles size={18} color={isDark ? '#ffffff' : colors.text} strokeWidth={2.5} style={{ marginRight: 8 }} />
                  <Text
                    numberOfLines={1}
                    style={[styles.aiAskButtonText, { color: isDark ? '#ffffff' : colors.text }]}
                  >
                    Pedir explicación experta
                  </Text>
                </GlassButton>
              )}

              {isAiLoading && (
                <View
                  style={[
                    styles.aiLoadingBox,
                    {
                      backgroundColor: 'transparent',
                      borderColor: glassBorder,
                    },
                  ]}
                >
                  <ModalGlassBackdrop isDark={isDark} borderRadius={18} />
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
                      backgroundColor: 'transparent',
                      borderColor: colors.tint + '40',
                    },
                  ]}
                >
                  <ModalGlassBackdrop isDark={isDark} borderRadius={20} />
                  <Text style={[styles.aiResponseText, { color: colors.text }]}>
                    {aiExplanation}
                  </Text>
                </View>
              ) : null}
            </View>
          </ScrollView>
        </>
      ) : null}
    </SwipeableSheetModal>
  );
};

const { height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
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
    paddingBottom: 8,
    width: '100%',
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
    paddingBottom: 48,
  },
  mediaContainerWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mediaModeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    zIndex: 10,
  },
  mediaModeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    zIndex: 2,
  },
  mediaModeTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  mediaModeTabText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  mediaHeroCardVideo: {
    width: 220,
    maxWidth: '100%',
    aspectRatio: 9 / 16,
    maxHeight: 390,
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  mediaHeroCardImages: {
    width: 220,
    maxWidth: '100%',
    aspectRatio: 9 / 16,
    maxHeight: 380,
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
    width: '100%',
    height: 50,
    paddingHorizontal: 18,
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
