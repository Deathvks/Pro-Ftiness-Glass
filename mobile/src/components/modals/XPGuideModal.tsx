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
  Clock,
  Crown,
  Droplets,
  Dumbbell,
  Flame,
  Footprints,
  History,
  LogIn,
  Palette,
  Plus,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Trophy,
  Utensils,
  Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { LiquidCloseButton } from '@/components/ui/GlassButton';
import LevelBadge from '@/components/LevelBadge';
import { getThemedModalCardColor, getThemedModalSurfaceColor } from '@/components/ui/ModalThemeBackground';
import { SwipeableBottomSheet, getAppleSheetCardStyle } from '@/components/ui/SwipeableBottomSheet';
import { getUnselectedControlColors } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { getXPHistory } from '@/services/gamificationService';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';
import {
  formatXpBoostCountdown,
  formatXpMultiplier,
  getActiveXpBoost,
  getBoostedXpAmount,
  getNextXpBoostMilestone,
} from '@/utils/xpBoost';

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

const PERSONALIZATION_UNLOCKS = [
  { level: 5, title: 'Nivel 5', tag: 'x1,5 XP', desc: '5 tonos pastel: Menta, Melocotón, Rosas, Lavanda y Azul.' },
  { level: 10, title: 'Nivel 10', tag: 'x2 XP', desc: '5 pasteles vibrantes: Atardecer, Pistacho, Mango, Lima y Cerezo.' },
  { level: 15, title: 'Nivel 15', tag: 'x1,5 XP', desc: 'Degradados: Aurora, Sunset, Cyberpunk, Océano y Oro.' },
  { level: 20, title: 'Nivel 20', tag: 'x2 XP', desc: 'Acentos animados + atmósfera Aurora en el inicio.' },
];

const DAILY_ACTIONS = [
  { id: 'login', title: 'Conexión Diaria', desc: 'Por entrar a la app hoy', baseXp: 25, icon: LogIn, iconColor: '#10b981' },
  { id: 'workout', title: 'Entrenamiento', desc: 'Completa una sesión hoy (Reto)', baseXp: 100, icon: Dumbbell, iconColor: '#3b82f6' },
  { id: 'meals', title: '5 Comidas', desc: 'Registra al menos 5 alimentos (Reto)', baseXp: 50, icon: Utensils, iconColor: '#f97316' },
  { id: 'calories', title: 'Objetivo Calórico', desc: 'Alcanza tu meta diaria de calorías', baseXp: 50, icon: Flame, iconColor: '#ef4444' },
  { id: 'protein', title: 'Objetivo Proteína', desc: 'Alcanza tu meta diaria de proteína', baseXp: 50, icon: ChefHat, iconColor: '#f43f5e' },
  { id: 'water', title: 'Hidratación', desc: 'Completa el agua recomendada hoy', baseXp: 30, icon: Droplets, iconColor: '#06b6d4' },
  { id: 'wall_post', title: 'Publicar Entreno', desc: 'Comparte sesión en el Muro', baseXp: 25, icon: Plus, iconColor: '#10b981' },
  { id: 'wall_comment', title: 'Comentar Sesiones', desc: 'Comenta 2 posts en el Muro', baseXp: 25, icon: Footprints, iconColor: '#6366f1' },
  { id: 'wall_react', title: 'Reacciones Muro', desc: 'Envía 2 reacciones rápidas', baseXp: 25, icon: Zap, iconColor: '#ec4899' },
  { id: 'more', title: 'Ver todos los retos', desc: 'Descubre retos diarios y de temporada', baseXp: 0, icon: Star, iconColor: '#a855f7', navigateToChallenges: true },
];

const MILESTONES = [
  { title: 'Primer Paso', desc: 'Primera sesión iniciada', baseXp: 50, icon: Rocket },
  { title: '1º Entrenamiento', desc: 'Al completar el primero', baseXp: 100, icon: Trophy },
  { title: 'Chef', desc: 'Por registrar 5 comidas', baseXp: 100, icon: ChefHat },
  { title: 'Racha 3 Días', desc: '3 días seguidos activo', baseXp: 150, icon: Calendar },
  { title: 'Racha 7 Días', desc: '7 días seguidos activo', baseXp: 300, icon: Calendar },
  { title: 'Racha 30 Días', desc: '30 días seguidos activo', baseXp: 1000, icon: Crown },
];

