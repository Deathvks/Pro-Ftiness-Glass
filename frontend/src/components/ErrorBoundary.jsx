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
    // Actualiza el estado para que el siguiente renderizado muestre la UI de repuesto
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    try {
      const currentCrashes = parseInt(localStorage.getItem('pfg_crash_loop_count') || '0', 10);
      const nextCrashes = currentCrashes + 1;
      localStorage.setItem('pfg_crash_loop_count', String(nextCrashes));
      this.setState({ reloadCount: nextCrashes });

      // Si se detecta un bucle de fallos recurrente (>= 2), ejecutar purga higiénica preventiva
      if (nextCrashes >= 2) {
        console.warn('[ErrorBoundary] Bucle de fallos detectado (>= 2). Ejecutando purga de rescate preventiva.');
        this.fullEmergencyPurge().catch(() => {});
      }
    } catch {}
  }

  purgeTransientCaches = async () => {
    try {
      localStorage.removeItem('pfg_cached_initial_state_v1');
      localStorage.removeItem('pfg_cache_version');
      localStorage.removeItem('profitness_insights_expanded');
      localStorage.removeItem('pfg_auto_reloaded_version');
      localStorage.removeItem('lastView');
      sessionStorage.clear();

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

  fullEmergencyPurge = async () => {
    try {
      const keysToRemove = [
        'pfg_cached_initial_state_v1',
        'pfg_cache_version',
        'profitness_insights_expanded',
        'pfg_auto_reloaded_version',
        'pfg_crash_loop_count',
        'lastView',
        'activeWorkout',
        'workoutStartTime',
        'isWorkoutPaused',
        'workoutAccumulatedTime',
        'isResting',
        'restTimerEndTime',
        'restTimerInitialDuration',
        'restTimerMode',
        'isRestTimerPaused',
        'restTimerRemaining',
        'pro_fitness_completed_routines_today',
        'pro_fitness_coach_history',
        'nutrition_coach_applied_history',
        'user_gym',
        'weekly_volume_exclusions_v1'
      ];

      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('user_gym_') ||
          key.startsWith('weekly_volume_exclusions_') ||
          key.startsWith('pfg_chunk_retry_')
        )) {
          localStorage.removeItem(key);
        }
      }

      keysToRemove.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();

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
      console.warn('Error en fullEmergencyPurge:', e);
    }
  };

  handleReload = async () => {
    if (this.state.isActionRunning) return;
    this.setState({ isActionRunning: true });

    try {
      const currentCrashes = parseInt(localStorage.getItem('pfg_crash_loop_count') || '0', 10);
      if (currentCrashes >= 1) {
        await this.fullEmergencyPurge();
      } else {
        await this.purgeTransientCaches();
      }
    } catch (e) {
      console.warn('Error en handleReload:', e);
    }

    const targetUrl = window.location.origin + '/?v=' + Date.now();
    window.location.replace(targetUrl);
  };

  handleResetLocalData = async () => {
    if (this.state.isActionRunning) return;
    this.setState({ isActionRunning: true });

    try {
      await this.fullEmergencyPurge();
    } catch (e) {
      console.warn('Error en handleResetLocalData:', e);
    }

    const targetUrl = window.location.origin + '/?v=' + Date.now();
    window.location.replace(targetUrl);
  };

  handleEmergencyLogout = async () => {
    if (this.state.isActionRunning) return;
    this.setState({ isActionRunning: true });

    try {
      localStorage.clear();
      sessionStorage.clear();
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
      console.warn('Error en handleEmergencyLogout:', e);
    }

    window.location.replace(window.location.origin + '/');
  };

  render() {
    if (this.state.hasError) {
      const isRepeatCrash = this.state.reloadCount > 0;

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
                  ? 'Hemos detectado un fallo recurrente con datos almacenados tras actualizar. Pulsa en Reparar y Recargar para sanear la memoria de la app automáticamente sin perder tu sesión.'
                  : 'La aplicación ha encontrado un problema al procesar la pantalla. Pulsa en recargar para restablecer los componentes.'}
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

                {isRepeatCrash && (
                  <button
                    type="button"
                    onClick={this.handleResetLocalData}
                    disabled={this.state.isActionRunning}
                    className="w-full py-3 px-4 bg-bg-secondary text-text-primary border border-glass-border font-bold rounded-2xl hover:bg-bg-secondary/80 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 size={18} className="text-amber-500" />
                    <span>Restablecer caché local completa</span>
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
