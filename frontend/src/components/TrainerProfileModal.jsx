import React, { useState, useRef, useEffect } from 'react';
import ModalPortal from './ModalPortal';
import { 
  AcademicCapIcon, 
  SparklesIcon, 
  ShieldCheckIcon, 
  TrophyIcon, 
  FireIcon, 
  BoltIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/solid';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import useModalLock from '../hooks/useModalLock';

export default function TrainerProfileModal({ visible, onClose, trainer }) {
  useModalLock(visible);
  
  const scrollRef = useRef(null);
  const imageRef = useRef(null);
  const headerRef = useRef(null);
  const hintRef = useRef(null);
  const closeBtnRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Swipe to close logic
  const [touchStart, setTouchStart] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  useEffect(() => {
    if (visible) {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
        if (imageRef.current) { imageRef.current.style.transform='scale(1)'; imageRef.current.style.opacity=1; }
        if (headerRef.current) { headerRef.current.style.opacity=0; }
        if (hintRef.current) { hintRef.current.style.opacity=1; }
      }
      setSwipeOffset(0);
      setTimeout(() => setIsLoaded(true), 50);
    } else {
      setIsLoaded(false);
    }
  }, [visible]);

  if (!visible) return null;

  const handleScroll = (e) => {
    const y = e.target.scrollTop;
    if (imageRef.current) {
      const isPullDown = y < 0;
      const imageScale = isPullDown ? 1 + Math.abs(y) * 0.005 : Math.max(1, 1 + (y * 0.0015));
      const imageOpacity = Math.max(0, 1 - (y * 0.0025));
      imageRef.current.style.transform = `scale(${imageScale})`;
      imageRef.current.style.opacity = imageOpacity;
    }
    if (headerRef.current) {
      const headerOpacity = Math.min(1, Math.max(0, y) / 150);
      headerRef.current.style.opacity = headerOpacity;
      headerRef.current.style.pointerEvents = headerOpacity > 0.1 ? 'auto' : 'none';
    }
    if (hintRef.current) {
      hintRef.current.style.opacity = y < 50 ? 1 : 0;
    }
    if (closeBtnRef.current) {
      closeBtnRef.current.style.backgroundColor = y > 100 ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.2)';
      closeBtnRef.current.style.borderColor = y > 100 ? 'transparent' : 'rgba(255,255,255,0.1)';
      closeBtnRef.current.style.color = y > 100 ? 'var(--text-primary)' : 'white';
    }
  };

  const handleTouchStart = (e) => {
    // Solo permitir deslizar para cerrar si estamos arriba del todo
    if (scrollRef.current && scrollRef.current.scrollTop <= 0) {
      setTouchStart(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (touchStart === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStart;
    
    if (diff > 0) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 100) {
      onClose();
    }
    setTouchStart(null);
    setSwipeOffset(0);
  };

  // Si scrollPos es negativo (overscroll en iOS), la imagen crece para que no se vea una franja blanca
  

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 animate-fade-in isolate text-left">
        {/* Backdrop Épico */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity duration-500"
          onClick={onClose}
        />

        {/* Contenedor Principal */}
        <div 
          className="relative w-full h-[calc(100dvh-4.5rem)] sm:h-[90vh] sm:w-[540px] sm:max-w-full bg-bg-primary sm:rounded-[36px] rounded-t-[36px] shadow-[0_0_80px_rgba(var(--accent-rgb, 234,179,8),0.15)] flex flex-col overflow-hidden animate-slide-up-ios border border-white/5"
          style={{
            transform: swipeOffset > 0 ? `translateY(${swipeOffset}px)` : undefined,
            transition: touchStart !== null ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Header Pegajoso (Aparece al scrollear) */}
          <div ref={headerRef} className="absolute top-0 left-0 right-0 h-16 sm:h-20 bg-bg-primary/80 backdrop-blur-2xl z-50 flex items-center justify-between px-4 sm:px-6 border-b border-glass-border transition-opacity duration-300" style={{ opacity: 0, pointerEvents: 'none' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-accent/20 border-2 border-accent shadow-[0_0_15px_var(--color-accent-transparent)]">
                <img src="/trainer-profile.jpg" alt="Mini" className="w-full h-full object-cover object-center" />
              </div>
              <span className="font-black text-text-primary text-sm sm:text-base tracking-wide uppercase">ENTRENADOR</span>
            </div>
            {/* Espaciador para el botón X */}
            <div className="w-10 h-10" />
          </div>

          {/* Boton Cerrar ÚNICO y Fijo */}
          <button ref={closeBtnRef} onClick={onClose} className="hidden sm:flex absolute top-3 right-4 sm:top-5 sm:right-6 w-10 h-10 rounded-full items-center justify-center backdrop-blur-md transition-all active:scale-95 z-[60] border" style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}>
            <XMarkIcon className="w-6 h-6" strokeWidth={2.5} />
          </button>

          {/* Barra de móvil para cerrar */}
          <div 
            onClick={onClose}
            className="absolute top-0 inset-x-0 h-10 z-[70] sm:hidden flex items-center justify-center cursor-pointer"
          >
            <div className="w-12 h-1.5 bg-white/50 backdrop-blur-md rounded-full" />
          </div>

          {/* Area de Scroll */}
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth bg-bg-primary overscroll-none"
          >
            {/* Imagen Hero Parallax */}
            <div ref={imageRef} className="relative h-[60vh] sm:h-[450px] w-full shrink-0 origin-top overflow-hidden bg-bg-primary" style={{ transform: 'scale(1)', opacity: 1 }}>
              <img 
                src="/trainer-profile.jpg" 
                alt="Perfil del Entrenador" 
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              
              {/* Overlay oscuro para legibilidad superior */}
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent" />
              
              {/* Degradado suave infinito hacia abajo para fundirse con bg-primary */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-transparent" />
            </div>

            {/* Contenido Épico con animaciones escalonadas */}
            <div className="relative z-10 px-6 sm:px-8 -mt-32 sm:-mt-40 pb-32 flex flex-col items-center">
              
              {/* Título y Verificación */}
              <div className={`flex flex-col items-center text-center mb-12 transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                
                {/* Scroll Hint */}
                <div ref={hintRef} className="flex flex-col items-center gap-1 mb-8 text-text-primary/50 transition-opacity duration-300 opacity-100">
                   <span className="text-[10px] uppercase tracking-[0.3em] font-black">Descubre más</span>
                   <ChevronDownIcon className="w-5 h-5 animate-bounce" strokeWidth={2.5} />
                </div>

                <div className="relative inline-block">
                  <h2 className="text-5xl sm:text-6xl font-black text-text-primary tracking-tighter mb-3 uppercase drop-shadow-xl" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>ENTRENADOR</h2>
                  <div className="absolute -right-8 -top-4 sm:-top-6 text-accent animate-pulse drop-shadow-[0_0_15px_var(--color-accent)]">
                    <ShieldCheckIcon className="w-10 h-10 fill-accent/20 text-accent" />
                  </div>
                </div>
                
                <div className="relative group">
                  <div className="absolute -inset-1 bg-accent rounded-full blur opacity-40 group-hover:opacity-70 transition-opacity duration-300"></div>
                  <span className="relative px-6 py-2.5 rounded-full bg-accent text-accent-contrast text-sm sm:text-base font-black uppercase tracking-[0.2em] shadow-xl flex items-center gap-2">
                    <FireIcon className="w-5 h-5 animate-pulse" />
                    PREPARADOR OFICIAL
                  </span>
                </div>
              </div>

              {/* Grid de Estudios (Efecto Tarjetas Épicas) */}
              <section className={`w-full mb-14 relative transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-accent/5 rounded-full blur-[80px] -z-10 pointer-events-none" />
                
                <div className="flex items-center gap-4 mb-8 justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent/40 flex items-center justify-center shadow-lg shadow-accent/20 rotate-3">
                    <AcademicCapIcon className="w-6 h-6 text-accent-contrast" />
                  </div>
                  <h3 className="text-3xl font-black text-text-primary uppercase tracking-tight">Mis Estudios</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    'Grado superior de acondicionamiento físico',
                    'Grado universitario de CAFyD',
                    'Máster de entrenamiento personal',
                    'Máster de nutrición aplicada',
                    'Certificación Nivel 1 en Biomecánica'
                  ].map((item, idx) => (
                    <div 
                      key={idx} 
                      className="group flex items-center gap-4 p-5 rounded-[24px] bg-bg-secondary/50 backdrop-blur-sm border border-glass-border hover:border-accent/40 transition-all duration-300 hover:shadow-[0_8px_30px_var(--color-accent-transparent)] hover:-translate-y-1"
                    >
                      <div className="w-12 h-12 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:scale-110 transition-all duration-300 border border-transparent group-hover:border-accent-contrast/20">
                        <TrophyIcon className="w-5 h-5 text-text-secondary group-hover:text-accent-contrast transition-colors" />
                      </div>
                      <span className="text-sm font-extrabold text-text-primary leading-tight">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Sección Especialidades Épica */}
              <section className={`w-full relative transition-all duration-700 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-accent/5 rounded-full blur-[80px] -z-10 pointer-events-none" />
                
                <div className="flex items-center gap-4 mb-8 justify-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent/40 flex items-center justify-center shadow-lg shadow-accent/20">
                    <CheckBadgeIcon className="w-7 h-7 text-accent-contrast" />
                  </div>
                  <h3 className="text-3xl font-black text-text-primary uppercase tracking-tight">Especialidades</h3>
                </div>
                
                <div className="space-y-4">
                  {[
                    'Rehabilitación y readaptación de lesiones y patologías',
                    'Trabajo de rotaciones aplicado a rendimiento deportivo y salud',
                    'Entrenamiento personalizado a tu día y vida diaria'
                  ].map((item, idx) => (
                    <div 
                      key={idx} 
                      className="relative overflow-hidden flex items-center gap-5 p-6 rounded-[24px] bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 group hover:from-accent/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_var(--color-accent-transparent)]"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-2 bg-accent rounded-l-[24px] group-hover:w-3 transition-all duration-300 shadow-[0_0_15px_var(--color-accent)]" />
                      <BoltIcon className="w-7 h-7 text-accent shrink-0 group-hover:scale-110 transition-transform duration-300" />
                      <span className="text-base sm:text-lg font-black text-text-primary leading-snug">{item}</span>
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
