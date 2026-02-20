/* frontend/src/components/WelcomeModal.jsx */
import React, { useState, useEffect } from 'react';
import {
  Sparkles, ChevronRight, Share2, Activity, Users, Flame,
  MessageSquare, Zap, Dumbbell, Check, ArrowUpRight, LineChart,
  Bell, Wrench
} from 'lucide-react';
import { APP_VERSION } from '../config/version';

const WelcomeModal = ({ onClose }) => {
  // Forzamos "v6" en la vista aunque la configuración interna sea otra
  const appVersion = `v6.0.0`;

  const handleGetStarted = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-[fade-in_0.3s_ease-out]">

      {/* Contenedor del Modal */}
      <div className="relative w-full max-w-md bg-bg-primary border border-transparent dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Decoración de fondo interna */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-accent/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Scroll interno */}
        <div className="overflow-y-auto custom-scrollbar p-6 flex flex-col h-full relative z-10">

          {/* --- Cabecera V6 --- */}
          <div className="text-center mb-8 flex flex-col items-center mt-2">
            <div className="mb-4 relative group">
              <div className="absolute inset-0 bg-accent/40 blur-xl rounded-full group-hover:bg-accent/60 transition-all duration-500"></div>
              
              {/* Contenedor del Icono V6 */}
              <div className="relative w-24 h-24 bg-gradient-to-br from-bg-secondary to-bg-primary rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-transform duration-500 border border-black/10 dark:border-white/10">
                <span className="text-5xl font-black text-accent drop-shadow-lg">
                  v6
                </span>
              </div>
              
              {/* Badge */}
              <div className="absolute -top-3 -right-6 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-accent/40 animate-bounce z-20 whitespace-nowrap border border-white/20">
                NUEVA ERA
              </div>
            </div>

            <h1 className="text-2xl font-bold bg-gradient-to-r from-text-primary via-accent to-text-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_infinite_linear]">
              Inteligencia & Comunidad
            </h1>
            <p className="text-text-secondary mt-2 text-sm max-w-[90%]">
              Pro Fitness Glass da el salto con gamificación en grupos, IA y un modo para entrenadores personales.
            </p>
          </div>

          <div className="space-y-6 mb-8">

            {/* --- BLOQUE 1: EFECTO WRAPPED / ASSETS VIRALES --- */}
            <div className="bg-bg-secondary border border-black/5 dark:border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-[#ec4899]/50 transition-colors duration-500 group">
              <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Share2 size={16} className="text-[#ec4899]" /> Efecto Wrapped
              </h2>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] h-28 bg-gradient-to-br from-purple-500 to-[#ec4899] rounded-xl overflow-hidden shadow-lg group-hover:scale-[1.02] transition-transform duration-500 flex flex-col p-4 justify-center">
                  <div className="text-[10px] text-white/80 uppercase tracking-widest mb-1 font-semibold">NUEVO RÉCORD (PR)</div>
                  <div className="text-3xl font-black text-white leading-none mb-1">100 KG</div>
                  <div className="text-xs font-medium text-white/90">PRESS BANCA</div>
                  <div className="absolute bottom-3 right-3 bg-white text-[#ec4899] p-1.5 rounded-full shadow-lg">
                    <ArrowUpRight size={14} strokeWidth={3} />
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-text-muted text-center leading-relaxed">
                Genera imágenes increíbles de tus PRs y resúmenes semanales automáticamente. ¡Listos para presumir en Instagram y TikTok!
              </p>
            </div>

            {/* --- BLOQUE 2: ONBOARDING EMOCIONAL --- */}
            <div className="bg-bg-secondary border border-black/5 dark:border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-green-400/40 transition-colors duration-500 group">
              <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Activity size={16} className="text-green-400" /> Onboarding Emocional
              </h2>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] h-24 bg-bg-primary/80 border border-transparent dark:border-white/10 rounded-xl overflow-hidden shadow-lg group-hover:scale-[1.02] transition-transform duration-500 flex items-center p-4 gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 border border-green-500/30">
                    <LineChart size={18} className="text-green-500" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="text-[10px] text-text-muted uppercase font-bold tracking-wide">Para el 15 de Agosto</div>
                    <div className="text-sm font-bold text-text-primary">Lograrás pesar 75kg</div>
                    <div className="w-full h-1.5 bg-bg-secondary rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-green-500 w-[80%] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-text-muted text-center leading-relaxed">
                Nuevo Quiz interactivo. Descubre tu potencial y mira la proyección de tus resultados antes de registrarte.
              </p>
            </div>

            {/* --- BLOQUE 3: GRUPOS Y GAMIFICACIÓN --- */}
            <div className="bg-bg-secondary border border-black/5 dark:border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-blue-400/40 transition-colors duration-500 group">
              <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Users size={16} className="text-blue-400" /> Grupos y Guerra de Rachas
              </h2>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] bg-bg-primary/80 border border-transparent dark:border-white/10 rounded-xl overflow-hidden shadow-lg group-hover:scale-[1.02] transition-transform duration-500 p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-center bg-bg-secondary/80 px-3 py-2 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                      <span className="text-yellow-400 w-3 text-center">1</span> 
                      <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px]">AM</div>
                      Juan
                    </div>
                    <div className="flex gap-1 text-[10px] items-center text-text-secondary">
                      <Flame size={12} className="text-orange-400 fill-orange-400/20" /> 15
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-accent/10 border border-accent/30 px-3 py-2 rounded-lg shadow-[0_0_10px_rgba(var(--accent-rgb),0.1)]">
                    <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                      <span className="text-gray-400 w-3 text-center">2</span> 
                      <div className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[8px]">TU</div>
                      Tú
                    </div>
                    <div className="flex gap-1 text-[10px] items-center text-text-secondary">
                      <Flame size={12} className="text-orange-400 fill-orange-400/20" /> 14
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-text-muted text-center leading-relaxed">
                Crea grupos privados con tus amigos. Compite en rankings cerrados y envía avisos antes de que pierdan su racha.
              </p>
            </div>

            {/* --- BLOQUE 4: ENTRENADOR IA --- */}
            <div className="bg-bg-secondary border border-black/5 dark:border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-purple-400/40 transition-colors duration-500 group">
              <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                <MessageSquare size={16} className="text-purple-400" /> Entrenador Virtual IA
              </h2>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] bg-bg-primary/80 border border-transparent dark:border-white/10 rounded-xl overflow-hidden shadow-lg group-hover:scale-[1.02] transition-transform duration-500 p-3">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/20 blur-xl rounded-full"></div>
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20 shadow-inner">
                      <Zap size={18} className="fill-purple-400/20" />
                    </div>
                    <div className="flex-1 bg-bg-secondary/80 rounded-lg p-2.5 border border-white/5 relative z-10 shadow-sm">
                      <p className="text-[11px] text-text-primary leading-snug italic">
                        "Estancamiento detectado en Sentadilla. ¿Bajamos un 10% el peso y subimos repeticiones hoy?"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-text-muted text-center leading-relaxed">
                Sugerencias Inteligentes que detectan tus estancamientos y analizan desequilibrios musculares en tu rutina actual.
              </p>
            </div>

            {/* --- BLOQUE 5: MODO ENTRENADOR --- */}
            <div className="bg-bg-secondary border border-black/5 dark:border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-accent/40 transition-colors duration-500 group">
              <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Dumbbell size={16} className="text-accent" /> Modo Entrenador Pro
              </h2>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] bg-bg-primary/80 border border-transparent dark:border-white/10 rounded-xl overflow-hidden shadow-lg group-hover:scale-[1.02] transition-transform duration-500 flex flex-col p-4 gap-3">
                  <div className="flex justify-between items-center text-xs font-bold text-text-primary border-b border-white/10 pb-2">
                    <span>Mis Clientes</span>
                    <span className="text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full font-mono text-[10px]">8 / 10 GRATIS</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center bg-bg-secondary/50 px-2.5 py-2 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2 text-xs font-medium"><div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div> Carlos S.</div>
                      <div className="text-[9px] font-bold bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded flex items-center gap-1"><Check size={10} /> Dieta Ok</div>
                    </div>
                    <div className="flex justify-between items-center bg-bg-secondary/50 px-2.5 py-2 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2 text-xs font-medium"><div className="w-2 h-2 bg-blue-400 rounded-full"></div> Laura M.</div>
                      <div className="text-[9px] font-bold bg-accent/20 text-accent px-1.5 py-0.5 rounded flex items-center gap-1"><Check size={10} /> Entrenó</div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-text-muted text-center leading-relaxed">
                ¿Eres PT? Regístrate y gestiona las rutinas y dietas de hasta 10 clientes directamente desde tu panel sin coste adicional.
              </p>
            </div>

            {/* --- BLOQUE 6: FIXES Y NOTIFICACIONES --- */}
            <div className="bg-bg-secondary border border-black/5 dark:border-white/10 rounded-2xl p-5 backdrop-blur-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center shrink-0 border border-yellow-500/20">
                <Bell size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-text-primary mb-1 uppercase tracking-wider">
                  Notificaciones & Correcciones
                </h2>
                <p className="text-xs text-text-muted leading-relaxed">
                  Nuevo sistema de notificaciones push, alertas de descanso, y corrección masiva de errores para una experiencia fluida.
                </p>
              </div>
            </div>

          </div>

          {/* --- Footer --- */}
          <div className="mt-auto pt-2">
            <button
              onClick={handleGetStarted}
              className="group w-full py-4 px-6 bg-gradient-to-r from-accent to-accent-secondary hover:to-accent text-bg-primary font-black rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent/20 flex items-center justify-center gap-3"
            >
              <span className="tracking-wide text-sm">DESCUBRIR LA V6</span>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="text-center mt-4">
              <span className="text-[10px] text-text-tertiary uppercase tracking-widest opacity-50 font-mono">
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