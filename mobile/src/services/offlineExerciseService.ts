/* mobile/src/services/offlineExerciseService.ts */
import { Directory, File as ExpoFile, Paths } from 'expo-file-system';
import { BACKEND_BASE_URL, API_BASE_URL } from './apiClient';
import { getExerciseList } from './exerciseService';

const OFFLINE_DIR_NAME = 'offline_exercises';
const OFFLINE_CATALOG_FILE = 'exercises_catalog.json';
const MEDIA_MAP_STORAGE_KEY = 'pfg_offline_media_map_v1';

let memoryMediaMap: Record<string, string> | null = null;

const getOfflineDir = () => new Directory(Paths.document, OFFLINE_DIR_NAME);

const loadMediaMap = (): Record<string, string> => {
  if (memoryMediaMap) return memoryMediaMap;
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(MEDIA_MAP_STORAGE_KEY) : null;
    const parsed = raw ? JSON.parse(raw) : {};
    memoryMediaMap = parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    memoryMediaMap = {};
  }
  return memoryMediaMap!;
};

const saveMediaMap = (map: Record<string, string>) => {
  memoryMediaMap = map;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MEDIA_MAP_STORAGE_KEY, JSON.stringify(map));
    }
  } catch {}
};

const hashString = (input: string): string => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
};

const getExtensionFromUrl = (url: string): string => {
  const clean = url.split('?')[0].split('#')[0];
  const extMatch = clean.match(/\.([a-zA-Z0-9]{2,5})$/);
  return extMatch ? extMatch[1].toLowerCase() : 'jpg';
};

const resolveRemoteMediaUrl = (rawUrl: string): string => {
  const clean = rawUrl.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  const path = clean.startsWith('/') ? clean.substring(1) : clean;
  const filename = path.split('/').pop() || '';
  const isWgerUuid =
    /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/.test(filename);
  if (isWgerUuid || path.includes('exercise-images')) {
    return `https://wger.de/media/exercise-images/${filename}`;
  }
  const base = BACKEND_BASE_URL || API_BASE_URL.replace('/api', '');
  return `${base}/${path}`;
};

export const getLocalOfflineMediaUri = (url?: string | null): string | null => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const map = loadMediaMap();
  const mapped = map[trimmed] || map[resolveRemoteMediaUrl(trimmed)];
  if (!mapped) return null;
  try {
    const file = new ExpoFile(mapped);
    return file.exists ? file.uri : null;
  } catch {
    return mapped;
  }
};

export const getOfflineExerciseCatalog = async (): Promise<any[]> => {
  try {
    const catalogFile = new ExpoFile(getOfflineDir(), OFFLINE_CATALOG_FILE);
    if (catalogFile.exists) {
      const content = await catalogFile.text();
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('pfg_offline_exercises_cache');
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  return [];
};

export interface OfflineDownloadProgress {
  current: number;
  total: number;
  percent: number;
  bytesDownloaded: number;
  currentUrl?: string;
}

export interface OfflineDownloadState {
  isDownloading: boolean;
  progress: OfflineDownloadProgress;
  error: any;
  result: any;
}

export interface OfflineStorageStats {
  isDownloaded: boolean;
  imageCount: number;
  exerciseCount: number;
  totalBytes: number;
  formattedSize: string;
  lastDownloadedAt: string | null;
}

export interface ExerciseCatalogStats {
  exerciseCount: number;
  mediaCount: number;
  estimatedSize: string;
}

// Global Singleton State
let activeDownloadState: OfflineDownloadState = {
  isDownloading: false,
  progress: { current: 0, total: 0, percent: 0, bytesDownloaded: 0 },
  error: null,
  result: null,
};

let activeAbortController: AbortController | null = null;
const downloadListeners = new Set<(state: OfflineDownloadState) => void>();

const notifyDownloadListeners = () => {
  const snapshot: OfflineDownloadState = {
    ...activeDownloadState,
    progress: { ...activeDownloadState.progress },
  };
  for (const listener of downloadListeners) {
    try {
      listener(snapshot);
    } catch (err) {
      console.warn('[OfflineStorage] Error en listener de descarga:', err);
    }
  }
};

export const subscribeToOfflineDownload = (
  listener: (state: OfflineDownloadState) => void
) => {
  if (typeof listener !== 'function') return () => {};
  downloadListeners.add(listener);
  listener({
    ...activeDownloadState,
    progress: { ...activeDownloadState.progress },
  });
  return () => {
    downloadListeners.delete(listener);
  };
};

export const getActiveOfflineDownloadState = (): OfflineDownloadState => ({
  ...activeDownloadState,
  progress: { ...activeDownloadState.progress },
});

export const cancelOfflineDownloadSession = () => {
  if (activeAbortController) {
    try {
      activeAbortController.abort();
    } catch {}
  }
  activeDownloadState = {
    isDownloading: false,
    progress: { current: 0, total: 0, percent: 0, bytesDownloaded: 0 },
    error: null,
    result: null,
  };
  activeAbortController = null;
  notifyDownloadListeners();
};

export const normalizeMediaUrl = (url: any): string | null => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Si es una ruta relativa, la dejamos normalizada
  return trimmed;
};

export const getAvailableExerciseCatalogStats = async (): Promise<ExerciseCatalogStats> => {
  try {
    const exercises = await getExerciseList();
    if (!Array.isArray(exercises) || exercises.length === 0) {
      return { exerciseCount: 0, mediaCount: 0, estimatedSize: '0 MB' };
    }

    const rawUrlsSet = new Set<string>();
    for (const ex of exercises) {
      let images = ex.images;
      if (typeof images === 'string') {
        try {
          images = JSON.parse(images);
        } catch {
          images = images.split(',').map((s: string) => s.trim());
        }
      }

      const candidates = [
        ex.image_url_start,
        ex.image_url_end,
        ex.image_url,
        ...(Array.isArray(images) ? images : []),
      ];

      for (const cand of candidates) {
        const norm = normalizeMediaUrl(cand);
        if (norm && !norm.match(/\.(mp4|mov|webm|mkv)(?:$|\?)/i)) {
          rawUrlsSet.add(norm);
        }
      }

      if (ex.video_url && typeof ex.video_url === 'string') {
        const match = ex.video_url.match(
          /(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]{11})/
        );
        if (match && match[1]) {
          rawUrlsSet.add(`https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`);
        }
      }
    }

    const mediaCount = rawUrlsSet.size;
    const estimatedBytes = mediaCount * 210 * 1024;
    const mb = (estimatedBytes / (1024 * 1024)).toFixed(0);

    return {
      exerciseCount: exercises.length,
      mediaCount,
      estimatedSize: `~${mb} MB`,
    };
  } catch {
    return { exerciseCount: 160, mediaCount: 220, estimatedSize: '~45 MB' };
  }
};

