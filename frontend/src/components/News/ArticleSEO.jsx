/* frontend/src/components/News/ArticleSEO.jsx */
import React from 'react';
import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://pro-fitness-glass.zeabur.app';

export default function ArticleSEO({ article }) {
  if (!article) return null;

  const canonicalUrl = `${BASE_URL}/noticias/${article.slug}`;
  const title = `${article.seo_title || article.title} | Pro Fitness Glass`;
  const description = article.seo_description || article.summary;
  const image = article.image_url || `${BASE_URL}/logo.webp`;
  const publishedDate = article.published_at ? new Date(article.published_at).toISOString() : new Date().toISOString();
  const modifiedDate = article.updatedAt ? new Date(article.updatedAt).toISOString() : publishedDate;

  // Schema.org NewsArticle Structured Data
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    'headline': article.title,
    'description': description,
    'image': [image],
    'datePublished': publishedDate,
    'dateModified': modifiedDate,
    'author': {
      '@type': 'Person',
      'name': article.author_name || 'Equipo Pro Fitness Glass',
      'url': BASE_URL,
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Pro Fitness Glass',
      'logo': {
        '@type': 'ImageObject',
        'url': `${BASE_URL}/logo.webp`,
      },
    },
    'articleSection': article.category || 'Fitness',
    'keywords': article.tags || 'fitness, nutricion, entrenamiento',
  };

  // Schema.org BreadcrumbList
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Inicio',
        'item': BASE_URL,
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Noticias',
        'item': `${BASE_URL}/noticias`,
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': article.category || 'Artículo',
        'item': `${BASE_URL}/noticias?category=${encodeURIComponent(article.category || '')}`,
      },
      {
        '@type': 'ListItem',
        'position': 4,
        'name': article.title,
        'item': canonicalUrl,
      },
    ],
  };

  return (
    <Helmet>
      {/* Primarios */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />

      {/* Open Graph (Facebook, WhatsApp, LinkedIn) */}
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content="Pro Fitness Glass" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="es_ES" />
      <meta property="article:published_time" content={publishedDate} />
      <meta property="article:modified_time" content={modifiedDate} />
      <meta property="article:section" content={article.category || 'Fitness'} />
      {article.author_name && <meta property="article:author" content={article.author_name} />}
      {article.tags && <meta property="article:tag" content={article.tags} />}

      {/* Twitter Cards (X) */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:domain" content="pro-fitness-glass.zeabur.app" />

      {/* Google Structured Data JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(articleSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
    </Helmet>
  );
}
