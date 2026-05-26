/* frontend/src/pages/Social.jsx */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Users, UserPlus, Trophy, Search, UserX, Check, X, Medal,
    ChevronRight, ChevronLeft, Plus, Camera, Image as ImageIcon,
    Globe, Zap, ShieldAlert, Clock, Lock, Video as VideoIcon,
    Settings, Shield, PlusCircle, Hash, Copy, ArrowLeft, LogOut, Trash2,
    Activity
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Camera as CapCamera } from '@capacitor/camera';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import ConfirmationModal from '../components/ConfirmationModal';
import UserAvatar from '../components/UserAvatar';
import StoryViewer from '../components/StoryViewer';
import socialService from '../services/socialService';
import Feed from '../components/Feed';
import PermissionModal from '../components/PermissionModal';
import SocialTourGuide from '../components/SocialTourGuide';

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
        <GlassCard id="social-privacy-banner"
            className={`glass max-w-3xl mx-auto w-full mb-8 rounded-[32px] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 border-none transition-all duration-300 hover:shadow-xl ${isPublic ? 'ring-1 ring-accent/30 bg-accent/5' : 'ring-1 ring-black/5 dark:ring-white/10 bg-black/5 dark:bg-white/5'}`}
        >
            <div className={`p-4 rounded-[24px] text-white shrink-0 shadow-lg ${isPublic ? 'bg-accent shadow-accent/30' : 'bg-gray-500 shadow-gray-500/30'}`}>
                {isPublic ? <Globe size={28} /> : <Lock size={28} />}
            </div>

            <div className="flex-1 min-w-0">
                <h4 className={`text-lg font-bold mb-2 ${isPublic ? 'text-accent' : 'text-text-primary'}`}>
                    {isPublic ? 'Tu perfil es Público' : 'Tu perfil es Privado'}
                </h4>

                <div className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4 space-y-1.5 font-medium">
                    {isPublic ? (
                        <>
                            <p>Actualmente <strong>todo el mundo puede ver tu perfil</strong> y estadísticas.</p>
                            <p className="flex items-center gap-1.5 opacity-90">
                                <Check size={14} className="text-accent shrink-0" />
                                <span>Apareces en el <strong>Ranking Global</strong> y búsquedas.</span>
                            </p>
                        </>
                    ) : (
                        <>
                            <p>Actualmente <strong>solo tus amigos</strong> pueden ver tu actividad.</p>
                            <p className="flex items-center gap-1.5 opacity-90">
                                <X size={14} className="text-red-500 shrink-0" />
                                <span><strong>No apareces</strong> en el Ranking Global ni en búsquedas.</span>
                            </p>
                        </>
                    )}
                </div>

                <button
                    onClick={onNavigate}
                    className="text-sm font-bold bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary px-5 py-2.5 rounded-full transition-colors flex items-center gap-2 w-fit"
                >
                    <Settings size={16} />
                    Cambiar configuración
                </button>
            </div>
        </GlassCard>
    );
};

