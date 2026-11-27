/* frontend/src/components/XpBoostClockPill.jsx */
import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { formatXpBoostCountdown, formatXpMultiplier, getActiveXpBoost } from '../utils/xpBoost';

/**
 * Pastilla compacta con icono de reloj para mostrar antes de abrir Sistema XP
 * que existe un multiplicador semanal activo (x1,5 o x2) y su cuenta atrás.
 */
export default function XpBoostClockPill({ xpBoost, className = '' }) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const activeBoost = getActiveXpBoost(xpBoost, nowMs);

  useEffect(() => {
    if (!xpBoost?.expiresAt) return undefined;
    const initial = getActiveXpBoost(xpBoost, Date.now());
    if (!initial) return undefined;

    const tickMs = initial.remainingMs < 3600000 ? 1000 : 15000;
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, tickMs);
    return () => clearInterval(timer);
  }, [xpBoost?.expiresAt, xpBoost?.multiplier]);

  if (!activeBoost) return null;

  const isX2 = activeBoost.multiplier >= 2;
  const label = `${formatXpMultiplier(activeBoost.multiplier)} · ${formatXpBoostCountdown(activeBoost.remainingMs, { compact: true })}`;

  return (
    <span
      title={`Boost semanal ${formatXpMultiplier(activeBoost.multiplier)} activo (Nivel ${activeBoost.level})`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight whitespace-nowrap shrink-0 tabular-nums shadow-sm ${
        isX2
          ? 'bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/40'
          : 'bg-accent/15 text-accent ring-1 ring-accent/35'
      } ${className}`}
    >
      <Clock size={11} strokeWidth={2.6} className="shrink-0 animate-pulse" />
      <span>{label}</span>
    </span>
  );
}
