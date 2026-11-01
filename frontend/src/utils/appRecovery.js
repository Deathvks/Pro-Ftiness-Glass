const RECOVERY_TIMEOUT_MS = 2000;
const ANTI_LOOP_WINDOW_MS = 45000;
const MIN_RELOAD_INTERVAL_MS = 8000;
const MAX_RELOADS_PER_WINDOW = 2;

export const clearAppRuntimeCache = async () => {
  const cleanupTasks = [];

  const isIOS =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
  const isStandalone =
    typeof window !== "undefined" &&
    (window.navigator.standalone ||
      window.matchMedia("(display-mode: standalone)").matches);

  if (typeof window !== "undefined" && "caches" in window) {
    // Si estamos en iOS PWA, no borrar las precachés de la app para no dejar a WebKit sin assets durante la recarga
    cleanupTasks.push(
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                !isStandalone ||
                key.includes("api-") ||
                key.includes("runtime") ||
                key.includes("user-uploads") ||
                key.includes("dynamic")
            )
            .map((key) => caches.delete(key))
        )
      )
    );
  }

  // NUNCA desregistrar el Service Worker en iOS PWA durante una recarga en caliente:
  // en WebKit standalone, desregistrar el SW en caliente deja la petición de navegación en deadlock,
  // congelando la app indefinidamente en la pantalla de carga (splash screen) hasta forzar cierre.
  if (!isIOS && !isStandalone && typeof navigator !== "undefined" && "serviceWorker" in navigator) {
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
  if (typeof window === "undefined") return false;

  const now = Date.now();
  let lastReloadTime = 0;
  let reloadCount = 0;

  try {
    lastReloadTime = parseInt(sessionStorage.getItem("pfg_last_safe_reload_time") || "0", 10);
    reloadCount = parseInt(sessionStorage.getItem("pfg_reload_count") || "0", 10);
  } catch {}

  // 1. Si ya se intentó una recarga hace menos de 8s, abortar para no solapar procesos
  if (now - lastReloadTime < MIN_RELOAD_INTERVAL_MS) {
    console.warn("[appRecovery] Recarga abortada: recarga ya ejecutada o en curso hace menos de 8s");
    return false;
  }

  // 2. Si ya van 2 recargas en 45 segundos, abortar para romper cualquier bucle infinito
  if (now - lastReloadTime < ANTI_LOOP_WINDOW_MS && reloadCount >= MAX_RELOADS_PER_WINDOW) {
    console.warn("[appRecovery] Bucle de recargas detectado (>2 recargas en 45s). Deteniendo para no recargar infinitamente.");
    return false;
  }

  // Registrar el intento antes de recargar
  try {
    const updatedCount = (now - lastReloadTime < ANTI_LOOP_WINDOW_MS) ? reloadCount + 1 : 1;
    sessionStorage.setItem("pfg_last_safe_reload_time", String(now));
    sessionStorage.setItem("pfg_reload_count", String(updatedCount));
  } catch {}

  try {
    await clearAppRuntimeCache();
  } catch (err) {
    console.warn("[appRecovery] Error limpiando caché:", err);
  }

  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      // Preservar los marcadores anti-bucle
      if (key && (key.startsWith("pfg_chunk_retry_") || (key.startsWith("pfg_reload_") && key !== "pfg_reload_count"))) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {}

  try {
    localStorage.removeItem("pfg_crash_loop_count");
    localStorage.removeItem("pfg_auto_reloaded_version");
    localStorage.removeItem("lastView");
  } catch {}

  const targetPath = path || "/";
  const isIOS =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
  const isStandalone =
    typeof window !== "undefined" &&
    (window.navigator.standalone ||
      window.matchMedia("(display-mode: standalone)").matches);

  if (isIOS || isStandalone) {
    // En iOS PWA navegar a URL limpia sin parámetros para no romper el match de precache en Workbox
    window.location.href = window.location.origin + targetPath;
  } else {
    const freshUrl = new URL(targetPath, window.location.origin);
    freshUrl.searchParams.set("pfg_fresh", String(now));
    window.location.replace(freshUrl.toString());
  }
  return true;
};
