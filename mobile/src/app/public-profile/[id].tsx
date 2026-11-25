import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Award,
  BadgeCheck,
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Download,
  Dumbbell,
  EyeOff,
  Flame,
  Folder,
  Globe,
  Lock,
  MapPin,
  Medal,
  Pencil,
  Shield,
  Sparkles,
  Star,
  Trophy,
  User,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  UserX,
  X,
  Zap,
} from 'lucide-react-native';

import AnimatedScreen from '@/components/AnimatedScreen';
import GlobalHeader from '@/components/GlobalHeader';
import { ExpressiveLoadingIndicator } from '@/components/ui/ExpressiveUI';
import { SocialUserAvatar, type AvatarUser } from '@/components/social/SocialUserAvatar';
import { GymLocationModal } from '@/components/modals/GymLocationModal';
import { ExerciseMediaPreview } from '@/components/routines/ExerciseMediaPreview';
import { SwipeableBottomSheet, getAppleSheetCardStyle } from '@/components/ui/SwipeableBottomSheet';
import {
  getAppleCardSurfaceStyle,
  getThemeBaseBackground,
  getUnselectedControlColors,
} from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { useToast } from '@/hooks/useToast';
import { forkRoutine } from '@/services/routineService';
import socialService from '@/services/socialService';
import useAppStore from '@/store/useAppStore';
import { enrichGymWithMedia } from '@/utils/gymMedia';
import { getContrastTextColor, getDisplayImageUrl, resolveRoutineCoverPreset } from '@/utils/routineHelpers';
import { getUserRoleRingConfig } from '@/utils/userRoleUtils';

const BADGES_PER_PAGE = 4;

type BadgeConfig = {
  name: string;
  desc: string;
  icon: any;
  color: string;
  bg: string;
};

