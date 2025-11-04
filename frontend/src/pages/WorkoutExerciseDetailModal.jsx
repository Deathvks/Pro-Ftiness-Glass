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

  // --- (Lógica de carga: Sin cambios, esta parte es correcta) ---
  const details = exercise.exercise_details || {};
  const nameKey = exercise.name;

  const isDataMissing = () => {
    const missingDescription = !details.description;
    const missingMedia = !details.image_url && !details.video_url;
    return (missingDescription || missingMedia) && nameKey;
  };

  const [localIsLoading, setLocalIsLoading] = useState(isDataMissing());

  useEffect(() => {
    if (!localIsLoading) return;

    const fetchMissingDetails = async () => {
      try {
        const allExercises = await getOrFetchAllExercises();
        const fullDetails = allExercises.find(ex => ex.name === nameKey);

        if (fullDetails) {
          updateActiveExerciseDetails(nameKey, fullDetails);
        }
      } catch (error) {
        console.error("Error al auto-corregir detalles:", error);
      } finally {
        setLocalIsLoading(false);
      }
    };

    fetchMissingDetails();
  }, [localIsLoading, nameKey, getOrFetchAllExercises, updateActiveExerciseDetails]);
  // --- (Fin de la lógica de carga) ---


  // --- INICIO DE LA MODIFICACIÓN (Descripción) ---
  /**
   * Lógica de descripción
   * Lee de 'details' (la prop)
   * Devuelve NULL si no hay clave de descripción.
   */
  const getTranslatedDescription = () => {
    const descKey = details.description; 
    // 1. Si no hay 'descKey', devuelve null.
    if (!descKey) return null;
    
    const translated = t(descKey, { 
      ns: 'exercise_descriptions', 
      // 2. Si no hay traducción, devuelve null.
      defaultValue: null 
    });

    // 3. Devuelve la traducción, o la clave original como fallback,
    // pero solo si la clave existía.
    return translated || descKey;
  };

  // 'description' ahora puede ser 'null'
  const description = getTranslatedDescription();
  const titleKey = details.name || nameKey;
  // --- FIN DE la MODIFICACIÓN (Descripción) ---

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

        {/* --- INICIO DE LA MODIFICACIÓN (Media) --- */}
        {/*
          Lógica de renderizado independiente para la Media.
          Comprueba primero si TENEMOS media. Si es así, la muestra.
          Si no, comprueba si estamos cargando.
        */}
        { (details.image_url || details.video_url) ? (
          // 1. Si TENEMOS media, la mostramos (ignora 'localIsLoading')
          <ExerciseMedia details={details} className="w-full mx-auto mb-4" />
        ) : localIsLoading ? (
          // 2. Si NO tenemos media y SÍ estamos cargando, Spinner.
          <div className="aspect-video bg-bg-secondary border border-glass-border rounded-lg flex items-center justify-center text-text-muted w-full mx-auto mb-4">
            <Spinner />
          </div>
        ) : (
          // 3. Si NO tenemos media y NO estamos cargando, Fallback.
          <div className="aspect-video bg-bg-secondary border border-glass-border rounded-lg flex items-center justify-center text-text-muted w-full mx-auto mb-4">
            <ImageIcon size={48} />
          </div>
        )}
        {/* --- FIN DE LA MODIFICACIÓN (Media) --- */}


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

        {/* --- INICIO DE LA MODIFICACIÓN (Descripción) --- */}
        {/*
          Lógica de renderizado independiente para la Descripción.
          Comprueba si 'description' (que puede ser null) existe.
          Si no, comprueba si estamos cargando.
        */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-text-secondary">
            <FileText size={20} className="text-accent" />
            {t('description', { ns: 'exercise_ui' })}
          </h3>

          { description ? (
            // 1. Si TENEMOS descripción (no es null), la mostramos.
            <div
              className="prose prose-sm prose-invert max-w-none text-text-primary leading-relaxed"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          ) : localIsLoading ? (
            // 2. Si NO tenemos descripción y SÍ estamos cargando, Spinner.
            <div className="flex justify-center items-center h-24">
              <Spinner />
            </div>
          ) : (
            // 3. Si NO tenemos descripción y NO estamos cargando, Fallback.
            <p className="text-text-muted">
              {t('no_description_available', { ns: 'exercise_ui' })}
            </p>
          )}
        </div>
        {/* --- FIN DE LA MODIFICACIÓN (Descripción) --- */}

      </GlassCard>
    </div>
  );
};

export default WorkoutExerciseDetailModal;