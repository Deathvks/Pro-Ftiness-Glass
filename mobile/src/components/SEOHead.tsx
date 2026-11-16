import { useEffect } from 'react';
import { Platform } from 'react-native';

const BASE_URL = 'https://profitnessglass.es';

interface SEOHeadProps {
  title?: string;
  description?: string;
  route?: string;
  noIndex?: boolean;
}

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

function upsertCanonical(href: string) {
  if (typeof document === 'undefined') return;
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export function SEOHead({ title, description, route, noIndex = false }: SEOHeadProps) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    let path = route;
    if (!path && typeof window !== 'undefined') {
      path = window.location.pathname;
    }
    if (path && !path.startsWith('/')) {
      path = `/${path}`;
    }

    let canonicalUrl = `${BASE_URL}${path || ''}`.split('?')[0].replace(/([^:]\/)\/+/g, '$1');
    if (canonicalUrl.endsWith('/') && canonicalUrl !== `${BASE_URL}/`) {
      canonicalUrl = canonicalUrl.slice(0, -1);
    }

    if (title) document.title = title;
    if (description) upsertMetaTag('name', 'description', description);
    upsertMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    upsertCanonical(canonicalUrl);
    upsertMetaTag('property', 'og:url', canonicalUrl);
  }, [title, description, route, noIndex]);

  return null;
}

export default SEOHead;
