/* frontend/src/components/ExerciseMedia.jsx */
import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

// Base URL para construir las rutas de imágenes/vídeos
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

/**
 * Componente para mostrar la imagen o vídeo del ejercicio.
 * Acepta 'details' (con image_url, video_url) y 'className' para estilos extra.
 */
const ExerciseMedia = ({ details, className = '' }) => {
  const [mediaError, setMediaError] = useState(false);

  const getMediaUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${BACKEND_BASE_URL}${url}`;
  };

  const videoUrl = getMediaUrl(details?.video_url);
  const imageUrl = getMediaUrl(details?.image_url);

  // Fallback si no hay media
  if (mediaError || !details || (!imageUrl && !videoUrl)) {
    return (
      // Añadido 'rounded-xl overflow-hidden' para bordes redondeados
      <div className={`aspect-video bg-bg-secondary rounded-xl overflow-hidden flex items-center justify-center text-text-muted ${className}`}>
        <ImageIcon size={48} />
      </div>
    );
  }

  if (videoUrl) {
    return (
      <video
        key={videoUrl}
        // Añadido 'rounded-xl overflow-hidden' para bordes redondeados
        className={`aspect-video object-contain rounded-xl overflow-hidden bg-black ${className}`}
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
    // Añadido 'rounded-xl overflow-hidden' para bordes redondeados
    const imageClasses = `aspect-video object-contain rounded-xl overflow-hidden ${className}`;

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
    // Añadido 'rounded-xl overflow-hidden' para bordes redondeados
    <div className={`aspect-video bg-bg-secondary rounded-xl overflow-hidden flex items-center justify-center text-text-muted ${className}`}>
      <ImageIcon size={48} />
    </div>
  );
};

export default ExerciseMedia;