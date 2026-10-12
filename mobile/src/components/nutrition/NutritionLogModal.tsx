import React, { useState, useEffect, useMemo } from 'react';
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
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  Search,
  Star,
  Clock,
  Edit3,
  Camera,
  Plus,
  Trash2,
  Check,
  Beef,
  Wheat,
  Salad,
  IceCream,
  Scale,
  Utensils,
  ChevronRight,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastTextColor } from '@/utils/colorUtils';
import { BACKEND_BASE_URL } from '@/services/apiClient';
import * as nutritionService from '@/services/nutritionService';
import { FoodLogItem } from './MealSection';

interface NutritionLogModalProps {
  visible: boolean;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  logToEdit?: FoodLogItem | null;
  isLoading?: boolean;
  onClose: () => void;
  onSave: (foodData: any) => Promise<void>;
}

type TabType = 'search' | 'recents' | 'favorites' | 'manual';

export const NutritionLogModal: React.FC<NutritionLogModalProps> = ({
  visible,
  mealType,
  logToEdit,
  isLoading = false,
  onClose,
  onSave,
}) => {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const favoriteMeals = useAppStore(state => state.favoriteMeals) || [];
  const recentMeals = useAppStore(state => state.recentMeals) || [];
  const deleteFavoriteMeal = useAppStore(state => state.deleteFavoriteMeal);

  const [activeTab, setActiveTab] = useState<TabType>(logToEdit ? 'manual' : 'search');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Selected food for adjusting weight before adding
  const [selectedFoodForDetail, setSelectedFoodForDetail] = useState<any | null>(null);
  const [detailWeight, setDetailWeight] = useState('100');

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    description: '',
    weight_g: '100',
    calories: '',
    protein_g: '',
    carbs_g: '',
    fats_g: '',
    sugars_g: '',
    isFavorite: false,
    image_url: '',
  });
  const [isPer100g, setIsPer100g] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Initialize editing state
  useEffect(() => {
    if (visible) {
      if (logToEdit) {
        setActiveTab('manual');
        setManualForm({
          description: logToEdit.description || '',
          weight_g: String(logToEdit.weight_g || 100),
          calories: String(logToEdit.calories || ''),
          protein_g: String(logToEdit.protein_g || ''),
          carbs_g: String(logToEdit.carbs_g || ''),
          fats_g: String(logToEdit.fats_g || ''),
          sugars_g: String(logToEdit.sugars_g || logToEdit.sugar_g || ''),
          isFavorite: false,
          image_url: logToEdit.image_url || '',
        });
        setIsPer100g(false);
      } else {
        setActiveTab('search');
        setSearchTerm('');
        setSearchResults([]);
        setSelectedFoodForDetail(null);
        setManualForm({
          description: '',
          weight_g: '100',
          calories: '',
          protein_g: '',
          carbs_g: '',
          fats_g: '',
          sugars_g: '',
          isFavorite: false,
          image_url: '',
        });
        setIsPer100g(false);
      }
    }
  }, [visible, logToEdit]);

  const mealTitles: Record<string, string> = {
    breakfast: 'Desayuno',
    lunch: 'Almuerzo',
    dinner: 'Cena',
    snack: 'Snacks',
  };

  const getFullImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('file://')) return url;
    return `${BACKEND_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Search Foods API
  const handleSearch = async (text: string) => {
    setSearchTerm(text);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await nutritionService.searchFoods(text.trim());
      setSearchResults(Array.isArray(results) ? results : []);
    } catch (e) {
      console.warn('Error searching foods:', e);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Image Picker
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setIsUploadingImage(true);

        try {
          const fileData = {
            uri: asset.uri,
            name: asset.fileName || 'food.jpg',
            type: asset.mimeType || 'image/jpeg',
          };
          const uploadRes = await nutritionService.uploadFoodImage(fileData as any);
          if (uploadRes && uploadRes.imageUrl) {
            setManualForm(prev => ({ ...prev, image_url: uploadRes.imageUrl }));
          } else {
            setManualForm(prev => ({ ...prev, image_url: asset.uri }));
          }
        } catch (uploadError) {
          // Fallback to local URI
          setManualForm(prev => ({ ...prev, image_url: asset.uri }));
        } finally {
          setIsUploadingImage(false);
        }
      }
    } catch (err) {
      console.warn('Error picking image:', err);
      setIsUploadingImage(false);
    }
  };

  // Detail item weight adjustment calculations
  const calculatedDetailMacros = useMemo(() => {
    if (!selectedFoodForDetail) return null;

    const w = parseFloat(detailWeight) || 0;
    const baseW = parseFloat(selectedFoodForDetail.weight_g) || 100;
    const factor = baseW > 0 ? w / baseW : 1;

    const rawCal = selectedFoodForDetail.calories_per_100g
      ? (parseFloat(selectedFoodForDetail.calories_per_100g) * w) / 100
      : (parseFloat(selectedFoodForDetail.calories) || 0) * factor;

    const rawProt = selectedFoodForDetail.protein_per_100g
      ? (parseFloat(selectedFoodForDetail.protein_per_100g) * w) / 100
      : (parseFloat(selectedFoodForDetail.protein_g || selectedFoodForDetail.protein) || 0) * factor;

    const rawCarbs = selectedFoodForDetail.carbs_per_100g
      ? (parseFloat(selectedFoodForDetail.carbs_per_100g) * w) / 100
      : (parseFloat(selectedFoodForDetail.carbs_g || selectedFoodForDetail.carbs) || 0) * factor;

    const rawFats = selectedFoodForDetail.fat_per_100g || selectedFoodForDetail.fats_per_100g
      ? (parseFloat(selectedFoodForDetail.fat_per_100g || selectedFoodForDetail.fats_per_100g) * w) / 100
      : (parseFloat(selectedFoodForDetail.fats_g || selectedFoodForDetail.fat) || 0) * factor;

    const rawSugars = selectedFoodForDetail.sugars_per_100g
      ? (parseFloat(selectedFoodForDetail.sugars_per_100g) * w) / 100
      : (parseFloat(selectedFoodForDetail.sugars_g || selectedFoodForDetail.sugar_g) || 0) * factor;

    return {
      calories: Math.round(rawCal),
      protein_g: parseFloat(rawProt.toFixed(1)),
      carbs_g: parseFloat(rawCarbs.toFixed(1)),
      fats_g: parseFloat(rawFats.toFixed(1)),
      sugars_g: parseFloat(rawSugars.toFixed(1)),
    };
  }, [selectedFoodForDetail, detailWeight]);

  // Add food from detail view
  const handleAddFromDetail = async () => {
    if (!selectedFoodForDetail || !calculatedDetailMacros) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const payload = {
      description: selectedFoodForDetail.description || selectedFoodForDetail.name,
      calories: calculatedDetailMacros.calories,
      protein_g: calculatedDetailMacros.protein_g,
      carbs_g: calculatedDetailMacros.carbs_g,
      fats_g: calculatedDetailMacros.fats_g,
      sugars_g: calculatedDetailMacros.sugars_g,
      weight_g: parseFloat(detailWeight) || 100,
      image_url: selectedFoodForDetail.image_url,
      meal_type: mealType,
      saveAsFavorite: selectedFoodForDetail.isFavorite || false,
    };

    await onSave(payload);
    setSelectedFoodForDetail(null);
  };

  // Add directly from item
  const handleQuickAddItem = async (item: any) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const payload = {
      description: item.description || item.name,
      calories: Math.round(parseFloat(item.calories) || 0),
      protein_g: parseFloat(item.protein_g || item.protein || 0),
      carbs_g: parseFloat(item.carbs_g || item.carbs || 0),
      fats_g: parseFloat(item.fats_g || item.fat || 0),
      sugars_g: parseFloat(item.sugars_g || item.sugar_g || 0),
      weight_g: parseFloat(item.weight_g) || 100,
      image_url: item.image_url,
      meal_type: mealType,
    };

    await onSave(payload);
  };

  // Submit Manual Form
  const handleSubmitManual = async () => {
    if (!manualForm.description.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa el nombre del alimento.');
      return;
    }

    const weight = parseFloat(manualForm.weight_g) || 100;
    let finalCal = parseFloat(manualForm.calories) || 0;
    let finalProt = parseFloat(manualForm.protein_g) || 0;
    let finalCarbs = parseFloat(manualForm.carbs_g) || 0;
    let finalFats = parseFloat(manualForm.fats_g) || 0;
    let finalSugars = parseFloat(manualForm.sugars_g) || 0;

    if (isPer100g) {
      finalCal = (finalCal * weight) / 100;
      finalProt = (finalProt * weight) / 100;
      finalCarbs = (finalCarbs * weight) / 100;
      finalFats = (finalFats * weight) / 100;
      finalSugars = (finalSugars * weight) / 100;
    }

    const payload = {
      description: manualForm.description.trim(),
      calories: Math.round(finalCal),
      protein_g: parseFloat(finalProt.toFixed(1)),
      carbs_g: parseFloat(finalCarbs.toFixed(1)),
      fats_g: parseFloat(finalFats.toFixed(1)),
      sugars_g: parseFloat(finalSugars.toFixed(1)),
      weight_g: weight,
      image_url: manualForm.image_url || undefined,
      meal_type: mealType,
      saveAsFavorite: manualForm.isFavorite,
    };

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    await onSave(payload);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={StyleSheet.absoluteFill}
        >
          <Pressable
            style={[
              StyleSheet.absoluteFill,
              {
                justifyContent: 'flex-end',
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.25)',
              },
            ]}
            onPress={onClose}
          >
            <Pressable
              onPress={e => e.stopPropagation()}
              style={[
                styles.sheetWrapper,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderBottomWidth: 0,
                },
              ]}
            >
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.sheetContent}>
                {/* Drag pill handle */}
                <View
                  style={[
                    styles.dragPill,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)' },
                  ]}
                />

                {/* Header */}
                <View style={styles.headerRow}>
                  <View>
                    <Text style={[styles.sheetTitle, { color: colors.text }]}>
                      {logToEdit ? 'Editar Comida' : `Añadir a ${mealTitles[mealType] || 'Comida'}`}
                    </Text>
                    <Text style={[styles.sheetSubtitle, { color: colors.textMuted }]}>
                      {logToEdit ? 'Modifica los valores' : 'Busca o ingresa manualmente'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={[
                      styles.closeBtn,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                        borderColor: colors.border,
                        borderWidth: 1,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <X size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* DETAIL / CUSTOMIZE WEIGHT SUBVIEW */}
                {selectedFoodForDetail && calculatedDetailMacros ? (
                  <ScrollView style={styles.tabBody} contentContainerStyle={{ paddingBottom: 24 }}>
                    <TouchableOpacity
                      onPress={() => setSelectedFoodForDetail(null)}
                      style={styles.backRow}
                      activeOpacity={0.7}
                    >
                      <X size={16} color={colors.tint} />
                      <Text style={[styles.backText, { color: colors.tint }]}>Cancelar selección</Text>
                    </TouchableOpacity>

                    <Text style={[styles.detailFoodTitle, { color: colors.text }]}>
                      {selectedFoodForDetail.description || selectedFoodForDetail.name}
                    </Text>

                    {/* Weight Input Box */}
                    <View
                      style={[
                        styles.weightCard,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.weightHeader}>
                        <Scale size={16} color={colors.tint} />
                        <Text style={[styles.weightTitle, { color: colors.textSecondary }]}>
                          PESO DE LA PORCIÓN
                        </Text>
                      </View>
                      <View style={styles.weightInputRow}>
                        <TextInput
                          value={detailWeight}
                          onChangeText={setDetailWeight}
                          keyboardType="numeric"
                          style={[styles.weightInput, { color: colors.text }]}
                          placeholder="100"
                          placeholderTextColor={colors.textMuted}
                        />
                        <Text style={[styles.weightUnit, { color: colors.textSecondary }]}>gramos</Text>
                      </View>
                    </View>

                    {/* Recalculated Macros Preview */}
                    <View style={styles.recalcGrid}>
                      <View
                        style={[
                          styles.recalcCard,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.6)',
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.recalcSub, { color: colors.textMuted }]}>CALORÍAS</Text>
                        <Text style={[styles.recalcVal, { color: colors.tint }]}>
                          {calculatedDetailMacros.calories}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.recalcCard,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.6)',
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.recalcSub, { color: '#ef4444' }]}>PROT</Text>
                        <Text style={[styles.recalcVal, { color: '#ef4444' }]}>
                          {calculatedDetailMacros.protein_g}g
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.recalcCard,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.6)',
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.recalcSub, { color: '#3b82f6' }]}>CARB</Text>
                        <Text style={[styles.recalcVal, { color: '#3b82f6' }]}>
                          {calculatedDetailMacros.carbs_g}g
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.recalcCard,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.6)',
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.recalcSub, { color: '#22c55e' }]}>GRAS</Text>
                        <Text style={[styles.recalcVal, { color: '#22c55e' }]}>
                          {calculatedDetailMacros.fats_g}g
                        </Text>
                      </View>
                    </View>

                    {/* Add Button */}
                    <TouchableOpacity
                      onPress={handleAddFromDetail}
                      disabled={isLoading}
                      style={[
                        styles.primaryActionBtn,
                        { backgroundColor: colors.tint, opacity: isLoading ? 0.6 : 1 },
                      ]}
                      activeOpacity={0.85}
                    >
                      {isLoading ? (
                        <ActivityIndicator color={getContrastTextColor(colors.tint)} />
                      ) : (
                        <Text style={[styles.primaryActionText, { color: getContrastTextColor(colors.tint) }]}>
                          Añadir al Registro
                        </Text>
                      )}
                    </TouchableOpacity>
                  </ScrollView>
                ) : (
                  <>
                    {/* TABS SWITCHER (Only if not editing) */}
                    {!logToEdit && (
                      <View
                        style={[
                          styles.tabNav,
                          {
                            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.05)',
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            try {
                              Haptics.selectionAsync();
                            } catch {}
                            setActiveTab('search');
                          }}
                          style={[
                            styles.tabItem,
                            activeTab === 'search' && {
                              backgroundColor: colors.tint,
                            },
                          ]}
                          activeOpacity={0.8}
                        >
                          <Search
                            size={14}
                            color={activeTab === 'search' ? getContrastTextColor(colors.tint) : colors.textMuted}
                          />
                          <Text
                            style={[
                              styles.tabText,
                              {
                                color: activeTab === 'search' ? getContrastTextColor(colors.tint) : colors.textSecondary,
                              },
                            ]}
                          >
                            Buscar
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            try {
                              Haptics.selectionAsync();
                            } catch {}
                            setActiveTab('recents');
                          }}
                          style={[
                            styles.tabItem,
                            activeTab === 'recents' && {
                              backgroundColor: colors.tint,
                            },
                          ]}
                          activeOpacity={0.8}
                        >
                          <Clock
                            size={14}
                            color={activeTab === 'recents' ? getContrastTextColor(colors.tint) : colors.textMuted}
                          />
                          <Text
                            style={[
                              styles.tabText,
                              {
                                color: activeTab === 'recents' ? getContrastTextColor(colors.tint) : colors.textSecondary,
                              },
                            ]}
                          >
                            Recientes
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            try {
                              Haptics.selectionAsync();
                            } catch {}
                            setActiveTab('favorites');
                          }}
                          style={[
                            styles.tabItem,
                            activeTab === 'favorites' && {
                              backgroundColor: colors.tint,
                            },
                          ]}
                          activeOpacity={0.8}
                        >
                          <Star
                            size={14}
                            color={activeTab === 'favorites' ? getContrastTextColor(colors.tint) : colors.textMuted}
                          />
                          <Text
                            style={[
                              styles.tabText,
                              {
                                color: activeTab === 'favorites' ? getContrastTextColor(colors.tint) : colors.textSecondary,
                              },
                            ]}
                          >
                            Favoritos
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            try {
                              Haptics.selectionAsync();
                            } catch {}
                            setActiveTab('manual');
                          }}
                          style={[
                            styles.tabItem,
                            activeTab === 'manual' && {
                              backgroundColor: colors.tint,
                            },
                          ]}
                          activeOpacity={0.8}
                        >
                          <Edit3
                            size={14}
                            color={activeTab === 'manual' ? getContrastTextColor(colors.tint) : colors.textMuted}
                          />
                          <Text
                            style={[
                              styles.tabText,
                              {
                                color: activeTab === 'manual' ? getContrastTextColor(colors.tint) : colors.textSecondary,
                              },
                            ]}
                          >
                            Manual
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* FIXED SEARCH BAR (Pinned right under tabs when on search tab) */}
                    {!selectedFoodForDetail && activeTab === 'search' && !logToEdit && (
                      <View
                        style={[
                          styles.searchBar,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.8)',
                            borderColor: colors.border,
                            marginBottom: 12,
                          },
                        ]}
                      >
                        <Search size={18} color={colors.textSecondary} />
                        <TextInput
                          value={searchTerm}
                          onChangeText={handleSearch}
                          onSubmitEditing={() => handleSearch(searchTerm)}
                          style={[styles.searchInput, { color: colors.text }]}
                          placeholder="Buscar alimento (ej: Arroz, Huevo, Pollo)..."
                          placeholderTextColor={colors.textMuted}
                          returnKeyType="search"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                        {searchTerm.length > 0 && (
                          <TouchableOpacity
                            onPress={() => handleSearch('')}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <X size={16} color={colors.textMuted} />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {/* TAB CONTENT */}
                    <ScrollView
                      style={styles.tabBody}
                      contentContainerStyle={{ paddingBottom: 36 }}
                      keyboardShouldPersistTaps="handled"
                      keyboardDismissMode="on-drag"
                    >
                      {/* TAB 1: BUSCAR */}
                      {activeTab === 'search' && (
                        <View style={styles.searchSection}>
                          {isSearching ? (
                            <ActivityIndicator size="small" color={colors.tint} style={{ marginVertical: 24 }} />
                          ) : searchResults.length > 0 ? (
                            <View style={styles.resultsList}>
                              {searchResults.map((item, idx) => {
                                const img = getFullImageUrl(item.image_url);
                                return (
                                  <TouchableOpacity
                                    key={item.id || idx}
                                    onPress={() => {
                                      setSelectedFoodForDetail(item);
                                      setDetailWeight(String(item.weight_g || 100));
                                    }}
                                    style={[
                                      styles.foodItemRow,
                                      {
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.65)',
                                        borderColor: colors.border,
                                      },
                                    ]}
                                    activeOpacity={0.7}
                                  >
                                    <View
                                      style={[
                                        styles.itemThumb,
                                        {
                                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                          borderColor: colors.border,
                                          borderWidth: 1,
                                        },
                                      ]}
                                    >
                                      {img ? (
                                        <Image source={{ uri: img }} style={styles.itemThumbImg} resizeMode="cover" />
                                      ) : (
                                        <Utensils size={18} color={colors.textMuted} />
                                      )}
                                    </View>

                                    <View style={styles.itemMid}>
                                      <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                                        {item.description || item.name}
                                      </Text>
                                      <Text style={[styles.itemSub, { color: colors.textMuted }]}>
                                        {Math.round(item.calories)} kcal • {item.weight_g || 100}g
                                      </Text>
                                    </View>

                                    <TouchableOpacity
                                      onPress={() => handleQuickAddItem(item)}
                                      style={[styles.quickAddBtn, { backgroundColor: colors.tint + '18' }]}
                                      activeOpacity={0.7}
                                    >
                                      <Plus size={16} color={colors.tint} />
                                    </TouchableOpacity>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          ) : searchTerm.trim().length >= 2 ? (
                            <Text style={[styles.emptyTabMsg, { color: colors.textMuted }]}>
                              No se encontraron alimentos para "{searchTerm}". Puedes añadirlo manualmente.
                            </Text>
                          ) : (
                            <Text style={[styles.emptyTabMsg, { color: colors.textMuted }]}>
                              Escribe para buscar en la base de datos de nutrición.
                            </Text>
                          )}
                        </View>
                      )}

                      {/* TAB 2: RECIENTES */}
                      {activeTab === 'recents' && (
                        <View style={styles.recentsSection}>
                          {recentMeals.length > 0 ? (
                            <View style={styles.resultsList}>
                              {recentMeals.map((item: any, idx: number) => {
                                const img = getFullImageUrl(item.image_url);
                                return (
                                  <TouchableOpacity
                                    key={item.id || idx}
                                    onPress={() => {
                                      setSelectedFoodForDetail(item);
                                      setDetailWeight(String(item.weight_g || 100));
                                    }}
                                    style={[
                                      styles.foodItemRow,
                                      {
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.65)',
                                        borderColor: colors.border,
                                      },
                                    ]}
                                    activeOpacity={0.7}
                                  >
                                    <View
                                      style={[
                                        styles.itemThumb,
                                        {
                                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                          borderColor: colors.border,
                                          borderWidth: 1,
                                        },
                                      ]}
                                    >
                                      {img ? (
                                        <Image source={{ uri: img }} style={styles.itemThumbImg} resizeMode="cover" />
                                      ) : (
                                        <Utensils size={18} color={colors.textMuted} />
                                      )}
                                    </View>

                                    <View style={styles.itemMid}>
                                      <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                                        {item.description || item.name}
                                      </Text>
                                      <Text style={[styles.itemSub, { color: colors.textMuted }]}>
                                        {Math.round(item.calories)} kcal • {item.weight_g || 100}g
                                      </Text>
                                    </View>

                                    <TouchableOpacity
                                      onPress={() => handleQuickAddItem(item)}
                                      style={[styles.quickAddBtn, { backgroundColor: colors.tint + '18' }]}
                                      activeOpacity={0.7}
                                    >
                                      <Plus size={16} color={colors.tint} />
                                    </TouchableOpacity>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          ) : (
                            <Text style={[styles.emptyTabMsg, { color: colors.textMuted }]}>
                              Aún no tienes comidas recientes registradas.
                            </Text>
                          )}
                        </View>
                      )}

                      {/* TAB 3: FAVORITOS */}
                      {activeTab === 'favorites' && (
                        <View style={styles.favoritesSection}>
                          {favoriteMeals.length > 0 ? (
                            <View style={styles.resultsList}>
                              {favoriteMeals.map((item: any) => {
                                const img = getFullImageUrl(item.image_url);
                                return (
                                  <TouchableOpacity
                                    key={item.id}
                                    onPress={() => {
                                      setSelectedFoodForDetail(item);
                                      setDetailWeight(String(item.weight_g || 100));
                                    }}
                                    style={[
                                      styles.foodItemRow,
                                      {
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.65)',
                                        borderColor: colors.border,
                                      },
                                    ]}
                                    activeOpacity={0.7}
                                  >
                                    <View
                                      style={[
                                        styles.itemThumb,
                                        {
                                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                          borderColor: colors.border,
                                          borderWidth: 1,
                                        },
                                      ]}
                                    >
                                      {img ? (
                                        <Image source={{ uri: img }} style={styles.itemThumbImg} resizeMode="cover" />
                                      ) : (
                                        <Utensils size={18} color={colors.textMuted} />
                                      )}
                                    </View>

                                    <View style={styles.itemMid}>
                                      <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                                        {item.name || item.description}
                                      </Text>
                                      <Text style={[styles.itemSub, { color: colors.textMuted }]}>
                                        {Math.round(item.calories)} kcal • {item.weight_g || 100}g
                                      </Text>
                                    </View>

                                    <View style={styles.favActions}>
                                      <TouchableOpacity
                                        onPress={async () => {
                                          try {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            await deleteFavoriteMeal(item.id);
                                          } catch {}
                                        }}
                                        style={styles.delFavBtn}
                                        activeOpacity={0.7}
                                      >
                                        <Trash2 size={16} color="#ef4444" />
                                      </TouchableOpacity>

                                      <TouchableOpacity
                                        onPress={() => handleQuickAddItem(item)}
                                        style={[styles.quickAddBtn, { backgroundColor: colors.tint + '18' }]}
                                        activeOpacity={0.7}
                                      >
                                        <Plus size={16} color={colors.tint} />
                                      </TouchableOpacity>
                                    </View>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          ) : (
                            <Text style={[styles.emptyTabMsg, { color: colors.textMuted }]}>
                              No tienes alimentos guardados en favoritos.
                            </Text>
                          )}
                        </View>
                      )}

                      {/* TAB 4: MANUAL */}
                      {activeTab === 'manual' && (
                        <View style={styles.manualFormSection}>
                          {/* Food Name */}
                          <View style={styles.formGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                              NOMBRE DEL ALIMENTO *
                            </Text>
                            <TextInput
                              value={manualForm.description}
                              onChangeText={val => setManualForm(prev => ({ ...prev, description: val }))}
                              style={[
                                styles.textInput,
                                {
                                  color: colors.text,
                                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)',
                                  borderColor: colors.border,
                                },
                              ]}
                              placeholder="Ej: Pechuga de pollo a la plancha"
                              placeholderTextColor={colors.textMuted}
                            />
                          </View>

                          {/* Weight & Per 100g toggle */}
                          <View style={styles.weightAndToggleRow}>
                            <View style={[styles.formGroup, { flex: 1 }]}>
                              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PESO (G)</Text>
                              <TextInput
                                value={manualForm.weight_g}
                                onChangeText={val => setManualForm(prev => ({ ...prev, weight_g: val }))}
                                keyboardType="numeric"
                                style={[
                                  styles.textInput,
                                  {
                                    color: colors.text,
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)',
                                    borderColor: colors.border,
                                  },
                                ]}
                                placeholder="100"
                                placeholderTextColor={colors.textMuted}
                              />
                            </View>

                            <View style={styles.per100gToggleBox}>
                              <Text style={[styles.per100gText, { color: colors.textSecondary }]}>
                                Valores por 100g
                              </Text>
                              <Switch
                                value={isPer100g}
                                onValueChange={setIsPer100g}
                                trackColor={{ false: isDark ? '#333' : '#ccc', true: colors.tint }}
                              />
                            </View>
                          </View>

                          {/* Calories Input */}
                          <View style={styles.formGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                              CALORÍAS (KCAL) *
                            </Text>
                            <TextInput
                              value={manualForm.calories}
                              onChangeText={val => setManualForm(prev => ({ ...prev, calories: val }))}
                              keyboardType="numeric"
                              style={[
                                styles.textInput,
                                {
                                  color: colors.text,
                                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)',
                                  borderColor: colors.border,
                                },
                              ]}
                              placeholder="Ej: 250"
                              placeholderTextColor={colors.textMuted}
                            />
                          </View>

                          {/* Macros Row: Protein, Carbs, Fats, Sugar */}
                          <View style={styles.macroInputsRow}>
                            <View style={[styles.formGroup, { flex: 1 }]}>
                              <Text style={[styles.macroInputLabel, { color: '#ef4444' }]}>PROT (G)</Text>
                              <TextInput
                                value={manualForm.protein_g}
                                onChangeText={val => setManualForm(prev => ({ ...prev, protein_g: val }))}
                                keyboardType="numeric"
                                style={[
                                  styles.macroTextInput,
                                  {
                                    color: colors.text,
                                    borderColor: 'rgba(239, 68, 68, 0.3)',
                                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.03)',
                                  },
                                ]}
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                              />
                            </View>

                            <View style={[styles.formGroup, { flex: 1 }]}>
                              <Text style={[styles.macroInputLabel, { color: '#3b82f6' }]}>CARB (G)</Text>
                              <TextInput
                                value={manualForm.carbs_g}
                                onChangeText={val => setManualForm(prev => ({ ...prev, carbs_g: val }))}
                                keyboardType="numeric"
                                style={[
                                  styles.macroTextInput,
                                  {
                                    color: colors.text,
                                    borderColor: 'rgba(59, 130, 246, 0.3)',
                                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.03)',
                                  },
                                ]}
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                              />
                            </View>

                            <View style={[styles.formGroup, { flex: 1 }]}>
                              <Text style={[styles.macroInputLabel, { color: '#22c55e' }]}>GRAS (G)</Text>
                              <TextInput
                                value={manualForm.fats_g}
                                onChangeText={val => setManualForm(prev => ({ ...prev, fats_g: val }))}
                                keyboardType="numeric"
                                style={[
                                  styles.macroTextInput,
                                  {
                                    color: colors.text,
                                    borderColor: 'rgba(34, 197, 94, 0.3)',
                                    backgroundColor: isDark ? 'rgba(34, 197, 94, 0.05)' : 'rgba(34, 197, 94, 0.03)',
                                  },
                                ]}
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                              />
                            </View>

                            <View style={[styles.formGroup, { flex: 1 }]}>
                              <Text style={[styles.macroInputLabel, { color: '#ec4899' }]}>AZÚC (G)</Text>
                              <TextInput
                                value={manualForm.sugars_g}
                                onChangeText={val => setManualForm(prev => ({ ...prev, sugars_g: val }))}
                                keyboardType="numeric"
                                style={[
                                  styles.macroTextInput,
                                  {
                                    color: colors.text,
                                    borderColor: 'rgba(236, 72, 153, 0.3)',
                                    backgroundColor: isDark ? 'rgba(236, 72, 153, 0.05)' : 'rgba(236, 72, 153, 0.03)',
                                  },
                                ]}
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                              />
                            </View>
                          </View>

                          {/* Image picker row */}
                          <View style={styles.imagePickerRow}>
                            <TouchableOpacity
                              onPress={handlePickImage}
                              disabled={isUploadingImage}
                              style={[
                                styles.pickImgBtn,
                                {
                                  borderColor: colors.border,
                                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.6)',
                                },
                              ]}
                              activeOpacity={0.7}
                            >
                              <Camera size={18} color={colors.textSecondary} />
                              <Text style={[styles.pickImgText, { color: colors.text }]}>
                                {manualForm.image_url ? 'Cambiar Foto' : 'Añadir Foto (Opcional)'}
                              </Text>
                            </TouchableOpacity>

                            {manualForm.image_url ? (
                              <View style={styles.previewThumbContainer}>
                                <Image
                                  source={{ uri: getFullImageUrl(manualForm.image_url) || manualForm.image_url }}
                                  style={styles.previewThumb}
                                  resizeMode="cover"
                                />
                                <TouchableOpacity
                                  onPress={() => setManualForm(prev => ({ ...prev, image_url: '' }))}
                                  style={styles.delThumbBtn}
                                >
                                  <X size={12} color="#ffffff" />
                                </TouchableOpacity>
                              </View>
                            ) : null}
                          </View>

                          {/* Save as favorite toggle (if not editing) */}
                          {!logToEdit && (
                            <TouchableOpacity
                              onPress={() => setManualForm(prev => ({ ...prev, isFavorite: !prev.isFavorite }))}
                              style={[
                                styles.favToggleRow,
                                {
                                  backgroundColor: manualForm.isFavorite
                                    ? colors.tint + '15'
                                    : isDark
                                    ? 'rgba(255, 255, 255, 0.03)'
                                    : 'rgba(0, 0, 0, 0.03)',
                                  borderColor: manualForm.isFavorite ? colors.tint + '40' : colors.border,
                                },
                              ]}
                              activeOpacity={0.7}
                            >
                              <Star
                                size={18}
                                color={manualForm.isFavorite ? colors.tint : colors.textMuted}
                                fill={manualForm.isFavorite ? colors.tint : 'transparent'}
                              />
                              <Text style={[styles.favToggleText, { color: colors.text }]}>
                                Guardar como favorito
                              </Text>
                            </TouchableOpacity>
                          )}

                          {/* Save / Update Button */}
                          <TouchableOpacity
                            onPress={handleSubmitManual}
                            disabled={isLoading}
                            style={[
                              styles.primaryActionBtn,
                              { backgroundColor: colors.tint, opacity: isLoading ? 0.6 : 1 },
                            ]}
                            activeOpacity={0.85}
                          >
                            {isLoading ? (
                              <ActivityIndicator color={getContrastTextColor(colors.tint)} />
                            ) : (
                              <Text style={[styles.primaryActionText, { color: getContrastTextColor(colors.tint) }]}>
                                {logToEdit ? 'Actualizar Comida' : 'Añadir al Registro'}
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    </ScrollView>
                  </>
                )}
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </GlassView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheetWrapper: {
    width: '100%',
    height: '92%',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: 'hidden',
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  dragPill: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabNav: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 3,
    borderWidth: 1,
    marginBottom: 14,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 13,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabBody: {
    flex: 1,
  },
  searchSection: {
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  resultsList: {
    gap: 8,
  },
  foodItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  itemThumb: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemThumbImg: {
    width: '100%',
    height: '100%',
  },
  itemMid: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  quickAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  delFavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  emptyTabMsg: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 24,
    lineHeight: 18,
  },
  recentsSection: {},
  favoritesSection: {},
  manualFormSection: {
    gap: 12,
  },
  formGroup: {
    gap: 5,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  textInput: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  weightAndToggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  per100gToggleBox: {
    alignItems: 'center',
    gap: 4,
    paddingBottom: 4,
  },
  per100gText: {
    fontSize: 10,
    fontWeight: '700',
  },
  macroInputsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroInputLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  macroTextInput: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  imagePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  pickImgBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
  },
  pickImgText: {
    fontSize: 12,
    fontWeight: '700',
  },
  previewThumbContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  previewThumb: {
    width: '100%',
    height: '100%',
  },
  delThumbBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  favToggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  primaryActionBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailFoodTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  weightCard: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
  },
  weightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  weightTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  weightInput: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  weightUnit: {
    fontSize: 14,
    fontWeight: '700',
  },
  recalcGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  recalcCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 3,
  },
  recalcSub: {
    fontSize: 9,
    fontWeight: '800',
  },
  recalcVal: {
    fontSize: 14,
    fontWeight: '800',
  },
});
