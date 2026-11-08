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

export function formatXpReason(reason) {
  if (!reason || typeof reason !== 'string') return 'tu actividad';
  const trimmed = reason.trim();

  if (/^login\s*diario$/i.test(trimmed)) return 'iniciar sesión hoy';
  if (/^peso\s*registrado(\s*\(perfil\))?$/i.test(trimmed)) return 'registrar tu peso corporal';
  if (/^medida\s*registrada:\s*(.+)$/i.test(trimmed)) {
    const m = trimmed.match(/^medida\s*registrada:\s*(.+)$/i);
    return `registrar tu medida de ${m[1].toLowerCase()}`;
  }
  if (/^rutina\s*creada$/i.test(trimmed)) return 'crear una nueva rutina';
  if (/fue descargada/i.test(trimmed)) return 'que un atleta descargó tu rutina';
  if (/^comida\s*registrada$/i.test(trimmed)) return 'registrar tu comida';
  if (/^creatina\s*registrada$/i.test(trimmed)) return 'registrar tu toma de creatina';
  if (/^agua\s*registrada$/i.test(trimmed) || /^reto:\s*objetivo de agua$/i.test(trimmed)) return 'cumplir tu objetivo de agua diario';
  if (/^objetivo\s*de\s*calor[ií]as\s*cumplido$/i.test(trimmed)) return 'cumplir tu objetivo de calorías de hoy';
  if (/completado$/i.test(trimmed)) return `completar tu ${trimmed.toLowerCase()}`;
  if (/^reto\s*infinito:\s*(.+)$/i.test(trimmed)) {
    const m = trimmed.match(/^reto\s*infinito:\s*(.+)$/i);
    return `completar el reto "${m[1]}"`;
  }
  if (/^reto:\s*(.+)$/i.test(trimmed)) {
    const m = trimmed.match(/^reto:\s*(.+)$/i);
    return `completar el reto "${m[1]}"`;
  }
  if (/^sobrecarga\s*progresiva:\s*(.+)$/i.test(trimmed)) {
    const m = trimmed.match(/^sobrecarga\s*progresiva:\s*(.+)$/i);
    return `lograr sobrecarga progresiva en ${m[1]}`;
  }
  if (/^insignia:\s*(.+)$/i.test(trimmed)) {
    const m = trimmed.match(/^insignia:\s*(.+)$/i);
    return `desbloquear la insignia "${m[1]}"`;
  }
  if (/^por\s+/i.test(trimmed)) {
    return trimmed.replace(/^por\s+/i, '');
  }
  return trimmed;
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
  ['¡Es hora de moverse!', ['Entrenamiento de hoy', 'Es un buen momento para empezar tu próxima sesión.']],
  ['🔥 ¡Tu racha está en peligro!', ['Tu racha está en juego', 'Completa tu entrenamiento de hoy para mantener la racha.']],
  ['💔 Racha perdida', ['Tu racha terminó', 'Puedes iniciar una nueva racha con tu próximo entrenamiento.']]
]);

