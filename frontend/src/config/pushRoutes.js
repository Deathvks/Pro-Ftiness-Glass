const pushViews = new Set([
  'asesoria', 'trainerPanel', 'routines', 'social', 'progress', 'nutrition',
  'profile', 'challenges', 'notifications', 'adminPanel'
]);

export function getPushView(pathname) {
  const view = pathname.slice(1);
  return pushViews.has(view) ? view : null;
}

export function getPushTarget(path, origin) {
  if (typeof path !== 'string' || !path.startsWith('/')) return null;
  try {
    const url = new URL(path, origin);
    if (url.origin !== origin) return null;
    const view = getPushView(url.pathname) ?? (url.pathname === '/dashboard' ? 'dashboard' : null);
    if (!view) return null;

    const params = url.searchParams;
    return {
      view,
      path: url.pathname + url.search,
      options: {
        ...(view === 'notifications' && { notice: params.get('notice') }),
        ...(view === 'social' && { tab: params.get('tab'), highlight: params.get('highlight') }),
        ...(view === 'adminPanel' && { section: params.get('section') })
      }
    };
  } catch {
    return null;
  }
}
