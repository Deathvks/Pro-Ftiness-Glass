export const WEB_APP_URL = 'https://profitnessglass.es';

export function buildSharedRoutineUrl(routineId: string | number): string {
  return `${WEB_APP_URL}/share/routine/${routineId}`;
}

export function buildReferralUrl(referralCode: string): string {
  return `${WEB_APP_URL}/register?ref=${encodeURIComponent(referralCode)}`;
}

export interface ResolvedDeepLink {
  pathname: string;
  params?: Record<string, string>;
}

const KNOWN_WEB_HOSTS = new Set([
  'profitnessglass.es',
  'www.profitnessglass.es',
  'pro-fitness-glass.zeabur.app',
]);

export function resolveDeepLink(rawUrl: string | null | undefined): ResolvedDeepLink | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  // Ignore OAuth callback URLs handled by WebBrowser.openAuthSessionAsync
  if (
    rawUrl.includes('access_token=') ||
    (rawUrl.includes('code=') && rawUrl.includes('state='))
  ) {
    return null;
  }

  let rawPath = '';
  const queryParams: Record<string, string> = {};

  try {
    const parsed = new URL(rawUrl);
    const proto = parsed.protocol.replace(/:$/, '').toLowerCase();

    if (proto === 'http' || proto === 'https') {
      if (!KNOWN_WEB_HOSTS.has(parsed.hostname.toLowerCase())) {
        return null;
      }
      rawPath = parsed.pathname || '/';
    } else if (proto === 'mobile') {
      // Custom scheme: mobile://share/routine/12 puts "share" in hostname and "/routine/12" in pathname
      const hostPart = parsed.hostname ? `/${parsed.hostname}` : '';
      const pathPart = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '';
      rawPath = `${hostPart}${pathPart}` || '/';
    } else if (proto === 'exp' || proto === 'exps') {
      const markerIdx = rawUrl.indexOf('/--/');
      if (markerIdx >= 0) {
        const tail = rawUrl.slice(markerIdx + 3);
        const [p, q] = tail.split('?');
        rawPath = p || '/';
        if (q) {
          new URLSearchParams(q).forEach((v, k) => {
            queryParams[k] = v;
          });
        }
      } else {
        return null;
      }
    } else {
      return null;
    }

    parsed.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
  } catch {
    return null;
  }

  const normalized = (rawPath.replace(/\/+$/, '') || '/').trim();

  // Handle referral param anywhere or on /register
  if (queryParams.ref && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('pending_ref', queryParams.ref);
    } catch {}
  }

  // /share/routine/:id
  const shareMatch = normalized.match(/^\/share\/routine\/([^/]+)$/);
  if (shareMatch) {
    return { pathname: `/share/routine/${shareMatch[1]}` };
  }

  // /noticias/:slug
  const newsMatch = normalized.match(/^\/noticias\/([^/]+)$/);
  if (newsMatch) {
    return { pathname: `/noticias/${newsMatch[1]}` };
  }
  if (normalized === '/noticias') {
    return { pathname: '/noticias' };
  }

  // /profile/:id -> /public-profile/:id
  const profileMatch = normalized.match(/^\/(?:public-profile|profile)\/([^/]+)$/);
  if (profileMatch) {
    return { pathname: `/public-profile/${profileMatch[1]}` };
  }

  if (normalized === '/register') {
    return {
      pathname: '/register',
      params: queryParams.ref ? { ref: queryParams.ref } : undefined,
    };
  }
  if (normalized === '/login') {
    return { pathname: '/login' };
  }
  if (normalized === '/dashboard') {
    return { pathname: '/(tabs)' };
  }
  if (normalized === '/routines' || normalized === '/nutrition' || normalized === '/social' || normalized === '/hub') {
    return { pathname: `/(tabs)${normalized}` };
  }
  if (normalized === '/aviso-legal' || normalized === '/legal') {
    return { pathname: '/legal-notice' };
  }
  if (['/privacy', '/terms', '/legal-notice', '/cookies'].includes(normalized)) {
    return { pathname: normalized };
  }
  if (
    [
      '/calculadora-1rm',
      '/calculadora-calorias-macros',
      '/ejercicios',
      '/faq',
      '/sobre-nosotros',
      '/mantenimiento',
    ].includes(normalized)
  ) {
    return { pathname: normalized };
  }
  if (
    [
      '/challenges',
      '/progress',
      '/appearance',
      '/settings',
      '/notifications',
      '/asesoria',
      '/support',
      '/quick-cardio',
      '/profile',
    ].includes(normalized)
  ) {
    return { pathname: normalized };
  }

  return null;
}
