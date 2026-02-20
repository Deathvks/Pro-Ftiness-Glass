/* frontend/src/components/RoutineEditor/ExerciseSearch/ExerciseDetailView.jsx */
import React, { useState } from 'react';
import { ChevronLeft, Plus, Check, Repeat, Dumbbell, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useAppTheme } from '../../../hooks/useAppTheme';
// Importamos la función centralizada
import { normalizeText } from '../../../utils/helpers';
import { askTrainerAI } from '../../../services/aiService';

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

  // Estados para la IA
  const [aiExplanation, setAiExplanation] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [remainingUses, setRemainingUses] = useState(null);

  const handleAddClick = () => {
    if (isReplacing) {
      onAdd(exercise);
    } else {
      onAdd(exercise, { sets, reps, rest_seconds: rest });
    }
  };

  // 1. Traducir el nombre
  const translatedName = t(exercise.name, {
    ns: 'exercise_names',
    defaultValue: exercise.name,
  });

  // 2. Traducir grupo muscular
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

  // 3. Traducir equipamiento
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

  // 4. Traducir la descripción
  const defaultDescription = exercise.description || t('exercise_ui:no_description_available', 'No hay descripción disponible.');
  const descriptionKey = normalizeText(exercise.description);

  const translatedDescription = t(descriptionKey, {
    ns: 'exercise_descriptions',
    defaultValue: defaultDescription,
    nsSeparator: false,
    keySeparator: false,
  });

  // Lógica de contraste para OLED:
  const isOled = theme === 'oled';
  const hasVideo = !!exercise.video_url;
  const hasImages = !!exercise.image_url_start;
  const mediaBgClass = (!hasVideo && !hasImages && isOled) ? 'bg-gray-200' : 'bg-bg-primary';

  const isLimitReached = remainingUses === 0;

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
      setRemainingUses(res.remaining);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || "Error al conectar con la IA.";
      setAiError(errorMsg);
      if (errorMsg.includes('agotado') || errorMsg.includes('Límite')) {
        setRemainingUses(0);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-glass-border">
        <button onClick={onBack} className="flex items-center gap-2 p-2 -m-2 rounded-lg hover:bg-white/10">
          <ChevronLeft size={24} />
          <span className="font-semibold">{t('exercise_ui:back', 'Volver')}</span>
        </button>
        <h2 className="text-xl font-bold truncate px-4">
          {translatedName}
        </h2>
        <div className="w-16"></div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Visor de medios */}
        <div className={`mb-6 aspect-video ${mediaBgClass} rounded-xl border border-glass-border overflow-hidden flex items-center justify-center`}>
          {exercise.video_url ? (
            <video
              src={exercise.video_url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain"
            />
          ) : hasImages ? (
            <div className="flex gap-4 w-full h-full p-4">
              <img
                src={exercise.image_url_start}
                alt={`Inicio de ${translatedName}`}
                className="w-1/2 h-full object-contain"
              />
              <img
                src={exercise.image_url_end || exercise.image_url_start}
                alt={`Fin de ${translatedName}`}
                className="w-1/2 h-full object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center text-text-muted">
              <Dumbbell size={64} opacity={0.5} />
            </div>
          )}
        </div>

        {/* Información */}
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

        {/* Descripción Original */}
        <div className="pb-4">
          <h3 className="text-lg font-semibold mb-2">{t('exercise_ui:description', 'Descripción')}</h3>
          <p className="text-text-secondary whitespace-pre-line leading-relaxed">
            {translatedDescription}
          </p>
        </div>

        {/* Sección del Entrenador IA */}
        <div className="mt-4 pt-6 border-t border-glass-border space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-text-primary">
              <Sparkles className="w-5 h-5 text-accent" />
              Técnica y Consejos IA
            </h3>
            {remainingUses !== null && (
              <span className={`text-xs font-medium ${isLimitReached ? 'text-red-500' : 'text-text-secondary'}`}>
                Usos hoy: {remainingUses}
              </span>
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
        {/* Espacio extra al final para scroll cómodo */}
        <div className="h-6"></div>
      </div>

      {/* Footer */}
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