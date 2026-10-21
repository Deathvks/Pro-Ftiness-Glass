/* frontend/src/services/newsService.js */
import useAppStore from '../store/useAppStore';

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
  return requestWithRetry(
    `${API_URL}/news/article/${encodeURIComponent(slug)}`,
    { headers: getAuthHeaders() },
    1
  );
};

export const recordArticleView = async (slug) => {
  try {
    const res = await fetch(`${API_URL}/news/article/${encodeURIComponent(slug)}/view`, {
      method: 'POST',
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
