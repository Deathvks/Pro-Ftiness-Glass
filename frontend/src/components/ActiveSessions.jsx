/* frontend/src/components/ActiveSessions.jsx */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getSessions, revokeSession, revokeAllOtherSessions } from '../services/sessionService';
import { Smartphone, Monitor, Tablet, Trash2, Shield, Globe, Clock, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import ConfirmationModal from './ConfirmationModal';

const ITEMS_PER_PAGE = 5;

const ActiveSessions = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [revokingId, setRevokingId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Estado para el Modal de Confirmación
    const [confirmationState, setConfirmationState] = useState({
        isOpen: false,
        type: null, // 'single' | 'all'
        sessionId: null
    });

    const { addToast } = useToast();

    useEffect(() => {
        loadSessions();
    }, []);

    useEffect(() => {
        const maxPage = Math.ceil(sessions.length / ITEMS_PER_PAGE) || 1;
        if (currentPage > maxPage) {
            setCurrentPage(maxPage);
        }
    }, [sessions.length, currentPage]);

    const loadSessions = async () => {
        try {
            const data = await getSessions();
            setSessions(data);
        } catch (error) {
            console.error("Error al cargar sesiones:", error);
            addToast("No se pudieron cargar las sesiones.", "error");
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers para abrir el Modal ---

    const initiateRevoke = (sessionId, isCurrent) => {
        if (isCurrent) return;
        setConfirmationState({
            isOpen: true,
            type: 'single',
            sessionId
        });
    };

    const initiateRevokeAll = () => {
        setConfirmationState({
            isOpen: true,
            type: 'all',
            sessionId: null
        });
    };

    const handleCloseModal = () => {
        setConfirmationState(prev => ({ ...prev, isOpen: false }));
    };

    // --- Ejecución de la acción confirmada ---

    const executeAction = async () => {
        const { type, sessionId } = confirmationState;
        handleCloseModal(); // Cerramos modal inmediatamente

        if (type === 'single' && sessionId) {
            setRevokingId(sessionId);
            try {
                await revokeSession(sessionId);
                setSessions(prev => prev.filter(s => s.id !== sessionId));
                addToast("Sesión cerrada correctamente.", "success");
            } catch (error) {
                console.error("Error al revocar sesión:", error);
                addToast("Error al cerrar la sesión.", "error");
            } finally {
                setRevokingId(null);
            }
        } else if (type === 'all') {
            setLoading(true);
            try {
                await revokeAllOtherSessions();
                await loadSessions();
                addToast("Se han cerrado todas las otras sesiones.", "success");
            } catch (error) {
                console.error("Error al revocar otras sesiones:", error);
                addToast("Error al cerrar las sesiones.", "error");
                setLoading(false);
            }
        }
    };

    const getDeviceIcon = (type) => {
        const className = "w-6 h-6 text-accent";
        switch (type?.toLowerCase()) {
            case 'mobile': return <Smartphone className={className} />;
            case 'tablet': return <Tablet className={className} />;
            case 'console': return <Monitor className={className} />;
            default: return <Monitor className={className} />;
        }
    };

    // --- Paginación ---
    const totalPages = Math.ceil(sessions.length / ITEMS_PER_PAGE);
    const paginatedSessions = sessions.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const goToPrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
    const goToNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

    if (loading && sessions.length === 0) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-16 bg-white/5 rounded-xl"></div>
                <div className="h-16 bg-white/5 rounded-xl"></div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4 w-full">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                        <Shield className="w-5 h-5 text-accent" />
                        Dispositivos
                    </h3>
                    {sessions.length > 1 && (
                        <button
                            onClick={initiateRevokeAll}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded-lg hover:bg-red-500/20 border-none outline-none"
                        >
                            <AlertTriangle className="w-3 h-3" />
                            Cerrar otras
                        </button>
                    )}
                </div>

                <div className="grid gap-3">
                    {paginatedSessions.map((session) => (
                        <div
                            key={session.id}
                            /* Eliminados TODOS los bordes. Solo fondo suave. */
                            className={`relative p-3 sm:p-4 rounded-xl transition-all border-none outline-none ring-0 ${session.is_current
                                ? 'bg-accent/10'
                                : 'bg-bg-secondary/30 hover:bg-bg-secondary/50'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                    <div className={`p-2 rounded-full shrink-0 ${session.is_current ? 'bg-accent/20' : 'bg-bg-secondary'}`}>
                                        {getDeviceIcon(session.device_type)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-medium text-text-primary truncate max-w-full text-sm sm:text-base">
                                                {session.device_name || 'Dispositivo desconocido'}
                                            </p>
                                            {session.is_current && (
                                                /* Etiqueta 'Actual' sin bordes */
                                                <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-bold tracking-wide uppercase whitespace-nowrap border-none">
                                                    Actual
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1 mt-1">
                                            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                                                <Globe className="w-3 h-3 shrink-0" />
                                                <span className="truncate">{session.ip_address || 'IP oculta'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                                                <Clock className="w-3 h-3 shrink-0" />
                                                <span className="truncate">
                                                    {session.is_current
                                                        ? 'Activo ahora'
                                                        : formatDistanceToNow(new Date(session.last_active), { addSuffix: true, locale: es })
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {!session.is_current && (
                                    <button
                                        onClick={() => initiateRevoke(session.id, session.is_current)}
                                        disabled={revokingId === session.id}
                                        className="p-2 text-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0 border-none outline-none"
                                        title="Cerrar sesión"
                                    >
                                        {revokingId === session.id ? (
                                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <Trash2 className="w-5 h-5" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-4 pt-2">
                        <button
                            onClick={goToPrevPage}
                            disabled={currentPage === 1}
                            className="p-1 rounded-lg hover:bg-bg-secondary text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-none"
                            aria-label="Página anterior"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm text-text-secondary font-medium">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className="p-1 rounded-lg hover:bg-bg-secondary text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-none"
                            aria-label="Página siguiente"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {sessions.length === 0 && !loading && (
                    <div className="text-center py-4 text-text-secondary text-sm">
                        No se encontraron sesiones activas.
                    </div>
                )}
            </div>

            {/* PORTAL: Renderiza el modal fuera del componente actual, directamente en el body */}
            {confirmationState.isOpen && createPortal(
                <ConfirmationModal
                    isOpen={confirmationState.isOpen}
                    onCancel={handleCloseModal} /* <-- CAMBIO AQUÍ: de onClose a onCancel */
                    onConfirm={executeAction}
                    title={confirmationState.type === 'single' ? "Cerrar sesión" : "Cerrar otras sesiones"}
                    message={confirmationState.type === 'single'
                        ? "¿Estás seguro de que deseas cerrar esta sesión remotamente?"
                        : "¿Estás seguro de que deseas cerrar todas las sesiones excepto la actual?"
                    }
                    confirmText={confirmationState.type === 'single' ? "Cerrar sesión" : "Cerrar todas"}
                    cancelText="Cancelar"
                    isDestructive={true}
                />,
                document.body
            )}
        </>
    );
};

export default ActiveSessions;