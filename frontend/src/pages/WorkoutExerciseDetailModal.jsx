/* frontend/src/pages/WorkoutExerciseDetailModal.jsx */
// 1. Volvemos a importar useState, useEffect y Spinner
import React, { useEffect, useState } from 'react';
import { X, Dumbbell, Repeat, Clock, FileText, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlassCard from '../components/GlassCard';
import ExerciseMedia from '../components/ExerciseMedia';
import Spinner from '../components/Spinner'; // Importado de nuevo
import useAppStore from '../store/useAppStore'; // Importado de nuevo

const WorkoutExerciseDetailModal = ({ exercise, onClose }) => {
  const { t } = useTranslation(['exercise_names', 'exercise_ui', 'exercise_descriptions']);

  // 2. Volvemos a usar el store, SÓLO para buscar datos
  const { getOrFetchAllExercises } = useAppStore(state => ({
    getOrFetchAllExercises: state.getOrFetchAllExercises,
    // YA NO usamos 'updateActiveExerciseDetails' para evitar bucles
  }));

  // --- INICIO DE LA MODIFICACIÓN ---

  // 3. ESTADO LOCAL: Mantenemos un estado local para los detalles.
  // Se inicializa UNA VEZ con los props (posiblemente incompletos).
  const [localDetails, setLocalDetails] = useState(exercise.exercise_details || {});
  
  // 4. ESTADO DE CARGA: Derivado de los 'localDetails'.
  const nameKey = exercise.name;
  const isDataMissing = (details) => {
    const missingDescription = !details.description && !details.description_es;
    const missingMedia = !details.image_url && !details.video_url;
    return (missingDescription || missingMedia) && nameKey;
  };
  
  // Se inicializa con el estado actual de los 'localDetails'
  const [localIsLoading, setLocalIsLoading] = useState(isDataMissing(localDetails));

  // 5. HOOK AUTOCORRECTOR: Se ejecuta si 'localIsLoading' es true.
  useEffect(() => {
    // Si no falta nada, no hagas nada.
    if (!localIsLoading) return;

    const fetchMissingDetails = async () => {
      try {
        const allExercises = await getOrFetchAllExercises();
        const fullDetails = allExercises.find(ex => ex.name === nameKey);

        if (fullDetails) {
          // 6. FUSIONAMOS: Mantenemos la media de la rutina (ej. 'ex.image_url_start')
          //    y la rellenamos con los datos de la DB (ej. 'fullDetails.description_es')
          const mergedDetails = {
            ...fullDetails, // Base (descripción, etc.)
            ...localDetails, // Sobrescribe con datos de la rutina (media)
            name: nameKey,
            // Aseguramos la descripción usando el campo de la DB
            description: fullDetails.description_es || fullDetails.description || localDetails.description,
          };
          
          // 7. ACTUALIZAMOS EL ESTADO LOCAL.
          // Esto dispara UN solo re-renderizado con los datos completos.
          setLocalDetails(mergedDetails);
        }
      } catch (error) {
        console.error("Error al auto-corregir detalles:", error);
      } finally {
        // 8. Pase lo que pase, dejamos de cargar.
        setLocalIsLoading(false);
      }
    };

    fetchMissingDetails();
  
  // 9. Depende de 'localIsLoading' y 'nameKey'.
  }, [localIsLoading, nameKey, getOrFetchAllExercises]); 

  // --- FIN DE LA MODIFICACIÓN ---


  /**
   * Lógica de descripción
   * Lee del estado 'localDetails'
   */
  const getTranslatedDescription = () => {
    // 10. Leemos del estado local, que ya está fusionado y normalizado
    const descKey = localDetails.description || localDetails.description_es; 
    if (!descKey) return null;
    
    // Intenta traducir (si 'descKey' es una clave)
    const translated = t(descKey, { 
      ns: 'exercise_descriptions', 
      defaultValue: null 
    });

    // Devuelve la traducción, o el 'descKey' (que es el texto completo)
    return translated || descKey;
  };

  const description = getTranslatedDescription();
  // El título SÍ puede venir de 'exercise' (prop) porque 'name' siempre está
  const titleKey = localDetails.name || exercise.name;

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

        {/* --- Renderizado condicional (Media) --- */}
        {/* Lee de 'localDetails', pero comprueba 'localIsLoading' */}
        { (localDetails.image_url || localDetails.video_url) ? (
          <ExerciseMedia details={localDetails} className="w-full mx-auto mb-4" />
        ) : localIsLoading ? (
          <div className="aspect-video bg-bg-secondary border border-glass-border rounded-lg flex items-center justify-center text-text-muted w-full mx-auto mb-4">
            <Spinner />
          </div>
        ) : (
          <div className="aspect-video bg-bg-secondary border border-glass-border rounded-lg flex items-center justify-center text-text-muted w-full mx-auto mb-4">
            <ImageIcon size={48} />
          </div>
        )}


        {/* Datos del plan (sin cambios, lee de 'exercise' (prop)) */}
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

        {/* --- Renderizado condicional (Descripción) --- */}
        {/* Lee de 'description', pero comprueba 'localIsLoading' */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-text-secondary">
            <FileText size={20} className="text-accent" />
            {t('description', { ns: 'exercise_ui' })}
          </h3>

          { description ? (
            <div
              className="prose prose-sm prose-invert max-w-none text-text-primary leading-relaxed"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          ) : localIsLoading ? (
            <div className="flex justify-center items-center h-24">
              <Spinner />
            </div>
          ) : (
            <p className="text-text-muted">
              {t('no_description_available', { ns: 'exercise_ui' })}
            </p>
          )}
        </div>

      </GlassCard>
    </div>
  );
};

export default WorkoutExerciseDetailModal;