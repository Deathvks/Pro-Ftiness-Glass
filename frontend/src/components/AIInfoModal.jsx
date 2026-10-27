/* frontend/src/components/AIInfoModal.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { FaXmark, FaBrain, FaClock, FaBolt, FaCircleInfo, FaShieldHalved, FaChevronDown } from 'react-icons/fa6';
import ModalPortal from './ModalPortal';
import { useAppTheme } from '../hooks/useAppTheme';
import useModalLock from '../hooks/useModalLock';
import useAppStore from '../store/useAppStore';

const AIInfoModal = ({ onClose }) => {
  // --- Bloquear scroll del fondo y swipe entre páginas ---
  useModalLock();

  const { resolvedTheme } = useAppTheme();
  const userProfile = useAppStore((state) => state.userProfile);
  const isAdmin = userProfile?.role === 'admin';

  const [remainingUses, setRemainingUses] = useState(() => localStorage.getItem('ai_remaining_uses') || '5');
  const [dailyLimit, setDailyLimit] = useState(() => localStorage.getItem('ai_daily_limit') || '5');
  const [timeLeft, setTimeLeft] = useState(() => {
    try {
      const now = new Date();
      const madridTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
      const nextMidnight = new Date(madridTime);
      nextMidnight.setHours(24, 0, 0, 0);
      const diffMs = nextMidnight - madridTime;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch {
      return '';
    }
  });

  // Estados para deslizamiento en móvil (Swipe down to close)
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      setDragY(diff);
    } else {
      setDragY(0);
    }
  };

  const handleTouchEnd = () => {
    if (dragY > 75) {
      onClose();
    }
    setDragY(0);
    setIsDragging(false);
  };

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
      const minutes = Math.floor(diffMs % (1000 * 60 * 60) / (1000 * 60));

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

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200">
        {/* Fondo oscuro con desenfoque / Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
          onClick={onClose} 
        />

        {/* Tarjeta Bottom Sheet en móvil / Modal centrado en escritorio */}
        <div
          className={`relative w-full sm:max-w-[480px] rounded-t-[32px] sm:rounded-[28px] shadow-2xl flex flex-col transition-colors duration-300 overflow-hidden border-t sm:border border-transparent dark:border-white/10 pb-[calc(max(env(safe-area-inset-bottom,0px),20px)+12px)] sm:pb-6 animate-[slide-up_0.25s_cubic-bezier(0.32,0.72,0,1)] sm:animate-[scale-in_0.2s_ease-out] z-10 max-h-[90vh] overflow-y-auto no-scrollbar ${
            isOled ? 'bg-black' : 'bg-bg-secondary'
          }`}
          style={{
            transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
            opacity: dragY > 0 ? Math.max(0.5, 1 - dragY / 300) : 1,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease-out'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Indicador de cierre deslizable para móvil */}
          <div 
            className="w-full flex flex-col items-center pt-3 pb-1 cursor-grab active:cursor-grabbing sm:hidden shrink-0 select-none touch-none group"
            onClick={onClose}
          >
            <div className="w-12 h-1.5 bg-black/20 dark:bg-white/20 rounded-full transition-colors group-hover:bg-accent/40" />
            <div className="flex items-center gap-1 text-[10px] font-bold text-text-muted/70 uppercase tracking-widest mt-1.5">
              <FaChevronDown size={12} className="animate-bounce" />
              <span>Desliza hacia abajo para cerrar</span>
            </div>
          </div>

          {/* Fondo decorativo con degradado suave */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-accent/20 to-transparent opacity-50 pointer-events-none" />

          {/* Cabecera */}
          <div className="px-5 pt-3 sm:pt-5 pb-4 flex justify-between items-start relative z-10 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-accent text-accent-contrast shadow-lg shadow-accent/30">
                <FaBrain className="w-6 h-6" />
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
              className={`p-2 rounded-full transition-colors ${
                isOled || isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-bg-tertiary text-text-secondary hover:text-text-primary'
              }`}
              title="Cerrar"
            >
              <FaXmark className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido */}
          <div className="p-5 sm:p-6 space-y-5 relative z-10">
            {isAdmin && (
              <div className="px-3 sm:px-3.5 py-2.5 sm:py-3 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <div className="flex items-center gap-1.5 text-purple-400 font-black uppercase tracking-normal sm:tracking-wide text-[10px] sm:text-[11px] whitespace-nowrap shrink-0">
                  <FaShieldHalved className="text-[11px] sm:text-xs shrink-0" />
                  <span>Modo Administrador</span>
                </div>
                <span className="font-bold text-text-primary text-[10.5px] sm:text-xs whitespace-nowrap">
                  Modelo: <strong className="text-accent">Gemini 3.6 Flash</strong> <span className="opacity-80">(Sin límites)</span>
                </span>
              </div>
            )}
            {/* Tarjetas de Estadísticas */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`p-4 rounded-2xl border border-transparent dark:border dark:border-white/10 flex flex-col gap-1 items-center text-center transition-colors ${
                  isAILimitReached ? 'bg-red-500/10' : 'bg-accent/5'
                }`}
              >
                <FaBolt className={`w-5 h-5 mb-1 ${isAILimitReached ? 'text-red-500' : 'text-accent'}`} />
                <span className={`text-[10px] uppercase tracking-wider font-bold ${isOled || isDark ? 'text-gray-400' : 'text-text-secondary'}`}>
                  Usos Restantes
                </span>
                <span className={`text-2xl font-black ${isAILimitReached ? 'text-red-500' : isOled || isDark ? 'text-white' : 'text-text-primary'}`}>
                  {remainingUses} <span className="text-sm font-medium opacity-50">/ {dailyLimit}</span>
                </span>
              </div>

              <div className={`p-4 rounded-2xl border border-transparent dark:border dark:border-white/10 flex flex-col gap-1 items-center text-center ${isOled || isDark ? 'bg-white/5' : 'bg-bg-tertiary'}`}>
                <FaClock className={`w-5 h-5 mb-1 ${isOled || isDark ? 'text-gray-400' : 'text-text-secondary'}`} />
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
                <FaCircleInfo className="w-4 h-4 text-accent" />
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
            <div className="p-3.5 rounded-2xl flex items-start gap-3 border border-transparent dark:border dark:border-white/10 bg-accent/5">
              <FaShieldHalved className="w-5 h-5 shrink-0 mt-0.5 text-accent" />
              <p className={`text-xs leading-relaxed ${isOled || isDark ? 'text-gray-300' : 'text-text-secondary'}`}>
                El servicio es 100% gratuito. Los límites nos ayudan a mantener los servidores funcionando para toda la comunidad.
              </p>
            </div>

            {/* Botón Cerrar */}
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl font-bold bg-accent text-accent-contrast hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-accent/20"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default AIInfoModal;
