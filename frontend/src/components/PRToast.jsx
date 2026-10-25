/* frontend/src/components/PRToast.jsx */
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, X, Download, Camera, Trash2, ArrowLeft } from 'lucide-react';
import { FaInstagram } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import { useAppTheme } from '../hooks/useAppTheme';
import { getToastThemePalette } from '../contexts/ToastProvider';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import PRShareCard from './PRShareCard';
import ScaleToFit from './ScaleToFit';
import Spinner from './Spinner';
import ModalPortal from './ModalPortal';

const PRToast = ({ newPRs, onClose }) => {
  const { t } = useTranslation('exercise_names');
  const { resolvedTheme } = useAppTheme();
  const palette = getToastThemePalette(resolvedTheme);
  const userProfile = useAppStore((state) => state.userProfile);
  const { showToast } = useToast();

  const [showStoryModal, setShowStoryModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPhoto, setCustomPhoto] = useState(null);

  const prCardRef = useRef(null);
  const photoInputRef = useRef(null);

  if (!newPRs || newPRs.length === 0) {
    return null;
  }

  const primaryPR = newPRs[0] || {};
  const prShareData = {
    exerciseName: primaryPR.exercise,
    oldWeight: primaryPR.old_weight || primaryPR.oldWeight || Math.max(0, (primaryPR.weight || 0) - 5),
    newWeight: primaryPR.weight,
    date: new Date().toISOString()
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
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
    showToast('Foto eliminada', 'info');
  };

  const generateCardBlob = async () => {
    if (!prCardRef.current) throw new Error('Referencia de tarjeta no encontrada');
    return await html2canvas(prCardRef.current, {
      scale: 1,
      useCORS: true,
      backgroundColor: '#000000',
      logging: false,
      allowTaint: true
    });
  };

  const handleDownloadPRStory = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const canvas = await generateCardBlob();
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
        link.download = `pr-${primaryPR.exercise || 'record'}-${new Date().toISOString().slice(0, 10)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('¡Récord guardado en tu galería!', 'success');
      }
    } catch (err) {
      console.error('Error descargando PR Story:', err);
      showToast('Error al generar la imagen', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareToStories = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const canvas = await generateCardBlob();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], `pr-story-${Date.now()}.png`, { type: 'image/png' });

      const shareData = {
        files: [file],
        title: '¡Nuevo Récord Personal en Pro Fitness Glass!',
        text: `¡He batido récord en ${t(primaryPR.exercise)} con ${primaryPR.weight} kg! 💪🏆 #ProFitnessGlass`
      };

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(shareData);
        showToast('¡Compartido con éxito!', 'success');
      } else {
        await handleDownloadPRStory();
        showToast('Imagen guardada. ¡Lista para subir a tus Stories de Instagram!', 'info');
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.warn('Share falló, descargando:', e);
        await handleDownloadPRStory();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* TARJETA OCULTA OFFSCREEN PARA EXPORTACIÓN EXACTA 1080x1920 */}
      <div style={{ position: 'fixed', left: '-20000px', top: '-20000px', width: '1080px', height: '1920px', zIndex: -100 }}>
        <PRShareCard
          ref={prCardRef}
          prData={prShareData}
          userName={userProfile?.username}
          userImage={userProfile?.profile_image || userProfile?.profile_image_url}
          customBgPhoto={customPhoto}
        />
      </div>

      <input
        type="file"
        ref={photoInputRef}
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      {/* TOAST FLOTANTE CON BOTÓN DIRECTO "STORIES" */}
      <div className="fixed bottom-24 md:bottom-10 left-4 right-4 md:left-auto md:right-10 z-[100] animate-[fade-in-up_0.5s_ease-out] flex justify-center md:block pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm">
          <div
            className="w-full p-4 rounded-[26px] transition-all"
            style={{
              backgroundColor: palette.bgBase,
              backgroundImage: palette.bgGradient,
              backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
              border: `1px solid ${palette.borderColor}`,
              boxShadow: 'none',
            }}
          >
            <div className="flex items-start gap-3.5">
              <div
                className="flex-shrink-0 p-2.5 rounded-2xl flex items-center justify-center bg-yellow-500/15 border border-yellow-500/30 text-yellow-400"
              >
                <Award size={24} strokeWidth={2.4} />
              </div>
              <div className="flex-grow min-w-0">
                <h3
                  className="font-black text-base tracking-tight leading-snug"
                  style={{ color: palette.textColor }}
                >
                  ¡Nuevo Récord Personal!
                </h3>
                <ul
                  className="mt-1 text-xs sm:text-sm font-semibold list-disc pl-4 space-y-0.5"
                  style={{ color: palette.subtextColor }}
                >
                  {newPRs.map((pr, index) => (
                    <li key={index}>
                      <strong style={{ color: palette.textColor }}>{t(pr.exercise)}:</strong> {pr.weight} kg
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl transition-opacity hover:opacity-100 opacity-60 shrink-0"
                style={{ color: palette.textColor }}
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            {/* BOTÓN DIRECTO: COMPARTIR EN STORIES */}
            <div className="mt-3 pt-3 border-t border-glass-border flex items-center gap-2">
              <button
                onClick={() => setShowStoryModal(true)}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-white font-extrabold text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
              >
                <FaInstagram size={15} />
                <span>Compartir en Stories</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL HISTORIA DE INSTAGRAM PARA PR */}
      {showStoryModal && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-between p-4 animate-[fade-in_0.2s_ease-out]"
            style={{ paddingTop: 'max(1rem, var(--safe-top))', paddingBottom: 'max(1rem, var(--safe-bottom))' }}
            onClick={() => setShowStoryModal(false)}
          >
            <button
              onClick={() => setShowStoryModal(false)}
              className="absolute z-[210] p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all backdrop-blur-md shadow-xl"
              style={{ top: 'max(1rem, var(--safe-top))', right: '1rem' }}
            >
              <X size={22} />
            </button>

            {/* Header del modal */}
            <div className="w-full max-w-md flex items-center justify-between shrink-0 mb-2 px-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-lg">
                  <FaInstagram size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white tracking-wide uppercase">
                    PR Story Studio
                  </span>
                  <span className="text-[10px] text-white/60 font-semibold">
                    Instagram Stories • Strava Style
                  </span>
                </div>
              </div>

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

            {/* Vista Previa Escalada 9:16 */}
            <div
              className="flex-1 w-full min-h-0 flex items-center justify-center pointer-events-none my-2"
              onClick={(e) => e.stopPropagation()}
            >
              <ScaleToFit width={1080} height={1920}>
                <div className="w-[1080px] h-[1920px] rounded-[3.5rem] overflow-hidden shadow-2xl border border-white/20 pointer-events-auto">
                  <PRShareCard
                    prData={prShareData}
                    userName={userProfile?.username}
                    userImage={userProfile?.profile_image || userProfile?.profile_image_url}
                    customBgPhoto={customPhoto}
                  />
                </div>
              </ScaleToFit>
            </div>

            {/* Botones de acción */}
            <div className="w-full max-w-md shrink-0 flex flex-col gap-2.5 mt-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleDownloadPRStory}
                  disabled={isGenerating}
                  className="py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
                  title="Descargar imagen"
                >
                  {isGenerating ? <Spinner size={18} /> : <Download size={18} />}
                  <span className="hidden sm:inline">Descargar</span>
                </button>

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
                onClick={() => setShowStoryModal(false)}
                className="w-full py-2.5 text-xs text-white/60 hover:text-white font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft size={14} /> Volver
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
};

export default PRToast;
