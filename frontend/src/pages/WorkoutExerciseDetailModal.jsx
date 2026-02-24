/* frontend/src/pages/WorkoutExerciseDetailModal.jsx */
import React, { useEffect, useState } from 'react';
import { X, Dumbbell, Repeat, Clock, FileText, Image as ImageIcon, Target, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ExerciseMedia from '../components/ExerciseMedia';
import Spinner from '../components/Spinner';
import useAppStore from '../store/useAppStore';
import { normalizeText } from '../utils/helpers';
import { askTrainerAI } from '../services/aiService';

const WorkoutExerciseDetailModal = ({ exercise, onClose }) => {
  const { t } = useTranslation(['exercise_names', 'exercise_ui', 'exercise_descriptions', 'exercise_muscles']);

  const { getOrFetchAllExercises } = useAppStore(state => ({
    getOrFetchAllExercises: state.getOrFetchAllExercises,
  }));

  const [localDetails, setLocalDetails] = useState(exercise.exercise_details || {});

  // Estados para la IA
  const [aiExplanation, setAiExplanation] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  
  // Guardamos y leemos de localStorage para que el límite se muestre al instante
  const [remainingUses, setRemainingUses] = useState(() => {
    const saved = localStorage.getItem('ai_remaining_uses');
    return saved !== null ? parseInt(saved, 10) : null;
  });

  const [dailyLimit, setDailyLimit] = useState(() => {
    const saved = localStorage.getItem('ai_daily_limit');
    return saved !== null ? parseInt(saved, 10) : null;
  });

  // --- NUEVA LÓGICA: Comprobación de cambio de día ---
  useEffect(() => {
    const lastDate = localStorage.getItem('ai_last_date');
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' }); // Formato YYYY-MM-DD

    if (lastDate && lastDate !== today) {
      // Ha cambiado de día, borramos los límites del frontend
      localStorage.removeItem('ai_remaining_uses');
      localStorage.removeItem('ai_daily_limit');
      setRemainingUses(null);
      setDailyLimit(null);
      setAiError(null);
    }
    
    // Actualizamos la fecha
    localStorage.setItem('ai_last_date', today);
  }, []);
  // --- FIN DE NUEVA LÓGICA ---

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
  const translatedName = t(titleKey, { ns: 'exercise_names', defaultValue: titleKey });

  // --- CORRECCIÓN DE PRIORIDAD ---
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

  // --- LÓGICA DE LA IA ---
  const isLimitReached = remainingUses === 0 || (aiError && aiError.toLowerCase().includes('agotado'));

  const handleAskAI = async () => {
    if (isLimitReached) return;
    
    setIsAiLoading(true);
    setAiError(null);
    try {
      const prompt = `Actúa como un entrenador experto. Explica detalladamente el ejercicio "${translatedName}". 
      Incluye una breve descripción de la técnica correcta paso a paso, músculos principales y secundarios implicados, los 2 errores más comunes al realizarlo y un "Pro Tip" final. 
      Sé directo y usa un formato limpio y fácil de leer.`;
      
      const res = await askTrainerAI(prompt);
      setAiExplanation(res.response);
      
      if (res.remaining !== undefined) {
        setRemainingUses(res.remaining);
        localStorage.setItem('ai_remaining_uses', res.remaining);
      }
      if (res.limit !== undefined) {
        setDailyLimit(res.limit);
        localStorage.setItem('ai_daily_limit', res.limit);
      }

      // Guardamos la fecha de la última petición exitosa
      const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
      localStorage.setItem('ai_last_date', today);

    } catch (error) {
      const data = error.response?.data || {};
      const errorMsg = data.error || error.message || "Error al conectar con la IA.";
      setAiError(errorMsg);
      
      if (errorMsg.includes('agotado') || errorMsg.includes('Límite')) {
        setRemainingUses(0);
        localStorage.setItem('ai_remaining_uses', '0');
        if (data.limit !== undefined) {
          setDailyLimit(data.limit);
          localStorage.setItem('ai_daily_limit', data.limit);
        }
      }
    } finally {
      setIsAiLoading(false);
    }
  };

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
          {translatedName}
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

        {/* --- Sección del Entrenador IA --- */}
        <div className="mt-6 pt-6 border-t border-glass-border space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-text-primary">
              <Sparkles className="w-5 h-5 text-accent" />
              Técnica y Consejos IA
            </h3>
            {remainingUses !== null && (
              <div className="text-right">
                <span className={`text-xs font-medium block ${isLimitReached ? 'text-red-500' : 'text-text-secondary'}`}>
                  Usos restantes: {remainingUses}{dailyLimit ? `/${dailyLimit}` : ''}
                </span>
                <span className="text-[10px] text-text-muted block">Se restablece a medianoche</span>
              </div>
            )}
          </div>

          {!aiExplanation && !isAiLoading && (
            <button
              onClick={handleAskAI}
              disabled={isLimitReached}
              className={`w-full p-4 rounded-xl border flex items-center justify-center gap-2 transition-transform active:scale-95 font-bold ${
                isLimitReached
                  ? 'bg-gray-500/10 border-transparent text-text-muted cursor-not-allowed'
                  : 'border-accent/30 bg-accent/10 text-accent hover:bg-accent/20'
              }`}
            >
              {isLimitReached ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  Límite Diario Alcanzado
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Pedir explicación experta
                </>
              )}
            </button>
          )}

          {isAiLoading && (
            <div className="p-6 rounded-xl border border-glass-border bg-bg-secondary flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
              <span className="text-sm text-text-secondary">Analizando biomecánica del ejercicio...</span>
            </div>
          )}

          {aiError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{aiError}</p>
            </div>
          )}

          {aiExplanation && (
            <div className="p-5 rounded-xl border border-accent/20 bg-accent/5 space-y-2 text-sm leading-relaxed whitespace-pre-wrap text-text-primary">
              {aiExplanation}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default WorkoutExerciseDetailModal;