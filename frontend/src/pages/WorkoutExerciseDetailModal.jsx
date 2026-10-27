import React, { useEffect, useState, useRef } from 'react';
import { X, Dumbbell, Repeat, Clock, FileText, Image as ImageIcon, Target, Sparkles, Loader2, AlertCircle, ChevronDown, Play, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ExerciseMedia from '../components/ExerciseMedia';
import Spinner from '../components/Spinner';
import useAppStore from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { askTrainerAI } from '../services/aiService';
import ModalPortal from '../components/ModalPortal';
import { useToast } from '../hooks/useToast';

const WorkoutExerciseDetailModal = ({ exercise, onClose }) => {
  const { t } = useTranslation('exercise_ui');
  const { showToast } = useToast();

  const { getOrFetchAllExercises } = useAppStore(useShallow(state => ({
    getOrFetchAllExercises: state.getOrFetchAllExercises,
    userProfile: state.userProfile,
  })));

  const isAdmin = localDetails?.userProfile?.role === 'admin' || exercise?.userProfile?.role === 'admin' || useAppStore.getState().userProfile?.role === 'admin';
  const [localDetails, setLocalDetails] = useState({ ...exercise, ...(exercise.exercise_details || {}) });
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' ? !navigator.onLine : false);

  const hasVideo = Boolean(
    localDetails?.video_url ||
    localDetails?.exercise?.video_url ||
    localDetails?.exercise_details?.video_url ||
    exercise?.video_url
  );

  const hasImages = Boolean(
    localDetails?.image_url_start ||
    localDetails?.image_url ||
    (Array.isArray(localDetails?.images) && localDetails.images.length > 0) ||
    exercise?.image_url_start ||
    exercise?.image_url ||
    (Array.isArray(exercise?.images) && exercise.images.length > 0)
  );

  const [mediaMode, setMediaMode] = useState(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return 'images';
    return hasVideo ? 'video' : 'images';
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      setMediaMode('images');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  const description = localDetails.description || localDetails.description_es || null;
  const translatedName = localDetails.name || exercise.name;

  // --- CORRECCIÓN DE PRIORIDAD ---
  const rawMuscleGroup =
    exercise.muscle_group || exercise.muscles || exercise.target ||
    localDetails.muscle_group || localDetails.muscles || localDetails.target ||
    localDetails.category || 'Otro';

  const muscleGroupLabel = rawMuscleGroup
    .split(',')
    .map(m => m.trim())
    .filter(Boolean)
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

  const detailsRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const scrollToDetails = () => {
    if (detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <ModalPortal>
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl md:max-w-3xl lg:max-w-4xl max-h-[92vh] mt-auto sm:mt-0 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-0 overflow-hidden flex flex-col bg-bg-primary rounded-t-[32px] sm:rounded-[32px] ring-1 ring-black/5 dark:ring-white/10 shadow-2xl animate-[slide-up_0.3s_ease-out] sm:animate-[scale-in_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col p-6 pt-4 pb-4 sm:p-8 sm:py-5 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 rounded-t-[32px] shrink-0">
          <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-3 sm:hidden shrink-0" />
          <div className="flex justify-between items-center">
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
        </div>

        {/* Content */}
        <div 
          ref={scrollContainerRef}
          className="flex-grow overflow-y-auto p-6 sm:p-8 custom-scrollbar"
        >
          {/* Contenedor Responsivo: Columna en Móvil, 2 Columnas en PC */}
          <div className="flex flex-col md:flex-row md:items-start md:gap-8">
            
            {/* Columna Izquierda: Vídeo en Formato Vertical Móvil (Shorts 9:16) o Animación de Fotos */}
            <div className="flex flex-col items-center shrink-0 mb-6 md:mb-0 md:sticky md:top-0">
              {/* Selector Vídeo / Animación si ambos recursos existen */}
              {hasVideo && hasImages && (
                <div className="flex items-center p-1 bg-black/5 dark:bg-white/5 rounded-full ring-1 ring-black/5 dark:ring-white/10 mb-3 shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      if (isOffline) {
                        showToast('El vídeo de YouTube requiere conexión a internet activa', 'warning');
                        return;
                      }
                      setMediaMode('video');
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                      mediaMode === 'video'
                        ? 'bg-accent text-white shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Play size={11} fill="currentColor" />
                    <span>Vídeo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaMode('images')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                      mediaMode === 'images'
                        ? 'bg-accent text-white shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Repeat size={11} />
                    <span>Animación</span>
                  </button>
                </div>
              )}

              <div className="relative mx-auto w-[220px] xs:w-[240px] sm:w-[260px] md:w-[270px] max-w-full aspect-[9/16] max-h-[44vh] md:max-h-[58vh] rounded-[28px] overflow-hidden bg-black ring-1 ring-black/10 dark:ring-white/15 shadow-2xl flex items-center justify-center">
                {/* Badge sin conexión si estamos offline */}
                {isOffline && (
                  <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-amber-400 text-[10px] font-bold flex items-center gap-1.5 border border-amber-500/30 shadow-md">
                    <WifiOff size={11} />
                    <span>Sin conexión • Animación local</span>
                  </div>
                )}

                {localIsLoading ? (
                  <div className="w-full h-full flex items-center justify-center text-text-muted">
                    <Spinner size={32} />
                  </div>
                ) : (
                  <ExerciseMedia
                    details={localDetails}
                    fitMode="cover"
                    playYouTube={mediaMode === 'video' && !isOffline}
                    className="w-full h-full aspect-[9/16] object-cover"
                  />
                )}

                {/* Borde interior sutil */}
                <div className="absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/15 pointer-events-none z-10" />
              </div>

              {/* Botón indicador para móvil (icono perfectamente centrado con el texto; en PC los datos ya están al lado) */}
              <button
                type="button"
                onClick={scrollToDetails}
                className="mt-3.5 md:hidden inline-flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 ring-1 ring-black/5 dark:ring-white/10 text-text-secondary hover:text-text-primary text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
              >
                <ChevronDown size={14} className="text-accent shrink-0" strokeWidth={2.5} />
                <span>Ver técnica, músculos y detalles</span>
              </button>
            </div>

            {/* Columna Derecha: Detalles del Ejercicio (Músculo, Series, Reps, Descripción e IA) */}
            <div ref={detailsRef} className="flex-1 min-w-0">
              <div className="grid grid-cols-2 gap-3 mb-6 scroll-mt-4">
                <div className="flex items-center gap-3 p-4 bg-black/5 dark:bg-white/5 rounded-[20px] ring-1 ring-black/5 dark:ring-white/10 shadow-inner">
                  <div className="p-2 bg-accent/10 rounded-[12px] text-accent shrink-0">
                    <Target size={18} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Músculo</span>
                    <span className="font-bold text-sm text-text-primary capitalize line-clamp-2 leading-tight">{muscleGroupLabel}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-black/5 dark:bg-white/5 rounded-[20px] ring-1 ring-black/5 dark:ring-white/10 shadow-inner">
                  <div className="p-2 bg-accent/10 rounded-[12px] text-accent shrink-0">
                    <Dumbbell size={18} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Series</span>
                    <span className="font-bold text-sm text-text-primary line-clamp-2 leading-tight">{t('n_sets', { count: exercise.sets, ns: 'exercise_ui' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-black/5 dark:bg-white/5 rounded-[20px] ring-1 ring-black/5 dark:ring-white/10 shadow-inner">
                  <div className="p-2 bg-accent/10 rounded-[12px] text-accent shrink-0">
                    <Repeat size={18} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Reps</span>
                    <span className="font-bold text-sm text-text-primary line-clamp-2 leading-tight">{t('n_reps', { count: exercise.reps, ns: 'exercise_ui' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-black/5 dark:bg-white/5 rounded-[20px] ring-1 ring-black/5 dark:ring-white/10 shadow-inner">
                  <div className="p-2 bg-accent/10 rounded-[12px] text-accent shrink-0">
                    <Clock size={18} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Descanso</span>
                    <span className="font-bold text-sm text-text-primary line-clamp-2 leading-tight">{t('n_rest', { count: exercise.rest_seconds || 90, ns: 'exercise_ui' })}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
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

              {/* Sección del Entrenador IA */}
              <div className="pt-6 border-t border-black/5 dark:border-white/10">
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold flex items-center gap-3 text-text-primary tracking-tight">
                      <div className="p-2 bg-accent/10 rounded-[12px] ring-1 ring-accent/30 text-accent shrink-0">
                        <Sparkles size={18} strokeWidth={2.5} />
                      </div>
                      Técnica y Consejos IA
                    </h3>
                    {isAdmin && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-accent/15 text-accent border border-accent/30">
                        Gemini 3.6 Flash
                      </span>
                    )}
                  </div>
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
      </div>
    </div>
    </ModalPortal>
  );
};

export default WorkoutExerciseDetailModal;

