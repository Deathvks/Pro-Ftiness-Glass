import ModalPortal from './ModalPortal';
/* frontend/src/components/ErrorBoundary.jsx */
import React from 'react';
import { AlertTriangle, RefreshCw, Trash2, LogOut } from 'lucide-react';

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
    // Actualiza el estado para que el siguiente renderizado muestre la UI de repuesto
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    try {
      const crashCount = parseInt(localStorage.getItem('pfg_crash_loop_count') || '0', 10);
      this.setState({ reloadCount: crashCount });
    } catch {}
  }

  purgeTransientCaches = async () => {
    try {
      // 1. Limpieza de snapshot precacheado que puede tener esquemas incompatibles
      localStorage.removeItem('pfg_cached_initial_state_v1');
      localStorage.removeItem('pfg_cache_version');
      localStorage.removeItem('profitness_insights_expanded');
      localStorage.removeItem('pfg_auto_reloaded_version');
      sessionStorage.clear();

      // 2. Limpieza de cachés de service workers
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
    } catch (e) {
      console.warn('Error purgando cachés en ErrorBoundary:', e);
    }
  };

  handleReload = async () => {
    if (this.state.isActionRunning) return;
    this.setState({ isActionRunning: true });

    try {
      const currentCrashes = parseInt(localStorage.getItem('pfg_crash_loop_count') || '0', 10);
      localStorage.setItem('pfg_crash_loop_count', String(currentCrashes + 1));
      await this.purgeTransientCaches();
    } catch (e) {
      console.warn('Error en handleReload:', e);
    }

    window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
  };

  handleResetLocalData = async () => {
    if (this.state.isActionRunning) return;
    this.setState({ isActionRunning: true });

    try {
      // Purgar selectivamente SOLO las cachés corruptibles sin destruir tutoriales, racha ni configuraciones del usuario
      localStorage.removeItem('pfg_cached_initial_state_v1');
      localStorage.removeItem('pfg_cache_version');
      localStorage.removeItem('profitness_insights_expanded');
      localStorage.removeItem('pfg_auto_reloaded_version');
      localStorage.removeItem('pfg_crash_loop_count');
      sessionStorage.clear();

      await this.purgeTransientCaches();
    } catch (e) {
      console.warn('Error en handleResetLocalData:', e);
    }

    window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
  };

  handleEmergencyLogout = async () => {
    if (this.state.isActionRunning) return;
    this.setState({ isActionRunning: true });

    try {
      localStorage.clear();
      sessionStorage.clear();
      await this.purgeTransientCaches();
    } catch (e) {
      console.warn('Error en handleEmergencyLogout:', e);
    }

    window.location.href = window.location.origin + window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      const isRepeatCrash = this.state.reloadCount > 0;

      return (
        <ModalPortal>
          <div className="fixed inset-0 bg-bg-primary/95 backdrop-blur-md flex items-center justify-center p-4 z-[9999] !pt-[calc(1rem+var(--safe-top))] !pb-[calc(1rem+var(--safe-bottom))]">
            <div className="bg-bg-primary border border-glass-border rounded-3xl shadow-2xl p-6 sm:p-7 max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
              <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-5 ring-1 ring-red-500/20">
                <AlertTriangle className="text-red-500" size={32} />
              </div>

              <h2 className="text-2xl font-black text-text-primary mb-2 tracking-tight">
                Algo salió mal
              </h2>

              <p className="text-text-muted text-sm leading-relaxed mb-6">
                {isRepeatCrash
                  ? 'La aplicación ha detectado un problema recurrente con los datos locales cacheados. Puedes recargar de nuevo o restablecer la caché sin perder tu sesión.'
                  : 'La aplicación ha encontrado un error inesperado al procesar la pantalla. Pulsa en recargar para restablecer los componentes.'}
              </p>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={this.handleReload}
                  disabled={this.state.isActionRunning}
                  className="w-full py-3 px-4 bg-accent text-accent-contrast font-bold rounded-2xl hover:bg-accent/90 transition-all flex items-center justify-center gap-2 active:scale-98 shadow-md shadow-accent/20 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={18} className={this.state.isActionRunning ? 'animate-spin' : ''} />
                  <span>Recargar Aplicación</span>
                </button>

                {isRepeatCrash && (
                  <button
                    type="button"
                    onClick={this.handleResetLocalData}
                    disabled={this.state.isActionRunning}
                    className="w-full py-3 px-4 bg-bg-secondary text-text-primary border border-glass-border font-bold rounded-2xl hover:bg-bg-secondary/80 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 size={18} className="text-amber-500" />
                    <span>Restablecer caché local</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={this.handleEmergencyLogout}
                  disabled={this.state.isActionRunning}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-text-muted hover:text-red-500 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-1"
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
