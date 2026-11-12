import apiClient, { BACKEND_BASE_URL } from './apiClient';

export const NEWS_SITE_URL = 'https://profitnessglass.es';
export const NEWS_PAGE_SIZE = 6;
export const NEWS_CATEGORIES = ['Todas', 'Entrenamiento', 'Nutrición', 'Suplementación', 'Salud', 'Novedades'];

export type NewsArticle = {
  id: number;
  slug: string;
  title: string;
  summary?: string;
  image_url?: string;
  category?: string;
  author_name?: string;
  author_avatar?: string;
  tags?: string;
  reading_time?: number;
  views_count?: number;
  likes_count?: number;
  published_at?: string;
};

export type NewsList = {
  news: NewsArticle[];
  popularNews: NewsArticle[];
  total: number;
  totalAll: number;
  totalPages: number;
  currentPage: number;
  categories: string[];
  categoryCounts: Record<string, number>;
};

export type NewsDetail = {
  article: NewsArticle & { content: string };
  relatedNews: NewsArticle[];
  prevArticle: NewsArticle | null;
  nextArticle: NewsArticle | null;
};

export type NewsQuery = { page: number; category: string; search: string };
export const DEFAULT_NEWS_QUERY: NewsQuery = { page: 1, category: 'Todas', search: '' };

export const listNews = ({ page, category, search }: NewsQuery): Promise<NewsList> => {
  const params = new URLSearchParams({ page: String(page), limit: String(NEWS_PAGE_SIZE) });
  if (category !== 'Todas') params.set('category', category);
  if (search.trim()) params.set('search', search.trim());
  return apiClient('/news?' + params.toString(), { timeout: 12000 });
};

export const getNewsArticle = (slug: string): Promise<NewsDetail> =>
  apiClient('/news/article/' + encodeURIComponent(slug), { timeout: 12000 });

export const recordNewsView = (slug: string, deviceType: 'mobile' | 'tablet' | 'desktop'): Promise<{ views_count?: number }> =>
  apiClient('/news/article/' + encodeURIComponent(slug) + '/view', {
    method: 'POST',
    body: { device_type: deviceType, previous_route: '/noticias' },
    queueWhenOffline: false,
  });

export const reactToNews = (slug: string, liked: boolean): Promise<{ likes_count: number }> =>
  apiClient('/news/article/' + encodeURIComponent(slug) + '/like', {
    method: 'POST',
    body: { action: liked ? 'like' : 'unlike' },
    queueWhenOffline: false,
  });

export function resolveNewsImage(value?: string) {
  const source = value?.trim();
  if (!source) return undefined;
  if (/^https?:\/\//i.test(source)) return source;
  if (!source.startsWith('/') || source.startsWith('//')) return undefined;
  return (source.startsWith('/uploads/') ? BACKEND_BASE_URL : NEWS_SITE_URL) + source;
}

export function resolveNewsLink(value: string, slug: string) {
  const address = value.trim();
  if (!address || /[\r\n\t\\]/.test(address)) return undefined;
  if (/^(?:https?:\/\/|mailto:)/i.test(address)) return address;
  if (/^[a-z][a-z\d+.-]*:/i.test(address)) return undefined;
  if (address.startsWith('//')) return 'https:' + address;
  if (address.startsWith('/')) return NEWS_SITE_URL + address;
  if (address.startsWith('#') || address.startsWith('?')) {
    return `${NEWS_SITE_URL}/noticias/${encodeURIComponent(slug)}${address}`;
  }
  return `${NEWS_SITE_URL}/noticias/${address}`;
}
