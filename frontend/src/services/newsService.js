/* frontend/src/services/newsService.js */
import useAppStore from '../store/useAppStore';
import cachedNewsList from '../data/cachedNews.json';

// Caché en memoria para transiciones instantáneas a 0ms
const articleMemoryCache = new Map();
const inflightPromises = new Map();

/**
 * Obtiene síncronamente (0ms) datos cacheados de un artículo
 * Revisa memoria RAM, sessionStorage o la lista base local de artículos
 */
export const getCachedArticle = (slug) => {
  if (!slug) return null;

  // 1. Memoria activa (artículo completo)
  if (articleMemoryCache.has(slug)) {
    return articleMemoryCache.get(slug);
  }

  // 2. SessionStorage
  try {
    const raw = sessionStorage.getItem(`pfg_art_${slug}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.article) {
        articleMemoryCache.set(slug, parsed);
        return parsed;
      }
    }
  } catch {
    // sessionStorage inaccesible o lleno
  }

  // 3. Fallback a cachedNews.json para mostrar inmediatamente cabecera y metadatos
  const localMatch = Array.isArray(cachedNewsList)
    ? cachedNewsList.find((item) => item.slug === slug)
    : null;

  if (localMatch) {
    return {
      article: localMatch,
      relatedNews: [],
      nextArticle: null,
      prevArticle: null,
      isPartial: true
    };
  }

  return null;
};

/**
 * Precarga en segundo plano al hacer hover o tocar una tarjeta de noticia
 */
export const prefetchNewsBySlug = (slug) => {
  if (!slug) return;
  if (articleMemoryCache.has(slug)) return;
  fetchNewsBySlug(slug).catch(() => {});
};


const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const getAuthHeaders = () => {
  const token = useAppStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

/**
 * Petición HTTP resiliente con reintento automático y traducción humana de errores de red
 */
const requestWithRetry = async (url, options = {}, retries = 1, timeoutMs = 15000) => {
  let attempts = 0;
  while (attempts <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        credentials: 'include',
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        let message = data.error;
        if (!message) {
          if (res.status === 404) message = 'El contenido solicitado no fue encontrado.';
          else if (res.status >= 500) message = 'El servidor no está disponible en este momento. Inténtalo de nuevo más tarde.';
          else message = `Error al procesar la solicitud (${res.status})`;
        }
        const error = new Error(message);
        error.status = res.status;
        throw error;
      }

      return await res.json();
    } catch (err) {
      clearTimeout(timeoutId);

      const isAbort = err.name === 'AbortError';
      const isNetwork =
        isAbort ||
        err.name === 'TypeError' ||
        (err.message && (
          err.message.toLowerCase().includes('failed to fetch') ||
          err.message.toLowerCase().includes('network') ||
          err.message.toLowerCase().includes('load failed')
        ));

      // Si es fallo de red (conexión inestable o microcorte) y quedan intentos, esperar y reintentar
      if (isNetwork && attempts < retries) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      // Si agotamos intentos o es un fallo de red definitivo, devolver mensaje claro en español
      if (isNetwork) {
        const friendlyErr = new Error(
          isAbort
            ? 'El servidor tardó demasiado en responder. Comprueba tu conexión a internet.'
            : 'No se pudo conectar con el servidor. Revisa tu conexión a internet o inténtalo en unos momentos.'
        );
        friendlyErr.isNetwork = true;
        friendlyErr.status = 0;
        throw friendlyErr;
      }

      throw err;
    }
  }
};

export const fetchPublicNews = async ({ page = 1, limit = 6, category = '', search = '' } = {}) => {
  const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);
  if (category && category !== 'Todas') params.append('category', category);
  if (search) params.append('search', search);

  return requestWithRetry(`${API_URL}/news?${params.toString()}`, {
    headers: getAuthHeaders()
  }, 1);
};

export const fetchNewsBySlug = async (slug) => {
  if (!slug) throw new Error('Slug no válido');

  // Si ya tenemos el artículo completo en memoria, devolverlo directamente
  if (articleMemoryCache.has(slug)) {
    const cached = articleMemoryCache.get(slug);
    if (!cached.isPartial) {
      return cached;
    }
  }

  // Si ya hay una petición en vuelo para este mismo slug, reutilizarla (evita peticiones duplicadas)
  if (inflightPromises.has(slug)) {
    return inflightPromises.get(slug);
  }

  const promise = (async () => {
    try {
      const data = await requestWithRetry(
        `${API_URL}/news/article/${encodeURIComponent(slug)}`,
        { headers: getAuthHeaders() },
        1
      );

      if (data && data.article) {
        articleMemoryCache.set(slug, data);
        try {
          sessionStorage.setItem(`pfg_art_${slug}`, JSON.stringify(data));
        } catch {
          // sessionStorage bloqueado o lleno
        }
      }
      return data;
    } finally {
      inflightPromises.delete(slug);
    }
  })();

  inflightPromises.set(slug, promise);
  return promise;
};

export const recordArticleView = async (slug) => {
  try {
    const res = await fetch(`${API_URL}/news/article/${encodeURIComponent(slug)}/view`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders()
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export const toggleLikeArticle = async (slug, action = 'like') => {
  return requestWithRetry(
    `${API_URL}/news/article/${encodeURIComponent(slug)}/like`,
    {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action })
    },
    0
  );
};

export const generateAINews = async ({ topic, category }) => {
  return requestWithRetry(
    `${API_URL}/news/generate-ai`,
    {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({ topic, category })
    },
    0,
    60000 // 60s timeout para generación con IA
  );
};

export const createNews = async (articleData) => {
  return requestWithRetry(
    `${API_URL}/news`,
    {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify(articleData)
    },
    0
  );
};

export const updateNews = async (id, articleData) => {
  return requestWithRetry(
    `${API_URL}/news/${id}`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(articleData)
    },
    0
  );
};

export const deleteNews = async (id) => {
  return requestWithRetry(
    `${API_URL}/news/${id}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders()
    },
    0
  );
};
