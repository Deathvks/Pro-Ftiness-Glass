const activityTargets = new Map([
  [1.2, 1],
  [1.375, 2],
  [1.55, 4],
  [1.725, 6],
  [1.9, 7]
]);

export const getWeeklyTrainingTarget = activityLevel => activityTargets.get(Number(activityLevel)) ?? 3;

export function trainingDateFormatter(timeZone) {
  try {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: timeZone || 'Europe/Madrid', dateStyle: 'short' });
  } catch {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid', dateStyle: 'short' });
  }
}

export function trainingDateKey(value, formatter) {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : formatter.format(date);
}
