/* frontend/src/components/RoutineEditor/PixabayModal.jsx */
import React, { useState, useEffect } from 'react';
import { Search, X, Image as ImageIcon, Loader } from 'lucide-react';

const PixabayModal = ({ isOpen, onClose, onSelectImage }) => {
    const [query, setQuery] = useState('gym motivation');
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Obtener API Key de las variables de entorno
    const PIXABAY_API_KEY = import.meta.env.VITE_PIXABAY_API_KEY;

    const searchImages = async (searchQuery) => {
        if (!searchQuery) return;
        
        if (!PIXABAY_API_KEY) {
            console.error("Falta la API Key de Pixabay en el archivo .env (VITE_PIXABAY_API_KEY)");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(
                `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(searchQuery)}&image_type=photo&per_page=24&safesearch=true&orientation=horizontal`
            );
            const data = await response.json();
            setImages(data.hits || []);
        } catch (error) {
            console.error("Error fetching Pixabay images:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && images.length === 0) {
            searchImages(query);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-bg-secondary border border-glass-border w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                
                {/* Header */}
                <div className="p-4 border-b border-glass-border flex items-center gap-3 bg-bg-secondary/95 backdrop-blur-md sticky top-0 z-10">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && searchImages(query)}
                            placeholder="Buscar en Pixabay (ej: mancuernas, yoga...)"
                            className="w-full bg-bg-primary pl-10 pr-4 py-2.5 rounded-xl border border-glass-border focus:outline-none focus:ring-2 focus:ring-accent text-text-primary placeholder-text-tertiary transition-all"
                            autoFocus
                        />
                    </div>
                    <button 
                        onClick={() => searchImages(query)} 
                        className="bg-accent text-white px-5 py-2.5 rounded-xl font-medium hover:bg-accent/80 transition-colors shadow-lg shadow-accent/20"
                    >
                        Buscar
                    </button>
                    <button 
                        onClick={onClose} 
                        className="p-2.5 hover:bg-white/10 rounded-full transition-colors text-text-secondary"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4 min-h-[300px] bg-bg-primary/30">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-text-tertiary gap-3">
                            <Loader className="animate-spin text-accent" size={40} />
                            <p className="animate-pulse">Cargando imágenes...</p>
                        </div>
                    ) : images.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {images.map((img) => (
                                <button
                                    key={img.id}
                                    onClick={() => onSelectImage(img.webformatURL)}
                                    className="relative aspect-video group overflow-hidden rounded-xl border border-glass-border bg-bg-secondary hover:border-accent hover:shadow-lg hover:shadow-accent/10 transition-all focus:outline-none focus:ring-2 focus:ring-accent"
                                >
                                    <img 
                                        src={img.webformatURL} 
                                        alt={img.tags} 
                                        loading="lazy"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                         <span className="text-[10px] text-white/90 truncate w-full text-left">{img.tags}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-text-tertiary opacity-60">
                            <ImageIcon size={64} className="mb-4" />
                            <p>No se encontraron resultados para "{query}"</p>
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div className="p-2 bg-bg-secondary border-t border-glass-border text-center">
                    <a href="https://pixabay.com/" target="_blank" rel="noreferrer" className="text-[10px] text-text-tertiary hover:text-text-secondary transition-colors flex items-center justify-center gap-1">
                        Powered by <span className="font-bold">Pixabay</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default PixabayModal;