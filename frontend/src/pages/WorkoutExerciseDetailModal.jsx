/* frontend/src/pages/WorkoutExerciseDetailModal.jsx */
import React from 'react';
import { X, Dumbbell, Repeat, Clock, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlassCard from '../components/GlassCard';
import ExerciseMedia from '../components/ExerciseMedia';
import Spinner from '../components/Spinner';

// Mantenemos 'isLoading' como en tu versión base
const WorkoutExerciseDetailModal = ({ exercise, onClose, isLoading = false }) => {
  // 1. Cargamos los namespaces correctos (sin cambios)
  const { t } = useTranslation(['exercise_names', 'exercise_ui', 'exercise_descriptions']);

  if (!exercise) return null;

  const details = exercise.exercise_details || {};
  const nameKey = details.name || exercise.name;

  /**
   * 2. Lógica de descripción (sin cambios)
   */
  const getTranslatedDescription = () => {
    const descKey = details.description; 
    
    const translated = t(descKey, { 
      ns: 'exercise_descriptions', 
      defaultValue: null 
    });

    if (translated && translated !== descKey) {
      return translated;
    }

    if (descKey) {
      return descKey;
    }

    // --- INICIO DE LA MODIFICACIÓN ---
    // 2e. Corregido: Usamos la clave 'no_description_available' del JSON
    return t('no_description_available', { ns: 'exercise_ui' });
    // --- FIN DE LA MODIFICACIÓN ---
  };

  const description = getTranslatedDescription();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
      onClick={onClose}
    >
      <GlassCard
        className="relative w-full max-w-lg max-h-[90vh] m-4 p-6 overflow-y-auto animate-[fade-in-up_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/10 transition"
        >
          <X size={24} />
        </button>

        {/* Título (sin cambios) */}
        <h2 className="text-2xl font-bold mb-4 pr-8 break-words">
          {t(nameKey, { ns: 'exercise_names', defaultValue: nameKey })}
        </h2>

        {/* Media (sin cambios) */}
        <ExerciseMedia details={details} className="w-full mx-auto mb-4" />

        {/* --- INICIO DE LA MODIFICACIÓN --- */}
        {/* Datos del plan (CORREGIDOS con las nuevas claves) */}
        <div className="space-y-3 mb-6">
          <h3 className="text-lg font-semibold text-text-secondary">
            {/* Corregido: Usamos la clave 'today_s_plan' */}
            {t('today_s_plan', { ns: 'exercise_ui' })}
          </h3>
          <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-md border-glass-border">
            <Dumbbell size={20} className="text-accent" />
            <span className="font-medium">
              {/* Corregido: Usamos la clave 'n_sets' */}
              {t('n_sets', { count: exercise.sets, ns: 'exercise_ui' })}
            </span>
          </div>
          <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-md border-glass-border">
            <Repeat size={20} className="text-accent" />
            <span className="font-medium">
              {/* Corregido: Usamos la clave 'n_reps' */}
              {t('n_reps', { count: exercise.reps, ns: 'exercise_ui' })}
            </span>
          </div>
          <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-md border-glass-border">
            <Clock size={20} className="text-accent" />
            <span className="font-medium">
              {/* Corregido: Usamos la clave 'n_rest' */}
              {t('n_rest', { count: exercise.rest_seconds || 90, ns: 'exercise_ui' })}
            </span>
          </div>
        </div>

        {/* Descripción (CORREGIDA) */}
        {(isLoading || description) && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-text-secondary">
              <FileText size={20} className="text-accent" />
              {/* Corregido: Usamos la clave 'description' */}
              {t('description', { ns: 'exercise_ui' })}
            </h3>
        {/* --- FIN DE LA MODIFICACIÓN --- */}

            {isLoading ? (
              <div className="flex justify-center items-center h-24">
                <Spinner />
              </div>
            ) : (
              description && (
                <div
                  className="prose prose-sm prose-invert max-w-none text-text-primary leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              )
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default WorkoutExerciseDetailModal;