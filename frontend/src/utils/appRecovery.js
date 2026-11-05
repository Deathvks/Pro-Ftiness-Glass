const RECOVERY_TIMEOUT_MS = 1200;
const ANTI_LOOP_WINDOW_MS = 45000;
const MIN_RELOAD_INTERVAL_MS = 8000;
const MAX_RELOADS_PER_WINDOW = 2;
const CHUNK_RELOAD_COOLDOWN_MS = 20000;
let chunkRecoveryPromise = null;

export const clearAppRuntimeCache = async () => {
  const cleanupTasks = [];

  if (typeof window !== "undefined" && "caches" in window) {
    // Limpiar únicamente cachés de lectura/runtime; no borrar precaché ni vite-hashed-assets (inmutables por hash)
    cleanupTasks.push(
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.includes("api-") ||
                key.includes("runtime") ||
                key.includes("dynamic")
            )
            .map((key) => caches.delete(key))
        )
      )
    );
  }

  // Solicitar comprobación de actualización en segundo plano
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    cleanupTasks.push(
      navigator.serviceWorker.getRegistrations().then((registrations) =>
        Promise.all(registrations.map((registration) => registration.update().catch(() => {})))
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

export const reloadAppWithoutStaleCache = async ({ path, force = false } = {}) => {
  if (typeof window === "undefined") return false;

  const now = Date.now();
  let lastReloadTime = 0;
  let reloadCount = 0;

  try {
    lastReloadTime = parseInt(sessionStorage.getItem("pfg_last_safe_reload_time") || "0", 10);
    reloadCount = parseInt(sessionStorage.getItem("pfg_reload_count") || "0", 10);
  } catch {}

  if (!force) {
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
  }

  // Registrar el intento antes de recargar
  try {
    const updatedCount = (now - lastReloadTime < ANTI_LOOP_WINDOW_MS && !force) ? reloadCount + 1 : 1;
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
    localStorage.removeItem("pfg_social_feed_cache");
    // Preservar userProfile para evitar bloqueo en skeleton tras recargar chunks
    try {
      const rawCache = localStorage.getItem("pfg_cached_initial_state_v1");
      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        if (parsed?.userProfile && typeof parsed.userProfile === "object" && parsed.userProfile.id) {
          localStorage.setItem("pfg_cached_initial_state_v1", JSON.stringify({ userProfile: parsed.userProfile }));
        } else {
          localStorage.removeItem("pfg_cached_initial_state_v1");
        }
      }
    } catch {
      localStorage.removeItem("pfg_cached_initial_state_v1");
    }
    localStorage.setItem("lastView", "dashboard");
  } catch {}

  const targetPath = path || "/";
  const freshUrl = new URL(targetPath, window.location.origin);
  freshUrl.searchParams.set("pfg_fresh", String(now));
  window.location.replace(freshUrl.toString());
  return true;
};

export const recoverFromChunkError = async ({ force = false } = {}) => {
  if (typeof window === "undefined") return false;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
  if (chunkRecoveryPromise) return chunkRecoveryPromise;

  const now = Date.now();
  let lastChunkReload = 0;
  try {
    lastChunkReload = parseInt(sessionStorage.getItem("pfg_last_chunk_autoreload") || "0", 10);
  } catch {}

  if (!force && now - lastChunkReload < CHUNK_RELOAD_COOLDOWN_MS) return false;

  try {
    sessionStorage.setItem("pfg_last_chunk_autoreload", String(now));
    sessionStorage.removeItem("pfg_pending_target_view");
  } catch {}

  chunkRecoveryPromise = (async () => {
    try {
      if ("caches" in window) await caches.delete("vite-hashed-assets");
    } catch {}

    const freshUrl = new URL(window.location.href);
    freshUrl.searchParams.set("pfg_fresh", String(now));
    window.location.replace(freshUrl.toString());
    return true;
  })();

  try {
    return await chunkRecoveryPromise;
  } finally {
    chunkRecoveryPromise = null;
  }
};
