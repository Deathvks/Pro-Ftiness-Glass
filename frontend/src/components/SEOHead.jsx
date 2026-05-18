/* frontend/src/components/SEOHead.jsx */
import React, { useEffect, useState } from 'react';
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

    const [themeColor, setThemeColor] = useState('#1e293b');

    useEffect(() => {
        const updateThemeColor = () => {
            if (typeof document !== 'undefined') {
                const isOled = document.documentElement.classList.contains('oled-theme');
                const isLight = document.documentElement.classList.contains('light-theme');
                
                if (isOled) {
                    setThemeColor('#000000');
                } else if (isLight) {
                    setThemeColor('#ffffff');
                } else {
                    setThemeColor('#1e293b');
                }
            }
        };

        updateThemeColor();
        
        const observer = new MutationObserver(updateThemeColor);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

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

            <meta name="theme-color" content={themeColor} />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        </Helmet>
    );
}