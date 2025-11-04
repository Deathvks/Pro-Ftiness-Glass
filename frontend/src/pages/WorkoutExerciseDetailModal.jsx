/* frontend/src/pages/WorkoutExerciseDetailModal.jsx */
import React from 'react';
import { X, Dumbbell, Repeat, Clock, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlassCard from '../components/GlassCard';
import ExerciseMedia from '../components/ExerciseMedia';
import Spinner from '../components/Spinner';

// Mantenemos 'isLoading' como en tu versión base
const WorkoutExerciseDetailModal = ({ exercise, onClose, isLoading = false }) => {
  // --- INICIO DE LA MODIFICACIÓN ---
  // 1. Corregido: Cargamos 'exercise_ui' (para UI) en lugar de 'exercises' (solo descripciones)
  const { t } = useTranslation(['exercise_names', 'exercise_ui', 'exercise_descriptions']);
  // --- FIN DE LA MODIFICACIÓN ---

  if (!exercise) return null;

  const details = exercise.exercise_details || {};
  const nameKey = details.name || exercise.name;

  // --- INICIO DE LA MODIFICACIÓN ---
  /**
   * 2. Lógica de descripción sin cambios (ya era correcta al usar 'exercise_descriptions')
   */
  const getTranslatedDescription = () => {
    // 2a. La CLAVE de traducción es el texto en INGLÉS
    const descKey = details.description; 
    
    // 2b. Intentamos traducir usando la CLAVE y el NS correcto
    const translated = t(descKey, { 
      ns: 'exercise_descriptions', 
      defaultValue: null // Devolvemos null si no la encuentra
    });

    // 2c. Si la traducción existe y es diferente a la clave, la usamos (¡ESPAÑOL!)
    if (translated && translated !== descKey) {
      return translated;
    }

    // 2d. Si no hay traducción, usamos la CLAVE (¡INGLÉS!)
    if (descKey) {
      return descKey;
    }

    // 2e. Corregido: Si no hay NADA, usamos la clave de 'exercise_ui'
    return t('No description available.', { ns: 'exercise_ui', defaultValue: 'No hay descripción disponible.' });
  };
  // --- FIN DE LA MODIFICACIÓN ---

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

        {/* Título (sin cambios, ya usaba 'exercise_names') */}
        <h2 className="text-2xl font-bold mb-4 pr-8 break-words">
          {t(nameKey, { ns: 'exercise_names', defaultValue: nameKey })}
        </h2>

        {/* Media (sin cambios) */}
        <ExerciseMedia details={details} className="w-full mx-auto mb-4" />

        {/* Datos del plan (CORREGIDOS) */}
        <div className="space-y-3 mb-6">
          <h3 className="text-lg font-semibold text-text-secondary">
            {/* Corregido: Usamos la clave en inglés y el ns 'exercise_ui' */}
            {t("Today's Plan", { ns: 'exercise_ui', defaultValue: 'Plan de Hoy' })}
          </h3>
          <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-md border-glass-border">
            <Dumbbell size={20} className="text-accent" />
            <span className="font-medium">
              {/* Corregido: Usamos la clave en inglés y el ns 'exercise_ui' */}
              {t('{{count}} Sets', { count: exercise.sets, ns: 'exercise_ui' })}
            </span>
          </div>
          <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-md border-glass-border">
            <Repeat size={20} className="text-accent" />
            <span className="font-medium">
              {/* Corregido: Usamos la clave en inglés y el ns 'exercise_ui' */}
              {t('{{count}} Reps', { count: exercise.reps, ns: 'exercise_ui' })}
            </span>
          </div>
          <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-md border-glass-border">
            <Clock size={20} className="text-accent" />
            <span className="font-medium">
              {/* Corregido: Usamos la clave en inglés y el ns 'exercise_ui' */}
              {t('{{count}}s Rest', { count: exercise.rest_seconds || 90, ns: 'exercise_ui' })}
            </span>
          </div>
        </div>

        {/* Descripción (CORREGIDA) */}
        {(isLoading || description) && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-text-secondary">
              <FileText size={20} className="text-accent" />
              {/* Corregido: Usamos la clave en inglés y el ns 'exercise_ui' */}
              {t('Description', { ns: 'exercise_ui' })}
            </h3>

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