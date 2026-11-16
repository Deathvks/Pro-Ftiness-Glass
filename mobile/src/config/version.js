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

export const isRemoteNewer = (current, remote) => {
  if (!current || !remote) return false;
  const cParts = String(current).split('.').map(Number);
  const rParts = String(remote).split('.').map(Number);
  for (let i = 0; i < Math.max(cParts.length, rParts.length); i++) {
    const r = rParts[i] || 0;
    const c = cParts[i] || 0;
    if (r > c) return true;
    if (r < c) return false;
  }
  return false;
};

export const isNewerVersion = isRemoteNewer;
