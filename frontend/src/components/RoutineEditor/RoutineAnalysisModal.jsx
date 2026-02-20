/* frontend/src/components/RoutineEditor/RoutineAnalysisModal.jsx */
import React, { useMemo, useState } from 'react';
import { X, Activity, Layers, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { analyzeRoutine } from '../../utils/trainerLogic'; 
import { useAppTheme } from '../../hooks/useAppTheme';
import { askTrainerAI } from '../../services/aiService';

const RoutineAnalysisModal = ({ isOpen, onClose, exercises = [] }) => {
  const { resolvedTheme } = useAppTheme();
  const analysis = useMemo(() => analyzeRoutine(exercises), [exercises]);
  
  const [aiResponse, setAiResponse] = useState(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
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

  if (!isOpen) return null;

  const isOled = resolvedTheme === 'oled';
  const isDark = resolvedTheme === 'dark';
  
  const containerBorderClass = isOled ? 'border-white/20' : isDark ? 'border-white/10' : 'border-border';
  const innerBorderClass = isOled ? 'border-white/10' : isDark ? 'border-white/5' : 'border-border';
  const progressTrackClass = (isOled || isDark) ? 'bg-white/10' : 'bg-gray-200';

  const getBarColor = (type) => {
    switch (type) {
      case 'push': return 'bg-blue-500';
      case 'pull': return 'bg-emerald-500';
      case 'legs': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const handleAskAI = async () => {
    setIsLoadingAi(true);
    setAiError(null);
    try {
      const context = exercises.map(e => `- ${e.name} (${e.sets || 0} series de ${e.reps || 0} reps)`).join('\n');
      
      const prompt = "Analiza esta sesión de entrenamiento asumiendo que es parte de una rutina dividida (split). Enfócate solo en evaluar el volumen, la selección de ejercicios y el equilibrio biomecánico de los músculos que ya están incluidos, sin quejarte de los músculos que faltan. Dame 3 sugerencias breves y directas de mejora.";
      
      const res = await askTrainerAI(prompt, context);
      setAiResponse(res.response);
      
      if (res.remaining !== undefined) {
        setRemainingUses(res.remaining);
        localStorage.setItem('ai_remaining_uses', res.remaining);
      }
      if (res.limit !== undefined) {
        setDailyLimit(res.limit);
        localStorage.setItem('ai_daily_limit', res.limit);
      }
    } catch (error) {
      const data = error.response?.data || {};
      const errorMsg = data.error || error.message || "Error al conectar con el Entrenador IA.";
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
      setIsLoadingAi(false);
    }
  };

  const handleClearAI = () => {
    setAiResponse(null);
    setAiError(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col transition-colors duration-300 border ${containerBorderClass} ${isOled ? 'bg-black' : 'bg-bg-secondary'}`}>
        
        {/* Header */}
        <div className={`p-5 border-b flex justify-between items-center sticky top-0 z-10 backdrop-blur-md ${isOled ? 'bg-black/80 border-white/10' : `bg-bg-secondary/95 ${isDark ? 'border-white/5' : 'border-border'}`}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent text-white shadow-lg shadow-accent/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-bold leading-none ${isOled || isDark ? 'text-white' : 'text-text-primary'}`}>Análisis de Rutina</h2>
              <span className={`text-xs font-medium ${isOled || isDark ? 'text-gray-400' : 'text-text-secondary'}`}>IA Trainer Insights</span>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isOled || isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-bg-tertiary text-text-secondary hover:text-text-primary'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {!analysis || exercises.length === 0 ? (
             <div className={`text-center py-8 ${isOled || isDark ? 'text-gray-500' : 'text-text-tertiary'}`}>
               <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>Añade ejercicios para ver el análisis.</p>
             </div>
          ) : (
            <>
              {/* Stats Grid Locales */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-2xl border flex flex-col gap-1 ${innerBorderClass} ${isOled ? 'bg-white/5' : 'bg-bg-tertiary'}`}>
                  <span className={`text-xs uppercase tracking-wider font-bold ${isOled || isDark ? 'text-gray-400' : 'text-text-secondary'}`}>Series Totales</span>
                  <div className="flex items-end gap-2">
                    <span className={`text-3xl font-black ${isOled || isDark ? 'text-white' : 'text-text-primary'}`}>{analysis.stats.totalSets}</span>
                  </div>
                </div>
                <div className={`p-4 rounded-2xl border flex flex-col gap-1 ${innerBorderClass} ${isOled ? 'bg-white/5' : 'bg-bg-tertiary'}`}>
                  <span className={`text-xs uppercase tracking-wider font-bold ${isOled || isDark ? 'text-gray-400' : 'text-text-secondary'}`}>Enfoque</span>
                  <div className="flex items-end gap-2">
                    <span className={`text-lg font-bold truncate ${isOled || isDark ? 'text-white' : 'text-text-primary'}`}>
                      {Math.max(analysis.stats.push, analysis.stats.pull, analysis.stats.legs) === analysis.stats.push ? 'Empuje' : Math.max(analysis.stats.push, analysis.stats.pull, analysis.stats.legs) === analysis.stats.pull ? 'Tracción' : 'Pierna'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Distribución Muscular */}
              <div className="space-y-3">
                <h3 className={`text-sm font-semibold ml-1 ${isOled || isDark ? 'text-white/90' : 'text-text-primary'}`}>Distribución de Trabajo</h3>
                {['push', 'pull', 'legs'].map(type => (
                  <div key={type} className="space-y-1">
                    <div className={`flex justify-between text-xs ${isOled || isDark ? 'text-gray-400' : 'text-text-secondary'}`}>
                      <span>{type === 'push' ? 'Empuje' : type === 'pull' ? 'Tracción' : 'Pierna'}</span>
                      <span>{analysis.stats[type]} series</span>
                    </div>
                    <div className={`h-2 w-full rounded-full overflow-hidden ${progressTrackClass}`}>
                      <div className={`h-full ${getBarColor(type)}`} style={{ width: `${(analysis.stats[type] / Math.max(analysis.stats.totalSets, 1)) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* IA Real */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center ml-1">
                  <h3 className={`text-sm font-semibold flex items-center gap-2 ${isOled || isDark ? 'text-white/90' : 'text-text-primary'}`}>
                    <Sparkles className="w-4 h-4 text-accent" />
                    Entrenador IA
                  </h3>
                  {remainingUses !== null && (
                    <div className="text-right">
                      <span className="text-xs font-medium text-text-secondary block">
                        Usos restantes: {remainingUses}{dailyLimit ? `/${dailyLimit}` : ''}
                      </span>
                      <span className="text-[10px] text-text-muted block">Se restablece a medianoche</span>
                    </div>
                  )}
                </div>

                {!aiResponse && !isLoadingAi && (
                  <button 
                    onClick={handleAskAI}
                    className={`w-full p-4 rounded-2xl border border-accent/30 bg-accent/10 text-accent font-bold flex items-center justify-center gap-2 transition-transform active:scale-95`}
                  >
                    <Sparkles className="w-5 h-5" />
                    Analizar con IA
                  </button>
                )}

                {isLoadingAi && (
                  <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 ${innerBorderClass} ${isOled ? 'bg-white/5' : 'bg-bg-tertiary'}`}>
                    <Loader2 className="w-6 h-6 text-accent animate-spin" />
                    <span className="text-sm text-text-secondary">Analizando biomecánica y volumen...</span>
                  </div>
                )}

                {aiError && (
                  <div className="space-y-2">
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-3 items-start">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-500">{aiError}</p>
                    </div>
                    <button 
                      onClick={handleClearAI}
                      className="w-full py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                    >
                      Descartar error
                    </button>
                  </div>
                )}

                {aiResponse && (
                  <div className="space-y-2">
                    <div className={`p-4 rounded-2xl border space-y-2 text-sm leading-relaxed whitespace-pre-wrap ${innerBorderClass} ${isOled ? 'bg-white/5 text-gray-300' : 'bg-bg-tertiary text-text-secondary'}`}>
                      {aiResponse}
                    </div>
                    <button 
                      onClick={handleClearAI}
                      className="w-full py-2 text-sm font-medium text-text-secondary hover:text-red-500 transition-colors"
                    >
                      Borrar análisis
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoutineAnalysisModal;