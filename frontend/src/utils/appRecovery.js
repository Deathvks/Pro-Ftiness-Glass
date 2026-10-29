const waitForWorkerState = (worker, targetState, timeoutMs = 10000) => new Promise((resolve) => {
  if (!worker || worker.state === targetState) return resolve(true);

  let timeout;
  const onStateChange = () => {
    if (worker.state === targetState || worker.state === 'redundant') {
      finish(worker.state === targetState);
    }
  };
  const finish = (result) => {
    clearTimeout(timeout);
    worker.removeEventListener('statechange', onStateChange);
    resolve(result);
  };

  timeout = setTimeout(() => finish(false), timeoutMs);
  worker.addEventListener('statechange', onStateChange);
  onStateChange();
});

const activatePendingServiceWorkers = async () => {
  if (!('serviceWorker' in navigator)) return;

  const previousController = navigator.serviceWorker.controller;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.update().catch(() => {})));

  for (const registration of registrations) {
    let worker = registration.waiting;
    if (!worker && registration.installing) {
      const installed = await waitForWorkerState(registration.installing, 'installed');
      if (installed) worker = registration.waiting || registration.installing;
    }
    if (worker?.state === 'installed') {
      worker.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  if (previousController && navigator.serviceWorker.controller === previousController) {
    await new Promise((resolve) => {
      const timeout = setTimeout(resolve, 3000);
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        clearTimeout(timeout);
        resolve();
      }, { once: true });
    });
  }
};

export const reloadAppWithoutStaleCache = async ({ path } = {}) => {
  try {
    await activatePendingServiceWorkers();
  } catch {
    // La recarga con URL nueva sigue siendo útil aunque el SW no responda.
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
