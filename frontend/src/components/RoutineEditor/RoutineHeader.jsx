/* frontend/src/components/RoutineEditor/RoutineHeader.jsx */
import React, { useRef } from 'react';
import { ChevronLeft, Info, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';

// Colores/Degradados predefinidos basados en variables CSS del tema
const PREDEFINED_BACKGROUNDS = [
    'linear-gradient(135deg, var(--color-accent) 0%, var(--bg-primary) 100%)',
    'linear-gradient(to bottom right, var(--bg-secondary), var(--color-accent))',
    'linear-gradient(45deg, #000000 0%, var(--color-accent) 100%)',
    'linear-gradient(to right, var(--glass-highlight), var(--color-accent-transparent))',
    'var(--color-accent)', // Opción sólida
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
    isUploadingImage
}) => {
    const fileInputRef = useRef(null);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && onImageUpload) {
            onImageUpload(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Helper para saber si es un estilo CSS (gradiente/variable) o una URL
    const isCssBackground = (value) => {
        return value && (value.startsWith('linear-gradient') || value.startsWith('var(--'));
    };

    // Helper para resolver la URL completa de la imagen (solo si no es CSS)
    const getDisplayImageUrl = (path) => {
        if (!path || isCssBackground(path)) return null;
        if (path.startsWith('http') || path.startsWith('blob:')) return path;
        if (path.startsWith('/uploads')) return `${API_URL}${path}`;
        return path;
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

            {/* --- SECCIÓN DE IMAGEN DE PORTADA --- */}
            <div className="mb-6 bg-bg-secondary/30 rounded-xl p-4 border border-glass-border">
                <label className="block text-sm font-medium text-text-secondary mb-3">
                    Imagen de Portada
                </label>

                {/* AJUSTE: Centrado en móvil (items-center), alineado inicio en PC (sm:items-start) */}
                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">

                    {/* Previsualización: Ancho controlado (w-40 en móvil, w-48 en PC), evitando que ocupe todo */}
                    <div className="relative w-40 sm:w-48 aspect-video bg-bg-primary rounded-lg overflow-hidden border border-glass-border flex items-center justify-center flex-shrink-0 group shadow-sm">
                        {imageUrl ? (
                            <>
                                {isCssBackground(imageUrl) ? (
                                    <div
                                        className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                                        style={{ background: imageUrl }}
                                    />
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

                    {/* Controles y Galería */}
                    <div className="flex-1 w-full space-y-4">
                        {/* Botón de subida */}
                        <div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center justify-center sm:justify-start w-full sm:w-auto gap-2 px-4 py-2 bg-glass-highlight border border-glass-border rounded-lg hover:bg-glass-heavy hover:border-accent/50 transition-all text-sm font-medium"
                                disabled={isUploadingImage}
                            >
                                <Upload size={16} />
                                {isUploadingImage ? 'Subiendo...' : 'Subir desde Galería'}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>

                        {/* Galería Predefinida */}
                        <div className="text-center sm:text-left">
                            <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-2 block">
                                O elige un estilo
                            </span>
                            {/* CORRECCIÓN: p-2 en lugar de pb-2 para evitar recortes al escalar */}
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

            {/* --- CAMPOS DE TEXTO EXISTENTES --- */}
            <div className="mb-6 space-y-4">
                <input
                    type="text"
                    placeholder="Nombre de la rutina"
                    value={routineName}
                    onChange={(e) => setRoutineName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-glass-border focus:outline-none focus:ring-2 focus:ring-accent text-lg placeholder-text-tertiary"
                />
                <textarea
                    placeholder="Descripción (opcional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-glass-border focus:outline-none focus:ring-2 focus:ring-accent placeholder-text-tertiary"
                />
            </div>
        </>
    );
};

export default RoutineHeader;