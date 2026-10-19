/* frontend/src/components/GymLocationModal.jsx */
import React, { useState, useEffect, useRef } from 'react';
import ModalPortal from './ModalPortal';
import useModalLock from '../hooks/useModalLock';
import { MapPin, Search, X, Navigation, Dumbbell, Trash2, Check, Loader2, Sparkles, Building2 } from 'lucide-react';
import { getCurrentLocation, calculateDistance, formatDistance } from '../utils/gpsUtils';
import { useToast } from '../hooks/useToast';

const GymLocationModal = ({ isOpen, onClose, currentGym, onSave, onRemove }) => {
  useModalLock(isOpen);
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSearchError(null);
      setLocationError(null);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const searchGyms = async (queryText, coords = null) => {
    const q = (queryText || '').trim();
    if (!q && !coords) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      let url = 'https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=10';

      if (q) {
        url += `&q=${encodeURIComponent(q)}`;
      } else {
        url += `&q=gimnasio`;
      }

      const activeCoords = coords || userCoords;
      if (activeCoords?.lat && activeCoords?.lng) {
        const delta = 0.35;
        url += `&viewbox=${activeCoords.lng - delta},${activeCoords.lat + delta},${activeCoords.lng + delta},${activeCoords.lat - delta}&bounded=0`;
      }

      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'es,en',
        }
      });

      if (!res.ok) throw new Error('Error al buscar gimnasios');
      const data = await res.json();

      const formatted = (data || []).map(item => {
        const road = item.address?.road || item.address?.pedestrian || '';
        const houseNumber = item.address?.house_number || '';
        const suburb = item.address?.suburb || item.address?.neighbourhood || '';
        const city = item.address?.city || item.address?.town || item.address?.municipality || item.address?.village || item.address?.county || '';

        const roadPart = road ? (road + (houseNumber ? `, ${houseNumber}` : '')) : '';
        const address = [roadPart, suburb, city].filter(Boolean).join(', ') || item.display_name;

        let distanceMeters = null;
        let distanceFormatted = null;
        if (activeCoords?.lat && activeCoords?.lng && item.lat && item.lon) {
          distanceMeters = calculateDistance(activeCoords.lat, activeCoords.lng, parseFloat(item.lat), parseFloat(item.lon));
          distanceFormatted = formatDistance(distanceMeters);
        }

        const rawName = item.name || item.display_name.split(',')[0];
        const cleanName = rawName.trim();

        return {
          id: item.place_id || `${item.lat}_${item.lon}`,
          name: cleanName,
          address,
          city,
          suburb,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          distanceMeters,
          distanceFormatted,
        };
      });

      if (activeCoords?.lat && activeCoords?.lng) {
        formatted.sort((a, b) => {
          if (a.distanceMeters != null && b.distanceMeters != null) {
            return a.distanceMeters - b.distanceMeters;
          }
          return 0;
        });
      }

      setResults(formatted);
    } catch (err) {
      console.warn('Error buscando gimnasios:', err);
      setSearchError('No se pudo conectar con el buscador de ubicaciones.');
    } finally {
      setIsSearching(false);
    }
  };

  // Búsqueda en tiempo real con debounce
  useEffect(() => {
    if (!isOpen) return;
    if (query.trim().length < 2) {
      if (!userCoords) {
        setResults([]);
      }
      return;
    }

    const timer = setTimeout(() => {
      searchGyms(query, userCoords);
    }, 320);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const handleDetectLocation = async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const loc = await getCurrentLocation();
      setUserCoords(loc);
      await searchGyms(query || 'gimnasio', loc);
      addToast('Ubicación GPS detectada correctamente', 'info');
    } catch (err) {
      console.warn('GPS no disponible:', err);
      setLocationError('No se pudo acceder a tu ubicación actual. Puedes buscarlo por nombre.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSelectGym = (gym) => {
    const gymData = {
      name: gym.name,
      address: gym.address,
      lat: gym.lat || null,
      lng: gym.lng || null,
      distanceFormatted: gym.distanceFormatted || null,
      updatedAt: new Date().toISOString()
    };
    onSave(gymData);
    addToast(`Gimnasio guardado: ${gymData.name}`, 'success');
    onClose();
  };

  const handleSaveCustom = () => {
    if (!query.trim()) return;
    const gymData = {
      name: query.trim(),
      address: userCoords ? 'Ubicación personalizada' : '',
      lat: userCoords?.lat || null,
      lng: userCoords?.lng || null,
      isCustom: true,
      updatedAt: new Date().toISOString()
    };
    onSave(gymData);
    addToast(`Gimnasio guardado: ${gymData.name}`, 'success');
    onClose();
  };

  const handleRemoveCurrent = () => {
    onRemove();
    addToast('Gimnasio desvinculado', 'info');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[200] flex flex-col justify-end sm:justify-center items-center px-0 sm:px-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-[fade-in_0.2s_ease-out]"
          onClick={onClose} 
        />

        {/* Modal Sheet / Card */}
        <div 
          className="relative w-full max-w-lg bg-bg-secondary sm:rounded-[28px] rounded-t-[32px] p-5 sm:p-6 pb-[calc(max(env(safe-area-inset-bottom,0px),20px))] shadow-2xl sm:border border-t border-glass-border overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-[scale-in_0.2s_ease-out]"
        >
          {/* Mobile Drag Indicator */}
          <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

          {/* Header */}
          <div className="flex justify-between items-start mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 shadow-sm">
                <MapPin size={22} className="drop-shadow-sm" />
              </div>
              <div>
                <h3 className="text-xl font-black text-text-primary tracking-tight">
                  Localiza tu Gimnasio
                </h3>
                <p className="text-xs text-text-secondary">
                  Guarda tu gym habitual para tenerlo siempre a mano
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Cerrar modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Gimnasio actual guardado (si existe) */}
          {currentGym && (
            <div className="mb-4 p-3.5 rounded-2xl bg-accent/5 border border-accent/20 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-accent/20 text-accent flex items-center justify-center shrink-0">
                  <Check size={16} strokeWidth={3} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-accent">Gimnasio actual</span>
                  <h4 className="text-sm font-bold text-text-primary truncate">{currentGym.name}</h4>
                  {currentGym.address && (
                    <p className="text-xs text-text-secondary truncate">{currentGym.address}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleRemoveCurrent}
                className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                title="Quitar gimnasio"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}

          {/* Barra de Búsqueda y Botón GPS */}
          <div className="space-y-2.5 mb-4 shrink-0">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 text-text-muted pointer-events-none" size={18} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busca por nombre (ej: Basic-Fit, McFit) o ciudad..."
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-bg-primary border border-glass-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Botón de Ubicación GPS */}
            <button
              onClick={handleDetectLocation}
              disabled={isLocating}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                userCoords
                  ? 'bg-accent/10 border-accent/30 text-accent'
                  : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-text-secondary hover:text-text-primary hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              {isLocating ? (
                <>
                  <Loader2 size={14} className="animate-spin text-accent" />
                  <span>Obteniendo ubicación GPS...</span>
                </>
              ) : (
                <>
                  <Navigation size={14} className={userCoords ? 'text-accent fill-accent/20' : ''} />
                  <span>{userCoords ? 'Ubicación GPS activada (Buscar cerca de mí)' : 'Buscar gimnasios cerca de mi ubicación actual'}</span>
                </>
              )}
            </button>

            {locationError && (
              <p className="text-[11px] text-amber-500 px-1">{locationError}</p>
            )}
          </div>

          {/* Lista de Resultados en tiempo real */}
          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 space-y-2 min-h-[140px]">
            {isSearching && (
              <div className="flex flex-col items-center justify-center py-8 text-text-muted gap-2">
                <Loader2 size={24} className="animate-spin text-accent" />
                <span className="text-xs">Buscando gimnasios en tiempo real...</span>
              </div>
            )}

            {!isSearching && searchError && (
              <div className="p-4 text-center text-xs text-red-400 bg-red-500/10 rounded-2xl border border-red-500/20">
                {searchError}
              </div>
            )}

            {!isSearching && results.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-text-muted px-1">
                  Sugerencias encontradas ({results.length})
                </p>
                {results.map((gym) => (
                  <button
                    key={gym.id}
                    onClick={() => handleSelectGym(gym)}
                    className="w-full text-left p-3 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-accent/10 hover:border-accent/30 border border-transparent transition-all group flex items-center justify-between gap-3 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/10 text-text-secondary group-hover:text-accent group-hover:bg-accent/20 flex items-center justify-center shrink-0 transition-colors">
                        <Dumbbell size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors truncate">
                          {gym.name}
                        </h4>
                        <p className="text-xs text-text-muted truncate">
                          {gym.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {gym.distanceFormatted && (
                        <span className="text-[11px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                          {gym.distanceFormatted}
                        </span>
                      )}
                      <MapPin size={16} className="text-text-muted group-hover:text-accent transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Opción de guardar nombre personalizado si el usuario ha escrito */}
            {query.trim().length >= 2 && (
              <button
                onClick={handleSaveCustom}
                className="w-full mt-2 text-left p-3 rounded-2xl bg-accent/5 hover:bg-accent/15 border border-dashed border-accent/40 transition-all flex items-center gap-3 group active:scale-[0.98]"
              >
                <div className="w-8 h-8 rounded-xl bg-accent/20 text-accent flex items-center justify-center shrink-0">
                  <Sparkles size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Personalizado</span>
                  <h4 className="text-sm font-bold text-text-primary truncate">
                    Usar "{query.trim()}" como mi gimnasio
                  </h4>
                  <p className="text-xs text-text-muted">
                    Guarda este nombre directamente si tu gimnasio no aparece en el mapa
                  </p>
                </div>
                <Check size={16} className="text-accent shrink-0 group-hover:scale-110 transition-transform" />
              </button>
            )}

            {/* Estado vacío inicial */}
            {!isSearching && results.length === 0 && !query && (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-text-muted mb-3">
                  <Building2 size={24} />
                </div>
                <p className="text-sm font-semibold text-text-primary mb-1">
                  Escribe el nombre de tu gimnasio
                </p>
                <p className="text-xs text-text-muted max-w-xs">
                  Te sugeriremos opciones reales en tiempo real con su dirección y distancia según escribas.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default GymLocationModal;
