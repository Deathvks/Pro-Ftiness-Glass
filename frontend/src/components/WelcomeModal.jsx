/* frontend/src/components/WelcomeModal.jsx */
import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, Plus, ChevronRight, X, Sparkles, Zap, Dumbbell, Smartphone } from 'lucide-react';
import { APP_VERSION } from '../config/version';

const WelcomeModal = ({ onClose }) => {
  const appVersion = `v${APP_VERSION}`;

  // Corregido: Usamos onClose directamente para cerrar el modal
  const handleGetStarted = () => {
    if (onClose) {
      onClose();
    }
  };

  // --- Estado para la animación de demostración de Isla Dinámica ---
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
          <div className="text-center mb-8 flex flex-col items-center">
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

          <div className="space-y-10 mb-8">

            {/* --- DEMO 1: ISLA DINÁMICA --- */}
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-sm font-semibold mb-4 text-center text-text-secondary uppercase tracking-widest flex items-center gap-2">
                <Timer size={14} /> Nueva Isla Dinámica
              </h2>

              {/* Contenedor simulador de pantalla */}
              <div className="relative w-full max-w-[280px] h-[180px] bg-bg-secondary/50 border border-glass-border rounded-[2.5rem] p-4 overflow-hidden flex flex-col items-center shadow-inner ring-1 ring-white/5">

                {/* Texto de ayuda animado */}
                <p className="absolute bottom-4 text-xs text-accent/80 font-medium animate-pulse tracking-wider text-center w-full">
                  {isDemoExpanded ? "Suelta para interactuar" : "Mantén pulsado para expandir"}
                </p>

                {/* LA ISLA ANIMADA */}
                <div className={`
                        relative bg-black text-white shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden select-none mt-2 border border-gray-800 z-20
                        ${isDemoExpanded
                    ? 'w-[220px] h-[120px] rounded-[2rem]' // Estado Expandido
                    : 'w-[180px] h-[36px] rounded-[2rem]' // Estado Píldora
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
                      <Timer size={14} className="text-accent relative -top-[1px]" />
                      <span className="font-mono text-xs font-bold tracking-wider pt-[1px]">01:30</span>
                    </div>
                    <div className="flex items-center h-full">
                      <div className="w-[1px] h-3 bg-gray-700 mx-2"></div>
                      <div className="flex items-center gap-1.5">
                        <Pause size={10} fill="currentColor" className="text-white/90" />
                        <X size={10} className="text-gray-400" />
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
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-400 text-[10px]">En descanso</span>
                      <span className="font-mono text-xl font-bold">01:30</span>
                    </div>
                    <div className="flex gap-1 justify-between mb-2 opacity-60">
                      <div className="bg-gray-800/50 rounded py-1 px-1.5 text-[8px] font-bold flex gap-0.5 items-center whitespace-nowrap"><Plus size={6} /> 15s</div>
                      <div className="bg-gray-800/50 rounded py-1 px-1.5 text-[8px] font-bold flex gap-0.5 items-center whitespace-nowrap"><Plus size={6} /> 30s</div>
                      <div className="bg-gray-800/50 rounded py-1 px-1.5 text-[8px] font-bold flex gap-0.5 items-center whitespace-nowrap"><Plus size={6} /> 1m</div>
                    </div>
                    <div className="flex items-center justify-between mt-auto scale-90 origin-bottom">
                      <div className="p-1.5 rounded-full bg-red-500/20 text-red-400"><X size={14} /></div>
                      <div className="p-2 rounded-full bg-accent text-bg-secondary"><Pause size={16} fill="currentColor" /></div>
                      <div className="p-1.5 rounded-full bg-gray-800 text-gray-300"><Timer size={14} /></div>
                    </div>
                  </div>
                </div>

                {/* Efecto de "dedo" pulsando */}
                {!isDemoExpanded && (
                  <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-8 h-8 bg-accent/30 rounded-full animate-ping opacity-70 z-10"></div>
                )}
              </div>
            </div>

            {/* --- DEMO 2: RUTINAS VISUALES (NUEVA) --- */}
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-sm font-semibold mb-4 text-center text-text-secondary uppercase tracking-widest flex items-center gap-2">
                <Smartphone size={14} /> Nuevas Rutinas Visuales
              </h2>

              {/* Contenedor simulador de lista */}
              <div className="relative w-full max-w-[280px] h-[220px] bg-bg-primary border border-glass-border rounded-3xl overflow-hidden shadow-inner flex flex-col">

                {/* Header falso */}
                <div className="h-10 border-b border-white/5 flex items-center px-4 bg-bg-secondary/30 backdrop-blur-sm z-10">
                  <div className="w-20 h-2 bg-white/20 rounded-full"></div>
                </div>

                {/* Lista con Scroll Automático Infinito */}
                <div className="flex-1 relative overflow-hidden bg-bg-secondary/20">
                  {/* Gradientes para suavizar el scroll */}
                  <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-bg-primary to-transparent z-10"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-transparent z-10"></div>

                  <div className="animate-marquee-vertical flex flex-col gap-3 p-3">
                    {/* Tarjetas simuladas (Duplicadas para efecto infinito) */}
                    {[1, 2, 3, 4, 1, 2, 3, 4].map((i, idx) => (
                      <div key={idx} className="bg-glass border border-glass-border p-2.5 rounded-xl flex gap-3 items-center transform scale-95 opacity-80">
                        {/* Miniatura de Vídeo/Foto */}
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden
                          ${i === 1 ? 'bg-amber-500/20' : i === 2 ? 'bg-blue-500/20' : i === 3 ? 'bg-emerald-500/20' : 'bg-purple-500/20'}
                        `}>
                          <div className="absolute inset-0 bg-black/20"></div>
                          <Play size={16} fill="currentColor" className="text-white relative z-10 opacity-90" />
                        </div>

                        {/* Info de texto */}
                        <div className="flex-1 space-y-1.5">
                          <div className="h-2 w-24 bg-white/20 rounded-full"></div>
                          <div className="flex gap-2">
                            <div className="h-1.5 w-8 bg-white/10 rounded-full"></div>
                            <div className="h-1.5 w-12 bg-accent/20 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Indicador de "Novedad" flotante */}
                <div className="absolute bottom-3 right-3 bg-accent text-bg-secondary text-[10px] font-bold px-2 py-1 rounded-md shadow-lg z-20 animate-bounce">
                  ¡Fotos y Vídeos!
                </div>
              </div>
            </div>

          </div>

          {/* --- Footer --- */}
          <div className="mt-auto">
            <div className="flex items-start gap-3 bg-bg-secondary/40 border border-glass-border p-3 rounded-xl mb-6 backdrop-blur-md">
              <div className="p-1.5 bg-accent/10 rounded-full shrink-0 mt-0.5">
                <Zap size={16} className="text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary text-sm mb-0.5">Más visual e intuitivo</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Ahora tus rutinas incluyen previsualizaciones de ejercicios y una experiencia de usuario totalmente renovada.
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

            {/* MODIFICACIÓN: Resaltado de la versión SIN BORDE */}
            <div className="text-center mt-3">
              <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold font-mono tracking-wider">
                {appVersion}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos inline para la animación de marquee vertical si no está en tailwind.config */}
      <style jsx>{`
        @keyframes marquee-vertical {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-marquee-vertical {
          animation: marquee-vertical 10s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default WelcomeModal;