/* frontend/src/pages/PublicProfile.jsx */
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
    Lock,
    Globe,
    Users,
    Download,
    Folder,
    X,
    Play
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../hooks/useToast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import UserAvatar from '../components/UserAvatar';
import StoryViewer from '../components/StoryViewer';
import SEOHead from '../components/SEOHead';
import ExerciseMedia from '../components/ExerciseMedia';

// --- CONFIGURACIÓN DE PUERTO ---
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'; 
const SERVER_URL = API_URL.replace('/api', '');

// Helper para corregir URLs de imágenes (Avatar/Rutinas)
const getFullImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; 
    if (path.startsWith('blob:')) return path; 
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${SERVER_URL}${cleanPath}`;
};

// Helper para detectar si es gradiente CSS
const isCssBackground = (value) => {
    return value && (value.startsWith('linear-gradient') || value.startsWith('var(--'));
};

// --- DICCIONARIO DE INSIGNIAS ---
const BADGES_MAP = {
    'first_login': { name: 'Bienvenido', icon: '👋' },
    'early_adopter': { name: 'Pionero', icon: '🚀' },
    'profile_complete': { name: 'Identidad Real', icon: '🆔' },
    'verified_user': { name: 'Verificado', icon: '✅' },
    'first_workout': { name: 'Primer Sudor', icon: '💦' },
    'workout_10': { name: 'Constante', icon: '🏋️' },
    'workout_50': { name: 'Dedicado', icon: '🦾' },
    'workout_100': { name: 'Centurión', icon: '💯' },
    'morning_bird': { name: 'Madrugador', icon: '🌅' },
    'night_owl': { name: 'Nocturno', icon: '🌙' },
    'nutrition_master': { name: 'Master Nutrición', icon: '🍎' },
    'routine_master': { name: 'Creador Rutinas', icon: '📋' },
    'exercise_master': { name: 'Pro del Gym', icon: '💪' },
    'social_master': { name: 'Influencer', icon: '🌟' },
    'streak_3': { name: 'En Llamas', icon: '🔥' },
    'streak_7': { name: 'Imparable', icon: '⚡' },
    'streak_14': { name: 'Muro de Acero', icon: '🛡️' },
    'streak_30': { name: 'Leyenda', icon: '👑' },
    'streak_60': { name: 'Dios del Gym', icon: '🔱' },
    'social_add': { name: 'Amigable', icon: '🤝' },
    'social_10_friends': { name: 'Popular', icon: '🌟' },
    'weight_goal': { name: 'Meta Cumplida', icon: '🎯' },
    'first_pr': { name: 'Récord Personal', icon: '🏆' },
    'default': { name: 'Logro', icon: '🏅' }
};

const resolveBadge = (badge) => {
    if (!badge) return BADGES_MAP['default'];
    let badgeId = typeof badge === 'string' ? badge : (badge.id || badge.name);
    if (BADGES_MAP[badgeId]) return BADGES_MAP[badgeId];
    if (badgeId) {
        const friendlyName = badgeId.toString().replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return { name: friendlyName, icon: '🏅' };
    }
    return BADGES_MAP['default'];
};

export default function PublicProfile({ userId: propUserId, onBack, setView }) {
    const { t } = useTranslation(['translation', 'exercise_names']); 
    
    const { userId: paramUserId } = useParams();
    const navigate = useNavigate();
    const { showToast, addToast } = useToast();

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
        gamification,
        stories, 
        fetchStories,
        token,
        refreshRoutines
    } = useAppStore();

    const [badgePage, setBadgePage] = useState(0);
    const BADGES_PER_PAGE = 4;

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeletingFriend, setIsDeletingFriend] = useState(false);
    const [downloadingRoutineId, setDownloadingRoutineId] = useState(null);
    
    const [viewingStory, setViewingStory] = useState(false);
    const [viewingRoutine, setViewingRoutine] = useState(null);

    useEffect(() => {
        if (userId) {
            fetchPublicProfile(userId);
            if (stories.length === 0) fetchStories();
        }
        return () => clearViewedProfile();
    }, [userId, fetchPublicProfile, clearViewedProfile, fetchStories]);

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

    const profile = useMemo(() => {
        if (!fetchedProfile) return null;
        
        const fullAvatarUrl = getFullImageUrl(fetchedProfile.avatar_url || fetchedProfile.avatar || fetchedProfile.profile_image_url);

        const baseProfile = { 
            ...fetchedProfile,
            avatar: fullAvatarUrl, 
            profile_image_url: fullAvatarUrl 
        };

        if (relationshipStatus === 'me' && gamification) {
            return {
                ...baseProfile,
                xp: gamification.xp ?? baseProfile.xp,
                level: gamification.level ?? baseProfile.level,
                streak: gamification.streak ?? baseProfile.streak,
                workoutsCount: baseProfile.workoutsCount,
            };
        }
        return baseProfile;
    }, [fetchedProfile, relationshipStatus, gamification]);

    const userStory = useMemo(() => {
        if (!profile) return null;
        const storyGroup = stories.find(s => s.userId === profile.id);
        
        if (!storyGroup) return null;

        const validStories = storyGroup.items.filter(item => {
            const isExpired = new Date(item.expiresAt) <= new Date();
            if (isExpired) return false;
            if (relationshipStatus === 'friend' || relationshipStatus === 'me') return true;
            return item.privacy === 'public';
        });

        if (validStories.length === 0) return null;

        const hasUnseen = validStories.some(item => !item.viewed);

        return { ...storyGroup, items: validStories, hasUnseen };
    }, [stories, profile, relationshipStatus]);


    // --- LÓGICA DE FILTRADO CORREGIDA: CONFIAR EN EL BACKEND ---
    const visibleRoutines = useMemo(() => {
        if (!profile || !profile.routines) return [];
        // Si el backend ya nos ha devuelto la rutina en el JSON del perfil, 
        // es porque ya ha comprobado la base de datos y sabemos que tenemos permiso
        // (ya sea porque es pública o porque somos amigos reales).
        return profile.routines;
    }, [profile]);


    const structuredData = useMemo(() => {
        if (!profile) return null;
        const baseUrl = 'https://pro-fitness-glass.zeabur.app';
        const profileUrl = `${baseUrl}/profile/${profile.id}`;
        const schema = {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": profile.username,
            "url": profileUrl,
            "description": `Perfil de atleta en Pro Fitness Glass. Nivel ${profile.level || 1} con ${profile.workoutsCount || 0} entrenamientos completados.`,
            "identifier": profile.id,
            "interactionStatistic": [
                {
                    "@type": "InteractionCounter",
                    "interactionType": "https://schema.org/ExerciseAction",
                    "userInteractionCount": profile.workoutsCount || 0
                }
            ]
        };
        if (profile.avatar_url) {
            schema.image = profile.avatar_url;
        }
        return JSON.stringify(schema);
    }, [profile]);


    const handleSendRequest = async () => {
        const success = await sendFriendRequest(userId);
        if (success) showToast('Solicitud enviada', 'success');
        else showToast('Error al enviar solicitud', 'error');
    };

    const handleRemoveFriend = () => setShowDeleteConfirm(true);

    const confirmRemoveFriend = async () => {
        setIsDeletingFriend(true);
        try {
            await removeFriend(userId);
            showToast('Amigo eliminado', 'success');
            handleGoBack({ preventDefault: () => { }, stopPropagation: () => { } });
        } catch (error) {
            console.error(error);
            showToast('Error al eliminar amigo', 'error');
        } finally {
            setIsDeletingFriend(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleDownloadRoutine = async (routineId) => {
        if (downloadingRoutineId) return;
        setDownloadingRoutineId(routineId);
        
        try {
            // Se define la carpeta igual que en la vista de enlace
            const folderName = profile?.username ? `Compartido de ${profile.username}` : 'Compartido';

            const response = await fetch(`${API_URL}/routines/${routineId}/download`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${useAppStore.getState().token}`,
                    'Content-Type': 'application/json'
                },
                // Enviamos la carpeta en el body
                body: JSON.stringify({ folder: folderName })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Error al descargar');
            
            addToast('Rutina importada a tu colección', 'success');
            
            if (refreshRoutines) {
                await refreshRoutines();
            }

        } catch (error) {
            console.error(error);
            addToast(error.message, 'error');
        } finally {
            setDownloadingRoutineId(null);
        }
    };

    const handleGoBack = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (onBack) { onBack(); return; }
        if (setView) { setView('social'); return; }
        window.location.href = '/social';
    };

    const getTranslatedExerciseName = (name) => {
        if (!name) return "";
        return t(name, { ns: 'exercise_names', defaultValue: name });
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
                        <Lock size={64} className="text-accent mb-4 opacity-50" />
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

    const totalBadgePages = Math.ceil(badges.length / BADGES_PER_PAGE);
    const visibleBadges = badges.slice(badgePage * BADGES_PER_PAGE, (badgePage + 1) * BADGES_PER_PAGE);

    return (
        <div className="pb-6 px-4 max-w-4xl mx-auto animate-fade-in flex flex-col gap-6">

            {viewingStory && (
                <StoryViewer 
                    userId={profile.id} 
                    onClose={() => setViewingStory(false)} 
                />
            )}

            {/* --- MODAL DETALLES RUTINA --- */}
            {viewingRoutine && (
                <div 
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
                    onClick={() => setViewingRoutine(null)}
                >
                    <GlassCard 
                        className="w-full max-w-lg max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl animate-scale-up"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-bg-secondary/80 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex flex-col">
                                <h3 className="font-bold text-lg text-text-primary line-clamp-1 flex items-center gap-2">
                                    <Dumbbell size={18} className="text-accent" />
                                    {viewingRoutine.name}
                                </h3>
                                {viewingRoutine.folder && (
                                    <span className="text-[10px] text-text-secondary flex items-center gap-1 mt-0.5">
                                        <Folder size={10} /> {viewingRoutine.folder}
                                    </span>
                                )}
                            </div>
                            <button 
                                onClick={() => setViewingRoutine(null)} 
                                className="p-2 rounded-full hover:bg-white/10 text-text-secondary hover:text-white transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-4 space-y-5 custom-scrollbar">
                            {viewingRoutine.description && (
                                <div className="bg-bg-primary/20 p-3 rounded-lg border border-white/5">
                                    <p className="text-sm text-text-secondary italic">"{viewingRoutine.description}"</p>
                                </div>
                            )}

                            <div>
                                <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3 flex items-center gap-2">
                                    Lista de Ejercicios <span className="bg-white/10 px-1.5 rounded-md text-text-primary">{viewingRoutine.exercises.length}</span>
                                </h4>
                                <div className="space-y-3">
                                    {viewingRoutine.exercises.map((ex, i) => {
                                        const mediaSrc = ex.gif_url || ex.image || ex.image_url;
                                        const videoSrc = ex.video || ex.video_url;
                                        const translatedName = getTranslatedExerciseName(ex.name);

                                        return (
                                            <GlassCard key={i} className="p-3 flex gap-4 items-center bg-bg-primary/30 border-white/5 hover:border-accent/30 transition group">
                                                <div className="w-24 h-24 shrink-0 rounded-lg bg-bg-secondary overflow-hidden border border-white/10 flex items-center justify-center relative shadow-lg">
                                                    <ExerciseMedia 
                                                        details={{
                                                            video_url: videoSrc,
                                                            image_url: mediaSrc,
                                                            name: translatedName
                                                        }}
                                                        className="w-full h-full object-cover" 
                                                    />
                                                    <div className="absolute top-1 left-1 bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[10px] font-bold text-white z-10 pointer-events-none">
                                                        #{i + 1}
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-text-primary text-sm line-clamp-2 mb-1">{translatedName}</p>
                                                    <span className="inline-block text-[10px] px-2 py-0.5 bg-white/5 rounded text-text-secondary">
                                                        Ver detalle al importar
                                                    </span>
                                                </div>
                                            </GlassCard>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-white/10 bg-bg-secondary/50 backdrop-blur-md">
                             <button 
                                onClick={() => { handleDownloadRoutine(viewingRoutine.id); setViewingRoutine(null); }}
                                disabled={downloadingRoutineId === viewingRoutine.id}
                                className="w-full py-3 rounded-xl bg-accent hover:opacity-90 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent/20 active:scale-[0.98]"
                             >
                                {downloadingRoutineId === viewingRoutine.id ? (
                                    <Spinner size="small" color="white" />
                                ) : (
                                    <>
                                        <Download size={20} /> Importar esta Rutina
                                    </>
                                )}
                             </button>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* --- SEO & STRUCTURED DATA --- */}
            {profile && (
                <>
                    <SEOHead 
                        title={`${profile.username} - Perfil en Pro Fitness Glass`}
                        description={`Mira el perfil de fitness de ${profile.username}. Nivel ${profile.level}, ${profile.workoutsCount} entrenamientos completados.`}
                        route={`profile/${profile.id}`}
                    />
                    {structuredData && (
                        <script type="application/ld+json">{structuredData}</script>
                    )}
                </>
            )}

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
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-accent/20 to-transparent pointer-events-none" />

                <div 
                    className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300
                        ${userStory 
                            ? `p-[3px] cursor-pointer ${
                                userStory.hasUnseen 
                                ? 'bg-accent shadow-xl shadow-accent/40 animate-pulse-slow' 
                                : 'bg-gray-400 dark:bg-gray-600'
                              }`
                            : 'shadow-xl shadow-accent/20'
                        }
                    `}
                    onClick={() => {
                        if (userStory) setViewingStory(true);
                    }}
                >
                    <UserAvatar
                        user={profile} 
                        size="full"
                        className={`w-full h-full rounded-full object-cover bg-bg-primary ${userStory ? 'border-[4px] border-bg-primary !border-bg-primary' : '!border-none'}`}
                    />

                    {profile.show_level_xp && (
                        <div className="absolute -bottom-2 -right-2 bg-bg-primary border-2 border-accent rounded-full w-10 h-10 flex items-center justify-center font-black text-sm text-text-primary shadow-lg z-20">
                            {profile.level || 1}
                        </div>
                    )}
                </div>

                <div className="z-10">
                    <h2 className="text-2xl font-bold text-text-primary mb-1 flex items-center justify-center gap-2">
                        {profile.username}
                        {userStory && (
                            <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">
                                Historia
                            </span>
                        )}
                    </h2>
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
                            <button
                                onClick={handleSendRequest}
                                className="flex items-center gap-2 px-6 py-2 bg-accent/10 text-accent font-bold rounded-xl hover:bg-accent/20 transition-all active:scale-95 outline-none focus:outline-none"
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
                            <button onClick={handleGoBack} className="flex items-center gap-2 px-6 py-2 bg-accent/10 text-accent font-bold rounded-xl hover:bg-accent/20 transition-all outline-none focus:outline-none">
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

            {/* --- INSIGNIAS --- */}
            {profile.show_badges && badges.length > 0 && (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                        <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 whitespace-nowrap">
                            <Medal size={20} className="text-accent" />
                            Insignias Desbloqueadas
                        </h3>
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

            {/* --- RUTINAS PÚBLICAS Y DE AMIGOS --- */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                    <Dumbbell size={20} className="text-accent" />
                    Rutinas de {profile.username}
                </h3>

                {visibleRoutines.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {visibleRoutines.map((routine) => {
                            const imageSrc = routine.imageUrl || routine.image_url;
                            const isPublic = routine.visibility === 'public' || routine.is_public; // Comprobación tolerante
                            
                            return (
                                <GlassCard 
                                    key={routine.id} 
                                    className="p-0 overflow-hidden flex flex-col group relative border-transparent hover:border-white/10 transition-all cursor-pointer hover:shadow-lg hover:shadow-accent/10"
                                    onClick={() => setViewingRoutine(routine)}
                                >
                                    {/* Imagen de fondo de la rutina */}
                                    <div className="h-28 w-full relative shrink-0 overflow-hidden bg-bg-secondary">
                                        {imageSrc ? (
                                            isCssBackground(imageSrc) ? (
                                                <div className="w-full h-full" style={{ background: imageSrc }} />
                                            ) : (
                                                <img 
                                                    src={getFullImageUrl(imageSrc)} 
                                                    alt={routine.name}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            )
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-bg-secondary to-bg-primary flex items-center justify-center text-text-muted">
                                                <Dumbbell size={32} opacity={0.2} />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-bg-secondary via-bg-secondary/20 to-transparent" />
                                        
                                        {routine.folder && (
                                            <div className="absolute top-2 right-2 z-20">
                                                <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-medium text-white flex items-center gap-1">
                                                    <Folder size={10} /> {routine.folder}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Contenido */}
                                    <div className="p-4 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start gap-2 mb-1">
                                            <h4 className="font-bold text-text-primary line-clamp-1 group-hover:text-accent transition-colors">{routine.name}</h4>
                                            {isPublic ? (
                                                <span className="shrink-0 text-[10px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <Globe size={10} /> Pública
                                                </span>
                                            ) : (
                                                <span className="shrink-0 text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <Users size={10} /> Amigos
                                                </span>
                                            )}
                                        </div>
                                        
                                        {routine.description && (
                                            <p className="text-xs text-text-secondary line-clamp-2 mb-3">
                                                {routine.description}
                                            </p>
                                        )}

                                        {/* PREVIEW DE EJERCICIOS (MINI) */}
                                        {routine.exercises && routine.exercises.length > 0 && (
                                            <div className="mb-3 space-y-2 bg-bg-primary/30 p-2 rounded-lg border border-white/5">
                                                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">
                                                    Ejercicios ({routine.exercises.length})
                                                </p>
                                                {routine.exercises.slice(0, 3).map((ex, i) => {
                                                    const mediaSrc = ex.gif_url || ex.image || ex.image_url;
                                                    const videoSrc = ex.video || ex.video_url;
                                                    const translatedName = getTranslatedExerciseName(ex.name);

                                                    return (
                                                        <div key={i} className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-md bg-bg-secondary shrink-0 overflow-hidden border border-white/10 flex items-center justify-center relative">
                                                                <ExerciseMedia 
                                                                    details={{
                                                                        video_url: videoSrc,
                                                                        image_url: mediaSrc,
                                                                        name: translatedName
                                                                    }}
                                                                    className="w-full h-full object-cover" 
                                                                />
                                                            </div>
                                                            <span className="text-xs text-text-secondary font-medium truncate flex-1">
                                                                {translatedName}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                                {routine.exercises.length > 3 && (
                                                    <p className="text-[10px] text-text-muted pl-1">
                                                        ... y {routine.exercises.length - 3} más
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="mt-auto pt-2">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownloadRoutine(routine.id);
                                                }}
                                                disabled={downloadingRoutineId === routine.id}
                                                className="w-full py-2 rounded-lg bg-accent hover:opacity-90 text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors shadow-md shadow-accent/20"
                                            >
                                                {downloadingRoutineId === routine.id ? (
                                                    <Spinner size="small" color="white" />
                                                ) : (
                                                    <>
                                                        <Download size={14} /> Importar Rutina
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </GlassCard>
                            );
                        })}
                    </div>
                ) : (
                    <GlassCard className="p-8 flex flex-col items-center justify-center text-center opacity-60">
                         <Dumbbell size={32} className="text-text-tertiary mb-2" />
                         <p className="text-text-secondary">Este usuario no tiene rutinas visibles para ti.</p>
                    </GlassCard>
                )}
            </div>

            {/* --- MODAL CONFIRMACIÓN ELIMINAR AMIGO --- */}
            {showDeleteConfirm && (
                <ConfirmationModal
                    message="¿Seguro que quieres eliminar a este amigo?"
                    confirmText="Eliminar"
                    cancelText="Cancelar"
                    onConfirm={confirmRemoveFriend}
                    onCancel={() => setShowDeleteConfirm(false)}
                    isLoading={isDeletingFriend}
                />
            )}

        </div>
    );
}