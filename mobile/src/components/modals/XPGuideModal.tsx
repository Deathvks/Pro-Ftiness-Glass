import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Calendar,
  ChefHat,
  Crown,
  Droplets,
  Dumbbell,
  Flame,
  Footprints,
  History,
  Info,
  LogIn,
  Palette,
  Plus,
  Rocket,
  Shield,
  Star,
  Trophy,
  Utensils,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import LevelBadge from '@/components/LevelBadge';
import { getThemedModalCardColor, getThemedModalSurfaceColor } from '@/components/ui/ModalThemeBackground';
import { SwipeableBottomSheet, getAppleSheetCardStyle } from '@/components/ui/SwipeableBottomSheet';
import { getUnselectedControlColors } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { getXPHistory } from '@/services/gamificationService';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

interface XPGuideModalProps {
  visible: boolean;
  targetDays?: number;
  onClose: () => void;
}

interface XPHistoryItem {
  id: string | number;
  amount: number;
  reason?: string;
  previous_xp?: number;
  new_xp?: number;
  created_at: string;
}

const RANK_PREVIEWS = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

const PERSONALIZATION_REWARDS = [
  {
    title: 'Nivel 5',
    desc: 'Desbloqueas 5 nuevos colores pastel: Menta Suave, Melocotón, Agua de Rosas, Lavanda y Azul Bebé.',
  },
  {
    title: 'Nivel 10',
    desc: 'Desbloqueas 5 pasteles vibrantes: Rosa Atardecer, Pistacho, Mango Pastel, Limonada y Cerezo.',
  },
];

const DAILY_ACTIONS = [
  {
    id: 'login',
    title: 'Conexión Diaria',
    desc: 'Por entrar a la app hoy',
    xp: '+25 XP',
    icon: LogIn,
    iconColor: '#10b981',
  },
  {
    id: 'workout',
    title: '¡A sudar!',
    desc: 'Realiza un entrenamiento hoy',
    xp: '+100 XP (Reto)',
    icon: Dumbbell,
    iconColor: '#3b82f6',
  },
  {
    id: 'meals',
    title: 'Registra 5 comidas',
    desc: 'Registra al menos 5 alimentos hoy',
    xp: '+50 XP (Reto)',
    icon: Utensils,
    iconColor: '#f97316',
  },
  {
    id: 'calories',
    title: 'Calorías completadas',
    desc: 'Alcanza tu objetivo calórico diario',
    xp: '+50 XP (Reto)',
    icon: Flame,
    iconColor: '#ef4444',
  },
  {
    id: 'protein',
    title: 'Proteína completada',
    desc: 'Alcanza tu objetivo de proteínas diario',
    xp: '+50 XP (Reto)',
    icon: ChefHat,
    iconColor: '#ef4444',
  },
  {
    id: 'water',
    title: 'Mantente hidratado',
    desc: 'Registra el agua recomendada hoy',
    xp: '+30 XP (Reto)',
    icon: Droplets,
    iconColor: '#06b6d4',
  },
  {
    id: 'wall_post',
    title: 'Presume tu esfuerzo',
    desc: 'Publica un entrenamiento en el Muro (Global, Mi Gimnasio o Amigos)',
    xp: '+25 XP (Reto)',
    icon: Plus,
    iconColor: '#10b981',
  },
  {
    id: 'wall_comment',
    title: 'Conversador',
    desc: 'Comenta en 2 sesiones del Muro (Global, Mi Gimnasio o Amigos)',
    xp: '+25 XP (Reto)',
    icon: Footprints,
    iconColor: '#6366f1',
  },
  {
    id: 'wall_react',
    title: 'Reacciones de Gimnasio',
    desc: 'Reacciona con 🔥 Fuego, 💪 Bestia, 🫡 Respeto o 🏆 PR a 2 publicaciones del Muro',
    xp: '+25 XP (Reto)',
    icon: Flame,
    iconColor: '#ec4899',
  },
  {
    id: 'more',
    title: 'Y muchos más...',
    desc: 'Visita la pestaña "Retos" para descubrirlos',
    xp: null,
    icon: Star,
    iconColor: '#a855f7',
    navigateToChallenges: true,
  },
];

