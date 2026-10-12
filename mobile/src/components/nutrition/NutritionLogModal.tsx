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
  Scale,
  Utensils,
  BookMarked,
  ArrowLeft,
  ChevronRight,
  Flame,
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

type TabType = 'search' | 'favorites' | 'recents' | 'manual';

export interface CartItem {
  tempId: string;
  name: string;
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  sugars_g: number;
  weight_g: number;
  image_url?: string;
  brand?: string;
  isFavorite?: boolean;
  origin?: 'search' | 'favorite' | 'recent' | 'manual';
  serving_weight_g?: number;
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  sugars_per_100g?: number;
}

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

  // Active tab state
  const [activeTab, setActiveTab] = useState<TabType>(logToEdit ? 'manual' : 'search');

  // Search state (Enter-only)
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Temporary cart state
  const [itemsToAdd, setItemsToAdd] = useState<CartItem[]>([]);
  const [isSubmittingCart, setIsSubmittingCart] = useState(false);

  // Detail / Weight customizer view
  const [selectedFoodForDetail, setSelectedFoodForDetail] = useState<any | null>(null);
  const [detailWeight, setDetailWeight] = useState('100');
  const [detailIsFavorite, setDetailIsFavorite] = useState(false);
  const [editingCartTempId, setEditingCartTempId] = useState<string | null>(null);

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

  // Initialize or reset when modal opens / closes / editing changes
  useEffect(() => {
    if (visible) {
      if (logToEdit) {
        setActiveTab('manual');
        setItemsToAdd([]);
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
        setSelectedFoodForDetail(null);
      } else {
        setActiveTab('search');
        setSearchTerm('');
        setSearchResults([]);
        setHasSearched(false);
        setItemsToAdd([]);
        setSelectedFoodForDetail(null);
        setEditingCartTempId(null);
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

  // ==================== SEARCH (ENTER-ONLY) ====================
  const executeSearch = async () => {
    const trimmed = searchTerm.trim();
    if (trimmed.length < 3) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    setIsSearching(true);
    setHasSearched(true);

    try {
      const results = await nutritionService.searchFoods(trimmed);
      setSearchResults(Array.isArray(results) ? results : []);
    } catch (error) {
      console.warn('Error buscando alimentos:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchTextChange = (text: string) => {
    setSearchTerm(text);
    if (!text.trim()) {
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  // ==================== DETAIL / WEIGHT CALCULATION ====================
  const baseDetailValues = useMemo(() => {
    if (!selectedFoodForDetail) return null;
    const food = selectedFoodForDetail;
    const refWeight = parseFloat(food.weight_g) || 100;

    const getBase = (per100Key: string, totalKeyVal: any) => {
      if (food[per100Key] !== undefined && food[per100Key] !== null) {
        return parseFloat(food[per100Key]) || 0;
      }
      return ((parseFloat(totalKeyVal) || 0) / refWeight) * 100;
    };

    return {
      calories: getBase('calories_per_100g', food.calories),
      protein: getBase('protein_per_100g', food.protein_g || food.protein),
      carbs: getBase('carbs_per_100g', food.carbs_g || food.carbs),
      fat: getBase('fat_per_100g', food.fats_g || food.fat || food.fats_per_100g),
      sugars: getBase('sugars_per_100g', food.sugars_g || food.sugars || food.sugar_g),
    };
  }, [selectedFoodForDetail]);

  const calculatedDetailMacros = useMemo(() => {
    if (!selectedFoodForDetail || !baseDetailValues) return null;
    const w = parseFloat(detailWeight) || 0;
    return {
      calories: Math.round((baseDetailValues.calories * w) / 100),
      protein_g: parseFloat(((baseDetailValues.protein * w) / 100).toFixed(1)),
      carbs_g: parseFloat(((baseDetailValues.carbs * w) / 100).toFixed(1)),
      fats_g: parseFloat(((baseDetailValues.fat * w) / 100).toFixed(1)),
      sugars_g: parseFloat(((baseDetailValues.sugars * w) / 100).toFixed(1)),
    };
  }, [selectedFoodForDetail, baseDetailValues, detailWeight]);

  // Open detail view for weight adjustment
  const handleOpenDetail = (food: any, cartTempId?: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}

    const defaultW = food.weight_g
      ? String(food.weight_g)
      : food.serving_weight_g && food.serving_weight_g > 0
      ? String(food.serving_weight_g)
      : '100';

    setSelectedFoodForDetail(food);
    setDetailWeight(defaultW);
    setDetailIsFavorite(Boolean(food.isFavorite));
    setEditingCartTempId(cartTempId || null);
  };

  // Add / Save from Detail view into cart or update single item
  const handleSaveFromDetail = async () => {
    if (!selectedFoodForDetail || !calculatedDetailMacros) return;
    const w = parseFloat(detailWeight) || 100;

    if (logToEdit) {
      // Editing existing single food
      const payload = {
        description: selectedFoodForDetail.description || selectedFoodForDetail.name,
        calories: calculatedDetailMacros.calories,
        protein_g: calculatedDetailMacros.protein_g,
        carbs_g: calculatedDetailMacros.carbs_g,
        fats_g: calculatedDetailMacros.fats_g,
        sugars_g: calculatedDetailMacros.sugars_g,
        weight_g: w,
        image_url: selectedFoodForDetail.image_url,
        meal_type: mealType,
        saveAsFavorite: detailIsFavorite,
      };
      await onSave(payload);
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    if (editingCartTempId) {
      // Update existing item in cart
      setItemsToAdd(prev =>
        prev.map(item =>
          item.tempId === editingCartTempId
            ? {
                ...item,
                calories: calculatedDetailMacros.calories,
                protein_g: calculatedDetailMacros.protein_g,
                carbs_g: calculatedDetailMacros.carbs_g,
                fats_g: calculatedDetailMacros.fats_g,
                sugars_g: calculatedDetailMacros.sugars_g,
                weight_g: w,
                isFavorite: detailIsFavorite,
              }
            : item
        )
      );
    } else {
      // Add new item to temporary cart
      const newItem: CartItem = {
        tempId: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: selectedFoodForDetail.name || selectedFoodForDetail.description || 'Alimento',
        description: selectedFoodForDetail.description || selectedFoodForDetail.name || 'Alimento',
        calories: calculatedDetailMacros.calories,
        protein_g: calculatedDetailMacros.protein_g,
        carbs_g: calculatedDetailMacros.carbs_g,
        fats_g: calculatedDetailMacros.fats_g,
        sugars_g: calculatedDetailMacros.sugars_g,
        weight_g: w,
        image_url: selectedFoodForDetail.image_url,
        brand: selectedFoodForDetail.brand,
        isFavorite: detailIsFavorite,
        origin: activeTab as any,
        serving_weight_g: selectedFoodForDetail.serving_weight_g,
        calories_per_100g: baseDetailValues?.calories,
        protein_per_100g: baseDetailValues?.protein,
        carbs_per_100g: baseDetailValues?.carbs,
        fat_per_100g: baseDetailValues?.fat,
        sugars_per_100g: baseDetailValues?.sugars,
      };
      setItemsToAdd(prev => [...prev, newItem]);
    }

    setSelectedFoodForDetail(null);
    setEditingCartTempId(null);
  };

  // Quick Add (directly stages with default 100g or serving weight)
  const handleQuickAdd = (food: any, origin: 'search' | 'favorite' | 'recent') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const defaultW = parseFloat(food.weight_g) || parseFloat(food.serving_weight_g) || 100;
    const refWeight = parseFloat(food.weight_g) || 100;
    const factor = defaultW / refWeight;

    const newItem: CartItem = {
      tempId: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: food.name || food.description || 'Alimento',
      description: food.description || food.name || 'Alimento',
      calories: Math.round((parseFloat(food.calories) || 0) * factor),
      protein_g: parseFloat(((parseFloat(food.protein_g || food.protein) || 0) * factor).toFixed(1)),
      carbs_g: parseFloat(((parseFloat(food.carbs_g || food.carbs) || 0) * factor).toFixed(1)),
      fats_g: parseFloat(((parseFloat(food.fats_g || food.fat) || 0) * factor).toFixed(1)),
      sugars_g: parseFloat(((parseFloat(food.sugars_g || food.sugar_g) || 0) * factor).toFixed(1)),
      weight_g: defaultW,
      image_url: food.image_url,
      brand: food.brand,
      isFavorite: food.isFavorite || false,
      origin,
      serving_weight_g: food.serving_weight_g,
      calories_per_100g: food.calories_per_100g,
      protein_per_100g: food.protein_per_100g,
      carbs_per_100g: food.carbs_per_100g,
      fat_per_100g: food.fat_per_100g || food.fats_per_100g,
      sugars_per_100g: food.sugars_per_100g,
    };

    setItemsToAdd(prev => [...prev, newItem]);
  };

  // Cart operations
  const handleRemoveCartItem = (tempId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setItemsToAdd(prev => prev.filter(item => item.tempId !== tempId));
  };

  const handleToggleCartFavorite = (tempId: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setItemsToAdd(prev =>
      prev.map(item => (item.tempId === tempId ? { ...item, isFavorite: !item.isFavorite } : item))
    );
  };

  const handleSaveAllCart = async () => {
    if (itemsToAdd.length === 0) return;
    setIsSubmittingCart(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    try {
      await onSave(itemsToAdd);
    } finally {
      setIsSubmittingCart(false);
    }
  };

  // Total cart calories
  const totalCartCalories = useMemo(() => {
    return itemsToAdd.reduce((sum, item) => sum + (item.calories || 0), 0);
  }, [itemsToAdd]);

  // ==================== MANUAL TAB SUBMISSION ====================
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
        } catch {
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

    if (logToEdit) {
      // Editing existing single food
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
      await onSave(payload);
    } else {
      // Stage into temporary cart!
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      const newItem: CartItem = {
        tempId: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: manualForm.description.trim(),
        description: manualForm.description.trim(),
        calories: Math.round(finalCal),
        protein_g: parseFloat(finalProt.toFixed(1)),
        carbs_g: parseFloat(finalCarbs.toFixed(1)),
        fats_g: parseFloat(finalFats.toFixed(1)),
        sugars_g: parseFloat(finalSugars.toFixed(1)),
        weight_g: weight,
        image_url: manualForm.image_url || undefined,
        isFavorite: manualForm.isFavorite,
        origin: 'manual',
      };

      setItemsToAdd(prev => [...prev, newItem]);

      // Reset form so user can add another manual item
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
  };

  // Delete Favorite Handler with Confirmation
  const handleDeleteFavorite = (favItem: any) => {
    Alert.alert(
      'Eliminar de Favoritos',
      `¿Deseas eliminar "${favItem.name || favItem.description}" de tus comidas favoritas?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await deleteFavoriteMeal(favItem.id);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo eliminar el favorito.');
            }
          },
        },
      ]
    );
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
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0.25)',
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
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
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
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)' },
                  ]}
                />

                {/* Header */}
                <View style={styles.headerRow}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={[styles.sheetTitle, { color: colors.text }]} numberOfLines={1}>
                      {logToEdit ? 'Editar Comida' : `Añadir a ${mealTitles[mealType] || 'Comida'}`}
                    </Text>
                    <Text style={[styles.sheetSubtitle, { color: colors.textMuted }]}>
                      {logToEdit
                        ? 'Modifica los valores'
                        : itemsToAdd.length > 0
                        ? `${itemsToAdd.length} añadido(s) • Pulsa Guardar al finalizar`
                        : 'Busca o ingresa manualmente tus alimentos'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={[
                      styles.closeBtn,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <X size={18} color={colors.textSecondary} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                {/* ==================== SUBVIEW: FOOD DETAIL / WEIGHT CUSTOMIZER ==================== */}
                {selectedFoodForDetail && calculatedDetailMacros ? (
                  <ScrollView
                    style={styles.tabBody}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedFoodForDetail(null);
                        setEditingCartTempId(null);
                      }}
                      style={styles.backRow}
                      activeOpacity={0.7}
                    >
                      <ArrowLeft size={16} color={colors.tint} strokeWidth={2.5} />
                      <Text style={[styles.backText, { color: colors.tint }]}>Cancelar selección</Text>
                    </TouchableOpacity>

                    {/* Food Header Card */}
                    <View
                      style={[
                        styles.detailHeroCard,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.75)',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
                        },
                      ]}
                    >
                      <View style={styles.detailHeroTop}>
                        <View
                          style={[
                            styles.detailThumbLarge,
                            {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                            },
                          ]}
                        >
                          {selectedFoodForDetail.image_url ? (
                            <Image
                              source={{ uri: getFullImageUrl(selectedFoodForDetail.image_url)! }}
                              style={styles.detailThumbImg}
                              resizeMode="cover"
                            />
                          ) : (
                            <Utensils size={28} color={colors.textMuted} />
                          )}
                        </View>

                        <View style={styles.detailHeroInfo}>
                          <Text style={[styles.detailFoodTitle, { color: colors.text }]} numberOfLines={2}>
                            {selectedFoodForDetail.name || selectedFoodForDetail.description}
                          </Text>
                          {selectedFoodForDetail.brand ? (
                            <Text style={[styles.detailBrand, { color: colors.textMuted }]}>
                              {selectedFoodForDetail.brand.toUpperCase()}
                            </Text>
                          ) : null}
                        </View>

                        <TouchableOpacity
                          onPress={() => setDetailIsFavorite(prev => !prev)}
                          style={[
                            styles.detailFavBtn,
                            {
                              backgroundColor: detailIsFavorite
                                ? colors.tint + '20'
                                : isDark
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.04)',
                              borderColor: detailIsFavorite ? colors.tint + '50' : 'transparent',
                            },
                          ]}
                          activeOpacity={0.7}
                        >
                          <Star
                            size={20}
                            color={detailIsFavorite ? '#f59e0b' : colors.textMuted}
                            fill={detailIsFavorite ? '#f59e0b' : 'transparent'}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Weight Input Box */}
                    <View
                      style={[
                        styles.weightCard,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.75)',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
                        },
                      ]}
                    >
                      <View style={styles.weightHeader}>
                        <Scale size={14} color={colors.tint} strokeWidth={2.5} />
                        <Text style={[styles.weightTitle, { color: colors.textSecondary }]}>
                          CANTIDAD A CONSUMIR
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
                          selectTextOnFocus
                        />
                        <Text style={[styles.weightUnit, { color: colors.tint }]}>g</Text>
                      </View>

                      {/* Quick Weight Chips */}
                      <View style={styles.quickChipsRow}>
                        <TouchableOpacity
                          onPress={() => setDetailWeight('100')}
                          style={[
                            styles.chipBtn,
                            detailWeight === '100' && {
                              backgroundColor: colors.tint,
                              borderColor: colors.tint,
                            },
                            {
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                            },
                          ]}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              {
                                color: detailWeight === '100' ? getContrastTextColor(colors.tint) : colors.textSecondary,
                              },
                            ]}
                          >
                            100 g
                          </Text>
                        </TouchableOpacity>

                        {selectedFoodForDetail.serving_weight_g && selectedFoodForDetail.serving_weight_g !== 100 && (
                          <TouchableOpacity
                            onPress={() => setDetailWeight(String(selectedFoodForDetail.serving_weight_g))}
                            style={[
                              styles.chipBtn,
                              detailWeight === String(selectedFoodForDetail.serving_weight_g) && {
                                backgroundColor: colors.tint,
                                borderColor: colors.tint,
                              },
                              {
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                              },
                            ]}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                {
                                  color:
                                    detailWeight === String(selectedFoodForDetail.serving_weight_g)
                                      ? getContrastTextColor(colors.tint)
                                      : colors.textSecondary,
                                },
                              ]}
                            >
                              Ración ({selectedFoodForDetail.serving_weight_g}g)
                            </Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          onPress={() => setDetailWeight('150')}
                          style={[
                            styles.chipBtn,
                            detailWeight === '150' && {
                              backgroundColor: colors.tint,
                              borderColor: colors.tint,
                            },
                            {
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                            },
                          ]}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              {
                                color: detailWeight === '150' ? getContrastTextColor(colors.tint) : colors.textSecondary,
                              },
                            ]}
                          >
                            150 g
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setDetailWeight('200')}
                          style={[
                            styles.chipBtn,
                            detailWeight === '200' && {
                              backgroundColor: colors.tint,
                              borderColor: colors.tint,
                            },
                            {
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                            },
                          ]}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              {
                                color: detailWeight === '200' ? getContrastTextColor(colors.tint) : colors.textSecondary,
                              },
                            ]}
                          >
                            200 g
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Recalculated Macros Preview */}
                    <View style={styles.recalcWrapper}>
                      <View
                        style={[
                          styles.recalcCaloriesCard,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.75)',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
                          },
                        ]}
                      >
                        <Text style={[styles.recalcCalVal, { color: colors.text }]}>
                          {calculatedDetailMacros.calories}
                        </Text>
                        <Text style={[styles.recalcCalLabel, { color: colors.textMuted }]}>KCAL TOTALES</Text>
                        {baseDetailValues?.calories ? (
                          <Text style={[styles.recalcCalPer100, { color: colors.tint }]}>
                            ({Math.round(baseDetailValues.calories)} / 100g)
                          </Text>
                        ) : null}
                      </View>

                      <View style={styles.recalcMacrosGrid}>
                        <View
                          style={[
                            styles.recalcMacroPill,
                            {
                              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.05)',
                              borderColor: 'rgba(239, 68, 68, 0.25)',
                            },
                          ]}
                        >
                          <Text style={[styles.recalcMacroName, { color: '#ef4444' }]}>Proteína</Text>
                          <Text style={[styles.recalcMacroAmount, { color: '#ef4444' }]}>
                            {calculatedDetailMacros.protein_g}g
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.recalcMacroPill,
                            {
                              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)',
                              borderColor: 'rgba(59, 130, 246, 0.25)',
                            },
                          ]}
                        >
                          <Text style={[styles.recalcMacroName, { color: '#3b82f6' }]}>Carbos</Text>
                          <Text style={[styles.recalcMacroAmount, { color: '#3b82f6' }]}>
                            {calculatedDetailMacros.carbs_g}g
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.recalcMacroPill,
                            {
                              backgroundColor: isDark ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.05)',
                              borderColor: 'rgba(34, 197, 94, 0.25)',
                            },
                          ]}
                        >
                          <Text style={[styles.recalcMacroName, { color: '#22c55e' }]}>Grasas</Text>
                          <Text style={[styles.recalcMacroAmount, { color: '#22c55e' }]}>
                            {calculatedDetailMacros.fats_g}g
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.recalcMacroPill,
                            {
                              backgroundColor: isDark ? 'rgba(236, 72, 153, 0.08)' : 'rgba(236, 72, 153, 0.05)',
                              borderColor: 'rgba(236, 72, 153, 0.25)',
                            },
                          ]}
                        >
                          <Text style={[styles.recalcMacroName, { color: '#ec4899' }]}>Azúcar</Text>
                          <Text style={[styles.recalcMacroAmount, { color: '#ec4899' }]}>
                            {calculatedDetailMacros.sugars_g}g
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity
                      onPress={handleSaveFromDetail}
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
                        <View style={styles.btnRow}>
                          <Plus
                            size={18}
                            strokeWidth={2.5}
                            color={getContrastTextColor(colors.tint)}
                            style={{ marginRight: 6 }}
                          />
                          <Text style={[styles.primaryActionText, { color: getContrastTextColor(colors.tint) }]}>
                            {editingCartTempId
                              ? 'Actualizar en la Lista'
                              : logToEdit
                              ? 'Actualizar Comida'
                              : 'Añadir a la Lista'}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </ScrollView>
                ) : (
                  <>
                    {/* ==================== TABS SWITCHER ==================== */}
                    {!logToEdit && (
                      <View
                        style={[
                          styles.tabNav,
                          {
                            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.05)',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
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
                            strokeWidth={2.5}
                          />
                          <Text
                            style={[
                              styles.tabText,
                              {
                                color:
                                  activeTab === 'search'
                                    ? getContrastTextColor(colors.tint)
                                    : colors.textSecondary,
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
                          <BookMarked
                            size={14}
                            color={activeTab === 'favorites' ? getContrastTextColor(colors.tint) : colors.textMuted}
                            strokeWidth={2.5}
                          />
                          <Text
                            style={[
                              styles.tabText,
                              {
                                color:
                                  activeTab === 'favorites'
                                    ? getContrastTextColor(colors.tint)
                                    : colors.textSecondary,
                              },
                            ]}
                          >
                            Favoritas
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
                            strokeWidth={2.5}
                          />
                          <Text
                            style={[
                              styles.tabText,
                              {
                                color:
                                  activeTab === 'recents'
                                    ? getContrastTextColor(colors.tint)
                                    : colors.textSecondary,
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
                            strokeWidth={2.5}
                          />
                          <Text
                            style={[
                              styles.tabText,
                              {
                                color:
                                  activeTab === 'manual'
                                    ? getContrastTextColor(colors.tint)
                                    : colors.textSecondary,
                              },
                            ]}
                          >
                            Manual
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* SEARCH INPUT BAR (ENTER-ONLY) */}
                    {activeTab === 'search' && !logToEdit && (
                      <View
                        style={[
                          styles.searchBar,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.85)',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
                          },
                        ]}
                      >
                        <TextInput
                          value={searchTerm}
                          onChangeText={handleSearchTextChange}
                          onSubmitEditing={executeSearch}
                          returnKeyType="search"
                          style={[styles.searchInput, { color: colors.text }]}
                          placeholder="Buscar alimento (pulsa Enter)..."
                          placeholderTextColor={colors.textMuted}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />

                        {searchTerm.length > 0 && (
                          <TouchableOpacity
                            onPress={() => handleSearchTextChange('')}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={{ marginRight: 6 }}
                          >
                            <X size={16} color={colors.textMuted} />
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          onPress={executeSearch}
                          style={[
                            styles.searchActionBtn,
                            {
                              backgroundColor:
                                searchTerm.trim().length >= 3 ? colors.tint : colors.tint + '15',
                            },
                          ]}
                          activeOpacity={0.8}
                        >
                          <Search
                            size={16}
                            color={
                              searchTerm.trim().length >= 3
                                ? getContrastTextColor(colors.tint)
                                : colors.tint
                            }
                            strokeWidth={2.5}
                          />
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* ==================== TAB CONTENT ==================== */}
                    <ScrollView
                      style={styles.tabBody}
                      contentContainerStyle={{
                        paddingBottom: itemsToAdd.length > 0 ? 180 : 36,
                      }}
                      keyboardShouldPersistTaps="handled"
                      keyboardDismissMode="on-drag"
                      showsVerticalScrollIndicator={false}
                    >
                      {/* TAB 1: BUSCAR */}
                      {activeTab === 'search' && (
                        <View style={styles.searchSection}>
                          {isSearching ? (
                            <View style={styles.emptyStateBox}>
                              <ActivityIndicator size="small" color={colors.tint} />
                              <Text style={[styles.emptyStateSub, { color: colors.textMuted, marginTop: 10 }]}>
                                Buscando alimentos...
                              </Text>
                            </View>
                          ) : searchResults.length > 0 ? (
                            <View style={styles.resultsList}>
                              {searchResults.map((item, idx) => {
                                const img = getFullImageUrl(item.image_url);
                                const protein = item.protein_g || item.protein || 0;
                                const carbs = item.carbs_g || item.carbs || 0;
                                const fats = item.fats_g || item.fat || 0;
                                const sugars = item.sugars_g || item.sugar_g || 0;

                                return (
                                  <TouchableOpacity
                                    key={item.id || idx}
                                    onPress={() => handleOpenDetail(item)}
                                    style={[
                                      styles.foodItemRow,
                                      {
                                        backgroundColor: isDark
                                          ? 'rgba(255, 255, 255, 0.04)'
                                          : 'rgba(255, 255, 255, 0.75)',
                                        borderColor: isDark
                                          ? 'rgba(255, 255, 255, 0.12)'
                                          : 'rgba(0, 0, 0, 0.06)',
                                      },
                                    ]}
                                    activeOpacity={0.7}
                                  >
                                    <View
                                      style={[
                                        styles.itemThumb,
                                        {
                                          backgroundColor: isDark
                                            ? 'rgba(255, 255, 255, 0.08)'
                                            : 'rgba(0, 0, 0, 0.04)',
                                          borderColor: isDark
                                            ? 'rgba(255, 255, 255, 0.12)'
                                            : 'rgba(0, 0, 0, 0.06)',
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

                                      <View style={styles.macroPillsRow}>
                                        <View
                                          style={[
                                            styles.calBadge,
                                            {
                                              backgroundColor: isDark
                                                ? 'rgba(255, 255, 255, 0.08)'
                                                : 'rgba(0, 0, 0, 0.05)',
                                              borderColor: isDark
                                                ? 'rgba(255, 255, 255, 0.12)'
                                                : 'rgba(0, 0, 0, 0.06)',
                                            },
                                          ]}
                                        >
                                          <Text style={[styles.calBadgeText, { color: colors.text }]}>
                                            {Math.round(item.calories)} kcal
                                          </Text>
                                        </View>

                                        <Text style={[styles.macroPillMini, { color: '#ef4444' }]}>
                                          P: {parseFloat(protein).toFixed(1)}
                                        </Text>
                                        <Text style={[styles.macroPillMini, { color: '#3b82f6' }]}>
                                          C: {parseFloat(carbs).toFixed(1)}
                                        </Text>
                                        <Text style={[styles.macroPillMini, { color: '#22c55e' }]}>
                                          G: {parseFloat(fats).toFixed(1)}
                                        </Text>
                                        <Text style={[styles.macroPillMini, { color: '#ec4899' }]}>
                                          Az: {parseFloat(sugars).toFixed(1)}
                                        </Text>
                                      </View>
                                    </View>

                                    <TouchableOpacity
                                      onPress={() => handleQuickAdd(item, 'search')}
                                      style={[
                                        styles.quickAddBtn,
                                        { backgroundColor: colors.tint + '18' },
                                      ]}
                                      activeOpacity={0.7}
                                    >
                                      <Plus size={16} color={colors.tint} strokeWidth={2.5} />
                                    </TouchableOpacity>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          ) : hasSearched && searchTerm.trim().length >= 3 ? (
                            <View
                              style={[
                                styles.emptyStateBox,
                                {
                                  backgroundColor: isDark
                                    ? 'rgba(255, 255, 255, 0.03)'
                                    : 'rgba(0, 0, 0, 0.02)',
                                  borderColor: isDark
                                    ? 'rgba(255, 255, 255, 0.1)'
                                    : 'rgba(0, 0, 0, 0.05)',
                                },
                              ]}
                            >
                              <View
                                style={[
                                  styles.emptyIconCircle,
                                  {
                                    backgroundColor: isDark
                                      ? 'rgba(255, 255, 255, 0.08)'
                                      : 'rgba(0, 0, 0, 0.05)',
                                  },
                                ]}
                              >
                                <Search size={26} color={colors.textMuted} />
                              </View>
                              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Sin resultados</Text>
                              <Text style={[styles.emptyStateSub, { color: colors.textSecondary }]}>
                                No se encontraron alimentos para "{searchTerm}". Puedes añadirlo en la pestaña Manual.
                              </Text>
                            </View>
                          ) : !hasSearched && searchTerm.trim().length >= 3 ? (
                            <View style={styles.emptyStateBox}>
                              <Text style={[styles.emptyPromptText, { color: colors.textSecondary }]}>
                                Pulsa Enter o la Lupa para buscar.
                              </Text>
                            </View>
                          ) : searchTerm.trim().length > 0 && searchTerm.trim().length < 3 ? (
                            <View style={styles.emptyStateBox}>
                              <Text style={[styles.emptyPromptText, { color: colors.textSecondary }]}>
                                Escribe al menos 3 letras...
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.emptyStateBox}>
                              <Search size={38} color={colors.textMuted} strokeWidth={1.5} />
                              <Text style={[styles.emptyPromptText, { color: colors.textSecondary, marginTop: 12 }]}>
                                Escribe arriba y pulsa Enter
                              </Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* TAB 2: FAVORITAS */}
                      {activeTab === 'favorites' && (
                        <View style={styles.favoritesSection}>
                          {favoriteMeals.length > 0 ? (
                            <View style={styles.resultsList}>
                              {favoriteMeals.map((item: any) => {
                                const img = getFullImageUrl(item.image_url);
                                const protein = item.protein_g || item.protein || 0;
                                const carbs = item.carbs_g || item.carbs || 0;
                                const fats = item.fats_g || item.fat || 0;
                                const sugars = item.sugars_g || item.sugar_g || 0;

                                return (
                                  <TouchableOpacity
                                    key={item.id}
                                    onPress={() => handleOpenDetail({ ...item, isFavorite: true })}
                                    style={[
                                      styles.foodItemRow,
                                      {
                                        backgroundColor: isDark
                                          ? 'rgba(255, 255, 255, 0.04)'
                                          : 'rgba(255, 255, 255, 0.75)',
                                        borderColor: isDark
                                          ? 'rgba(255, 255, 255, 0.12)'
                                          : 'rgba(0, 0, 0, 0.06)',
                                      },
                                    ]}
                                    activeOpacity={0.7}
                                  >
                                    <View
                                      style={[
                                        styles.itemThumb,
                                        {
                                          backgroundColor: isDark
                                            ? 'rgba(255, 255, 255, 0.08)'
                                            : 'rgba(0, 0, 0, 0.04)',
                                          borderColor: isDark
                                            ? 'rgba(255, 255, 255, 0.12)'
                                            : 'rgba(0, 0, 0, 0.06)',
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

                                      <View style={styles.macroPillsRow}>
                                        <View
                                          style={[
                                            styles.calBadge,
                                            {
                                              backgroundColor: isDark
                                                ? 'rgba(255, 255, 255, 0.08)'
                                                : 'rgba(0, 0, 0, 0.05)',
                                              borderColor: isDark
                                                ? 'rgba(255, 255, 255, 0.12)'
                                                : 'rgba(0, 0, 0, 0.06)',
                                            },
                                          ]}
                                        >
                                          <Text style={[styles.calBadgeText, { color: colors.text }]}>
                                            {Math.round(item.calories)} kcal
                                          </Text>
                                        </View>

                                        <Text style={[styles.macroPillMini, { color: '#ef4444' }]}>
                                          P: {parseFloat(protein).toFixed(1)}
                                        </Text>
                                        <Text style={[styles.macroPillMini, { color: '#3b82f6' }]}>
                                          C: {parseFloat(carbs).toFixed(1)}
                                        </Text>
                                        <Text style={[styles.macroPillMini, { color: '#22c55e' }]}>
                                          G: {parseFloat(fats).toFixed(1)}
                                        </Text>
                                        <Text style={[styles.macroPillMini, { color: '#ec4899' }]}>
                                          Az: {parseFloat(sugars).toFixed(1)}
                                        </Text>
                                      </View>
                                    </View>

                                    <View style={styles.favActions}>
                                      <TouchableOpacity
                                        onPress={() => handleDeleteFavorite(item)}
                                        style={styles.delFavBtn}
                                        activeOpacity={0.7}
                                      >
                                        <Trash2 size={15} color="#ef4444" />
                                      </TouchableOpacity>

                                      <TouchableOpacity
                                        onPress={() => handleQuickAdd({ ...item, isFavorite: true }, 'favorite')}
                                        style={[
                                          styles.quickAddBtn,
                                          { backgroundColor: colors.tint + '18' },
                                        ]}
                                        activeOpacity={0.7}
                                      >
                                        <Plus size={16} color={colors.tint} strokeWidth={2.5} />
                                      </TouchableOpacity>
                                    </View>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          ) : (
                            <View style={styles.emptyStateBox}>
                              <Star size={36} color={colors.textMuted} strokeWidth={1.5} />
                              <Text style={[styles.emptyPromptText, { color: colors.textMuted, marginTop: 10 }]}>
                                No tienes alimentos guardados en favoritos.
                              </Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* TAB 3: RECIENTES */}
                      {activeTab === 'recents' && (
                        <View style={styles.recentsSection}>
                          {recentMeals.length > 0 ? (
                            <View style={styles.resultsList}>
                              {recentMeals.map((item: any, idx: number) => {
                                const img = getFullImageUrl(item.image_url);
                                const protein = item.protein_g || item.protein || 0;
                                const carbs = item.carbs_g || item.carbs || 0;
                                const fats = item.fats_g || item.fat || 0;
                                const sugars = item.sugars_g || item.sugar_g || 0;

                                return (
                                  <TouchableOpacity
                                    key={item.id || idx}
                                    onPress={() => handleOpenDetail(item)}
                                    style={[
                                      styles.foodItemRow,
                                      {
                                        backgroundColor: isDark
                                          ? 'rgba(255, 255, 255, 0.04)'
                                          : 'rgba(255, 255, 255, 0.75)',
                                        borderColor: isDark
                                          ? 'rgba(255, 255, 255, 0.12)'
                                          : 'rgba(0, 0, 0, 0.06)',
                                      },
                                    ]}
                                    activeOpacity={0.7}
                                  >
                                    <View
                                      style={[
                                        styles.itemThumb,
                                        {
                                          backgroundColor: isDark
                                            ? 'rgba(255, 255, 255, 0.08)'
                                            : 'rgba(0, 0, 0, 0.04)',
                                          borderColor: isDark
                                            ? 'rgba(255, 255, 255, 0.12)'
                                            : 'rgba(0, 0, 0, 0.06)',
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

                                      <View style={styles.macroPillsRow}>
                                        <View
                                          style={[
                                            styles.calBadge,
                                            {
                                              backgroundColor: isDark
                                                ? 'rgba(255, 255, 255, 0.08)'
                                                : 'rgba(0, 0, 0, 0.05)',
                                              borderColor: isDark
                                                ? 'rgba(255, 255, 255, 0.12)'
                                                : 'rgba(0, 0, 0, 0.06)',
                                            },
                                          ]}
                                        >
                                          <Text style={[styles.calBadgeText, { color: colors.text }]}>
                                            {Math.round(item.calories)} kcal
                                          </Text>
                                        </View>

                                        <Text style={[styles.macroPillMini, { color: '#ef4444' }]}>
                                          P: {parseFloat(protein).toFixed(1)}
                                        </Text>
                                        <Text style={[styles.macroPillMini, { color: '#3b82f6' }]}>
                                          C: {parseFloat(carbs).toFixed(1)}
                                        </Text>
                                        <Text style={[styles.macroPillMini, { color: '#22c55e' }]}>
                                          G: {parseFloat(fats).toFixed(1)}
                                        </Text>
                                        <Text style={[styles.macroPillMini, { color: '#ec4899' }]}>
                                          Az: {parseFloat(sugars).toFixed(1)}
                                        </Text>
                                      </View>
                                    </View>

                                    <TouchableOpacity
                                      onPress={() => handleQuickAdd(item, 'recent')}
                                      style={[
                                        styles.quickAddBtn,
                                        { backgroundColor: colors.tint + '18' },
                                      ]}
                                      activeOpacity={0.7}
                                    >
                                      <Plus size={16} color={colors.tint} strokeWidth={2.5} />
                                    </TouchableOpacity>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          ) : (
                            <View style={styles.emptyStateBox}>
                              <Clock size={36} color={colors.textMuted} strokeWidth={1.5} />
                              <Text style={[styles.emptyPromptText, { color: colors.textMuted, marginTop: 10 }]}>
                                Aún no tienes comidas recientes registradas.
                              </Text>
                            </View>
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
                                  backgroundColor: isDark
                                    ? 'rgba(255, 255, 255, 0.05)'
                                    : 'rgba(255, 255, 255, 0.75)',
                                  borderColor: isDark
                                    ? 'rgba(255, 255, 255, 0.12)'
                                    : 'rgba(0, 0, 0, 0.08)',
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
                                    backgroundColor: isDark
                                      ? 'rgba(255, 255, 255, 0.05)'
                                      : 'rgba(255, 255, 255, 0.75)',
                                    borderColor: isDark
                                      ? 'rgba(255, 255, 255, 0.12)'
                                      : 'rgba(0, 0, 0, 0.08)',
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
                                  backgroundColor: isDark
                                    ? 'rgba(255, 255, 255, 0.05)'
                                    : 'rgba(255, 255, 255, 0.75)',
                                  borderColor: isDark
                                    ? 'rgba(255, 255, 255, 0.12)'
                                    : 'rgba(0, 0, 0, 0.08)',
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
                                    backgroundColor: isDark
                                      ? 'rgba(239, 68, 68, 0.06)'
                                      : 'rgba(239, 68, 68, 0.04)',
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
                                    backgroundColor: isDark
                                      ? 'rgba(59, 130, 246, 0.06)'
                                      : 'rgba(59, 130, 246, 0.04)',
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
                                    backgroundColor: isDark
                                      ? 'rgba(34, 197, 94, 0.06)'
                                      : 'rgba(34, 197, 94, 0.04)',
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
                                    backgroundColor: isDark
                                      ? 'rgba(236, 72, 153, 0.06)'
                                      : 'rgba(236, 72, 153, 0.04)',
                                  },
                                ]}
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                              />
                            </View>
                          </View>

                          {/* Image Picker */}
                          <View style={styles.imagePickerRow}>
                            <TouchableOpacity
                              onPress={handlePickImage}
                              disabled={isUploadingImage}
                              style={[
                                styles.pickImgBtn,
                                {
                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                                  backgroundColor: isDark
                                    ? 'rgba(255, 255, 255, 0.05)'
                                    : 'rgba(255, 255, 255, 0.75)',
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

                          {/* Save as Favorite Toggle */}
                          {!logToEdit && (
                            <TouchableOpacity
                              onPress={() => setManualForm(prev => ({ ...prev, isFavorite: !prev.isFavorite }))}
                              style={[
                                styles.favToggleRow,
                                {
                                  backgroundColor: manualForm.isFavorite
                                    ? colors.tint + '15'
                                    : isDark
                                    ? 'rgba(255, 255, 255, 0.04)'
                                    : 'rgba(0, 0, 0, 0.03)',
                                  borderColor: manualForm.isFavorite ? colors.tint + '40' : 'transparent',
                                },
                              ]}
                              activeOpacity={0.7}
                            >
                              <Star
                                size={18}
                                color={manualForm.isFavorite ? '#f59e0b' : colors.textMuted}
                                fill={manualForm.isFavorite ? '#f59e0b' : 'transparent'}
                              />
                              <Text style={[styles.favToggleText, { color: colors.text }]}>
                                Guardar como favorito
                              </Text>
                            </TouchableOpacity>
                          )}

                          {/* Save / Stage Button */}
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
                              <View style={styles.btnRow}>
                                <Plus
                                  size={18}
                                  strokeWidth={2.5}
                                  color={getContrastTextColor(colors.tint)}
                                  style={{ marginRight: 6 }}
                                />
                                <Text style={[styles.primaryActionText, { color: getContrastTextColor(colors.tint) }]}>
                                  {logToEdit ? 'Actualizar Comida' : 'Añadir a la Lista'}
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    </ScrollView>

                    {/* ==================== TEMPORARY CART BOTTOM DRAWER ==================== */}
                    {itemsToAdd.length > 0 && !logToEdit && (
                      <View
                        style={[
                          styles.bottomCartDrawer,
                          {
                            backgroundColor: isDark ? 'rgba(16, 16, 18, 0.92)' : 'rgba(255, 255, 255, 0.92)',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                          },
                        ]}
                      >
                        <View style={styles.cartHeaderRow}>
                          <Text style={[styles.cartHeaderTitle, { color: colors.text }]}>
                            ALIMENTOS AÑADIDOS ({itemsToAdd.length})
                          </Text>
                          <Text style={[styles.cartHeaderKcal, { color: colors.textSecondary }]}>
                            {Math.round(totalCartCalories)} kcal totales
                          </Text>
                        </View>

                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.cartCarouselContent}
                          style={styles.cartCarousel}
                        >
                          {itemsToAdd.map(item => (
                            <TouchableOpacity
                              key={item.tempId}
                              onPress={() => handleOpenDetail(item, item.tempId)}
                              style={[
                                styles.cartCard,
                                {
                                  backgroundColor: isDark
                                    ? 'rgba(255, 255, 255, 0.06)'
                                    : 'rgba(0, 0, 0, 0.04)',
                                  borderColor: isDark
                                    ? 'rgba(255, 255, 255, 0.12)'
                                    : 'rgba(0, 0, 0, 0.06)',
                                },
                              ]}
                              activeOpacity={0.8}
                            >
                              <TouchableOpacity
                                onPress={() => handleToggleCartFavorite(item.tempId)}
                                style={styles.cartStarBtn}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Star
                                  size={16}
                                  color={item.isFavorite ? '#f59e0b' : colors.textMuted}
                                  fill={item.isFavorite ? '#f59e0b' : 'transparent'}
                                />
                              </TouchableOpacity>

                              <View style={styles.cartCardMid}>
                                <Text style={[styles.cartCardName, { color: colors.text }]} numberOfLines={1}>
                                  {item.name || item.description}
                                </Text>

                                <View style={styles.cartCardMacros}>
                                  <View
                                    style={[
                                      styles.cartKcalPill,
                                      {
                                        backgroundColor: isDark
                                          ? 'rgba(255, 255, 255, 0.08)'
                                          : 'rgba(0, 0, 0, 0.05)',
                                      },
                                    ]}
                                  >
                                    <Text style={[styles.cartKcalText, { color: colors.text }]}>
                                      {Math.round(item.calories)} kcal
                                    </Text>
                                  </View>

                                  <Text style={[styles.cartMacroPill, { color: '#ef4444' }]}>
                                    P: {item.protein_g}
                                  </Text>
                                  <Text style={[styles.cartMacroPill, { color: '#3b82f6' }]}>
                                    C: {item.carbs_g}
                                  </Text>
                                  <Text style={[styles.cartMacroPill, { color: '#22c55e' }]}>
                                    G: {item.fats_g}
                                  </Text>
                                </View>
                              </View>

                              <View
                                style={[
                                  styles.cartWeightPill,
                                  {
                                    backgroundColor: isDark
                                      ? 'rgba(255, 255, 255, 0.08)'
                                      : 'rgba(0, 0, 0, 0.05)',
                                    borderColor: isDark
                                      ? 'rgba(255, 255, 255, 0.12)'
                                      : 'rgba(0, 0, 0, 0.06)',
                                  },
                                ]}
                              >
                                <Text style={[styles.cartWeightText, { color: colors.text }]}>
                                  {item.weight_g}
                                  <Text style={{ fontSize: 10, color: colors.textMuted }}>g</Text>
                                </Text>
                              </View>

                              <TouchableOpacity
                                onPress={() => handleRemoveCartItem(item.tempId)}
                                style={styles.cartDelBtn}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Trash2 size={15} color="#ef4444" />
                              </TouchableOpacity>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>

                        <TouchableOpacity
                          onPress={handleSaveAllCart}
                          disabled={isLoading || isSubmittingCart}
                          style={[
                            styles.primaryActionBtn,
                            {
                              backgroundColor: colors.tint,
                              opacity: isLoading || isSubmittingCart ? 0.6 : 1,
                              marginTop: 8,
                            },
                          ]}
                          activeOpacity={0.85}
                        >
                          {isLoading || isSubmittingCart ? (
                            <ActivityIndicator color={getContrastTextColor(colors.tint)} />
                          ) : (
                            <View style={styles.btnRow}>
                              <Plus
                                size={19}
                                strokeWidth={2.5}
                                color={getContrastTextColor(colors.tint)}
                                style={{ marginRight: 6 }}
                              />
                              <Text style={[styles.primaryActionText, { color: getContrastTextColor(colors.tint) }]}>
                                Añadir Todo al Registro
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
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
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  dragPill: {
    width: 38,
    height: 4.5,
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
    borderWidth: 1,
  },
  tabNav: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 3,
    borderWidth: 1,
    marginBottom: 12,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4.5,
    paddingVertical: 7.5,
    borderRadius: 15,
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
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 6,
  },
  searchActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsList: {
    gap: 8,
  },
  foodItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  itemThumbImg: {
    width: '100%',
    height: '100%',
  },
  itemMid: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  macroPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  calBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  macroPillMini: {
    fontSize: 10,
    fontWeight: '800',
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
    gap: 6,
  },
  delFavBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  emptyStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emptyIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyStateSub: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  emptyPromptText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
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
    fontSize: 15,
    fontWeight: '800',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // SUBVIEW DETAIL STYLES
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailHeroCard: {
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 14,
  },
  detailHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailThumbLarge: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  detailThumbImg: {
    width: '100%',
    height: '100%',
  },
  detailHeroInfo: {
    flex: 1,
    gap: 2,
  },
  detailFoodTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  detailBrand: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  detailFavBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  weightCard: {
    padding: 16,
    borderRadius: 22,
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
    gap: 4,
    marginBottom: 12,
  },
  weightInput: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    minWidth: 80,
  },
  weightUnit: {
    fontSize: 18,
    fontWeight: '800',
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recalcWrapper: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  recalcCaloriesCard: {
    width: '40%',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  recalcCalVal: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  recalcCalLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  recalcCalPer100: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  recalcMacrosGrid: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  recalcMacroPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  recalcMacroName: {
    fontSize: 11,
    fontWeight: '700',
  },
  recalcMacroAmount: {
    fontSize: 12,
    fontWeight: '800',
  },

  // TEMPORARY CART DRAWER STYLES
  bottomCartDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  cartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cartHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cartHeaderKcal: {
    fontSize: 11,
    fontWeight: '700',
  },
  cartCarousel: {
    marginBottom: 8,
  },
  cartCarouselContent: {
    gap: 10,
    paddingVertical: 2,
  },
  cartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 280,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  cartStarBtn: {
    padding: 2,
  },
  cartCardMid: {
    flex: 1,
    gap: 2,
  },
  cartCardName: {
    fontSize: 13,
    fontWeight: '800',
  },
  cartCardMacros: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cartKcalPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  cartKcalText: {
    fontSize: 9,
    fontWeight: '800',
  },
  cartMacroPill: {
    fontSize: 9,
    fontWeight: '800',
  },
  cartWeightPill: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  cartWeightText: {
    fontSize: 12,
    fontWeight: '800',
  },
  cartDelBtn: {
    padding: 4,
  },
  saveAllBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveAllBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
