/* frontend/src/utils/newsTracker.js */
import * as newsService from '../services/newsService';

const VISITOR_ID_KEY = 'pfg_news_visitor_id';
const SESSION_ID_KEY = 'pfg_news_session_id';
const PREV_ROUTE_KEY = 'pfg_last_app_route';

/**
 * Genera o recupera el ID único y persistente de visitante (Visitor Fingerprint ID)
 */
export const getOrCreateVisitorId = () => {
  try {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      const randomPart = Math.random().toString(36).substring(2, 10);
      const timePart = Date.now().toString(36);
      visitorId = `vis_${timePart}_${randomPart}`;
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    return visitorId;
  } catch {
    return `vis_tmp_${Date.now()}`;
  }
};

/**
 * Genera o recupera el ID de la sesión actual de navegación
 */
export const getOrCreateSessionId = () => {
  try {
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = `ses_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return `ses_tmp_${Date.now()}`;
  }
};

/**
 * Detecta el tipo de dispositivo de forma precisa
 */
const detectDeviceType = () => {
  try {
    const ua = navigator.userAgent || '';
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const width = window.innerWidth || window.screen.width || 1024;

    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua) || (isTouch && width >= 768 && width <= 1024)) {
      return 'tablet';
    }
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua) || (isTouch && width < 768)) {
      return 'mobile';
    }
    return 'desktop';
  } catch {
    return 'desktop';
  }
};

/**
 * Extrae parámetros UTM de la URL actual
 */
const getUtmParams = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
    };
  } catch {
    return { utm_source: null, utm_medium: null, utm_campaign: null };
  }
};

/**
 * Registra la última ruta interna para saber desde qué pantalla vino el usuario
 */
export const recordInternalRoute = (pathname) => {
  try {
    if (pathname && !pathname.startsWith('/noticias')) {
      sessionStorage.setItem(PREV_ROUTE_KEY, pathname);
    }
  } catch {}
};

/**
 * Obtiene la ruta previa interna si el usuario navegaba por la app
 */
export const getPreviousInternalRoute = () => {
  try {
    return sessionStorage.getItem(PREV_ROUTE_KEY) || null;
  } catch {
    return null;
  }
};

// Control anti-duplicados por sesión / navegación (evita ráfagas por React StrictMode)
const recentlyTracked = new Set();

/**
 * Compila el payload de telemetría / sniffing completo
 */
export const buildTrackingPayload = (extra = {}) => {
  const utm = getUtmParams();
  const screenResolution = `${window.screen?.width || window.innerWidth}x${window.screen?.height || window.innerHeight}`;

  return {
    visitor_id: getOrCreateVisitorId(),
    session_id: getOrCreateSessionId(),
    page_path: window.location.pathname + window.location.search,
    referrer: document.referrer || '',
    previous_route: getPreviousInternalRoute(),
    device_type: detectDeviceType(),
    screen_resolution: screenResolution,
    language: navigator.language || navigator.userLanguage || 'es-ES',
    utm_source: utm.utm_source,
    utm_medium: utm.utm_medium,
    utm_campaign: utm.utm_campaign,
    ...extra,
  };
};

/**
 * Rastrea la visita al catálogo general de noticias (/noticias)
 */
export const trackCatalogVisit = async () => {
  const cacheKey = `catalog_${new Date().getMinutes()}`;
  if (recentlyTracked.has(cacheKey)) return;
  recentlyTracked.add(cacheKey);
  setTimeout(() => recentlyTracked.delete(cacheKey), 30000);

  const payload = buildTrackingPayload({
    article_slug: null,
    article_title: 'Catálogo de Noticias'
  });

  try {
    await newsService.trackNewsVisit(payload);
  } catch {}
};

/**
 * Rastrea la lectura de un artículo específico (/noticias/:slug)
 */
export const trackArticleVisit = async (slug, articleTitle = '') => {
  if (!slug) return;
  const cacheKey = `art_${slug}_${new Date().getMinutes()}`;
  if (recentlyTracked.has(cacheKey)) return;
  recentlyTracked.add(cacheKey);
  setTimeout(() => recentlyTracked.delete(cacheKey), 30000);

  const payload = buildTrackingPayload({
    slug,
    article_title: articleTitle
  });

  try {
    return await newsService.recordArticleView(slug, payload);
  } catch {
    return null;
  }
};
