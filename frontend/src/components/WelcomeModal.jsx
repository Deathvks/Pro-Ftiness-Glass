/* frontend/src/components/WelcomeModal.jsx */
import React, { useState, useEffect } from 'react';
import { Timer, Pause, Plus, ChevronRight, X, Sparkles, Zap, Smartphone, Play, Utensils } from 'lucide-react';
import { APP_VERSION } from '../config/version';

const WelcomeModal = ({ onClose }) => {
  const appVersion = `v${APP_VERSION}`;

  const handleGetStarted = () => {
    if (onClose) {
      onClose();
    }
  };

  // --- Estados para animaciones ---
  const [isDemoExpanded, setIsDemoExpanded] = useState(false);
  const [nutriStep, setNutriStep] = useState(0); // 0: Vacío, 1: Llenando, 2: Completo

  useEffect(() => {
    // Ciclo Isla
    const intervalIsland = setInterval(() => {
      setIsDemoExpanded((prev) => !prev);
    }, 3500);

    // Ciclo Nutrición
    const intervalNutri = setInterval(() => {
      setNutriStep((prev) => (prev + 1) % 3);
    }, 2500);

    return () => {
      clearInterval(intervalIsland);
      clearInterval(intervalNutri);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">

      {/* Contenedor del Modal */}
      <div className="relative w-full max-w-md bg-bg-primary border border-glass-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Decoración de fondo interna */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-accent/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Scroll interno */}
        <div className="overflow-y-auto custom-scrollbar p-6 flex flex-col h-full">

          {/* --- Cabecera --- */}
          <div className="text-center mb-6 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-text-primary to-accent bg-clip-text text-transparent">
              Bienvenido
            </h1>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-accent/20 to-blue-500/20 border border-accent/30 shadow-lg shadow-accent/10 backdrop-blur-md animate-[bounce-in_0.6s_ease-out]">
              <Sparkles size={14} className="text-accent animate-pulse" />
              <span className="text-xs font-bold text-text-primary tracking-wide">
                ¡Nueva Actualización!
              </span>
            </div>
          </div>

          <div className="space-y-8 mb-8">

            {/* --- DEMO 1: ISLA DINÁMICA --- */}
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-sm font-semibold mb-3 text-center text-text-secondary uppercase tracking-widest flex items-center gap-2">
                <Timer size={14} /> Control de Descanso
              </h2>

              <div className="relative w-full max-w-[280px] h-[180px] bg-bg-secondary/50 border border-glass-border rounded-[2.5rem] p-4 overflow-hidden flex flex-col items-center shadow-inner ring-1 ring-white/5">

                {/* LA ISLA ANIMADA */}
                <div className={`
                        relative bg-black text-white shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden select-none mt-2 border border-gray-800 z-20
                        ${isDemoExpanded
                    ? 'w-[200px] h-[100px] rounded-[2rem]'
                    : 'w-[180px] h-[36px] rounded-[2rem]'
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
                    <div className="flex items-center justify-between mt-auto scale-90 origin-bottom">
                      <div className="p-1.5 rounded-full bg-red-500/20 text-red-400"><X size={14} /></div>
                      <div className="p-2 rounded-full bg-accent text-bg-secondary"><Pause size={16} fill="currentColor" /></div>
                      <div className="p-1.5 rounded-full bg-gray-800 text-gray-300"><Plus size={14} /></div>
                    </div>
                  </div>
                </div>

                {/* Texto de ayuda */}
                <p className="absolute bottom-4 text-[10px] text-accent/80 font-medium animate-pulse tracking-wider text-center w-full">
                  {isDemoExpanded ? "Suelta para interactuar" : "Mantén pulsado para expandir"}
                </p>

                {/* Efecto de "dedo" */}
                {!isDemoExpanded && (
                  <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-8 h-8 bg-accent/30 rounded-full animate-ping opacity-70 z-10"></div>
                )}
              </div>
            </div>

            {/* --- DEMO 2: RUTINAS VISUALES --- */}
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-sm font-semibold mb-3 text-center text-text-secondary uppercase tracking-widest flex items-center gap-2">
                <Smartphone size={14} /> Rutinas Visuales
              </h2>

              <div className="relative w-full max-w-[280px] h-[160px] bg-bg-primary border border-glass-border rounded-3xl overflow-hidden shadow-inner flex flex-col">
                <div className="h-8 border-b border-white/5 flex items-center px-4 bg-bg-secondary/30 backdrop-blur-sm z-10">
                  <div className="w-16 h-1.5 bg-white/20 rounded-full"></div>
                </div>
                <div className="flex-1 relative overflow-hidden bg-bg-secondary/20">
                  <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-bg-primary to-transparent z-10"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-transparent z-10"></div>
                  <div className="animate-marquee-vertical flex flex-col gap-2 p-3">
                    {[1, 2, 3, 4, 1, 2, 3, 4].map((i, idx) => (
                      <div key={idx} className="bg-glass border border-glass-border p-2 rounded-xl flex gap-2 items-center transform scale-95 opacity-80">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden ${i % 2 === 0 ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
                          <Play size={12} fill="currentColor" className="text-white opacity-90" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="h-1.5 w-20 bg-white/20 rounded-full"></div>
                          <div className="h-1 w-8 bg-accent/20 rounded-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* --- DEMO 3: NUTRICIÓN --- */}
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-sm font-semibold mb-3 text-center text-text-secondary uppercase tracking-widest flex items-center gap-2">
                <Utensils size={14} /> Dietas Inteligentes
              </h2>

              <div className="relative w-full max-w-[280px] h-[140px] bg-bg-primary border border-glass-border rounded-3xl overflow-hidden shadow-inner flex flex-col p-4 justify-center">
                <div className={`
                    bg-bg-secondary/50 border border-glass-border rounded-xl p-3 flex gap-3 transition-all duration-700 ease-out transform
                    ${nutriStep === 0 ? 'translate-y-10 opacity-0' : 'translate-y-0 opacity-100'}
                `}>
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                    <Utensils size={16} className="text-orange-400" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="w-20 h-2 bg-white/20 rounded-full"></div>
                      <span className="text-[10px] text-accent font-bold">500 kcal</span>
                    </div>
                    <div className="space-y-1.5">
                      {/* PROTEÍNAS - Decorado */}
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-1 rounded-full bg-blue-400/20"></div>
                        <div className="flex-1 h-1 bg-glass-border rounded-full overflow-hidden">
                          <div className={`h-full bg-blue-400 transition-all duration-1000 ease-out ${nutriStep === 2 ? 'w-[70%]' : 'w-0'}`}></div>
                        </div>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-400/20 text-blue-400 w-8 text-center transition-opacity duration-500 ${nutriStep === 2 ? 'opacity-100' : 'opacity-0'}`}>32g</span>
                      </div>

                      {/* CARBOS - Decorado */}
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-1 rounded-full bg-yellow-400/20"></div>
                        <div className="flex-1 h-1 bg-glass-border rounded-full overflow-hidden">
                          <div className={`h-full bg-yellow-400 transition-all duration-1000 delay-100 ease-out ${nutriStep === 2 ? 'w-[50%]' : 'w-0'}`}></div>
                        </div>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400 w-8 text-center transition-opacity duration-500 ${nutriStep === 2 ? 'opacity-100' : 'opacity-0'}`}>45g</span>
                      </div>

                      {/* GRASAS - Decorado */}
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-1 rounded-full bg-green-400/20"></div>
                        <div className="flex-1 h-1 bg-glass-border rounded-full overflow-hidden">
                          <div className={`h-full bg-green-400 transition-all duration-1000 delay-200 ease-out ${nutriStep === 2 ? 'w-[30%]' : 'w-0'}`}></div>
                        </div>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded bg-green-400/20 text-green-400 w-8 text-center transition-opacity duration-500 ${nutriStep === 2 ? 'opacity-100' : 'opacity-0'}`}>15g</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* --- Footer --- */}
          <div className="mt-auto pt-2">
            <button
              onClick={handleGetStarted}
              className="group w-full py-3.5 px-6 bg-accent hover:bg-accent/90 text-bg-primary font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent/20 flex items-center justify-center gap-2 mb-4"
            >
              <span>Empezar a entrenar</span>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="text-center">
              <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold font-mono tracking-wider">
                {appVersion}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos inline para la animación de marquee */}
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