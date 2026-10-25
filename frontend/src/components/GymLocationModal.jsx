/* frontend/src/components/GymLocationModal.jsx */
import React, { useState, useEffect, useRef } from 'react';
import ModalPortal from './ModalPortal';
import ConfirmationModal from './ConfirmationModal';
import useModalLock from '../hooks/useModalLock';
import { MapPin, Search, X, Navigation, Dumbbell, Trash2, Check, Loader2, Sparkles, Building2, BadgeCheck } from 'lucide-react';
import { getCurrentLocation, calculateDistance, formatDistance } from '../utils/gpsUtils';
import { enrichGymWithMedia } from '../utils/gymMedia';
import { SpainTerritoryBadge } from './Flags';
import { useToast } from '../hooks/useToast';
import { searchLocalGyms, cleanSearchTokens, normalizeGymText } from '../utils/spainGymsData';

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
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

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
    if (!q && !coords) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    const activeCoords = coords || userCoords;

    try {
      // 1. Búsqueda instantánea en el catálogo verificado de España
      // Resuelve al instante búsquedas populares como "un go fit en las canteras", "macrofit", "crossfit canteras", etc.
      const localMatches = q ? searchLocalGyms(q, activeCoords) : [];

      // Si no hay texto pero hay GPS (ej: pulsó "Detectar mi ubicación"), buscar los gimnasios verificados más cercanos
      let localNearby = [];
      if (!q && activeCoords?.lat && activeCoords?.lng) {
        localNearby = searchLocalGyms('gimnasio', activeCoords).slice(0, 10);
      }

      // 2. Consulta en paralelo a Photon (OpenStreetMap Elasticsearch) y Nominatim (OpenStreetMap España)
      const { cleanedQueryString } = cleanSearchTokens(q);
      const searchTarget = cleanedQueryString || q || 'gimnasio';

      const externalPromises = [];

      // A) Photon: motor OpenStreetMap elástico, ultrarrápido y tolerante a fallos/errores ortográficos
      const photonUrl = new URL('https://photon.komoot.io/api/');
      photonUrl.searchParams.set('q', searchTarget);
      photonUrl.searchParams.set('limit', '15');
      // Acotar estrictamente a España (+ Islas Canarias + Baleares + Ceuta y Melilla)
      photonUrl.searchParams.set('bbox', '-18.5,27.5,4.5,43.9');
      if (activeCoords?.lat && activeCoords?.lng) {
        photonUrl.searchParams.set('lat', activeCoords.lat);
        photonUrl.searchParams.set('lon', activeCoords.lng);
      }

      externalPromises.push(
        fetch(photonUrl.toString())
          .then(res => (res.ok ? res.json() : null))
          .then(data => {
            if (!data?.features) return [];
            return data.features
              .filter(f => {
                const p = f.properties || {};
                const osmVal = (p.osm_value || '').toLowerCase();
                const osmKey = (p.osm_key || '').toLowerCase();
                const name = (p.name || '').toLowerCase();
                const isGymTag =
                  ['fitness_centre', 'sports_centre', 'gym', 'sports'].includes(osmVal) ||
                  ['fitness_centre', 'sports_centre'].includes(osmKey) ||
                  osmKey === 'leisure';
                const hasGymWord = /fit|gym|crossfit|deport|club|box|entrena|pilates|padel/i.test(name);
                return isGymTag || hasGymWord;
              })
              .map(item => {
                const p = item.properties || {};
                const coordsArr = item.geometry?.coordinates || [];
                const lng = coordsArr[0];
                const lat = coordsArr[1];
                if (!lat || !lng) return null;

                const street = p.street ? p.street + (p.housenumber ? `, ${p.housenumber}` : '') : '';
                const suburb = p.district || p.suburb || p.neighbourhood || '';
                const city = p.city || p.town || p.state || '';
                const address =
                  [street, suburb, city].filter(Boolean).join(', ') ||
                  [suburb, city].filter(Boolean).join(', ') ||
                  'España';

                let distanceMeters = null;
                let distanceFormatted = null;
                if (activeCoords?.lat && activeCoords?.lng) {
                  distanceMeters = calculateDistance(activeCoords.lat, activeCoords.lng, lat, lng);
                  distanceFormatted = formatDistance(distanceMeters);
                }

                return {
                  id: `osm_photon_${p.osm_id || `${lat}_${lng}`}`,
                  name: (p.name || 'Gimnasio').trim(),
                  address,
                  city: p.city || city,
                  suburb: p.district || suburb,
                  lat,
                  lng,
                  distanceMeters,
                  distanceFormatted,
                  isVerified: false
                };
              })
              .filter(Boolean);
          })
          .catch(() => [])
      );

      // B) Nominatim: geocodificador oficial de OpenStreetMap España
      let nomUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=es&limit=8&q=${encodeURIComponent(searchTarget)}`;
      if (activeCoords?.lat && activeCoords?.lng) {
        const delta = 0.45;
        nomUrl += `&viewbox=${activeCoords.lng - delta},${activeCoords.lat + delta},${activeCoords.lng + delta},${activeCoords.lat - delta}&bounded=0`;
      }

      externalPromises.push(
        fetch(nomUrl, {
          headers: {
            'Accept-Language': 'es,ca,gl,eu,en',
            'User-Agent': 'ProFitnessGlass/7.10.10 (support@profitnessglass.com)'
          }
        })
          .then(res => (res.ok ? res.json() : null))
          .then(data => {
            if (!Array.isArray(data)) return [];
            return data.map(item => {
              const road = item.address?.road || item.address?.pedestrian || '';
              const houseNumber = item.address?.house_number || '';
              const suburb = item.address?.suburb || item.address?.neighbourhood || '';
              const city = item.address?.city || item.address?.town || item.address?.municipality || item.address?.village || item.address?.county || '';
              const roadPart = road ? road + (houseNumber ? `, ${houseNumber}` : '') : '';
              const address = [roadPart, suburb, city].filter(Boolean).join(', ') || item.display_name;

              const lat = parseFloat(item.lat);
              const lng = parseFloat(item.lon);
              let distanceMeters = null;
              let distanceFormatted = null;
              if (activeCoords?.lat && activeCoords?.lng && lat && lng) {
                distanceMeters = calculateDistance(activeCoords.lat, activeCoords.lng, lat, lng);
                distanceFormatted = formatDistance(distanceMeters);
              }

              const rawName = item.name || item.display_name.split(',')[0];
              return {
                id: `osm_nom_${item.place_id || `${lat}_${lng}`}`,
                name: rawName.trim(),
                address,
                city,
                suburb,
                lat,
                lng,
                distanceMeters,
                distanceFormatted,
                isVerified: false
              };
            });
          })
          .catch(() => [])
      );

      const [photonResults, nominatimResults] = await Promise.all(externalPromises);

      // 3. Fusión inteligente y desduplicación geográfica
      const combined = [...localMatches, ...localNearby, ...photonResults, ...nominatimResults];
      const seenKeys = new Set();
      const uniqueResults = [];

      for (const item of combined) {
        if (!item || !item.name) continue;
        const normName = normalizeGymText(item.name);
        // Desduplicamos por coincidencia de nombre y proximidad de coordenadas (< 200m)
        const coordKey =
          item.lat && item.lng
            ? `${normName}_${item.lat.toFixed(3)}_${item.lng.toFixed(3)}`
            : `${normName}_${item.city || ''}`;

        if (!seenKeys.has(coordKey)) {
          seenKeys.add(coordKey);
          uniqueResults.push(enrichGymWithMedia(item));
        }
      }

      // Si el usuario buscó por ubicación GPS o tiene coordenadas, ordenar por distancia
      // priorizando las coincidencias verificadas locales de alta relevancia
      if (activeCoords?.lat && activeCoords?.lng) {
        uniqueResults.sort((a, b) => {
          if (a.isVerified && !b.isVerified && (a.matchScore || 0) >= 100) return -1;
          if (b.isVerified && !a.isVerified && (b.matchScore || 0) >= 100) return 1;
          if (a.distanceMeters != null && b.distanceMeters != null) {
            return a.distanceMeters - b.distanceMeters;
          }
          return 0;
        });
      }

      setResults(uniqueResults);
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
    }, 250);

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
    const gymData = enrichGymWithMedia({
      name: gym.name,
      address: gym.address,
      lat: gym.lat || null,
      lng: gym.lng || null,
      distanceFormatted: gym.distanceFormatted || null,
      image: gym.image || null,
      logo: gym.logo || null,
      brand: gym.brand || null,
      brandColor: gym.brandColor || null,
      isVerified: gym.isVerified || false,
      updatedAt: new Date().toISOString()
    });
    onSave(gymData);
    addToast(`Gimnasio guardado: ${gymData.name}`, 'success');
    onClose();
  };

  const handleSaveCustom = () => {
    if (!query.trim()) return;
    const gymData = enrichGymWithMedia({
      name: query.trim(),
      address: userCoords ? 'Ubicación personalizada' : '',
      lat: userCoords?.lat || null,
      lng: userCoords?.lng || null,
      isCustom: true,
      updatedAt: new Date().toISOString()
    });
    onSave(gymData);
    addToast(`Gimnasio guardado: ${gymData.name}`, 'success');
    onClose();
  };

  const handleConfirmRemove = () => {
    setShowConfirmRemove(false);
    onRemove();
    addToast('Gimnasio desvinculado correctamente', 'info');
    onClose();
  };

  const activeGym = currentGym ? enrichGymWithMedia(currentGym) : null;

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
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-black text-text-primary tracking-tight">
                    Localiza tu Gimnasio
                  </h3>
                  <SpainTerritoryBadge />
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  Búsqueda en toda España (+3.100 gimnasios en todas las provincias, Canarias y Baleares)
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

          {/* Gimnasio actual guardado (con foto de club y logo oficial) */}
          {activeGym && (
            <div className="mb-4 relative rounded-2xl overflow-hidden shadow-lg group shrink-0">
              {/* Imagen de fondo del club con gradiente */}
              <div className="absolute inset-0">
                <img
                  src={activeGym.image}
                  alt={activeGym.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/55 backdrop-blur-[0.5px]" />
              </div>

              {/* Contenido sobre la imagen */}
              <div className="relative p-3.5 flex items-center justify-between gap-3 text-white">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md p-1 flex items-center justify-center shrink-0 shadow-md overflow-hidden">
                    {activeGym.logo ? (
                      <img
                        src={activeGym.logo}
                        alt={activeGym.brand || 'Logo'}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextElementSibling) {
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div
                      style={{ display: activeGym.logo ? 'none' : 'flex' }}
                      className="w-full h-full items-center justify-center text-accent"
                    >
                      <Dumbbell size={20} />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider text-accent bg-accent/20 px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <Check size={11} strokeWidth={3} />
                        Gimnasio habitual
                      </span>
                      {activeGym.distanceFormatted && (
                        <span className="text-[10px] font-bold text-white/90 bg-white/15 px-2 py-0.5 rounded-full">
                          {activeGym.distanceFormatted}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white drop-shadow-sm mt-1 leading-snug break-words">
                      {activeGym.name}
                    </h4>
                    {activeGym.address && (
                      <p className="text-xs text-white/80 drop-shadow-sm mt-0.5 leading-snug break-words line-clamp-2">
                        {activeGym.address}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowConfirmRemove(true)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-red-500/80 active:scale-95 text-white/80 hover:text-white transition-all shrink-0 shadow-sm cursor-pointer"
                  title="Desvincular gimnasio habitual"
                  aria-label="Desvincular gimnasio habitual"
                >
                  <Trash2 size={16} />
                </button>
              </div>
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
                placeholder="Busca por nombre (ej: GO fit Las Canteras, MacroFit, Fitness Park)..."
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
                <span className="text-xs">Buscando gimnasios en tiempo real en España, Canarias y Baleares...</span>
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
                    className="w-full text-left p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-accent/10 hover:border-accent/30 border border-transparent transition-all group flex items-center justify-between gap-3 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Thumbnail con imagen real del gimnasio y badge de logo */}
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-black/10 dark:bg-white/10 border border-black/5 dark:border-white/10 shadow-sm">
                        <img
                          src={gym.image}
                          alt={gym.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }
                          }}
                        />
                        <div
                          style={{ display: 'none' }}
                          className="w-full h-full items-center justify-center text-text-secondary bg-black/5 dark:bg-white/5"
                        >
                          <Dumbbell size={18} />
                        </div>

                        {gym.logo && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-md p-0.5 bg-bg-primary shadow border border-glass-border flex items-center justify-center overflow-hidden">
                            <img
                              src={gym.logo}
                              alt=""
                              className="w-full h-full object-contain"
                              onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors truncate">
                            {gym.name}
                          </h4>
                          {gym.isVerified && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-accent bg-accent/15 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                              <BadgeCheck size={10} strokeWidth={2.5} />
                              Verificado
                            </span>
                          )}
                          {activeGym && (activeGym.id === gym.id || activeGym.name?.toLowerCase() === gym.name?.toLowerCase()) && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-accent bg-accent/20 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                              <Check size={10} strokeWidth={3} />
                              Habitual
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted truncate mt-0.5">
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
            {query.trim().length >= 2 && (() => {
              const customPreview = enrichGymWithMedia(query.trim());
              return (
                <button
                  onClick={handleSaveCustom}
                  className="w-full mt-2 text-left p-2.5 rounded-2xl bg-accent/5 hover:bg-accent/15 border border-dashed border-accent/40 transition-all flex items-center gap-3 group active:scale-[0.98]"
                >
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-accent/20 border border-accent/30 shadow-sm">
                    <img
                      src={customPreview.image}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {customPreview.logo && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-md p-0.5 bg-bg-primary shadow border border-glass-border flex items-center justify-center overflow-hidden">
                        <img src={customPreview.logo} alt="" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent flex items-center gap-1">
                      <Sparkles size={11} />
                      Personalizado
                    </span>
                    <h4 className="text-sm font-bold text-text-primary truncate">
                      Usar "{query.trim()}" como mi gimnasio
                    </h4>
                    <p className="text-xs text-text-muted">
                      Guarda este nombre directamente con su foto e icono
                    </p>
                  </div>
                  <Check size={16} className="text-accent shrink-0 group-hover:scale-110 transition-transform" />
                </button>
              );
            })()}

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
                  Catálogo nacional con más de 3.100 gimnasios en todas las provincias de España, fotos reales, marcas oficiales y distancia por GPS.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showConfirmRemove && (
        <ConfirmationModal
          message="¿Seguro que deseas desvincular tu gimnasio habitual de tu cuenta?"
          confirmText="Desvincular"
          cancelText="Cancelar"
          onConfirm={handleConfirmRemove}
          onCancel={() => setShowConfirmRemove(false)}
        />
      )}
    </ModalPortal>
  );
};

export default GymLocationModal;
