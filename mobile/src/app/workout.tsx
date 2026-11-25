/* mobile/src/app/workout.tsx */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Activity, Calculator, CheckCheck, Maximize2, Pause, Play, Timer } from 'lucide-react-native';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import ThemeBackground from '@/components/ThemeBackground';
import { getAppleCardSurfaceStyle, getThemeBaseBackground } from '@/constants/theme';
import { getThemedModalCardColor } from '@/components/ui/ModalThemeBackground';
import { ExpressiveFloatingToolbar } from '@/components/ui/ExpressiveUI';
import { getContrastTextColor } from '@/utils/colorUtils';
import { calculateCalories, groupWorkoutExercises } from '@/utils/workoutHelpers';

// Subcomponentes modularizados con paridad 1:1 frente al Frontend
import { WorkoutHeader } from '@/components/workout/WorkoutHeader';
import {
  SessionMuscleHeatmap,
  getWorkoutMuscleData,
} from '@/components/workout/SessionMuscleHeatmap';
import { WorkoutExerciseCard } from '@/components/workout/WorkoutExerciseCard';
import { WorkoutSupersetCard } from '@/components/workout/WorkoutSupersetCard';
import { WorkoutNotes } from '@/components/workout/WorkoutNotes';
import { PreviousWorkoutNoteBanner } from '@/components/workout/PreviousWorkoutNoteBanner';
import { NoActiveWorkout } from '@/components/workout/NoActiveWorkout';
import { CalorieInputModal } from '@/components/workout/CalorieInputModal';
import { WorkoutReviewModal } from '@/components/workout/WorkoutReviewModal';
import { WorkoutSummaryModal } from '@/components/workout/WorkoutSummaryModal';
import { PlateCalculatorModal } from '@/components/workout/PlateCalculatorModal';
import { ExerciseHistoryModal } from '@/components/workout/ExerciseHistoryModal';
import { WorkoutHeatmapModal } from '@/components/workout/WorkoutHeatmapModal';
import { SmartExerciseCoachModal } from '@/components/workout/SmartExerciseCoachModal';
import { WorkoutExerciseDetailModal } from '@/components/workout/WorkoutExerciseDetailModal';
import { ExerciseSearchModal } from '@/components/modals/ExerciseSearchModal';

function getWorkoutElapsedSeconds() {
  const { workoutStartTime, isWorkoutPaused, workoutAccumulatedTime } = useAppStore.getState();
  const runningTime = workoutStartTime && !isWorkoutPaused ? Date.now() - workoutStartTime : 0;
  return Math.floor(((workoutAccumulatedTime || 0) + runningTime) / 1000);
}

