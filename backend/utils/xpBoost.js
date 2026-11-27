/* backend/utils/xpBoost.js */

export const XP_BOOST_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export const parseDailyGamificationState = (rawState) => {
  if (!rawState) return {};
  if (typeof rawState === 'string') {
    try {
      const parsed = JSON.parse(rawState);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof rawState === 'object' ? { ...rawState } : {};
};

export const getXpMultiplierForMilestoneLevel = (level) => {
  const num = Number(level);
  if (!Number.isFinite(num) || num <= 0 || !Number.isInteger(num)) return 1;
  if (num % 10 === 0) return 2;
  if (num % 10 === 5) return 1.5;
  return 1;
};

export const getBestMilestoneBoostCrossed = (oldLevel, newLevel) => {
  const from = Math.max(1, Number(oldLevel) || 1);
  const to = Math.max(from, Number(newLevel) || from);
  if (to <= from) return null;

  let best = null;
  for (let lvl = from + 1; lvl <= to; lvl++) {
    const mult = getXpMultiplierForMilestoneLevel(lvl);
    if (mult > 1 && (!best || mult >= best.multiplier)) {
      best = { level: lvl, multiplier: mult };
    }
  }
  return best;
};

export const formatXpMultiplierLabel = (multiplier) => {
  const num = Number(multiplier);
  if (num === 2) return 'x2';
  if (num === 1.5) return 'x1,5';
  return 'x1';
};

export const createXpBoostPayload = (level, multiplier, nowMs = Date.now()) => {
  const start = Number(nowMs) || Date.now();
  const expires = start + XP_BOOST_DURATION_MS;
  return {
    level: Number(level),
    multiplier: Number(multiplier),
    startedAt: new Date(start).toISOString(),
    expiresAt: new Date(expires).toISOString(),
  };
};

export const getActiveXpBoostFromState = (rawState, nowMs = Date.now()) => {
  const state = parseDailyGamificationState(rawState);
  const boost = state.xp_boost;
  if (!boost || typeof boost !== 'object') return null;

  const multiplier = Number(boost.multiplier);
  const level = Number(boost.level);
  const expiresAtMs = Date.parse(boost.expiresAt);
  const startedAtMs = Date.parse(boost.startedAt);
  const now = Number(nowMs) || Date.now();

  if (!Number.isFinite(multiplier) || multiplier <= 1) return null;
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= now) return null;

  return {
    level: Number.isFinite(level) ? level : 5,
    multiplier,
    startedAt: Number.isFinite(startedAtMs) ? new Date(startedAtMs).toISOString() : boost.startedAt,
    expiresAt: new Date(expiresAtMs).toISOString(),
    remainingMs: Math.max(0, expiresAtMs - now),
  };
};

export const getActiveXpBoostFromUser = (user, nowMs = Date.now()) => {
  if (!user) return null;
  return getActiveXpBoostFromState(user.daily_gamification_state, nowMs);
};
