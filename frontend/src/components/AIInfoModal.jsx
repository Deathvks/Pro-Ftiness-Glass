/* frontend/src/components/AIInfoModal.jsx */
import React, { useState, useEffect } from 'react';
import { X, Sparkles, Clock, Zap, Info, ShieldCheck } from 'lucide-react';
import { useAppTheme } from '../hooks/useAppTheme';

const AIInfoModal = ({ onClose }) => {
  const { resolvedTheme } = useAppTheme();
  
  const [remainingUses, setRemainingUses] = useState(() => localStorage.getItem('ai_remaining_uses') || '5');
  const [dailyLimit, setDailyLimit] = useState(() => localStorage.getItem('ai_daily_limit') || '5');
  const [timeLeft, setTimeLeft] = useState('');

  // Efecto para calcular la cuenta atrás hasta la medianoche en España
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      // Obtenemos la hora actual en Madrid
      const madridTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
      
      // Calculamos la próxima medianoche en Madrid
      const nextMidnight = new Date(madridTime);
      nextMidnight.setHours(24, 0, 0, 0);

      const diffMs = nextMidnight - madridTime;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${hours}h ${minutes}m`);
    };

    calculateTimeLeft(); // Cálculo inicial
    const interval = setInterval(calculateTimeLeft, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, []);

  // Escuchar si los límites cambian mientras el modal está abierto
  useEffect(() => {
    const updateLimits = () => {
      setRemainingUses(localStorage.getItem('ai_remaining_uses') || '5');
      setDailyLimit(localStorage.getItem('ai_daily_limit') || '5');
    };
    window.addEventListener('ai_limit_updated', updateLimits);
    return () => window.removeEventListener('ai_limit_updated', updateLimits);
  }, []);

  const isOled = resolvedTheme === 'oled';
  const isDark = resolvedTheme === 'dark';
  const isAILimitReached = parseInt(remainingUses, 10) === 0;

  // Clases exactas de Rutinas: border-transparent dark:border dark:border-white/10
  const containerClass = `w-full max-w-sm rounded-3xl shadow-2xl flex flex-col transition-colors duration-300 overflow-hidden relative border border-transparent dark:border dark:border-white/10 ${
    isOled ? 'bg-black' : 'bg-bg-secondary'
  }`;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={containerClass}>
        
        {/* Fondo decorativo */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-accent/20 to-transparent opacity-50 pointer-events-none" />

        {/* Cabecera */}
        <div className="p-5 flex justify-between items-start relative z-10 border-b border-transparent dark:border-b dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-accent text-white shadow-lg shadow-accent/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-xl font-bold leading-tight ${isOled || isDark ? 'text-white' : 'text-text-primary'}`}>
                Entrenador IA
              </h2>
              <span className={`text-sm font-medium ${isOled || isDark ? 'text-gray-400' : 'text-text-secondary'}`}>
                Sistema de Créditos
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-full transition-colors ${isOled || isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-bg-tertiary text-text-secondary hover:text-text-primary'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 pt-5 space-y-6 relative z-10">
          
          {/* Tarjetas de Estadísticas */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-4 rounded-2xl border border-transparent dark:border dark:border-white/10 flex flex-col gap-1 items-center text-center transition-colors ${
              isAILimitReached 
                ? 'bg-red-500/10' 
                : 'bg-accent/5' 
            }`}>
              <Zap className={`w-5 h-5 mb-1 ${isAILimitReached ? 'text-red-500' : 'text-accent'}`} />
              <span className={`text-[10px] uppercase tracking-wider font-bold ${isOled || isDark ? 'text-gray-400' : 'text-text-secondary'}`}>
                Usos Restantes
              </span>
              <span className={`text-2xl font-black ${isAILimitReached ? 'text-red-500' : isOled || isDark ? 'text-white' : 'text-text-primary'}`}>
                {remainingUses} <span className="text-sm font-medium opacity-50">/ {dailyLimit}</span>
              </span>
            </div>

            <div className={`p-4 rounded-2xl border border-transparent dark:border dark:border-white/10 flex flex-col gap-1 items-center text-center ${isOled || isDark ? 'bg-white/5' : 'bg-bg-tertiary'}`}>
              <Clock className={`w-5 h-5 mb-1 ${isOled || isDark ? 'text-gray-400' : 'text-text-secondary'}`} />
              <span className={`text-[10px] uppercase tracking-wider font-bold ${isOled || isDark ? 'text-gray-400' : 'text-text-secondary'}`}>
                Se recarga en
              </span>
              <span className={`text-xl font-bold mt-1 ${isOled || isDark ? 'text-white' : 'text-text-primary'}`}>
                {timeLeft}
              </span>
            </div>
          </div>

          {/* Explicación */}
          <div className="space-y-3">
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isOled || isDark ? 'text-white/90' : 'text-text-primary'}`}>
              <Info className="w-4 h-4 text-accent" />
              ¿Cómo funciona?
            </h3>
            <ul className={`text-sm space-y-2 leading-relaxed ${isOled || isDark ? 'text-gray-300' : 'text-text-secondary'}`}>
              <li>
                • La IA genera rutinas personalizadas y analiza tus entrenamientos al instante.
              </li>
              <li>
                • Debido a los altos costes de procesamiento, cada usuario tiene un límite de <strong>{dailyLimit} usos diarios</strong>.
              </li>
              <li>
                • Tus créditos se restauran automáticamente todos los días a la <strong>medianoche</strong> (Hora de España).
              </li>
            </ul>
          </div>

          {/* Badge Informativo (Borde apagado) */}
          <div className="p-3 rounded-xl flex items-start gap-3 border border-transparent dark:border dark:border-white/10 bg-accent/5">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-accent" />
            <p className={`text-xs ${isOled || isDark ? 'text-gray-300' : 'text-text-secondary'}`}>
              El servicio es 100% gratuito. Los límites nos ayudan a mantener los servidores funcionando para toda la comunidad.
            </p>
          </div>

          {/* Botón Cerrar */}
          <button 
            onClick={onClose}
            className="w-full py-3.5 rounded-xl font-bold bg-accent text-white hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-accent/20"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};

export default AIInfoModal;