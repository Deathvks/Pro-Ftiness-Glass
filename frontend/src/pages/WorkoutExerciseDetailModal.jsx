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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out] p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col bg-bg-primary rounded-[32px] ring-1 ring-black/5 dark:ring-white/10 shadow-2xl animate-[slide-up_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 sm:p-8 pb-5 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 rounded-t-[32px] shrink-0">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary truncate pr-4">
            {translatedName}
          </h2>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-text-secondary hover:text-text-primary active:scale-95 shrink-0"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 sm:p-8 custom-scrollbar">
          
          {(localDetails.image_url || localDetails.video_url) ? (
            <ExerciseMedia
              details={localDetails}
              className="w-full mx-auto mb-8 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10 shadow-sm"
            />
          ) : localIsLoading ? (
            <div className="aspect-video bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[24px] flex items-center justify-center text-text-muted w-full mx-auto mb-8 shadow-inner">
              <Spinner size={32} />
            </div>
          ) : (
            <div className="aspect-video bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[24px] flex items-center justify-center text-text-muted w-full mx-auto mb-8 shadow-inner">
              <ImageIcon size={48} strokeWidth={1.5} className="opacity-50" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="flex items-center gap-3 p-4 bg-black/5 dark:bg-white/5 rounded-[20px] ring-1 ring-black/5 dark:ring-white/10 shadow-inner">
              <div className="p-2 bg-accent/10 rounded-[12px] text-accent shrink-0">
                <Target size={18} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Músculo</span>
                <span className="font-bold text-sm text-text-primary capitalize truncate">{muscleGroupLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-black/5 dark:bg-white/5 rounded-[20px] ring-1 ring-black/5 dark:ring-white/10 shadow-inner">
              <div className="p-2 bg-accent/10 rounded-[12px] text-accent shrink-0">
                <Dumbbell size={18} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Series</span>
                <span className="font-bold text-sm text-text-primary truncate">{t('n_sets', { count: exercise.sets, ns: 'exercise_ui' })}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-black/5 dark:bg-white/5 rounded-[20px] ring-1 ring-black/5 dark:ring-white/10 shadow-inner">
              <div className="p-2 bg-accent/10 rounded-[12px] text-accent shrink-0">
                <Repeat size={18} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Reps</span>
                <span className="font-bold text-sm text-text-primary truncate">{t('n_reps', { count: exercise.reps, ns: 'exercise_ui' })}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-black/5 dark:bg-white/5 rounded-[20px] ring-1 ring-black/5 dark:ring-white/10 shadow-inner">
              <div className="p-2 bg-accent/10 rounded-[12px] text-accent shrink-0">
                <Clock size={18} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Descanso</span>
                <span className="font-bold text-sm text-text-primary truncate">{t('n_rest', { count: exercise.rest_seconds || 90, ns: 'exercise_ui' })}</span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="flex items-center gap-3 text-lg font-extrabold text-text-primary mb-4 tracking-tight">
              <div className="p-2 bg-accent/10 rounded-[12px] ring-1 ring-accent/30 text-accent shrink-0">
                <FileText size={18} strokeWidth={2.5} />
              </div>
              {t('description', { ns: 'exercise_ui' })}
            </h3>

            {description ? (
              <div className="bg-black/5 dark:bg-white/5 rounded-[24px] p-5 sm:p-6 ring-1 ring-black/5 dark:ring-white/10 shadow-inner">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-text-primary font-medium leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              </div>
            ) : localIsLoading ? (
              <div className="bg-black/5 dark:bg-white/5 rounded-[24px] p-8 ring-1 ring-black/5 dark:ring-white/10 flex justify-center items-center">
                <Spinner size={24} />
              </div>
            ) : (
              <div className="bg-black/5 dark:bg-white/5 rounded-[24px] p-6 ring-1 ring-black/5 dark:ring-white/10 text-center">
                <p className="text-text-secondary font-bold text-sm">
                  {t('no_description_available', { ns: 'exercise_ui' })}
                </p>
              </div>
            )}
          </div>

          {/* --- Sección del Entrenador IA --- */}
          <div className="pt-8 border-t border-black/5 dark:border-white/10">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-extrabold flex items-center gap-3 text-text-primary tracking-tight">
                <div className="p-2 bg-accent/10 rounded-[12px] ring-1 ring-accent/30 text-accent shrink-0">
                  <Sparkles size={18} strokeWidth={2.5} />
                </div>
                Técnica y Consejos IA
              </h3>
              {remainingUses !== null && (
                <div className="text-right">
                  <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider block ${isLimitReached ? 'text-red' : 'text-text-secondary'}`}>
                    Usos: {remainingUses}{dailyLimit ? `/${dailyLimit}` : ''}
                  </span>
                  <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest block mt-0.5">Se restablece a medianoche</span>
                </div>
              )}
            </div>

            {!aiExplanation && !isAiLoading && (
              <button
                onClick={handleAskAI}
                disabled={isLimitReached}
                className={`w-full py-4 px-6 rounded-[20px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-sm sm:text-base ring-1 ${isLimitReached
                    ? 'bg-black/5 dark:bg-white/5 ring-black/5 dark:ring-white/10 text-text-muted cursor-not-allowed'
                    : 'bg-black/5 dark:bg-white/5 ring-black/5 dark:ring-white/10 hover:bg-black/10 dark:hover:bg-white/10 text-accent hover:ring-accent/50 shadow-sm'
                  }`}
              >
                {isLimitReached ? (
                  <>
                    <AlertCircle size={20} strokeWidth={2.5} />
                    Límite Diario Alcanzado
                  </>
                ) : (
                  <>
                    <Sparkles size={20} strokeWidth={2.5} />
                    Pedir explicación experta
                  </>
                )}
              </button>
            )}

            {isAiLoading && (
              <div className="p-8 rounded-[24px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 flex flex-col items-center justify-center gap-4 shadow-inner">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
                <span className="text-sm font-bold text-text-secondary">Analizando biomecánica del ejercicio...</span>
              </div>
            )}

            {aiError && (
              <div className="p-5 rounded-[20px] bg-red/10 ring-1 ring-red/30 flex gap-3 items-start shadow-sm mt-2">
                <AlertCircle className="w-5 h-5 text-red shrink-0 mt-0.5" strokeWidth={2.5} />
                <p className="text-sm font-bold text-red leading-relaxed">{aiError}</p>
              </div>
            )}

            {aiExplanation && (
              <div className="p-5 sm:p-6 rounded-[24px] bg-accent/5 ring-1 ring-accent/30 space-y-2 text-sm leading-relaxed whitespace-pre-wrap text-text-primary font-medium shadow-inner">
                {aiExplanation}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default WorkoutExerciseDetailModal;