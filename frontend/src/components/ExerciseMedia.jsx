/* frontend/src/components/ExerciseMedia.jsx */
import React, { useState, useEffect, memo } from 'react';
import { Image as ImageIcon } from 'lucide-react';


// Base URL para construir las rutas de imÃƒÂ¡genes/vÃƒÂ­deos
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

/**
 * Componente para mostrar la imagen o vÃƒÂ­deo del ejercicio.
 * Acepta 'details' (el objeto del ejercicio), 'src' directo, y 'className'.
 */
const ExerciseMedia = memo(({ details, src, videoSrc, playYouTube = false, className = '', fitMode = 'cover', forceAuto = false, forceImage = false, disableAnimation = false, transparentBackground = false, fillContain = false, roundedMedia = false }) => {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  

  // --- LÃƒâ€œGICA INTELIGENTE DE EXTRACCIÃƒâ€œN ---
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
  
  if (typeof rawImages === 'string') {
    const trimmed = rawImages.trim();
    if (trimmed.startsWith('[')) {
      try {
        rawImages = JSON.parse(trimmed);
      } catch (e) {
        rawImages = [];
      }
    } else if (trimmed.includes(',')) {
      rawImages = trimmed.split(',').map(s => s.trim());
    } else if (trimmed !== '') {
      rawImages = [trimmed];
    } else {
      rawImages = [];
    }
  } else if (Array.isArray(rawImages)) {
    // CLONE the array so we don't mutate the global Redux store when pushing start/end images
    rawImages = [...rawImages];
  } else {
    rawImages = [];
  }

  // Si no hay imÃƒÂ¡genes, o si las hay, SIEMPRE aseguramos que start y end estÃƒÂ©n si existen.
  // Pero para evitar duplicados, lo validamos despuÃƒÂ©s con el Set.
  if (details?.image_url_start || details?.exercise?.image_url_start || details?.exercise_details?.image_url_start) {
    rawImages.unshift(details.image_url_start || details?.exercise?.image_url_start || details?.exercise_details?.image_url_start);
  }
  if (details?.image_url_end || details?.exercise?.image_url_end || details?.exercise_details?.image_url_end) {
    rawImages.push(details.image_url_end || details?.exercise?.image_url_end || details?.exercise_details?.image_url_end);
  }

  // SOLUCIÃƒâ€œN: Reseteamos el estado SOLO si cambia de verdad la URL de la imagen o el vÃƒÂ­deo.
  // Evita el parpadeo constante al actualizar series o repeticiones en el objeto details.
  useEffect(() => {
    setImageError(false);
    setVideoError(false);
  }, [rawImageUrl, rawVideoUrl, rawImages?.length]);

  // ConstrucciÃƒÂ³n segura de la URL final
  const getBestImageUrl = (url) => {
    if (!url || url === 'null' || url === 'undefined' || (typeof url === 'string' && url.trim() === '')) return null;
    if (typeof url !== 'string') url = String(url); // En caso de que sea un String object
    if (url.startsWith('http')) return url;
    
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    const filename = cleanUrl.split('/').pop();
    
    // ExpresiÃƒÂ³n regular relajada: Busca el patrÃƒÂ³n UUID en CUALQUIER parte del nombre
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

  // LÃƒÂ³gica de contraste para Oscuro, OLED y Galaxia:
  
  const imageBgClass = 'bg-bg-secondary dark:bg-gray-200';
  
  // Fondo caracterÃƒÂ­stico para los placeholders
  const placeholderBgClass = 'bg-accent/10 text-accent';

  // Fallback directo si no hay ningún recurso asignado (evita renderizar etiquetas vacías)
  if (!finalImageUrl && !videoUrl && !youtubeThumbnail) {
    const isSmallContainer = className && (className.includes('h-full') || className.includes('w-16') || className.includes('w-20') || className.includes('h-16') || className.includes('h-20') || className.includes('w-12') || className.includes('w-14'));
    const hasFixedAspect = className && className.includes('aspect-') && !className.includes('aspect-auto');
    const aspectClass = hasFixedAspect || isSmallContainer ? '' : 'aspect-video min-h-[200px] sm:min-h-[240px]';
    const iconSize = isSmallContainer ? 24 : 64;
    return (
      <div className={`w-full h-full ${aspectClass} ${placeholderBgClass} rounded-[24px] overflow-hidden flex items-center justify-center ${className.replace('aspect-auto', '')}`}>
        <ImageIcon size={iconSize} className="opacity-60" />
      </div>
    );
  }

  // Reproductor interactivo de YouTube
  if (youtubeId && playYouTube) {
    const hasAspectInClass = className && className.includes('aspect-');
    const aspectClass = hasAspectInClass ? '' : 'aspect-video';
    return (
      <div className={`${aspectClass} w-full h-full rounded-xl overflow-hidden bg-black ${className}`}>
        <iframe
          key={youtubeId}
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&disablekb=1&fs=0&loop=1&playlist=${youtubeId}`}
          className="w-full h-full border-none pointer-events-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Renderizado de vÃƒÂ­deo (no YouTube directo a <video>)
  if (videoUrl && !videoError && !youtubeId) {
    return (
      <video
        key={videoUrl}
        className={`w-full h-auto min-h-[200px] max-h-[70vh] overflow-hidden bg-transparent ${className}`}
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        onError={() => setVideoError(true)}
      >
        Tu navegador no soporta el tag de vÃƒÂ­deo.
      </video>
    );
  }

  // Renderizado de imagen (o miniatura de YouTube si no hay imagen propia)
  const imageToRender = finalImageUrl || (finalImagesUrls.length > 0 ? finalImagesUrls[0] : youtubeThumbnail);
  
  if ((imageToRender || finalImagesUrls.length > 0) && !imageError) {
    const isAuto = fitMode === 'auto' || forceAuto;
    const aspectRatioClass = isAuto ? 'w-full h-auto min-h-[200px] max-h-[70vh]' : 'w-full h-full';
    
    const finalBgClass = fitMode === 'cover' || transparentBackground ? 'bg-transparent' : 'bg-black/5 dark:bg-white/5';
    const containerClasses = `${aspectRatioClass} relative rounded-[24px] overflow-hidden ${finalBgClass} flex items-center justify-center ${className}`;

    // LÃƒÂ³gica mÃƒÂ¡gica para eliminar el fondo blanco de los dibujos de Wger
    const getImageBlendClass = (url) => {
      if (!url) return '';
      if (url === youtubeThumbnail) return 'object-cover';
      
      let blendClass = isAuto ? 'object-contain' : `object-${fitMode}`;
      if (url.includes('wger.de')) {
        blendClass = 'object-contain'; // Los dibujos de WGER siempre deben hacer 'contain' para no cortarse
        blendClass += ' mix-blend-multiply dark:invert dark:hue-rotate-180 dark:mix-blend-screen';
      }
      return blendClass;
    };

    const isContain = fitMode === 'contain' || (imageToRender && imageToRender.includes('wger.de'));
    const imageRadiusClass = roundedMedia ? 'rounded-[20px]' : '';
    const imgBaseClass = isAuto 
      ? 'w-full h-auto' 
      : (isContain
          ? `absolute inset-0 ${fillContain ? 'w-full h-full' : 'm-auto max-w-[90%] max-h-[90%]'} object-contain ${imageRadiusClass}`
          : `absolute inset-0 w-full h-full ${imageRadiusClass}`);

    if (finalImagesUrls.length > 0) {
      const hasMultiple = finalImagesUrls.length > 1 && !disableAnimation;
      const totalDuration = finalImagesUrls.length * 2; // 2 seconds per frame
      
      return (
        <div className={containerClasses}>
          {hasMultiple && (
            <style>{`
              @keyframes slideCycle_${finalImagesUrls.length} {
                0% { opacity: 1; z-index: 20; }
                ${(1.8 / totalDuration) * 100}% { opacity: 1; z-index: 20; }
                ${(2 / totalDuration) * 100}% { opacity: 0; z-index: 0; }
                100% { opacity: 0; z-index: 0; }
              }
            `}</style>
          )}
          {finalImagesUrls.map((url, idx) => {
            const isUrlContain = fitMode === 'contain' || url.includes('wger.de');
            const posClass = isAuto && idx === 0 ? 'relative' : 'absolute inset-0';
            const sizeClass = isAuto
              ? 'w-full h-auto'
              : (isUrlContain
                  ? `${fillContain ? 'w-full h-full' : 'm-auto max-w-[90%] max-h-[90%]'} object-contain ${imageRadiusClass}`
                  : `w-full h-full ${imageRadiusClass}`);
            
            let visibilityStyle = {};
            let visibilityClass = '';

            if (hasMultiple) {
              visibilityStyle = {
                animation: `slideCycle_${finalImagesUrls.length} ${totalDuration}s infinite ${idx * 2}s`
              };
              visibilityClass = 'opacity-0'; // Will be overridden by animation
            } else {
              visibilityClass = idx === 0 ? 'opacity-100 z-20' : 'opacity-0 z-0 hidden';
            }

            return (
              <img
                key={idx}
                src={url}
                alt={`DemostraciÃƒÂ³n de ${details?.name || 'ejercicio'} - slide ${idx}`}
                className={`${posClass} ${sizeClass} transition-opacity duration-500 ease-in-out ${getImageBlendClass(url)} ${visibilityClass}`}
                style={visibilityStyle}
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
          alt={`DemostraciÃƒÂ³n de ${details?.name || 'ejercicio'}`}
          className={`${imgBaseClass} transition-opacity duration-500 ${getImageBlendClass(imageToRender)}`}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback final si la imagen falla y no hay video (onError activado)
  const isSmallContainer = className && (className.includes('h-full') || className.includes('w-16') || className.includes('w-20') || className.includes('h-16') || className.includes('h-20') || className.includes('w-12') || className.includes('w-14'));
  const hasFixedAspect = className && className.includes('aspect-') && !className.includes('aspect-auto');
  const aspectClass = hasFixedAspect || isSmallContainer ? '' : 'aspect-video min-h-[200px] sm:min-h-[240px]';
  const iconSize = isSmallContainer ? 24 : 64;
  return (
    <div className={`w-full h-full ${aspectClass} ${placeholderBgClass} rounded-[24px] overflow-hidden flex items-center justify-center ${className.replace('aspect-auto', '')}`}>
      <ImageIcon size={iconSize} className="opacity-60" />
    </div>
  );
}, (prevProps, nextProps) => {
  // SOLUCIÃƒâ€œN: Comparador estricto para React.memo. 
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
         prevProps.fitMode === nextProps.fitMode &&
         prevProps.transparentBackground === nextProps.transparentBackground &&
         prevProps.fillContain === nextProps.fillContain &&
         prevProps.roundedMedia === nextProps.roundedMedia &&
         extractMedia(prevProps.details) === extractMedia(nextProps.details);
});

export default ExerciseMedia;
