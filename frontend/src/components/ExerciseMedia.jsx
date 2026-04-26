/* frontend/src/components/ExerciseMedia.jsx */
import React, { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useAppTheme } from '../hooks/useAppTheme';

// Base URL para construir las rutas de imágenes/vídeos
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

/**
 * Componente para mostrar la imagen o vídeo del ejercicio.
 * Acepta 'details' (el objeto del ejercicio), 'src' directo, y 'className'.
 */
const ExerciseMedia = ({ details, src, videoSrc, className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const { theme } = useAppTheme();

  // Reseteamos el estado si cambian los detalles del ejercicio
  useEffect(() => {
    setImageError(false);
    setVideoError(false);
  }, [details, src, videoSrc]);

  // --- LÓGICA INTELIGENTE DE EXTRACCIÓN ---
  // Buscamos la imagen en todas las posibles rutas y anidaciones de la app.
  // Priorizamos image_url_start porque es la que trae el nuevo seeder.
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

  // Construcción segura de la URL final
  const getBestImageUrl = (url) => {
    if (!url) return null;
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
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const safeUrl = url.startsWith('/') ? url : `/${url}`;
    return `${BACKEND_BASE_URL}${safeUrl}`;
  };
  
  const videoUrl = getVideoUrl(rawVideoUrl);

  // Lógica de contraste para Oscuro y OLED:
  const isDarkTheme = theme === 'oled' || theme === 'dark';
  const imageBgClass = isDarkTheme ? 'bg-gray-200' : 'bg-bg-secondary';
  
  // Fondo característico para los placeholders
  const placeholderBgClass = 'bg-accent/10 text-accent';

  // Fallback si no hay ningún recurso asignado
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

  // Fallback final si la imagen falla y no hay video
  return (
    <div className={`aspect-video ${placeholderBgClass} rounded-xl overflow-hidden flex items-center justify-center ${className}`}>
      <ImageIcon size={48} className="opacity-60" />
    </div>
  );
};

export default ExerciseMedia;