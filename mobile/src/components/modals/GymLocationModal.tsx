import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { X, MapPin, Search, Trash2, Check, Dumbbell, Building2, Sparkles } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastColor } from '@/utils/colorUtils';
import { GYM_BRANDS, enrichGymWithMedia, getGymMedia } from '@/utils/gymMedia';

interface GymLocationModalProps {
  visible: boolean;
  currentGym: any;
  onClose: () => void;
  onSave: (gym: any) => void;
  onRemove: () => void;
}

export function GymLocationModal({
  visible,
  currentGym,
  onClose,
  onSave,
  onRemove,
}: GymLocationModalProps) {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentText = getContrastColor(colors.tint, theme);

  const [query, setQuery] = useState('');

  const filteredBrands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GYM_BRANDS.slice(0, 8);
    return GYM_BRANDS.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.matches.some(m => m.includes(q))
    );
  }, [query]);

  const handleSelectGym = (brand: typeof GYM_BRANDS[0]) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    const gymObj = enrichGymWithMedia({
      name: brand.name,
      brand: brand.name,
      address: 'Gimnasio principal',
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
    });
    onSave(gymObj);
    onClose();
  };

  const handleRemove = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onRemove();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.iconWrap, { backgroundColor: colors.tint }]}>
                  <MapPin size={20} color={accentText} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>Tu Gimnasio Habitual</Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={20} color={colors.textSecondary} />
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
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MapPin size={16} color={colors.tint} />
                        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.tint, textTransform: 'uppercase' }}>Gimnasio Seleccionado</Text>
                      </View>
                      <TouchableOpacity onPress={handleRemove} style={styles.removeBtn}>
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff', marginTop: 8 }}>{currentGym.name}</Text>
                    {currentGym.address && (
                      <Text style={{ fontSize: 12, fontWeight: '500', color: 'rgba(255, 255, 255, 0.8)', marginTop: 2 }}>{currentGym.address}</Text>
                    )}
                  </View>
                </View>
              )}

              {/* Buscador */}
              <View style={[styles.searchWrap, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]}>
                <Search size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar cadena o club (ej: Fitness Park, Basic-Fit...)"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.searchInput, { color: colors.text }]}
                  returnKeyType="search"
                  onSubmitEditing={handleCustomSubmit}
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery('')}>
                    <X size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Cadena rápida o resultados */}
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                {query ? 'RESULTADOS' : 'CADENAS POPULARES'}
              </Text>

              <View style={{ gap: 8 }}>
                {filteredBrands.map(brand => (
                  <TouchableOpacity
                    key={brand.name}
                    onPress={() => handleSelectGym(brand)}
                    style={[
                      styles.brandRow,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.brandInfo}>
                      <View style={[styles.brandIcon, { backgroundColor: brand.color + '20' }]}>
                        <Dumbbell size={18} color={brand.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.brandName, { color: colors.text }]}>{brand.name}</Text>
                        <Text style={[styles.brandDomain, { color: colors.textSecondary }]}>{brand.domain}</Text>
                      </View>
                    </View>
                    <View style={[styles.selectPill, { backgroundColor: colors.tint + '15' }]}>
                      <Text style={[styles.selectPillText, { color: colors.tint }]}>Elegir</Text>
                    </View>
                  </TouchableOpacity>
                ))}

                {query.trim().length > 0 && !filteredBrands.some(b => b.name.toLowerCase() === query.trim().toLowerCase()) && (
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
                      <Text style={[styles.brandName, { color: colors.text }]}>Guardar "{query.trim()}"</Text>
                    </View>
                    <Check size={18} color={colors.tint} />
                  </TouchableOpacity>
                )}
              </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
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
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  currentGymOverlay: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
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
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  brandInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 15,
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
  },
  selectPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
