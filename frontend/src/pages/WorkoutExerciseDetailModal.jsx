/* frontend/src/pages/WorkoutExerciseDetailModal.jsx */
// --- INICIO DE LA MODIFICACIÓN ---
// 1. Eliminamos 'useEffect', 'useState', 'Spinner' y 'useAppStore'
// ya que no vamos a auto-corregir ni a cargar nada.
import React from 'react';
import { X, Dumbbell, Repeat, Clock, FileText, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlassCard from '../components/GlassCard';
import ExerciseMedia from '../components/ExerciseMedia';
// import Spinner from '../components/Spinner'; // Ya no es necesario
// import useAppStore from '../store/useAppStore'; // Ya no es necesario
// --- FIN DE LA MODIFICACIÓN ---

const WorkoutExerciseDetailModal = ({ exercise, onClose }) => {
  const { t } = useTranslation(['exercise_names', 'exercise_ui', 'exercise_descriptions']);

  // --- INICIO DE LA MODIFICACIÓN ---
  // 3. Eliminada TODA la lógica de 'useState', 'useEffect' y 'localIsLoading'.
  // Simplemente leemos las props, que AHORA SÍ vienen completas
  // gracias a la precarga de workoutSlice.js
  const details = exercise.exercise_details || {};
  const nameKey = exercise.name;
  // --- FIN DE LA MODIFICACIÓN ---


  // --- (Lógica de Descripción) ---
  // Esta función ahora recibe 'details.description' con el texto
  // normalizado que le dimos en workoutSlice.
  const getTranslatedDescription = () => {
    // 'descKey' AHORA contiene el texto real (ej: "Túmbate en el banco...")
    // o una clave de i18n, gracias a la normalización de workoutSlice.
    const descKey = details.description; 
    
    // 1. Si no hay descripción, devuelve null.
    if (!descKey) return null;
    
    // 2. Intenta traducir 'descKey'.
    const translated = t(descKey, { 
      ns: 'exercise_descriptions', 
      defaultValue: null // Si no es una clave, devuelve null
    });

    // 3. Si 'translated' es null (porque descKey no era una clave),
    //    devuelve el 'descKey' original (que era el texto completo).
    //    Si 'translated' SÍ funcionó, devuelve la traducción.
    return translated || descKey;
  };

  const description = getTranslatedDescription();
  const titleKey = details.name || nameKey;
  // --- (Fin de Lógica de Descripción) ---

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
        {/* 4. Lógica de renderizado simplificada. Sin 'localIsLoading'. */}
        { (details.image_url || details.video_url) ? (
          // 1. Si TENEMOS media, la mostramos.
          <ExerciseMedia details={details} className="w-full mx-auto mb-4" />
        ) : (
          // 2. Si NO tenemos media, Fallback.
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
        {/* 5. Lógica de renderizado simplificada. Sin 'localIsLoading'. */}
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
          ) : (
            // 2. Si NO tenemos descripción, Fallback.
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