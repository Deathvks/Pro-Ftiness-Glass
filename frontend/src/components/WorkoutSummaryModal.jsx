/* frontend/src/components/WorkoutSummaryModal.jsx */
import React, { useState, useRef, useEffect } from 'react';
import { X, Share2, Clock, Flame, Target, ArrowLeft, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import useAppStore from '../store/useAppStore';
import WorkoutShareCard from './WorkoutShareCard';
import Spinner from './Spinner';

// Helper para formatear el tiempo
const formatTime = (timeInSeconds) => {
  const hours = String(Math.floor(timeInSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((timeInSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(timeInSeconds % 60).padStart(2, '0');
  if (hours !== '00') return `${hours}:${minutes}:${seconds}`;
  return `${minutes}:${seconds}`;
};

const WorkoutSummaryModal = ({ workoutData, onClose }) => {
  const { t } = useTranslation(['exercise_names']);
  const { userProfile } = useAppStore(state => ({ userProfile: state.userProfile }));

  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [accentColor, setAccentColor] = useState('#22c55e');

  const shareCardRef = useRef(null);

  useEffect(() => {
    const resolveAccentColor = () => {
      try {
        // 1. Elemento dummy para leer el color real de Tailwind
        const tempDiv = document.createElement('div');
        tempDiv.className = 'bg-accent';
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);

        // 2. Lectura
        const computedStyle = window.getComputedStyle(tempDiv);
        const bgColor = computedStyle.backgroundColor;

        document.body.removeChild(tempDiv);

        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          setAccentColor(bgColor);
        } else {
          // Fallback a variable CSS directa
          const docStyle = getComputedStyle(document.documentElement);
          const rawVar = docStyle.getPropertyValue('--accent').trim();

          if (rawVar) {
            if (rawVar.includes(' ')) {
              setAccentColor(`hsl(${rawVar})`);
            } else {
              setAccentColor(rawVar);
            }
          }
        }
      } catch (e) {
        console.warn('Error detectando color:', e);
      }
    };

    setTimeout(resolveAccentColor, 200);
  }, []);

  const handleGeneratePreview = async () => {
    if (!workoutData || isGenerating) return;
    setIsGenerating(true);

    try {
      if (shareCardRef.current) {
        const canvas = await html2canvas(shareCardRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#000000',
          logging: false,
        });

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const file = new File([blob], 'workout-summary.png', { type: 'image/png' });
        const previewUrl = URL.createObjectURL(blob);

        setImageFile(file);
        setPreviewImage(previewUrl);
      }
    } catch (error) {
      console.error('Error generando preview:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNativeShare = async () => {
    if (!imageFile) return;

    if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
      try {
        await navigator.share({
          files: [imageFile],
          title: 'Mi Entrenamiento',
          text: '¡Mira mi progreso en Pro Fitness Glass! 💪',
        });
      } catch (e) { console.log('Share cancelado'); }
    } else {
      const link = document.createElement('a');
      link.href = previewImage;
      link.download = `workout-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">

      {/* --- GENERADOR (Fuera de pantalla) --- */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
        <WorkoutShareCard
          ref={shareCardRef}
          workoutData={workoutData}
          userName={userProfile?.username}
          accentColor={accentColor}
        />
      </div>

      <div className="w-full max-w-lg m-4 p-6 relative max-h-[90vh] overflow-y-auto bg-bg-primary rounded-2xl border border-glass-border shadow-2xl animate-[scale-in_0.3s_ease-out] flex flex-col">

        <div className="flex justify-between items-center mb-4 border-b border-glass-border pb-4 shrink-0">
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

        {previewImage ? (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div className="relative w-full rounded-xl overflow-hidden shadow-lg border border-glass-border bg-black">
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-auto max-h-[60vh] object-contain"
              />
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={resetPreview}
                className="flex-1 py-3 rounded-xl border border-glass-border text-text-secondary font-bold hover:bg-bg-secondary transition flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} /> Volver
              </button>
              <button
                onClick={handleNativeShare}
                className="flex-[2] py-3 rounded-xl bg-accent text-bg-secondary font-bold hover:brightness-110 transition shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
              >
                <Send size={18} /> Compartir
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 shrink-0">
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

            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
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
              className="mt-6 w-full px-6 py-3 rounded-xl bg-accent text-bg-secondary font-bold transition hover:scale-[1.01] shadow-lg shadow-accent/20 shrink-0"
            >
              Cerrar
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default WorkoutSummaryModal;