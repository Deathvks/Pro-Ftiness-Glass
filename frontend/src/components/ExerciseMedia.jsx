/* frontend/src/components/ExerciseMedia.jsx */
import React, { useState, useEffect, memo } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useAppTheme } from '../hooks/useAppTheme';

// Base URL para construir las rutas de imágenes/vídeos
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

/**
 * Componente para mostrar la imagen o vídeo del ejercicio.
 * Acepta 'details' (el objeto del ejercicio), 'src' directo, y 'className'.
 */
const ExerciseMedia = memo(({ details, src, videoSrc, className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const { theme } = useAppTheme();

  // --- LÓGICA INTELIGENTE DE EXTRACCIÓN ---
  const rawImageUrl = src || 
    details?.image_url_start || 
    details?.image_url || 
    details?.image || 
    details?.exercise?.image_url_start || 
    details?.exercise?.image_url ||
    details?.exercise_details?.image_url_start ||
    details?.exercise_details?.image_url;

  const rawVideoUrl = videoSrc || 
    details?.video_url || 
    details?.exercise?.video_url ||
    details?.exercise_details?.video_url;

  // SOLUCIÓN: Reseteamos el estado SOLO si cambia de verdad la URL de la imagen o el vídeo.
  // Evita el parpadeo constante al actualizar series o repeticiones en el objeto details.
  useEffect(() => {
    setImageError(false);
    setVideoError(false);
  }, [rawImageUrl, rawVideoUrl]);

  // Construcción segura de la URL final
  const getBestImageUrl = (url) => {
    if (!url || url.trim() === '') return null;
    if (url.startsWith('http')) return url;
    
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    const filename = cleanUrl.split('/').pop();
    
    // Expresión regular relajada: Busca el patrón UUID en CUALQUIER parte del nombre
    const isWgerUuid = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/.test(filename);
    
    if (isWgerUuid || cleanUrl.includes('exercise-images')) {
      return `https://wger.de/media/exercise-images/${filename}`;
    }

    // Si es una imagen normal local, va al backend
    return `${BACKEND_BASE_URL}/${cleanUrl}`;
  };

  const finalImageUrl = getBestImageUrl(rawImageUrl);

  const getVideoUrl = (url) => {
    if (!url || url.trim() === '') return null;
    if (url.startsWith('http')) return url;
    const safeUrl = url.startsWith('/') ? url : `/${url}`;
    return `${BACKEND_BASE_URL}${safeUrl}`;
  };
  
  const videoUrl = getVideoUrl(rawVideoUrl);

  // Lógica de contraste para Oscuro, OLED y Galaxia:
  const isDarkTheme = theme === 'oled' || theme === 'dark' || theme === 'galaxy';
  const imageBgClass = isDarkTheme ? 'bg-gray-200' : 'bg-bg-secondary';
  
  // Fondo característico para los placeholders
  const placeholderBgClass = 'bg-accent/10 text-accent';

  // Fallback directo si no hay ningún recurso asignado (evita renderizar etiquetas vacías)
  if (!finalImageUrl && !videoUrl) {
    return (
      <div className={`aspect-video ${placeholderBgClass} rounded-xl overflow-hidden flex items-center justify-center ${className}`}>
        <ImageIcon size={48} className="opacity-60" />
      </div>
    );
  }

  // Renderizado de vídeo
  if (videoUrl && !videoError) {
    return (
      <video
        key={videoUrl}
        className={`aspect-video object-contain rounded-xl overflow-hidden bg-bg-secondary ${className}`}
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        onError={() => setVideoError(true)}
      >
        Tu navegador no soporta el tag de vídeo.
      </video>
    );
  }

  // Renderizado de imagen
  if (finalImageUrl && !imageError) {
    const imageClasses = `aspect-video object-contain rounded-xl overflow-hidden ${imageBgClass} ${className}`;

    return (
      <img
        key={finalImageUrl}
        src={finalImageUrl}
        alt={`Demostración de ${details?.name || 'ejercicio'}`}
        className={imageClasses}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    );
  }

  // Fallback final si la imagen falla y no hay video (onError activado)
  return (
    <div className={`aspect-video ${placeholderBgClass} rounded-xl overflow-hidden flex items-center justify-center ${className}`}>
      <ImageIcon size={48} className="opacity-60" />
    </div>
  );
}, (prevProps, nextProps) => {
  // SOLUCIÓN: Comparador estricto para React.memo. 
  // Congela el componente si cambian las reps/series pero NO cambia el archivo de imagen.
  const extractMedia = (d) => {
    if (!d) return '';
    return `${d.image_url_start || ''}|${d.image_url || ''}|${d.video_url || ''}|${d.exercise?.image_url_start || ''}`;
  };

  return prevProps.src === nextProps.src &&
         prevProps.videoSrc === nextProps.videoSrc &&
         prevProps.className === nextProps.className &&
         extractMedia(prevProps.details) === extractMedia(nextProps.details);
});

export default ExerciseMedia;