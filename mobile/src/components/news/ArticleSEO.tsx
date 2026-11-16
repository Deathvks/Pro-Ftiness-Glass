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

    document.title = title;
    if (description) upsertMetaTag('name', 'description', description);
    upsertMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1');
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

    let ldScript = document.getElementById('pfg-article-jsonld') as HTMLScriptElement | null;
    if (!ldScript) {
      ldScript = document.createElement('script');
      ldScript.id = 'pfg-article-jsonld';
      ldScript.type = 'application/ld+json';
      document.head.appendChild(ldScript);
    }

    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
      headline: article.title,
      description,
      image: [image],
      datePublished: publishedDate,
      dateModified: modifiedDate,
      author: {
        '@type': 'Person',
        name: article.author_name || 'Equipo Pro Fitness Glass',
        url: BASE_URL,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Pro Fitness Glass',
        logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.webp` },
      },
      articleSection: article.category || 'Fitness',
    };
    ldScript.textContent = JSON.stringify(articleSchema);
  }, [article]);

  return null;
}

export default ArticleSEO;
