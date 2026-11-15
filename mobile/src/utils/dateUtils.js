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