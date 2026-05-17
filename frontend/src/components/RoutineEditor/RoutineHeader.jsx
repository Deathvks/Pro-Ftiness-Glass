/* frontend/src/components/RoutineEditor/RoutineHeader.jsx */
import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
    ChevronLeft,
    Info,
    Upload,
    Image as ImageIcon,
    Trash2,
    Folder,
    ChevronDown,
    Plus,
    Check,
    Search
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Camera as CapCamera } from '@capacitor/camera';
import useAppStore from '../../store/useAppStore';
import PixabayModal from './PixabayModal';
import Cropper from 'react-easy-crop';
import PermissionModal from '../PermissionModal';
import GlassCard from '../GlassCard';

const PREDEFINED_BACKGROUNDS = [
    'linear-gradient(135deg, var(--color-accent) 0%, var(--bg-primary) 100%)',
    'linear-gradient(to bottom right, var(--bg-secondary), var(--color-accent))',
    'linear-gradient(45deg, #000000 0%, var(--color-accent) 100%)',
    'linear-gradient(to right, var(--glass-highlight), var(--color-accent-transparent))',
    'var(--color-accent)',
];

// --- Helper para extraer la imagen recortada ---
const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = new Image();
    image.crossOrigin = 'anonymous'; // IMPORTANTE: Para evitar problemas de CORS al recortar imágenes externas
    image.src = imageSrc;
    
    await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = (e) => reject(new Error('Error al cargar la imagen en el canvas'));
    });

    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
        image,
        pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
        0, 0, pixelCrop.width, pixelCrop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((file) => {
            if (file) {
                file.name = 'cropped-cover.jpg';
                resolve(new File([file], 'cover.jpg', { type: 'image/jpeg' }));
            } else {
                reject(new Error('Canvas is empty'));
            }
        }, 'image/jpeg', 0.9);
    });
};

