import ModalPortal from './ModalPortal';
/* frontend/src/components/RoutineAIGeneratorModal.jsx */
import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Loader2, Wand2 } from 'lucide-react';
import { useAppTheme } from '../hooks/useAppTheme';
import { askTrainerAI } from '../services/aiService';
import useAppStore from '../store/useAppStore';
import { useTranslation } from 'react-i18next';
import useModalLock from '../hooks/useModalLock';

const RoutineAIGeneratorModal = ({ isOpen, onClose, onGenerate }) => {

  // --- Bloquear scroll del fondo y swipe entre páginas ---
  useModalLock(isOpen);

  const { resolvedTheme } = useAppTheme();
  const getOrFetchAllExercises = useAppStore((state) => state.getOrFetchAllExercises);
  const { t } = useTranslation(['exercise_names']);

  const [userPrompt, setUserPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
    if (isOpen) {
      const lastDate = localStorage.getItem('ai_last_date');
      const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' }); // Formato YYYY-MM-DD

      if (lastDate && lastDate !== today) {
        // Ha cambiado de día, borramos los límites del frontend para dejarle probar
        localStorage.removeItem('ai_remaining_uses');
        localStorage.removeItem('ai_daily_limit');
        setRemainingUses(null);
        setDailyLimit(null);
        setError(null); // Limpiamos cualquier error de "Agotado" anterior
      }

      // Actualizamos la fecha de la "última apertura"
      localStorage.setItem('ai_last_date', today);
    }
  }, [isOpen]);
  // --- FIN DE NUEVA LÓGICA ---

  if (!isOpen) return null;

  const isOled = resolvedTheme === 'oled';
  const isDark = resolvedTheme === 'dark';

  const containerClass = "w-full max-w-md mt-auto sm:mt-0 pb-[calc(2rem+var(--safe-bottom))] sm:pb-0 rounded-t-[32px] rounded-b-none sm:rounded-[32px] shadow-2xl flex flex-col transition-colors duration-300 border border-glass-border bg-bg-primary animate-[slide-up_0.3s_ease-out] sm:animate-[scale-in_0.3s_ease-out]";

  const inputClass = "w-full p-4 rounded-2xl border border-glass-border bg-bg-secondary text-text-primary placeholder-text-muted resize-none h-32 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all";

  const isLimitReached = remainingUses === 0 || error && error.toLowerCase().includes('agotado');

  const handleGenerate = async () => {
    if (!userPrompt.trim() || isLimitReached) return;

    setIsLoading(true);
    setError(null);
    try {
      const allExercises = await getOrFetchAllExercises();
      const exerciseOptions = allExercises.map((ex) => `ID:"${ex.name}"|Nombre:"${t(ex.name, { ns: 'exercise_names', defaultValue: ex.name })}"`).join('\n');

      const aiPrompt = `Actúa como entrenador experto. El usuario te pide crear una rutina con este mensaje: "${userPrompt}".

PASO 1: Evalúa si el mensaje tiene sentido para crear una rutina deportiva (ej. menciona músculos, objetivos, días, etc.).
- Si el mensaje es un saludo ("hola"), es ambiguo, o NO está relacionado con fitness, DEBES RECHAZARLO.
- Si el usuario pide MÁS DE UNA rutina o una rutina de varios días que no se pueda unificar en una sola sesión, DEBES RECHAZARLO explicando que solo puedes crear una rutina por consulta.

PASO 2: Si es VÁLIDO, crea UNA rutina de UN DÍA usando SOLO los ejercicios de esta lista:
${exerciseOptions}

PASO 3: Devuelve SOLO un objeto JSON válido (sin texto extra ni markdown).
FORMATO SI ES RECHAZADO:
{
  "isValid": false,
  "error": "El mensaje no es válido o has pedido más de una rutina. Solo puedo generar una rutina de un día por petición. Por favor, sé más específico sobre tu objetivo para esta rutina."
}

FORMATO SI ES VÁLIDO:
{
  "isValid": true,
  "name": "Nombre motivador de la rutina",
  "description": "Descripción corta",
  "ai_explanation": "Explicación detallada de por qué esta rutina es perfecta para el usuario.",
  "folder": "IA",
  "exercises": [{ "name": "ID_EXACTO_EJERCICIO", "sets": 3, "reps": "8-12", "rest_seconds": 90, "ai_reason": "Por qué se eligió este ejercicio" }]
}`;

      const systemContext = "Eres un entrenador personal estricto. Tu única salida debe ser un JSON válido siguiendo el formato exacto requerido. Nunca añadas explicaciones fuera del JSON.";

      const res = await askTrainerAI(aiPrompt, systemContext);

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

      const responseText = typeof res === 'string' ? res : res.response || JSON.stringify(res);
      const jsonString = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

      const generatedRoutine = JSON.parse(jsonString);

      if (generatedRoutine.isValid === false || generatedRoutine.error) {
        throw new Error(generatedRoutine.error || "El mensaje no es válido para generar una rutina. Sé más específico.");
      }

      const formattedRoutine = {
        name: generatedRoutine.name || "Rutina IA",
        description: generatedRoutine.description || "Generada por IA",
        ai_explanation: generatedRoutine.ai_explanation || "",
        folder: generatedRoutine.folder || "IA",
        exercises: (generatedRoutine.exercises || []).map((ex, idx) => {
          const dbExercise = allExercises.find((e) => e.name === ex.name) || { name: ex.name };

          return {
            ...dbExercise,
            tempId: `temp_ai_${Date.now()}_${idx}`,
            sets: Number(ex.sets) || 3,
            reps: String(ex.reps || "10"),
            rest_seconds: Number(ex.rest_seconds) || 60,
            ai_reason: ex.ai_reason || "",
            exercise_order: idx
          };
        })
      };

      onGenerate(formattedRoutine);
      onClose();
      setUserPrompt('');
    } catch (err) {
      const data = err.response?.data || {};
      const errorMsg = data.error || err.message || "Error al generar.";
      setError(errorMsg);
      if (errorMsg.includes('agotado') || errorMsg.includes('Límite')) {
        setRemainingUses(0);
        localStorage.setItem('ai_remaining_uses', '0');
        if (data.limit !== undefined) {
          setDailyLimit(data.limit);
          localStorage.setItem('ai_daily_limit', data.limit);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return <ModalPortal>
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
      <div className={containerClass}>
        {/* Drag handle for mobile */}
        <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mt-4 sm:hidden shrink-0" />
        <div className="p-5 border-b border-glass-border flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent text-white shadow-lg shadow-accent/20">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-none text-text-primary">Generar con IA</h2>
              <span className="text-xs font-medium text-text-secondary">Crea tu sesión ideal</span>
            </div>
          </div>
          <button onClick={onClose} disabled={isLoading} className="p-2 rounded-full transition-colors hover:bg-bg-tertiary text-text-secondary hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-text-secondary">
            Describe tu objetivo, equipo disponible o nivel de experiencia.
          </p>

          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            disabled={isLoading || isLimitReached}
            placeholder="Ej: Rutina de hipertrofia para espalda y bíceps con mancuernas."
            className={`${inputClass} ${isLimitReached ? 'opacity-50 cursor-not-allowed' : ''}`} />
          

          {error &&
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          }

          {remainingUses !== null && !error &&
          <div className="flex justify-between items-center">
              <span className="text-[10px] text-text-muted">Se restablece a medianoche</span>
              <span className={`text-xs font-bold ${remainingUses === 0 ? 'text-red-500' : 'text-text-secondary'}`}>
                Usos restantes: {remainingUses}{dailyLimit ? `/${dailyLimit}` : ''}
              </span>
            </div>
          }

          <button
            onClick={handleGenerate}
            disabled={isLoading || !userPrompt.trim() || isLimitReached}
            className={`w-full p-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all 
              ${isLoading || !userPrompt.trim() || isLimitReached ?
            'bg-gray-500/20 text-gray-400 cursor-not-allowed border border-transparent' :
            'bg-accent text-bg-secondary hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5'}`}>
            
            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Diseñando...</> :
            isLimitReached ? <><AlertCircle className="w-5 h-5" /> Límite Alcanzado</> :
            <><Sparkles className="w-5 h-5" /> Generar Rutina</>}
          </button>
        </div>
      </div>
    </div></ModalPortal>;

};

export default RoutineAIGeneratorModal;