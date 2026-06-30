/* frontend/src/components/CreatinaTracker.jsx */
import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, TrendingUp, Zap, Save, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import GlassCard from './GlassCard';
import { useToast } from '../hooks/useToast';
import * as creatinaService from '../services/creatinaService';
import { formatDateForDisplay, formatDateToShort, formatDateForQuery } from '../utils/dateUtils';
import ConfirmationModal from './ConfirmationModal';
import useAppStore from '../store/useAppStore';

const CreatinaTracker = ({ onClose, selectedDate }) => {
    const { addToast } = useToast();
    const { fetchNotifications, fetchInitialData } = useAppStore(state => ({
        fetchNotifications: state.fetchNotifications,
        fetchInitialData: state.fetchInitialData
    }));

    const [creatinaLogs, setCreatinaLogs] = useState([]);
    const [dailyLogs, setDailyLogs] = useState([]);
    const [grams, setGrams] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingLog, setEditingLog] = useState(null);
    const [editGrams, setEditGrams] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [logToDelete, setLogToDelete] = useState(null);
    const [stats, setStats] = useState({
        totalDays: 0,
        currentStreak: 0,
        averageGrams: 0,
        thisWeekDays: 0
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(creatinaLogs.length / itemsPerPage);
    const paginatedLogs = creatinaLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        fetchCreatinaData();
        setGrams('');
    }, [selectedDate]);

    const fetchCreatinaData = async () => {
        setIsLoading(true);
        try {
            const today = new Date();
            const dayOfWeek = today.getUTCDay();
            const offset = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;

            const startOfWeek = new Date(today);
            startOfWeek.setUTCDate(today.getUTCDate() - offset);

            const startDate = formatDateForQuery(startOfWeek);
            const endDate = formatDateForQuery(today);

            const [logsResponse, statsResponse, dailyLogsResponse] = await Promise.all([
                creatinaService.getCreatinaLogs({ startDate, endDate }),
                creatinaService.getCreatinaStats(),
                creatinaService.getCreatinaLogs({ startDate: selectedDate, endDate: selectedDate })
            ]);

            setCreatinaLogs(logsResponse.data || []);
            setStats(statsResponse.data || stats);
            setDailyLogs(dailyLogsResponse.data || []);
            setCurrentPage(1);

        } catch (error) {
            console.error('Error fetching creatina data:', error);
            addToast('Error al cargar los datos de creatina', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const gramsValue = parseFloat(grams);
        if (isNaN(gramsValue) || gramsValue <= 0) {
            addToast('Por favor ingresa una cantidad válida de gramos', 'error');
            return;
        }

        if (gramsValue > 50) {
            addToast('La cantidad máxima permitida es 50g', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await creatinaService.createCreatinaLog({
                grams: gramsValue,
                log_date: selectedDate
            });

            // --- MANEJO DE GAMIFICACIÓN ---
            if (response && response.gamification) {
                response.gamification.forEach(event => {
                    if (event.type === 'xp') {
                        addToast(`+${event.amount} XP: ${event.reason}`, 'success');
                    } else if (event.type === 'badge') {
                        addToast(`¡Insignia Desbloqueada! ${event.badge.name}`, 'success');
                    } else if (event.type === 'warning') {
                        addToast(event.message, 'warning');
                    } else if (event.type === 'info') {
                        // AÑADIDO: Manejo de info (límite ya alcanzado previamente)
                        addToast(event.message, 'info');
                    }
                });
            }

            addToast('Registro de creatina guardado', 'success');
            setGrams('');
            await fetchCreatinaData();

            if (fetchNotifications) fetchNotifications();
            if (fetchInitialData) fetchInitialData();

        } catch (error) {
            addToast(error.message || 'Error al guardar el registro', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStreakColor = (streak) => {
        if (streak >= 30) return 'text-green';
        if (streak >= 14) return 'text-blue-500';
        if (streak >= 7) return 'text-yellow-500';
        return 'text-text-muted';
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const handleEditLog = (log) => {
        setEditingLog(log);
        setEditGrams(log.grams.toString());
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditingLog(null);
        setEditGrams('');
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();

        if (!editGrams || editGrams.trim() === '') {
            addToast('Por favor ingresa una cantidad de gramos', 'error');
            return;
        }

        const gramsValue = parseFloat(editGrams);
        if (isNaN(gramsValue) || gramsValue <= 0) {
            addToast('Por favor ingresa una cantidad válida de gramos', 'error');
            return;
        }

        if (gramsValue > 50) {
            addToast('La cantidad máxima permitida es 50g', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await creatinaService.updateCreatinaLog(editingLog.id, {
                grams: gramsValue
            });
            addToast('Registro actualizado correctamente', 'success');
            handleCloseEditModal();
            await fetchCreatinaData();

            if (fetchNotifications) fetchNotifications();
            if (fetchInitialData) fetchInitialData();

        } catch (error) {
            console.error('Error updating creatina log:', error);
            addToast('Error al actualizar el registro', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (log) => {
        setLogToDelete(log);
    };

    const confirmDelete = async () => {
        if (!logToDelete) return;

        setIsSubmitting(true);
        try {
            await creatinaService.deleteCreatinaLog(logToDelete.id);
            addToast('Registro eliminado correctamente', 'success');
            await fetchCreatinaData();

            if (fetchNotifications) fetchNotifications();
            if (fetchInitialData) fetchInitialData();

        } catch (error) {
            console.error('Error deleting creatina log:', error);
            addToast('Error al eliminar el registro', 'error');
        } finally {
            setIsSubmitting(false);
            setLogToDelete(null);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-[fade-in_0.2s_ease-out] !pt-[calc(1rem+env(safe-area-inset-top,24px))] !pb-[calc(1rem+env(safe-area-inset-bottom,24px))]">
                <div className="bg-bg-primary rounded-[32px] ring-1 ring-black/5 dark:ring-white/10 max-w-5xl w-full max-h-[85vh] sm:max-h-[90vh] flex flex-col shadow-2xl animate-[slide-up_0.3s_ease-out]">
                    
                    <div className="flex-shrink-0 flex items-center justify-between p-6 sm:p-8 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 rounded-t-[32px]">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-accent/10 rounded-[16px] ring-1 ring-accent/30 text-accent shadow-sm">
                                <Zap size={24} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary">Creatina</h2>
                        </div>
                        <button onClick={onClose} className="p-2.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-text-secondary hover:text-text-primary active:scale-95">
                            <X size={20} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="flex-grow overflow-y-auto p-6 sm:p-8 pb-24 sm:pb-8 custom-scrollbar">
                        <div className="space-y-6 sm:space-y-8">
                            
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
                                <GlassCard className="glass p-5 text-center rounded-[24px] border-none ring-1 ring-black/5 dark:ring-white/10 shadow-sm flex flex-col items-center justify-center gap-2">
                                    <Calendar className="text-blue-500 mb-1" size={28} strokeWidth={1.5} />
                                    <p className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">{stats.totalDays}</p>
                                    <p className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-widest">Días totales</p>
                                </GlassCard>
                                <GlassCard className="glass p-5 text-center rounded-[24px] border-none ring-1 ring-black/5 dark:ring-white/10 shadow-sm flex flex-col items-center justify-center gap-2">
                                    <TrendingUp className={`${getStreakColor(stats.currentStreak)} mb-1`} size={28} strokeWidth={1.5} />
                                    <p className={`text-2xl sm:text-3xl font-black tracking-tight ${getStreakColor(stats.currentStreak)}`}>{stats.currentStreak}</p>
                                    <p className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-widest">Racha actual</p>
                                </GlassCard>
                                <GlassCard className="glass p-5 text-center rounded-[24px] border-none ring-1 ring-black/5 dark:ring-white/10 shadow-sm flex flex-col items-center justify-center gap-2">
                                    <Zap className="text-accent mb-1" size={28} strokeWidth={1.5} />
                                    <p className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">{stats.averageGrams.toFixed(1)}<span className="text-lg">g</span></p>
                                    <p className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-widest">Promedio</p>
                                </GlassCard>
                                <GlassCard className="glass p-5 text-center rounded-[24px] border-none ring-1 ring-black/5 dark:ring-white/10 shadow-sm flex flex-col items-center justify-center gap-2">
                                    <Calendar className="text-green mb-1" size={28} strokeWidth={1.5} />
                                    <p className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">{stats.thisWeekDays}/7</p>
                                    <p className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-widest">Esta semana</p>
                                </GlassCard>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                                
                                {/* Formulario para añadir toma */}
                                <GlassCard className="glass p-6 sm:p-8 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10">
                                    <h3 className="text-lg sm:text-xl font-extrabold mb-6 flex items-center gap-2 text-text-primary tracking-tight">
                                        <Calendar size={20} className="text-accent" />
                                        {formatDateForDisplay(selectedDate)}
                                    </h3>
                                    
                                    {dailyLogs.length < 2 ? (
                                        <form onSubmit={handleSubmit} className="space-y-5">
                                            <div>
                                                <label className="block text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 px-1">
                                                    Añadir nueva toma ({dailyLogs.length + 1} de 2)
                                                </label>
                                                <input 
                                                    type="number" 
                                                    step="0.1" 
                                                    min="0.1" 
                                                    value={grams} 
                                                    onChange={(e) => setGrams(e.target.value)} 
                                                    className="w-full px-5 py-4 bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-primary font-bold placeholder:text-text-muted transition-all shadow-inner" 
                                                    placeholder="Ej: 5.0" 
                                                    disabled={isSubmitting} 
                                                />
                                            </div>
                                            <div className="pt-2">
                                                <button 
                                                    type="submit" 
                                                    disabled={isSubmitting || !grams} 
                                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-accent text-white font-bold rounded-[20px] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20"
                                                >
                                                    <Plus size={20} strokeWidth={2.5} />
                                                    {isSubmitting ? 'Guardando...' : 'Añadir Toma'}
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="text-center py-10 bg-black/5 dark:bg-white/5 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10">
                                            <p className="font-extrabold text-lg text-text-primary mb-1">Límite diario alcanzado</p>
                                            <p className="text-sm font-medium text-text-secondary">Has registrado las 2 tomas de hoy.</p>
                                        </div>
                                    )}
                                </GlassCard>

                                {/* Historial Reciente */}
                                <GlassCard className="glass p-6 sm:p-8 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 flex flex-col">
                                    <h3 className="text-lg sm:text-xl font-extrabold mb-6 text-text-primary tracking-tight">Historial Reciente</h3>
                                    
                                    {isLoading ? (
                                        <div className="flex-1 flex flex-col justify-center items-center py-10">
                                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent border-accent mx-auto"></div>
                                            <p className="text-text-secondary font-bold mt-4">Cargando...</p>
                                        </div>
                                    ) : creatinaLogs.length > 0 ? (
                                        <div className="flex-1 flex flex-col">
                                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                                {paginatedLogs.map((log) => (
                                                    <div key={log.id} className="flex justify-between items-center p-4 bg-black/5 dark:bg-white/5 rounded-[20px] ring-1 ring-black/5 dark:ring-white/10 transition-all hover:shadow-sm">
                                                        <div>
                                                            <p className="font-extrabold text-sm sm:text-base text-text-primary">{formatDateToShort(log.log_date)}</p>
                                                            <p className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider mt-0.5">{new Date(log.log_date).toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'UTC' })}</p>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <p className="font-black text-accent text-lg sm:text-xl font-mono">{log.grams}g</p>
                                                            <div className="flex items-center gap-1.5 border-l border-black/10 dark:border-white/20 pl-3">
                                                                <button onClick={() => handleEditLog(log)} className="p-2.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[12px] text-text-secondary hover:text-accent hover:bg-accent/10 transition-all active:scale-95" title="Editar">
                                                                    <Edit size={16} strokeWidth={2.5} />
                                                                </button>
                                                                <button onClick={() => handleDeleteClick(log)} className="p-2.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[12px] text-text-secondary hover:text-red hover:bg-red/10 transition-all active:scale-95" title="Eliminar">
                                                                    <Trash2 size={16} strokeWidth={2.5} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {totalPages > 1 && (
                                                <div className="flex justify-between items-center mt-6 pt-4 border-t border-black/5 dark:border-white/10 shrink-0">
                                                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-2.5 rounded-[12px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-secondary hover:text-text-primary disabled:opacity-30 transition-all active:scale-95">
                                                        <ChevronLeft size={18} strokeWidth={2.5} />
                                                    </button>
                                                    <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-widest">Página {currentPage} de {totalPages}</span>
                                                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="p-2.5 rounded-[12px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-secondary hover:text-text-primary disabled:opacity-30 transition-all active:scale-95">
                                                        <ChevronRight size={18} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col justify-center items-center py-10 bg-black/5 dark:bg-white/5 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10">
                                            <Zap size={40} className="text-text-muted opacity-50 mb-3" strokeWidth={1.5} />
                                            <p className="font-extrabold text-text-primary mb-1">No hay registros</p>
                                            <p className="text-sm font-medium text-text-secondary">¡Comienza tu seguimiento!</p>
                                        </div>
                                    )}
                                </GlassCard>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Edición */}
            {showEditModal && editingLog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[110] animate-[fade-in_0.2s_ease-out] !pt-[calc(1rem+env(safe-area-inset-top,24px))] !pb-[calc(1rem+env(safe-area-inset-bottom,24px))]">
                    <div className="bg-bg-primary rounded-[32px] ring-1 ring-black/5 dark:ring-white/10 max-w-md w-full shadow-2xl animate-[slide-up_0.2s_ease-out]">
                        
                        <div className="flex items-center justify-between p-6 sm:p-8 pb-5 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 rounded-t-[32px]">
                            <h3 className="text-xl font-extrabold text-text-primary tracking-tight">Editar Registro</h3>
                            <button onClick={handleCloseEditModal} className="p-2.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-text-secondary hover:text-text-primary active:scale-95">
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSaveEdit} className="p-6 sm:p-8 space-y-6">
                            <div>
                                <label className="block text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 px-1">Fecha</label>
                                <p className="bg-black/5 dark:bg-white/5 px-5 py-4 rounded-[20px] ring-1 ring-black/5 dark:ring-white/10 font-bold text-text-primary cursor-not-allowed opacity-80">
                                    {formatDateForDisplay(editingLog.log_date)}
                                </p>
                            </div>
                            
                            <div>
                                <label className="block text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 px-1">Gramos de creatina</label>
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    min="0.1" 
                                    value={editGrams} 
                                    onChange={(e) => setEditGrams(e.target.value)} 
                                    className="w-full px-5 py-4 bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-primary font-bold transition-all shadow-inner" 
                                    required 
                                    autoFocus 
                                />
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-black/5 dark:border-white/10 mt-4">
                                <button type="button" onClick={handleCloseEditModal} disabled={isSubmitting} className="w-full sm:flex-1 px-6 py-4 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-primary font-bold rounded-[20px] hover:bg-black/10 dark:hover:bg-white/10 transition-colors active:scale-95">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isSubmitting || !editGrams} className="w-full sm:flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-accent text-white font-bold rounded-[20px] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all active:scale-95 shadow-lg shadow-accent/20">
                                    <Save size={20} strokeWidth={2.5} />
                                    {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}

            {/* Modal de Confirmación */}
            {logToDelete && (
                <ConfirmationModal
                    message={`¿Eliminar registro de ${logToDelete.grams}g?`}
                    onConfirm={confirmDelete}
                    onCancel={() => setLogToDelete(null)}
                    isLoading={isSubmitting}
                    confirmText="Eliminar"
                />
            )}
        </>
    );
};

export default CreatinaTracker;