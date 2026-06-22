/* frontend/src/components/WorkoutSummaryModal.jsx */
import React, { useState, useRef, useEffect } from 'react';
import { X, Share2, Clock, Flame, Target, ArrowLeft, Send, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import WorkoutShareCard from './WorkoutShareCard';
import Spinner from './Spinner';

const formatTime = (timeInSeconds) => {
  const hours = String(Math.floor(timeInSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((timeInSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(timeInSeconds % 60).padStart(2, '0');
  if (hours !== '00') return `${hours}:${minutes}:${seconds}`;
  return `${minutes}:${seconds}`;
};

const WorkoutSummaryModal = ({ workoutData, onClose, isShareMode = false }) => {
  const { t } = useTranslation(['exercise_names']);
  const { userProfile } = useAppStore(state => ({ userProfile: state.userProfile }));
  const { showToast } = useToast();

  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [accentColor, setAccentColor] = useState('#22c55e');

  const shareCardRef = useRef(null);

  // Bloquear el scroll de la app de fondo mientras el modal esté abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
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
      } catch (e) { console.warn(e); }
    };
    setTimeout(resolveAccentColor, 200);
  }, []);

  useEffect(() => {
    if (isShareMode && !previewImage && !isGenerating && shareCardRef.current) {
      const timer = setTimeout(() => {
        handleGeneratePreview();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isShareMode, previewImage, isGenerating]);

  const handleGeneratePreview = async () => {
    if (!workoutData || isGenerating) return;
    setIsGenerating(true);

    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      if (shareCardRef.current) {
        const canvas = await html2canvas(shareCardRef.current, {
          scale: 1,
          useCORS: true,
          backgroundColor: '#000000',
          logging: false,
          allowTaint: true,
        });

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const file = new File([blob], 'workout-summary.png', { type: 'image/png' });
        const previewUrl = URL.createObjectURL(blob);

        setImageFile(file);
        setPreviewImage(previewUrl);
      } else {
        throw new Error("Elemento de referencia no encontrado");
      }
    } catch (error) {
      console.error('Error generando preview:', error);
      showToast('Error al generar la imagen. Inténtalo de nuevo.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!previewImage) return;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
      const newWindow = window.open(previewImage, '_blank');
      if (!newWindow) {
        showToast('Mantén pulsada la imagen para guardarla', 'info');
      } else {
        showToast('Guarda la imagen desde la nueva pestaña', 'success');
      }
    } else {
      const link = document.createElement('a');
      link.href = previewImage;
      link.download = `workout-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Imagen guardada', 'success');
    }
  };

  const handleNativeShare = async () => {
    if (!imageFile) return;
    const shareData = {
      files: [imageFile],
      title: 'Mi Entrenamiento',
      text: 'Pro Fitness Glass 💪',
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        throw new Error('API no soportada');
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.warn('Share falló:', e);
        showToast('No se pudo abrir el menú compartir. Usa el botón de descarga.', 'error');
      }
    }
  };

  const resetPreview = () => {
    setPreviewImage(null);
    setImageFile(null);
  };

  if (!workoutData) return null;

  const { routineName, duration_seconds, calories_burned, details, notes } = workoutData;
  const safeRoutineName = routineName || "Entrenamiento";
  const safeCalories = calories_burned || 0;
  const safeDetails = details || [];
  const safeNotes = notes || "";

  if (isShareMode && isGenerating && !previewImage) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
        <div style={{ position: 'absolute', top: 0, left: 0, width: '1080px', zIndex: -100, opacity: 0, pointerEvents: 'none' }}>
          <WorkoutShareCard
            ref={shareCardRef}
            workoutData={workoutData}
            userName={userProfile?.username}
            accentColor={accentColor}
          />
        </div>

        <div className="flex flex-col items-center justify-center">
          <Spinner size={50} />
          <p className="mt-4 text-white font-medium animate-pulse">Generando vista previa...</p>
        </div>
      </div>
    );
  }

  return (
    // 1. FONDO CON SCROLL ABSOLUTO: Elimina los bloqueos táctiles en móviles
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md overflow-y-auto overscroll-contain animate-[fade-in_0.3s_ease-out]">

      <div style={{ position: 'absolute', top: 0, left: 0, width: '1080px', zIndex: -100, opacity: 0, pointerEvents: 'none' }}>
        <WorkoutShareCard
          ref={shareCardRef}
          workoutData={workoutData}
          userName={userProfile?.username}
          accentColor={accentColor}
        />
      </div>

      {/* 2. WRAPPER FLEXIBLE: Centra el modal si es pequeño, o permite deslizarlo desde los extremos si es grande */}
      <div className="min-h-full flex items-center justify-center p-4 py-12 sm:py-16">

        {/* 3. TARJETA LIBRE: Sin restricciones de altura (max-h) ni scrolls internos anidados */}
        <div className="w-full max-w-lg bg-bg-primary rounded-2xl border border-glass-border shadow-2xl flex flex-col overflow-hidden">
          
          <div className="p-6 border-b border-glass-border flex justify-between items-center bg-bg-primary sticky top-0 z-10">
            <h2 className="text-2xl font-bold text-text-primary">
              {previewImage ? 'Vista Previa' : '¡Entrenamiento Guardado!'}
            </h2>
            <div className="flex gap-2">
              {!previewImage && (
                <button
                  onClick={handleGeneratePreview}
                  disabled={isGenerating}
                  className="p-2 text-text-muted hover:text-accent transition-colors rounded-full hover:bg-bg-secondary disabled:opacity-50"
                  title="Generar imagen"
                >
                  {isGenerating ? <Spinner size={20} /> : <Share2 size={20} />}
                </button>
              )}
              <button onClick={onClose} className="p-2 text-text-muted hover:text-red transition-colors rounded-full hover:bg-bg-secondary">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {previewImage ? (
              <div className="flex flex-col items-center gap-4 animate-fade-in">
                <div className="relative w-full rounded-xl overflow-hidden shadow-lg border border-glass-border bg-black">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-auto max-h-[60vh] object-contain"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 w-full">
                  <button
                    onClick={isShareMode ? onClose : resetPreview}
                    className="w-full sm:flex-1 py-3 rounded-xl border border-glass-border text-text-secondary font-bold hover:bg-bg-secondary transition flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={18} /> {isShareMode ? 'Cerrar' : 'Volver'}
                  </button>

                  <button
                    onClick={downloadImage}
                    className="w-full sm:w-14 py-3 sm:py-0 flex items-center justify-center rounded-xl bg-bg-secondary border border-glass-border text-text-primary hover:text-accent transition"
                    title="Descargar imagen"
                  >
                    <Download size={20} />
                  </button>

                  <button
                    onClick={handleNativeShare}
                    className="w-full sm:flex-[2] py-3 rounded-xl bg-accent text-bg-secondary font-bold hover:brightness-110 transition shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
                  >
                    <Send size={18} /> Compartir
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-xl font-semibold text-accent mb-3 flex items-center gap-2">
                    <Target size={20} />
                    {safeRoutineName}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-bg-secondary p-4 rounded-xl border border-glass-border shadow-sm">
                      <Clock size={24} className="mx-auto text-text-secondary mb-1" />
                      <span className="text-sm text-text-secondary">Duración</span>
                      <p className="text-xl font-bold text-text-primary">{formatTime(duration_seconds || 0)}</p>
                    </div>
                    <div className="bg-bg-secondary p-4 rounded-xl border border-glass-border shadow-sm">
                      <Flame size={24} className="mx-auto text-text-secondary mb-1" />
                      <span className="text-sm text-text-secondary">Calorías</span>
                      <p className="text-xl font-bold text-text-primary">{Math.round(safeCalories)} kcal</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pr-1">
                  <h4 className="text-lg font-semibold text-text-primary">Resumen de Ejercicios</h4>
                  {safeDetails.length > 0 ? (
                    <div className="space-y-3 bg-bg-secondary p-4 rounded-xl border border-glass-border shadow-inner">
                      {safeDetails.map((ex, index) => (
                        <div key={index} className="pb-3 border-b border-glass-border last:border-0 last:pb-0">
                          <p className="font-semibold text-text-primary">
                            {t(ex.exerciseName, { ns: 'exercise_names', defaultValue: ex.exerciseName })}
                          </p>
                          <ul className="list-disc list-inside pl-2 text-sm text-text-secondary mt-1">
                            {(Array.isArray(ex.setsDone) ? ex.setsDone : []).map((set, setIndex) => (
                              <li key={setIndex}>
                                {set.weight_kg || 0} kg x {set.reps || 0} reps {set.is_dropset ? '(Dropset)' : ''}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-text-secondary italic">No se registraron ejercicios de fuerza.</p>
                  )}
                  {safeNotes && (
                    <div>
                      <h4 className="text-lg font-semibold text-text-primary mb-2">Notas</h4>
                      <p className="bg-bg-secondary p-4 rounded-xl border border-glass-border text-text-secondary text-sm whitespace-pre-wrap">{safeNotes}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="mt-6 w-full px-6 py-3.5 rounded-xl bg-accent text-bg-secondary font-bold text-lg transition hover:scale-[1.01] shadow-lg shadow-accent/20 flex items-center justify-center"
                >
                  Cerrar
                </button>
              </>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default WorkoutSummaryModal;