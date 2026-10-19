/* frontend/src/components/GymLocationModal.jsx */
import React, { useState, useEffect, useRef } from 'react';
import ModalPortal from './ModalPortal';
import useModalLock from '../hooks/useModalLock';
import { MapPin, Search, X, Navigation, Dumbbell, Trash2, Check, Loader2, Sparkles, Building2 } from 'lucide-react';
import { getCurrentLocation, calculateDistance, formatDistance } from '../utils/gpsUtils';
import { enrichGymWithMedia } from '../utils/gymMedia';
import { useToast } from '../hooks/useToast';

// Base de datos de clubes de cadenas populares en España (Fitness Park, etc.) para búsqueda instantánea
const POPULAR_SPAIN_GYMS = [
  // Canarias (Gran Canaria & Tenerife)
  { name: 'Fitness Park Las Ramblas', brand: 'Fitness Park', address: 'Centro Comercial Las Ramblas, Av. Juan Carlos I, 29, 35019 Las Palmas de Gran Canaria', city: 'Las Palmas de Gran Canaria', province: 'Las Palmas', lat: 28.1137, lng: -15.4492 },
  { name: 'Fitness Park Gran Canaria - Tamaraceite', brand: 'Fitness Park', address: 'Calle San Daniel, Tamaraceite, 35018 Las Palmas de Gran Canaria', city: 'Las Palmas de Gran Canaria', province: 'Las Palmas', lat: 28.1068, lng: -15.4674 },
  { name: 'Fitness Park Telde - Las Terrazas', brand: 'Fitness Park', address: 'Centro Comercial Las Terrazas, 35220 Telde', city: 'Telde', province: 'Las Palmas', lat: 28.0315, lng: -15.4055 },
  { name: 'Fitness Park Gran Canaria - Cruce de Arinaga', brand: 'Fitness Park', address: 'Calle Ciprés, 1, Pol. Ind. Arinaga, 35118 Agüimes', city: 'Agüimes', province: 'Las Palmas', lat: 27.8763, lng: -15.4241 },
  { name: 'Fitness Park Gran Canaria - Vecindario', brand: 'Fitness Park', address: 'Av. de Canarias, 35110 Vecindario, Santa Lucía de Tirajana', city: 'Vecindario', province: 'Las Palmas', lat: 27.8521, lng: -15.4418 },
  { name: 'Fitness Park Gran Canaria - Carvajal', brand: 'Fitness Park', address: 'Calle Carvajal, 35004 Las Palmas de Gran Canaria', city: 'Las Palmas de Gran Canaria', province: 'Las Palmas', lat: 28.1189, lng: -15.4265 },
  { name: 'Fitness Park Tenerife - La Cuesta', brand: 'Fitness Park', address: 'Carretera General Santa Cruz-Laguna, 38320 San Cristóbal de La Laguna', city: 'La Laguna', province: 'Santa Cruz de Tenerife', lat: 28.4652, lng: -16.2913 },
  { name: 'Fitness Park Tenerife - Las Chafiras', brand: 'Fitness Park', address: 'Av. Ten Bel, Pol. Ind. Las Chafiras, 38639 San Miguel de Abona', city: 'Las Chafiras', province: 'Santa Cruz de Tenerife', lat: 28.0833, lng: -16.6358 },

  // Madrid
  { name: 'Fitness Park La Vaguada', brand: 'Fitness Park', address: 'Centro Comercial La Vaguada, Av. de Monforte de Lemos, 36, 28029 Madrid', city: 'Madrid', province: 'Madrid', lat: 40.4795, lng: -3.7082 },
  { name: 'Fitness Park Castellana 85', brand: 'Fitness Park', address: 'Paseo de la Castellana, 85, Complejo AZCA, 28046 Madrid', city: 'Madrid', province: 'Madrid', lat: 40.4497, lng: -3.6918 },
  { name: 'Fitness Park Príncipe Pío', brand: 'Fitness Park', address: 'Centro Comercial Príncipe Pío, Paseo de la Florida, 2, 28008 Madrid', city: 'Madrid', province: 'Madrid', lat: 40.4208, lng: -3.7197 },
  { name: 'Fitness Park Plaza Río 2', brand: 'Fitness Park', address: 'Centro Comercial Plaza Río 2, Calle de Antonio López, 109, 28026 Madrid', city: 'Madrid', province: 'Madrid', lat: 40.3905, lng: -3.6991 },
  { name: 'Fitness Park Méndez Álvaro', brand: 'Fitness Park', address: 'Calle de Méndez Álvaro, 28045 Madrid', city: 'Madrid', province: 'Madrid', lat: 40.3982, lng: -3.6784 },
  { name: 'Fitness Park Alcorcón - X-Madrid', brand: 'Fitness Park', address: 'Centro Comercial X-Madrid, Calle Oslo, 53, 28922 Alcorcón', city: 'Alcorcón', province: 'Madrid', lat: 40.3392, lng: -3.8327 },
  { name: 'Fitness Park Torrejón - Oasiz', brand: 'Fitness Park', address: 'Centro Comercial Oasiz, Av. Premios Nobel, 3, 28850 Torrejón de Ardoz', city: 'Torrejón de Ardoz', province: 'Madrid', lat: 40.4632, lng: -3.4561 },
  { name: 'Fitness Park Calle Toledo', brand: 'Fitness Park', address: 'Calle de Toledo, 28005 Madrid', city: 'Madrid', province: 'Madrid', lat: 40.4078, lng: -3.7126 },
  { name: 'Fitness Park San Sebastián de los Reyes', brand: 'Fitness Park', address: 'Av. de España, 28703 San Sebastián de los Reyes', city: 'San Sebastián de los Reyes', province: 'Madrid', lat: 40.5471, lng: -3.6264 },

  // Barcelona & Catalunya
  { name: 'Fitness Park Barcelona - Casanova', brand: 'Fitness Park', address: 'Carrer de Casanova, 161, 08036 Barcelona', city: 'Barcelona', province: 'Barcelona', lat: 41.3892, lng: 2.1524 },
  { name: 'Fitness Park Barcelona - Berlín', brand: 'Fitness Park', address: 'Carrer de Berlín, 50, Sants, 08029 Barcelona', city: 'Barcelona', province: 'Barcelona', lat: 41.3831, lng: 2.1387 },
  { name: 'Fitness Park Barcelona - Balmes', brand: 'Fitness Park', address: 'Carrer de Balmes, 184, 08006 Barcelona', city: 'Barcelona', province: 'Barcelona', lat: 41.3976, lng: 2.1539 },
  { name: 'Fitness Park Barcelona - Diagonal Mar', brand: 'Fitness Park', address: 'Centro Comercial Diagonal Mar, Av. Diagonal, 3, 08019 Barcelona', city: 'Barcelona', province: 'Barcelona', lat: 41.4089, lng: 2.2157 },
  { name: 'Fitness Park Barcelona - La Maquinista', brand: 'Fitness Park', address: 'Centro Comercial Westfield La Maquinista, Carrer de Potosí, 2, 08030 Barcelona', city: 'Barcelona', province: 'Barcelona', lat: 41.4414, lng: 2.1983 },
  { name: 'Fitness Park L\'Illa Diagonal', brand: 'Fitness Park', address: 'Centro Comercial L\'illa Diagonal, Av. Diagonal, 557, 08029 Barcelona', city: 'Barcelona', province: 'Barcelona', lat: 41.3895, lng: 2.1348 },
  { name: 'Fitness Park Vilanova i la Geltrú', brand: 'Fitness Park', address: 'Rambla de la Torre de l\'Onclet, 08800 Vilanova i la Geltrú', city: 'Vilanova i la Geltrú', province: 'Barcelona', lat: 41.2263, lng: 1.7258 },

  // Comunitat Valenciana & Murcia
  { name: 'Fitness Park Valencia - Aqua', brand: 'Fitness Park', address: 'Centro Comercial Aqua, Carrer de Menorca, 19, 46023 València', city: 'Valencia', province: 'Valencia', lat: 39.4589, lng: -0.3475 },
  { name: 'Fitness Park Valencia - Nou Mestalla', brand: 'Fitness Park', address: 'Carrer del Doctor Nicasi Benlloch, 46015 València', city: 'Valencia', province: 'Valencia', lat: 39.4891, lng: -0.3957 },
  { name: 'Fitness Park Valencia - Ruzafa', brand: 'Fitness Park', address: 'Carrer de Cuba, Ruzafa, 46006 València', city: 'Valencia', province: 'Valencia', lat: 39.4608, lng: -0.3754 },
  { name: 'Fitness Park Valencia - Marítim (Serrería)', brand: 'Fitness Park', address: 'Carrer de la Serradora, 46024 València', city: 'Valencia', province: 'Valencia', lat: 39.4639, lng: -0.3347 },
  { name: 'Fitness Park Valencia - Camí de Montcada', brand: 'Fitness Park', address: 'Camí de Montcada, 85, 46019 València', city: 'Valencia', province: 'Valencia', lat: 39.4921, lng: -0.3789 },
  { name: 'Fitness Park Alfafar - MN4', brand: 'Fitness Park', address: 'Centro Comercial MN4, Calle Alcalde José Puertes, 46910 Alfafar', city: 'Alfafar', province: 'Valencia', lat: 39.4183, lng: -0.3871 },
  { name: 'Fitness Park Alicante - Gran Vía', brand: 'Fitness Park', address: 'Centro Comercial Gran Vía, Calle José García Sellés, 2, 03015 Alicante', city: 'Alicante', province: 'Alicante', lat: 38.3662, lng: -0.4728 },
  { name: 'Fitness Park Murcia - Thader', brand: 'Fitness Park', address: 'Centro Comercial Thader, Av. Juan de Borbón, 30110 Murcia', city: 'Murcia', province: 'Murcia', lat: 38.0264, lng: -1.1398 },
  { name: 'Fitness Park Cartagena', brand: 'Fitness Park', address: 'Plaza Juan XXIII, 30201 Cartagena', city: 'Cartagena', province: 'Murcia', lat: 37.6033, lng: -0.9856 },

  // Andalucía
  { name: 'Fitness Park Málaga - Plaza Mayor', brand: 'Fitness Park', address: 'Centro Comercial Plaza Mayor, Calle Alfonso Ponce de León, 29004 Málaga', city: 'Málaga', province: 'Málaga', lat: 36.6578, lng: -4.4812 },
  { name: 'Fitness Park Sevilla - Lagoh', brand: 'Fitness Park', address: 'Centro Comercial Lagoh, Av. de Palmas Altas, 41012 Sevilla', city: 'Sevilla', province: 'Sevilla', lat: 37.3371, lng: -5.9868 },
  { name: 'Fitness Park Granada - Nevada', brand: 'Fitness Park', address: 'Centro Comercial Nevada Shopping, Av. de las Palmeras, 75, 18100 Armilla', city: 'Granada', province: 'Granada', lat: 37.1438, lng: -3.6189 },

  // País Vasco, Aragón & Norte
  { name: 'Fitness Park Bilbao - Intermodal', brand: 'Fitness Park', address: 'Gurtubay Kalea, 1, Basurtu-Zorrotza, 48013 Bilbao', city: 'Bilbao', province: 'Bizkaia', lat: 43.2612, lng: -2.9482 },
  { name: 'Fitness Park Barakaldo - Megapark', brand: 'Fitness Park', address: 'Parque Comercial Megapark, 48902 Barakaldo', city: 'Barakaldo', province: 'Bizkaia', lat: 43.2954, lng: -2.9982 },
  { name: 'Fitness Park Zaragoza - Puerto Venecia', brand: 'Fitness Park', address: 'Centro Comercial Puerto Venecia, Calle Teatro Malibrán, 50021 Zaragoza', city: 'Zaragoza', province: 'Zaragoza', lat: 41.6083, lng: -0.8872 },
  { name: 'Fitness Park Zaragoza - Plaza Imperial', brand: 'Fitness Park', address: 'Av. Diagonal Plaza, 50197 Zaragoza', city: 'Zaragoza', province: 'Zaragoza', lat: 41.6385, lng: -0.9972 },
  { name: 'Fitness Park Oviedo', brand: 'Fitness Park', address: 'Calle del General Elorza, 33001 Oviedo', city: 'Oviedo', province: 'Asturias', lat: 43.3668, lng: -5.8455 },
  { name: 'Fitness Park Santander - Peñacastillo', brand: 'Fitness Park', address: 'Calle Joaquín Rodrigo, 2, 39011 Santander', city: 'Santander', province: 'Cantabria', lat: 43.4478, lng: -3.8562 },
];

