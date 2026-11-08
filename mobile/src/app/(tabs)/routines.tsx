/* mobile/src/app/(tabs)/routines.tsx */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Search,
  Plus,
  Trash2,
  Globe,
  Sparkles,
  Folder,
  FileSpreadsheet,
  TrendingUp,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import GlobalHeader from '@/components/GlobalHeader';
import AnimatedScreen from '@/components/AnimatedScreen';
import { GlassButton } from '@/components/ui/GlassButton';
import { RoutinesTabs, TabKey } from '@/components/routines/RoutinesTabs';
import { FolderList } from '@/components/routines/FolderList';
import { RoutineCard } from '@/components/routines/RoutineCard';
import { PromoBanner } from '@/components/nutrition/PromoBanner';
import {
  WeeklyMuscleVolumeCard,
  RoutineVolumeFilterModal,
  useWeeklyVolumeExclusions,
  getRoutineInclusionStats,
} from '@/components/routines/WeeklyMuscleVolumeCard';
import { TemplateRoutinesView } from '@/components/routines/TemplateRoutinesView';
import { ManualExercisesView } from '@/components/routines/ManualExercisesView';
import { WorkoutDataTransferModal } from '@/components/modals/WorkoutDataTransferModal';
import { PrivacyModal } from '@/components/modals/PrivacyModal';
import { RoutineShareSettingsModal } from '@/components/modals/RoutineShareSettingsModal';
import { RoutineAIGeneratorModal } from '@/components/modals/RoutineAIGeneratorModal';
import { WorkoutSummaryModal } from '@/components/workout/WorkoutSummaryModal';
import { getContrastTextColor } from '@/utils/routineHelpers';

