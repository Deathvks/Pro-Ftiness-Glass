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
        <GlassCard className="text-center py-12 text-text-tertiary border-transparent dark:border-white/10">
            <Activity size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm sm:text-base">No hay actividad reciente.</p>
            <p className="text-xs sm:text-sm mt-2">¡Sigue a más amigos o registra tu primer entrenamiento!</p>
        </GlassCard>
    );

    return (
        <div className="space-y-4 sm:space-y-6">
            {feed.map(log => {
                const isMe = log.user_id === userProfile?.id;
                const avatarUrl = getFullImageUrl(log.user?.profile_image_url);
                const comments = log.Comments || [];

                return (
                    <GlassCard key={log.id} className="p-4 sm:p-5 md:p-6 flex flex-col gap-3 sm:gap-4 animate-[fade-in_0.3s_ease-out] border-transparent dark:border-white/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => goToProfile(log.user_id)}>
                                <UserAvatar 
                                    user={{ ...log.user, profile_image_url: avatarUrl }} 
                                    size={10} 
                                    className="w-10 h-10 sm:w-12 sm:h-12 shadow-md shrink-0 transition-transform group-hover:scale-105" 
                                />
                                <div className="min-w-0">
                                    <p className="font-bold text-text-primary text-sm sm:text-base truncate group-hover:text-accent transition-colors">
                                        {log.user?.username || 'Usuario'} {isMe && <span className="text-text-tertiary font-normal ml-1 text-xs sm:text-sm">(Tú)</span>}
                                    </p>
                                    <p className="text-xs sm:text-sm text-text-tertiary truncate">{timeAgo(log.workout_date)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-bg-secondary rounded-xl p-3 sm:p-4 border border-glass-border shadow-inner">
                            <div className="flex items-start sm:items-center justify-between gap-2 mb-2 sm:mb-3">
                                <h4 className="font-bold text-text-primary text-sm sm:text-base flex items-start sm:items-center gap-2">
                                    <span className="text-accent shrink-0">💪</span> 
                                    <span className="line-clamp-2">Completó: {log.routine?.name || log.routine_name || 'Entrenamiento libre'}</span>
                                </h4>
                                {log.routine_id && !isMe && (
                                    <button 
                                        onClick={() => handleImportRoutine(log.routine_id)}
                                        disabled={isActionLoading}
                                        className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-accent/10 text-accent rounded-lg hover:bg-accent hover:text-white transition-colors text-[10px] sm:text-xs font-bold disabled:opacity-50 disabled:hover:bg-accent/10 disabled:hover:text-accent"
                                        title="Importar Rutina"
                                    >
                                        <Download size={14} />
                                        <span className="hidden sm:inline">Importar</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2 sm:gap-3 text-[10px] sm:text-xs font-medium text-text-secondary">
                                {log.duration_seconds > 0 && (
                                    <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 shadow-sm">
                                        <Clock size={14} className="opacity-80" /> 
                                        {formatDuration(log.duration_seconds)}
                                    </span>
                                )}
                                {log.calories_burned > 0 && (
                                    <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 shadow-sm">
                                        <Zap size={14} className="text-yellow-500 opacity-90" /> 
                                        {log.calories_burned} kcal
                                    </span>
                                )}
                            </div>

                            {log.WorkoutLogDetails && log.WorkoutLogDetails.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-glass-border space-y-3">
                                    {log.WorkoutLogDetails.map((detail, idx) => {
                                        let imgUrl = detail.image_url;
                                        if (!imgUrl && exercises && exercises.length > 0) {
                                            const localEx = exercises.find(e => e.name?.toLowerCase() === detail.exercise_name?.toLowerCase());
                                            imgUrl = localEx?.image_url_start || localEx?.image_url || null;
                                        }
                                        const finalImgUrl = getFullImageUrl(imgUrl);
                                        const finalVideoUrl = getFullImageUrl(detail.video_url);

                                        return (
                                            <div key={idx} className="flex items-start gap-2.5 sm:gap-3">
                                                {finalVideoUrl && !finalImgUrl ? (
                                                     <video
                                                        src={finalVideoUrl}
                                                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover bg-bg-primary shrink-0 border border-white/5"
                                                        muted
                                                        loop
                                                        playsInline
                                                        autoPlay
                                                    />
                                                ) : finalImgUrl ? (
                                                    <img 
                                                        src={finalImgUrl} 
                                                        alt={detail.exercise_name} 
                                                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover bg-bg-primary shrink-0 border border-white/5" 
                                                        onError={(e) => { 
                                                            e.target.style.display = 'none'; 
                                                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; 
                                                        }}
                                                    />
                                                ) : null}
                                                
                                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-bg-primary items-center justify-center shrink-0 border border-white/5 ${finalImgUrl || finalVideoUrl ? 'hidden' : 'flex'}`}>
                                                    <Dumbbell size={20} className="text-text-secondary opacity-50" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs sm:text-sm font-bold text-text-primary truncate">{t(detail.exercise_name)}</p>
                                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                                        {detail.WorkoutLogSets && detail.WorkoutLogSets.map((set, sIdx) => {
                                                            const weight = parseFloat(set.weight_kg);
                                                            return (
                                                                <span key={sIdx} className="inline-flex items-baseline text-[9px] sm:text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-text-secondary border border-white/5 whitespace-nowrap">
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

                        <div className="flex items-center gap-5 mt-1 sm:mt-2">
                            <button 
                                onClick={() => handleToggleLike(log.id)}
                                disabled={isActionLoading}
                                className={`flex items-center gap-1.5 text-sm sm:text-base font-bold transition-all active:scale-90 outline-none focus:outline-none [-webkit-tap-highlight-color:transparent] ${log.hasLiked ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                <Heart size={20} className={log.hasLiked ? 'fill-current' : ''} />
                                <span>{log.likesCount || 0}</span>
                            </button>
                            <button 
                                onClick={() => setShowComments(prev => ({ ...prev, [log.id]: !prev[log.id] }))}
                                className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-text-secondary hover:text-text-primary transition-colors outline-none focus:outline-none [-webkit-tap-highlight-color:transparent]"
                            >
                                <MessageCircle size={20} />
                                <span>{comments.length}</span>
                            </button>
                        </div>

                        {showComments[log.id] && (
                            <div className="pt-2 flex flex-col gap-3 animate-[fade-in_0.2s_ease-out]">
                                {comments.length > 0 && (
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                                        {comments.map(c => {
                                            const canDeleteComment = c.user_id === userProfile?.id || isMe || userProfile?.role === 'admin';
                                            return (
                                                <div key={c.id} className="flex items-start gap-2 sm:gap-3 bg-bg-secondary p-3 rounded-xl border border-glass-border group relative">
                                                    <UserAvatar 
                                                        user={{ ...c.user, profile_image_url: getFullImageUrl(c.user?.profile_image_url) }} 
                                                        size={8} 
                                                        className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 cursor-pointer" 
                                                        onClick={() => goToProfile(c.user_id)}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start gap-2">
                                                            <span className="text-xs sm:text-sm font-bold text-text-primary cursor-pointer hover:text-accent transition-colors truncate mt-0.5" onClick={() => goToProfile(c.user_id)}>
                                                                {c.user?.username}
                                                            </span>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="text-[10px] sm:text-xs text-text-tertiary whitespace-nowrap mt-0.5">
                                                                    {timeAgo(c.created_at)}
                                                                </span>
                                                                {canDeleteComment && (
                                                                    <button 
                                                                        onClick={() => setCommentToDelete({ commentId: c.id, workoutId: log.id })} 
                                                                        disabled={isActionLoading}
                                                                        className="p-1 text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-md hover:bg-red-500/10 active:scale-95 outline-none focus:outline-none"
                                                                        title="Borrar comentario"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-xs sm:text-sm text-text-secondary mt-0.5 whitespace-pre-wrap break-words">{c.comment}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                
                                <form onSubmit={(e) => handleAddComment(e, log.id)} className="flex items-center gap-2 mt-1 sm:mt-2">
                                    <input 
                                        type="text" 
                                        placeholder="Añadir comentario..." 
                                        value={activeCommentInput[log.id] || ''}
                                        onChange={(e) => setActiveCommentInput(prev => ({ ...prev, [log.id]: e.target.value }))}
                                        disabled={isActionLoading}
                                        className="flex-1 bg-bg-secondary border border-glass-border rounded-full px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all disabled:opacity-50"
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!activeCommentInput[log.id]?.trim() || isActionLoading} 
                                        className="p-2.5 sm:p-3 bg-accent text-white rounded-full hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-lg shadow-accent/20 shrink-0 outline-none focus:outline-none [-webkit-tap-highlight-color:transparent]"
                                    >
                                        <Send size={16} className="ml-0.5" />
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