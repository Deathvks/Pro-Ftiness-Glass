/* frontend/src/pages/WorkoutExerciseDetailModal.jsx */
// 1. Volvemos a importar useState, useEffect y Spinner
import React, { useEffect, useState } from 'react';
import { X, Dumbbell, Repeat, Clock, FileText, Image as ImageIcon, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlassCard from '../components/GlassCard';
import ExerciseMedia from '../components/ExerciseMedia';
import Spinner from '../components/Spinner'; // Importado de nuevo
import useAppStore from '../store/useAppStore'; // Importado de nuevo
import { normalizeText } from '../utils/helpers';

const WorkoutExerciseDetailModal = ({ exercise, onClose }) => {
  const { t } = useTranslation(['exercise_names', 'exercise_ui', 'exercise_descriptions', 'exercise_muscles']);

  // 2. Volvemos a usar el store, SÓLO para buscar datos
  const { getOrFetchAllExercises } = useAppStore(state => ({
    getOrFetchAllExercises: state.getOrFetchAllExercises,
  }));

  // --- INICIO DE LA MODIFICACIÓN ---

  // 3. ESTADO LOCAL: Mantenemos un estado local para los detalles.
  const [localDetails, setLocalDetails] = useState(exercise.exercise_details || {});

  // 4. ESTADO DE CARGA: Derivado de los 'localDetails'.
  const nameKey = exercise.name;
  const isDataMissing = (details) => {
    const missingDescription = !details.description && !details.description_es;
    const missingMedia = !details.image_url && !details.video_url;
    return (missingDescription || missingMedia) && nameKey;
  };

  const [localIsLoading, setLocalIsLoading] = useState(isDataMissing(localDetails));

  // 5. HOOK AUTOCORRECTOR
  useEffect(() => {
    if (!localIsLoading) return;

    const fetchMissingDetails = async () => {
      try {
        const allExercises = await getOrFetchAllExercises();
        const fullDetails = allExercises.find(ex => ex.name === nameKey);

        if (fullDetails) {
          const mergedDetails = {
            ...fullDetails,
            ...localDetails,
            name: nameKey,
            description: fullDetails.description_es || fullDetails.description || localDetails.description,
          };
          setLocalDetails(mergedDetails);
        }
      } catch (error) {
        console.error("Error al auto-corregir detalles:", error);
      } finally {
        setLocalIsLoading(false);
      }
    };

    fetchMissingDetails();
  }, [localIsLoading, nameKey, getOrFetchAllExercises]);

  // --- FIN DE LA MODIFICACIÓN ---


  /**
   * Lógica de descripción
   */
  const getTranslatedDescription = () => {
    const rawDesc = localDetails.description || localDetails.description_es;
    if (!rawDesc) return null;

    const descKey = normalizeText(rawDesc);

    const translated = t(descKey, {
      ns: 'exercise_descriptions',
      defaultValue: null,
      nsSeparator: false,
      keySeparator: false
    });

    return translated || rawDesc;
  };

  const description = getTranslatedDescription();
  const titleKey = localDetails.name || exercise.name;

  // --- INICIO MODIFICACIÓN: Obtener grupo muscular ---
  // Priorizamos localDetails (que viene de la BD completa) y luego exercise (de la rutina)
  const rawMuscleGroup = localDetails.muscle_group || localDetails.category || exercise.muscle_group;
  // Intentamos traducirlo (asumiendo que puede venir como "Chest" o "Pecho")
  const muscleGroupLabel = rawMuscleGroup
    ? t(rawMuscleGroup, { ns: 'exercise_muscles', defaultValue: rawMuscleGroup })
    : t('unknown', { ns: 'exercise_muscles', defaultValue: 'N/A' });
  // --- FIN MODIFICACIÓN ---


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
      onClick={onClose}
    >
      <GlassCard
        // MODIFICADO: Cambiado a max-h-[60vh] para asegurar que el navbar no lo cubra en móviles
        className="relative w-full max-w-lg max-h-[60vh] md:max-h-[85vh] m-4 p-6 overflow-y-auto animate-[fade-in-up_0.3s_ease-out]"
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
        {(localDetails.image_url || localDetails.video_url) ? (
          <ExerciseMedia
            details={localDetails}
            className="w-full mx-auto mb-4 border border-glass-border rounded-xl"
          />
        ) : localIsLoading ? (
          <div className="aspect-video bg-bg-secondary border border-glass-border rounded-xl flex items-center justify-center text-text-muted w-full mx-auto mb-4">
            <Spinner />
          </div>
        ) : (
          <div className="aspect-video bg-bg-secondary border border-glass-border rounded-xl flex items-center justify-center text-text-muted w-full mx-auto mb-4">
            <ImageIcon size={48} />
          </div>
        )}

        {/* Datos del plan */}
        <div className="space-y-3 mb-6">
          <h3 className="text-lg font-semibold text-text-secondary">
            {t('details', { ns: 'exercise_ui', defaultValue: 'Detalles' })}
          </h3>

          {/* --- INICIO MODIFICACIÓN: Grupo Muscular --- */}
          <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-md border-glass-border">
            <Target size={20} className="text-accent" />
            <span className="font-medium capitalize">
              {muscleGroupLabel}
            </span>
          </div>
          {/* --- FIN MODIFICACIÓN --- */}

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
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-text-secondary">
            <FileText size={20} className="text-accent" />
            {t('description', { ns: 'exercise_ui' })}
          </h3>

          {description ? (
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