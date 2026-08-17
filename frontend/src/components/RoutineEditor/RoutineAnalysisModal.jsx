import ModalPortal from '../ModalPortal';
/* frontend/src/components/RoutineEditor/RoutineAnalysisModal.jsx */
import React, { useMemo, useState, useEffect } from 'react';
import { X, Activity, Layers, Sparkles, AlertCircle, Loader2, ArrowUpRight, ArrowDownRight, Dumbbell, Target, Flame } from 'lucide-react';
import { analyzeRoutine } from '../../utils/trainerLogic';
import { useAppTheme } from '../../hooks/useAppTheme';
import { askTrainerAI } from '../../services/aiService';
import useModalLock from '../../hooks/useModalLock';

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

  // --- Animación de barras al montar ---
  const [animateBars, setAnimateBars] = useState(false);
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setAnimateBars(true), 150);
      return () => clearTimeout(timer);
    } else {
      setAnimateBars(false);
    }
  }, [isOpen]);

  // --- Efecto para cerrar modal si se navega a otra vista ---
  useEffect(() => {
    const handleNav = () => {
      onClose();
    };
    window.addEventListener('app_navigated', handleNav);
    return () => window.removeEventListener('app_navigated', handleNav);
  }, [onClose]);

  // --- Bloquear scroll del fondo y swipe entre páginas ---
  useModalLock(isOpen);

  // --- NUEVA LÓGICA: Comprobación de cambio de día ---
  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen]);
  // --- FIN DE NUEVA LÓGICA ---

  if (!isOpen) return null;

  const isOled = resolvedTheme === 'oled';
  const isDark = resolvedTheme === 'dark';

  const containerBorderClass = isOled ? 'border-white/20' : isDark ? 'border-white/10' : 'border-border';
  const innerBorderClass = isOled ? 'border-white/10' : isDark ? 'border-white/5' : 'border-border';
  const progressTrackClass = isOled ? 'bg-white/10' : isDark ? 'bg-white/5' : 'bg-gray-100';

  const getBarColor = (type) => {
    switch (type) {
      case 'push': return 'bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]';
      case 'pull': return 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
      case 'legs': return 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'push': return <ArrowUpRight className="w-4 h-4 text-cyan-400" />;
      case 'pull': return <ArrowDownRight className="w-4 h-4 text-emerald-400" />;
      case 'legs': return <Dumbbell className="w-4 h-4 text-purple-400" />;
      default: return null;
    }
  };

  const handleAskAI = async () => {
    setIsLoadingAi(true);
    setAiError(null);
    try {
      const context = exercises.map((e) => `- ${e.name} (${e.sets || 0} series de ${e.reps || 0} reps)`).join('\n');

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

      // Guardamos la fecha de la última petición exitosa
      const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
      localStorage.setItem('ai_last_date', today);

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

  const isLimitReached = remainingUses === 0 || aiError && aiError.toLowerCase().includes('agotado');

  return (
    // Añadido pb-20 para asegurar que no se solape con navbars inferiores en móviles
    <ModalPortal><div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-md max-h-[85vh] mt-auto sm:mt-0 flex flex-col rounded-t-[32px] rounded-b-none sm:rounded-3xl shadow-2xl transition-colors duration-300 border overflow-hidden pb-[calc(2rem+var(--safe-bottom))] sm:pb-0 animate-[slide-up_0.3s_ease-out] sm:animate-none ${containerBorderClass} ${isOled ? 'bg-black' : 'bg-bg-secondary'}`}>
        {/* Drag handle for mobile */}
        <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mt-4 sm:hidden shrink-0" />
        
        {/* Header - Fijo */}
        <div className={`p-5 border-b flex justify-between items-center shrink-0 backdrop-blur-md ${isOled ? 'bg-black/80 border-white/10' : `bg-bg-secondary/95 ${isDark ? 'border-white/5' : 'border-border'}`}`}>
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

        {/* Content - Scrolleable */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1 scrollbar-hide">
          {!analysis || exercises.length === 0 ?
            <div className={`text-center py-8 ${isOled || isDark ? 'text-gray-500' : 'text-text-tertiary'}`}>
               <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>Añade ejercicios para ver el análisis.</p>
             </div> :

            <>
              {/* Stats Grid Flashy */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-5 rounded-[24px] border relative overflow-hidden flex flex-col gap-1 transition-transform duration-300 hover:scale-[1.02] ${innerBorderClass} ${isOled ? 'bg-gradient-to-br from-white/10 to-transparent' : 'bg-gradient-to-br from-bg-tertiary to-bg-secondary'}`}>
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Layers className="w-16 h-16" />
                  </div>
                  <span className={`text-[10px] uppercase tracking-widest font-bold z-10 ${isOled || isDark ? 'text-gray-400' : 'text-text-secondary'}`}>Total Series</span>
                  <div className="flex items-end gap-2 z-10 mt-1">
                    <span className={`text-4xl font-black tracking-tighter ${isOled || isDark ? 'text-white' : 'text-text-primary'}`}>{analysis.stats.totalSets}</span>
                  </div>
                </div>

                <div className={`p-5 rounded-[24px] border relative overflow-hidden flex flex-col gap-1 transition-transform duration-300 hover:scale-[1.02] ${innerBorderClass} ${isOled ? 'bg-gradient-to-bl from-accent/20 to-transparent border-accent/30' : 'bg-gradient-to-bl from-accent/10 to-bg-secondary border-accent/20'}`}>
                  <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Target className="w-16 h-16 text-accent" />
                  </div>
                  <span className={`text-[10px] uppercase tracking-widest font-bold z-10 ${isOled || isDark ? 'text-accent/80' : 'text-accent'}`}>Enfoque Principal</span>
                  <div className="flex items-center gap-2 z-10 mt-2">
                    {(() => {
                      const max = Math.max(analysis.stats.push, analysis.stats.pull, analysis.stats.legs);
                      const focus = max === analysis.stats.push ? 'push' : max === analysis.stats.pull ? 'pull' : 'legs';
                      const label = focus === 'push' ? 'Empuje' : focus === 'pull' ? 'Tracción' : 'Pierna';
                      return (
                        <>
                          <div className={`p-1.5 rounded-full bg-black/20 backdrop-blur-sm`}>
                            {getTypeIcon(focus)}
                          </div>
                          <span className={`text-xl font-extrabold tracking-tight ${isOled || isDark ? 'text-white' : 'text-text-primary'}`}>{label}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Distribución Muscular Animada */}
              <div className={`p-5 rounded-[24px] border ${innerBorderClass} ${isOled ? 'bg-white/5' : 'bg-bg-tertiary'} space-y-5 shadow-inner`}>
                <h3 className={`text-xs uppercase tracking-widest font-bold flex items-center gap-2 ${isOled || isDark ? 'text-gray-400' : 'text-text-secondary'}`}>
                  <Flame className="w-4 h-4 text-orange-500" />
                  Distribución Muscular
                </h3>
                <div className="space-y-4">
                  {['push', 'pull', 'legs'].map((type) => {
                    const percentage = Math.max((analysis.stats[type] / Math.max(analysis.stats.totalSets, 1)) * 100, 0);
                    return (
                      <div key={type} className="space-y-2 group cursor-default">
                        <div className="flex justify-between items-center text-sm">
                          <div className={`flex items-center gap-2 font-bold ${isOled || isDark ? 'text-white/90' : 'text-text-primary'}`}>
                            {getTypeIcon(type)}
                            <span>{type === 'push' ? 'Empuje' : type === 'pull' ? 'Tracción' : 'Pierna'}</span>
                          </div>
                          <span className={`font-black tracking-tight ${isOled || isDark ? 'text-white' : 'text-text-primary'}`}>{analysis.stats[type]} <span className={`text-xs font-medium ${isOled || isDark ? 'text-gray-500' : 'text-text-tertiary'}`}>series</span></span>
                        </div>
                        <div className={`h-2.5 w-full rounded-full overflow-hidden ${progressTrackClass} shadow-inner relative`}>
                          <div 
                            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${getBarColor(type)}`} 
                            style={{ width: animateBars ? `${percentage}%` : '0%' }} 
                          >
                            <div className="absolute inset-0 bg-white/20 w-1/2 -skew-x-12 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-1000 ease-in-out" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* IA Real */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center ml-1">
                  <h3 className={`text-sm font-semibold flex items-center gap-2 ${isOled || isDark ? 'text-white/90' : 'text-text-primary'}`}>
                    <Sparkles className="w-4 h-4 text-accent" />
                    Entrenador IA
                  </h3>
                  {remainingUses !== null &&
                  <div className="text-right">
                      <span className={`text-xs font-bold block ${remainingUses === 0 ? 'text-red-500' : 'text-text-secondary'}`}>
                        Usos restantes: {remainingUses}{dailyLimit ? `/${dailyLimit}` : ''}
                      </span>
                      <span className="text-[10px] text-text-muted block">Se restablece a medianoche</span>
                    </div>
                  }
                </div>

                {!aiResponse && !isLoadingAi &&
                <button
                  onClick={handleAskAI}
                  disabled={isLimitReached}
                  className={`w-full p-4 rounded-2xl border font-bold flex items-center justify-center gap-2 transition-transform ${
                  isLimitReached ?
                  'bg-gray-500/20 text-gray-400 cursor-not-allowed border-transparent' :
                  'border-accent/30 bg-accent/10 text-accent active:scale-95'}`
                  }>
                  
                    {isLimitReached ?
                  <><AlertCircle className="w-5 h-5" /> Límite Alcanzado</> :

                  <><Sparkles className="w-5 h-5" /> Analizar con IA</>
                  }
                  </button>
                }

                {isLoadingAi &&
                <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 ${innerBorderClass} ${isOled ? 'bg-white/5' : 'bg-bg-tertiary'}`}>
                    <Loader2 className="w-6 h-6 text-accent animate-spin" />
                    <span className="text-sm text-text-secondary">Analizando biomecánica y volumen...</span>
                  </div>
                }

                {aiError &&
                <div className="space-y-2">
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-3 items-start">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-500">{aiError}</p>
                    </div>
                    <button
                    onClick={handleClearAI}
                    className="w-full py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                    
                      Descartar error
                    </button>
                  </div>
                }

                {aiResponse &&
                <div className="space-y-2">
                    <div className={`p-4 rounded-2xl border space-y-2 text-sm leading-relaxed whitespace-pre-wrap ${innerBorderClass} ${isOled ? 'bg-white/5 text-gray-300' : 'bg-bg-tertiary text-text-secondary'}`}>
                      {aiResponse}
                    </div>
                    <button
                    onClick={handleClearAI}
                    className="w-full py-2 text-sm font-medium text-text-secondary hover:text-red-500 transition-colors">
                    
                      Borrar análisis
                    </button>
                  </div>
                }
              </div>
            </>
            }
        </div>
      </div>
    </div></ModalPortal>);

};

export default RoutineAnalysisModal;