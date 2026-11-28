/* mobile/src/utils/userRoleUtils.ts */
import { hasChristmasThemeUnlocked, isChristmasPromoActive } from '@/utils/christmasTheme';

export type UserRoleType = 'admin' | 'trainer' | 'asesoria' | 'user';

export interface UserRoleRingConfig {
  type: UserRoleType;
  label: string;
  title: string;
  colors: [string, string, ...string[]];
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  isChristmasFrame?: boolean;
}

export interface RoleUser {
  id?: string | number;
  role?: string | null;
  trainer_id?: string | number | null;
  isAdmin?: boolean;
  is_admin?: boolean;
  isTrainer?: boolean;
  is_in_asesoria?: boolean;
  trainer?: unknown;
  unlocked_badges?: unknown;
  christmas_unlocked?: boolean;
}

export type RoleDisplayOptions = {
  maskStaffRoles?: boolean;
};

export const getUserRoleType = (
  user?: RoleUser | null,
  _viewer: RoleUser | null = null,
  _options: RoleDisplayOptions = {}
): UserRoleType => {
  if (!user) return 'user';
  const role = String(user.role || '').toLowerCase().trim();

  // Administradores y entrenadores muestran siempre el rango base normal ('user')
  if (
    role === 'admin' ||
    user.isAdmin === true ||
    user.is_admin === true ||
    role === 'trainer' ||
    user.isTrainer === true
  ) {
    return 'user';
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

const ROLE_RINGS: Record<UserRoleType, UserRoleRingConfig> = {
  admin: {
    type: 'admin',
    label: 'Admin',
    title: 'Administrador',
    colors: ['#e11d48', '#ef4444', '#f59e0b'],
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    badgeText: '#ef4444',
    badgeBorder: 'rgba(239, 68, 68, 0.35)',
  },
  trainer: {
    type: 'trainer',
    label: 'Entrenador',
    title: 'Entrenador Oficial',
    colors: ['#2563eb', '#6366f1', '#22d3ee'],
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeText: '#38bdf8',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
  },
  asesoria: {
    type: 'asesoria',
    label: 'Asesoría',
    title: 'Miembro de la Asesoría',
    colors: ['#f59e0b', '#facc15', '#f97316'],
    badgeBg: 'rgba(251, 191, 36, 0.15)',
    badgeText: '#fbbf24',
    badgeBorder: 'rgba(251, 191, 36, 0.35)',
  },
  user: {
    type: 'user',
    label: 'Atleta',
    title: 'Usuario Atleta',
    colors: ['#10b981', '#2dd4bf', '#a3e635'],
    badgeBg: 'rgba(52, 211, 153, 0.15)',
    badgeText: '#34d399',
    badgeBorder: 'rgba(52, 211, 153, 0.35)',
  },
};

export const getUserRoleRingConfig = (
  user?: RoleUser | null,
  viewer: RoleUser | null = null,
  activeTheme?: string | null,
  options: RoleDisplayOptions = {}
): UserRoleRingConfig => {
  const base = ROLE_RINGS[getUserRoleType(user, viewer, options)];
  const isViewerSelf = Boolean(
    user && viewer && user.id != null && viewer.id != null && String(user.id) === String(viewer.id)
  );
  const hasChristmasActive = isViewerSelf && activeTheme === 'christmas';
  const hasChristmasEventFrame =
    isChristmasPromoActive() &&
    (user?.christmas_unlocked === true || hasChristmasThemeUnlocked(user));

  if (hasChristmasActive || hasChristmasEventFrame) {
    return {
      ...base,
      isChristmasFrame: true,
      title: `${base.title} • Edición Navidad`,
      colors: ['#38bdf8', '#e0f2fe', '#e11d48'],
    };
  }
  return base;
};
