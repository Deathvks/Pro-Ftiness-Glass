import React, { useState } from 'react';
import { User } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// Obtener el dominio base (ej: https://mi-api.com)
const BACKEND_HOST = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

const UserAvatar = ({ user, size = 10, className = "" }) => {
    const [error, setError] = useState(false);
    const sizeClass = `w-${size} h-${size}`;

    const getSecureImageUrl = () => {
        if (!user?.profile_image_url) return null;

        let url = user.profile_image_url;

        // 1. Si es ruta relativa, añadir host
        if (!url.startsWith('http')) {
            url = `${BACKEND_HOST}${url.startsWith('/') ? '' : '/'}${url}`;
        }

        // 2. FORZAR HTTPS: Si la url es http, cambiar a https
        if (url.startsWith('http:')) {
            url = url.replace('http:', 'https:');
        }

        return url;
    };

    const imageUrl = getSecureImageUrl();

    return (
        <div className={`${sizeClass} rounded-full bg-bg-secondary border border-glass-border flex items-center justify-center overflow-hidden shrink-0 ${className}`}>
            {!error && imageUrl ? (
                <img
                    src={imageUrl}
                    alt={user?.username || 'User'}
                    className="w-full h-full object-cover"
                    onError={() => setError(true)}
                    loading="lazy"
                />
            ) : (
                <User size={Math.round(size * 0.6)} className="text-text-secondary opacity-50" />
            )}
        </div>
    );
};

export default UserAvatar;