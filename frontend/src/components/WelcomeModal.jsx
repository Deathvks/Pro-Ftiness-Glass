/* frontend/src/components/WelcomeModal.jsx */
import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, Plus, ChevronRight, X, Sparkles, Zap } from 'lucide-react';
import { APP_VERSION } from '../config/version';

const WelcomeModal = ({ onClose }) => {
  const appVersion = `v${APP_VERSION}`;

  // Corregido: Usamos onClose directamente para cerrar el modal
  const handleGetStarted = () => {
    if (onClose) {
      onClose();
    }
  };

  // --- Estado para la animación de demostración automática ---
  const [isDemoExpanded, setIsDemoExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsDemoExpanded((prev) => !prev);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">

      {/* Contenedor del Modal */}
      <div className="relative w-full max-w-md bg-bg-primary border border-glass-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Decoración de fondo interna */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-accent/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Scroll interno por si la pantalla es muy pequeña */}
        <div className="overflow-y-auto custom-scrollbar p-6 flex flex-col h-full">

          {/* --- Cabecera --- */}
          <div className="text-center mb-6 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-text-primary to-accent bg-clip-text text-transparent">
              Bienvenido
            </h1>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-accent/20 to-blue-500/20 border border-accent/30 shadow-lg shadow-accent/10 backdrop-blur-md animate-[bounce-in_0.6s_ease-out]">
              <Sparkles size={14} className="text-accent animate-pulse" />
              <span className="text-xs font-bold text-text-primary tracking-wide">
                ¡Pro Fitness Glass se ha actualizado!
              </span>
            </div>
          </div>

          {/* --- ZONA DE DEMOSTRACIÓN ANIMADA --- */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-[260px] mb-6">
            <h2 className="text-sm font-semibold mb-4 text-center text-text-secondary uppercase tracking-widest">
              Nueva Isla Dinámica
            </h2>

            {/* Contenedor simulador de pantalla */}
            <div className="relative w-full max-w-[280px] h-[200px] bg-bg-secondary/50 border border-glass-border rounded-[2.5rem] p-4 overflow-hidden flex flex-col items-center shadow-inner">

              {/* Texto de ayuda animado */}
              <p className="absolute bottom-4 text-xs text-accent/80 font-medium animate-pulse tracking-wider text-center w-full">
                {isDemoExpanded ? "Suelta para interactuar" : "Mantén pulsado para expandir"}
              </p>

              {/* --- LA ISLA ANIMADA --- */}
              <div className={`
                        relative bg-black text-white shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden select-none mt-2 border border-gray-800 z-20
                        ${isDemoExpanded
                  ? 'w-[220px] h-[130px] rounded-[2.5rem]' // Estado Expandido
                  : 'w-[180px] h-[40px] rounded-[2.5rem]' // Estado Píldora
                }
                    `}>

                {/* CONTENIDO: MODO PÍLDORA */}
                <div className={`
                    absolute inset-0 flex items-center justify-between px-3 transition-opacity
                    ${!isDemoExpanded
                    ? 'opacity-100 duration-500 delay-300 pointer-events-auto'
                    : 'opacity-0 duration-100 delay-0 pointer-events-none'
                  }
                `}>
                  <div className="flex items-center gap-2">
                    <Timer size={16} className="text-accent relative -top-[1px]" />
                    <span className="font-mono text-sm font-bold tracking-wider pt-[1px]">01:30</span>
                  </div>
                  <div className="flex items-center h-full">
                    <div className="w-[1px] h-4 bg-gray-700 mx-2"></div>
                    <div className="flex items-center gap-1.5">
                      <Pause size={12} fill="currentColor" className="text-white/90" />
                      <X size={12} className="text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* CONTENIDO: MODO EXPANDIDO */}
                <div className={`
                    absolute inset-0 p-4 flex flex-col h-full justify-between transition-opacity
                    ${isDemoExpanded
                    ? 'opacity-100 duration-500 delay-200 pointer-events-auto'
                    : 'opacity-0 duration-75 delay-0 pointer-events-none'
                  }
                `}>
                  {/* Cabecera */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400 text-[10px]">En descanso</span>
                    <span className="font-mono text-xl font-bold">01:30</span>
                  </div>

                  {/* Botones extra */}
                  <div className="flex gap-1 justify-between mb-2 opacity-60">
                    <div className="bg-gray-800/50 rounded py-1 px-1.5 text-[8px] font-bold flex gap-0.5 items-center whitespace-nowrap"><Plus size={6} /> 15s</div>
                    <div className="bg-gray-800/50 rounded py-1 px-1.5 text-[8px] font-bold flex gap-0.5 items-center whitespace-nowrap"><Plus size={6} /> 30s</div>
                    <div className="bg-gray-800/50 rounded py-1 px-1.5 text-[8px] font-bold flex gap-0.5 items-center whitespace-nowrap"><Plus size={6} /> 1m</div>
                  </div>

                  {/* Controles */}
                  <div className="flex items-center justify-between mt-auto scale-90 origin-bottom">
                    <div className="p-1.5 rounded-full bg-red-500/20 text-red-400"><X size={14} /></div>
                    <div className="p-2 rounded-full bg-accent text-bg-secondary"><Pause size={16} fill="currentColor" /></div>
                    <div className="p-1.5 rounded-full bg-gray-800 text-gray-300"><Timer size={14} /></div>
                  </div>
                </div>
              </div>
              {/* Efecto de "dedo" pulsando */}
              {!isDemoExpanded && (
                <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-10 h-10 bg-accent/20 rounded-full animate-ping opacity-70 z-10"></div>
              )}
            </div>
          </div>

          {/* --- Footer --- */}
          <div className="mt-auto">
            <div className="flex items-start gap-3 bg-bg-secondary/40 border border-glass-border p-3 rounded-xl mb-6 backdrop-blur-md">
              <div className="p-1.5 bg-accent/10 rounded-full shrink-0 mt-0.5">
                <Zap size={16} className="text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary text-sm mb-0.5">Más seguro y rápido</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Hemos actualizado el núcleo de la aplicación. Disfruta de una experiencia más fluida y una mayor protección de tus datos.
                </p>
              </div>
            </div>

            <button
              onClick={handleGetStarted}
              className="group w-full py-3.5 px-6 bg-accent hover:bg-accent/90 text-bg-primary font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent/20 flex items-center justify-center gap-2 mb-2"
            >
              <span>Empezar a entrenar</span>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="text-center text-text-muted text-[10px] opacity-50 font-mono">
              {appVersion}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;