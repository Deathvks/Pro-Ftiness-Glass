/* frontend/scripts/prerenderNews.js */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getNewsCoverUrls } from '../src/utils/newsCover.js';
import { PUBLIC_EXERCISES, PUBLIC_ROUTINES, findExerciseBySlug } from '../src/data/fitnessCatalog.js';
import {
  buildNewsArticleSchema,
  buildNewsBreadcrumbSchema,
  buildNewsCollectionSchema,
} from '../src/utils/newsSchema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const publicDir = path.resolve(__dirname, '../public');
const indexPath = path.join(distDir, 'index.html');
const BASE_URL = 'https://profitnessglass.es';
const API_URL = process.env.VITE_API_BASE_URL || 'https://api.profitnessglass.es/api';

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeUrlAttr(str = '') {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function escapeXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatInlineMarkdown(str = '') {
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
}

function markdownToSemanticHtml(md = '') {
  if (!md) return '';
  if (md.includes('\\n') || md.includes('\\r')) {
    md = md.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\\r/g, '\n');
  }
  md = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = md.split('\n');
  const htmlParts = [];
  let inList = false;

  for (let rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }
      continue;
    }

    // Encabezados (downgrade de # a <h2> para preservar un único <h1> por página)
    if (line.startsWith('#### ')) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push(`<h4 style="font-size: 1.15rem; font-weight: 700; margin: 1.25rem 0 0.5rem; color: #cbd5e1;">${formatInlineMarkdown(line.slice(5))}</h4>`);
      continue;
    }
    if (line.startsWith('### ')) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push(`<h3 style="font-size: 1.35rem; font-weight: 800; margin: 1.5rem 0 0.5rem; color: #f8fafc;">${formatInlineMarkdown(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push(`<h2 style="font-size: 1.75rem; font-weight: 900; margin: 2rem 0 0.75rem; color: #f8fafc;">${formatInlineMarkdown(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith('# ')) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push(`<h2 style="font-size: 1.75rem; font-weight: 900; margin: 2rem 0 0.75rem; color: #f8fafc;">${formatInlineMarkdown(line.slice(2))}</h2>`);
      continue;
    }

    // Cita / Blockquote
    if (line.startsWith('> ')) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push(`<blockquote style="border-left: 4px solid #38bdf8; padding-left: 1rem; margin: 1.5rem 0; color: #cbd5e1; font-style: italic;"><p>${formatInlineMarkdown(line.slice(2))}</p></blockquote>`);
      continue;
    }

    // Listas con viñetas
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        htmlParts.push('<ul style="padding-left: 1.5rem; margin: 1rem 0; list-style-type: disc;">');
        inList = true;
      }
      htmlParts.push(`<li style="margin-bottom: 0.5rem; color: #e2e8f0;">${formatInlineMarkdown(line.slice(2))}</li>`);
      continue;
    }

    // Listas numeradas
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push(`<p style="margin: 0.75rem 0; color: #e2e8f0;"><strong style="color: #38bdf8;">${numMatch[1]}.</strong> ${formatInlineMarkdown(numMatch[2])}</p>`);
      continue;
    }

    if (inList) {
      htmlParts.push('</ul>');
      inList = false;
    }

    // Párrafo estándar
    htmlParts.push(`<p style="margin: 1.1rem 0; line-height: 1.8; color: #e2e8f0;">${formatInlineMarkdown(line)}</p>`);
  }

  if (inList) {
    htmlParts.push('</ul>');
  }

  return htmlParts.join('\n');
}

const isDistOnly = () =>
  process.argv.includes('--dist-only') || process.env.PRERENDER_DIST_ONLY === '1';

