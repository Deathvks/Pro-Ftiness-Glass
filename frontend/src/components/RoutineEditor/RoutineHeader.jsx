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
import useAppStore from '../../store/useAppStore';
import PixabayModal from './PixabayModal';

// Colores/Degradados predefinidos
const PREDEFINED_BACKGROUNDS = [
    'linear-gradient(135deg, var(--color-accent) 0%, var(--bg-primary) 100%)',
    'linear-gradient(to bottom right, var(--bg-secondary), var(--color-accent))',
    'linear-gradient(45deg, #000000 0%, var(--color-accent) 100%)',
    'linear-gradient(to right, var(--glass-highlight), var(--color-accent-transparent))',
    'var(--color-accent)',
];

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
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    // Obtener carpetas únicas del store
    const routines = useAppStore(state => state.routines);
    const uniqueFolders = useMemo(() => {
        if (!routines) return [];
        const folders = routines.map(r => r.folder).filter(f => f && f.trim() !== '');
        return [...new Set(folders)].sort();
    }, [routines]);

    // Filtrar carpetas según lo que escribe el usuario
    const filteredFolders = useMemo(() => {
        if (!folder) return uniqueFolders;
        return uniqueFolders.filter(f => f.toLowerCase().includes(folder.toLowerCase()));
    }, [uniqueFolders, folder]);

    // Cerrar el dropdown si se hace click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (folderWrapperRef.current && !folderWrapperRef.current.contains(event.target)) {
                setIsFolderOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && onImageUpload) {
            onImageUpload(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const isCssBackground = (value) => {
        return value && (value.startsWith('linear-gradient') || value.startsWith('var(--'));
    };

    const getDisplayImageUrl = (path) => {
        if (!path || isCssBackground(path)) return null;
        if (path.startsWith('http') || path.startsWith('blob:')) return path;
        if (path.startsWith('/uploads')) return `${API_URL}${path}`;
        return path;
    };

    const handleSelectFolder = (selectedFolder) => {
        setFolder(selectedFolder);
        setIsFolderOpen(false);
    };

    const handlePixabaySelect = (url) => {
        setImageUrl(url);
        setIsPixabayOpen(false);
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

            {/* --- SECCIÓN DE IMAGEN --- */}
            <div className="mb-6 bg-bg-secondary rounded-xl p-4 border border-glass-border shadow-sm">
                <label className="block text-sm font-medium text-text-secondary mb-3">
                    Imagen de Portada
                </label>

                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                    {/* Previsualización */}
                    <div className="relative w-40 sm:w-48 aspect-video bg-bg-primary rounded-lg overflow-hidden border border-glass-border flex items-center justify-center flex-shrink-0 group shadow-sm">
                        {imageUrl ? (
                            <>
                                {isCssBackground(imageUrl) ? (
                                    <div className="w-full h-full transition-transform duration-500 group-hover:scale-105" style={{ background: imageUrl }} />
                                ) : (
                                    <img
                                        src={getDisplayImageUrl(imageUrl)}
                                        alt="Portada"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/300x169?text=Error'; }}
                                    />
                                )}
                                <button
                                    onClick={() => setImageUrl(null)}
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
                        {isUploadingImage && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-20">
                                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>

                    {/* Controles Imagen */}
                    <div className="flex-1 w-full space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center justify-center sm:justify-start flex-1 sm:flex-none gap-2 px-4 py-2 bg-glass-highlight border border-glass-border rounded-lg hover:bg-glass-heavy hover:border-accent/50 transition-all text-sm font-medium"
                                disabled={isUploadingImage}
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

            {/* --- CAMPOS DE TEXTO --- */}
            <div className="mb-6 space-y-4">
                <input
                    type="text"
                    placeholder="Nombre de la rutina"
                    value={routineName}
                    onChange={(e) => setRoutineName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-glass-border focus:outline-none focus:ring-2 focus:ring-accent text-lg placeholder-text-tertiary"
                />

                {/* --- CUSTOM SELECT / CREATABLE COMBOBOX PARA CARPETAS --- */}
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

                    {/* DROPDOWN MENU */}
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
                                    {/* Opción de crear si no coincide exactamente */}
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

            {/* Modal de Pixabay */}
            <PixabayModal 
                isOpen={isPixabayOpen} 
                onClose={() => setIsPixabayOpen(false)} 
                onSelectImage={handlePixabaySelect} 
            />
        </>
    );
};

export default RoutineHeader;