import Constants from 'expo-constants';
import appConfig from '../../app.json';

// Extrae automáticamente la versión configurada del proyecto
export const APP_VERSION =
  Constants.expoConfig?.version ||
  Constants.manifest2?.extra?.expoClient?.version ||
  Constants.manifest?.version ||
  appConfig?.expo?.version ||
  '7.16.28';

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