function normalizeText(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

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
    if (!q && !coords) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    const activeCoords = coords || userCoords;

    try {
      // 1. Búsqueda local instantánea en base de datos popular de España
      let localMatches = [];
      if (q) {
        const normQ = normalizeText(q);
        const terms = normQ.split(/\s+/).filter(Boolean);
        
        localMatches = POPULAR_SPAIN_GYMS.filter(gym => {
          const fullSearchable = normalizeText(`${gym.name} ${gym.brand} ${gym.address} ${gym.city} ${gym.province}`);
          return terms.every(t => fullSearchable.includes(t));
        }).map(gym => {
          let distanceMeters = null;
          let distanceFormatted = null;
          if (activeCoords?.lat && activeCoords?.lng && gym.lat && gym.lng) {
            distanceMeters = calculateDistance(activeCoords.lat, activeCoords.lng, gym.lat, gym.lng);
            distanceFormatted = formatDistance(distanceMeters);
          }
          return {
            id: `local_${gym.name}_${gym.city}`,
            name: gym.name,
            address: gym.address,
            city: gym.city,
            suburb: gym.province,
            lat: gym.lat,
            lng: gym.lng,
            distanceMeters,
            distanceFormatted,
            isVerified: true
          };
        });
      }

      // 2. Consulta en tiempo real a OpenStreetMap Nominatim priorizando España (countrycodes=es)
      let nominatimResults = [];
      let url = 'https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=es&limit=12';

      if (q) {
        url += `&q=${encodeURIComponent(q)}`;
      } else {
        url += `&q=gimnasio`;
      }

      if (activeCoords?.lat && activeCoords?.lng) {
        const delta = 0.45;
        url += `&viewbox=${activeCoords.lng - delta},${activeCoords.lat + delta},${activeCoords.lng + delta},${activeCoords.lat - delta}&bounded=0`;
      }

      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'es,ca,gl,eu,en',
          'User-Agent': 'ProFitnessGlass/7.8.8 (support@profitnessglass.com)'
        }
      });

      if (res.ok) {
        const data = await res.json();
        nominatimResults = (data || []).map(item => {
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
      }

      // 3. Fallback inteligente si busca marca + centro comercial/zona y no hubo resultados directos en OSM
      // Ej: "fitness park las ramblas" -> busca "las ramblas" en España para ubicar el centro comercial
      let fallbackLocationResults = [];
      if (localMatches.length === 0 && nominatimResults.length === 0 && q) {
        const brandNames = ['fitness park', 'basic fit', 'basic-fit', 'mcfit', 'altafit', 'vivagym', 'synergym', 'dreamfit'];
        const normQuery = normalizeText(q);
        for (const b of brandNames) {
          if (normQuery.includes(b)) {
            const locPart = normQuery.replace(b, '').trim();
            if (locPart.length >= 2) {
              const locUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=es&limit=6&q=${encodeURIComponent(locPart)}`;
              const locRes = await fetch(locUrl, {
                headers: { 'Accept-Language': 'es,en', 'User-Agent': 'ProFitnessGlass/7.8.8 (support@profitnessglass.com)' }
              });
              if (locRes.ok) {
                const locData = await locRes.json();
                const properBrand = b.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                fallbackLocationResults = (locData || []).map(item => {
                  const placeName = item.name || item.display_name.split(',')[0];
                  let distanceMeters = null;
                  let distanceFormatted = null;
                  if (activeCoords?.lat && activeCoords?.lng && item.lat && item.lon) {
                    distanceMeters = calculateDistance(activeCoords.lat, activeCoords.lng, parseFloat(item.lat), parseFloat(item.lon));
                    distanceFormatted = formatDistance(distanceMeters);
                  }
                  return {
                    id: `smart_${item.place_id}`,
                    name: `${properBrand} - ${placeName}`,
                    address: item.display_name,
                    city: item.address?.city || item.address?.town || '',
                    suburb: item.address?.suburb || '',
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon),
                    distanceMeters,
                    distanceFormatted
                  };
                });
              }
            }
            break;
          }
        }
      }

      // Fusionar y desduplicar
      const combined = [...localMatches, ...fallbackLocationResults, ...nominatimResults];
      const seen = new Set();
      const uniqueResults = [];

      for (const item of combined) {
        const key = `${normalizeText(item.name)}_${item.lat?.toFixed(3)}_${item.lng?.toFixed(3)}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueResults.push(enrichGymWithMedia(item));
        }
      }

      // Si hay coordenadas GPS, ordenar por distancia
      if (activeCoords?.lat && activeCoords?.lng) {
        uniqueResults.sort((a, b) => {
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
    }, 280);

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

  const handleRemoveCurrent = () => {
    onRemove();
    addToast('Gimnasio desvinculado', 'info');
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
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-text-primary tracking-tight">
                    Localiza tu Gimnasio
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                    España 🇪🇸
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
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

          {/* Gimnasio actual guardado (con foto de club y logo oficial) */}
          {activeGym && (
            <div className="mb-4 relative rounded-2xl overflow-hidden border border-accent/30 shadow-lg group shrink-0">
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
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-1 flex items-center justify-center shrink-0 shadow-md overflow-hidden">
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

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider text-accent bg-accent/25 px-2 py-0.5 rounded-full border border-accent/40 shadow-sm flex items-center gap-1">
                        <Check size={11} strokeWidth={3} />
                        Gimnasio habitual
                      </span>
                      {activeGym.distanceFormatted && (
                        <span className="text-[10px] font-bold text-white/90 bg-white/15 px-1.5 py-0.5 rounded-full">
                          {activeGym.distanceFormatted}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white truncate drop-shadow-sm mt-1">
                      {activeGym.name}
                    </h4>
                    {activeGym.address && (
                      <p className="text-xs text-white/75 truncate drop-shadow-sm">
                        {activeGym.address}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleRemoveCurrent}
                  className="p-2 rounded-xl bg-white/10 hover:bg-red-500/80 text-white/80 hover:text-white transition-all shrink-0 border border-white/10 hover:border-red-500 shadow-sm"
                  title="Quitar gimnasio"
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
                placeholder="Busca por nombre (ej: Fitness Park Las Ramblas, Basic-Fit)..."
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
                <span className="text-xs">Buscando gimnasios en tiempo real en España...</span>
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
                  Priorizando gimnasios en España con resultados en tiempo real, dirección y distancia por GPS.
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
