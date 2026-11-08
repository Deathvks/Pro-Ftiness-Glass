import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
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
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastColor } from '@/utils/colorUtils';
import { GYM_BRANDS, enrichGymWithMedia } from '@/utils/gymMedia';
import { searchLocalGyms, normalizeGymText, SpainGymItem } from '@/utils/spainGymsData';
import { getCurrentLocation } from '@/utils/gpsUtils';

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
  const accentText = getContrastColor(colors.tint, theme);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpainGymItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const debounceTimer = useRef<any>(null);

  useEffect(() => {
    if (isModalVisible) {
      setQuery('');
      setResults([]);
    }
  }, [isModalVisible]);

  const searchGyms = async (queryText: string, coords: { lat: number; lng: number } | null = null) => {
    const q = (queryText || '').trim();
    const activeCoords = coords || userCoords;

    if (!q && !activeCoords) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const localMatches = q ? searchLocalGyms(q, activeCoords) : [];
      let localNearby: SpainGymItem[] = [];
      if (!q && activeCoords?.lat && activeCoords?.lng) {
        localNearby = searchLocalGyms('gimnasio', activeCoords).slice(0, 10);
      }

      const combined = [...localMatches, ...localNearby];
      const seen = new Set<string>();
      const unique: SpainGymItem[] = [];

      for (const item of combined) {
        if (!item || !item.name) continue;
        const norm = normalizeGymText(item.name);
        const key = item.lat && item.lng ? `${norm}_${item.lat.toFixed(3)}_${item.lng.toFixed(3)}` : `${norm}_${item.city || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(enrichGymWithMedia(item));
        }
      }

      setResults(unique);
    } catch (e) {
      console.warn('Error buscando gimnasios:', e);
    } finally {
      setIsSearching(false);
    }
  };

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
    try {
      const loc = await getCurrentLocation();
      setUserCoords(loc);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      await searchGyms(query || 'gimnasio', loc);
    } catch (err: any) {
      Alert.alert(
        'Ubicación no disponible',
        'No pudimos obtener tu ubicación actual. Puedes buscar tu gimnasio por nombre o ciudad.'
      );
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
      isVerified: gym.isVerified ?? true,
      updatedAt: new Date().toISOString(),
    });
    onSave(gymObj);
    onClose();
  };

  const handleSelectBrand = (brand: typeof GYM_BRANDS[0]) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    const gymObj = enrichGymWithMedia({
      name: brand.name,
      brand: brand.name,
      address: 'Gimnasio principal',
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
      '¿Seguro que deseas desvincular tu gimnasio actual?',
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

  return (
    <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={onClose}>
      <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <View
            style={[
              styles.card,
              {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                maxHeight: '85%',
              },
            ]}
          >
            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderRadius: 32 }]}
            />

            {/* Header - Fully responsive with no collision */}
            <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
              <View style={styles.headerInfoGroup}>
                <View style={[styles.iconWrap, { backgroundColor: colors.tint }]}>
                  <MapPin size={20} color={accentText} />
                </View>
                <View style={styles.headerTitles}>
                  <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                    Tu Gimnasio Habitual
                  </Text>
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                    Encuentra atletas de tu zona y centro
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.closeBtn}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Gimnasio actual si existe */}
              {currentGym && (
                <View style={[styles.currentGymCard, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)', borderColor: colors.tint + '40' }]}>
                  {currentGym.image && (
                    <Image source={{ uri: currentGym.image }} style={styles.currentGymBg} />
                  )}
                  <View style={styles.currentGymOverlay}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                        <MapPin size={16} color={colors.tint} />
                        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.tint, textTransform: 'uppercase' }} numberOfLines={1}>
                          Gimnasio Seleccionado
                        </Text>
                      </View>
                      <TouchableOpacity onPress={handleRemove} style={styles.removeBtn}>
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff', marginTop: 8 }} numberOfLines={1}>
                      {currentGym.name}
                    </Text>
                    {(currentGym.address || currentGym.city) && (
                      <Text style={{ fontSize: 12, fontWeight: '500', color: 'rgba(255, 255, 255, 0.8)', marginTop: 2 }} numberOfLines={1}>
                        {[currentGym.address, currentGym.city].filter(Boolean).join(' • ')}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Buscador + Botón GPS (Liquid Glass) */}
              <View style={{ gap: 8 }}>
                <View style={[styles.searchWrap, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]}>
                  <Search size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Buscar gimnasio o ciudad en España..."
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.searchInput, { color: colors.text }]}
                    returnKeyType="search"
                    onSubmitEditing={handleCustomSubmit}
                  />
                  {isSearching ? (
                    <ActivityIndicator size="small" color={colors.tint} />
                  ) : query.length > 0 ? (
                    <TouchableOpacity onPress={() => setQuery('')}>
                      <X size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Botón Detectar Ubicación (Liquid Glass Capsule) */}
                <TouchableOpacity
                  onPress={handleDetectLocation}
                  disabled={isLocating}
                  activeOpacity={0.75}
                  style={[
                    styles.gpsBtn,
                    {
                      backgroundColor: userCoords
                        ? 'rgba(16, 185, 129, 0.12)'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(255, 255, 255, 0.7)',
                      borderColor: userCoords
                        ? 'rgba(16, 185, 129, 0.35)'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                >
                  <GlassView
                    glassEffectStyle="regular"
                    colorScheme={isDark ? 'dark' : 'light'}
                    style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                  />
                  {isLocating ? (
                    <ActivityIndicator size="small" color={colors.tint} />
                  ) : (
                    <Navigation size={16} color={userCoords ? '#10b981' : colors.tint} />
                  )}
                  <Text
                    style={[
                      styles.gpsBtnText,
                      { color: userCoords ? '#10b981' : colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {userCoords ? 'Ubicación GPS detectada' : 'Buscar gimnasios cerca de mí'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Resultados de búsqueda */}
              {results.length > 0 && (
                <View style={{ gap: 8 }}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    GIMNASIOS ENCONTRADOS ({results.length})
                  </Text>
                  {results.map((gym, idx) => (
                    <TouchableOpacity
                      key={gym.id || `res_${idx}`}
                      onPress={() => handleSelectGymItem(gym)}
                      style={[
                        styles.brandRow,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.65)',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <GlassView
                        glassEffectStyle="regular"
                        colorScheme={isDark ? 'dark' : 'light'}
                        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                      />
                      <View style={styles.brandInfo}>
                        <View style={[styles.brandIcon, { backgroundColor: (gym.brandColor || colors.tint) + '20' }]}>
                          <Dumbbell size={18} color={gym.brandColor || colors.tint} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.brandName, { color: colors.text }]} numberOfLines={1}>
                              {gym.name}
                            </Text>
                            {gym.isVerified && (
                              <BadgeCheck size={14} color={colors.tint} />
                            )}
                          </View>
                          <Text style={[styles.brandDomain, { color: colors.textSecondary }]} numberOfLines={1}>
                            {[gym.address, gym.city].filter(Boolean).join(' • ')}
                          </Text>
                        </View>
                      </View>
                      {gym.distanceFormatted && (
                        <View style={[styles.distBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                          <Text style={[styles.distText, { color: '#10b981' }]}>{gym.distanceFormatted}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Cadenas Populares si no hay búsqueda activa */}
              {results.length === 0 && (
                <View style={{ gap: 8 }}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    {query ? 'GUARDAR PERSONALIZADO' : 'CADENAS POPULARES EN ESPAÑA'}
                  </Text>

                  {!query && GYM_BRANDS.slice(0, 8).map(brand => (
                    <TouchableOpacity
                      key={brand.name}
                      onPress={() => handleSelectBrand(brand)}
                      style={[
                        styles.brandRow,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.65)',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <GlassView
                        glassEffectStyle="regular"
                        colorScheme={isDark ? 'dark' : 'light'}
                        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                      />
                      <View style={styles.brandInfo}>
                        <View style={[styles.brandIcon, { backgroundColor: brand.color + '20' }]}>
                          <Dumbbell size={18} color={brand.color} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.brandName, { color: colors.text }]} numberOfLines={1}>{brand.name}</Text>
                          <Text style={[styles.brandDomain, { color: colors.textSecondary }]} numberOfLines={1}>{brand.domain}</Text>
                        </View>
                      </View>
                      <View style={[styles.selectPill, { backgroundColor: colors.tint + '15' }]}>
                        <Text style={[styles.selectPillText, { color: colors.tint }]}>Elegir</Text>
                      </View>
                    </TouchableOpacity>
                  ))}

                  {query.trim().length > 0 && (
                    <TouchableOpacity
                      onPress={handleCustomSubmit}
                      style={[
                        styles.brandRow,
                        {
                          backgroundColor: colors.tint + '15',
                          borderColor: colors.tint + '30',
                        },
                      ]}
                    >
                      <View style={styles.brandInfo}>
                        <Building2 size={20} color={colors.tint} style={{ marginRight: 12 }} />
                        <Text style={[styles.brandName, { color: colors.text }]} numberOfLines={1}>Guardar "{query.trim()}"</Text>
                      </View>
                      <Check size={18} color={colors.tint} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </GlassView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  headerInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  headerTitles: {
    flex: 1,
    minWidth: 0,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  currentGymCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    minHeight: 110,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  currentGymBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.35,
  },
  currentGymOverlay: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gpsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  brandInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    minWidth: 0,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  brandName: {
    fontSize: 14,
    fontWeight: '700',
  },
  brandDomain: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  selectPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    flexShrink: 0,
  },
  selectPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  distBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexShrink: 0,
  },
  distText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
