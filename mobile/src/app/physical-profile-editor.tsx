import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
  useWindowDimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import {
  Flame,
  Dumbbell,
  Activity,
  Shield,
  Scale,
  Save,
  User,
  CheckCircle2,
} from 'lucide-react-native';

import GlobalHeader from '@/components/GlobalHeader';
import ThemeBackground from '@/components/ThemeBackground';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getThemeBaseBackground } from '@/constants/theme';
import { getContrastTextColor } from '@/utils/colorUtils';
import * as userService from '@/services/userService';

function GlassSurface({
  radius = 24,
  isDark,
  borderColor,
  style,
  children,
}: {
  radius?: number;
  isDark: boolean;
  borderColor: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const innerRadius = Math.max(0, radius - 1);
  return (
    <View style={[{ borderRadius: radius, borderWidth: 1, borderColor, overflow: 'hidden' }, style]}>
      <GlassView
        glassEffectStyle="regular"
        colorScheme={isDark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, { borderRadius: innerRadius }]}
      />
      {children}
    </View>
  );
}

const ACTIVITY_LABELS: Record<string, string> = {
  '1.2': 'Poco o nada',
  '1.375': 'Ligero (1-3 días)',
  '1.55': 'Moderado (3-5 días)',
  '1.725': 'Fuerte (6-7 días)',
  '1.9': 'Muy fuerte',
};

const GOAL_OPTIONS = [
  { value: 'lose', label: 'Bajar peso', icon: Flame },
  { value: 'recomp', label: 'Recomposición', icon: Activity },
  { value: 'gain', label: 'Subir peso', icon: Dumbbell },
  { value: 'maintain', label: 'Mantener', icon: Shield },
];