const byEvent = new Map([
  ['notification_test', ['Prueba de notificaciones push', 'Este dispositivo ha recibido el aviso de prueba del panel Admin.']],
  ['coaching_added', ['Nueva asesoría', 'Un entrenador te ha añadido a su asesoría.', '/asesoria']],
  ['chat_closed', ['Asesoría cerrada por inactividad', 'Puedes solicitar asesoría de nuevo cuando quieras.', '/asesoria']],
  ['security', ['Bloqueo de seguridad', 'El sistema bloqueó un acceso. Revisa el incidente en Ciberseguridad.', '/adminPanel?section=security']],
  ['friend_request', ['Solicitud de amistad', 'Un atleta te ha enviado una solicitud.']],
  ['friend_request_accepted', ['Solicitud aceptada', 'Un atleta ha aceptado tu solicitud de amistad.']]
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

// El contenido privado se conserva en la notificación interna. Aquí se publica el aviso con puntos y motivo exacto.
export function getPushContent({ id, type, title, message, data, purpose }) {
  const destination = internalDestination(data?.url);

  // 1. Manejo específico para eventos de XP (con puntos y motivo exacto)
  if (type === 'xp' || data?.type === 'xp' || /^\+\d+\s*XP/i.test(title)) {
    const amount = data?.amount || title?.match(/\+(\d+)\s*XP/i)?.[1] || '';
    const rawReason = data?.reason;
    const cleanReason = rawReason ? formatXpReason(rawReason) : '';
    const pushTitle = amount ? `+${amount} XP ganados` : '¡Puntos de Experiencia!';

    let pushBody;
    if (amount && cleanReason) {
      pushBody = `Has ganado ${amount} XP por ${cleanReason}.`;
    } else if (message && !message.toLowerCase().includes('tu actividad te ha dado puntos')) {
      pushBody = message;
    } else if (amount) {
      pushBody = `Has ganado +${amount} XP en tu última actividad.`;
    } else {
      pushBody = 'Has ganado puntos de experiencia con tu última actividad.';
    }

    return {
      title: compactText(pushTitle, 70),
      body: compactText(pushBody, 160),
      url: destination && destination !== '/notifications' ? destination : `/notifications?notice=${id}`
    };
  }

  // 2. Manejo específico para Sobrecarga Progresiva (con ejercicio y XP)
  if (type === 'progressive_overload' || data?.type === 'progressive_overload') {
    const exercise = data?.exercise;
    const xpAdded = data?.xpAdded || 25;
    const pushTitle = `Sobrecarga Progresiva (+${xpAdded} XP)`;
    const pushBody = exercise
      ? `¡Superaste tu marca en ${exercise}! Has ganado ${xpAdded} XP.`
      : (message || `¡Has mejorado el rendimiento y ganado ${xpAdded} XP!`);
    return {
      title: compactText(pushTitle, 70),
      body: compactText(pushBody, 160),
      url: destination && destination !== '/notifications' ? destination : `/notifications?notice=${id}`
    };
  }

  // 3. Manejo específico para Retos completados
  if (type === 'challenge' || data?.type === 'challenge') {
    const pushTitle = '¡Reto Completado! 🏆';
    const pushBody = message || 'Has completado un reto y ganado XP.';
    return {
      title: compactText(pushTitle, 70),
      body: compactText(pushBody, 160),
      url: '/challenges'
    };
  }

  // 4. Manejo específico para Insignias
  if (type === 'badge' || data?.type === 'badge') {
    const pushTitle = '¡Insignia Desbloqueada! 🎖️';
    const pushBody = message || 'Has conseguido una nueva insignia.';
    return {
      title: compactText(pushTitle, 70),
      body: compactText(pushBody, 160),
      url: destination && destination !== '/notifications' ? destination : `/notifications?notice=${id}`
    };
  }

  // 5. Manejo específico para Subida de Nivel
  if (type === 'level_up' || data?.type === 'level_up' || title === '¡Subida de Nivel!') {
    const lvl = data?.level;
    const pushTitle = '¡Subida de Nivel! ⚡';
    const pushBody = lvl
      ? `¡Enhorabuena! Has alcanzado el Nivel ${lvl}. Sigue así.`
      : (message || 'Tu actividad te ha hecho avanzar al siguiente nivel.');
    return {
      title: compactText(pushTitle, 70),
      body: compactText(pushBody, 160),
      url: destination && destination !== '/notifications' ? destination : `/notifications?notice=${id}`
    };
  }

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
  }

  if (!preview?.[0] || !preview[1]) return null;
  const [pushTitle, body, route] = preview;
  const url = route ?? (destination && destination !== '/notifications' ? destination : `/notifications?notice=${id}`);
  return { title: pushTitle, body, url };
}
