/* frontend/src/utils/storyMedia.js */

export const STORY_TARGET_WIDTH = 1080;
export const STORY_TARGET_HEIGHT = 1920;
export const STORY_TARGET_ASPECT = STORY_TARGET_WIDTH / STORY_TARGET_HEIGHT; // 9 / 16 (0.5625)

const STORY_BG_BLUR_WIDTH = 36;
const STORY_BG_BLUR_HEIGHT = 64;
const STORY_CONTAIN_PADDING_X = 20;
const STORY_CONTAIN_PADDING_Y = 50;
const STORY_CARD_RADIUS = 28;

export const isVideoFile = (file) => {
  if (!file) return false;
  const mime = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  return mime.startsWith('video/') || /\.(mp4|mov|webm|m4v|3gp|mkv)$/i.test(name);
};

export const isPotentialHDRImageFile = (file) => {
  if (!file) return false;
  const mime = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  return (
    mime === 'image/heic' ||
    mime === 'image/heif' ||
    mime === 'image/avif' ||
    /\.(heic|heif|avif)$/i.test(name)
  );
};

export const isAnimatedGifFile = (file) => {
  if (!file) return false;
  const mime = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  return mime === 'image/gif' || /\.gif$/i.test(name);
};

/**
 * Decide el mejor encuadre automático para visualización en móviles (9:16):
 * - Fotos verticales cercanas a 9:16 (entre ~9:20 y ~2:3): rellenan a pantalla completa sin bordes.
 * - Fotos 3:4, 4:5, cuadradas, horizontales o capturas ultra-largas: se encajan completas
 *   sobre un fondo desenfocado ambiental para no recortar contenido importante ni dejar franjas negras.
 */
export const decideSmartStoryFit = (width, height) => {
  if (!width || !height) return 'cover';
  const aspect = width / height;
  if (aspect >= 0.45 && aspect <= 0.65) {
    return 'cover';
  }
  return 'contain';
};

export const loadImageElement = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err || new Error('No se pudo decodificar la imagen'));
    img.src = src;
  });

const drawRoundedRectPath = (ctx, x, y, width, height, radius) => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};

const renderAmbientBlurLayer = (ctx, image, naturalWidth, naturalHeight) => {
  const blurCanvas = document.createElement('canvas');
  blurCanvas.width = STORY_BG_BLUR_WIDTH;
  blurCanvas.height = STORY_BG_BLUR_HEIGHT;
  const blurCtx = blurCanvas.getContext('2d');

  if (blurCtx) {
    blurCtx.imageSmoothingEnabled = true;
    blurCtx.imageSmoothingQuality = 'medium';

    const srcAspect = naturalWidth / naturalHeight;
    let sx = 0;
    let sy = 0;
    let sw = naturalWidth;
    let sh = naturalHeight;

    if (srcAspect > STORY_TARGET_ASPECT) {
      sw = naturalHeight * STORY_TARGET_ASPECT;
      sx = (naturalWidth - sw) / 2;
    } else if (srcAspect < STORY_TARGET_ASPECT) {
      sh = naturalWidth / STORY_TARGET_ASPECT;
      sy = (naturalHeight - sh) / 2;
    }

    blurCtx.drawImage(
      image,
      sx,
      sy,
      sw,
      sh,
      0,
      0,
      STORY_BG_BLUR_WIDTH,
      STORY_BG_BLUR_HEIGHT
    );

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      blurCanvas,
      0,
      0,
      STORY_BG_BLUR_WIDTH,
      STORY_BG_BLUR_HEIGHT,
      -24,
      -24,
      STORY_TARGET_WIDTH + 48,
      STORY_TARGET_HEIGHT + 48
    );
    ctx.restore();
  } else {
    ctx.fillStyle = '#090b10';
    ctx.fillRect(0, 0, STORY_TARGET_WIDTH, STORY_TARGET_HEIGHT);
  }

  // Capa atmosférica oscura para dar contraste al contenido central y a los controles del visor
  const vignette = ctx.createLinearGradient(0, 0, 0, STORY_TARGET_HEIGHT);
  vignette.addColorStop(0, 'rgba(6, 8, 14, 0.56)');
  vignette.addColorStop(0.25, 'rgba(6, 8, 14, 0.34)');
  vignette.addColorStop(0.75, 'rgba(6, 8, 14, 0.34)');
  vignette.addColorStop(1, 'rgba(6, 8, 14, 0.58)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, STORY_TARGET_WIDTH, STORY_TARGET_HEIGHT);
};

/**
 * Prepara automáticamente una imagen en formato móvil 9:16 (1080x1920) lista para publicar.
 * Nunca bloquea si un formato especial (p. ej. HEIC en Windows/Chrome) no puede decodificarse
 * en navegador: en ese caso devuelve el archivo original para que Sharp lo adapte en servidor.
 */
