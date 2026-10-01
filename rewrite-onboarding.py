import sys

content = """import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowDown, Minus, ArrowUp, Edit, ChevronRight, 
  Check, Activity, Scale, User, ChevronLeft, Sparkles,
  Coffee, Footprints, Dumbbell, Trophy 
} from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as userService from '@/services/userService';
import Animated, { FadeInRight, FadeInLeft, FadeOut } from 'react-native-reanimated';
import { GlassButton } from '@/components/ui/GlassButton';

const ACTIVITY_LEVELS = [
  { v: 1.2, t: 'Sedentario', d: 'Poco o nada de ejercicio.', icon: Coffee },
  { v: 1.375, t: 'Ligero', d: 'Ejercicio ligero 1-3 d\u00edas/semana.', icon: Footprints },
  { v: 1.55, t: 'Moderado', d: 'Ejercicio moderado 3-5 d\u00edas/semana.', icon: Activity },
  { v: 1.725, t: 'Activo', d: 'Ejercicio fuerte 6-7 d\u00edas/semana.', icon: Dumbbell },
  { v: 1.9, t: 'Atleta', d: 'Ejercicio muy fuerte o doble sesi\u00f3n.', icon: Trophy }
];

const getGoalLabel = (val: string) => {
  switch (val) {
    case 'lose': return 'Perder Grasa';
    case 'gain': return 'Ganar M\u00fasculo';
    case 'recomp': return 'Recomposici\u00f3n';
    case 'maintain': return 'Mantenimiento';
    default: return '';
  }
};

const StoryProgress = ({ total, current, colors }: { total: number, current: number, colors: any }) => (
  <View style={{ flexDirection: 'row', gap: 8, width: '100%', paddingHorizontal: 24, zIndex: 50, marginTop: 12 }}>
    {Array.from({ length: total }).map((_, idx) => (
      <View key={idx} style={{ height: 6, flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ height: '100%', backgroundColor: colors.tint, width: idx + 1 <= current ? '100%' : '0%' }} />
      </View>
    ))}
  </View>
);

const BigOptionButton = ({ selected, onPress, title, desc, icon: Icon, colors, colorScheme }: any) => (
  <GlassButton
    theme={colorScheme}
    color={selected ? colors.tint : undefined}
    onPress={onPress}
    style={[styles.bigOptionBtn, { marginBottom: 16, borderColor: selected ? colors.tint : colors.border + '60' }]}
  >
      <View style={[styles.iconBox, { backgroundColor: selected ? 'rgba(255,255,255,0.2)' : colors.card + '50' }]}>
        <Icon size={28} color={selected ? '#fff' : colors.text} />
      </View>
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={[styles.optionTitle, { color: selected ? '#fff' : colors.text }]}>{title}</Text>
        <Text style={[styles.optionDesc, { color: selected ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}>{desc}</Text>
      </View>
      {selected && <Check size={24} color="#fff" strokeWidth={3} style={{ marginLeft: 8 }} />}
  </GlassButton>
);

const StepWrapper = ({ children, stepNum, currentStep, direction }: { children: React.ReactNode, stepNum: number, currentStep: number, direction: 'left' | 'right' }) => {
  if (currentStep !== stepNum) return null;
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

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const storeTheme = useAppStore(state => state.theme);
  const storeAccent = useAppStore(state => state.accent);
  const userProfile = useAppStore(state => state.userProfile);
  
  const isDefaultTheme = (storeTheme === 'system' || storeTheme === 'light' || !storeTheme);
  const activeThemeName = isDefaultTheme ? 'dark' : storeTheme;
  const baseColors = Colors[activeThemeName as keyof typeof Colors] || Colors.dark;
  
  const webExactColors = {
    background: '#0f172a',
    card: '#1e293b',
    text: '#e5e7eb',
    textSecondary: '#9ca3af',
    border: 'rgba(255, 255, 255, 0.1)',
    tint: '#22c55e'
  };

  const colors = isDefaultTheme ? webExactColors : { ...baseColors, ...(storeAccent ? { tint: storeAccent } : {}) };
  const colorScheme = activeThemeName === 'light' ? 'light' : 'dark';
  const blurTint = colorScheme === 'light' ? 'light' : 'dark';
  
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
    if (step === 1 && (!formData.age || parseInt(formData.age) < 10 || parseInt(formData.age) > 100)) return alert('Introduce una edad v\u00e1lida (10-100)');
    if (step === 2 && (!formData.height || !formData.weight)) return alert('Por favor, completa tus medidas');
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
        activityLevel: parseFloat(str(formData.activityLevel)),
        activity_level: parseFloat(str(formData.activityLevel)),
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

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: colors.background }}>
      
      <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.tint, opacity: 0.15 }]} />
      <View style={[styles.orb, { bottom: -100, left: -100, backgroundColor: '#3b82f6', opacity: 0.10 }]} />
      
      <View style={{ paddingTop: insets.top }}>
        <StoryProgress total={5} current={step} colors={colors} />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: 40 }}>
        
        <StepWrapper currentStep={step} direction={direction} stepNum={1}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{ width: 96, height: 96, marginBottom: 24, borderRadius: 48, backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)', borderWidth: 1, alignItems: 'center', justifyContent: 'center' }}>
              {userProfile?.profile_picture ? (
                <Image source={{ uri: userProfile.profile_picture }} style={{ width: 96, height: 96, borderRadius: 48 }} />
              ) : (
                <Sparkles size={40} color={colors.tint} />
              )}
            </View>
            <Text style={[styles.bigTitle, { color: colors.text }]}>\u00a1Hola, {userProfile?.username || 'Atleta'}!</Text>
            <Text style={[styles.subText, { color: colors.textSecondary }]}>Configuremos tu perfil. Tu metabolismo depende de estos datos b\u00e1sicos.</Text>
          </View>
          
          <View style={[styles.row, { marginBottom: 32 }]}>
            {['male', 'female'].map(g => (
              <GlassButton
                key={g}
                theme={colorScheme}
                color={formData.gender === g ? colors.tint : undefined}
                onPress={() => setFormData({ ...formData, gender: g })}
                style={[styles.genderBtn, { flex: 1, borderColor: formData.gender === g ? colors.tint : colors.border + '60' }]}
              >
                  <User size={32} strokeWidth={formData.gender === g ? 3 : 2} color={formData.gender === g ? '#fff' : colors.textSecondary} style={{ marginBottom: 16 }} />
                  <Text style={{ color: formData.gender === g ? '#fff' : colors.text, fontSize: 18, fontWeight: 'bold' }}>
                    {g === 'male' ? 'Hombre' : 'Mujer'}
                  </Text>
              </GlassButton>
            ))}
          </View>

          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, marginBottom: 8, fontSize: 12, fontWeight: 'bold', letterSpacing: 2 }}>TU EDAD</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <TextInput 
                style={[styles.giantInput, { color: colors.text }]}
                value={formData.age}
                onChangeText={t => setFormData({ ...formData, age: t.replace(/[^0-9]/g, '') })}
                keyboardType="numeric"
                placeholder="25"
                placeholderTextColor={colors.textSecondary + '20'}
              />
              <Text style={[styles.unit, { color: colors.textSecondary }]}>a\u00f1os</Text>
            </View>
          </View>
        </StepWrapper>

        <StepWrapper currentStep={step} direction={direction} stepNum={2}>
          <View style={{ alignItems: 'center', marginBottom: 50 }}>
            <Text style={[styles.bigTitle, { color: colors.text }]}>Tus Medidas</Text>
            <Text style={[styles.subText, { color: colors.textSecondary }]}>Necesario para calcular tus macros con precisi\u00f3n milim\u00e9trica.</Text>
          </View>
          
          <View style={{ alignItems: 'center', gap: 40 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.badge, { backgroundColor: colors.tint + '20' }]}>
                <ArrowUp size={14} color={colors.tint} style={{ marginRight: 6 }} />
                <Text style={[styles.badgeText, { color: colors.tint }]}>ALTURA</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <TextInput 
                  style={[styles.giantInput, { color: colors.text, minWidth: 120 }]}
                  value={formData.height}
                  onChangeText={t => setFormData({ ...formData, height: t.replace(/[^0-9]/g, '') })}
                  keyboardType="numeric"
                  placeholder="175"
                  placeholderTextColor={colors.textSecondary + '20'}
                />
                <Text style={[styles.unit, { color: colors.textSecondary }]}>cm</Text>
              </View>
            </View>

            <View style={{ height: 1, width: '100%', backgroundColor: colors.border + '40' }} />

            <View style={{ alignItems: 'center' }}>
              <View style={[styles.badge, { backgroundColor: colors.tint + '20' }]}>
                <Scale size={14} color={colors.tint} style={{ marginRight: 6 }} />
                <Text style={[styles.badgeText, { color: colors.tint }]}>PESO ACTUAL</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <TextInput 
                  style={[styles.giantInput, { color: colors.text, minWidth: 120 }]}
                  value={formData.weight}
                  onChangeText={t => setFormData({ ...formData, weight: t.replace(',', '.').replace(/[^0-9.]/g, '') })}
                  keyboardType="decimal-pad"
                  placeholder="70.5"
                  placeholderTextColor={colors.textSecondary + '20'}
                />
                <Text style={[styles.unit, { color: colors.textSecondary }]}>kg</Text>
              </View>
            </View>
          </View>
        </StepWrapper>

        <StepWrapper currentStep={step} direction={direction} stepNum={3}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Text style={[styles.bigTitle, { color: colors.text, textAlign: 'center' }]}>Nivel de Actividad</Text>
            <Text style={[styles.subText, { color: colors.textSecondary, textAlign: 'center' }]}>Tu NEAT (actividad fuera del gym) quema m\u00e1s calor\u00edas que el propio entreno.</Text>
          </View>
          <View style={{ width: '100%' }}>
            {ACTIVITY_LEVELS.map(l => (
              <BigOptionButton colors={colors} colorScheme={colorScheme} key={l.v} selected={formData.activityLevel === l.v} onPress={() => setFormData({ ...formData, activityLevel: l.v })} title={l.t} desc={l.d} icon={l.icon} />
            ))}
          </View>
        </StepWrapper>

        <StepWrapper currentStep={step} direction={direction} stepNum={4}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Text style={[styles.bigTitle, { color: colors.text }]}>Tu Objetivo</Text>
            <Text style={[styles.subText, { color: colors.textSecondary }]}>Definiremos tus calor\u00edas y macronutrientes bas\u00e1ndonos en esta elecci\u00f3n.</Text>
          </View>
          <View style={{ width: '100%' }}>
            <BigOptionButton colors={colors} colorScheme={colorScheme} selected={formData.goal === 'lose'} onPress={() => setFormData({ ...formData, goal: 'lose' })} title="Perder Grasa" desc="D\u00e9ficit cal\u00f3rico para definir y bajar peso." icon={ArrowDown} />
            <BigOptionButton colors={colors} colorScheme={colorScheme} selected={formData.goal === 'gain'} onPress={() => setFormData({ ...formData, goal: 'gain' })} title="Ganar M\u00fasculo" desc="Super\u00e1vit ligero para hipertrofia (volumen)." icon={ArrowUp} />
            <BigOptionButton colors={colors} colorScheme={colorScheme} selected={formData.goal === 'recomp'} onPress={() => setFormData({ ...formData, goal: 'recomp' })} title="Recomposici\u00f3n" desc="Bajar grasa y subir m\u00fasculo (mismo peso)." icon={Sparkles} />
            <BigOptionButton colors={colors} colorScheme={colorScheme} selected={formData.goal === 'maintain'} onPress={() => setFormData({ ...formData, goal: 'maintain' })} title="Mantenimiento" desc="Mantener peso mejorando rendimiento." icon={Minus} />
          </View>
        </StepWrapper>

        <StepWrapper currentStep={step} direction={direction} stepNum={5}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <LinearGradient colors={[colors.tint, colors.tint + 'cc']} style={styles.successCircle}>
              <Check size={56} color="#fff" strokeWidth={4} />
            </LinearGradient>
            <Text style={[styles.bigTitle, { color: colors.text }]}>\u00a1Todo Listo!</Text>
            <Text style={[styles.subText, { color: colors.textSecondary }]}>Revisa tus datos. Si algo est\u00e1 mal, toca la tarjeta para editarlo.</Text>
          </View>

          <BlurView intensity={40} tint={blurTint} style={[styles.summaryCard, { borderColor: colors.border + '60' }]}>
            <TouchableOpacity onPress={() => { setDirection('left'); setStep(1); }} style={styles.summaryRow}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>PERFIL</Text>
                <Text style={[styles.summaryVal, { color: colors.text }]}>{formData.gender === 'male' ? 'Hombre' : 'Mujer'}, {formData.age} a\u00f1os</Text>
              </View>
              <Edit size={18} color={colors.tint} style={{ position: 'absolute', right: 24 }} />
            </TouchableOpacity>
            
            <View style={{ height: 1, backgroundColor: colors.border + '40' }} />
            
            <TouchableOpacity onPress={() => { setDirection('left'); setStep(2); }} style={styles.summaryRow}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>MEDIDAS</Text>
                <Text style={[styles.summaryVal, { color: colors.text }]}>{formData.height} cm   \u2022   {formData.weight} kg</Text>
              </View>
              <Edit size={18} color={colors.tint} style={{ position: 'absolute', right: 24 }} />
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: colors.border + '40' }} />
            
            <TouchableOpacity onPress={() => { setDirection('left'); setStep(3); }} style={styles.summaryRow}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>ACTIVIDAD</Text>
                <Text style={[styles.summaryVal, { color: colors.text }]}>{ACTIVITY_LEVELS.find(a => a.v === formData.activityLevel)?.t}</Text>
              </View>
              <Edit size={18} color={colors.tint} style={{ position: 'absolute', right: 24 }} />
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: colors.border + '40' }} />
            
            <TouchableOpacity onPress={() => { setDirection('left'); setStep(4); }} style={styles.summaryRow}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>OBJETIVO</Text>
                <Text style={[styles.summaryVal, { color: colors.tint, textTransform: 'uppercase' }]}>{getGoalLabel(formData.goal)}</Text>
              </View>
              <Edit size={18} color={colors.tint} style={{ position: 'absolute', right: 24 }} />
            </TouchableOpacity>
          </BlurView>
        </StepWrapper>

      </ScrollView>

        {/* FOOTER */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          {step > 1 ? (
            <TouchableOpacity onPress={handleBack} style={styles.footerBtnBack}>
              <ChevronLeft size={28} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.footerBtnBack} />
          )}
          
          <GlassButton
            theme={colorScheme}
            color={colors.tint}
            onPress={step === 5 ? handleSubmit : handleNext}
            style={[styles.footerBtnNext, { flex: step > 1 ? 2 : 1 }]}
          >
            {isLoading ? (
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>...</Text>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
                  {step === 5 ? 'Empezar' : 'Siguiente'}
                </Text>
                <ChevronRight size={24} color="#fff" strokeWidth={3} />
              </View>
            )}
          </GlassButton>
        </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  orb: { position: 'absolute', width: 400, height: 400, borderRadius: 200, zIndex: -1 },
  bigTitle: { fontSize: 36, fontWeight: '900', marginBottom: 12, textAlign: 'center', letterSpacing: -1 },
  subText: { fontSize: 16, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
  row: { flexDirection: 'row', gap: 16, width: '100%' },
  genderBtn: { flex: 1, height: 160, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 24, marginBottom: 16 },
  badgeText: { fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  giantInput: { fontSize: 64, fontWeight: '900', textAlign: 'center', padding: 0, margin: 0 },
  unit: { fontSize: 24, fontWeight: 'bold', marginLeft: 8 },
  bigOptionBtn: { flexDirection: 'row', padding: 20, borderRadius: 24, borderWidth: 2, alignItems: 'center', overflow: 'hidden', width: '100%' },
  iconBox: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 20, fontWeight: '900', marginBottom: 4 },
  optionDesc: { fontSize: 14, lineHeight: 20 },
  successCircle: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 32, shadowOpacity: 0.5, shadowRadius: 30, elevation: 15 },
  summaryCard: { borderRadius: 32, borderWidth: 1, overflow: 'hidden', width: '100%' },
  summaryRow: { flexDirection: 'row', paddingVertical: 24, alignItems: 'center', paddingHorizontal: 24, justifyContent: 'center' },
  summaryLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  summaryVal: { fontSize: 20, fontWeight: 'bold' },
  footer: { flexDirection: 'row', padding: 24, position: 'absolute', bottom: 0, width: '100%', gap: 16, backgroundColor: 'transparent', alignItems: 'center' },
  footerBtnBack: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  footerBtnNext: { height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' }
});
"""

# Small syntax fix inside string
content = content.replace("parseFloat(str(formData.activityLevel))", "parseFloat(formData.activityLevel as unknown as string)")

with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced onboarding.tsx")
