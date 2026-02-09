/* frontend/src/components/SEOHead.jsx */
import React from 'react';
import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://pro-fitness-glass.zeabur.app';

export default function SEOHead({ title, description, route, noIndex = false }) {
    // 1. Priorizamos 'route' explícito para forzar la URL limpia (solución canónica).
    // Si no viene, usamos window.location pero limpiamos query params (?id=...)
    let path = route;
    
    if (!path && typeof window !== 'undefined') {
        path = window.location.pathname;
    }

    // 2. Aseguramos barra inicial
    if (path && !path.startsWith('/')) {
        path = `/${path}`;
    }

    // 3. Construcción URL: Base + Path (sin query params)
    // El replace limpia dobles barras accidentales (ej: .app//ruta)
    let canonicalUrl = `${BASE_URL}${path || ''}`.split('?')[0].replace(/([^:]\/)\/+/g, '$1');

    // 4. Quitar trailing slash final para consistencia (evita duplicidad /ruta/ vs /ruta)
    if (canonicalUrl.endsWith('/') && canonicalUrl !== `${BASE_URL}/`) {
        canonicalUrl = canonicalUrl.slice(0, -1);
    }

    return (
        <Helmet>
            {title && <title>{title}</title>}
            {description && <meta name="description" content={description} />}
            
            {/* Control de indexación para páginas privadas */}
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