export const prepareStoryImageFile = async (
  source,
  { mode = 'auto', isHDR = false, fileName = 'story.jpg' } = {}
) => {
  const isFileInput = typeof File !== 'undefined' && source instanceof File;

  if (isFileInput) {
    if (isAnimatedGifFile(source)) {
      return {
        file: source,
        fitMode: 'original',
        originalAspect: null,
        isPrepared: false,
        canPreviewInBrowser: true,
      };
    }

    if (isHDR && isPotentialHDRImageFile(source)) {
      return {
        file: source,
        fitMode: 'hdr-raw',
        originalAspect: null,
        isPrepared: false,
        canPreviewInBrowser: true,
      };
    }
  }

  const tempUrl = isFileInput ? URL.createObjectURL(source) : source;
  try {
    const image = await loadImageElement(tempUrl);
    const naturalWidth = image.naturalWidth || image.width;
    const naturalHeight = image.naturalHeight || image.height;
    if (!naturalWidth || !naturalHeight) {
      throw new Error('Dimensiones de imagen inválidas');
    }

    const originalAspect = naturalWidth / naturalHeight;
    const resolvedMode =
      mode === 'auto' ? decideSmartStoryFit(naturalWidth, naturalHeight) : mode;

    const canvas = document.createElement('canvas');
    canvas.width = STORY_TARGET_WIDTH;
    canvas.height = STORY_TARGET_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No se pudo crear el lienzo 2D');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (resolvedMode === 'cover') {
      let sx = 0;
      let sy = 0;
      let sw = naturalWidth;
      let sh = naturalHeight;

      if (originalAspect > STORY_TARGET_ASPECT) {
        sw = naturalHeight * STORY_TARGET_ASPECT;
        sx = (naturalWidth - sw) / 2;
      } else if (originalAspect < STORY_TARGET_ASPECT) {
        sh = naturalWidth / STORY_TARGET_ASPECT;
        sy = (naturalHeight - sh) / 2;
      }

      ctx.drawImage(
        image,
        sx,
        sy,
        sw,
        sh,
        0,
        0,
        STORY_TARGET_WIDTH,
        STORY_TARGET_HEIGHT
      );
    } else {
      renderAmbientBlurLayer(ctx, image, naturalWidth, naturalHeight);

      const maxW = STORY_TARGET_WIDTH - STORY_CONTAIN_PADDING_X * 2;
      const maxH = STORY_TARGET_HEIGHT - STORY_CONTAIN_PADDING_Y * 2;
      const scale = Math.min(maxW / naturalWidth, maxH / naturalHeight);
      const drawW = Math.round(naturalWidth * scale);
      const drawH = Math.round(naturalHeight * scale);
      const drawX = Math.round((STORY_TARGET_WIDTH - drawW) / 2);
      const drawY = Math.round((STORY_TARGET_HEIGHT - drawH) / 2);

      // Sombra suave detrás de la foto encajada
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 34;
      ctx.shadowOffsetY = 12;
      drawRoundedRectPath(ctx, drawX, drawY, drawW, drawH, STORY_CARD_RADIUS);
      ctx.fillStyle = '#000000';
      ctx.fill();
      ctx.restore();

      ctx.save();
      drawRoundedRectPath(ctx, drawX, drawY, drawW, drawH, STORY_CARD_RADIUS);
      ctx.clip();
      ctx.drawImage(image, drawX, drawY, drawW, drawH);
      ctx.restore();

      ctx.save();
      drawRoundedRectPath(ctx, drawX, drawY, drawW, drawH, STORY_CARD_RADIUS);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error('No se pudo exportar la historia preparada'));
        },
        'image/jpeg',
        0.9
      );
    });

    const baseName = String(fileName || 'story').replace(/\.[^.]+$/, '') || 'story';
    const outputFile = new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });

    return {
      file: outputFile,
      fitMode: resolvedMode,
      originalAspect,
      isPrepared: true,
      canPreviewInBrowser: true,
    };
  } catch {
    if (isFileInput) {
      return {
        file: source,
        fitMode: 'server-fallback',
        originalAspect: null,
        isPrepared: false,
        canPreviewInBrowser: false,
      };
    }
    throw new Error('No se pudo adaptar la imagen');
  } finally {
    if (isFileInput && tempUrl) {
      URL.revokeObjectURL(tempUrl);
    }
  }
};

/**
 * Captura un frame desenfocado ligero (36x64) de un vídeo para usarlo como fondo ambiental
 * detrás de vídeos horizontales/cuadrados en el visor móvil sin usar un segundo reproductor.
 */
export const captureVideoAmbientBackdrop = (videoEl) => {
  if (!videoEl || !videoEl.videoWidth || !videoEl.videoHeight) return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = STORY_BG_BLUR_WIDTH;
    canvas.height = STORY_BG_BLUR_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const vw = videoEl.videoWidth;
    const vh = videoEl.videoHeight;
    const aspect = vw / vh;
    let sx = 0;
    let sy = 0;
    let sw = vw;
    let sh = vh;

    if (aspect > STORY_TARGET_ASPECT) {
      sw = vh * STORY_TARGET_ASPECT;
      sx = (vw - sw) / 2;
    } else if (aspect < STORY_TARGET_ASPECT) {
      sh = vw / STORY_TARGET_ASPECT;
      sy = (vh - sh) / 2;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(videoEl, sx, sy, sw, sh, 0, 0, STORY_BG_BLUR_WIDTH, STORY_BG_BLUR_HEIGHT);
    return canvas.toDataURL('image/jpeg', 0.6);
  } catch {
    return null;
  }
};
