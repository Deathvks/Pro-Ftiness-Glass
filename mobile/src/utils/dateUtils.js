/* mobile/src/utils/dateUtils.js */

const parseLocalSafeDate = (date) => {
  if (!date) return null;
  if (date instanceof Date) return isNaN(date.getTime()) ? null : date;
  const str = String(date).trim();
  if (!str) return null;
  const pureDate = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (pureDate) {
    return new Date(Number(pureDate[1]), Number(pureDate[2]) - 1, Number(pureDate[3]));
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

// Formatear fecha para mostrar (siempre fecha local YYYY-MM-DD)
export const formatDate = (date) => {
  const d = parseLocalSafeDate(date);
  if (!d) return '';
  return formatDateForQuery(d);
};

// Formatear fecha para mostrar al usuario
export const formatDateForDisplay = (date) => {
  if (!date) return '';
  const d = parseLocalSafeDate(date);
  if (!d) return '';
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Obtener fecha de hoy en formato YYYY-MM-DD (local)
export const getTodayDate = () => {
  return formatDateForQuery(new Date());
};

// Verificar si una fecha es hoy
export const isToday = (date) => {
  return formatDate(date) === getTodayDate();
};

// Obtener fecha de hace X días
export const getDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
};

// Parsear fecha desde string
export const parseDate = (dateString) => {
  return parseLocalSafeDate(dateString) || new Date();
};

// Obtener fecha de hoy en formato YYYY-MM-DD (local)
export const getTodayString = () => {
  return getTodayDate();
};

// Calcular días entre fechas
export const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  return Math.round(Math.abs((firstDate - secondDate) / oneDay));
};

// Formatear fecha a formato corto DD/MM/YYYY
export const formatDateToShort = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString + 'T00:00:00');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// --- INICIO DE LA MODIFICACIÓN ---
// Usamos métodos locales (getFullYear, etc) en lugar de UTC para evitar
// que el día cambie por diferencia horaria.
export const formatDateForQuery = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};
// --- FIN DE LA MODIFICACIÓN ---

export const getWorkoutTimeWindow = (workoutDateInput, durationSeconds = 0) => {
  const start = parseLocalSafeDate(workoutDateInput);
  if (!start) return null;

  const durationSec = Math.max(0, Number(durationSeconds) || 0);
  const end = new Date(start.getTime() + durationSec * 1000);

  const dateFmt = { day: '2-digit', month: 'short', year: 'numeric' };
  const shortDateFmt = { day: '2-digit', month: 'short' };
  const timeFmt = { hour: '2-digit', minute: '2-digit', hour12: false };

  const startDateKey = formatDate(start);
  const endDateKey = formatDate(end);

  return {
    start,
    end,
    crossesMidnight: Boolean(startDateKey && endDateKey && startDateKey !== endDateKey),
    startDateLabel: start.toLocaleDateString('es-ES', dateFmt),
    startShortDateLabel: start.toLocaleDateString('es-ES', shortDateFmt),
    startTimeLabel: start.toLocaleTimeString('es-ES', timeFmt),
    endDateLabel: end.toLocaleDateString('es-ES', dateFmt),
    endShortDateLabel: end.toLocaleDateString('es-ES', shortDateFmt),
    endTimeLabel: end.toLocaleTimeString('es-ES', timeFmt),
  };
};

export const splitLocalDateAndTime = (dateInput) => {
  const d = parseLocalSafeDate(dateInput);
  if (!d) return { datePart: '', timePart: '' };
  const pad = (n) => String(n).padStart(2, '0');
  return {
    datePart: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    timePart: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
};

export const combineLocalDateAndTime = (datePart, timePart, originalDateInput = null) => {
  const dateMatch = String(datePart || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = String(timePart || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  const combined = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    isNaN(combined.getTime()) ||
    combined.getFullYear() !== year ||
    combined.getMonth() !== month - 1 ||
    combined.getDate() !== day
  ) {
    return null;
  }

  const orig = parseLocalSafeDate(originalDateInput);
  if (orig) {
    combined.setSeconds(orig.getSeconds(), orig.getMilliseconds());
  }
  return combined.toISOString();
};