export function XPGuideModal({
  visible,
  targetDays = 3,
  onClose,
}: XPGuideModalProps) {
  const router = useRouter();
  const theme = useAppStore(state => state.theme) || 'oled';
  const gamification = useAppStore(state => state.gamification);
  const currentLevel = Number(gamification?.level || 1);
  const rawBoost = (gamification as any)?.xpBoost;
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentText = getContrastTextColor(colors.tint);

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [activeTab, setActiveTab] = useState<'guide' | 'history'>('guide');
  const [xpHistory, setXpHistory] = useState<XPHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const activeBoost = getActiveXpBoost(rawBoost, nowMs);
  const nextMilestone = getNextXpBoostMilestone(currentLevel);

  const borderTone = colors.border || (isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)');
  const subtleBg = getUnselectedControlColors(theme).backgroundColor;
  const themedCardStyle = getAppleSheetCardStyle(isDark, 20, theme);
  const rankInnerBg = getThemedModalSurfaceColor(theme);

  useEffect(() => {
    if (!visible || !rawBoost?.expiresAt) return;
    setNowMs(Date.now());
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [visible, rawBoost?.expiresAt]);

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

  const isX2 = (activeBoost?.multiplier || 1) >= 2;

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
      {/* Header moderno con selector segmentado */}
      <View style={[styles.header, { borderBottomColor: borderTone }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.titleCluster}>
            <View style={[styles.iconWrap, { backgroundColor: colors.tint }]}>
              <Star size={18} color={accentText} fill={accentText} />
            </View>
            <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
              Sistema XP
            </Text>
            <View style={[styles.levelChip, { backgroundColor: colors.tint + '1F' }]}>
              <Text numberOfLines={1} style={[styles.levelChipText, { color: colors.tint }]}>
                Nv. {currentLevel}
              </Text>
            </View>
          </View>
          <LiquidCloseButton
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            iconColor={colors.textSecondary}
            style={styles.closeBtn}
          />
        </View>

        <View
          style={[
            styles.segmentedTrack,
            {
              backgroundColor: subtleBg,
              borderColor: borderTone,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => switchTab('guide')}
            style={[
              styles.segmentedBtn,
              activeTab === 'guide' && { backgroundColor: colors.tint },
            ]}
          >
            <Sparkles size={14} color={activeTab === 'guide' ? accentText : colors.textSecondary} />
            <Text
              numberOfLines={1}
              style={[
                styles.segmentedLabel,
                { color: activeTab === 'guide' ? accentText : colors.textSecondary },
              ]}
            >
              Guía XP
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => switchTab('history')}
            style={[
              styles.segmentedBtn,
              activeTab === 'history' && { backgroundColor: colors.tint },
            ]}
          >
            <History
              size={14}
              color={activeTab === 'history' ? accentText : colors.textSecondary}
              strokeWidth={2.5}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.segmentedLabel,
                { color: activeTab === 'history' ? accentText : colors.textSecondary },
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
              {/* 1. Hero Boost Semanal + Contador */}
              {activeBoost ? (
                <View
                  style={[
                    styles.heroCard,
                    {
                      backgroundColor: isX2 ? 'rgba(245, 158, 11, 0.14)' : colors.tint + '18',
                      borderColor: isX2 ? 'rgba(245, 158, 11, 0.42)' : colors.tint + '44',
                    },
                  ]}
                >
                  <View style={styles.heroTopRow}>
                    <View style={styles.heroTitleGroup}>
                      <View
                        style={[
                          styles.heroMiniIcon,
                          { backgroundColor: isX2 ? '#f59e0b' : colors.tint },
                        ]}
                      >
                        <Zap size={14} color={isX2 ? '#0f172a' : accentText} strokeWidth={2.6} />
                      </View>
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.82}
                        style={[styles.heroTitle, { color: colors.text }]}
                      >
                        Boost {formatXpMultiplier(activeBoost.multiplier)} en curso
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.countdownPill,
                        {
                          backgroundColor: isX2 ? 'rgba(245, 158, 11, 0.22)' : colors.tint,
                          borderColor: isX2 ? 'rgba(245, 158, 11, 0.45)' : 'transparent',
                        },
                      ]}
                    >
                      <Clock size={12} color={isX2 ? '#f59e0b' : accentText} strokeWidth={2.6} />
                      <Text
                        numberOfLines={1}
                        style={[styles.countdownText, { color: isX2 ? '#f59e0b' : accentText }]}
                      >
                        {formatXpBoostCountdown(activeBoost.remainingMs)}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.boostProgressTrack,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' },
                    ]}
                  >
                    <View
                      style={[
                        styles.boostProgressFill,
                        {
                          width: `${activeBoost.progressRemainingPct}%`,
                          backgroundColor: isX2 ? '#f59e0b' : colors.tint,
                        },
                      ]}
                    />
                  </View>

                  <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
                    Activado al alcanzar el{' '}
                    <Text style={{ fontWeight: '800', color: colors.text }}>Nivel {activeBoost.level}</Text>. Lo que vale
                    200 XP suma{' '}
                    <Text style={{ fontWeight: '800', color: isX2 ? '#f59e0b' : colors.tint }}>
                      {Math.round(200 * activeBoost.multiplier)} XP
                    </Text>
                    . Al terminar la semana vuelve a x1.
                  </Text>
                </View>
              ) : (
                <View style={[styles.heroCard, themedCardStyle]}>
                  <View style={styles.heroTopRow}>
                    <View style={styles.heroTitleGroup}>
                      <Clock size={15} color={colors.tint} strokeWidth={2.5} />
                      <Text numberOfLines={1} style={[styles.heroTitle, { color: colors.text }]}>
                        Multiplicador: x1
                      </Text>
                    </View>
                    <View style={[styles.nextMilestonePill, { backgroundColor: colors.tint + '1E' }]}>
                      <Text numberOfLines={1} style={[styles.nextMilestoneText, { color: colors.tint }]}>
                        Próx: Nv. {nextMilestone.level} ({formatXpMultiplier(nextMilestone.multiplier)})
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
                    Al subir a niveles acabados en{' '}
                    <Text style={{ fontWeight: '800', color: colors.text }}>5</Text> o{' '}
                    <Text style={{ fontWeight: '800', color: colors.text }}>0</Text> activas 1 semana de XP multiplicada.
                  </Text>
                </View>
              )}

              {/* 2. Reglas de Multiplicadores Semanales */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderBetween}>
                  <View style={styles.sectionHeaderRow}>
                    <Zap size={13} color={colors.tint} strokeWidth={2.6} />
                    <Text numberOfLines={1} style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                      MULTIPLICADORES SEMANALES
                    </Text>
                  </View>
                  <Text numberOfLines={1} style={[styles.sectionSubTag, { color: colors.textSecondary }]}>
                    7 días por hito
                  </Text>
                </View>

                <View style={styles.rulesGrid}>
                  <View
                    style={[
                      styles.ruleBox,
                      {
                        backgroundColor: colors.tint + '14',
                        borderColor: colors.tint + '38',
                      },
                    ]}
                  >
                    <View style={styles.ruleTopRow}>
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                        style={[styles.ruleTitle, { color: colors.text }]}
                      >
                        Niveles ...5
                      </Text>
                      <View style={[styles.ruleBadge, { backgroundColor: colors.tint }]}>
                        <Text numberOfLines={1} style={[styles.ruleBadgeText, { color: accentText }]}>
                          x1,5 XP
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.ruleDesc, { color: colors.textSecondary }]}>
                      5, 15, 25, 35... · 200 → 300 XP
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.ruleBox,
                      {
                        backgroundColor: 'rgba(245, 158, 11, 0.12)',
                        borderColor: 'rgba(245, 158, 11, 0.36)',
                      },
                    ]}
                  >
                    <View style={styles.ruleTopRow}>
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                        style={[styles.ruleTitle, { color: colors.text }]}
                      >
                        Niveles ...0
                      </Text>
                      <View style={[styles.ruleBadge, { backgroundColor: '#f59e0b' }]}>
                        <Text numberOfLines={1} style={[styles.ruleBadgeText, { color: '#0f172a' }]}>
                          x2 XP
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.ruleDesc, { color: colors.textSecondary }]}>
                      10, 20, 30, 40... · 200 → 400 XP
                    </Text>
                  </View>
                </View>

                <Text style={[styles.ruleFootnote, { color: colors.textSecondary }]}>
                  Pasada la semana vuelve automáticamente a x1. Solo se activa en los niveles terminados en 5 o 0.
                </Text>
              </View>

              {/* 3. Escudo Semanal */}
              <View
                style={[
                  styles.heroCard,
                  {
                    backgroundColor: 'rgba(16, 185, 129, 0.10)',
                    borderColor: 'rgba(16, 185, 129, 0.28)',
                  },
                ]}
              >
                <View style={styles.heroTopRow}>
                  <View style={styles.heroTitleGroup}>
                    <Shield size={15} color="#10b981" strokeWidth={2.5} />
                    <Text numberOfLines={1} style={[styles.heroTitle, { color: colors.text }]}>
                      Escudo Semanal
                    </Text>
                  </View>
                  <View style={[styles.nextMilestonePill, { backgroundColor: 'rgba(16, 185, 129, 0.20)' }]}>
                    <Text numberOfLines={1} style={[styles.nextMilestoneText, { color: '#10b981' }]}>
                      {targetDays} {targetDays === 1 ? 'día/sem' : 'días/sem'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
                  Cumple tu meta semanal para blindar tu racha el resto de la semana. Fines de semana y hasta 2 días laborables están protegidos.
                </Text>
              </View>

              {/* 4. Jerarquía de Rangos */}
              <View style={[styles.sectionCard, themedCardStyle]}>
                <View style={[styles.sectionHeaderRow, { marginBottom: 14 }]}>
                  <Crown size={14} color={colors.tint} strokeWidth={2.5} />
                  <Text numberOfLines={1} style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    JERARQUÍA DE RANGOS
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}
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
                        <Text numberOfLines={1} style={[styles.rankLevel, { color: colors.textSecondary }]}>
                          Nv. {lvl}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* 5. Desbloqueos de Estilo */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Palette size={14} color={colors.tint} strokeWidth={2.5} />
                  <Text numberOfLines={1} style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    DESBLOQUEOS DE ESTILO
                  </Text>
                </View>

                {PERSONALIZATION_UNLOCKS.map(reward => {
                  const isEven10 = reward.level % 10 === 0;
                  return (
                    <View key={reward.level} style={[styles.actionRow, themedCardStyle]}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={[styles.actionTitle, { color: colors.text }]}>
                          {reward.title}
                        </Text>
                        <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>{reward.desc}</Text>
                      </View>
                      <View
                        style={[
                          styles.xpCapsuleSoft,
                          {
                            backgroundColor: isEven10 ? 'rgba(245, 158, 11, 0.18)' : colors.tint + '1D',
                            borderColor: isEven10 ? 'rgba(245, 158, 11, 0.40)' : colors.tint + '38',
                          },
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={[styles.xpCapsuleSoftText, { color: isEven10 ? '#f59e0b' : colors.tint }]}
                        >
                          {reward.tag}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* 6. Acciones Diarias */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderBetween}>
                  <Text numberOfLines={1} style={[styles.sectionTitle, { color: colors.textSecondary, marginLeft: 2 }]}>
                    ACCIONES DIARIAS
                  </Text>
                  {activeBoost ? (
                    <Text numberOfLines={1} style={{ fontSize: 10.5, fontWeight: '800', color: colors.tint }}>
                      Con {formatXpMultiplier(activeBoost.multiplier)} aplicado
                    </Text>
                  ) : null}
                </View>

                {DAILY_ACTIONS.map(item => {
                  const Icon = item.icon;
                  const displayedXp = item.baseXp > 0 ? getBoostedXpAmount(item.baseXp, activeBoost) : 0;
                  const rowContent = (
                    <>
                      <View style={[styles.actionIconBox, { backgroundColor: rankInnerBg, borderColor: borderTone }]}>
                        <Icon size={18} color={item.iconColor} strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.85}
                          style={[styles.actionTitle, { color: colors.text }]}
                        >
                          {item.title}
                        </Text>
                        <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                      </View>
                      {displayedXp > 0 ? (
                        <View style={[styles.xpCapsuleSolid, { backgroundColor: colors.tint }]}>
                          <Text numberOfLines={1} style={[styles.xpCapsuleSolidText, { color: accentText }]}>
                            +{displayedXp} XP
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

              {/* 7. Insignias y Hitos */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Crown size={15} color="#f59e0b" strokeWidth={2.5} />
                  <Text numberOfLines={1} style={[styles.sectionTitle, { color: '#f59e0b' }]}>
                    INSIGNIAS Y HITOS
                  </Text>
                </View>

                {MILESTONES.map(milestone => {
                  const Icon = milestone.icon;
                  const displayedXp = getBoostedXpAmount(milestone.baseXp, activeBoost);
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
                        <Icon size={18} color="#f59e0b" strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.85}
                          style={[styles.actionTitle, { color: colors.text }]}
                        >
                          {milestone.title}
                        </Text>
                        <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                          {milestone.desc}
                        </Text>
                      </View>
                      <View style={styles.goldXpPill}>
                        <Text numberOfLines={1} style={styles.goldXpText}>
                          +{displayedXp} XP
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
            <View style={{ gap: 10 }}>
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
                          size={13}
                          color={isPositive ? accentText : '#ef4444'}
                          fill={isPositive ? accentText : 'transparent'}
                          strokeWidth={2.4}
                        />
                      </View>
                    </View>

                    <View style={[styles.historyCard, themedCardStyle]}>
                      <View style={styles.historyCardHeader}>
                        <Text numberOfLines={1} style={[styles.historyReason, { color: colors.text }]}>
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
                            numberOfLines={1}
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

                      <View style={styles.historyMetaRow}>
                        <View
                          style={[
                            styles.xpDeltaPill,
                            { backgroundColor: subtleBg, borderColor: borderTone, borderWidth: StyleSheet.hairlineWidth },
                          ]}
                        >
                          <Text numberOfLines={1} style={[styles.xpDeltaPrev, { color: colors.textSecondary }]}>
                            {Number(log.previous_xp || 0).toLocaleString('es-ES')} XP
                          </Text>
                          <ArrowRight size={10} color={colors.textMuted || colors.textSecondary} strokeWidth={2.5} />
                          <Text numberOfLines={1} style={[styles.xpDeltaNext, { color: colors.text }]}>
                            {Number(log.new_xp || 0).toLocaleString('es-ES')} XP
                          </Text>
                        </View>

                        {formattedDate ? (
                          <View style={styles.historyDateRow}>
                            <Calendar size={10} color={colors.textMuted || colors.textSecondary} />
                            <Text numberOfLines={1} style={[styles.historyDateText, { color: colors.textMuted || colors.textSecondary }]}>
                              {formattedDate}
                            </Text>
                          </View>
                        ) : null}
                      </View>
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
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: 19,
    fontWeight: Platform.OS === 'ios' ? '800' : '900',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  levelChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    flexShrink: 0,
  },
  levelChipText: {
    fontSize: 11,
    fontWeight: '900',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  segmentedTrack: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  segmentedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  segmentedLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    gap: 18,
  },
  heroCard: {
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heroTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  heroMiniIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroTitle: {
    fontSize: 14,
    fontWeight: '900',
    flexShrink: 1,
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 0,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  boostProgressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
  },
  boostProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  nextMilestonePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    flexShrink: 0,
  },
  nextMilestoneText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  heroDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
  },
  sectionBlock: {
    gap: 9,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sectionSubTag: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  rulesGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  ruleBox: {
    flex: 1,
    minWidth: 0,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 5,
  },
  ruleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  ruleTitle: {
    fontSize: 12,
    fontWeight: '900',
    flexShrink: 1,
  },
  ruleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    flexShrink: 0,
  },
  ruleBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  ruleDesc: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  ruleFootnote: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    marginLeft: 2,
  },
  sectionCard: {
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: 14,
  },
  rankItem: {
    width: 118,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rankLevelPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 7,
  },
  rankLevel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderCurve: 'continuous',
    gap: 10,
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  actionDesc: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    marginTop: 2,
  },
  xpCapsuleSoft: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
    flexShrink: 0,
  },
  xpCapsuleSoftText: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  xpCapsuleSolid: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
    flexShrink: 0,
  },
  xpCapsuleSolidText: {
    fontSize: 11,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  goldXpPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    flexShrink: 0,
  },
  goldXpText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#f59e0b',
    fontVariant: ['tabular-nums'],
  },
  historyEmptyCard: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  historyStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  historyEmptyTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  historyEmptySub: {
    fontSize: 12,
    textAlign: 'center',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  historyStarOuter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    flexShrink: 0,
  },
  historyStarInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  historyReason: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  historyAmountPill: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    flexShrink: 0,
  },
  historyAmountText: {
    fontSize: 11,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  xpDeltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  xpDeltaPrev: {
    fontSize: 10.5,
    fontWeight: '700',
    opacity: 0.8,
    fontVariant: ['tabular-nums'],
  },
  xpDeltaNext: {
    fontSize: 10.5,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  historyDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyDateText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
});
