import { useEffect } from 'react';
import { Platform } from 'react-native';

import { BACKEND_BASE_URL } from '@/services/apiClient';
import type { NewsArticle } from '@/services/newsService';

const BASE_URL = 'https://profitnessglass.es';

function upsertMetaTag(attrName: 'name' | 'property', attrValue: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLinkTag(rel: string, href: string, hreflang?: string) {
  if (typeof document === 'undefined') return;
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]`;
  let el = document.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    if (hreflang) el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.href = href;
}

function upsertJsonLdScript(id: string, payload: unknown) {
  if (typeof document === 'undefined') return;
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(payload);
}

function isOrganizationAuthor(authorName = '') {
  const n = authorName.trim().toLowerCase();
  if (!n) return true;
  return (
    n.includes('pro fitness') ||
    n.includes('equipo') ||
    n.includes('editorial') ||
    n.includes('redacci') ||
    n.includes('nutricionista')
  );
}

export function ArticleSEO({ article }: { article?: Partial<NewsArticle> & Record<string, any> | null }) {
  useEffect(() => {
    if (!article || Platform.OS !== 'web' || typeof document === 'undefined') return;

    const canonicalUrl = `${BASE_URL}/noticias/${article.slug}`;
    const title = `${article.seo_title || article.title} | Pro Fitness Glass`;
    const description = article.seo_description || article.summary || '';
    const rawImg = article.image_url || '';
    const image = rawImg.startsWith('http')
      ? rawImg
      : rawImg
        ? `${BACKEND_BASE_URL}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`
        : `${BASE_URL}/og-preview.jpg`;

    const publishedDate = article.published_at
      ? new Date(article.published_at).toISOString()
      : new Date().toISOString();
    const modifiedDate = article.updatedAt
      ? new Date(article.updatedAt).toISOString()
      : publishedDate;
    const authorName = String(article.author_name || 'Equipo Editorial Pro Fitness Glass').trim();
    const category = article.category || 'Fitness';

    document.title = title;
    if (description) upsertMetaTag('name', 'description', description);
    upsertMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1');
    upsertLinkTag('canonical', canonicalUrl);
    upsertLinkTag('alternate', canonicalUrl, 'es');
    upsertLinkTag('alternate', canonicalUrl, 'x-default');
    upsertMetaTag('property', 'og:type', 'article');
    upsertMetaTag('property', 'og:site_name', 'Pro Fitness Glass');
    upsertMetaTag('property', 'og:title', title);
    upsertMetaTag('property', 'og:description', description);
    upsertMetaTag('property', 'og:url', canonicalUrl);
    upsertMetaTag('property', 'og:image', image);
    upsertMetaTag('property', 'og:locale', 'es_ES');
    upsertMetaTag('property', 'article:published_time', publishedDate);
    upsertMetaTag('property', 'article:modified_time', modifiedDate);
    upsertMetaTag('name', 'twitter:card', 'summary_large_image');
    upsertMetaTag('name', 'twitter:title', title);
    upsertMetaTag('name', 'twitter:description', description);
    upsertMetaTag('name', 'twitter:image', image);

    upsertJsonLdScript('pfg-article-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'Article',
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
      headline: article.title,
      description,
      image: [image],
      datePublished: publishedDate,
      dateModified: modifiedDate,
      inLanguage: 'es-ES',
      author: {
        '@type': isOrganizationAuthor(authorName) ? 'Organization' : 'Person',
        name: authorName,
        url: BASE_URL,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Pro Fitness Glass',
        logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.webp` },
      },
      articleSection: category,
      keywords: article.tags || 'fitness, nutricion, entrenamiento',
    });

    upsertJsonLdScript('pfg-breadcrumb-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: 'Noticias', item: `${BASE_URL}/noticias` },
        { '@type': 'ListItem', position: 3, name: category, item: `${BASE_URL}/noticias?category=${encodeURIComponent(category)}` },
        { '@type': 'ListItem', position: 4, name: article.title, item: canonicalUrl },
      ],
    });
  }, [article]);

  return null;
}

export default ArticleSEO;
