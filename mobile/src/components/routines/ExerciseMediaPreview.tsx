/* mobile/src/components/routines/ExerciseMediaPreview.tsx */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Play, Dumbbell, ExternalLink } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BACKEND_BASE_URL, API_BASE_URL } from '@/services/apiClient';
import { getLocalOfflineMediaUri } from '@/services/offlineExerciseService';
import useAppStore from '@/store/useAppStore';

interface ExerciseMediaPreviewProps {
  item: any;
  details?: any;
  getImageUrl?: (it: any) => string;
  staticOnly?: boolean;
  fitMode?: 'cover' | 'contain';
  playYouTube?: boolean;
  forceImageMode?: boolean;
  showImageCounter?: boolean;
  roundedRadius?: number;
  previewColors?: { background: string; placeholder: string };
  onPress?: () => void;
  onMediaAspectRatio?: (ratio: number, isPortrait: boolean) => void;
}

// Inyección de estilos para adaptar el iframe al contenedor vertical o centrado
const YOUTUBE_INJECTED_CSS = `
  (function() {
    try {
      var style = document.createElement('style');
      style.innerHTML = \`
        html, body {
          width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background-color: #000000 !important;
          overflow: hidden !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .container {
          width: 100% !important;
          height: 100% !important;
          padding-bottom: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .video, iframe, #player {
          width: 100% !important;
          height: 100% !important;
        }
      \`;
      document.head.appendChild(style);
    } catch(e) {}
  })();
  true;
`;

