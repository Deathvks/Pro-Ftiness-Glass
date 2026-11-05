/* frontend/src/services/offlineExerciseService.js */
import { useState, useEffect } from 'react';
import { getExerciseList } from './exerciseService';

const DB_NAME = 'pfg_offline_exercises_db';
const DB_VERSION = 1;
const STORE_MEDIA = 'media';
const STORE_META = 'meta';
const CACHE_NAME = 'exercise-offline-cache';

let dbPromise = null;
const blobUrlMap = new Map(); // normalizedUrl -> blobUrl
const cachedKeysSet = new Set();
let isIndexLoaded = false;
let indexLoadingPromise = null;

const getDb = () => {
  if (dbPromise) return dbPromise;
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }

  dbPromise = new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_MEDIA)) {
        db.createObjectStore(STORE_MEDIA, { keyPath: 'url' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error('[OfflineStorage] Error opening IndexedDB:', event.target.error);
      resolve(null);
    };
  });

  return dbPromise;
};

export const normalizeMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return null;

  const apiBase = import.meta.env.VITE_API_BASE_URL || '';
  const mediaBase = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const base = mediaBase || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${cleanPath}`;
};

export const initOfflineMediaIndex = async () => {
  if (isIndexLoaded) return cachedKeysSet;
  if (indexLoadingPromise) return indexLoadingPromise;

  indexLoadingPromise = (async () => {
    try {
      const db = await getDb();
      if (!db) {
        isIndexLoaded = true;
        return cachedKeysSet;
      }

      await new Promise((resolve) => {
        const tx = db.transaction(STORE_MEDIA, 'readonly');
        const store = tx.objectStore(STORE_MEDIA);
        const req = store.getAllKeys();

        req.onsuccess = () => {
          if (Array.isArray(req.result)) {
            cachedKeysSet.clear();
            for (const key of req.result) {
              cachedKeysSet.add(key);
            }
          }
          resolve();
        };

        req.onerror = () => resolve();
      });

      isIndexLoaded = true;
    } catch (err) {
      console.warn('[OfflineStorage] Failed loading media index:', err);
    } finally {
      indexLoadingPromise = null;
    }
    return cachedKeysSet;
  })();

  return indexLoadingPromise;
};

if (typeof window !== 'undefined') {
  initOfflineMediaIndex().catch(() => {});
}

export const getOfflineBlobUrlSync = (url) => {
  const norm = normalizeMediaUrl(url);
  if (!norm) return null;
  return blobUrlMap.get(norm) || null;
};

export const resolveOfflineMediaUrl = async (url) => {
  const norm = normalizeMediaUrl(url);
  if (!norm) return null;

  if (blobUrlMap.has(norm)) {
    return blobUrlMap.get(norm);
  }

  await initOfflineMediaIndex();
  if (!cachedKeysSet.has(norm)) {
    return null;
  }

  try {
    const db = await getDb();
    if (!db) return null;

    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_MEDIA, 'readonly');
      const store = tx.objectStore(STORE_MEDIA);
      const req = store.get(norm);

      req.onsuccess = () => {
        const record = req.result;
        if (record && record.blob) {
          const blobUrl = URL.createObjectURL(record.blob);
          blobUrlMap.set(norm, blobUrl);
          resolve(blobUrl);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
};

export const useOfflineMediaUrl = (url) => {
  const [resolvedUrl, setResolvedUrl] = useState(() => getOfflineBlobUrlSync(url) || url);

  useEffect(() => {
    let isMounted = true;
    if (!url || typeof url !== 'string' || url.startsWith('blob:') || url.startsWith('data:')) {
      setResolvedUrl(url);
      return;
    }

    const syncUrl = getOfflineBlobUrlSync(url);
    if (syncUrl) {
      setResolvedUrl(syncUrl);
      return;
    }

    resolveOfflineMediaUrl(url).then((offlineUrl) => {
      if (isMounted && offlineUrl) {
        setResolvedUrl(offlineUrl);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [url]);

  return resolvedUrl || url;
};

export const useOfflineMediaUrls = (urls) => {
  const [resolvedUrls, setResolvedUrls] = useState(() => {
    if (!Array.isArray(urls)) return [];
    return urls.map((u) => getOfflineBlobUrlSync(u) || u);
  });

  const urlsKey = Array.isArray(urls) ? urls.join('|') : String(urls);

  useEffect(() => {
    let isMounted = true;
    if (!Array.isArray(urls) || urls.length === 0) {
      setResolvedUrls([]);
      return;
    }

    Promise.all(
      urls.map(async (u) => {
        const syncUrl = getOfflineBlobUrlSync(u);
        if (syncUrl) return syncUrl;
        const resolved = await resolveOfflineMediaUrl(u);
        return resolved || u;
      })
    ).then((results) => {
      if (isMounted) {
        setResolvedUrls(results);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [urlsKey]);

  return resolvedUrls;
};

export const getOfflineStorageStats = async () => {
  try {
    const db = await getDb();
    if (!db) {
      return {
        isDownloaded: false,
        imageCount: 0,
        exerciseCount: 0,
        totalBytes: 0,
        formattedSize: '0 MB',
        lastDownloadedAt: null
      };
    }

    const meta = await new Promise((resolve) => {
      const tx = db.transaction(STORE_META, 'readonly');
      const store = tx.objectStore(STORE_META);
      const req = store.get('status');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    const count = await new Promise((resolve) => {
      const tx = db.transaction(STORE_MEDIA, 'readonly');
      const store = tx.objectStore(STORE_MEDIA);
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });

    const totalBytes = meta?.totalBytes || 0;
    const mb = (totalBytes / (1024 * 1024)).toFixed(1);

    return {
      isDownloaded: count > 0 && !!meta?.isComplete,
      imageCount: count,
      exerciseCount: meta?.totalExercises || 0,
      totalBytes,
      formattedSize: `${mb} MB`,
      lastDownloadedAt: meta?.lastDownloadedAt || null
    };
  } catch (err) {
    console.error('[OfflineStorage] Error reading stats:', err);
    return {
      isDownloaded: false,
      imageCount: 0,
      exerciseCount: 0,
      totalBytes: 0,
      formattedSize: '0 MB',
      lastDownloadedAt: null
    };
  }
};

export const deleteOfflineExercises = async () => {
  try {
    for (const blobUrl of blobUrlMap.values()) {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {}
    }
    blobUrlMap.clear();
    cachedKeysSet.clear();

    const db = await getDb();
    if (db) {
      await new Promise((resolve) => {
        const tx = db.transaction([STORE_MEDIA, STORE_META], 'readwrite');
        tx.objectStore(STORE_MEDIA).clear();
        tx.objectStore(STORE_META).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    }

    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        await caches.delete(CACHE_NAME);
      } catch {}
    }

    return { success: true };
  } catch (err) {
    console.error('[OfflineStorage] Error deleting cache:', err);
    throw err;
  }
};

export const downloadAllExercisesForOffline = async ({ onProgress, signal } = {}) => {
  const db = await getDb();
  if (!db) {
    throw new Error('El almacenamiento local (IndexedDB) no está disponible en este dispositivo.');
  }

  // 1. Obtener la lista completa de ejercicios
  const exercises = await getExerciseList();
  if (!Array.isArray(exercises) || exercises.length === 0) {
    throw new Error('No se pudo obtener la biblioteca de ejercicios.');
  }

  // 2. Extraer todas las URLs de imágenes y miniaturas de ejercicios
  const rawUrlsSet = new Set();
  for (const ex of exercises) {
    let images = ex.images;
    if (typeof images === 'string') {
      try {
        images = JSON.parse(images);
      } catch {
        images = images.split(',').map((s) => s.trim());
      }
    }

    const candidates = [
      ex.image_url_start,
      ex.image_url_end,
      ex.image_url,
      ...(Array.isArray(images) ? images : [])
    ];

    for (const cand of candidates) {
      const norm = normalizeMediaUrl(cand);
      if (norm && !norm.match(/\.(mp4|mov|webm|mkv)(?:$|\?)/i)) {
        rawUrlsSet.add(norm);
      }
    }

    // Si tiene video de YouTube, incluir la miniatura
    if (ex.video_url && typeof ex.video_url === 'string') {
      const match = ex.video_url.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]{11})/);
      if (match && match[1]) {
        rawUrlsSet.add(`https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`);
      }
    }
  }

  const urlsToDownload = Array.from(rawUrlsSet);
  const total = urlsToDownload.length;
  let completed = 0;
  let totalBytes = 0;

  let cacheStore = null;
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      cacheStore = await caches.open(CACHE_NAME);
    } catch {}
  }

  // 3. Descarga concurrente con pool de trabajadores (concurrencia = 4)
  const CONCURRENCY = 4;
  let queueIndex = 0;

  const downloadWorker = async () => {
    while (queueIndex < urlsToDownload.length) {
      if (signal?.aborted) throw new Error('Descarga cancelada por el usuario');

      const currentIndex = queueIndex++;
      const url = urlsToDownload[currentIndex];

      try {
        const response = await fetch(url, {
          mode: 'cors',
          signal
        });

        if (response.ok) {
          const blob = await response.blob();
          const size = blob.size;
          totalBytes += size;

          // Guardar en IndexedDB
          await new Promise((resolve) => {
            const tx = db.transaction(STORE_MEDIA, 'readwrite');
            const store = tx.objectStore(STORE_MEDIA);
            store.put({
              url,
              blob,
              size,
              type: blob.type || 'image/webp',
              timestamp: Date.now()
            });
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
          });

          // Guardar también en Cache Storage si está disponible
          if (cacheStore) {
            try {
              await cacheStore.put(url, new Response(blob, {
                headers: { 'Content-Type': blob.type || 'image/webp' }
              }));
            } catch {}
          }

          cachedKeysSet.add(url);
          const blobUrl = URL.createObjectURL(blob);
          blobUrlMap.set(url, blobUrl);
        }
      } catch (err) {
        if (signal?.aborted) throw err;
        console.warn(`[OfflineStorage] Advertencia al descargar ${url}:`, err.message);
      } finally {
        completed++;
        if (typeof onProgress === 'function') {
          onProgress({
            current: completed,
            total,
            percent: Math.min(100, Math.round((completed / total) * 100)),
            bytesDownloaded: totalBytes,
            currentUrl: url
          });
        }
      }
    }
  };

  const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, () => downloadWorker());
  await Promise.all(workers);

  // 4. Guardar metadatos finales
  await new Promise((resolve) => {
    const tx = db.transaction(STORE_META, 'readwrite');
    const store = tx.objectStore(STORE_META);
    store.put({
      key: 'status',
      totalExercises: exercises.length,
      totalImages: completed,
      totalBytes,
      lastDownloadedAt: new Date().toISOString(),
      isComplete: true
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });

  return {
    exercisesCount: exercises.length,
    imagesCount: completed,
    totalBytes,
    formattedSize: `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
  };
};
