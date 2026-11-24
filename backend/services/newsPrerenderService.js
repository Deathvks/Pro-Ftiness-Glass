/* backend/services/newsPrerenderService.js */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import models from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistDir = path.resolve(__dirname, '../../frontend/dist');
const frontendIndexPath = path.join(frontendDistDir, 'index.html');
const prerenderScriptPath = path.resolve(__dirname, '../../frontend/scripts/prerenderNews.js');

let cachedModule = null;
let cachedIndexHtml = null;
let cachedIndexMtimeMs = 0;

let syncRunning = false;
let syncPending = false;
let debounceTimer = null;

async function loadPrerenderModule() {
  if (cachedModule) return cachedModule;
  if (!fs.existsSync(prerenderScriptPath)) return null;
  cachedModule = await import(pathToFileURL(prerenderScriptPath).href);
  return cachedModule;
}

function getBaseDistHtml() {
  if (!fs.existsSync(frontendIndexPath)) return null;
  const stat = fs.statSync(frontendIndexPath);
  if (!cachedIndexHtml || stat.mtimeMs !== cachedIndexMtimeMs) {
    cachedIndexHtml = fs.readFileSync(frontendIndexPath, 'utf8');
    cachedIndexMtimeMs = stat.mtimeMs;
  }
  return cachedIndexHtml;
}

/**
 * Ejecuta una sincronización incremental en frontend/dist/noticias y dist/rss.xml
 * usando los artículos publicados actuales de MySQL sin alterar archivos fuente en git.
 */
export async function syncNewsPrerenderNow(reason = 'manual') {
  if (syncRunning) {
    syncPending = true;
    return { queued: true };
  }
  syncRunning = true;
  try {
    const mod = await loadPrerenderModule();
    if (!mod?.prerenderNewsArtifacts || !fs.existsSync(frontendIndexPath)) {
      return { skipped: true };
    }
    const articles = await models.News.findAll({
      where: { is_published: true },
      order: [['published_at', 'DESC'], ['createdAt', 'DESC']],
      raw: true,
    });
    const result = await mod.prerenderNewsArtifacts({ articles, distOnly: true });
    console.log(`[NewsPrerender:${reason}] Sincronizados ${result.count} artículos (${result.removed || 0} obsoletos eliminados).`);
    return result;
  } catch (err) {
    console.warn(`[NewsPrerender:${reason}] Error sincronizando dist:`, err.message);
    return { error: err.message };
  } finally {
    syncRunning = false;
    if (syncPending) {
      syncPending = false;
      scheduleNewsPrerender('queued_followup', 100);
    }
  }
}

/**
 * Programa en segundo plano la regeneración incremental de dist/noticias/*.
 */
export function scheduleNewsPrerender(reason = 'update', delayMs = 250) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    syncNewsPrerenderNow(reason).catch(() => {});
  }, delayMs);
}

/**
 * Responde dinámicamente en /noticias y /noticias/:slug para:
 * 1) Servir artículos recién publicados incluso antes de cualquier rebuild.
 * 2) Responder HTTP 404 real con noindex en slugs inexistentes (evitando Soft 404).
 */
export async function serveDynamicNewsHtml(req, res, next) {
  try {
    const mod = await loadPrerenderModule();
    const baseHtml = getBaseDistHtml();
    const rawSlug = typeof req.params.slug === 'string' ? req.params.slug.trim() : '';

    if (!rawSlug) {
      const articles = await models.News.findAll({
        where: { is_published: true },
        order: [['published_at', 'DESC'], ['createdAt', 'DESC']],
        attributes: ['slug', 'title', 'summary', 'image_url', 'category', 'published_at', 'createdAt', 'updatedAt'],
        raw: true,
      });
      if (!mod?.buildNewsIndexHtml || !baseHtml) {
        return res.status(200).json({ count: articles.length });
      }
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(200).type('html').send(mod.buildNewsIndexHtml(baseHtml, articles));
    }

    const article = /^[a-zA-Z0-9_-]+$/.test(rawSlug)
      ? await models.News.findOne({ where: { slug: rawSlug, is_published: true }, raw: true })
      : null;

    if (!article) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('X-Robots-Tag', 'noindex, nofollow');
      if (mod?.buildNotFoundNewsHtml && baseHtml) {
        return res.status(404).type('html').send(mod.buildNotFoundNewsHtml(baseHtml));
      }
      return res.status(404).type('html').send(
        '<!doctype html><html lang="es"><head><meta charset="UTF-8"><title>Artículo no encontrado | Pro Fitness Glass</title><meta name="robots" content="noindex, nofollow"></head><body style="background:#0f172a;color:#f8fafc;font-family:system-ui,sans-serif;text-align:center;padding:4rem 1rem"><h1>Artículo no encontrado</h1><p><a href="/noticias" style="color:#38bdf8">Volver a Noticias</a></p></body></html>'
      );
    }

    scheduleNewsPrerender(`on_demand:${rawSlug}`, 100);
    if (!mod?.buildArticleHtml || !baseHtml) {
      return res.redirect(302, `/noticias/${encodeURIComponent(article.slug)}`);
    }
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).type('html').send(mod.buildArticleHtml(baseHtml, article, article.content));
  } catch (err) {
    return next(err);
  }
}
