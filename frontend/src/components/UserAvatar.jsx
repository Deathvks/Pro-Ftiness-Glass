/* frontend/src/components/UserAvatar.jsx */
import React, { useState } from 'react';
import { User } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// Obtener el dominio base (ej: https://mi-api.com o http://localhost:5000)
const BACKEND_HOST = API_BASE_URL?.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

const UserAvatar = ({ user, size = 10, className = "" }) => {
    const [error, setError] = useState(false);

    // Mapeo seguro de tamaños para Tailwind (por si acaso no compila las clases dinámicas)
    // Si size es "full", usará w-full h-full
    const sizeClass = size === "full" ? "w-full h-full" : `w-${size} h-${size}`;

    const getSecureImageUrl = () => {
        if (!user?.profile_image_url) return null;

        let url = user.profile_image_url;

        // 1. Si es ruta relativa (ej: /uploads/foto.jpg), añadir el host del backend
        if (!url.startsWith('http') && !url.startsWith('blob:')) {
            // Aseguramos que haya una barra entre el host y la ruta
            const separator = url.startsWith('/') ? '' : '/';
            url = `${BACKEND_HOST}${separator}${url}`;
        }

        // 2. FORZAR HTTPS (Solo si NO es localhost)
        // Esto es crucial: en desarrollo (localhost) necesitamos HTTP.
        const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');

        if (!isLocalhost && url.startsWith('http:')) {
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
                    referrerPolicy="no-referrer"
                />
            ) : (
                <User
                    // Si el tamaño es "full" o muy grande, ajustamos el icono
                    size={size === "full" ? 32 : Math.round(typeof size === 'number' ? size * 2.5 : 20)}
                    className="text-text-secondary opacity-50"
                />
            )}
        </div>
    );
};

export default UserAvatar;