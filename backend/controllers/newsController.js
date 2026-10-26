/* backend/controllers/newsController.js */
import { sanitizeNewsContent } from '../utils/newsSanitizer.js';
import { Op } from 'sequelize';
import models from '../models/index.js';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import newsAutomationService from '../services/newsAutomationService.js';

import { UAParser } from 'ua-parser-js';
import jwt from 'jsonwebtoken';

const { News, NewsVisitLog, User } = models;

// Imágenes de portada curadas en alta resolución para fitness y nutrición
const CATEGORY_DEFAULT_IMAGES = {
  'Entrenamiento': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
  'Nutrición': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
  'Suplementación': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=1200&q=80',
  'Salud': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
  'Novedades': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80'
};

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

/**
 * Obtener listado público de noticias con paginación, filtros y búsqueda
 */
// Caché en memoria en el servidor para respuestas instantáneas (<1ms)
const articleSlugCache = new Map();
const ARTICLE_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutos

const publicListCache = new Map();
const PUBLIC_LIST_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutos

export const invalidateNewsCache = () => {
  articleSlugCache.clear();
  publicListCache.clear();
};

export const getPublicNews = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(30, Math.max(1, parseInt(req.query.limit) || 9));
    const offset = (page - 1) * limit;
    const { category, search } = req.query;

    const cacheKey = `${page}_${limit}_${category || 'all'}_${search || 'all'}`;
    if (publicListCache.has(cacheKey)) {
      const cached = publicListCache.get(cacheKey);
      if (Date.now() - cached.timestamp < PUBLIC_LIST_CACHE_TTL_MS) {
        res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
        return res.json(cached.payload);
      }
    }

    const where = { is_published: true };

    if (category && category !== 'Todas') {
      where.category = category;
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { title: { [Op.like]: term } },
        { summary: { [Op.like]: term } },
        { tags: { [Op.like]: term } }
      ];
    }

    // Ejecución optimizada en paralelo
    const [{ count, rows }, allPublished, popularRows] = await Promise.all([
      News.findAndCountAll({
        where,
        order: [['published_at', 'DESC']],
        limit,
        offset,
        attributes: [
          'id', 'slug', 'title', 'summary', 'image_url', 'category',
          'tags', 'author_name', 'author_avatar', 'reading_time',
          'views_count', 'likes_count', 'published_at', 'updatedAt'
        ]
      }),
      News.findAll({
        where: { is_published: true },
        attributes: ['category']
      }),
      News.findAll({
        where: { is_published: true },
        order: [
          ['views_count', 'DESC'],
          ['likes_count', 'DESC'],
          ['published_at', 'DESC']
        ],
        limit: 4,
        attributes: [
          'id', 'slug', 'title', 'summary', 'image_url', 'category',
          'tags', 'author_name', 'reading_time', 'views_count',
          'likes_count', 'published_at'
        ]
      })
    ]);

    const categoryCounts = allPublished.reduce((acc, curr) => {
      const cat = (curr.category || '').trim();
      if (cat) {
        acc[cat] = (acc[cat] || 0) + 1;
      }
      return acc;
    }, {});

    const DEFAULT_CATEGORIES = ['Entrenamiento', 'Nutrición', 'Suplementación', 'Salud', 'Novedades'];
    const dbCategories = Object.keys(categoryCounts);
    const extraCategories = dbCategories.filter(c => !DEFAULT_CATEGORIES.includes(c)).sort();
    const categories = ['Todas', ...DEFAULT_CATEGORIES, ...extraCategories];

    const payload = {
      news: rows,
      total: count,
      totalAll: allPublished.length,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      categories,
      categoryCounts,
      popularNews: popularRows || []
    };

    publicListCache.set(cacheKey, { payload, timestamp: Date.now() });
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return res.json(payload);
  } catch (error) {
    console.error('Error al obtener noticias:', error);
    return res.status(500).json({ error: 'Error al cargar las noticias.' });
  }
};

/**
 * Obtener una noticia completa por su slug
 */
export const getNewsBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const isAdmin = req.user?.role === 'admin';

    // 1. Respuesta instantánea desde caché si está vigente (0ms de latencia)
    if (!isAdmin && articleSlugCache.has(slug)) {
      const cached = articleSlugCache.get(slug);
      if (Date.now() - cached.timestamp < ARTICLE_CACHE_TTL_MS) {
        res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
        return res.json(cached.payload);
      }
    }

    const where = { slug };
    if (!isAdmin) {
      where.is_published = true;
    }

    const article = await News.findOne({ where });

    if (!article) {
      return res.status(404).json({ error: 'Noticia no encontrada.' });
    }

    // 2. Ejecutar consultas de artículos relacionados y siguiente/anterior en PARALELO
    const [relatedNews, nextArticle, prevArticle] = await Promise.all([
      News.findAll({
        where: {
          is_published: true,
          id: { [Op.ne]: article.id },
          category: article.category
        },
        order: [['published_at', 'DESC']],
        limit: 3,
        attributes: ['id', 'slug', 'title', 'summary', 'image_url', 'category', 'reading_time', 'views_count', 'likes_count', 'published_at']
      }),
      News.findOne({
        where: { is_published: true, id: { [Op.gt]: article.id } },
        order: [['id', 'ASC']],
        attributes: ['id', 'slug', 'title', 'category', 'image_url']
      }),
      News.findOne({
        where: { is_published: true, id: { [Op.lt]: article.id } },
        order: [['id', 'DESC']],
        attributes: ['id', 'slug', 'title', 'category', 'image_url']
      })
    ]);

    const payload = {
      article,
      relatedNews,
      nextArticle,
      prevArticle
    };

    if (!isAdmin) {
      articleSlugCache.set(slug, { payload, timestamp: Date.now() });
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    }

    return res.json(payload);
  } catch (error) {
    console.error('Error al obtener noticia por slug:', error);
    return res.status(500).json({ error: 'Error al cargar la noticia.' });
  }
};

