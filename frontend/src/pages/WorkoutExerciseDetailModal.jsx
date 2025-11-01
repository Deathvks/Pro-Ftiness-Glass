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
  // 1. Añadimos 'exercise_descriptions' (del modal de la biblioteca y de i18n.js)
  const { t } = useTranslation(['exercise_names', 'exercises', 'exercise_descriptions']);
  // --- FIN DE LA MODIFICACIÓN ---

  if (!exercise) return null;

  const details = exercise.exercise_details || {};
  const nameKey = details.name || exercise.name;

  // --- INICIO DE LA MODIFICACIÓN ---
  /**
   * 2. Modificamos tu función para usar la lógica de la biblioteca (paso 20)
   * con la CLAVE DE TRADUCCIÓN CORRECTA.
   */
  const getTranslatedDescription = () => {
    // 2a. La CLAVE de traducción es el texto en INGLÉS, que está en 'details.description'
    //    (gracias al arreglo de workoutSlice y como se ve en ExerciseDetailView.jsx)
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
    //     (Si 'descKey' es nulo, esto también lo es)
    if (descKey) {
      return descKey;
    }

    // 2e. Si no hay NADA, devolvemos 'No disponible' (como en tu versión)
    return t('Descripción no disponible', { ns: 'exercises' });
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

        {/* Título (sin cambios) */}
        <h2 className="text-2xl font-bold mb-4 pr-8">
          {t(nameKey, { ns: 'exercise_names', defaultValue: nameKey })}
        </h2>

        {/* Media (sin cambios) */}
        <ExerciseMedia details={details} className="w-full mx-auto mb-4" />

        {/* Datos del plan (sin cambios) */}
        <div className="space-y-3 mb-6">
          <h3 className="text-lg font-semibold text-text-secondary">
            {t('Plan de Hoy', { ns: 'exercises' })}
          </h3>
          <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-md border-glass-border">
            <Dumbbell size={20} className="text-accent" />
            <span className="font-medium">
              {t('{{count}} Series', { count: exercise.sets, ns: 'exercises' })}
            </span>
          </div>
          <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-md border-glass-border">
            <Repeat size={20} className="text-accent" />
            <span className="font-medium">
              {t('{{count}} Repeticiones', { count: exercise.reps, ns: 'exercises' })}
            </span>
          </div>
          <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-md border-glass-border">
            <Clock size={20} className="text-accent" />
            <span className="font-medium">
              {t('{{count}} seg. Descanso', { count: exercise.rest_seconds || 90, ns: 'exercises' })}
            </span>
          </div>
        </div>

        {/* Descripción (Usando tu lógica de renderizado del paso 21) */}
        {(isLoading || description) && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-text-secondary">
              <FileText size={20} className="text-accent" />
              {t('Descripción', { ns: 'exercises' })}
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