import ModalPortal from './ModalPortal';
/* frontend/src/components/ErrorBoundary.jsx */
import React from 'react';
import { AlertTriangle, RefreshCw, LogOut, Wrench } from 'lucide-react';
import { reloadAppWithoutStaleCache } from '../utils/appRecovery';

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
    } catch {}
  }

  handleReload = () => {
    if (this.state.isActionRunning) return;
    this.setState({ isActionRunning: true });

    try { localStorage.removeItem('lastView'); } catch {}
    reloadAppWithoutStaleCache({ path: '/' });
  };

  handleEmergencyLogout = async () => {
    if (this.state.isActionRunning) return;
    this.setState({ isActionRunning: true });

    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
    reloadAppWithoutStaleCache({ path: '/' });
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
                  ? 'La app ha encontrado el mismo fallo más de una vez. Puedes volver a cargarla limpiando la caché, sin borrar tus datos ni cerrar sesión.'
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
