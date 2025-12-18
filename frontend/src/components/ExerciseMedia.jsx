/* frontend/src/components/ExerciseMedia.jsx */
import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useAppTheme } from '../hooks/useAppTheme';

// Base URL para construir las rutas de imágenes/vídeos
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

/**
 * Componente para mostrar la imagen o vídeo del ejercicio.
 * Acepta 'details' (con image_url, video_url) y 'className' para estilos extra.
 */
const ExerciseMedia = ({ details, className = '' }) => {
  const [mediaError, setMediaError] = useState(false);
  const { theme } = useAppTheme();

  const getMediaUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${BACKEND_BASE_URL}${url}`;
  };

  const videoUrl = getMediaUrl(details?.video_url);
  const imageUrl = getMediaUrl(details?.image_url);

  // Lógica de contraste para OLED:
  // Si el tema es 'oled', las siluetas negras necesitan un fondo claro (gris) para verse.
  // En otros temas, usamos el fondo secundario estándar.
  const isOled = theme === 'oled';
  const imageBgClass = isOled ? 'bg-gray-200' : 'bg-bg-secondary';
  const placeholderBgClass = 'bg-bg-secondary'; // El placeholder usa iconos del sistema (colores controlados), puede quedarse oscuro.

  // Fallback si no hay media
  if (mediaError || !details || (!imageUrl && !videoUrl)) {
    return (
      <div className={`aspect-video ${placeholderBgClass} rounded-xl overflow-hidden flex items-center justify-center text-text-muted ${className}`}>
        <ImageIcon size={48} />
      </div>
    );
  }

  if (videoUrl) {
    return (
      <video
        key={videoUrl}
        // Los vídeos suelen tener su propio fondo/iluminación, mantenemos bg-bg-secondary para evitar destellos blancos
        className={`aspect-video object-contain rounded-xl overflow-hidden bg-bg-secondary ${className}`}
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        onError={() => setMediaError(true)}
      >
        Tu navegador no soporta el tag de vídeo.
      </video>
    );
  }

  if (imageUrl) {
    // Aplicamos el fondo calculado (gris claro en OLED, estándar en otros)
    const imageClasses = `aspect-video object-contain rounded-xl overflow-hidden ${imageBgClass} ${className}`;

    return (
      <img
        src={imageUrl}
        alt={`Demostración de ${details.name}`}
        className={imageClasses}
        onError={() => setMediaError(true)}
        loading="lazy"
      />
    );
  }

  // Fallback final
  return (
    <div className={`aspect-video ${placeholderBgClass} rounded-xl overflow-hidden flex items-center justify-center text-text-muted ${className}`}>
      <ImageIcon size={48} />
    </div>
  );
};

export default ExerciseMedia;