export default function WorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isWideWorkout = windowWidth >= 560;
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const baseBackground = getThemeBaseBackground(theme);

  // Zustand Store State
  const activeWorkout = useAppStore(state => state.activeWorkout);
  const workoutStartTime = useAppStore(state => state.workoutStartTime);
  const isWorkoutPaused = useAppStore(state => state.isWorkoutPaused);
  const workoutAccumulatedTime = useAppStore(state => state.workoutAccumulatedTime) || 0;
  const userProfile = useAppStore(state => state.userProfile || (state as any).user);
  const workoutLog = useAppStore(state => state.workoutLog);
  const openRestModal = useAppStore(state => state.openRestModal);

  // Zustand Store Actions
  const togglePauseWorkout = useAppStore(state => state.togglePauseWorkout);
  const stopWorkout = useAppStore(state => state.stopWorkout);
  const updateActiveWorkoutSet = useAppStore(state => state.updateActiveWorkoutSet);
  const applyCoachStrategyToExercise = useAppStore(
    state => (state as any).applyCoachStrategyToExercise
  );
  const showToast = useAppStore(state => (state as any).showToast);
  const addDropset = useAppStore(state => state.addDropset);
  const removeDropset = useAppStore(state => state.removeDropset);
  const toggleWarmupSet = useAppStore(state => state.toggleWarmupSet);
  const replaceExercise = useAppStore(state => state.replaceExercise);
  const logWorkout = useAppStore(state => state.logWorkout);
  const fetchInitialData = useAppStore(state => state.fetchInitialData);

  const [clock, setClock] = useState(Date.now);
  const isTimerRunning = Boolean(workoutStartTime && !isWorkoutPaused);
  const runningTime = isTimerRunning ? Math.max(0, clock - workoutStartTime) : 0;
  const timerSeconds = Math.floor((workoutAccumulatedTime + runningTime) / 1000);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, workoutStartTime]);

  // Al salir hacia atrás sin iniciar el cronómetro, limpiamos al desmontar para no rebotar el gesto nativo
  useEffect(() => {
    return () => {
      const state = useAppStore.getState();
      if (state.activeWorkout && getWorkoutElapsedSeconds() === 0) {
        state.stopWorkout?.();
      }
    };
  }, []);

  // Estados locales para notas y modales
  const [notes, setNotes] = useState('');
  const [dismissedPreviousNote, setDismissedPreviousNote] = useState(false);

  // Modales
  const [showCalorieModal, setShowCalorieModal] = useState(false);
  const [finalCalories, setFinalCalories] = useState(0);
  const [wasTimerRunningOnFinish, setWasTimerRunningOnFinish] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [completedWorkoutData, setCompletedWorkoutData] = useState<any>(null);

  const [showCalculator, setShowCalculator] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [historyExercise, setHistoryExercise] = useState<any>(null);
  const [coachExercise, setCoachExercise] = useState<any>(null);
  const [selectedDetailExercise, setSelectedDetailExercise] = useState<any>(null);
  const [substituteIndex, setSubstituteIndex] = useState<number | null>();
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const showToolbarRef = useRef(false);
  const floatingToolbarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(floatingToolbarAnim, {
      toValue: showFloatingToolbar ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [showFloatingToolbar, floatingToolbarAnim]);

  const handleWorkoutScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (!showToolbarRef.current && offsetY > 95) {
      showToolbarRef.current = true;
      setShowFloatingToolbar(true);
    } else if (showToolbarRef.current && offsetY <= 60) {
      showToolbarRef.current = false;
      setShowFloatingToolbar(false);
    }
  }, []);

  const hasWorkoutStarted = workoutStartTime !== null;

  const routineId = activeWorkout?.routineId;
  const routineName = activeWorkout?.routineName;
  const previousWorkoutNote = useMemo(() => {
    if ((!routineId && !routineName) || !Array.isArray(workoutLog)) return null;

    const normalizedRoutineName = routineName?.toLowerCase().trim();
    let latest: { note: string; date: string; routineName: string } | null = null;
    let latestTime = -Infinity;

    for (const log of workoutLog) {
      const matchesId = routineId && (log.routine_id === routineId || log.routineId === routineId);
      const matchesName = normalizedRoutineName && log.routine_name?.toLowerCase().trim() === normalizedRoutineName;
      if (!matchesId && !matchesName) continue;
      const note = log.notes?.split('GPS_DATA::')[0].trim();
      if (!note) continue;

      const time = Date.parse(log.workout_date);
      const dateOrder = Number.isNaN(time) ? -Infinity : time;
      if (latest && dateOrder <= latestTime) continue;
      latestTime = dateOrder;
      latest = { note, date: log.workout_date, routineName: log.routine_name || routineName };
    }

    return latest;
  }, [routineId, routineName, workoutLog]);

  // Agrupación por superseries
  const exerciseGroups = useMemo(() => {
    return groupWorkoutExercises(activeWorkout?.exercises || []);
  }, [activeWorkout?.exercises]);

  const workoutMuscleData = useMemo(
    () => getWorkoutMuscleData(activeWorkout?.exercises || []),
    [activeWorkout?.exercises]
  );
  const showInlineHeatmap =
    Boolean(activeWorkout) &&
    !activeWorkout?.isSimpleWorkout &&
    Object.keys(workoutMuscleData).length > 0;

  // Si no hay entrenamiento activo (Pantalla exacta del frontend)
  if (!activeWorkout) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <NoActiveWorkout
          onGoToRoutines={() => router.replace('/(tabs)/routines')}
          onStartQuickCardio={() => router.push('/quick-cardio')}
        />
      </View>
    );
  }

  const leaveWorkout = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleMinimizeWorkout = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    leaveWorkout();
  };

  // Manejador del botón Atrás
  const handleBackClick = () => {
    if (getWorkoutElapsedSeconds() === 0) {
      leaveWorkout();
      return;
    }

    // A partir del segundo 1 (timerSeconds >= 1), preguntar si desea minimizar para continuar o descartar
    Alert.alert(
      'Entrenamiento en curso',
      '¿Deseas minimizar la sesión para seguir navegando por la app o descartarla por completo?',
      [
        {
          text: 'Minimizar y navegar',
          onPress: handleMinimizeWorkout,
        },
        {
          text: 'Descartar sesión',
          style: 'destructive',
          onPress: () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch {}
            stopWorkout();
            leaveWorkout();
          },
        },
        { text: 'Seguir entrenando', style: 'cancel' },
      ]
    );
  };

  // Manejador para Finalizar Entrenamiento
  const handleFinishClick = () => {
    if (timerSeconds === 0) {
      Alert.alert(
        'Cronómetro sin iniciar',
        'Debes iniciar el cronómetro pulsando Play para registrar y guardar el entrenamiento.'
      );
      return;
    }

    const state = useAppStore.getState();
    const isPaused = state.isWorkoutPaused;
    if (!isPaused) {
      setWasTimerRunningOnFinish(true);
      togglePauseWorkout();
    } else {
      setWasTimerRunningOnFinish(false);
    }

    setShowCalorieModal(true);
  };

  // Callback de Calorías completadas
  const handleCalorieInputComplete = (calories: number) => {
    const isAnySetFilled = (activeWorkout.exercises || []).some((ex: any) =>
      (ex.setsDone || []).some(
        (set: any) =>
          (set.reps !== '' && set.reps !== null) ||
          (set.weight_kg !== '' && set.weight_kg !== null)
      )
    );

    if (!isAnySetFilled) {
      Alert.alert(
        'Sin datos',
        'Completa al menos una serie con peso o repeticiones para guardar el entrenamiento.'
      );
      setShowCalorieModal(false);
      if (wasTimerRunningOnFinish) togglePauseWorkout();
      return;
    }

    setFinalCalories(calories);
    setShowCalorieModal(false);
    setShowReviewModal(true);
  };

  // Guardado Final en Servidor
  const handleReviewConfirm = async () => {
    setIsSaving(true);

    const safeParseFloat = (v: any) => parseFloat(String(v).replace(',', '.')) || 0;

    const workoutData = {
      routineId: activeWorkout.routineId,
      routineName: activeWorkout.routineName,
      workout_date: activeWorkout.startTime || new Date().toISOString(),
      duration_seconds: timerSeconds,
      notes: notes,
      calories_burned: finalCalories,
      details: (activeWorkout.exercises || []).map((ex: any) => ({
        id: ex.id,
        exerciseName: ex.name,
        superset_group_id: ex.superset_group_id,
        reminder: ex.reminder,
        setsDone: (ex.setsDone || [])
          .filter(
            (set: any) =>
              (set.reps !== '' && set.reps !== null) ||
              (set.weight_kg !== '' && set.weight_kg !== null)
          )
          .map((set: any) => ({
            set_number: set.set_number,
            reps: safeParseFloat(set.reps),
            weight_kg: safeParseFloat(set.weight_kg),
            is_dropset: set.is_dropset || false,
            is_warmup: set.is_warmup || false,
            rir: set.rir !== undefined && set.rir !== null && set.rir !== '' ? Number(set.rir) : null,
          })),
      })),
    };

    try {
      const result = await logWorkout(workoutData);
      if (result.success) {
        setCompletedWorkoutData(workoutData);
        setShowReviewModal(false);
        setShowSummaryModal(true);
      } else {
        Alert.alert('Error al guardar', result.message || 'No se pudo guardar el entrenamiento.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error de conexión al guardar entrenamiento.');
    } finally {
      setIsSaving(false);
    }
  };

  // Sustituir ejercicio seleccionado
  const handleSubstituteSelect = (exercisesToAdd: any[]) => {
    if (typeof substituteIndex === 'number' && exercisesToAdd.length > 0 && replaceExercise) {
      const chosen = exercisesToAdd[0];
      replaceExercise(substituteIndex, chosen);
    }
    setSubstituteIndex(null);
  };

  return (
    <View style={[styles.screen, { backgroundColor: baseBackground }]}>
      <ThemeBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <FlatList
          data={exerciseGroups}
          keyExtractor={({ group }, index) => group.map(exercise => exercise.id).filter(id => id != null).join(':') || String(index)}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          onScroll={handleWorkoutScroll}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top > 0 ? insets.top + 8 : 16,
              paddingBottom: insets.bottom + 90,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <>
              <WorkoutHeader
                routineName={activeWorkout.routineName}
                routineImage={activeWorkout.imageUrl || activeWorkout.image_url}
                timer={timerSeconds}
                isWorkoutPaused={isWorkoutPaused}
                hasWorkoutStarted={hasWorkoutStarted}
                onBackClick={handleBackClick}
                onMinimize={handleMinimizeWorkout}
                onTogglePause={togglePauseWorkout}
                onFinishClick={handleFinishClick}
                onShowCalculator={() => setShowCalculator(true)}
                onShowHeatmap={() => setShowHeatmap(true)}
                onOpenSettings={() =>
                  router.push({ pathname: '/settings', params: { section: 'workout' } } as any)
                }
              />

              {/* Mapa muscular previsto de la sesión (paridad con frontend Workout.jsx) */}
              {showInlineHeatmap ? (
                <View
                  style={[
                    styles.inlineHeatmapCard,
                    getAppleCardSurfaceStyle(theme, 26),
                    {
                      backgroundColor:
                        theme === 'light' ? '#FFFFFF' : getThemedModalCardColor(theme),
                      borderColor: colors.tint + '36',
                    },
                  ]}
                >
                  <View style={styles.inlineHeatmapHeader}>
                    <View style={styles.inlineHeatmapTitleRow}>
                      <View
                        style={[
                          styles.inlineHeatmapIconBox,
                          { backgroundColor: colors.tint + '1F' },
                        ]}
                      >
                        <Activity size={20} color={colors.tint} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.inlineHeatmapTitle, { color: colors.text }]}>
                          Mapa muscular
                        </Text>
                        <Text
                          style={[styles.inlineHeatmapSubtitle, { color: colors.textSecondary }]}
                        >
                          Volumen previsto para esta sesión
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        try {
                          Haptics.selectionAsync();
                        } catch {}
                        setShowHeatmap(true);
                      }}
                      style={[
                        styles.expandHeatmapBtn,
                        {
                          backgroundColor: colors.tint + '14',
                          borderColor: colors.tint + '38',
                        },
                      ]}
                    >
                      <Maximize2 size={14} color={colors.tint} />
                      <Text style={[styles.expandHeatmapBtnText, { color: colors.tint }]}>
                        Ver ampliado
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View
                    style={[
                      styles.inlineHeatmapBody,
                      isWideWorkout && styles.inlineHeatmapBodyWide,
                    ]}
                  >
                    <View style={[styles.inlineHeatmapSvgWrap, isWideWorkout && { width: 220 }]}>
                      <SessionMuscleHeatmap muscleData={workoutMuscleData} compact />
                    </View>
                    <Text
                      style={[
                        styles.inlineHeatmapDesc,
                        { color: colors.textSecondary },
                        isWideWorkout && { flex: 1 },
                      ]}
                    >
                      La intensidad del color muestra qué músculos acumulan más series. Toca el mapa para alternar entre frente y espalda.
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* 2. Banner de Nota de la Sesión Previa */}
              {previousWorkoutNote && !dismissedPreviousNote ? (
                <PreviousWorkoutNoteBanner
                  previousNote={previousWorkoutNote}
                  onDismiss={() => setDismissedPreviousNote(true)}
                  onCopyNote={(text) => {
                    setNotes(prev => (prev ? `${prev}\n${text}` : text));
                    try {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    } catch {}
                  }}
                />
              ) : null}
            </>
          }
          renderItem={({ item: { group, isSuperset } }) => {
            if (isSuperset) {
              return (
                <WorkoutSupersetCard
                  group={group}
                  allExercises={activeWorkout.exercises || []}
                  hasWorkoutStarted={hasWorkoutStarted}
                  onSetSelectedExercise={(ex) => setSelectedDetailExercise(ex)}
                  onSetExerciseToReplace={(idx) => setSubstituteIndex(idx)}
                  onUpdateSet={updateActiveWorkoutSet}
                  onToggleWarmup={toggleWarmupSet}
                  onOpenRestModal={(secs) => openRestModal(secs || 90)}
                  onShowSmartCoach={(ex) => setCoachExercise(ex)}
                />
              );
            }

            const exercise = group[0];
            const actualExIndex = (activeWorkout.exercises || []).findIndex(
              (e: any) => e.id === exercise.id
            );

            return (
              <WorkoutExerciseCard
                exercise={exercise}
                actualExIndex={actualExIndex}
                hasWorkoutStarted={hasWorkoutStarted}
                onSetSelectedExercise={(ex) => setSelectedDetailExercise(ex)}
                onSetExerciseToReplace={(idx) => setSubstituteIndex(idx)}
                onShowHistory={(ex) => setHistoryExercise(ex)}
                onShowSmartCoach={(ex) => setCoachExercise(ex)}
                onUpdateSet={updateActiveWorkoutSet}
                onAddDropset={addDropset}
                onRemoveDropset={removeDropset}
                onToggleWarmup={toggleWarmupSet}
                onOpenRestModal={(secs) => openRestModal(secs || 90)}
              />
            );
          }}
          ListFooterComponent={
            <WorkoutNotes
              notes={notes}
              setNotes={setNotes}
              hasWorkoutStarted={hasWorkoutStarted}
              previousNote={previousWorkoutNote}
            />
          }
        />
      </KeyboardAvoidingView>

      {/* --- MODALES --- */}

      {/* 1. Modal Detalle y Técnica del Ejercicio */}
      <WorkoutExerciseDetailModal
        exercise={selectedDetailExercise}
        onClose={() => setSelectedDetailExercise(null)}
      />

      {/* 2. Modal Entrada de Calorías */}
      <CalorieInputModal
        visible={showCalorieModal}
        estimatedCalories={calculateCalories(timerSeconds, userProfile?.weight || 75)}
        onComplete={handleCalorieInputComplete}
        onCancel={() => {
          setShowCalorieModal(false);
          if (wasTimerRunningOnFinish) togglePauseWorkout();
        }}
      />

      {/* 3. Modal Revisión antes de Guardar */}
      <WorkoutReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onConfirm={handleReviewConfirm}
        isSaving={isSaving}
      />

      {/* 4. Modal Resumen y Celebración */}
      <WorkoutSummaryModal
        visible={showSummaryModal}
        workoutData={completedWorkoutData}
        onClose={async () => {
          setShowSummaryModal(false);
          setCompletedWorkoutData(null);
          stopWorkout();
          await fetchInitialData();
          router.replace('/(tabs)/routines');
        }}
      />


      {/* 6. Modal Calculadora de Discos */}
      <PlateCalculatorModal
        visible={showCalculator}
        onClose={() => setShowCalculator(false)}
      />

      {/* 7. Modal Historial de Ejercicio */}
      <ExerciseHistoryModal
        visible={Boolean(historyExercise)}
        exercise={historyExercise}
        onClose={() => setHistoryExercise(null)}
      />

      {/* 8. Modal Mapa Muscular */}
      <WorkoutHeatmapModal
        visible={showHeatmap}
        exercises={activeWorkout.exercises || []}
        onClose={() => setShowHeatmap(false)}
      />

      {/* 9. Modal Smart Progression Coach */}
      <SmartExerciseCoachModal
        visible={Boolean(coachExercise)}
        exercise={coachExercise}
        currentRoutineId={activeWorkout?.routine_id || activeWorkout?.routineId || activeWorkout?.id || null}
        currentRoutineName={activeWorkout?.routine_name || activeWorkout?.routineName || activeWorkout?.name || null}
        onClose={() => setCoachExercise(null)}
        onApplyStrategy={(strategy) => {
          if (coachExercise) {
            const exIndex = (activeWorkout.exercises || []).findIndex(
              (e: any) => e.id === coachExercise.id || e.name === coachExercise.name
            );
            if (exIndex !== -1 && applyCoachStrategyToExercise) {
              applyCoachStrategyToExercise(exIndex, strategy);
              if (strategy.perSetPlan && strategy.perSetPlan.length > 0) {
                const setsDesc = strategy.perSetPlan.map((s: any) => `${s.weight}kg`).join(' / ');
                showToast?.(`Estrategia aplicada: ${strategy.title} (${setsDesc})`);
              } else {
                const parts: string[] = [];
                if (strategy.suggestedSets) parts.push(`${strategy.suggestedSets} series`);
                if (strategy.suggestedWeight !== null && strategy.suggestedWeight !== undefined) {
                  const w = parseFloat(String(strategy.suggestedWeight));
                  parts.push(w > 0 ? `${w} kg (todas las series)` : 'Peso corporal');
                }
                if (strategy.suggestedReps !== null && strategy.suggestedReps !== undefined) {
                  parts.push(`${strategy.suggestedReps} reps`);
                }
                showToast?.(`Estrategia aplicada: ${parts.join(', ')}`);
              }
            }
          }
          setCoachExercise(null);
        }}
        onApplyWeight={(suggestedWeight) => {
          if (coachExercise) {
            const actualIndex = (activeWorkout.exercises || []).findIndex(
              (e: any) => e.id === coachExercise.id || e.name === coachExercise.name
            );
            if (actualIndex !== -1 && applyCoachStrategyToExercise) {
              applyCoachStrategyToExercise(actualIndex, { suggestedWeight });
              showToast?.(`Peso objetivo aplicado: ${suggestedWeight} kg`);
            } else if (actualIndex !== -1 && updateActiveWorkoutSet) {
              updateActiveWorkoutSet(actualIndex, 0, 'weight_kg', String(suggestedWeight));
            }
          }
          setCoachExercise(null);
        }}
        onNavigateAsesoria={() => {
          setCoachExercise(null);
          router.push('/asesoria' as any);
        }}
      />

      {/* 10. Modal Sustituir Ejercicio */}
      {substituteIndex !== undefined && (
        <ExerciseSearchModal
          visible={substituteIndex !== null}
          onClose={() => setSubstituteIndex(null)}
          onAddExercises={handleSubstituteSelect}
        />
      )}

      {/* Barra Flotante Expressive en Android durante el entrenamiento (solo al bajar de la cabecera) */}
      <Animated.View
        pointerEvents={showFloatingToolbar ? 'box-none' : 'none'}
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: Math.max(insets.bottom, 12) + 8,
          opacity: floatingToolbarAnim,
          transform: [
            {
              translateY: floatingToolbarAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [28, 0],
              }),
            },
          ],
        }}
      >
        <ExpressiveFloatingToolbar
          actions={[
            {
              key: 'rest',
              icon: <Timer size={20} color={colors.tint} />,
              onPress: () => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                openRestModal(90);
              },
            },
            {
              key: 'calc',
              icon: <Calculator size={20} color={colors.text} />,
              onPress: () => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                setShowCalculator(true);
              },
            },
            {
              key: 'heatmap',
              icon: <Activity size={20} color={colors.text} />,
              onPress: () => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                setShowHeatmap(true);
              },
            },
            {
              key: 'finish',
              icon: <CheckCheck size={20} color="#22c55e" />,
              tintColor: '#22c55e',
              onPress: handleFinishClick,
            },
          ]}
          fab={{
            icon: isTimerRunning ? (
              <Pause size={21} color={getContrastTextColor(colors.tint)} fill={getContrastTextColor(colors.tint)} />
            ) : (
              <Play size={21} color={getContrastTextColor(colors.tint)} fill={getContrastTextColor(colors.tint)} />
            ),
            onPress: () => {
              try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
              togglePauseWorkout();
            },
          }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 16,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  inlineHeatmapCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
    gap: 14,
    overflow: 'hidden',
  },
  inlineHeatmapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  inlineHeatmapTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  inlineHeatmapIconBox: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inlineHeatmapTitle: {
    fontSize: 15.5,
    fontWeight: '800',
  },
  inlineHeatmapSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  expandHeatmapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 0,
  },
  expandHeatmapBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inlineHeatmapBody: {
    gap: 12,
    alignItems: 'center',
  },
  inlineHeatmapBodyWide: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 16,
  },
  inlineHeatmapSvgWrap: {
    width: '100%',
    maxWidth: 230,
    alignSelf: 'center',
  },
  inlineHeatmapDesc: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
});