async function fetchArticles() {
  let apiArticles = [];
  try {
    let page = 1;
    let totalPages = 1;
    while (page <= totalPages && page <= 20) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${API_URL}/news?page=${page}&limit=30`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeout);
      if (!res.ok) break;
      const data = await res.json();
      if (Array.isArray(data.news) && data.news.length > 0) {
        apiArticles.push(...data.news);
      }
      totalPages = Math.max(1, Number(data.totalPages || 1));
      if (!Array.isArray(data.news) || data.news.length === 0) break;
      page++;
    }
    if (apiArticles.length > 0) {
      console.log(`[Prerender] Obtenidos ${apiArticles.length} artículos desde la API.`);
    }
  } catch (err) {
    console.warn('[Prerender] No se pudo consultar la API remota:', err.message);
  }

  // Cargar artículos desde cachedNews.json para combinar si la API no devolvió todos
  const cachePath = path.resolve(__dirname, '../src/data/cachedNews.json');
  let cachedArticles = [];
  if (fs.existsSync(cachePath)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      if (Array.isArray(cached) && cached.length > 0) {
        cachedArticles = cached;
      }
    } catch (e) {
      console.warn('[Prerender] Error leyendo caché local:', e.message);
    }
  }

  // Si la API respondió con el listado completo, confiar en sus slugs publicados para poder podar borrados;
  // en caso contrario (ej. build offline), usar fusión con caché local.
  const mergedMap = new Map();
  if (apiArticles.length > 0) {
    const cachedBySlug = new Map(cachedArticles.filter(a => a.slug).map(a => [a.slug, a]));
    apiArticles.forEach(a => {
      if (a.slug) {
        mergedMap.set(a.slug, { ...(cachedBySlug.get(a.slug) || {}), ...a });
      }
    });
  } else {
    cachedArticles.forEach(a => {
      if (a.slug) mergedMap.set(a.slug, a);
    });
  }

  const merged = Array.from(mergedMap.values());
  console.log(`[Prerender] Total de artículos únicos a prerenderizar: ${merged.length}`);
  if (!isDistOnly() && apiArticles.length > 0) {
    try {
      fs.writeFileSync(cachePath, JSON.stringify(merged, null, 2), 'utf8');
      console.log(`[Prerender] Actualizado cachedNews.json con ${merged.length} noticias.`);
    } catch (e) {
      console.warn('[Prerender] Error escribiendo cachedNews.json:', e.message);
    }
  }
  return merged;
}

function injectMeta(html, {
  title,
  description,
  image,
  url,
  type = 'article',
  category = 'Fitness',
  datePublished,
  dateModified,
  robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  jsonLdScripts = []
}) {
  const safeTitle = escapeHtml(title);
  const fullTitle = /pro fitness glass/i.test(safeTitle) ? safeTitle : `${safeTitle} | Pro Fitness Glass`;
  const safeDesc = escapeHtml(description);
  const safeImg = escapeUrlAttr(image);
  const safeUrl = escapeUrlAttr(url);
  const isNoIndex = String(robots).toLowerCase().includes('noindex');

  let output = html;

  // Title (evitar duplicar "| Pro Fitness Glass" si el título ya incluye la marca)
  output = output.replace(/<title>[\s\S]*?<\/title>/i, `<title>${fullTitle}</title>`);

  // En subpáginas prerrenderizadas, sustituir el @graph de portada (FAQPage + SoftwareApplication)
  // por únicamente Organization + WebSite para evitar duplicados o conflictos de Rich Results.
  const baseEntityJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: 'Pro Fitness Glass',
        url: `${BASE_URL}/`,
        logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.webp` },
      },
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        url: `${BASE_URL}/`,
        name: 'Pro Fitness Glass',
        inLanguage: 'es-ES',
      },
    ],
  });
  output = output.replace(
    /<script\s+id=["']pfg-home-jsonld["']\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>/i,
    isNoIndex
      ? ''
      : `<script id="pfg-home-jsonld" type="application/ld+json">${baseEntityJsonLd}</script>`
  );

  // Meta description & robots
  output = output.replace(/<meta\s+name=["']description["'][\s\S]*?>/i, `<meta name="description" content="${safeDesc}" />`);
  output = output.replace(/<meta\s+name=["']robots["'][\s\S]*?>/i, `<meta name="robots" content="${escapeHtml(robots)}" />`);

  // Permitir caché público revalidable en páginas SEO indexables (evitar no-store de index.html)
  if (!isNoIndex) {
    output = output.replace(
      /<meta\s+http-equiv=["']Cache-Control["'][\s\S]*?>/i,
      `<meta http-equiv="Cache-Control" content="public, max-age=300, must-revalidate" />`
    );
    output = output.replace(/<meta\s+http-equiv=["']Pragma["'][\s\S]*?>\s*/gi, '');
    output = output.replace(/<meta\s+http-equiv=["']Expires["'][\s\S]*?>\s*/gi, '');
  }

  // Canonical y hreflang propios (si es noindex/404, retirarlos para no apuntar a "/")
  if (isNoIndex || !url) {
    output = output.replace(/<link\s+rel=["']canonical["'][\s\S]*?>\s*/gi, '');
    output = output.replace(/<meta\s+property=["']og:url["'][\s\S]*?>\s*/gi, '');
    for (const lang of ['es', 'x-default']) {
      const hreflangPattern = `<link\\s+(?=[^>]*\\brel=["']alternate["'])(?=[^>]*\\bhreflang=["']${lang}["'])[^>]*>\\s*`;
      output = output.replace(new RegExp(hreflangPattern, 'gi'), '');
    }
  } else {
    output = output.replace(
      /<link\s+rel=["']canonical["'][\s\S]*?>/i,
      `<link rel="canonical" href="${safeUrl}" data-rh="true" />`
    );
    for (const lang of ['es', 'x-default']) {
      const hreflangPattern = `<link\\s+(?=[^>]*\\brel=["']alternate["'])(?=[^>]*\\bhreflang=["']${lang}["'])[^>]*>`;
      const replacement = `<link rel="alternate" hreflang="${lang}" href="${safeUrl}" data-rh="true" />`;
      output = new RegExp(hreflangPattern, 'i').test(output)
        ? output.replace(new RegExp(hreflangPattern, 'gi'), replacement)
        : output.replace(/<\/head>/i, `  ${replacement}\n</head>`);
    }
  }

  // Open Graph (eliminamos duplicados/valores por defecto de index.html antes de inyectar los del artículo)
  output = output.replace(/<meta\s+property=["']og:type["'][\s\S]*?>/i, `<meta property="og:type" content="${type}" />`);
  output = output.replace(/<meta\s+property=["']og:url["'][\s\S]*?>/i, `<meta property="og:url" content="${safeUrl}" />`);
  output = output.replace(/<meta\s+property=["']og:title["'][\s\S]*?>/i, `<meta property="og:title" content="${fullTitle}" />`);
  output = output.replace(/<meta\s+property=["']og:description["'][\s\S]*?>/i, `<meta property="og:description" content="${safeDesc}" />`);
  output = output.replace(/<meta\s+property=["']og:image:(?:secure_url|type|width|height|alt)["'][\s\S]*?>\s*/gi, '');
  output = output.replace(
    /<meta\s+property=["']og:image["'][\s\S]*?>/i,
    `<meta property="og:image" content="${safeImg}" />\n  <meta property="og:image:secure_url" content="${safeImg}" />\n  <meta property="og:image:width" content="1200" />\n  <meta property="og:image:height" content="630" />\n  <meta property="og:image:alt" content="${safeTitle}" />`
  );

  // Twitter
  output = output.replace(/<meta\s+name=["']twitter:title["'][\s\S]*?>/i, `<meta name="twitter:title" content="${fullTitle}" />`);
  output = output.replace(/<meta\s+name=["']twitter:description["'][\s\S]*?>/i, `<meta name="twitter:description" content="${safeDesc}" />`);
  output = output.replace(/<meta\s+name=["']twitter:image:alt["'][\s\S]*?>\s*/gi, '');
  output = output.replace(
    /<meta\s+name=["']twitter:image["'][\s\S]*?>/i,
    `<meta name="twitter:image" content="${safeImg}" />\n  <meta name="twitter:image:alt" content="${safeTitle}" />`
  );

  // Inyectar Schema.org unificado (Article + BreadcrumbList o CollectionPage) con data-rh="true" para sincronizar con Helmet
  const resolvedSchemas = Array.isArray(jsonLdScripts) && jsonLdScripts.length > 0
    ? jsonLdScripts
    : type === 'article'
      ? [
          buildNewsArticleSchema({
            article: { title, category },
            canonicalUrl: url,
            description,
            image,
            publishedDate: datePublished,
            modifiedDate: dateModified,
          }),
        ]
      : [];

  if (resolvedSchemas.length > 0) {
    const ldMarkup = resolvedSchemas
      .map((schema) => `\n  <script type="application/ld+json" data-rh="true">${JSON.stringify(schema)}</script>`)
      .join('');
    output = output.replace('</head>', `${ldMarkup}\n</head>`);
  }

  return output;
}

function findChunkHref(prefix) {
  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) return null;
  const match = fs.readdirSync(assetsDir).find(
    (f) => f.startsWith(`${prefix}-`) && f.endsWith('.js')
  );
  return match ? `/assets/${match}` : null;
}

function injectPrerenderBody(html, seoBodyHtml, chunkPrefix = null) {
  // Sustituimos el splash de #root por el HTML semántico visible y desplazable (sin opacity: 0 ni aria-hidden)
  // y eliminamos la copia duplicada de <noscript> para mantener un único <h1> real en la página.
  const visibleSeoBlock = `<div data-seo-prerender="true" style="position:fixed;inset:0;overflow-y:auto;overflow-x:hidden;background-color:#0f172a;color:#f8fafc;">${seoBodyHtml}</div>`;
  let output = html.replace(
    /<div id="root">[\s\S]*<\/div>\s*<noscript>[\s\S]*?<\/noscript>/i,
    `<div id="root">\n    ${visibleSeoBlock}\n  </div>`
  );
  if (output === html) {
    output = html.replace(
      /(<div id="root">)[\s\S]*?(<\/div>\s*<script)/i,
      `$1\n    ${visibleSeoBlock}\n  $2`
    );
    output = output.replace(/<noscript>[\s\S]*?<\/noscript>/i, '');
  }
  if (chunkPrefix) {
    const chunkHref = findChunkHref(chunkPrefix);
    if (chunkHref && !output.includes(chunkHref)) {
      output = output.replace(
        '</head>',
        `  <link rel="modulepreload" crossorigin href="${chunkHref}">\n</head>`
      );
    }
  }
  return output;
}

function generateRssFeed(articles) {
  const items = articles.map(a => {
    const pubDate = a.published_at || a.createdAt || new Date().toISOString();
    const pubRfc822 = new Date(pubDate).toUTCString();
    const url = `${BASE_URL}/noticias/${a.slug}`;
    return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubRfc822}</pubDate>
      <description>${escapeXml(a.summary || a.seo_description || '')}</description>
      <category>${escapeXml(a.category || 'Fitness')}</category>
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Noticias y Guías de Élite de Fitness y Nutrición | Pro Fitness Glass</title>
    <link>${BASE_URL}/noticias</link>
    <description>Artículos científicos, nutrición deportiva, sobrecarga progresiva y guías de entrenamiento en Pro Fitness Glass.</description>
    <language>es-ES</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <atom:link href="https://pubsubhubbub.appspot.com/" rel="hub" />
${items}
  </channel>
</rss>`;
}

export function buildNewsIndexHtml(baseHtml, articles) {
  const articleCardsHtml = articles.map(a => `
      <article style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.25rem; padding: 1.5rem; transition: transform 0.2s;">
        <span style="display: inline-block; font-size: 0.75rem; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">${escapeHtml(a.category || 'Fitness')}</span>
        <h2 style="font-size: 1.35rem; font-weight: 800; line-height: 1.3; margin-bottom: 0.75rem;">
          <a href="/noticias/${a.slug}" style="color: #f8fafc; text-decoration: none;">${escapeHtml(a.title)}</a>
        </h2>
        <p style="font-size: 0.95rem; color: #94a3b8; line-height: 1.6; margin-bottom: 1rem;">${escapeHtml(a.summary || '')}</p>
        <a href="/noticias/${a.slug}" style="font-size: 0.875rem; font-weight: 700; color: #38bdf8; text-decoration: none;">Leer artículo completo →</a>
      </article>`).join('\n');

  const newsBodyHtml = `
  <main style="padding: 3rem 1.5rem; max-width: 1200px; margin: 0 auto; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <header style="margin-bottom: 2.5rem; text-align: center;">
      <div style="display: inline-flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
        <img src="/icons/icon-96.png" alt="Pro Fitness Glass" style="width: 44px; height: 44px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" />
        <div style="text-align: left;">
          <div style="font-size: 1.25rem; font-weight: 900; line-height: 1; color: #f8fafc;">Pro Fitness Glass</div>
          <span style="display: inline-block; font-size: 0.7rem; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.25rem;">App de Gimnasio 100% Gratis</span>
        </div>
      </div>
      <h1 style="font-size: 2.5rem; font-weight: 900; margin-bottom: 0.75rem; letter-spacing: -0.02em;">Noticias y Guías de Élite de Fitness y Nutrición</h1>
      <p style="font-size: 1.05rem; color: #94a3b8; max-width: 750px; margin: 0 auto; line-height: 1.6;">Aprende con artículos basados en evidencia científica, optimiza tus comidas y domina tu rendimiento en el gimnasio con Pro Fitness Glass.</p>
    </header>
    <section style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.75rem;">
      ${articleCardsHtml}
    </section>
  </main>`;

  const newsIndexHtml = injectMeta(baseHtml, {
    title: 'Noticias y Guías de Élite de Fitness y Nutrición',
    description: 'Aprende con artículos basados en evidencia científica, optimiza tus comidas y domina tu rendimiento en el gimnasio con Pro Fitness Glass.',
    image: `${BASE_URL}/og-preview.jpg`,
    url: `${BASE_URL}/noticias`,
    type: 'website',
    jsonLdScripts: [buildNewsCollectionSchema()],
  });
  return injectPrerenderBody(newsIndexHtml, newsBodyHtml, 'NewsListPage');
}

export function buildArticleHtml(baseHtml, article, contentOverride = '') {
  const slug = String(article.slug || '').trim();
  let articleImage = getNewsCoverUrls(article, BASE_URL + '/api').src;
  if (articleImage && !articleImage.startsWith('http')) {
    articleImage = `${BASE_URL}${articleImage.startsWith('/') ? '' : '/'}${articleImage}`;
  }

  const pubDate = article.published_at || article.createdAt || new Date().toISOString();
  const pubIso = new Date(pubDate).toISOString();
  const pubFormatted = new Date(pubDate).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const semanticArticleHtml = markdownToSemanticHtml(contentOverride || article.content || '');
  const articleBodyHtml = `
  <article style="padding: 2.5rem 1.5rem; max-width: 860px; margin: 0 auto; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8;">
    <nav style="margin-bottom: 2rem;">
      <a href="/noticias" style="color: #38bdf8; text-decoration: none; font-weight: 700; font-size: 0.95rem;">← Volver a Noticias y Artículos</a>
    </nav>
    <header style="margin-bottom: 2.5rem;">
      <span style="display: inline-block; padding: 0.35rem 0.85rem; border-radius: 9999px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-weight: 800; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem;">${escapeHtml(article.category || 'Fitness')}</span>
      <h1 style="font-size: 2.5rem; font-weight: 900; line-height: 1.25; margin-bottom: 1.25rem; letter-spacing: -0.02em;">${escapeHtml(article.title)}</h1>
      <p style="font-size: 1.2rem; color: #94a3b8; margin-bottom: 1.5rem; line-height: 1.6;">${escapeHtml(article.summary || '')}</p>
      <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; color: #64748b; font-size: 0.9rem; border-top: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1); padding: 1rem 0;">
        <span>Por <strong style="color: #e2e8f0;">${escapeHtml(article.author_name || 'Equipo Editorial Pro Fitness Glass')}</strong></span>
        <span>•</span>
        <time datetime="${pubIso}">${pubFormatted}</time>
        <span>•</span>
        <span>${article.reading_time || 5} min de lectura</span>
      </div>
    </header>
    ${articleImage ? `<div style="margin: 2rem 0; border-radius: 1.5rem; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);"><img src="${escapeUrlAttr(articleImage)}" alt="${escapeHtml(article.title)}" style="width: 100%; height: auto; display: block; object-fit: cover; max-height: 480px;" /></div>` : ''}
    <div style="font-size: 1.125rem; color: #e2e8f0;">
      ${semanticArticleHtml}
    </div>
    <footer style="margin-top: 3.5rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
      <a href="/noticias" style="display: inline-block; padding: 0.75rem 1.75rem; border-radius: 9999px; background: #38bdf8; color: #0f172a; font-weight: 800; text-decoration: none; font-size: 0.95rem;">Explorar más artículos en Pro Fitness Glass</a>
    </footer>
  </article>`;

  const canonicalUrl = `${BASE_URL}/noticias/${slug}`;
  const metaDescription = article.seo_description || article.summary || 'Guía científica de entrenamiento y nutrición deportiva en Pro Fitness Glass.';
  const articleHtml = injectMeta(baseHtml, {
    title: article.seo_title || article.title,
    description: metaDescription,
    image: articleImage,
    url: canonicalUrl,
    type: 'article',
    category: article.category,
    datePublished: article.published_at || article.createdAt,
    dateModified: article.updatedAt || article.published_at || article.createdAt,
    jsonLdScripts: [
      buildNewsArticleSchema({
        article,
        canonicalUrl,
        description: metaDescription,
        image: articleImage,
        publishedDate: article.published_at || article.createdAt,
        modifiedDate: article.updatedAt || article.published_at || article.createdAt,
      }),
      buildNewsBreadcrumbSchema({
        article,
        canonicalUrl,
      }),
    ],
  });
  return injectPrerenderBody(articleHtml, articleBodyHtml, 'NewsDetailPage');
}

export function buildNotFoundNewsHtml(baseHtml) {
  const notFoundBody = `
  <main style="padding: 4rem 1.5rem; max-width: 720px; margin: 0 auto; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center;">
    <p style="font-size: 0.85rem; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.75rem;">Error 404</p>
    <h1 style="font-size: 2.25rem; font-weight: 900; margin: 0 0 1rem; letter-spacing: -0.02em;">Artículo no encontrado</h1>
    <p style="font-size: 1.05rem; color: #94a3b8; line-height: 1.6; margin-bottom: 2rem;">El artículo que buscas no existe, ha sido trasladado o ya no está disponible.</p>
    <a href="/noticias" style="display: inline-block; padding: 0.85rem 1.75rem; border-radius: 9999px; background: #38bdf8; color: #0f172a; font-weight: 800; text-decoration: none; font-size: 0.95rem;">Volver a Noticias y Guías</a>
  </main>`;

  const notFoundHtml = injectMeta(baseHtml, {
    title: 'Artículo no encontrado',
    description: 'El artículo solicitado no está disponible en Pro Fitness Glass.',
    image: `${BASE_URL}/og-preview.jpg`,
    url: '',
    type: 'website',
    robots: 'noindex, nofollow'
  });
  return injectPrerenderBody(notFoundHtml, notFoundBody, 'NewsDetailPage');
}

export function pruneStaleNewsDirs(validSlugs) {
  const newsIndexDir = path.join(distDir, 'noticias');
  if (!fs.existsSync(newsIndexDir)) return 0;
  let removed = 0;
  for (const entry of fs.readdirSync(newsIndexDir)) {
    if (!/^[a-zA-Z0-9_-]+$/.test(entry)) continue;
    const fullPath = path.join(newsIndexDir, entry);
    if (fs.statSync(fullPath).isDirectory() && !validSlugs.has(entry)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      removed++;
    }
  }
  return removed;
}

export async function prerenderNewsArtifacts({ articles, distOnly = isDistOnly() } = {}) {
  if (!fs.existsSync(indexPath)) {
    return { skipped: true, reason: 'missing_dist_index' };
  }
  const baseHtml = fs.readFileSync(indexPath, 'utf8');
  const resolvedArticles = Array.isArray(articles) ? articles : await fetchArticles();

  try {
    const rssXml = generateRssFeed(resolvedArticles);
    fs.writeFileSync(path.join(distDir, 'rss.xml'), rssXml, 'utf8');
    if (!distOnly && fs.existsSync(publicDir)) {
      fs.writeFileSync(path.join(publicDir, 'rss.xml'), rssXml, 'utf8');
    }
  } catch (err) {
    console.warn('[Prerender] Error generando feed RSS:', err.message);
  }

  const newsIndexDir = path.join(distDir, 'noticias');
  if (!fs.existsSync(newsIndexDir)) fs.mkdirSync(newsIndexDir, { recursive: true });
  fs.writeFileSync(path.join(newsIndexDir, 'index.html'), buildNewsIndexHtml(baseHtml, resolvedArticles), 'utf8');

  const cachePath = path.resolve(__dirname, '../src/data/cachedNews.json');
  const cachedMap = new Map();
  if (!resolvedArticles.every(a => a.content) && fs.existsSync(cachePath)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      if (Array.isArray(cached)) cached.forEach(a => { if (a.slug) cachedMap.set(a.slug, a); });
    } catch {}
  }

  const validSlugs = new Set();
  let count = 0;
  for (const article of resolvedArticles) {
    const slug = (article.slug || '').trim();
    if (!slug || !/^[a-zA-Z0-9_-]+$/.test(slug)) continue;
    validSlugs.add(slug);

    const articleDir = path.join(distDir, 'noticias', slug);
    if (!fs.existsSync(articleDir)) fs.mkdirSync(articleDir, { recursive: true });

    let content = article.content || cachedMap.get(slug)?.content || '';
    if (!content) {
      try {
        const artRes = await fetch(`${API_URL}/news/article/${slug}`);
        if (artRes.ok) {
          const artData = await artRes.json();
          content = artData.article?.content || artData.news?.content || artData.content || '';
        }
      } catch (e) {
        console.warn(`[Prerender] No se pudo obtener contenido remoto para ${slug}:`, e.message);
      }
    }

    fs.writeFileSync(path.join(articleDir, 'index.html'), buildArticleHtml(baseHtml, article, content), 'utf8');
    count++;
  }

  const removed = validSlugs.size > 0 ? pruneStaleNewsDirs(validSlugs) : 0;
  return { skipped: false, count, removed, baseHtml, articles: resolvedArticles };
}

async function main() {
  const result = await prerenderNewsArtifacts();
  if (result.skipped) {
    console.error('[Prerender] Error: dist/index.html no existe. Ejecuta primero vite build.');
    return;
  }
  const { baseHtml, count, removed, articles: allArticles } = result;
  console.log(`[Prerender] ¡Listo! ${count} artículos prerenderizados en dist/noticias/:slug/index.html${removed ? ` (${removed} obsoletos eliminados)` : ''}.`);

  // 4. Prerender de las Calculadoras Públicas de Gimnasio (/calculadora-1rm y /calculadora-calorias-macros)
  const calc1rmDir = path.join(distDir, 'calculadora-1rm');
  if (!fs.existsSync(calc1rmDir)) fs.mkdirSync(calc1rmDir, { recursive: true });

  const calc1rmBody = `
  <main style="padding: 3rem 1.5rem; max-width: 960px; margin: 0 auto; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.75;">
    <nav style="margin-bottom: 1.5rem;">
      <a href="/" style="color: #38bdf8; text-decoration: none; font-weight: 700;">← Volver a Pro Fitness Glass</a> |
      <a href="/calculadora-calorias-macros" style="color: #34d399; text-decoration: none; font-weight: 700;">Calculadora de Calorías y Macros</a> |
      <a href="/noticias" style="color: #a855f7; text-decoration: none; font-weight: 700;">Guías de Gimnasio</a>
    </nav>
    <header style="margin-bottom: 2.5rem; text-align: center;">
      <div style="display: inline-flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
        <img src="/icons/icon-96.png" alt="Pro Fitness Glass" style="width: 44px; height: 44px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" />
        <div style="text-align: left;">
          <div style="font-size: 1.25rem; font-weight: 900; line-height: 1; color: #f8fafc;">Pro Fitness Glass</div>
          <span style="display: inline-block; font-size: 0.7rem; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.25rem;">App de Gimnasio 100% Gratis</span>
        </div>
      </div>
      <br />
      <span style="display: inline-block; font-size: 0.75rem; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.08em;">Herramienta Gratuita de Gimnasio y Fuerza</span>
      <h1 style="font-size: 2.5rem; font-weight: 900; margin: 0.5rem 0 1rem; letter-spacing: -0.02em;">Calculadora de 1RM (Repetición Máxima) y Tabla de Porcentajes para Gimnasio</h1>
      <p style="font-size: 1.15rem; color: #94a3b8;">Calcula tu fuerza máxima estimada en Press de Banca, Sentadilla Libre, Peso Muerto, Press Militar o Dominadas Lastradas mediante las fórmulas científicas de Epley, Brzycki y Lander.</p>
    </header>
    <section style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; padding: 2rem; margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem;">Tabla de Porcentajes de 1RM para Hipertrofia y Fuerza</h2>
      <ul style="padding-left: 1.5rem; color: #e2e8f0;">
        <li><strong>100% del 1RM (1 repetición):</strong> Fuerza máxima y récord personal (PR).</li>
        <li><strong>90% - 95% del 1RM (2 a 4 repeticiones):</strong> Fuerza neural y powerlifting.</li>
        <li><strong>80% - 85% del 1RM (5 a 8 repeticiones):</strong> Zona óptima de hipertrofia miofibrilar y tensión mecánica.</li>
        <li><strong>70% - 75% del 1RM (8 a 12 repeticiones):</strong> Hipertrofia muscular, volumen de trabajo y bombeo.</li>
        <li><strong>60% - 65% del 1RM (13 a 18 repeticiones):</strong> Resistencia muscular y técnica de aproximación.</li>
      </ul>
    </section>
    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 0.75rem;">¿Cómo calcular el 1RM con las fórmulas de Epley y Brzycki?</h2>
      <p style="color: #cbd5e1;">La fórmula de <strong>Epley</strong> estima tu 1RM multiplicando el peso levantado por <code>(1 + repeticiones / 30)</code>, mientras que la ecuación de <strong>Brzycki</strong> utiliza <code>Peso × (36 / (37 - repeticiones))</code>. Para obtener la máxima precisión en el gimnasio, utiliza una serie llevada cerca del fallo muscular entre 3 y 10 repeticiones.</p>
    </section>
    <section style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; padding: 2rem; margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem;">Preguntas Frecuentes sobre el 1RM</h2>
      <h3 style="font-size: 1.15rem; font-weight: 800; color: #38bdf8; margin: 1rem 0 0.25rem;">¿Qué es el 1RM en el gimnasio y para qué sirve?</h3>
      <p style="color: #cbd5e1; margin: 0 0 1rem;">El 1RM (Una Repetición Máxima) es el peso máximo que puedes levantar una sola vez con técnica correcta en un ejercicio como Press de Banca, Sentadilla o Peso Muerto. Sirve para programar tus cargas de hipertrofia (70%-85% del 1RM) y medir tu sobrecarga progresiva.</p>
      <h3 style="font-size: 1.15rem; font-weight: 800; color: #38bdf8; margin: 1rem 0 0.25rem;">¿Con qué porcentaje del 1RM debo entrenar para ganar masa muscular?</h3>
      <p style="color: #cbd5e1; margin: 0;">La zona óptima de hipertrofia miofibrilar se sitúa entre el 70% y el 85% de tu 1RM (series de 6 a 12 repeticiones cercanas al fallo muscular, dejando RIR 1-2).</p>
    </section>
  </main>`;

  const calc1rmJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'Calculadora de 1RM (Repetición Máxima) — Pro Fitness Glass',
        url: `${BASE_URL}/calculadora-1rm`,
        applicationCategory: 'HealthApplication',
        operatingSystem: 'Web, Android, iOS',
        inLanguage: 'es-ES',
        description: 'Calculadora gratuita de 1RM (Repetición Máxima) para Press de Banca, Sentadilla, Peso Muerto y Press Militar con fórmulas Epley, Brzycki y Lander.',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: '¿Qué es el 1RM en el gimnasio y para qué sirve?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'El 1RM (Una Repetición Máxima) es el peso máximo que puedes levantar una sola vez con técnica correcta en un ejercicio como Press de Banca, Sentadilla o Peso Muerto. Sirve para programar tus cargas de hipertrofia (70%-85% del 1RM) y medir tu sobrecarga progresiva.'
            }
          },
          {
            '@type': 'Question',
            name: '¿Cuál es la fórmula más precisa para calcular el 1RM?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Las ecuaciones científicas más validadas son Epley (Peso × (1 + Reps/30)) y Brzycki (Peso × (36 / (37 - Reps))). Pro Fitness Glass combina Epley, Brzycki y Lander para obtener una media precisa.'
            }
          },
          {
            '@type': 'Question',
            name: '¿Con qué porcentaje del 1RM debo entrenar para ganar masa muscular (hipertrofia)?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'La literatura científica sitúa la zona óptima de hipertrofia miofibrilar entre el 70% y el 85% de tu 1RM (series de 6 a 12 repeticiones cercanas al fallo muscular, dejando RIR 1-2).'
            }
          }
        ]
      }
    ]
  };

  let calc1rmHtml = injectMeta(baseHtml, {
    title: 'Calculadora de 1RM (Repetición Máxima) y Porcentajes',
    description: 'Calcula gratis tu 1RM (Repetición Máxima) en Press de Banca, Sentadilla, Peso Muerto y Press Militar con las fórmulas de Epley, Brzycki y Lander.',
    image: `${BASE_URL}/og-preview.jpg`,
    url: `${BASE_URL}/calculadora-1rm`,
    type: 'website',
    jsonLdScripts: [calc1rmJsonLd]
  });
  calc1rmHtml = injectPrerenderBody(calc1rmHtml, calc1rmBody, 'OneRMCalculatorPage');
  fs.writeFileSync(path.join(calc1rmDir, 'index.html'), calc1rmHtml, 'utf8');

  const calcMacrosDir = path.join(distDir, 'calculadora-calorias-macros');
  if (!fs.existsSync(calcMacrosDir)) fs.mkdirSync(calcMacrosDir, { recursive: true });

  const calcMacrosBody = `
  <main style="padding: 3rem 1.5rem; max-width: 960px; margin: 0 auto; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.75;">
    <nav style="margin-bottom: 1.5rem;">
      <a href="/" style="color: #38bdf8; text-decoration: none; font-weight: 700;">← Volver a Pro Fitness Glass</a> |
      <a href="/calculadora-1rm" style="color: #38bdf8; text-decoration: none; font-weight: 700;">Calculadora de 1RM y Fuerza</a> |
      <a href="/noticias" style="color: #a855f7; text-decoration: none; font-weight: 700;">Guías de Nutrición y Gimnasio</a>
    </nav>
    <header style="margin-bottom: 2.5rem; text-align: center;">
      <div style="display: inline-flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
        <img src="/icons/icon-96.png" alt="Pro Fitness Glass" style="width: 44px; height: 44px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" />
        <div style="text-align: left;">
          <div style="font-size: 1.25rem; font-weight: 900; line-height: 1; color: #f8fafc;">Pro Fitness Glass</div>
          <span style="display: inline-block; font-size: 0.7rem; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.25rem;">App de Gimnasio 100% Gratis</span>
        </div>
      </div>
      <br />
      <span style="display: inline-block; font-size: 0.75rem; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: 0.08em;">Herramienta Gratuita de Nutrición Deportiva</span>
      <h1 style="font-size: 2.5rem; font-weight: 900; margin: 0.5rem 0 1rem; letter-spacing: -0.02em;">Calculadora de Calorías, Macros y Déficit Calórico para Gimnasio</h1>
      <p style="font-size: 1.15rem; color: #94a3b8;">Calcula tu Tasa Metabólica Basal (TMB), tu Gasto Energético Diario Total (TDEE) con la fórmula científica de Mifflin-St Jeor y obtén tus gramos exactos de proteínas, carbohidratos, grasas, agua y creatina.</p>
    </header>
    <section style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; padding: 2rem; margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem;">Distribución Científica de Macronutrientes para Hipertrofia y Definición</h2>
      <ul style="padding-left: 1.5rem; color: #e2e8f0;">
        <li><strong>Proteínas (1.8 a 2.2 g/kg):</strong> Esenciales para la síntesis proteica muscular y para proteger tu masa magra en definición.</li>
        <li><strong>Grasas saludables (0.8 a 1.0 g/kg):</strong> Fundamentales para el entorno hormonal, testosterona y absorción de vitaminas.</li>
        <li><strong>Carbohidratos (Energía de entrenamiento):</strong> Recargan el glucógeno muscular para rendir al máximo en tus rutinas de pesas y aplicar sobrecarga progresiva.</li>
        <li><strong>Creatina Monohidrato (0.1 g/kg):</strong> Suplemento con mayor respaldo científico para ganar fuerza explosiva y retención intracelular.</li>
      </ul>
    </section>
    <section style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; padding: 2rem; margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem;">Preguntas Frecuentes sobre Calorías y Macros</h2>
      <h3 style="font-size: 1.15rem; font-weight: 800; color: #34d399; margin: 1rem 0 0.25rem;">¿Cuántos gramos de proteína al día necesito para ganar músculo o definir?</h3>
      <p style="color: #cbd5e1; margin: 0 0 1rem;">La evidencia científica sitúa la ingesta óptima entre 1.8 g y 2.2 g de proteína por kilogramo de peso corporal al día para deportistas de fuerza.</p>
      <h3 style="font-size: 1.15rem; font-weight: 800; color: #34d399; margin: 1rem 0 0.25rem;">¿Qué déficit calórico es mejor para perder grasa sin perder músculo?</h3>
      <p style="color: #cbd5e1; margin: 0;">Un déficit moderado de 350 a 500 kcal por debajo de tu TDEE, combinado con entrenamiento de fuerza y suficiente proteína.</p>
    </section>
  </main>`;

  const calcMacrosJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'Calculadora de Calorías, Macros y Déficit Calórico — Pro Fitness Glass',
        url: `${BASE_URL}/calculadora-calorias-macros`,
        applicationCategory: 'HealthApplication',
        operatingSystem: 'Web, Android, iOS',
        inLanguage: 'es-ES',
        description: 'Calculadora gratuita de calorías diarias (TDEE), metabolismo basal (Mifflin-St Jeor) y macros para definición o volumen.',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: '¿Cuántos gramos de proteína al día necesito para ganar masa muscular o definir?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'La evidencia científica recomienda entre 1.8 g y 2.2 g de proteína por kilogramo de peso corporal al día para personas que entrenan fuerza en el gimnasio.'
            }
          },
          {
            '@type': 'Question',
            name: '¿Qué déficit calórico es mejor para perder grasa sin perder músculo?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Un déficit calórico moderado de entre 350 y 500 kcal por debajo de tu gasto energético diario total (TDEE), combinado con entrenamiento de pesas y alta ingesta proteica.'
            }
          }
        ]
      }
    ]
  };

  let calcMacrosHtml = injectMeta(baseHtml, {
    title: 'Calculadora de Calorías, Macros y Déficit Calórico',
    description: 'Calcula gratis tus calorías diarias (TDEE), TMB (Mifflin-St Jeor) y reparto exacto de proteínas, carbohidratos y grasas para definición o volumen.',
    image: `${BASE_URL}/og-preview.jpg`,
    url: `${BASE_URL}/calculadora-calorias-macros`,
    type: 'website',
    jsonLdScripts: [calcMacrosJsonLd]
  });
  calcMacrosHtml = injectPrerenderBody(calcMacrosHtml, calcMacrosBody, 'MacroCalculatorPage');
  fs.writeFileSync(path.join(calcMacrosDir, 'index.html'), calcMacrosHtml, 'utf8');
  console.log('[Prerender] Generadas calculadoras SEO en dist/calculadora-1rm/index.html y dist/calculadora-calorias-macros/index.html.');

  const ejerciciosDir = path.join(distDir, 'ejercicios');
  if (!fs.existsSync(ejerciciosDir)) fs.mkdirSync(ejerciciosDir, { recursive: true });

  const ejerciciosBody = `
  <main style="padding: 3rem 1.5rem; max-width: 960px; margin: 0 auto; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.75;">
    <nav style="margin-bottom: 1.5rem;">
      <a href="/" style="color: #38bdf8; text-decoration: none; font-weight: 700;">← Volver a Pro Fitness Glass</a> |
      <a href="/calculadora-1rm" style="color: #38bdf8; text-decoration: none; font-weight: 700;">Calculadora de 1RM</a> |
      <a href="/calculadora-calorias-macros" style="color: #34d399; text-decoration: none; font-weight: 700;">Calculadora de Calorías y Macros</a> |
      <a href="/noticias" style="color: #a855f7; text-decoration: none; font-weight: 700;">Guías de Gimnasio</a>
    </nav>
    <header style="margin-bottom: 2.5rem; text-align: center;">
      <div style="display: inline-flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
        <img src="/icons/icon-96.png" alt="Pro Fitness Glass" style="width: 44px; height: 44px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" />
        <div style="text-align: left;">
          <div style="font-size: 1.25rem; font-weight: 900; line-height: 1; color: #f8fafc;">Pro Fitness Glass</div>
          <span style="display: inline-block; font-size: 0.7rem; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.25rem;">App de Gimnasio 100% Gratis</span>
        </div>
      </div>
      <br />
      <span style="display: inline-block; font-size: 0.75rem; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.08em;">Enciclopedia Biomecánica de Gimnasio</span>
      <h1 style="font-size: 2.5rem; font-weight: 900; margin: 0.5rem 0 1rem; letter-spacing: -0.02em;">Mejores Ejercicios de Gimnasio y Rutinas de Hipertrofia (Guía Técnica)</h1>
      <p style="font-size: 1.15rem; color: #94a3b8;">Aprende la técnica biomecánica paso a paso de Press de Banca, Sentadilla Libre, Sentadilla Búlgara, Peso Muerto Rumano, Hip Thrust, Dominadas, Remo con Barra, Press Militar y Elevaciones Laterales, junto con las mejores rutinas Push Pull Legs, Torso Pierna y Full Body.</p>
    </header>
    <section style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; padding: 2rem; margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem;">Ejercicios Fundamentales por Grupo Muscular</h2>
      <ul style="padding-left: 1.5rem; color: #e2e8f0; line-height: 1.9;">
        ${PUBLIC_EXERCISES.map((ex) => `<li><a href="/ejercicios/${ex.slug}" style="color: #38bdf8; font-weight: 700; text-decoration: none;">${escapeHtml(ex.name)}</a> (${escapeHtml(ex.muscleGroup)}) — ${escapeHtml(ex.idealReps)}</li>`).join('\n        ')}
      </ul>
    </section>
    <section style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; padding: 2rem; margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem;">Rutinas de Gimnasio más Efectivas para Hipertrofia</h2>
      <ul style="padding-left: 1.5rem; color: #e2e8f0; line-height: 1.9;">
        ${PUBLIC_ROUTINES.map((r) => `<li><a href="/rutinas/${r.slug}" style="color: #a855f7; font-weight: 700; text-decoration: none;">${escapeHtml(r.name)}</a> (${escapeHtml(r.days)}) — ${escapeHtml(r.goal)}</li>`).join('\n        ')}
      </ul>
    </section>
  </main>`;

  const ejerciciosJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Guía de Ejercicios de Gimnasio y Rutinas de Hipertrofia | Pro Fitness Glass',
        url: `${BASE_URL}/ejercicios`,
        description: 'Enciclopedia gratuita de ejercicios de gimnasio por grupo muscular con técnica biomecánica y rutinas Push Pull Legs, Torso Pierna y Full Body.',
        inLanguage: 'es-ES'
      },
      {
        '@type': 'ItemList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Press de Banca Plano e Inclinado (Pecho)' },
          { '@type': 'ListItem', position: 2, name: 'Sentadilla Libre y Sentadilla Búlgara (Cuádriceps y Glúteo)' },
          { '@type': 'ListItem', position: 3, name: 'Peso Muerto Rumano y Hip Thrust (Isquios y Glúteo)' },
          { '@type': 'ListItem', position: 4, name: 'Dominadas, Jalón al Pecho y Remo con Barra (Espalda)' },
          { '@type': 'ListItem', position: 5, name: 'Press Militar y Elevaciones Laterales (Hombros)' },
          { '@type': 'ListItem', position: 6, name: 'Curl Inclinado y Extensión de Tríceps en Polea (Brazos)' }
        ]
      }
    ]
  };

  let ejerciciosHtml = injectMeta(baseHtml, {
    title: 'Ejercicios de Gimnasio y Rutinas de Hipertrofia',
    description: 'Técnica correcta de ejercicios de gimnasio para pecho, espalda, piernas, glúteos, hombros y brazos, con rutinas Push Pull Legs y Torso Pierna.',
    image: `${BASE_URL}/og-preview.jpg`,
    url: `${BASE_URL}/ejercicios`,
    type: 'website',
    jsonLdScripts: [ejerciciosJsonLd]
  });
  ejerciciosHtml = injectPrerenderBody(ejerciciosHtml, ejerciciosBody, 'PublicExercisesPage');
  fs.writeFileSync(path.join(ejerciciosDir, 'index.html'), ejerciciosHtml, 'utf8');
  console.log('[Prerender] Generada enciclopedia de ejercicios en dist/ejercicios/index.html.');

  // ==========================================
  // PRERENDER: Fichas individuales de ejercicios (/ejercicios/:slug)
  // ==========================================
  for (const ex of PUBLIC_EXERCISES) {
    const exDir = path.join(ejerciciosDir, ex.slug);
    if (!fs.existsSync(exDir)) fs.mkdirSync(exDir, { recursive: true });
    const exUrl = `${BASE_URL}/ejercicios/${ex.slug}`;
    const matchingRoutines = PUBLIC_ROUTINES.filter((r) =>
      r.schedule.some((d) => d.exercises.some((item) => item.slug === ex.slug))
    );
    const exBody = `
  <article style="padding: 3rem 1.5rem; max-width: 860px; margin: 0 auto; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.75;">
    <nav style="margin-bottom: 1.5rem;">
      <a href="/ejercicios" style="color: #38bdf8; text-decoration: none; font-weight: 700;">← Todos los Ejercicios</a> |
      <a href="/rutinas" style="color: #a855f7; text-decoration: none; font-weight: 700;">Rutinas de Gimnasio</a> |
      <a href="/calculadora-1rm" style="color: #34d399; text-decoration: none; font-weight: 700;">Calculadora 1RM</a>
    </nav>
    <header style="margin-bottom: 2rem;">
      <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-weight: 800; font-size: 0.8rem; text-transform: uppercase;">${escapeHtml(ex.muscleGroup)} · ${escapeHtml(ex.difficulty)}</span>
      <h1 style="font-size: 2.35rem; font-weight: 900; margin: 0.75rem 0 1rem; letter-spacing: -0.02em;">${escapeHtml(ex.name)}: Técnica, Músculos y Errores</h1>
      <p style="font-size: 1.1rem; color: #94a3b8;">${escapeHtml(ex.seoDescription)}</p>
    </header>
    <section style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.25rem; padding: 1.5rem; margin-bottom: 1.5rem;">
      <p><strong>Material:</strong> ${escapeHtml(ex.equipment)} | <strong>Sinergistas:</strong> ${escapeHtml(ex.secondaryMuscles)}</p>
      <p style="margin-bottom: 0;"><strong>Rango óptimo:</strong> ${escapeHtml(ex.idealReps)} | <strong>Descanso:</strong> ${escapeHtml(ex.restTime)}</p>
    </section>
    <section style="margin-bottom: 1.5rem;">
      <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 0.75rem;">Cómo hacer ${escapeHtml(ex.shortName)} paso a paso</h2>
      <ol style="padding-left: 1.5rem; color: #e2e8f0;">
        ${ex.technique.map((step) => `<li style="margin-bottom: 0.5rem;">${escapeHtml(step)}</li>`).join('\n        ')}
      </ol>
    </section>
    <section style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 1.25rem; padding: 1.25rem; margin-bottom: 1.5rem;">
      <h2 style="font-size: 1.1rem; font-weight: 800; color: #f87171; margin: 0 0 0.5rem;">Error común a evitar</h2>
      <p style="margin: 0; color: #cbd5e1;">${escapeHtml(ex.commonMistake)}</p>
    </section>
    ${matchingRoutines.length > 0 ? `<section><h2 style="font-size: 1.25rem; font-weight: 800;">Rutinas que incluyen ${escapeHtml(ex.shortName)}</h2><ul>${matchingRoutines.map((r) => `<li><a href="/rutinas/${r.slug}" style="color: #a855f7; font-weight: 700;">${escapeHtml(r.name)}</a></li>`).join('')}</ul></section>` : ''}
  </article>`;
    const exJsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          headline: ex.name,
          description: ex.seoDescription,
          inLanguage: 'es-ES',
          mainEntityOfPage: { '@type': 'WebPage', '@id': exUrl },
          author: { '@type': 'Organization', name: 'Equipo Editorial Pro Fitness Glass', url: BASE_URL },
          publisher: { '@type': 'Organization', name: 'Pro Fitness Glass', logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.webp` } },
        },
        {
          '@type': 'HowTo',
          name: `Cómo hacer ${ex.name}`,
          description: ex.seoDescription,
          supply: [{ '@type': 'HowToSupply', name: ex.equipment }],
          step: ex.technique.map((text, idx) => ({ '@type': 'HowToStep', position: idx + 1, text })),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
            { '@type': 'ListItem', position: 2, name: 'Ejercicios', item: `${BASE_URL}/ejercicios` },
            { '@type': 'ListItem', position: 3, name: ex.shortName, item: exUrl },
          ],
        },
      ],
    };
    const exHtml = injectMeta(baseHtml, {
      title: ex.seoTitle,
      description: ex.seoDescription,
      image: `${BASE_URL}/og-preview.jpg`,
      url: exUrl,
      type: 'article',
      jsonLdScripts: [exJsonLd],
    });
    fs.writeFileSync(path.join(exDir, 'index.html'), injectPrerenderBody(exHtml, exBody, 'PublicExerciseDetailPage'), 'utf8');
  }
  console.log(`[Prerender] Generadas ${PUBLIC_EXERCISES.length} fichas individuales en dist/ejercicios/:slug/index.html.`);

  // ==========================================
  // PRERENDER: Índice y fichas de Rutinas (/rutinas y /rutinas/:slug)
  // ==========================================
  const rutinasDir = path.join(distDir, 'rutinas');
  if (!fs.existsSync(rutinasDir)) fs.mkdirSync(rutinasDir, { recursive: true });
  const rutinasIndexBody = `
  <main style="padding: 3rem 1.5rem; max-width: 960px; margin: 0 auto; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.75;">
    <nav style="margin-bottom: 1.5rem;">
      <a href="/" style="color: #38bdf8; text-decoration: none; font-weight: 700;">← Volver a Pro Fitness Glass</a> |
      <a href="/ejercicios" style="color: #38bdf8; text-decoration: none; font-weight: 700;">Guía de Ejercicios</a> |
      <a href="/calculadora-1rm" style="color: #34d399; text-decoration: none; font-weight: 700;">Calculadora 1RM</a>
    </nav>
    <header style="margin-bottom: 2rem; text-align: center;">
      <h1 style="font-size: 2.35rem; font-weight: 900; margin: 0 0 1rem;">Rutinas de Gimnasio para Hipertrofia y Fuerza</h1>
      <p style="color: #94a3b8;">Plantillas semanales día a día con ejercicios biomecánicos, series, repeticiones y RIR.</p>
    </header>
    <section style="display: grid; gap: 1.25rem;">
      ${PUBLIC_ROUTINES.map((r) => `<article style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.25rem; padding: 1.5rem;"><span style="color:#a855f7;font-weight:800;font-size:0.8rem;">${escapeHtml(r.days)}</span><h2 style="margin:0.5rem 0;"><a href="/rutinas/${r.slug}" style="color:#f8fafc;text-decoration:none;">${escapeHtml(r.name)}</a></h2><p style="color:#cbd5e1;">${escapeHtml(r.desc)}</p></article>`).join('\n      ')}
    </section>
  </main>`;
  const rutinasIndexHtml = injectMeta(baseHtml, {
    title: 'Rutinas de Gimnasio para Hipertrofia (PPL, Torso Pierna)',
    description: 'Explora las mejores rutinas de gimnasio día a día: Push Pull Legs, Torso Pierna 4 días, Full Body y Arnold Split con series, repeticiones y RIR.',
    image: `${BASE_URL}/og-preview.jpg`,
    url: `${BASE_URL}/rutinas`,
    type: 'website',
    jsonLdScripts: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Rutinas de Gimnasio para Hipertrofia', url: `${BASE_URL}/rutinas`, inLanguage: 'es-ES' }],
  });
  fs.writeFileSync(path.join(rutinasDir, 'index.html'), injectPrerenderBody(rutinasIndexHtml, rutinasIndexBody, 'PublicRoutineDetailPage'), 'utf8');

  for (const routine of PUBLIC_ROUTINES) {
    const rDir = path.join(rutinasDir, routine.slug);
    if (!fs.existsSync(rDir)) fs.mkdirSync(rDir, { recursive: true });
    const rUrl = `${BASE_URL}/rutinas/${routine.slug}`;
    const rBody = `
  <article style="padding: 3rem 1.5rem; max-width: 860px; margin: 0 auto; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.75;">
    <nav style="margin-bottom: 1.5rem;">
      <a href="/rutinas" style="color: #38bdf8; text-decoration: none; font-weight: 700;">← Todas las Rutinas</a> |
      <a href="/ejercicios" style="color: #34d399; text-decoration: none; font-weight: 700;">Guía de Ejercicios</a> |
      <a href="/calculadora-calorias-macros" style="color: #34d399; text-decoration: none; font-weight: 700;">Calculadora Macros</a>
    </nav>
    <header style="margin-bottom: 2rem;">
      <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; background: rgba(168, 85, 247, 0.15); color: #a855f7; font-weight: 800; font-size: 0.8rem; text-transform: uppercase;">${escapeHtml(routine.days)} · ${escapeHtml(routine.level)}</span>
      <h1 style="font-size: 2.35rem; font-weight: 900; margin: 0.75rem 0 1rem;">${escapeHtml(routine.name)}</h1>
      <p style="font-size: 1.1rem; color: #94a3b8;">${escapeHtml(routine.desc)}</p>
      <p style="color: #38bdf8; font-weight: 700;">Volumen semanal: ${escapeHtml(routine.weeklyVolume)}</p>
    </header>
    ${routine.schedule.map((day) => `<section style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.25rem; padding: 1.5rem; margin-bottom: 1.25rem;"><h2 style="font-size:1.35rem;font-weight:800;margin:0 0 0.75rem;">${escapeHtml(day.dayTitle)}</h2><ul>${day.exercises.map((item) => { const ex = findExerciseBySlug(item.slug); return ex ? `<li style="margin-bottom:0.4rem;"><a href="/ejercicios/${ex.slug}" style="color:#38bdf8;font-weight:700;text-decoration:none;">${escapeHtml(ex.name)}</a> — ${escapeHtml(item.sets)}</li>` : ''; }).join('')}</ul></section>`).join('\n    ')}
  </article>`;
    const rJsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          headline: routine.name,
          description: routine.seoDescription,
          inLanguage: 'es-ES',
          mainEntityOfPage: { '@type': 'WebPage', '@id': rUrl },
          author: { '@type': 'Organization', name: 'Equipo Editorial Pro Fitness Glass', url: BASE_URL },
          publisher: { '@type': 'Organization', name: 'Pro Fitness Glass', logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.webp` } },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
            { '@type': 'ListItem', position: 2, name: 'Rutinas', item: `${BASE_URL}/rutinas` },
            { '@type': 'ListItem', position: 3, name: routine.shortName, item: rUrl },
          ],
        },
      ],
    };
    const rHtml = injectMeta(baseHtml, {
      title: routine.seoTitle,
      description: routine.seoDescription,
      image: `${BASE_URL}/og-preview.jpg`,
      url: rUrl,
      type: 'article',
      jsonLdScripts: [rJsonLd],
    });
    fs.writeFileSync(path.join(rDir, 'index.html'), injectPrerenderBody(rHtml, rBody, 'PublicRoutineDetailPage'), 'utf8');
  }
  console.log(`[Prerender] Generadas /rutinas y ${PUBLIC_ROUTINES.length} rutinas individuales en dist/rutinas/:slug/index.html.`);

  // ==========================================
  // PRERENDER: /sobre-nosotros (About Us / Quiénes Somos)
  // ==========================================
  const sobreNosotrosDir = path.join(distDir, 'sobre-nosotros');
  if (!fs.existsSync(sobreNosotrosDir)) fs.mkdirSync(sobreNosotrosDir, { recursive: true });

  const sobreNosotrosJsonLd = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": "${BASE_URL}/sobre-nosotros#webpage",
        "url": "${BASE_URL}/sobre-nosotros",
        "name": "¿Qué es Pro Fitness Glass? — Quiénes Somos, Misión y Plataforma Fitness",
        "description": "Conoce la historia, tecnología y filosofía 100% gratuita detrás de Pro Fitness Glass, la app de entrenamiento de gimnasio, hipertrofia y nutrición con diseño Glassmorphism e IA.",
        "inLanguage": "es"
      },
      {
        "@type": "SoftwareApplication",
        "name": "Pro Fitness Glass",
        "applicationCategory": "HealthApplication",
        "operatingSystem": "Android, Web Browser, Windows, macOS, iOS",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "EUR"
        },
        "description": "Aplicación de entrenamiento y nutrición para gimnasio 100% gratuita con sobrecarga progresiva, vídeos de técnica, animaciones anatómicas, temporizador nativo en segundo plano y asistente de IA Synapse.",
        "author": {
          "@type": "Person",
          "name": "Dylan Jesús Suárez Falcón",
          "jobTitle": "Fundador y Desarrollador Principal",
          "image": "${BASE_URL}/27B6A09D-BE3C-4CCD-AB66-3328BB57E60BIMG_20250601_211116.jpg"
        }
      },
      {
        "@type": "Organization",
        "name": "Pro Fitness Glass",
        "url": "${BASE_URL}",
        "logo": "${BASE_URL}/icons/icon-512.png",
        "founder": {
          "@type": "Person",
          "name": "Dylan Jesús Suárez Falcón",
          "image": "${BASE_URL}/27B6A09D-BE3C-4CCD-AB66-3328BB57E60BIMG_20250601_211116.jpg"
        },
        "sameAs": [
          "https://play.google.com/store/apps/details?id=com.profitnessglass.app"
        ]
      }
    ]
  }
  </script>`;

  const sobreNosotrosBody = `
  <main style="padding: 3rem 1.5rem; max-width: 960px; margin: 0 auto; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.75;">
    <nav style="margin-bottom: 1.5rem;">
      <a href="/" style="color: #38bdf8; text-decoration: none; font-weight: 700;">← Volver a Pro Fitness Glass</a> |
      <a href="/faq" style="color: #34d399; text-decoration: none; font-weight: 700;">Preguntas Frecuentes (FAQ)</a> |
      <a href="/calculadora-1rm" style="color: #38bdf8; text-decoration: none; font-weight: 700;">Calculadora de 1RM</a> |
      <a href="/noticias" style="color: #a855f7; text-decoration: none; font-weight: 700;">Guías de Gimnasio</a>
    </nav>
    <header style="margin-bottom: 2.5rem; text-align: center;">
      <div style="display: inline-flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
        <img src="/icons/icon-96.png" alt="Pro Fitness Glass" style="width: 44px; height: 44px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" />
        <div style="text-align: left;">
          <div style="font-size: 1.25rem; font-weight: 900; line-height: 1; color: #f8fafc;">Pro Fitness Glass</div>
          <span style="display: inline-block; font-size: 0.7rem; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.25rem;">Software Deportivo 100% Gratuito</span>
        </div>
      </div>
      <br />
      <h1 style="font-size: 2.5rem; font-weight: 900; margin: 0.5rem 0 1rem; letter-spacing: -0.02em;">¿Qué es Pro Fitness Glass? — Quiénes Somos y Nuestra Misión</h1>
      <p style="font-size: 1.15rem; color: #94a3b8;">La plataforma libre definitiva para registrar tus entrenamientos de musculación, hipertrofia, progresión de fuerza y nutrición deportiva. Creada por Dylan Jesús Suárez Falcón para devolver al fitness una herramienta libre de suscripciones abusivas.</p>
    </header>

    <section style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; padding: 2rem; margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem; color: #34d399;">Nuestra Filosofía: 100% Gratis, Sin Muros de Pago</h2>
      <p style="color: #cbd5e1; margin-bottom: 1rem;">La industria de las apps de fitness cobra entre 10 € y 15 € al mes por funciones esenciales como registrar rutinas o consultar el historial de marcas. En Pro Fitness Glass creemos que las herramientas de salud y ciencia deportiva deben ser universales. Todas nuestras funciones clave son y serán gratuitas para siempre.</p>
    </section>

    <section style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; padding: 2rem; margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem; color: #38bdf8;">Módulos y Características de la Plataforma</h2>
      <ul style="padding-left: 1.5rem; color: #e2e8f0; line-height: 1.8;">
        <li><strong>Sobrecarga Progresiva Real:</strong> Registro de series, repeticiones, kilos y RIR/RPE con comparativa automática de récords frente a tu última sesión.</li>
        <li><strong>Guía Biomecánica en Vídeo y 3D:</strong> Más de 300 ejercicios de gimnasio con técnica en alta definición y animaciones anatómicas que enseñan la trayectoria óptima.</li>
        <li><strong>Inteligencia Artificial Synapse:</strong> Asesor deportivo inteligente que responde dudas de entrenamiento, previene sobreentrenamiento y asiste en la progresión.</li>
        <li><strong>Temporizador Nativo en Segundo Plano:</strong> Servicio en primer plano para Android con notificación flotante interactiva para descansar exactamente el tiempo necesario.</li>
        <li><strong>Nutrición y Calculadoras Deportivas:</strong> Fórmulas científicas validadas (Mifflin-St Jeor para calorías y TDEE; Epley, Brzycki y Lander para 1RM).</li>
        <li><strong>Radar de Gimnasios:</strong> Mapa interactivo con geolocalización para encontrar salas de musculación y calistenia cercanas.</li>
        <li><strong>Comunidad y Asesorías:</strong> Compartir rutinas con un solo enlace y sincronización bidireccional entre atletas y entrenadores personales.</li>
      </ul>
    </section>

    <section style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; padding: 2rem; margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem; color: #f8fafc;">Quién está detrás</h2>
      <div style="display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
        <img src="/27B6A09D-BE3C-4CCD-AB66-3328BB57E60BIMG_20250601_211116.jpg" alt="Dylan Jesús Suárez Falcón — Creador de Pro Fitness Glass" style="width: 110px; height: 110px; border-radius: 1.25rem; object-fit: cover; object-position: top; border: 2px solid rgba(34, 197, 94, 0.5); box-shadow: 0 10px 25px rgba(0,0,0,0.4);" />
        <div style="flex: 1; min-width: 240px;">
          <h3 style="font-size: 1.25rem; font-weight: 900; margin: 0 0 0.5rem; color: #f8fafc;">Dylan Jesús Suárez Falcón</h3>
          <p style="color: #cbd5e1; margin: 0; line-height: 1.6;">Pro Fitness Glass fue fundada y desarrollada por <strong>Dylan Jesús Suárez Falcón</strong>, uniendo ingeniería de software moderna con el entrenamiento de hipertrofia y fuerza. La plataforma garantiza privacidad total de datos, autenticación de dos factores (2FA) y desarrollo continuo impulsado por la comunidad.</p>
        </div>
      </div>
    </section>
  </main>`;

  let sobreNosotrosHtml = injectMeta(baseHtml, {
    title: '¿Qué es Pro Fitness Glass? — Quiénes Somos y Misión',
    description: 'Conoce la historia, tecnología y filosofía 100% gratuita detrás de Pro Fitness Glass, la app de gimnasio, hipertrofia y nutrición con IA.',
    image: `${BASE_URL}/og-preview.jpg`,
    url: `${BASE_URL}/sobre-nosotros`,
    type: 'website'
  });
  sobreNosotrosHtml = sobreNosotrosHtml.replace('</head>', `${sobreNosotrosJsonLd}
</head>`);
  sobreNosotrosHtml = injectPrerenderBody(sobreNosotrosHtml, sobreNosotrosBody, 'AboutUsPage');
  fs.writeFileSync(path.join(sobreNosotrosDir, 'index.html'), sobreNosotrosHtml, 'utf8');
  console.log('[Prerender] Generada página Sobre Nosotros en dist/sobre-nosotros/index.html.');

  // ==========================================
  // PRERENDER: /faq (Preguntas Frecuentes)
  // ==========================================
  const faqDir = path.join(distDir, 'faq');
  if (!fs.existsSync(faqDir)) fs.mkdirSync(faqDir, { recursive: true });

  const faqJsonLd = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Pro Fitness Glass es realmente gratis o tiene costos ocultos?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pro Fitness Glass es 100% gratuita. Todas las funciones —creación ilimitada de rutinas, historial completo de por vida, vídeos biomecánicos, animaciones 3D, cronómetro en segundo plano, calculadoras de 1RM y macros, e IA Synapse— están desbloqueadas sin cuotas mensuales ni suscripciones de pago."
        }
      },
      {
        "@type": "Question",
        "name": "¿En qué plataformas y dispositivos puedo utilizar la aplicación?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Puedes utilizarla en cualquier dispositivo: dispones de una aplicación nativa para Android en Google Play Store y de una Progressive Web App (PWA) compatible con navegadores de escritorio (Windows, macOS, Linux) y dispositivos móviles iOS (iPhone/iPad)."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cómo funciona el registro de series y la sobrecarga progresiva?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "En cada ejercicio puedes registrar la carga en kilogramos, repeticiones y Repeticiones en Reserva (RIR o RPE). Pro Fitness Glass compara de forma automática cada serie con tu registro histórico previo y te indica cuándo batir una marca para asegurar el estímulo óptimo de hipertrofia muscular."
        }
      },
      {
        "@type": "Question",
        "name": "¿El temporizador de descanso sigue funcionando con la pantalla bloqueada?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí. En la aplicación de Android disponemos de un servicio nativo en primer plano con notificación interactiva. El temporizador continúa con precisión absoluta aunque apagues la pantalla o cambies a reproducir música u otra aplicación."
        }
      },
      {
        "@type": "Question",
        "name": "¿En qué se diferencia Pro Fitness Glass de apps como Hevy o Strong?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "La diferencia principal radica en la libertad del usuario: no limitamos el número de rutinas (en Hevy gratis solo puedes guardar 3 o 4), no bloqueamos tu historial a 3 meses, incluimos vídeos y 3D en cada ejercicio, temporizador nativo en segundo plano, calculadoras deportivas e IA, todo sin cobrarte 10 € a 15 € mensuales."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué es el Asistente de IA Synapse y en qué me ayuda?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Synapse es el asistente inteligente especializado en ciencias del deporte integrado en Pro Fitness Glass. Puedes consultarle dudas sobre cómo realizar un ejercicio, sustituciones seguras por molestias articulares, pautas de recuperación y recomendaciones de volumen según tu fatiga acumulada."
        }
      },
      {
        "@type": "Question",
        "name": "¿Quién ha desarrollado Pro Fitness Glass y cuál es el contacto oficial?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pro Fitness Glass ha sido creada y desarrollada de forma independiente por Dylan Jesús Suárez Falcón, con la misión de democratizar la salud deportiva. Puedes contactar con nosotros a través de nuestro soporte técnico en la plataforma o mediante los canales oficiales."
        }
      }
    ]
  }
  </script>`;

  const faqBody = `
  <main style="padding: 3rem 1.5rem; max-width: 960px; margin: 0 auto; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.75;">
    <nav style="margin-bottom: 1.5rem;">
      <a href="/" style="color: #38bdf8; text-decoration: none; font-weight: 700;">← Volver a Pro Fitness Glass</a> |
      <a href="/sobre-nosotros" style="color: #34d399; text-decoration: none; font-weight: 700;">Quiénes Somos y Misión</a> |
      <a href="/calculadora-1rm" style="color: #38bdf8; text-decoration: none; font-weight: 700;">Calculadora 1RM</a> |
      <a href="/noticias" style="color: #a855f7; text-decoration: none; font-weight: 700;">Artículos Deportivos</a>
    </nav>
    <header style="margin-bottom: 2.5rem; text-align: center;">
      <div style="display: inline-flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
        <img src="/icons/icon-96.png" alt="Pro Fitness Glass" style="width: 44px; height: 44px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" />
        <div style="text-align: left;">
          <div style="font-size: 1.25rem; font-weight: 900; line-height: 1; color: #f8fafc;">Pro Fitness Glass</div>
          <span style="display: inline-block; font-size: 0.7rem; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.25rem;">Centro de Ayuda y FAQ Oficial</span>
        </div>
      </div>
      <br />
      <h1 style="font-size: 2.5rem; font-weight: 900; margin: 0.5rem 0 1rem; letter-spacing: -0.02em;">Preguntas Frecuentes (FAQ) sobre Pro Fitness Glass</h1>
      <p style="font-size: 1.15rem; color: #94a3b8;">Respuestas oficiales y detalladas sobre gratuidad, rutinas ilimitadas, funcionamiento del cronómetro en segundo plano, app Android en Play Store y la IA deportiva Synapse.</p>
    </header>

    <section style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; padding: 2rem; margin-bottom: 2rem;">
      <h2 style="font-size: 1.35rem; font-weight: 800; margin-bottom: 0.5rem; color: #38bdf8;">¿Pro Fitness Glass es realmente gratis o tiene costos ocultos?</h2>
      <p style="color: #cbd5e1; margin-bottom: 1.5rem;">Pro Fitness Glass es 100% gratuita. Todas las herramientas —rutinas ilimitadas, historial completo de por vida, vídeos biomecánicos, animaciones 3D, cronómetro en segundo plano, calculadoras de 1RM y macros, e IA Synapse— están desbloqueadas sin cuotas de suscripción mensual.</p>

      <h2 style="font-size: 1.35rem; font-weight: 800; margin-bottom: 0.5rem; color: #38bdf8;">¿En qué plataformas y dispositivos puedo utilizar la app?</h2>
      <p style="color: #cbd5e1; margin-bottom: 1.5rem;">Está disponible como aplicación nativa para Android en Google Play Store y como Progressive Web App (PWA) universal para navegadores de escritorio (Windows, macOS, Linux) y dispositivos móviles iOS (iPhone/iPad).</p>

      <h2 style="font-size: 1.35rem; font-weight: 800; margin-bottom: 0.5rem; color: #38bdf8;">¿Cómo funciona el registro de series y sobrecarga progresiva?</h2>
      <p style="color: #cbd5e1; margin-bottom: 1.5rem;">En cada serie puedes registrar peso en kg, repeticiones y RIR (Repeticiones en Reserva). La plataforma compara automáticamente cada registro con tu historial previo y te indica cuándo batir una marca personal (PR).</p>

      <h2 style="font-size: 1.35rem; font-weight: 800; margin-bottom: 0.5rem; color: #38bdf8;">¿El temporizador de descanso sigue funcionando con la pantalla bloqueada?</h2>
      <p style="color: #cbd5e1; margin-bottom: 1.5rem;">Sí. En Android disponemos de un servicio en primer plano nativo con notificación interactiva. El temporizador continúa con precisión absoluta aunque bloquees el móvil o uses otras aplicaciones.</p>

      <h2 style="font-size: 1.35rem; font-weight: 800; margin-bottom: 0.5rem; color: #38bdf8;">¿En qué se diferencia de apps como Hevy o Strong?</h2>
      <p style="color: #cbd5e1; margin-bottom: 1.5rem;">No limitamos el número de rutinas (en Hevy gratis solo puedes guardar 3 o 4), no bloqueamos tu historial pasado a 3 meses, incluimos vídeos y 3D en cada ejercicio, cronómetro en segundo plano, calculadoras deportivas e IA, todo sin cobrarte 10 € a 15 € mensuales.</p>

      <h2 style="font-size: 1.35rem; font-weight: 800; margin-bottom: 0.5rem; color: #38bdf8;">¿Quién creó Pro Fitness Glass y cuál es el contacto oficial?</h2>
      <p style="color: #cbd5e1;">Pro Fitness Glass ha sido creada y desarrollada de forma independiente por <strong>Dylan Jesús Suárez Falcón</strong>. Puedes contactar mediante el soporte técnico de la plataforma o en nuestros canales oficiales.</p>
    </section>
  </main>`;

  let faqHtml = injectMeta(baseHtml, {
    title: 'Preguntas Frecuentes (FAQ) sobre Pro Fitness Glass',
    description: 'Respuestas oficiales sobre Pro Fitness Glass: gratuidad total, rutinas ilimitadas, app Android, IA Synapse, cálculo de 1RM y macros.',
    image: `${BASE_URL}/og-preview.jpg`,
    url: `${BASE_URL}/faq`,
    type: 'website'
  });
  faqHtml = faqHtml.replace('</head>', `${faqJsonLd}
</head>`);
  faqHtml = injectPrerenderBody(faqHtml, faqBody, 'FAQPage');
  fs.writeFileSync(path.join(faqDir, 'index.html'), faqHtml, 'utf8');
  console.log('[Prerender] Generada página FAQ en dist/faq/index.html.');

  // ==========================================
  // PRERENDER: /mantenimiento (Aviso Oficial de Mantenimiento y Migración)
  // ==========================================
  const mantenimientoDir = path.join(distDir, 'mantenimiento');
  if (!fs.existsSync(mantenimientoDir)) fs.mkdirSync(mantenimientoDir, { recursive: true });

  const mantenimientoJsonLd = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Mantenimiento Programado y Nueva Infraestructura — Pro Fitness Glass",
    "description": "La migración técnica al dominio oficial profitnessglass.es ha finalizado con éxito. Tus datos están 100% seguros y la plataforma ahora ofrece mayor velocidad y estabilidad.",
    "url": "${BASE_URL}/mantenimiento",
    "inLanguage": "es"
  }
  </script>`;

  const mantenimientoBody = `
  <main style="padding: 3rem 1.5rem; max-width: 960px; margin: 0 auto; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.75;">
    <nav style="margin-bottom: 1.5rem;">
      <a href="/" style="color: #38bdf8; text-decoration: none; font-weight: 700;">← Volver a Pro Fitness Glass</a> |
      <a href="/faq" style="color: #34d399; text-decoration: none; font-weight: 700;">Preguntas Frecuentes</a> |
      <a href="/sobre-nosotros" style="color: #a855f7; text-decoration: none; font-weight: 700;">Quiénes Somos</a>
    </nav>
    <header style="margin-bottom: 2.5rem; text-align: center;">
      <div style="display: inline-flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
        <img src="/icons/icon-96.png" alt="Pro Fitness Glass" style="width: 44px; height: 44px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" />
        <div style="text-align: left;">
          <div style="font-size: 1.25rem; font-weight: 900; line-height: 1; color: #f8fafc;">Pro Fitness Glass</div>
          <span style="display: inline-block; font-size: 0.7rem; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.25rem;">Aviso Oficial · Migración Finalizada con Éxito</span>
        </div>
      </div>
      <br />
      <h1 style="font-size: 2.5rem; font-weight: 900; margin: 0.5rem 0 1rem; letter-spacing: -0.02em;">¡Migración Completada con Éxito!</h1>
      <p style="font-size: 1.15rem; color: #94a3b8;">La plataforma ya está 100% operativa en su dominio oficial <strong style="color: #34d399;">profitnessglass.es</strong>, con mayor velocidad, estabilidad y todos tus datos 100% seguros.</p>
    </header>

    <section style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 1.5rem; padding: 2rem; margin-bottom: 2rem;">
      <h2 style="font-size: 1.35rem; font-weight: 800; margin-bottom: 0.5rem; color: #34d399;">Plataforma 100% Operativa y Restablecida</h2>
      <p style="color: #cbd5e1; margin-bottom: 0;">La transición técnica hacia nuestro dominio oficial profitnessglass.es ha finalizado con éxito total. Puedes seguir entrenando y registrando tu progreso con normalidad.</p>
    </section>

    <section style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 1.5rem; padding: 2rem; margin-bottom: 2rem;">
      <h2 style="font-size: 1.35rem; font-weight: 800; margin-bottom: 0.5rem; color: #34d399;">Tus Datos Están 100% Seguros y Protegidos</h2>
      <p style="color: #cbd5e1; margin-bottom: 1rem;">No tienes nada de qué preocuparte: ningún dato se perderá ni estará en peligro. Todas tus rutinas, historial de entrenamientos, pesos, series y marcas personales (PR) se migran de forma íntegra y cifrada a los nuevos servidores.</p>
      <p style="color: #cbd5e1; margin-bottom: 0;">No tendrás que volver a registrarte ni volver a configurar nada. Iniciarás sesión con tu misma cuenta y contraseña habituales.</p>
    </section>

    <section style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; padding: 2rem; margin-bottom: 2rem;">
      <h2 style="font-size: 1.35rem; font-weight: 800; margin-bottom: 0.5rem; color: #38bdf8;">¿Por qué realizamos este cambio?</h2>
      <p style="color: #cbd5e1; margin-bottom: 1rem;">Nuestro proveedor externo de servidores actual cesará sus servicios. Por ello, hemos dado el paso definitivo a servidores propios dedicados exclusivamente para Pro Fitness Glass, garantizando mayor velocidad, estabilidad y soberanía sobre nuestra plataforma.</p>
      <p style="color: #cbd5e1; margin-bottom: 0;">Además, pasaremos a operar en nuestro nuevo dominio oficial: <strong>profitnessglass.com</strong>.</p>
    </section>
  </main>`;

  let mantenimientoHtml = injectMeta(baseHtml, {
    title: 'Estado y Migración Oficial — Pro Fitness Glass',
    description: 'La migración técnica al dominio oficial profitnessglass.es ha finalizado con éxito. Tus datos están 100% seguros y la plataforma ofrece mayor velocidad.',
    image: `${BASE_URL}/og-preview.jpg`,
    url: `${BASE_URL}/mantenimiento`,
    type: 'website'
  });
  mantenimientoHtml = mantenimientoHtml.replace('</head>', `${mantenimientoJsonLd}
</head>`);
  mantenimientoHtml = injectPrerenderBody(mantenimientoHtml, mantenimientoBody, 'MaintenanceInfoPage');
  fs.writeFileSync(path.join(mantenimientoDir, 'index.html'), mantenimientoHtml, 'utf8');
  console.log('[Prerender] Generada página Mantenimiento en dist/mantenimiento/index.html.');

  // ==========================================
  // PRERENDER: Páginas legales (/privacy, /terms, /aviso-legal)
  // ==========================================
  const legalPages = [
    {
      slug: 'privacy',
      chunk: 'PrivacyPolicy',
      title: 'Política de Privacidad y Eliminación de Datos — Pro Fitness Glass',
      h1: 'Política de Privacidad y Protección de Datos',
      description: 'Cómo protege Pro Fitness Glass tus datos de entrenamiento y salud bajo RGPD y LOPDGDD, y cómo exportar o eliminar tu cuenta al instante.',
      summary: 'En Pro Fitness Glass tus rutinas, marcas personales y datos de cuenta están protegidos conforme al RGPD y LOPDGDD. Nunca vendemos ni compartimos tus datos con terceros y puedes exportarlos o borrarlos en cualquier momento.',
    },
    {
      slug: 'terms',
      chunk: 'TermsPage',
      title: 'Términos del Servicio y Condiciones de Uso — Pro Fitness Glass',
      h1: 'Términos del Servicio',
      description: 'Condiciones de uso, edad mínima legal de 14 años (Art. 8 RGPD y Art. 7 LOPDGDD), responsabilidad y derechos de uso en Pro Fitness Glass.',
      summary: 'Consulta las condiciones contractuales de uso de Pro Fitness Glass, el acceso gratuito a nuestras herramientas de entrenamiento y nutrición y tus derechos como usuario en España y la Unión Europea.',
    },
    {
      slug: 'aviso-legal',
      chunk: 'LegalNoticePage',
      title: 'Aviso Legal (LSSI-CE) — Pro Fitness Glass',
      h1: 'Aviso Legal e Información General',
      description: 'Datos de identificación del titular, propiedad intelectual y régimen de responsabilidad de Pro Fitness Glass conforme al Art. 10 de la Ley 34/2002 (LSSI-CE).',
      summary: 'Información oficial del prestador de servicios, titularidad de Pro Fitness Glass (Dylan Jesús Suárez Falcón), contacto oficial (soporte@profitnessglass.es) y cumplimiento normativo LSSI-CE.',
    },
  ];

  for (const page of legalPages) {
    const pageDir = path.join(distDir, page.slug);
    if (!fs.existsSync(pageDir)) fs.mkdirSync(pageDir, { recursive: true });
    const pageUrl = `${BASE_URL}/${page.slug}`;
    const pageBody = `
  <main style="padding: 3rem 1.5rem; max-width: 860px; margin: 0 auto; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.75;">
    <nav style="margin-bottom: 1.5rem;">
      <a href="/" style="color: #38bdf8; text-decoration: none; font-weight: 700;">← Volver a Pro Fitness Glass</a> |
      <a href="/privacy" style="color: #34d399; text-decoration: none; font-weight: 700;">Privacidad</a> |
      <a href="/terms" style="color: #34d399; text-decoration: none; font-weight: 700;">Términos</a> |
      <a href="/aviso-legal" style="color: #34d399; text-decoration: none; font-weight: 700;">Aviso Legal</a>
    </nav>
    <header style="margin-bottom: 2rem;">
      <h1 style="font-size: 2.25rem; font-weight: 900; margin: 0 0 1rem; letter-spacing: -0.02em;">${escapeHtml(page.h1)}</h1>
      <p style="font-size: 1.05rem; color: #94a3b8;">${escapeHtml(page.summary)}</p>
    </header>
  </main>`;
    const pageHtml = injectMeta(baseHtml, {
      title: page.title,
      description: page.description,
      image: `${BASE_URL}/og-preview.jpg`,
      url: pageUrl,
      type: 'website',
      jsonLdScripts: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: page.h1,
          description: page.description,
          url: pageUrl,
          inLanguage: 'es-ES',
        },
      ],
    });
    fs.writeFileSync(
      path.join(pageDir, 'index.html'),
      injectPrerenderBody(pageHtml, pageBody, page.chunk),
      'utf8'
    );
  }
  console.log('[Prerender] Generadas páginas legales (/privacy, /terms, /aviso-legal).');

  // 10. Prerender de páginas de acceso prioritario (/login y /register) para Sitelinks y crawlers
  const authPages = [
    {
      slug: 'login',
      chunk: 'LoginScreen',
      title: 'Iniciar Sesión | Pro Fitness Glass',
      description: 'Inicia sesión en Pro Fitness Glass para acceder a tus rutinas de gimnasio, diario de entrenamiento, seguimiento de macros y récords personales.',
      h1: 'Iniciar Sesión en Pro Fitness Glass',
      summary: 'Accede a tu diario de entrenamiento, rutinas personalizadas, calculadora 1RM, control nutricional y seguimiento de récords personales sin publicidad.',
      altHref: '/register',
      altLabel: '¿No tienes cuenta? Regístrate gratis',
    },
    {
      slug: 'register',
      chunk: 'RegisterScreen',
      title: 'Crear Cuenta Gratis | Pro Fitness Glass',
      description: 'Regístrate gratis en Pro Fitness Glass y empieza a crear rutinas de entrenamiento, registrar series, calcular tu 1RM y controlar tus calorías y macros.',
      h1: 'Crear Cuenta Gratis en Pro Fitness Glass',
      summary: 'Empieza hoy gratis en web y Android: planifica tus rutinas Push Pull Legs o Torso Pierna, registra tus cargas con 100% privacidad y sigue tus macros diarios.',
      altHref: '/login',
      altLabel: '¿Ya tienes cuenta? Iniciar Sesión',
    },
  ];

  for (const page of authPages) {
    const pageDir = path.join(distDir, page.slug);
    if (!fs.existsSync(pageDir)) fs.mkdirSync(pageDir, { recursive: true });
    const pageUrl = `${BASE_URL}/${page.slug}`;
    const pageBody = `
  <main style="padding: 3rem 1.5rem; max-width: 860px; margin: 0 auto; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.75;">
    <nav aria-label="Navegación principal" style="margin-bottom: 1.5rem; display: flex; flex-wrap: wrap; gap: 1rem;">
      <a href="/" style="color: #38bdf8; text-decoration: none; font-weight: 700;">← Pro Fitness Glass</a>
      <a href="/rutinas" style="color: #fbbf24; text-decoration: none; font-weight: 700;">Rutinas de Gimnasio</a>
      <a href="/ejercicios" style="color: #34d399; text-decoration: none; font-weight: 700;">Guía de Ejercicios</a>
      <a href="/calculadora-1rm" style="color: #38bdf8; text-decoration: none; font-weight: 700;">Calculadora 1RM</a>
      <a href="/calculadora-calorias-macros" style="color: #34d399; text-decoration: none; font-weight: 700;">Calculadora Macros</a>
      <a href="/noticias" style="color: #c084fc; text-decoration: none; font-weight: 700;">Noticias</a>
    </nav>
    <header style="margin-bottom: 2rem;">
      <h1 style="font-size: 2.25rem; font-weight: 900; margin: 0 0 1rem; letter-spacing: -0.02em;">${escapeHtml(page.h1)}</h1>
      <p style="font-size: 1.05rem; color: #94a3b8; margin: 0 0 1.25rem;">${escapeHtml(page.summary)}</p>
      <a href="${page.altHref}" style="color: #38bdf8; font-weight: 700; text-decoration: underline;">${escapeHtml(page.altLabel)}</a>
    </header>
  </main>`;
    const pageHtml = injectMeta(baseHtml, {
      title: page.title,
      description: page.description,
      image: `${BASE_URL}/og-preview.jpg`,
      url: pageUrl,
      type: 'website',
      jsonLdScripts: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: page.h1,
          description: page.description,
          url: pageUrl,
          inLanguage: 'es-ES',
        },
      ],
    });
    fs.writeFileSync(
      path.join(pageDir, 'index.html'),
      injectPrerenderBody(pageHtml, pageBody, page.chunk),
      'utf8'
    );
  }
  console.log('[Prerender] Generadas páginas de acceso (/login, /register).');

  // 11. Generación dinámica de sitemap.xml válido y completo para Google Search Console
  const todayIso = new Date().toISOString().split('T')[0];
  const staticSitemapEntries = [
    { loc: `${BASE_URL}/`, lastmod: todayIso, changefreq: 'daily', priority: '1.0' },
    { loc: `${BASE_URL}/rutinas`, lastmod: todayIso, changefreq: 'weekly', priority: '0.95' },
    { loc: `${BASE_URL}/ejercicios`, lastmod: todayIso, changefreq: 'weekly', priority: '0.95' },
    { loc: `${BASE_URL}/calculadora-1rm`, lastmod: todayIso, changefreq: 'monthly', priority: '0.95' },
    { loc: `${BASE_URL}/calculadora-calorias-macros`, lastmod: todayIso, changefreq: 'monthly', priority: '0.95' },
    { loc: `${BASE_URL}/noticias`, lastmod: todayIso, changefreq: 'daily', priority: '0.9' },
    { loc: `${BASE_URL}/sobre-nosotros`, lastmod: todayIso, changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/faq`, lastmod: todayIso, changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/login`, lastmod: todayIso, changefreq: 'monthly', priority: '0.75' },
    { loc: `${BASE_URL}/register`, lastmod: todayIso, changefreq: 'monthly', priority: '0.75' },
    { loc: `${BASE_URL}/mantenimiento`, lastmod: todayIso, changefreq: 'monthly', priority: '0.4' },
    { loc: `${BASE_URL}/privacy`, lastmod: todayIso, changefreq: 'yearly', priority: '0.3' },
    { loc: `${BASE_URL}/terms`, lastmod: todayIso, changefreq: 'yearly', priority: '0.3' },
    { loc: `${BASE_URL}/aviso-legal`, lastmod: todayIso, changefreq: 'yearly', priority: '0.3' },
  ];

  const seenLocs = new Set(staticSitemapEntries.map((e) => e.loc));
  const sitemapEntries = [...staticSitemapEntries];

  for (const routine of PUBLIC_ROUTINES) {
    const loc = `${BASE_URL}/rutinas/${routine.slug}`;
    if (!seenLocs.has(loc)) {
      seenLocs.add(loc);
      sitemapEntries.push({ loc, lastmod: todayIso, changefreq: 'monthly', priority: '0.85' });
    }
  }

  for (const exercise of PUBLIC_EXERCISES) {
    const loc = `${BASE_URL}/ejercicios/${exercise.slug}`;
    if (!seenLocs.has(loc)) {
      seenLocs.add(loc);
      sitemapEntries.push({ loc, lastmod: todayIso, changefreq: 'monthly', priority: '0.8' });
    }
  }

  for (const article of allArticles || []) {
    if (!article || !article.slug) continue;
    const loc = `${BASE_URL}/noticias/${article.slug}`;
    if (seenLocs.has(loc)) continue;
    seenLocs.add(loc);
    const rawDate = article.updatedAt || article.publishedAt || article.createdAt;
    const parsedDate = rawDate ? new Date(rawDate) : null;
    const lastmod = parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toISOString().split('T')[0]
      : todayIso;
    sitemapEntries.push({ loc, lastmod, changefreq: 'weekly', priority: '0.85' });
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries
    .map(
      (entry) =>
        `  <url>\n    <loc>${escapeHtml(entry.loc)}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`
    )
    .join('\n')}\n</urlset>\n`;

  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf8');
  if (!isDistOnly() && fs.existsSync(publicDir)) {
    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf8');
  }
  console.log(`[Prerender] Generado sitemap.xml con ${sitemapEntries.length} URLs válidas.`);

}

const isMainModule =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === __filename;

if (isMainModule) {
  main().catch(err => {
    console.error('[Prerender] Error:', err);
    process.exitCode = 1;
  });
}
