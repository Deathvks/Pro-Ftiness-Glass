/* mobile/src/app/workout.tsx */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dumbbell, ArrowLeft } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { calculateCalories, groupWorkoutExercises } from '@/utils/workoutHelpers';

// Subcomponentes del entrenamiento
import { WorkoutHeader } from '@/components/workout/WorkoutHeader';
import { WorkoutExerciseCard } from '@/components/workout/WorkoutExerciseCard';
import { WorkoutSupersetCard } from '@/components/workout/WorkoutSupersetCard';
import { WorkoutNotes } from '@/components/workout/WorkoutNotes';
import { PreviousWorkoutNoteBanner } from '@/components/workout/PreviousWorkoutNoteBanner';
import { RestTimerModal } from '@/components/workout/RestTimerModal';
import { CalorieInputModal } from '@/components/workout/CalorieInputModal';
import { WorkoutReviewModal } from '@/components/workout/WorkoutReviewModal';
import { WorkoutSummaryModal } from '@/components/workout/WorkoutSummaryModal';
import { PlateCalculatorModal } from '@/components/workout/PlateCalculatorModal';
import { ExerciseHistoryModal } from '@/components/workout/ExerciseHistoryModal';
import { WorkoutHeatmapModal } from '@/components/workout/WorkoutHeatmapModal';
import { SmartExerciseCoachModal } from '@/components/workout/SmartExerciseCoachModal';
import { ExerciseSearchModal } from '@/components/modals/ExerciseSearchModal';
import { FoodDetailModal } from '@/components/nutrition/FoodDetailModal';

export default function WorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

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
  const addSetToExercise = useAppStore(state => state.addSetToExercise);
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
  const [substituteIndex, setSubstituteIndex] = useState<number | null>(null);

  const hasWorkoutStarted = workoutStartTime !== null;

  // Recordatorio inteligente de la sesión anterior
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

  // Si no hay entrenamiento activo
  if (!activeWorkout) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.85)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <Dumbbell size={48} color={colors.tint} style={{ marginBottom: 14 }} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No hay entrenamiento activo</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            Selecciona una rutina para empezar a registrar tus series y descansos.
          </Text>

          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.emptyBackBtn, { backgroundColor: colors.tint }]}
            activeOpacity={0.8}
          >
            <ArrowLeft size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.emptyBackBtnText}>Volver a Rutinas</Text>
          </TouchableOpacity>
        </View>
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
    // Comprobar si hay al menos una serie con datos
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

  // Manejador al sustituir ejercicio seleccionado
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
          {/* 1. Header con Cronómetro y Portada */}
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

          {/* 2. Banner de Nota de Sesión Anterior */}
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

          {/* 3. Lista de Ejercicios y Superseries */}
          {exerciseGroups.map((groupObj, gIdx) => {
            const { group, isSuperset } = groupObj;

            const cards = group.map((exercise) => {
              const actualExIndex = (activeWorkout.exercises || []).findIndex(
                (e: any) => e.id === exercise.id
              );

              return (
                <WorkoutExerciseCard
                  key={exercise.id || actualExIndex}
                  exercise={exercise}
                  actualExIndex={actualExIndex}
                  hasWorkoutStarted={hasWorkoutStarted}
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
                  onAddSet={(idx) => {
                    if (addSetToExercise) addSetToExercise(idx);
                  }}
                />
              );
            });

            if (isSuperset) {
              return <WorkoutSupersetCard key={gIdx}>{cards}</WorkoutSupersetCard>;
            }

            return <View key={gIdx}>{cards}</View>;
          })}

          {/* 4. Notas del Entrenamiento */}
          <WorkoutNotes
            notes={notes}
            setNotes={setNotes}
            hasWorkoutStarted={hasWorkoutStarted}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- MODALES --- */}

      {/* 1. Modal de entrada de calorías */}
      <CalorieInputModal
        visible={showCalorieModal}
        estimatedCalories={calculateCalories(timerSeconds, userProfile?.weight || 75)}
        onComplete={handleCalorieInputComplete}
        onCancel={() => {
          setShowCalorieModal(false);
          if (wasTimerRunningOnFinish) togglePauseWorkout();
        }}
      />

      {/* 2. Modal de revisión de datos antes de guardar */}
      <WorkoutReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onConfirm={handleReviewConfirm}
        isSaving={isSaving}
      />

      {/* 3. Modal de Resumen y Celebración Post-Entrenamiento */}
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

      {/* 4. Modal Temporizador de Descanso */}
      <RestTimerModal
        visible={restModalConfig.visible}
        initialSeconds={restModalConfig.restSeconds}
        onClose={() => setRestModalConfig(prev => ({ ...prev, visible: false }))}
      />

      {/* 5. Modal Calculadora de Discos */}
      <PlateCalculatorModal
        visible={showCalculator}
        onClose={() => setShowCalculator(false)}
      />

      {/* 6. Modal Historial de Ejercicio */}
      <ExerciseHistoryModal
        visible={Boolean(historyExercise)}
        exercise={historyExercise}
        onClose={() => setHistoryExercise(null)}
      />

      {/* 7. Modal Mapa de Volumen Muscular */}
      <WorkoutHeatmapModal
        visible={showHeatmap}
        exercises={activeWorkout.exercises || []}
        onClose={() => setShowHeatmap(false)}
      />

      {/* 8. Modal Entrenador Inteligente (Smart Progression Coach) */}
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
              // Aplica a la primera serie vacía o primera serie
              updateActiveWorkoutSet(actualIndex, 0, 'weight_kg', String(suggestedWeight));
            }
          }
        }}
      />

      {/* 9. Modal de Búsqueda para Sustituir Ejercicio */}
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
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 32,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    height: 48,
    borderRadius: 20,
  },
  emptyBackBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
});