const BADGE_DETAILS: Record<string, BadgeConfig> = {
  first_login: { name: 'Primer Paso', desc: 'Inicia sesión por primera vez', icon: User, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  first_workout: { name: 'Primer Sudor', desc: 'Completa tu primer entrenamiento', icon: Dumbbell, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  streak_3: { name: 'En Llamas', desc: 'Racha de 3 días', icon: Flame, color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
  streak_7: { name: 'Imparable', desc: 'Racha de 7 días', icon: Flame, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  streak_30: { name: 'Leyenda', desc: 'Racha de 30 días', icon: Crown, color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' },
  nutrition_master: { name: 'Chef', desc: 'Registra 5 comidas', icon: Star, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
  milestone_10: { name: 'Plata (Lvl 10)', desc: 'Alcanza el nivel 10', icon: Medal, color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.15)' },
  milestone_20: { name: 'Oro (Lvl 20)', desc: 'Alcanza el nivel 20', icon: Trophy, color: '#FFD700', bg: 'rgba(255, 215, 0, 0.15)' },
  milestone_30: { name: 'Platino (Lvl 30)', desc: 'Alcanza el nivel 30', icon: Star, color: '#5F9EA0', bg: 'rgba(95, 158, 160, 0.15)' },
  milestone_40: { name: 'Diamante (Lvl 40)', desc: 'Alcanza el nivel 40', icon: Award, color: '#00FFFF', bg: 'rgba(0, 255, 255, 0.15)' },
  milestone_50: { name: 'Maestro (Lvl 50)', desc: 'Alcanza el nivel 50', icon: Zap, color: '#9370DB', bg: 'rgba(147, 112, 219, 0.15)' },
  milestone_60: { name: 'Gran Maestro (Lvl 60)', desc: 'Alcanza el nivel 60', icon: Flame, color: '#FF69B4', bg: 'rgba(255, 105, 180, 0.15)' },
  milestone_70: { name: 'Épico (Lvl 70)', desc: 'Alcanza el nivel 70', icon: Crown, color: '#FF4500', bg: 'rgba(255, 69, 0, 0.15)' },
  milestone_80: { name: 'Leyenda (Lvl 80)', desc: 'Alcanza el nivel 80', icon: Sparkles, color: '#FFD700', bg: 'rgba(255, 215, 0, 0.15)' },
  default: { name: 'Insignia', desc: 'Logro desbloqueado', icon: Trophy, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
};

const resolveBadge = (badge: any): BadgeConfig & { id: string } => {
  if (!badge) return { id: 'default', ...BADGE_DETAILS.default };
  const rawId = typeof badge === 'string' ? badge : (badge.id || badge.badge_id || 'default');
  if (BADGE_DETAILS[rawId]) return { id: rawId, ...BADGE_DETAILS[rawId] };
  const baseName = typeof badge === 'object' && badge.name ? String(badge.name) : BADGE_DETAILS.default.name;
  const baseDesc = typeof badge === 'object' && badge.description ? String(badge.description) : BADGE_DETAILS.default.desc;
  return { id: String(rawId), ...BADGE_DETAILS.default, name: baseName, desc: baseDesc };
};

interface PublicRoutineExercise {
  name: string;
  image_url?: string | null;
  image_url_end?: string | null;
  images?: any;
  video_url?: string | null;
}

interface PublicRoutine {
  id: number | string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  folder?: string | null;
  visibility?: 'public' | 'friends' | 'private' | string;
  downloads_count?: number;
  exercises?: PublicRoutineExercise[];
}

type PublicProfile = AvatarUser & {
  bio?: string | null;
  is_me?: boolean;
  is_friend?: boolean;
  createdAt?: string | null;
  lastSeen?: string | null;
  show_level_xp?: boolean;
  show_badges?: boolean;
  show_gym?: boolean;
  gym?: any;
  level?: number | null;
  xp?: number | null;
  streak?: number | null;
  workoutsCount?: number;
  unlocked_badges?: any[];
  routines?: PublicRoutine[];
};

const formatMemberDate = (iso?: string | null) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatLastSeen = (iso?: string | null) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const diffHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (diffHours < 1) return 'Activo hace unos min';
  if (diffHours < 24) return `Visto hoy`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Visto ayer';
  if (diffDays < 30) return `Hace ${diffDays} días`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const profileId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const colors = useAppColors();
  const { showToast } = useToast();

  const theme = useAppStore((s: any) => s.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const contrastText = getContrastTextColor(colors.tint);
  const unselectedColors = getUnselectedControlColors(theme);
  const cardSurface = getAppleCardSurfaceStyle(theme, 22);
  const sheetCardStyle = getAppleSheetCardStyle(theme, 18);

  const userProfile = useAppStore((s: any) => s.userProfile);
  const socialFriends = useAppStore((s: any) => s.socialFriends) || [];
  const socialRequests = useAppStore((s: any) => s.socialRequests) || { received: [], sent: [] };
  const fetchFriends = useAppStore((s: any) => s.fetchFriends);
  const fetchFriendRequests = useAppStore((s: any) => s.fetchFriendRequests);
  const sendFriendRequest = useAppStore((s: any) => s.sendFriendRequest);
  const respondFriendRequest = useAppStore((s: any) => s.respondFriendRequest);
  const removeFriend = useAppStore((s: any) => s.removeFriend);
  const updateUserProfile = useAppStore((s: any) => s.updateUserProfile);
  const fetchInitialData = useAppStore((s: any) => s.fetchInitialData);
  const hasStoriesForUser = useAppStore((s: any) => {
    const uid = profileId != null ? String(profileId) : '';
    if (!uid) return false;
    if (String(s.userProfile?.id) === uid) return Array.isArray(s.myStories) && s.myStories.length > 0;
    return Array.isArray(s.stories) && s.stories.some((g: any) => String(g.userId) === uid && g.items?.length > 0);
  });
  const openStory = useAppStore((s: any) => s.openStory);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState<{ status?: number; message: string } | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [friendBusy, setFriendBusy] = useState(false);
  const [badgePage, setBadgePage] = useState(0);
  const [selectedRoutine, setSelectedRoutine] = useState<PublicRoutine | null>(null);
  const [importingId, setImportingId] = useState<string | number | null>(null);
  const [showGymModal, setShowGymModal] = useState(false);

  const loadProfile = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      if (!profileId) {
        if (active) {
          setErrorInfo({ message: 'Perfil no válido.' });
          setLoading(false);
        }
        return;
      }
      try {
        const data = await socialService.getPublicProfile(encodeURIComponent(profileId));
        if (!active) return;
        setProfile(data);
        setErrorInfo(null);
        setBadgePage(0);
      } catch (err: any) {
        if (!active) return;
        setErrorInfo({
          status: err?.status,
          message: err?.status === 403
            ? 'Este atleta mantiene su perfil privado.'
            : err?.message || 'No se pudo cargar este perfil.',
        });
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchProfile();
    void fetchFriends?.();
    void fetchFriendRequests?.();
    return () => {
      active = false;
    };
  }, [profileId, refreshTick, fetchFriends, fetchFriendRequests]);

  const roleConfig = useMemo(
    () => (profile ? getUserRoleRingConfig(profile, userProfile) : null),
    [profile, userProfile]
  );

  const enrichedGym = useMemo(
    () => (profile?.gym ? enrichGymWithMedia(profile.gym) : null),
    [profile]
  );

  const incomingRequest = useMemo(() => {
    if (!profile) return null;
    return (socialRequests.received || []).find(
      (r: any) => String(r.requester_id ?? r.sender?.id ?? r.user?.id) === String(profile.id)
    );
  }, [profile, socialRequests.received]);

  const outgoingRequest = useMemo(() => {
    if (!profile) return null;
    return (socialRequests.sent || []).find(
      (r: any) => String(r.addressee_id ?? r.receiver?.id ?? r.user?.id) === String(profile.id)
    );
  }, [profile, socialRequests.sent]);

  const isAlreadyFriend = useMemo(() => {
    if (!profile) return false;
    return Boolean(
      profile.is_friend ||
      socialFriends.some((f: any) => String(f.id) === String(profile.id))
    );
  }, [profile, socialFriends]);

  const badges = useMemo(() => {
    const raw = Array.isArray(profile?.unlocked_badges) ? profile.unlocked_badges : [];
    return raw.map(resolveBadge);
  }, [profile]);

  const badgeTotalPages = Math.max(1, Math.ceil(badges.length / BADGES_PER_PAGE));
  const currentBadges = badges.slice(
    badgePage * BADGES_PER_PAGE,
    badgePage * BADGES_PER_PAGE + BADGES_PER_PAGE
  );

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/social');
  };

  const handleSendFriendRequest = async () => {
    if (!profile || friendBusy) return;
    setFriendBusy(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const ok = await sendFriendRequest(profile.id);
      if (ok) showToast('Solicitud de amistad enviada.', 'success');
      else showToast('No se pudo enviar la solicitud.', 'error');
    } finally {
      setFriendBusy(false);
    }
  };

  const handleRespondRequest = async (action: 'accept' | 'reject') => {
    if (!incomingRequest || friendBusy) return;
    setFriendBusy(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      await respondFriendRequest(incomingRequest.id, action);
      showToast(action === 'accept' ? '¡Ahora sois amigos!' : 'Solicitud rechazada.', 'success');
      await loadProfile();
    } catch {
      showToast('No se pudo responder a la solicitud.', 'error');
    } finally {
      setFriendBusy(false);
    }
  };

  const handleRemoveFriend = () => {
    if (!profile || friendBusy) return;
    Alert.alert(
      'Eliminar amigo',
      `¿Seguro que quieres eliminar a ${profile.username || 'este usuario'} de tu lista de amigos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setFriendBusy(true);
            try {
              await removeFriend(profile.id);
              showToast('Amigo eliminado.', 'success');
              await loadProfile();
            } catch {
              showToast('No se pudo eliminar al amigo.', 'error');
            } finally {
              setFriendBusy(false);
            }
          },
        },
      ]
    );
  };

  const handleImportRoutine = async (routine: PublicRoutine) => {
    if (!routine || importingId != null) return;
    setImportingId(routine.id);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const creatorName = profile?.username || 'Atleta';
      await forkRoutine(String(routine.id), `Compartido de ${creatorName}`);
      await fetchInitialData?.();
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              routines: (prev.routines || []).map((r) =>
                String(r.id) === String(routine.id)
                  ? { ...r, downloads_count: Number(r.downloads_count || 0) + 1 }
                  : r
              ),
            }
          : prev
      );
      setSelectedRoutine((prev) =>
        prev && String(prev.id) === String(routine.id)
          ? { ...prev, downloads_count: Number(prev.downloads_count || 0) + 1 }
          : prev
      );
      showToast(`Rutina "${routine.name}" guardada en tu biblioteca.`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'No se pudo importar la rutina.', 'error');
    } finally {
      setImportingId(null);
    }
  };

  const handleSaveMyGym = async (gym: any) => {
    setShowGymModal(false);
    try {
      const payload = gym ? JSON.stringify(gym) : null;
      const res = await updateUserProfile?.({ gym_data: payload, show_gym: true });
      if (res?.success) {
        showToast('Gimnasio habitual actualizado.', 'success');
        await loadProfile();
      } else {
        showToast('No se pudo actualizar el gimnasio.', 'error');
      }
    } catch {
      showToast('No se pudo actualizar el gimnasio.', 'error');
    }
  };

  const handleRemoveMyGym = async () => {
    setShowGymModal(false);
    try {
      const res = await updateUserProfile?.({ gym_data: null });
      if (res?.success) {
        showToast('Gimnasio habitual eliminado.', 'success');
        await loadProfile();
      }
    } catch {
      showToast('No se pudo eliminar el gimnasio.', 'error');
    }
  };

  const renderRoleIcon = (roleType?: string, color: string = colors.tint) => {
    if (roleType === 'admin') return <Shield size={12} color={color} />;
    if (roleType === 'trainer') return <Award size={12} color={color} />;
    if (roleType === 'asesoria') return <Sparkles size={12} color={color} />;
    return <Dumbbell size={12} color={color} />;
  };

  const renderVisibilityBadge = (visibility?: string) => {
    const isPublic = visibility === 'public';
    const isFriends = visibility === 'friends';
    const label = isPublic ? 'Pública' : isFriends ? 'Solo amigos' : 'Privada';
    const tintColor = isPublic ? '#22c55e' : isFriends ? '#3b82f6' : colors.textSecondary;
    return (
      <View style={[styles.visibilityPill, { borderColor: tintColor + '44', backgroundColor: tintColor + '16' }]}>
        {isPublic ? (
          <Globe size={11} color={tintColor} />
        ) : isFriends ? (
          <Users size={11} color={tintColor} />
        ) : (
          <Lock size={11} color={tintColor} />
        )}
        <Text style={[styles.visibilityText, { color: tintColor }]}>{label}</Text>
      </View>
    );
  };

  const baseBg = getThemeBaseBackground(theme);

  return (
    <AnimatedScreen
      paddingBottom={44}
      header={<GlobalHeader title="Perfil de Atleta" showBackButton hideRightButtons onBackPress={handleBack} />}
    >
      <View style={styles.container}>
        {loading ? (
          <View style={styles.centerBox}>
            <ExpressiveLoadingIndicator size="large" color={colors.tint} accessibilityLabel="Cargando perfil" />
            <Text style={[styles.centerSub, { color: colors.textSecondary }]}>Cargando perfil...</Text>
          </View>
        ) : errorInfo || !profile ? (
          <View style={[styles.card, cardSurface, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.errorIconWrap, { backgroundColor: colors.tint + '18' }]}>
              {errorInfo?.status === 403 ? (
                <Lock size={28} color={colors.tint} />
              ) : (
                <UserX size={28} color={colors.tint} />
              )}
            </View>
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              {errorInfo?.status === 403 ? 'Perfil privado' : 'Perfil no disponible'}
            </Text>
            <Text style={[styles.errorBody, { color: colors.textSecondary }]}>
              {errorInfo?.message || 'No se pudo encontrar a este usuario.'}
            </Text>
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.85}
              style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
            >
              <Text style={[styles.primaryBtnText, { color: contrastText }]}>Volver</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* HERO CARD */}
            <View style={[styles.card, cardSurface, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.heroTop}>
                <Pressable
                  disabled={!hasStoriesForUser}
                  onPress={() => hasStoriesForUser && openStory?.(profile.id)}
                >
                  <SocialUserAvatar user={profile} size={104} showStoryIndicator openStoryOnPress />
                </Pressable>

                {hasStoriesForUser && (
                  <TouchableOpacity
                    onPress={() => openStory?.(profile.id)}
                    style={[styles.storyHintPill, { backgroundColor: colors.tint + '18', borderColor: colors.tint + '40' }]}
                  >
                    <Sparkles size={12} color={colors.tint} />
                    <Text style={[styles.storyHintText, { color: colors.tint }]}>Ver historia activa</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.nameRow}>
                  <Text style={[styles.username, { color: colors.text }]}>
                    {profile.username || 'Atleta'}
                  </Text>
                  {(profile.role === 'trainer' || profile.role === 'admin' || profile.is_friend) && (
                    <BadgeCheck size={20} color="#3b82f6" />
                  )}
                </View>

                {roleConfig && (
                  <View
                    style={[
                      styles.rolePill,
                      { backgroundColor: roleConfig.badgeBg, borderColor: roleConfig.badgeBorder },
                    ]}
                  >
                    {renderRoleIcon(roleConfig.type, roleConfig.badgeText)}
                    <Text style={[styles.rolePillText, { color: roleConfig.badgeText }]}>
                      {roleConfig.title}
                    </Text>
                  </View>
                )}

                {!!profile.bio && (
                  <Text style={[styles.bio, { color: colors.textSecondary }]}>{profile.bio}</Text>
                )}

                {/* Dates metadata */}
                <View style={styles.metaChipsRow}>
                  {formatMemberDate(profile.createdAt) && (
                    <View style={[styles.metaChip, { backgroundColor: unselectedColors.backgroundColor, borderColor: colors.border }]}>
                      <Calendar size={12} color={colors.textSecondary} />
                      <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
                        Miembro desde {formatMemberDate(profile.createdAt)}
                      </Text>
                    </View>
                  )}
                  {formatLastSeen(profile.lastSeen) && (
                    <View style={[styles.metaChip, { backgroundColor: unselectedColors.backgroundColor, borderColor: colors.border }]}>
                      <Clock size={12} color={colors.textSecondary} />
                      <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
                        {formatLastSeen(profile.lastSeen)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action buttons */}
                <View style={styles.heroActionsRow}>
                  {profile.is_me ? (
                    <TouchableOpacity
                      onPress={() => router.push('/profile')}
                      activeOpacity={0.85}
                      style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: unselectedColors.backgroundColor }]}
                    >
                      <Pencil size={15} color={colors.text} />
                      <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Editar mi perfil</Text>
                    </TouchableOpacity>
                  ) : incomingRequest ? (
                    <>
                      <TouchableOpacity
                        disabled={friendBusy}
                        onPress={() => void handleRespondRequest('accept')}
                        activeOpacity={0.85}
                        style={[styles.primaryBtn, { backgroundColor: '#22c55e', flex: 1 }]}
                      >
                        <Check size={16} color="#ffffff" />
                        <Text style={[styles.primaryBtnText, { color: '#ffffff' }]}>Aceptar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        disabled={friendBusy}
                        onPress={() => void handleRespondRequest('reject')}
                        activeOpacity={0.85}
                        style={[styles.secondaryBtn, { borderColor: '#ef444455', backgroundColor: '#ef444416', flex: 1 }]}
                      >
                        <X size={16} color="#ef4444" />
                        <Text style={[styles.secondaryBtnText, { color: '#ef4444' }]}>Rechazar</Text>
                      </TouchableOpacity>
                    </>
                  ) : outgoingRequest ? (
                    <View style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: unselectedColors.backgroundColor, opacity: 0.78 }]}>
                      <Clock size={15} color={colors.textSecondary} />
                      <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>Solicitud enviada</Text>
                    </View>
                  ) : isAlreadyFriend ? (
                    <>
                      <View style={[styles.secondaryBtn, { borderColor: '#22c55e55', backgroundColor: '#22c55e18' }]}>
                        <UserCheck size={15} color="#22c55e" />
                        <Text style={[styles.secondaryBtnText, { color: '#22c55e' }]}>Amigos</Text>
                      </View>
                      <TouchableOpacity
                        disabled={friendBusy}
                        onPress={handleRemoveFriend}
                        activeOpacity={0.85}
                        style={[styles.secondaryBtn, { borderColor: '#ef444444', backgroundColor: '#ef444414' }]}
                      >
                        <UserMinus size={15} color="#ef4444" />
                        <Text style={[styles.secondaryBtnText, { color: '#ef4444' }]}>Eliminar</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      disabled={friendBusy}
                      onPress={() => void handleSendFriendRequest()}
                      activeOpacity={0.85}
                      style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
                    >
                      {friendBusy ? (
                        <ActivityIndicator size="small" color={contrastText} />
                      ) : (
                        <>
                          <UserPlus size={16} color={contrastText} />
                          <Text style={[styles.primaryBtnText, { color: contrastText }]}>Añadir amigo</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* HABITUAL GYM CARD */}
            {(enrichedGym || profile.is_me) && (
              <View style={[styles.card, cardSurface, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleWrap}>
                    <MapPin size={17} color={colors.tint} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Gimnasio habitual</Text>
                  </View>
                  {profile.is_me && (
                    <TouchableOpacity
                      onPress={() => setShowGymModal(true)}
                      style={[styles.smallPillBtn, { borderColor: colors.border, backgroundColor: colors.tint + '16' }]}
                    >
                      <Pencil size={12} color={colors.tint} />
                      <Text style={[styles.smallPillText, { color: colors.tint }]}>
                        {enrichedGym ? 'Cambiar' : 'Añadir'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {enrichedGym ? (
                  <View style={styles.gymRow}>
                    <View style={[styles.gymLogoBox, { backgroundColor: baseBg, borderColor: colors.border }]}>
                      {enrichedGym.brandImage ? (
                        <Image
                          source={
                            typeof enrichedGym.brandImage === 'number'
                              ? enrichedGym.brandImage
                              : { uri: enrichedGym.brandImage }
                          }
                          contentFit="contain"
                          style={styles.gymLogoImg}
                        />
                      ) : (
                        <Building2 size={22} color={colors.tint} />
                      )}
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={[styles.gymName, { color: colors.text }]} numberOfLines={1}>
                        {enrichedGym.name || enrichedGym.brand || 'Gimnasio'}
                      </Text>
                      {!!(enrichedGym.address || enrichedGym.city) && (
                        <Text style={[styles.gymAddress, { color: colors.textSecondary }]} numberOfLines={2}>
                          {enrichedGym.address || enrichedGym.city}
                        </Text>
                      )}
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                    Aún no has configurado tu gimnasio habitual.
                  </Text>
                )}
              </View>
            )}

            {/* STATS 2x2 GRID */}
            {profile.show_level_xp ? (
              <View style={styles.statsGrid}>
                <View style={[styles.statTile, cardSurface, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.statIconWrap, { backgroundColor: 'rgba(234, 179, 8, 0.16)' }]}>
                    <FontAwesome5 name="trophy" size={16} color="#eab308" />
                  </View>
                  <Text style={[styles.statValue, { color: colors.text }]}>{profile.level ?? 1}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Nivel</Text>
                </View>

                <View style={[styles.statTile, cardSurface, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.statIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.16)' }]}>
                    <Zap size={18} color="#3b82f6" />
                  </View>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {Number(profile.xp ?? 0).toLocaleString('es-ES')}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>XP Total</Text>
                </View>

                <View style={[styles.statTile, cardSurface, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.statIconWrap, { backgroundColor: 'rgba(249, 115, 22, 0.16)' }]}>
                    <Flame size={18} color="#f97316" />
                  </View>
                  <Text style={[styles.statValue, { color: colors.text }]}>{profile.streak ?? 0}d</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Racha</Text>
                </View>

                <View style={[styles.statTile, cardSurface, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.statIconWrap, { backgroundColor: 'rgba(34, 197, 94, 0.16)' }]}>
                    <Dumbbell size={18} color="#22c55e" />
                  </View>
                  <Text style={[styles.statValue, { color: colors.text }]}>{profile.workoutsCount ?? 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Entrenamientos</Text>
                </View>
              </View>
            ) : (
              <View style={[styles.card, cardSurface, styles.privateBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <EyeOff size={20} color={colors.textSecondary} />
                <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                  Estadísticas de nivel y XP ocultas por el atleta.
                </Text>
              </View>
            )}

            {/* BADGES SECTION */}
            <View style={[styles.card, cardSurface, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleWrap}>
                  <Medal size={17} color="#f59e0b" />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Logros e Insignias</Text>
                </View>
                {profile.show_badges && badges.length > 0 && (
                  <View style={[styles.countPill, { backgroundColor: colors.tint + '1A' }]}>
                    <Text style={[styles.countPillText, { color: colors.tint }]}>{badges.length}</Text>
                  </View>
                )}
              </View>

              {!profile.show_badges ? (
                <View style={styles.privateInline}>
                  <Lock size={15} color={colors.textSecondary} />
                  <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                    Insignias ocultas por privacidad.
                  </Text>
                </View>
              ) : badges.length === 0 ? (
                <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                  Todavía no ha desbloqueado insignias.
                </Text>
              ) : (
                <>
                  <View style={styles.badgesGrid}>
                    {currentBadges.map((badge, index) => {
                      const BadgeIcon = badge.icon;
                      return (
                        <View
                          key={`${badge.id}-${index}`}
                          style={[
                            styles.badgeCard,
                            { backgroundColor: unselectedColors.backgroundColor, borderColor: colors.border },
                          ]}
                        >
                          <View style={[styles.badgeIconCircle, { backgroundColor: badge.bg }]}>
                            <BadgeIcon size={20} color={badge.color} />
                          </View>
                          <Text style={[styles.badgeName, { color: colors.text }]} numberOfLines={1}>
                            {badge.name}
                          </Text>
                          <Text style={[styles.badgeDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                            {badge.desc}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {badgeTotalPages > 1 && (
                    <View style={styles.paginationRow}>
                      <TouchableOpacity
                        disabled={badgePage === 0}
                        onPress={() => setBadgePage((p) => Math.max(0, p - 1))}
                        style={[
                          styles.pageBtn,
                          { borderColor: colors.border, opacity: badgePage === 0 ? 0.4 : 1 },
                        ]}
                      >
                        <ChevronLeft size={16} color={colors.text} />
                      </TouchableOpacity>
                      <Text style={[styles.pageLabel, { color: colors.textSecondary }]}>
                        {badgePage + 1} / {badgeTotalPages}
                      </Text>
                      <TouchableOpacity
                        disabled={badgePage >= badgeTotalPages - 1}
                        onPress={() => setBadgePage((p) => Math.min(badgeTotalPages - 1, p + 1))}
                        style={[
                          styles.pageBtn,
                          { borderColor: colors.border, opacity: badgePage >= badgeTotalPages - 1 ? 0.4 : 1 },
                        ]}
                      >
                        <ChevronRight size={16} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* SHARED ROUTINES */}
            <View style={[styles.card, cardSurface, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleWrap}>
                  <Dumbbell size={17} color={colors.tint} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Rutinas Compartidas</Text>
                </View>
                <View style={[styles.countPill, { backgroundColor: colors.tint + '1A' }]}>
                  <Text style={[styles.countPillText, { color: colors.tint }]}>
                    {(profile.routines || []).length}
                  </Text>
                </View>
              </View>

              {!profile.routines || profile.routines.length === 0 ? (
                <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                  Este atleta aún no tiene rutinas visibles aquí.
                </Text>
              ) : (
                <View style={styles.routinesList}>
                  {profile.routines.map((routine) => {
                    const coverImage = getDisplayImageUrl(routine.image_url);
                    const coverPreset = resolveRoutineCoverPreset(routine.image_url, {
                      tint: colors.tint,
                      baseBg,
                      secondaryBg: colors.card,
                      isDark,
                    });
                    const exList = routine.exercises || [];

                    return (
                      <View
                        key={String(routine.id)}
                        style={[
                          styles.routineCardWrap,
                          { backgroundColor: unselectedColors.backgroundColor, borderColor: colors.border },
                        ]}
                      >
                        <Pressable
                          android_ripple={{
                            color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                          }}
                          onPress={() => setSelectedRoutine(routine)}
                          style={({ pressed }) => [
                            styles.routineCard,
                            pressed && { opacity: 0.88 },
                          ]}
                        >
                          <View style={styles.routineTopRow}>
                            {coverImage ? (
                              <Image
                                source={{ uri: coverImage }}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                                style={styles.routineThumb}
                              />
                            ) : coverPreset ? (
                              <LinearGradient
                                colors={coverPreset.colors as any}
                                start={coverPreset.start}
                                end={coverPreset.end}
                                style={styles.routineThumb}
                              >
                                <Dumbbell size={19} color="#ffffff" />
                              </LinearGradient>
                            ) : (
                              <View style={[styles.routineThumb, { backgroundColor: colors.tint + '22' }]}>
                                <Dumbbell size={19} color={colors.tint} />
                              </View>
                            )}

                            <View style={styles.routineHeaderInfo}>
                              <Text style={[styles.routineName, { color: colors.text }]} numberOfLines={2}>
                                {routine.name}
                              </Text>

                              <View style={styles.routineMetaRow}>
                                {renderVisibilityBadge(routine.visibility)}
                                <Text style={[styles.routineMetaText, { color: colors.textSecondary }]}>·</Text>
                                <Text style={[styles.routineMetaText, { color: colors.textSecondary }]}>
                                  {exList.length} {exList.length === 1 ? 'ejercicio' : 'ejercicios'}
                                </Text>
                                <Text style={[styles.routineMetaText, { color: colors.textSecondary }]}>·</Text>
                                <Text style={[styles.routineMetaText, { color: colors.textSecondary }]}>
                                  {Number(routine.downloads_count || 0)} descargas
                                </Text>
                                {!!routine.folder && (
                                  <View style={styles.folderChip}>
                                    <Folder size={10} color={colors.textSecondary} />
                                    <Text style={[styles.routineMetaText, { color: colors.textSecondary }]} numberOfLines={1}>
                                      {routine.folder}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          </View>

                          {!!routine.description && (
                            <Text style={[styles.routineDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                              {routine.description}
                            </Text>
                          )}

                          {exList.length > 0 && (
                            <View style={styles.previewExercises}>
                              {exList.slice(0, 3).map((ex, idx) => (
                                <View
                                  key={`${routine.id}-ex-${idx}`}
                                  style={[styles.previewExChip, { borderColor: colors.border, backgroundColor: colors.card }]}
                                >
                                  <Text style={[styles.previewExText, { color: colors.text }]} numberOfLines={1}>
                                    {ex.name}
                                  </Text>
                                </View>
                              ))}
                              {exList.length > 3 && (
                                <Text style={[styles.moreExText, { color: colors.tint }]}>
                                  +{exList.length - 3} más
                                </Text>
                              )}
                            </View>
                          )}

                          {!profile.is_me && (
                            <View style={[styles.routineFooterRow, { borderTopColor: colors.border }]}>
                              <Text style={[styles.viewDetailHint, { color: colors.textSecondary }]}>
                                Toca para ver ejercicios
                              </Text>
                              <View style={[styles.importChipWrap, { backgroundColor: colors.tint }]}>
                                <Pressable
                                  disabled={importingId != null}
                                  android_ripple={{ color: 'rgba(255,255,255,0.22)' }}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    void handleImportRoutine(routine);
                                  }}
                                  style={({ pressed }) => [
                                    styles.importChipBtn,
                                    pressed && { opacity: 0.85 },
                                  ]}
                                >
                                  {String(importingId) === String(routine.id) ? (
                                    <ActivityIndicator size="small" color={contrastText} />
                                  ) : (
                                    <>
                                      <Download size={12} color={contrastText} />
                                      <Text style={[styles.importChipText, { color: contrastText }]}>Importar</Text>
                                    </>
                                  )}
                                </Pressable>
                              </View>
                            </View>
                          )}
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}
      </View>

      {/* ROUTINE DETAIL SHEET */}
      <SwipeableBottomSheet
        visible={Boolean(selectedRoutine)}
        onClose={() => setSelectedRoutine(null)}
        isDark={isDark}
        scrollable
        maxHeight="88%"
      >
        {selectedRoutine && (
          <View style={{ flexShrink: 1 }}>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.sheetTitle, { color: colors.text }]} numberOfLines={2}>
                  {selectedRoutine.name}
                </Text>
                <View style={styles.routineMetaRow}>
                  {renderVisibilityBadge(selectedRoutine.visibility)}
                  <Text style={[styles.routineMetaText, { color: colors.textSecondary }]}>
                    {(selectedRoutine.exercises || []).length} ejercicios ·{' '}
                    {Number(selectedRoutine.downloads_count || 0)} descargas
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedRoutine(null)}
                style={[styles.sheetCloseBtn, { borderColor: colors.border, backgroundColor: unselectedColors.backgroundColor }]}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={styles.sheetScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {!!selectedRoutine.description && (
                <Text style={[styles.sheetDesc, { color: colors.textSecondary }]}>
                  {selectedRoutine.description}
                </Text>
              )}

              <View style={styles.sheetExercisesList}>
                {(selectedRoutine.exercises || []).length === 0 ? (
                  <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                    Esta rutina no contiene ejercicios visibles.
                  </Text>
                ) : (
                  (selectedRoutine.exercises || []).map((ex, idx) => (
                    <View
                      key={`${selectedRoutine.id}-detail-${idx}`}
                      style={[styles.sheetExerciseCard, sheetCardStyle, { borderColor: colors.border }]}
                    >
                      <View style={styles.sheetExerciseHeader}>
                        <View style={[styles.orderBadge, { backgroundColor: colors.tint + '22' }]}>
                          <Text style={[styles.orderBadgeText, { color: colors.tint }]}>{idx + 1}</Text>
                        </View>
                        <Text style={[styles.sheetExerciseName, { color: colors.text }]}>{ex.name}</Text>
                      </View>
                      {(ex.image_url || ex.image_url_end || ex.images) && (
                        <View style={styles.mediaBox}>
                          <ExerciseMediaPreview
                            item={ex}
                            getImageUrl={(it) => getDisplayImageUrl(it?.image_url || it?.image_url_start) || ''}
                            forceImageMode
                            showImageCounter={false}
                            fitMode="contain"
                            previewColors={{ background: baseBg, placeholder: colors.tabBar }}
                          />
                        </View>
                      )}
                    </View>
                  ))
                )}
              </View>
            </ScrollView>

            {!profile?.is_me && (
              <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
                <View style={[styles.primaryBtnWrap, { backgroundColor: colors.tint, width: '100%' }]}>
                  <Pressable
                    disabled={importingId != null}
                    android_ripple={{ color: 'rgba(255,255,255,0.22)' }}
                    onPress={() => void handleImportRoutine(selectedRoutine)}
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      { width: '100%' },
                      pressed && { opacity: 0.88 },
                    ]}
                  >
                    {String(importingId) === String(selectedRoutine.id) ? (
                      <ActivityIndicator size="small" color={contrastText} />
                    ) : (
                      <>
                        <Download size={16} color={contrastText} />
                        <Text style={[styles.primaryBtnText, { color: contrastText }]}>
                          Importar a mis rutinas
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}
      </SwipeableBottomSheet>

      {/* GYM MODAL FOR OWN PROFILE */}
      {profile?.is_me && (
        <GymLocationModal
          visible={showGymModal}
          currentGym={profile.gym}
          onClose={() => setShowGymModal(false)}
          onSave={handleSaveMyGym}
          onRemove={handleRemoveMyGym}
        />
      )}
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 12, gap: 14 },
  centerBox: { paddingVertical: 64, alignItems: 'center', gap: 12 },
  centerSub: { fontSize: 14, fontWeight: '600' },
  card: { borderRadius: 22, borderWidth: 1, padding: 18, gap: 14 },
  heroTop: { alignItems: 'center', gap: 10 },
  storyHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  storyHintText: { fontSize: 11, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  username: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  rolePillText: { fontSize: 11, fontWeight: '700' },
  bio: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 2 },
  metaChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  metaChipText: { fontSize: 11, fontWeight: '600' },
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  primaryBtnWrap: {
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  primaryBtnText: { fontSize: 14, fontWeight: '800' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '700' },
  errorIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  errorTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  errorBody: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  smallPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  smallPillText: { fontSize: 12, fontWeight: '700' },
  gymRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gymLogoBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gymLogoImg: { width: 38, height: 38 },
  gymName: { fontSize: 15, fontWeight: '700' },
  gymAddress: { fontSize: 12, lineHeight: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statTile: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  statIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 21, fontWeight: '900' },
  statLabel: { fontSize: 12, fontWeight: '600' },
  privateBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  privateInline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emptyHint: { fontSize: 13, fontWeight: '500' },
  countPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  countPillText: { fontSize: 12, fontWeight: '800' },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  badgeIconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  badgeName: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  badgeDesc: { fontSize: 11, textAlign: 'center', lineHeight: 14 },
  paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 2 },
  pageBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pageLabel: { fontSize: 12, fontWeight: '700' },
  routinesList: { gap: 12 },
  routineCardWrap: {
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
  },
  routineCard: { padding: 14, gap: 10 },
  routineTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routineHeaderInfo: { flex: 1, minWidth: 0, gap: 6 },
  routineThumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  routineTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  routineName: { fontSize: 15.5, fontWeight: '800', lineHeight: 20 },
  routineDesc: { fontSize: 12.5, lineHeight: 17 },
  routineMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  routineMetaText: { fontSize: 11.5, fontWeight: '600' },
  folderChip: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 130 },
  visibilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  visibilityText: { fontSize: 10, fontWeight: '700' },
  previewExercises: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  previewExChip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, borderCurve: 'continuous', borderWidth: 1, maxWidth: '100%' },
  previewExText: { fontSize: 11, fontWeight: '600' },
  moreExText: { fontSize: 11, fontWeight: '700' },
  routineFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  viewDetailHint: { fontSize: 11.5, fontWeight: '600' },
  importChipWrap: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  importChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
  },
  importChipText: { fontSize: 12, fontWeight: '800' },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  sheetTitle: { fontSize: 19, fontWeight: '800' },
  sheetCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScrollContent: { paddingHorizontal: 18, paddingBottom: 18, gap: 12 },
  sheetDesc: { fontSize: 13, lineHeight: 19 },
  sheetExercisesList: { gap: 10 },
  sheetExerciseCard: { borderRadius: 16, borderWidth: 1, padding: 12, gap: 10 },
  sheetExerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  orderBadgeText: { fontSize: 12, fontWeight: '800' },
  sheetExerciseName: { fontSize: 14, fontWeight: '700', flex: 1 },
  mediaBox: { width: '100%', height: 180, borderRadius: 12, overflow: 'hidden' },
  sheetFooter: { borderTopWidth: 1, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
});
