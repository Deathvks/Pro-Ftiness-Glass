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
const requestWithRetry = async (url, options = {}, retries = 1, timeoutMs = 8000) => {
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

// Cach� en memoria para listados de noticias
const publicListMemoryCache = new Map();

/**
 * Obtiene s�ncronamente (0ms) datos del listado de noticias desde RAM, SessionStorage o datos locales empaquetados
 */
export const getCachedPublicNews = ({ page = 1, limit = 6, category = '', search = '' } = {}) => {
  const cacheKey = `${page}_${limit}_${category || 'all'}_${search || 'all'}`;
  if (publicListMemoryCache.has(cacheKey)) {
    return publicListMemoryCache.get(cacheKey);
  }
  try {
    const raw = sessionStorage.getItem(`pfg_news_list_${cacheKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.news) && parsed.news.length > 0) {
        publicListMemoryCache.set(cacheKey, parsed);
        return parsed;
      }
    }
  } catch {}

  // Fallback con los 20 art�culos precargados en el bundle inicial
  if (page === 1 && !search && Array.isArray(cachedNewsList) && cachedNewsList.length > 0) {
    let list = cachedNewsList;
    if (category && category !== 'Todas') {
      list = cachedNewsList.filter((art) => (art.category || '').toLowerCase() === category.toLowerCase());
    }
    if (list.length > 0) {
      const sortedByViews = [...cachedNewsList].sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
      return {
        news: list.slice(0, limit),
        popularNews: sortedByViews.slice(0, 4),
        total: list.length,
        totalAll: cachedNewsList.length,
        totalPages: Math.max(1, Math.ceil(list.length / limit)),
        currentPage: 1,
        categories: ['Todas', 'Entrenamiento', 'Nutrición', 'Suplementación', 'Salud', 'Novedades'],
        categoryCounts: cachedNewsList.reduce((acc, curr) => {
          const cat = (curr.category || '').trim();
          if (cat) acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {}),
        isBundledFallback: true
      };
    }
  }

  return null;
};

export const fetchPublicNews = async ({ page = 1, limit = 6, category = '', search = '', bypassCache = false } = {}) => {
  const cacheKey = `${page}_${limit}_${category || 'all'}_${search || 'all'}`;
  const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);
  if (category && category !== 'Todas') params.append('category', category);
  if (search) params.append('search', search);
  if (bypassCache) params.append('_t', Date.now());

  const data = await requestWithRetry(`${API_URL}/news?${params.toString()}`, {
    headers: getAuthHeaders(),
    cache: bypassCache ? 'no-store' : 'default'
  }, 1);

  if (data && Array.isArray(data.news)) {
    publicListMemoryCache.set(cacheKey, data);
    try {
      sessionStorage.setItem(`pfg_news_list_${cacheKey}`, JSON.stringify(data));
    } catch {}

    // Registrar art�culos en articleMemoryCache como parciales para apertura instant�nea al pulsar
    data.news.forEach((art) => {
      if (art && art.slug && !articleMemoryCache.has(art.slug)) {
        articleMemoryCache.set(art.slug, {
          article: art,
          relatedNews: [],
          nextArticle: null,
          prevArticle: null,
          isPartial: true
        });
      }
    });
  }

  return data;
};

/**
 * Consulta la lista fresca y completa de noticias para el panel de administración
 * Bypasea cualquier caché HTTP y trae hasta 200 artículos directamente desde la BD.
 */
export const fetchAdminNews = async () => {
  try {
    const data = await requestWithRetry(`${API_URL}/news/admin/list?_t=${Date.now()}`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    }, 1);
    if (data && Array.isArray(data.news)) {
      return data;
    }
  } catch (err) {
    console.warn('[newsService] Fallback a fetchPublicNews para admin:', err.message);
  }
  return fetchPublicNews({ page: 1, limit: 100, bypassCache: true });
};

export const fetchNewsBySlug = async (slug, { bypassCache = false } = {}) => {
  if (!slug) throw new Error('Slug no válido');

  // Si ya tenemos el artículo completo en memoria y no pedimos refresco forzado, devolverlo directamente
  if (!bypassCache && articleMemoryCache.has(slug)) {
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

export const recordArticleView = async (slug, trackingData = {}) => {
  try {
    const res = await fetch(`${API_URL}/news/article/${encodeURIComponent(slug)}/view`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(trackingData)
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

// --- AUTOMATIZACIÓN DE NOTICIAS CON GEMINI ---
export const getNewsAutomationStatus = async () => {
  return requestWithRetry(
    `${API_URL}/news/admin/automation/status`,
    {
      headers: getAuthHeaders()
    },
    0
  );
};

export const triggerNewsAutomation = async (topic = null) => {
  return requestWithRetry(
    `${API_URL}/news/admin/automation/trigger`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ topic })
    },
    0
  );
};

export const updateNewsAutomationSchedule = async ({ hour, minute = 0 }) => {
  return requestWithRetry(
    `${API_URL}/news/admin/automation/schedule`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ hour, minute })
    },
    0
  );
};

export const fixDuplicateCovers = async () => {
  return requestWithRetry(
    `${API_URL}/news/admin/fix-duplicate-covers`,
    {
      method: 'POST',
      headers: getAuthHeaders()
    },
    0
  );
};

/**
 * Enviar telemetría / sniffing de visita a noticias
 */
export const trackNewsVisit = async (payload = {}) => {
  try {
    const res = await fetch(`${API_URL}/news/track`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

/**
 * Obtener estadísticas de analítica y visitas para el panel admin
 */
export const fetchNewsAnalytics = async ({ period = 'all', mode = 'all' } = {}) => {
  const query = new URLSearchParams({ period, mode }).toString();
  return requestWithRetry(
    `${API_URL}/news/admin/analytics?${query}`,
    {
      method: 'GET',
      headers: getAuthHeaders()
    },
    0
  );
};

/**
 * Enviar ping de diagnóstico / prueba de tracker
 */
export const sendTestVisitPing = async (slug = null) => {
  return requestWithRetry(
    `${API_URL}/news/admin/analytics/test-ping`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ slug })
    },
    0
  );
};

/**
 * Limpiar visitas de prueba de diagnóstico
 */
export const clearTestVisits = async () => {
  return requestWithRetry(
    `${API_URL}/news/admin/analytics/test-data`,
    {
      method: 'DELETE',
      headers: getAuthHeaders()
    },
    0
  );
};
