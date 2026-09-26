import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowDown, ArrowUp, Sparkles, Minus, Check, Edit, Activity, Scale, User, Target } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as userService from '@/services/userService';
import Animated, { FadeInRight, FadeInLeft, FadeOut } from 'react-native-reanimated';
import { GlassView } from 'expo-glass-effect';

const ACTIVITY_LEVELS = [
  { v: 1.2, t: 'Sedentario', d: 'Trabajo de oficina, poco o nulo ejercicio.' },
  { v: 1.375, t: 'Ligero', d: 'Ejercicio ligero 1-3 días por semana.' },
  { v: 1.55, t: 'Moderado', d: 'Ejercicio moderado 3-5 días.' },
  { v: 1.725, t: 'Activo', d: 'Ejercicio fuerte 6-7 días a la semana.' }
];

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const storeTheme = useAppStore(state => state.theme);
  const storeAccent = useAppStore(state => state.accent);
  
  // Fuerza tema oscuro siempre en Onboarding para que coincida con la estética web.
  // Colores exactos de Tailwind del web (Slate + Green) para replicar "True Liquid Glass".
  const isDefaultTheme = (storeTheme === 'system' || storeTheme === 'light' || !storeTheme);
  const activeThemeName = isDefaultTheme ? 'dark' : storeTheme;
  const baseColors = Colors[activeThemeName as keyof typeof Colors] || Colors.dark;
  
  // Si no tienen tema custom, forzamos los colores exactos de Tailwind usados en index.css de la web
  const webExactColors = {
    background: '#0f172a',
    card: '#1e293b',
    text: '#e5e7eb',
    textSecondary: '#9ca3af',
    border: 'rgba(255, 255, 255, 0.1)',
    tint: '#22c55e'
  };

  const colors = isDefaultTheme ? webExactColors : { ...baseColors, ...(storeAccent ? { tint: storeAccent } : {}) };
  const blurTint = 'dark';
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [direction, setDirection] = useState('right');
  
  const [formData, setFormData] = useState({
    gender: 'male',
    age: '',
    height: '',
    weight: '',
    activityLevel: 1.55,
    goal: 'lose'
  });

  const handleNext = () => {
    setDirection('right');
    setStep(s => Math.min(5, s + 1));
  };
  const handleBack = () => {
    setDirection('left');
    setStep(s => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      let currentWeight = parseFloat(formData.weight);
      let safeGoal = formData.goal;
      let safeTargetWeight = currentWeight;

      if (safeGoal === 'lose') safeTargetWeight = currentWeight - 5;
      else if (safeGoal === 'gain') safeTargetWeight = currentWeight + 5;
      
      const cleanProfileData = {
        gender: formData.gender,
        age: parseInt(formData.age, 10),
        weight: currentWeight,
        height: parseInt(formData.height, 10),
        activityLevel: parseFloat(formData.activityLevel),
        activity_level: parseFloat(formData.activityLevel),
        goal: safeGoal,
        targetWeight: safeTargetWeight,
        target_weight: safeTargetWeight
      };

      await userService.updateUserProfile(cleanProfileData);
      
      useAppStore.setState(state => ({
        userProfile: { ...state.userProfile, ...cleanProfileData }
      }));

      router.replace('/(tabs)');
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const BigOptionButton = ({ selected, onPress, title, desc, icon: Icon }: any) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ marginBottom: 16, width: '100%' }}>
      <BlurView intensity={selected ? 50 : 25} tint={blurTint} style={[styles.bigOptionBtn, { borderColor: selected ? colors.tint : colors.border + '60' }]}>
        <View style={[styles.iconBox, { backgroundColor: selected ? colors.tint : colors.card + '50' }]}>
          <Icon size={28} color={selected ? '#fff' : colors.text} />
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[styles.optionTitle, { color: selected ? colors.tint : colors.text }]}>{title}</Text>
          <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>{desc}</Text>
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  const StepWrapper = ({ children, stepNum }: { children: React.ReactNode, stepNum: number }) => {
    if (step !== stepNum) return null;
    return (
      <Animated.View 
        entering={direction === 'right' ? FadeInRight.duration(400) : FadeInLeft.duration(400)} 
        exiting={FadeOut.duration(200)}
        style={{ width: '100%', flex: 1, paddingHorizontal: 24, paddingBottom: 120 }}
      >
        {children}
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: colors.background }}>
      
      <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.tint, opacity: 0.15 }]} />
      <View style={[styles.orb, { bottom: -50, left: -100, backgroundColor: '#3b82f6', opacity: 0.10 }]} />
      
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 60 }}>
        
        <StepWrapper stepNum={1}>
          <View style={{ alignItems: 'center', marginBottom: 50 }}>
            <Text style={[styles.bigTitle, { color: colors.text }]}>Tu Perfil Básico</Text>
            <Text style={[styles.subText, { color: colors.textSecondary }]}>Configuremos tu perfil. Tu metabolismo depende de estos datos básicos.</Text>
          </View>
          
          <View style={styles.row}>
            {['male', 'female'].map(g => (
              <TouchableOpacity key={g} onPress={() => setFormData({ ...formData, gender: g })} activeOpacity={0.8} style={{ flex: 1 }}>
                <BlurView intensity={formData.gender === g ? 60 : 30} tint={blurTint} style={[styles.genderBtn, { borderColor: formData.gender === g ? colors.tint : colors.border + '60' }]}>
                  <User size={36} color={formData.gender === g ? colors.tint : colors.textSecondary} style={{ marginBottom: 16 }} />
                  <Text style={{ color: formData.gender === g ? colors.tint : colors.text, fontSize: 18, fontWeight: '900', letterSpacing: 1 }}>
                    {g === 'male' ? 'HOMBRE' : 'MUJER'}
                  </Text>
                </BlurView>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <View style={[styles.badge, { backgroundColor: colors.tint + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.tint }]}>EDAD (AÑOS)</Text>
            </View>
            <TextInput 
              style={[styles.giantInput, { color: colors.text }]}
              value={formData.age}
              onChangeText={t => setFormData({ ...formData, age: t.replace(/[^0-9]/g, '') })}
              keyboardType="numeric"
              placeholder="25"
              placeholderTextColor={colors.textSecondary + '60'}
            />
          </View>
        </StepWrapper>

        <StepWrapper stepNum={2}>
          <View style={{ alignItems: 'center', marginBottom: 50 }}>
            <Text style={[styles.bigTitle, { color: colors.text }]}>Tus Medidas</Text>
            <Text style={[styles.subText, { color: colors.textSecondary }]}>Necesario para calcular tus macros con precisión milimétrica.</Text>
          </View>
          
          <View style={{ alignItems: 'center', gap: 40 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.badge, { backgroundColor: colors.tint + '20' }]}>
                <ArrowUp size={14} color={colors.tint} style={{ marginRight: 6 }} />
                <Text style={[styles.badgeText, { color: colors.tint }]}>ALTURA</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <TextInput 
                  style={[styles.giantInput, { color: colors.text, width: 150 }]}
                  value={formData.height}
                  onChangeText={t => setFormData({ ...formData, height: t.replace(/[^0-9]/g, '') })}
                  keyboardType="numeric"
                  placeholder="175"
                  placeholderTextColor={colors.textSecondary + '60'}
                />
                <Text style={[styles.unit, { color: colors.textSecondary }]}>cm</Text>
              </View>
            </View>

            <View style={{ width: '60%', height: 1, backgroundColor: colors.border + '60' }} />

            <View style={{ alignItems: 'center' }}>
              <View style={[styles.badge, { backgroundColor: colors.tint + '20' }]}>
                <Scale size={14} color={colors.tint} style={{ marginRight: 6 }} />
                <Text style={[styles.badgeText, { color: colors.tint }]}>PESO ACTUAL</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <TextInput 
                  style={[styles.giantInput, { color: colors.text, width: 150 }]}
                  value={formData.weight}
                  onChangeText={t => setFormData({ ...formData, weight: t.replace(/[^0-9.]/g, '') })}
                  keyboardType="decimal-pad"
                  placeholder="70.5"
                  placeholderTextColor={colors.textSecondary + '60'}
                />
                <Text style={[styles.unit, { color: colors.textSecondary }]}>kg</Text>
              </View>
            </View>
          </View>
        </StepWrapper>

        <StepWrapper stepNum={3}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Text style={[styles.bigTitle, { color: colors.text }]}>Nivel de Actividad</Text>
            <Text style={[styles.subText, { color: colors.textSecondary }]}>Tu NEAT (actividad fuera del gym) quema más calorías que el propio entreno.</Text>
          </View>
          <View style={{ width: '100%' }}>
            {ACTIVITY_LEVELS.map(l => (
              <BigOptionButton key={l.v} selected={formData.activityLevel === l.v} onPress={() => setFormData({ ...formData, activityLevel: l.v })} title={l.t} desc={l.d} icon={Activity} />
            ))}
          </View>
        </StepWrapper>

        <StepWrapper stepNum={4}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Text style={[styles.bigTitle, { color: colors.text }]}>Tu Objetivo</Text>
            <Text style={[styles.subText, { color: colors.textSecondary }]}>Definiremos tus calorías y macronutrientes basándonos en esta elección.</Text>
          </View>
          <View style={{ width: '100%' }}>
            <BigOptionButton selected={formData.goal === 'lose'} onPress={() => setFormData({ ...formData, goal: 'lose' })} title="Perder Grasa" desc="Déficit calórico para definir y bajar peso." icon={ArrowDown} />
            <BigOptionButton selected={formData.goal === 'gain'} onPress={() => setFormData({ ...formData, goal: 'gain' })} title="Ganar Músculo" desc="Superávit ligero para hipertrofia (volumen)." icon={ArrowUp} />
            <BigOptionButton selected={formData.goal === 'recomp'} onPress={() => setFormData({ ...formData, goal: 'recomp' })} title="Recomposición" desc="Bajar grasa y subir músculo (mismo peso)." icon={Sparkles} />
            <BigOptionButton selected={formData.goal === 'maintain'} onPress={() => setFormData({ ...formData, goal: 'maintain' })} title="Mantenimiento" desc="Mantener peso mejorando rendimiento." icon={Minus} />
          </View>
        </StepWrapper>

        <StepWrapper stepNum={5}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <LinearGradient colors={[colors.tint, colors.tint + '80']} style={styles.successCircle}>
              <Check size={56} color="#fff" strokeWidth={3} />
            </LinearGradient>
            <Text style={[styles.bigTitle, { color: colors.text }]}>¡Todo Listo!</Text>
            <Text style={[styles.subText, { color: colors.textSecondary }]}>Revisa tus datos. Si algo está mal, toca para editarlo.</Text>
          </View>

          <BlurView intensity={40} tint={blurTint} style={[styles.summaryCard, { borderColor: colors.border + '60' }]}>
            <TouchableOpacity onPress={() => { setDirection('left'); setStep(1); }} style={styles.summaryRow}>
              <View style={{ alignItems: 'flex-start', flex: 1 }}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>PERFIL</Text>
                <Text style={[styles.summaryVal, { color: colors.text }]}>{formData.gender === 'male' ? 'Hombre' : 'Mujer'}, {formData.age} años</Text>
              </View>
              <Edit size={20} color={colors.tint} />
            </TouchableOpacity>
            
            <View style={{ height: 1, backgroundColor: colors.border + '40' }} />
            
            <TouchableOpacity onPress={() => { setDirection('left'); setStep(2); }} style={styles.summaryRow}>
              <View style={{ alignItems: 'flex-start', flex: 1 }}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>MEDIDAS</Text>
                <Text style={[styles.summaryVal, { color: colors.text }]}>{formData.height} cm   {formData.weight} kg</Text>
              </View>
              <Edit size={20} color={colors.tint} />
            </TouchableOpacity>
          </BlurView>
        </StepWrapper>

      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {step > 1 && (
          <TouchableOpacity onPress={handleBack} activeOpacity={0.8} style={{ flex: 1 }}>
            <View style={[styles.footerBtnBack, { overflow: 'hidden' }]}>
              <GlassView glassEffectStyle="regular" colorScheme="dark" style={[StyleSheet.absoluteFill, { borderRadius: 32 }]} />
              <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>Atrás</Text>
            </View>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          onPress={step === 5 ? handleSubmit : handleNext} 
          disabled={isLoading}
          activeOpacity={0.8}
          style={{ flex: step > 1 ? 2 : 1 }}
        >
          <View style={[styles.footerBtnNext, { overflow: 'hidden', shadowColor: colors.tint, shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 }]}>
            <GlassView glassEffectStyle="regular" colorScheme="dark" style={[StyleSheet.absoluteFill, { borderRadius: 32 }]} />
            <LinearGradient colors={[colors.tint, colors.tint + 'cc']} style={[StyleSheet.absoluteFill, { borderRadius: 32, opacity: 0.85 }]} />
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 }}>
              {step === 5 ? (isLoading ? 'GUARDANDO...' : 'COMENZAR') : 'SIGUIENTE'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  orb: { position: 'absolute', width: 400, height: 400, borderRadius: 200, zIndex: -1 },
  bigTitle: { fontSize: 40, fontWeight: '900', marginBottom: 12, textAlign: 'center', letterSpacing: -1 },
  subText: { fontSize: 16, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
  row: { flexDirection: 'row', gap: 16, width: '100%' },
  genderBtn: { flex: 1, height: 160, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, marginBottom: 16 },
  badgeText: { fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  giantInput: { fontSize: 72, fontWeight: '900', textAlign: 'center', padding: 0, margin: 0, height: 90 },
  unit: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, marginLeft: 8 },
  bigOptionBtn: { flexDirection: 'row', padding: 24, borderRadius: 32, borderWidth: 2, alignItems: 'center', overflow: 'hidden', width: '100%' },
  iconBox: { width: 64, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 22, fontWeight: '900', marginBottom: 4 },
  optionDesc: { fontSize: 15, lineHeight: 22 },
  successCircle: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', marginBottom: 32, shadowOpacity: 0.5, shadowRadius: 30, elevation: 15 },
  summaryCard: { borderRadius: 32, borderWidth: 1, overflow: 'hidden', width: '100%' },
  summaryRow: { flexDirection: 'row', paddingVertical: 28, alignItems: 'center', paddingHorizontal: 24 },
  summaryLabel: { fontSize: 13, fontWeight: '900', letterSpacing: 3, marginBottom: 8 },
  summaryVal: { fontSize: 24, fontWeight: 'bold' },
  footer: { flexDirection: 'row', padding: 24, position: 'absolute', bottom: 0, width: '100%', gap: 16, backgroundColor: 'transparent' },
  footerBtnBack: { height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  footerBtnNext: { height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' }
});

