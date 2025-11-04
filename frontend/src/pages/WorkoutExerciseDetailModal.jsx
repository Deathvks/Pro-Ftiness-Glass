/* frontend/src/pages/WorkoutExerciseDetailModal.jsx */
import React, { useEffect, useState } from 'react';
import { X, Dumbbell, Repeat, Clock, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlassCard from '../components/GlassCard';
import ExerciseMedia from '../components/ExerciseMedia';
import Spinner from '../components/Spinner';
import useAppStore from '../store/useAppStore';

// Eliminamos el 'isLoading' de los props, el modal gestiona su propia carga.
const WorkoutExerciseDetailModal = ({ exercise, onClose }) => {
  const { t } = useTranslation(['exercise_names', 'exercise_ui', 'exercise_descriptions']);

  // --- INICIO DE LA MODIFICACIÓN ---
  // Funciones del store
  const { getOrFetchAllExercises, updateActiveExerciseDetails } = useAppStore(state => ({
    getOrFetchAllExercises: state.getOrFetchAllExercises,
    updateActiveExerciseDetails: state.updateActiveExerciseDetails,
  }));

  // 1. Estado de carga LOCAL. Se activa SOLO si tenemos que buscar datos.
  const [isLoading, setIsLoading] = useState(false);

  // 2. Leemos los detalles DIRECTAMENTE del prop. NO MÁS ESTADO LOCAL 'localDetails'.
  const details = exercise.exercise_details || {};
  const nameKey = exercise.name; // La clave del ejercicio
  // --- FIN DE LA MODIFICACIÓN ---


  // 3. Lógica de "Autocorrección" (simplificada)
  useEffect(() => {
    // Comprobamos los 'details' que vienen del prop
    const missingDescription = !details.description;
    const missingMedia = !details.image_url && !details.video_url;

    // Si faltan datos Y tenemos una clave para buscar
    if ((missingDescription || missingMedia) && nameKey) {
      
      const fetchMissingDetails = async () => {
        setIsLoading(true); // Mostrar spinner
        try {
          const allExercises = await getOrFetchAllExercises();
          const fullDetails = allExercises.find(ex => ex.name === nameKey);

          if (fullDetails) {
            // 4. SOLO actualizamos el estado GLOBAL.
            // Esto forzará un re-renderizado con el 'exercise' prop actualizado.
            updateActiveExerciseDetails(nameKey, fullDetails);
          }
        } catch (error) {
          console.error("Error al auto-corregir detalles:", error);
        } finally {
          // 5. Ocultamos el spinner en el 'finally' para que se
          // muestren los datos que acabamos de cargar.
          setIsLoading(false);
        }
      };

      fetchMissingDetails();
    }
  // 6. El efecto depende de 'details' (del prop) y 'nameKey'.
  }, [details, nameKey, getOrFetchAllExercises, updateActiveExerciseDetails]); 


  /**
   * 7. Lógica de descripción
   * Ahora lee de 'details' (del prop)
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
    return t('no_description_available', { ns: 'exercise_ui' });
  };

  const description = getTranslatedDescription();
  const titleKey = details.name || nameKey;

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

        <h2 className="text-2xl font-bold mb-4 pr-8 break-words">
          {t(titleKey, { ns: 'exercise_names', defaultValue: titleKey })}
        </h2>

        {/* 8. Media: Usa los 'details' del prop */}
        <ExerciseMedia details={details} className="w-full mx-auto mb-4" />

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

        {/* 9. Descripción: Usa el estado de carga local */}
        {(isLoading || description) && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-text-secondary">
              <FileText size={20} className="text-accent" />
              {t('description', { ns: 'exercise_ui' })}
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