/**
 * Registrar una lectura única real en un artículo
 */
// Caché en memoria para geolocalización de IPs (evita saturar ip-api y responde en 0ms)
const ipGeoCache = new Map();

/**
 * Motor de Rastreo y Sniffing de Visitas para Noticias
 * Captura: IP, país, ciudad, referrer (página previa), navegador, SO, resolución, dispositivo y usuario.
 */
export const recordNewsTelemetry = async (req, customData = {}) => {
  try {
    // 1. IP del visitante (robusta con Cloudflare / proxies)
    let ip =
      req.headers['cf-connecting-ip'] ||
      req.headers['x-real-ip'] ||
      (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket?.remoteAddress) ||
      '';

    if (ip.startsWith('::ffff:')) {
      ip = ip.replace('::ffff:', '');
    }

    // 2. Extraer usuario autenticado si existe token (sin bloquear si es anónimo)
    let userId = null;
    try {
      const authHeader = req.headers['authorization'];
      const token = req.cookies?.token || (authHeader && authHeader.split(' ')[1]);
      if (token && process.env.JWT_SECRET) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.id) userId = decoded.id;
      }
    } catch {}

    // 3. User-Agent y Sniffing de Dispositivo
    const userAgent = req.headers['user-agent'] || customData.user_agent || '';
    const parser = new UAParser(userAgent);
    const parsedUA = parser.getResult();

    const browserName = parsedUA.browser.name || 'Desconocido';
    const browserVersion = parsedUA.browser.version ? parsedUA.browser.version.split('.')[0] : '';
    const browser = browserVersion ? `${browserName} ${browserVersion}` : browserName;

    const osName = parsedUA.os.name || 'Desconocido';
    const osVersion = parsedUA.os.version || '';
    const os = osVersion ? `${osName} ${osVersion}` : osName;

    let deviceType = customData.device_type || parsedUA.device.type || 'desktop';
    if (!['mobile', 'tablet', 'desktop'].includes(deviceType)) {
      deviceType = 'desktop';
    }

    // 4. Referrer (Página previa / De dónde vienen)
    const rawReferrer = customData.referrer || req.headers['referer'] || req.headers['referrer'] || '';
    let referrerHost = 'Directo / Marcadores';
    let referrerType = 'direct';

    if (rawReferrer) {
      try {
        const parsedUrl = new URL(rawReferrer);
        const hostname = parsedUrl.hostname.toLowerCase();
        referrerHost = hostname.replace(/^www\./, '');

        if (hostname.includes('google.')) {
          referrerType = 'search';
          referrerHost = 'Google';
        } else if (hostname.includes('bing.')) {
          referrerType = 'search';
          referrerHost = 'Bing';
        } else if (hostname.includes('duckduckgo.')) {
          referrerType = 'search';
          referrerHost = 'DuckDuckGo';
        } else if (hostname.includes('yahoo.')) {
          referrerType = 'search';
          referrerHost = 'Yahoo';
        } else if (hostname.includes('instagram.')) {
          referrerType = 'social';
          referrerHost = 'Instagram';
        } else if (hostname.includes('facebook.') || hostname.includes('fb.com')) {
          referrerType = 'social';
          referrerHost = 'Facebook';
        } else if (hostname.includes('twitter.') || hostname.includes('t.co') || hostname.includes('x.com')) {
          referrerType = 'social';
          referrerHost = 'X / Twitter';
        } else if (hostname.includes('tiktok.')) {
          referrerType = 'social';
          referrerHost = 'TikTok';
        } else if (hostname.includes('reddit.')) {
          referrerType = 'social';
          referrerHost = 'Reddit';
        } else if (hostname.includes('whatsapp.')) {
          referrerType = 'messaging';
          referrerHost = 'WhatsApp';
        } else if (hostname.includes('t.me') || hostname.includes('telegram.')) {
          referrerType = 'messaging';
          referrerHost = 'Telegram';
        } else if (hostname.includes('localhost') || hostname.includes('profitnessglass') || hostname === req.hostname) {
          referrerType = 'internal';
          referrerHost = customData.previous_route || 'Navegación Interna';
        } else {
          referrerType = 'external';
        }
      } catch {
        referrerHost = rawReferrer.substring(0, 50);
        referrerType = 'external';
      }
    } else if (customData.previous_route && customData.previous_route !== '/') {
      referrerType = 'internal';
      referrerHost = customData.previous_route;
    }

    // 5. Geolocalización (País y Ciudad)
    let country = req.headers['cf-ipcountry'] || null;
    let city = null;

    if (!country || country === 'XX') {
      if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '') {
        country = 'ES';
        city = 'Local / Pruebas';
      } else if (ipGeoCache.has(ip)) {
        const cachedGeo = ipGeoCache.get(ip);
        country = cachedGeo.country;
        city = cachedGeo.city;
      } else {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 1500);
          const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,city`, {
            signal: controller.signal
          });
          clearTimeout(timeout);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'success') {
              country = data.countryCode || 'ES';
              city = data.city || null;
              ipGeoCache.set(ip, { country, city });
            }
          }
        } catch {}
      }
    }
    if (!country) country = 'ES';

    // 6. Vinculación con Noticia (si aplica)
    const slug = customData.slug || req.params?.slug || null;
    let newsId = null;
    let articleTitle = customData.article_title || null;

    if (slug) {
      const article = await News.findOne({
        where: { slug }
      });
      if (article) {
        newsId = article.id;
        articleTitle = article.title;
        if (!customData.is_test) {
          await article.increment('views_count', { by: 1 });
          await article.reload();
          const cached = articleSlugCache.get(slug);
          if (cached && cached.payload?.article) {
            cached.payload.article.views_count = article.views_count;
          }
        }
      }
    }

    // 7. Crear el registro en news_visit_logs
    const visitorId = customData.visitor_id || `vis_${Math.random().toString(36).substring(2, 12)}`;
    const pagePath = customData.page_path || (slug ? `/noticias/${slug}` : '/noticias');

    let log = null;
    if (NewsVisitLog) {
      log = await NewsVisitLog.create({
        news_id: newsId,
        article_slug: slug,
        article_title: articleTitle,
        page_path: pagePath,
        visitor_id: visitorId,
        user_id: userId,
        session_id: customData.session_id || null,
        referrer: rawReferrer ? rawReferrer.substring(0, 500) : null,
        referrer_host: referrerHost.substring(0, 150),
        referrer_type: referrerType,
        ip_address: ip ? ip.substring(0, 64) : null,
        country: country ? country.substring(0, 10) : 'ES',
        city: city ? city.substring(0, 100) : null,
        device_type: deviceType,
        browser: browser ? browser.substring(0, 80) : null,
        os: os ? os.substring(0, 80) : null,
        screen_resolution: customData.screen_resolution ? String(customData.screen_resolution).substring(0, 30) : null,
        language: customData.language ? String(customData.language).substring(0, 20) : (req.headers['accept-language']?.split(',')[0]?.substring(0, 20) || 'es-ES'),
        utm_source: customData.utm_source ? String(customData.utm_source).substring(0, 100) : null,
        utm_medium: customData.utm_medium ? String(customData.utm_medium).substring(0, 100) : null,
        utm_campaign: customData.utm_campaign ? String(customData.utm_campaign).substring(0, 100) : null,
        duration_seconds: parseInt(customData.duration_seconds, 10) || 0,
        is_test: !!customData.is_test,
        user_agent: userAgent
      });
    }

    return {
      success: true,
      log,
      views_count: newsId ? (await News.findByPk(newsId))?.views_count : undefined
    };
  } catch (err) {
    console.error('Error en recordNewsTelemetry:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Endpoint para registrar lectura y sniffing en un artículo
 */
export const trackNewsView = async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await recordNewsTelemetry(req, { slug, ...(req.body || {}) });

    return res.json({
      success: true,
      views_count: result.views_count
    });
  } catch (error) {
    console.error('Error al registrar lectura de noticia:', error);
    return res.status(500).json({ error: 'Error al registrar lectura.' });
  }
};

/**
 * Endpoint genérico de telemetría / tracking (p. ej. catálogo de noticias o vista general)
 */
export const trackVisitor = async (req, res) => {
  try {
    const result = await recordNewsTelemetry(req, req.body || {});
    return res.json({
      success: result.success,
      logId: result.log?.id
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error al registrar telemetría.' });
  }
};

/**
 * Registrar o retirar valoración "Me ha servido" / Like en un artículo
 */
export const toggleLikeNews = async (req, res) => {
  try {
    const { slug } = req.params;
    const { action = 'like' } = req.body; // 'like' | 'unlike'

    const article = await News.findOne({
      where: { slug, is_published: true }
    });

    if (!article) {
      return res.status(404).json({ error: 'Artículo no encontrado.' });
    }

    if (action === 'unlike') {
      if (article.likes_count > 0) {
        await article.decrement('likes_count', { by: 1 });
      }
    } else {
      await article.increment('likes_count', { by: 1 });
    }

    await article.reload();
    articleSlugCache.delete(slug);

    return res.json({
      success: true,
      likes_count: article.likes_count,
      views_count: article.views_count
    });
  } catch (error) {
    console.error('Error al actualizar valoración del artículo:', error);
    return res.status(500).json({ error: 'Error al actualizar valoración del artículo.' });
  }
};

/**
 * Generar un artículo completo con IA (Gemini) para el administrador
 */
export const generateAINews = async (req, res) => {
  try {
    const { topic, category = 'Entrenamiento' } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'Debes proporcionar un tema o título base para generar el artículo.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en el servidor.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING },
            slug: { type: SchemaType.STRING },
            summary: { type: SchemaType.STRING },
            category: { type: SchemaType.STRING },
            tags: { type: SchemaType.STRING },
            reading_time: { type: SchemaType.INTEGER },
            content: { type: SchemaType.STRING },
            seo_title: { type: SchemaType.STRING },
            seo_description: { type: SchemaType.STRING }
          },
          required: ['title', 'slug', 'summary', 'category', 'content']
        }
      }
    });

    const prompt = `Eres un redactor y divulgador de élite de fitness, hipertrofia y nutrición deportiva de Pro Fitness Glass (estilo divulgador moderno de alto impacto: directo, entretenido, riguroso pero sin tecnicismos aburridos).