export default function PhysicalProfileEditorScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const isMobile = windowWidth < 600;

  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const glassBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
  const subtleItemBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
  const activeTintContrast = getContrastTextColor(colors.tint);

  const userProfile = useAppStore(state => state.userProfile);
  const setUserProfile = useAppStore(state => state.setUserProfile);
  const bodyWeightLog = useAppStore(state => state.bodyWeightLog);
  const fetchInitialData = useAppStore(state => state.fetchInitialData);

  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{ age?: string; height?: string }>({});

  const latestWeightFromLog = useMemo(() => {
    if (!bodyWeightLog || bodyWeightLog.length === 0) return userProfile?.weight || null;
    const sorted = [...bodyWeightLog].sort(
      (a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
    );
    return parseFloat(sorted[0].weight_kg) || userProfile?.weight || null;
  }, [bodyWeightLog, userProfile?.weight]);

  const [formData, setFormData] = useState({
    gender: userProfile?.gender || 'male',
    age: userProfile?.age ? String(userProfile.age) : '',
    height: userProfile?.height ? String(userProfile.height) : '',
    activity_level: userProfile?.activity_level ? parseFloat(String(userProfile.activity_level)) : 1.55,
    goal: userProfile?.goal || 'lose',
  });

  const validateForm = () => {
    const errors: { age?: string; height?: string } = {};
    const ageNum = parseInt(formData.age, 10);
    const heightNum = parseInt(formData.height, 10);

    if (!formData.age || isNaN(ageNum) || ageNum < 10 || ageNum > 100) {
      errors.age = 'Introduce una edad válida entre 10 y 100 años.';
    }
    if (!formData.height || isNaN(heightNum) || heightNum < 50 || heightNum > 250) {
      errors.height = 'Introduce una altura válida en cm (50 - 250 cm).';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    if (!validateForm()) {
      Alert.alert('Datos incompletos', 'Por favor, corrige los campos marcados en rojo.');
      return;
    }

    setIsLoading(true);
    try {
      const dataToSave = {
        gender: formData.gender,
        age: parseInt(formData.age, 10),
        height: parseInt(formData.height, 10),
        activityLevel: formData.activity_level,
        goal: formData.goal,
      };

      await userService.updateUserProfile(dataToSave);
      try {
        await fetchInitialData?.();
      } catch {}

      setUserProfile({
        ...userProfile,
        ...dataToSave,
        activity_level: formData.activity_level,
      });

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      useAppStore.getState().showToast?.('Perfil físico actualizado con éxito.');
      router.back();
    } catch (err: any) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      Alert.alert('Error al guardar', err?.message || 'No se pudieron actualizar los datos físicos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background === 'transparent' ? getThemeBaseBackground(theme) : colors.background,
      }}
    >
      <ThemeBackground />

      {/* Header fijo superior */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }} pointerEvents="box-none">
        <GlobalHeader
          title="Editar Perfil Físico"
          scrollY={scrollY}
          showBackButton={true}
          onBackPress={() => router.back()}
        />
      </View>

      <Animated.ScrollView
        contentContainerStyle={{
          paddingHorizontal: isMobile ? 16 : Math.max(16, (windowWidth - 620) / 2),
          paddingTop: insets.top + 72,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      >
        <GlassSurface radius={28} isDark={isDark} borderColor={glassBorder} style={styles.cardPadding}>
          {/* 1. GÉNERO */}
          <View style={styles.fieldSection}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>GÉNERO</Text>
            <View style={styles.genderRow}>
              {(['male', 'female'] as const).map(g => {
                const isSelected = formData.gender === g;
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch {}
                      setFormData(prev => ({ ...prev, gender: g }));
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.genderBtn,
                      {
                        backgroundColor: isSelected ? colors.tint : subtleItemBg,
                        borderColor: isSelected ? colors.tint : glassBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.genderBtnText,
                        { color: isSelected ? activeTintContrast : colors.text },
                      ]}
                    >
                      {g === 'male' ? 'Hombre' : 'Mujer'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 2. EDAD Y ALTURA */}
          <View style={styles.twoColsRow}>
            {/* Edad */}
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>EDAD</Text>
              <TextInput
                value={formData.age}
                onChangeText={val => {
                  const clean = val.replace(/\D/g, '').slice(0, 3);
                  setFormData(prev => ({ ...prev, age: clean }));
                  if (formErrors.age) setFormErrors(prev => ({ ...prev, age: undefined }));
                }}
                keyboardType="number-pad"
                placeholder="Años"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.numericInput,
                  {
                    backgroundColor: subtleItemBg,
                    borderColor: formErrors.age ? '#ef4444' : glassBorder,
                    color: colors.text,
                  },
                ]}
              />
              {formErrors.age && (
                <Text style={styles.errorText}>{formErrors.age}</Text>
              )}
            </View>

            {/* Altura */}
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>ALTURA (CM)</Text>
              <TextInput
                value={formData.height}
                onChangeText={val => {
                  const clean = val.replace(/\D/g, '').slice(0, 3);
                  setFormData(prev => ({ ...prev, height: clean }));
                  if (formErrors.height) setFormErrors(prev => ({ ...prev, height: undefined }));
                }}
                keyboardType="number-pad"
                placeholder="Ej: 175"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.numericInput,
                  {
                    backgroundColor: subtleItemBg,
                    borderColor: formErrors.height ? '#ef4444' : glassBorder,
                    color: colors.text,
                  },
                ]}
              />
              {formErrors.height && (
                <Text style={styles.errorText}>{formErrors.height}</Text>
              )}
            </View>
          </View>

          {/* 3. PESO ACTUAL INFO BOX */}
          <View
            style={[
              styles.weightInfoBox,
              { backgroundColor: colors.tint + '12', borderColor: colors.tint + '30' },
            ]}
          >
            <View style={[styles.weightIconBox, { backgroundColor: colors.tint }]}>
              <Scale size={20} color={activeTintContrast} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.weightInfoTitle, { color: colors.text }]}>
                Tu peso actual es de{' '}
                <Text style={{ fontWeight: '900', color: colors.tint }}>
                  {latestWeightFromLog ? `${latestWeightFromLog} kg` : 'No registrado'}
                </Text>
              </Text>
              <Text style={[styles.weightInfoSub, { color: colors.textSecondary }]}>
                Puedes registrarlo y actualizarlo desde la pestaña de Progreso o Dashboard.
              </Text>
            </View>
          </View>

          {/* 4. NIVEL DE ACTIVIDAD */}
          <View style={styles.fieldSection}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              NIVEL DE ACTIVIDAD FÍSICA
            </Text>
            <View style={styles.activityGrid}>
              {Object.entries(ACTIVITY_LABELS).map(([val, label]) => {
                const numericVal = parseFloat(val);
                const isSelected = Math.abs(formData.activity_level - numericVal) < 0.01;
                return (
                  <TouchableOpacity
                    key={val}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch {}
                      setFormData(prev => ({ ...prev, activity_level: numericVal }));
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.activityBtn,
                      {
                        backgroundColor: isSelected ? colors.tint : subtleItemBg,
                        borderColor: isSelected ? colors.tint : glassBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.activityBtnText,
                        { color: isSelected ? activeTintContrast : colors.text },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 5. OBJETIVO PRINCIPAL */}
          <View style={styles.fieldSection}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              OBJETIVO PRINCIPAL
            </Text>
            <View style={styles.goalsGrid}>
              {GOAL_OPTIONS.map(opt => {
                const isSelected = formData.goal === opt.value;
                const IconComp = opt.icon;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch {}
                      setFormData(prev => ({ ...prev, goal: opt.value }));
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.goalCard,
                      {
                        backgroundColor: isSelected ? colors.tint : subtleItemBg,
                        borderColor: isSelected ? colors.tint : glassBorder,
                      },
                    ]}
                  >
                    <IconComp
                      size={24}
                      color={isSelected ? activeTintContrast : colors.tint}
                      strokeWidth={2.4}
                      style={{ marginBottom: 6 }}
                    />
                    <Text
                      style={[
                        styles.goalCardLabel,
                        { color: isSelected ? activeTintContrast : colors.text },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 6. BOTÓN GUARDAR PERFIL */}
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={isLoading}
            style={[styles.saveBtn, { backgroundColor: colors.tint }]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={activeTintContrast} />
            ) : (
              <>
                <Save size={18} color={activeTintContrast} strokeWidth={2.4} style={{ marginRight: 8 }} />
                <Text style={[styles.saveBtnText, { color: activeTintContrast }]}>
                  Guardar Perfil
                </Text>
              </>
            )}
          </TouchableOpacity>
        </GlassSurface>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  cardPadding: {
    padding: 20,
    gap: 22,
  },
  fieldSection: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  twoColsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  numericInput: {
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  weightInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  weightIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightInfoTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  weightInfoSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  activityGrid: {
    gap: 8,
  },
  activityBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  activityBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalCard: {
    width: '48.5%',
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCardLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 20,
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
