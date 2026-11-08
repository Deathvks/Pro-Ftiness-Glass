/* frontend/src/components/ViewErrorBoundary.jsx */
import React from 'react';
import { RefreshCw, Home, Users } from 'lucide-react';
import GlassCard from './GlassCard';
import { recoverFromChunkError } from '../utils/appRecovery';

class ViewErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[ViewErrorBoundary:${this.props.viewName || 'view'}] Error capturado:`, error, errorInfo);
    const message = (error?.message || '').toLowerCase();
    if (
      error?.name === 'ChunkLoadError' ||
      error?.name === 'ChunkLoadTimeoutError' ||
      message.includes('failed to fetch dynamically imported module') ||
      message.includes('loading chunk') ||
      message.includes('loading css chunk') ||
      message.includes('importing a module script failed')
    ) {
      recoverFromChunkError();
    }
  }

  handleRetry = () => {
    if (this.state.error) {
      const message = (this.state.error?.message || '').toLowerCase();
      if (
        this.state.error?.name === 'ChunkLoadError' ||
        this.state.error?.name === 'ChunkLoadTimeoutError' ||
        message.includes('failed to fetch dynamically imported module') ||
        message.includes('loading chunk') ||
        message.includes('loading css chunk') ||
        message.includes('importing a module script failed')
      ) {
        recoverFromChunkError({ force: true });
        return;
      }
    }
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    try {
      localStorage.setItem('lastView', 'dashboard');
    } catch {}
    if (this.props.onGoHome) {
      this.props.onGoHome();
    } else if (typeof window !== 'undefined') {
      window.location.replace(window.location.origin + '/');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-xl mx-auto p-4 sm:p-6 animate-in fade-in duration-300">
          <GlassCard className="glass p-6 sm:p-8 text-center flex flex-col items-center border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[32px] shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mb-4 ring-1 ring-accent/20">
              <Users size={32} />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">
              {this.props.viewName ? `${this.props.viewName} temporalmente no disponible` : 'Sección temporalmente no disponible'}
            </h3>
            <p className="text-sm font-medium text-text-secondary max-w-md mx-auto mb-6 leading-relaxed">
              {typeof navigator !== 'undefined' && navigator.onLine === false
                ? 'No hay conexión para descargar esta sección. Recupera la conexión e inténtalo de nuevo.'
                : 'No pudimos cargar esta sección. Puedes volver a intentarlo o regresar al inicio.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={this.handleRetry}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-accent text-accent-contrast font-bold text-sm shadow-md shadow-accent/20 cursor-pointer hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                <span>Reintentar</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-text-primary font-bold text-sm cursor-pointer hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Home size={16} />
                <span>Ir al Inicio</span>
              </button>
            </div>
          </GlassCard>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ViewErrorBoundary;
