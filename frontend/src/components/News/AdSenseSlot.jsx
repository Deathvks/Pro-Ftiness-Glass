/* frontend/src/components/News/AdSenseSlot.jsx */
import React, { useEffect, useRef } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import GlassCard from '../GlassCard';

/**
 * Contenedor de Anuncios adaptable para Google AdSense
 * Cumple con las políticas de Google: etiqueta de "PUBLICIDAD" visible y responsive.
 * Si no hay script de AdSense cargado o está en desarrollo, muestra un banner de alta conversión de la app.
 */
export default function AdSenseSlot({
  slotId = '',
  format = 'auto',
  className = '',
  variant = 'horizontal'
}) {
  const adRef = useRef(null);
  const adsenseClientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || '';

  useEffect(() => {
    if (adsenseClientId && window.adsbygoogle && adRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.warn('AdSense push error:', err);
      }
    }
  }, [adsenseClientId, slotId]);

  // Si está configurado Google AdSense en producción
  if (adsenseClientId && slotId) {
    return (
      <div className={`w-full my-6 flex flex-col items-center overflow-hidden ${className}`}>
        <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-1 opacity-70">
          Publicidad
        </span>
        <div ref={adRef} className="w-full text-center overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 p-2 min-h-[90px] flex items-center justify-center">
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%' }}
            data-ad-client={adsenseClientId}
            data-ad-slot={slotId}
            data-ad-format={format}
            data-full-width-responsive="true"
          />
        </div>
      </div>
    );
  }

  // Fallback elegante / Banner interno de captación (mientras se aprueba la cuenta de AdSense)
  return (
    <div className={`w-full my-6 flex flex-col items-center ${className}`}>
      <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-1.5 opacity-60">
        Recomendado
      </span>
      <GlassCard className="glass w-full p-4 sm:p-5 rounded-2xl border-none ring-1 ring-accent/30 bg-gradient-to-r from-accent/10 via-accent/5 to-transparent flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0 text-accent">
            <Sparkles size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary">
              Registra tu progreso gratis en Pro Fitness Glass
            </h4>
            <p className="text-xs text-text-secondary mt-0.5">
              Rutinas personalizadas, seguimiento de macros con IA y gráficas de récords.
            </p>
          </div>
        </div>
        <a
          href="/register"
          className="shrink-0 px-4 py-2 rounded-full bg-accent text-accent-contrast font-bold text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-sm"
        >
          <span>Empezar gratis</span>
          <ArrowRight size={14} />
        </a>
      </GlassCard>
    </div>
  );
}
