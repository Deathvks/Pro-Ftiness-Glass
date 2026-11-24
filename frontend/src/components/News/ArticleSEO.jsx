/* frontend/src/components/News/ArticleSEO.jsx */
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { getNewsCoverUrls } from '../../utils/newsCover.js';
import { buildNewsArticleSchema, buildNewsBreadcrumbSchema, NEWS_BASE_URL } from '../../utils/newsSchema.js';

const BASE_URL = NEWS_BASE_URL;

export default function ArticleSEO({ article }) {
  if (!article) return null;

  const canonicalUrl = `${BASE_URL}/noticias/${article.slug}`;
  const title = `${article.seo_title || article.title} | Pro Fitness Glass`;
  const description = article.seo_description || article.summary;
  let image = getNewsCoverUrls(article, BASE_URL + '/api').src;
  if (image && !image.startsWith('http')) {
    image = `${BASE_URL}${image.startsWith('/') ? '' : '/'}${image}`;
  }
  const publishedDate = article.published_at ? new Date(article.published_at).toISOString() : new Date().toISOString();
  const modifiedDate = article.updatedAt ? new Date(article.updatedAt).toISOString() : publishedDate;

  const articleSchema = buildNewsArticleSchema({
    article,
    canonicalUrl,
    description,
    image,
    publishedDate,
    modifiedDate,
  });

  const breadcrumbSchema = buildNewsBreadcrumbSchema({
    article,
    canonicalUrl,
  });

  return (
    <Helmet>
      {/* Primarios */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="es" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />

      {/* Open Graph (Facebook, WhatsApp, LinkedIn) */}
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content="Pro Fitness Glass" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:secure_url" content={image} />
      <meta property="og:image:alt" content={article.title} />
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
      <meta name="twitter:image:alt" content={article.title} />
      <meta name="twitter:domain" content="profitnessglass.es" />

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
