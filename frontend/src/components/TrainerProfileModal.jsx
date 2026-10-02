import React, { useState, useRef, useEffect } from 'react';
import ModalPortal from './ModalPortal';
import { X, GraduationCap, Star, ShieldCheck, Award, Flame, CheckCircle2 } from 'lucide-react';

export default function TrainerProfileModal({ visible, onClose, trainer }) {
  const [scrollPos, setScrollPos] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (visible && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      setScrollPos(0);
    }
  }, [visible]);

  if (!visible) return null;

  const handleScroll = (e) => {
    setScrollPos(e.target.scrollTop);
  };

  const imageScale = Math.max(1, 1 - (scrollPos * 0.002));
  const imageOpacity = Math.max(0, 1 - (scrollPos * 0.003));
  const headerOpacity = Math.min(1, scrollPos / 200);

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 animate-fade-in">
        {/* Backdrop animado */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500"
          onClick={onClose}
        />

        {/* Contenedor Principal Épico */}
        <div 
          className="relative w-full h-[95vh] sm:h-[85vh] sm:w-[500px] sm:max-w-full bg-bg-primary sm:rounded-[32px] rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden animate-slide-up-ios"
          style={{ boxShadow: '0 -20px 60px rgba(0,0,0,0.5), 0 0 100px rgba(var(--accent-rgb, 234, 179, 8), 0.15)' }}
        >
          {/* Header Pegajoso (Aparece al scrollear) */}
          <div 
            className="absolute top-0 left-0 right-0 h-16 sm:h-20 bg-bg-primary/90 backdrop-blur-xl z-50 flex items-center justify-between px-4 sm:px-6 border-b border-glass-border transition-opacity duration-300"
            style={{ opacity: headerOpacity }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-accent/20 border-2 border-accent">
                <img src="/trainer-profile.jpg" alt="Mini" className="w-full h-full object-cover object-center" />
              </div>
              <span className="font-black text-text-primary text-sm sm:text-base">
                {trainer?.name || 'Entrenador Personal'}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary flex items-center justify-center transition-all active:scale-95"
            >
              <X size={20} strokeWidth={3} />
            </button>
          </div>

          {/* Boton Cerrar Superior Fijo (Antes del scroll) */}
          <button 
            onClick={onClose}
            style={{ opacity: 1 - headerOpacity }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95 z-50"
          >
            <X size={20} strokeWidth={3} />
          </button>

          {/* Area de Scroll */}
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth"
          >
            {/* Imagen Hero Parallax */}
            <div className="relative h-[50vh] sm:h-[350px] w-full shrink-0 origin-bottom" style={{ transform: \scale(\)\, opacity: imageOpacity }}>
              <img 
                src="/trainer-profile.jpg" 
                alt="Perfil del Entrenador" 
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-bg-primary" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent h-48 bottom-0" />
            </div>

            {/* Contenido Épico */}
            <div className="relative z-10 px-6 sm:px-8 -mt-24 sm:-mt-32 pb-24">
              
              {/* Título y Verificación */}
              <div className="flex flex-col items-center text-center mb-10">
                <div className="relative">
                  <h2 className="text-4xl sm:text-5xl font-black text-text-primary tracking-tight mb-2 uppercase drop-shadow-md">
                    {trainer?.name || 'ENTRENADOR'}
                  </h2>
                  <div className="absolute -right-6 -top-2 text-accent animate-pulse">
                    <ShieldCheck size={28} />
                  </div>
                </div>
                
                <span className="px-5 py-2 rounded-full bg-accent text-accent-contrast text-sm sm:text-base font-black uppercase tracking-widest shadow-lg shadow-accent/30 flex items-center gap-2 mt-2">
                  <Flame size={18} strokeWidth={3} />
                  Preparador Oficial
                </span>
              </div>

              {/* Grid de Estudios (Efecto Tarjetas Glassmorphism) */}
              <section className="mb-12 relative">
                <div className="absolute -inset-4 bg-accent/5 rounded-[32px] blur-2xl -z-10" />
                <div className="flex items-center gap-3 mb-6 justify-center">
                  <GraduationCap size={28} className="text-accent" />
                  <h3 className="text-2xl font-black text-text-primary uppercase tracking-wide">Mis Estudios</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Grado superior de acondicionamiento físico',
                    'Grado universitario de CAFyD',
                    'Máster de entrenamiento personal',
                    'Máster de nutrición aplicada',
                    'Certificación Nivel 1 en Biomecánica'
                  ].map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-3 p-4 rounded-[20px] bg-black/5 dark:bg-white/5 border border-glass-border hover:border-accent/50 transition-all hover:bg-accent/10 group"
                      style={{ animationDelay: \\ms\ }}
                    >
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                        <Award size={20} className="text-accent group-hover:text-accent-contrast" />
                      </div>
                      <span className="text-sm font-bold text-text-primary leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Sección Especialidades Épica */}
              <section className="relative">
                <div className="absolute -inset-4 bg-blue-500/5 rounded-[32px] blur-2xl -z-10" />
                <div className="flex items-center gap-3 mb-6 justify-center">
                  <Star size={28} className="text-accent fill-accent" />
                  <h3 className="text-2xl font-black text-text-primary uppercase tracking-wide">Especialidades</h3>
                </div>
                
                <div className="space-y-4">
                  {[
                    'Rehabilitación y readaptación de lesiones y patologías',
                    'Trabajo de rotaciones aplicado a rendimiento deportivo y salud',
                    'Entrenamiento personalizado a tu día y vida diaria'
                  ].map((item, idx) => (
                    <div 
                      key={idx} 
                      className="relative overflow-hidden flex items-center gap-4 p-5 rounded-[24px] bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 group hover:from-accent/20 transition-all"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent rounded-l-[24px]" />
                      <CheckCircle2 size={24} className="text-accent shrink-0" />
                      <span className="text-sm sm:text-base font-extrabold text-text-primary leading-tight">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          </div>
          
        </div>
      </div>
    </ModalPortal>
  );
}
