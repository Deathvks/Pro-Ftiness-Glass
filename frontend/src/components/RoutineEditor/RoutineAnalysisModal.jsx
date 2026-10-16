import ModalPortal from '../ModalPortal';
/* frontend/src/components/RoutineEditor/RoutineAnalysisModal.jsx */
import React, { useMemo, useState, useEffect } from 'react';
import { X, Activity, Layers, Sparkles, AlertCircle, Loader2, ArrowUpRight, ArrowDownRight, Dumbbell, Target, Flame, Lightbulb, CheckCircle2, CircleDot, ClipboardList } from 'lucide-react';
import { analyzeRoutine } from '../../utils/trainerLogic';
import { useAppTheme } from '../../hooks/useAppTheme';
import { askTrainerAI } from '../../services/aiService';
import useModalLock from '../../hooks/useModalLock';

const MUSCLE_LABELS = {
  chest: 'Pecho', pecho: 'Pecho', pectoral: 'Pecho', back: 'Espalda', espalda: 'Espalda', dorsal: 'Espalda', lats: 'Dorsal',
  shoulders: 'Hombros', hombros: 'Hombros', deltoides: 'Deltoides', biceps: 'Bíceps', 'bíceps': 'Bíceps',
  triceps: 'Tríceps', 'tríceps': 'Tríceps', legs: 'Piernas', pierna: 'Piernas', quads: 'Cuádriceps',
  hamstrings: 'Isquios', glutes: 'Glúteos', gluteos: 'Glúteos', calves: 'Gemelos', core: 'Core', abs: 'Abdominales',
  forearm: 'Antebrazo', forearms: 'Antebrazos', traps: 'Trapecio', trapezoids: 'Trapecio', other: 'Otros', unknown: 'Sin clasificar'
};
const formatPlannedSets = value => Number.isInteger(value) ? value : value.toFixed(1);