const MILESTONES = [
  {
    title: 'Primer Paso',
    desc: 'Por iniciar sesión 1ª vez',
    xp: '+50 XP',
    icon: Rocket,
  },
  {
    title: '1º Entrenamiento',
    desc: 'Al completar el primero',
    xp: '+100 XP',
    icon: Trophy,
  },
  {
    title: 'Chef',
    desc: 'Por registrar 5 comidas',
    xp: '+100 XP',
    icon: ChefHat,
  },
  {
    title: 'Racha de 3 Días',
    desc: '3 días seguidos activo',
    xp: '+150 XP',
    icon: Calendar,
  },
  {
    title: 'Racha de 7 Días',
    desc: '7 días seguidos activo',
    xp: '+300 XP',
    icon: Calendar,
  },
  {
    title: 'Racha de 30 Días',
    desc: '30 días seguidos activo',
    xp: '+1000 XP',
    icon: Crown,
  },
];

export function XPGuideModal({
  visible,
  targetDays = 3,
  onClose,
}: XPGuideModalProps) {
  const router = useRouter();
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentText = getContrastTextColor(colors.tint);

  const [activeTab, setActiveTab] = useState<'guide' | 'history'>('guide');
  const [xpHistory, setXpHistory] = useState<XPHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const borderTone = colors.border || (isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)');
  const subtleBg = getUnselectedControlColors(theme).backgroundColor;
  const themedCardStyle = getAppleSheetCardStyle(isDark, 20, theme);
  const rankInnerBg = getThemedModalSurfaceColor(theme);

  useEffect(() => {
    if (!visible) return;
    if (activeTab === 'history') {
      let active = true;
      setLoadingHistory(true);
      getXPHistory(50)
        .then(data => {
          if (!active) return;
          setXpHistory(Array.isArray(data) ? data : Array.isArray(data?.history) ? data.history : []);
        })
        .catch(() => {
          if (active) setXpHistory([]);
        })
        .finally(() => {
          if (active) setLoadingHistory(false);
        });
      return () => {
        active = false;
      };
    }
  }, [visible, activeTab]);

  const switchTab = (tab: 'guide' | 'history') => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setActiveTab(tab);
  };

  const handleOpenChallenges = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    onClose();
    router.push('/challenges' as any);
  };

  return (
    <SwipeableBottomSheet
      scrollable
      edgeToEdge
      visible={visible}
      onClose={onClose}
      isDark={isDark}
      backgroundColor={colors.card}
      height="88%"
      maxHeight="88%"
    >
      {/* Header con pestañas Guía / Historial igual que frontend */}
      <View style={[styles.header, { borderBottomColor: borderTone }]}>
        <View style={styles.headerTopRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={[styles.iconWrap, { backgroundColor: colors.tint }]}>
              <Star size={20} color={accentText} fill={accentText} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Sistema XP</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.closeBtn, { backgroundColor: subtleBg }]}
          >
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsRow}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => switchTab('guide')}
            style={[
              styles.tabButton,
              activeTab === 'guide' && { borderBottomColor: colors.tint },
            ]}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === 'guide' ? colors.tint : colors.textSecondary },
              ]}
            >
              Guía
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => switchTab('history')}
            style={[
              styles.tabButton,
              activeTab === 'history' && { borderBottomColor: colors.tint },
            ]}
          >
            <History
              size={15}
              color={activeTab === 'history' ? colors.tint : colors.textSecondary}
              strokeWidth={2.5}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === 'history' ? colors.tint : colors.textSecondary },
              ]}
            >
              Historial
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, minHeight: 0 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'guide' ? (
            <>
              {/* Banner Escudo de Racha Semanal */}
              <View
                style={[
                  styles.banner,
                  {
                    backgroundColor: colors.tint + '16',
                    borderColor: colors.tint + '38',
                    borderWidth: 1,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View style={[styles.shieldBadge, { backgroundColor: colors.tint }]}>
                    <Info size={18} color={accentText} strokeWidth={2.5} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.bannerLead, { color: colors.textSecondary }]}>
                      Gana XP realizando acciones diarias.
                    </Text>
                    <View style={[styles.shieldTagPill, { backgroundColor: colors.tint }]}>
                      <Text style={[styles.shieldTagText, { color: accentText }]}>
                        🛡️ Escudo de Racha Semanal:
                      </Text>
                    </View>
                    <Text style={[styles.bannerDesc, { color: colors.textSecondary }]}>
                      Cumple tu meta de{' '}
                      <Text style={{ fontWeight: '800', color: colors.text }}>
                        {targetDays} {targetDays === 1 ? 'día' : 'días'} de entrenamiento a la semana
                      </Text>{' '}
                      para proteger tu racha el resto de la semana. Además, los fines de semana y hasta 2 días laborables de descanso están protegidos.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Jerarquía de Rangos */}
              <View style={[styles.sectionCard, themedCardStyle]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <View style={[styles.miniBadge, { backgroundColor: colors.tint }]}>
                    <Shield size={14} color={accentText} strokeWidth={2.5} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    JERARQUÍA DE RANGOS
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingHorizontal: 2 }}
                >
                  {RANK_PREVIEWS.map(lvl => (
                    <View
                      key={lvl}
                      style={[
                        styles.rankItem,
                        {
                          backgroundColor: theme === 'light' ? '#FFFFFF' : getThemedModalCardColor(theme),
                          borderColor: borderTone,
                          borderWidth: 1,
                        },
                      ]}
                    >
                      <LevelBadge level={lvl} size="md" showName={true} bgTheme={rankInnerBg} />
                      <View
                        style={[
                          styles.rankLevelPill,
                          { backgroundColor: subtleBg, borderColor: borderTone, borderWidth: StyleSheet.hairlineWidth },
                        ]}
                      >
                        <Text style={[styles.rankLevel, { color: colors.textSecondary }]}>Nv. {lvl}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Recompensas de Personalización */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.miniBadge, { backgroundColor: colors.tint }]}>
                    <Trophy size={14} color={accentText} strokeWidth={2.5} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    RECOMPENSAS DE PERSONALIZACIÓN
                  </Text>
                </View>

                {PERSONALIZATION_REWARDS.map(reward => (
                  <View key={reward.title} style={[styles.actionRow, themedCardStyle]}>
                    <View style={[styles.rewardIconBox, { backgroundColor: colors.tint }]}>
                      <Palette size={20} color={accentText} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.actionTitle, { color: colors.text }]}>{reward.title}</Text>
                      <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>{reward.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Acciones Diarias */}
              <View style={styles.sectionBlock}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginLeft: 2 }]}>
                  ACCIONES DIARIAS
                </Text>

                {DAILY_ACTIONS.map(item => {
                  const Icon = item.icon;
                  const rowContent = (
                    <>
                      <View style={[styles.actionIconBox, { backgroundColor: rankInnerBg, borderColor: borderTone }]}>
                        <Icon size={19} color={item.iconColor} strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.actionTitle, { color: colors.text }]}>{item.title}</Text>
                        <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                      </View>
                      {item.xp ? (
                        <View style={[styles.xpCapsuleSolid, { backgroundColor: colors.tint }]}>
                          <Text style={[styles.xpCapsuleSolidText, { color: accentText }]} numberOfLines={1}>
                            {item.xp}
                          </Text>
                        </View>
                      ) : null}
                    </>
                  );

                  if (item.navigateToChallenges) {
                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.78}
                        onPress={handleOpenChallenges}
                        style={[styles.actionRow, themedCardStyle]}
                      >
                        {rowContent}
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <View key={item.id} style={[styles.actionRow, themedCardStyle]}>
                      {rowContent}
                    </View>
                  );
                })}
              </View>

              {/* Insignias y Hitos */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Crown size={16} color="#f59e0b" strokeWidth={2.5} />
                  <Text style={[styles.sectionTitle, { color: '#f59e0b' }]}>
                    INSIGNIAS Y HITOS
                  </Text>
                </View>

                {MILESTONES.map(milestone => {
                  const Icon = milestone.icon;
                  return (
                    <View
                      key={milestone.title}
                      style={[
                        styles.actionRow,
                        {
                          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.10)',
                          borderColor: 'rgba(245, 158, 11, 0.32)',
                          borderWidth: 1,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.actionIconBox,
                          { backgroundColor: rankInnerBg, borderColor: 'rgba(245, 158, 11, 0.35)' },
                        ]}
                      >
                        <Icon size={19} color="#f59e0b" strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.actionTitle, { color: colors.text }]}>{milestone.title}</Text>
                        <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                          {milestone.desc}
                        </Text>
                      </View>
                      <View style={styles.goldXpPill}>
                        <Text style={styles.goldXpText} numberOfLines={1}>
                          {milestone.xp}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          ) : loadingHistory ? (
            <View style={styles.historyEmptyCard}>
              <ActivityIndicator size="large" color={colors.tint} />
              <Text style={[styles.historyStatusText, { color: colors.textSecondary }]}>
                Cargando historial...
              </Text>
            </View>
          ) : xpHistory.length === 0 ? (
            <View style={[styles.historyEmptyCard, themedCardStyle]}>
              <History size={38} color={colors.textMuted || colors.textSecondary} strokeWidth={1.6} />
              <Text style={[styles.historyEmptyTitle, { color: colors.textSecondary }]}>
                No hay historial de XP aún
              </Text>
              <Text style={[styles.historyEmptySub, { color: colors.textMuted || colors.textSecondary }]}>
                Completa retos diarios o entrenamientos para ganar XP.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {xpHistory.map(log => {
                const isPositive = Number(log.amount) >= 0;
                const formattedDate = log.created_at
                  ? new Date(log.created_at).toLocaleString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';

                return (
                  <View key={String(log.id)} style={styles.historyRow}>
                    <View
                      style={[
                        styles.historyStarOuter,
                        { backgroundColor: rankInnerBg, borderColor: borderTone },
                      ]}
                    >
                      <View
                        style={[
                          styles.historyStarInner,
                          {
                            backgroundColor: isPositive
                              ? colors.tint
                              : 'rgba(239, 68, 68, 0.14)',
                          },
                        ]}
                      >
                        <Star
                          size={14}
                          color={isPositive ? accentText : '#ef4444'}
                          fill={isPositive ? accentText : 'transparent'}
                          strokeWidth={2.4}
                        />
                      </View>
                    </View>

                    <View style={[styles.historyCard, themedCardStyle]}>
                      <View style={styles.historyCardHeader}>
                        <Text style={[styles.historyReason, { color: colors.text }]}>
                          {log.reason || 'XP Obtenida'}
                        </Text>
                        <View
                          style={[
                            styles.historyAmountPill,
                            {
                              backgroundColor: isPositive
                                ? colors.tint
                                : 'rgba(239, 68, 68, 0.14)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.historyAmountText,
                              { color: isPositive ? accentText : '#ef4444' },
                            ]}
                          >
                            {isPositive ? '+' : ''}
                            {Number(log.amount || 0).toLocaleString('es-ES')} XP
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.xpDeltaPill,
                          { backgroundColor: subtleBg, borderColor: borderTone, borderWidth: StyleSheet.hairlineWidth },
                        ]}
                      >
                        <Text style={[styles.xpDeltaPrev, { color: colors.textSecondary }]}>
                          {Number(log.previous_xp || 0).toLocaleString('es-ES')} XP
                        </Text>
                        <ArrowRight size={11} color={colors.textMuted || colors.textSecondary} strokeWidth={2.5} />
                        <Text style={[styles.xpDeltaNext, { color: colors.text }]}>
                          {Number(log.new_xp || 0).toLocaleString('es-ES')} XP
                        </Text>
                      </View>

                      {formattedDate ? (
                        <View style={styles.historyDateRow}>
                          <Calendar size={11} color={colors.textMuted || colors.textSecondary} />
                          <Text style={[styles.historyDateText, { color: colors.textMuted || colors.textSecondary }]}>
                            {formattedDate}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
          <SafeAreaView edges={['bottom']} />
        </ScrollView>
      </View>
    </SwipeableBottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: Platform.OS === 'ios' ? '800' : '900',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 11,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  banner: {
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: 16,
  },
  shieldBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerLead: {
    fontSize: 13.5,
    fontWeight: '600',
    marginBottom: 6,
  },
  shieldTagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    marginBottom: 6,
  },
  shieldTagText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bannerDesc: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  sectionCard: {
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: 16,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
    marginLeft: 2,
  },
  miniBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  rankItem: {
    width: 128,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rankLevelPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rankLevel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderCurve: 'continuous',
    gap: 12,
  },
  rewardIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  xpCapsuleSolid: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    flexShrink: 0,
  },
  xpCapsuleSolidText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  goldXpPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    flexShrink: 0,
  },
  goldXpText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#f59e0b',
    letterSpacing: 0.3,
  },
  historyEmptyCard: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  historyStatusText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  historyEmptyTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  historyEmptySub: {
    fontSize: 12,
    textAlign: 'center',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  historyStarOuter: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    flexShrink: 0,
  },
  historyStarInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  historyReason: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '800',
  },
  historyAmountPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
  },
  historyAmountText: {
    fontSize: 11,
    fontWeight: '900',
  },
  xpDeltaPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
  },
  xpDeltaPrev: {
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.8,
    fontVariant: ['tabular-nums'],
  },
  xpDeltaNext: {
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  historyDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  historyDateText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
});
