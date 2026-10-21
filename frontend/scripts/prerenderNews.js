/* frontend/scripts/prerenderNews.js */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
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

async function fetchArticles() {
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
        console.log(`[Prerender] Obtenidos ${data.news.length} artículos desde la API.`);
        return data.news;
      }
    }
  } catch (err) {
    console.warn('[Prerender] No se pudo consultar la API remota:', err.message);
  }

  // Fallback a cachedNews.json
  const cachePath = path.resolve(__dirname, '../src/data/cachedNews.json');
  if (fs.existsSync(cachePath)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      if (Array.isArray(cached) && cached.length > 0) {
        console.log(`[Prerender] Usando ${cached.length} artículos desde el caché local.`);
        return cached;
      }
    } catch (e) {
      console.warn('[Prerender] Error leyendo caché local:', e.message);
    }
  }

  return [];
}

function injectMeta(html, { title, description, image, url, type = 'article', category = 'Fitness' }) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeImg = escapeHtml(image);
  const safeUrl = escapeHtml(url);

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

  // Inyectar Schema.org específico para Article
  if (type === 'article') {
    const articleJsonLd = `\n  <script type="application/ld+json">\n  {\n    "@context": "https://schema.org",\n    "@type": "Article",\n    "headline": ${JSON.stringify(title)},\n    "description": ${JSON.stringify(description)},\n    "image": [${JSON.stringify(image)}],\n    "mainEntityOfPage": {\n      "@type": "WebPage",\n      "@id": ${JSON.stringify(url)}\n    },\n    "publisher": {\n      "@type": "Organization",\n      "name": "Pro Fitness Glass",\n      "logo": {\n        "@type": "ImageObject",\n        "url": "${BASE_URL}/logo.webp"\n      }\n    }\n  }\n  </script>`;
    output = output.replace('</head>', `${articleJsonLd}\n</head>`);
  }

  return output;
}

async function main() {
  if (!fs.existsSync(indexPath)) {
    console.error('[Prerender] Error: dist/index.html no existe. Ejecuta primero vite build.');
    return;
  }

  const baseHtml = fs.readFileSync(indexPath, 'utf8');

  // 1. Prerender de la sección principal /noticias
  const newsIndexDir = path.join(distDir, 'noticias');
  if (!fs.existsSync(newsIndexDir)) fs.mkdirSync(newsIndexDir, { recursive: true });
  const newsIndexHtml = injectMeta(baseHtml, {
    title: 'Noticias y Guías de Élite de Fitness y Nutrición',
    description: 'Aprende con artículos basados en evidencia científica, optimiza tus comidas y domina tu rendimiento en el gimnasio con Pro Fitness Glass.',
    image: `${BASE_URL}/entrenamiento.png`,
    url: `${BASE_URL}/noticias`,
    type: 'website'
  });
  fs.writeFileSync(path.join(newsIndexDir, 'index.html'), newsIndexHtml, 'utf8');
  console.log('[Prerender] Generado dist/noticias/index.html');

  // 2. Prerender de cada artículo individual
  const articles = await fetchArticles();
  console.log(`[Prerender] Procesando ${articles.length} artículos para OpenGraph y Twitter Cards...`);

  let count = 0;
  for (const article of articles) {
    const slug = (article.slug || '').trim();
    if (!slug) continue;
    // Sanitizar slug para evitar caracteres inválidos en directorios
    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) continue;

    const articleDir = path.join(distDir, 'noticias', slug);
    if (!fs.existsSync(articleDir)) fs.mkdirSync(articleDir, { recursive: true });

    const articleImage = article.image_url || `${BASE_URL}/entrenamiento.png`;
    const articleHtml = injectMeta(baseHtml, {
      title: article.title,
      description: article.summary || article.seo_description || 'Guía científica de entrenamiento y nutrición deportiva en Pro Fitness Glass.',
      image: articleImage,
      url: `${BASE_URL}/noticias/${slug}`,
      type: 'article',
      category: article.category
    });

    fs.writeFileSync(path.join(articleDir, 'index.html'), articleHtml, 'utf8');
    count++;
  }

  console.log(`[Prerender] ¡Listo! ${count} artículos prerenderizados con sus imágenes de portada en dist/noticias/:slug/index.html`);
}

main().catch(err => {
  console.error('[Prerender] Error:', err);
});
