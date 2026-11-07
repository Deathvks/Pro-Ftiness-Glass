export function trainingDateFormatter(timeZone) {
  try {
    return new Intl.DateTimeFormat('sv-SE', { timeZone, dateStyle: 'short' });
  } catch {
    return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short' });
  }
}

export function getTrainingWeek(workoutLog, today, formatter) {
  const monday = new Date(`${today}T00:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });

  const trainedDays = new Set();
  const logs = (Array.isArray(workoutLog) ? workoutLog : []).filter(log => {
    const value = log?.workout_date;
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    const day = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : formatter.format(date);
    if (day < days[0] || day > today) return false;
    trainedDays.add(day);
    return true;
  });
  return { days, trainedDays, logs };
}
