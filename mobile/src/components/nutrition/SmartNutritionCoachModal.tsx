/* mobile/src/components/nutrition/SmartNutritionCoachModal.tsx */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import {
  X,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Zap,
  IceCream,
  Check,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Lightbulb,
  UserCheck,
  ArrowRight,
  Target,
  Shield,
  Activity,
  FlaskConical,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { SwipeableBottomSheet } from '@/components/ui/SwipeableBottomSheet';
import {
  SmartNutritionCoachPlan,
  PillarDiagnostic,
} from '@/utils/smartNutritionCoach';

interface SmartNutritionCoachModalProps {
  visible: boolean;
  plan: SmartNutritionCoachPlan | null;
  latestWeight?: number;
  onClose: () => void;
  onNavigateAsesoria?: () => void;
}

export const SmartNutritionCoachModal: React.FC<SmartNutritionCoachModalProps> = ({
  visible,
  plan,
  latestWeight = 70,
  onClose,
  onNavigateAsesoria,
}) => {
  const router = useRouter();
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  if (!visible || !plan) return null;

  const {
    userGoal,
    overallBadgeText,
    isWarning,
    isOptimal,
    warningsCount,
    optimalCount,
    pillars,
    motivationalMessage,
    celebrationData,
    strategyOptions,
    asesoriaRecommendation,
    previousStrategy,
  } = plan;

  const getPillarIcon = (iconName: PillarDiagnostic['icon']) => {
    switch (iconName) {
      case 'Flame':
        return <Flame size={18} color="#f97316" />;
      case 'Beef':
        return <Beef size={18} color="#ef4444" />;
      case 'Droplet':
        return <Droplet size={18} color="#3b82f6" />;
      case 'Zap':
        return <Zap size={18} color="#a855f7" />;
      case 'IceCream':
        return <IceCream size={18} color="#ec4899" />;
      default:
        return <Wheat size={18} color="#eab308" />;
    }
  };

  const handleNavigateToAsesoria = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onClose();
    if (onNavigateAsesoria) {
      onNavigateAsesoria();
    } else {
      router.push('/(tabs)/profile' as any);
    }
  };

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={onClose}
      isDark={isDark}
      backgroundColor={colors.card}
      height="92%"
      maxHeight="92%"
    >
      <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              {/* Badges row */}
              <View style={styles.badgesRow}>
                <View style={[styles.badgePill, { backgroundColor: colors.tint + '20' }]}>
                  <Target size={12} color={colors.tint} strokeWidth={2.5} />
                  <Text style={[styles.badgePillText, { color: colors.tint }]}>
                    {userGoal.label}
                  </Text>
                </View>

                {isWarning ? (
                  <View style={[styles.badgePill, { backgroundColor: 'rgba(245, 158, 11, 0.18)' }]}>
                    <AlertTriangle size={12} color="#f59e0b" strokeWidth={2.5} />
                    <Text style={[styles.badgePillText, { color: '#f59e0b' }]}>
                      {overallBadgeText}
                    </Text>
                  </View>
                ) : isOptimal ? (
                  <View style={[styles.badgePill, { backgroundColor: 'rgba(16, 185, 129, 0.18)' }]}>
                    <CheckCircle2 size={12} color="#10b981" strokeWidth={2.5} />
                    <Text style={[styles.badgePillText, { color: '#10b981' }]}>
                      {overallBadgeText}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.badgePill, { backgroundColor: 'rgba(59, 130, 246, 0.18)' }]}>
                    <Activity size={12} color="#3b82f6" strokeWidth={2.5} />
                    <Text style={[styles.badgePillText, { color: '#3b82f6' }]}>
                      {overallBadgeText}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.title, { color: colors.text }]}>
                Diagnóstico Nutricional
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[
                styles.closeButton,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
              ]}
              activeOpacity={0.7}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. SEGUIMIENTO DE PAUTA DE HOY */}
            {previousStrategy && (
              <View
                style={[
                  styles.cardBox,
                  {
                    backgroundColor: colors.tint + '15',
                    borderColor: colors.tint + '30',
                  },
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: colors.tint + '25' }]}>
                  <Check size={16} color={colors.tint} strokeWidth={3} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.miniHeader, { color: colors.tint }]}>
                    PAUTA DE HOY
                  </Text>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {previousStrategy.title}
                  </Text>
                  <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                    {previousStrategy.description}
                  </Text>
                </View>
              </View>
            )}

            {/* 2. RECOMENDACIÓN DE ASESORÍA CON NUTRICIONISTA / PREPARADOR REAL */}
            {asesoriaRecommendation && (
              <View
                style={[
                  styles.cardBox,
                  {
                    backgroundColor: colors.tint + '12',
                    borderColor: colors.tint + '25',
                  },
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: colors.tint + '20' }]}>
                  <UserCheck size={18} color={colors.tint} strokeWidth={2.5} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {asesoriaRecommendation.headline}
                  </Text>
                  <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                    {asesoriaRecommendation.description}
                  </Text>
                  <TouchableOpacity
                    onPress={handleNavigateToAsesoria}
                    style={[styles.asesoriaActionBtn, { backgroundColor: colors.tint }]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.asesoriaActionText}>
                      Hablar con Nutricionista
                    </Text>
                    <ArrowRight size={13} color="#000" strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 3. BANNER DE CELEBRACIÓN (Si está óptimo) */}
            {celebrationData?.isCelebrating && (
              <View
                style={[
                  styles.celebrationCard,
                  {
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    borderColor: 'rgba(16, 185, 129, 0.25)',
                  },
                ]}
              >
                <View style={styles.celebrationHeader}>
                  <View style={styles.sparkleCircle}>
                    <Sparkles size={18} color="#10b981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.celebrationTitle, { color: '#10b981' }]}>
                      {celebrationData.title}
                    </Text>
                    <Text style={[styles.celebrationSubtitle, { color: colors.textSecondary }]}>
                      {celebrationData.subtitle}
                    </Text>
                  </View>
                </View>

                <View style={[styles.tipsDivider, { borderTopColor: 'rgba(16, 185, 129, 0.2)' }]} />

                <Text style={[styles.tipsSectionTitle, { color: '#10b981' }]}>
                  PAUTAS PARA SOSTENER ESTA CONSTANCIA:
                </Text>

                {celebrationData.tipsToMaintain.map((tip, idx) => (
                  <View key={idx} style={styles.tipRow}>
                    <View style={styles.tipBullet} />
                    <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 4. MENSAJE MOTIVACIONAL Y CIENCIA (Si hay avisos) */}
            {motivationalMessage && (
              <View
                style={[
                  styles.cardBox,
                  {
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    borderColor: 'rgba(245, 158, 11, 0.25)',
                  },
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                  <Lightbulb size={18} color="#f59e0b" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.miniHeader, { color: '#f59e0b' }]}>
                    PERSPECTIVA CIENTÍFICA Y SIN CULPA
                  </Text>
                  <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                    {motivationalMessage}
                  </Text>
                </View>
              </View>
            )}

            {/* 5. GRID DE LOS 6 PILARES NUTRICIONALES */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                DIAGNÓSTICO DE LOS 6 PILARES:
              </Text>
              <Text style={[styles.sectionRightBadge, { color: colors.textSecondary }]}>
                {optimalCount} en rango • {warningsCount} a mejorar
              </Text>
            </View>

            <View style={styles.pillarsGrid}>
              {pillars.map(pillar => {
                const isWarn = pillar.isWarning;
                const isOpt = pillar.status === 'optimal';

                return (
                  <View
                    key={pillar.id}
                    style={[
                      styles.pillarCard,
                      {
                        backgroundColor: isWarn
                          ? 'rgba(245, 158, 11, 0.1)'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.04)'
                          : 'rgba(0, 0, 0, 0.03)',
                        borderColor: isWarn ? 'rgba(245, 158, 11, 0.25)' : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.pillarTopRow}>
                      <View style={styles.pillarIconName}>
                        <View
                          style={[
                            styles.pillarIconWrap,
                            {
                              backgroundColor: isDark
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.05)',
                            },
                          ]}
                        >
                          {getPillarIcon(pillar.icon)}
                        </View>
                        <Text style={[styles.pillarName, { color: colors.text }]} numberOfLines={1}>
                          {pillar.name}
                        </Text>
                      </View>

                      {isWarn ? (
                        <View style={[styles.pillarStatusTag, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                          <Text style={[styles.pillarStatusText, { color: '#f59e0b' }]}>Alerta</Text>
                        </View>
                      ) : isOpt ? (
                        <View style={[styles.pillarStatusTag, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                          <Text style={[styles.pillarStatusText, { color: '#10b981' }]}>OK</Text>
                        </View>
                      ) : (
                        <View style={[styles.pillarStatusTag, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                          <Text style={[styles.pillarStatusText, { color: '#3b82f6' }]}>En curso</Text>
                        </View>
                      )}
                    </View>

                    {/* Consumed vs Target */}
                    <View style={styles.pillarValuesRow}>
                      <Text style={[styles.pillarConsumedVal, { color: colors.text }]}>
                        {typeof pillar.consumed === 'number'
                          ? pillar.consumed.toLocaleString('es-ES')
                          : pillar.consumed}{' '}
                        {pillar.unit !== 'macros' && pillar.unit !== 'día' ? (
                          <Text style={[styles.pillarUnit, { color: colors.textMuted }]}>
                            {pillar.unit}
                          </Text>
                        ) : null}
                      </Text>
                      <Text style={[styles.pillarTargetVal, { color: colors.textMuted }]}>
                        Meta: {pillar.target}{' '}
                        {pillar.unit !== 'macros' && pillar.unit !== 'día' ? pillar.unit : ''}
                      </Text>
                    </View>

                    {/* Message */}
                    <Text style={[styles.pillarMessage, { color: colors.textSecondary }]}>
                      {pillar.message}
                    </Text>

                    {/* Science note */}
                    <View
                      style={[
                        styles.scienceNoteRow,
                        {
                          borderTopColor: isDark
                            ? 'rgba(255, 255, 255, 0.06)'
                            : 'rgba(0, 0, 0, 0.05)',
                        },
                      ]}
                    >
                      <FlaskConical size={11} color={colors.tint} style={{ marginTop: 2, marginRight: 5 }} />
                      <Text style={[styles.scienceNoteText, { color: colors.textMuted }]}>
                        {pillar.science}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* 6. PAUTAS Y SUGERENCIAS PRÁCTICAS FLEXIBLES */}
            {strategyOptions && strategyOptions.length > 0 && (
              <View style={styles.strategiesSection}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.strategiesHeaderTitle}>
                    <Target size={14} color={colors.tint} />
                    <Text style={[styles.sectionSubtitle, { color: colors.tint, marginLeft: 6 }]}>
                      PAUTAS Y SUGERENCIAS PARA HOY:
                    </Text>
                  </View>
                  <Text style={[styles.sectionRightBadge, { color: colors.textMuted }]}>
                    GUÍA FLEXIBLE
                  </Text>
                </View>

                {strategyOptions.map(opt => (
                  <View
                    key={opt.id}
                    style={[
                      styles.strategyCard,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.04)'
                          : 'rgba(0, 0, 0, 0.03)',
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={[styles.checkCircle, { backgroundColor: colors.tint + '25' }]}>
                      <Check size={12} color={colors.tint} strokeWidth={3} />
                    </View>

                    <View style={styles.strategyContent}>
                      <View style={styles.strategyTitleRow}>
                        <Text style={[styles.strategyTitle, { color: colors.text }]}>
                          {opt.title}
                        </Text>
                        {opt.badge ? (
                          <View style={[styles.strategyBadge, { backgroundColor: colors.tint + '20' }]}>
                            <Text style={[styles.strategyBadgeText, { color: colors.tint }]}>
                              {opt.badge}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {opt.motive ? (
                        <Text style={[styles.strategyMotive, { color: colors.tint }]}>
                          <Text style={{ fontWeight: '800' }}>Motivo: </Text>
                          {opt.motive}
                        </Text>
                      ) : null}

                      <Text style={[styles.strategyDesc, { color: colors.textSecondary }]}>
                        {opt.description}
                      </Text>

                      {opt.actionHint ? (
                        <View style={styles.actionHintRow}>
                          <Sparkles size={11} color={colors.tint} style={{ marginRight: 4 }} />
                          <Text style={[styles.actionHintText, { color: colors.tint }]}>
                            {opt.actionHint}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Contexto científico de cierre */}
            <View
              style={[
                styles.cardBox,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.04)'
                    : 'rgba(0, 0, 0, 0.03)',
                  borderColor: colors.border,
                },
              ]}
            >
              <Shield size={16} color={colors.tint} style={{ marginTop: 2, marginRight: 10 }} />
              <Text style={[styles.footerScienceText, { color: colors.textSecondary }]}>
                Cálculos nutricionales basados en tu perfil corporal ({latestWeight} kg) y objetivo de{' '}
                <Text style={{ fontWeight: '800', color: colors.text }}>
                  {userGoal.label}
                </Text>
                . Sin dietas milagro: solo balance energético, reparto proteico óptimo e hidratación celular.
              </Text>
            </View>
          </ScrollView>

          {/* Footer Action Button */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                onClose();
              }}
              style={[styles.primaryButton, { backgroundColor: colors.tint }]}
              activeOpacity={0.85}
            >
              <Check size={18} color="#000" strokeWidth={3} style={{ marginRight: 6 }} />
              <Text style={styles.primaryButtonText}>
                Entendido, lo registro por mi cuenta
              </Text>
            </TouchableOpacity>
          </View>
      </View>
    </SwipeableBottomSheet>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '92%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 24,
  },
  grabberContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 20,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 30,
    gap: 14,
  },
  cardBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  miniHeader: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  asesoriaActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    marginTop: 10,
    gap: 6,
  },
  asesoriaActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000',
  },
  celebrationCard: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
  },
  celebrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sparkleCircle: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  celebrationSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  tipsDivider: {
    borderTopWidth: 1,
    marginVertical: 12,
  },
  tipsSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginTop: 5,
  },
  tipText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionRightBadge: {
    fontSize: 10,
    fontWeight: '700',
  },
  pillarsGrid: {
    gap: 10,
  },
  pillarCard: {
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
  },
  pillarTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pillarIconName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  pillarIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarName: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  pillarStatusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  pillarStatusText: {
    fontSize: 9.5,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  pillarValuesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  pillarConsumedVal: {
    fontSize: 17,
    fontWeight: '900',
  },
  pillarUnit: {
    fontSize: 11,
    fontWeight: '600',
  },
  pillarTargetVal: {
    fontSize: 11,
    fontWeight: '600',
  },
  pillarMessage: {
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 16,
  },
  scienceNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 7,
    paddingTop: 6,
    borderTopWidth: 1,
  },
  scienceNoteText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 14,
  },
  strategiesSection: {
    gap: 10,
    marginTop: 4,
  },
  strategiesHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strategyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  strategyContent: {
    flex: 1,
  },
  strategyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  strategyTitle: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  strategyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  strategyBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  strategyMotive: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    marginBottom: 4,
  },
  strategyDesc: {
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 16,
  },
  actionHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  actionHintText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  footerScienceText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000',
  },
});
