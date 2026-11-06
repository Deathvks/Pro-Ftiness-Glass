// Actualiza la versión en el backend si cambian los textos de consentimiento.
export const PUSH_CONSENT_VERSION = '2026-11-06';

export const PUSH_OPTIONS = [
  { purpose: 'training', title: 'Recordatorios de entrenamiento por push', description: 'Quiero recibir recordatorios de rutina, racha e inactividad. Para personalizarlos se usa mi actividad, mis rutinas, mis marcas y si he registrado comidas.' },
  { purpose: 'coaching', title: 'Seguimiento de asesoría por push', description: 'Quiero recibir hasta tres recordatorios promocionales por ciclo de inactividad en el chat de asesoría.' },
  { purpose: 'news', title: 'Novedades y promociones por push', description: 'Quiero recibir novedades y promociones de Pro Fitness Glass en los dispositivos donde active las notificaciones push.' }
];
