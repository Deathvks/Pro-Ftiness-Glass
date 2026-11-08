import ModalPortal from '../ModalPortal';
/* frontend/src/components/Workout/WorkoutHeatmapModal.jsx */
import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import MuscleHeatmap from '../MuscleHeatmap/MuscleHeatmap';
import { useAppTheme } from '../../hooks/useAppTheme'; // Importamos el hook de tema

// Importamos la utilidad centralizada para evitar duplicidad de código
import { guessMuscleFromText } from '../../utils/muscleUtils';
import useModalLock from '../../hooks/useModalLock';

// Leyenda de intensidad (Visual)
const INTENSITY_LEVELS = [
{ label: 'Bajo', color: '#00f2ff' },
{ label: 'Medio', color: '#00ff88' },
{ label: 'Alto', color: '#ffea00' },
{ label: 'Máximo', color: '#ff0055' }];

export const getWorkoutMuscleData = (exercises = []) => {
  const scores = {};
  if (!Array.isArray(exercises) || exercises.length === 0) return scores;

  exercises.forEach(exercise => {
    const rawMuscle = exercise.muscle_group || exercise.exercise_details?.muscle_group;
    let keysToCount = [];

    if (Array.isArray(rawMuscle)) {
      keysToCount = rawMuscle.map(group => String(group).trim().toLowerCase()).filter(Boolean);
    } else if (typeof rawMuscle === 'string' && rawMuscle.trim()) {
      keysToCount = rawMuscle.split(',').map(group => group.trim().toLowerCase()).filter(Boolean);
    }

    if (keysToCount.length === 0) keysToCount = guessMuscleFromText(exercise.name);
    const sets = Array.isArray(exercise.sets) ? exercise.sets.length : parseInt(exercise.sets, 10) || 3;
    keysToCount.forEach((key, index) => {
      if (key) {
        const weight = index === 0 ? 1 : 0.4;
        scores[key] = (scores[key] || 0) + sets * weight;
      }
    });
  });

  const maxValue = Math.max(...Object.values(scores), 1);
  const referenceMax = Math.max(maxValue, 6);
  return Object.fromEntries(Object.entries(scores).map(([muscle, sets]) => [
    muscle,
    Math.max(2, Math.round((sets / referenceMax) * 10))
  ]));
};

const WorkoutHeatmapModal = ({ exercises = [], onClose }) => {
  // 1. Obtenemos el tema actual

  // --- Bloquear scroll del fondo y swipe entre páginas ---
  useModalLock();

  const { theme } = useAppTheme();
  const isDark = theme !== 'light';

  // Calcular la intensidad por músculo basada en el número de series
  const muscleData = useMemo(() => getWorkoutMuscleData(exercises), [exercises]);

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 !pt-[calc(1rem+var(--safe-top,env(safe-area-inset-top,0px)))] sm:p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]"
        onClick={onClose}
      >
        <div
          className="relative mt-auto mb-0 sm:my-0 w-[90%] sm:w-full max-w-md max-h-[calc(92dvh_-_var(--safe-top,_env(safe-area-inset-top,_0px)))] sm:max-h-[80vh] animate-[slide-up_0.3s_ease-out] sm:animate-[scale-in_0.3s_ease-out] bg-bg-primary rounded-t-[32px] rounded-b-none sm:rounded-[32px] border border-glass-border shadow-2xl overflow-hidden flex flex-col"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="shrink-0 bg-bg-secondary pt-3 sm:hidden">
            <div
              className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-black/15 dark:bg-white/20"
              aria-hidden="true"
            />
          </div>

        {/* Cabecera */}
        <div className="p-4 border-b border-glass-border flex justify-between items-center bg-bg-secondary shrink-0">
          <h2 className="text-xl font-bold text-text-primary">Músculos Trabajados</h2>
          <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-bg-primary text-text-secondary hover:text-text-primary transition border border-transparent hover:border-glass-border">
              
            <X size={20} />
          </button>
        </div>

        {/* Contenido (Heatmap) */}
        <div className="flex-1 min-h-0 p-6 flex flex-col justify-center items-center bg-bg-primary overflow-y-auto overscroll-contain">
          {Object.keys(muscleData).length > 0 ?
            <>
              {/* Pasamos la variable isDark correctamente */}
              <MuscleHeatmap muscleData={muscleData} darkMode={isDark} />

              {/* Leyenda de Colores */}
              <div className="flex flex-wrap justify-center gap-4 mt-6 mb-2">
                {INTENSITY_LEVELS.map((level) =>
                <div key={level.label} className="flex items-center gap-2">
                    <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: level.color,
                      boxShadow: `0 0 8px ${level.color}`
                    }} />
                  
                    <span className="text-xs text-text-secondary font-medium">{level.label}</span>
                  </div>
                )}
              </div>
            </> :

            <div className="text-center py-10 px-4">
              <p className="text-text-primary font-medium mb-2">No se han detectado grupos musculares.</p>
              <p className="text-text-secondary text-sm">
                Asegúrate de que tus ejercicios tengan asignado un grupo muscular específico.
              </p>
            </div>
            }
        </div>

        <div className="px-4 pt-4 pb-[calc(1rem+var(--safe-bottom,env(safe-area-inset-bottom,0px)))] sm:pb-4 border-t border-glass-border text-center text-xs text-text-secondary bg-bg-secondary shrink-0">
          La intensidad del color indica el volumen de series en esta sesión.
        </div>
      </div>
      </div>
    </ModalPortal>
  );

};

export default WorkoutHeatmapModal;
