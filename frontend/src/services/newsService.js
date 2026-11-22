/* frontend/src/services/newsService.js */
import useAppStore from '../store/useAppStore';
import { Capacitor } from '@capacitor/core';
import cachedNewsList from '../data/cachedNews.json';
import { getNewsCoverUrls } from '../utils/newsCover.js';

// Caché en memoria para transiciones instantáneas a 0ms
const articleMemoryCache = new Map();
const inflightPromises = new Map();
const inflightListPromises = new Map();

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

  // 2. LocalStorage y SessionStorage (persistente ante recargas y actualizaciones)
  try {
    const raw = localStorage.getItem('pfg_art_' + slug) || sessionStorage.getItem('pfg_art_' + slug);
    if (raw) {
      const parsed = JSON.parse(raw);
      const artData = parsed?.article ? parsed : (parsed?.data?.article ? parsed.data : null);
      if (artData) {
        articleMemoryCache.set(slug, artData);
        return artData;
      }
    }
  } catch {}

  // 3. Fallback a cachedNews.json para mostrar inmediatamente cabecera y metadatos
  const localMatch = Array.isArray(cachedNewsList)
    ? cachedNewsList.find((item) => item.slug === slug)
    : null;

  if (localMatch) {
    const hasFullContent = Boolean(localMatch.content && localMatch.content.length > 50);
    return {
      article: localMatch,
      relatedNews: [],
      nextArticle: null,
      prevArticle: null,
      isPartial: !hasFullContent
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


const CANONICAL_API_URL = 'https://profitnessglass.es/api';

export const getResolvedApiUrl = () => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
  const isLocalDev = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
    !Capacitor.isNativePlatform();

  if (isLocalDev && envUrl && !envUrl.includes('zeabur')) {
    return envUrl;
  }

  if (!envUrl || envUrl.includes('localhost') || envUrl.includes('10.0.2.2') || envUrl.includes('zeabur')) {
    return CANONICAL_API_URL;
  }

  return envUrl;
};

const API_URL = getResolvedApiUrl();
export const getNewsCover = article => getNewsCoverUrls(article, API_URL);

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
const requestWithRetry = async (url, options = {}, retries = 1, timeoutMs = 7000) => {
  let attempts = 0;
  let currentUrl = url;

  while (attempts <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(currentUrl, {
        credentials: 'include',
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      // Si el servidor devuelve HTML (ej. fallback SPA por dominio antiguo de Zeabur)
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text().catch(() => '');
        if (text.trim().startsWith('<') || text.trim().startsWith('<!doctype')) {
          if (!currentUrl.includes('profitnessglass.es')) {
            const canonicalUrl = currentUrl.replace(/https?:\/\/[^\/]+\/api/, CANONICAL_API_URL);
            if (canonicalUrl !== currentUrl) {
              currentUrl = canonicalUrl;
              attempts++;
              continue;
            }
          }
          throw new Error('Respuesta no válida del servidor');
        }
      }

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

      // Si falló y la URL no apuntaba a la canónica, conmutar a profitnessglass.es
      if (!currentUrl.includes('profitnessglass.es')) {
        const canonicalUrl = currentUrl.replace(/https?:\/\/[^\/]+\/api/, CANONICAL_API_URL);
        if (canonicalUrl !== currentUrl) {
          currentUrl = canonicalUrl;
          attempts++;
          continue;
        }
      }

      const isAbort = err.name === 'AbortError';
      const isNetwork =
        isAbort ||
        err.name === 'TypeError' ||
        (err.message && (
          err.message.toLowerCase().includes('failed to fetch') ||
          err.message.toLowerCase().includes('network') ||
          err.message.toLowerCase().includes('load failed') ||
          err.message.toLowerCase().includes('servidor')
        ));

      // Si es fallo de red y quedan intentos, esperar brevemente y reintentar
      if (isNetwork && attempts < retries) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 800));
        continue;
      }

      // Si agotamos intentos o es un fallo de red definitivo, devolver mensaje claro en español
      if (isNetwork) {
        const friendlyErr = new Error(
          isAbort
            ? 'El servidor tardó en responder. Mostrando contenido en caché.'
            : 'Sin conexión con el servidor. Mostrando contenido en caché.'
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
    const raw = localStorage.getItem(`pfg_news_list_${cacheKey}`) || sessionStorage.getItem(`pfg_news_list_${cacheKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      const actualData = parsed?.news ? parsed : (parsed?.data?.news ? parsed.data : null);
      if (actualData && Array.isArray(actualData.news) && actualData.news.length > 0) {
        publicListMemoryCache.set(cacheKey, actualData);
        return actualData;
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

  if (!bypassCache && inflightListPromises.has(cacheKey)) {
    return inflightListPromises.get(cacheKey);
  }

  const promise = (async () => {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (limit) params.append('limit', limit);
      if (category && category !== 'Todas') params.append('category', category);
      if (search) params.append('search', search);
      // Siempre incluimos timestamp anti-caché de WebView
      params.append('_t', Date.now());

      const currentApiUrl = getResolvedApiUrl();
      const data = await requestWithRetry(`${currentApiUrl}/news?${params.toString()}`, {
        headers: getAuthHeaders(),
        cache: 'no-cache'
      }, 1, 7000);

      if (data && Array.isArray(data.news)) {
        publicListMemoryCache.set(cacheKey, data);
        try {
          const payload = { data, timestamp: Date.now() };
          localStorage.setItem(`pfg_news_list_${cacheKey}`, JSON.stringify(payload));
          sessionStorage.setItem(`pfg_news_list_${cacheKey}`, JSON.stringify(payload));
        } catch {}

        // Registrar artículos en articleMemoryCache como parciales para apertura instantánea al pulsar
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
    } catch (err) {
      // Fallback transparente a datos cacheados o bundle local para evitar pantallas en blanco o bloqueos
      const fallback = getCachedPublicNews({ page, limit, category, search });
      if (fallback) {
        return fallback;
      }
      throw err;
    } finally {
      inflightListPromises.delete(cacheKey);
    }
  })();

  inflightListPromises.set(cacheKey, promise);
  return promise;
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
      const currentApiUrl = getResolvedApiUrl();
      const data = await requestWithRetry(
        `${currentApiUrl}/news/article/${encodeURIComponent(slug)}?_t=${Date.now()}`,
        { headers: getAuthHeaders(), cache: 'no-cache' },
        1,
        7000
      );

      if (data && data.article) {
        articleMemoryCache.set(slug, data);
        try {
          const payload = { data, timestamp: Date.now() };
          localStorage.setItem(`pfg_art_${slug}`, JSON.stringify(payload));
          sessionStorage.setItem(`pfg_art_${slug}`, JSON.stringify(payload));
        } catch {
          // sessionStorage bloqueado o lleno
        }
      }
      return data;
    } catch (err) {
      // Fallback a cachedNewsList si la API remota da 404 o no responde
      const localMatch = Array.isArray(cachedNewsList)
        ? cachedNewsList.find((item) => item.slug === slug)
        : null;
      if (localMatch) {
        const fallbackData = {
          article: localMatch,
          relatedNews: [],
          nextArticle: null,
          prevArticle: null,
          isPartial: false
        };
        articleMemoryCache.set(slug, fallbackData);
        return fallbackData;
      }
      throw err;
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


export const optimizeExistingArticlesWithAI = async ({ articleId = null, forceAll = false } = {}) => {
  // Limpiar cachés locales de artículos para que al terminar se cargue el nuevo texto adaptado
  articleMemoryCache.clear();
  publicListMemoryCache.clear();
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith('pfg_art_') || k.startsWith('pfg_news_list_') || k === 'pfg_admin_news') {
        localStorage.removeItem(k);
      }
    });
    Object.keys(sessionStorage).forEach((k) => {
      if (k.startsWith('pfg_art_') || k.startsWith('pfg_news_list_')) {
        sessionStorage.removeItem(k);
      }
    });
  } catch {}

  return requestWithRetry(
    `${API_URL}/news/admin/automation/optimize-existing`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ articleId, forceAll })
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
export const fetchNewsAnalytics = async ({
  period = 'all',
  mode = 'all',
  page = 1,
  pageSize = 10,
  sort = 'newest',
  search = '',
} = {}) => {
  const query = new URLSearchParams({
    period,
    mode,
    page: String(page),
    pageSize: String(pageSize),
    sort,
    search,
  }).toString();
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
export const sendTestVisitPing = async (target = null) => {
  const payload = typeof target === 'string'
    ? { slug: target }
    : (target && typeof target === 'object' ? target : {});

  return requestWithRetry(
    `${API_URL}/news/admin/analytics/test-ping`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
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

/**
 * Corregir, pulir y adaptar contenido de un artículo con IA según las normas de Pro Fitness Glass
 */
export const polishNewsContent = async ({ content, title, category, summary }) => {
  return requestWithRetry(
    `${API_URL}/news/admin/polish-content`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, title, category, summary })
    },
    1,
    25000 // 25s timeout para Gemini
  );
};
