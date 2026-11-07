/* frontend/src/components/Feed.jsx */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    FaFire,
    FaGlobeEurope,
    FaMapMarkerAlt,
    FaUsers,
    FaDumbbell,
    FaUserPlus,
    FaCheck,
    FaClock,
    FaCity,
    FaBuilding,
    FaBolt,
    FaHeart,
    FaRegHeart,
    FaCommentDots,
    FaPaperPlane,
    FaTrashAlt,
    FaDownload,
    FaExchangeAlt,
    FaCheckCircle,
    FaSearch,
    FaShieldAlt,
    FaTrophy,
    FaInfoCircle
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import GlassCard from './GlassCard';
import Spinner from './Spinner';
import UserAvatar from './UserAvatar';
import ConfirmationModal from './ConfirmationModal';
import socialService from '../services/socialService';
import * as userService from '../services/userService';
import { forkRoutine } from '../services/routineService';
import { enrichGymWithMedia } from '../utils/gymMedia';
import useAppStore from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { useToast } from '../hooks/useToast';
import { getSocket } from '../services/socket';

const GymLocationModal = React.lazy(() => import('./GymLocationModal'));

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const SERVER_URL = API_URL.replace('/api', '');

const getFullImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    if (path.startsWith('blob:')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${SERVER_URL}${cleanPath}`;
};

const isOlderThan7Days = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    return (now.getTime() - date.getTime()) > (7 * 24 * 60 * 60 * 1000);
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

const FeedPreviewVideo = ({ src, className }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return undefined;

        const release = () => {
            video.pause();
            video.removeAttribute('src');
            video.load();
        };
        const play = () => {
            if (!video.getAttribute('src')) video.src = src;
            video.play().catch(() => {});
        };
        let observer;
        if ('IntersectionObserver' in window) {
            observer = new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting && !document.hidden) play();
                else release();
            }, { threshold: 0.15 });
            observer.observe(video);
        } else {
            play();
        }

        const onVisibilityChange = () => {
            if (document.hidden) video.pause();
            else if (video.getBoundingClientRect().bottom > 0 && video.getBoundingClientRect().top < window.innerHeight) play();
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            observer?.disconnect();
            document.removeEventListener('visibilitychange', onVisibilityChange);
            release();
        };
    }, [src]);

    return <video ref={videoRef} data-src={src} className={className} muted loop playsInline preload="none" />;
};

const formatDuration = (seconds) => {
    if (!seconds) return '0 min';
    const m = Math.floor(seconds / 60);
    return `${m} min`;
};

const memoryFeedCacheByScope = {
    global: null,
    gym: null,
    friends: null
};
let memoryGymMetaCache = null;

const parseProfileGym = (raw) => {
    if (!raw) return null;
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return parsed && typeof parsed === 'object' && (parsed.name || parsed.city) ? parsed : null;
    } catch {
        return null;
    }
};

export default function Feed({ setView, visibleStories = [], myStories = [] }) {
    const [showFeedInfo, setShowFeedInfo] = useState(false);
    const [scope, setScope] = useState(() => {
        try {
            const saved = localStorage.getItem('pfg_social_feed_scope');
            if (saved && ['global', 'gym', 'friends'].includes(saved)) return saved;
        } catch {}
        return 'global';
    });
    const [gymFilter, setGymFilter] = useState('all'); // 'all' | 'same_gym' | 'same_city'

    const [feed, setFeed] = useState(() => {
        const initialScope = (() => {
            try {
                const saved = localStorage.getItem('pfg_social_feed_scope');
                if (saved && ['global', 'gym', 'friends'].includes(saved)) return saved;
            } catch {}
            return 'global';
        })();
        if (Array.isArray(memoryFeedCacheByScope[initialScope]) && memoryFeedCacheByScope[initialScope].length > 0) {
            return memoryFeedCacheByScope[initialScope];
        }
        try {
            const raw = sessionStorage.getItem(`pfg_social_feed_cache_v3_${initialScope}`);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    memoryFeedCacheByScope[initialScope] = parsed;
                    return parsed;
                }
            }
        } catch {}
        return [];
    });

    const [gymMeta, setGymMeta] = useState(() => memoryGymMetaCache);
    const [isLoading, setIsLoading] = useState(() => {
        const initialScope = (() => {
            try {
                const saved = localStorage.getItem('pfg_social_feed_scope');
                if (saved && ['global', 'gym', 'friends'].includes(saved)) return saved;
            } catch {}
            return 'global';
        })();
        return !(Array.isArray(memoryFeedCacheByScope[initialScope]) && memoryFeedCacheByScope[initialScope].length > 0);
    });

    const [hasOlder, setHasOlder] = useState(false);
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [isShowingOlder, setIsShowingOlder] = useState(false);
    const isShowingOlderRef = useRef(false);
    const scopeRef = useRef(scope);
    const gymFilterRef = useRef(gymFilter);

    const [activeCommentInput, setActiveCommentInput] = useState({});
    const [showComments, setShowComments] = useState({});
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState(null);
    const [pendingRequestsLocal, setPendingRequestsLocal] = useState({});
    const [sendingRequestId, setSendingRequestId] = useState(null);
    const [showGymModal, setShowGymModal] = useState(false);

    const { userProfile, exercises, sendFriendRequest } = useAppStore(
        useShallow(state => ({
            userProfile: state.userProfile,
            exercises: state.exercises,
            sendFriendRequest: state.sendFriendRequest
        }))
    );
    const { showToast } = useToast();
    const { t } = useTranslation('exercise_names');

    const myCurrentGym = useMemo(() => {
        const fromProfile = parseProfileGym(userProfile?.gym_data);
        if (fromProfile) return enrichGymWithMedia(fromProfile);
        if (gymMeta?.myGym) return enrichGymWithMedia(gymMeta.myGym);
        try {
            const userKey = userProfile?.id ? `user_gym_${userProfile.id}` : 'user_gym';
            const raw = localStorage.getItem(userKey) || localStorage.getItem('user_gym');
            if (raw) return enrichGymWithMedia(JSON.parse(raw));
        } catch {}
        return null;
    }, [userProfile?.gym_data, userProfile?.id, gymMeta?.myGym]);

    const loadFeed = async (includeOlder = false, targetScope = scopeRef.current, targetGymFilter = gymFilterRef.current) => {
        try {
            if (includeOlder) {
                setIsLoadingOlder(true);
            } else {
                const cached = memoryFeedCacheByScope[targetScope];
                if (!cached || cached.length === 0 || targetScope === 'gym') {
                    setIsLoading(true);
                }
            }

            const data = await socialService.getFeed({
                scope: targetScope,
                gymFilter: targetScope === 'gym' ? targetGymFilter : 'all',
                includeOlder
            });

            const posts = Array.isArray(data) ? data : (data?.feed || []);
            const olderAvailable = Array.isArray(data) ? false : !!data?.hasOlder;
            const effectiveOlder = Array.isArray(data) ? includeOlder : (data?.isShowingOlder ?? includeOlder);

            if (data?.gymMeta) {
                memoryGymMetaCache = data.gymMeta;
                setGymMeta(data.gymMeta);
            }

            setFeed(posts);
            setHasOlder(olderAvailable);
            setIsShowingOlder(effectiveOlder);
            isShowingOlderRef.current = effectiveOlder;

            if (!includeOlder && targetGymFilter === 'all') {
                memoryFeedCacheByScope[targetScope] = posts;
                try {
                    sessionStorage.setItem(`pfg_social_feed_cache_v3_${targetScope}`, JSON.stringify(posts.slice(0, 20)));
                } catch {}
            }
        } catch (error) {
            console.error(error);
            showToast('Error al cargar el muro', 'error');
        } finally {
            setIsLoading(false);
            setIsLoadingOlder(false);
        }
    };

    useEffect(() => {
        scopeRef.current = scope;
        gymFilterRef.current = gymFilter;
        try {
            localStorage.setItem('pfg_social_feed_scope', scope);
        } catch {}

        const cached = memoryFeedCacheByScope[scope];
        if (Array.isArray(cached) && cached.length > 0 && gymFilter === 'all') {
            setFeed(cached);
            setIsLoading(false);
        }

        loadFeed(false, scope, gymFilter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scope, gymFilter]);

    useEffect(() => {
        const socket = getSocket();
        if (socket) {
            const handleFeedUpdate = () => loadFeed(isShowingOlderRef.current, scopeRef.current, gymFilterRef.current);
            socket.on('feed_update', handleFeedUpdate);
            return () => socket.off('feed_update', handleFeedUpdate);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleScopeChange = (newScope) => {
        if (newScope === scope) return;
        setScope(newScope);
        setIsShowingOlder(false);
        isShowingOlderRef.current = false;
    };

    const handleSaveGymFromFeed = async (gymData) => {
        try {
            const userKey = userProfile?.id ? `user_gym_${userProfile.id}` : 'user_gym';
            const enriched = enrichGymWithMedia(gymData);
            localStorage.setItem(userKey, JSON.stringify(enriched));
            localStorage.setItem('user_gym', JSON.stringify(enriched));
            if (typeof useAppStore.getState().setUserProfile === 'function') {
                const cur = useAppStore.getState().userProfile;
                if (cur) useAppStore.getState().setUserProfile({ ...cur, gym_data: enriched });
            }
            window.dispatchEvent(new CustomEvent('user-gym-updated', { detail: enriched }));
            await userService.updateUserProfile({ gym_data: enriched });
            showToast(`Gimnasio actualizado: ${enriched.name}`, 'success');
            setShowGymModal(false);
            memoryFeedCacheByScope.gym = null;
            await loadFeed(false, scopeRef.current, gymFilterRef.current);
        } catch (err) {
            console.warn('Error al guardar gimnasio desde el muro:', err);
            showToast('Error al guardar el gimnasio', 'error');
        }
    };

    const handleRemoveGymFromFeed = async () => {
        try {
            const userKey = userProfile?.id ? `user_gym_${userProfile.id}` : 'user_gym';
            localStorage.removeItem(userKey);
            localStorage.removeItem('user_gym');
            useAppStore.setState((s) => ({
                userProfile: s.userProfile ? { ...s.userProfile, gym_data: null } : null
            }));
            window.dispatchEvent(new CustomEvent('user-gym-updated', { detail: null }));
            await userService.updateUserProfile({ gym_data: null });
            memoryGymMetaCache = null;
            setGymMeta(null);
            setShowGymModal(false);
            showToast('Gimnasio desvinculado', 'info');
            await loadFeed(false, scopeRef.current, gymFilterRef.current);
        } catch (err) {
            showToast('Error al desvincular gimnasio', 'error');
        }
    };

    const handleQuickFriendRequest = async (e, targetUserId) => {
        e.stopPropagation();
        if (!targetUserId || sendingRequestId === targetUserId || pendingRequestsLocal[targetUserId]) return;
        setSendingRequestId(targetUserId);
        try {
            let ok = false;
            if (typeof sendFriendRequest === 'function') {
                ok = await sendFriendRequest(targetUserId);
            } else {
                await socialService.sendFriendRequest(targetUserId);
                ok = true;
            }
            if (ok) {
                setPendingRequestsLocal(prev => ({ ...prev, [targetUserId]: true }));
                showToast('Solicitud de amistad enviada', 'success');
            } else {
                showToast('No se pudo enviar la solicitud', 'error');
            }
        } catch {
            showToast('No se pudo enviar la solicitud', 'error');
        } finally {
            setSendingRequestId(null);
        }
    };

    const handleToggleLike = async (workoutId, reactionType = 'fire') => {
        const applyReactionUpdate = (list, serverData = null) =>
            (Array.isArray(list) ? list : []).map(item => {
                if (!item || Number(item.id) !== Number(workoutId)) return item;

                if (serverData && typeof serverData.likesCount === 'number' && serverData.reactionsCounts) {
                    return {
                        ...item,
                        myReaction: serverData.myReaction ?? null,
                        hasLiked: !!serverData.hasLiked,
                        likesCount: serverData.likesCount,
                        reactionsCounts: serverData.reactionsCounts
                    };
                }

                const prevMyReaction = item.myReaction || (item.hasLiked ? 'fire' : null);
                const prevCounts = {
                    fire: 0,
                    beast: 0,
                    respect: 0,
                    pr: 0,
                    ...(item.reactionsCounts || {})
                };

                let nextMyReaction = reactionType;
                let nextLikesCount = item.likesCount || 0;

                if (prevMyReaction === reactionType) {
                    nextMyReaction = null;
                    prevCounts[reactionType] = Math.max(0, (prevCounts[reactionType] || 1) - 1);
                    nextLikesCount = Math.max(0, nextLikesCount - 1);
                } else if (prevMyReaction) {
                    prevCounts[prevMyReaction] = Math.max(0, (prevCounts[prevMyReaction] || 1) - 1);
                    prevCounts[reactionType] = (prevCounts[reactionType] || 0) + 1;
                } else {
                    prevCounts[reactionType] = (prevCounts[reactionType] || 0) + 1;
                    nextLikesCount += 1;
                }

                return {
                    ...item,
                    myReaction: nextMyReaction,
                    hasLiked: !!nextMyReaction,
                    likesCount: nextLikesCount,
                    reactionsCounts: prevCounts
                };
            });

        // 1. Actualización optimista instantánea (0ms) en estado y cachés locales
        setFeed(prevFeed => {
            const updated = applyReactionUpdate(prevFeed);
            const activeScope = scopeRef.current;
            if (Array.isArray(memoryFeedCacheByScope[activeScope])) {
                memoryFeedCacheByScope[activeScope] = applyReactionUpdate(memoryFeedCacheByScope[activeScope]);
            }
            try {
                sessionStorage.setItem(`pfg_social_feed_cache_v3_${activeScope}`, JSON.stringify(updated.slice(0, 20)));
            } catch {}
            return updated;
        });

        try {
            const res = await socialService.toggleLike(workoutId, reactionType);
            if (res && typeof res.likesCount === 'number' && res.reactionsCounts) {
                setFeed(prevFeed => {
                    const reconciled = applyReactionUpdate(prevFeed, res);
                    const activeScope = scopeRef.current;
                    if (Array.isArray(memoryFeedCacheByScope[activeScope])) {
                        memoryFeedCacheByScope[activeScope] = applyReactionUpdate(memoryFeedCacheByScope[activeScope], res);
                    }
                    try {
                        sessionStorage.setItem(`pfg_social_feed_cache_v3_${activeScope}`, JSON.stringify(reconciled.slice(0, 20)));
                    } catch {}
                    return reconciled;
                });
            }
        } catch {
            showToast('Error al enviar reacción', 'error');
            await loadFeed(isShowingOlderRef.current, scopeRef.current, gymFilterRef.current);
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
            await loadFeed(isShowingOlderRef.current, scopeRef.current, gymFilterRef.current);
        } catch {
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
            await loadFeed(isShowingOlderRef.current, scopeRef.current, gymFilterRef.current);
            showToast('Comentario eliminado con éxito', 'success');
        } catch {
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

    const filteredGymMembers = useMemo(() => {
        const list = Array.isArray(gymMeta?.gymMembers) ? gymMeta.gymMembers : [];
        if (gymFilter === 'same_gym') return list.filter(m => m.matchType === 'same_gym');
        if (gymFilter === 'same_city') return list.filter(m => m.matchType === 'same_city');
        return list;
    }, [gymMeta?.gymMembers, gymFilter]);

    const totalGymAthletes = (gymMeta?.sameGymCount || 0) + (gymMeta?.sameCityCount || 0);

    const renderScopeSelector = () => (
        <div id="social-feed-scopes" className="mb-5 sm:mb-6 space-y-3">
            <div className="flex justify-end">
                <button
                    type="button"
                    aria-expanded={showFeedInfo}
                    aria-controls="social-feed-info"
                    onClick={() => setShowFeedInfo(value => !value)}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                    <FaInfoCircle className="text-accent" />
                    <span>{showFeedInfo ? 'Ocultar información' : '¿Cómo funciona el Muro?'}</span>
                </button>
            </div>

            {showFeedInfo && (
                <section
                    id="social-feed-info"
                    aria-label="Cómo funciona cada apartado del Muro"
                    className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-[24px] p-3 sm:p-4 bg-accent/5 ring-1 ring-accent/15"
                >
                    <div className="rounded-[18px] p-3.5 bg-white/50 dark:bg-black/10">
                        <h3 className="flex items-center gap-2 text-sm font-extrabold text-text-primary">
                            <FaFire className="text-orange-500" /> Global
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                            Publicaciones públicas de toda la comunidad. Los entrenamientos en “Solo Amigos” no aparecen aquí.
                        </p>
                    </div>
                    <div className="rounded-[18px] p-3.5 bg-white/50 dark:bg-black/10">
                        <h3 className="flex items-center gap-2 text-sm font-extrabold text-text-primary">
                            <FaMapMarkerAlt className="text-emerald-500" /> Mi Gimnasio / Ciudad
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                            Publicaciones públicas de atletas de tu gimnasio o ciudad. También verás las de tus amigos de esa zona aunque las compartan en “Solo Amigos”. Puedes filtrar por gimnasio o ciudad.
                        </p>
                    </div>
                    <div className="rounded-[18px] p-3.5 bg-white/50 dark:bg-black/10">
                        <h3 className="flex items-center gap-2 text-sm font-extrabold text-text-primary">
                            <FaUsers className="text-blue-500" /> Amigos
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                            Actividad tuya y de tus amigos que tengas permiso para ver: pública o compartida solo con amigos.
                        </p>
                    </div>
                </section>
            )}

            {/* Selector Rápido Deslizable: Global / Mi Gimnasio / Amigos */}
            <div
                role="tablist"
                aria-label="Filtro del Muro de Comunidad"
                className="flex overflow-x-auto no-scrollbar items-center gap-2.5 py-1.5 px-1 -mx-1 sm:justify-center mask-linear-fade"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={scope === 'global'}
                    onClick={() => handleScopeChange('global')}
                    className={`flex items-center gap-2 py-2.5 px-5 rounded-full font-bold text-sm whitespace-nowrap flex-shrink-0 transition-all duration-300 outline-none active:scale-95 ${
                        scope === 'global'
                            ? 'bg-accent text-accent-contrast shadow-md shadow-accent/25 scale-[1.03]'
                            : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary'
                    }`}
                >
                    <FaFire className={`shrink-0 text-sm ${scope === 'global' ? 'text-accent-contrast' : 'text-orange-500'}`} />
                    <span>Global</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        scope === 'global' ? 'bg-black/15 text-accent-contrast' : 'bg-black/5 dark:bg-white/10 text-text-muted'
                    }`}>
                        Comunidad
                    </span>
                </button>

                <button
                    type="button"
                    role="tab"
                    aria-selected={scope === 'gym'}
                    onClick={() => handleScopeChange('gym')}
                    className={`flex items-center gap-2 py-2.5 px-5 rounded-full font-bold text-sm whitespace-nowrap flex-shrink-0 transition-all duration-300 outline-none active:scale-95 ${
                        scope === 'gym'
                            ? 'bg-accent text-accent-contrast shadow-md shadow-accent/25 scale-[1.03]'
                            : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary'
                    }`}
                >
                    <FaMapMarkerAlt className={`shrink-0 text-sm ${scope === 'gym' ? 'text-accent-contrast' : 'text-emerald-500'}`} />
                    <span>Mi Gimnasio</span>
                    {totalGymAthletes > 0 && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                            scope === 'gym' ? 'bg-black/20 text-accent-contrast' : 'bg-emerald-500/15 text-emerald-500'
                        }`}>
                            {totalGymAthletes}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    role="tab"
                    aria-selected={scope === 'friends'}
                    onClick={() => handleScopeChange('friends')}
                    className={`flex items-center gap-2 py-2.5 px-5 rounded-full font-bold text-sm whitespace-nowrap flex-shrink-0 transition-all duration-300 outline-none active:scale-95 ${
                        scope === 'friends'
                            ? 'bg-accent text-accent-contrast shadow-md shadow-accent/25 scale-[1.03]'
                            : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary'
                    }`}
                >
                    <FaUsers className={`shrink-0 text-sm ${scope === 'friends' ? 'text-accent-contrast' : 'text-blue-500'}`} />
                    <span>Amigos</span>
                </button>
            </div>

            {/* Sub-barra contextual según el modo activo */}
            {scope === 'global' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-[18px] bg-black/[0.03] dark:bg-white/[0.03] ring-1 ring-black/5 dark:ring-white/10 text-xs text-text-secondary">
                    <div className="flex items-start sm:items-center gap-2 min-w-0">
                        <FaGlobeEurope className="text-accent shrink-0 text-sm mt-0.5 sm:mt-0" />
                        <span className="font-semibold leading-snug">
                            Entrenos públicos, rutinas y debates de toda la comunidad
                        </span>
                    </div>
                    {myCurrentGym?.name ? (
                        <button
                            type="button"
                            onClick={() => handleScopeChange('gym')}
                            className="self-start sm:self-auto inline-flex items-center gap-1.5 text-[11px] font-extrabold text-accent hover:underline shrink-0"
                        >
                            <FaMapMarkerAlt className="text-[10px]" />
                            <span className="truncate max-w-[200px] sm:max-w-[220px]">{myCurrentGym.name}</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowGymModal(true)}
                            className="self-start sm:self-auto inline-flex items-center gap-1.5 text-[11px] font-extrabold text-accent hover:underline shrink-0"
                        >
                            <FaMapMarkerAlt className="text-[10px]" />
                            <span>Vincular mi gym</span>
                        </button>
                    )}
                </div>
            )}

            {scope === 'friends' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-[18px] bg-black/[0.03] dark:bg-white/[0.03] ring-1 ring-black/5 dark:ring-white/10 text-xs text-text-secondary">
                    <div className="flex items-start sm:items-center gap-2 min-w-0">
                        <FaUsers className="text-blue-500 shrink-0 text-sm mt-0.5 sm:mt-0" />
                        <span className="font-semibold leading-snug">
                            Mostrando entrenamientos de tus amigos y tu propia actividad
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleScopeChange('global')}
                        className="self-start sm:self-auto inline-flex items-center gap-1.5 text-[11px] font-extrabold text-accent hover:underline shrink-0"
                    >
                        <FaFire className="text-[10px]" />
                        <span>Explorar Global</span>
                    </button>
                </div>
            )}
        </div>
    );

    const renderGymSection = () => {
        if (scope !== 'gym') return null;

        if (!myCurrentGym && !gymMeta?.hasGym) {
            return (
                <GlassCard className="glass p-6 sm:p-10 rounded-[28px] sm:rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 text-center mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-[24px] bg-accent/10 text-accent ring-1 ring-accent/30 flex items-center justify-center mb-4 shadow-inner">
                        <FaMapMarkerAlt className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-text-primary">
                        Descubre quién entrena en tu gimnasio o ciudad
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-text-secondary mt-2 max-w-md mx-auto leading-relaxed">
                        Vincula tu gimnasio habitual en un toque para ver los entrenamientos, récords y rutinas de atletas de tu mismo centro o de tu ciudad.
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => setShowGymModal(true)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-accent text-accent-contrast font-extrabold text-sm shadow-lg shadow-accent/25 hover:brightness-110 active:scale-95 transition-all"
                        >
                            <FaMapMarkerAlt className="text-sm" />
                            <span>Seleccionar mi gimnasio</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleScopeChange('global')}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary font-bold text-xs sm:text-sm transition-colors"
                        >
                            <FaFire className="text-orange-500 text-xs" />
                            <span>Ver muro Global</span>
                        </button>
                    </div>
                </GlassCard>
            );
        }

        const activeGym = gymMeta?.myGym || myCurrentGym || {};
        const sameGymCount = gymMeta?.sameGymCount || 0;
        const sameCityCount = gymMeta?.sameCityCount || 0;

        return (
            <div className="space-y-4 mb-6">
                {/* Cabecera del Gimnasio Actual + Subfiltros */}
                <GlassCard className="glass p-4 sm:p-6 rounded-[26px] sm:rounded-[30px] border-none ring-1 ring-black/5 dark:ring-white/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[16px] bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30 flex items-center justify-center shrink-0">
                                <FaDumbbell className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <h3 className="text-sm sm:text-base font-extrabold text-text-primary truncate">
                                        {activeGym.name || 'Mi Gimnasio'}
                                    </h3>
                                    {activeGym.isVerified && (
                                        <FaCheckCircle className="text-accent shrink-0 text-xs" title="Gimnasio verificado" />
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-[11px] sm:text-xs font-semibold text-text-secondary">
                                    {activeGym.city && (
                                        <span className="inline-flex items-center gap-1 truncate">
                                            <FaCity className="text-text-muted text-[10px]" />
                                            <span>{activeGym.city}</span>
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1 text-emerald-500 font-bold">
                                        <FaDumbbell className="text-[10px]" />
                                        <span>{sameGymCount} en tu gym</span>
                                    </span>
                                    {sameCityCount > 0 && (
                                        <span className="inline-flex items-center gap-1 text-blue-400 font-bold">
                                            <FaMapMarkerAlt className="text-[10px]" />
                                            <span>{sameCityCount} en tu ciudad</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowGymModal(true)}
                            className="self-start sm:self-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary text-xs font-bold transition-colors shrink-0 ring-1 ring-black/5 dark:ring-white/10"
                        >
                            <FaExchangeAlt className="text-[11px] text-accent" />
                            <span>Cambiar gym</span>
                        </button>
                    </div>

                    {/* Píldoras deslizables de subfiltro: Todo / Mismo Gym / Mi Ciudad */}
                    <div className="flex overflow-x-auto no-scrollbar items-center gap-2 mt-4 pt-3.5 border-t border-black/5 dark:border-white/10 pb-1 -mx-1 px-1 mask-linear-fade">
                        <button
                            type="button"
                            onClick={() => setGymFilter('all')}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-extrabold whitespace-nowrap flex-shrink-0 transition-all ${
                                gymFilter === 'all'
                                    ? 'bg-accent text-accent-contrast shadow-sm'
                                    : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            <FaGlobeEurope className="text-xs shrink-0" />
                            <span>Gimnasio y Ciudad ({sameGymCount + sameCityCount})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setGymFilter('same_gym')}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-extrabold whitespace-nowrap flex-shrink-0 transition-all ${
                                gymFilter === 'same_gym'
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            <FaDumbbell className="text-xs shrink-0" />
                            <span>Mismo Gym ({sameGymCount})</span>
                        </button>
                        {activeGym.city && (
                            <button
                                type="button"
                                onClick={() => setGymFilter('same_city')}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-extrabold whitespace-nowrap flex-shrink-0 transition-all ${
                                    gymFilter === 'same_city'
                                        ? 'bg-blue-500 text-white shadow-sm'
                                        : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                <FaCity className="text-xs shrink-0" />
                                <span>En {activeGym.city} ({sameCityCount})</span>
                            </button>
                        )}
                    </div>

                    {/* Carrusel horizontal de atletas que entrenan en tu mismo gimnasio o ciudad */}
                    {filteredGymMembers.length > 0 && (
                        <div className="mt-4 pt-3.5 border-t border-black/5 dark:border-white/10">
                            <div className="flex items-center justify-between mb-2.5">
                                <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                                    <FaUsers className="text-accent" />
                                    Atletas en tu zona ({filteredGymMembers.length})
                                </span>
                            </div>
                            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                                {filteredGymMembers.map(member => {
                                    const isPending = member.hasPendingRequest || pendingRequestsLocal[member.id];
                                    const isSameGym = member.matchType === 'same_gym';
                                    return (
                                        <div
                                            key={member.id}
                                            onClick={() => goToProfile(member.id)}
                                            className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 ring-1 ring-black/5 dark:ring-white/10 transition-colors cursor-pointer shrink-0 min-w-[210px] sm:min-w-[230px] max-w-[250px]"
                                        >
                                            <UserAvatar
                                                user={{
                                                    ...member,
                                                    profile_image_url: getFullImageUrl(member.profile_image_url)
                                                }}
                                                size={10}
                                                className="w-10 h-10 shrink-0"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs sm:text-sm font-bold text-text-primary truncate">
                                                    {member.username}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span
                                                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate ${
                                                            isSameGym
                                                                ? 'bg-emerald-500/15 text-emerald-500'
                                                                : 'bg-blue-500/15 text-blue-400'
                                                        }`}
                                                    >
                                                        {isSameGym ? <FaDumbbell className="text-[9px] shrink-0" /> : <FaMapMarkerAlt className="text-[9px] shrink-0" />}
                                                        <span className="truncate">{isSameGym ? 'Mismo gym' : (member.gymName || member.gymCity || 'Tu ciudad')}</span>
                                                    </span>
                                                    {member.streak > 0 && (
                                                        <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-orange-500 shrink-0">
                                                            <FaFire className="text-[9px]" />
                                                            {member.streak}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {member.isFriend ? (
                                                <span
                                                    className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500 text-xs shrink-0"
                                                    title="Ya sois amigos"
                                                >
                                                    <FaCheck />
                                                </span>
                                            ) : isPending ? (
                                                <span
                                                    className="p-2 rounded-xl bg-black/5 dark:bg-white/10 text-text-muted text-xs shrink-0"
                                                    title="Solicitud pendiente"
                                                >
                                                    <FaClock />
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleQuickFriendRequest(e, member.id)}
                                                    disabled={sendingRequestId === member.id}
                                                    className="p-2 rounded-xl bg-accent text-accent-contrast hover:brightness-110 active:scale-95 transition-all text-xs shrink-0 shadow-sm"
                                                    title="Enviar solicitud de amistad"
                                                >
                                                    <FaUserPlus />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </GlassCard>
            </div>
        );
    };

    return (
        <div className="w-full">
            {renderScopeSelector()}
            <div id="social-feed-content" className="w-full">
                {renderGymSection()}

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Spinner size={30} />
                    </div>
                ) : feed.length === 0 ? (
                    /* Si es Mi Gimnasio y aún no tiene gimnasio seleccionado, renderGymSection ya muestra la tarjeta principal */
                    scope === 'gym' && !myCurrentGym && !gymMeta?.hasGym ? null : (
                        <GlassCard className="glass text-center p-7 sm:p-12 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[28px] sm:rounded-[32px] mt-2">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-black/5 dark:bg-white/5 rounded-[24px] flex items-center justify-center mb-5 text-text-muted">
                                {scope === 'gym' ? (
                                    <FaBuilding className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-500" />
                                ) : scope === 'friends' ? (
                                    <FaUsers className="w-7 h-7 sm:w-8 sm:h-8 text-blue-500" />
                                ) : (
                                    <FaGlobeEurope className="w-7 h-7 sm:w-8 sm:h-8 text-accent" />
                                )}
                            </div>
                            <p className="text-base sm:text-lg font-extrabold text-text-primary">
                                {scope === 'gym'
                                    ? 'Sin entrenamientos en los últimos 7 días en esta zona'
                                    : scope === 'friends'
                                    ? 'Sin actividad de tus amigos en los últimos 7 días'
                                    : 'Sin publicaciones en los últimos 7 días'}
                            </p>
                            <p className="text-xs sm:text-sm font-medium text-text-secondary mt-1.5 mb-6 max-w-md mx-auto leading-relaxed">
                                {hasOlder
                                    ? 'Hay entrenamientos anteriores disponibles en el histórico. Pulsa el botón de abajo para ver todas las publicaciones anteriores.'
                                    : scope === 'gym'
                                    ? 'Sé el primero en registrar un entrenamiento en tu gimnasio o explora el muro Global para conectar con más atletas.'
                                    : scope === 'friends'
                                    ? 'Cambia a la pestaña Global o Mi Gimnasio para descubrir entrenamientos públicos y agregar compañeros.'
                                    : 'Completa tu próximo entrenamiento en modo "Todo el mundo" para inaugurar el muro de la comunidad.'}
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                {hasOlder && (
                                    <button
                                        type="button"
                                        onClick={() => loadFeed(true, scope, gymFilter)}
                                        disabled={isLoadingOlder}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-accent text-accent-contrast rounded-2xl font-bold text-xs sm:text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-accent/20 disabled:opacity-50"
                                    >
                                        {isLoadingOlder ? <Spinner size={16} /> : <FaClock />}
                                        <span>Cargar publicaciones anteriores</span>
                                    </button>
                                )}
                                {scope !== 'global' && (
                                    <button
                                        type="button"
                                        onClick={() => handleScopeChange('global')}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary rounded-2xl font-bold text-xs sm:text-sm transition-colors"
                                    >
                                        <FaFire className="text-orange-500" />
                                        <span>Ver Muro Global</span>
                                    </button>
                                )}
                            </div>
                        </GlassCard>
                    )
                ) : (
                <div className="space-y-5 sm:space-y-7">
                    {(Array.isArray(feed) ? feed : []).map((log, index) => {
                        if (!log) return null;
                        const isMe = log.user_id === userProfile?.id;
                        const authorUser = isMe
                            ? {
                                  ...log.user,
                                  ...userProfile,
                                  role: userProfile?.role || log.user?.role,
                                  trainer_id: userProfile?.trainer_id ?? log.user?.trainer_id,
                                  gym_name: log.user?.gym_name || myCurrentGym?.name || null,
                                  gym_city: log.user?.gym_city || myCurrentGym?.city || null
                              }
                            : (log.user || {});
                        const avatarUrl = getFullImageUrl(authorUser?.profile_image_url);
                        const comments = Array.isArray(log.Comments) ? log.Comments : [];

                        const hasStory = isMe
                            ? (Array.isArray(myStories) && myStories.length > 0)
                            : (Array.isArray(visibleStories) && visibleStories.some(s => s && (s.userId === log.user_id || s.user_id === log.user_id) && Array.isArray(s.items) && s.items.length > 0));

                        const ringClass = hasStory ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : '';

                        const isOlder = isOlderThan7Days(log.workout_date);
                        const prevLog = index > 0 ? feed[index - 1] : null;
                        const prevIsOlder = prevLog ? isOlderThan7Days(prevLog.workout_date) : false;
                        const showOlderDivider = isShowingOlder && isOlder && (!prevLog || !prevIsOlder);

                        const isFriend = isMe || !!authorUser?.is_friend;
                        const isPendingRequest = !!authorUser?.has_pending_request || !!pendingRequestsLocal[log.user_id];
                        const isSameGymAuthor = authorUser?.gym_match_type === 'same_gym';
                        const isSameCityAuthor = authorUser?.gym_match_type === 'same_city';

                        return (
                            <React.Fragment key={log.id}>
                                {showOlderDivider && (
                                    <div className="flex items-center gap-3 py-2 my-2 animate-[fade-in_0.3s_ease-out]">
                                        <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                                        <span className="text-[11px] sm:text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5 px-3.5 py-1.5 bg-black/5 dark:bg-white/5 rounded-full ring-1 ring-black/5 dark:ring-white/10">
                                            <FaClock className="text-accent text-xs" /> Publicaciones de más de 7 días
                                        </span>
                                        <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                                    </div>
                                )}

                                <GlassCard className="glass p-4 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-5 animate-[fade-in_0.3s_ease-out] border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[28px] sm:rounded-[32px] hover:shadow-xl transition-all duration-300">
                                    {/* Cabecera del Autor */}
                                    <div className="flex items-start sm:items-center justify-between gap-2.5">
                                        <div
                                            className="flex items-center gap-3 sm:gap-4 cursor-pointer group min-w-0 flex-1"
                                            onClick={() => goToProfile(log.user_id)}
                                        >
                                            <UserAvatar
                                                user={{ ...authorUser, profile_image_url: avatarUrl }}
                                                size={12}
                                                className={`w-11 h-11 sm:w-14 sm:h-14 shadow-md shrink-0 transition-transform group-hover:scale-105 ${ringClass}`}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <p className="font-bold text-text-primary text-sm sm:text-lg truncate group-hover:text-accent transition-colors">
                                                        {authorUser?.username || 'Usuario'}
                                                    </p>
                                                    {isMe && (
                                                        <span className="text-text-tertiary font-medium text-xs shrink-0">(Tú)</span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-0.5 min-w-0">
                                                    <span className="text-[11px] sm:text-xs text-text-secondary font-medium whitespace-nowrap">
                                                        {timeAgo(log.workout_date)}
                                                    </span>
                                                    <span
                                                        className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-orange-500 font-bold shrink-0"
                                                        title="Racha de entrenamientos"
                                                    >
                                                        <FaFire className="text-[11px]" /> {authorUser?.streak ?? 0}
                                                    </span>

                                                    {(authorUser?.gym_name || authorUser?.gym_city) && (
                                                        <span
                                                            className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full max-w-[190px] sm:max-w-[260px] truncate ${
                                                                isSameGymAuthor
                                                                    ? 'bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30'
                                                                    : isSameCityAuthor
                                                                    ? 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30'
                                                                    : 'bg-black/5 dark:bg-white/10 text-text-secondary'
                                                            }`}
                                                            title={
                                                                authorUser.gym_name && authorUser.gym_city
                                                                    ? `${authorUser.gym_name} • ${authorUser.gym_city}`
                                                                    : authorUser.gym_name || authorUser.gym_city
                                                            }
                                                        >
                                                            {isSameGymAuthor ? (
                                                                <FaDumbbell className="text-[9px] shrink-0" />
                                                            ) : (
                                                                <FaMapMarkerAlt className="text-[9px] shrink-0" />
                                                            )}
                                                            <span className="truncate">
                                                                {authorUser.gym_name || authorUser.gym_city}
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Botón rápido de conexión cuando no es amigo */}
                                        {!isMe && !isFriend && (
                                            isPendingRequest ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 text-text-muted text-[11px] font-bold shrink-0">
                                                    <FaClock className="text-[10px]" />
                                                    <span className="hidden sm:inline">Pendiente</span>
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleQuickFriendRequest(e, log.user_id)}
                                                    disabled={sendingRequestId === log.user_id}
                                                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-accent/15 hover:bg-accent text-accent hover:text-accent-contrast text-[11px] sm:text-xs font-extrabold transition-all active:scale-95 shrink-0"
                                                    title="Añadir amigo"
                                                >
                                                    <FaUserPlus className="text-xs" />
                                                    <span className="hidden xs:inline sm:inline">Conectar</span>
                                                </button>
                                            )
                                        )}
                                    </div>

                                    {/* Resumen del Entrenamiento */}
                                    <div className="bg-black/5 dark:bg-white/5 rounded-[22px] sm:rounded-[24px] p-3.5 sm:p-5 border-none ring-1 ring-black/5 dark:ring-white/10">
                                        <div className="flex items-start sm:items-center justify-between gap-3 mb-3">
                                            <h4 className="font-bold text-text-primary text-sm sm:text-base flex items-start sm:items-center gap-2 min-w-0">
                                                <FaDumbbell className="text-accent shrink-0 mt-0.5 sm:mt-0" />
                                                <span className="line-clamp-2 leading-tight">
                                                    Completó: {log.routine?.name || log.routine_name || 'Entrenamiento libre'}
                                                </span>
                                            </h4>
                                            {log.routine_id && !isMe && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleImportRoutine(log.routine_id)}
                                                    disabled={isActionLoading}
                                                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-accent/10 text-accent rounded-[14px] hover:bg-accent hover:text-accent-contrast transition-all text-[10px] sm:text-xs font-bold disabled:opacity-50 hover:shadow-md"
                                                    title="Importar Rutina"
                                                >
                                                    <FaDownload className="text-xs" />
                                                    <span className="hidden sm:inline">Importar</span>
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2 sm:gap-3 text-xs font-bold text-text-secondary">
                                            {log.duration_seconds > 0 && (
                                                <span className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-3 py-1.5 sm:py-2 rounded-[14px] ring-1 ring-black/5 dark:ring-white/10">
                                                    <FaClock className="opacity-80 text-xs" />
                                                    {formatDuration(log.duration_seconds)}
                                                </span>
                                            )}
                                            {log.calories_burned > 0 && (
                                                <span className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-3 py-1.5 sm:py-2 rounded-[14px] ring-1 ring-black/5 dark:ring-white/10">
                                                    <FaBolt className="text-yellow-500 opacity-90 text-xs" />
                                                    {log.calories_burned} kcal
                                                </span>
                                            )}
                                        </div>

                                        {Array.isArray(log.WorkoutLogDetails) && log.WorkoutLogDetails.length > 0 && (() => {
                                            const routineExercises = (log.routine?.RoutineExercises || []).slice().sort((a, b) => {
                                                const orderA = a.exercise_order !== undefined && a.exercise_order !== null ? Number(a.exercise_order) : 0;
                                                const orderB = b.exercise_order !== undefined && b.exercise_order !== null ? Number(b.exercise_order) : 0;
                                                return orderA - orderB;
                                            });
                                            const routineOrderMap = new Map();
                                            routineExercises.forEach((re, idx) => {
                                                if (re.name) {
                                                    const norm = re.name.toLowerCase().trim();
                                                    if (!routineOrderMap.has(norm)) {
                                                        routineOrderMap.set(norm, idx);
                                                    }
                                                }
                                            });
                                            const sortedDetails = [...log.WorkoutLogDetails].sort((a, b) => {
                                                const nameA = (a.exercise_name || '').toLowerCase().trim();
                                                const nameB = (b.exercise_name || '').toLowerCase().trim();
                                                const hasA = routineOrderMap.has(nameA);
                                                const hasB = routineOrderMap.has(nameB);
                                                if (hasA && hasB) return routineOrderMap.get(nameA) - routineOrderMap.get(nameB);
                                                if (hasA) return -1;
                                                if (hasB) return 1;
                                                return (a.id || 0) - (b.id || 0);
                                            });
                                            return (
                                            <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/10 space-y-3.5 sm:space-y-4">
                                                {sortedDetails.map((detail, idx) => {
                                                    if (!detail) return null;
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
                                                                <FeedPreviewVideo
                                                                    src={finalVideoUrl}
                                                                    className="w-11 h-11 sm:w-14 sm:h-14 rounded-[14px] sm:rounded-[16px] object-cover bg-black/10 dark:bg-white/10 shrink-0 ring-1 ring-black/5 dark:ring-white/10"
                                                                />
                                                            ) : finalImgUrl ? (
                                                                <img
                                                                    src={finalImgUrl}
                                                                    alt={detail.exercise_name}
                                                                    className="w-11 h-11 sm:w-14 sm:h-14 rounded-[14px] sm:rounded-[16px] object-cover bg-black/10 dark:bg-white/10 shrink-0 ring-1 ring-black/5 dark:ring-white/10"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                                                    }}
                                                                />
                                                            ) : null}

                                                            <div
                                                                className={`w-11 h-11 sm:w-14 sm:h-14 rounded-[14px] sm:rounded-[16px] bg-black/5 dark:bg-white/5 items-center justify-center shrink-0 ring-1 ring-black/5 dark:ring-white/10 ${
                                                                    finalImgUrl || finalVideoUrl ? 'hidden' : 'flex'
                                                                }`}
                                                            >
                                                                <FaDumbbell className="text-text-muted text-base sm:text-lg" />
                                                            </div>

                                                            <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[2.75rem] sm:min-h-[3rem]">
                                                                <p className="text-xs sm:text-sm font-bold text-text-primary truncate mb-1">
                                                                    {t(detail.exercise_name)}
                                                                </p>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {Array.isArray(detail?.WorkoutLogSets) &&
                                                                        detail.WorkoutLogSets.map((set, sIdx) => {
                                                                            if (!set) return null;
                                                                            const weight = parseFloat(set.weight_kg);
                                                                            return (
                                                                                <span
                                                                                    key={sIdx}
                                                                                    className="inline-flex items-center text-[10px] sm:text-xs bg-black/5 dark:bg-white/10 px-2 py-0.5 sm:py-1 rounded-[10px] text-text-secondary font-medium whitespace-nowrap"
                                                                                >
                                                                                    {set.reps}
                                                                                    {weight > 0 ? ` × ${weight}kg` : ' reps'}
                                                                                </span>
                                                                            );
                                                                        })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Reacciones Rápidas de Gimnasio (1 toque) y Debate */}
                                    {(() => {
                                        const rCounts = log.reactionsCounts || {
                                            fire: log.likesCount || 0,
                                            beast: 0,
                                            respect: 0,
                                            pr: 0
                                        };
                                        const activeReaction = log.myReaction || (log.hasLiked ? 'fire' : null);
                                        const reactionButtons = [
                                            {
                                                key: 'fire',
                                                label: 'Fuego',
                                                Icon: FaFire,
                                                count: rCounts.fire || 0,
                                                activeClass: 'bg-orange-500/15 text-orange-500 border-orange-500/45 ring-1 ring-orange-500/30 shadow-sm',
                                                iconColor: 'text-orange-500'
                                            },
                                            {
                                                key: 'beast',
                                                label: 'Bestia',
                                                Icon: FaDumbbell,
                                                count: rCounts.beast || 0,
                                                activeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/45 ring-1 ring-purple-500/30 shadow-sm',
                                                iconColor: 'text-purple-400'
                                            },
                                            {
                                                key: 'respect',
                                                label: 'Respeto',
                                                Icon: FaShieldAlt,
                                                count: rCounts.respect || 0,
                                                activeClass: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/45 ring-1 ring-emerald-500/30 shadow-sm',
                                                iconColor: 'text-emerald-500'
                                            },
                                            {
                                                key: 'pr',
                                                label: 'PR',
                                                Icon: FaTrophy,
                                                count: rCounts.pr || 0,
                                                activeClass: 'bg-amber-500/15 text-amber-500 border-amber-500/45 ring-1 ring-amber-500/30 shadow-sm',
                                                iconColor: 'text-amber-500'
                                            }
                                        ];

                                        return (
                                            <div className="flex items-center justify-between gap-2 mt-0.5 py-1.5 -my-0.5 overflow-x-auto no-scrollbar -mx-1.5 px-1.5">
                                                <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap shrink-0">
                                                    {reactionButtons.map(({ key, label, Icon, count, activeClass, iconColor }) => {
                                                        const isSelected = activeReaction === key;
                                                        return (
                                                            <button
                                                                key={key}
                                                                type="button"
                                                                onClick={() => handleToggleLike(log.id, key)}
                                                                disabled={isActionLoading}
                                                                title={label}
                                                                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-[14px] text-xs font-extrabold whitespace-nowrap flex-shrink-0 border transition-all active:scale-95 outline-none focus:outline-none [-webkit-tap-highlight-color:transparent] ${
                                                                    isSelected
                                                                        ? activeClass
                                                                        : 'bg-black/[0.04] dark:bg-white/[0.04] border-black/5 dark:border-white/10 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary'
                                                                }`}
                                                            >
                                                                <Icon className={`text-xs sm:text-sm shrink-0 ${isSelected ? '' : iconColor}`} />
                                                                <span>{label}</span>
                                                                {count > 0 && (
                                                                    <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${
                                                                        isSelected ? 'bg-black/10 dark:bg-white/15' : 'bg-black/5 dark:bg-white/10 text-text-primary'
                                                                    }`}>
                                                                        {count}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setShowComments(prev => ({ ...prev, [log.id]: !prev[log.id] }))}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-[14px] text-xs sm:text-sm font-extrabold whitespace-nowrap flex-shrink-0 border transition-all active:scale-95 outline-none focus:outline-none [-webkit-tap-highlight-color:transparent] ${
                                                        showComments[log.id]
                                                            ? 'text-accent bg-accent/15 border-accent/45 ring-1 ring-accent/30 shadow-sm'
                                                            : 'bg-black/[0.04] dark:bg-white/[0.04] border-black/5 dark:border-white/10 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary'
                                                    }`}
                                                >
                                                    <FaCommentDots className="text-sm shrink-0" />
                                                    <span>{comments.length}</span>
                                                </button>
                                            </div>
                                        );
                                    })()}

                                    {/* Sección de Comentarios / Debate */}
                                    {showComments[log.id] && (
                                        <div className="pt-4 flex flex-col gap-4 animate-[fade-in_0.2s_ease-out] border-t border-black/5 dark:border-white/10 mt-1">
                                            {comments.length > 0 && (
                                                <div className="space-y-3 max-h-60 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                                                    {comments.map(c => {
                                                        const isCommentMe = c.user_id === userProfile?.id;
                                                        const commentUser = isCommentMe
                                                            ? {
                                                                  ...c.user,
                                                                  ...userProfile,
                                                                  role: userProfile?.role || c.user?.role,
                                                                  trainer_id: userProfile?.trainer_id ?? c.user?.trainer_id
                                                              }
                                                            : (c.user || {});
                                                        const canDeleteComment = isCommentMe || isMe || userProfile?.role === 'admin';
                                                        return (
                                                            <div
                                                                key={c.id}
                                                                className="flex items-start gap-3 sm:gap-4 bg-black/5 dark:bg-white/5 p-3.5 sm:p-4 rounded-[20px] group relative transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                                                            >
                                                                <UserAvatar
                                                                    user={{
                                                                        ...commentUser,
                                                                        profile_image_url: getFullImageUrl(commentUser?.profile_image_url)
                                                                    }}
                                                                    size={10}
                                                                    className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 cursor-pointer transition-transform hover:scale-105"
                                                                    onClick={() => goToProfile(c.user_id)}
                                                                />
                                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                                    <div className="flex justify-between items-start gap-2 mb-1">
                                                                        <span
                                                                            className="text-xs sm:text-sm font-bold text-text-primary cursor-pointer hover:text-accent transition-colors truncate"
                                                                            onClick={() => goToProfile(c.user_id)}
                                                                        >
                                                                            {commentUser?.username || 'Usuario'}
                                                                        </span>
                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                            <span className="text-[10px] sm:text-xs font-bold text-text-muted whitespace-nowrap">
                                                                                {timeAgo(c.created_at)}
                                                                            </span>
                                                                            {canDeleteComment && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setCommentToDelete({ commentId: c.id, workoutId: log.id })}
                                                                                    disabled={isActionLoading}
                                                                                    className="p-1.5 text-text-muted hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all rounded-[10px] hover:bg-red-500/10 active:scale-95 outline-none focus:outline-none"
                                                                                    title="Borrar comentario"
                                                                                >
                                                                                    <FaTrashAlt className="text-xs sm:text-sm" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-xs sm:text-sm font-medium text-text-secondary whitespace-pre-wrap break-words leading-relaxed">
                                                                        {c.comment}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            <form onSubmit={(e) => handleAddComment(e, log.id)} className="flex items-center gap-2.5 sm:gap-3 mt-1">
                                                <input
                                                    type="text"
                                                    placeholder="Añade un comentario o pregunta..."
                                                    value={activeCommentInput[log.id] || ''}
                                                    onChange={(e) => setActiveCommentInput(prev => ({ ...prev, [log.id]: e.target.value }))}
                                                    disabled={isActionLoading}
                                                    className="flex-1 min-w-0 bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-full px-4 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-medium text-text-primary outline-none focus:ring-2 focus:ring-accent/50 transition-all disabled:opacity-50 placeholder:text-text-muted"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!activeCommentInput[log.id]?.trim() || isActionLoading}
                                                    className="p-3 sm:p-3.5 bg-accent text-accent-contrast rounded-full hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-lg shadow-accent/20 shrink-0 outline-none focus:outline-none active:scale-95"
                                                >
                                                    <FaPaperPlane className="text-sm" />
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </GlassCard>
                            </React.Fragment>
                        );
                    })}

                    {hasOlder && !isShowingOlder && (
                        <div className="flex flex-col items-center justify-center pt-2 pb-6">
                            <button
                                type="button"
                                onClick={() => loadFeed(true, scope, gymFilter)}
                                disabled={isLoadingOlder}
                                className="flex items-center gap-2 px-6 py-3.5 bg-black/5 dark:bg-white/5 hover:bg-accent hover:text-accent-contrast text-text-primary rounded-2xl font-bold text-xs sm:text-sm transition-all duration-300 shadow-sm hover:shadow-lg disabled:opacity-50 ring-1 ring-black/5 dark:ring-white/10 active:scale-95"
                            >
                                {isLoadingOlder ? (
                                    <>
                                        <Spinner size={16} />
                                        <span>Cargando publicaciones anteriores...</span>
                                    </>
                                ) : (
                                    <>
                                        <FaClock className="text-sm" />
                                        <span>Cargar más (publicaciones anteriores)</span>
                                    </>
                                )}
                            </button>
                            <p className="text-[11px] font-medium text-text-muted mt-2">
                                Mostrando últimos 7 días para un rendimiento óptimo
                            </p>
                        </div>
                    )}
                </div>
            )}
            </div>

            {showGymModal && (
                <React.Suspense fallback={null}>
                    <GymLocationModal
                        isOpen={showGymModal}
                        onClose={() => setShowGymModal(false)}
                        currentGym={myCurrentGym}
                        onSave={handleSaveGymFromFeed}
                        onRemove={handleRemoveGymFromFeed}
                    />
                </React.Suspense>
            )}

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
