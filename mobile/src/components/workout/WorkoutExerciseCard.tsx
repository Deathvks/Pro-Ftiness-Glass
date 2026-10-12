/* mobile/src/components/workout/WorkoutExerciseCard.tsx */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  Pressable,
} from 'react-native';
import {
  History,
  Target,
  Flame,
  Repeat,
  Bell,
  Plus,
  X,
  AlertTriangle,
  CheckCircle2,
  Dumbbell,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { calculate1RM } from '@/utils/workoutHelpers';
import { WorkoutSetGrid } from './WorkoutSetGrid';
import { BACKEND_BASE_URL } from '@/services/apiClient';

interface WorkoutExerciseCardProps {
  exercise: any;
  actualExIndex: number;
  hasWorkoutStarted: boolean;
  onSetSelectedExercise?: (exercise: any) => void;
  onSetExerciseToReplace: (exIndex: number) => void;
  onShowHistory?: (exercise: any) => void;
  onShowSmartCoach?: (exercise: any) => void;
  onUpdateSet: (exIdx: number, setIdx: number, field: string, val: string) => void;
  onAddDropset: (exIdx: number, setIdx: number) => void;
  onRemoveDropset: (exIdx: number, setIdx: number) => void;
  onToggleWarmup?: (exIdx: number, setIdx: number) => void;
  onOpenRestModal: (restSeconds: number) => void;
  onAddSet: (exIdx: number) => void;
}

export const WorkoutExerciseCard: React.FC<WorkoutExerciseCardProps> = ({
  exercise,
  actualExIndex,
  hasWorkoutStarted,
  onSetSelectedExercise,
  onSetExerciseToReplace,
  onShowHistory,
  onShowSmartCoach,
  onUpdateSet,
  onAddDropset,
  onRemoveDropset,
  onToggleWarmup,
  onOpenRestModal,
  onAddSet,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const addWarmupSets = useAppStore(state => state.addWarmupSets);
  const setExerciseReminder = useAppStore(state => state.setExerciseReminder);

  const [showWarmupModal, setShowWarmupModal] = useState(false);
  const [workingWeightInput, setWorkingWeightInput] = useState('');

  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderInput, setReminderInput] = useState(exercise.reminder || '');

  // Imagen del ejercicio
  const getFullImageUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    return `${BACKEND_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const imgUrl = getFullImageUrl(
    exercise.image_url ||
    exercise.gif_url ||
    exercise.exercise_details?.image_url ||
    exercise.exercise_details?.image_url_start
  );

  // Cálculo de 1RM estimado
  const estimated1RM = useMemo(() => {
    let best = parseFloat(exercise.last_performance?.estimated_1rm || 0);
    if (!best || best === 0) {
      const sets = exercise.last_performance?.sets || [];
      sets.forEach((s: any) => {
        const w = parseFloat(s.weight_kg || s.weight || 0);
        const r = parseInt(s.reps || 0, 10);
        const rir = parseFloat(s.rir || 0) || 0;
        const cur = calculate1RM(w, r + rir);
        if (cur > best) best = cur;
      });
    }
    return best > 0 ? Math.round(best * 10) / 10 : null;
  }, [exercise]);

  // Manejador para aplicar series de calentamiento
  const handleApplyWarmup = () => {
    const w = parseFloat(workingWeightInput);
    if (!isNaN(w) && w > 0 && addWarmupSets) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
      addWarmupSets(actualExIndex, workingWeightInput);
      setShowWarmupModal(false);
      setWorkingWeightInput('');
    }
  };

  // Manejador para guardar recordatorio / meta
  const handleApplyReminder = () => {
    if (setExerciseReminder) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
      setExerciseReminder(actualExIndex, reminderInput.trim());
    }
    setShowReminderModal(false);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.8)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        },
      ]}
    >
      <GlassView
        glassEffectStyle="regular"
        colorScheme={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      {/* 1. Header con imagen o icono del ejercicio */}
      <View style={styles.headerArea}>
        {imgUrl ? (
          <TouchableOpacity
            onPress={() => onSetSelectedExercise && onSetSelectedExercise(exercise)}
            activeOpacity={0.85}
            style={styles.imageWrapper}
          >
            <Image source={{ uri: imgUrl }} style={styles.exerciseImg} resizeMode="cover" />
          </TouchableOpacity>
        ) : null}

        <View style={styles.titleArea}>
          <TouchableOpacity
            onPress={() => onSetSelectedExercise && onSetSelectedExercise(exercise)}
            activeOpacity={0.8}
          >
            <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={2}>
              {exercise.name}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.targetSetsReps, { color: colors.tint }]}>
            {exercise.sets} series × {exercise.reps} reps
            {exercise.muscle_group ? (
              <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>
                {' '}• {exercise.muscle_group}
              </Text>
            ) : null}
          </Text>

          {/* Badges: 1RM Estimado */}
          {estimated1RM ? (
            <View
              style={[
                styles.oneRmBadge,
                {
                  backgroundColor: colors.tint + '18',
                  borderColor: colors.tint + '35',
                },
              ]}
            >
              <Target size={12} color={colors.tint} style={{ marginRight: 4 }} />
              <Text style={[styles.oneRmText, { color: colors.tint }]}>
                1RM Est: {estimated1RM} kg
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* 2. Banner de Recordatorio / Meta Activa */}
      {exercise.reminder ? (
        <View
          style={[
            styles.reminderBanner,
            {
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              borderColor: 'rgba(245, 158, 11, 0.3)',
            },
          ]}
        >
          <Bell size={16} color="#f59e0b" style={{ marginRight: 8, marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.reminderTitle}>META / RECORDATORIO</Text>
            <Text style={[styles.reminderBody, { color: colors.text }]}>{exercise.reminder}</Text>
          </View>
        </View>
      ) : null}

      {/* 3. Botonera Segmentada de Acciones Liquid Glass */}
      <View
        style={[
          styles.actionPillRow,
          {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.04)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
          },
        ]}
      >
        {/* Historial */}
        <TouchableOpacity
          onPress={() => {
            try {
              Haptics.selectionAsync();
            } catch {}
            if (onShowHistory) onShowHistory(exercise);
          }}
          style={styles.actionBtn}
          activeOpacity={0.7}
        >
          <History size={16} color={colors.textSecondary} />
          <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Historial</Text>
        </TouchableOpacity>

        {/* Coach / Objetivo */}
        <TouchableOpacity
          onPress={() => {
            try {
              Haptics.selectionAsync();
            } catch {}
            if (onShowSmartCoach) onShowSmartCoach(exercise);
          }}
          style={styles.actionBtn}
          activeOpacity={0.7}
        >
          <Target size={16} color={colors.tint} />
          <Text style={[styles.actionBtnText, { color: colors.tint }]}>Objetivo</Text>
        </TouchableOpacity>

        {/* Meta */}
        <TouchableOpacity
          disabled={!hasWorkoutStarted}
          onPress={() => {
            try {
              Haptics.selectionAsync();
            } catch {}
            setShowReminderModal(true);
          }}
          style={[styles.actionBtn, !hasWorkoutStarted && { opacity: 0.4 }]}
          activeOpacity={0.7}
        >
          <Bell size={16} color={exercise.reminder ? '#f59e0b' : colors.textSecondary} />
          <Text
            style={[
              styles.actionBtnText,
              { color: exercise.reminder ? '#f59e0b' : colors.textSecondary },
            ]}
          >
            Meta
          </Text>
        </TouchableOpacity>

        {/* Calentar */}
        <TouchableOpacity
          disabled={!hasWorkoutStarted}
          onPress={() => {
            try {
              Haptics.selectionAsync();
            } catch {}
            setShowWarmupModal(true);
          }}
          style={[styles.actionBtn, !hasWorkoutStarted && { opacity: 0.4 }]}
          activeOpacity={0.7}
        >
          <Flame size={16} color="#f97316" />
          <Text style={[styles.actionBtnText, { color: '#f97316' }]}>Calentar</Text>
        </TouchableOpacity>

        {/* Sustituir */}
        <TouchableOpacity
          disabled={!hasWorkoutStarted}
          onPress={() => {
            try {
              Haptics.selectionAsync();
            } catch {}
            onSetExerciseToReplace(actualExIndex);
          }}
          style={[styles.actionBtn, !hasWorkoutStarted && { opacity: 0.4 }]}
          activeOpacity={0.7}
        >
          <Repeat size={16} color={colors.textSecondary} />
          <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Sustituir</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Tabla de Series Grid */}
      <WorkoutSetGrid
        setsDone={exercise.setsDone}
        restSeconds={exercise.rest_seconds || 90}
        actualExIndex={actualExIndex}
        hasWorkoutStarted={hasWorkoutStarted}
        onUpdateSet={onUpdateSet}
        onAddDropset={onAddDropset}
        onRemoveDropset={onRemoveDropset}
        onToggleWarmup={onToggleWarmup}
        onOpenRestModal={onOpenRestModal}
      />

      {/* 5. Botón + Añadir Serie */}
      <TouchableOpacity
        disabled={!hasWorkoutStarted}
        onPress={() => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch {}
          onAddSet(actualExIndex);
        }}
        style={[
          styles.addSetBtn,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
            opacity: hasWorkoutStarted ? 1 : 0.45,
          },
        ]}
        activeOpacity={0.75}
      >
        <Plus size={16} color={colors.tint} style={{ marginRight: 6 }} />
        <Text style={[styles.addSetText, { color: colors.tint }]}>Añadir Serie</Text>
      </TouchableOpacity>

      {/* Modal: Calentar (Warm-up Sets) */}
      <Modal visible={showWarmupModal} transparent animationType="fade">
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.4)' }]}
          onPress={() => setShowWarmupModal(false)}
        >
          <Pressable
            onPress={e => e.stopPropagation()}
            style={[
              styles.dialogCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.dialogTitle, { color: colors.text }]}>Series de Calentamiento</Text>
            <Text style={[styles.dialogDesc, { color: colors.textSecondary }]}>
              Introduce el peso de tus series efectivas para generar automáticamente 3 series de aproximación progresiva (50%, 70%, 90%).
            </Text>

            <TextInput
              keyboardType="decimal-pad"
              placeholder="Ej: 80 (kg)"
              placeholderTextColor={colors.textSecondary}
              value={workingWeightInput}
              onChangeText={setWorkingWeightInput}
              autoFocus
              style={[
                styles.dialogInput,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                  borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)',
                  color: colors.text,
                },
              ]}
            />

            <View style={styles.dialogActions}>
              <TouchableOpacity
                onPress={() => setShowWarmupModal(false)}
                style={[styles.dialogBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
              >
                <Text style={{ color: colors.text, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleApplyWarmup}
                style={[styles.dialogBtn, { backgroundColor: colors.tint }]}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>Generar Series</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal: Meta / Recordatorio */}
      <Modal visible={showReminderModal} transparent animationType="fade">
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.4)' }]}
          onPress={() => setShowReminderModal(false)}
        >
          <Pressable
            onPress={e => e.stopPropagation()}
            style={[
              styles.dialogCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.dialogTitle, { color: colors.text }]}>Meta / Recordatorio</Text>
            <Text style={[styles.dialogDesc, { color: colors.textSecondary }]}>
              Añade una anotación clave para este ejercicio (ej: "Subir a 24kg en la 3ª serie" o "Foco en técnica lenta").
            </Text>

            <TextInput
              placeholder="Escribe tu meta aquí..."
              placeholderTextColor={colors.textSecondary}
              value={reminderInput}
              onChangeText={setReminderInput}
              multiline
              autoFocus
              style={[
                styles.dialogInputMultiline,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                  borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)',
                  color: colors.text,
                },
              ]}
            />

            <View style={styles.dialogActions}>
              <TouchableOpacity
                onPress={() => setShowReminderModal(false)}
                style={[styles.dialogBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
              >
                <Text style={{ color: colors.text, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleApplyReminder}
                style={[styles.dialogBtn, { backgroundColor: colors.tint }]}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  headerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  imageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  exerciseImg: {
    width: '100%',
    height: '100%',
  },
  titleArea: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  targetSetsReps: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  oneRmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  oneRmText: {
    fontSize: 11,
    fontWeight: '800',
  },
  reminderBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  reminderTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#d97706',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  reminderBody: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 4,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
    borderRadius: 14,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
  },
  addSetText: {
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  dialogInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 18,
  },
  dialogInputMultiline: {
    height: 80,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    fontWeight: '500',
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 10,
  },
  dialogBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
