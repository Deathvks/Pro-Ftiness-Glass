import ModalPortal from './ModalPortal';
/* frontend/src/components/ErrorBoundary.jsx */
import React from 'react';
import { AlertTriangle, RefreshCw, Trash2, LogOut, Wrench } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      reloadCount: 0,
      isActionRunning: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    try {
      const currentCrashes = parseInt(localStorage.getItem('pfg_crash_loop_count') || '0', 10);
      const nextCrashes = currentCrashes + 1;
      localStorage.setItem('pfg_crash_loop_count', String(nextCrashes));
      this.setState({ reloadCount: nextCrashes });

      // En cuanto se detecta un fallo, purgar de inmediato snapshots volátiles
      // para que al recargar la app nazca saneada
      localStorage.removeItem('pfg_cached_initial_state_v1');
      localStorage.removeItem('pfg_cache_version');
      localStorage.removeItem('lastView');
      sessionStorage.clear();
    } catch {}
  }

  purgeLocalCache = () => {
    try {
      localStorage.removeItem('pfg_cached_initial_state_v1');
      localStorage.removeItem('pfg_cache_version');
      localStorage.removeItem('lastView');
      localStorage.removeItem('activeWorkout');
      localStorage.removeItem('workoutStartTime');
      localStorage.removeItem('isWorkoutPaused');
      localStorage.removeItem('workoutAccumulatedTime');
      localStorage.removeItem('isResting');
      localStorage.removeItem('restTimerEndTime');
      localStorage.removeItem('pfg_crash_loop_count');
      sessionStorage.clear();

      if ('caches' in window) {
        caches.keys().then((keys) =>
          Promise.all(keys.filter((k) => k.includes('vite-hashed') || k.includes('api-') || k.includes('runtime')).map((k) => caches.delete(k)))
        ).catch(() => {});
      }
    } catch {}
  };

  handleReload = () => {
    if (this.state.isActionRunning) return;
    this.setState({ isActionRunning: true });

    this.purgeLocalCache();
    window.location.reload();
  };

  handleResetAllData = () => {
    if (this.state.isActionRunning) return;
    this.setState({ isActionRunning: true });

    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {});
      }
    } catch (_) {}

    window.location.replace('/login');
  };

  render() {
    if (this.state.hasError) {
      const isRepeatCrash = this.state.reloadCount > 1;

      return (
        <ModalPortal>
          <div className="fixed inset-0 bg-bg-primary/95 backdrop-blur-md flex items-center justify-center p-4 z-[9999] !pt-[calc(1rem+var(--safe-top))] !pb-[calc(1rem+var(--safe-bottom))]">
            <div className="bg-bg-primary border border-glass-border rounded-3xl shadow-2xl p-6 sm:p-7 max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
              <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-5 ring-1 ring-red-500/20">
                {isRepeatCrash ? (
                  <Wrench className="text-accent" size={32} />
                ) : (
                  <AlertTriangle className="text-red-500" size={32} />
                )}
              </div>

              <h2 className="text-2xl font-black text-text-primary mb-2 tracking-tight">
                {isRepeatCrash ? 'Reparación de la App' : 'Algo salió mal'}
              </h2>

              <p className="text-text-muted text-sm leading-relaxed mb-6">
                {isRepeatCrash
                  ? 'Hemos detectado un fallo recurrente. Pulsa en Reparar para sanear la memoria de la app automáticamente sin perder tu cuenta.'
                  : 'La aplicación ha encontrado un problema al procesar los datos de la pantalla. Pulsa en Reparar y Recargar para continuar.'}
              </p>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={this.handleReload}
                  disabled={this.state.isActionRunning}
                  className="w-full py-3 px-4 bg-accent text-accent-contrast font-bold rounded-2xl hover:bg-accent/90 transition-all flex items-center justify-center gap-2 active:scale-98 shadow-md shadow-accent/20 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={18} className={this.state.isActionRunning ? 'animate-spin' : ''} />
                  <span>{isRepeatCrash ? 'Reparar y Recargar' : 'Recargar Aplicación'}</span>
                </button>

                <button
                  type="button"
                  onClick={this.handleResetAllData}
                  disabled={this.state.isActionRunning}
                  className="w-full py-2.5 px-4 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  <span>Restablecer datos locales</span>
                </button>

                <button
                  type="button"
                  onClick={this.handleResetAllData}
                  disabled={this.state.isActionRunning}
                  className="w-full py-2 px-4 text-xs font-semibold text-text-muted hover:text-red-500 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-1"
                >
                  <LogOut size={14} />
                  <span>Cerrar sesión de emergencia</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
