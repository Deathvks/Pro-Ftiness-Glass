/* frontend/src/components/Feed.jsx */
import React, { useState, useEffect } from 'react';
import { Activity, Clock, Zap, Heart, MessageCircle, Send, Trash2, Dumbbell, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlassCard from './GlassCard';
import Spinner from './Spinner';
import UserAvatar from './UserAvatar';
import ConfirmationModal from './ConfirmationModal';
import socialService from '../services/socialService';
import { forkRoutine } from '../services/routineService';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import { getSocket } from '../services/socket';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'; 
const SERVER_URL = API_URL.replace('/api', '');

const getFullImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; 
    if (path.startsWith('blob:')) return path; 
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${SERVER_URL}${cleanPath}`;
};

const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} d`;
    return date.toLocaleDateString();
};

const formatDuration = (seconds) => {
    if (!seconds) return '0 min';
    const m = Math.floor(seconds / 60);
    return `${m} min`;
};

export default function Feed({ setView }) {
    const [feed, setFeed] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCommentInput, setActiveCommentInput] = useState({});
    const [showComments, setShowComments] = useState({});
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState(null);
    
    const { userProfile, exercises } = useAppStore();
    const { showToast } = useToast();
    const { t } = useTranslation('exercise_names');

    const loadFeed = async () => {
        try {
            const data = await socialService.getFeed();
            setFeed(data || []);
        } catch (error) {
            console.error(error);
            showToast('Error al cargar el muro', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFeed();
        const socket = getSocket();

        if (socket) {
            const handleFeedUpdate = () => loadFeed();
            socket.on('feed_update', handleFeedUpdate);
            return () => socket.off('feed_update', handleFeedUpdate);
        }
    }, []);

    const handleToggleLike = async (workoutId) => {
        if (isActionLoading) return;
        setIsActionLoading(true);
        try {
            await socialService.toggleLike(workoutId);
            await loadFeed();
        } catch (error) {
            showToast('Error al dar me gusta', 'error');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleAddComment = async (e, workoutId) => {
        e.preventDefault();
        const text = activeCommentInput[workoutId];
        if (!text || !text.trim() || isActionLoading) return;

        setIsActionLoading(true);
        try {
            await socialService.addComment(workoutId, text);
            setActiveCommentInput(prev => ({ ...prev, [workoutId]: '' }));
            setShowComments(prev => ({ ...prev, [workoutId]: true }));
            await loadFeed();
        } catch (error) {
            showToast('Error al comentar', 'error');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDeleteComment = async () => {
        if (!commentToDelete || isActionLoading) return;
        setIsActionLoading(true);
        try {
            await socialService.deleteComment(commentToDelete.commentId);
            await loadFeed();
            showToast('Comentario eliminado con éxito', 'success');
        } catch (error) {
            showToast('Error al borrar el comentario', 'error');
        } finally {
            setIsActionLoading(false);
            setCommentToDelete(null);
        }
    };

    const handleImportRoutine = async (routineId) => {
        if (isActionLoading) return;
        setIsActionLoading(true);
        try {
            await forkRoutine(routineId, 'Importadas del Muro');
            const state = useAppStore.getState();
            if (state.refreshRoutines) await state.refreshRoutines();
            showToast('Rutina importada a tus rutinas', 'success');
        } catch (error) {
            showToast(error.message || 'Error al importar la rutina', 'error');
        } finally {
            setIsActionLoading(false);
        }
    };

    const goToProfile = (userId) => { 
        if (userId === userProfile?.id) setView('profile'); 
        else setView('publicProfile', { userId }); 
    };

    if (isLoading) return <div className="flex justify-center py-10"><Spinner size={30} /></div>;
    
    if (feed.length === 0) return (
        <GlassCard className="glass text-center p-10 sm:p-16 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[32px] mt-4">
            <div className="w-20 h-20 mx-auto bg-black/5 dark:bg-white/5 rounded-[24px] flex items-center justify-center mb-6 text-text-muted">
                <Activity size={32} />
            </div>
            <p className="text-lg font-bold text-text-primary">No hay actividad reciente</p>
            <p className="text-sm font-medium text-text-secondary mt-2">¡Sigue a más amigos o registra tu primer entrenamiento!</p>
        </GlassCard>
    );

    return (
        <div className="space-y-6 sm:space-y-8">
            {feed.map(log => {
                const isMe = log.user_id === userProfile?.id;
                const avatarUrl = getFullImageUrl(log.user?.profile_image_url);
                const comments = log.Comments || [];

                return (
                    <GlassCard key={log.id} className="glass p-5 sm:p-6 md:p-8 flex flex-col gap-5 animate-[fade-in_0.3s_ease-out] border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[32px] hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 cursor-pointer group" onClick={() => goToProfile(log.user_id)}>
                                <UserAvatar 
                                    user={{ ...log.user, profile_image_url: avatarUrl }} 
                                    size={12} 
                                    className="w-12 h-12 sm:w-14 sm:h-14 shadow-md shrink-0 transition-transform group-hover:scale-105 ring-2 ring-black/5 dark:ring-white/10" 
                                />
                                <div className="min-w-0">
                                    <p className="font-bold text-text-primary text-base sm:text-lg truncate group-hover:text-accent transition-colors">
                                        {log.user?.username || 'Usuario'} {isMe && <span className="text-text-tertiary font-medium ml-1 text-xs sm:text-sm">(Tú)</span>}
                                    </p>
                                    <p className="text-xs sm:text-sm text-text-secondary font-medium truncate mt-0.5">{timeAgo(log.workout_date)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/5 dark:bg-white/5 rounded-[24px] p-4 sm:p-5 border-none ring-1 ring-black/5 dark:ring-white/10">
                            <div className="flex items-start sm:items-center justify-between gap-3 mb-3">
                                <h4 className="font-bold text-text-primary text-sm sm:text-base flex items-start sm:items-center gap-2">
                                    <span className="text-accent shrink-0">💪</span> 
                                    <span className="line-clamp-2 leading-tight">Completó: {log.routine?.name || log.routine_name || 'Entrenamiento libre'}</span>
                                </h4>
                                {log.routine_id && !isMe && (
                                    <button 
                                        onClick={() => handleImportRoutine(log.routine_id)}
                                        disabled={isActionLoading}
                                        className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-accent/10 text-accent rounded-[14px] hover:bg-accent hover:text-white transition-all text-[10px] sm:text-xs font-bold disabled:opacity-50 hover:shadow-md"
                                        title="Importar Rutina"
                                    >
                                        <Download size={14} />
                                        <span className="hidden sm:inline">Importar</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2 sm:gap-3 text-xs font-bold text-text-secondary">
                                {log.duration_seconds > 0 && (
                                    <span className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-3 py-2 rounded-[14px] ring-1 ring-black/5 dark:ring-white/10">
                                        <Clock size={14} className="opacity-80" /> 
                                        {formatDuration(log.duration_seconds)}
                                    </span>
                                )}
                                {log.calories_burned > 0 && (
                                    <span className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-3 py-2 rounded-[14px] ring-1 ring-black/5 dark:ring-white/10">
                                        <Zap size={14} className="text-yellow-500 opacity-90" /> 
                                        {log.calories_burned} kcal
                                    </span>
                                )}
                            </div>

                            {log.WorkoutLogDetails && log.WorkoutLogDetails.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/10 space-y-4">
                                    {log.WorkoutLogDetails.map((detail, idx) => {
                                        let imgUrl = detail.image_url;
                                        if (!imgUrl && exercises && exercises.length > 0) {
                                            const localEx = exercises.find(e => e.name?.toLowerCase() === detail.exercise_name?.toLowerCase());
                                            imgUrl = localEx?.image_url_start || localEx?.image_url || null;
                                        }
                                        const finalImgUrl = getFullImageUrl(imgUrl);
                                        const finalVideoUrl = getFullImageUrl(detail.video_url);

                                        return (
                                            <div key={idx} className="flex items-start gap-3 sm:gap-4">
                                                {finalVideoUrl && !finalImgUrl ? (
                                                     <video
                                                        src={finalVideoUrl}
                                                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] object-cover bg-black/10 dark:bg-white/10 shrink-0 ring-1 ring-black/5 dark:ring-white/10"
                                                        muted
                                                        loop
                                                        playsInline
                                                        autoPlay
                                                    />
                                                ) : finalImgUrl ? (
                                                    <img 
                                                        src={finalImgUrl} 
                                                        alt={detail.exercise_name} 
                                                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] object-cover bg-black/10 dark:bg-white/10 shrink-0 ring-1 ring-black/5 dark:ring-white/10" 
                                                        onError={(e) => { 
                                                            e.target.style.display = 'none'; 
                                                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; 
                                                        }}
                                                    />
                                                ) : null}
                                                
                                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] bg-black/5 dark:bg-white/5 items-center justify-center shrink-0 ring-1 ring-black/5 dark:ring-white/10 ${finalImgUrl || finalVideoUrl ? 'hidden' : 'flex'}`}>
                                                    <Dumbbell size={20} className="text-text-muted" />
                                                </div>

                                                <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[3rem]">
                                                    <p className="text-sm font-bold text-text-primary truncate mb-1">{t(detail.exercise_name)}</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {detail.WorkoutLogSets && detail.WorkoutLogSets.map((set, sIdx) => {
                                                            const weight = parseFloat(set.weight_kg);
                                                            return (
                                                                <span key={sIdx} className="inline-flex items-center text-[10px] sm:text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded-[10px] text-text-secondary font-medium whitespace-nowrap">
                                                                    {set.reps}{weight > 0 ? ` × ${weight}kg` : ' reps'}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3 mt-1 px-1">
                            <button 
                                onClick={() => handleToggleLike(log.id)}
                                disabled={isActionLoading}
                                className={`flex items-center gap-2 p-2.5 rounded-[16px] text-sm sm:text-base font-bold transition-all active:scale-95 outline-none focus:outline-none [-webkit-tap-highlight-color:transparent] ${log.hasLiked ? 'text-accent bg-accent/10' : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary'}`}
                            >
                                <Heart size={20} className={log.hasLiked ? 'fill-current' : ''} />
                                <span>{log.likesCount || 0}</span>
                            </button>
                            <button 
                                onClick={() => setShowComments(prev => ({ ...prev, [log.id]: !prev[log.id] }))}
                                className={`flex items-center gap-2 p-2.5 rounded-[16px] text-sm sm:text-base font-bold transition-all active:scale-95 outline-none focus:outline-none [-webkit-tap-highlight-color:transparent] ${showComments[log.id] ? 'text-accent bg-accent/10' : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary'}`}
                            >
                                <MessageCircle size={20} />
                                <span>{comments.length}</span>
                            </button>
                        </div>

                        {showComments[log.id] && (
                            <div className="pt-4 flex flex-col gap-4 animate-[fade-in_0.2s_ease-out] border-t border-black/5 dark:border-white/10 mt-2">
                                {comments.length > 0 && (
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {comments.map(c => {
                                            const canDeleteComment = c.user_id === userProfile?.id || isMe || userProfile?.role === 'admin';
                                            return (
                                                <div key={c.id} className="flex items-start gap-3 sm:gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-[20px] group relative transition-colors hover:bg-black/10 dark:hover:bg-white/10">
                                                    <UserAvatar 
                                                        user={{ ...c.user, profile_image_url: getFullImageUrl(c.user?.profile_image_url) }} 
                                                        size={10} 
                                                        className="w-10 h-10 shrink-0 cursor-pointer transition-transform hover:scale-105" 
                                                        onClick={() => goToProfile(c.user_id)}
                                                    />
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                        <div className="flex justify-between items-start gap-2 mb-1">
                                                            <span className="text-sm font-bold text-text-primary cursor-pointer hover:text-accent transition-colors truncate" onClick={() => goToProfile(c.user_id)}>
                                                                {c.user?.username}
                                                            </span>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="text-[10px] sm:text-xs font-bold text-text-muted whitespace-nowrap">
                                                                    {timeAgo(c.created_at)}
                                                                </span>
                                                                {canDeleteComment && (
                                                                    <button 
                                                                        onClick={() => setCommentToDelete({ commentId: c.id, workoutId: log.id })} 
                                                                        disabled={isActionLoading}
                                                                        className="p-1.5 text-text-muted hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all rounded-[10px] hover:bg-red-500/10 active:scale-95 outline-none focus:outline-none"
                                                                        title="Borrar comentario"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-xs sm:text-sm font-medium text-text-secondary whitespace-pre-wrap break-words leading-relaxed">{c.comment}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                
                                <form onSubmit={(e) => handleAddComment(e, log.id)} className="flex items-center gap-3 mt-2">
                                    <input 
                                        type="text" 
                                        placeholder="Añade un comentario..." 
                                        value={activeCommentInput[log.id] || ''}
                                        onChange={(e) => setActiveCommentInput(prev => ({ ...prev, [log.id]: e.target.value }))}
                                        disabled={isActionLoading}
                                        className="flex-1 bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-full px-5 py-3.5 text-sm font-medium text-text-primary outline-none focus:ring-2 focus:ring-accent/50 transition-all disabled:opacity-50 placeholder:text-text-muted"
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!activeCommentInput[log.id]?.trim() || isActionLoading} 
                                        className="p-3.5 bg-accent text-white rounded-full hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-lg shadow-accent/20 shrink-0 outline-none focus:outline-none active:scale-95"
                                    >
                                        <Send size={18} className="ml-0.5" />
                                    </button>
                                </form>
                            </div>
                        )}
                    </GlassCard>
                );
            })}

            {commentToDelete && (
                <ConfirmationModal
                    message="¿Estás seguro de que quieres eliminar este comentario?"
                    onConfirm={handleDeleteComment}
                    onCancel={() => setCommentToDelete(null)}
                    confirmText="Eliminar"
                    cancelText="Cancelar"
                    isLoading={isActionLoading}
                />
            )}
        </div>
    );
}