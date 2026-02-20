/* frontend/src/components/RoutineAIGeneratorModal.jsx */
import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, Loader2, Wand2 } from 'lucide-react';
import { useAppTheme } from '../hooks/useAppTheme';
import { askTrainerAI } from '../services/aiService';
import useAppStore from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

const RoutineAIGeneratorModal = ({ isOpen, onClose, onGenerate }) => {
  const { resolvedTheme } = useAppTheme();
  const getOrFetchAllExercises = useAppStore(state => state.getOrFetchAllExercises);
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

  if (!isOpen) return null;

  const isOled = resolvedTheme === 'oled';
  const isDark = resolvedTheme === 'dark';
  
  const containerClass = `w-full max-w-md rounded-3xl shadow-2xl flex flex-col transition-colors duration-300 border ${isOled ? 'border-white/20 bg-black' : isDark ? 'border-white/10 bg-bg-secondary' : 'border-border bg-bg-secondary'}`;
  const inputClass = `w-full p-4 rounded-2xl border resize-none h-32 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all ${isOled ? 'border-white/10 bg-white/5 text-white placeholder-gray-500' : isDark ? 'border-white/5 bg-bg-tertiary text-text-primary placeholder-text-muted' : 'border-border bg-bg-tertiary text-text-primary placeholder-text-muted'}`;

  const isLimitReached = remainingUses === 0 || (error && error.toLowerCase().includes('agotado'));

  const handleGenerate = async () => {
    if (!userPrompt.trim() || isLimitReached) return;

    setIsLoading(true);
    setError(null);
    try {
      const allExercises = await getOrFetchAllExercises();
      const exerciseOptions = allExercises.map(ex => `ID:"${ex.name}"|Nombre:"${t(ex.name, { ns: 'exercise_names', defaultValue: ex.name })}"`).join('\n');

      const aiPrompt = `Actúa como entrenador experto. Usuario pide: "${userPrompt}".
Crea UNA rutina de UN DÍA.
REGLAS:
1. Inventa nombre motivador.
2. Usa SOLO ejercicios de esta lista:
${exerciseOptions}
3. Devuelve SOLO JSON válido.
Formato:
{
  "name": "Nombre rutina",
  "description": "Descripción",
  "ai_explanation": "Explicación detallada de por qué esta rutina es perfecta para el usuario.",
  "folder": "IA",
  "exercises": [{ "name": "ID_EXACTO_EJERCICIO", "sets": 3, "reps": "8-12", "rest_seconds": 90, "ai_reason": "Por qué se eligió este ejercicio" }]
}`;

      const systemContext = "Eres entrenador personal. Crea rutinas deportivas. Si piden otra cosa, devuelve { \"error\": \"Solo creo rutinas deportivas.\" }. Responde SOLO con JSON.";

      const res = await askTrainerAI(aiPrompt, systemContext);
      
      if (res.remaining !== undefined) {
        setRemainingUses(res.remaining);
        localStorage.setItem('ai_remaining_uses', res.remaining);
      }
      if (res.limit !== undefined) {
        setDailyLimit(res.limit);
        localStorage.setItem('ai_daily_limit', res.limit);
      }

      const responseText = typeof res === 'string' ? res : (res.response || JSON.stringify(res));
      const jsonString = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      const generatedRoutine = JSON.parse(jsonString);
      if (generatedRoutine.error) throw new Error(generatedRoutine.error);

      const formattedRoutine = {
        name: generatedRoutine.name || "Rutina IA",
        description: generatedRoutine.description || "Generada por IA",
        ai_explanation: generatedRoutine.ai_explanation || "",
        folder: generatedRoutine.folder || "IA",
        exercises: (generatedRoutine.exercises || []).map((ex, idx) => {
          const dbExercise = allExercises.find(e => e.name === ex.name) || { name: ex.name };
          
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={containerClass}>
        <div className={`p-5 border-b flex justify-between items-center ${isOled ? 'border-white/10' : isDark ? 'border-white/5' : 'border-border'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent text-white shadow-lg shadow-accent/20">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-bold leading-none ${isOled || isDark ? 'text-white' : 'text-text-primary'}`}>Generar con IA</h2>
              <span className={`text-xs font-medium ${isOled || isDark ? 'text-gray-400' : 'text-text-secondary'}`}>Crea tu sesión ideal</span>
            </div>
          </div>
          <button onClick={onClose} disabled={isLoading} className={`p-2 rounded-full transition-colors ${isOled || isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-bg-tertiary text-text-secondary hover:text-text-primary'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className={`text-sm ${isOled || isDark ? 'text-gray-300' : 'text-text-secondary'}`}>
            Describe tu objetivo, equipo disponible o nivel de experiencia.
          </p>

          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            disabled={isLoading || isLimitReached}
            placeholder="Ej: Rutina de hipertrofia para espalda y bíceps con mancuernas."
            className={`${inputClass} ${isLimitReached ? 'opacity-50 cursor-not-allowed' : ''}`}
          />

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {remainingUses !== null && !error && (
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-text-muted">Se restablece a medianoche</span>
              <span className={`text-xs font-bold ${remainingUses === 0 ? 'text-red-500' : 'text-text-secondary'}`}>
                Usos restantes: {remainingUses}{dailyLimit ? `/${dailyLimit}` : ''}
              </span>
            </div>
          )}

          <button 
            onClick={handleGenerate}
            disabled={isLoading || !userPrompt.trim() || isLimitReached}
            className={`w-full p-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all 
              ${isLoading || !userPrompt.trim() || isLimitReached
                ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed border border-transparent' 
                : 'bg-accent text-bg-secondary hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5'}`}
          >
            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Diseñando...</> : 
             isLimitReached ? <><AlertCircle className="w-5 h-5" /> Límite Alcanzado</> : 
             <><Sparkles className="w-5 h-5" /> Generar Rutina</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoutineAIGeneratorModal;