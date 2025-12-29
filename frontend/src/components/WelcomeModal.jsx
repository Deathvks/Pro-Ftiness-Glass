/* frontend/src/components/WelcomeModal.jsx */
import React, { useState, useEffect } from 'react';
import {
  Sparkles, ChevronRight, LayoutDashboard, Zap, Flame,
  Trophy, Check, Users, UserPlus, Heart, ArrowUp, Dumbbell,
  Link, Smartphone // Nuevos iconos importados
} from 'lucide-react';
import { APP_VERSION } from '../config/version';

const WelcomeModal = ({ onClose }) => {
  const appVersion = `v${APP_VERSION}`;

  const handleGetStarted = () => {
    if (onClose) {
      onClose();
    }
  };

  // --- Estado para la animación realista del Dashboard (Experiencia) ---
  const [dashboardState, setDashboardState] = useState('morning'); // 'morning' | 'evening'

  // --- Estado para la animación Social ---
  const [socialState, setSocialState] = useState(0); // 0: Idle, 1: Connecting, 2: Connected

  useEffect(() => {
    // Animación Dashboard
    const dashInterval = setInterval(() => {
      setDashboardState(prev => prev === 'morning' ? 'evening' : 'morning');
    }, 4000);

    // Animación Social
    const socialInterval = setInterval(() => {
      setSocialState(prev => (prev + 1) % 3);
    }, 3000);

    return () => {
      clearInterval(dashInterval);
      clearInterval(socialInterval);
    };
  }, []);

  const isEvening = dashboardState === 'evening';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-[fade-in_0.3s_ease-out]">

      {/* Contenedor del Modal */}
      <div className="relative w-full max-w-md bg-bg-primary border border-glass-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Decoración de fondo interna (SIN MORADOS) */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-accent/20 rounded-full blur-[100px] pointer-events-none"></div>
        {/* Cambiado de purple-500/20 a accent/10 para consistencia */}
        <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Scroll interno */}
        <div className="overflow-y-auto custom-scrollbar p-6 flex flex-col h-full relative z-10">

          {/* --- Cabecera V4 --- */}
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="mb-4 relative group">
              <div className="absolute inset-0 bg-accent/40 blur-xl rounded-full group-hover:bg-accent/60 transition-all duration-500"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-bg-secondary to-bg-primary rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-transform duration-500">
                <span className="text-4xl font-black text-accent">
                  v4
                </span>
              </div>
              {/* Badge "New" */}
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-bounce">
                NUEVO
              </div>
            </div>

            <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary via-accent to-text-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_infinite_linear]">
              La Evolución
            </h1>
            <p className="text-text-secondary mt-2 text-sm max-w-[80%]">
              Hemos rediseñado la experiencia para conectar tu progreso con tu comunidad.
            </p>
          </div>

          <div className="space-y-6 mb-8">

            {/* --- BLOQUE 1: EXPERIENCIA Y NIVELES --- */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-accent/30 transition-colors duration-500 group">
              <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Trophy size={16} className="text-accent" /> Experiencia y Niveles
              </h2>

              {/* MOCKUP DASHBOARD */}
              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] bg-bg-primary/80 border border-glass-border rounded-2xl overflow-hidden shadow-2xl flex flex-col transition-all duration-1000 p-1 transform group-hover:scale-[1.02]">
                  <div className="p-3 space-y-2 bg-bg-secondary/20 rounded-xl relative h-full flex flex-col justify-center">
                    {/* Stats Row */}
                    <div className="flex gap-2">
                      <div className="flex-1 bg-bg-secondary/80 rounded-lg p-2 border border-white/5 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <Dumbbell size={10} className="text-accent" />
                          <div className={`h-1.5 w-1.5 rounded-full transition-colors duration-1000 ${isEvening ? 'bg-accent' : 'bg-gray-600'}`}></div>
                        </div>
                        <div className="h-1 bg-gray-700 rounded-full w-full mt-1 overflow-hidden">
                          <div className={`h-full bg-accent transition-all duration-1000 ${isEvening ? 'w-4/5' : 'w-2/5'}`}></div>
                        </div>
                      </div>
                      <div className="flex-1 bg-bg-secondary/80 rounded-lg p-2 border border-white/5 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <Flame size={10} className="text-orange-400" />
                          <span className="text-[8px] font-mono">{isEvening ? '2100' : '450'}</span>
                        </div>
                        <div className="h-1 bg-gray-700 rounded-full w-full mt-1 overflow-hidden">
                          <div className={`h-full bg-orange-400 transition-all duration-1000 ${isEvening ? 'w-[85%]' : 'w-[20%]'}`}></div>
                        </div>
                      </div>
                    </div>

                    {/* Active Workout Card */}
                    <div className={`
                      rounded-lg p-2 border border-white/5 transition-all duration-1000 relative overflow-hidden
                      ${isEvening ? 'bg-green-500/10 border-green-500/30' : 'bg-bg-secondary/80 border-transparent'}
                    `}>
                      <div className="flex items-center gap-2 relative z-10">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-1000 ${isEvening ? 'bg-green-500 text-white' : 'bg-accent/10 text-accent'}`}>
                          {isEvening ? <Check size={12} /> : <Zap size={12} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="h-2 w-20 bg-text-primary/20 rounded mb-1"></div>
                          <div className="h-1.5 w-12 bg-text-secondary/20 rounded"></div>
                        </div>
                      </div>
                      {isEvening && <div className="absolute inset-0 bg-green-400/5 animate-pulse"></div>}
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-text-muted text-center">
                Visualiza tu progreso y sube de nivel con cada entrenamiento.
              </p>
            </div>

            {/* --- BLOQUE 2: MAPA DE CALOR --- */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-accent/30 transition-colors duration-500 group">
              <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Flame size={16} className="text-orange-500" /> Mapa de Calor Muscular
              </h2>

              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] h-24 bg-bg-primary/80 border border-glass-border rounded-xl flex items-center justify-center shadow-lg overflow-hidden group-hover:scale-[1.02] transition-transform duration-500 gap-6">

                  {/* Silueta Abstracta */}
                  <div className="relative w-12 h-20 opacity-90">
                    <div className="mx-auto w-3 h-3 bg-white/20 rounded-full mb-0.5"></div>
                    <div className="mx-auto w-6 h-8 bg-red-500/80 rounded-sm mb-0.5 animate-[pulse_3s_infinite] shadow-[0_0_12px_rgba(239,68,68,0.4)]"></div>
                    <div className="flex justify-center gap-0.5">
                      <div className="w-2.5 h-7 bg-yellow-400/80 rounded-sm shadow-[0_0_8px_rgba(250,204,21,0.3)]"></div>
                      <div className="w-2.5 h-7 bg-yellow-400/80 rounded-sm shadow-[0_0_8px_rgba(250,204,21,0.3)]"></div>
                    </div>
                    <div className="absolute top-4 left-0 w-2 h-7 bg-cyan-400/60 rounded-sm -rotate-12"></div>
                    <div className="absolute top-4 right-0 w-2 h-7 bg-cyan-400/60 rounded-sm rotate-12"></div>
                  </div>

                  {/* Leyenda Mini */}
                  <div className="flex flex-col justify-center gap-2 text-[10px] text-text-secondary">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_red]"></div>
                      <span>Intensidad Máx</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                      <span>Alta</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                      <span>Baja</span>
                    </div>
                  </div>

                </div>
              </div>
              <p className="mt-3 text-xs text-text-muted text-center">
                Detecta automáticamente qué músculos entrenas y dónde necesitas mejorar.
              </p>
            </div>

            {/* --- BLOQUE 3: LO SOCIAL --- */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-accent/30 transition-colors duration-500 group">
              <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Users size={16} className="text-accent" /> Modo Social
              </h2>

              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] h-20 bg-bg-primary/80 border border-glass-border rounded-xl flex items-center justify-between px-6 shadow-lg overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">

                  {/* Avatar YO */}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-accent/50 p-[2px]">
                      <div className="w-full h-full rounded-full bg-bg-primary flex items-center justify-center">
                        <span className="text-[10px] font-bold">YO</span>
                      </div>
                    </div>
                  </div>

                  {/* Línea de Conexión Animada */}
                  <div className="flex-1 h-[2px] bg-white/5 mx-2 relative overflow-hidden rounded-full">
                    {socialState >= 1 && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent to-transparent w-1/2 animate-[shimmer_1.5s_infinite_linear]"></div>
                    )}
                    {socialState === 2 && (
                      <div className="absolute inset-0 bg-accent transition-all duration-500"></div>
                    )}
                  </div>

                  {/* Avatar AMIGO */}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${socialState === 2
                      ? 'border-green-500 bg-green-500/10 text-green-500 scale-110'
                      : socialState === 1
                        ? 'border-accent/50 text-accent animate-pulse'
                        : 'border-white/10 bg-bg-secondary text-text-tertiary'
                      }`}>
                      {socialState === 2 ? <Check size={16} strokeWidth={3} /> : <UserPlus size={16} />}
                    </div>
                  </div>

                  {/* Pop-up "Amigos" */}
                  <div className={`absolute top-2 left-1/2 -translate-x-1/2 transition-all duration-500 ${socialState === 2 ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
                    }`}>
                    <div className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                      <Heart size={8} className="fill-current" /> Amigos
                    </div>
                  </div>

                </div>
              </div>
              <p className="mt-3 text-xs text-text-muted text-center">
                Encuentra compañeros, comparte rutinas y compite.
              </p>
            </div>

            {/* --- BLOQUE 4: SUPERSERIES (NUEVO) --- */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-accent/30 transition-colors duration-500 group">
              <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Link size={16} className="text-blue-400" /> Superseries Pro
              </h2>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] h-20 bg-bg-primary/80 border border-glass-border rounded-xl flex items-center justify-center shadow-lg overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                  <div className="flex gap-2 items-center">
                    <div className="bg-bg-secondary/30 p-2 rounded-lg border border-glass-border flex flex-col items-center w-16">
                      <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs mb-1">A1</div>
                      <div className="h-1 w-8 bg-white/10 rounded"></div>
                    </div>
                    <div className="h-0.5 w-6 bg-blue-500/50"></div>
                    <div className="bg-bg-secondary/30 p-2 rounded-lg border border-glass-border flex flex-col items-center w-16">
                      <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs mb-1">A2</div>
                      <div className="h-1 w-8 bg-white/10 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-text-muted text-center">
                Agrupa ejercicios y gestiona tus circuitos con una nueva interfaz unificada.
              </p>
            </div>

            {/* --- BLOQUE 5: VIBRACIÓN (NUEVO) --- */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-accent/30 transition-colors duration-500 group">
              <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Smartphone size={16} className="text-pink-500" /> Feedback Háptico
              </h2>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] h-20 bg-bg-primary/80 border border-glass-border rounded-xl flex items-center justify-center shadow-lg overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                  <div className="relative">
                    <Smartphone size={32} className="text-text-primary relative z-10" />
                    <div className="absolute inset-0 bg-pink-500/20 rounded-full animate-ping blur-sm"></div>
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-pink-500 rounded-full animate-[pulse_0.5s_ease-in-out_infinite]"></div>
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-pink-500 rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.1s]"></div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-text-muted text-center">
                Siente cada repetición, descanso y logro con la nueva respuesta táctil.
              </p>
            </div>

          </div>

          {/* --- Footer --- */}
          <div className="mt-auto pt-2">
            <button
              onClick={handleGetStarted}
              className="group w-full py-4 px-6 bg-gradient-to-r from-accent to-accent-secondary hover:to-accent text-bg-primary font-black rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent/20 flex items-center justify-center gap-3"
            >
              <span className="tracking-wide">DESCUBRIR LA V4</span>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="text-center mt-4">
              <span className="text-[10px] text-text-tertiary uppercase tracking-widest opacity-50">
                Build {appVersion}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;