/* mobile/src/app/(tabs)/routines.tsx */
import React, { useState, useMemo } from 'react';
import { 
  View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, 
  Dimensions, Share as NativeShare 
} from 'react-native';
import { 
  Search, Plus, Trash2, Globe, Sparkles, Folder, Dumbbell, 
  BookCopy, Compass, Flame 
} from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { RoutinesTabs, TabKey } from '@/components/routines/RoutinesTabs';
import { FolderList } from '@/components/routines/FolderList';
import { RoutineCard } from '@/components/routines/RoutineCard';
import GlobalHeader from '@/components/GlobalHeader';
import AnimatedScreen from '@/components/AnimatedScreen';
import { GlassView } from 'expo-glass-effect';
import { GlassButton } from '@/components/ui/GlassButton';
import { PrivacyModal } from '@/components/modals/PrivacyModal';
import { RoutineShareSettingsModal } from '@/components/modals/RoutineShareSettingsModal';
import { RoutineAIGeneratorModal } from '@/components/modals/RoutineAIGeneratorModal';
import { getContrastTextColor } from '@/utils/routineHelpers';
import { useRouter } from 'expo-router';

export default function RoutinesScreen() {
  const router = useRouter();
  const theme = useAppStore(state => state.theme);
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const iconBadgeBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';

  // Zustand Store
  const routines = useAppStore(state => state.routines || []);
  const workoutLog = useAppStore(state => state.workoutLog || []);
  const completedRoutineIdsToday = useAppStore(state => state.completedRoutineIdsToday || []);
  const activeWorkout = useAppStore(state => state.activeWorkout);
  const startWorkout = useAppStore(state => state.startWorkout);
  const deleteRoutine = useAppStore(state => state.deleteRoutine);
  const deleteAllRoutines = useAppStore(state => state.deleteAllRoutines);
  const createRoutine = useAppStore(state => state.createRoutine);
  const updateRoutine = useAppStore(state => state.updateRoutine);
  const setRoutineEditorState = useAppStore(state => state.setRoutineEditorState);

  // Local State
  const [activeTab, setActiveTab] = useState<TabKey>('myRoutines');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [sharingRoutine, setSharingRoutine] = useState<any | null>(null);

  const isAnyWorkoutActive = activeWorkout !== null && activeWorkout !== undefined;

  // Mapa de última fecha de uso por rutina (idéntico al frontend)
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

  // Rutinas filtradas y ordenadas por último uso (idéntico al frontend)
  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = (routines || []).filter((r: any) => {
      if (!r) return false;
      const matchesQuery = !q ||
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
    if (activeWorkout && activeWorkout.routineId === routine.id) {
      router.push('/workout');
      return;
    }

    if (isAnyWorkoutActive && activeWorkout.routineId !== routine.id) {
      Alert.alert(
        'Entrenamiento en curso',
        'Ya tienes un entrenamiento en curso. Finalízalo o descártalo para empezar uno nuevo.'
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
            }
          }
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
        is_manual: ex.is_manual || (ex.exercise_list_id === null)
      }))
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
          const isManual = ex.is_manual || (ex.exercise_list_id === null);
          return {
            exercise_list_id: isManual ? null : (ex.exercise_list_id || ex.exercise_id || ex.id),
            name: ex.name,
            muscle_group: isManual ? ex.muscle_group : undefined,
            sets: parseInt(String(ex.sets), 10) || 3,
            reps: String(ex.reps),
            rest_seconds: parseInt(String(ex.rest_seconds), 10) || 60,
            exercise_order: index,
          };
        })
      };

      const result = await createRoutine(copy);
      if (result && !result.success) {
        Alert.alert('Error', result.message || 'No se pudo duplicar la rutina.');
      } else {
        Alert.alert('Éxito', 'Rutina duplicada correctamente.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo duplicar la rutina.');
    }
  };

  // Eliminar rutina
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
            }
          }
        }
      ]
    );
  };

  // Borrar todas las rutinas
  const handleDeleteAll = () => {
    if (routines.length === 0) return;
    Alert.alert(
      'Eliminar Todas las Rutinas',
      '¿Estás seguro? Perderás todas tus rutinas y esta acción NO se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Todas',
          style: 'destructive',
          onPress: async () => {
            if (deleteAllRoutines) {
              await deleteAllRoutines();
            }
          }
        }
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
            }
          }
        ]
      );
    } else {
      useAppStore.getState().clearRoutineEditorState();
      router.push('/routine-editor');
    }
  };

  // Compartir rutina nativo
  const handleShareRoutine = async (routine: any) => {
    try {
      const shareUrl = `https://pro-fitness-glass.zeabur.app/share/routine/${routine.id}`;
      await NativeShare.share({
        title: `Rutina: ${routine.name}`,
        message: `¡Mira mi rutina "${routine.name}" en Pro Fitness Glass!\n${shareUrl}`,
        url: shareUrl,
      });
    } catch (e) {}
  };

  // Actualizar visibilidad de rutina
  const handleUpdateVisibility = async (routineId: string | number, newVisibility: string) => {
    const target = routines.find((r: any) => r.id === routineId);
    if (!target) return;
    const exercises = target.exercises || target.RoutineExercises || [];
    await updateRoutine(routineId, {
      ...target,
      visibility: newVisibility,
      exercises: exercises.map((ex: any) => ({ ...ex }))
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

      {/* 2. BOTONES DE ACCIÓN (BORRAR TODAS, MURO, IA, CREAR RUTINA) */}
      <View style={styles.actionsRow}>
        {/* Borrar todas */}
        {routines.length > 0 && (
          <GlassButton 
            noShadow={true}
            theme={theme}
            color="rgba(239, 68, 68, 0.15)"
            onPress={handleDeleteAll}
            style={styles.trashAllBtn}
          >
            <Trash2 size={18} color="#ef4444" />
          </GlassButton>
        )}

        {/* Muro (Privacidad global) */}
        <GlassButton 
          noShadow={true}
          theme={theme}
          onPress={() => setShowPrivacyModal(true)}
          style={styles.actionPillBtn}
        >
          <View style={styles.actionPillInner}>
            <Globe size={18} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.actionPillBtnText, { color: colors.text }]}>Muro</Text>
          </View>
        </GlassButton>

        {/* IA */}
        <GlassButton 
          noShadow={true}
          theme={theme}
          color={colors.tint + '20'}
          onPress={() => setShowAIGenerator(true)}
          style={styles.actionPillBtn}
        >
          <View style={styles.actionPillInner}>
            <Sparkles size={18} color={colors.tint} style={{ marginRight: 6 }} />
            <Text style={[styles.actionPillBtnText, { color: colors.tint }]}>IA</Text>
          </View>
        </GlassButton>

        {/* Crear Rutina */}
        <GlassButton 
          noShadow={true}
          theme={theme}
          color={colors.tint}
          onPress={handleCreateRoutineClick}
          style={styles.createRoutineBtn}
        >
          <View style={styles.createRoutineInner}>
            <Plus size={18} color={getContrastTextColor(colors.tint)} style={{ marginRight: 6 }} />
            <Text style={[styles.createRoutineBtnText, { color: getContrastTextColor(colors.tint) }]} numberOfLines={1}>
              Crear Rutina
            </Text>
          </View>
        </GlassButton>
      </View>

      {/* 3. TABS PRINCIPALES (MIS RUTINAS, EXPLORAR, MANUALES, CARDIO RÁPIDO) */}
      <View style={styles.tabsRow}>
        <RoutinesTabs 
          activeTab={activeTab} 
          onChangeTab={setActiveTab} 
          onQuickCardio={() => router.push('/workout')}
        />
      </View>

      {/* 4. CONTENIDO SEGÚN LA PESTAÑA ACTIVA */}
      {activeTab === 'myRoutines' && (
        <>
          {/* Barra de búsqueda */}
          <View style={[styles.searchContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)', borderColor: colors.border }]}>
            <Search size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar rutinas..."
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          {/* Subpestañas de carpetas */}
          {routines && routines.length > 0 && (
            <View style={styles.foldersContainer}>
              <FolderList
                folders={uniqueFolders}
                selectedFolder={selectedFolder}
                onSelectFolder={setSelectedFolder}
              />
            </View>
          )}

          {/* Listado de Rutinas */}
          <View style={styles.routinesList}>
            {filteredSorted && filteredSorted.length > 0 ? (
              filteredSorted.map((routine: any) => {
                const isCompleted = completedRoutineIdsToday.includes(routine.id);
                const isActive = activeWorkout && activeWorkout.routineId === routine.id;
                const isBlocked = isAnyWorkoutActive && !isActive;
                const lastUsed = lastUsedMap.get(routine.id);

                return (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    onPressStart={() => handleStartWorkout(routine)}
                    onPressEdit={() => handleEditRoutine(routine)}
                    onPressDuplicate={() => handleDuplicateRoutine(routine)}
                    onPressDelete={() => handleDeleteRoutine(routine.id)}
                    onPressShare={() => handleShareRoutine(routine)}
                    onPressPrivacy={() => setSharingRoutine(routine)}
                    isCompletedToday={isCompleted}
                    isActive={isActive}
                    isBlockedByOtherWorkout={isBlocked}
                    lastUsedDate={lastUsed}
                  />
                );
              })
            ) : (
              /* ESTADO VACÍO */
              <View style={[styles.emptyCard, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)', borderColor: colors.border }]}>
                <View style={[styles.emptyIconBox, { backgroundColor: iconBadgeBg }]}>
                  <Folder size={32} color={colors.textSecondary} />
                </View>
                <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
                  {routines && routines.length > 0
                    ? `No hay rutinas en la carpeta "${selectedFolder === 'uncategorized' ? 'Otros' : selectedFolder}".`
                    : 'Aún no has creado ninguna rutina.'}
                </Text>
                <TouchableOpacity onPress={handleCreateRoutineClick} activeOpacity={0.8} style={{ marginTop: 12 }}>
                  <Text style={[styles.emptyActionText, { color: colors.text }]}>
                    ¡Haz clic en <Text style={{ color: colors.tint }}>"Crear Rutina"</Text> para empezar!
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </>
      )}

      {/* PESTAÑA EXPLORAR */}
      {activeTab === 'explore' && (
        <View style={[styles.tabContentCard, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)', borderColor: colors.border }]}>
          <View style={[styles.emptyIconBox, { backgroundColor: colors.tint + '15' }]}>
            <Compass size={32} color={colors.tint} />
          </View>
          <Text style={[styles.tabContentTitle, { color: colors.text }]}>Explorar Plantillas</Text>
          <Text style={[styles.tabContentDesc, { color: colors.textSecondary }]}>
            Descubre y copia rutinas de entrenamiento prediseñadas creadas por entrenadores expertos.
          </Text>
        </View>
      )}

      {/* PESTAÑA EJERCICIOS MANUALES */}
      {activeTab === 'manualExercises' && (
        <View style={[styles.tabContentCard, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)', borderColor: colors.border }]}>
          <View style={[styles.emptyIconBox, { backgroundColor: colors.tint + '15' }]}>
            <Dumbbell size={32} color={colors.tint} />
          </View>
          <Text style={[styles.tabContentTitle, { color: colors.text }]}>Ejercicios Manuales</Text>
          <Text style={[styles.tabContentDesc, { color: colors.textSecondary }]}>
            Gestiona tus ejercicios personalizados creados fuera del catálogo general de la biblioteca.
          </Text>
        </View>
      )}

      {/* MODALES */}
      <PrivacyModal 
        visible={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)} 
      />

      <RoutineShareSettingsModal
        visible={!!sharingRoutine}
        routine={sharingRoutine}
        onClose={() => setSharingRoutine(null)}
        onUpdateVisibility={handleUpdateVisibility}
      />

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

    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  headerTitleContainer: {
    marginBottom: 20,
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
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  trashAllBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPillBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
  },
  actionPillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPillBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  createRoutineBtn: {
    flex: 1,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
  },
  createRoutineInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createRoutineBtnText: {
    fontSize: 14,
    fontWeight: '900',
  },
  tabsRow: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  foldersContainer: {
    marginBottom: 20,
  },
  routinesList: {
    paddingBottom: 24,
  },
  emptyCard: {
    borderRadius: 32,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
  tabContentCard: {
    borderRadius: 32,
    borderWidth: 1,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  tabContentTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  tabContentDesc: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
