/* frontend/src/pages/WorkoutExerciseDetailModal.jsx */
import React, { useEffect, useState } from 'react';
import { X, Dumbbell, Repeat, Clock, FileText, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlassCard from '../components/GlassCard';
import ExerciseMedia from '../components/ExerciseMedia';
import Spinner from '../components/Spinner';
import useAppStore from '../store/useAppStore';

const WorkoutExerciseDetailModal = ({ exercise, onClose }) => {
  const { t } = useTranslation(['exercise_names', 'exercise_ui', 'exercise_descriptions']);

  const { getOrFetchAllExercises, updateActiveExerciseDetails } = useAppStore(state => ({
    getOrFetchAllExercises: state.getOrFetchAllExercises,
    updateActiveExerciseDetails: state.updateActiveExerciseDetails,
  }));

  // --- INICIO DE LA MODIFICACIÓN ---

  // 1. Ya NO usamos un estado local 'localDetails'. Leemos las props directamente.
  const details = exercise.exercise_details || {};
  const nameKey = exercise.name;

  // 2. Determinamos el estado de carga INICIAL, ANTES del primer renderizado.
  const isDataMissing = () => {
    const missingDescription = !details.description;
    const missingMedia = !details.image_url && !details.video_url;
    return (missingDescription || missingMedia) && nameKey;
  };

  // 3. Inicializamos 'localIsLoading' basándonos en si faltan datos AHORA MISMO.
  const [localIsLoading, setLocalIsLoading] = useState(isDataMissing());

  // 4. Este 'useEffect' ahora es el "Autocorrector"
  useEffect(() => {
    // Si 'localIsLoading' es 'false' (porque los datos estaban completos
    // desde el inicio), no hacemos nada.
    if (!localIsLoading) return;

    // Si 'localIsLoading' es 'true', lanzamos el fetch.
    const fetchMissingDetails = async () => {
      try {
        const allExercises = await getOrFetchAllExercises();
        const fullDetails = allExercises.find(ex => ex.name === nameKey);

        if (fullDetails) {
          // 5. YA NO actualizamos un estado local.
          // Solo actualizamos el store GLOBAL.
          updateActiveExerciseDetails(nameKey, fullDetails);
          // El 'prop' 'exercise' se actualizará desde Zustand,
          // y este componente se re-renderizará con los nuevos datos.
        }
      } catch (error) {
        console.error("Error al auto-corregir detalles:", error);
      } finally {
        // 6. Cuando el fetch termina (con o sin éxito),
        // dejamos de cargar.
        setLocalIsLoading(false);
      }
    };

    fetchMissingDetails();

  // 7. El 'useEffect' se ejecuta si 'localIsLoading' es true, o si cambia el ejercicio.
  }, [localIsLoading, nameKey, getOrFetchAllExercises, updateActiveExerciseDetails]);

  // --- FIN DE LA MODIFICACIÓN ---


  /**
   * Lógica de descripción
   * Lee de 'details' (la prop)
   */
  const getTranslatedDescription = () => {
    // Usamos 'details' (props) en lugar de 'localDetails' (estado)
    const descKey = details.description; 
    
    const translated = t(descKey, { 
      ns: 'exercise_descriptions', 
      defaultValue: null 
    });

    if (translated && translated !== descKey) return translated;
    if (descKey) return descKey;
    return t('no_description_available', { ns: 'exercise_ui' });
  };

  const description = getTranslatedDescription();
  // Usamos 'details' (props) en lugar de 'localDetails' (estado)
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

        {/* Media: Lógica condicional (Igual que antes, pero lee de 'details') */}
        {localIsLoading ? (
          // 1. Estado de Carga (Se mostrará en el Render 1 si 'isDataMissing' era true)
          <div className="aspect-video bg-bg-secondary border border-glass-border rounded-lg flex items-center justify-center text-text-muted w-full mx-auto mb-4">
            <Spinner />
          </div>
        ) : (details.image_url || details.video_url) ? (
          // 2. Estado con Media (Se mostrará en Render 1 si los datos estaban, o en Render 2 si no)
          <ExerciseMedia details={details} className="w-full mx-auto mb-4" />
        ) : (
          // 3. Estado sin Media (Fallback)
          <div className="aspect-video bg-bg-secondary border border-glass-border rounded-lg flex items-center justify-center text-text-muted w-full mx-auto mb-4">
            <ImageIcon size={48} />
          </div>
        )}

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

        {/* Descripción: Usa el estado de carga local (Sin cambios) */}
        {(localIsLoading || description) && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-text-secondary">
              <FileText size={20} className="text-accent" />
              {t('description', { ns: 'exercise_ui' })}
            </h3>

            {/*
              Esta lógica de carga para la descripción también funciona:
              Si 'localIsLoading' es true, muestra Spinner.
              Si es false, 'description' (leído de 'details') tendrá el valor correcto.
            */}
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