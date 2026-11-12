/* mobile/src/app/workout.tsx */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { usePreventRemove, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import useAppStore from '@/store/useAppStore';
import { calculateCalories, groupWorkoutExercises } from '@/utils/workoutHelpers';

// Subcomponentes modularizados con paridad 1:1 frente al Frontend
import { WorkoutHeader } from '@/components/workout/WorkoutHeader';
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

  const disableExitPrevention = usePreventRemove(Platform.OS !== 'web' && Boolean(activeWorkout) && timerSeconds === 0, ({ repeat }) => {
    if (getWorkoutElapsedSeconds() === 0) stopWorkout();
    repeat();
  });

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
      stopWorkout();
      disableExitPrevention();
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
    <View style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <FlatList
          data={exerciseGroups}
          keyExtractor={({ group }, index) => group.map(exercise => exercise.id).filter(id => id != null).join(':') || String(index)}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
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
              />

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
      {showHeatmap && (
        <WorkoutHeatmapModal
          visible
          exercises={activeWorkout.exercises || []}
          onClose={() => setShowHeatmap(false)}
        />
      )}

      {/* 9. Modal Smart Progression Coach */}
      <SmartExerciseCoachModal
        visible={Boolean(coachExercise)}
        exercise={coachExercise}
        onClose={() => setCoachExercise(null)}
        onApplyWeight={(suggestedWeight) => {
          if (coachExercise) {
            const actualIndex = (activeWorkout.exercises || []).findIndex(
              (e: any) => e.id === coachExercise.id
            );
            if (actualIndex !== -1 && updateActiveWorkoutSet) {
              updateActiveWorkoutSet(actualIndex, 0, 'weight_kg', String(suggestedWeight));
            }
          }
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
});
