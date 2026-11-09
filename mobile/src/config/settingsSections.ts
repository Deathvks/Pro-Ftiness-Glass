export interface SettingsSection {
  id: 'workout' | 'offline' | 'profile' | 'notifications' | 'security' | 'privacy' | 'session';
  label: string;
  subtitle: string;
  iconName: string;
  danger?: boolean;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: 'workout', label: 'Entrenamiento', subtitle: 'Temporizador, sonido, copias', iconName: 'Timer' },
  { id: 'offline', label: 'Modo sin conexión', subtitle: 'Búnker y biblioteca offline', iconName: 'WifiOff' },
  { id: 'profile', label: 'Perfil', subtitle: 'Datos físicos y objetivos', iconName: 'User' },
  { id: 'notifications', label: 'Notificaciones', subtitle: 'Push y alertas por email', iconName: 'BellRing' },
  { id: 'security', label: 'Seguridad', subtitle: '2FA, exportar datos y legal', iconName: 'Shield' },
  { id: 'privacy', label: 'Privacidad social', subtitle: 'Visibilidad de perfil y muro', iconName: 'Users' },
  { id: 'session', label: 'Sesión', subtitle: 'Sesiones activas y cerrar sesión', iconName: 'LogOut', danger: true },
];

export const PUSH_CONSENT_VERSION = '2026-11-06';

export const PUSH_OPTIONS = [
  {
    purpose: 'training',
    title: 'Recordatorios de entrenamiento',
    description: 'Avisos de rutina, racha e inactividad basados en tu actividad y comidas.',
  },
  {
    purpose: 'coaching',
    title: 'Seguimiento de asesoría',
    description: 'Recordatorios sobre el seguimiento en el chat de asesoría.',
  },
  {
    purpose: 'news',
    title: 'Novedades y promociones',
    description: 'Nuevas funciones y ventajas de Pro Fitness Glass.',
  },
];

export const EMAIL_CONSENT_VERSION = '2026-11-06';

export const EMAIL_CONSENT_TEXT = {
  training:
    'Acepto que Pro Fitness Glass use mi actividad en la app, mis rutinas y marcas para enviarme recordatorios personalizados de entrenamiento.',
  coaching:
    'Acepto recibir recordatorios promocionales por correo sobre las asesorías consultadas.',
};
