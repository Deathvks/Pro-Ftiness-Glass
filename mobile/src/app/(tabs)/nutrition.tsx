import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import ThemeBackground from '@/components/ThemeBackground';
import GlobalHeader from '@/components/GlobalHeader';

// Subcomponents
import { DateNavigator } from '@/components/nutrition/DateNavigator';
import { DailySummary } from '@/components/nutrition/DailySummary';
import { WaterTrackerCard } from '@/components/nutrition/WaterTrackerCard';
import { CreatineTrackerCard } from '@/components/nutrition/CreatineTrackerCard';
import { MealSection, FoodLogItem } from '@/components/nutrition/MealSection';

// Modals
import { WaterLogModal } from '@/components/nutrition/WaterLogModal';
import { CreatineTrackerModal } from '@/components/nutrition/CreatineTrackerModal';
import { SugarTargetModal } from '@/components/nutrition/SugarTargetModal';
import { FoodDetailModal } from '@/components/nutrition/FoodDetailModal';
import { NutritionLogModal } from '@/components/nutrition/NutritionLogModal';
import { ConfirmationModal } from '@/components/social/ConfirmationModal';

// Services
import * as nutritionService from '@/services/nutritionService';

export default function NutritionScreen() {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  // Store State
  const userProfile = useAppStore(state => state.userProfile);
  const nutritionLog = useAppStore(state => state.nutritionLog) || [];
  const waterLog = useAppStore(state => state.waterLog) || { quantity_ml: 0 };
  const todaysCreatineLog = useAppStore(state => state.todaysCreatineLog) || [];
  const selectedDate = useAppStore(state => state.selectedDate) || new Date().toISOString().split('T')[0];
  const fetchDataForDate = useAppStore(state => state.fetchDataForDate);
  const isLoading = useAppStore(state => state.isLoading);
  const bodyWeightLog = useAppStore(state => state.bodyWeightLog) || [];
  const favoriteMeals = useAppStore(state => state.favoriteMeals) || [];
  const addFavoriteMeal = useAppStore(state => state.addFavoriteMeal);
  const fetchNotifications = useAppStore(state => state.fetchNotifications);
  const fetchInitialData = useAppStore(state => state.fetchInitialData);

  // Modal States
  const [modal, setModal] = useState<{
    type: 'water' | 'food' | 'sugar' | null;
    data?: any;
  }>({ type: null, data: null });

  const [showCreatineModal, setShowCreatineModal] = useState(false);
  const [viewingLog, setViewingLog] = useState<FoodLogItem | null>(null);
  const [logToDelete, setLogToDelete] = useState<FoodLogItem | null>(null);
  const [mealGroupToDelete, setMealGroupToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Initial Load & On Date change
  useEffect(() => {
    fetchDataForDate(selectedDate);
  }, [selectedDate]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDataForDate(selectedDate);
    setRefreshing(false);
  }, [selectedDate]);

  // Dynamic Targets Formulas (matching frontend)
  const latestWeight = useMemo(() => {
    if (!bodyWeightLog || bodyWeightLog.length === 0) return userProfile?.weight || 70;
    const sorted = [...bodyWeightLog].sort(
      (a: any, b: any) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
    );
    return parseFloat(sorted[0].weight_kg) || userProfile?.weight || 70;
  }, [bodyWeightLog, userProfile]);

  const targets = useMemo(() => {
    const weight = latestWeight;
    const height = userProfile?.height || 175;
    const age = userProfile?.age || 25;
    const gender = userProfile?.gender || 'male';
    const activity_level = userProfile?.activity_level || 1.2;
    const goal = userProfile?.goal || 'maintain';

    let bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161);
    let calTarget = bmr * activity_level;
    if (goal === 'lose') calTarget -= 500;
    if (goal === 'gain') calTarget += 500;
    const finalCalTarget = Math.max(1200, Math.round(calTarget));

    const multiplier = goal === 'gain' ? 2.0 : goal === 'lose' ? 1.8 : 1.6;
    const proteinTarget = Math.round(weight * multiplier);
    const fatsTarget = Math.round((finalCalTarget * 0.25) / 9);
    const carbsTarget = Math.round(Math.max(0, finalCalTarget - proteinTarget * 4 - fatsTarget * 9) / 4);
    const sugarTarget = Math.round((finalCalTarget * 0.1) / 4);

    return {
      calories: finalCalTarget,
      protein: proteinTarget,
      carbs: carbsTarget,
      fats: fatsTarget,
      sugar: sugarTarget,
    };
  }, [userProfile, latestWeight]);

  const waterTarget = useMemo(() => {
    return Math.round(latestWeight * 35);
  }, [latestWeight]);

  const creatineTarget = useMemo(() => {
    const target = latestWeight * 0.05;
    return Math.max(3, parseFloat(target.toFixed(1)));
  }, [latestWeight]);

  // Totals Sum
  const totals = useMemo(() => {
    const res = { calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0 };
    (nutritionLog || []).forEach((log: any) => {
      res.calories += log.calories || 0;
      res.protein += parseFloat(log.protein_g) || 0;
      res.carbs += parseFloat(log.carbs_g) || 0;
      res.fats += parseFloat(log.fats_g) || 0;
      res.sugar += parseFloat(log.sugars_g || log.sugar_g) || 0;
    });
    return res;
  }, [nutritionLog]);

  // Meals Division
  const meals = useMemo(() => {
    const data: Record<'breakfast' | 'lunch' | 'dinner' | 'snack', FoodLogItem[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    (nutritionLog || []).forEach((log: any) => {
      if (data[log.meal_type as keyof typeof data]) {
        data[log.meal_type as keyof typeof data].push(log);
      }
    });
    return data;
  }, [nutritionLog]);

  const mealTotals = useMemo(() => {
    const totalsMap: Record<string, number> = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
    };
    (nutritionLog || []).forEach((log: any) => {
      if (totalsMap[log.meal_type] !== undefined) {
        totalsMap[log.meal_type] += log.calories || 0;
      }
    });
    return totalsMap;
  }, [nutritionLog]);

  // Handlers
  const handleSaveWater = async (quantity_ml: number) => {
    setIsSubmitting(true);
    try {
      await nutritionService.upsertWaterLog({
        log_date: selectedDate,
        quantity_ml,
      });
      await fetchDataForDate(selectedDate);
      if (fetchNotifications) fetchNotifications();
      if (fetchInitialData) fetchInitialData();
      setModal({ type: null, data: null });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo registrar el agua.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveFood = async (foodData: any) => {
    setIsSubmitting(true);
    try {
      if (Array.isArray(foodData)) {
        for (const item of foodData) {
          if (item.isFavorite || item.saveAsFavorite) {
            const alreadyExists = favoriteMeals.some(
              (f: any) => f.name?.toLowerCase().trim() === (item.description || item.name)?.toLowerCase().trim()
            );
            if (!alreadyExists && addFavoriteMeal) {
              addFavoriteMeal({
                name: item.description || item.name,
                calories: item.calories,
                protein_g: item.protein_g,
                carbs_g: item.carbs_g,
                fats_g: item.fats_g,
                sugars_g: item.sugars_g,
                weight_g: item.weight_g,
                image_url: item.image_url,
              }).catch(console.warn);
            }
          }
          await nutritionService.addFoodLog({
            ...item,
            description: item.description || item.name,
            log_date: selectedDate,
            meal_type: modal.data?.mealType || item.meal_type,
          });
        }
      } else {
        // Background favorite saving if enabled
        if (foodData.saveAsFavorite || foodData.isFavorite) {
          const alreadyExists = favoriteMeals.some(
            (f: any) => f.name?.toLowerCase().trim() === (foodData.description || foodData.name)?.toLowerCase().trim()
          );
          if (!alreadyExists && addFavoriteMeal) {
            addFavoriteMeal({
              name: foodData.description || foodData.name,
              calories: foodData.calories,
              protein_g: foodData.protein_g,
              carbs_g: foodData.carbs_g,
              fats_g: foodData.fats_g,
              sugars_g: foodData.sugars_g,
              weight_g: foodData.weight_g,
              image_url: foodData.image_url,
            }).catch(console.warn);
          }
        }

        if (modal.data?.id) {
          // Update existing food
          await nutritionService.updateFoodLog(modal.data.id, {
            ...foodData,
            description: foodData.description || foodData.name,
            meal_type: modal.data.mealType || foodData.meal_type,
          });
        } else {
          // Add new food
          await nutritionService.addFoodLog({
            ...foodData,
            description: foodData.description || foodData.name,
            log_date: selectedDate,
            meal_type: modal.data?.mealType || foodData.meal_type,
          });
        }
      }

      await fetchDataForDate(selectedDate);
      if (fetchNotifications) fetchNotifications();
      if (fetchInitialData) fetchInitialData();
      setModal({ type: null, data: null });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo guardar la comida.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFood = async () => {
    if (!logToDelete) return;
    setIsSubmitting(true);
    try {
      await nutritionService.deleteFoodLog(logToDelete.id);
      await fetchDataForDate(selectedDate);
      if (fetchNotifications) fetchNotifications();
      if (fetchInitialData) fetchInitialData();
      setLogToDelete(null);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo eliminar el alimento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMealGroup = async () => {
    if (!mealGroupToDelete) return;
    setIsSubmitting(true);
    try {
      const logsToDel = nutritionLog.filter((log: any) => log.meal_type === mealGroupToDelete);
      await Promise.all(logsToDel.map((log: any) => nutritionService.deleteFoodLog(log.id)));
      await fetchDataForDate(selectedDate);
      if (fetchNotifications) fetchNotifications();
      if (fetchInitialData) fetchInitialData();
      setMealGroupToDelete(null);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudieron eliminar los registros.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mealLabels: Record<string, string> = {
    breakfast: 'Desayuno',
    lunch: 'Almuerzo',
    dinner: 'Cena',
    snack: 'Snacks',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemeBackground />

      {/* Sticky Global Header */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }} pointerEvents="box-none">
        <GlobalHeader title="Nutrición" scrollY={scrollY} />
      </View>

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 70,
            paddingBottom: insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: Platform.OS !== 'web',
        })}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
            colors={[colors.tint]}
          />
        }
      >
        {/* Date Navigator */}
        <DateNavigator
          selectedDate={selectedDate}
          onDateChange={fetchDataForDate}
        />

        {/* Daily Summary Card (Bento Grid vs SVG Donut Chart) */}
        <DailySummary
          totals={totals}
          targets={targets}
          onOpenSugarModal={() => setModal({ type: 'sugar' })}
        />

        {/* Water Tracker Card */}
        <WaterTrackerCard
          currentMl={waterLog?.quantity_ml || 0}
          targetMl={waterTarget}
          onPress={() => setModal({ type: 'water' })}
        />

        {/* Creatine Tracker Card */}
        <CreatineTrackerCard
          creatineTarget={creatineTarget}
          dosesCount={todaysCreatineLog?.length || 0}
          onPress={() => setShowCreatineModal(true)}
        />

        {/* 4 Meal Sections */}
        {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(mealKey => (
          <MealSection
            key={mealKey}
            mealType={mealKey}
            title={mealLabels[mealKey]}
            totalCalories={mealTotals[mealKey] || 0}
            logs={meals[mealKey]}
            onAddFood={() => setModal({ type: 'food', data: { mealType: mealKey } })}
            onEditFood={item => setModal({ type: 'food', data: { ...item, mealType: mealKey } })}
            onDeleteFood={item => setLogToDelete(item)}
            onClearMeal={() => setMealGroupToDelete(mealKey)}
            onViewFood={item => setViewingLog(item)}
          />
        ))}
      </Animated.ScrollView>

      {/* MODALS */}

      {/* 1. Water Log Modal */}
      {modal.type === 'water' && (
        <WaterLogModal
          visible={true}
          initialQuantity={waterLog?.quantity_ml || 0}
          isLoading={isSubmitting}
          onClose={() => setModal({ type: null, data: null })}
          onSave={handleSaveWater}
        />
      )}

      {/* 2. Creatine Tracker Modal */}
      <CreatineTrackerModal
        visible={showCreatineModal}
        selectedDate={selectedDate}
        creatineTarget={creatineTarget}
        onClose={() => setShowCreatineModal(false)}
        onRefresh={() => fetchDataForDate(selectedDate)}
      />

      {/* 3. Sugar Target Modal */}
      {modal.type === 'sugar' && (
        <SugarTargetModal
          visible={true}
          currentSugar={totals.sugar}
          maxSugar={targets.sugar}
          onClose={() => setModal({ type: null, data: null })}
        />
      )}

      {/* 4. Food Log Modal (Search, Recents, Favorites, Manual) */}
      {modal.type === 'food' && (
        <NutritionLogModal
          visible={true}
          mealType={modal.data?.mealType || 'breakfast'}
          logToEdit={modal.data?.id ? modal.data : null}
          isLoading={isSubmitting}
          onClose={() => setModal({ type: null, data: null })}
          onSave={handleSaveFood}
        />
      )}

      {/* 5. Food Detail View Modal */}
      <FoodDetailModal
        visible={Boolean(viewingLog)}
        food={viewingLog}
        onClose={() => setViewingLog(null)}
      />

      {/* 6. Delete Food Confirmation */}
      <ConfirmationModal
        visible={Boolean(logToDelete)}
        title="Eliminar alimento"
        message={`¿Estás seguro de que deseas eliminar "${logToDelete?.description}"?`}
        confirmText="Eliminar"
        isDestructive={true}
        isLoading={isSubmitting}
        onConfirm={handleDeleteFood}
        onCancel={() => setLogToDelete(null)}
      />

      {/* 7. Clear Meal Group Confirmation */}
      <ConfirmationModal
        visible={Boolean(mealGroupToDelete)}
        title="Vaciar comida"
        message={`¿Estás seguro de que deseas eliminar todos los alimentos de ${
          mealGroupToDelete ? mealLabels[mealGroupToDelete] : ''
        }?`}
        confirmText="Eliminar Todo"
        isDestructive={true}
        isLoading={isSubmitting}
        onConfirm={handleDeleteMealGroup}
        onCancel={() => setMealGroupToDelete(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  trackersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
});