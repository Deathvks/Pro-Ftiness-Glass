/* frontend/src/components/SEOHead.jsx */
import React from 'react';
import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://pro-fitness-glass.zeabur.app';

export default function SEOHead({ title, description, route }) {
    // CORRECCIÓN: Usar la ruta real del navegador (window.location.pathname)
    // Esto asegura que la etiqueta canónica coincida exactamente con la URL que Google está rastreando,
    // evitando el error "Google ha elegido una versión canónica diferente".
    let path = typeof window !== 'undefined' ? window.location.pathname : '';

    // Fallback: Si por alguna razón no hay window (raro en SPA), usamos el prop 'route'
    if (!path && route) {
        path = (route === 'dashboard') ? '/' : `/${route}`;
    }

    // Aseguramos que path empiece con / para concatenar correctamente
    if (path && !path.startsWith('/')) {
        path = `/${path}`;
    }

    // Construcción de la URL completa
    // Replace corrige dobles barras accidentales (ej: .app//dashboard -> .app/dashboard)
    let canonicalUrl = `${BASE_URL}${path}`.replace(/([^:]\/)\/+/g, '$1');

    // Opcional: Quitar barra final (trailing slash) si no es la raíz, para consistencia SEO
    if (canonicalUrl.endsWith('/') && canonicalUrl !== `${BASE_URL}/`) {
        canonicalUrl = canonicalUrl.slice(0, -1);
    }

    return (
        <Helmet>
            {title && <title>{title}</title>}
            {description && <meta name="description" content={description} />}
            <link rel="canonical" href={canonicalUrl} />
            <meta property="og:url" content={canonicalUrl} />
        </Helmet>
    );
}