// --- Subcomponente: Burbuja de Historia ---
const StoryBubble = ({ user, isMe, hasStories, hasUnseen, onClick, onAdd }) => {
    return (
        <div className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group relative">
            <div
                className={`
                    relative p-1 rounded-full transition-all duration-300
                    ${hasStories
                        ? (hasUnseen
                            ? 'ring-2 ring-accent shadow-lg shadow-accent/40 animate-pulse-slow bg-bg-primary'
                            : 'ring-2 ring-black/10 dark:ring-white/20 bg-bg-primary'
                        )
                        : 'ring-2 ring-dashed ring-black/20 dark:ring-white/20 hover:ring-accent bg-bg-primary'
                    }
                `}
                onClick={onClick}
            >
                <div className="p-0.5 bg-bg-primary rounded-full relative z-10">
                    <UserAvatar
                        user={{
                            ...user,
                            profile_image_url: user.profile_image_url || user.avatar
                        }}
                        size={16}
                        className="w-16 h-16 sm:w-18 sm:h-18 transition-transform duration-300 group-hover:scale-105"
                    />
                </div>

                {isMe && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAdd();
                        }}
                        className="absolute bottom-0 right-0 bg-accent text-white rounded-full p-2 border-4 border-bg-primary hover:scale-110 transition-transform shadow-lg shadow-accent/40 z-20"
                    >
                        <Plus size={14} strokeWidth={3} />
                    </button>
                )}
            </div>
            <span className={`text-[11px] sm:text-xs font-bold truncate w-20 text-center mt-1 transition-colors ${hasUnseen ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
                {isMe ? 'Tu historia' : (user.username || 'Usuario').split(' ')[0]}
            </span>
        </div>
    );
};

// --- Subcomponente: Modal de Aviso Legal ---
const StoryTermsModal = ({ onAccept, onReject }) => {
    return (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4 animate-[fade-in_0.2s_ease-out]">
            <div className="absolute inset-0" onClick={onReject} />
            <GlassCard className="glass w-full max-w-md p-6 sm:p-8 relative z-10 animate-[slide-up_0.3s_ease-out] rounded-t-[32px] sm:rounded-[32px] rounded-b-none sm:rounded-b-[32px] shadow-2xl border-none ring-1 ring-black/5 dark:ring-white/10 bg-bg-primary max-h-[90vh] overflow-y-auto custom-scrollbar">

                <div className="text-center">
                    <div className="w-20 h-20 bg-accent/10 rounded-[24px] flex items-center justify-center mx-auto mb-6 text-accent ring-2 ring-accent/30">
                        <ShieldAlert size={36} strokeWidth={1.5} />
                    </div>

                    <h3 className="text-2xl font-bold text-text-primary mb-3">Historias Efímeras</h3>
                    <p className="text-sm text-text-secondary mb-8 leading-relaxed font-medium">
                        Antes de subir tu primera historia, debes conocer cómo funciona este espacio en nuestra comunidad.
                    </p>

                    <div className="space-y-4 text-left mb-8">
                        <div className="flex gap-4 items-start p-4 bg-black/5 dark:bg-white/5 rounded-[20px]">
                            <Clock className="text-blue-500 mt-0.5 shrink-0" size={20} />
                            <div>
                                <h4 className="text-sm font-bold text-text-primary">Duración Limitada</h4>
                                <p className="text-[11px] sm:text-xs text-text-secondary mt-1 font-medium">
                                    Todo el contenido (fotos y vídeos) se elimina automáticamente de nuestros servidores tras <strong>24 horas</strong>.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start p-4 bg-black/5 dark:bg-white/5 rounded-[20px]">
                            <Users className="text-green-500 mt-0.5 shrink-0" size={20} />
                            <div>
                                <h4 className="text-sm font-bold text-text-primary">Tú decides quién lo ve</h4>
                                <p className="text-[11px] sm:text-xs text-text-secondary mt-1 font-medium">
                                    Puedes elegir entre <strong>Público</strong> (toda la comunidad) o <strong>Solo Amigos</strong> antes de publicar.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start p-4 bg-black/5 dark:bg-white/5 rounded-[20px]">
                            <Lock className="text-purple-500 mt-0.5 shrink-0" size={20} />
                            <div>
                                <h4 className="text-sm font-bold text-text-primary">Responsabilidad</h4>
                                <p className="text-[11px] sm:text-xs text-text-secondary mt-1 font-medium">
                                    No subas contenido ofensivo o ilegal. Nos reservamos el derecho de moderación.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onAccept}
                            className="w-full py-4 rounded-[20px] font-bold bg-accent text-white shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all text-sm sm:text-base"
                        >
                            Aceptar y Continuar
                        </button>
                        <button
                            onClick={onReject}
                            className="w-full py-4 rounded-[20px] font-bold text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm sm:text-base"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </GlassCard>
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
    const [showPermissionModal, setShowPermissionModal] = useState(false); 

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

    const onInputClick = async (e, type) => {
        e.target.value = null;

        if (Capacitor.isNativePlatform()) {
            try {
                const status = await CapCamera.checkPermissions();
                const targetPerm = (type === 'camera' || type === 'video') ? status.camera : status.photos;

                if (targetPerm === 'denied') {
                    e.preventDefault();
                    setShowPermissionModal(true);
                } else if (targetPerm === 'prompt' || targetPerm === 'prompt-with-rationale') {
                    e.preventDefault(); 
                    const request = await CapCamera.requestPermissions();
                    const newPerm = (type === 'camera' || type === 'video') ? request.camera : request.photos;
                    
                    if (newPerm === 'denied') {
                        setShowPermissionModal(true);
                    } else if (newPerm === 'granted' || newPerm === 'limited') {
                        setTimeout(() => {
                            if (type === 'camera') cameraPhotoInputRef.current?.click();
                            if (type === 'video') cameraVideoInputRef.current?.click();
                            if (type === 'gallery') galleryInputRef.current?.click();
                        }, 100);
                    }
                }
            } catch (error) {
                console.warn('Error al gestionar permisos:', error);
            }
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4 animate-[fade-in_0.2s_ease-out]">
                <GlassCard className="glass w-full max-w-md p-0 relative z-10 animate-[slide-up_0.3s_ease-out] rounded-t-[32px] sm:rounded-[32px] rounded-b-none sm:rounded-b-[32px] shadow-2xl border-none ring-1 ring-black/5 dark:ring-white/10 flex flex-col max-h-[95vh] sm:max-h-[90vh] bg-bg-primary overflow-hidden">
                    
                    <div className="p-5 sm:p-8 border-b border-black/5 dark:border-white/10 flex justify-between items-center bg-black/5 dark:bg-white/5">
                        <h3 className="text-xl font-bold text-text-primary">Nueva Historia</h3>
                        <button onClick={onClose} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors">
                            <X size={20} className="text-text-secondary" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 sm:p-8 flex flex-col custom-scrollbar">
                        {!preview ? (
                            <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full my-auto">
                                <div
                                    onClick={() => cameraPhotoInputRef.current?.click()}
                                    className="aspect-square ring-2 ring-dashed ring-accent/30 rounded-[24px] bg-black/5 dark:bg-white/5 flex flex-col items-center justify-center gap-2 sm:gap-3 cursor-pointer hover:bg-accent/5 hover:ring-accent/50 transition-all group"
                                >
                                    <div className="p-3 sm:p-4 bg-accent/10 rounded-[16px] sm:rounded-[18px] group-hover:scale-110 transition-transform text-accent">
                                        <Camera size={28} />
                                    </div>
                                    <p className="text-accent font-bold text-xs sm:text-sm">Foto</p>
                                </div>

                                <div
                                    onClick={() => cameraVideoInputRef.current?.click()}
                                    className="aspect-square ring-2 ring-dashed ring-red-500/30 rounded-[24px] bg-black/5 dark:bg-white/5 flex flex-col items-center justify-center gap-2 sm:gap-3 cursor-pointer hover:bg-red-500/5 hover:ring-red-500/50 transition-all group"
                                >
                                    <div className="p-3 sm:p-4 bg-red-500/10 rounded-[16px] sm:rounded-[18px] group-hover:scale-110 transition-transform text-red-500">
                                        <VideoIcon size={28} />
                                    </div>
                                    <p className="text-red-500 font-bold text-xs sm:text-sm">Vídeo</p>
                                </div>

                                <div
                                    onClick={() => galleryInputRef.current?.click()}
                                    className="aspect-square ring-2 ring-dashed ring-black/20 dark:ring-white/20 rounded-[24px] bg-black/5 dark:bg-white/5 flex flex-col items-center justify-center gap-2 sm:gap-3 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-all group"
                                >
                                    <div className="p-3 sm:p-4 bg-black/5 dark:bg-white/5 rounded-[16px] sm:rounded-[18px] group-hover:scale-110 transition-transform text-text-secondary">
                                        <ImageIcon size={28} />
                                    </div>
                                    <p className="text-text-secondary font-bold text-xs sm:text-sm">Galería</p>
                                </div>

                                <p className="col-span-3 text-center text-[11px] sm:text-xs font-medium text-text-tertiary mt-4">
                                    Elige el modo de cámara para asegurar compatibilidad
                                </p>
                            </div>
                        ) : (
                            <div className="relative w-full h-[45vh] sm:h-[55vh] rounded-[24px] overflow-hidden bg-black flex items-center justify-center ring-1 ring-white/10 shadow-inner my-auto">
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
                                    className="absolute top-4 right-4 p-2.5 bg-black/60 backdrop-blur-sm text-white rounded-full hover:bg-red-500 transition-colors z-20"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        )}

                        <input type="file" accept="image/*,video/*" ref={galleryInputRef} className="hidden" onChange={handleFileChange} onClick={(e) => onInputClick(e, 'gallery')} />
                        <input type="file" accept="image/*" capture="environment" ref={cameraPhotoInputRef} className="hidden" onChange={handleFileChange} onClick={(e) => onInputClick(e, 'camera')} />
                        <input type="file" accept="video/*" capture="environment" ref={cameraVideoInputRef} className="hidden" onChange={handleFileChange} onClick={(e) => onInputClick(e, 'video')} />
                    </div>

                    <div className="p-5 sm:p-8 border-t border-black/5 dark:border-white/10 space-y-5 bg-black/5 dark:bg-white/5">
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setPrivacy('friends')}
                                className={`flex-1 py-3 px-3 rounded-[16px] flex items-center justify-center gap-2 text-sm font-bold transition-all border-none ring-1 
                                    ${privacy === 'friends'
                                        ? 'bg-accent text-white ring-accent shadow-lg shadow-accent/20 scale-[1.02]'
                                        : 'bg-black/5 dark:bg-white/5 text-text-secondary ring-black/5 dark:ring-white/10 hover:bg-black/10 dark:hover:bg-white/10'
                                    }`}
                            >
                                <Users size={18} /><span>Amigos</span>
                            </button>

                            <button
                                onClick={() => setPrivacy('public')}
                                className={`flex-1 py-3 px-3 rounded-[16px] flex items-center justify-center gap-2 text-sm font-bold transition-all border-none ring-1 
                                    ${privacy === 'public'
                                        ? 'bg-accent text-white ring-accent shadow-lg shadow-accent/20 scale-[1.02]'
                                        : 'bg-black/5 dark:bg-white/5 text-text-secondary ring-black/5 dark:ring-white/10 hover:bg-black/10 dark:hover:bg-white/10'
                                    }`}
                            >
                                <Globe size={18} /><span>Público</span>
                            </button>

                            {canUseHDR && (
                                <button
                                    onClick={toggleHDR}
                                    className={`flex-initial px-4 py-3 rounded-[16px] flex items-center justify-center gap-2 text-sm font-bold transition-all border-none ring-1
                                        ${isHDR
                                            ? 'bg-accent text-white ring-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)] animate-pulse-slow'
                                            : 'bg-black/5 dark:bg-white/5 text-text-secondary ring-black/5 dark:ring-white/10 opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <Zap size={18} className={isHDR ? "fill-current" : ""} />
                                    HDR {isHDR ? 'ON' : 'OFF'}
                                </button>
                            )}
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!file || isUploading}
                            className="w-full py-4 bg-accent text-white font-bold rounded-[20px] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-accent/20"
                        >
                            {isUploading ? <Spinner size={20} color="#ffffff" /> : 'Compartir Historia'}
                        </button>
                    </div>
                </GlassCard>
            </div>

            <PermissionModal
                isOpen={showPermissionModal}
                onClose={() => setShowPermissionModal(false)}
                permissionName="Galería / Cámara"
            />
        </>
    );
};

