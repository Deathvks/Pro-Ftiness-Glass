export const XP_BOOST_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export interface ActiveXpBoostInfo {
  multiplier: number;
  level: number;
  startedAt: string;
  expiresAt: string;
  startedAtMs: number;
  expiresAtMs: number;
  remainingMs: number;
  totalMs: number;
  progressRemainingPct: number;
}

export const getXpMultiplierForLevel = (level: number): number => {
  const num = Number(level);
  if (!Number.isFinite(num) || num <= 0 || !Number.isInteger(num)) return 1;
  if (num % 10 === 0) return 2;
  if (num % 10 === 5) return 1.5;
  return 1;
};

export const getNextXpBoostMilestone = (currentLevel: number) => {
  const cur = Math.max(1, Math.floor(Number(currentLevel) || 1));
  const nextMultipleOf5 = Math.floor(cur / 5) * 5 + 5;
  return {
    level: nextMultipleOf5,
    multiplier: getXpMultiplierForLevel(nextMultipleOf5),
  };
};

export const formatXpMultiplier = (multiplier: number): string => {
  const num = Number(multiplier);
  if (num === 2) return 'x2';
  if (num === 1.5) return 'x1,5';
  return 'x1';
};

export const getActiveXpBoost = (xpBoost: any, nowMs: number = Date.now()): ActiveXpBoostInfo | null => {
  if (!xpBoost || typeof xpBoost !== 'object') return null;
  const multiplier = Number(xpBoost.multiplier);
  const level = Number(xpBoost.level);
  const expiresAtMs = Date.parse(xpBoost.expiresAt);
  const startedAtMs = Date.parse(xpBoost.startedAt);
  const now = Number(nowMs) || Date.now();

  if (!Number.isFinite(multiplier) || multiplier <= 1) return null;
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= now) return null;

  const remainingMs = Math.max(0, expiresAtMs - now);
  const totalMs =
    Number.isFinite(startedAtMs) && expiresAtMs > startedAtMs
      ? expiresAtMs - startedAtMs
      : XP_BOOST_DURATION_MS;
  const progressRemainingPct = Math.min(100, Math.max(0, (remainingMs / totalMs) * 100));

  return {
    multiplier,
    level: Number.isFinite(level) ? level : 5,
    startedAt: Number.isFinite(startedAtMs) ? new Date(startedAtMs).toISOString() : xpBoost.startedAt,
    expiresAt: new Date(expiresAtMs).toISOString(),
    startedAtMs: Number.isFinite(startedAtMs) ? startedAtMs : expiresAtMs - totalMs,
    expiresAtMs,
    remainingMs,
    totalMs,
    progressRemainingPct,
  };
};

export const formatXpBoostCountdown = (remainingMs: number, compact = false): string => {
  const ms = Math.max(0, Number(remainingMs) || 0);
  if (ms <= 0) return '00m 00s';

  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  if (compact) {
    if (days >= 1) return `${days}d ${hours}h`;
    if (hours >= 1) return `${hours}h ${minutes}m`;
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }

  if (days >= 1) {
    return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
  }
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
};

export const getBoostedXpAmount = (baseAmount: number, activeBoost: ActiveXpBoostInfo | null): number => {
  const base = Number(baseAmount) || 0;
  if (!activeBoost || activeBoost.multiplier <= 1 || base <= 0) return base;
  return Math.round(base * activeBoost.multiplier);
};
