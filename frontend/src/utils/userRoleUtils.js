/* frontend/src/utils/userRoleUtils.js */

/**
 * Determina el tipo de rol/membresía de un usuario:
 * - 'admin': Administrador de la plataforma
 * - 'trainer': Entrenador oficial
 * - 'asesoria': Usuario miembro de la asesoría con preparador
 * - 'user': Usuario estándar / atleta
 */
export const getUserRoleType = (user) => {
  if (!user) return 'user';

  const role = String(user.role || '').toLowerCase().trim();

  // 1. Admin
  if (role === 'admin' || user.isAdmin === true) {
    return 'admin';
  }

  // 2. Entrenador
  if (role === 'trainer' || user.isTrainer === true) {
    return 'trainer';
  }

  // 3. Miembro de la Asesoría (trainee o con trainer_id asignado)
  const isInAsesoria = 
    role === 'trainee' || 
    Boolean(user.trainer_id) || 
    Boolean(user.is_in_asesoria) || 
    Boolean(user.trainer);

  if (isInAsesoria) {
    return 'asesoria';
  }

  // 4. Usuario normal
  return 'user';
};

/**
 * Devuelve la configuración visual estilo historias de Instagram para el avatar según su rol:
 * Borde con degradado de colores específicos + glow + textos
 */
export const getUserRoleRingConfig = (user) => {
  const roleType = getUserRoleType(user);

  switch (roleType) {
    case 'admin':
      return {
        type: 'admin',
        label: 'Admin',
        title: 'Administrador',
        gradientClass: 'bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500',
        glowClass: 'shadow-md shadow-red-500/30',
        borderClass: 'bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500',
        badgeBg: 'bg-red-500/10 text-red-500 border-red-500/30',
        dotColor: 'bg-red-500'
      };

    case 'trainer':
      return {
        type: 'trainer',
        label: 'Entrenador',
        title: 'Entrenador Oficial',
        gradientClass: 'bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400',
        glowClass: 'shadow-md shadow-blue-500/30',
        borderClass: 'bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400',
        badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        dotColor: 'bg-blue-500'
      };

    case 'asesoria':
      return {
        type: 'asesoria',
        label: 'Asesoría',
        title: 'Miembro de la Asesoría',
        gradientClass: 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-orange-500',
        glowClass: 'shadow-md shadow-amber-500/30',
        borderClass: 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-orange-500',
        badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dotColor: 'bg-amber-400'
      };

    case 'user':
    default:
      return {
        type: 'user',
        label: 'Usuario',
        title: 'Usuario',
        gradientClass: 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-lime-400',
        glowClass: 'shadow-md shadow-emerald-500/20',
        borderClass: 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-lime-400',
        badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dotColor: 'bg-emerald-500'
      };
  }
};
