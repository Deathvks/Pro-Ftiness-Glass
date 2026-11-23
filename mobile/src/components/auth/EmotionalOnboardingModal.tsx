import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from 'expo-glass-effect';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import {
  ArrowRight,
  Brain,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react-native';

import { LiquidCloseButton } from '@/components/ui/GlassButton';
import ModalThemeBackground, {
  getThemedModalBorderColor,
  getThemedModalCardColor,
} from '@/components/ui/ModalThemeBackground';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

export interface InteractiveQuizData {
  goal: 'muscle' | 'hybrid' | 'lose' | '';
  obstacle: 'time' | 'motivation' | 'knowledge' | '';
  currentWeight: string;
  targetWeight: string;
}

interface EmotionalOnboardingModalProps {
  visible: boolean;
  onFinish: (data: InteractiveQuizData) => void;
  onClose: () => void;
}

export function EmotionalOnboardingModal({
  visible,
  onFinish,
  onClose,
}: EmotionalOnboardingModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentText = getContrastTextColor(colors.tint);
  const cardSurface = getThemedModalCardColor(theme);
  const borderColor = getThemedModalBorderColor(theme);

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<InteractiveQuizData>({
    goal: '',
    obstacle: '',
    currentWeight: '',
    targetWeight: '',
  });

  const projection = useMemo(() => {
    const current = parseFloat(formData.currentWeight.replace(',', '.'));
    const target = parseFloat(formData.targetWeight.replace(',', '.'));
    if (isNaN(current) || isNaN(target) || current <= 0 || target <= 0) return null;

    const diff = Math.abs(target - current);
    const isLoss = target < current;
    const rate = isLoss ? 0.6 : 0.25;
    const weeks = Math.max(1, Math.ceil(diff / rate));
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + weeks * 7);
    const month = futureDate
      .toLocaleDateString('es-ES', { month: 'short' })
      .toUpperCase()
      .replace('.', '');
    const day = futureDate.getDate();

    return {
      dateFormatted: `${day} ${month}`,
      year: futureDate.getFullYear(),
      weeks,
      isLoss,
      current,
      target,
    };
  }, [formData.currentWeight, formData.targetWeight]);

  const handleSelectOption = (key: 'goal' | 'obstacle', value: string) => {
    Haptics.selectionAsync().catch(() => {});
    setFormData(prev => ({ ...prev, [key]: value }));
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (step === 0) onClose();
    else setStep(prev => prev - 1);
  };

  const handleResetAndClose = () => {
    setStep(0);
    onClose();
  };

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onFinish(formData);
  };

  const renderOptionCard = (
    Icon: React.ComponentType<any>,
    title: string,
    desc: string,
    onPress: () => void,
    selected: boolean
  ) => (
    <TouchableOpacity
      key={title}
      activeOpacity={0.84}
      onPress={onPress}
      style={[
        styles.optionCard,
        {
          backgroundColor: cardSurface,
          borderColor: selected ? colors.tint : borderColor,
        },
      ]}
    >
      <View style={[styles.optionIconBox, { backgroundColor: colors.tint + '22' }]}>
        <Icon size={22} color={colors.tint} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.optionTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>{desc}</Text>
      </View>
      <ChevronRight size={18} color={selected ? colors.tint : colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderStepContent = () => {
    if (step === 0) {
      return (
        <View style={styles.stepWrap}>
          <Text style={[styles.heading, { color: colors.text }]}>Tu Identidad</Text>
          <Text style={[styles.subheading, { color: colors.textSecondary }]}>
            ¿En quién te quieres convertir?
          </Text>
          <View style={styles.optionsList}>
            {renderOptionCard(
              Dumbbell,
              'Estética & Fuerza',
              'Quiero construir un físico esculpido y fuerte.',
              () => handleSelectOption('goal', 'muscle'),
              formData.goal === 'muscle'
            )}
            {renderOptionCard(
              Zap,
              'Atleta Híbrido',
              'Resistencia, agilidad y potencia funcional.',
              () => handleSelectOption('goal', 'hybrid'),
              formData.goal === 'hybrid'
            )}
            {renderOptionCard(
              Target,
              'Salud & Definición',
              'Perder grasa y mejorar mi energía diaria.',
              () => handleSelectOption('goal', 'lose'),
              formData.goal === 'lose'
            )}
          </View>
        </View>
      );
    }

    if (step === 1) {
      return (
        <View style={styles.stepWrap}>
          <Text style={[styles.heading, { color: colors.text }]}>El Obstáculo</Text>
          <Text style={[styles.subheading, { color: colors.textSecondary }]}>
            ¿Qué te ha frenado antes?
          </Text>
          <View style={styles.optionsList}>
            {renderOptionCard(
              Clock,
              'Falta de Tiempo',
              'Mis horarios son un caos, necesito eficiencia.',
              () => handleSelectOption('obstacle', 'time'),
              formData.obstacle === 'time'
            )}
            {renderOptionCard(
              Brain,
              'Motivación',
              'Empiezo fuerte pero lo dejo a las semanas.',
              () => handleSelectOption('obstacle', 'motivation'),
              formData.obstacle === 'motivation'
            )}
            {renderOptionCard(
              TrendingUp,
              'Estancamiento',
              'Me esfuerzo pero mi cuerpo no cambia.',
              () => handleSelectOption('obstacle', 'knowledge'),
              formData.obstacle === 'knowledge'
            )}
          </View>
        </View>
      );
    }

    if (step === 2) {
      const canCalculate = Boolean(projection);
      return (
        <View style={styles.stepWrap}>
          <Text style={[styles.heading, { color: colors.text }]}>Visualización</Text>
          <Text style={[styles.subheading, { color: colors.textSecondary }]}>
            Calculadora de proyección realista
          </Text>

          <View style={styles.weightsBlock}>
            <View style={styles.weightField}>
              <View style={styles.dotLabelRow}>
                <View style={[styles.dot, { backgroundColor: '#3b82f6' }]} />
                <Text style={[styles.weightLabel, { color: '#3b82f6' }]}>
                  Peso Actual (kg)
                </Text>
              </View>
              <TextInput
                value={formData.currentWeight}
                onChangeText={val =>
                  setFormData(prev => ({
                    ...prev,
                    currentWeight: val.replace(',', '.').replace(/[^0-9.]/g, ''),
                  }))
                }
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.18)'}
                autoFocus
                style={[
                  styles.giantNumberInput,
                  {
                    color: colors.text,
                    borderBottomColor: formData.currentWeight ? colors.tint : borderColor,
                  },
                ]}
              />
            </View>

            <View style={styles.weightField}>
              <View style={styles.dotLabelRow}>
                <View style={[styles.dot, { backgroundColor: colors.tint }]} />
                <Text style={[styles.weightLabel, { color: colors.tint }]}>
                  Peso Objetivo (kg)
                </Text>
              </View>
              <TextInput
                value={formData.targetWeight}
                onChangeText={val =>
                  setFormData(prev => ({
                    ...prev,
                    targetWeight: val.replace(',', '.').replace(/[^0-9.]/g, ''),
                  }))
                }
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.18)'}
                style={[
                  styles.giantNumberInput,
                  {
                    color: colors.text,
                    borderBottomColor: formData.targetWeight ? colors.tint : borderColor,
                  },
                ]}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!canCalculate}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                setStep(3);
              }}
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: colors.tint,
                  opacity: canCalculate ? 1 : 0.42,
                },
              ]}
            >
              <Text style={[styles.primaryBtnText, { color: accentText }]}>
                Calcular Hoja de Ruta
              </Text>
              <ChevronRight size={20} color={accentText} strokeWidth={2.8} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Step 3: Projection Result
    const isLoss = projection?.isLoss ?? true;
    const xStart = 44;
    const xEnd = 256;
    const yHigh = 40;
    const yLow = 114;
    const yStart = isLoss ? yHigh : yLow;
    const yEnd = isLoss ? yLow : yHigh;

    return (
      <View style={styles.stepWrap}>
        <View style={styles.projHeaderRow}>
          <View>
            <Text style={[styles.projKicker, { color: colors.textSecondary }]}>
              PROYECCIÓN ESTIMADA
            </Text>
            <View style={styles.projDateRow}>
              <Text style={[styles.projDateText, { color: colors.text }]}>
                {projection?.dateFormatted || '—'}
              </Text>
              <Text style={[styles.projYearText, { color: colors.textSecondary }]}>
                {projection?.year}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.weeksBadge,
              { backgroundColor: colors.tint + '1A', borderColor: colors.tint + '40' },
            ]}
          >
            <Calendar size={13} color={colors.tint} />
            <Text style={{ color: colors.tint, fontSize: 12, fontWeight: '800' }}>
              {projection?.weeks || 1} Semanas
            </Text>
          </View>
        </View>

        {/* Chart Box */}
        <View
          style={[
            styles.chartCard,
            { backgroundColor: cardSurface, borderColor },
          ]}
        >
          <Svg width="100%" height={170} viewBox="0 0 300 160">
            <Defs>
              <SvgLinearGradient id="quizChartGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={colors.tint} stopOpacity="0.34" />
                <Stop offset="100%" stopColor={colors.tint} stopOpacity="0" />
              </SvgLinearGradient>
            </Defs>
            <Path
              d={`M ${xStart},${yStart} C ${xStart + 80},${yStart} ${xEnd - 80},${yEnd} ${xEnd},${yEnd} L ${xEnd},160 L ${xStart},160 Z`}
              fill="url(#quizChartGrad)"
            />
            <Path
              d={`M ${xStart},${yStart} C ${xStart + 80},${yStart} ${xEnd - 80},${yEnd} ${xEnd},${yEnd}`}
              fill="none"
              stroke={colors.tint}
              strokeWidth={4}
              strokeLinecap="round"
            />
            <Circle
              cx={xStart}
              cy={yStart}
              r={5.5}
              fill={isDark ? '#111827' : '#ffffff'}
              stroke={colors.tint}
              strokeWidth={2.5}
            />
            <Circle
              cx={xEnd}
              cy={yEnd}
              r={6.5}
              fill={colors.tint}
              stroke="#ffffff"
              strokeWidth={2}
            />
          </Svg>

          {/* Labels Overlay */}
          <View style={[styles.chartTag, { left: 16, top: isLoss ? 8 : undefined, bottom: isLoss ? undefined : 10 }]}>
            <Text style={[styles.chartTagKicker, { color: colors.textSecondary }]}>HOY</Text>
            <Text style={[styles.chartTagVal, { color: colors.text }]}>
              {formData.currentWeight} kg
            </Text>
          </View>

          <View style={[styles.chartTag, { right: 16, bottom: isLoss ? 10 : undefined, top: isLoss ? undefined : 8 }]}>
            <View style={[styles.goalPill, { backgroundColor: colors.tint }]}>
              <Text style={{ color: accentText, fontSize: 9, fontWeight: '900' }}>META</Text>
            </View>
            <Text style={[styles.chartTagVal, { color: colors.text }]}>
              {formData.targetWeight} kg
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.quoteBox,
            { backgroundColor: cardSurface, borderColor },
          ]}
        >
          <Trophy size={26} color={colors.tint} />
          <Text style={[styles.quoteText, { color: colors.text }]}>
            &ldquo;En <Text style={{ color: colors.tint, fontWeight: '900' }}>{projection?.weeks || 1} semanas</Text> tu cuerpo habrá cambiado para siempre.&rdquo;
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleComplete}
          style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
        >
          <Text style={[styles.primaryBtnText, { color: accentText }]}>
            Reclamar mi Plan
          </Text>
          <ArrowRight size={20} color={accentText} strokeWidth={2.8} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="fade"
      onRequestClose={handleResetAndClose}
    >
      <View style={styles.backdrop}>
        <ModalThemeBackground theme={theme} />
        {Platform.OS === 'ios' && (
          <GlassView
            pointerEvents="none"
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, width: '100%' }}
        >
          <View
            style={[
              styles.topBar,
              { paddingTop: Math.max(insets.top + 8, 16) },
            ]}
          >
            <TouchableOpacity
              accessibilityLabel="Volver"
              onPress={handleBack}
              style={[
                styles.backCircle,
                { backgroundColor: cardSurface, borderColor },
              ]}
            >
              <ChevronLeft size={22} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.progressWrap}>
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.tint,
                      width: `${((step + 1) / 4) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.stepCounter, { color: colors.textSecondary }]}>
                {step + 1} / 4
              </Text>
            </View>

            <LiquidCloseButton
              accessibilityLabel="Cerrar test"
              onPress={handleResetAndClose}
              iconColor={colors.text}
            />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom + 28, 40) },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {renderStepContent()}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default EmotionalOnboardingModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    gap: 12,
  },
  backCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepCounter: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  stepWrap: {
    gap: 16,
  },
  heading: {
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  subheading: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
  },
  optionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  weightsBlock: {
    gap: 24,
    marginTop: 8,
  },
  weightField: {
    alignItems: 'center',
    gap: 8,
  },
  dotLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  weightLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  giantNumberInput: {
    width: '100%',
    fontSize: 54,
    fontWeight: '900',
    textAlign: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1.5,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 6,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '900',
  },
  projHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  projKicker: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  projDateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  projDateText: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  projYearText: {
    fontSize: 14,
    fontWeight: '700',
  },
  weeksBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  chartCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  chartTag: {
    position: 'absolute',
    alignItems: 'center',
    gap: 3,
  },
  chartTagKicker: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  chartTagVal: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  goalPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  quoteBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
    gap: 10,
  },
  quoteText: {
    fontSize: 15.5,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
  },
});
