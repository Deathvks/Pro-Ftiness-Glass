/* frontend/src/components/SEOHead.jsx */
import React from 'react';
import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://pro-fitness-glass.zeabur.app';

export default function SEOHead({ title, description, route, noIndex = false }) {
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

    return (
        <Helmet>
            {title && <title>{title}</title>}
            {description && <meta name="description" content={description} />}
            
            {noIndex ? (
                <meta name="robots" content="noindex, nofollow" />
            ) : (
                <meta name="robots" content="index, follow" />
            )}

            <link rel="canonical" href={canonicalUrl} />
            <meta property="og:url" content={canonicalUrl} />
        </Helmet>
    );
}