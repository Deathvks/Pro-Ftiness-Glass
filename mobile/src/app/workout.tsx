import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle, X, Globe, Dumbbell } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastColor } from '@/utils/colorUtils';
import { GlassView } from 'expo-glass-effect';
import { GlassButton } from '@/components/ui/GlassButton';

export default function WorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme);
  
  const activeWorkout = useAppStore(state => state.activeWorkout);
  const finishWorkout = useAppStore(state => state.finishWorkout);
  
  const [isFinishing, setIsFinishing] = useState(false);

  // Inyectar un set falso al montar si no hay datos, para que pase la validación y se guarde
  useEffect(() => {
    if (activeWorkout && activeWorkout.exercises && activeWorkout.exercises.length > 0) {
      const state = useAppStore.getState();
      const firstEx = activeWorkout.exercises[0];
      if (!firstEx.setsDone || firstEx.setsDone.length === 0) {
        state.updateSet(activeWorkout.routineId, firstEx.id, 0, { reps: '10', weight_kg: '20' });
      }
    }
  }, [activeWorkout]);

  if (!activeWorkout) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.text }}>No hay entrenamiento activo.</Text>
        <GlassButton theme={theme} style={{ marginTop: 20, width: 200, height: 50 }} onPress={() => router.back()}>
          <Text style={{ color: colors.text, fontWeight: 'bold' }}>Volver</Text>
        </GlassButton>
      </View>
    );
  }

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      await finishWorkout();
      router.push('/(tabs)/social'); 
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el entrenamiento.');
    } finally {
      setIsFinishing(false);
    }
  };

  const getVisibilityText = () => {
    if (activeWorkout.is_from_trainer) return 'Privado (Asesoría)';
    const vis = typeof localStorage !== 'undefined' ? localStorage.getItem('globalWorkoutVisibility') : 'friends';
    if (vis === 'public') return 'Público';
    if (vis === 'private') return 'Privado (No subir)';
    return 'Solo Amigos';
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>
          {activeWorkout.routineName || 'Entrenamiento Libre'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View style={{ padding: 24, backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 20, alignItems: 'center' }}>
          <Dumbbell size={48} color={colors.tint} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, color: colors.text, textAlign: 'center', fontWeight: 'bold' }}>
            Pantalla de Workout (WIP)
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>
            He inyectado datos de prueba automáticamente para que, al darle a Terminar, el entrenamiento pase las validaciones del servidor y puedas ver cómo se sube al Muro.
          </Text>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>
            Privacidad Actual del Muro:
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Globe size={18} color={colors.tint} />
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
              {getVisibilityText()}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={{ padding: 16, paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border }}>
        <GlassButton
          theme={theme}
          style={{ height: 56, borderRadius: 28 }}
          onPress={handleFinish}
          disabled={isFinishing}
        >
          {isFinishing ? (
            <ActivityIndicator color={getContrastColor(colors.tint, theme)} />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <CheckCircle size={20} color={getContrastColor(colors.tint, theme)} />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: getContrastColor(colors.tint, theme) }}>
                Terminar y Guardar
              </Text>
            </View>
          )}
        </GlassButton>
      </View>
    </View>
  );
}
