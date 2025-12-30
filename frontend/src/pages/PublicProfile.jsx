/* frontend/src/pages/PublicProfile.jsx */
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User,
    Trophy,
    Medal,
    Flame,
    Calendar,
    ChevronLeft,
    ChevronRight,
    UserPlus,
    UserCheck,
    UserX,
    Dumbbell,
    Shield,
    Clock,
    Construction,
    Lock
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import { useToast } from '../hooks/useToast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// --- AÑADIDO: Constantes para construir la URL correcta ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_BASE_URL = API_BASE_URL?.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

// --- AÑADIDO: Helper para procesar la imagen ---
const getProfileImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    // Si es relativa, le pegamos el dominio del backend
    return `${BACKEND_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

// --- DICCIONARIO DE INSIGNIAS (Diseño Original con Emojis) ---
const BADGES_MAP = {
    // --- Login / Cuenta ---
    'first_login': { name: 'Bienvenido', icon: '👋' },
    'early_adopter': { name: 'Pionero', icon: '🚀' },
    'profile_complete': { name: 'Identidad Real', icon: '🆔' },
    'verified_user': { name: 'Verificado', icon: '✅' },

    // --- Entrenamientos ---
    'first_workout': { name: 'Primer Sudor', icon: '💦' },
    'workout_10': { name: 'Constante', icon: '🏋️' },
    'workout_50': { name: 'Dedicado', icon: '🦾' },
    'workout_100': { name: 'Centurión', icon: '💯' },
    'morning_bird': { name: 'Madrugador', icon: '🌅' },
    'night_owl': { name: 'Nocturno', icon: '🌙' },

    // --- Maestrías ---
    'nutrition_master': { name: 'Master Nutrición', icon: '🍎' },
    'routine_master': { name: 'Creador Rutinas', icon: '📋' },
    'exercise_master': { name: 'Pro del Gym', icon: '💪' },
    'social_master': { name: 'Influencer', icon: '🌟' },

    // --- Rachas (Streaks) ---
    'streak_3': { name: 'En Llamas', icon: '🔥' },
    'streak_7': { name: 'Imparable', icon: '⚡' },
    'streak_14': { name: 'Muro de Acero', icon: '🛡️' },
    'streak_30': { name: 'Leyenda', icon: '👑' },
    'streak_60': { name: 'Dios del Gym', icon: '🔱' },

    // --- Social ---
    'social_add': { name: 'Amigable', icon: '🤝' },
    'social_10_friends': { name: 'Popular', icon: '🌟' },

    // --- Objetivos / Peso ---
    'weight_goal': { name: 'Meta Cumplida', icon: '🎯' },
    'first_pr': { name: 'Récord Personal', icon: '🏆' },

    // --- Fallback ---
    'default': { name: 'Logro', icon: '🏅' }
};

// Helper para resolver los datos de la insignia
const resolveBadge = (badge) => {
    if (!badge) return BADGES_MAP['default'];

    let badgeId = '';
    // Normalizar ID
    if (typeof badge === 'string') badgeId = badge;
    else if (typeof badge === 'object') badgeId = badge.id || badge.name;

    // 1. Buscar en el mapa manual
    if (BADGES_MAP[badgeId]) return BADGES_MAP[badgeId];

    // 2. Fallback inteligente
    if (badgeId) {
        const friendlyName = badgeId
            .toString()
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());

        return { name: friendlyName, icon: '🏅' };
    }

    return BADGES_MAP['default'];
};

export default function PublicProfile({ userId: propUserId, onBack, setView }) {
    const { userId: paramUserId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const userId = propUserId || paramUserId;

    const {
        fetchPublicProfile,
        socialViewedProfile: fetchedProfile,
        isSocialLoading,
        socialError,
        clearViewedProfile,
        socialFriends,
        socialRequests,
        sendFriendRequest,
        removeFriend,
        userProfile: myProfile,
        gamification // Obtenemos el estado local de gamificación
    } = useAppStore();

    // --- ESTADO PARA PAGINACIÓN DE INSIGNIAS ---
    const [badgePage, setBadgePage] = useState(0);
    const BADGES_PER_PAGE = 4;

    useEffect(() => {
        if (userId) {
            fetchPublicProfile(userId);
        }
        return () => clearViewedProfile();
    }, [userId, fetchPublicProfile, clearViewedProfile]);

    const relationshipStatus = useMemo(() => {
        if (!myProfile || !userId) return 'unknown';
        const targetId = parseInt(userId);

        if (myProfile.id === targetId) return 'me';

        const isFriend = socialFriends.some(f => f.id === targetId || f.friend_id === targetId);
        if (isFriend) return 'friend';

        const hasSentRequest = socialRequests?.sent?.some(r => r.addressee_id === targetId);
        if (hasSentRequest) return 'pending_sent';

        const hasReceivedRequest = socialRequests?.received?.some(r => r.requester_id === targetId);
        if (hasReceivedRequest) return 'pending_received';

        return 'none';
    }, [socialFriends, socialRequests, myProfile, userId]);

    // --- CORRECCIÓN RACHA Y ENTRENOS: Usar datos locales si es mi propio perfil ---
    const profile = useMemo(() => {
        if (!fetchedProfile) return null;
        if (relationshipStatus === 'me' && gamification) {
            return {
                ...fetchedProfile,
                // Sobreescribimos con datos en vivo del store local para XP, Nivel y Racha
                xp: gamification.xp ?? fetchedProfile.xp,
                level: gamification.level ?? fetchedProfile.level,
                streak: gamification.streak ?? fetchedProfile.streak,
                // CORRECCIÓN: Usamos SIEMPRE el dato del backend para workoutsCount,
                // ya que es un conteo dinámico de la BD y el estado local suele estar desactualizado.
                workoutsCount: fetchedProfile.workoutsCount,
            };
        }
        return fetchedProfile;
    }, [fetchedProfile, relationshipStatus, gamification]);


    const handleSendRequest = async () => {
        const success = await sendFriendRequest(userId);
        if (success) showToast('Solicitud enviada', 'success');
        else showToast('Error al enviar solicitud', 'error');
    };

    const handleRemoveFriend = async () => {
        if (window.confirm('¿Seguro que quieres eliminar a este amigo?')) {
            await removeFriend(userId);
            showToast('Amigo eliminado', 'success');
            handleGoBack({ preventDefault: () => { }, stopPropagation: () => { } });
        }
    };

    // --- LÓGICA DE NAVEGACIÓN ROBUSTA ---
    const handleGoBack = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // 1. Prioridad: onBack (patrón Profile.jsx)
        if (onBack) {
            onBack();
            return;
        }

        // 2. Soporte: setView (por si acaso se pasa esta prop)
        if (setView) {
            setView('social');
            return;
        }

        // 3. Fallback: Recarga segura a Social
        window.location.href = '/social';
    };

    if (isSocialLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <Spinner size={40} />
                <p className="text-text-tertiary animate-pulse">Cargando perfil...</p>
            </div>
        );
    }

    if (socialError || !profile) {
        const isPrivate = socialError && (
            socialError.toLowerCase().includes('permiso') ||
            socialError.toLowerCase().includes('privado') ||
            socialError.toLowerCase().includes('forbidden')
        );

        return (
            <div className="p-8 flex flex-col items-center justify-center text-center">
                {isPrivate ? (
                    <>
                        <Lock size={64} className="text-accent-primary mb-4 opacity-50" />
                        <h2 className="text-xl font-bold text-text-primary mb-2">Perfil Privado</h2>
                        <p className="text-text-tertiary mb-6">Este perfil es privado. Debes añadir a este usuario a tus amigos para ver su actividad.</p>
                    </>
                ) : (
                    <>
                        <UserX size={64} className="text-red-400 mb-4 opacity-50" />
                        <h2 className="text-xl font-bold text-text-primary mb-2">Perfil no encontrado</h2>
                        <p className="text-text-tertiary mb-6">El usuario no existe o ha restringido su perfil.</p>
                    </>
                )}

                <button
                    type="button"
                    onClick={handleGoBack}
                    className="px-6 py-2 bg-bg-secondary rounded-xl text-text-primary hover:bg-bg-secondary/80 transition"
                >
                    Volver
                </button>
            </div>
        );
    }

    let badges = [];
    try {
        badges = typeof profile.unlocked_badges === 'string'
            ? JSON.parse(profile.unlocked_badges)
            : (profile.unlocked_badges || []);
    } catch (e) {
        badges = [];
    }

    // --- CÁLCULOS PAGINACIÓN ---
    const totalBadgePages = Math.ceil(badges.length / BADGES_PER_PAGE);
    const visibleBadges = badges.slice(badgePage * BADGES_PER_PAGE, (badgePage + 1) * BADGES_PER_PAGE);

    // --- MODIFICACIÓN: Procesar imagen ---
    const imgSrc = getProfileImageUrl(profile.profile_image_url);

    return (
        <div className="pb-6 px-4 max-w-4xl mx-auto animate-fade-in flex flex-col gap-6">

            {/* --- HEADER DESKTOP --- */}
            <div className="hidden md:flex items-center justify-between pt-6 mb-2 relative z-50">
                <button
                    type="button"
                    onClick={handleGoBack}
                    className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[--glass-border] text-text-secondary hover:text-text-primary hover:bg-accent-transparent transition"
                >
                    <ChevronLeft size={18} /> <span className="text-sm font-medium">Volver</span>
                </button>
                <h1 className="text-3xl font-extrabold flex-1 text-left ml-4 text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary">
                    Perfil Público
                </h1>
            </div>

            {/* --- HEADER NAVBAR (Móvil) --- */}
            <div className="md:hidden pt-4 flex items-center gap-4">
                <button
                    type="button"
                    onClick={handleGoBack}
                    className="cursor-pointer p-2 rounded-xl bg-bg-secondary/50 hover:bg-bg-secondary transition text-text-primary"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-text-primary truncate flex-1">
                    {profile.username || 'Perfil de Usuario'}
                </h1>
            </div>

            {/* --- PROFILE CARD PRINCIPAL --- */}
            <GlassCard className="relative overflow-hidden p-6 flex flex-col items-center text-center gap-4">
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-accent-primary/20 to-transparent pointer-events-none" />

                <div className="relative z-10 w-32 h-32 rounded-full p-1 bg-gradient-to-br from-accent-primary to-accent-secondary shadow-xl shadow-accent-primary/20">
                    <div className="w-full h-full rounded-full bg-bg-primary overflow-hidden relative">
                        {imgSrc ? (
                            <img
                                src={imgSrc}
                                alt={profile.username}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User size={64} className="text-text-tertiary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        )}
                    </div>
                    {profile.show_level_xp && (
                        <div className="absolute -bottom-2 -right-2 bg-bg-primary border-2 border-accent-primary rounded-full w-10 h-10 flex items-center justify-center font-black text-sm text-text-primary shadow-lg">
                            {profile.level || 1}
                        </div>
                    )}
                </div>

                <div className="z-10">
                    <h2 className="text-2xl font-bold text-text-primary mb-1">{profile.username}</h2>
                    <p className="text-text-secondary text-sm flex items-center justify-center gap-2">
                        Miembro desde {profile.createdAt ? new Date(profile.createdAt).getFullYear() : '2024'}
                        {profile.is_verified && <Shield size={14} className="text-blue-400 fill-blue-400/20" />}
                    </p>

                    {profile.lastSeen && (
                        <p className="text-xs text-text-tertiary mt-1 flex items-center justify-center gap-1">
                            <Clock size={12} />
                            Activo {format(new Date(profile.lastSeen), "d 'de' MMMM", { locale: es })}
                        </p>
                    )}
                </div>

                {relationshipStatus !== 'me' && (
                    <div className="z-10 flex gap-3 mt-2">
                        {relationshipStatus === 'none' && (
                            // MODIFICACIÓN: Añadido outline-none y focus:outline-none
                            <button
                                onClick={handleSendRequest}
                                className="flex items-center gap-2 px-6 py-2 bg-accent-primary/10 text-accent-primary font-bold rounded-xl hover:bg-accent-primary/20 transition-all active:scale-95 outline-none focus:outline-none"
                            >
                                <UserPlus size={18} />
                                Añadir Amigo
                            </button>
                        )}

                        {relationshipStatus === 'friend' && (
                            <div className="flex gap-2">
                                <button
                                    disabled
                                    className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 font-bold rounded-xl cursor-default"
                                >
                                    <UserCheck size={18} />
                                    Amigos
                                </button>
                                <button
                                    onClick={handleRemoveFriend}
                                    className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition outline-none focus:outline-none"
                                    title="Eliminar amigo"
                                >
                                    <UserX size={20} />
                                </button>
                            </div>
                        )}

                        {relationshipStatus === 'pending_sent' && (
                            <button disabled className="flex items-center gap-2 px-6 py-2 bg-bg-secondary text-text-tertiary font-bold rounded-xl cursor-not-allowed">
                                <Clock size={18} />
                                Solicitud Enviada
                            </button>
                        )}

                        {relationshipStatus === 'pending_received' && (
                            // MODIFICACIÓN: Añadido outline-none y focus:outline-none
                            <button onClick={handleGoBack} className="flex items-center gap-2 px-6 py-2 bg-accent-primary/10 text-accent-primary font-bold rounded-xl hover:bg-accent-primary/20 transition-all outline-none focus:outline-none">
                                <UserCheck size={18} />
                                Responder Solicitud
                            </button>
                        )}
                    </div>
                )}
            </GlassCard>

            {/* --- ESTADÍSTICAS --- */}
            {profile.show_level_xp ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <GlassCard className="p-4 flex flex-col items-center justify-center gap-2">
                        <Trophy className="text-yellow-500 mb-1" size={24} />
                        <span className="text-2xl font-bold text-text-primary">{profile.xp?.toLocaleString() || 0}</span>
                        <span className="text-xs text-text-tertiary uppercase tracking-wider">XP Total</span>
                    </GlassCard>

                    <GlassCard className="p-4 flex flex-col items-center justify-center gap-2">
                        <Flame className="text-orange-500 mb-1" size={24} />
                        <span className="text-2xl font-bold text-text-primary">{profile.streak || 0}</span>
                        <span className="text-xs text-text-tertiary uppercase tracking-wider">Racha (Días)</span>
                    </GlassCard>

                    <GlassCard className="p-4 flex flex-col items-center justify-center gap-2">
                        <Medal className="text-purple-500 mb-1" size={24} />
                        <span className="text-2xl font-bold text-text-primary">{profile.level || 1}</span>
                        <span className="text-xs text-text-tertiary uppercase tracking-wider">Nivel</span>
                    </GlassCard>

                    <GlassCard className="p-4 flex flex-col items-center justify-center gap-2">
                        <Calendar className="text-blue-500 mb-1" size={24} />
                        <span className="text-2xl font-bold text-text-primary">
                            {profile.workoutsCount || 0}
                        </span>
                        <span className="text-xs text-text-tertiary uppercase tracking-wider">Entrenos</span>
                    </GlassCard>
                </div>
            ) : (
                <GlassCard className="p-6 text-center text-text-tertiary">
                    <Shield size={32} className="mx-auto mb-3 opacity-30" />
                    <p>Las estadísticas de este usuario son privadas.</p>
                </GlassCard>
            )}

            {/* --- INSIGNIAS (PAGINADAS) --- */}
            {profile.show_badges && badges.length > 0 && (
                <div className="space-y-4">
                    {/* MODIFICACIÓN: flex-wrap y gap para que sea responsive sin superponerse */}
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                        <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 whitespace-nowrap">
                            <Medal size={20} className="text-accent-primary" />
                            Insignias Desbloqueadas
                        </h3>
                        {/* Controles de Paginación */}
                        {badges.length > BADGES_PER_PAGE && (
                            <div className="flex items-center gap-1 bg-bg-secondary/50 rounded-lg p-1 border border-glass-border">
                                <button
                                    onClick={() => setBadgePage(p => Math.max(0, p - 1))}
                                    disabled={badgePage === 0}
                                    className="p-1 hover:bg-white/10 rounded disabled:opacity-30 transition cursor-pointer"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-xs font-mono text-text-secondary px-1 select-none">
                                    {badgePage + 1}/{totalBadgePages}
                                </span>
                                <button
                                    onClick={() => setBadgePage(p => Math.min(totalBadgePages - 1, p + 1))}
                                    disabled={badgePage === totalBadgePages - 1}
                                    className="p-1 hover:bg-white/10 rounded disabled:opacity-30 transition cursor-pointer"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        {visibleBadges.map((badge, idx) => {
                            const b = resolveBadge(badge);
                            return (
                                <GlassCard key={idx} className="aspect-square flex flex-col items-center justify-center p-2 gap-2 hover:bg-white/5 transition animate-fade-in">
                                    <div className="text-3xl">{b.icon}</div>
                                    <span className="text-[10px] text-center font-medium leading-tight text-text-secondary line-clamp-2">
                                        {b.name}
                                    </span>
                                </GlassCard>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* --- RUTINAS PÚBLICAS (Próximamente) --- */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                    <Dumbbell size={20} className="text-accent-primary" />
                    Rutinas Públicas
                </h3>

                <GlassCard className="p-8 flex flex-col items-center justify-center gap-3">
                    <div className="p-3 rounded-full bg-accent/10">
                        <Construction size={24} className="text-accent" />
                    </div>
                    <span className="text-xl font-bold text-accent">Próximamente</span>
                    <p className="text-sm text-text-tertiary text-center max-w-xs">
                        Estamos trabajando para que pronto puedas explorar y copiar las rutinas de <span className="font-bold text-accent-primary">{profile.username}</span>.
                    </p>
                </GlassCard>
            </div>

        </div>
    );
}