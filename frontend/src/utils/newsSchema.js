/* frontend/src/utils/newsSchema.js */
export const NEWS_BASE_URL = 'https://profitnessglass.es';

/**
 * Determina si el autor corresponde a una firma institucional/editorial
 * en lugar de una persona física individual.
 */
export function isOrganizationAuthor(authorName = '') {
  const normalized = String(authorName || '').trim().toLowerCase();
  if (!normalized) return true;
  return (
    normalized.includes('pro fitness') ||
    normalized.includes('equipo') ||
    normalized.includes('editorial') ||
    normalized.includes('redacci') ||
    normalized.includes('nutricionista')
  );
}

/**
 * Construye el Schema.org Article idéntico para prerenderizado estático y cliente Helmet.
 */
export function buildNewsArticleSchema({
  article = {},
  canonicalUrl,
  description,
  image,
  publishedDate,
  modifiedDate,
}) {
  const authorName = String(article.author_name || 'Equipo Editorial Pro Fitness Glass').trim();
  const safeDesc = description ?? (article.seo_description || article.summary || '');
  const pubIso = publishedDate
    ? new Date(publishedDate).toISOString()
    : article.published_at || article.createdAt
      ? new Date(article.published_at || article.createdAt).toISOString()
      : new Date().toISOString();
  const modIso = modifiedDate
    ? new Date(modifiedDate).toISOString()
    : article.updatedAt
      ? new Date(article.updatedAt).toISOString()
      : pubIso;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    'headline': article.title || '',
    'description': safeDesc,
    'image': image ? [image] : [`${NEWS_BASE_URL}/og-preview.jpg`],
    'datePublished': pubIso,
    'dateModified': modIso,
    'inLanguage': 'es-ES',
    'author': {
      '@type': isOrganizationAuthor(authorName) ? 'Organization' : 'Person',
      'name': authorName,
      'url': NEWS_BASE_URL,
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Pro Fitness Glass',
      'logo': {
        '@type': 'ImageObject',
        'url': `${NEWS_BASE_URL}/logo.webp`,
      },
    },
    'articleSection': article.category || 'Fitness',
    'keywords': article.tags || 'fitness, nutricion, entrenamiento',
  };
}

/**
 * Construye el Schema.org BreadcrumbList del artículo.
 */
export function buildNewsBreadcrumbSchema({ article = {}, canonicalUrl }) {
  const category = article.category || 'Artículo';
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Inicio',
        'item': NEWS_BASE_URL,
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Noticias',
        'item': `${NEWS_BASE_URL}/noticias`,
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': category,
        'item': `${NEWS_BASE_URL}/noticias?category=${encodeURIComponent(category)}`,
      },
      {
        '@type': 'ListItem',
        'position': 4,
        'name': article.title || 'Artículo',
        'item': canonicalUrl,
      },
    ],
  };
}

/**
 * Construye el Schema.org CollectionPage para el índice /noticias.
 */
export function buildNewsCollectionSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': 'Noticias y Artículos de Fitness, Nutrición y Entrenamiento',
    'description': 'Guías científicas, artículos y novedades sobre hipertrofia, dietética deportiva y fitness en Pro Fitness Glass.',
    'url': `${NEWS_BASE_URL}/noticias`,
    'inLanguage': 'es-ES',
    'publisher': {
      '@type': 'Organization',
      'name': 'Pro Fitness Glass',
      'logo': {
        '@type': 'ImageObject',
        'url': `${NEWS_BASE_URL}/logo.webp`,
      },
    },
  };
}