export default function RoutinesScreen() {
  const router = useRouter();
  const theme = useAppStore((state) => state.theme);
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const iconBadgeBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';

  // Zustand Store
  const routines = useAppStore((state) => state.routines || []);
  const workoutLog = useAppStore((state) => state.workoutLog || []);
  const completedRoutineIdsToday = useAppStore((state) => state.completedRoutineIdsToday || []);
  const activeWorkout = useAppStore((state) => state.activeWorkout);
  const startWorkout = useAppStore((state) => state.startWorkout);
  const stopWorkout = useAppStore((state) => state.stopWorkout);
  const deleteRoutine = useAppStore((state) => state.deleteRoutine);
  const deleteAllRoutines = useAppStore((state) => state.deleteAllRoutines);
  const createRoutine = useAppStore((state) => state.createRoutine);
  const updateRoutine = useAppStore((state) => state.updateRoutine);
  const setRoutineEditorState = useAppStore((state) => state.setRoutineEditorState);
  const userProfile = useAppStore((state) => state.userProfile);

  // Volume Exclusions Hook
  const { exclusions } = useWeeklyVolumeExclusions();

  // Local State
  const [activeTab, setActiveTab] = useState<TabKey>('myRoutines');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [query, setQuery] = useState('');

  // Modals state
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showDataTransferModal, setShowDataTransferModal] = useState(false);
  const [sharingRoutine, setSharingRoutine] = useState<any | null>(null);
  const [volumeFilterRoutine, setVolumeFilterRoutine] = useState<any | null>(null);
  const [shareData, setShareData] = useState<any | null>(null);

  const isAnyWorkoutActive = activeWorkout !== null && activeWorkout !== undefined;

  // Mapa de última fecha de uso por rutina
  const lastUsedMap = useMemo(() => {
    const map = new Map<string | number, Date>();
    (workoutLog || []).forEach((log: any) => {
      if (log && log.routine_id) {
        const d = new Date(log.workout_date);
        const prev = map.get(log.routine_id);
        if (!prev || d > prev) map.set(log.routine_id, d);
      }
    });
    return map;
  }, [workoutLog]);

  // Carpetas únicas existentes
  const uniqueFolders = useMemo(() => {
    if (!routines) return [];
    const folders = (routines as any[])
      .map((r: any) => r.folder)
      .filter((f: any) => f && f.trim() !== '');
    return Array.from(new Set(folders)).sort();
  }, [routines]);

  // Rutinas filtradas y ordenadas por último uso
  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = (routines || []).filter((r: any) => {
      if (!r) return false;
      const matchesQuery =
        !q ||
        r.name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q);

      let matchesFolder = true;
      if (selectedFolder === 'uncategorized') {
        matchesFolder = !r.folder || r.folder.trim() === '';
      } else if (selectedFolder !== 'all') {
        matchesFolder = r.folder === selectedFolder;
      }

      return matchesQuery && matchesFolder;
    });

    list.sort((a: any, b: any) => {
      const da = a ? lastUsedMap.get(a.id)?.getTime() || 0 : 0;
      const db = b ? lastUsedMap.get(b.id)?.getTime() || 0 : 0;
      return db - da;
    });

    return list;
  }, [routines, query, lastUsedMap, selectedFolder]);

  // Iniciar entrenamiento
  const handleStartWorkout = async (routine: any) => {
    if (activeWorkout && String(activeWorkout.routineId) === String(routine.id)) {
      router.push('/workout');
      return;
    }

    if (isAnyWorkoutActive && String(activeWorkout.routineId) !== String(routine.id)) {
      Alert.alert(
        'Entrenamiento en curso',
        `Ya tienes una sesión activa (${activeWorkout.routineName || 'Entrenamiento'}). ¿Deseas volver a ella o descartarla para iniciar "${routine.name}"?`,
        [
          {
            text: 'Volver a la sesión',
            onPress: () => router.push('/workout'),
          },
          {
            text: 'Descartar e iniciar nueva',
            style: 'destructive',
            onPress: async () => {
              if (stopWorkout) stopWorkout();
              if (startWorkout) await startWorkout(routine);
              router.push('/workout');
            },
          },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
      return;
    }

    const isCompleted = completedRoutineIdsToday.includes(routine.id);
    if (isCompleted) {
      Alert.alert(
        'Rutina ya completada',
        'Ya has completado esta rutina hoy. ¿Deseas iniciarla de nuevo?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Iniciar',
            onPress: async () => {
              if (startWorkout) await startWorkout(routine);
              router.push('/workout');
            },
          },
        ]
      );
    } else {
      if (startWorkout) await startWorkout(routine);
      router.push('/workout');
    }
  };

  // Editar rutina
  const handleEditRoutine = (routine: any) => {
    if (isAnyWorkoutActive && activeWorkout.routineId === routine.id) {
      Alert.alert(
        'Rutina en curso',
        'No puedes editar la rutina que está en curso. Finaliza o descarta el entrenamiento primero.'
      );
      return;
    }

    const exercises = routine.exercises || routine.RoutineExercises || [];
    const normalizedRoutine = {
      routineId: routine.id,
      routineName: routine.name,
      description: routine.description || '',
      folder: routine.folder || '',
      imageUrl: routine.image_url || routine.imageUrl || null,
      exercises: exercises.map((ex: any) => ({
        ...ex,
        exercise_id: ex.exercise_list_id || ex.exercise_id || ex.id || null,
        is_manual: ex.is_manual || ex.exercise_list_id === null,
      })),
    };

    setRoutineEditorState(normalizedRoutine);
    router.push('/routine-editor');
  };

  // Duplicar rutina
  const handleDuplicateRoutine = async (routine: any) => {
    try {
      const exercises = routine.exercises || routine.RoutineExercises || [];
      const copy = {
        name: `${routine.name} (Copia)`,
        description: routine.description || '',
        folder: routine.folder || null,
        image_url: routine.image_url || routine.imageUrl || null,
        is_trainer_template: false,
        exercises: exercises.map((ex: any, index: number) => {
          const isManual = ex.is_manual || ex.exercise_list_id === null;
          return {
            exercise_list_id: isManual ? null : ex.exercise_list_id || ex.exercise_id || ex.id,
            name: ex.name,
            muscle_group: isManual ? ex.muscle_group : undefined,
            sets: parseInt(String(ex.sets), 10) || 3,
            reps: String(ex.reps),
            rest_seconds: parseInt(String(ex.rest_seconds), 10) || 60,
            exercise_order: index,
          };
        }),
      };

      const result = await createRoutine(copy);
      if (result && !result.success) {
        Alert.alert('Error', result.message || 'No se pudo duplicar la rutina.');
      } else {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        Alert.alert('Éxito', 'Rutina duplicada correctamente.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo duplicar la rutina.');
    }
  };

  // Eliminar rutina individual
  const handleDeleteRoutine = (routineId: string | number) => {
    Alert.alert(
      'Eliminar Rutina',
      '¿Estás seguro de que deseas eliminar esta rutina? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteRoutine(routineId);
            if (res && !res.success) {
              Alert.alert('Error', res.message || 'No se pudo eliminar la rutina.');
            } else {
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch {}
            }
          },
        },
      ]
    );
  };

  // Borrar todas las rutinas
  const handleDeleteAll = () => {
    if (routines.length === 0) return;
    Alert.alert(
      'Eliminar Todas las Rutinas',
      '¿Estás completamente seguro? Perderás todas tus rutinas y esta acción NO se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Todas',
          style: 'destructive',
          onPress: async () => {
            if (deleteAllRoutines) {
              await deleteAllRoutines();
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch {}
            }
          },
        },
      ]
    );
  };

  // Crear rutina nueva
  const handleCreateRoutineClick = () => {
    const editorState = useAppStore.getState().routineEditorState;
    if ((editorState.exercises && editorState.exercises.length > 0) || editorState.routineName) {
      Alert.alert(
        'Borrador encontrado',
        'Tienes una rutina en proceso. ¿Deseas continuarla o empezar de cero?',
        [
          { text: 'Continuar', onPress: () => router.push('/routine-editor') },
          {
            text: 'Empezar de cero',
            style: 'destructive',
            onPress: () => {
              useAppStore.getState().clearRoutineEditorState();
              router.push('/routine-editor');
            },
          },
        ]
      );
    } else {
      useAppStore.getState().clearRoutineEditorState();
      router.push('/routine-editor');
    }
  };

  // Compartir en Stories (Instagram Story summary)
  const handleStoriesShare = (routine: any) => {
    if (!workoutLog) return;
    const now = Date.now();

    const routineLogs = (workoutLog || [])
      .filter((log: any) => String(log?.routine_id) === String(routine.id))
      .sort((a: any, b: any) => new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime());

    let selectedLog = routineLogs.find((log: any) => {
      if (!log?.workout_date) return false;
      const start = new Date(log.workout_date).getTime();
      const end = start + (log.duration_seconds || 0) * 1000;
      return now - end < 24 * 60 * 60 * 1000 && now >= start;
    });

    if (!selectedLog && routineLogs.length > 0) {
      selectedLog = routineLogs[0];
    }

    if (selectedLog) {
      const rawDetails = selectedLog.details || selectedLog.WorkoutLogDetails || [];
      const normalizedDetails = rawDetails.map((ex: any) => {
        let rawSets = ex.setsDone || ex.sets_done || ex.sets || ex.Sets || ex.WorkoutLogSets || [];
        if (typeof rawSets === 'string') {
          try {
            rawSets = JSON.parse(rawSets);
          } catch {
            rawSets = [];
          }
        }
        if (!Array.isArray(rawSets)) rawSets = [];

        const normalizedSets = rawSets.map((s: any) => ({
          weight_kg: parseFloat(s.weight_kg || s.weight || 0),
          reps: parseFloat(s.reps || 0),
          is_dropset: !!(s.is_dropset || s.isDropset),
          is_warmup: !!(s.is_warmup || s.isWarmup),
          set_number: parseInt(s.set_number || s.setNumber || 0, 10),
        }));

        const exName = ex.exercise_name || ex.exerciseName || ex.name || 'Ejercicio';
        return { exerciseName: exName, setsDone: normalizedSets };
      });

      setShareData({
        routineName: routine.name || selectedLog.routine_name || 'Mi Rutina',
        duration_seconds: selectedLog.duration_seconds || 0,
        calories_burned: selectedLog.calories_burned || 0,
        details: normalizedDetails,
        notes: selectedLog.notes,
        workout_date: selectedLog.workout_date,
        newPRs: selectedLog.newPRs || selectedLog.PersonalRecords || [],
      });
    } else {
      Alert.alert(
        'Sin entrenamientos',
        'Esta rutina aún no tiene entrenamientos registrados para compartir en Stories.'
      );
    }
  };

  // Actualizar visibilidad de rutina
  const handleUpdateVisibility = async (routineId: string | number, newVisibility: string) => {
    const target = routines.find((r: any) => r.id === routineId);
    if (!target) return;
    const exercises = target.exercises || target.RoutineExercises || [];
    await updateRoutine(routineId, {
      ...target,
      visibility: newVisibility,
      exercises: exercises.map((ex: any) => ({ ...ex })),
    });
  };

  return (
    <AnimatedScreen header={<GlobalHeader />}>
      {/* 1. TÍTULO Y SUBTÍTULO */}
      <View style={styles.headerTitleContainer}>
        <Text style={[styles.mainTitle, { color: colors.text }]}>Rutinas</Text>
        <Text style={[styles.mainSubtitle, { color: colors.textSecondary }]}>
          Crea, edita y gestiona tus rutinas de entrenamiento.
        </Text>
      </View>

      {/* 2. PROMO BANNER */}
      <PromoBanner type="routines" onPress={() => router.push('/chat' as any)} />

      {/* 3. BOTONES DE ACCIÓN (2 FILAS - IDÉNTICO AL FRONTEND) */}
      <View style={styles.actionButtonsContainer}>
        {/* Fila 1: Crear Rutina (destacado) + IA */}
        <View style={styles.actionRow1}>
          <GlassButton
            noShadow={true}
            theme={theme}
            color={colors.tint}
            onPress={handleCreateRoutineClick}
            style={styles.createRoutineBtn}
          >
            <View style={styles.createRoutineInner}>
              <Plus size={18} color={getContrastTextColor(colors.tint)} style={{ marginRight: 6 }} strokeWidth={2.5} />
              <Text
                style={[styles.createRoutineBtnText, { color: getContrastTextColor(colors.tint) }]}
                numberOfLines={1}
              >
                Crear Rutina
              </Text>
            </View>
          </GlassButton>

          <GlassButton
            noShadow={true}
            theme={theme}
            color={colors.tint + '20'}
            onPress={() => setShowAIGenerator(true)}
            style={styles.aiBtn}
          >
            <View style={styles.aiBtnInner}>
              <Sparkles size={16} color={colors.tint} style={{ marginRight: 6 }} />
              <Text style={[styles.aiBtnText, { color: colors.tint }]}>IA</Text>
            </View>
          </GlassButton>
        </View>

        {/* Fila 2: Importar CSV + Muro + Papelera */}
        <View style={styles.actionRow2}>
          <GlassButton
            noShadow={true}
            theme={theme}
            onPress={() => setShowDataTransferModal(true)}
            style={styles.toolBtn}
          >
            <View style={styles.toolBtnInner}>
              <FileSpreadsheet size={15} color={colors.tint} style={{ marginRight: 6 }} />
              <Text style={[styles.toolBtnText, { color: colors.text }]}>Importar CSV</Text>
            </View>
          </GlassButton>

          <GlassButton
            noShadow={true}
            theme={theme}
            onPress={() => setShowPrivacyModal(true)}
            style={styles.toolBtn}
          >
            <View style={styles.toolBtnInner}>
              <Globe size={15} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.toolBtnText, { color: colors.text }]}>Muro</Text>
            </View>
          </GlassButton>

          {routines.length > 0 && (
            <GlassButton
              noShadow={true}
              theme={theme}
              color="rgba(239, 68, 68, 0.12)"
              onPress={handleDeleteAll}
              style={styles.trashBtn}
            >
              <Trash2 size={16} color="#ef4444" />
            </GlassButton>
          )}
        </View>
      </View>

      {/* 4. TABS PRINCIPALES (MIS RUTINAS, EXPLORAR, MANUALES, CARDIO RÁPIDO) */}
      <View style={styles.tabsRow}>
        <RoutinesTabs
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onQuickCardio={() => router.push('/workout')}
        />
      </View>

      {/* 5. CONTENIDO DE PESTAÑA: MIS RUTINAS */}
      {activeTab === 'myRoutines' && (
        <>
          {/* BANNER "VER TU PROGRESO" */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push('/progress' as any)}
            style={[styles.progressBanner, { borderColor: colors.tint + '35' }]}
          >
            <GlassView
              style={StyleSheet.absoluteFill}
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
            />
            <View
              style={[
                styles.progressGlow,
                { backgroundColor: colors.tint + (isDark ? '15' : '08') },
              ]}
              pointerEvents="none"
            />
            <View style={styles.progressInner}>
              <View style={[styles.progressIconBox, { backgroundColor: colors.tint }]}>
                <TrendingUp size={20} color="#000" strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.progressTitleRow}>
                  <Text style={[styles.progressTitle, { color: colors.text }]}>
                    Ver Tu Progreso
                  </Text>
                  <View style={[styles.progressBadge, { backgroundColor: colors.tint + '20' }]}>
                    <Text style={[styles.progressBadgeText, { color: colors.tint }]}>
                      Gráficas & Récords
                    </Text>
                  </View>
                </View>
                <Text
                  style={[styles.progressDesc, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  Evolución de cargas, Récords Personales (PR), peso corporal y analítica
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          {/* VOLUMEN SEMANAL POR GRUPO MUSCULAR */}
          <WeeklyMuscleVolumeCard
            routines={routines}
            goal={userProfile?.goal || 'gain'}
            onOpenSettings={() => {
              if (routines.length > 0) {
                setVolumeFilterRoutine(routines[0]);
              }
            }}
          />

          {/* BARRA DE BÚSQUEDA */}
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <Search size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar rutinas..."
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* SELECTOR DE CARPETAS */}
          {routines && routines.length > 0 && (
            <View style={styles.foldersContainer}>
              <FolderList
                folders={uniqueFolders}
                selectedFolder={selectedFolder}
                onSelectFolder={setSelectedFolder}
              />
            </View>
          )}

          {/* LISTADO DE RUTINAS */}
          <View style={styles.routinesList}>
            {filteredSorted && filteredSorted.length > 0 ? (
              filteredSorted.map((routine: any) => {
                const isCompleted = completedRoutineIdsToday.includes(routine.id);
                const isActive = activeWorkout && activeWorkout.routineId === routine.id;
                const isBlocked = isAnyWorkoutActive && !isActive;
                const lastUsed = lastUsedMap.get(routine.id);
                const inclusionStats = getRoutineInclusionStats(exclusions, routine);

                return (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    onPressStart={() => handleStartWorkout(routine)}
                    onPressEdit={() => handleEditRoutine(routine)}
                    onPressDuplicate={() => handleDuplicateRoutine(routine)}
                    onPressDelete={() => handleDeleteRoutine(routine.id)}
                    onPressShare={() => handleStoriesShare(routine)}
                    onPressPrivacy={() => setSharingRoutine(routine)}
                    onPressVolumeFilter={() => setVolumeFilterRoutine(routine)}
                    volumeInclusionStats={inclusionStats}
                    isCompletedToday={isCompleted}
                    isActive={isActive}
                    isBlockedByOtherWorkout={isBlocked}
                    lastUsedDate={lastUsed}
                  />
                );
              })
            ) : (
              /* ESTADO VACÍO */
              <GlassView
                style={[
                  styles.emptyCard,
                  {
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
                glassEffectStyle="regular"
                tintColor={isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'}
              >
                <View style={[styles.emptyIconBox, { backgroundColor: iconBadgeBg }]}>
                  <Folder size={32} color={colors.textSecondary} />
                </View>
                <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
                  {routines && routines.length > 0
                    ? `No hay rutinas en la carpeta "${
                        selectedFolder === 'uncategorized' ? 'Otros' : selectedFolder
                      }".`
                    : 'Aún no has creado ninguna rutina.'}
                </Text>
                <TouchableOpacity
                  onPress={handleCreateRoutineClick}
                  activeOpacity={0.8}
                  style={{ marginTop: 14 }}
                >
                  <Text style={[styles.emptyActionText, { color: colors.text }]}>
                    ¡Haz clic en <Text style={{ color: colors.tint }}>"Crear Rutina"</Text> para empezar!
                  </Text>
                </TouchableOpacity>
              </GlassView>
            )}
          </View>
        </>
      )}

      {/* 6. CONTENIDO DE PESTAÑA: EXPLORAR */}
      {activeTab === 'explore' && <TemplateRoutinesView />}

      {/* 7. CONTENIDO DE PESTAÑA: EJERCICIOS MANUALES */}
      {activeTab === 'manualExercises' && <ManualExercisesView />}

      {/* ==========================================
          MODALES
         ========================================== */}
      {/* Modal de Importar/Exportar CSV (Hevy, Strong, PFG) */}
      <WorkoutDataTransferModal
        visible={showDataTransferModal}
        onClose={() => setShowDataTransferModal(false)}
      />

      {/* Modal de Exclusión/Inclusión de Volumen Semanal */}
      <RoutineVolumeFilterModal
        visible={!!volumeFilterRoutine}
        routine={volumeFilterRoutine}
        onClose={() => setVolumeFilterRoutine(null)}
      />

      {/* Modal de Privacidad Global del Muro */}
      <PrivacyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />

      {/* Modal de Privacidad y Enlace de Rutina Individual */}
      <RoutineShareSettingsModal
        visible={!!sharingRoutine}
        routine={sharingRoutine}
        onClose={() => setSharingRoutine(null)}
        onUpdateVisibility={handleUpdateVisibility}
      />

      {/* Modal Generador de Rutinas con IA */}
      <RoutineAIGeneratorModal
        visible={showAIGenerator}
        onClose={() => setShowAIGenerator(false)}
        onGenerate={(generatedRoutine) => {
          setRoutineEditorState({
            routineId: null,
            routineName: generatedRoutine.name,
            description: generatedRoutine.description,
            imageUrl: null,
            folder: generatedRoutine.folder || 'IA',
            exercises: generatedRoutine.exercises,
          });
          router.push('/routine-editor');
        }}
      />

      {/* Modal Resumen para Compartir en Stories */}
      <WorkoutSummaryModal
        visible={!!shareData}
        workoutData={shareData}
        onClose={() => setShareData(null)}
      />
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  headerTitleContainer: {
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  actionButtonsContainer: {
    marginBottom: 16,
    gap: 8,
  },
  actionRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createRoutineBtn: {
    flex: 1,
    height: 46,
    borderRadius: 20,
  },
  createRoutineInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createRoutineBtnText: {
    fontSize: 15,
    fontWeight: '900',
  },
  aiBtn: {
    paddingHorizontal: 18,
    height: 46,
    borderRadius: 20,
  },
  aiBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolBtn: {
    flex: 1,
    height: 40,
    borderRadius: 16,
  },
  toolBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  trashBtn: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    marginBottom: 16,
  },
  progressBanner: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  progressInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  progressIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  progressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  progressBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  progressDesc: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  foldersContainer: {
    marginBottom: 16,
  },
  routinesList: {
    paddingBottom: 24,
  },
  emptyCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyMessage: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
});
