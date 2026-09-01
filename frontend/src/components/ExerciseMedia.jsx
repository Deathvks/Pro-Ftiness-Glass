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
const ExerciseMedia = memo(({ details, src, videoSrc, playYouTube = false, className = '', fitMode = 'cover', forceAuto = false, forceImage = false, disableAnimation = false }) => {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
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

  let rawImages = details?.images || details?.exercise?.images || details?.exercise_details?.images;
  // Si no hay un array válido, construimos uno temporal a partir de las imágenes inicio/fin si existen
  if (!Array.isArray(rawImages) || rawImages.length === 0) {
    rawImages = [];
    if (details?.image_url_start || details?.exercise?.image_url_start || details?.exercise_details?.image_url_start) {
      rawImages.push(details.image_url_start || details?.exercise?.image_url_start || details?.exercise_details?.image_url_start);
    }
    if (details?.image_url_end || details?.exercise?.image_url_end || details?.exercise_details?.image_url_end) {
      rawImages.push(details.image_url_end || details?.exercise?.image_url_end || details?.exercise_details?.image_url_end);
    }
  }

  // SOLUCIÓN: Reseteamos el estado SOLO si cambia de verdad la URL de la imagen o el vídeo.
  // Evita el parpadeo constante al actualizar series o repeticiones en el objeto details.
  useEffect(() => {
    setImageError(false);
    setVideoError(false);
    setCurrentIndex(0);
  }, [rawImageUrl, rawVideoUrl, rawImages?.length]);

  // Construcción segura de la URL final
  const getBestImageUrl = (url) => {
    if (!url || url === 'null' || url === 'undefined' || (typeof url === 'string' && url.trim() === '')) return null;
    if (typeof url !== 'string') url = String(url); // En caso de que sea un String object
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
  const allImagesUrls = Array.isArray(rawImages) ? rawImages.map(getBestImageUrl).filter(Boolean) : [];
  const finalImagesUrls = [...new Set(allImagesUrls)];

  // Ajustar la velocidad en base a la cantidad de imágenes
  const delayMs = Math.max(1500, 3000 - (finalImagesUrls.length * 200));

  useEffect(() => {
    if (finalImagesUrls.length > 1 && !disableAnimation) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % finalImagesUrls.length);
      }, delayMs);
      return () => clearInterval(interval);
    }
  }, [finalImagesUrls.length, delayMs, disableAnimation]);

  const getVideoUrl = (url) => {
    if (!url || url === 'null' || url === 'undefined' || (typeof url === 'string' && url.trim() === '')) return null;
    if (typeof url !== 'string') url = String(url);
    if (url.startsWith('http')) return url;
    const safeUrl = url.startsWith('/') ? url : `/${url}`;
    return `${BACKEND_BASE_URL}${safeUrl}`;
  };

  // Extraer ID de YouTube
  const getYouTubeId = (url) => {
    if (!url || url === 'null' || url === 'undefined') return null;
    if (typeof url !== 'string') url = String(url);
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoUrl = getVideoUrl(rawVideoUrl);
  const youtubeId = getYouTubeId(rawVideoUrl);
  // Use mqdefault.jpg for a native 16:9 aspect ratio without black bars
  const youtubeThumbnail = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null;

  // Lógica de contraste para Oscuro, OLED y Galaxia:
  const isDarkTheme = theme === 'oled' || theme === 'dark' || theme === 'galaxy';
  const imageBgClass = isDarkTheme ? 'bg-gray-200' : 'bg-bg-secondary';
  
  // Fondo característico para los placeholders
  const placeholderBgClass = 'bg-accent/10 text-accent';

  // Fallback directo si no hay ningún recurso asignado (evita renderizar etiquetas vacías)
  if (!finalImageUrl && !videoUrl && !youtubeThumbnail) {
    return (
      <div className={`aspect-video ${placeholderBgClass} rounded-xl overflow-hidden flex items-center justify-center ${className}`}>
        <ImageIcon size={48} className="opacity-60" />
      </div>
    );
  }

  // Reproductor interactivo de YouTube
  if (youtubeId && playYouTube) {
    return (
      <div className={`aspect-video w-full h-full rounded-xl overflow-hidden bg-black ${className}`}>
        <iframe
          key={youtubeId}
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&disablekb=1&fs=0`}
          className="w-full h-full border-none pointer-events-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Renderizado de vídeo (no YouTube directo a <video>)
  if (videoUrl && !videoError && !youtubeId) {
    return (
      <video
        key={videoUrl}
        className={`w-full h-auto max-h-[70vh] rounded-[24px] overflow-hidden bg-transparent ${className}`}
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

  // Renderizado de imagen (o miniatura de YouTube si no hay imagen propia)
  const imageToRender = finalImageUrl || youtubeThumbnail;
  if ((imageToRender || finalImagesUrls.length > 0) && !imageError) {
    // Si es imagen de youtube, forzamos aspect-video para que encaje bien. 
    // Si son imágenes normales, usamos aspect-auto para que adopte la forma real de la foto y el border-radius se aplique a los bordes de la foto.
    const isAuto = fitMode === 'auto';
    const aspectRatioClass = (imageToRender === youtubeThumbnail) 
      ? 'aspect-video' 
      : (isAuto ? 'w-full h-auto max-h-[70vh]' : 'w-full h-full');
    
    // El contenedor no necesita fondo si vamos a hacer que la imagen se fusione
    const finalBgClass = imageToRender === youtubeThumbnail ? 'bg-black' : 'bg-transparent';
    const containerClasses = `${aspectRatioClass} relative rounded-[24px] overflow-hidden ${finalBgClass} flex items-center justify-center ${className}`;

    // Lógica mágica para eliminar el fondo blanco de los dibujos de Wger
    const getImageBlendClass = (url) => {
      if (!url) return '';
      if (url === youtubeThumbnail) return 'object-cover';
      
      let blendClass = isAuto ? 'object-contain' : `object-${fitMode}`;
      if (url.includes('wger.de')) {
        blendClass = 'object-contain'; // Los dibujos de WGER siempre deben hacer 'contain' para no cortarse
        if (isDarkTheme) {
          blendClass += ' filter invert hue-rotate-180 mix-blend-screen';
        } else {
          blendClass += ' mix-blend-multiply';
        }
      }
      return blendClass;
    };

    const isContain = fitMode === 'contain' || (imageToRender && imageToRender.includes('wger.de'));
    const imgBaseClass = isAuto 
      ? 'w-full h-auto' 
      : (isContain ? 'absolute inset-0 m-auto max-w-full max-h-full object-contain' : 'absolute inset-0 w-full h-full');

    if (finalImagesUrls.length > 0) {
      return (
        <div className={containerClasses}>
          {finalImagesUrls.map((url, idx) => {
            const isUrlContain = fitMode === 'contain' || url.includes('wger.de');
            const posClass = isAuto && idx === 0 ? 'relative' : 'absolute inset-0';
            const sizeClass = isAuto ? 'w-full h-auto' : (isUrlContain ? 'm-auto max-w-full max-h-full object-contain' : 'w-full h-full');
            let visibilityClass = 'opacity-0 z-0';
            if (idx === currentIndex) {
              visibilityClass = 'opacity-100 z-20 scale-100 translate-x-0 translate-y-0';
            } else if (disableAnimation && idx === 1) {
              // Efecto "una detrás de otra" (stacked) cuando no hay animación
              visibilityClass = 'opacity-40 z-10 scale-[0.85] translate-x-4 translate-y-2';
            }
            return (
              <img
                key={idx}
                src={url}
                alt={`Demostración de ${details?.name || 'ejercicio'} - slide ${idx}`}
                className={`rounded-[24px] ${posClass} ${sizeClass} transition-all duration-1000 ease-in-out ${getImageBlendClass(url)} ${visibilityClass}`}
                onError={() => setImageError(true)}
                loading="lazy"
              />
            );
          })}
        </div>
      );
    }

    // Fallback a una sola imagen
    return (
      <div className={containerClasses}>
        <img
          key={imageToRender}
          src={imageToRender}
          alt={`Demostración de ${details?.name || 'ejercicio'}`}
          className={`rounded-[24px] ${imgBaseClass} transition-opacity duration-500 ${getImageBlendClass(imageToRender)}`}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>
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
    let imgs = d.images || d.exercise?.images || [];
    let imgsStr = Array.isArray(imgs) ? imgs.join('|') : '';
    return `${d.image_url_start || ''}|${d.image_url_end || ''}|${d.image_url || ''}|${d.video_url || ''}|${d.exercise?.image_url_start || ''}|${imgsStr}`;
  };

  return prevProps.src === nextProps.src &&
         prevProps.videoSrc === nextProps.videoSrc &&
         prevProps.className === nextProps.className &&
         extractMedia(prevProps.details) === extractMedia(nextProps.details);
});

export default ExerciseMedia;