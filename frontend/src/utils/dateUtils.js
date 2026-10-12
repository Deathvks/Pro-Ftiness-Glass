/* frontend/src/utils/dateUtils.js */

// Helper robusto para convertir cualquier entrada (string YYYY-MM-DD, ISO 8601, timestamp, Date) a Date
const toValidDate = (input) => {
  if (!input) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  const str = String(input).trim();
  if (!str) return null;

  // Si tiene formato YYYY-MM-DD puro, construir Date local para evitar desfases horarios
  const dateMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateMatch) {
    const year = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1;
    const day = parseInt(dateMatch[3], 10);
    return new Date(year, month, day);
  }

  // Si es un ISO string o formato de fecha estándar
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  // Fallback si venía algo como '2026-10-12 ...'
  const isoPrefixMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoPrefixMatch) {
    const year = parseInt(isoPrefixMatch[1], 10);
    const month = parseInt(isoPrefixMatch[2], 10) - 1;
    const day = parseInt(isoPrefixMatch[3], 10);
    return new Date(year, month, day);
  }

  return null;
};

// Formatear fecha para mostrar YYYY-MM-DD
export const formatDate = (date) => {
  if (!date) return '';
  if (typeof date === 'string') {
    const m = date.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
  }
  const d = toValidDate(date);
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Formatear fecha para mostrar al usuario
export const formatDateForDisplay = (date) => {
  if (!date) return '';
  const d = toValidDate(date);
  if (!d) return String(date);
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Obtener fecha de hoy en formato YYYY-MM-DD
export const getTodayDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  return toValidDate(dateString) || new Date();
};

// Obtener fecha de hoy en formato YYYY-MM-DD
export const getTodayString = () => {
  return getTodayDate();
};

// Calcular días entre fechas
export const daysBetween = (date1, date2) => {
  const d1 = toValidDate(date1);
  const d2 = toValidDate(date2);
  if (!d1 || !d2) return 0;
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((d1.getTime() - d2.getTime()) / oneDay));
};

// Formatear fecha a formato corto DD/MM/YYYY
export const formatDateToShort = (dateInput) => {
  if (!dateInput) return '';

  // Si ya viene formateado como DD/MM/YYYY
  if (typeof dateInput === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateInput.trim())) {
    return dateInput.trim();
  }

  // Si es un string que empieza con YYYY-MM-DD (ISO 8601 o fecha directa)
  if (typeof dateInput === 'string') {
    const isoMatch = dateInput.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day}/${month}/${year}`;
    }
  }

  const d = toValidDate(dateInput);
  if (!d) return String(dateInput);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// --- INICIO DE LA MODIFICACIÓN ---
// Usamos métodos locales (getFullYear, etc) en lugar de UTC para evitar
// que el día cambie por diferencia horaria.
export const formatDateForQuery = (date) => {
  const d = toValidDate(date) || new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};
// --- FIN DE LA MODIFICACIÓN ---