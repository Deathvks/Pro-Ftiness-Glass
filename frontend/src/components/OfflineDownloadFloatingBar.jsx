/* frontend/src/components/OfflineDownloadFloatingBar.jsx */
import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import {
  subscribeToOfflineDownload,
  cancelOfflineDownloadSession
} from '../services/offlineExerciseService';

const OfflineDownloadFloatingBar = ({ navigate }) => {
  const [downloadState, setDownloadState] = useState({
    isDownloading: false,
    progress: { current: 0, total: 0, percent: 0, bytesDownloaded: 0 }
  });

  useEffect(() => {
    const unsubscribe = subscribeToOfflineDownload((state) => {
      setDownloadState(state);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (!downloadState.isDownloading) {
    return null;
  }

  const { progress } = downloadState;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 -translate-x-1/2 z-[180] animate-[fade-in_0.3s_ease-out] w-auto max-w-[calc(100vw-1.5rem)] px-1"
      style={{ top: 'calc(var(--safe-top, 0px) + 0.65rem)' }}
    >
      <div
        onClick={() => {
          if (typeof navigate === 'function') {
            navigate('settings', { tab: 'offline' });
          }
        }}
        className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-bg-secondary/95 text-text-primary shadow-2xl border border-glass-border ring-1 ring-accent/30 dark:ring-accent/40 backdrop-blur-2xl transition-all cursor-pointer hover:scale-[1.02]"
      >
        <Download size={14} className="text-accent shrink-0 animate-bounce" />
        <span className="text-xs sm:text-sm font-semibold tracking-tight text-text-primary whitespace-nowrap">
          Descargando offline: <strong className="text-accent font-extrabold">{progress.percent}%</strong>
          <span className="hidden sm:inline text-text-secondary text-xs ml-1">
            ({progress.current} de {progress.total})
          </span>
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            cancelOfflineDownloadSession();
          }}
          className="ml-1 text-text-muted hover:text-red-500 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors shrink-0 cursor-pointer"
          title="Cancelar descarga"
          aria-label="Cancelar descarga"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default OfflineDownloadFloatingBar;
