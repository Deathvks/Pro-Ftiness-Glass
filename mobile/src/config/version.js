/* mobile/src/config/version.js */
import Constants from 'expo-constants';
import appConfig from '../../app.json';

// Extrae automáticamente la versión configurada del proyecto
export const APP_VERSION =
  Constants.expoConfig?.version ||
  Constants.manifest2?.extra?.expoClient?.version ||
  Constants.manifest?.version ||
  appConfig?.expo?.version ||
  '7.16.27';

export const RELEASE_WELCOME = {
  title: 'Nueva Experiencia Móvil Tematizada',
  subtitle: 'Calculadoras científicas, guías públicas, valoración de la app y modales adaptados a tu tema.',
  features: [
    {
      title: 'Modales 100% Tematizados',
      description: 'OLED, Dark, Light, Galaxy, Ocean y Desert ahora envuelven también cada hoja inferior y diálogo sin cortes inferiores.',
    },
    {
      title: 'Calculadoras y Guías Públicas',
      description: 'Accede gratis a la calculadora de 1RM (Epley, Brzycki, Lander), macros TDEE y enciclopedia técnica de ejercicios.',
    },
    {
      title: 'Escáner IA y Rutinas Compartidas',
      description: 'Registra comidas con la cámara IA, importa rutinas desde enlaces universales y valora la app desde el Hub.',
    },
    {
      title: 'Notificaciones y Tours Interactivos',
      description: 'Recordatorios reales en segundo plano y guías paso a paso adaptadas a cada pantalla.',
    },
  ],
};

export const CURRENT_WELCOME_TITLE = RELEASE_WELCOME.title;

const EQUIVALENT_WELCOME_TITLES = new Set([
  'Preferencias y horario de correos',
  'Modo Sin Conexión en Segundo Plano',
  'Sniffing de Herramientas y Calculadoras',
]);

export const hasSeenCurrentWelcome = (storedTitle, targetTitle = CURRENT_WELCOME_TITLE) => {
  if (!storedTitle) return false;
  if (storedTitle === targetTitle) return true;
  if (EQUIVALENT_WELCOME_TITLES.has(storedTitle) && EQUIVALENT_WELCOME_TITLES.has(targetTitle)) {
    return true;
  }
  return false;
};

const parseSemver = (value) => {
  const [corePart = '', prePart = ''] = String(value || '').trim().split('-', 2);
  const core = corePart.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const pre = prePart
    ? prePart.split('.').map((part) => (/^\d+$/.test(part) ? Number(part) : part.toLowerCase()))
    : [];
  return { core, pre };
};

export const isRemoteNewer = (current, remote) => {
  if (!current || !remote) return false;
  const c = parseSemver(current);
  const r = parseSemver(remote);
  for (let i = 0; i < Math.max(c.core.length, r.core.length, 3); i++) {
    const rv = r.core[i] || 0;
    const cv = c.core[i] || 0;
    if (rv > cv) return true;
    if (rv < cv) return false;
  }
  // Misma versión base: estable (sin sufijo) > pre-release (ej. 8.0.0 > 8.0.0-beta.1)
  if (c.pre.length > 0 && r.pre.length === 0) return true;
  if (c.pre.length === 0 && r.pre.length > 0) return false;
  for (let i = 0; i < Math.max(c.pre.length, r.pre.length); i++) {
    const rv = r.pre[i];
    const cv = c.pre[i];
    if (rv === undefined) return false;
    if (cv === undefined) return true;
    if (rv > cv) return true;
    if (rv < cv) return false;
  }
  return false;
};

export const isNewerVersion = isRemoteNewer;
