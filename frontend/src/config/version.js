import release from '../../public/version.json' with { type: 'json' };

export const APP_VERSION = release.version;
export const RELEASE_WELCOME = release.welcome;
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

export const isNewerVersion = (current, remote) => {
  if (!current || !remote) return false;
  const cParts = String(current).split('.').map(Number);
  const rParts = String(remote).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const r = rParts[i] || 0;
    const c = cParts[i] || 0;
    if (r > c) return true;
    if (r < c) return false;
  }
  return false;
};
