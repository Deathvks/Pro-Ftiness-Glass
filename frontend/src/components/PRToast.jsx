/* frontend/src/components/PRToast.jsx */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Award, X, Share2 } from 'lucide-react';
import { useAppTheme } from '../hooks/useAppTheme';
import { getToastThemePalette } from '../contexts/ToastProvider';

const PRToast = ({ newPRs, onClose }) => {
  const { t } = useTranslation('exercise_names');
  const { resolvedTheme } = useAppTheme();
  const palette = getToastThemePalette(resolvedTheme);

  if (!newPRs || newPRs.length === 0) {
    return null;
  }

  const handleShare = async () => {
    const prText = newPRs
      .map((pr) => `  • ${t(pr.exercise)}: ${pr.weight} kg`)
      .join('\n');

    const shareTitle = '¡Nuevo Récord Personal!';
    const shareText = `¡He conseguido ${
      newPRs.length > 1 ? 'nuevos récords' : 'un nuevo récord'
    } en Pro-Fitness-Glass!\n\n${prText}\n\n¡Registra tus progresos tú también!`;
    const isCapacitor = !!window.Capacitor?.isNativePlatform?.() || window.location.origin.includes('localhost') && !window.location.port;
    const shareUrl = isCapacitor ? (import.meta.env.VITE_WEB_URL || 'https://pro-fitness-glass.zeabur.app') : window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error al compartir PR:', error);
      }
    } else {
      console.warn(
        'La función de compartir no está disponible en este navegador.'
      );
    }
  };

  return (
    <div className="fixed bottom-24 md:bottom-10 left-4 right-4 md:left-auto md:right-10 z-[100] animate-[fade-in-up_0.5s_ease-out] flex justify-center md:block pointer-events-none">
      <div className="pointer-events-auto w-full max-w-sm">
        <div
          className="w-full p-4 rounded-[24px] transition-all"
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
              className="flex-shrink-0 p-2.5 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: 'var(--color-accent-transparent)',
                border: '1px solid var(--color-accent-border)',
                color: 'var(--text-accent, var(--color-accent))',
              }}
            >
              <Award size={22} strokeWidth={2.4} />
            </div>
            <div className="flex-grow min-w-0">
              <h3
                className="font-extrabold text-base tracking-tight leading-snug"
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
              onClick={handleShare}
              className="p-1.5 rounded-xl transition-opacity hover:opacity-100 opacity-75"
              style={{ color: palette.textColor }}
              title="Compartir Récord"
            >
              <Share2 size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl transition-opacity hover:opacity-100 opacity-75"
              style={{ color: palette.textColor }}
              title="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PRToast;