export const getOfflineStorageStats = async (): Promise<OfflineStorageStats> => {
  try {
    if (typeof localStorage === 'undefined') {
      return {
        isDownloaded: false,
        imageCount: 0,
        exerciseCount: 0,
        totalBytes: 0,
        formattedSize: '0 MB',
        lastDownloadedAt: null,
      };
    }

    const isReady = localStorage.getItem('pfg_offline_exercises_ready') === 'true';
    const exCount = parseInt(localStorage.getItem('pfg_offline_exercises_count') || '0', 10);
    const imgCount = parseInt(localStorage.getItem('pfg_offline_images_count') || '0', 10);
    const bytes = parseInt(localStorage.getItem('pfg_offline_exercises_bytes') || '0', 10);
    const lastDate = localStorage.getItem('pfg_offline_exercises_date');

    const mb = (bytes / (1024 * 1024)).toFixed(1);

    return {
      isDownloaded: isReady && exCount > 0,
      imageCount: imgCount || (isReady ? 220 : 0),
      exerciseCount: exCount,
      totalBytes: bytes,
      formattedSize: isReady && bytes > 0 ? `${mb} MB` : '~45 MB',
      lastDownloadedAt: lastDate,
    };
  } catch {
    return {
      isDownloaded: false,
      imageCount: 0,
      exerciseCount: 0,
      totalBytes: 0,
      formattedSize: '0 MB',
      lastDownloadedAt: null,
    };
  }
};

export const deleteOfflineExercises = async (): Promise<{ success: boolean }> => {
  try {
    try {
      const dir = getOfflineDir();
      if (dir.exists) {
        dir.delete();
      }
    } catch {}
    memoryMediaMap = {};
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(MEDIA_MAP_STORAGE_KEY);
      localStorage.removeItem('pfg_offline_exercises_cache');
      localStorage.removeItem('pfg_offline_exercises_count');
      localStorage.removeItem('pfg_offline_images_count');
      localStorage.removeItem('pfg_offline_exercises_bytes');
      localStorage.removeItem('pfg_offline_exercises_ready');
      localStorage.removeItem('pfg_offline_exercises_date');
    }
    return { success: true };
  } catch (err) {
    console.warn('[OfflineStorage] Error al borrar caché offline:', err);
    throw err;
  }
};

