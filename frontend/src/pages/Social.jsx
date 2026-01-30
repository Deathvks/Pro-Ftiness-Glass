/* frontend/src/pages/Social.jsx */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Users, UserPlus, Trophy, Search, UserX, Check, X, Medal,
    ChevronRight, ChevronLeft, Plus, Camera, Image as ImageIcon,
    Globe, Zap, ShieldAlert, Clock, Lock
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import ConfirmationModal from '../components/ConfirmationModal';
import UserAvatar from '../components/UserAvatar';
import StoryViewer from '../components/StoryViewer';

// --- CONFIGURACIÓN DE PUERTO (Backend default 3001) ---
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'; 
const SERVER_URL = API_URL.replace('/api', '');

// Helper para corregir URLs de imágenes (Avatar)
const getFullImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; 
    if (path.startsWith('blob:')) return path; 
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${SERVER_URL}${cleanPath}`;
};

// --- Subcomponente: Burbuja de Historia ---
const StoryBubble = ({ user, isMe, hasStories, hasUnseen, onClick, onAdd }) => {
    return (
        <div className="flex flex-col items-center gap-1 min-w-[72px] cursor-pointer group relative">
            <div 
                className={`
                    relative p-[3px] rounded-full transition-all duration-300
                    ${hasStories 
                        ? (hasUnseen 
                            ? 'bg-accent shadow-lg shadow-accent/40 animate-pulse-slow' 
                            : 'bg-gray-300 dark:bg-white/20' 
                          ) 
                        : 'bg-transparent border-2 border-dashed border-gray-300 dark:border-white/20 hover:border-accent dark:hover:border-accent'
                    }
                `}
                onClick={onClick}
            >
                <div className="p-[2px] bg-bg-primary rounded-full relative z-10">
                    <UserAvatar 
                        user={{
                            ...user,
                            profile_image_url: user.profile_image_url || user.avatar
                        }} 
                        size={14} 
                        className="w-14 h-14" 
                    />
                </div>

                {isMe && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onAdd();
                        }}
                        className="absolute bottom-0 right-0 bg-accent text-white rounded-full p-1.5 border-2 border-bg-primary hover:scale-110 transition-transform shadow-md z-20"
                    >
                        <Plus size={10} strokeWidth={4} />
                    </button>
                )}
            </div>
            <span className={`text-xs font-medium truncate w-16 text-center ${hasUnseen ? 'text-text-primary font-bold' : 'text-text-secondary'}`}>
                {isMe ? 'Tu historia' : (user.username || 'Usuario').split(' ')[0]}
            </span>
        </div>
    );
};

// --- Subcomponente: Modal de Aviso Legal (NUEVO) ---
const StoryTermsModal = ({ onAccept, onReject }) => {
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-[fade-in_0.3s_ease-out]">
            <div className="w-full max-w-sm bg-bg-secondary border border-glass-border rounded-2xl overflow-hidden shadow-2xl flex flex-col relative">
                
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 text-accent">
                        <ShieldAlert size={32} />
                    </div>
                    
                    <h3 className="text-xl font-bold text-text-primary mb-2">Historias Efímeras</h3>
                    <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                        Antes de subir tu primera historia, debes conocer cómo funciona este espacio en nuestra comunidad.
                    </p>

                    <div className="space-y-4 text-left mb-8">
                        <div className="flex gap-3 items-start p-3 bg-white/5 rounded-xl border border-white/5">
                            <Clock className="text-blue-400 mt-0.5 shrink-0" size={18} />
                            <div>
                                <h4 className="text-sm font-bold text-text-primary">Duración Limitada</h4>
                                <p className="text-xs text-text-tertiary mt-0.5">
                                    Todo el contenido (fotos y vídeos) se elimina automáticamente de nuestros servidores tras <strong>24 horas</strong>.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start p-3 bg-white/5 rounded-xl border border-white/5">
                            <Users className="text-green-400 mt-0.5 shrink-0" size={18} />
                            <div>
                                <h4 className="text-sm font-bold text-text-primary">Tú decides quién lo ve</h4>
                                <p className="text-xs text-text-tertiary mt-0.5">
                                    Puedes elegir entre <strong>Público</strong> (toda la comunidad) o <strong>Solo Amigos</strong> antes de publicar.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start p-3 bg-white/5 rounded-xl border border-white/5">
                            <Lock className="text-purple-400 mt-0.5 shrink-0" size={18} />
                            <div>
                                <h4 className="text-sm font-bold text-text-primary">Responsabilidad</h4>
                                <p className="text-xs text-text-tertiary mt-0.5">
                                    No subas contenido ofensivo o ilegal. Nos reservamos el derecho de moderación.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={onAccept}
                            className="flex-1 order-1 sm:order-2 py-3 px-4 rounded-xl font-bold bg-accent text-white shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm whitespace-nowrap"
                        >
                            Aceptar y Continuar
                        </button>
                        <button 
                            onClick={onReject}
                            className="flex-1 order-2 sm:order-1 py-3 px-4 rounded-xl font-medium text-text-secondary hover:bg-white/10 transition-colors text-sm"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Subcomponente: Modal de Subida de Historia ---
const UploadStoryModal = ({ onClose, onUpload, isUploading }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [privacy, setPrivacy] = useState('friends'); 
    
    // Estados para control HDR
    const [canUseHDR, setCanUseHDR] = useState(false); // ¿El archivo es compatible?
    const [isHDR, setIsHDR] = useState(false);         // ¿El usuario quiere activarlo?
    
    const galleryInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const previewVideoRef = useRef(null); // Ref para el video de previsualización

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            
            // Reiniciar estados de detección
            setCanUseHDR(false);
            setIsHDR(false);

            // 1. Detección por extensión para Imágenes (HEIC/AVIF suelen ser HDR)
            if (selected.type.startsWith('image/')) {
                const isPotentialHDRImage = /\.(heic|heif|avif)$/i.test(selected.name);
                if (isPotentialHDRImage) {
                    setCanUseHDR(true);
                    setIsHDR(true); // Activar por defecto si se detecta
                }
            }
        }
    };

    // Efecto para forzar el frame en iOS/Safari
    useEffect(() => {
        if (preview && file?.type?.startsWith('video') && previewVideoRef.current) {
            // HACK SAFARI: Forzamos mute y un pequeño salto de tiempo para que renderice el thumbnail
            const vid = previewVideoRef.current;
            vid.muted = true; // Asegurar mute
            vid.currentTime = 0.1; // Saltar al principio
            
            // A veces es necesario cargar explícitamente si el src cambia dinámicamente
            vid.load();
        }
    }, [preview, file]);

    // 2. Detección avanzada para Vídeos al cargar metadatos
    const handleVideoLoad = (e) => {
        const video = e.target;
        // HACK SAFARI 2: Asegurar de nuevo el salto de tiempo cuando los metadatos cargan
        if (video.currentTime < 0.1) {
            video.currentTime = 0.1;
        }

        // API moderna para detectar espacio de color (Chrome/Edge/Safari recientes)
        if (video.colorSpace) {
            const { transfer, primaries } = video.colorSpace;
            // Detectar espacios de color HDR típicos: BT.2020, PQ (smpte2084), HLG
            const isHDRSpace = ['smpte2084', 'hlg', 'bt2020'].includes(transfer) || primaries === 'bt2020';
            
            if (isHDRSpace) {
                setCanUseHDR(true);
                setIsHDR(true); // Activar por defecto
            }
        }
    };

    const handleSubmit = () => {
        if (file) onUpload(file, privacy, isHDR);
    };

    const toggleHDR = () => {
        if (!canUseHDR) return;
        setIsHDR(!isHDR);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fade-in_0.2s_ease-out]">
            <div className="w-full max-w-md bg-bg-secondary border border-glass-border rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-bold text-text-primary">Nueva Historia</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
                        <X size={20} className="text-text-secondary" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center min-h-[300px]">
                    {!preview ? (
                        <div className="grid grid-cols-2 gap-4 w-full h-full">
                            {/* Opción Cámara */}
                            <div 
                                onClick={() => cameraInputRef.current?.click()}
                                className="aspect-square border-2 border-dashed border-accent/50 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-accent/10 transition-colors group"
                            >
                                <div className="p-4 bg-accent/20 rounded-full group-hover:scale-110 transition-transform text-accent">
                                    <Camera size={32} />
                                </div>
                                <p className="text-accent font-bold text-sm">Cámara</p>
                            </div>

                            {/* Opción Galería */}
                            <div 
                                onClick={() => galleryInputRef.current?.click()}
                                className="aspect-square border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/5 transition-colors group"
                            >
                                <div className="p-4 bg-white/5 rounded-full group-hover:scale-110 transition-transform text-text-secondary">
                                    <ImageIcon size={32} />
                                </div>
                                <p className="text-text-secondary font-medium text-sm">Galería</p>
                            </div>
                            
                            <p className="col-span-2 text-center text-xs text-text-tertiary mt-2">
                                Fotos o Vídeos • Duración máx 24h
                            </p>
                        </div>
                    ) : (
                        <div className="relative w-full h-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
                            {file?.type?.startsWith('video') ? (
                                <video 
                                    ref={previewVideoRef}
                                    src={preview} 
                                    className="max-h-[60vh] w-full object-contain" 
                                    controls 
                                    playsInline // Importante para iOS
                                    webkit-playsinline="true" // Legacy iOS
                                    preload="auto" // Forzar carga de datos
                                    muted // CRÍTICO: iOS renderiza mejor el thumbnail si está muteado inicialmente
                                    onLoadedMetadata={handleVideoLoad}
                                    style={{ 
                                        // Visualmente indicamos HDR si está activo
                                        filter: isHDR ? 'brightness(1.05) contrast(1.02)' : 'none',
                                    }}
                                />
                            ) : (
                                <img 
                                    src={preview} 
                                    alt="Preview" 
                                    className="max-h-[60vh] object-contain"
                                    style={{ 
                                        filter: isHDR ? 'brightness(1.05) contrast(1.02)' : 'none',
                                    }}
                                />
                            )}
                            <button 
                                onClick={() => { setFile(null); setPreview(null); setIsHDR(false); setCanUseHDR(false); }}
                                className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-red-500/80 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                    
                    <input 
                        type="file" 
                        accept="image/*,video/*" 
                        ref={galleryInputRef} 
                        className="hidden" 
                        onChange={handleFileChange} 
                    />
                    
                    {/* MODIFICADO: Eliminado capture="environment" para permitir elegir Foto o Vídeo en Android */}
                    <input 
                        type="file" 
                        accept="image/*,video/*" 
                        ref={cameraInputRef} 
                        className="hidden" 
                        onChange={handleFileChange} 
                    />
                </div>

                {/* Footer / Controls */}
                <div className="p-4 border-t border-white/10 space-y-4 bg-bg-secondary">
                    
                    <div className="flex gap-2 justify-center">
                        <button 
                            onClick={() => setPrivacy('friends')}
                            className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-all border
                                ${privacy === 'friends' 
                                    ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' 
                                    : 'bg-white/5 text-text-secondary border-white/5 hover:bg-white/10'
                                }`}
                        >
                            <Users size={14} />
                            <span>Solo Amigos</span>
                        </button>

                        <button 
                            onClick={() => setPrivacy('public')}
                            className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-all border
                                ${privacy === 'public' 
                                    ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' 
                                    : 'bg-white/5 text-text-secondary border-white/5 hover:bg-white/10'
                                }`}
                        >
                            <Globe size={14} />
                            <span>Público</span>
                        </button>

                        {/* Botón Inteligente HDR: Solo aparece si canUseHDR es true */}
                        {canUseHDR && (
                            <button 
                                onClick={toggleHDR}
                                className={`flex-initial px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all border
                                    ${isHDR 
                                        ? 'bg-accent text-white border-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)] animate-pulse-slow' 
                                        : 'bg-white/5 text-text-secondary border-white/5 opacity-60 hover:opacity-100'
                                    }`}
                            >
                                <Zap size={14} className={isHDR ? "fill-current" : ""} />
                                HDR {isHDR ? 'ON' : 'OFF'}
                            </button>
                        )}
                    </div>

                    <button 
                        onClick={handleSubmit}
                        disabled={!file || isUploading}
                        className="w-full py-3 bg-accent text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-accent/20"
                    >
                        {isUploading ? <Spinner size={20} color="border-white" /> : 'Compartir Historia'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Componentes Extraídos ---

const TabButton = ({ id, icon: Icon, label, badge, isActive, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`flex-1 flex md:flex-row flex-col items-center md:justify-start justify-center py-3 md:px-4 md:gap-3 gap-1 text-xs md:text-sm font-medium transition-colors relative md:rounded-xl
        ${isActive
                ? 'text-accent border-b-2 md:border-b-0 border-accent md:bg-accent/10'
                : 'text-text-secondary hover:text-text-primary md:hover:bg-white/5'
            }`}
    >
        <Icon size={20} className="md:w-5 md:h-5" />
        <span>{label}</span>
        {badge > 0 && (
            <span className="absolute top-2 right-2 md:static md:ml-auto bg-red-500 text-white text-[10px] md:text-xs font-bold w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full shadow-sm">
                {badge}
            </span>
        )}
    </button>
);

const UserListItem = ({ user, action, subtext, isHighlighted, onNavigate }) => {
    const fixedUser = {
        ...user,
        avatar: getFullImageUrl(user.profile_image_url || user.avatar),
        profile_image_url: getFullImageUrl(user.profile_image_url || user.avatar) 
    };

    return (
        <div
            onClick={() => onNavigate(user.id)}
            className={`flex items-center justify-between p-3 border-b border-white/10 last:border-0 transition-all duration-500 cursor-pointer group
          ${isHighlighted
                    ? 'bg-accent/10 border-l-2 border-l-accent shadow-[inset_0_0_20px_rgba(var(--accent-rgb),0.1)]'
                    : 'hover:bg-white/5'
                }`}
        >
            <div className="flex items-center gap-3">
                <UserAvatar user={fixedUser} size={10} className="w-10 h-10" />

                <div>
                    <p className={`font-semibold transition-colors line-clamp-1 ${isHighlighted ? 'text-accent' : 'text-text-primary group-hover:text-accent'}`}>
                        {user.username || user.name || 'Usuario'}
                    </p>
                    <p className="text-xs text-text-tertiary line-clamp-1">
                        {subtext || `Nivel ${user.level || 1} • ${user.xp || 0} XP`}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                {action}
                {!action && <ChevronRight size={16} className="text-white/20" />}
            </div>
        </div>
    );
};

export default function Social({ setView }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'friends');

    const [searchQuery, setSearchQuery] = useState('');
    const [searchPage, setSearchPage] = useState(1);
    const [friendsPage, setFriendsPage] = useState(1);
    const FRIENDS_PER_PAGE = 5;
    const ITEMS_PER_PAGE = 10;
    
    const [highlightedId, setHighlightedId] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, friendId: null });
    const [isDeleting, setIsDeleting] = useState(false);

    // --- Estados para Historias ---
    const [viewingStoryUserId, setViewingStoryUserId] = useState(null); 
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false); // NUEVO
    const [isUploadingStory, setIsUploadingStory] = useState(false);

    const { showToast } = useToast();

    const {
        userProfile,
        socialFriends,
        socialRequests,
        socialSearchResults,
        socialLeaderboard,
        isSocialLoading,
        searchUsers,
        fetchFriends,
        fetchFriendRequests,
        sendFriendRequest,
        respondFriendRequest,
        removeFriend,
        fetchLeaderboard,
        
        stories,
        myStories,
        fetchStories,
        uploadStory,
        subscribeToStories, // <-- Añadido
    } = useAppStore();

    useEffect(() => {
        fetchFriends();
        fetchFriendRequests();
        fetchLeaderboard();
        fetchStories(); 
        subscribeToStories(); // <-- Añadido: Activa la escucha de eventos en tiempo real
    }, [fetchFriends, fetchFriendRequests, fetchLeaderboard, fetchStories, subscribeToStories]);

    // Manejo de params
    useEffect(() => {
        const tab = searchParams.get('tab');
        const highlight = searchParams.get('highlight');
        if (tab && ['friends', 'requests', 'search', 'leaderboard'].includes(tab)) setActiveTab(tab);
        if (highlight) {
            setHighlightedId(parseInt(highlight));
            const timer = setTimeout(() => setHighlightedId(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [searchParams]);

    const changeTab = (newTab) => {
        setActiveTab(newTab);
        setSearchParams({ tab: newTab });
    };

    // Búsqueda
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.trim()) {
                setSearchPage(1);
                searchUsers(searchQuery);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, searchUsers]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setSearchPage(1);
            searchUsers(searchQuery);
        }
    };

    // --- Lógica de Historias ---

    // Función para intentar iniciar la subida
    const initiateStoryUpload = () => {
        const termsAccepted = localStorage.getItem('story_terms_accepted');
        if (termsAccepted === 'true') {
            setShowUploadModal(true);
        } else {
            setShowTermsModal(true);
        }
    };

    // Al aceptar los términos
    const handleAcceptTerms = () => {
        localStorage.setItem('story_terms_accepted', 'true');
        setShowTermsModal(false);
        setShowUploadModal(true);
    };

    // Al rechazar los términos
    const handleRejectTerms = () => {
        setShowTermsModal(false);
        // No guardamos nada, así la próxima vez sale de nuevo
    };

    const handleUploadStory = async (file, privacy, isHDR) => {
        setIsUploadingStory(true);
        try {
            const result = await uploadStory(file, privacy, isHDR);
            
            if (result && result.success) {
                showToast('Historia subida con éxito', 'success');
                setShowUploadModal(false);
            } else {
                // Mostramos el mensaje específico que viene del backend (NSFW, formato, etc.)
                showToast(result?.error || 'Error al subir historia', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Ocurrió un error inesperado', 'error');
        } finally {
            setIsUploadingStory(false);
        }
    };

    const handleMyStoryClick = () => {
        if (myStories.length > 0) {
            setViewingStoryUserId(userProfile.id);
        } else {
            initiateStoryUpload(); // Usar la nueva lógica
        }
    };

    // Filtrado de Historias
    const visibleStories = useMemo(() => {
        return stories.filter(storyUser => {
            const isFriend = socialFriends.some(f => f.id === storyUser.userId);
            const hasPublicStories = storyUser.items?.some(item => item.privacy === 'public');
            return isFriend || hasPublicStories;
        });
    }, [stories, socialFriends]);

    // Calcular si tengo historias sin ver
    const myStoriesUnseen = useMemo(() => {
        return myStories && myStories.some(s => !s.viewed);
    }, [myStories]);

    // --- Renderers ---

    const handleSendRequest = async (e, targetUserId) => {
        e.stopPropagation();
        const success = await sendFriendRequest(targetUserId);
        if (success) showToast('Solicitud enviada', 'success');
        else showToast('Error al enviar solicitud', 'error');
    };

    const handleRespond = async (e, requestId, action) => {
        e.stopPropagation();
        await respondFriendRequest(requestId, action);
        showToast(action === 'accept' ? 'Solicitud aceptada' : 'Solicitud rechazada', 'success');
    };

    const handleRemoveFriend = (e, friendId) => {
        e.stopPropagation();
        setDeleteConfirmation({ isOpen: true, friendId });
    };

    const confirmDeleteFriend = async () => {
        if (!deleteConfirmation.friendId) return;
        setIsDeleting(true);
        await removeFriend(deleteConfirmation.friendId);
        showToast('Amigo eliminado', 'success');
        setIsDeleting(false);
        setDeleteConfirmation({ isOpen: false, friendId: null });
    };

    const goToProfile = (userId) => {
        if (userId === userProfile?.id) setView('profile');
        else setView('publicProfile', { userId });
    };

    const renderFriends = () => {
        const totalFriends = socialFriends.length;
        const totalPages = Math.ceil(totalFriends / FRIENDS_PER_PAGE);
        const paginatedFriends = socialFriends.slice((friendsPage - 1) * FRIENDS_PER_PAGE, friendsPage * FRIENDS_PER_PAGE);

        return (
            <GlassCard className="[.oled-theme_&]:border-white/10">
                <h3 className="text-lg font-bold text-text-primary mb-4 px-4 pt-4 border-b border-white/5 pb-2">Mis Amigos ({socialFriends.length})</h3>
                {socialFriends.length === 0 ? (
                    <div className="text-center py-12 text-text-tertiary">
                        <Users size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Aún no tienes amigos agregados.</p>
                        <button onClick={() => changeTab('search')} className="mt-4 text-accent hover:text-accent/80 font-medium text-sm transition-colors">Buscar personas</button>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {paginatedFriends.map((friend) => (
                            <UserListItem
                                key={friend.id}
                                user={friend}
                                isHighlighted={highlightedId === friend.id}
                                onNavigate={goToProfile}
                                action={
                                    <button onClick={(e) => handleRemoveFriend(e, friend.id)} className="p-2 text-text-tertiary hover:text-red-400 transition-colors z-10" title="Eliminar amigo"><UserX size={18} /></button>
                                }
                            />
                        ))}
                    </div>
                )}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center p-3 border-t border-white/5">
                        <button onClick={() => setFriendsPage(p => Math.max(1, p - 1))} disabled={friendsPage === 1} className="p-1 text-text-tertiary hover:text-text-primary disabled:opacity-30"><ChevronLeft size={20} /></button>
                        <span className="text-xs text-text-tertiary">Página {friendsPage} de {totalPages}</span>
                        <button onClick={() => setFriendsPage(p => Math.min(totalPages, p + 1))} disabled={friendsPage === totalPages} className="p-1 text-text-tertiary hover:text-text-primary disabled:opacity-30"><ChevronRight size={20} /></button>
                    </div>
                )}
            </GlassCard>
        );
    };

    const renderRequests = () => {
        const received = socialRequests?.received || [];
        const sent = socialRequests?.sent || [];
        return (
            <div className="space-y-6">
                <GlassCard className="[.oled-theme_&]:border-white/10">
                    <h3 className="text-lg font-bold text-text-primary mb-4 px-4 pt-4 flex items-center gap-2 border-b border-white/5 pb-2">
                        Solicitudes Recibidas {received.length > 0 && <span className="bg-accent text-bg-primary text-xs px-2 py-0.5 rounded-full font-bold">{received.length}</span>}
                    </h3>
                    {received.length === 0 ? <p className="text-text-tertiary text-center py-8 text-sm">No tienes solicitudes pendientes.</p> : (
                        <div className="flex flex-col">
                            {received.map((req) => (
                                <UserListItem key={req.id} user={req.Requester} onNavigate={goToProfile} subtext="Quiere ser tu amigo" action={
                                    <div className="flex gap-2 z-10">
                                        <button onClick={(e) => handleRespond(e, req.id, 'accept')} className="p-2 bg-green-500/20 text-green-400 rounded-lg"><Check size={18} /></button>
                                        <button onClick={(e) => handleRespond(e, req.id, 'reject')} className="p-2 bg-red-500/20 text-red-400 rounded-lg"><X size={18} /></button>
                                    </div>
                                } />
                            ))}
                        </div>
                    )}
                </GlassCard>
                {sent.length > 0 && (
                    <GlassCard className="[.oled-theme_&]:border-white/10">
                        <h3 className="text-lg font-bold text-text-primary mb-4 px-4 pt-4 border-b border-white/5 pb-2">Enviadas</h3>
                        <div className="flex flex-col">
                            {sent.map((req) => (
                                <UserListItem key={req.id} user={req.Addressee} onNavigate={goToProfile} subtext="Solicitud pendiente" action={<span className="text-xs text-text-tertiary bg-white/5 px-2 py-1 rounded border border-white/5">Esperando</span>} />
                            ))}
                        </div>
                    </GlassCard>
                )}
            </div>
        );
    };

    const renderSearch = () => {
        const totalResults = socialSearchResults.length;
        const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);
        const paginatedResults = socialSearchResults.slice((searchPage - 1) * ITEMS_PER_PAGE, searchPage * ITEMS_PER_PAGE);

        return (
            <div className="space-y-4 max-w-xl w-full">
                <form onSubmit={handleSearch}>
                    <GlassCard className="flex items-center px-3 py-2 gap-2 focus-within:border-accent/50 transition-colors [.oled-theme_&]:border-white/10">
                        <Search size={20} className="text-text-tertiary ml-1" />
                        <input type="text" placeholder="Buscar por nombre de usuario..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-text-primary flex-1 placeholder-text-tertiary text-sm py-2" />
                        <button type="submit" disabled={isSocialLoading} className="bg-transparent text-text-primary font-bold px-4 py-1.5 rounded-lg active:scale-95 transition-all hover:bg-white/5 text-sm">{isSocialLoading ? <Spinner size={18} /> : 'Buscar'}</button>
                    </GlassCard>
                </form>
                {totalResults > 0 && (
                    <GlassCard className="[.oled-theme_&]:border-white/10">
                        <h3 className="text-lg font-bold text-text-primary mb-2 px-4 pt-4 border-b border-white/5 pb-2 flex justify-between items-center">
                            <span>Resultados</span><span className="text-xs font-medium text-text-tertiary">{totalResults} encontrados</span>
                        </h3>
                        <div className="flex flex-col">
                            {paginatedResults.map((user) => {
                                const isMe = user.id === userProfile?.id;
                                const isFriend = socialFriends.some(f => f.id === user.id);
                                const hasSentRequest = socialRequests?.sent?.some(r => r.addressee_id === user.id);
                                return (
                                    <UserListItem key={user.id} user={user} onNavigate={goToProfile} action={
                                        !isMe && !isFriend && !hasSentRequest ? (
                                            <button onClick={(e) => handleSendRequest(e, user.id)} className="p-2 bg-accent/20 text-accent rounded-lg z-10"><UserPlus size={18} /></button>
                                        ) : isFriend ? <span className="text-xs text-green-400 font-medium px-2 py-1 bg-green-500/10 rounded">Amigo</span> : hasSentRequest ? <span className="text-xs text-text-tertiary px-2 py-1 bg-white/5 rounded">Enviada</span> : isMe ? <span className="text-xs text-text-tertiary px-2 py-1 bg-white/5 rounded">Tú</span> : null
                                    } />
                                );
                            })}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex justify-between items-center p-3 border-t border-white/5">
                                <button onClick={() => setSearchPage(p => Math.max(1, p - 1))} disabled={searchPage === 1} className="p-1 text-text-tertiary hover:text-text-primary disabled:opacity-30"><ChevronLeft size={20} /></button>
                                <span className="text-xs text-text-tertiary">Página {searchPage} de {totalPages}</span>
                                <button onClick={() => setSearchPage(p => Math.min(totalPages, p + 1))} disabled={searchPage === totalPages} className="p-1 text-text-tertiary hover:text-text-primary disabled:opacity-30"><ChevronRight size={20} /></button>
                            </div>
                        )}
                    </GlassCard>
                )}
                {totalResults === 0 && searchQuery && !isSocialLoading && <div className="text-center py-8 text-text-tertiary"><p className="text-sm">No se encontraron usuarios.</p></div>}
            </div>
        );
    };

    const renderLeaderboard = () => (
        <GlassCard className="overflow-hidden [.oled-theme_&]:border-white/10">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2"><Trophy className="text-yellow-500" size={20} /> Ranking Global</h3>
                <span className="text-xs font-medium text-text-tertiary bg-white/10 px-2 py-1 rounded-full">Top 50</span>
            </div>
            <div className="flex flex-col">
                <div className="flex text-xs text-text-tertiary p-3 border-b border-white/5 uppercase tracking-wider font-bold bg-white/5">
                    <span className="w-10 text-center">#</span><span className="flex-1 pl-2">Atleta</span><span className="w-16 text-right">Nivel</span><span className="w-24 text-right">XP</span>
                </div>
                {socialLeaderboard.map((user, index) => {
                    const isMe = user.id === userProfile?.id;
                    const fixedUser = { ...user, avatar: getFullImageUrl(user.profile_image_url || user.avatar) };

                    return (
                        <div key={user.id} onClick={() => goToProfile(user.id)} className={`flex items-center p-3 border-b border-white/5 last:border-0 cursor-pointer transition-colors hover:bg-white/10 ${isMe ? 'bg-accent/10 border-l-4 border-l-accent pl-2' : ''}`}>
                            <div className="w-10 flex justify-center font-bold text-text-secondary text-lg">
                                {index + 1 === 1 ? <Medal size={20} className="text-yellow-400" /> : index + 1 === 2 ? <Medal size={20} className="text-gray-300" /> : index + 1 === 3 ? <Medal size={20} className="text-amber-700" /> : <span className="text-sm opacity-60">#{index + 1}</span>}
                            </div>
                            <div className="flex-1 flex items-center gap-3 min-w-0 pl-2">
                                <UserAvatar user={fixedUser} size={9} className="w-9 h-9" />
                                <span className={`truncate text-sm ${isMe ? 'text-accent font-bold' : 'text-text-primary font-medium'}`}>{user.username} {isMe && "(Tú)"}</span>
                            </div>
                            <div className="w-16 text-right text-sm text-text-secondary font-medium">{user.level}</div>
                            <div className="w-24 text-right text-sm text-text-primary font-mono font-semibold tracking-tight">{user.xp?.toLocaleString()}</div>
                        </div>
                    );
                })}
            </div>
        </GlassCard>
    );

    return (
        <div className="w-full max-w-7xl mx-auto px-4 pt-6 pb-24 md:pb-8 animate-[fade-in_0.5s_ease-out]">
            
            {/* --- Modales --- */}
            {deleteConfirmation.isOpen && (
                <ConfirmationModal
                    message="¿Seguro que quieres eliminar a este amigo de tu lista?"
                    onConfirm={confirmDeleteFriend}
                    onCancel={() => setDeleteConfirmation({ isOpen: false, friendId: null })}
                    confirmText="Eliminar amigo"
                    cancelText="Cancelar"
                    isLoading={isDeleting}
                />
            )}

            {/* Modal de Aviso Legal (Primero) */}
            {showTermsModal && (
                <StoryTermsModal 
                    onAccept={handleAcceptTerms}
                    onReject={handleRejectTerms}
                />
            )}

            {/* Modal de Subida (Segundo) */}
            {showUploadModal && (
                <UploadStoryModal 
                    onClose={() => setShowUploadModal(false)}
                    onUpload={handleUploadStory}
                    isUploading={isUploadingStory}
                />
            )}

            {viewingStoryUserId && (
                <StoryViewer 
                    userId={viewingStoryUserId}
                    onClose={() => setViewingStoryUserId(null)}
                />
            )}

            {/* --- Header --- */}
            <header className="mb-6">
                <div className="flex justify-between items-end">
                    <div>
                        <div className="hidden md:flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary">
                                Comunidad
                            </h1>
                            <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-xs font-bold tracking-wider uppercase">
                                BETA
                            </span>
                        </div>
                        <p className="text-text-tertiary text-sm mt-1">Conecta y compite con otros atletas</p>
                    </div>
                </div>
            </header>

            {/* --- Carrusel de Historias --- */}
            <section className="mb-8 overflow-x-auto no-scrollbar pb-2">
                <div className="flex items-start gap-4 px-1">
                    {/* Mi Historia / Subir */}
                    <StoryBubble 
                        user={{ 
                            ...userProfile, 
                            avatar: getFullImageUrl(userProfile?.profile_image_url || userProfile?.avatar) 
                        }} 
                        isMe={true} 
                        hasStories={myStories.length > 0} 
                        hasUnseen={myStoriesUnseen} 
                        onClick={handleMyStoryClick} 
                        onAdd={initiateStoryUpload} // Usamos la nueva función con validación
                    />

                    {/* Historias de Amigos */}
                    {visibleStories.map(storyUser => {
                        const rawUser = storyUser.user || {};
                        const username = storyUser.username || rawUser.username || 'Usuario';
                        const avatarPath = storyUser.profile_image_url || rawUser.profile_image_url || storyUser.avatar || rawUser.avatar;
                        const hasUnseen = storyUser.hasUnseen !== undefined 
                            ? storyUser.hasUnseen 
                            : storyUser.items?.some(item => !item.viewed);
                        const fullAvatarUrl = getFullImageUrl(avatarPath);

                        return (
                            <StoryBubble 
                                key={storyUser.userId}
                                user={{ 
                                    username: username, 
                                    avatar: fullAvatarUrl,
                                    profile_image_url: fullAvatarUrl
                                }} 
                                isMe={false}
                                hasStories={true}
                                hasUnseen={hasUnseen}
                                onClick={() => setViewingStoryUserId(storyUser.userId)}
                            />
                        );
                    })}
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                    <GlassCard className="flex md:flex-col overflow-hidden md:p-2 sticky md:top-24 md:z-10 [.oled-theme_&]:border-white/10">
                        <TabButton id="friends" icon={Users} label="Amigos" isActive={activeTab === 'friends'} onClick={changeTab} />
                        <TabButton id="requests" icon={UserPlus} label="Solicitudes" badge={socialRequests?.received?.length || 0} isActive={activeTab === 'requests'} onClick={changeTab} />
                        <TabButton id="search" icon={Search} label="Buscar" isActive={activeTab === 'search'} onClick={changeTab} />
                        <TabButton id="leaderboard" icon={Trophy} label="Ranking" isActive={activeTab === 'leaderboard'} onClick={changeTab} />
                    </GlassCard>
                </div>

                <div className="md:col-span-3 min-h-[400px]">
                    {activeTab === 'friends' && renderFriends()}
                    {activeTab === 'requests' && renderRequests()}
                    {activeTab === 'search' && renderSearch()}
                    {activeTab === 'leaderboard' && renderLeaderboard()}
                </div>
            </div>
        </div>
    );
}