/* frontend/src/components/UserAvatar.jsx */
import React, { useState } from 'react';
import { User } from 'lucide-react';
import { getUserRoleRingConfig } from '../utils/userRoleUtils';
import useAppStore from '../store/useAppStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_HOST = API_BASE_URL?.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

const SIZE_MAP = {
    6: 'w-6 h-6',
    7: 'w-7 h-7',
    8: 'w-8 h-8',
    9: 'w-9 h-9',
    10: 'w-10 h-10',
    11: 'w-11 h-11',
    12: 'w-12 h-12',
    14: 'w-14 h-14',
    16: 'w-16 h-16',
    20: 'w-20 h-20',
    full: 'w-full h-full'
};

const UserAvatar = ({ 
    user, 
    size = 10, 
    className = "", 
    showRoleRing = true,
    gapClass = "bg-bg-primary dark:bg-[#121214]",
    onClick
}) => {
    const [error, setError] = useState(false);
    const viewerProfile = useAppStore(state => state.userProfile);

    const sizeClass = SIZE_MAP[size] || (typeof size === 'number' ? `w-${size} h-${size}` : 'w-10 h-10');
    const roleConfig = getUserRoleRingConfig(user, viewerProfile);

    const getSecureImageUrl = () => {
        const rawUrl = user?.profile_image_url || user?.avatar || user?.profile_image;
        if (!rawUrl) return null;

        let url = rawUrl;

        // 1. Si es ruta relativa (ej: /uploads/foto.jpg), añadir el host del backend
        if (!url.startsWith('http') && !url.startsWith('blob:')) {
            const separator = url.startsWith('/') ? '' : '/';
            url = `${BACKEND_HOST}${separator}${url}`;
        }

        // 2. FORZAR HTTPS (Solo si NO es localhost)
        const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
        if (!isLocalhost && url.startsWith('http:')) {
            url = url.replace('http:', 'https:');
        }

        return url;
    };

    const imageUrl = getSecureImageUrl();

    // Limpiamos bordes o rings heredados en className que puedan ensuciar el anillo degradado de historias
    const cleanClassName = className
        ? className
            .replace(/\bring-[^\s]+/g, '')
            .replace(/\bborder-[^\s]+/g, '')
            .replace(/\bborder\b/g, '')
            .trim()
        : '';

    // Si no se desea el anillo de historias, renderizar versión plana
    if (!showRoleRing) {
        return (
            <div 
                className={`${sizeClass} rounded-full bg-bg-secondary border border-glass-border flex items-center justify-center overflow-hidden shrink-0 ${className}`}
                onClick={onClick}
            >
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
                        size={size === "full" ? 32 : Math.round(typeof size === 'number' ? size * 2.5 : 20)}
                        className="text-text-secondary opacity-50"
                    />
                )}
            </div>
        );
    }

    // Renderizado con borde estilo Historias de Instagram diferenciado por rol:
    // 1. Borde exterior con degradado del rol (Admin: Rojo | Entrenador: Azul | Asesoría: Dorado | Normal: Verde)
    // 2. Separación circular interior (gap) que crea el efecto icónico de Instagram
    // 3. Foto de perfil o icono centrado
    return (
        <div 
            className={`${sizeClass} rounded-full p-[2px] sm:p-[2.5px] ${roleConfig.borderClass} ${roleConfig.glowClass} flex items-center justify-center shrink-0 transition-transform duration-300 relative select-none ${cleanClassName}`}
            title={`${user?.username || 'Usuario'} (${roleConfig.title})`}
            onClick={onClick}
        >
            <div className={`w-full h-full rounded-full p-[1.5px] sm:p-[2px] ${gapClass} flex items-center justify-center overflow-hidden`}>
                <div className="w-full h-full rounded-full bg-bg-secondary flex items-center justify-center overflow-hidden">
                    {!error && imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={user?.username || 'User'}
                            className="w-full h-full object-cover rounded-full"
                            onError={() => setError(true)}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <User
                            size={size === "full" ? 32 : Math.round(typeof size === 'number' ? size * 2.2 : 20)}
                            className="text-text-secondary opacity-60"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserAvatar;
