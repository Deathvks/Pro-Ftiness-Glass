/* frontend/src/components/NetworkIndicatorBadge.jsx */
import React from 'react';
import { SignalLow, WifiOff } from 'lucide-react';

/**
 * Indicador de red inestable o modo offline sobre la foto de perfil.
 * Muestra iconos de cobertura + signo de exclamación en los colores de acento.
 * Desaparece automáticamente cuando la conexión se restablece y se sincronizan los datos.
 */
export const NetworkIndicatorBadge = ({ isOffline = false, pendingCount = 0, className = '' }) => {
  const tooltipText = isOffline
    ? 'Sin conexión a internet • Modo local activo (los datos se guardan en tu dispositivo)'
    : pendingCount > 0
      ? `Red inestable • ${pendingCount} cambio(s) guardados en local esperando cobertura`
      : 'Red inestable';

  return (
    <div
      className={`absolute -bottom-1 -right-1.5 z-30 flex items-center justify-center gap-0.5 px-1 py-0.5 rounded-full bg-accent text-accent-contrast border-[1.5px] border-bg-primary dark:border-[#121214] shadow-md shadow-accent/40 animate-pulse select-none pointer-events-none ${className}`}
      title={tooltipText}
      aria-label={tooltipText}
    >
      {isOffline ? (
        <WifiOff size={9} strokeWidth={2.8} className="shrink-0" />
      ) : (
        <SignalLow size={9} strokeWidth={2.8} className="shrink-0" />
      )}
      <span className="text-[9px] font-black leading-none -ml-0.5">!</span>
    </div>
  );
};

export default NetworkIndicatorBadge;
