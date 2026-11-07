const destinationPaths = new Set([
  '/', '/dashboard', '/asesoria', '/trainerPanel', '/routines', '/social', '/progress',
  '/nutrition', '/profile', '/challenges', '/notifications', '/adminPanel'
]);

function internalDestination(value) {
  if (typeof value !== 'string' || !value.startsWith('/')) return null;
  const origin = 'https://profitnessglass.es';
  let url;
  try { url = new URL(value, origin); } catch { return null; }
  if (url.origin !== origin || !destinationPaths.has(url.pathname)) return null;

  const query = new URLSearchParams();
  if (url.pathname === '/social') {
    const tab = url.searchParams.get('tab');
    const highlight = url.searchParams.get('highlight');
    if (['feed', 'requests', 'friends'].includes(tab)) query.set('tab', tab);
    if (highlight && /^\d+$/.test(highlight)) query.set('highlight', highlight);
  }
  if (url.pathname === '/adminPanel' && url.searchParams.get('section') === 'security') query.set('section', 'security');
  const search = query.toString();
  return `${url.pathname === '/' ? '/dashboard' : url.pathname}${search ? `?${search}` : ''}`;
}

const byTitle = new Map([
  ['¡Bienvenido!', ['Cuenta creada', 'Tu cuenta de Pro Fitness Glass ya está activa.']],
  ['¡Email verificado!', ['Correo verificado', 'Tu dirección de correo se ha verificado.']],
  ['Contraseña modificada', ['Contraseña modificada', 'Se cambió la contraseña de tu cuenta.']],
  ['2FA Activado', ['Verificación en dos pasos activada', 'Tu cuenta ya tiene una segunda comprobación al iniciar sesión.']],
  ['2FA Desactivado', ['Verificación en dos pasos desactivada', 'Se retiró la segunda comprobación de inicio de sesión.']],
  ['Perfil físico actualizado', ['Perfil actualizado', 'Se guardaron los cambios en tu perfil físico.']],
  ['Cuenta actualizada', ['Cuenta actualizada', 'Se guardaron cambios en los datos de tu cuenta.']],
  ['Datos eliminados', ['Datos de progreso eliminados', 'Se borró tu historial de progreso. Tu cuenta sigue activa.']],
  ['Reporte Resuelto ✅', ['Reporte resuelto', 'El equipo resolvió uno de los reportes que enviaste.']],
  ['Límite de XP alcanzado', ['Límite diario de XP alcanzado', 'Ya has ganado todos los puntos disponibles hoy para esta actividad.']],
  ['¡Entrenamiento publicado!', ['Entrenamiento publicado', 'Tu sesión ya está visible en el muro.']],
  ['Actividad de amigos', ['Actividad de amigos', 'Un amigo completó un entrenamiento.']],
  ['¡Subida de Nivel!', ['Has subido de nivel', 'Tu actividad te ha hecho avanzar al siguiente nivel.']],
  ['¡Es hora de moverse!', ['Entrenamiento de hoy', 'Es un buen momento para empezar tu próxima sesión.']],
  ['🔥 ¡Tu racha está en peligro!', ['Tu racha está en juego', 'Completa tu entrenamiento de hoy para mantener la racha.']],
  ['💔 Racha perdida', ['Tu racha terminó', 'Puedes iniciar una nueva racha con tu próximo entrenamiento.']]
]);

const byEvent = new Map([
  ['notification_test', ['Prueba de notificaciones push', 'Este dispositivo ha recibido el aviso de prueba del panel Admin.']],
  ['coaching_added', ['Nueva asesoría', 'Un entrenador te ha añadido a su asesoría.', '/asesoria']],
  ['chat_closed', ['Asesoría cerrada por inactividad', 'Puedes solicitar asesoría de nuevo cuando quieras.', '/asesoria']],
  ['security', ['Bloqueo de seguridad', 'El sistema bloqueó un acceso. Revisa el incidente en Ciberseguridad.', '/adminPanel?section=security']],
  ['progressive_overload', ['Progreso en tu entrenamiento', 'Has mejorado el rendimiento en uno de tus ejercicios.']],
  ['friend_request', ['Solicitud de amistad', 'Un atleta te ha enviado una solicitud.']],
  ['friend_request_accepted', ['Solicitud aceptada', 'Un atleta ha aceptado tu solicitud de amistad.']],
  ['challenge', ['Reto completado', 'Has completado un reto y ganado XP.', '/challenges']],
  ['level_up', byTitle.get('¡Subida de Nivel!')],
  ['badge', ['Insignia desbloqueada', 'Has conseguido una nueva insignia.']],
  ['xp', ['Has ganado XP', 'Tu actividad te ha dado puntos de experiencia.']]
]);

const reminderContent = {
  1: ['Tu asesoría sigue abierta', 'Puedes responder en el chat si quieres continuar.'],
  2: ['Consulta de asesoría pendiente', 'Puedes retomar la conversación con el entrenador.'],
  3: ['Tu asesoría se cerrará en 24 horas', 'Responde en el chat si quieres mantenerlo abierto.']
};

function compactText(value, limit) {
  if (typeof value !== 'string') return '';
  const text = value.replace(/\s+/g, ' ').trim();
  const characters = [...text];
  return characters.length > limit ? `${characters.slice(0, limit - 1).join('')}…` : text;
}

// El contenido privado se conserva en la notificación interna. Aquí solo se publica el resumen del evento.
export function getPushContent({ id, type, title, message, data, purpose }) {
  const destination = internalDestination(data?.url);
  let preview = byEvent.get(type) ?? byEvent.get(data?.type) ?? byTitle.get(title);

  if (purpose === 'news' && type !== 'notification_test') {
    preview = [compactText(title, 70), compactText(message, 160)];
  } else if (!preview && purpose === 'coaching') {
    preview = [...(reminderContent[data?.reminderLevel] ?? reminderContent[1]), '/asesoria'];
  } else if (!preview && purpose === 'training') {
    preview = data?.segment === 'no_setup'
      ? ['Tu primer entrenamiento', 'Empieza tu primera sesión y registra tus series.', '/routines']
      : ['Retoma tu entrenamiento', 'Han pasado varios días desde tu última actividad. Vuelve a tu rutina.', '/routines'];
  } else if (!preview && type === 'chat_message') {
    preview = destination === '/trainerPanel'
      ? ['Nuevo mensaje de asesoría', 'Un cliente te ha escrito en el chat.', '/trainerPanel']
      : ['Tu entrenador te ha respondido', 'Tienes una nueva respuesta en el chat de asesoría.', '/asesoria'];
  } else if (!preview && (data?.ip || data?.userAgent)) {
    preview = ['Nuevo inicio de sesión', 'Se ha iniciado sesión en tu cuenta de Pro Fitness Glass.'];
  } else if (!preview && data?.workoutId) {
    preview = data.reactionType
      ? ['Nueva reacción a tu entrenamiento', 'Un atleta ha reaccionado a tu sesión en el muro.']
      : ['Nuevo comentario en tu entrenamiento', 'Un atleta ha comentado tu sesión en el muro.'];
  } else if (!preview && /^\+\d+ XP$/.test(title)) {
    preview = byEvent.get('xp');
  }

  if (!preview?.[0] || !preview[1]) return null;
  const [pushTitle, body, route] = preview;
  const url = route ?? (destination && destination !== '/notifications' ? destination : `/notifications?notice=${id}`);
  return { title: pushTitle, body, url };
}
