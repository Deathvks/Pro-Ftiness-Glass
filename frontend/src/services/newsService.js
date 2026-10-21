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

export const fetchPublicNews = async ({ page = 1, limit = 9, category = '', search = '' } = {}) => {
  const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);
  if (category && category !== 'Todas') params.append('category', category);
  if (search) params.append('search', search);

  const res = await fetch(`${API_URL}/news?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al obtener noticias');
  }
  return res.json();
};

export const fetchNewsBySlug = async (slug) => {
  const res = await fetch(`${API_URL}/news/article/${encodeURIComponent(slug)}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al obtener la noticia');
  }
  return res.json();
};

export const generateAINews = async ({ topic, category }) => {
  const res = await fetch(`${API_URL}/news/generate-ai`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ topic, category })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al generar la noticia con IA');
  }
  return res.json();
};

export const createNews = async (articleData) => {
  const res = await fetch(`${API_URL}/news`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(articleData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al crear la noticia');
  }
  return res.json();
};

export const updateNews = async (id, articleData) => {
  const res = await fetch(`${API_URL}/news/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(articleData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al actualizar la noticia');
  }
  return res.json();
};

export const deleteNews = async (id) => {
  const res = await fetch(`${API_URL}/news/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al eliminar la noticia');
  }
  return res.json();
};
