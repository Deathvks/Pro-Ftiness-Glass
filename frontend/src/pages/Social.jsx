/* frontend/src/pages/Social.jsx */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Users, UserPlus, Trophy, Search, UserX, Check, X, Medal,
    ChevronRight, ChevronLeft, Plus, Camera, Image as ImageIcon,
    Globe, Zap, ShieldAlert, Clock, Lock, Video as VideoIcon,
    Info, Settings, Shield, PlusCircle, Hash, Copy, ArrowLeft, LogOut, Trash2
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import ConfirmationModal from '../components/ConfirmationModal';
import UserAvatar from '../components/UserAvatar';
import StoryViewer from '../components/StoryViewer';
import socialService from '../services/socialService';

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

// --- Subcomponente: Banner de Estado de Privacidad ---
const PrivacyBanner = ({ privacy, onNavigate }) => {
    const isPublic = privacy === 'public';

    return (
        <div 
            className="mb-6 rounded-xl p-4 flex flex-col sm:flex-row items-start gap-4 shadow-sm backdrop-blur-sm transition-all animate-[fade-in_0.3s_ease-out] max-w-3xl mx-auto"
            style={{
                background: 'linear-gradient(to bottom right, var(--color-accent-border), var(--color-accent-transparent))'
            }}
        >
            <div 
                className="p-2.5 rounded-full text-white shrink-0 mt-0.5"
                style={{ backgroundColor: 'var(--color-accent-border)' }}
            >
                {isPublic ? <Globe size={20} /> : <Lock size={20} />}
            </div>
            
            <div className="flex-1">
                <h4 className="text-sm font-bold text-accent mb-1 flex items-center gap-2">
                    {isPublic ? 'Tu perfil es VISIBLE (Público)' : 'Tu perfil es PRIVADO'}
                </h4>
                
                <div className="text-xs text-text-secondary leading-relaxed mb-3 space-y-1">
                    {isPublic ? (
                        <>
                            <p>
                                Actualmente <strong>todo el mundo puede ver tu perfil</strong> y estadísticas.
                            </p>
                            <p className="flex items-start gap-1.5 opacity-80">
                                <Check size={12} className="mt-0.5 text-accent" />
                                <span>Apareces en el <strong>Ranking Global</strong> y búsquedas públicas.</span>
                            </p>
                        </>
                    ) : (
                        <>
                            <p>
                                Actualmente <strong>solo tus amigos</strong> pueden ver tu actividad.
                            </p>
                            <p className="flex items-start gap-1.5 opacity-80">
                                <X size={12} className="mt-0.5 text-accent" />
                                <span><strong>No apareces</strong> en el Ranking Global ni en búsquedas públicas.</span>
                            </p>
                        </>
                    )}
                </div>

                <button 
                    onClick={onNavigate}
                    className="text-xs font-bold bg-accent/10 hover:bg-accent/20 text-accent px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                >
                    <Settings size={12} />
                    Cambiar configuración
                </button>
            </div>
        </div>
    );
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

// --- Subcomponente: Modal de Aviso Legal ---
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
    const [canUseHDR, setCanUseHDR] = useState(false);
    const [isHDR, setIsHDR] = useState(false);
    
    const galleryInputRef = useRef(null);
    const cameraPhotoInputRef = useRef(null);
    const cameraVideoInputRef = useRef(null);
    const previewVideoRef = useRef(null);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setCanUseHDR(false);
            setIsHDR(false);

            if (selected.type.startsWith('image/')) {
                const isPotentialHDRImage = /\.(heic|heif|avif)$/i.test(selected.name);
                if (isPotentialHDRImage) {
                    setCanUseHDR(true);
                    setIsHDR(true);
                }
            }
        }
    };

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    useEffect(() => {
        if (preview && file?.type?.startsWith('video') && previewVideoRef.current) {
            const vid = previewVideoRef.current;
            vid.muted = true;
            vid.currentTime = 0.1;
            vid.load();
        }
    }, [preview, file]);

    const handleVideoLoad = (e) => {
        const video = e.target;
        if (video.currentTime < 0.1) video.currentTime = 0.1;

        if (video.colorSpace) {
            const { transfer, primaries } = video.colorSpace;
            const isHDRSpace = ['smpte2084', 'hlg', 'bt2020'].includes(transfer) || primaries === 'bt2020';
            if (isHDRSpace) {
                setCanUseHDR(true);
                setIsHDR(true);
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

    const onInputClick = (e) => {
        e.target.value = null;
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fade-in_0.2s_ease-out]">
            <div className="w-full max-w-md bg-bg-secondary border border-glass-border rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-bold text-text-primary">Nueva Historia</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
                        <X size={20} className="text-text-secondary" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center min-h-[300px]">
                    {!preview ? (
                        <div className="grid grid-cols-3 gap-3 w-full h-full">
                            <div 
                                onClick={() => cameraPhotoInputRef.current?.click()}
                                className="aspect-square border-2 border-dashed border-accent/30 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-accent/10 transition-colors group"
                            >
                                <div className="p-3 bg-accent/20 rounded-full group-hover:scale-110 transition-transform text-accent">
                                    <Camera size={28} />
                                </div>
                                <p className="text-accent font-bold text-xs">Foto</p>
                            </div>

                            <div 
                                onClick={() => cameraVideoInputRef.current?.click()}
                                className="aspect-square border-2 border-dashed border-red-500/30 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-red-500/10 transition-colors group"
                            >
                                <div className="p-3 bg-red-500/20 rounded-full group-hover:scale-110 transition-transform text-red-400">
                                    <VideoIcon size={28} />
                                </div>
                                <p className="text-red-400 font-bold text-xs">Vídeo</p>
                            </div>

                            <div 
                                onClick={() => galleryInputRef.current?.click()}
                                className="aspect-square border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-colors group"
                            >
                                <div className="p-3 bg-white/5 rounded-full group-hover:scale-110 transition-transform text-text-secondary">
                                    <ImageIcon size={28} />
                                </div>
                                <p className="text-text-secondary font-medium text-xs">Galería</p>
                            </div>
                            
                            <p className="col-span-3 text-center text-xs text-text-tertiary mt-4">
                                Elige el modo de cámara para asegurar compatibilidad
                            </p>
                        </div>
                    ) : (
                        <div className="relative w-full h-[60vh] rounded-xl overflow-hidden bg-black flex items-center justify-center">
                            {file?.type?.startsWith('video') ? (
                                <video 
                                    ref={previewVideoRef}
                                    src={preview} 
                                    className="max-w-full max-h-full w-auto h-auto outline-none" 
                                    controls playsInline webkit-playsinline="true" preload="auto" muted
                                    onLoadedMetadata={handleVideoLoad}
                                    style={{ filter: isHDR ? 'brightness(1.05) contrast(1.02)' : 'none' }}
                                />
                            ) : (
                                <img 
                                    src={preview} 
                                    alt="Preview" 
                                    className="max-w-full max-h-full w-auto h-auto shadow-sm mx-auto"
                                    style={{ filter: isHDR ? 'brightness(1.05) contrast(1.02)' : 'none' }}
                                />
                            )}
                            <button 
                                onClick={() => { setFile(null); setPreview(null); setIsHDR(false); setCanUseHDR(false); }}
                                className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-red-500/80 transition-colors z-20"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                    
                    <input type="file" accept="image/*,video/*" ref={galleryInputRef} className="hidden" onChange={handleFileChange} onClick={onInputClick} />
                    <input type="file" accept="image/*" capture="environment" ref={cameraPhotoInputRef} className="hidden" onChange={handleFileChange} onClick={onInputClick} />
                    <input type="file" accept="video/*" capture="environment" ref={cameraVideoInputRef} className="hidden" onChange={handleFileChange} onClick={onInputClick} />
                </div>

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
                            <Users size={14} /><span>Solo Amigos</span>
                        </button>

                        <button 
                            onClick={() => setPrivacy('public')}
                            className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-all border
                                ${privacy === 'public' 
                                    ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' 
                                    : 'bg-white/5 text-text-secondary border-white/5 hover:bg-white/10'
                                }`}
                        >
                            <Globe size={14} /><span>Público</span>
                        </button>

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
        className={`flex items-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm whitespace-nowrap transition-all flex-shrink-0 border active:scale-95
        ${isActive
            ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20'
            : 'bg-white/5 text-text-secondary border-transparent hover:bg-white/10 hover:text-text-primary hover:border-white/20'
        }`}
    >
        <Icon size={18} />
        <span>{label}</span>
        {badge > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm ml-1">
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
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [isUploadingStory, setIsUploadingStory] = useState(false);

    // --- Estados para Grupos ---
    const [mySquads, setMySquads] = useState([]);
    const [selectedSquad, setSelectedSquad] = useState(null);
    const [isSquadsLoading, setIsSquadsLoading] = useState(false);
    const [showCreateSquadModal, setShowCreateSquadModal] = useState(false);
    const [showJoinSquadModal, setShowJoinSquadModal] = useState(false);
    const [squadForm, setSquadForm] = useState({ name: '', description: '', invite_code: '' });
    
    const [leaveSquadConfirmation, setLeaveSquadConfirmation] = useState({ isOpen: false, squadId: null });
    const [isLeavingSquad, setIsLeavingSquad] = useState(false);

    const [deleteSquadConfirmation, setDeleteSquadConfirmation] = useState({ isOpen: false, squadId: null });
    const [isDeletingSquad, setIsDeletingSquad] = useState(false);

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
        subscribeToStories,
        subscribeToSocialEvents
    } = useAppStore();

    useEffect(() => {
        fetchFriends();
        fetchFriendRequests();
        fetchLeaderboard();
        fetchStories(); 
        subscribeToStories(); 
        subscribeToSocialEvents(); // Inicializamos el escuchador de Sockets
    }, [fetchFriends, fetchFriendRequests, fetchLeaderboard, fetchStories, subscribeToStories, subscribeToSocialEvents]);

    // Manejo de params
    useEffect(() => {
        const tab = searchParams.get('tab');
        const highlight = searchParams.get('highlight');
        if (tab && ['friends', 'requests', 'search', 'leaderboard', 'squads'].includes(tab)) setActiveTab(tab);
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

    // --- Lógica de Grupos ---
    useEffect(() => {
        if (activeTab === 'squads') {
            loadMySquads();
        }
    }, [activeTab]);

    const loadMySquads = async () => {
        setIsSquadsLoading(true);
        try {
            const data = await socialService.getMySquads();
            setMySquads(data || []);
        } catch (err) {
            showToast('Error al cargar grupos', 'error');
        } finally {
            setIsSquadsLoading(false);
        }
    };

    const loadSquadLeaderboard = async (squadId) => {
        setIsSquadsLoading(true);
        try {
            const data = await socialService.getSquadLeaderboard(squadId);
            setSelectedSquad(data);
        } catch (err) {
            showToast('Error al cargar ranking', 'error');
        } finally {
            setIsSquadsLoading(false);
        }
    };

    const handleCreateSquad = async (e) => {
        e.preventDefault();
        try {
            await socialService.createSquad({ name: squadForm.name, description: squadForm.description });
            showToast('Grupo creado', 'success');
            setShowCreateSquadModal(false);
            setSquadForm({ name: '', description: '', invite_code: '' });
            loadMySquads();
        } catch (err) {
            showToast('Error al crear el grupo', 'error');
        }
    };

    const handleJoinSquad = async (e) => {
        e.preventDefault();
        try {
            await socialService.joinSquad(squadForm.invite_code);
            showToast('Te has unido al grupo', 'success');
            setShowJoinSquadModal(false);
            setSquadForm({ name: '', description: '', invite_code: '' });
            loadMySquads();
        } catch (err) {
            showToast(err.response?.data?.error || 'Error al unirse', 'error');
        }
    };

    const confirmLeaveSquad = async () => {
        if (!leaveSquadConfirmation.squadId) return;
        setIsLeavingSquad(true);
        try {
            await socialService.leaveSquad(leaveSquadConfirmation.squadId);
            showToast('Has abandonado el grupo', 'success');
            setSelectedSquad(null);
            loadMySquads();
        } catch (err) {
            showToast(err.response?.data?.error || 'Error al abandonar el grupo', 'error');
        } finally {
            setIsLeavingSquad(false);
            setLeaveSquadConfirmation({ isOpen: false, squadId: null });
        }
    };

    const confirmDeleteSquad = async () => {
        if (!deleteSquadConfirmation.squadId) return;
        setIsDeletingSquad(true);
        try {
            await socialService.deleteSquad(deleteSquadConfirmation.squadId);
            showToast('Grupo eliminado', 'success');
            setSelectedSquad(null);
            loadMySquads();
        } catch (err) {
            showToast(err.response?.data?.error || 'Error al eliminar el grupo', 'error');
        } finally {
            setIsDeletingSquad(false);
            setDeleteSquadConfirmation({ isOpen: false, squadId: null });
        }
    };

    const copyInviteCode = (code) => {
        navigator.clipboard.writeText(code);
        showToast('Código copiado', 'success');
    };

    // --- Lógica de Historias ---
    const initiateStoryUpload = () => {
        const termsAccepted = localStorage.getItem('story_terms_accepted');
        if (termsAccepted === 'true') {
            setShowUploadModal(true);
        } else {
            setShowTermsModal(true);
        }
    };

    const handleAcceptTerms = () => {
        localStorage.setItem('story_terms_accepted', 'true');
        setShowTermsModal(false);
        setShowUploadModal(true);
    };

    const handleRejectTerms = () => {
        setShowTermsModal(false);
    };

    const handleUploadStory = async (file, privacy, isHDR) => {
        setIsUploadingStory(true);
        try {
            const result = await uploadStory(file, privacy, isHDR);
            if (result && result.success) {
                showToast('Historia subida con éxito', 'success');
                setShowUploadModal(false);
            } else {
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
            initiateStoryUpload();
        }
    };

    const visibleStories = useMemo(() => {
        return stories.filter(storyUser => {
            const isFriend = socialFriends.some(f => f.id === storyUser.userId);
            const hasPublicStories = storyUser.items?.some(item => item.privacy === 'public');
            return isFriend || hasPublicStories;
        });
    }, [stories, socialFriends]);

    const myStoriesUnseen = useMemo(() => {
        return myStories && myStories.some(s => !s.viewed);
    }, [myStories]);

    // --- Acciones de Amigos ---
    const handleSendRequest = async (e, targetUserId) => {
        e.stopPropagation();
        const success = await sendFriendRequest(targetUserId);
        if (success) showToast('Solicitud enviada', 'success');
        else showToast('Error al enviar solicitud', 'error');
    };

    const handleRespond = async (e, requestId, action) => {
        e.stopPropagation();
        await respondFriendRequest(requestId, action);
        // Ahora el toast salta pero la UI ya se actualizó sola y sin "pantalla de carga"
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

    // --- Renderers de Contenido ---
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
            <div className="space-y-4 mx-auto w-full">
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

    const renderSquads = () => {
        if (isSquadsLoading) {
            return <div className="flex justify-center py-10"><Spinner size={30} /></div>;
        }

        if (selectedSquad) {
            const myMembership = selectedSquad.Members?.find(m => m.id === userProfile?.id);
            const amIAdmin = myMembership?.SquadMember?.role === 'admin';

            return (
                <GlassCard className="overflow-hidden [.oled-theme_&]:border-white/10 animate-[fade-in_0.3s_ease-out]">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSelectedSquad(null)} className="p-1 hover:bg-white/10 rounded-full text-text-secondary">
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                    <Shield className="text-accent" size={20} /> {selectedSquad.name}
                                </h3>
                                {selectedSquad.description && <p className="text-xs text-text-tertiary">{selectedSquad.description}</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => copyInviteCode(selectedSquad.invite_code)} 
                                className="text-xs font-bold text-text-primary bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Copy size={14} /> Código
                            </button>
                            {!amIAdmin ? (
                                <button 
                                    onClick={() => setLeaveSquadConfirmation({ isOpen: true, squadId: selectedSquad.id })}
                                    className="text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                    <LogOut size={14} /> Salir
                                </button>
                            ) : (
                                <button 
                                    onClick={() => setDeleteSquadConfirmation({ isOpen: true, squadId: selectedSquad.id })}
                                    className="text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                    <Trash2 size={14} /> Eliminar
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex text-xs text-text-tertiary p-3 border-b border-white/5 uppercase tracking-wider font-bold bg-white/5">
                            <span className="w-10 text-center">#</span><span className="flex-1 pl-2">Miembro</span><span className="w-24 text-right">Racha</span><span className="w-24 text-right">XP</span>
                        </div>
                        {selectedSquad.Members?.map((user, index) => {
                            const isMe = user.id === userProfile?.id;
                            const fixedUser = { ...user, avatar: getFullImageUrl(user.profile_image_url || user.avatar) };

                            return (
                                <div key={user.id} onClick={() => goToProfile(user.id)} className={`flex items-center p-3 border-b border-white/5 last:border-0 cursor-pointer transition-colors hover:bg-white/10 ${isMe ? 'bg-accent/10 border-l-4 border-l-accent pl-2' : ''}`}>
                                    <div className="w-10 flex justify-center font-bold text-text-secondary text-lg">
                                        {index + 1 === 1 ? <Medal size={20} className="text-yellow-400" /> : index + 1 === 2 ? <Medal size={20} className="text-gray-300" /> : index + 1 === 3 ? <Medal size={20} className="text-amber-700" /> : <span className="text-sm opacity-60">#{index + 1}</span>}
                                    </div>
                                    <div className="flex-1 flex items-center gap-3 min-w-0 pl-2">
                                        <UserAvatar user={fixedUser} size={9} className="w-9 h-9" />
                                        <div className="flex flex-col">
                                            <span className={`truncate text-sm ${isMe ? 'text-accent font-bold' : 'text-text-primary font-medium'}`}>{user.username} {isMe && "(Tú)"}</span>
                                            <span className="text-[10px] text-text-tertiary capitalize">{user.SquadMember?.role}</span>
                                        </div>
                                    </div>
                                    <div className="w-24 text-right text-sm text-orange-400 font-bold flex items-center justify-end gap-1">
                                        🔥 {user.streak || 0}
                                    </div>
                                    <div className="w-24 text-right text-sm text-text-primary font-mono font-semibold tracking-tight">{user.xp?.toLocaleString() || 0}</div>
                                </div>
                            );
                        })}
                    </div>
                </GlassCard>
            );
        }

        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={() => setShowCreateSquadModal(true)}
                        className="flex-1 py-3 bg-accent text-white font-bold rounded-xl hover:opacity-90 flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg"
                    >
                        <PlusCircle size={18} className="shrink-0" /> <span className="truncate">Crear Grupo</span>
                    </button>
                    <button 
                        onClick={() => setShowJoinSquadModal(true)}
                        className="flex-1 py-3 bg-white/10 text-text-primary font-bold rounded-xl hover:bg-white/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                        <Hash size={18} className="shrink-0" /> <span className="truncate">Unirse a Grupo</span>
                    </button>
                </div>

                <GlassCard className="[.oled-theme_&]:border-white/10">
                    <h3 className="text-lg font-bold text-text-primary mb-4 px-4 pt-4 border-b border-white/5 pb-2">Mis Grupos</h3>
                    {mySquads.length === 0 ? (
                        <div className="text-center py-12 text-text-tertiary">
                            <Shield size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No perteneces a ningún grupo.</p>
                            <p className="text-xs mt-2">Crea uno o únete para competir con tus amigos.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {mySquads.map((squad) => (
                                <div
                                    key={squad.id}
                                    onClick={() => loadSquadLeaderboard(squad.id)}
                                    className="flex items-center justify-between p-4 border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
                                            <Shield size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-text-primary">{squad.name}</p>
                                            <p className="text-xs text-text-secondary">{squad.description || 'Sin descripción'}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-white/20" />
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>
        );
    };

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

            {leaveSquadConfirmation.isOpen && (
                <ConfirmationModal
                    message="¿Seguro que quieres abandonar este grupo?"
                    onConfirm={confirmLeaveSquad}
                    onCancel={() => setLeaveSquadConfirmation({ isOpen: false, squadId: null })}
                    confirmText="Abandonar"
                    cancelText="Cancelar"
                    isLoading={isLeavingSquad}
                />
            )}

            {deleteSquadConfirmation.isOpen && (
                <ConfirmationModal
                    message="¿Seguro que quieres eliminar este grupo permanentemente? Esta acción no se puede deshacer."
                    onConfirm={confirmDeleteSquad}
                    onCancel={() => setDeleteSquadConfirmation({ isOpen: false, squadId: null })}
                    confirmText="Eliminar Grupo"
                    cancelText="Cancelar"
                    isLoading={isDeletingSquad}
                />
            )}

            {showTermsModal && <StoryTermsModal onAccept={handleAcceptTerms} onReject={handleRejectTerms} />}
            {showUploadModal && <UploadStoryModal onClose={() => setShowUploadModal(false)} onUpload={handleUploadStory} isUploading={isUploadingStory} />}
            {viewingStoryUserId && <StoryViewer userId={viewingStoryUserId} onClose={() => setViewingStoryUserId(null)} />}

            {/* Modal Crear Grupo */}
            {showCreateSquadModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm bg-bg-secondary border border-glass-border rounded-2xl p-6 shadow-2xl relative">
                        <button onClick={() => setShowCreateSquadModal(false)} className="absolute top-4 right-4 p-1 text-text-secondary hover:text-white"><X size={20} /></button>
                        <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2"><Shield className="text-accent"/> Crear Grupo</h3>
                        <form onSubmit={handleCreateSquad} className="space-y-4">
                            <div>
                                <label className="block text-xs text-text-secondary mb-1">Nombre del Grupo</label>
                                <input required type="text" maxLength={50} value={squadForm.name} onChange={e => setSquadForm({...squadForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent transition-colors"/>
                            </div>
                            <div>
                                <label className="block text-xs text-text-secondary mb-1">Descripción (Opcional)</label>
                                <input type="text" maxLength={100} value={squadForm.description} onChange={e => setSquadForm({...squadForm, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent transition-colors"/>
                            </div>
                            <button type="submit" disabled={!squadForm.name.trim()} className="w-full bg-accent text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all mt-4">Crear</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Unirse a Grupo */}
            {showJoinSquadModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm bg-bg-secondary border border-glass-border rounded-2xl p-6 shadow-2xl relative">
                        <button onClick={() => setShowJoinSquadModal(false)} className="absolute top-4 right-4 p-1 text-text-secondary hover:text-white"><X size={20} /></button>
                        <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2"><Hash className="text-accent"/> Unirse a un Grupo</h3>
                        <form onSubmit={handleJoinSquad} className="space-y-4">
                            <div>
                                <label className="block text-xs text-text-secondary mb-1">Código de Invitación</label>
                                <input required type="text" placeholder="Ej: A1B2C3D4" value={squadForm.invite_code} onChange={e => setSquadForm({...squadForm, invite_code: e.target.value.toUpperCase()})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent transition-colors font-mono uppercase tracking-widest text-center"/>
                            </div>
                            <button type="submit" disabled={!squadForm.invite_code.trim()} className="w-full bg-accent text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all mt-4">Unirse</button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Header --- */}
            <header className="mb-6 max-w-3xl mx-auto w-full">
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

            {/* Banner de Estado de Privacidad */}
            <PrivacyBanner 
                privacy={userProfile?.is_public_profile ? 'public' : 'private'} 
                onNavigate={() => setView('settings', { highlight: 'social_privacy' })} 
            />

            {/* --- Carrusel de Historias --- */}
            <section className="mb-8 overflow-x-auto no-scrollbar pb-2 max-w-3xl mx-auto">
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
                        onAdd={initiateStoryUpload}
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

            {/* --- Pestañas Horizontales --- */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6 py-2 px-1 md:justify-center">
                <TabButton id="friends" icon={Users} label="Amigos" isActive={activeTab === 'friends'} onClick={changeTab} />
                <TabButton id="squads" icon={Shield} label="Grupos" isActive={activeTab === 'squads'} onClick={changeTab} />
                <TabButton id="requests" icon={UserPlus} label="Solicitudes" badge={socialRequests?.received?.length || 0} isActive={activeTab === 'requests'} onClick={changeTab} />
                <TabButton id="search" icon={Search} label="Buscar" isActive={activeTab === 'search'} onClick={changeTab} />
                <TabButton id="leaderboard" icon={Trophy} label="Ranking" isActive={activeTab === 'leaderboard'} onClick={changeTab} />
            </div>

            {/* --- Contenido Principal --- */}
            <div className="min-h-[400px] max-w-3xl mx-auto w-full">
                {activeTab === 'friends' && renderFriends()}
                {activeTab === 'squads' && renderSquads()}
                {activeTab === 'requests' && renderRequests()}
                {activeTab === 'search' && renderSearch()}
                {activeTab === 'leaderboard' && renderLeaderboard()}
            </div>
        </div>
    );
}