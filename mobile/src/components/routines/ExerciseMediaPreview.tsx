import React, { useState, useEffect, useMemo } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Play, Image as ImageIcon, Volume2, VolumeX } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BACKEND_BASE_URL, API_BASE_URL } from '@/services/apiClient';

interface ExerciseMediaPreviewProps {
  item: any;
  details?: any;
  getImageUrl?: (it: any) => string;
  staticOnly?: boolean;
  fitMode?: 'cover' | 'contain';
  playYouTube?: boolean;
  onPress?: () => void;
}

export const ExerciseMediaPreview: React.FC<ExerciseMediaPreviewProps> = ({
  item,
  details,
  getImageUrl,
  staticOnly = false,
  fitMode = 'cover',
  playYouTube = false,
  onPress,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(playYouTube);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (playYouTube) {
      setIsPlaying(true);
    }
  }, [playYouTube]);

  const target = details || item || {};
  const subDetails = target.exercise_details || target.exercise || {};

  // 1. Extractor y normalizador de ID de YouTube
  const rawVideo =
    target.video_url ||
    target.youtube_id ||
    subDetails.video_url ||
    subDetails.youtube_id ||
    '';

  const getYoutubeId = (url?: string | null) => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    const match = trimmed.match(
      /(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|shorts\/|&v=)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  const yid = useMemo(() => getYoutubeId(rawVideo), [rawVideo]);
  const youtubeThumbnail = yid ? `https://img.youtube.com/vi/${yid}/mqdefault.jpg` : null;

  // 2. Normalizador robusto de URLs de imágenes (Wger, backend uploads y externas)
  const getNormalizedUrl = (url: any): string | null => {
    if (!url || typeof url !== 'string' || url.trim() === '' || url === 'null' || url === 'undefined') {
      return null;
    }
    const clean = url.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean;
    }

    const path = clean.startsWith('/') ? clean.substring(1) : clean;
    const filename = path.split('/').pop() || '';

    // Patrón UUID de Wger o directorio exercise-images
    const isWgerUuid = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/.test(filename);
    if (isWgerUuid || path.includes('exercise-images')) {
      return `https://wger.de/media/exercise-images/${filename}`;
    }

    const base = BACKEND_BASE_URL || API_BASE_URL.replace('/api', '');
    return `${base}/${path}`;
  };

  // 3. Extracción de lista completa de imágenes
  const images = useMemo(() => {
    const list: string[] = [];

    // Parseo de arrays o cadenas JSON / separadas por comas
    const rawImages = target.images || subDetails.images;
    if (Array.isArray(rawImages)) {
      list.push(...rawImages);
    } else if (typeof rawImages === 'string') {
      const trimmed = rawImages.trim();
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) list.push(...parsed);
        } catch {}
      } else if (trimmed.includes(',')) {
        list.push(...trimmed.split(',').map(s => s.trim()));
      } else if (trimmed !== '') {
        list.push(trimmed);
      }
    }

    // Inicio y fin de movimiento (convención start/end)
    const startImg = target.image_url_start || subDetails.image_url_start;
    const endImg = target.image_url_end || subDetails.image_url_end;
    if (startImg && !list.includes(startImg)) {
      list.unshift(startImg);
    }
    if (endImg && !list.includes(endImg)) {
      list.push(endImg);
    }

    // Imagen única por defecto
    const singleImg =
      target.image_url ||
      target.image ||
      subDetails.image_url ||
      subDetails.image ||
      (getImageUrl ? getImageUrl(target) : '');
    if (singleImg && !list.includes(singleImg)) {
      list.push(singleImg);
    }

    // Normalizar y descartar vacíos o placeholders genéricos si hay thumbnail de youtube
    const normalized = Array.from(
      new Set(list.map(getNormalizedUrl).filter((u): u is string => Boolean(u)))
    );

    // Si no hay imágenes del usuario pero sí hay video de YouTube, usar la miniatura de YouTube
    if (normalized.length === 0 && youtubeThumbnail) {
      return [youtubeThumbnail];
    }

    return normalized;
  }, [target, subDetails, getImageUrl, youtubeThumbnail]);

  // 4. Efecto de animación GIF cíclico (alterna imágenes cada 1300ms si hay más de una)
  useEffect(() => {
    if (images.length > 1 && !isPlaying) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % images.length);
      }, 1300);
      return () => clearInterval(interval);
    }
  }, [images.length, isPlaying]);

  // 5. Reproductor de Vídeo interactivo (YouTube o MP4 directo)
  if ((rawVideo || yid) && isPlaying && !staticOnly) {
    if (yid) {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { margin: 0; padding: 0; background: #000; overflow: hidden; display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; }
            iframe { width: 100%; height: 100%; border: none; }
          </style>
        </head>
        <body>
          <iframe 
            src="https://www.youtube.com/embed/${yid}?autoplay=1&mute=${isMuted ? '1' : '0'}&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${yid}&enablejsapi=1" 
            frameborder="0" 
            allow="autoplay; encrypted-media; picture-in-picture" 
            allowfullscreen>
          </iframe>
        </body>
        </html>
      `;
      return (
        <View style={styles.fullContainer}>
          <WebView
            source={{ html, baseUrl: 'https://www.youtube.com' }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo={true}
            scrollEnabled={false}
            originWhitelist={['*']}
            mixedContentMode="always"
            pointerEvents="none"
          />
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              setIsMuted(prev => !prev);
            }}
            style={styles.muteButton}
          >
            {isMuted ? (
              <VolumeX size={15} color="#ffffff" strokeWidth={2.5} />
            ) : (
              <Volume2 size={15} color="#ffffff" strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.fullContainer}>
        <WebView
          source={{ uri: rawVideo }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          scrollEnabled={false}
          pointerEvents="none"
        />
      </View>
    );
  }

  // 6. Selección de la imagen activa
  const activeImageUri =
    images.length > 0
      ? images[currentIndex % images.length]
      : youtubeThumbnail;

  if (!activeImageUri) {
    return (
      <View style={[styles.fullContainer, styles.placeholderContainer]}>
        <ImageIcon size={38} color="rgba(255,255,255,0.3)" />
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : staticOnly ? 1 : 0.88}
      style={styles.fullContainer}
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
      <Image
        key={activeImageUri}
        source={{ uri: activeImageUri }}
        style={styles.imageFill}
        resizeMode={fitMode}
      />

      {/* Indicador de más imágenes (efecto GIF) */}
      {images.length > 1 && !isPlaying && (
        <View style={styles.gifBadge}>
          <Text style={styles.gifBadgeText}>
            {currentIndex + 1}/{images.length}
          </Text>
        </View>
      )}

      {/* Botón flotante para reproducir vídeo si existe */}
      {!staticOnly && (rawVideo || yid) && !isPlaying && (
        <View style={styles.playOverlay}>
          <View style={styles.playPill}>
            <Play size={18} color="#ffffff" fill="#ffffff" />
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
    backgroundColor: 'transparent',
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
  placeholderContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  gifBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  gifBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  playOverlay: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  playPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    fontSize: 13,
    fontWeight: '800',
  },
  muteButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});