const RoutineHeader = ({
    id,
    onCancel,
    validationError,
    routineName,
    setRoutineName,
    description,
    setDescription,
    imageUrl,
    setImageUrl,
    onImageUpload,
    isUploadingImage,
    folder,
    setFolder
}) => {
    const fileInputRef = useRef(null);
    const folderWrapperRef = useRef(null);
    const [isFolderOpen, setIsFolderOpen] = useState(false);
    const [isPixabayOpen, setIsPixabayOpen] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [isDownloadingPixabay, setIsDownloadingPixabay] = useState(false);
    
    // --- Estado para el Modal de Permisos ---
    const [showPermissionModal, setShowPermissionModal] = useState(false);

    // --- Estados para el Cropper ---
    const [tempImage, setTempImage] = useState(null);
    const [isCropping, setIsCropping] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [imageUrl]);

    const routines = useAppStore(state => state.routines);
    const uniqueFolders = useMemo(() => {
        if (!routines) return [];
        const folders = routines.map(r => r.folder).filter(f => f && f.trim() !== '');
        return [...new Set(folders)].sort();
    }, [routines]);

    const filteredFolders = useMemo(() => {
        if (!folder) return uniqueFolders;
        return uniqueFolders.filter(f => f.toLowerCase().includes(folder.toLowerCase()));
    }, [uniqueFolders, folder]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (folderWrapperRef.current && !folderWrapperRef.current.contains(event.target)) {
                setIsFolderOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Limpiar URLs temporales al desmontar
    useEffect(() => {
        return () => {
            if (tempImage && tempImage.startsWith('blob:')) {
                URL.revokeObjectURL(tempImage);
            }
        };
    }, [tempImage]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setTempImage(URL.createObjectURL(file));
            setIsCropping(true);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleUploadClick = async () => {
        if (Capacitor.isNativePlatform()) {
            try {
                const status = await CapCamera.requestPermissions();
                if (status.photos === 'denied' && status.camera === 'denied') {
                    setShowPermissionModal(true);
                    return;
                }
            } catch (error) {
                console.warn('Error al solicitar permisos:', error);
                setShowPermissionModal(true);
                return;
            }
        }
        fileInputRef.current?.click();
    };

    const handlePixabaySelect = async (url) => {
        setIsPixabayOpen(false);
        setIsDownloadingPixabay(true);
        try {
            // Descargamos la imagen de Pixabay como Blob localmente.
            // Esto la pasa al cropper y luego se envía al backend para persistencia
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            setTempImage(blobUrl);
            setIsCropping(true);
        } catch (error) {
            console.error("Error al descargar imagen de Pixabay:", error);
            // Fallback: usar la URL directa
            setTempImage(url);
            setIsCropping(true);
        } finally {
            setIsDownloadingPixabay(false);
        }
    };

    const handleCropComplete = async (croppedAreaPixels) => {
        try {
            const croppedFile = await getCroppedImg(tempImage, croppedAreaPixels);
            if (onImageUpload) onImageUpload(croppedFile);
            setIsCropping(false);
            setTempImage(null);
        } catch (e) {
            console.error("Error al procesar la imagen:", e);
        }
    };

    const isCssBackground = (value) => value && (value.startsWith('linear-gradient') || value.startsWith('var(--'));

    const getDisplayImageUrl = (path) => {
        if (!path || isCssBackground(path)) return null;
        if (path.startsWith('blob:')) return path;

        let cleanPath = path.replace(/http:\/\/localhost:\d+/g, '');
        if (cleanPath.startsWith('http')) return cleanPath;
        
        const API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
        let base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
        
        if (base.endsWith('/api')) {
            base = base.slice(0, -4);
        }

        if (cleanPath.startsWith('/uploads') || cleanPath.startsWith('/images')) {
            return `${base}${cleanPath}`;
        }
        return cleanPath;
    };

    const handleSelectFolder = (selectedFolder) => {
        setFolder(selectedFolder);
        setIsFolderOpen(false);
    };

    const inputClasses = "w-full bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[20px] px-5 py-4 text-text-primary focus:ring-2 focus:ring-accent/50 outline-none transition-all font-bold placeholder:text-text-muted";

    return (
        <>
            <button
                onClick={onCancel}
                className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-text-secondary font-bold hover:text-text-primary transition-colors mb-6 w-fit"
            >
                <ChevronLeft size={20} />
                Volver a Rutinas
            </button>

            <h1 className="text-3xl md:text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary tracking-tight md:text-left text-center">
                {id ? 'Editar Rutina' : 'Crear Nueva Rutina'}
            </h1>

            {validationError && (
                <div className="bg-red-500/10 ring-1 ring-red-500/20 text-red-500 px-5 py-4 rounded-[20px] mb-8 flex items-center gap-3 font-bold animate-[fade-in_0.3s_ease-out]">
                    <Info size={20} className="shrink-0" />
                    <span>{validationError}</span>
                </div>
            )}

            <GlassCard className="glass p-6 sm:p-8 rounded-[32px] shadow-xl border-none ring-1 ring-black/5 dark:ring-white/10 mb-8 transition-all duration-300">
                <label className="block text-sm font-bold text-text-secondary mb-4 px-1">
                    Imagen de Portada
                </label>

                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start w-full">
                    <div className="relative w-full max-w-[240px] md:w-48 aspect-video bg-black/5 dark:bg-white/5 rounded-[24px] overflow-hidden ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center flex-shrink-0 group shadow-md">
                        {imageUrl && !imgError ? (
                            <>
                                {isCssBackground(imageUrl) ? (
                                    <div className="w-full h-full transition-transform duration-500 group-hover:scale-105" style={{ background: imageUrl }} />
                                ) : (
                                    <img
                                        src={getDisplayImageUrl(imageUrl)}
                                        alt="Portada"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={() => setImgError(true)}
                                    />
                                )}
                                <button
                                    onClick={() => { setImageUrl(null); setImgError(false); }}
                                    className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-sm text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10"
                                    title="Eliminar imagen"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </>
                        ) : (
                            <div className="text-text-tertiary flex flex-col items-center">
                                <ImageIcon size={32} className="mb-2 opacity-50" />
                                <span className="text-sm font-bold">Sin imagen</span>
                            </div>
                        )}
                        {(isUploadingImage || isDownloadingPixabay) && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-20">
                                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0 w-full space-y-5">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleUploadClick}
                                className="flex items-center justify-center sm:justify-start flex-1 sm:flex-none gap-2 px-5 py-3 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[16px] hover:bg-black/10 dark:hover:bg-white/10 transition-all text-sm font-bold text-text-primary active:scale-95"
                                disabled={isUploadingImage || isDownloadingPixabay}
                            >
                                <Upload size={18} />
                                {isUploadingImage ? 'Subiendo...' : 'Subir foto'}
                            </button>
                            
                            <button
                                onClick={() => setIsPixabayOpen(true)}
                                className="flex items-center justify-center sm:justify-start flex-1 sm:flex-none gap-2 px-5 py-3 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[16px] hover:bg-black/10 dark:hover:bg-white/10 transition-all text-sm font-bold text-text-primary active:scale-95"
                            >
                                <Search size={18} />
                                Buscar en Pixabay
                            </button>
                            
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        </div>

                        <div className="text-center sm:text-left pt-2 w-full">
                            <span className="text-[10px] sm:text-xs text-text-tertiary uppercase tracking-widest font-bold mb-3 block px-1">
                                O elige un estilo de color
                            </span>
                            {/* CAMBIADO: Reemplazado overflow-x-auto por flex-wrap para evitar el problema de scroll en PC */}
                            <div className="flex flex-wrap gap-3 py-2 justify-center sm:justify-start px-1 w-full">
                                {PREDEFINED_BACKGROUNDS.map((bg, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setImageUrl(bg)}
                                        className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded-[16px] overflow-hidden ring-2 flex-shrink-0 transition-all border-none ${imageUrl === bg
                                            ? 'ring-accent shadow-md shadow-accent/30 scale-105 opacity-100'
                                            : 'ring-transparent opacity-60 hover:opacity-100 hover:ring-black/10 dark:hover:ring-white/20'
                                            }`}
                                    >
                                        <div className="w-full h-full" style={{ background: bg }} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </GlassCard>

            <GlassCard className="glass p-6 sm:p-8 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 space-y-6 mb-8">
                <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2 px-1">Nombre de la rutina</label>
                    <input
                        type="text"
                        placeholder="Ej: Pierna y Glúteo"
                        value={routineName}
                        onChange={(e) => setRoutineName(e.target.value)}
                        className={inputClasses}
                    />
                </div>

                <div className="relative" ref={folderWrapperRef}>
                    <label className="block text-sm font-bold text-text-secondary mb-2 px-1">Carpeta</label>
                    <div className="relative">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                            <Folder size={20} />
                        </div>

                        <input
                            type="text"
                            placeholder="Selecciona o escribe una nueva"
                            value={folder}
                            onChange={(e) => {
                                setFolder(e.target.value);
                                setIsFolderOpen(true);
                            }}
                            onFocus={() => setIsFolderOpen(true)}
                            className={`${inputClasses} pl-12 pr-12`}
                        />

                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors p-1"
                            onClick={() => setIsFolderOpen(!isFolderOpen)}
                            type="button"
                        >
                            <ChevronDown
                                size={20}
                                className={`transition-transform duration-300 ${isFolderOpen ? 'rotate-180' : ''}`}
                            />
                        </button>
                    </div>

                    {isFolderOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 rounded-[24px] shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                            {filteredFolders.length > 0 ? (
                                <ul className="py-2">
                                    {filteredFolders.map((f) => (
                                        <li
                                            key={f}
                                            onClick={() => handleSelectFolder(f)}
                                            className="px-6 py-3.5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors font-bold text-text-primary"
                                        >
                                            <Folder size={18} className="text-accent" />
                                            <span className="flex-1">{f}</span>
                                            {folder === f && <Check size={18} className="text-accent" />}
                                        </li>
                                    ))}
                                    {folder && !uniqueFolders.includes(folder) && (
                                        <li
                                            onClick={() => handleSelectFolder(folder)}
                                            className="px-6 py-3.5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex items-center gap-3 border-t border-black/5 dark:border-white/10 text-accent font-bold mt-2"
                                        >
                                            <Plus size={18} />
                                            <span>Crear nueva: "{folder}"</span>
                                        </li>
                                    )}
                                </ul>
                            ) : (
                                <ul className="py-2">
                                    {folder ? (
                                        <li
                                            onClick={() => handleSelectFolder(folder)}
                                            className="px-6 py-3.5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex items-center gap-3 text-accent font-bold"
                                        >
                                            <Plus size={18} />
                                            <span>Crear carpeta: "{folder}"</span>
                                        </li>
                                    ) : (
                                        <li className="px-6 py-6 text-center text-text-tertiary text-sm font-medium">
                                            Escribe para crear una carpeta o selecciona una existente.
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2 px-1">Descripción (opcional)</label>
                    <textarea
                        placeholder="Añade detalles sobre la rutina..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className={`${inputClasses} resize-none`}
                    />
                </div>
            </GlassCard>

            {/* --- MODAL DE RECORTE DE IMAGEN --- */}
            {isCropping && tempImage && (
                <ImageCropModal
                    imageSrc={tempImage}
                    onComplete={handleCropComplete}
                    onCancel={() => {
                        setIsCropping(false);
                        setTempImage(null);
                    }}
                />
            )}

            <PixabayModal 
                isOpen={isPixabayOpen} 
                onClose={() => setIsPixabayOpen(false)} 
                onSelectImage={handlePixabaySelect} 
            />

            <PermissionModal 
                isOpen={showPermissionModal} 
                onClose={() => setShowPermissionModal(false)} 
                permissionName="Galería / Cámara" 
            />
        </>
    );
};

// --- Componente: Modal de Recorte (Aspecto 16:9) ---
const ImageCropModal = ({ imageSrc, onComplete, onCancel }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-bg-primary flex flex-col animate-[fade-in_0.2s_ease-out]">
            <div className="relative flex-1 bg-black/90">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={16 / 9} 
                    cropShape="rect"
                    showGrid={true}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                />
            </div>
            <div className="bg-bg-secondary p-5 pb-8 flex justify-between items-center px-6 sm:px-10 border-t border-glass-border/50" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
                <button type="button" onClick={onCancel} className="text-text-secondary font-bold px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                    Cancelar
                </button>
                <button type="button" onClick={() => onComplete(croppedAreaPixels)} className="bg-accent text-white font-bold px-8 py-3 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20">
                    Recortar
                </button>
            </div>
        </div>
    );
};

export default RoutineHeader;