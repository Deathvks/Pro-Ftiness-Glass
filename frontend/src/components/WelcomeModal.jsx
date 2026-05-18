/* frontend/src/components/WelcomeModal.jsx */
import React from 'react';
import {
  Sparkles, ChevronRight, Share2, Activity, Users, Flame,
  MessageSquare, Zap, Dumbbell, Check, ArrowUpRight, LineChart,
  Bell
} from 'lucide-react';
import { APP_VERSION } from '../config/version';

const WelcomeModal = ({ onClose }) => {
  // Tomamos la versión completa y extraemos solo el número mayor (ej: de "6.0.1" sacamos "6")
  const appVersion = `v${APP_VERSION}`;
  const majorVersion = APP_VERSION.split('.')[0];

  const handleGetStarted = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-[fade-in_0.3s_ease-out]">

      {/* Contenedor del Modal */}
      <div className="relative w-full max-w-[480px] bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-[slide-up_0.3s_ease-out]">

        {/* Decoración de fondo interna */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-accent/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Scroll interno */}
        <div className="overflow-y-auto custom-scrollbar p-6 sm:p-8 flex flex-col h-full relative z-10">

          {/* --- Cabecera Dinámica --- */}
          <div className="text-center mb-10 flex flex-col items-center mt-2">
            <div className="mb-6 relative group">
              <div className="absolute inset-0 bg-accent/40 blur-2xl rounded-full group-hover:bg-accent/60 transition-all duration-500"></div>
              
              {/* Contenedor del Icono Dinámico */}
              <div className="relative w-28 h-28 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[28px] flex items-center justify-center shadow-xl backdrop-blur-xl transform group-hover:scale-105 transition-transform duration-500">
                <span className="text-6xl font-black text-accent drop-shadow-lg tracking-tighter">
                  v{majorVersion}
                </span>
              </div>
              
              {/* Badge */}
              <div className="absolute -top-3 -right-6 bg-accent text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-accent/40 animate-bounce z-20 whitespace-nowrap tracking-widest">
                NUEVA ERA
              </div>
            </div>

            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-text-primary via-accent to-text-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_infinite_linear] tracking-tight mb-3">
              Inteligencia & Comunidad
            </h1>
            <p className="text-text-secondary font-medium text-sm leading-relaxed max-w-[90%] mx-auto">
              Pro Fitness Glass da el salto con gamificación en grupos, IA y un modo avanzado para entrenadores.
            </p>
          </div>

          <div className="space-y-5 mb-8">

            {/* --- BLOQUE 1: EFECTO WRAPPED / ASSETS VIRALES --- */}
            <div className="bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[24px] p-5 sm:p-6 backdrop-blur-xl hover:ring-[#ec4899]/50 hover:shadow-lg hover:shadow-[#ec4899]/10 hover:-translate-y-1 transition-all duration-300 group">
              <h2 className="text-xs font-bold text-text-primary mb-5 flex items-center gap-2 uppercase tracking-widest">
                <Share2 size={18} className="text-[#ec4899] shrink-0" strokeWidth={2.5} /> Efecto Wrapped
              </h2>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] h-28 bg-gradient-to-br from-purple-500 to-[#ec4899] rounded-[20px] overflow-hidden shadow-md group-hover:scale-[1.02] transition-transform duration-500 flex flex-col p-4 justify-center">
                  <div className="text-[10px] text-white/80 uppercase tracking-widest mb-1 font-bold">NUEVO RÉCORD (PR)</div>
                  <div className="text-3xl font-black text-white tracking-tight leading-none mb-1">100 KG</div>
                  <div className="text-[11px] font-bold text-white/90 uppercase tracking-wider">PRESS BANCA</div>
                  <div className="absolute bottom-3 right-3 bg-white text-[#ec4899] p-1.5 rounded-full shadow-lg">
                    <ArrowUpRight size={16} strokeWidth={3} />
                  </div>
                </div>
              </div>
              <p className="mt-5 text-[13px] font-medium text-text-secondary text-center leading-relaxed">
                Genera imágenes increíbles de tus PRs y resúmenes semanales automáticamente. ¡Listos para presumir en Instagram y TikTok!
              </p>
            </div>

            {/* --- BLOQUE 2: ONBOARDING EMOCIONAL --- */}
            <div className="bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[24px] p-5 sm:p-6 backdrop-blur-xl hover:ring-green-500/50 hover:shadow-lg hover:shadow-green-500/10 hover:-translate-y-1 transition-all duration-300 group">
              <h2 className="text-xs font-bold text-text-primary mb-5 flex items-center gap-2 uppercase tracking-widest">
                <Activity size={18} className="text-green-500 shrink-0" strokeWidth={2.5} /> Onboarding Emocional
              </h2>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] h-24 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 rounded-[20px] overflow-hidden shadow-sm group-hover:scale-[1.02] transition-transform duration-500 flex items-center p-4 gap-4">
                  <div className="w-10 h-10 rounded-[12px] bg-green-500/10 flex items-center justify-center shrink-0 ring-1 ring-green-500/30">
                    <LineChart size={20} className="text-green-500" strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="text-[9px] text-text-muted uppercase font-bold tracking-widest mb-0.5">Para el 15 de Agosto</div>
                    <div className="text-sm font-extrabold text-text-primary truncate tracking-tight">Lograrás pesar 75kg</div>
                    <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full mt-2.5 overflow-hidden">
                      <div className="h-full bg-green-500 w-[80%] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-[13px] font-medium text-text-secondary text-center leading-relaxed">
                Nuevo Quiz interactivo. Descubre tu potencial y mira la proyección de tus resultados antes de registrarte.
              </p>
            </div>

            {/* --- BLOQUE 3: GRUPOS Y GAMIFICACIÓN --- */}
            <div className="bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[24px] p-5 sm:p-6 backdrop-blur-xl hover:ring-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 group">
              <h2 className="text-xs font-bold text-text-primary mb-5 flex items-center gap-2 uppercase tracking-widest">
                <Users size={18} className="text-blue-500 shrink-0" strokeWidth={2.5} /> Grupos de Rachas
              </h2>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 rounded-[20px] overflow-hidden shadow-sm group-hover:scale-[1.02] transition-transform duration-500 p-3.5 flex flex-col gap-2.5">
                  <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 px-3 py-2.5 rounded-[14px] ring-1 ring-black/5 dark:ring-white/10">
                    <div className="flex items-center gap-2.5 text-xs font-bold text-text-primary">
                      <span className="text-yellow-500 w-3 text-center">1</span> 
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] shadow-sm">AM</div>
                      Juan
                    </div>
                    <div className="flex gap-1.5 text-[11px] font-bold items-center text-text-secondary">
                      <Flame size={14} className="text-orange-500 fill-orange-500/20" /> 15
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-accent/10 ring-1 ring-accent/30 px-3 py-2.5 rounded-[14px] shadow-sm">
                    <div className="flex items-center gap-2.5 text-xs font-bold text-text-primary">
                      <span className="text-text-muted w-3 text-center">2</span> 
                      <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[9px] shadow-sm">TU</div>
                      Tú
                    </div>
                    <div className="flex gap-1.5 text-[11px] font-bold items-center text-text-secondary">
                      <Flame size={14} className="text-orange-500 fill-orange-500/20" /> 14
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-[13px] font-medium text-text-secondary text-center leading-relaxed">
                Crea grupos privados con tus amigos. Compite en rankings cerrados y envía avisos antes de que pierdan su racha.
              </p>
            </div>

            {/* --- BLOQUE 4: ENTRENADOR IA --- */}
            <div className="bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[24px] p-5 sm:p-6 backdrop-blur-xl hover:ring-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 group">
              <h2 className="text-xs font-bold text-text-primary mb-5 flex items-center gap-2 uppercase tracking-widest">
                <MessageSquare size={18} className="text-purple-500 shrink-0" strokeWidth={2.5} /> Entrenador Virtual IA
              </h2>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 rounded-[20px] overflow-hidden shadow-sm group-hover:scale-[1.02] transition-transform duration-500 p-4">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-2xl rounded-full"></div>
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-[12px] bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 ring-1 ring-purple-500/20">
                      <Zap size={20} className="fill-purple-500/20" />
                    </div>
                    <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-[16px] p-3 ring-1 ring-black/5 dark:ring-white/10 relative z-10 shadow-inner">
                      <p className="text-[11px] font-medium text-text-primary leading-relaxed italic">
                        "Estancamiento detectado en Sentadilla. ¿Bajamos un 10% el peso y subimos repeticiones hoy?"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-[13px] font-medium text-text-secondary text-center leading-relaxed">
                Sugerencias Inteligentes que detectan tus estancamientos y analizan desequilibrios musculares en tu rutina actual.
              </p>
            </div>

            {/* --- BLOQUE 5: MODO ENTRENADOR --- */}
            <div className="bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[24px] p-5 sm:p-6 backdrop-blur-xl hover:ring-accent/50 hover:shadow-lg hover:shadow-accent/10 hover:-translate-y-1 transition-all duration-300 group">
              <h2 className="text-xs font-bold text-text-primary mb-5 flex items-center gap-2 uppercase tracking-widest">
                <Dumbbell size={18} className="text-accent shrink-0" strokeWidth={2.5} /> Modo Entrenador Pro
              </h2>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 rounded-[20px] overflow-hidden shadow-sm group-hover:scale-[1.02] transition-transform duration-500 flex flex-col p-4 gap-4">
                  <div className="flex justify-between items-center text-xs font-extrabold text-text-primary border-b border-black/5 dark:border-white/10 pb-3">
                    <span>Mis Clientes</span>
                    <span className="text-accent bg-accent/10 ring-1 ring-accent/30 px-2 py-1 rounded-[8px] font-mono text-[9px] tracking-widest">8/10 GRATIS</span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 px-3 py-2.5 rounded-[14px] ring-1 ring-black/5 dark:ring-white/10">
                      <div className="flex items-center gap-2.5 text-xs font-bold text-text-primary"><div className="w-2 h-2 bg-accent rounded-full animate-pulse shadow-[0_0_8px_var(--accent)]"></div> Carlos S.</div>
                      <div className="text-[9px] font-bold uppercase tracking-wider bg-green-500/10 text-green-500 ring-1 ring-green-500/30 px-2 py-1 rounded-[8px] flex items-center gap-1.5"><Check size={12} strokeWidth={3} /> Dieta Ok</div>
                    </div>
                    <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 px-3 py-2.5 rounded-[14px] ring-1 ring-black/5 dark:ring-white/10">
                      <div className="flex items-center gap-2.5 text-xs font-bold text-text-primary"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Laura M.</div>
                      <div className="text-[9px] font-bold uppercase tracking-wider bg-accent/10 text-accent ring-1 ring-accent/30 px-2 py-1 rounded-[8px] flex items-center gap-1.5"><Check size={12} strokeWidth={3} /> Entrenó</div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-[13px] font-medium text-text-secondary text-center leading-relaxed">
                ¿Eres PT? Regístrate y gestiona las rutinas y dietas de hasta 10 clientes directamente desde tu panel sin coste adicional.
              </p>
            </div>

            {/* --- BLOQUE 6: FIXES Y NOTIFICACIONES --- */}
            <div className="bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[24px] p-5 sm:p-6 backdrop-blur-xl hover:ring-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/10 hover:-translate-y-1 transition-all duration-300 flex items-start sm:items-center gap-4 group">
              <div className="w-12 h-12 rounded-[16px] bg-yellow-500/10 text-yellow-500 flex items-center justify-center shrink-0 ring-1 ring-yellow-500/30">
                <Bell size={24} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-text-primary mb-2 uppercase tracking-widest">
                  Alertas & Mejoras
                </h2>
                <p className="text-[13px] font-medium text-text-secondary leading-relaxed">
                  Nuevo sistema de notificaciones push, alertas de descanso, y corrección masiva de errores para una experiencia fluida.
                </p>
              </div>
            </div>

          </div>

          {/* --- Footer --- */}
          <div className="mt-auto pt-4">
            <button
              onClick={handleGetStarted}
              className="w-full py-4 bg-accent text-white font-bold text-lg rounded-[20px] transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-accent/20 flex items-center justify-center gap-3"
            >
              <span>DESCUBRIR LA V{majorVersion}</span>
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>

            <div className="text-center mt-5">
              <span className="text-[10px] text-text-tertiary uppercase tracking-widest font-bold">
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