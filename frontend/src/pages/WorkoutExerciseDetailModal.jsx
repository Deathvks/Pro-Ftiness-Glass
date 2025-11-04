/* frontend/src/pages/WorkoutExerciseDetailModal.jsx */
import React, { useEffect, useState } from 'react';
import { X, Dumbbell, Repeat, Clock, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlassCard from '../components/GlassCard';
import ExerciseMedia from '../components/ExerciseMedia';
import Spinner from '../components/Spinner';
import useAppStore from '../store/useAppStore';

const WorkoutExerciseDetailModal = ({ exercise, onClose }) => {
  const { t } = useTranslation(['exercise_names', 'exercise_ui', 'exercise_descriptions']);

  // Funciones del store
  const { getOrFetchAllExercises, updateActiveExerciseDetails } = useAppStore(state => ({
    getOrFetchAllExercises: state.getOrFetchAllExercises,
    updateActiveExerciseDetails: state.updateActiveExerciseDetails,
  }));

  // Estado LOCAL para los detalles
  const [localDetails, setLocalDetails] = useState(exercise.exercise_details || {});
  const [localIsLoading, setLocalIsLoading] = useState(false);

  if (!exercise) return null;

  const nameKey = exercise.name;


  // Lógica de "Autocorrección"
  useEffect(() => {
    // --- INICIO DE LA MODIFICACIÓN ---
    // La condición ahora comprueba si falta la descripción O si faltan las URLs de media.
    const missingDescription = !localDetails.description;
    const missingMedia = !localDetails.image_url && !localDetails.video_url;

    if ((missingDescription || missingMedia) && nameKey) {
    // --- FIN DE LA MODIFICACIÓN ---
      
      const fetchMissingDetails = async () => {
        setLocalIsLoading(true);
        try {
          const allExercises = await getOrFetchAllExercises();
          const fullDetails = allExercises.find(ex => ex.name === nameKey);

          if (fullDetails) {
            // Actualizamos el estado LOCAL (para re-renderizar AHORA)
            setLocalDetails(fullDetails); 
            // Actualizamos el estado GLOBAL (para la próxima vez)
            updateActiveExerciseDetails(nameKey, fullDetails);
          }
        } catch (error) {
          console.error("Error al auto-corregir detalles del ejercicio:", error);
        } finally {
          setLocalIsLoading(false);
        }
      };

      fetchMissingDetails();
    }
    // Añadimos las nuevas variables a la lista de dependencias
  }, [nameKey, localDetails, getOrFetchAllExercises, updateActiveExerciseDetails]);


  /**
   * Lógica de descripción
   * Lee del estado 'localDetails'
   */
  const getTranslatedDescription = () => {
    const descKey = localDetails.description; 
    
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

    return t('no_description_available', { ns: 'exercise_ui' });
  };

  const description = getTranslatedDescription();
  const titleKey = localDetails.name || nameKey;

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

        {/* Título: Usa la clave de traducción de localDetails si existe, si no, la del prop */}
        <h2 className="text-2xl font-bold mb-4 pr-8 break-words">
          {t(titleKey, { ns: 'exercise_names', defaultValue: titleKey })}
        </h2>

        {/* Media: Usa los detalles locales */}
        <ExerciseMedia details={localDetails} className="w-full mx-auto mb-4" />

        {/* Datos del plan (sin cambios) */}
        <div className="space-y-3 mb-6">
          <h3 className="text-lg font-semibold text-text-secondary">
            {t('today_s_plan', { ns: 'exercise_ui' })}
          </h3>
          <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-md border-glass-border">
            <Dumbbell size={20} className="text-accent" />
            <span className="font-medium">
              {t('n_sets', { count: exercise.sets, ns: 'exercise_ui' })}
            </span>
          </div>
          <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-md border-glass-border">
            <Repeat size={20} className="text-accent" />
            <span className="font-medium">
              {t('n_reps', { count: exercise.reps, ns: 'exercise_ui' })}
            </span>
          </div>
          <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-md border-glass-border">
            <Clock size={20} className="text-accent" />
            <span className="font-medium">
              {t('n_rest', { count: exercise.rest_seconds || 90, ns: 'exercise_ui' })}
            </span>
          </div>
        </div>

        {/* Descripción: Usa el estado de carga local */}
        {(localIsLoading || description) && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-text-secondary">
              <FileText size={20} className="text-accent" />
              {t('description', { ns: 'exercise_ui' })}
            </h3>

            {localIsLoading ? (
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