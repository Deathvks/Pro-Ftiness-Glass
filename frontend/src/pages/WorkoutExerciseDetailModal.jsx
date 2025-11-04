/* frontend/src/pages/WorkoutExerciseDetailModal.jsx */
import React, { useEffect, useState } from 'react'; // <-- INICIO DE LA MODIFICACIÓN
import { X, Dumbbell, Repeat, Clock, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlassCard from '../components/GlassCard';
import ExerciseMedia from '../components/ExerciseMedia';
import Spinner from '../components/Spinner';
import useAppStore from '../store/useAppStore'; // <-- INICIO DE LA MODIFICACIÓN

// 'isLoading' prop (cargando todo el entreno) ya no se usa aquí.
const WorkoutExerciseDetailModal = ({ exercise, onClose }) => {
  // 1. Cargamos los namespaces correctos
  const { t } = useTranslation(['exercise_names', 'exercise_ui', 'exercise_descriptions']);

  // --- INICIO DE LA MODIFICACIÓN ---
  // 2. Traemos las funciones de "autocorrección" del store
  const { getOrFetchAllExercises, updateActiveExerciseDetails } = useAppStore(state => ({
    getOrFetchAllExercises: state.getOrFetchAllExercises,
    updateActiveExerciseDetails: state.updateActiveExerciseDetails,
  }));

  // 3. Creamos un estado de carga LOCAL para este modal
  const [localIsLoading, setLocalIsLoading] = useState(false);
  // --- FIN DE LA MODIFICACIÓN ---

  if (!exercise) return null;

  const details = exercise.exercise_details || {};
  const nameKey = details.name || exercise.name;


  // --- INICIO DE LA MODIFICACIÓN ---
  // 4. Lógica de "Autocorrección" (copiada de la Biblioteca)
  useEffect(() => {
    // Comprobamos si nos faltan los detalles clave (la descripción)
    if (!details.description && nameKey) {
      
      const fetchMissingDetails = async () => {
        setLocalIsLoading(true); // Mostrar spinner
        try {
          // 1. Obtenemos la lista maestra (de forma segura)
          const allExercises = await getOrFetchAllExercises();
          
          // 2. Buscamos los detalles completos por el 'name' (que es la clave)
          const fullDetails = allExercises.find(ex => ex.name === nameKey);

          if (fullDetails) {
            // 3. ACTUALIZAMOS el estado global del 'activeWorkout'
            // Esto re-renderizará el modal con los datos nuevos.
            updateActiveExerciseDetails(nameKey, fullDetails);
          }
        } catch (error) {
          console.error("Error al auto-corregir detalles del ejercicio:", error);
        } finally {
          setLocalIsLoading(false); // Ocultar spinner
        }
      };

      fetchMissingDetails();
    }
  }, [nameKey, details.description, getOrFetchAllExercises, updateActiveExerciseDetails]);
  // --- FIN DE LA MODIFICACIÓN ---


  /**
   * 5. Lógica de descripción (sin cambios, ahora funcionará)
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

    // 2e. Corregido: Usamos la clave 'no_description_available' del JSON
    return t('no_description_available', { ns: 'exercise_ui' });
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

        {/* Datos del plan (sin cambios, ya estaban correctos) */}
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

        {/* Descripción (CORREGIDA) */}
        {/* --- INICIO DE LA MODIFICACIÓN --- */}
        {/* 6. Usamos el estado de carga LOCAL */}
        {(localIsLoading || description) && (
        // --- FIN DE LA MODIFICACIÓN ---
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-text-secondary">
              <FileText size={20} className="text-accent" />
              {t('description', { ns: 'exercise_ui' })}
            </h3>

        {/* --- INICIO DE LA MODIFICACIÓN --- */}
        {/* 7. Usamos el estado de carga LOCAL */}
            {localIsLoading ? (
        // --- FIN DE LA MODIFICACIÓN ---
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