Tu máxima prioridad es la RETENCIÓN DEL LECTOR: que empiece a leer y no pueda soltar el artículo porque cada frase aporta valor práctico inmediato.

Genera un artículo de blog/noticia ágil, fascinante y optimizado para SEO sobre el siguiente tema: "${topic}".
Categoría sugerida: ${category}.

REGLAS DE RETENCIÓN, EXTENSIÓN Y ESTILO EDITORIAL (OBLIGATORIAS):
1. EXTENSIÓN ESTRICTA PARA MÁXIMA RETENCIÓN: Entre 450 y 650 palabras en total. ¡NO lo hagas largo ni denso! Debe poder leerse completo con interés en menos de 3 minutos.
2. RITMO, TONO Y PÁRRAFOS CORTOS:
   - Párrafos muy cortos (máximo 2 a 3 líneas por párrafo). NUNCA generes bloques o paredes de texto densas.
   - Gancho inicial ("Hook"): Las primeras 2-3 líneas deben plantear una curiosidad, un error común o un beneficio directo para el lector. Prohibido empezar con introducciones genéricas o aburridas ("Desde hace siglos...", "El deporte es fundamental..."). Ve directo a la acción.
   - Lenguaje claro, magnético y aplicable: Traduce la ciencia a un lenguaje directo para el gimnasio o la cocina. Cero tecnicismos farragosos o jerga académica que aburra al lector.
