/* mobile/src/app/workout.tsx */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { calculateCalories, groupWorkoutExercises } from '@/utils/workoutHelpers';

// Subcomponentes modularizados con paridad 1:1 frente al Frontend
import { WorkoutHeader } from '@/components/workout/WorkoutHeader';
import { WorkoutExerciseCard } from '@/components/workout/WorkoutExerciseCard';
import { WorkoutSupersetCard } from '@/components/workout/WorkoutSupersetCard';
import { WorkoutNotes } from '@/components/workout/WorkoutNotes';
import { PreviousWorkoutNoteBanner } from '@/components/workout/PreviousWorkoutNoteBanner';
import { NoActiveWorkout } from '@/components/workout/NoActiveWorkout';
import { RestTimerModal } from '@/components/workout/RestTimerModal';
import { CalorieInputModal } from '@/components/workout/CalorieInputModal';
import { WorkoutReviewModal } from '@/components/workout/WorkoutReviewModal';
import { WorkoutSummaryModal } from '@/components/workout/WorkoutSummaryModal';
import { PlateCalculatorModal } from '@/components/workout/PlateCalculatorModal';
import { ExerciseHistoryModal } from '@/components/workout/ExerciseHistoryModal';
import { WorkoutHeatmapModal } from '@/components/workout/WorkoutHeatmapModal';
import { SmartExerciseCoachModal } from '@/components/workout/SmartExerciseCoachModal';
import { WorkoutExerciseDetailModal } from '@/components/workout/WorkoutExerciseDetailModal';
import { ExerciseSearchModal } from '@/components/modals/ExerciseSearchModal';

