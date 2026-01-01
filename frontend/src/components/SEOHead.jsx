/* frontend/src/components/SEOHead.jsx */
import React from 'react';
import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://pro-fitness-glass.zeabur.app';

export default function SEOHead({ title, description, route }) {
    const path = (!route || route === 'dashboard') ? '' : route;
    const canonicalUrl = `${BASE_URL}/${path}`.replace(/([^:]\/)\/+/g, '$1');

    return (
        <Helmet>
            {title && <title>{title}</title>}
            {description && <meta name="description" content={description} />}
            <link rel="canonical" href={canonicalUrl} />
            <meta property="og:url" content={canonicalUrl} />
        </Helmet>
    );
}