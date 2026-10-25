/* frontend/src/components/WorkoutSummaryModal.jsx */
import React, { useState, useRef, useEffect } from 'react';
import { Clock, Flame, Target, Award, Sparkles, Check } from 'lucide-react';
import {
  FaInstagram,
  FaWhatsapp,
  FaXTwitter,
  FaTelegram,
  FaDownload,
  FaCamera,
  FaTrash,
  FaXmark,
  FaArrowLeft,
  FaShareNodes
} from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';
import { toBlob } from 'html-to-image';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import WorkoutShareCard from './WorkoutShareCard';
import ScaleToFit from './ScaleToFit';
import Spinner from './Spinner';
import useModalLock from '../hooks/useModalLock';
import ExerciseMedia from './ExerciseMedia';
import ModalPortal from './ModalPortal';

// Helper para formatear el tiempo
const formatTime = (timeInSeconds) => {
  const hours = String(Math.floor(timeInSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((timeInSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(timeInSeconds % 60).padStart(2, '0');
  if (hours !== '00') return `${hours}:${minutes}:${seconds}`;
  return `${minutes}:${seconds}`;
};

const formatDisplayTime = (timeInSeconds) => {
  const h = Math.floor(timeInSeconds / 3600);
  const m = Math.floor((timeInSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const WorkoutSummaryModal = ({ workoutData, onClose, isShareMode = false }) => {
  useModalLock();

  const { t } = useTranslation(['exercise_names']);
  const { userProfile, getOrFetchAllExercises } = useAppStore((state) => ({
    userProfile: state.userProfile,
    getOrFetchAllExercises: state.getOrFetchAllExercises
  }));
  const { showToast } = useToast();

  const [isStoryView, setIsStoryView] = useState(isShareMode);
  const [sharingPlatform, setSharingPlatform] = useState(null);
  const isGenerating = !!sharingPlatform;
  const [accentColor, setAccentColor] = useState('#22c55e');
  const [enrichedDetails, setEnrichedDetails] = useState([]);
  const [customPhoto, setCustomPhoto] = useState(null);

  const shareCardRef = useRef(null);
  const photoInputRef = useRef(null);
  const isMountedRef = useRef(true);
  const cachedBlobRef = useRef(null);

  // Enriquecer ejercicios con datos de base de datos (músculos e imágenes)
  useEffect(() => {
    const enrichExercises = async () => {
      const details = workoutData?.details || [];
      if (details.length === 0) {
        setEnrichedDetails([]);
        return;
      }
      try {
        const allExercises = await getOrFetchAllExercises();
        const enriched = details.map((ex) => {
          const match = allExercises.find((a) => a.name === ex.exerciseName);
          return {
            ...ex,
            muscle_group: match?.muscle_group || match?.category || ex.muscle_group,
            image_url_start: match?.image_url_start,
            image_url_end: match?.image_url_end,
            images: match?.images,
            video_url: match?.video_url
          };
        });
        setEnrichedDetails(enriched);
      } catch (error) {
        console.error('Error fetching exercises for summary:', error);
        setEnrichedDetails(details);
      }
    };
    enrichExercises();
  }, [workoutData, getOrFetchAllExercises]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const resolveAccentColor = () => {
      try {
        const tempDiv = document.createElement('div');
        tempDiv.className = 'bg-accent';
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);
        const computedStyle = window.getComputedStyle(tempDiv);
        const bgColor = computedStyle.backgroundColor;
        document.body.removeChild(tempDiv);
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          setAccentColor(bgColor);
        } else {
          const docStyle = getComputedStyle(document.documentElement);
          const rawVar = docStyle.getPropertyValue('--accent').trim();
          if (rawVar) setAccentColor(rawVar.includes(' ') ? `hsl(${rawVar})` : rawVar);
        }
      } catch (e) {
        console.warn(e);
      }
    };
    setTimeout(resolveAccentColor, 200);
  }, []);

  // Control de ciclo de vida e invalidación de caché
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    cachedBlobRef.current = null;
  }, [customPhoto, accentColor, enrichedDetails, workoutData]);

  // Manejo de foto personalizada de fondo (selfie / gym)
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        showToast('La imagen es demasiado pesada. Elige una menor a 15MB.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomPhoto(event.target.result);
        showToast('Foto añadida a tu Historia', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (e) => {
    e.stopPropagation();
    setCustomPhoto(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
    showToast('Foto eliminada. Usando fondo Liquid Glass', 'info');
  };

  // Generador de imagen en alta resolución 1080x1920 (Instagram Stories / 9:16 HD)
  const generateStoryBlob = async () => {
    if (cachedBlobRef.current) {
      return cachedBlobRef.current;
    }
    if (!shareCardRef.current) throw new Error('Referencia de tarjeta no encontrada');

    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch (e) {
        console.warn('Verificación de fuentes:', e);
      }
    }

    // Asegurar que todas las imágenes internas del card estén cargadas y decodificadas
    const innerImgs = shareCardRef.current.querySelectorAll('img');
    await Promise.all(
      Array.from(innerImgs).map(async (img) => {
        if (img.complete) return;
        try {
          if ('decode' in img) {
            await img.decode();
          }
        } catch (_) {}
      })
    );

    const blob = await toBlob(shareCardRef.current, {
      pixelRatio: 1,
      backgroundColor: '#000000',
      width: 1080,
      height: 1920,
      cacheBust: true,
      imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    });

    if (!blob) throw new Error('No se pudo generar la imagen');
    cachedBlobRef.current = blob;
    return blob;
  };

  // Pre-generar blob en segundo plano cuando se abre el studio para que el compartir sea inmediato (0ms)
  useEffect(() => {
    if (!isStoryView || !shareCardRef.current) return;
    const timer = setTimeout(() => {
      if (isMountedRef.current && shareCardRef.current && !cachedBlobRef.current) {
        generateStoryBlob().catch((err) => {
          console.warn('Pre-render en segundo plano diferido a clic:', err);
        });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [isStoryView, customPhoto, accentColor, enrichedDetails]);

  // Helper de descarga multiplataforma directa sin bloqueos de popups
  const downloadBlobFile = (blob, fileName) => {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      console.error('Error descargando archivo:', e);
    }
  };

  // Descargar imagen HD directa
  const handleDownloadStory = async () => {
    if (sharingPlatform) return;
    setSharingPlatform('download');
    try {
      const blob = await generateStoryBlob();
      if (!isMountedRef.current) return;
      downloadBlobFile(blob, `pro-fitness-story-${new Date().toISOString().slice(0, 10)}.png`);
      showToast('¡Historia guardada en tu galería en HD!', 'success');
    } catch (err) {
      console.error('Error descargando historia:', err);
      if (isMountedRef.current) {
        showToast('Error al procesar la imagen', 'error');
      }
    } finally {
      if (isMountedRef.current) {
        setSharingPlatform(null);
      }
    }
  };

  // Compartir multiplataforma (Instagram, WhatsApp, X, Telegram)
  const handlePlatformShare = async (platform) => {
    if (sharingPlatform) return;
    setSharingPlatform(platform);
    try {
      const blob = await generateStoryBlob();
      if (!isMountedRef.current) return;

      const workoutTitle = workoutData?.routineName || 'Entrenamiento';
      const timeFormatted = formatDisplayTime(workoutData?.duration_seconds || 0);
      const appUrl = 'https://pro-fitness-glass.zeabur.app';
      const shareText = `🔥 ¡Entrenamiento completado en Pro Fitness Glass!\n🏋️ ${workoutTitle} • ${timeFormatted}\n💪 Superando límites día a día.\n👉 ${appUrl}`;

      // 1. Si estamos en Capacitor Nativo (iOS / Android App)
      if (Capacitor.isNativePlatform()) {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          if (!isMountedRef.current) return;
          try {
            const base64data = reader.result.split(',')[1];
            const fileName = `pro-fitness-${Date.now()}.png`;

            const savedFile = await Filesystem.writeFile({
              path: fileName,
              data: base64data,
              directory: Directory.Cache
            });

            await Share.share({
              title: 'Mi Entrenamiento en Pro Fitness Glass',
              text: shareText,
              url: savedFile.uri,
              dialogTitle: 'Compartir'
            });
            if (isMountedRef.current) {
              showToast('¡Listo para compartir!', 'success');
            }
          } catch (nativeErr) {
            console.error('Error compartiendo en nativo:', nativeErr);
            if (isMountedRef.current) {
              showToast('Error al compartir', 'error');
            }
          } finally {
            if (isMountedRef.current) {
              setSharingPlatform(null);
            }
          }
        };
        return;
      }

      // 2. Si el dispositivo soporta Web Share API con archivos (móvil iOS / Android en Safari / Chrome / PWA)
      const file = new File([blob], `pro-fitness-${Date.now()}.png`, { type: 'image/png' });
      const canShareFile = typeof navigator !== 'undefined' &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] });

      if (canShareFile) {
        try {
          await navigator.share({
            files: [file],
            title: 'Mi Entrenamiento en Pro Fitness Glass',
            text: shareText
          });
          if (!isMountedRef.current) return;
          const platformNames = {
            instagram: 'Stories',
            whatsapp: 'WhatsApp',
            x: 'X',
            telegram: 'Telegram'
          };
          showToast(`¡Listo para compartir en ${platformNames[platform] || 'redes'}!`, 'success');
          return;
        } catch (shareErr) {
          if (!isMountedRef.current) return;
          if (shareErr.name === 'AbortError') {
            return; // Usuario canceló modal nativo
          }
          console.warn('Native share falló, ejecutando fallback directo:', shareErr);
        }
      }

      if (!isMountedRef.current) return;

      // 3. Fallback directo: Descargar archivo y abrir enlace de la plataforma
      downloadBlobFile(blob, `pro-fitness-${Date.now()}.png`);

      if (platform === 'whatsapp') {
        const waText = encodeURIComponent(`${shareText}\n\n📸 *Adjunta la imagen que acabas de guardar en tu galería*`);
        window.open(`https://api.whatsapp.com/send?text=${waText}`, '_blank');
        showToast('Imagen guardada. ¡Adjúntala en tu chat o estado de WhatsApp!', 'success');
      } else if (platform === 'telegram') {
        const tgText = encodeURIComponent(shareText);
        window.open(`https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${tgText}`, '_blank');
        showToast('Imagen guardada. ¡Compártela en Telegram!', 'success');
      } else if (platform === 'x') {
        const xText = encodeURIComponent(`¡Sesión completada en Pro Fitness Glass! 💥\n🏋️ ${workoutTitle} • ${timeFormatted}\n#ProFitnessGlass #GymMotivation`);
        window.open(`https://twitter.com/intent/tweet?text=${xText}&url=${encodeURIComponent(appUrl)}`, '_blank');
        showToast('Imagen guardada. ¡Adjúntala a tu post en X!', 'success');
      } else {
        // Instagram Stories
        showToast('¡Imagen guardada en tu galería! Súbela a tus Stories de Instagram.', 'info');
      }
    } catch (err) {
      console.error('Error al compartir:', err);
      if (isMountedRef.current) {
        showToast('Error al procesar la imagen', 'error');
      }
    } finally {
      if (isMountedRef.current && !Capacitor.isNativePlatform()) {
        setSharingPlatform(null);
      }
    }
  };

  if (!workoutData) return null;

  const { routineName, duration_seconds, calories_burned, details, notes, newPRs } = workoutData;
  const safeRoutineName = routineName || 'Entrenamiento';
  const safeCalories = calories_burned || 0;
  const safeDetails = enrichedDetails.length > 0 ? enrichedDetails : (details || []);
  const safeNotes = notes || '';
  const hasPRs = (newPRs && newPRs.length > 0) || (workoutData?.newPRs && workoutData.newPRs.length > 0);

  return (
    <ModalPortal>
      {/* TARJETA OCULTA OFFSCREEN PARA EXPORTACIÓN 1080x1920 SUPREMA */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '1080px',
          height: '1920px',
          zIndex: -9999,
          pointerEvents: 'none',
          opacity: 1,
          overflow: 'hidden'
        }}
        aria-hidden="true"
      >
        <WorkoutShareCard
          ref={shareCardRef}
          workoutData={{ ...workoutData, details: safeDetails }}
          userName={userProfile?.username}
          userAvatar={userProfile?.profile_image || userProfile?.profile_image_url}
          accentColor={accentColor}
          customBgPhoto={customPhoto}
          newPRs={newPRs}
        />
      </div>

      <input
        type="file"
        ref={photoInputRef}
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      {/* VISTA 1: STUDIO DE HISTORIAS Y REDES SOCIALES */}
      {isStoryView ? (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-between p-3 sm:p-4 animate-[fade-in_0.2s_ease-out]"
          style={{
            paddingTop: 'calc(var(--safe-top, 44px) + 0.75rem)',
            paddingBottom: 'calc(var(--safe-bottom, 20px) + 0.75rem)'
          }}
          onClick={() => setIsStoryView(false)}
        >
          {/* CABECERA RESPONSIVE Y UNIFICADA (SIN COLISIÓN ENTRE X Y BOTÓN DE FOTO) */}
          <div
            className="w-full max-w-md flex items-center justify-between gap-2 shrink-0 mb-1 px-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lado Izquierdo: Branding Studio */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-lg shrink-0">
                <FaInstagram size={17} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-black text-white tracking-wide uppercase truncate">
                  Story Studio
                </span>
                <span className="text-[10px] text-white/60 font-semibold truncate">
                  Formato 9:16 HD
                </span>
              </div>
            </div>

            {/* Lado Derecho: Selector de Foto + Botón X en el mismo flujo flex */}
            <div className="flex items-center gap-2 shrink-0">
              {customPhoto ? (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="px-2.5 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold flex items-center gap-1 hover:bg-red-500/30 active:scale-95 transition-all shadow-md"
                  title="Quitar foto personalizada"
                >
                  <FaTrash size={11} />
                  <span>Quitar</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md backdrop-blur-md"
                  title="Añadir foto de fondo"
                >
                  <FaCamera size={12} className="text-amber-400" />
                  <span>+ Foto</span>
                </button>
              )}

              {/* Botón Cerrar X - Perfectamente alineado y sin colisión absoluta */}
              <button
                type="button"
                onClick={() => {
                  if (isShareMode) onClose();
                  else setIsStoryView(false);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white flex items-center justify-center transition-all backdrop-blur-md shadow-md shrink-0"
                aria-label="Cerrar vista de historias"
              >
                <FaXmark size={16} />
              </button>
            </div>
          </div>

          {/* TARJETA CENTRADA ESCALADA (ScaleToFit) */}
          <div
            className="flex-1 w-full min-h-0 flex items-center justify-center pointer-events-none my-1"
            onClick={(e) => e.stopPropagation()}
          >
            <ScaleToFit width={1080} height={1920}>
              <div className="w-[1080px] h-[1920px] rounded-[3.5rem] overflow-hidden shadow-2xl border border-white/20 pointer-events-auto">
                <WorkoutShareCard
                  workoutData={{ ...workoutData, details: safeDetails }}
                  userName={userProfile?.username}
                  userAvatar={userProfile?.profile_image || userProfile?.profile_image_url}
                  accentColor={accentColor}
                  customBgPhoto={customPhoto}
                  newPRs={newPRs}
                />
              </div>
            </ScaleToFit>
          </div>

          {/* BOTONERA MULTIPLATAFORMA DE COMPARTIR */}
          <div className="w-full max-w-md shrink-0 flex flex-col gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
            {/* Grid de 4 Redes: Instagram Stories, WhatsApp, X, Telegram */}
            <div className="grid grid-cols-4 gap-2 w-full">
              {/* Instagram Stories */}
              <button
                type="button"
                onClick={() => handlePlatformShare('instagram')}
                disabled={isGenerating}
                className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white hover:opacity-95 active:scale-95 transition-all shadow-lg disabled:opacity-50 group min-h-[64px]"
                title="Compartir en Instagram Stories"
              >
                {sharingPlatform === 'instagram' ? (
                  <Spinner size={20} />
                ) : (
                  <FaInstagram size={22} className="group-hover:scale-110 transition-transform drop-shadow" />
                )}
                <span className="text-[11px] font-black tracking-tight mt-1">Stories</span>
              </button>

              {/* WhatsApp */}
              <button
                type="button"
                onClick={() => handlePlatformShare('whatsapp')}
                disabled={isGenerating}
                className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-[#25D366] text-white hover:brightness-105 active:scale-95 transition-all shadow-lg disabled:opacity-50 group min-h-[64px]"
                title="Compartir por WhatsApp"
              >
                {sharingPlatform === 'whatsapp' ? (
                  <Spinner size={20} />
                ) : (
                  <FaWhatsapp size={22} className="group-hover:scale-110 transition-transform drop-shadow" />
                )}
                <span className="text-[11px] font-black tracking-tight mt-1">WhatsApp</span>
              </button>

              {/* X / Twitter */}
              <button
                type="button"
                onClick={() => handlePlatformShare('x')}
                disabled={isGenerating}
                className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-black border border-white/20 text-white hover:bg-neutral-900 active:scale-95 transition-all shadow-lg disabled:opacity-50 group min-h-[64px]"
                title="Compartir en X"
              >
                {sharingPlatform === 'x' ? (
                  <Spinner size={20} />
                ) : (
                  <FaXTwitter size={20} className="group-hover:scale-110 transition-transform drop-shadow" />
                )}
                <span className="text-[11px] font-black tracking-tight mt-1">X</span>
              </button>

              {/* Telegram */}
              <button
                type="button"
                onClick={() => handlePlatformShare('telegram')}
                disabled={isGenerating}
                className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-[#229ED9] text-white hover:brightness-105 active:scale-95 transition-all shadow-lg disabled:opacity-50 group min-h-[64px]"
                title="Compartir en Telegram"
              >
                {sharingPlatform === 'telegram' ? (
                  <Spinner size={20} />
                ) : (
                  <FaTelegram size={22} className="group-hover:scale-110 transition-transform drop-shadow" />
                )}
                <span className="text-[11px] font-black tracking-tight mt-1">Telegram</span>
              </button>
            </div>

            {/* Fila: Descargar HD Directo */}
            <button
              type="button"
              onClick={handleDownloadStory}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 min-h-[40px]"
              title="Descargar imagen en alta resolución 1080x1920"
            >
              {sharingPlatform === 'download' ? <Spinner size={16} /> : <FaDownload size={14} />}
              <span>Descargar HD (1080x1920)</span>
            </button>

            {/* Volver */}
            <button
              type="button"
              onClick={() => setIsStoryView(false)}
              className="w-full py-1 text-xs text-white/60 hover:text-white font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <FaArrowLeft size={11} />
              <span>{isShareMode ? 'Ver desglose de ejercicios' : 'Volver al resumen'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* VISTA 2: RESUMEN DE SESIÓN GUARDADA (CON ACCESO DIRECTO A COMPARTIR) */
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-[fade-in_0.25s_ease-out]"
          style={{
            paddingTop: 'var(--safe-top, 0px)',
            paddingBottom: 'var(--safe-bottom, 0px)'
          }}
        >
          <div className="relative w-full max-w-lg rounded-t-[32px] rounded-b-none sm:rounded-2xl bg-bg-primary border border-glass-border shadow-2xl flex flex-col max-h-[75vh] md:max-h-[85vh] animate-[slide-up_0.2s_ease-out] sm:animate-[scale-in_0.2s_ease-out] overflow-hidden shrink-0">

            {/* Cabecera */}
            <div className="p-4 sm:p-6 border-b border-glass-border flex justify-between items-center bg-bg-primary z-10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent/15 text-accent border border-accent/20">
                  <Check size={20} strokeWidth={3} />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                  {isShareMode ? 'Detalle de Sesión' : '¡Entrenamiento Guardado!'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsStoryView(true)}
                  className="p-2 text-text-muted hover:text-accent transition-colors rounded-full hover:bg-bg-secondary"
                  title="Compartir en Redes Sociales"
                >
                  <FaShareNodes size={18} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-text-muted hover:text-red transition-colors rounded-full hover:bg-bg-secondary"
                >
                  <FaXmark size={18} />
                </button>
              </div>
            </div>

            {/* Contenido con scroll interno */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-bg-primary">
              {/* BANNER PROMOCIONAL: COMPARTIR EN REDES */}
              <div
                onClick={() => setIsStoryView(true)}
                className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#f09433]/15 via-[#dc2743]/15 to-[#bc1888]/15 border border-[#dc2743]/30 shadow-lg cursor-pointer hover:scale-[1.01] transition-transform group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-lg shrink-0 group-hover:rotate-6 transition-transform">
                      <FaInstagram size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-text-primary tracking-tight flex items-center gap-2">
                        Compartir en Redes Sociales
                        <Sparkles size={14} className="text-yellow-400" />
                      </h4>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Stories, WhatsApp, X y Telegram en 9:16 HD.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-[#dc2743] uppercase tracking-wider bg-white/10 dark:bg-black/20 px-3 py-1.5 rounded-full shrink-0">
                    Compartir →
                  </span>
                </div>
              </div>

              {/* Récord batido destacado si aplica */}
              {hasPRs && (
                <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/10 border border-yellow-500/40 rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-500 shrink-0">
                    <Award size={22} />
                  </div>
                  <div>
                    <span className="text-xs font-black tracking-widest text-yellow-500 uppercase">
                      ¡Récord batido en esta sesión!
                    </span>
                    <p className="text-sm font-bold text-text-primary">
                      {newPRs?.[0]?.exercise || workoutData?.newPRs?.[0]?.exercise || 'Marca personal superada'}
                    </p>
                  </div>
                </div>
              )}

              {/* Métricas Resumen */}
              <div>
                <h3 className="text-xl font-black text-accent mb-3 flex items-center gap-2">
                  <Target size={20} />
                  {safeRoutineName}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-bg-secondary p-4 rounded-xl border border-glass-border shadow-sm">
                    <Clock size={24} className="mx-auto text-text-secondary mb-1" />
                    <span className="text-xs text-text-secondary font-bold uppercase tracking-wider">Duración</span>
                    <p className="text-xl font-black text-text-primary">{formatTime(duration_seconds || 0)}</p>
                  </div>
                  <div className="bg-bg-secondary p-4 rounded-xl border border-glass-border shadow-sm">
                    <Flame size={24} className="mx-auto text-text-secondary mb-1" />
                    <span className="text-xs text-text-secondary font-bold uppercase tracking-wider">Calorías</span>
                    <p className="text-xl font-black text-text-primary">{Math.round(safeCalories)} kcal</p>
                  </div>
                </div>
              </div>

              {/* Lista de Ejercicios */}
              <div className="space-y-4 pr-1">
                <h4 className="text-lg font-bold text-text-primary">Detalle de Ejercicios</h4>
                {safeDetails.length > 0 ? (
                  <div className="space-y-4">
                    {safeDetails.map((ex, index) => (
                      <div key={index} className="bg-bg-secondary overflow-hidden rounded-xl border border-glass-border shadow-inner">
                        <div className="w-full bg-bg-primary relative flex items-center justify-center border-b border-glass-border">
                          <ExerciseMedia
                            details={ex}
                            forceAuto={true}
                            fitMode="contain"
                            className="w-full max-h-[250px] !rounded-none"
                          />
                        </div>
                        <div className="p-4">
                          <p className="font-bold text-text-primary text-base break-words">
                            {t(ex.exerciseName, { ns: 'exercise_names', defaultValue: ex.exerciseName })}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {(Array.isArray(ex.setsDone) ? ex.setsDone : []).map((set, setIndex) => (
                              <div
                                key={setIndex}
                                className="bg-bg-primary/50 border border-white/5 px-2 py-1.5 rounded-lg text-xs font-semibold text-text-secondary"
                              >
                                {set.weight_kg || 0}kg × {set.reps || 0}
                                {set.rir !== null && set.rir !== undefined ? ` @${set.rir}RIR` : ''}
                                {set.is_dropset ? ' (Drop)' : ''}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-secondary italic">No se registraron ejercicios de fuerza.</p>
                )}

                {safeNotes && (
                  <div>
                    <h4 className="text-lg font-semibold text-text-primary mb-2">Notas</h4>
                    <p className="bg-bg-secondary p-4 rounded-xl border border-glass-border text-text-secondary text-sm whitespace-pre-wrap">
                      {safeNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Pie Fijo de Botones */}
            <div className="p-4 sm:p-6 border-t border-glass-border bg-bg-primary z-10 shrink-0 flex flex-col gap-2.5">
              {/* Botón Destacado: Compartir en Redes */}
              <button
                type="button"
                onClick={() => setIsStoryView(true)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-white font-black text-base transition-transform hover:scale-[1.01] active:scale-95 shadow-xl flex items-center justify-center gap-2"
              >
                <FaShareNodes size={18} />
                <span>Compartir en Redes Sociales</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-bg-secondary border border-glass-border text-text-secondary font-bold text-sm transition hover:bg-bg-primary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalPortal>
  );
};

export default WorkoutSummaryModal;