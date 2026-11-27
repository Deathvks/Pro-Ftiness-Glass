import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Clock } from 'lucide-react-native';
import { formatXpBoostCountdown, formatXpMultiplier, getActiveXpBoost } from '@/utils/xpBoost';

interface XpBoostClockPillProps {
  xpBoost: any;
  accentColor: string;
}

/**
 * Pastilla compacta con reloj en el Dashboard nativo para avisar antes de abrir Sistema XP
 * que hay un boost semanal (x1,5 o x2) activo y su tiempo restante.
 */
export function XpBoostClockPill({ xpBoost, accentColor }: XpBoostClockPillProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const activeBoost = getActiveXpBoost(xpBoost, nowMs);

  useEffect(() => {
    if (!xpBoost?.expiresAt) return;
    const initial = getActiveXpBoost(xpBoost, Date.now());
    if (!initial) return;

    const tickMs = initial.remainingMs < 3600000 ? 1000 : 15000;
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, tickMs);
    return () => clearInterval(timer);
  }, [xpBoost?.expiresAt, xpBoost?.multiplier]);

  if (!activeBoost) return null;

  const isX2 = activeBoost.multiplier >= 2;
  const pillColor = isX2 ? '#f59e0b' : accentColor;
  const label = `${formatXpMultiplier(activeBoost.multiplier)} · ${formatXpBoostCountdown(activeBoost.remainingMs, true)}`;

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: isX2 ? 'rgba(245, 158, 11, 0.16)' : accentColor + '1A',
          borderColor: isX2 ? 'rgba(245, 158, 11, 0.42)' : accentColor + '44',
        },
      ]}
    >
      <Clock size={11} color={pillColor} strokeWidth={2.6} />
      <Text numberOfLines={1} style={[styles.text, { color: pillColor }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 0,
  },
  text: {
    fontSize: 10,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.1,
  },
});