const RoutineAnalysisModal = ({ isOpen, onClose, exercises = [] }) => {
  const { resolvedTheme } = useAppTheme();
  const [analysisAnswers, setAnalysisAnswers] = useState({});
  const analysis = useMemo(() => analyzeRoutine(exercises, analysisAnswers), [exercises, analysisAnswers]);

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
      const context = exercises.map((exercise) => {
        const plannedSets = Array.isArray(exercise.sets)
          ? exercise.sets.length || 3
          : Number(exercise.sets) || 3;
        const muscleGroup = Array.isArray(exercise.muscle_group)
          ? exercise.muscle_group.join(', ')
          : exercise.muscle_group || exercise.target || exercise.category || 'sin clasificar';
        return `- ${exercise.name}: ${plannedSets} series, ${exercise.reps || 'repeticiones no indicadas'} reps, descanso ${exercise.rest_seconds || 'no indicado'} s, grupo muscular: ${muscleGroup}`;
      }).join('\n');

      const prompt = 'Analiza esta sesión como parte de una rutina dividida; no critiques la ausencia de músculos que pueden entrenarse en otros días. Responde en español con los apartados «Valoración general», «Puntos fuertes» y «Ajustes recomendados». Propón hasta 3 ajustes concretos, indicando el ejercicio o grupo al que afectan, qué cambiarías y por qué. Usa solo los datos proporcionados, señala cuando algo no se pueda concluir y no inventes ejercicios, cargas ni objetivos.';

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
  const focusType = analysis
    ? ['push', 'pull', 'legs', 'core'].reduce((best, type) => analysis.stats[type] > analysis.stats[best] ? type : best, 'push')
    : 'push';
  const focusLabel = { push: 'Empuje', pull: 'Tracción', legs: 'Pierna', core: 'Core' }[focusType];
  const averageSets = exercises.length ? (analysis.stats.totalSets / exercises.length).toFixed(1) : '0';
  const muscleEntries = analysis
    ? Object.entries(analysis.stats.muscles)
      .filter(([muscle]) => !['unknown', 'other'].includes(muscle))
      .sort((a, b) => b[1] - a[1])
    : [];
  const previewSuggestions = analysis ? [...analysis.suggestions] : [];
  const unclassifiedSets = analysis ? (analysis.stats.muscles.unknown || 0) + (analysis.stats.muscles.other || 0) : 0;
  const topMuscle = muscleEntries[0];
  if (analysis && topMuscle && analysis.stats.totalSets >= 8 && topMuscle[1] / analysis.stats.totalSets >= 0.5) {
    const percentage = Math.round((topMuscle[1] / analysis.stats.totalSets) * 100);
    const label = MUSCLE_LABELS[topMuscle[0]] || topMuscle[0];
    previewSuggestions.push({
      type: 'tip',
      title: `Especialización en ${label}`,
      text: `${label} concentra ${percentage}% de las series. Es coherente en un día de especialización; si buscas una sesión más equilibrada, reparte parte del volumen entre otros grupos.`
    });
  }
  if (unclassifiedSets > 0) {
    previewSuggestions.push({
      type: 'tip',
      title: 'Completa los grupos musculares',
      text: `${unclassifiedSets} ${unclassifiedSets === 1 ? 'serie no tiene' : 'series no tienen'} un grupo muscular reconocido. Asignarlo mejora la precisión del reparto y de las recomendaciones.`
    });
  }

  return (
    // Añadido pb-20 para asegurar que no se solape con navbars inferiores en móviles
    <ModalPortal><div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-md max-h-[85vh] mt-auto sm:mt-0 flex flex-col rounded-t-[32px] rounded-b-none sm:rounded-3xl shadow-2xl transition-colors duration-300 border overflow-hidden pb-[calc(2rem+var(--safe-bottom))] sm:pb-0 animate-[slide-up_0.3s_ease-out] sm:animate-none ${containerBorderClass} ${isOled ? 'bg-black' : 'bg-bg-secondary'}`}>
        {/* Drag handle for mobile */}
        <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mt-4 sm:hidden shrink-0" />
        
        {/* Header - Fijo */}
        <div className={`p-5 border-b flex justify-between items-center shrink-0 backdrop-blur-md ${isOled ? 'bg-black/80 border-white/10' : `bg-bg-secondary/95 ${isDark ? 'border-white/5' : 'border-border'}`}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent text-accent-contrast shadow-lg shadow-accent/20">
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
              <div className={`flex items-start gap-3 rounded-[20px] border border-accent/20 bg-accent/5 p-4 ${isOled ? 'text-gray-300' : 'text-text-secondary'}`}>
                <div className="rounded-xl bg-accent/10 p-2 text-accent"><Sparkles className="h-5 w-5" /></div>
                <div>
                  <h3 className={`text-sm font-extrabold ${isOled || isDark ? 'text-white' : 'text-text-primary'}`}>Vista previa de la rutina</h3>
                  <p className="mt-1 text-xs leading-relaxed">Revisa el volumen y el reparto muscular. Estas observaciones se calculan antes de pedir el análisis personalizado a la IA.</p>
                </div>
              </div>

              {/* Resumen de estructura */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className={`p-5 rounded-[24px] border relative overflow-hidden flex flex-col gap-1 transition-transform duration-300 hover:scale-[1.02] ${innerBorderClass} ${isOled ? 'bg-gradient-to-br from-white/10 to-transparent' : 'bg-gradient-to-br from-bg-tertiary to-bg-secondary'}`}>
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Layers className="w-16 h-16" />
                  </div>
                  <span className={`text-[10px] uppercase tracking-widest font-bold z-10 ${isOled || isDark ? 'text-gray-400' : 'text-text-secondary'}`}>Total Series</span>
                  <div className="flex items-end gap-2 z-10 mt-1">
                    <span className={`text-4xl font-black tracking-tighter ${isOled || isDark ? 'text-white' : 'text-text-primary'}`}>{analysis.stats.totalSets}</span>
                  </div>
                </div>

                <div className={`p-5 rounded-[24px] border relative overflow-hidden flex flex-col gap-1 ${innerBorderClass} ${isOled ? 'bg-white/5' : 'bg-bg-tertiary'}`}>
                  <div className="absolute top-0 right-0 p-4 opacity-10"><ClipboardList className="w-14 h-14" /></div>
                  <span className={`text-[10px] uppercase tracking-widest font-bold z-10 ${isOled || isDark ? 'text-gray-400' : 'text-text-secondary'}`}>Ejercicios</span>
                  <span className={`text-3xl font-black tracking-tighter z-10 mt-1 ${isOled || isDark ? 'text-white' : 'text-text-primary'}`}>{exercises.length}</span>
                </div>

                <div className={`p-5 rounded-[24px] border relative overflow-hidden flex flex-col gap-1 ${innerBorderClass} ${isOled ? 'bg-white/5' : 'bg-bg-tertiary'}`}>
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Activity className="w-14 h-14" /></div>
                  <span className={`text-[10px] uppercase tracking-widest font-bold z-10 ${isOled || isDark ? 'text-gray-400' : 'text-text-secondary'}`}>Media por ejercicio</span>
                  <span className={`text-3xl font-black tracking-tighter z-10 mt-1 ${isOled || isDark ? 'text-white' : 'text-text-primary'}`}>{averageSets}</span>
                  <span className="text-[10px] text-text-muted">series</span>
                </div>

                <div className={`p-5 rounded-[24px] border relative overflow-hidden flex flex-col gap-1 transition-transform duration-300 hover:scale-[1.02] ${innerBorderClass} ${isOled ? 'bg-gradient-to-bl from-accent/20 to-transparent border-accent/30' : 'bg-gradient-to-bl from-accent/10 to-bg-secondary border-accent/20'}`}>
                  <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Target className="w-16 h-16 text-accent" />
                  </div>
                  <span className={`text-[10px] uppercase tracking-widest font-bold z-10 ${isOled || isDark ? 'text-accent/80' : 'text-accent'}`}>Enfoque Principal</span>
                  <div className="flex items-center gap-2 z-10 mt-2">
                    <div className="p-1.5 rounded-full bg-black/20 backdrop-blur-sm">{focusType === 'core' ? <CircleDot className="h-4 w-4 text-amber-400" /> : getTypeIcon(focusType)}</div>
                    <span className={`text-xl font-extrabold tracking-tight ${isOled || isDark ? 'text-white' : 'text-text-primary'}`}>{analysis.stats[focusType] > 0 ? focusLabel : 'Variado'}</span>
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
                  {['push', 'pull', 'legs', 'core'].map((type) => {
                    const percentage = Math.max((analysis.stats[type] / Math.max(analysis.stats.totalSets, 1)) * 100, 0);
                    return (
                      <div key={type} className="space-y-2 group cursor-default">
                        <div className="flex justify-between items-center text-sm">
                          <div className={`flex items-center gap-2 font-bold ${isOled || isDark ? 'text-white/90' : 'text-text-primary'}`}>
                            {type === 'core' ? <CircleDot className="w-4 h-4 text-amber-400" /> : getTypeIcon(type)}
                            <span>{{ push: 'Empuje', pull: 'Tracción', legs: 'Pierna', core: 'Core' }[type]}</span>
                          </div>
                          <span className={`font-black tracking-tight ${isOled || isDark ? 'text-white' : 'text-text-primary'}`}>{formatPlannedSets(analysis.stats[type])} <span className={`text-xs font-medium ${isOled || isDark ? 'text-gray-500' : 'text-text-tertiary'}`}>series eq.</span></span>
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

                {muscleEntries.length > 0 && (
                  <div className={`rounded-[24px] border p-5 ${innerBorderClass} ${isOled ? 'bg-white/5' : 'bg-bg-tertiary'}`}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className={`text-xs font-bold uppercase tracking-widest ${isOled || isDark ? 'text-gray-400' : 'text-text-secondary'}`}>Series por músculo</h3>
                      <span className="text-[10px] font-semibold text-text-muted">Series equivalentes</span>
                    </div>
                    <div className="space-y-3">
                      {muscleEntries.slice(0, 6).map(([muscle, sets]) => {
                        const percentage = Math.min((sets / Math.max(analysis.stats.totalSets, 1)) * 100, 100);
                        const label = MUSCLE_LABELS[muscle] || muscle.replace(/[_-]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
                        return (
                          <div key={muscle}>
                            <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                              <span className={`font-bold ${isOled || isDark ? 'text-white/90' : 'text-text-primary'}`}>{label}</span>
                              <span className="font-extrabold text-text-secondary">{formatPlannedSets(sets)} <span className="font-medium text-text-muted">series · {Math.round(percentage)}%</span></span>
                            </div>
                            <div className={`h-2 overflow-hidden rounded-full ${progressTrackClass}`}>
                              <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: animateBars ? `${percentage}%` : '0%' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {(analysis.questions.length > 0 || previewSuggestions.length > 0) && (
                <div className="space-y-3">
                  {analysis.questions.map(question => (
                    <div key={question.id} className={`rounded-[24px] border border-sky-500/20 bg-sky-500/5 p-5 ${isOled ? 'text-gray-300' : 'text-text-secondary'}`}>
                      <div className="mb-3 flex items-start gap-2.5">
                        <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                        <p className={`text-sm font-bold ${isOled || isDark ? 'text-white' : 'text-text-primary'}`}>{question.text}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 pl-7">
                        {question.options.map(option => (
                          <button
                            key={String(option.value)}
                            type="button"
                            onClick={() => setAnalysisAnswers(previous => ({ ...previous, [question.id]: option.value }))}
                            className={`rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${analysisAnswers[question.id] === option.value ? 'bg-accent text-accent-contrast' : 'bg-glass-bg text-text-secondary hover:text-text-primary'}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {previewSuggestions.length > 0 && (
                    <div className={`rounded-[24px] border p-5 ${innerBorderClass} ${isOled ? 'bg-white/5' : 'bg-bg-tertiary'}`}>
                      <h3 className={`mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${isOled || isDark ? 'text-gray-300' : 'text-text-secondary'}`}>
                        <Lightbulb className="h-4 w-4 text-amber-400" /> Recomendaciones previas
                      </h3>
                      <div className="space-y-2.5">
                        {previewSuggestions.map((suggestion, index) => {
                          const isWarning = suggestion.type === 'warning';
                          const Icon = isWarning ? AlertCircle : suggestion.type === 'tip' ? Lightbulb : CheckCircle2;
                          return (
                            <div key={`${suggestion.title}-${index}`} className={`flex items-start gap-3 rounded-2xl p-3.5 ${isWarning ? 'bg-amber-500/10' : 'bg-accent/5'}`}>
                              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${isWarning ? 'text-amber-500' : 'text-accent'}`} />
                              <div>
                                <p className={`text-xs font-extrabold ${isOled || isDark ? 'text-white' : 'text-text-primary'}`}>{suggestion.title}</p>
                                <p className="mt-1 text-xs leading-relaxed text-text-secondary">{suggestion.text}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {analysis.questions.length === 0 && previewSuggestions.length === 0 && (
                <div className={`flex items-start gap-3 rounded-[20px] border p-4 ${innerBorderClass} ${isOled ? 'bg-white/5' : 'bg-bg-tertiary'}`}>
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <p className="text-xs leading-relaxed text-text-secondary">No hay alertas automáticas con los datos disponibles. La IA puede valorar el objetivo, el orden y la selección de ejercicios al continuar.</p>
                </div>
              )}

              {/* IA Real */}
              <div className="space-y-3 pt-2">
                  <div className="flex flex-col gap-3 mb-2">
                    {remainingUses !== null && (
                      <div className={`p-3 sm:p-4 rounded-2xl border ${remainingUses === 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-accent/5 border-accent/20'} flex items-center justify-between shadow-sm`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${remainingUses === 0 ? 'bg-red-500/10 text-red-500' : 'bg-accent/10 text-accent shadow-inner'}`}>
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className={`text-sm font-black tracking-wide uppercase ${remainingUses === 0 ? 'text-red-500' : 'text-text-primary'}`}>
                              Entrenador IA
                            </h4>
                            <span className="text-[10px] text-text-secondary font-semibold block mt-0.5">
                              Recarga a medianoche
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex items-baseline gap-0.5 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg ring-1 ring-black/5 dark:ring-white/10">
                          <span className={`text-2xl font-black ${remainingUses === 0 ? 'text-red-500' : 'text-accent'}`}>
                            {remainingUses}
                          </span>
                          {dailyLimit && (
                            <span className={`text-sm font-bold opacity-60 ${remainingUses === 0 ? 'text-red-500' : 'text-text-secondary'}`}>
                              /{dailyLimit}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {remainingUses === null && (
                      <h3 className={`text-sm font-semibold flex items-center gap-2 ml-1 ${isOled || isDark ? 'text-white/90' : 'text-text-primary'}`}>
                        <Sparkles className="w-4 h-4 text-accent" />
                        Entrenador IA
                      </h3>
                    )}
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
