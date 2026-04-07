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

    return (
        <>
            <button
                onClick={onCancel}
                className="flex items-center gap-2 text-text-secondary font-semibold hover:text-text-primary transition mb-4"
            >
                <ChevronLeft size={20} />
                Volver a Rutinas
            </button>

            <h1 className="text-3xl font-bold mb-6 text-center">
                {id ? 'Editar Rutina' : 'Crear Nueva Rutina'}
            </h1>

            {validationError && (
                <div className="bg-red/20 border border-red text-red px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                    <Info size={18} />
                    <span>{validationError}</span>
                </div>
            )}

            <div className="mb-6 bg-bg-secondary rounded-xl p-4 border border-glass-border shadow-sm">
                <label className="block text-sm font-medium text-text-secondary mb-3">
                    Imagen de Portada
                </label>

                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                    <div className="relative w-40 sm:w-48 aspect-video bg-bg-primary rounded-lg overflow-hidden border border-glass-border flex items-center justify-center flex-shrink-0 group shadow-sm">
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
                                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10"
                                    title="Eliminar imagen"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </>
                        ) : (
                            <div className="text-text-tertiary flex flex-col items-center">
                                <ImageIcon size={28} className="mb-2 opacity-50" />
                                <span className="text-xs font-medium">Sin imagen</span>
                            </div>
                        )}
                        {(isUploadingImage || isDownloadingPixabay) && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-20">
                                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 w-full space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleUploadClick}
                                className="flex items-center justify-center sm:justify-start flex-1 sm:flex-none gap-2 px-4 py-2 bg-glass-highlight border border-glass-border rounded-lg hover:bg-glass-heavy hover:border-accent/50 transition-all text-sm font-medium"
                                disabled={isUploadingImage || isDownloadingPixabay}
                            >
                                <Upload size={16} />
                                {isUploadingImage ? 'Subiendo...' : 'Subir foto'}
                            </button>
                            
                            <button
                                onClick={() => setIsPixabayOpen(true)}
                                className="flex items-center justify-center sm:justify-start flex-1 sm:flex-none gap-2 px-4 py-2 bg-glass-highlight border border-glass-border rounded-lg hover:bg-glass-heavy hover:border-accent/50 transition-all text-sm font-medium"
                            >
                                <Search size={16} />
                                Buscar en Pixabay
                            </button>
                            
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        </div>

                        <div className="text-center sm:text-left">
                            <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-2 block">
                                O elige un estilo
                            </span>
                            <div className="flex gap-3 overflow-x-auto p-2 scrollbar-hide justify-start">
                                {PREDEFINED_BACKGROUNDS.map((bg, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setImageUrl(bg)}
                                        className={`relative w-16 h-12 rounded-md overflow-hidden border-2 flex-shrink-0 transition-all ${imageUrl === bg
                                            ? 'border-accent ring-2 ring-accent/30 scale-105'
                                            : 'border-transparent opacity-70 hover:opacity-100 hover:border-glass-border'
                                            }`}
                                    >
                                        <div className="w-full h-full" style={{ background: bg }} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-6 space-y-4">
                <input
                    type="text"
                    placeholder="Nombre de la rutina"
                    value={routineName}
                    onChange={(e) => setRoutineName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-glass-border focus:outline-none focus:ring-2 focus:ring-accent text-lg placeholder-text-tertiary"
                />

                <div className="relative" ref={folderWrapperRef}>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
                            <Folder size={18} />
                        </div>

                        <input
                            type="text"
                            placeholder="Carpeta (Selecciona o escribe una nueva)"
                            value={folder}
                            onChange={(e) => {
                                setFolder(e.target.value);
                                setIsFolderOpen(true);
                            }}
                            onFocus={() => setIsFolderOpen(true)}
                            className="w-full pl-11 pr-10 py-3 rounded-xl bg-bg-secondary border border-glass-border focus:outline-none focus:ring-2 focus:ring-accent placeholder-text-tertiary"
                        />

                        <button
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-accent transition-colors p-1"
                            onClick={() => setIsFolderOpen(!isFolderOpen)}
                            type="button"
                        >
                            <ChevronDown
                                size={18}
                                className={`transition-transform duration-200 ${isFolderOpen ? 'rotate-180' : ''}`}
                            />
                        </button>
                    </div>

                    {isFolderOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-bg-secondary border border-glass-border rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                            {filteredFolders.length > 0 ? (
                                <ul>
                                    {filteredFolders.map((f) => (
                                        <li
                                            key={f}
                                            onClick={() => handleSelectFolder(f)}
                                            className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors text-text-primary"
                                        >
                                            <Folder size={16} className="text-accent" />
                                            <span className="flex-1">{f}</span>
                                            {folder === f && <Check size={16} className="text-accent" />}
                                        </li>
                                    ))}
                                    {folder && !uniqueFolders.includes(folder) && (
                                        <li
                                            onClick={() => handleSelectFolder(folder)}
                                            className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 border-t border-glass-border text-accent font-medium"
                                        >
                                            <Plus size={16} />
                                            <span>Crear nueva: "{folder}"</span>
                                        </li>
                                    )}
                                </ul>
                            ) : (
                                <ul>
                                    {folder ? (
                                        <li
                                            onClick={() => handleSelectFolder(folder)}
                                            className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 text-accent font-medium"
                                        >
                                            <Plus size={16} />
                                            <span>Crear carpeta: "{folder}"</span>
                                        </li>
                                    ) : (
                                        <li className="px-4 py-4 text-center text-text-tertiary text-sm italic">
                                            Escribe para crear una carpeta o selecciona una existente.
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                <textarea
                    placeholder="Descripción (opcional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-glass-border focus:outline-none focus:ring-2 focus:ring-accent placeholder-text-tertiary"
                />
            </div>

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
        <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-[fade-in_0.2s_ease-out]">
            <div className="relative flex-1">
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
            <div className="bg-bg-primary p-4 pb-8 flex justify-between items-center px-8 border-t border-white/10" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
                <button type="button" onClick={onCancel} className="text-text-secondary font-medium px-4 py-2 hover:text-white transition">
                    Cancelar
                </button>
                <button type="button" onClick={() => onComplete(croppedAreaPixels)} className="bg-accent text-bg-secondary font-bold px-6 py-2 rounded-full hover:scale-105 transition">
                    Recortar
                </button>
            </div>
        </div>
    );
};

export default RoutineHeader;