// --- Componentes Extraídos ---

const TabButton = ({ id, icon: Icon, label, badge, isActive, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`flex items-center gap-2 py-2.5 px-5 rounded-full font-bold text-sm whitespace-nowrap transition-all duration-300 flex-shrink-0 outline-none
        ${isActive
                ? 'bg-accent text-white shadow-md shadow-accent/30 scale-105'
                : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary'
            }`}
    >
        <Icon size={18} />
        <span>{label}</span>
        {badge > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm ml-1">
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
            className={`flex items-center justify-between p-4 mb-3 rounded-[24px] transition-all duration-300 cursor-pointer group
          ${isHighlighted
                    ? 'bg-accent/10 ring-1 ring-accent/30 shadow-md scale-[1.02]'
                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                }`}
        >
            <div className="flex items-center gap-4">
                <UserAvatar user={fixedUser} size={12} className="w-12 h-12 shadow-sm transition-transform group-hover:scale-105" />

                <div>
                    <p className={`font-bold text-base transition-colors line-clamp-1 ${isHighlighted ? 'text-accent' : 'text-text-primary group-hover:text-accent'}`}>
                        {user.username || user.name || 'Usuario'}
                    </p>
                    <p className="text-xs font-medium text-text-secondary mt-0.5 line-clamp-1">
                        {subtext || `Nivel ${user.level || 1} • ${user.xp || 0} XP`}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
                {action}
                {!action && <ChevronRight size={20} className="text-text-muted group-hover:text-text-primary transition-colors" />}
            </div>
        </div>
    );
};

