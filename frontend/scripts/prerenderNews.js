/* frontend/scripts/prerenderNews.js */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const publicDir = path.resolve(__dirname, '../public');
const indexPath = path.join(distDir, 'index.html');
const BASE_URL = 'https://pro-fitness-glass.zeabur.app';
const API_URL = process.env.VITE_API_BASE_URL || 'https://pro-fitness-glass-api.zeabur.app/api';

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

    // Encabezados
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
      htmlParts.push(`<h1 style="font-size: 2.2rem; font-weight: 900; margin: 2.5rem 0 1rem; color: #f8fafc;">${formatInlineMarkdown(line.slice(2))}</h1>`);
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

async function fetchArticles() {
  let apiArticles = [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${API_URL}/news?limit=100`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.news) && data.news.length > 0) {
        apiArticles = data.news;
        console.log(`[Prerender] Obtenidos ${data.news.length} artículos desde la API.`);
      }
    }
  } catch (err) {
    console.warn('[Prerender] No se pudo consultar la API remota:', err.message);
  }

  // Cargar artículos desde cachedNews.json para combinar y asegurar que NINGÚN artículo falte
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

  // Fusión por slug: primero locales, sobreescritos por API si existen
  const combinedMap = new Map();
  cachedArticles.forEach(a => {
    if (a.slug) combinedMap.set(a.slug, a);
  });
  apiArticles.forEach(a => {
    if (a.slug) {
      combinedMap.set(a.slug, { ...(combinedMap.get(a.slug) || {}), ...a });
    }
  });

  const merged = Array.from(combinedMap.values());
  console.log(`[Prerender] Total de artículos únicos a prerenderizar: ${merged.length}`);
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
  dateModified
}) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeImg = escapeUrlAttr(image);
  const safeUrl = escapeUrlAttr(url);

  let output = html;

  // Title
  output = output.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle} | Pro Fitness Glass</title>`);

  // Meta description
  output = output.replace(/<meta\s+name=["']description["'][\s\S]*?>/i, `<meta name="description" content="${safeDesc}" />`);

  // Canonical
  output = output.replace(/<link\s+rel=["']canonical["'][\s\S]*?>/i, `<link rel="canonical" href="${safeUrl}" />`);

  // Open Graph
  output = output.replace(/<meta\s+property=["']og:type["'][\s\S]*?>/i, `<meta property="og:type" content="${type}" />`);
  output = output.replace(/<meta\s+property=["']og:url["'][\s\S]*?>/i, `<meta property="og:url" content="${safeUrl}" />`);
  output = output.replace(/<meta\s+property=["']og:title["'][\s\S]*?>/i, `<meta property="og:title" content="${safeTitle} | Pro Fitness Glass" />`);
  output = output.replace(/<meta\s+property=["']og:description["'][\s\S]*?>/i, `<meta property="og:description" content="${safeDesc}" />`);
  output = output.replace(/<meta\s+property=["']og:image:alt["'][\s\S]*?>/i, '');
  output = output.replace(
    /<meta\s+property=["']og:image["'][\s\S]*?>/i,
    `<meta property="og:image" content="${safeImg}" />\n  <meta property="og:image:secure_url" content="${safeImg}" />\n  <meta property="og:image:width" content="1200" />\n  <meta property="og:image:height" content="630" />\n  <meta property="og:image:alt" content="${safeTitle}" />`
  );

  // Twitter
  output = output.replace(/<meta\s+name=["']twitter:title["'][\s\S]*?>/i, `<meta name="twitter:title" content="${safeTitle} | Pro Fitness Glass" />`);
  output = output.replace(/<meta\s+name=["']twitter:description["'][\s\S]*?>/i, `<meta name="twitter:description" content="${safeDesc}" />`);
  output = output.replace(/<meta\s+name=["']twitter:image["'][\s\S]*?>/i, `<meta name="twitter:image" content="${safeImg}" />`);

  // Inyectar Schema.org específico para Article cumpliendo estándares de Google Rich Results
  if (type === 'article') {
    const pubIso = datePublished ? new Date(datePublished).toISOString() : new Date().toISOString();
    const modIso = dateModified ? new Date(dateModified).toISOString() : pubIso;
    const articleJsonLd = `\n  <script type="application/ld+json">\n  {\n    "@context": "https://schema.org",\n    "@type": "Article",\n    "headline": ${JSON.stringify(title)},\n    "description": ${JSON.stringify(description)},\n    "image": [${JSON.stringify(image)}],\n    "datePublished": ${JSON.stringify(pubIso)},\n    "dateModified": ${JSON.stringify(modIso)},\n    "articleSection": ${JSON.stringify(category)},\n    "inLanguage": "es-ES",\n    "author": [{\n      "@type": "Organization",\n      "name": "Equipo Editorial Pro Fitness Glass",\n      "url": "${BASE_URL}"\n    }],\n    "mainEntityOfPage": {\n      "@type": "WebPage",\n      "@id": ${JSON.stringify(url)}\n    },\n    "publisher": {\n      "@type": "Organization",\n      "name": "Pro Fitness Glass",\n      "logo": {\n        "@type": "ImageObject",\n        "url": "${BASE_URL}/logo.webp"\n      }\n    }\n  }\n  </script>`;
    output = output.replace('</head>', `${articleJsonLd}\n</head>`);
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
${items}
  </channel>
</rss>`;
}

async function main() {
  if (!fs.existsSync(indexPath)) {
    console.error('[Prerender] Error: dist/index.html no existe. Ejecuta primero vite build.');
    return;
  }

  const baseHtml = fs.readFileSync(indexPath, 'utf8');
  const articles = await fetchArticles();

  // 1. Generar feed RSS 2.0 y guardarlo en dist/rss.xml y public/rss.xml
  try {
    const rssXml = generateRssFeed(articles);
    fs.writeFileSync(path.join(distDir, 'rss.xml'), rssXml, 'utf8');
    if (fs.existsSync(publicDir)) {
      fs.writeFileSync(path.join(publicDir, 'rss.xml'), rssXml, 'utf8');
    }
    console.log('[Prerender] Generado dist/rss.xml y public/rss.xml con éxito.');
  } catch (err) {
    console.warn('[Prerender] Error generando feed RSS:', err.message);
  }

  // 2. Prerender de la sección principal /noticias con enlaces a todos los artículos
  const newsIndexDir = path.join(distDir, 'noticias');
  if (!fs.existsSync(newsIndexDir)) fs.mkdirSync(newsIndexDir, { recursive: true });

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
    <header style="margin-bottom: 3rem; text-align: center;">
      <h1 style="font-size: 2.75rem; font-weight: 900; margin-bottom: 1rem; letter-spacing: -0.02em;">Noticias y Guías de Élite de Fitness y Nutrición</h1>
      <p style="font-size: 1.15rem; color: #94a3b8; max-width: 750px; margin: 0 auto; line-height: 1.6;">Aprende con artículos basados en evidencia científica, optimiza tus comidas y domina tu rendimiento en el gimnasio con Pro Fitness Glass.</p>
    </header>
    <section style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.75rem;">
      ${articleCardsHtml}
    </section>
  </main>`;

  let newsIndexHtml = injectMeta(baseHtml, {
    title: 'Noticias y Guías de Élite de Fitness y Nutrición',
    description: 'Aprende con artículos basados en evidencia científica, optimiza tus comidas y domina tu rendimiento en el gimnasio con Pro Fitness Glass.',
    image: `${BASE_URL}/entrenamiento.png`,
    url: `${BASE_URL}/noticias`,
    type: 'website'
  });
  newsIndexHtml = newsIndexHtml.replace(/<div id="root">[\s\S]*?<\/div>(\s*<noscript>)/i, `<div id="root">${newsBodyHtml}</div>$1`);
  newsIndexHtml = newsIndexHtml.replace(/<noscript>[\s\S]*?<\/noscript>/i, `<noscript>${newsBodyHtml}</noscript>`);
  fs.writeFileSync(path.join(newsIndexDir, 'index.html'), newsIndexHtml, 'utf8');
  console.log('[Prerender] Generado dist/noticias/index.html con lista de artículos semánticos.');

  // 3. Prerender de cada artículo individual con su contenido completo en el body
  console.log(`[Prerender] Procesando ${articles.length} artículos con contenido semántico completo...`);

  // Mapa de caché local para obtener el contenido markdown completo
  const cachePath = path.resolve(__dirname, '../src/data/cachedNews.json');
  const cachedMap = new Map();
  if (fs.existsSync(cachePath)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      if (Array.isArray(cached)) {
        cached.forEach(a => { if (a.slug) cachedMap.set(a.slug, a); });
      }
    } catch (e) {
      console.warn('[Prerender] Error leyendo cachedNews.json:', e.message);
    }
  }

  let count = 0;
  for (const article of articles) {
    const slug = (article.slug || '').trim();
    if (!slug) continue;
    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) continue;

    const articleDir = path.join(distDir, 'noticias', slug);
    if (!fs.existsSync(articleDir)) fs.mkdirSync(articleDir, { recursive: true });

    let articleImage = article.image_url || `${BASE_URL}/entrenamiento.png`;
    if (articleImage.includes('photo-1510519138197-06b8628cbf4f')) {
      articleImage = 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?auto=format&fit=crop&w=1200&q=80';
    }
    if (!articleImage.startsWith('http')) {
      articleImage = `${BASE_URL}${articleImage.startsWith('/') ? '' : '/'}${articleImage}`;
    }

    const pubDate = article.published_at || article.createdAt || new Date().toISOString();
    const pubIso = new Date(pubDate).toISOString();
    const pubFormatted = new Date(pubDate).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Obtener contenido completo desde el artículo, caché local o API remota
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

    const semanticArticleHtml = markdownToSemanticHtml(content);

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

    let articleHtml = injectMeta(baseHtml, {
      title: article.title,
      description: article.summary || article.seo_description || 'Guía científica de entrenamiento y nutrición deportiva en Pro Fitness Glass.',
      image: articleImage,
      url: `${BASE_URL}/noticias/${slug}`,
      type: 'article',
      category: article.category,
      datePublished: article.published_at || article.createdAt,
      dateModified: article.updatedAt || article.published_at || article.createdAt
    });

    articleHtml = articleHtml.replace(/<div id="root">[\s\S]*?<\/div>(\s*<noscript>)/i, `<div id="root">${articleBodyHtml}</div>$1`);
    articleHtml = articleHtml.replace(/<noscript>[\s\S]*?<\/noscript>/i, `<noscript>${articleBodyHtml}</noscript>`);
    fs.writeFileSync(path.join(articleDir, 'index.html'), articleHtml, 'utf8');
    count++;
  }

  console.log(`[Prerender] ¡Listo! ${count} artículos prerenderizados con contenido semántico completo en dist/noticias/:slug/index.html`);
}

main().catch(err => {
  console.error('[Prerender] Error:', err);
});
