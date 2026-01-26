/* frontend/src/components/ErrorBoundary.jsx */
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        // Actualiza el estado para que el siguiente renderizado muestre la UI de repuesto
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // También puedes registrar el error en un servicio de reporte de errores
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 bg-bg-primary flex items-center justify-center p-4 z-[9999]">
                    <div className="bg-bg-primary border border-glass-border rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
                        <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                            <AlertTriangle className="text-red-500" size={32} />
                        </div>

                        {/* CORRECCIÓN: Usamos text-text-primary en lugar de text-white para soporte de temas */}
                        <h2 className="text-2xl font-bold text-text-primary mb-2">
                            Algo salió mal
                        </h2>

                        <p className="text-text-muted mb-6">
                            La aplicación ha encontrado un error inesperado. Por favor, intenta recargar la página para continuar.
                        </p>

                        <button
                            onClick={this.handleReload}
                            className="w-full py-3 px-4 bg-accent text-bg-primary font-bold rounded-xl hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={20} />
                            Recargar Aplicación
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;