export const startOfflineDownloadSession = async () => {
  if (activeDownloadState.isDownloading) {
    return activeDownloadState.result;
  }

  activeAbortController = new AbortController();
  activeDownloadState = {
    isDownloading: true,
    progress: { current: 0, total: 100, percent: 0, bytesDownloaded: 0 },
    error: null,
    result: null,
  };
  notifyDownloadListeners();

  const signal = activeAbortController.signal;

  try {
    const offlineDir = getOfflineDir();
    offlineDir.create({ idempotent: true, intermediates: true });

    // 1. Descargar catálogo de ejercicios
    const exercises = await getExerciseList();
    if (signal.aborted) throw new Error('Descarga cancelada');

    const cleanExercises = Array.isArray(exercises) ? exercises : [];
    if (cleanExercises.length === 0) {
      throw new Error('No se pudo obtener el catálogo de ejercicios.');
    }

    // 2. Extraer URLs de recursos multimedia
    const rawUrlsSet = new Set<string>();
    for (const ex of cleanExercises) {
      let images = ex.images;
      if (typeof images === 'string') {
        try {
          images = JSON.parse(images);
        } catch {
          images = images.split(',').map((s: string) => s.trim());
        }
      }

      const candidates = [
        ex.image_url_start,
        ex.image_url_end,
        ex.image_url,
        ...(Array.isArray(images) ? images : []),
      ];

      for (const cand of candidates) {
        const norm = normalizeMediaUrl(cand);
        if (norm && !norm.match(/\.(mp4|mov|webm|mkv)(?:$|\?)/i) && !norm.includes('/muscle_groups/')) {
          rawUrlsSet.add(norm);
        }
      }

      if (ex.video_url && typeof ex.video_url === 'string') {
        const match = ex.video_url.match(
          /(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]{11})/
        );
        if (match && match[1]) {
          rawUrlsSet.add(`https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`);
        }
      }
    }

    const urlsToDownload = Array.from(rawUrlsSet);
    const total = urlsToDownload.length > 0 ? urlsToDownload.length : cleanExercises.length;
    let completed = 0;
    let totalBytes = 0;
    const nextMediaMap: Record<string, string> = { ...loadMediaMap() };

    activeDownloadState.progress = {
      current: 0,
      total,
      percent: 0,
      bytesDownloaded: 0,
    };
    notifyDownloadListeners();

    // 3. Descarga real a disco nativo con ExpoFile.downloadFileAsync (concurrencia = 4)
    const CONCURRENCY = 4;
    let queueIndex = 0;

    const downloadWorker = async () => {
      while (queueIndex < urlsToDownload.length) {
        if (signal.aborted) throw new Error('Descarga cancelada');

        const currentIndex = queueIndex++;
        const rawUrl = urlsToDownload[currentIndex];
        const fullUrl = resolveRemoteMediaUrl(rawUrl);

        try {
          const ext = getExtensionFromUrl(fullUrl);
          const fileName = `${hashString(fullUrl)}.${ext}`;
          const targetFile = new ExpoFile(offlineDir, fileName);

          if (targetFile.exists && (targetFile.size || 0) > 0) {
            totalBytes += targetFile.size || 35000;
            nextMediaMap[rawUrl] = targetFile.uri;
            nextMediaMap[fullUrl] = targetFile.uri;
          } else {
            const downloaded = await ExpoFile.downloadFileAsync(fullUrl, targetFile, { idempotent: true });
            totalBytes += downloaded.size || 35000;
            nextMediaMap[rawUrl] = downloaded.uri;
            nextMediaMap[fullUrl] = downloaded.uri;
          }
        } catch (err: any) {
          if (signal.aborted || err?.name === 'AbortError') {
            throw new Error('Descarga cancelada');
          }
        } finally {
          if (signal.aborted) return;
          completed++;
          const percent = Math.min(100, Math.round((completed / total) * 100));
          activeDownloadState.progress = {
            current: completed,
            total,
            percent,
            bytesDownloaded: totalBytes,
            currentUrl: fullUrl,
          };
          notifyDownloadListeners();
        }
      }
    };

    if (urlsToDownload.length > 0) {
      const workers = Array.from(
        { length: Math.min(CONCURRENCY, urlsToDownload.length) },
        () => downloadWorker()
      );
      await Promise.all(workers);
    }

    if (signal.aborted) throw new Error('Descarga cancelada');

    // 4. Guardar catálogo en archivo nativo (evita límite de 6MB en AsyncStorage Android) + metadatos
    const catalogFile = new ExpoFile(offlineDir, OFFLINE_CATALOG_FILE);
    catalogFile.write(JSON.stringify(cleanExercises));
    saveMediaMap(nextMediaMap);

    const mbTotal = Math.max(1, Math.round(totalBytes / (1024 * 1024)));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pfg_offline_exercises_count', String(cleanExercises.length));
      localStorage.setItem('pfg_offline_images_count', String(completed));
      localStorage.setItem('pfg_offline_exercises_bytes', String(totalBytes || mbTotal * 1024 * 1024));
      localStorage.setItem('pfg_offline_exercises_ready', 'true');
      localStorage.setItem('pfg_offline_exercises_date', new Date().toISOString());
    }

    const result = {
      exerciseCount: cleanExercises.length,
      imageCount: completed,
      totalBytes,
      formattedSize: `${mbTotal} MB`,
    };

    activeDownloadState.isDownloading = false;
    activeDownloadState.result = result;
    activeAbortController = null;
    notifyDownloadListeners();

    return result;
  } catch (err: any) {
    activeDownloadState.isDownloading = false;
    activeAbortController = null;
    activeDownloadState.error = err;
    notifyDownloadListeners();
    throw err;
  }
};
