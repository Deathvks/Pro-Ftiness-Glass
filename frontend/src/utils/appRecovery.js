const RECOVERY_TIMEOUT_MS = 2500;

export const clearAppRuntimeCache = async () => {
  const cleanupTasks = [];

  if ('caches' in window) {
    cleanupTasks.push(
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
    );
  }

  if ('serviceWorker' in navigator) {
    cleanupTasks.push(
      navigator.serviceWorker.getRegistrations().then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister()))
      )
    );
  }

  if (cleanupTasks.length === 0) return;

  let timeoutId;
  await Promise.race([
    Promise.allSettled(cleanupTasks),
    new Promise((resolve) => {
      timeoutId = setTimeout(resolve, RECOVERY_TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(timeoutId));
};

export const reloadAppWithoutStaleCache = async ({ path } = {}) => {
  try {
    await clearAppRuntimeCache();
  } catch {
    // La recarga sigue siendo útil aunque el navegador no permita limpiar alguna caché.
  }

  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith('pfg_chunk_retry_') || key?.startsWith('pfg_reload_')) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {}

  try {
    localStorage.removeItem('pfg_crash_loop_count');
    localStorage.removeItem('pfg_auto_reloaded_version');
  } catch {}

  const freshUrl = new URL(path || window.location.href, window.location.origin);
  freshUrl.searchParams.set('pfg_fresh', String(Date.now()));
  window.location.replace(freshUrl.toString());
};
