/* mobile/src/components/modals/GymLocationModal.tsx */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import {
  X,
  MapPin,
  Search,
  Trash2,
  Check,
  Dumbbell,
  Building2,
  Navigation,
  BadgeCheck,
  Sparkles,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { SwipeableBottomSheet } from '@/components/ui/SwipeableBottomSheet';
import { GYM_BRANDS, enrichGymWithMedia } from '@/utils/gymMedia';
import {
  searchLocalGyms,
  normalizeGymText,
  cleanSearchTokens,
  SpainGymItem,
} from '@/utils/spainGymsData';
import {
  getCurrentLocation,
  calculateDistance,
  formatDistance,
} from '@/utils/gpsUtils';

interface GymLocationModalProps {
  visible: boolean;
  isOpen?: boolean;
  currentGym?: any;
  onClose: () => void;
  onSave: (gym: any) => void;
  onRemove: () => void;
}

export function GymLocationModal({
  visible,
  isOpen,
  currentGym,
  onClose,
  onSave,
  onRemove,
}: GymLocationModalProps) {
  const isModalVisible = visible ?? isOpen ?? false;
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpainGymItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const debounceTimer = useRef<any>(null);

  useEffect(() => {
    if (isModalVisible) {
      setQuery('');
      setResults([]);
      setSearchError(null);
      setLocationError(null);
    }
  }, [isModalVisible]);

  /**
   * Búsqueda híbrida unificada idéntica al frontend:
   * 1. Catálogo local de España (con más de 3.100 gimnasios verificados)
   * 2. Photon API (OpenStreetMap Elasticsearch con BBOX de España, Canarias y Baleares)
   * 3. Nominatim API (Geocodificador oficial OpenStreetMap España)
   * 4. Fusión, desduplicación geográfica y ordenación por proximidad GPS
   */
  const searchGyms = async (
    queryText: string,
    coords: { lat: number; lng: number } | null = null
  ) => {
    const q = (queryText || '').trim();
    const activeCoords = coords || userCoords;

    if (!q && !activeCoords) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // 1. Búsqueda instantánea en el catálogo verificado de España
      const localMatches = q ? searchLocalGyms(q, activeCoords) : [];

      let localNearby: SpainGymItem[] = [];
      if (!q && activeCoords?.lat && activeCoords?.lng) {
        localNearby = searchLocalGyms('gimnasio', activeCoords).slice(0, 10);
      }

      // 2. Consulta en paralelo a Photon (OpenStreetMap Elasticsearch) y Nominatim
      const { cleanedQueryString } = cleanSearchTokens(q);
      const searchTarget = cleanedQueryString || q || 'gimnasio';

      const externalPromises: Promise<SpainGymItem[]>[] = [];

      // A) Photon: motor OpenStreetMap elástico, ultrarrápido y tolerante a fallos
      let photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
        searchTarget
      )}&limit=15&bbox=-18.5,27.5,4.5,43.9`;
      if (activeCoords?.lat && activeCoords?.lng) {
        photonUrl += `&lat=${activeCoords.lat}&lon=${activeCoords.lng}`;
      }

      externalPromises.push(
        fetch(photonUrl)
          .then(res => (res.ok ? res.json() : null))
          .then(data => {
            if (!data?.features) return [];
            return data.features
              .filter((f: any) => {
                const p = f.properties || {};
                const osmVal = (p.osm_value || '').toLowerCase();
                const osmKey = (p.osm_key || '').toLowerCase();
                const name = (p.name || '').toLowerCase();
                const isGymTag =
                  ['fitness_centre', 'sports_centre', 'gym', 'sports'].includes(osmVal) ||
                  ['fitness_centre', 'sports_centre'].includes(osmKey) ||
                  osmKey === 'leisure';
                const hasGymWord = /fit|gym|crossfit|deport|club|box|entrena|pilates|padel/i.test(
                  name
                );
                return isGymTag || hasGymWord;
              })
              .map((item: any) => {
                const p = item.properties || {};
                const coordsArr = item.geometry?.coordinates || [];
                const lng = coordsArr[0];
                const lat = coordsArr[1];
                if (!lat || !lng) return null;

                const street = p.street
                  ? p.street + (p.housenumber ? `, ${p.housenumber}` : '')
                  : '';
                const suburb = p.district || p.suburb || p.neighbourhood || '';
                const city = p.city || p.town || p.state || '';
                const address =
                  [street, suburb, city].filter(Boolean).join(', ') ||
                  [suburb, city].filter(Boolean).join(', ') ||
                  'España';

                let distanceMeters: number | null = null;
                let distanceFormatted: string | null = null;
                if (activeCoords?.lat && activeCoords?.lng) {
                  distanceMeters = calculateDistance(
                    activeCoords.lat,
                    activeCoords.lng,
                    lat,
                    lng
                  );
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
                  isVerified: false,
                };
              })
              .filter(Boolean) as SpainGymItem[];
          })
          .catch(() => [])
      );

      // B) Nominatim: geocodificador oficial de OpenStreetMap España
      let nomUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=es&limit=8&q=${encodeURIComponent(
        searchTarget
      )}`;
      if (activeCoords?.lat && activeCoords?.lng) {
        const delta = 0.45;
        nomUrl += `&viewbox=${activeCoords.lng - delta},${activeCoords.lat + delta},${
          activeCoords.lng + delta
        },${activeCoords.lat - delta}&bounded=0`;
      }

      externalPromises.push(
        fetch(nomUrl, {
          headers: {
            'Accept-Language': 'es,ca,gl,eu,en',
            'User-Agent': 'ProFitnessGlass/7.10.10 (soporte@profitnessglass.es)',
          },
        })
          .then(res => (res.ok ? res.json() : null))
          .then(data => {
            if (!Array.isArray(data)) return [];
            return data.map((item: any) => {
              const road = item.address?.road || item.address?.pedestrian || '';
              const houseNumber = item.address?.house_number || '';
              const suburb = item.address?.suburb || item.address?.neighbourhood || '';
              const city =
                item.address?.city ||
                item.address?.town ||
                item.address?.municipality ||
                item.address?.village ||
                item.address?.county ||
                '';
              const roadPart = road ? road + (houseNumber ? `, ${houseNumber}` : '') : '';
              const address =
                [roadPart, suburb, city].filter(Boolean).join(', ') || item.display_name;

              const lat = parseFloat(item.lat);
              const lng = parseFloat(item.lon);
              let distanceMeters: number | null = null;
              let distanceFormatted: string | null = null;
              if (activeCoords?.lat && activeCoords?.lng && lat && lng) {
                distanceMeters = calculateDistance(
                  activeCoords.lat,
                  activeCoords.lng,
                  lat,
                  lng
                );
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
                isVerified: false,
              };
            });
          })
          .catch(() => [])
      );

      const [photonResults, nominatimResults] = await Promise.all(externalPromises);

      // 3. Fusión inteligente y desduplicación geográfica
      const combined = [
        ...localMatches,
        ...localNearby,
        ...photonResults,
        ...nominatimResults,
      ];
      const seenKeys = new Set<string>();
      const uniqueResults: SpainGymItem[] = [];

      for (const item of combined) {
        if (!item || !item.name) continue;
        const normName = normalizeGymText(item.name);
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
    if (!isModalVisible) return;
    if (query.trim().length < 2) {
      if (!userCoords) {
        setResults([]);
      }
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      searchGyms(query, userCoords);
    }, 250);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, isModalVisible, userCoords]);

  const handleDetectLocation = async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const loc = await getCurrentLocation();
      setUserCoords(loc);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      await searchGyms(query || 'gimnasio', loc);
    } catch (err: any) {
      console.warn('GPS no disponible:', err);
      const msg =
        err?.message ||
        'No pudimos acceder a tu ubicación actual. Puedes buscarlo por nombre o ciudad.';
      setLocationError(msg);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {}
    } finally {
      setIsLocating(false);
    }
  };

  const handleSelectGymItem = (gym: SpainGymItem) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    const gymObj = enrichGymWithMedia({
      name: gym.name,
      address: gym.address,
      city: gym.city,
      province: gym.province,
      lat: gym.lat || null,
      lng: gym.lng || null,
      distanceFormatted: gym.distanceFormatted || null,
      brand: gym.brand || null,
      brandColor: gym.brandColor || null,
      image: gym.image || null,
      logo: gym.logo || null,
      isVerified: gym.isVerified ?? false,
      updatedAt: new Date().toISOString(),
    });
    onSave(gymObj);
    onClose();
  };

  const handleSelectBrand = (brand: (typeof GYM_BRANDS)[0]) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    const gymObj = enrichGymWithMedia({
      name: brand.name,
      brand: brand.name,
      address: 'Gimnasio principal en España',
      isVerified: true,
      updatedAt: new Date().toISOString(),
    });
    onSave(gymObj);
    onClose();
  };

  const handleCustomSubmit = () => {
    const q = query.trim();
    if (!q) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    const gymObj = enrichGymWithMedia({
      name: q,
      brand: q,
      address: userCoords ? 'Ubicación personalizada' : '',
      lat: userCoords?.lat || null,
      lng: userCoords?.lng || null,
      isCustom: true,
      updatedAt: new Date().toISOString(),
    });
    onSave(gymObj);
    onClose();
  };

  const handleRemove = () => {
    Alert.alert(
      'Desvincular Gimnasio',
      '¿Seguro que deseas desvincular tu gimnasio habitual de tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch {}
            onRemove();
            onClose();
          },
        },
      ]
    );
  };

  const activeGym = currentGym ? enrichGymWithMedia(currentGym) : null;

  return (
    <SwipeableBottomSheet
      visible={isModalVisible}
      onClose={onClose}
      isDark={isDark}
      backgroundColor={colors.card}
      height="90%"
      maxHeight="90%"
      avoidKeyboard
    >
      <View style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={[
              styles.header,
              { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' },
            ]}
          >
            <View style={styles.headerInfoGroup}>
              <View style={[styles.iconWrap, { backgroundColor: colors.tint + '20' }]}>
                <MapPin size={22} color={colors.tint} />
              </View>
              <View style={styles.headerTitles}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                    Localiza tu Gimnasio
                  </Text>
                  <View style={[styles.spainBadge, { backgroundColor: colors.tint + '18' }]}>
                    <Text style={[styles.spainBadgeText, { color: colors.tint }]}>
                      🇪🇸 España
                    </Text>
                  </View>
                </View>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={2}>
                  Búsqueda en toda España (+3.100 gimnasios, Canarias y Baleares)
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
              ]}
              activeOpacity={0.7}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Gimnasio actual con foto de club y logo oficial */}
            {activeGym && (
              <View
                style={[
                  styles.currentGymCard,
                  {
                    borderColor: colors.tint + '50',
                  },
                ]}
              >
                {activeGym.image ? (
                  <Image
                    source={{ uri: activeGym.image }}
                    style={styles.currentGymBg}
                    contentFit="cover"
                    transition={200}
                  />
                ) : null}
                <View style={styles.currentGymOverlay}>
                  <View style={styles.currentGymTopRow}>
                    <View style={styles.currentGymPillRow}>
                      <View style={[styles.currentHabitualPill, { backgroundColor: colors.tint }]}>
                        <Check size={11} color="#000" strokeWidth={3} />
                        <Text style={styles.currentHabitualText}>Gimnasio Habitual</Text>
                      </View>
                      {activeGym.distanceFormatted ? (
                        <View style={styles.currentDistPill}>
                          <Text style={styles.currentDistText}>
                            {activeGym.distanceFormatted}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <TouchableOpacity
                      onPress={handleRemove}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.removeBtn}
                      activeOpacity={0.75}
                    >
                      <Trash2 size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.currentGymDetailsRow}>
                    <View style={styles.currentLogoBox}>
                      {activeGym.logo ? (
                        <Image
                          source={{ uri: activeGym.logo }}
                          style={styles.currentLogoImg}
                          contentFit="contain"
                          transition={150}
                        />
                      ) : (
                        <Dumbbell size={20} color={colors.tint} />
                      )}
                    </View>

                    <View style={styles.currentGymTextGroup}>
                      <Text style={styles.currentGymName} numberOfLines={1}>
                        {activeGym.name}
                      </Text>
                      {activeGym.address ? (
                        <Text style={styles.currentGymAddress} numberOfLines={2}>
                          {activeGym.address}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Barra de Búsqueda y Botón GPS */}
            <View style={{ gap: 10 }}>
              <View
                style={[
                  styles.searchWrap,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.04)',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Search size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Busca por nombre (ej: GO fit, MacroFit, Fitness Park)..."
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.searchInput, { color: colors.text }]}
                  returnKeyType="search"
                  onSubmitEditing={handleCustomSubmit}
                />
                {query.length > 0 ? (
                  <TouchableOpacity onPress={() => setQuery('')}>
                    <X size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Botón Detectar Ubicación GPS */}
              <TouchableOpacity
                onPress={handleDetectLocation}
                disabled={isLocating}
                activeOpacity={0.75}
                style={[
                  styles.gpsBtn,
                  {
                    backgroundColor: userCoords
                      ? 'rgba(16, 185, 129, 0.12)'
                      : colors.tint + '12',
                    borderColor: userCoords
                      ? 'rgba(16, 185, 129, 0.35)'
                      : colors.tint + '30',
                  },
                ]}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color={colors.tint} />
                ) : (
                  <Navigation
                    size={15}
                    color={userCoords ? '#10b981' : colors.tint}
                  />
                )}
                <Text
                  style={[
                    styles.gpsBtnText,
                    { color: userCoords ? '#10b981' : colors.text },
                  ]}
                  numberOfLines={1}
                >
                  {isLocating
                    ? 'Obteniendo ubicación GPS...'
                    : userCoords
                    ? 'Ubicación GPS activada (Buscar cerca de mí)'
                    : 'Buscar gimnasios cerca de mi ubicación actual'}
                </Text>
              </TouchableOpacity>

              {locationError ? (
                <Text style={styles.errorBannerText}>{locationError}</Text>
              ) : null}
            </View>

            {/* Spinner de búsqueda en tiempo real */}
            {isSearching && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={colors.tint} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                  Buscando gimnasios en tiempo real en España, Canarias y Baleares...
                </Text>
              </View>
            )}

            {/* Error de búsqueda */}
            {!isSearching && searchError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{searchError}</Text>
              </View>
            ) : null}

            {/* Lista de Resultados en tiempo real */}
            {!isSearching && results.length > 0 ? (
              <View style={{ gap: 8 }}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  GIMNASIOS ENCONTRADOS ({results.length})
                </Text>
                {results.map((gym, idx) => {
                  const isCurrent =
                    activeGym &&
                    (activeGym.id === gym.id ||
                      activeGym.name?.toLowerCase() === gym.name?.toLowerCase());

                  return (
                    <TouchableOpacity
                      key={gym.id || `res_${idx}`}
                      onPress={() => handleSelectGymItem(gym)}
                      style={[
                        styles.resultCard,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.04)'
                            : 'rgba(255, 255, 255, 0.7)',
                          borderColor: colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      {/* Thumbnail con foto de club y logo en esquina */}
                      <View
                        style={[
                          styles.gymThumbBox,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.05)',
                          },
                        ]}
                      >
                        {gym.image ? (
                          <Image
                            source={{ uri: gym.image }}
                            style={styles.gymThumbImg}
                            contentFit="cover"
                            transition={180}
                          />
                        ) : (
                          <Dumbbell size={18} color={colors.textSecondary} />
                        )}
                        {gym.logo ? (
                          <View style={styles.logoBadgeCorner}>
                            <Image
                              source={{ uri: gym.logo }}
                              style={styles.logoBadgeImg}
                              contentFit="contain"
                            />
                          </View>
                        ) : null}
                      </View>

                      {/* Info */}
                      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text
                            style={[styles.gymResultName, { color: colors.text }]}
                            numberOfLines={1}
                          >
                            {gym.name}
                          </Text>
                          {gym.isVerified ? (
                            <View style={[styles.verifiedPill, { backgroundColor: colors.tint + '18' }]}>
                              <BadgeCheck size={11} color={colors.tint} strokeWidth={2.5} />
                              <Text style={[styles.verifiedText, { color: colors.tint }]}>
                                Verificado
                              </Text>
                            </View>
                          ) : null}
                          {isCurrent ? (
                            <View style={[styles.habitualPill, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                              <Check size={10} color="#10b981" strokeWidth={3} />
                              <Text style={[styles.habitualText, { color: '#10b981' }]}>
                                Habitual
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text
                          style={[styles.gymResultAddress, { color: colors.textSecondary }]}
                          numberOfLines={1}
                        >
                          {gym.address || [gym.city, gym.province].filter(Boolean).join(' • ')}
                        </Text>
                      </View>

                      {/* Distancia & Pin */}
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        {gym.distanceFormatted ? (
                          <View
                            style={[
                              styles.distBadge,
                              { backgroundColor: 'rgba(16, 185, 129, 0.14)' },
                            ]}
                          >
                            <Text style={[styles.distText, { color: '#10b981' }]}>
                              {gym.distanceFormatted}
                            </Text>
                          </View>
                        ) : null}
                        <MapPin size={15} color={colors.textMuted} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

            {/* Opción de guardar personalizado cuando el usuario escribe */}
            {query.trim().length >= 2 ? (() => {
              const customPreview = enrichGymWithMedia(query.trim());
              return (
                <TouchableOpacity
                  onPress={handleCustomSubmit}
                  style={[
                    styles.customCard,
                    {
                      backgroundColor: colors.tint + '12',
                      borderColor: colors.tint + '35',
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={styles.customThumb}>
                    {customPreview.image ? (
                      <Image
                        source={{ uri: customPreview.image }}
                        style={styles.gymThumbImg}
                        contentFit="cover"
                        transition={180}
                      />
                    ) : (
                      <Building2 size={20} color={colors.tint} />
                    )}
                    {customPreview.logo ? (
                      <View style={styles.logoBadgeCorner}>
                        <Image
                          source={{ uri: customPreview.logo }}
                          style={styles.logoBadgeImg}
                          contentFit="contain"
                        />
                      </View>
                    ) : null}
                  </View>

                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Sparkles size={12} color={colors.tint} />
                      <Text style={[styles.customTag, { color: colors.tint }]}>
                        PERSONALIZADO
                      </Text>
                    </View>
                    <Text style={[styles.customName, { color: colors.text }]} numberOfLines={1}>
                      Usar "{query.trim()}" como mi gimnasio
                    </Text>
                    <Text style={[styles.customSub, { color: colors.textSecondary }]}>
                      Guarda este nombre directamente con su foto e icono
                    </Text>
                  </View>

                  <Check size={18} color={colors.tint} />
                </TouchableOpacity>
              );
            })() : null}

            {/* Cadenas Populares si no hay búsqueda activa ni resultados */}
            {!isSearching && results.length === 0 && !query ? (
              <View style={{ gap: 10 }}>
                {/* Info Card inicial */}
                <View
                  style={[
                    styles.initialCard,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.03)'
                        : 'rgba(0, 0, 0, 0.02)',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Building2 size={24} color={colors.tint} style={{ marginBottom: 6 }} />
                  <Text style={[styles.initialTitle, { color: colors.text }]}>
                    Escribe el nombre de tu gimnasio
                  </Text>
                  <Text style={[styles.initialDesc, { color: colors.textMuted }]}>
                    Catálogo nacional con más de 3.100 gimnasios en todas las provincias de España,
                    Canarias y Baleares, con fotos reales, marcas oficiales y distancia GPS en tiempo real.
                  </Text>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  CADENAS POPULARES EN ESPAÑA
                </Text>

                {GYM_BRANDS.slice(0, 8).map(brand => {
                  const brandLogo = brand.domain
                    ? `https://www.google.com/s2/favicons?domain=${brand.domain}&sz=128`
                    : null;

                  return (
                    <TouchableOpacity
                      key={brand.name}
                      onPress={() => handleSelectBrand(brand)}
                      style={[
                        styles.brandRow,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.04)'
                            : 'rgba(255, 255, 255, 0.65)',
                          borderColor: colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.brandInfo}>
                        {/* Thumbnail con foto real de la cadena y logo oficial */}
                        <View
                          style={[
                            styles.gymThumbBox,
                            {
                              backgroundColor: isDark
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.05)',
                            },
                          ]}
                        >
                          {brand.image ? (
                            <Image
                              source={{ uri: brand.image }}
                              style={styles.gymThumbImg}
                              contentFit="cover"
                              transition={180}
                            />
                          ) : (
                            <View
                              style={[
                                styles.brandIcon,
                                { backgroundColor: brand.color + '20' },
                              ]}
                            >
                              <Dumbbell size={18} color={brand.color} />
                            </View>
                          )}
                          {brandLogo ? (
                            <View style={styles.logoBadgeCorner}>
                              <Image
                                source={{ uri: brandLogo }}
                                style={styles.logoBadgeImg}
                                contentFit="contain"
                              />
                            </View>
                          ) : null}
                        </View>

                        <View style={{ flex: 1, minWidth: 0 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.brandName, { color: colors.text }]} numberOfLines={1}>
                              {brand.name}
                            </Text>
                            <View style={[styles.verifiedPill, { backgroundColor: colors.tint + '18' }]}>
                              <BadgeCheck size={11} color={colors.tint} strokeWidth={2.5} />
                              <Text style={[styles.verifiedText, { color: colors.tint }]}>
                                Oficial
                              </Text>
                            </View>
                          </View>
                          <Text
                            style={[styles.brandDomain, { color: colors.textSecondary }]}
                            numberOfLines={1}
                          >
                            {brand.domain}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.selectPill, { backgroundColor: colors.tint + '15' }]}>
                        <Text style={[styles.selectPillText, { color: colors.tint }]}>Elegir</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </ScrollView>
      </View>
    </SwipeableBottomSheet>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  card: {
    width: '100%',
    maxHeight: '90%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 24,
  },
  grabberContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  spainBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  spainBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 18,
    gap: 14,
    paddingBottom: 36,
  },
  currentGymCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 110,
  },
  currentGymBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  currentGymOverlay: {
    padding: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'space-between',
    minHeight: 110,
    gap: 10,
  },
  currentGymTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentGymPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  currentHabitualPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
  },
  currentHabitualText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000',
    textTransform: 'uppercase',
  },
  currentDistPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
  },
  currentDistText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  removeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.75)',
  },
  currentGymDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currentLogoBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 2,
  },
  currentLogoImg: {
    width: '100%',
    height: '100%',
  },
  currentGymTextGroup: {
    flex: 1,
  },
  currentGymName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  currentGymAddress: {
    fontSize: 11.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 1,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    padding: 0,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  gpsBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  errorBannerText: {
    fontSize: 11,
    color: '#f59e0b',
    paddingHorizontal: 4,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  loadingText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  errorBox: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
  },
  errorBoxText: {
    fontSize: 12,
    color: '#ef4444',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  gymThumbBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gymThumbImg: {
    width: '100%',
    height: '100%',
  },
  logoBadgeCorner: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 17,
    height: 17,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  logoBadgeImg: {
    width: '100%',
    height: '100%',
  },
  gymResultName: {
    fontSize: 13.5,
    fontWeight: '800',
    flex: 1,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
  },
  habitualPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  habitualText: {
    fontSize: 9,
    fontWeight: '800',
  },
  gymResultAddress: {
    fontSize: 11,
    fontWeight: '500',
  },
  distBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  distText: {
    fontSize: 10,
    fontWeight: '800',
  },
  customCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 12,
    marginTop: 4,
  },
  customThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  customTag: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  customName: {
    fontSize: 13,
    fontWeight: '800',
  },
  customSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  initialCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 4,
  },
  initialTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  initialDesc: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 15,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  brandInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 13,
    fontWeight: '800',
  },
  brandDomain: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  selectPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  selectPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
