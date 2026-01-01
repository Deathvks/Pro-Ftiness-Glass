/* frontend/src/pages/WorkoutExerciseDetailModal.jsx */
import React, { useEffect, useState } from 'react';
import { X, Dumbbell, Repeat, Clock, FileText, Image as ImageIcon, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ExerciseMedia from '../components/ExerciseMedia';
import Spinner from '../components/Spinner';
import useAppStore from '../store/useAppStore';
import { normalizeText } from '../utils/helpers';

const WorkoutExerciseDetailModal = ({ exercise, onClose }) => {
  const { t } = useTranslation(['exercise_names', 'exercise_ui', 'exercise_descriptions', 'exercise_muscles']);

  const { getOrFetchAllExercises } = useAppStore(state => ({
    getOrFetchAllExercises: state.getOrFetchAllExercises,
  }));

  const [localDetails, setLocalDetails] = useState(exercise.exercise_details || {});

  const nameKey = exercise.name;
  const isDataMissing = (details) => {
    const missingDescription = !details.description && !details.description_es;
    const missingMedia = !details.image_url && !details.video_url;
    return (missingDescription || missingMedia) && nameKey;
  };

  const [localIsLoading, setLocalIsLoading] = useState(isDataMissing(localDetails));

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

  // --- CORRECCIÓN DE PRIORIDAD ---
  // 1. Buscamos PRIMERO en el ejercicio de la rutina (exercise.*) para respetar manuales/ediciones.
  // 2. Si no hay nada, buscamos en los detalles base (localDetails.*).
  const rawMuscleGroup =
    exercise.muscle_group || exercise.muscles || exercise.target ||
    localDetails.muscle_group || localDetails.muscles || localDetails.target ||
    localDetails.category || 'Other';

  const muscleGroupLabel = rawMuscleGroup
    .split(',')
    .map(m => {
      const trimmed = m.trim();
      return t(trimmed, { ns: 'exercise_muscles', defaultValue: trimmed });
    })
    .join(', ');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[60vh] md:max-h-[85vh] m-4 p-6 overflow-y-auto animate-[fade-in-up_0.3s_ease-out] bg-bg-primary rounded-2xl border border-glass-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/10 transition"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-4 pr-8 break-words text-text-primary">
          {t(titleKey, { ns: 'exercise_names', defaultValue: titleKey })}
        </h2>

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

        <div className="space-y-3 mb-6">
          <h3 className="text-lg font-semibold text-text-secondary">
            {t('details', { ns: 'exercise_ui', defaultValue: 'Detalles' })}
          </h3>

          <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-md border-glass-border">
            <Target size={20} className="text-accent" />
            <span className="font-medium capitalize text-text-primary">
              {muscleGroupLabel}
            </span>
          </div>

          <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-md border-glass-border">
            <Dumbbell size={20} className="text-accent" />
            <span className="font-medium text-text-primary">
              {t('n_sets', { count: exercise.sets, ns: 'exercise_ui' })}
            </span>
          </div>
          <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-md border-glass-border">
            <Repeat size={20} className="text-accent" />
            <span className="font-medium text-text-primary">
              {t('n_reps', { count: exercise.reps, ns: 'exercise_ui' })}
            </span>
          </div>
          <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-md border-glass-border">
            <Clock size={20} className="text-accent" />
            <span className="font-medium text-text-primary">
              {t('n_rest', { count: exercise.rest_seconds || 90, ns: 'exercise_ui' })}
            </span>
          </div>
        </div>

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

      </div>
    </div>
  );
};

export default WorkoutExerciseDetailModal;