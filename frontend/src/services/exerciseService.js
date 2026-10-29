/* frontend/src/services/exerciseService.js */
import apiClient from "./apiClient";

// Mantenemos la caché en memoria y persistida en localStorage para modo offline (búnker)
const CACHE_KEY = 'pfg_cached_exercise_list';
let cachedExerciseList = null;
let latestExerciseList = null;
let exerciseMediaPrefetchScheduled = false;

const getExerciseImageUrls = (exercises) => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    const mediaBase = apiBase.replace(/\/?api\/?$/, '').replace(/\/$/, '');
    const urls = new Set();

    for (const exercise of exercises || []) {
        let images = exercise?.images;
        if (typeof images === 'string') {
            try {
                images = JSON.parse(images);
            } catch {
                images = images.split(',').map((image) => image.trim());
            }
        }

        const candidates = [
            exercise?.image_url_start,
            exercise?.image_url_end,
            exercise?.image_url,
            ...(Array.isArray(images) ? images : []),
        ];

        for (const image of candidates) {
            if (typeof image !== 'string' || !image.trim()) continue;
            const value = image.trim();
            if (/^(data:|blob:)/i.test(value) || /youtube\.com|youtu\.be/i.test(value)) continue;
            try {
                const url = new URL(value, `${mediaBase || window.location.origin}/`);
                if (url.protocol === 'http:' || url.protocol === 'https:') urls.add(url.href);
            } catch {}
        }
    }

    return [...urls];
};

const scheduleExerciseMediaPrefetch = (exercises) => {
    latestExerciseList = exercises;
    if (exerciseMediaPrefetchScheduled || typeof window === 'undefined') return;
    exerciseMediaPrefetchScheduled = true;

    const run = async () => {
        exerciseMediaPrefetchScheduled = false;
        if (!navigator.onLine || !latestExerciseList?.length || !('serviceWorker' in navigator)) return;

        // Respeta el modo de ahorro de datos y conexiones muy lentas.
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection?.saveData || ['slow-2g', '2g', '3g'].includes(connection?.effectiveType)) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const worker = navigator.serviceWorker.controller || registration.active;
            if (!worker) return;
            worker.postMessage({
                type: 'PREFETCH_EXERCISE_IMAGES',
                urls: getExerciseImageUrls(latestExerciseList),
            });
        } catch {
            // La precarga es oportunista: nunca debe afectar al uso normal de la app.
        }
    };

    const schedule = () => {
        if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 12000 });
        else window.setTimeout(run, 5000);
    };

    if (navigator.onLine) schedule();
    else window.addEventListener('online', schedule, { once: true });
};

const loadPersistedExerciseList = () => {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (_) {}
    return null;
};

/**
 * Obtiene la lista completa de ejercicios (con caché en memoria y fallback offline persistente).
 */
export const getExerciseList = async () => {
    // 1. Si la caché en memoria existe, la devolvemos.
    if (cachedExerciseList && cachedExerciseList.length > 0) {
        scheduleExerciseMediaPrefetch(cachedExerciseList);
        return cachedExerciseList;
    }

    // 2. Intentamos recuperar de localStorage si no había en memoria
    const persisted = loadPersistedExerciseList();
    if (persisted) {
        cachedExerciseList = persisted;
    }

    try {
        const data = await apiClient('/exercise-list/exercises');
        const cleanData = (Array.isArray(data) ? data : []).filter(Boolean);
        if (cleanData.length > 0) {
            cachedExerciseList = cleanData;
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(cleanData));
            } catch (_) {}
        }
        const exerciseList = cachedExerciseList || cleanData;
        scheduleExerciseMediaPrefetch(exerciseList);
        return exerciseList;
    } catch (error) {
        console.warn("Failed to fetch exercise list from network:", error);
        // Fallback offline: si hay lista persistida en el dispositivo, la devolvemos sin romper
        if (cachedExerciseList && cachedExerciseList.length > 0) {
            scheduleExerciseMediaPrefetch(cachedExerciseList);
            return cachedExerciseList;
        }
        cachedExerciseList = null;
        throw error;
    }
};

export const getExerciseHistory = (exerciseName) => {
    return apiClient(`/exercises/history/${encodeURIComponent(exerciseName)}`);
};

/**
 * Obtiene los detalles completos de un ejercicio por su ID.
 */
export const getExerciseDetails = async (exerciseId) => {
    try {
        const data = await apiClient(`/exercise-list/exercises/${exerciseId}`);
        return data;
    } catch (error) {
        console.error(`Failed to fetch details for exercise ${exerciseId}:`, error);
        throw error;
    }
};

export const importYouTubePlaylist = async (playlistId) => {
  cachedExerciseList = null;
  return apiClient('/exercise-list/exercises/import-youtube', {
    method: 'POST',
    body: { playlistId }
  });
};

export const updateExercise = async (id, exerciseData) => {
  cachedExerciseList = null;
  return apiClient(`/exercise-list/exercises/${id}`, {
    method: 'PUT',
    body: exerciseData
  });
};

export const deleteExercise = async (id) => {
  cachedExerciseList = null;
  return apiClient(`/exercise-list/exercises/${id}`, {
    method: 'DELETE'
  });
};