3. ESTRUCTURA CON SUBTÍTULOS ## (3 o 4 secciones concisas):
   - Usa subtítulos intrigantes y enfocados al beneficio del lector.
   - REGLA TÉCNICA ESTRICTA: Cada subtítulo (## o ###) debe ir OBLIGATORIAMENTE en su propia línea, seguido de dos saltos de línea antes del texto explicativo. NUNCA coloques texto en la misma línea que el ##. NUNCA uses # solo.
4. BLOQUES DE ALERTA MARKDOWN (1 o 2 máximo):
   > [!TIP]
   > **Consejo Práctico:** El truco accionable directo para aplicar hoy.
   O
   > [!IMPORTANT]
   > **Dato Científico:** El hallazgo clave explicado de forma sencilla y directa.
   (REGLA: NUNCA uses almohadillas ## dentro de las alertas ni corchetes sueltos como [ESTUDIO]).
5. TABLA COMPARATIVA VISUAL Y CONCISA:
   - Tabla Markdown sencilla (| Parámetro | Enfoque A | Enfoque B |) de máximo 3 a 4 filas, para que se entienda de un vistazo sin cansar.
6. INTERLINKING SEO INTERNO:
   - Incluye de forma natural en el cuerpo del artículo 1 o 2 enlaces Markdown hacia nuestras herramientas públicas si encajan con el tema: [Calculadora de 1RM](/calculadora-1rm), [Calculadora de Calorías y Macros](/calculadora-calorias-macros) o [Guía de Ejercicios de Gimnasio](/ejercicios).
7. CIERRE OBLIGATORIO:
   - Termina con la sección "## Puntos clave para llevarte" con 3 o 4 conclusiones numeradas muy directas ("Haz esto", "Evita esto", "Tu meta hoy").`;

    const result = await model.generateContent(prompt);

    const responseText = result.response.text();
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    if (parsed.content) parsed.content = sanitizeNewsContent(parsed.content);
    } catch (parseError) {
      console.error('Error parsing AI response JSON:', responseText);
      return res.status(500).json({ error: 'La IA no devolvió un JSON válido. Inténtalo de nuevo.' });
    }

    // Asignar miniatura temática única que no esté repetida en la BD
    if (!parsed.image_url) {
      try {
        const allNews = await News.findAll({ attributes: ['image_url'] });
        const usedImages = new Set(allNews.map(n => n.image_url).filter(Boolean));
        parsed.image_url = newsAutomationService.pickThematicImage(parsed.category, parsed.theme_keyword || '', usedImages);
      } catch {
        parsed.image_url = CATEGORY_DEFAULT_IMAGES[parsed.category] || CATEGORY_DEFAULT_IMAGES['Entrenamiento'];
      }
    }

    // Asegurar slug válido
    parsed.slug = slugify(parsed.slug || parsed.title);

    return res.json({ article: parsed });
  } catch (error) {
    console.error('Error al generar noticia con IA:', error);
    return res.status(500).json({ error: error.message || 'Error al generar el artículo con IA.' });
  }
};

/**
 * Crear noticia (Admin)
 */
export const createNews = async (req, res) => {
  try {
    const {
      title,
      slug: userSlug,
      summary,
      content,
      image_url,
      category,
      tags,
      reading_time,
      is_published,
      author_name,
      seo_title,
      seo_description
    } = req.body;

    if (!title || !content || !summary) {
      return res.status(400).json({ error: 'Título, resumen y contenido son obligatorios.' });
    }

    let finalSlug = slugify(userSlug || title);
    
    // Verificar colisión de slug
    const existing = await News.findOne({ where: { slug: finalSlug } });
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    const calculatedReadingTime = reading_time || Math.max(2, Math.ceil(content.split(/\s+/).length / 200));

    invalidateNewsCache();
    const newArticle = await News.create({
      title,
      slug: finalSlug,
      summary,
      content,
      image_url: image_url || CATEGORY_DEFAULT_IMAGES[category] || CATEGORY_DEFAULT_IMAGES['Entrenamiento'],
      category: category || 'Entrenamiento',
      tags: tags || '',
      reading_time: calculatedReadingTime,
      is_published: is_published !== false,
      published_at: new Date(),
      author_name: author_name || req.user?.username || 'Equipo Pro Fitness Glass',
      author_avatar: req.user?.profile_image_url || null,
      seo_title: seo_title || title,
      seo_description: seo_description || summary
    });

    // Notificar a motores de búsqueda (IndexNow / Bing / Yandex)
    if (newArticle.is_published) {
      import('../services/newsAutomationService.js')
        .then(({ newsAutomationService }) => {
          newsAutomationService.notifySearchEngines(newArticle.slug);
        })
        .catch(() => {});
    }

    return res.status(201).json({ message: 'Noticia creada con éxito.', article: newArticle });
  } catch (error) {
    console.error('Error al crear noticia:', error);
    return res.status(500).json({ error: 'Error al crear la noticia.' });
  }
};

/**
 * Actualizar noticia (Admin)
 */
export const updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await News.findByPk(id);

    if (!article) {
      return res.status(404).json({ error: 'Noticia no encontrada.' });
    }

    const {
      title,
      slug: newSlug,
      summary,
      content,
      image_url,
      category,
      tags,
      reading_time,
      is_published,
      author_name,
      seo_title,
      seo_description
    } = req.body;

    let finalSlug = article.slug;
    if (newSlug && newSlug !== article.slug) {
      finalSlug = slugify(newSlug);
      const existing = await News.findOne({ where: { slug: finalSlug, id: { [Op.ne]: id } } });
      if (existing) {
        finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
      }
    }

    invalidateNewsCache();
    await article.update({
      title: title ?? article.title,
      slug: finalSlug,
      summary: summary ?? article.summary,
      content: content ?? article.content,
      image_url: image_url ?? article.image_url,
      category: category ?? article.category,
      tags: tags ?? article.tags,
      reading_time: reading_time ?? article.reading_time,
      is_published: is_published !== undefined ? is_published : article.is_published,
      author_name: author_name ?? article.author_name,
      seo_title: seo_title ?? article.seo_title,
      seo_description: seo_description ?? article.seo_description
    });

    return res.json({ message: 'Noticia actualizada con éxito.', article });
  } catch (error) {
    console.error('Error al actualizar noticia:', error);
    return res.status(500).json({ error: 'Error al actualizar la noticia.' });
  }
};

/**
 * Eliminar noticia (Admin)
 */
export const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await News.findByPk(id);

    if (!article) {
      return res.status(404).json({ error: 'Noticia no encontrada.' });
    }

    invalidateNewsCache();
    await article.destroy();
    return res.json({ message: 'Noticia eliminada correctamente.' });
  } catch (error) {
    console.error('Error al eliminar noticia:', error);
    return res.status(500).json({ error: 'Error al eliminar la noticia.' });
  }
};

/**
 * Obtener todos los slugs publicados para Sitemap XML
 */
export const getSitemapNews = async () => {
  try {
    return await News.findAll({
      where: { is_published: true },
      attributes: ['slug', 'updatedAt', 'published_at'],
      order: [['published_at', 'DESC']]
    });
  } catch (error) {
    console.error('Error en sitemap news:', error);
    return [];
  }
};

/**
 * Semillero inicial de artículos científicos de alta calidad si la tabla está vacía
 */
/**
 * Obtener artículos para el Feed RSS 2.0 dinámico
 */
export const getRSSNews = async () => {
  try {
    return await News.findAll({
      where: { is_published: true },
      attributes: ['title', 'slug', 'summary', 'category', 'image_url', 'published_at', 'updatedAt'],
      order: [['published_at', 'DESC']],
      limit: 50
    });
  } catch (error) {
    console.error('Error en RSS news:', error);
    return [];
  }
};

export const seedInitialNewsIfEmpty = async () => {
  try {
    const count = await News.count();
    if (count > 0) return;

    console.log('🌱 Inicializando artículos científicos de lanzamiento en noticias...');

    const initialArticles = [
      {
        title: 'Creatina Monohidrato: Guía Científica Definitiva de Dosis, Beneficios y Mitos',
        slug: 'guia-cientifica-creatina-monohidrato-dosis-beneficios-mitos',
        category: 'Suplementación',
        reading_time: 5,
        summary: 'Descubre qué dice la ciencia sobre la creatina: dosis óptima diaria, si es necesaria la fase de carga, cuándo tomarla y el desmentido de los mitos más comunes.',
        image_url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=1200&q=80',
        tags: 'creatina, suplementacion, masa muscular, fuerza, ciencia',
        author_name: 'Equipo Científico Pro Fitness',
        seo_title: 'Creatina Monohidrato: Dosis, Beneficios y Mitos | Pro Fitness Glass',
        seo_description: 'Guía científica completa sobre la creatina monohidrato: cómo tomarla, dosis recomendada, mitos sobre el daño renal y retención de agua.',
        content: `## El suplemento con mayor evidencia del mundo

La **creatina monohidrato** es el suplemento ergogénico con mayor respaldo científico en la historia de la nutrición deportiva. Avalada por la *International Society of Sports Nutrition (ISSN)*, su eficacia y perfil de seguridad han sido demostrados en cientos de ensayos clínicos.

### ¿Cómo funciona la creatina en tu cuerpo?
El cuerpo almacena la creatina en forma de **fosfocreatina** en el tejido muscular esquelético. Durante esfuerzos de alta intensidad (como una serie pesada de sentadilla o un sprint), la fosfocreatina dona un grupo fosfato al ADP para regenerar rápidamente **ATP** (la molécula energética universal). 

Tener los depósitos de fosfocreatina saturados te permite:
- Realizar **1 a 2 repeticiones extra** con cargas máximas.
- Recuperarte más rápido entre series de alta demanda.
- Estimular una mayor síntesis proteica gracias a una mayor hidratación intracelular.

---

### ¿Fase de carga: sí o no?
Existen dos protocolos validados por la evidencia:

1. **Protocolo constante (Recomendado):** Consumir entre **3 g y 5 g al día** (o 0.07 g por kg de peso corporal) todos los días de forma continuada. Los depósitos se saturan por completo en 3-4 semanas sin molestias gastrointestinales.
2. **Protocolo con carga rápida:** Consumir 20 g al día divididos en 4 tomas durante 5-7 días, seguido de 3-5 g diarios de mantenimiento. Satura los depósitos en solo una semana, pero puede provocar pesadez estomacal en personas sensibles.

> [!TIP]
> La creatina funciona por **acumulación**, no por efecto agudo. Lo más importante no es el momento exacto en que la tomes, sino tomarla **todos los días**, incluso los días de descanso.

---

### Mitos desmentidos por la ciencia

* **¿Daña los riñones?:** En personas con función renal sana, decenas de estudios a largo plazo (hasta 5 años de consumo ininterrumpido) han demostrado una seguridad absoluta. El ligero aumento de creatinina en sangre es un subproducto normal e inocuo de la degradación muscular de la creatina, no un indicador de daño.
* **¿Causa caída del cabello?:** Este mito nació de un único estudio de 2009 en jugadores de rugby donde aumentó la DHT pero dentro de rangos normales. Ningún otro estudio posterior ha logrado replicar este efecto ni ha demostrado alopecia inducida por creatina.
* **¿Retiene líquidos bajo la piel?:** Falso. La creatina retiene agua **intracelular** (dentro del miocito), lo que da a los músculos un aspecto más lleno, tenso y anabólico, nunca "blando".

---

### Puntos clave para llevarte
1. La **creatina monohidrato** (sello Creapure o monohidrato estándar 200 mesh) es la forma más económica y efectiva.
2. Toma **3 a 5 gramos diarios** a cualquier hora con agua o tu batido post-entreno.
3. No es necesario realizar descansos cíclicos.`
      },
      {
        title: 'Sobrecarga Progresiva: El Único Principio que Realmente Construye Músculo',
        slug: 'sobrecarga-progresiva-principio-hipertrofia-muscular',
        category: 'Entrenamiento',
        reading_time: 6,
        summary: 'Aprende a programar la sobrecarga progresiva más allá de simplemente subir kilos a la barra. Estrategias prácticas de series, técnica, densidad y RIR.',
        image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
        tags: 'sobrecarga progresiva, hipertrofia, entrenamiento, fuerza, rir',
        author_name: 'Coach Pro Fitness',
        seo_title: 'Sobrecarga Progresiva: Cómo Ganar Masa Muscular Real',
        seo_description: 'Domina el principio de la sobrecarga progresiva en el gimnasio: cómo aplicar peso, repeticiones y tempo para estimular el crecimiento muscular.',
        content: `## La regla de oro del estímulo muscular

Si tu entrenamiento no desafía a tus fibras musculares con una tensión mecánica creciente a lo largo del tiempo, tu cuerpo no tendrá ningún motivo biológico para invertir energía en sintetizar nuevo tejido muscular.

La **sobrecarga progresiva** no significa batir un récord personal en cada sesión; significa imponer un estrés gradualmente mayor a medida que tu cuerpo se adapta.

---

### Las 5 formas reales de progresar

Muchos atletas se estancan porque creen que sobrecargar es únicamente poner más discos a la barra. En realidad, existen 5 variables clave:

1. **Aumento de carga externa:** Mover 80 kg a 8 repeticiones hoy cuando el mes pasado movías 75 kg a las mismas 8 repeticiones con idéntica técnica.
2. **Aumento de repeticiones con la misma carga:** Si haces press de banca con 70 kg por 8 reps, alcanzar 10 o 12 reps con el mismo peso representa un aumento directo del volumen de trabajo.
3. **Mejora en la calidad técnica y control:** Realizar la fase excéntrica en 3 segundos con pausa controlada en el punto de estiramiento máximo genera mucha mayor tensión mecánica que realizar repeticiones con rebote.
4. **Mayor rango de movimiento (ROM):** Bajar 2 centímetros más en sentadilla profunda con el mismo peso incrementa el trabajo mecánico realizado.
5. **Densidad del entrenamiento:** Completar el mismo volumen de series efectivas reduciendo los descansos de 3 minutos a 2 minutos manteniendo las cargas.

---

### El papel del RIR (Repeticiones en Reserva)

Para que una serie cuente como estímulo hipertrófico efectivo, debe acercarse al fallo muscular real:
* **RIR 1-3:** La zona óptima de estímulo/fatiga para la mayoría de series efectivas.
* **RIR 0 (Fallo muscular):** Excelente para la última serie de ejercicios en máquina o aislamiento, pero debe dosificarse en ejercicios multiarticulares pesados para no disparar la fatiga del sistema nervioso central.

> [!IMPORTANT]
> Registrar rigurosamente cada serie, carga y repeticiones en tu aplicación es el 50% del éxito. Sin datos históricos, estás adivinando en lugar de progresar.`
      },
      {
        title: 'Déficit Calórico Inteligente: Cómo Perder Grasa sin Perder Músculo',
        slug: 'deficit-calorico-inteligente-perder-grasa-preservar-musculo',
        category: 'Nutrición',
        reading_time: 5,
        summary: 'Estrategia paso a paso para definir tu físico: cálculo del déficit óptimo, cantidad de proteína necesaria y cómo evitar que tu metabolismo se ralentice.',
        image_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
        tags: 'deficit calorico, perdida de grasa, definicion, macros, proteina',
        author_name: 'Nutricionista Deportivo Pro Fitness',
        seo_title: 'Déficit Calórico: Perder Grasa y Mantener Músculo | Guía',
        seo_description: 'Aprende a estructurar un déficit calórico moderado para perder grasa manteniendo tu fuerza y masa muscular. Consejos de macros y timing.',
        content: `## Perder grasa no tiene por qué significar pasar hambre

El único requisito termodinámico ineludible para oxidar grasa corporal es mantener un **balance energético negativo** (ingerir menos calorías de las que tu organismo gasta). Sin embargo, un déficit mal planteado puede destruir tu masa muscular, tu energía en el gimnasio y tu perfil hormonal.

---

### El cálculo del déficit perfecto: Ni muy lento, ni muy agresivo

* **Déficit moderado óptimo:** Un recorte de entre el **15% y el 20%** sobre tus calorías de mantenimiento diario (habitualmente entre 300 y 500 kcal).
* **Ritmo seguro de pérdida de peso:** Entre el **0.5% y el 1% de tu peso corporal por semana**. Si pesas 80 kg, perder entre 400 g y 800 g semanales garantiza que el 85-90% de lo perdido sea tejido adiposo y no masa magra.

---

### Los 3 pilares para blindar tu músculo en definición

1. **Proteína elevada (1.8 a 2.4 g/kg):** Cuando la disponibilidad energética es baja, el cuerpo recurre a la gluconeogénesis con mayor facilidad. Una ingesta alta de aminoácidos protege tu masa muscular y maximiza la saciedad.
2. **Mantener la intensidad del entrenamiento:** No cometas el error de cambiar a "series de 20 repeticiones con poco peso para definir". Las series pesadas de 6 a 12 repeticiones son la señal principal que le dice al cuerpo: *"Necesito este músculo para sobrevivir, no lo consumas"*.
3. **NEAT y pasos diarios:** Caminar entre 8.000 y 12.000 pasos al día permite quemar calorías adicionales sin generar fatiga que interfiera con tus sesiones de fuerza en el gimnasio.`
      }
    ];

    await News.bulkCreate(initialArticles);
    console.log('✅ Artículos iniciales de noticias sembrados con éxito.');
  } catch (error) {
    console.warn('Advertencia al sembrar noticias iniciales:', error.message);
  }
};

/**
 * Endpoints para Administrador: Listado completo y fresco sin límite de 30 ni caché HTTP
 */
export const getAdminNewsList = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const { rows, count } = await News.findAndCountAll({
      order: [['published_at', 'DESC'], ['id', 'DESC']],
      limit: 200,
      attributes: [
        'id', 'slug', 'title', 'summary', 'image_url', 'category',
        'tags', 'author_name', 'author_avatar', 'reading_time',
        'views_count', 'likes_count', 'is_published', 'published_at', 'createdAt', 'updatedAt'
      ]
    });

    return res.json({
      news: rows,
      total: count
    });
  } catch (error) {
    console.error('Error al obtener lista de noticias admin:', error);
    return res.status(500).json({ error: 'Error al consultar noticias' });
  }
};

/**
 * Endpoints para Automatización de Noticias con Gemini
 */
export const getAutomationStatus = async (req, res) => {
  try {
    const { newsAutomationService } = await import('../services/newsAutomationService.js');
    await newsAutomationService.ensureHydrated();
    return res.json(newsAutomationService.getStatus());
  } catch (error) {
    console.error('Error al obtener estado de automatización:', error);
    return res.status(500).json({ error: 'Error al consultar la automatización.' });
  }
};

export const triggerAutomationNow = async (req, res) => {
  try {
    const { newsAutomationService } = await import('../services/newsAutomationService.js');
    const { topic } = req.body || {};

    // Iniciar en segundo plano para devolver respuesta instantánea y emitir progreso vía WebSockets
    newsAutomationService.executeDailyNewsGeneration({ isManual: true, forcedTopic: topic }).catch((err) => {
      console.error('[NewsAutomation] Error en disparo manual:', err);
    });

    return res.json({
      message: 'Generación con Gemini iniciada con éxito.',
      status: 'generating'
    });
  } catch (error) {
    console.error('Error al disparar automatización:', error);
    return res.status(500).json({ error: 'Error al iniciar la generación.' });
  }
};

export const updateAutomationConfig = async (req, res) => {
  try {
    const { newsAutomationService } = await import('../services/newsAutomationService.js');
    const { hour, minute } = req.body;
    if (hour === undefined) {
      return res.status(400).json({ error: 'Debes proporcionar la hora (0-23).' });
    }
    const updated = newsAutomationService.updateSchedule(hour, minute || 0);
    return res.json({
      message: 'Horario de automatización actualizado.',
      data: updated
    });
  } catch (error) {
    console.error('Error al actualizar horario de automatización:', error);
    return res.status(500).json({ error: 'Error al configurar el horario.' });
  }
};


export const optimizeExistingArticles = async (req, res) => {
  try {
    const { newsAutomationService } = await import('../services/newsAutomationService.js');
    const { articleId = null, forceAll = false } = req.body || {};

    newsAutomationService.optimizeExistingArticlesWithAI({ articleId, forceAll }).catch((err) => {
      console.error('[NewsAutomation] Error en optimizeExistingArticlesWithAI:', err);
    });

    return res.json({
      message: 'Adaptación de noticias existentes iniciada con éxito en segundo plano.',
      status: 'generating'
    });
  } catch (error) {
    console.error('Error al iniciar adaptación de noticias existentes:', error);
    return res.status(500).json({ error: 'Error al iniciar la adaptación de noticias.' });
  }
};

export const fixDuplicateCovers = async (req, res) => {
  try {
    const { newsAutomationService } = await import('../services/newsAutomationService.js');
    const result = await newsAutomationService.ensureUniqueCovers();
    return res.json(result);
  } catch (error) {
    console.error('Error al desduplicar portadas:', error);
    return res.status(500).json({ error: 'Error al corregir portadas duplicadas.' });
  }
};

/**
 * Analítica & Sniffing del Panel Administrador de Noticias
 */
export const getNewsAnalytics = async (req, res) => {
  try {
    const { period = 'all', mode = 'all' } = req.query;

    let timeWhere = {};
    const now = new Date();
    if (period === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      timeWhere.created_at = { [Op.gte]: startOfDay };
    } else if (period === '7d') {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      timeWhere.created_at = { [Op.gte]: past7 };
    } else if (period === '30d') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      timeWhere.created_at = { [Op.gte]: past30 };
    }

    let modeWhere = {};
    if (mode === 'real') {
      modeWhere.is_test = false;
    } else if (mode === 'test') {
      modeWhere.is_test = true;
    } else if (mode === 'articles') {
      modeWhere.article_slug = { [Op.ne]: null };
    } else if (mode === 'catalog') {
      modeWhere.article_slug = null;
    }

    const where = { ...timeWhere, ...modeWhere };
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalVisits,
      uniqueVisitorsResult,
      todayVisits,
      realVisits,
      testVisits,
      recentLogs,
      deviceCounts,
      referrerCounts,
      articleCounts
    ] = await Promise.all([
      NewsVisitLog.count({ where }),
      NewsVisitLog.count({
        where,
        distinct: true,
        col: 'visitor_id'
      }),
      NewsVisitLog.count({
        where: {
          created_at: { [Op.gte]: startOfToday },
          ...modeWhere
        }
      }),
      NewsVisitLog.count({ where: { is_test: false, ...timeWhere } }),
      NewsVisitLog.count({ where: { is_test: true, ...timeWhere } }),
      NewsVisitLog.findAll({
        where,
        order: [['created_at', 'DESC']],
        limit: 150,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'username', 'email', 'profile_image']
          }
        ]
      }),
      NewsVisitLog.findAll({
        where,
        attributes: [
          'device_type',
          [models.sequelize.fn('COUNT', models.sequelize.col('id')), 'count']
        ],
        group: ['device_type']
      }),
      NewsVisitLog.findAll({
        where,
        attributes: [
          'referrer_host',
          'referrer_type',
          [models.sequelize.fn('COUNT', models.sequelize.col('id')), 'count']
        ],
        group: ['referrer_host', 'referrer_type'],
        order: [[models.sequelize.literal('count'), 'DESC']],
        limit: 10
      }),
      NewsVisitLog.findAll({
        where: {
          ...where,
          article_slug: { [Op.ne]: null }
        },
        attributes: [
          'article_slug',
          'article_title',
          [models.sequelize.fn('COUNT', models.sequelize.col('id')), 'count']
        ],
        group: ['article_slug', 'article_title'],
        order: [[models.sequelize.literal('count'), 'DESC']],
        limit: 8
      })
    ]);

    const devices = { mobile: 0, desktop: 0, tablet: 0 };
    deviceCounts.forEach(d => {
      const type = d.getDataValue('device_type') || 'desktop';
      const c = parseInt(d.getDataValue('count'), 10) || 0;
      if (devices[type] !== undefined) {
        devices[type] = c;
      } else {
        devices.desktop += c;
      }
    });

    return res.json({
      success: true,
      stats: {
        totalVisits,
        uniqueVisitors: uniqueVisitorsResult,
        todayVisits,
        realVisits,
        testVisits,
        devices,
        topReferrers: referrerCounts.map(r => ({
          host: r.getDataValue('referrer_host'),
          type: r.getDataValue('referrer_type'),
          count: parseInt(r.getDataValue('count'), 10) || 0
        })),
        topArticles: articleCounts.map(a => ({
          slug: a.getDataValue('article_slug'),
          title: a.getDataValue('article_title') || a.getDataValue('article_slug'),
          count: parseInt(a.getDataValue('count'), 10) || 0
        }))
      },
      visits: recentLogs
    });
  } catch (err) {
    console.error('Error al obtener analítica de noticias:', err);
    return res.status(500).json({ error: 'Error al consultar métricas del tracker.' });
  }
};

/**
 * Generar ping de diagnóstico en vivo para probar el tracker
 */
export const sendTestVisitPing = async (req, res) => {
  try {
    const { slug } = req.body || {};
    let articleSlug = slug;
    let articleTitle = 'Prueba de Diagnóstico Tracker';

    if (!articleSlug) {
      const anyArticle = await News.findOne({
        where: { is_published: true },
        order: [['published_at', 'DESC']]
      });
      if (anyArticle) {
        articleSlug = anyArticle.slug;
        articleTitle = anyArticle.title;
      }
    }

    const result = await recordNewsTelemetry(req, {
      slug: articleSlug,
      article_title: articleTitle,
      page_path: articleSlug ? `/noticias/${articleSlug}` : '/noticias',
      referrer: req.headers['referer'] || 'https://www.google.com/search?q=pro+fitness+glass+noticias',
      is_test: true,
      visitor_id: `test_vis_${Math.random().toString(36).substring(2, 9)}`,
      screen_resolution: '1920x1080',
      device_type: 'desktop'
    });

    return res.json({
      success: true,
      message: 'Ping de prueba registrado correctamente.',
      log: result.log
    });
  } catch (err) {
    console.error('Error en sendTestVisitPing:', err);
    return res.status(500).json({ error: 'Error al generar ping de prueba.' });
  }
};

/**
 * Limpiar todas las visitas de prueba de diagnóstico
 */
export const clearTestVisits = async (req, res) => {
  try {
    const deleted = await NewsVisitLog.destroy({
      where: { is_test: true }
    });
    return res.json({
      success: true,
      deletedCount: deleted,
      message: `Se han eliminado ${deleted} visitas de prueba.`
    });
  } catch (err) {
    console.error('Error en clearTestVisits:', err);
    return res.status(500).json({ error: 'Error al limpiar visitas de prueba.' });
  }
};