export default function WorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';

  // Zustand Store State
  const activeWorkout = useAppStore(state => state.activeWorkout);
  const workoutStartTime = useAppStore(state => state.workoutStartTime);
  const isWorkoutPaused = useAppStore(state => state.isWorkoutPaused);
  const workoutAccumulatedTime = useAppStore(state => state.workoutAccumulatedTime) || 0;
  const userProfile = useAppStore(state => state.userProfile || (state as any).user);
  const workoutLog = useAppStore(state => state.workoutLog) || [];

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

  // Cronómetro local sincronizado en tiempo real
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    const computeElapsed = () => {
      const state = useAppStore.getState();
      const { workoutStartTime: sTime, isWorkoutPaused: isPaused, workoutAccumulatedTime: accTime } = state;

      if (!sTime) {
        return Math.floor((accTime || 0) / 1000);
      }
      if (isPaused) {
        return Math.floor((accTime || 0) / 1000);
      }
      const runningMs = Date.now() - sTime;
      return Math.floor(((accTime || 0) + runningMs) / 1000);
    };

    setTimerSeconds(computeElapsed());

    const interval = setInterval(() => {
      setTimerSeconds(computeElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [workoutStartTime, isWorkoutPaused, workoutAccumulatedTime]);

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

  const [restModalConfig, setRestModalConfig] = useState<{ visible: boolean; restSeconds: number }>({
    visible: false,
    restSeconds: 90,
  });

  const [showCalculator, setShowCalculator] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [historyExercise, setHistoryExercise] = useState<any>(null);
  const [coachExercise, setCoachExercise] = useState<any>(null);
  const [selectedDetailExercise, setSelectedDetailExercise] = useState<any>(null);
  const [substituteIndex, setSubstituteIndex] = useState<number | null>(null);

  const hasWorkoutStarted = workoutStartTime !== null;

  // Recordatorio inteligente de la sesión previa
  const previousWorkoutNote = useMemo(() => {
    if (!activeWorkout || !Array.isArray(workoutLog) || workoutLog.length === 0) return null;

    const sorted = [...workoutLog].sort(
      (a: any, b: any) => new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime()
    );

    const match = sorted.find((log: any) => {
      const matchesRoutine =
        (activeWorkout.routineId &&
          (log.routine_id === activeWorkout.routineId || log.routineId === activeWorkout.routineId)) ||
        (activeWorkout.routineName &&
          log.routine_name &&
          log.routine_name.toLowerCase().trim() === activeWorkout.routineName.toLowerCase().trim());
      if (!matchesRoutine) return false;

      const cleanNote = log.notes ? log.notes.split('GPS_DATA::')[0].trim() : '';
      return cleanNote.length > 0;
    });

    if (!match) return null;

    return {
      note: match.notes.split('GPS_DATA::')[0].trim(),
      date: match.workout_date,
      routineName: match.routine_name || activeWorkout.routineName,
    };
  }, [activeWorkout, workoutLog]);

  // Agrupación por superseries
  const exerciseGroups = useMemo(() => {
    return groupWorkoutExercises(activeWorkout?.exercises || []);
  }, [activeWorkout?.exercises]);

  // Si no hay entrenamiento activo (Pantalla exacta del frontend)
  if (!activeWorkout) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <NoActiveWorkout
          onGoToRoutines={() => router.replace('/(tabs)/routines')}
          onStartQuickCardio={() => {
            Alert.alert('Cardio Rápido', 'Próximamente disponible en la app.');
          }}
        />
      </View>
    );
  }

  // Manejador del botón Atrás
  const handleBackClick = () => {
    if (hasWorkoutStarted) {
      Alert.alert(
        '¿Descartar entrenamiento?',
        'Si sales ahora se cancelará la sesión y perderás los datos registrados de hoy.',
        [
          { text: 'Continuar Entrenando', style: 'cancel' },
          {
            text: 'Descartar y Salir',
            style: 'destructive',
            onPress: () => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              } catch {}
              stopWorkout();
              router.back();
            },
          },
        ]
      );
    } else {
      stopWorkout();
      router.back();
    }
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
    if (substituteIndex !== null && exercisesToAdd.length > 0 && replaceExercise) {
      const chosen = exercisesToAdd[0];
      replaceExercise(substituteIndex, chosen);
    }
    setSubstituteIndex(null);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. Header Hero con Cronómetro y Dynamic Island */}
          <WorkoutHeader
            routineName={activeWorkout.routineName}
            routineImage={activeWorkout.imageUrl || activeWorkout.image_url}
            timer={timerSeconds}
            isWorkoutPaused={isWorkoutPaused}
            hasWorkoutStarted={hasWorkoutStarted}
            onBackClick={handleBackClick}
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

          {/* 3. Lista de Ejercicios y Superseries con estructura idéntica al Frontend */}
          {exerciseGroups.map((groupObj, gIdx) => {
            const { group, isSuperset } = groupObj;

            if (isSuperset) {
              const groupKey = group.map((e: any) => e.id).join('-');

              return (
                <WorkoutSupersetCard
                  key={groupKey}
                  group={group}
                  allExercises={activeWorkout.exercises || []}
                  hasWorkoutStarted={hasWorkoutStarted}
                  onSetSelectedExercise={(ex) => setSelectedDetailExercise(ex)}
                  onSetExerciseToReplace={(idx) => setSubstituteIndex(idx)}
                  onUpdateSet={updateActiveWorkoutSet}
                  onToggleWarmup={toggleWarmupSet}
                  onOpenRestModal={(secs) =>
                    setRestModalConfig({ visible: true, restSeconds: secs || 90 })
                  }
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
                key={exercise.id}
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
                onOpenRestModal={(secs) =>
                  setRestModalConfig({ visible: true, restSeconds: secs || 90 })
                }
              />
            );
          })}

          {/* 4. Notas de la Sesión */}
          <WorkoutNotes
            notes={notes}
            setNotes={setNotes}
            hasWorkoutStarted={hasWorkoutStarted}
            previousNote={previousWorkoutNote}
          />
        </ScrollView>
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

      {/* 5. Modal Temporizador de Descanso */}
      <RestTimerModal
        visible={restModalConfig.visible}
        initialSeconds={restModalConfig.restSeconds}
        onClose={() => setRestModalConfig(prev => ({ ...prev, visible: false }))}
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
      <ExerciseSearchModal
        visible={substituteIndex !== null}
        onClose={() => setSubstituteIndex(null)}
        onAddExercises={handleSubstituteSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
});
