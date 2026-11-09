/* mobile/src/utils/userRoleUtils.ts */

export type UserRoleType = 'admin' | 'trainer' | 'asesoria' | 'user';

export interface UserRoleRingConfig {
  type: UserRoleType;
  label: string;
  title: string;
  colors: [string, string, ...string[]];
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const getUserRoleType = (user: any, viewer: any = null): UserRoleType => {
  if (!user) return 'user';
  const role = String(user.role || '').toLowerCase().trim();
  const viewerRole = String(viewer?.role || '').toLowerCase().trim();
  const isViewerSelf = user.id != null && viewer?.id != null && String(user.id) === String(viewer.id);

  if (role === 'admin' || user.isAdmin === true || user.is_admin === true) {
    return isViewerSelf && viewerRole === 'admin' ? 'admin' : 'user';
  }
  if (isViewerSelf && viewerRole === 'admin') {
    return 'admin';
  }
  if (role === 'trainer' || user.isTrainer === true) {
    return 'trainer';
  }
  const isInAsesoria =
    role === 'trainee' ||
    Boolean(user.trainer_id) ||
    Boolean(user.is_in_asesoria) ||
    Boolean(user.trainer);

  if (isInAsesoria) {
    return 'asesoria';
  }
  return 'user';
};

export const getUserRoleRingConfig = (user: any, viewer: any = null): UserRoleRingConfig => {
  const roleType = getUserRoleType(user, viewer);
  switch (roleType) {
    case 'admin':
      return {
        type: 'admin',
        label: 'Admin',
        title: 'Administrador',
        colors: ['#e11d48', '#ef4444', '#f59e0b'],
        badgeBg: 'rgba(239, 68, 68, 0.15)',
        badgeText: '#ef4444',
        badgeBorder: 'rgba(239, 68, 68, 0.35)',
      };
    case 'trainer':
      return {
        type: 'trainer',
        label: 'Entrenador',
        title: 'Entrenador Oficial',
        colors: ['#2563eb', '#6366f1', '#06b6d4'],
        badgeBg: 'rgba(56, 189, 248, 0.15)',
        badgeText: '#38bdf8',
        badgeBorder: 'rgba(56, 189, 248, 0.35)',
      };
    case 'asesoria':
      return {
        type: 'asesoria',
        label: 'Asesoría',
        title: 'Miembro de la Asesoría',
        colors: ['#f59e0b', '#eab308', '#f97316'],
        badgeBg: 'rgba(251, 191, 36, 0.15)',
        badgeText: '#fbbf24',
        badgeBorder: 'rgba(251, 191, 36, 0.35)',
      };
    case 'user':
    default:
      return {
        type: 'user',
        label: 'Atleta',
        title: 'Usuario Atleta',
        colors: ['#10b981', '#14b8a6', '#84cc16'],
        badgeBg: 'rgba(52, 211, 153, 0.15)',
        badgeText: '#34d399',
        badgeBorder: 'rgba(52, 211, 153, 0.35)',
      };
  }
};
