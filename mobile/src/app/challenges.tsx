import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  ActivityIndicator,
  RefreshControl,
  Share,
  useWindowDimensions,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContentCardBackdrop } from '@/components/ui/ContentCardBackdrop';
import {
  Trophy,
  Users,
  Flame,
  Zap,
  Sparkles,
  Gift,
  Share2,
  Copy,
  CheckCircle2,
  ExternalLink,
  Info,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { FontAwesome5 } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as Haptics from 'expo-haptics';

import apiClient from '@/services/apiClient';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastTextColor } from '@/utils/colorUtils';
import { getThemeBaseBackground } from '@/constants/theme';
import GlobalHeader from '@/components/GlobalHeader';
import ThemeBackground from '@/components/ThemeBackground';
import RewardsModal from '@/components/modals/RewardsModal';
import { TourTarget } from '@/components/tutorials/TourTarget';
import { useRegisterTourScroll } from '@/components/tutorials/tourRegistry';

export interface Challenge {
  id: string;
  type: 'daily' | 'weekly' | 'general';
  target: number;
  xp: number;
  title: string;
  desc: string;
  progress: number;
  completed: boolean;
}

type TabKey = 'daily' | 'general' | 'completed';

function GlassSurface({
  radius,
  isDark,
  borderColor,
  tintColor,
  tintOpacity = 0,
  style,
  children,
}: {
  radius: number;
  isDark: boolean;
  borderColor: string;
  tintColor?: string;
  tintOpacity?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const innerRadius = Math.max(0, radius - 1);
  return (
    <View style={[{ borderRadius: radius, borderWidth: 1, borderColor }, style]}>
      <ContentCardBackdrop
        colorScheme={isDark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, { borderRadius: innerRadius }]}
      />
      {tintColor ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: innerRadius, backgroundColor: tintColor, opacity: tintOpacity },
          ]}
        />
      ) : null}
      {children}
    </View>
  );
}

interface ChallengeCardProps {
  challenge: Challenge;
  isDark: boolean;
  colors: any;
}

