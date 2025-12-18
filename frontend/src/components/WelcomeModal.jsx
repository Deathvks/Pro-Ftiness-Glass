/* frontend/src/components/WelcomeModal.jsx */
import React, { useState, useEffect } from 'react';
import {
  Sparkles, ChevronRight, LayoutDashboard, Zap, Flame,
  Trophy, Check, Moon, Laptop, Dumbbell, Calendar, ArrowUp
} from 'lucide-react';
import { APP_VERSION } from '../config/version';

const WelcomeModal = ({ onClose }) => {
  const appVersion = `v${APP_VERSION}`;

  const handleGetStarted = () => {
    if (onClose) {
      onClose();
    }
  };

  // --- Estado para la animación realista del Dashboard ---
  const [dashboardState, setDashboardState] = useState('morning'); // 'morning' (vacío) | 'evening' (lleno)

  useEffect(() => {
    const interval = setInterval(() => {
      setDashboardState(prev => prev === 'morning' ? 'evening' : 'morning');
    }, 4000); // Cambio cada 4 segundos

    return () => clearInterval(interval);
  }, []);

  const isEvening = dashboardState === 'evening';

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

            {/* --- DEMO: DASHBOARD REALISTA --- */}
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-sm font-semibold mb-4 text-center text-text-secondary uppercase tracking-widest flex items-center gap-2">
                <LayoutDashboard size={14} /> Nuevo Dashboard
              </h2>

              {/* MOCKUP DEL DASHBOARD */}
              {/* Añadido p-1 para evitar que el overflow hidden corte el borde visualmente si hay antialiasing */}
              <div className="relative w-full max-w-[300px] bg-bg-primary border border-glass-border rounded-3xl overflow-hidden shadow-2xl flex flex-col transition-colors duration-1000 p-1">

                {/* Body Mockup (Sin cabecera de perfil) */}
                <div className="p-4 space-y-3 bg-bg-secondary/10 rounded-[20px] relative h-full flex flex-col justify-center">

                  {/* Stats Row */}
                  <div className="flex gap-2 overflow-hidden">
                    {/* Weekly Sessions Card */}
                    <div className="flex-1 bg-bg-secondary/60 rounded-xl p-2 border border-white/5 flex flex-col gap-2 relative overflow-hidden">
                      <div className="flex justify-between items-center">
                        <Dumbbell size={12} className="text-accent" />
                        <span className={`text-xs font-bold transition-all duration-1000 ${isEvening ? 'text-accent' : 'text-text-muted'}`}>
                          {isEvening ? '4/5' : '3/5'}
                        </span>
                      </div>
                      {/* Week Dots */}
                      <div className="flex justify-between items-end h-6 mt-1">
                        {[1, 2, 3, 4, 5].map((d, i) => {
                          // Simula check en días pasados + hoy (si es evening)
                          const isChecked = i < 3 || (i === 3 && isEvening);
                          return (
                            <div key={d} className="flex flex-col items-center gap-1">
                              <div className={`w-1.5 bg-gray-600 rounded-t-sm transition-all duration-700 ${isChecked ? 'h-3 bg-accent' : 'h-1.5'}`}></div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Calories Card */}
                    <div className="flex-1 bg-bg-secondary/60 rounded-xl p-2 border border-white/5 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <Flame size={12} className="text-orange-400" />
                        <span className="text-[10px] text-text-muted">Kcal</span>
                      </div>
                      <div className="relative h-1 bg-gray-700 rounded-full overflow-hidden mt-auto mb-1">
                        <div className={`absolute top-0 left-0 h-full bg-orange-400 transition-all duration-1000 ease-out ${isEvening ? 'w-[85%]' : 'w-[20%]'}`}></div>
                      </div>
                      <div className="text-[10px] font-bold text-right transition-all duration-1000">
                        {isEvening ? '2100' : '450'}
                      </div>
                    </div>
                  </div>

                  {/* Weight Section Mockup */}
                  <div className="bg-bg-secondary/60 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-text-muted mb-0.5 uppercase tracking-wider">Peso Actual</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-text-primary">75.5</span>
                        <span className="text-[10px] text-text-muted">kg</span>
                      </div>
                    </div>
                    <div className={`flex flex-col items-center gap-0.5 transition-opacity duration-700 ${isEvening ? 'opacity-100' : 'opacity-50'}`}>
                      <div className="bg-green-500/20 p-1 rounded-full text-green-400">
                        <ArrowUp size={12} />
                      </div>
                    </div>
                  </div>

                  {/* Today's Workout Mockup */}
                  <div className={`
                    rounded-xl p-3 border border-white/5 transition-all duration-1000 relative overflow-hidden group
                    ${isEvening
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-bg-secondary/60 border-transparent'
                    }
                  `}>
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className={`
                              w-8 h-8 rounded-full flex items-center justify-center transition-all duration-1000
                              ${isEvening ? 'bg-green-500 text-white' : 'bg-accent/10 text-accent'}
                           `}>
                          {isEvening ? <Check size={16} /> : <Zap size={16} />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-text-primary">Torso Hipertrofia</div>
                          <div className="text-[10px] text-text-secondary">
                            {isEvening ? 'Completado • 1h 15m' : 'Programado para hoy'}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Efecto de "Scan" al completar */}
                    {isEvening && (
                      <div className="absolute inset-0 bg-green-400/10 animate-[pulse_2s_infinite]"></div>
                    )}
                  </div>

                </div>

                {/* Status Bar simulation (ahora abajo del todo) */}
                <div className="h-1 w-full bg-accent/20 mt-auto rounded-b-2xl overflow-hidden">
                  <div className={`h-full bg-accent transition-all duration-[4000ms] linear ${isEvening ? 'w-full' : 'w-0'}`}></div>
                </div>
              </div>

              <p className="mt-4 text-[10px] text-text-muted font-mono animate-pulse">
                {isEvening ? "Resumen del día completo" : "Inicio del día"}
              </p>
            </div>


            {/* --- ÚLTIMAS MEJORAS --- */}
            <div className="w-full bg-bg-secondary/20 border border-glass-border rounded-2xl p-4 backdrop-blur-sm">
              <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                <Sparkles size={12} className="text-accent" /> Últimas Mejoras
              </h2>
              <div className="space-y-3">
                {/* --- Tema OLED --- */}
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-lg bg-black/80 flex items-center justify-center text-white shrink-0 border border-gray-700">
                    <Moon size={16} />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-text-primary">Tema OLED Puro</p>
                    <p className="text-text-muted">Negros profundos y máximo ahorro de batería.</p>
                  </div>
                </div>

                {/* --- Control de Sesiones --- */}
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                    <Laptop size={16} />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-text-primary">Control de Sesiones</p>
                    <p className="text-text-muted">Gestiona y cierra sesiones en otros dispositivos.</p>
                  </div>
                </div>

                {/* --- Dashboard --- */}
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <LayoutDashboard size={16} />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-text-primary">Nuevo Dashboard</p>
                    <p className="text-text-muted">Diseño más limpio, intuitivo y funcional.</p>
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
    </div>
  );
};

export default WelcomeModal;