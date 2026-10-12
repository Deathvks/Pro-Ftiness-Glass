/* frontend/src/components/Workout/PreviousWorkoutNoteBanner.jsx */
import React from 'react';
import { StickyNote, X, Copy, Check } from 'lucide-react';
import { formatDateForDisplay, formatDateToShort } from '../../utils/dateUtils';

const PreviousWorkoutNoteBanner = ({
  previousNote,
  onDismiss,
  onCopyNote
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!previousNote || !previousNote.note) return null;

  const handleCopy = () => {
    if (onCopyNote) {
      onCopyNote(previousNote.note);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="mb-6 relative overflow-hidden rounded-[28px] bg-gradient-to-r from-accent/15 via-accent/10 to-transparent dark:from-accent/20 dark:via-accent/10 dark:to-transparent ring-1 ring-accent/30 dark:ring-accent/40 backdrop-blur-xl p-4 sm:p-5 shadow-lg animate-[fade-in_0.3s_ease-out]">
      {/* Glow decorativo sutil en la esquina */}
      <div className="absolute -right-12 -top-12 w-32 h-32 bg-accent/20 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div className="p-2.5 rounded-[16px] bg-accent/20 text-accent ring-1 ring-accent/40 shrink-0 mt-0.5 shadow-sm">
            <StickyNote size={20} strokeWidth={2.5} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-accent">
                Nota de tu sesión anterior
              </span>
              {previousNote.date && (
                <span className="text-[10px] font-bold text-text-muted bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full">
                  {formatDateToShort(previousNote.date) || previousNote.date}
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-text-primary leading-relaxed whitespace-pre-wrap break-words italic pl-2 border-l-2 border-accent/40 my-2">
              "{previousNote.note}"
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 dark:bg-white/10 dark:hover:bg-white/15 text-text-primary transition-all active:scale-95 shadow-sm"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-400" strokeWidth={3} />
                    <span className="text-emerald-400">Copiada a notas</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} className="text-accent" />
                    <span>Copiar a mis notas de hoy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-white/10 transition-all active:scale-90 shrink-0"
            title="Cerrar recordatorio"
            aria-label="Cerrar"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
};

export default PreviousWorkoutNoteBanner;