function ChallengeCard({ challenge, isDark, colors }: ChallengeCardProps) {
  const isCompleted = Boolean(challenge.completed);
  const target = challenge.target || 1;
  const progress = isCompleted ? target : (challenge.progress || 0);
  const percentage = isCompleted
    ? 100
    : Math.min(Math.round((progress / target) * 100), 100);

  return (
    <View
      style={[
        styles.challengeCard,
        {
          backgroundColor: isCompleted
            ? colors.tint + '1E'
            : isDark
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.03)',
          borderColor: isCompleted
            ? colors.tint + '55'
            : isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.05)',
        },
      ]}
    >
      {/* Sutil relleno de progreso de fondo que cubre toda la tarjeta cuando está completada */}
      <View
        pointerEvents="none"
        style={[
          styles.cardProgressFill,
          isCompleted
            ? StyleSheet.absoluteFill
            : {
                top: 0,
                left: 0,
                bottom: 0,
                width: `${percentage}%`,
              },
          {
            backgroundColor: isCompleted ? colors.tint + '1E' : colors.tint + '0E',
          },
        ]}
      />

      <View style={styles.cardInnerContent}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={[styles.cardTitle, { color: colors.text, flexShrink: 1 }]} numberOfLines={1}>
                {challenge.title}
              </Text>
              {challenge.type === 'weekly' && (
                <View
                  style={{
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 8,
                    backgroundColor: 'rgba(59, 130, 246, 0.16)',
                    borderWidth: 1,
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#3b82f6' }}>
                    SEMANAL
                  </Text>
                </View>
              )}
              {isCompleted && <CheckCircle2 size={16} color={colors.tint} />}
            </View>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
              {challenge.desc}
            </Text>
          </View>

          <View
            style={[
              styles.xpBadge,
              {
                flexShrink: 0,
                backgroundColor: colors.tint + '1E',
                borderColor: colors.tint + '33',
              },
            ]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={[styles.xpBadgeText, { color: colors.tint }]}
            >
              +{Number(challenge.xp || 25).toLocaleString('es-ES')} XP
            </Text>
          </View>
        </View>

        <View style={styles.cardProgressSection}>
          <View style={styles.progressLabelRow}>
            <Text
              style={[
                styles.progressStatusText,
                { color: isCompleted ? colors.tint : colors.text },
              ]}
            >
              {isCompleted ? '¡Completado!' : 'Progreso'}
            </Text>
            <Text style={[styles.progressCountText, { color: colors.textSecondary }]}>
              {progress} / {target}
            </Text>
          </View>

          <View
            style={[
              styles.progressBarTrack,
              {
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${percentage}%`,
                  backgroundColor: isCompleted ? '#10b981' : colors.tint,
                },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ChallengesScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);
  const scrollOffsetRef = useRef(0);
  useRegisterTourScroll('/challenges', scrollViewRef, React.useCallback(() => scrollOffsetRef.current, []));

  const isMobile = windowWidth < 600;

  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const userProfile = useAppStore(state => state.userProfile);

  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const tabContrastTextColor = getContrastTextColor(colors.tint);
  const isLightAccent = tabContrastTextColor === '#000000';
  const referralChipBg = isLightAccent ? 'rgba(0, 0, 0, 0.10)' : 'rgba(255, 255, 255, 0.18)';
  const referralChipBorder = isLightAccent ? 'rgba(0, 0, 0, 0.16)' : 'rgba(255, 255, 255, 0.3)';
  const referralSubtleInk = isLightAccent ? 'rgba(0, 0, 0, 0.78)' : 'rgba(255, 255, 255, 0.88)';
  const glassBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)';

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('daily');
  const [showRewardsModal, setShowRewardsModal] = useState(false);

  // Cargar retos desde el backend
  const fetchChallenges = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await apiClient('/gamification/challenges');
      if (Array.isArray(data)) {
        setChallenges(data);
      }
    } catch (err) {
      console.error('Error cargando retos en mobile:', err);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (
      userProfile?.id &&
      typeof localStorage !== 'undefined' &&
      localStorage.getItem(`visited_challenges_v2_${userProfile.id}`) !== 'true'
    ) {
      localStorage.setItem(`visited_challenges_v2_${userProfile.id}`, 'true');
    }
    fetchChallenges();
  }, [userProfile?.id, fetchChallenges]);

  const safeChallenges = Array.isArray(challenges) ? challenges : [];

  const dailyChallenges = safeChallenges
    .filter(c => c.type === 'daily')
    .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));

  const generalChallenges = safeChallenges
    .filter(c => c.type === 'general' || c.type === 'weekly')
    .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));

  const completedChallenges = safeChallenges.filter(c => c && c.completed);

  const handleCopyReferral = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const referralLink = `https://profitnessglass.es/register?ref=${userProfile?.referral_code || ''}`;
      await Clipboard.setStringAsync(referralLink);
      useAppStore.getState().showToast?.('¡Enlace de referido copiado!');
    } catch {}
  };

  const handleShareReferral = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const referralLink = `https://profitnessglass.es/register?ref=${userProfile?.referral_code || ''}`;
      await Share.share({
        title: 'Únete a Pro Fitness Glass',
        message: `¡Únete a Pro Fitness Glass y sube de nivel conmigo! Regístrate gratis aquí: ${referralLink}`,
        url: referralLink,
      });
    } catch (err) {
      console.warn('Error compartiendo código de referido:', err);
    }
  };

  const handleTabChange = (tab: TabKey) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setActiveTab(tab);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background === 'transparent' ? getThemeBaseBackground(theme) : colors.background }}>
      <ThemeBackground />

      {/* Header fijo superior con botón de regreso */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }} pointerEvents="box-none">
        <TourTarget id="#tutorial-challenges-header">
          <GlobalHeader title="Retos y Misiones" scrollY={scrollY} showBackButton />
        </TourTarget>
      </View>

      <Animated.ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{
          paddingHorizontal: isMobile ? 14 : Math.max(16, (windowWidth - 640) / 2),
          paddingTop: insets.top + 72,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
          listener: (e: any) => {
            scrollOffsetRef.current = e?.nativeEvent?.contentOffset?.y || 0;
          },
        })}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchChallenges(true)}
            tintColor={colors.tint}
            colors={[colors.tint]}
          />
        }
      >
        {/* ================= RETO INFINITO: INVITAR A UN AMIGO ================= */}
        <TourTarget id="#tutorial-challenges-referral">
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleCopyReferral}
          style={[
            styles.referralBanner,
            {
              backgroundColor: colors.tint,
              borderColor: referralChipBorder,
              shadowColor: colors.tint,
            },
          ]}
        >
          {/* Brillo de fondo Glass */}
          <View pointerEvents="none" style={styles.referralBannerGlow} />

          <View style={styles.referralTopRow}>
            <View style={[styles.referralIconBox, { backgroundColor: referralChipBg }]}>
              <Users size={28} color={tabContrastTextColor} strokeWidth={2.4} />
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.referralTitle, { color: tabContrastTextColor }]}>Invitar a un amigo</Text>
              <Text style={[styles.referralDesc, { color: referralSubtleInk }]}>
                Infinito • Pide a un amigo que se registre con tu enlace y obtén 1.000 XP cada vez
                que alguien nuevo lo haga.
              </Text>
            </View>

            <View style={[styles.referralXpBadge, { backgroundColor: referralChipBg, borderColor: referralChipBorder }]}>
              <Text style={[styles.referralXpVal, { color: tabContrastTextColor }]}>+1k</Text>
              <Text style={[styles.referralXpUnit, { color: referralSubtleInk }]}>XP</Text>
            </View>
          </View>

          {/* Código de referido y acciones */}
          <View style={styles.referralActionsRow}>
            <View style={[styles.codePill, { backgroundColor: referralChipBg, borderColor: referralChipBorder }]}>
              <Text style={[styles.codePillText, { color: tabContrastTextColor }]}>
                {userProfile?.referral_code || 'Cargando...'}
              </Text>
              <Copy size={13} color={referralSubtleInk} style={{ marginLeft: 4 }} />
              <Text style={[styles.codePillHint, { color: referralSubtleInk }]}>Toca para copiar</Text>
            </View>

            <TouchableOpacity
              onPress={e => {
                e.stopPropagation();
                handleShareReferral();
              }}
              style={[styles.shareButton, { backgroundColor: referralChipBg }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Share2 size={16} color={tabContrastTextColor} />
            </TouchableOpacity>
          </View>

          {/* Botón Ver Recompensas con miniaturas */}
          <TouchableOpacity
            onPress={e => {
              e.stopPropagation();
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              setShowRewardsModal(true);
            }}
            activeOpacity={0.8}
            style={[styles.rewardsButton, { backgroundColor: referralChipBg, borderColor: referralChipBorder }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 2 }}>
              <ExpoImage source={require('../../assets/images/galaxy.jpg')} style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }} contentFit="cover" />
              <ExpoImage source={require('../../assets/images/desert.jpg')} style={{ width: 20, height: 20, borderRadius: 10, marginLeft: -6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }} contentFit="cover" />
              <ExpoImage source={require('../../assets/images/ocean.jpg')} style={{ width: 20, height: 20, borderRadius: 10, marginLeft: -6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }} contentFit="cover" />
            </View>
            <FontAwesome5 name="gift" size={14} color={tabContrastTextColor} />
            <Text style={[styles.rewardsButtonText, { color: tabContrastTextColor }]}>
              Ver temas y recompensas (Llevas {userProfile?.referralCount || 0})
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
        </TourTarget>

        {/* ================= 3. SEGMENTED TABS ================= */}
        <TourTarget id="#tutorial-challenges-tabs">
        <View
          style={[
            styles.tabsContainer,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => handleTabChange('daily')}
            activeOpacity={0.8}
            style={[
              styles.tabBtn,
              activeTab === 'daily' && {
                backgroundColor: colors.tint,
                shadowColor: colors.tint,
                shadowOpacity: 0.35,
                shadowRadius: 6,
                elevation: 3,
              },
            ]}
          >
            <Text
              style={[
                styles.tabBtnText,
                {
                  color: activeTab === 'daily' ? tabContrastTextColor : colors.textSecondary,
                  fontWeight: activeTab === 'daily' ? '800' : '600',
                },
              ]}
            >
              Diarios
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTabChange('general')}
            activeOpacity={0.8}
            style={[
              styles.tabBtn,
              activeTab === 'general' && {
                backgroundColor: colors.tint,
                shadowColor: colors.tint,
                shadowOpacity: 0.35,
                shadowRadius: 6,
                elevation: 3,
              },
            ]}
          >
            <Text
              style={[
                styles.tabBtnText,
                {
                  color: activeTab === 'general' ? tabContrastTextColor : colors.textSecondary,
                  fontWeight: activeTab === 'general' ? '800' : '600',
                },
              ]}
            >
              Generales
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTabChange('completed')}
            activeOpacity={0.8}
            style={[
              styles.tabBtn,
              activeTab === 'completed' && {
                backgroundColor: colors.tint,
                shadowColor: colors.tint,
                shadowOpacity: 0.35,
                shadowRadius: 6,
                elevation: 3,
              },
            ]}
          >
            <Text
              style={[
                styles.tabBtnText,
                {
                  color: activeTab === 'completed' ? tabContrastTextColor : colors.textSecondary,
                  fontWeight: activeTab === 'completed' ? '800' : '600',
                },
              ]}
            >
              Completados
            </Text>
          </TouchableOpacity>
        </View>
        </TourTarget>

        {/* ================= 4. CONTENIDO DE PESTAÑAS ================= */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Cargando retos...
            </Text>
          </View>
        ) : activeTab === 'daily' ? (
          <View style={styles.tabContent}>
            {/* Nutrición Diaria */}
            <View style={styles.sectionGroup}>
              <View style={styles.sectionTitleRow}>
                <Flame size={20} color="#f97316" strokeWidth={2.4} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Nutrición</Text>
              </View>
              <View style={styles.challengesList}>
                {dailyChallenges
                  .filter(c =>
                    ['daily_5_meals', 'daily_calories', 'daily_protein', 'daily_water'].includes(
                      c.id
                    )
                  )
                  .map(c => (
                    <ChallengeCard
                      key={c.id}
                      challenge={c}
                      isDark={isDark}
                      colors={colors}
                    />
                  ))}
              </View>
            </View>

            {/* Entrenamiento Diario */}
            <View style={styles.sectionGroup}>
              <View style={styles.sectionTitleRow}>
                <Zap size={20} color="#eab308" strokeWidth={2.4} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Entrenamiento</Text>
              </View>
              <View style={styles.challengesList}>
                {dailyChallenges
                  .filter(c =>
                    ['daily_workout', 'daily_progressive_overload'].includes(c.id)
                  )
                  .map(c => (
                    <ChallengeCard
                      key={c.id}
                      challenge={c}
                      isDark={isDark}
                      colors={colors}
                    />
                  ))}
              </View>
            </View>

            {/* Social y Muro */}
            <View style={styles.sectionGroup}>
              <View style={styles.sectionTitleRow}>
                <Users size={20} color={colors.tint} strokeWidth={2.4} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Social y Muro</Text>
              </View>

              {/* Banner informativo del Muro */}
              <View
                style={[
                  styles.wallInfoBanner,
                  {
                    backgroundColor: colors.tint + '14',
                    borderColor: colors.tint + '2A',
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Zap size={14} color={colors.tint} />
                  <Text style={[styles.wallInfoBannerTitle, { color: colors.tint }]}>
                    Interactuar en el Muro suma XP cada día
                  </Text>
                </View>
                <Text style={[styles.wallInfoBannerText, { color: colors.textSecondary }]}>
                  Dar reacciones rápidas (🔥 Fuego · 💪 Bestia · 🫡 Respeto · 🏆 PR), comentar entrenos y
                  compartir tus sesiones en Global, Mi Gimnasio o Amigos te otorga +25 XP por misión.
                </Text>
              </View>

              <View style={styles.challengesList}>
                {dailyChallenges
                  .filter(c => c.id.startsWith('social_'))
                  .map(c => (
                    <ChallengeCard
                      key={c.id}
                      challenge={c}
                      isDark={isDark}
                      colors={colors}
                    />
                  ))}
              </View>
            </View>
          </View>
        ) : activeTab === 'general' ? (
          <View style={styles.tabContent}>
            {/* Social General */}
            <View style={styles.sectionGroup}>
              <View style={styles.sectionTitleRow}>
                <Users size={20} color={colors.tint} strokeWidth={2.4} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Social</Text>
              </View>
              <View style={styles.challengesList}>
                {generalChallenges
                  .filter(c => c.id.startsWith('social_'))
                  .map(c => (
                    <ChallengeCard
                      key={c.id}
                      challenge={c}
                      isDark={isDark}
                      colors={colors}
                    />
                  ))}
              </View>
            </View>

            {/* Entrenamiento General */}
            <View style={styles.sectionGroup}>
              <View style={styles.sectionTitleRow}>
                <Zap size={20} color="#eab308" strokeWidth={2.4} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Entrenamiento</Text>
              </View>
              <View style={styles.challengesList}>
                {generalChallenges
                  .filter(c => c.id.startsWith('train_'))
                  .map(c => (
                    <ChallengeCard
                      key={c.id}
                      challenge={c}
                      isDark={isDark}
                      colors={colors}
                    />
                  ))}
              </View>
            </View>

            {/* Nutrición General */}
            <View style={styles.sectionGroup}>
              <View style={styles.sectionTitleRow}>
                <Flame size={20} color="#f97316" strokeWidth={2.4} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Nutrición</Text>
              </View>
              <View style={styles.challengesList}>
                {generalChallenges
                  .filter(c => c.id.startsWith('nutri_'))
                  .map(c => (
                    <ChallengeCard
                      key={c.id}
                      challenge={c}
                      isDark={isDark}
                      colors={colors}
                    />
                  ))}
              </View>
            </View>

            {/* Inteligencia Artificial */}
            <View style={styles.sectionGroup}>
              <View style={styles.sectionTitleRow}>
                <Sparkles size={20} color="#a855f7" strokeWidth={2.4} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Inteligencia Artificial
                </Text>
              </View>
              <View style={styles.challengesList}>
                {generalChallenges
                  .filter(c => c.id.startsWith('ai_'))
                  .map(c => (
                    <ChallengeCard
                      key={c.id}
                      challenge={c}
                      isDark={isDark}
                      colors={colors}
                    />
                  ))}
              </View>
            </View>
          </View>
        ) : (
          /* Pestaña Completados */
          <View style={styles.tabContent}>
            {completedChallenges.length > 0 ? (
              <View style={styles.challengesList}>
                {completedChallenges.map(c => (
                  <ChallengeCard
                    key={c.id}
                    challenge={c}
                    isDark={isDark}
                    colors={colors}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Trophy size={48} color={colors.textSecondary} style={{ opacity: 0.4 }} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Aún no has completado ningún reto
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  ¡Empieza a ganar XP completando misiones en las otras pestañas!
                </Text>
              </View>
            )}
          </View>
        )}
      </Animated.ScrollView>

      {/* Modal de Recompensas */}
      <RewardsModal
        visible={showRewardsModal}
        onClose={() => setShowRewardsModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  referralBanner: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  referralBannerGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  referralTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  referralIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  referralTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  referralDesc: {
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  referralXpBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 48,
  },
  referralXpVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  referralXpUnit: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
  },
  referralActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  codePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  codePillText: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  codePillHint: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.65)',
    textTransform: 'uppercase',
    marginLeft: 'auto',
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  rewardsButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnText: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabContent: {
    gap: 22,
  },
  sectionGroup: {
    gap: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  wallInfoBanner: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 4,
  },
  wallInfoBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  wallInfoBannerText: {
    fontSize: 11,
    lineHeight: 15,
  },
  challengesList: {
    gap: 10,
  },
  challengeCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardInnerContent: {
    padding: 14,
  },
  cardProgressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  xpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  xpBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardProgressSection: {
    marginTop: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressStatusText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  progressCountText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 7,
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3.5,
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});
