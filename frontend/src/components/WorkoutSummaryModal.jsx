/* frontend/src/components/WorkoutSummaryModal.jsx */
import React, { useState, useRef, useEffect } from 'react';
import { X, Share2, Clock, Flame, Target, ArrowLeft, Download, Camera, Image, Trash2, Award, Sparkles, Check } from 'lucide-react';
import { FaInstagram } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
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

const WorkoutSummaryModal = ({ workoutData, onClose, isShareMode = false }) => {
  useModalLock();

  const { t } = useTranslation(['exercise_names']);
  const { userProfile, getOrFetchAllExercises } = useAppStore((state) => ({
    userProfile: state.userProfile,
    getOrFetchAllExercises: state.getOrFetchAllExercises
  }));
  const { showToast } = useToast();

  const [isStoryView, setIsStoryView] = useState(isShareMode);
  const [isGenerating, setIsGenerating] = useState(false);
  const [accentColor, setAccentColor] = useState('#22c55e');
  const [enrichedDetails, setEnrichedDetails] = useState([]);
  const [customPhoto, setCustomPhoto] = useState(null);

  const shareCardRef = useRef(null);
  const photoInputRef = useRef(null);

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
        showToast('Foto añadida a tu Historia 📸', 'success');
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

  // Generador de imagen en alta resolución 1080x1920 (Instagram Stories 9:16)
  const generateStoryBlob = async () => {
    if (!shareCardRef.current) throw new Error('Referencia de tarjeta no encontrada');
    return await html2canvas(shareCardRef.current, {
      scale: 1,
      useCORS: true,
      backgroundColor: '#000000',
      logging: false,
      allowTaint: true
    });
  };

  const handleDownloadStory = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const canvas = await generateStoryBlob();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const url = URL.createObjectURL(blob);

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        const newWindow = window.open(url, '_blank');
        if (!newWindow) {
          showToast('Mantén pulsada la imagen para guardarla en tu carrete', 'info');
        } else {
          showToast('Guarda la imagen desde la nueva pestaña', 'success');
        }
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = `pro-fitness-story-${new Date().toISOString().slice(0, 10)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('¡Historia guardada en tu galería!', 'success');
      }
    } catch (err) {
      console.error('Error descargando historia:', err);
      showToast('Error al procesar la imagen', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Compartir directamente en Instagram Stories mediante el Native Share Sheet del móvil
  const handleShareToStories = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const canvas = await generateStoryBlob();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], `pro-fitness-story-${Date.now()}.png`, { type: 'image/png' });

      const shareData = {
        files: [file],
        title: 'Mi Entrenamiento en Pro Fitness Glass',
        text: '¡Entrenamiento completado en Pro Fitness Glass! 💪🔥 #ProFitnessGlass'
      };

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(shareData);
        showToast('¡Listo para tus Stories!', 'success');
      } else {
        // Fallback a descarga automática con indicación clara
        await handleDownloadStory();
        showToast('Imagen lista en tu galería. ¡Súbela a tus Stories de Instagram!', 'info');
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.warn('Share falló, descargando:', e);
        await handleDownloadStory();
      }
    } finally {
      setIsGenerating(false);
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
      <div style={{ position: 'fixed', left: '-20000px', top: '-20000px', width: '1080px', height: '1920px', zIndex: -100 }}>
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

      {/* VISTA 1: EDITOR / PREVIEW DIRECTO DE STORIES (ESTILO STRAVA / SPOTIFY WRAPPED) */}
      {isStoryView ? (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-between p-4 animate-[fade-in_0.2s_ease-out]"
          style={{ paddingTop: 'max(1rem, var(--safe-top))', paddingBottom: 'max(1rem, var(--safe-bottom))' }}
          onClick={() => setIsStoryView(false)}
        >
          {/* Botón Cerrar Preview */}
          <button
            onClick={() => {
              if (isShareMode) onClose();
              else setIsStoryView(false);
            }}
            className="absolute z-[110] p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all backdrop-blur-md shadow-xl"
            style={{ top: 'max(1rem, var(--safe-top))', right: '1rem' }}
          >
            <X size={22} />
          </button>

          {/* Cabecera Stories */}
          <div className="w-full max-w-md flex items-center justify-between shrink-0 mb-2 px-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-lg">
                <FaInstagram size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-white tracking-wide uppercase">
                  Instagram Story Studio
                </span>
                <span className="text-[10px] text-white/60 font-semibold">
                  Formato 9:16 (1080x1920) • Strava Style
                </span>
              </div>
            </div>

            {/* Selector de Foto Opcional */}
            {customPhoto ? (
              <button
                onClick={removePhoto}
                className="px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold flex items-center gap-1.5 hover:bg-red-500/30 transition-all shadow-md"
              >
                <Trash2 size={13} /> Quitar Foto
              </button>
            ) : (
              <button
                onClick={() => photoInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-white/25 transition-all shadow-md"
              >
                <Camera size={14} className="text-yellow-400" /> + Foto de Fondo
              </button>
            )}
          </div>

          {/* Tarjeta Centrada Escalada (ScaleToFit) */}
          <div
            className="flex-1 w-full min-h-0 flex items-center justify-center pointer-events-none my-2"
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

          {/* Botonera de Acción de Stories */}
          <div className="w-full max-w-md shrink-0 flex flex-col gap-2.5 mt-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-2 w-full">
              {/* Botón Descargar HD */}
              <button
                onClick={handleDownloadStory}
                disabled={isGenerating}
                className="py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
                title="Descargar imagen en alta resolución"
              >
                {isGenerating ? <Spinner size={18} /> : <Download size={18} />}
                <span className="hidden sm:inline">Descargar</span>
              </button>

              {/* Botón Primario: Compartir en Stories */}
              <button
                onClick={handleShareToStories}
                disabled={isGenerating}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-white font-black text-base tracking-wide flex items-center justify-center gap-2.5 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Spinner size={18} />
                    <span>Preparando Historia...</span>
                  </>
                ) : (
                  <>
                    <FaInstagram size={20} className="drop-shadow" />
                    <span>Compartir en Stories</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => setIsStoryView(false)}
              className="w-full py-2.5 text-xs text-white/60 hover:text-white font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft size={14} /> {isShareMode ? 'Ver desglose de ejercicios' : 'Volver al resumen del entrenamiento'}
            </button>
          </div>
        </div>
      ) : (
        /* VISTA 2: RESUMEN DE SESIÓN GUARDADA (CON ACCESO DIRECTO A STORIES) */
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-[fade-in_0.25s_ease-out]">
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
                  onClick={() => setIsStoryView(true)}
                  className="p-2 text-text-muted hover:text-accent transition-colors rounded-full hover:bg-bg-secondary"
                  title="Abrir Studio de Stories"
                >
                  <Share2 size={20} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-text-muted hover:text-red transition-colors rounded-full hover:bg-bg-secondary"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Contenido con scroll interno */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-bg-primary">
              {/* BANNER PROMOCIONAL DIRECTO: INSTAGRAM STORIES */}
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
                        Tarjeta para Instagram Stories
                        <Sparkles size={14} className="text-yellow-400" />
                      </h4>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Estilo Strava / Wrapped con músculos, volumen y foto opcional.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-[#dc2743] uppercase tracking-wider bg-white/10 dark:bg-black/20 px-3 py-1.5 rounded-full shrink-0">
                    Abrir →
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
              {/* Botón Destacado: Compartir en Stories */}
              <button
                onClick={() => setIsStoryView(true)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-white font-black text-base transition-transform hover:scale-[1.01] active:scale-95 shadow-xl flex items-center justify-center gap-2"
              >
                <FaInstagram size={19} />
                <span>Compartir en Stories</span>
              </button>

              <button
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