// --- Input Base Class para Modales ---
const baseInputClasses = 'w-full bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[20px] px-5 py-4 text-text-primary focus:ring-4 focus:ring-accent/20 outline-none transition-all font-medium placeholder:text-text-muted';

export default function Social({ setView }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'feed');

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

    // Carga inicial (sin las historias)
    useEffect(() => {
        fetchFriends();
        fetchFriendRequests();
        fetchLeaderboard();
        subscribeToStories();
        subscribeToSocialEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Carga de historias EXACTAMENTE cuando ya tenemos nuestro ID
    useEffect(() => {
        if (userProfile?.id) {
            fetchStories(userProfile.id);
        }
    }, [userProfile?.id, fetchStories]);

    useEffect(() => {
        const tab = searchParams.get('tab');
        const highlight = searchParams.get('highlight');
        if (tab && ['feed', 'friends', 'requests', 'search', 'leaderboard', 'squads'].includes(tab)) setActiveTab(tab);
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
            <GlassCard className="glass p-6 sm:p-8 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10">
                <h3 className="text-2xl font-extrabold text-text-primary mb-6">Mis Amigos <span className="text-text-muted text-lg font-medium">({socialFriends.length})</span></h3>
                {socialFriends.length === 0 ? (
                    <div className="text-center py-16 bg-black/5 dark:bg-white/5 rounded-[24px]">
                        <Users size={48} className="mx-auto mb-4 text-text-muted opacity-50" />
                        <p className="text-lg font-bold text-text-primary">Aún no tienes amigos agregados</p>
                        <button onClick={() => changeTab('search')} className="mt-4 px-6 py-3 bg-accent/10 text-accent font-bold rounded-full hover:bg-accent/20 transition-colors">Buscar personas</button>
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
                                    <button onClick={(e) => handleRemoveFriend(e, friend.id)} className="p-3 bg-red-500/10 text-red-500 rounded-[14px] hover:bg-red-500 hover:text-white transition-colors z-10" title="Eliminar amigo"><UserX size={18} /></button>
                                }
                            />
                        ))}
                    </div>
                )}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center pt-6 mt-2">
                        <button onClick={() => setFriendsPage(p => Math.max(1, p - 1))} disabled={friendsPage === 1} className="p-3 bg-black/5 dark:bg-white/5 rounded-full text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"><ChevronLeft size={20} /></button>
                        <span className="text-sm font-bold text-text-secondary">Página {friendsPage} de {totalPages}</span>
                        <button onClick={() => setFriendsPage(p => Math.min(totalPages, p + 1))} disabled={friendsPage === totalPages} className="p-3 bg-black/5 dark:bg-white/5 rounded-full text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"><ChevronRight size={20} /></button>
                    </div>
                )}
            </GlassCard>
        );
    };

    const renderRequests = () => {
        const received = socialRequests?.received || [];
        const sent = socialRequests?.sent || [];
        return (
            <div className="space-y-8">
                <GlassCard className="glass p-6 sm:p-8 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10">
                    <h3 className="text-2xl font-extrabold text-text-primary mb-6 flex items-center gap-3">
                        Solicitudes Recibidas {received.length > 0 && <span className="bg-accent text-white text-sm px-3 py-1 rounded-full font-bold shadow-md shadow-accent/20">{received.length}</span>}
                    </h3>
                    {received.length === 0 ? (
                        <div className="text-center py-12 bg-black/5 dark:bg-white/5 rounded-[24px]">
                            <p className="text-text-secondary font-medium">No tienes solicitudes pendientes.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {received.map((req) => (
                                <UserListItem key={req.id} user={req.Requester} onNavigate={goToProfile} subtext="Quiere ser tu amigo" action={
                                    <div className="flex gap-2 z-10">
                                        <button onClick={(e) => handleRespond(e, req.id, 'accept')} className="p-3 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-[14px] transition-colors"><Check size={20} /></button>
                                        <button onClick={(e) => handleRespond(e, req.id, 'reject')} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-[14px] transition-colors"><X size={20} /></button>
                                    </div>
                                } />
                            ))}
                        </div>
                    )}
                </GlassCard>
                {sent.length > 0 && (
                    <GlassCard className="glass p-6 sm:p-8 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10">
                        <h3 className="text-xl font-bold text-text-primary mb-6">Solicitudes Enviadas</h3>
                        <div className="flex flex-col">
                            {sent.map((req) => (
                                <UserListItem key={req.id} user={req.Addressee} onNavigate={goToProfile} subtext="Solicitud pendiente" action={<span className="text-xs font-bold text-text-secondary bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg">Esperando</span>} />
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
            <div className="space-y-6 mx-auto w-full">
                <form onSubmit={handleSearch}>
                    <GlassCard className="glass p-3 rounded-full flex items-center gap-3 focus-within:ring-2 focus-within:ring-accent/50 transition-all border-none ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
                        <Search size={22} className="text-text-muted ml-3 shrink-0" />
                        <input type="text" placeholder="Buscar por nombre de usuario..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-text-primary flex-1 font-medium placeholder:text-text-muted py-2" />
                        <button type="submit" disabled={isSocialLoading} className="bg-accent text-white font-bold px-6 py-3 rounded-full active:scale-95 transition-all shadow-md shadow-accent/20 shrink-0">
                            {isSocialLoading ? <Spinner size={20} color="#fff" /> : 'Buscar'}
                        </button>
                    </GlassCard>
                </form>
                {totalResults > 0 && (
                    <GlassCard className="glass p-6 sm:p-8 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-text-primary">Resultados</h3>
                            <span className="text-sm font-bold text-text-secondary bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full">{totalResults} encontrados</span>
                        </div>
                        <div className="flex flex-col">
                            {paginatedResults.map((user) => {
                                const isMe = user.id === userProfile?.id;
                                const isFriend = socialFriends.some(f => f.id === user.id);
                                const hasSentRequest = socialRequests?.sent?.some(r => r.addressee_id === user.id);
                                return (
                                    <UserListItem key={user.id} user={user} onNavigate={goToProfile} action={
                                        !isMe && !isFriend && !hasSentRequest ? (
                                            <button onClick={(e) => handleSendRequest(e, user.id)} className="p-3 bg-accent/10 text-accent hover:bg-accent hover:text-white rounded-[14px] transition-colors z-10"><UserPlus size={20} /></button>
                                        ) : isFriend ? <span className="text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg">Amigo</span> : hasSentRequest ? <span className="text-xs font-bold text-text-secondary bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg">Enviada</span> : isMe ? <span className="text-xs font-bold text-text-secondary bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg">Tú</span> : null
                                    } />
                                );
                            })}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex justify-between items-center pt-6 mt-2">
                                <button onClick={() => setSearchPage(p => Math.max(1, p - 1))} disabled={searchPage === 1} className="p-3 bg-black/5 dark:bg-white/5 rounded-full text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"><ChevronLeft size={20} /></button>
                                <span className="text-sm font-bold text-text-secondary">Página {searchPage} de {totalPages}</span>
                                <button onClick={() => setSearchPage(p => Math.min(totalPages, p + 1))} disabled={searchPage === totalPages} className="p-3 bg-black/5 dark:bg-white/5 rounded-full text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"><ChevronRight size={20} /></button>
                            </div>
                        )}
                    </GlassCard>
                )}
                {totalResults === 0 && searchQuery && !isSocialLoading && (
                    <div className="text-center py-12 bg-black/5 dark:bg-white/5 rounded-[32px] mt-6">
                        <Search size={40} className="mx-auto mb-4 text-text-muted opacity-50" />
                        <p className="text-lg font-bold text-text-primary">No se encontraron usuarios</p>
                    </div>
                )}
            </div>
        );
    };

    const renderLeaderboard = () => (
        <GlassCard className="glass p-6 sm:p-8 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-extrabold text-text-primary flex items-center gap-3">
                    <div className="p-2.5 bg-yellow-500/10 rounded-[16px] text-yellow-500">
                        <Trophy size={24} />
                    </div>
                    Ranking Global
                </h3>
                <span className="text-xs font-bold text-accent bg-accent/10 px-3 py-1.5 rounded-full uppercase tracking-wider">Top 50</span>
            </div>
            
            <div className="flex flex-col">
                <div className="flex text-xs text-text-muted pb-3 mb-2 uppercase tracking-widest font-bold border-b border-black/5 dark:border-white/10 px-2">
                    <span className="w-10 text-center">#</span><span className="flex-1 pl-2">Atleta</span><span className="w-16 text-right">Nivel</span><span className="w-24 text-right">XP</span>
                </div>
                {socialLeaderboard.map((user, index) => {
                    const isMe = user.id === userProfile?.id;
                    const fixedUser = { ...user, avatar: getFullImageUrl(user.profile_image_url || user.avatar) };

                    return (
                        <div key={user.id} onClick={() => goToProfile(user.id)} className={`flex items-center p-3 rounded-[20px] mb-2 cursor-pointer transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/5 ${isMe ? 'bg-accent/10 ring-1 ring-accent/30 scale-[1.02] shadow-sm my-3' : ''}`}>
                            <div className="w-10 flex justify-center font-black text-text-secondary text-lg shrink-0">
                                {index + 1 === 1 ? <Medal size={24} className="text-yellow-400 drop-shadow-md" /> : index + 1 === 2 ? <Medal size={24} className="text-gray-400 drop-shadow-md" /> : index + 1 === 3 ? <Medal size={24} className="text-amber-700 drop-shadow-md" /> : <span className="text-sm opacity-60">#{index + 1}</span>}
                            </div>
                            <div className="flex-1 flex items-center gap-4 min-w-0 pl-2">
                                <UserAvatar user={fixedUser} size={10} className="w-10 h-10 shadow-sm" />
                                <span className={`truncate text-sm sm:text-base ${isMe ? 'text-accent font-extrabold' : 'text-text-primary font-bold'}`}>{user.username} {isMe && "(Tú)"}</span>
                            </div>
                            <div className="w-16 text-right text-sm text-text-secondary font-bold shrink-0">{user.level}</div>
                            <div className="w-24 text-right text-sm text-text-primary font-mono font-bold tracking-tight shrink-0">{user.xp?.toLocaleString()}</div>
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
                <GlassCard className="glass p-6 sm:p-8 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 overflow-hidden animate-[fade-in_0.3s_ease-out]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSelectedSquad(null)} className="p-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-text-secondary transition-colors shrink-0">
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h3 className="text-2xl font-extrabold text-text-primary flex items-center gap-2">
                                    <Shield className="text-accent" size={24} /> {selectedSquad.name}
                                </h3>
                                {selectedSquad.description && <p className="text-sm text-text-secondary mt-1 font-medium">{selectedSquad.description}</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => copyInviteCode(selectedSquad.invite_code)}
                                className="flex-1 sm:flex-initial text-sm font-bold text-text-primary bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 px-4 py-2.5 rounded-[16px] flex items-center justify-center gap-2 transition-colors"
                            >
                                <Copy size={18} /> Código
                            </button>
                            {!amIAdmin ? (
                                <button
                                    onClick={() => setLeaveSquadConfirmation({ isOpen: true, squadId: selectedSquad.id })}
                                    className="flex-1 sm:flex-initial text-sm font-bold text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white px-4 py-2.5 rounded-[16px] flex items-center justify-center gap-2 transition-colors"
                                >
                                    <LogOut size={18} /> Salir
                                </button>
                            ) : (
                                <button
                                    onClick={() => setDeleteSquadConfirmation({ isOpen: true, squadId: selectedSquad.id })}
                                    className="flex-1 sm:flex-initial text-sm font-bold text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white px-4 py-2.5 rounded-[16px] flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Trash2 size={18} /> Eliminar
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex flex-col">
                        <div className="flex text-xs text-text-muted pb-3 mb-2 uppercase tracking-widest font-bold border-b border-black/5 dark:border-white/10 px-2">
                            <span className="w-10 text-center">#</span><span className="flex-1 pl-2">Miembro</span><span className="w-24 text-right">Racha</span><span className="w-24 text-right">XP</span>
                        </div>
                        {selectedSquad.Members?.map((user, index) => {
                            const isMe = user.id === userProfile?.id;
                            const fixedUser = { ...user, avatar: getFullImageUrl(user.profile_image_url || user.avatar) };

                            return (
                                <div key={user.id} onClick={() => goToProfile(user.id)} className={`flex items-center p-3 rounded-[20px] mb-2 cursor-pointer transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/5 ${isMe ? 'bg-accent/10 ring-1 ring-accent/30 scale-[1.02] shadow-sm my-3' : ''}`}>
                                    <div className="w-10 flex justify-center font-black text-text-secondary text-lg shrink-0">
                                        {index + 1 === 1 ? <Medal size={24} className="text-yellow-400 drop-shadow-md" /> : index + 1 === 2 ? <Medal size={24} className="text-gray-400 drop-shadow-md" /> : index + 1 === 3 ? <Medal size={24} className="text-amber-700 drop-shadow-md" /> : <span className="text-sm opacity-60">#{index + 1}</span>}
                                    </div>
                                    <div className="flex-1 flex items-center gap-4 min-w-0 pl-2">
                                        <UserAvatar user={fixedUser} size={10} className="w-10 h-10 shadow-sm" />
                                        <div className="flex flex-col min-w-0">
                                            <span className={`truncate text-sm sm:text-base ${isMe ? 'text-accent font-extrabold' : 'text-text-primary font-bold'}`}>{user.username} {isMe && "(Tú)"}</span>
                                            <span className="text-[10px] sm:text-xs font-bold text-text-tertiary capitalize mt-0.5 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-md w-fit">{user.SquadMember?.role}</span>
                                        </div>
                                    </div>
                                    <div className="w-24 text-right text-sm sm:text-base text-orange-500 font-extrabold flex items-center justify-end gap-1.5 shrink-0">
                                        🔥 {user.streak || 0}
                                    </div>
                                    <div className="w-24 text-right text-sm sm:text-base text-text-primary font-mono font-bold tracking-tight shrink-0">{user.xp?.toLocaleString() || 0}</div>
                                </div>
                            );
                        })}
                    </div>
                </GlassCard>
            );
        }

        return (
            <div className="space-y-8">
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => setShowCreateSquadModal(true)}
                        className="flex-1 py-4 bg-accent text-white font-bold rounded-[24px] hover:scale-[1.02] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-accent/20"
                    >
                        <PlusCircle size={20} className="shrink-0" /> <span>Crear Grupo</span>
                    </button>
                    <button
                        onClick={() => setShowJoinSquadModal(true)}
                        className="flex-1 py-4 bg-black/5 dark:bg-white/5 text-text-primary font-bold rounded-[24px] hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <Hash size={20} className="shrink-0" /> <span>Unirse a Grupo</span>
                    </button>
                </div>

                <GlassCard className="glass p-6 sm:p-8 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10">
                    <h3 className="text-2xl font-extrabold text-text-primary mb-6">Mis Grupos</h3>
                    {mySquads.length === 0 ? (
                        <div className="text-center py-12 bg-black/5 dark:bg-white/5 rounded-[24px]">
                            <Shield size={48} className="mx-auto mb-4 text-text-muted opacity-50" />
                            <p className="text-lg font-bold text-text-primary">No perteneces a ningún grupo</p>
                            <p className="text-sm font-medium text-text-secondary mt-1">Crea uno o únete para competir con tus amigos.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {mySquads.map((squad) => (
                                <div
                                    key={squad.id}
                                    onClick={() => loadSquadLeaderboard(squad.id)}
                                    className="flex items-center justify-between p-4 rounded-[24px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-14 h-14 bg-accent/10 rounded-[18px] flex items-center justify-center text-accent shrink-0 group-hover:scale-105 transition-transform">
                                            <Shield size={28} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-lg text-text-primary truncate">{squad.name}</p>
                                            <p className="text-sm font-medium text-text-secondary truncate mt-0.5">{squad.description || 'Sin descripción'}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={24} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>
        );
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 pt-6 pb-28 md:pb-8 animate-[fade-in_0.5s_ease-out]">
            <SocialTourGuide />

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
            
            {/* Modal envolvente del Visor de Historias */}
            {viewingStoryUserId && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 animate-[fade-in_0.2s_ease-out]"
                    onClick={() => setViewingStoryUserId(null)}
                >
                    <div onClick={(e) => e.stopPropagation()} className="w-full h-full sm:max-w-md sm:h-[90vh] sm:rounded-[32px] overflow-hidden relative shadow-2xl">
                        <StoryViewer userId={viewingStoryUserId} onClose={() => setViewingStoryUserId(null)} />
                    </div>
                </div>
            )}

            {/* Modal Crear Grupo */}
            {showCreateSquadModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-[fade-in_0.2s_ease-out]">
                    <div className="absolute inset-0" onClick={() => setShowCreateSquadModal(false)} />
                    <GlassCard className="glass w-full max-w-md p-6 sm:p-8 relative z-10 animate-[slide-up_0.3s_ease-out] rounded-[32px] shadow-2xl border-none ring-1 ring-black/5 dark:ring-white/10 bg-bg-primary">
                        <button onClick={() => setShowCreateSquadModal(false)} className="absolute top-6 right-6 p-2 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                        
                        <div className="w-16 h-16 bg-accent/10 rounded-[20px] flex items-center justify-center mb-6 text-accent ring-2 ring-accent/30 mx-auto">
                            <Shield size={32} />
                        </div>
                        
                        <h3 className="text-2xl font-bold text-text-primary mb-6 text-center">Crear Grupo</h3>
                        
                        <form onSubmit={handleCreateSquad} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-2 px-1">Nombre del Grupo</label>
                                <input required type="text" maxLength={50} value={squadForm.name} onChange={e => setSquadForm({ ...squadForm, name: e.target.value })} className={baseInputClasses} placeholder="Escribe el nombre" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-2 px-1">Descripción (Opcional)</label>
                                <input type="text" maxLength={100} value={squadForm.description} onChange={e => setSquadForm({ ...squadForm, description: e.target.value })} className={baseInputClasses} placeholder="¿De qué trata este grupo?" />
                            </div>
                            <button type="submit" disabled={!squadForm.name.trim()} className="w-full bg-accent text-white font-bold py-4 rounded-[20px] hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all mt-4 shadow-lg shadow-accent/20">Crear Grupo</button>
                        </form>
                    </GlassCard>
                </div>
            )}

            {/* Modal Unirse a Grupo */}
            {showJoinSquadModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-[fade-in_0.2s_ease-out]">
                    <div className="absolute inset-0" onClick={() => setShowJoinSquadModal(false)} />
                    <GlassCard className="glass w-full max-w-md p-6 sm:p-8 relative z-10 animate-[slide-up_0.3s_ease-out] rounded-[32px] shadow-2xl border-none ring-1 ring-black/5 dark:ring-white/10 bg-bg-primary">
                        <button onClick={() => setShowJoinSquadModal(false)} className="absolute top-6 right-6 p-2 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                        
                        <div className="w-16 h-16 bg-accent/10 rounded-[20px] flex items-center justify-center mb-6 text-accent ring-2 ring-accent/30 mx-auto">
                            <Hash size={32} />
                        </div>

                        <h3 className="text-2xl font-bold text-text-primary mb-6 text-center">Unirse a un Grupo</h3>
                        
                        <form onSubmit={handleJoinSquad} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-2 px-1">Código de Invitación</label>
                                <input required type="text" placeholder="Ej: A1B2C3D4" value={squadForm.invite_code} onChange={e => setSquadForm({ ...squadForm, invite_code: e.target.value.toUpperCase() })} className={`${baseInputClasses} font-mono uppercase tracking-widest text-center text-lg`} />
                            </div>
                            <button type="submit" disabled={!squadForm.invite_code.trim()} className="w-full bg-accent text-white font-bold py-4 rounded-[20px] hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all mt-4 shadow-lg shadow-accent/20">Unirse</button>
                        </form>
                    </GlassCard>
                </div>
            )}

            {/* --- Header --- */}
            <header className="mb-8 max-w-3xl mx-auto w-full">
                <div className="flex justify-between items-end">
                    <div>
                        <div className="hidden md:flex items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary tracking-tight">
                                Comunidad
                            </h1>
                            <span className="px-3 py-1 rounded-[10px] bg-accent/10 text-accent text-xs font-black tracking-widest uppercase mt-1">
                                BETA
                            </span>
                        </div>
                        <p className="text-text-secondary text-sm sm:text-base font-medium mt-2">Conecta y compite con otros atletas</p>
                    </div>
                </div>
            </header>

            {/* Banner de Estado de Privacidad */}
            <PrivacyBanner
                privacy={userProfile?.is_public_profile ? 'public' : 'private'}
                onNavigate={() => setView('settings', { highlight: 'social_privacy' })}
            />

            {/* --- Carrusel de Historias --- */}
            <section id="social-stories" className="mb-8 overflow-x-auto no-scrollbar pb-4 pt-2 max-w-3xl mx-auto mask-linear-fade">
                <div className="flex items-start gap-4 px-2">
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
            <div id="social-tabs" className="flex overflow-x-auto no-scrollbar gap-2.5 mb-8 py-2 px-1 -mx-1 md:justify-center mask-linear-fade">
                <TabButton id="feed" icon={Activity} label="Muro" isActive={activeTab === 'feed'} onClick={changeTab} />
                <TabButton id="friends" icon={Users} label="Amigos" isActive={activeTab === 'friends'} onClick={changeTab} />
                <TabButton id="squads" icon={Shield} label="Grupos" isActive={activeTab === 'squads'} onClick={changeTab} />
                <TabButton id="requests" icon={UserPlus} label="Solicitudes" badge={socialRequests?.received?.length || 0} isActive={activeTab === 'requests'} onClick={changeTab} />
                <TabButton id="search" icon={Search} label="Buscar" isActive={activeTab === 'search'} onClick={changeTab} />
                <TabButton id="leaderboard" icon={Trophy} label="Ranking" isActive={activeTab === 'leaderboard'} onClick={changeTab} />
            </div>

            {/* --- Contenido Principal --- */}
            <div className="min-h-[400px] max-w-3xl mx-auto w-full">
                {activeTab === 'feed' && <Feed setView={setView} />}
                {activeTab === 'friends' && renderFriends()}
                {activeTab === 'squads' && renderSquads()}
                {activeTab === 'requests' && renderRequests()}
                {activeTab === 'search' && renderSearch()}
                {activeTab === 'leaderboard' && renderLeaderboard()}
            </div>
        </div>
    );
}