// Plantilla HTML para vídeos directos (MP4 / WebM)
const getDirectVideoHtml = (videoUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background: #000000;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <video src="${videoUrl}" autoplay loop muted playsinline controls></video>
</body>
</html>
`;

const isNonEmptyMedia = (val: any): boolean => {
  if (!val || val === 'null' || val === 'undefined') return false;
  if (typeof val === 'string') {
    const t = val.trim();
    if (!t || t === '[]' || t.includes('/muscle_groups/')) return false;
    return true;
  }
  if (Array.isArray(val)) return val.length > 0;
  return false;
};

export const ExerciseMediaPreview: React.FC<ExerciseMediaPreviewProps> = ({
  item,
  details,
  getImageUrl,
  staticOnly = false,
  fitMode = 'contain',
  playYouTube = false,
  forceImageMode = false,
  showImageCounter = true,
  roundedRadius,
  previewColors,
  onPress,
  onMediaAspectRatio,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(playYouTube);
  const [loadedUris, setLoadedUris] = useState<Record<string, boolean>>({});
  const [failedUris, setFailedUris] = useState<Record<string, boolean>>({});
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [containerSize, setContainerSize] = useState({ width: 320, height: 200 });
  const [imageSlotSize, setImageSlotSize] = useState({ width: 0, height: 0 });
  const [naturalRatio, setNaturalRatio] = useState<number | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const allExercises = useAppStore(state => state.allExercises) || [];

  // Asegurar que el catálogo de ejercicios esté cargado para enriquecer ejercicios de rutinas
  useEffect(() => {
    if (!allExercises || allExercises.length === 0) {
      const fetchAll = useAppStore.getState()?.getOrFetchAllExercises;
      if (typeof fetchAll === 'function') {
        fetchAll().catch(() => {});
      }
    }
  }, [allExercises?.length]);

  useEffect(() => {
    setIsPlaying(Boolean(playYouTube));
    if (playYouTube) {
      setPlayerError(null);
      setWebViewLoading(true);
    }
  }, [playYouTube]);

  const rawTarget = details || item || {};
  const rawSubDetails = rawTarget.exercise_details || rawTarget.exercise || {};

  // Buscar siempre en el catálogo para completar imágenes GIF o vídeo de YouTube si faltan
  const matchedFromStore = useMemo(() => {
    if (!allExercises || allExercises.length === 0) return null;

    const catalogId =
      rawTarget.exercise_list_id ||
      rawTarget.exercise_id ||
      rawSubDetails.id ||
      rawSubDetails.exercise_list_id;

    const targetName = (
      rawTarget.name ||
      rawTarget.exercise_name ||
      rawSubDetails.name ||
      ''
    )
      .trim()
      .toLowerCase();

    return allExercises.find((ex: any) => {
      if (!ex) return false;
      if (
        catalogId !== undefined &&
        catalogId !== null &&
        (String(ex.id) === String(catalogId) ||
          (ex.exercise_list_id && String(ex.exercise_list_id) === String(catalogId)))
      ) {
        return true;
      }
      if (
        rawTarget.id !== undefined &&
        rawTarget.id !== null &&
        !rawTarget.routine_id &&
        String(ex.id) === String(rawTarget.id)
      ) {
        return true;
      }
      if (targetName && ex.name?.trim().toLowerCase() === targetName) {
        return true;
      }
      return false;
    });
  }, [rawTarget, rawSubDetails, allExercises]);

  // Combinar sin que valores nulos/vacíos de la rutina pisen las URLs reales del catálogo
  const target = useMemo(() => {
    if (!matchedFromStore) return rawTarget;
    const merged: Record<string, any> = { ...matchedFromStore };
    Object.keys(rawTarget).forEach(k => {
      const val = rawTarget[k];
      if (val !== null && val !== undefined && val !== '' && val !== 'null') {
        merged[k] = val;
      }
    });
    return merged;
  }, [matchedFromStore, rawTarget]);

  const subDetails = target.exercise_details || target.exercise || {};

  // 1. Extractor y normalizador de ID de YouTube
  const rawVideo =
    target.video_url ||
    target.youtube_id ||
    target.video ||
    target.youtube_url ||
    target.videoUrl ||
    subDetails.video_url ||
    subDetails.youtube_id ||
    subDetails.video ||
    subDetails.youtube_url ||
    subDetails.videoUrl ||
    matchedFromStore?.video_url ||
    matchedFromStore?.youtube_id ||
    '';

  const getYoutubeId = (url?: string | null) => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.replace(/["']/g, '').trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    const match = trimmed.match(
      /(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?.*v=|shorts\/|live\/|&v=)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  const yid = useMemo(() => getYoutubeId(rawVideo), [rawVideo]);
  const youtubeThumbnail = yid ? `https://img.youtube.com/vi/${yid}/mqdefault.jpg` : null;

  // 2. Normalizador de URLs de imágenes
  const getNormalizedUrl = (url: any): string | null => {
    if (
      !url ||
      typeof url !== 'string' ||
      url.trim() === '' ||
      url === 'null' ||
      url === 'undefined'
    ) {
      return null;
    }
    const clean = url.trim();

    if (clean.includes('placeholder') || clean.includes('via.placeholder')) {
      return null;
    }

    if (clean.startsWith('file://')) {
      return clean;
    }

    const localFirst = getLocalOfflineMediaUri(clean);
    if (localFirst) {
      return localFirst;
    }

    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean;
    }

    const path = clean.startsWith('/') ? clean.substring(1) : clean;
    const filename = path.split('/').pop() || '';

    const isWgerUuid =
      /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/.test(
        filename
      );
    const resolved =
      isWgerUuid || path.includes('exercise-images')
        ? `https://wger.de/media/exercise-images/${filename}`
        : `${BACKEND_BASE_URL || API_BASE_URL.replace('/api', '')}/${path}`;

    return getLocalOfflineMediaUri(resolved) || resolved;
  };

  // 3. Extracción de lista completa de imágenes reales (para efecto GIF)
  const images = useMemo(() => {
    const list: string[] = [];

    const pushRawImages = (rawImages: any) => {
      if (!rawImages) return;
      if (Array.isArray(rawImages)) {
        rawImages.forEach((imgItem: any) => {
          if (typeof imgItem === 'string') list.push(imgItem);
          else if (imgItem && typeof imgItem === 'object' && imgItem.image)
            list.push(imgItem.image);
        });
      } else if (typeof rawImages === 'string') {
        const trimmed = rawImages.trim();
        if (trimmed.startsWith('[')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              parsed.forEach((imgItem: any) => {
                if (typeof imgItem === 'string') list.push(imgItem);
                else if (imgItem && typeof imgItem === 'object' && imgItem.image)
                  list.push(imgItem.image);
              });
            }
          } catch {}
        } else if (trimmed.includes(',')) {
          list.push(...trimmed.split(',').map(s => s.trim()));
        } else if (trimmed !== '') {
          list.push(trimmed);
        }
      }
    };

    pushRawImages(target.images);
    pushRawImages(subDetails.images);
    if (list.length === 0 && matchedFromStore?.images) {
      pushRawImages(matchedFromStore.images);
    }

    const startImg =
      target.image_url_start ||
      subDetails.image_url_start ||
      matchedFromStore?.image_url_start;
    const endImg =
      target.image_url_end || subDetails.image_url_end || matchedFromStore?.image_url_end;

    if (isNonEmptyMedia(startImg) && !list.includes(startImg)) {
      list.unshift(startImg);
    }
    if (isNonEmptyMedia(endImg) && !list.includes(endImg)) {
      list.push(endImg);
    }

    const singleImg =
      target.image_url ||
      target.image ||
      subDetails.image_url ||
      subDetails.image ||
      matchedFromStore?.image_url ||
      matchedFromStore?.image;

    if (isNonEmptyMedia(singleImg) && !list.includes(singleImg)) {
      list.push(singleImg);
    }

    // Filtrar iconos genéricos de grupo muscular si tenemos miniatura de YouTube o imágenes reales
    const realImages = Array.from(
      new Set(
        list
          .filter(u => typeof u === 'string' && !u.includes('/muscle_groups/'))
          .map(getNormalizedUrl)
          .filter((u): u is string => Boolean(u))
      )
    );

    if (realImages.length > 0) {
      return realImages;
    }

    if (youtubeThumbnail) {
      return [youtubeThumbnail];
    }

    // Último fallback si no hay ni fotos del ejercicio ni miniatura de YouTube
    const fallbackUrl = getImageUrl ? getImageUrl(target) : '';
    const normFallback = getNormalizedUrl(fallbackUrl);
    return normFallback && !normFallback.includes('/muscle_groups/') ? [normFallback] : [];
  }, [target, subDetails, matchedFromStore, getImageUrl, youtubeThumbnail]);

  const imagesKey = useMemo(() => images.join('|'), [images]);

  const displayImages = useMemo(() => {
    const alive = images.filter(uri => !failedUris[uri]);
    if (alive.length > 0) return alive;
    if (youtubeThumbnail && !failedUris[youtubeThumbnail]) return [youtubeThumbnail];
    return [];
  }, [images, failedUris, youtubeThumbnail]);

  useEffect(() => {
    setFailedUris({});
    setLoadedUris({});
    setNaturalRatio(null);
    setCurrentIndex(0);
  }, [imagesKey]);

  // Precargar todos los fotogramas para evitar parpadeos en negro al alternar
  useEffect(() => {
    images.forEach(uri => {
      if (uri && uri.startsWith('http')) {
        Image.prefetch(uri).catch(() => {});
      }
    });
  }, [imagesKey]);

  useEffect(() => {
    setPlayerError(null);
    setWebViewLoading(true);
  }, [yid]);

  // 4. Efecto de animación GIF cíclico si hay más de una foto (solo avanza si el frame destino está decodificado)
  useEffect(() => {
    if (displayImages.length > 1 && !isPlaying) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => {
          const total = displayImages.length;
          for (let step = 1; step < total; step++) {
            const candidate = (prev + step) % total;
            if (loadedUris[displayImages[candidate]]) {
              return candidate;
            }
          }
          return prev;
        });
      }, 1150);
      return () => clearInterval(interval);
    }
  }, [displayImages, loadedUris, isPlaying]);

  // 5. Reproductor de Vídeo interactivo (YouTube o directo)
  if ((rawVideo || yid) && isPlaying && !staticOnly && !forceImageMode) {
    if (yid) {
      return (
        <View
          style={styles.fullContainer}
          onLayout={e => {
            const { width, height } = e.nativeEvent.layout;
            if (width > 50 && height > 50) {
              setContainerSize({ width: Math.round(width), height: Math.round(height) });
            }
          }}
        >
          <YoutubePlayer
            key={`yt-${yid}`}
            width={containerSize.width}
            height={containerSize.height}
            videoId={yid}
            play={isPlaying}
            forceAndroidAutoplay={true}
            onReady={() => {
              setWebViewLoading(false);
            }}
            onChangeState={(state: string) => {
              if (state === 'playing') {
                setWebViewLoading(false);
              }
            }}
            onError={(err: any) => {
              console.warn('YouTube Player error:', err);
              setPlayerError(String(err));
              setWebViewLoading(false);
            }}
            initialPlayerParams={{
              loop: true,
              controls: true,
              rel: false,
              preventFullScreen: false,
            }}
            webViewProps={{
              allowsInlineMediaPlayback: true,
              mediaPlaybackRequiresUserAction: false,
              androidLayerType: 'hardware',
              injectedJavaScriptBeforeContentLoaded: YOUTUBE_INJECTED_CSS,
              injectedJavaScript: YOUTUBE_INJECTED_CSS,
            }}
            webViewStyle={{
              backgroundColor: '#000000',
            }}
          />

          {webViewLoading && !playerError && (
            <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]} pointerEvents="none">
              <ActivityIndicator size="small" color="#ffffff" />
            </View>
          )}

          {playerError && (
            <View style={[StyleSheet.absoluteFill, styles.errorOverlay]}>
              <Text style={styles.errorText}>No se pudo reproducir incrustado</Text>
              <TouchableOpacity
                style={styles.errorButton}
                onPress={() => {
                  Linking.openURL(`https://www.youtube.com/watch?v=${yid}`).catch(() => {});
                }}
              >
                <ExternalLink size={12} color="#ffffff" />
                <Text style={styles.errorButtonText}>Ver en YouTube</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Botón flotante para abrir en YouTube nativo */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Linking.openURL(`https://www.youtube.com/watch?v=${yid}`).catch(() => {});
            }}
            style={styles.openYtPill}
          >
            <ExternalLink size={11} color="#ffffff" />
            <Text style={styles.openYtText}>YouTube</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.fullContainer}>
        <WebView
          key={`vid-${rawVideo}`}
          source={{
            html: getDirectVideoHtml(rawVideo),
            baseUrl: 'https://localhost',
          }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo={true}
          scrollEnabled={false}
          originWhitelist={['*']}
          mixedContentMode="always"
        />
      </View>
    );
  }

  // 6. Capas apiladas para evitar desmontaje/parpadeo negro entre fotogramas del GIF
  const safeIndex = displayImages.length > 0 ? currentIndex % displayImages.length : 0;

  const fittedImageFrameStyle = useMemo(() => {
    if (roundedRadius === undefined) return null;
    if (naturalRatio && imageSlotSize.width > 0 && imageSlotSize.height > 0) {
      const boxRatio = imageSlotSize.width / imageSlotSize.height;
      const fittedWidth =
        naturalRatio > boxRatio
          ? imageSlotSize.width
          : Math.round(imageSlotSize.height * naturalRatio);
      const fittedHeight =
        naturalRatio > boxRatio
          ? Math.round(imageSlotSize.width / naturalRatio)
          : imageSlotSize.height;
      return {
        width: fittedWidth,
        height: fittedHeight,
        borderRadius: roundedRadius,
        borderCurve: 'continuous' as const,
        overflow: 'hidden' as const,
      };
    }
    return {
      width: '100%' as const,
      height: '100%' as const,
      borderRadius: roundedRadius,
      borderCurve: 'continuous' as const,
      overflow: 'hidden' as const,
    };
  }, [roundedRadius, naturalRatio, imageSlotSize]);

  if (displayImages.length === 0) {
    return (
      <View
        style={[
          styles.fullContainer,
          styles.placeholderContainer,
          roundedRadius !== undefined && { borderRadius: roundedRadius, borderCurve: 'continuous' },
          previewColors && { backgroundColor: previewColors.background },
        ]}
      >
        <Dumbbell size={36} color={previewColors?.placeholder ?? 'rgba(255,255,255,0.3)'} />
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : staticOnly ? 1 : 0.88}
      style={[
        styles.fullContainer,
        roundedRadius !== undefined && { backgroundColor: 'transparent', borderRadius: roundedRadius },
        previewColors && { backgroundColor: previewColors.background },
      ]}
      onLayout={e => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0) {
          const roundedW = Math.round(width);
          const roundedH = Math.round(height);
          setImageSlotSize(prev =>
            prev.width === roundedW && prev.height === roundedH ? prev : { width: roundedW, height: roundedH }
          );
        }
      }}
      onPress={() => {
        if (onPress) {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch {}
          onPress();
        } else if (!staticOnly && (rawVideo || yid)) {
          setIsPlaying(true);
        }
      }}
      disabled={!onPress && (staticOnly || !(rawVideo || yid))}
    >
      <View style={[styles.imageFill, fittedImageFrameStyle]} pointerEvents="none">
        {displayImages.map((uri, idx) => {
          const isActive = idx === safeIndex;
          const isShowingYoutubeThumb = uri === youtubeThumbnail;
          const useRoundedCover = Boolean(roundedRadius !== undefined && naturalRatio);
          return (
            <Image
              key={uri}
              source={{ uri }}
              fadeDuration={0}
              style={[
                styles.stackedImage,
                roundedRadius !== undefined && { borderRadius: roundedRadius },
                {
                  opacity: isActive ? 1 : 0,
                  zIndex: isActive ? 2 : 1,
                },
              ]}
              resizeMode={isShowingYoutubeThumb || useRoundedCover ? 'cover' : fitMode}
              onLoad={e => {
                setLoadedUris(prev => (prev[uri] ? prev : { ...prev, [uri]: true }));
                const src = e?.nativeEvent?.source;
                if (src?.width && src?.height) {
                  const ratio = src.width / src.height;
                  setNaturalRatio(prev => prev ?? ratio);
                  if (onMediaAspectRatio) {
                    onMediaAspectRatio(ratio, ratio < 1);
                  }
                }
              }}
              onError={() => {
                setFailedUris(prev => (prev[uri] ? prev : { ...prev, [uri]: true }));
              }}
            />
          );
        })}
      </View>

      {showImageCounter && displayImages.length > 1 && !isPlaying && (
        <View style={styles.gifBadge}>
          <Text style={styles.gifBadgeText}>
            GIF {safeIndex + 1}/{displayImages.length}
          </Text>
        </View>
      )}

      {!staticOnly && !forceImageMode && (rawVideo || yid) && !isPlaying && (
        <View style={styles.playOverlay}>
          <View style={styles.playPill}>
            <Play size={15} color="#ffffff" fill="#ffffff" />
            <Text style={styles.playText}>Ver Vídeo</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fullContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webView: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  imageFill: {
    width: '100%',
    height: '100%',
  },
  stackedImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  gifBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  gifBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  playPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  playText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  loadingOverlay: {
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 10,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ff0000',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  errorButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  openYtPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  openYtText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
});
