/* frontend/src/components/RoutineEditor/ExerciseSearch/ExerciseDetailView.jsx */
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Check, Repeat, Dumbbell, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { normalizeText } from '../../../utils/helpers';
import { askTrainerAI } from '../../../services/aiService';

// Base URL para construir las rutas de imágenes
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

const ExerciseDetailView = ({
  exercise,
  onBack,
  onAdd,
  isStaged,
  t,
  isReplacing = false,
}) => {
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState('8-12');
  const [rest, setRest] = useState(60);
  const { theme } = useAppTheme();

  // --- LÓGICA INTELIGENTE DE IMÁGENES (Cero 404s) ---
  const [startImageError, setStartImageError] = useState(false);
  const [endImageError, setEndImageError] = useState(false);

  useEffect(() => {
    setStartImageError(false);
    setEndImageError(false);
  }, [exercise]);

  const rawStartUrl = exercise.image_url_start || exercise.image_url || exercise.image;
  const rawEndUrl = exercise.image_url_end || rawStartUrl; 

  const getBestImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    const filename = cleanUrl.split('/').pop();
    
    // Expresión regular relajada: Busca el patrón UUID en CUALQUIER parte del nombre del archivo
    const isWgerUuid = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/.test(filename);
    
    if (isWgerUuid || cleanUrl.includes('exercise-images')) {
      return `https://wger.de/media/exercise-images/${filename}`;
    }

    return `${BACKEND_BASE_URL}/${cleanUrl}`;
  };

  const finalStartUrl = getBestImageUrl(rawStartUrl);
  const finalEndUrl = getBestImageUrl(rawEndUrl);
  // ----------------------------------------

  // --- LOG PARA CAPTURAR LA CLAVE EXACTA DE CUALQUIER EJERCICIO ---
  useEffect(() => {
    if (exercise && exercise.description) {
      console.log(`=== CLAVE EXACTA PARA: ${exercise.name} ===`);
      console.log(normalizeText(exercise.description));
      console.log("=============================================");
    }
  }, [exercise]);
  // ----------------------------------------------------------------

  // Estados para la IA
  const [aiExplanation, setAiExplanation] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const [remainingUses, setRemainingUses] = useState(() => {
    const saved = localStorage.getItem('ai_remaining_uses');
    return saved !== null ? parseInt(saved, 10) : null;
  });

  const [dailyLimit, setDailyLimit] = useState(() => {
    const saved = localStorage.getItem('ai_daily_limit');
    return saved !== null ? parseInt(saved, 10) : null;
  });

  useEffect(() => {
    const lastDate = localStorage.getItem('ai_last_date');
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });

    if (lastDate && lastDate !== today) {
      localStorage.removeItem('ai_remaining_uses');
      localStorage.removeItem('ai_daily_limit');
      setRemainingUses(null);
      setDailyLimit(null);
      setAiError(null);
    }

    localStorage.setItem('ai_last_date', today);
  }, []);

  const handleAddClick = () => {
    if (isReplacing) {
      onAdd(exercise);
    } else {
      onAdd(exercise, { sets, reps, rest_seconds: rest });
    }
  };

  const translatedName = t(exercise.name, {
    ns: 'exercise_names',
    defaultValue: exercise.name,
  });

  const rawMuscleGroup = exercise.muscle_group || exercise.muscles || exercise.target || exercise.category || 'Other';
  const translatedMuscle = rawMuscleGroup
    .split(',')
    .map((m) => {
      const trimmed = m.trim();
      return t(trimmed, {
        ns: 'exercise_muscles',
        defaultValue: trimmed,
      });
    })
    .join(', ');

  const rawEquipment = exercise.equipment || 'None';
  const translatedEquipment = rawEquipment
    .split(',')
    .map((e) => {
      const trimmed = e.trim();
      return t(trimmed, {
        ns: 'exercise_equipment',
        defaultValue: trimmed,
      });
    })
    .join(', ');

  const defaultDescription = exercise.description || t('exercise_ui:no_description_available', 'No hay descripción disponible.');
  const descriptionKey = normalizeText(exercise.description);

  const translatedDescription = t(descriptionKey, {
    ns: 'exercise_descriptions',
    defaultValue: defaultDescription,
    nsSeparator: false,
    keySeparator: false,
  });

  const isOled = theme === 'oled';
  const hasVideo = !!exercise.video_url;
  const mediaBgClass = (!hasVideo && !finalStartUrl && isOled) ? 'bg-gray-200' : 'bg-bg-primary';

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
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 p-4 pb-2 border-b border-glass-border">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 p-2 -ml-2 mb-2 rounded-lg text-text-secondary hover:bg-white/10 hover:text-text-primary transition-colors"
        >
          <ChevronLeft size={24} />
          <span className="font-semibold">{t('exercise_ui:back', 'Volver')}</span>
        </button>
        <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary break-words whitespace-normal leading-tight">
          {translatedName}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className={`mb-6 aspect-video ${mediaBgClass} rounded-xl border border-glass-border overflow-hidden flex items-center justify-center`}>
          {hasVideo ? (
            <video
              src={exercise.video_url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain"
            />
          ) : finalStartUrl ? (
            <div className="flex gap-4 w-full h-full p-4">
              {!startImageError && (
                <img
                  key={`start-${finalStartUrl}`}
                  src={finalStartUrl}
                  alt={`Inicio de ${translatedName}`}
                  className={`${finalEndUrl && !endImageError ? 'w-1/2' : 'w-full'} h-full object-contain`}
                  loading="lazy"
                  onError={() => setStartImageError(true)}
                />
              )}
              {finalEndUrl && !endImageError && (
                <img
                  key={`end-${finalEndUrl}`}
                  src={finalEndUrl}
                  alt={`Fin de ${translatedName}`}
                  className={`${!startImageError ? 'w-1/2' : 'w-full'} h-full object-contain`}
                  loading="lazy"
                  onError={() => setEndImageError(true)}
                />
              )}
              {startImageError && (!finalEndUrl || endImageError) && (
                 <div className="flex w-full items-center justify-center text-text-muted">
                    <Dumbbell size={64} opacity={0.5} />
                 </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center text-text-muted">
              <Dumbbell size={64} opacity={0.5} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-bg-secondary p-4 rounded-lg border border-glass-border">
            <p className="text-sm text-text-muted">{t('exercise_ui:muscle_group', 'Grupo Muscular')}</p>
            <p className="font-semibold capitalize">
              {translatedMuscle}
            </p>
          </div>
          <div className="bg-bg-secondary p-4 rounded-lg border border-glass-border">
            <p className="text-sm text-text-muted">{t('exercise_ui:equipment', 'Equipamiento')}</p>
            <p className="font-semibold capitalize">
              {translatedEquipment}
            </p>
          </div>
        </div>

        <div className="pb-4">
          <h3 className="text-lg font-semibold mb-2">{t('exercise_ui:description', 'Descripción')}</h3>
          <p className="text-text-secondary whitespace-pre-line leading-relaxed">
            {translatedDescription}
          </p>
        </div>

        <div className="mt-4 pt-6 border-t border-glass-border space-y-4">
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
              className={`w-full p-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 font-bold border border-glass-border ${isLimitReached
                  ? 'bg-bg-secondary/50 text-text-muted cursor-not-allowed'
                  : 'bg-bg-secondary text-accent hover:bg-accent/5'
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
            <div className="p-6 rounded-xl bg-bg-secondary border border-glass-border flex flex-col items-center justify-center gap-3">
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
            <div className="p-5 rounded-xl bg-bg-secondary border border-glass-border space-y-2 text-sm leading-relaxed whitespace-pre-wrap text-text-primary">
              {aiExplanation}
            </div>
          )}
        </div>

        <div className="h-6"></div>
      </div>

      <div className="flex-shrink-0 p-4 border-t border-glass-border bg-bg-primary/80 backdrop-blur-sm pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6">
        {!isReplacing && (
          <div className="flex gap-4 mb-4">
            <div>
              <label className="text-xs text-text-muted">{t('exercise_ui:sets', 'Series')}</label>
              <input
                type="number"
                value={sets}
                onChange={(e) => setSets(Number(e.target.value))}
                className="w-full text-center px-3 py-2 rounded-md bg-bg-secondary border border-glass-border"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted">{t('exercise_ui:reps', 'Reps')}</label>
              <input
                type="text"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-full text-center px-3 py-2 rounded-md bg-bg-secondary border border-glass-border"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted">{t('exercise_ui:rest_s', 'Desc. (s)')}</label>
              <input
                type="number"
                value={rest}
                onChange={(e) => setRest(Number(e.target.value))}
                className="w-full text-center px-3 py-2 rounded-md bg-bg-secondary border border-glass-border"
              />
            </div>
          </div>
        )}

        {isReplacing ? (
          <button
            onClick={handleAddClick}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg transition bg-accent text-bg-secondary"
          >
            <Repeat size={24} />
            {t('exercise_ui:replace_exercise', 'Reemplazar Ejercicio')}
          </button>
        ) : (
          <button
            onClick={isStaged ? onBack : handleAddClick}
            disabled={false}
            className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg transition ${isStaged
              ? 'bg-green/20 text-green'
              : 'bg-accent text-bg-secondary'
              }`}
          >
            {isStaged ? (
              <>
                <Check size={24} />
                {t('exercise_ui:added_back_to_list', 'Añadido (Volver a la lista)')}
              </>
            ) : (
              <>
                <Plus size={24} />
                {t('exercise_ui:add_to_cart', 'Añadir al carrito')}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ExerciseDetailView;