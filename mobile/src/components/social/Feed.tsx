import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import {
  Flame,
  MapPin,
  Users,
  Dumbbell,
  UserPlus,
  Check,
  Clock,
  Building2,
  Download,
  Trash2,
  Activity,
  Send,
  Info,
  Globe,
  Shield,
  Trophy,
  CheckCircle2,
  MessageCircle,
  RefreshCw,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import socialService from '@/services/socialService';
import * as userService from '@/services/userService';
import { forkRoutine } from '@/services/routineService';
import { enrichGymWithMedia } from '@/utils/gymMedia';
import { getSocket } from '@/services/socket';
import { SocialUserAvatar } from './SocialUserAvatar';
import { GymLocationModal } from '@/components/modals/GymLocationModal';
import { getContrastTextColor } from '@/utils/routineHelpers';

type ScopeType = 'global' | 'gym' | 'friends';
type GymFilterType = 'all' | 'same_gym' | 'same_city';

const timeAgo = (dateString?: string) => {
  if (!dateString) return 'Hace un momento';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Hace un momento';
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} d`;
  return date.toLocaleDateString();
};

const isOlderThan7Days = (dateString?: string) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();
  return now.getTime() - date.getTime() > 7 * 24 * 60 * 60 * 1000;
};

const formatDuration = (seconds?: number) => {
  if (!seconds) return '0 min';
  const m = Math.floor(seconds / 60);
  return `${m} min`;
};

const parseProfileGym = (raw: any) => {
  if (!raw) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return parsed && typeof parsed === 'object' && (parsed.name || parsed.city) ? parsed : null;
  } catch {
    return null;
  }
};

interface FeedProps {
  onNavigateProfile?: (userId: any) => void;
  visibleStories?: any[];
  myStories?: any[];
}

export function Feed({ onNavigateProfile, visibleStories = [], myStories = [] }: FeedProps) {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentTextColor = getContrastTextColor(colors.tint);

  const userProfile = useAppStore(state => state.userProfile);
  const exercises = useAppStore(state => state.exercises) || [];
  const sendFriendRequest = useAppStore(state => state.sendFriendRequest);
  const setUserProfile = useAppStore(state => state.setUserProfile);

  // Scopes & Filters
  const [scope, setScope] = useState<ScopeType>('global');
  const [gymFilter, setGymFilter] = useState<GymFilterType>('all');
  const [showFeedInfo, setShowFeedInfo] = useState(false);

  // Feed Data & Gym Meta
  const [feed, setFeed] = useState<any[]>([]);
  const [gymMeta, setGymMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasOlder, setHasOlder] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isShowingOlder, setIsShowingOlder] = useState(false);

  // Comments & Local state
  const [showComments, setShowComments] = useState<{ [id: string]: boolean }>({});
  const [activeCommentInput, setActiveCommentInput] = useState<{ [id: string]: string }>({});
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [pendingRequestsLocal, setPendingRequestsLocal] = useState<{ [id: string]: boolean }>({});
  const [sendingRequestId, setSendingRequestId] = useState<any>(null);
  const [showGymModal, setShowGymModal] = useState(false);

  const scopeRef = useRef(scope);
  const gymFilterRef = useRef(gymFilter);
  const isShowingOlderRef = useRef(isShowingOlder);

  // Active gym resolution
  const myCurrentGym = useMemo(() => {
    const fromProfile = parseProfileGym(userProfile?.gym_data);
    if (fromProfile) return enrichGymWithMedia(fromProfile);
    if (gymMeta?.myGym) return enrichGymWithMedia(gymMeta.myGym);
    return null;
  }, [userProfile?.gym_data, gymMeta?.myGym]);

  // Load feed from backend
  const loadFeed = async (
    includeOlder = false,
    targetScope = scopeRef.current,
    targetGymFilter = gymFilterRef.current
  ) => {
    try {
      if (includeOlder) {
        setIsLoadingOlder(true);
      } else {
        setIsLoading(true);
      }

      const data = await socialService.getFeed({
        scope: targetScope,
        gymFilter: targetScope === 'gym' ? targetGymFilter : 'all',
        includeOlder,
      });

      const posts = Array.isArray(data) ? data : data?.feed || [];
      const olderAvailable = Array.isArray(data) ? false : !!data?.hasOlder;
      const effectiveOlder = Array.isArray(data) ? includeOlder : data?.isShowingOlder ?? includeOlder;

      if (data?.gymMeta) {
        setGymMeta(data.gymMeta);
      }

      setFeed(posts);
      setHasOlder(olderAvailable);
      setIsShowingOlder(effectiveOlder);
      isShowingOlderRef.current = effectiveOlder;
    } catch (error) {
      console.error('Error al cargar feed:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingOlder(false);
    }
  };

  useEffect(() => {
    scopeRef.current = scope;
    gymFilterRef.current = gymFilter;
    loadFeed(false, scope, gymFilter);
  }, [scope, gymFilter]);

  // Socket updates
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      const handleFeedUpdate = () =>
        loadFeed(isShowingOlderRef.current, scopeRef.current, gymFilterRef.current);
      socket.on('feed_update', handleFeedUpdate);
      return () => {
        socket.off('feed_update', handleFeedUpdate);
      };
    }
  }, []);

  const handleScopeChange = (newScope: ScopeType) => {
    if (newScope === scope) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setScope(newScope);
    setIsShowingOlder(false);
    isShowingOlderRef.current = false;
  };

  // Gym actions
  const handleSaveGymFromFeed = async (gymData: any) => {
    try {
      const enriched = enrichGymWithMedia(gymData);
      await AsyncStorage.setItem('user_gym', JSON.stringify(enriched));
      if (userProfile && setUserProfile) {
        setUserProfile({ ...userProfile, gym_data: enriched });
      }
      await userService.updateUserProfile({ gym_data: enriched });
      setShowGymModal(false);
      Alert.alert('Gimnasio Vinculado', `Tu gimnasio ahora es ${enriched.name}`);
      await loadFeed(false, scopeRef.current, gymFilterRef.current);
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar el gimnasio');
    }
  };

  const handleRemoveGymFromFeed = async () => {
    try {
      await AsyncStorage.removeItem('user_gym');
      if (userProfile && setUserProfile) {
        setUserProfile({ ...userProfile, gym_data: null });
      }
      await userService.updateUserProfile({ gym_data: null });
      setGymMeta(null);
      setShowGymModal(false);
      Alert.alert('Gimnasio desvinculado', 'Has desvinculado tu gimnasio habitual');
      await loadFeed(false, scopeRef.current, gymFilterRef.current);
    } catch (err) {
      Alert.alert('Error', 'No se pudo desvincular el gimnasio');
    }
  };

  // Quick friend request
  const handleQuickFriendRequest = async (targetUserId: any) => {
    if (!targetUserId || sendingRequestId === targetUserId || pendingRequestsLocal[targetUserId])
      return;
    setSendingRequestId(targetUserId);
    try {
      let ok = false;
      if (typeof sendFriendRequest === 'function') {
        ok = await sendFriendRequest(targetUserId);
      } else {
        await socialService.sendFriendRequest(targetUserId);
        ok = true;
      }
      if (ok) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        setPendingRequestsLocal(prev => ({ ...prev, [targetUserId]: true }));
        Alert.alert('¡Solicitud enviada!', 'Se ha enviado tu solicitud de amistad.');
      }
    } catch {
      Alert.alert('Error', 'No se pudo enviar la solicitud');
    } finally {
      setSendingRequestId(null);
    }
  };

  // Optimistic multi-reaction toggle
  const handleToggleLike = async (workoutId: any, reactionType: string = 'fire') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const applyReactionUpdate = (list: any[], serverData: any = null) =>
      (Array.isArray(list) ? list : []).map(item => {
        if (!item || Number(item.id) !== Number(workoutId)) return item;

        if (serverData && typeof serverData.likesCount === 'number' && serverData.reactionsCounts) {
          return {
            ...item,
            myReaction: serverData.myReaction ?? null,
            hasLiked: !!serverData.hasLiked,
            likesCount: serverData.likesCount,
            reactionsCounts: serverData.reactionsCounts,
          };
        }

        const prevMyReaction = item.myReaction || (item.hasLiked ? 'fire' : null);
        const prevCounts = {
          fire: 0,
          beast: 0,
          respect: 0,
          pr: 0,
          ...(item.reactionsCounts || {}),
        };

        let nextMyReaction = reactionType;
        let nextLikesCount = item.likesCount || 0;

        if (prevMyReaction === reactionType) {
          nextMyReaction = '';
          prevCounts[reactionType] = Math.max(0, (prevCounts[reactionType] || 1) - 1);
          nextLikesCount = Math.max(0, nextLikesCount - 1);
        } else if (prevMyReaction) {
          prevCounts[prevMyReaction] = Math.max(0, (prevCounts[prevMyReaction] || 1) - 1);
          prevCounts[reactionType] = (prevCounts[reactionType] || 0) + 1;
        } else {
          prevCounts[reactionType] = (prevCounts[reactionType] || 0) + 1;
          nextLikesCount += 1;
        }

        return {
          ...item,
          myReaction: nextMyReaction || null,
          hasLiked: !!nextMyReaction,
          likesCount: nextLikesCount,
          reactionsCounts: prevCounts,
        };
      });

    // 1. Optimistic update
    setFeed(prev => applyReactionUpdate(prev));

    // 2. Server reconciliation
    try {
      const res = await socialService.toggleLike(workoutId, reactionType);
      if (res && typeof res.likesCount === 'number' && res.reactionsCounts) {
        setFeed(prev => applyReactionUpdate(prev, res));
      }
    } catch {
      await loadFeed(isShowingOlderRef.current, scopeRef.current, gymFilterRef.current);
    }
  };

  // Add Comment
  const handleAddComment = async (workoutId: any) => {
    const text = activeCommentInput[workoutId]?.trim();
    if (!text || isActionLoading) return;

    setIsActionLoading(true);
    try {
      await socialService.addComment(workoutId, text);
      setActiveCommentInput(prev => ({ ...prev, [workoutId]: '' }));
      setShowComments(prev => ({ ...prev, [workoutId]: true }));
      await loadFeed(isShowingOlderRef.current, scopeRef.current, gymFilterRef.current);
    } catch {
      Alert.alert('Error', 'No se pudo publicar el comentario');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: any) => {
    if (isActionLoading) return;
    setIsActionLoading(true);
    try {
      await socialService.deleteComment(commentId);
      await loadFeed(isShowingOlderRef.current, scopeRef.current, gymFilterRef.current);
    } catch {
      Alert.alert('Error', 'No se pudo eliminar el comentario');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Fork Routine
  const handleImportRoutine = async (routineId: any) => {
    if (!routineId || isActionLoading) return;
    setIsActionLoading(true);
    try {
      await forkRoutine(routineId, 'Importadas del Muro');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      Alert.alert('¡Rutina Importada!', 'La rutina ha sido añadida con éxito a tu biblioteca.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al importar la rutina');
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredGymMembers = useMemo(() => {
    const list = Array.isArray(gymMeta?.gymMembers) ? gymMeta.gymMembers : [];
    if (gymFilter === 'same_gym') return list.filter((m: any) => m.matchType === 'same_gym');
    if (gymFilter === 'same_city') return list.filter((m: any) => m.matchType === 'same_city');
    return list;
  }, [gymMeta?.gymMembers, gymFilter]);

  const totalGymAthletes = (gymMeta?.sameGymCount || 0) + (gymMeta?.sameCityCount || 0);

  // 1. Scope Selector + Info (Apple Liquid Glass)
  const renderScopeSelector = () => (
    <View style={styles.scopeSection}>
      {/* Top row with info button */}
      <View style={styles.scopeInfoRow}>
        <TouchableOpacity
          onPress={() => setShowFeedInfo(v => !v)}
          activeOpacity={0.7}
          style={[
            styles.infoToggleBtn,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.65)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
          />
          <Info size={14} color={colors.tint} />
          <Text style={[styles.infoToggleText, { color: colors.textSecondary }]}>
            {showFeedInfo ? 'Ocultar información' : '¿Cómo funciona el Muro?'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info Card (Liquid Glass) */}
      {showFeedInfo && (
        <View
          style={[
            styles.infoBox,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
          />
          <View style={styles.infoBoxInner}>
            <View style={[styles.infoCardItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.5)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Flame size={15} color="#f97316" fill="#f97316" />
                <Text style={[styles.infoCardTitle, { color: colors.text }]}>Global</Text>
              </View>
              <Text style={[styles.infoCardDesc, { color: colors.textSecondary }]}>
                Publicaciones públicas de toda la comunidad. Los entrenamientos privados no aparecen aquí.
              </Text>
            </View>

            <View style={[styles.infoCardItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.5)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MapPin size={15} color="#10b981" />
                <Text style={[styles.infoCardTitle, { color: colors.text }]}>Mi Gimnasio / Ciudad</Text>
              </View>
              <Text style={[styles.infoCardDesc, { color: colors.textSecondary }]}>
                Publicaciones públicas de atletas de tu gimnasio o ciudad. Puedes filtrar por tu centro específico o tu ciudad entera.
              </Text>
            </View>

            <View style={[styles.infoCardItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.5)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Users size={15} color="#3b82f6" />
                <Text style={[styles.infoCardTitle, { color: colors.text }]}>Amigos</Text>
              </View>
              <Text style={[styles.infoCardDesc, { color: colors.textSecondary }]}>
                Actividad exclusiva tuya y de tus amigos con permiso de visualización.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 3 Scope Liquid Glass Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scopePillsContainer}>
        {/* Global Pill */}
        <TouchableOpacity
          onPress={() => handleScopeChange('global')}
          activeOpacity={0.8}
          style={[
            styles.scopeGlassPill,
            {
              borderColor: scope === 'global'
                ? colors.tint
                : isDark
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(0, 0, 0, 0.08)',
              backgroundColor: scope === 'global'
                ? colors.tint
                : isDark
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(255, 255, 255, 0.65)',
            },
          ]}
        >
          <GlassView
            glassEffectStyle={scope === 'global' ? 'clear' : 'regular'}
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
          />
          <View style={styles.scopePillInner}>
            <Flame
              size={16}
              color={scope === 'global' ? accentTextColor : '#f97316'}
              fill={scope === 'global' ? accentTextColor : '#f97316'}
            />
            <Text
              style={[
                styles.scopePillText,
                { color: scope === 'global' ? accentTextColor : colors.text },
              ]}
            >
              Global
            </Text>
            <View
              style={[
                styles.scopePillBadge,
                {
                  backgroundColor: scope === 'global'
                    ? 'rgba(0, 0, 0, 0.2)'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              <Text
                style={[
                  styles.scopePillBadgeText,
                  { color: scope === 'global' ? accentTextColor : colors.textSecondary },
                ]}
              >
                Comunidad
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Mi Gimnasio Pill */}
        <TouchableOpacity
          onPress={() => handleScopeChange('gym')}
          activeOpacity={0.8}
          style={[
            styles.scopeGlassPill,
            {
              borderColor: scope === 'gym'
                ? colors.tint
                : isDark
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(0, 0, 0, 0.08)',
              backgroundColor: scope === 'gym'
                ? colors.tint
                : isDark
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(255, 255, 255, 0.65)',
            },
          ]}
        >
          <GlassView
            glassEffectStyle={scope === 'gym' ? 'clear' : 'regular'}
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
          />
          <View style={styles.scopePillInner}>
            <MapPin size={16} color={scope === 'gym' ? accentTextColor : '#10b981'} />
            <Text
              style={[
                styles.scopePillText,
                { color: scope === 'gym' ? accentTextColor : colors.text },
              ]}
            >
              Mi Gimnasio
            </Text>
            {totalGymAthletes > 0 && (
              <View
                style={[
                  styles.scopePillBadge,
                  {
                    backgroundColor: scope === 'gym' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.scopePillBadgeText,
                    { color: scope === 'gym' ? accentTextColor : '#10b981' },
                  ]}
                >
                  {totalGymAthletes}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Amigos Pill */}
        <TouchableOpacity
          onPress={() => handleScopeChange('friends')}
          activeOpacity={0.8}
          style={[
            styles.scopeGlassPill,
            {
              borderColor: scope === 'friends'
                ? colors.tint
                : isDark
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(0, 0, 0, 0.08)',
              backgroundColor: scope === 'friends'
                ? colors.tint
                : isDark
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(255, 255, 255, 0.65)',
            },
          ]}
        >
          <GlassView
            glassEffectStyle={scope === 'friends' ? 'clear' : 'regular'}
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
          />
          <View style={styles.scopePillInner}>
            <Users size={16} color={scope === 'friends' ? accentTextColor : '#3b82f6'} />
            <Text
              style={[
                styles.scopePillText,
                { color: scope === 'friends' ? accentTextColor : colors.text },
              ]}
            >
              Amigos
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Contextual Sub-bar with Liquid Glass & Responsive Layout */}
      {scope === 'global' && (
        <View
          style={[
            styles.subContextCard,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
          />
          <View style={styles.subContextContent}>
            <View style={styles.subContextTextRow}>
              <View style={[styles.subContextIconCircle, { backgroundColor: colors.tint + '18' }]}>
                <Globe size={14} color={colors.tint} />
              </View>
              <Text style={[styles.subContextText, { color: colors.textSecondary }]}>
                Entrenos públicos y debates de la comunidad
              </Text>
            </View>

            {myCurrentGym?.name ? (
              <TouchableOpacity
                onPress={() => handleScopeChange('gym')}
                activeOpacity={0.7}
                style={[
                  styles.subContextPillBtn,
                  {
                    backgroundColor: colors.tint + '18',
                    borderColor: colors.tint + '35',
                  },
                ]}
              >
                <MapPin size={12} color={colors.tint} />
                <Text style={[styles.subContextPillText, { color: colors.tint }]} numberOfLines={1}>
                  {myCurrentGym.name}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setShowGymModal(true)}
                activeOpacity={0.7}
                style={[
                  styles.subContextPillBtn,
                  {
                    backgroundColor: colors.tint + '18',
                    borderColor: colors.tint + '35',
                  },
                ]}
              >
                <MapPin size={12} color={colors.tint} />
                <Text style={[styles.subContextPillText, { color: colors.tint }]}>
                  Vincular mi gym
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {scope === 'friends' && (
        <View
          style={[
            styles.subContextCard,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
          />
          <View style={styles.subContextContent}>
            <View style={styles.subContextTextRow}>
              <View style={[styles.subContextIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.18)' }]}>
                <Users size={14} color="#3b82f6" />
              </View>
              <Text style={[styles.subContextText, { color: colors.textSecondary }]}>
                Mostrando actividad tuya y de tus amigos
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => handleScopeChange('global')}
              activeOpacity={0.7}
              style={[
                styles.subContextPillBtn,
                {
                  backgroundColor: colors.tint + '18',
                  borderColor: colors.tint + '35',
                },
              ]}
            >
              <Flame size={12} color={colors.tint} fill={colors.tint} />
              <Text style={[styles.subContextPillText, { color: colors.tint }]}>
                Explorar Global
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  // 2. Gym Section (Apple Liquid Glass)
  const renderGymSection = () => {
    if (scope !== 'gym') return null;

    if (!myCurrentGym && !gymMeta?.hasGym) {
      return (
        <View
          style={[
            styles.gymCtaCard,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
          />
          <View style={[styles.gymCtaIcon, { backgroundColor: colors.tint + '18' }]}>
            <MapPin size={28} color={colors.tint} />
          </View>
          <Text style={[styles.gymCtaTitle, { color: colors.text }]}>
            Descubre quién entrena en tu gimnasio o ciudad
          </Text>
          <Text style={[styles.gymCtaDesc, { color: colors.textSecondary }]}>
            Vincula tu gimnasio habitual en un toque para ver los entrenamientos, récords y rutinas de atletas de tu mismo centro o de tu ciudad.
          </Text>
          <View style={styles.gymCtaButtons}>
            <TouchableOpacity
              onPress={() => setShowGymModal(true)}
              activeOpacity={0.8}
              style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
            >
              <MapPin size={16} color={accentTextColor} />
              <Text style={[styles.primaryBtnText, { color: accentTextColor }]}>
                Seleccionar mi gimnasio
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleScopeChange('global')}
              activeOpacity={0.8}
              style={[
                styles.secondaryBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              <Flame size={15} color="#f97316" fill="#f97316" />
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                Ver muro Global
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const activeGym = gymMeta?.myGym || myCurrentGym || {};
    const sameGymCount = gymMeta?.sameGymCount || 0;
    const sameCityCount = gymMeta?.sameCityCount || 0;

    return (
      <View
        style={[
          styles.gymHeaderCard,
          {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
        />

        {/* Gym info top - Responsive */}
        <View style={styles.gymInfoTopRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <View style={[styles.gymBadgeIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Dumbbell size={20} color="#10b981" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.gymNameTitle, { color: colors.text }]} numberOfLines={1}>
                  {activeGym.name || 'Mi Gimnasio'}
                </Text>
                {activeGym.isVerified && <CheckCircle2 size={15} color={colors.tint} />}
              </View>
              <View style={styles.gymMetaBadgesRow}>
                {activeGym.city && (
                  <Text style={[styles.gymCityText, { color: colors.textSecondary }]}>
                    {activeGym.city}
                  </Text>
                )}
                <Text style={styles.sameGymBadgeText}>
                  {sameGymCount} en tu gym
                </Text>
                {sameCityCount > 0 && (
                  <Text style={styles.sameCityBadgeText}>
                    {sameCityCount} en tu ciudad
                  </Text>
                )}
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowGymModal(true)}
            activeOpacity={0.7}
            style={[
              styles.changeGymBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.7)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
            />
            <Text style={[styles.changeGymText, { color: colors.tint }]}>Cambiar gym</Text>
          </TouchableOpacity>
        </View>

        {/* Subfilter pills (Liquid Glass) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gymSubfilters}>
          <TouchableOpacity
            onPress={() => setGymFilter('all')}
            activeOpacity={0.7}
            style={[
              styles.gymSubfilterPill,
              {
                borderColor: gymFilter === 'all'
                  ? colors.tint
                  : isDark
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(0, 0, 0, 0.08)',
                backgroundColor: gymFilter === 'all'
                  ? colors.tint
                  : isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(255, 255, 255, 0.65)',
              },
            ]}
          >
            <GlassView
              glassEffectStyle={gymFilter === 'all' ? 'clear' : 'regular'}
              colorScheme={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
            />
            <Globe size={13} color={gymFilter === 'all' ? accentTextColor : colors.textSecondary} />
            <Text
              style={[
                styles.gymSubfilterText,
                { color: gymFilter === 'all' ? accentTextColor : colors.textSecondary },
              ]}
            >
              Gimnasio y Ciudad ({sameGymCount + sameCityCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setGymFilter('same_gym')}
            activeOpacity={0.7}
            style={[
              styles.gymSubfilterPill,
              {
                borderColor: gymFilter === 'same_gym'
                  ? '#10b981'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(0, 0, 0, 0.08)',
                backgroundColor: gymFilter === 'same_gym'
                  ? '#10b981'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(255, 255, 255, 0.65)',
              },
            ]}
          >
            <GlassView
              glassEffectStyle={gymFilter === 'same_gym' ? 'clear' : 'regular'}
              colorScheme={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
            />
            <Dumbbell size={13} color={gymFilter === 'same_gym' ? '#ffffff' : colors.textSecondary} />
            <Text
              style={[
                styles.gymSubfilterText,
                { color: gymFilter === 'same_gym' ? '#ffffff' : colors.textSecondary },
              ]}
            >
              Mismo Gym ({sameGymCount})
            </Text>
          </TouchableOpacity>

          {activeGym.city && (
            <TouchableOpacity
              onPress={() => setGymFilter('same_city')}
              activeOpacity={0.7}
              style={[
                styles.gymSubfilterPill,
                {
                  borderColor: gymFilter === 'same_city'
                    ? '#3b82f6'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'rgba(0, 0, 0, 0.08)',
                  backgroundColor: gymFilter === 'same_city'
                    ? '#3b82f6'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(255, 255, 255, 0.65)',
                },
              ]}
            >
              <GlassView
                glassEffectStyle={gymFilter === 'same_city' ? 'clear' : 'regular'}
                colorScheme={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
              />
              <Building2 size={13} color={gymFilter === 'same_city' ? '#ffffff' : colors.textSecondary} />
              <Text
                style={[
                  styles.gymSubfilterText,
                  { color: gymFilter === 'same_city' ? '#ffffff' : colors.textSecondary },
                ]}
              >
                En {activeGym.city} ({sameCityCount})
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Horizontal Athletes in Zone Carousel (Liquid Glass) */}
        {filteredGymMembers.length > 0 && (
          <View style={styles.athletesCarouselSection}>
            <Text style={[styles.athletesCarouselTitle, { color: colors.textSecondary }]}>
              ATLETAS EN TU ZONA ({filteredGymMembers.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.athletesCarouselScroll}>
              {filteredGymMembers.map((member: any) => {
                const isPending = member.hasPendingRequest || pendingRequestsLocal[member.id];
                const isSameGym = member.matchType === 'same_gym';

                return (
                  <TouchableOpacity
                    key={member.id}
                    onPress={() => onNavigateProfile && onNavigateProfile(member.id)}
                    activeOpacity={0.7}
                    style={[
                      styles.athleteCard,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.6)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                  >
                    <GlassView
                      glassEffectStyle="regular"
                      colorScheme={isDark ? 'dark' : 'light'}
                      style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                    />
                    <SocialUserAvatar user={member} size={38} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.athleteCardName, { color: colors.text }]} numberOfLines={1}>
                        {member.username}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <View
                          style={[
                            styles.athleteGymTag,
                            {
                              backgroundColor: isSameGym ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.athleteGymTagText,
                              { color: isSameGym ? '#10b981' : '#3b82f6' },
                            ]}
                            numberOfLines={1}
                          >
                            {isSameGym ? 'Mismo gym' : member.gymCity || 'Tu ciudad'}
                          </Text>
                        </View>
                        {member.streak > 0 && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                            <Flame size={11} color="#f97316" fill="#f97316" />
                            <Text style={styles.athleteStreakText}>{member.streak}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {member.isFriend ? (
                      <View style={[styles.friendStatusPill, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                        <Check size={14} color="#10b981" />
                      </View>
                    ) : isPending ? (
                      <View style={[styles.friendStatusPill, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
                        <Clock size={14} color={colors.textSecondary} />
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleQuickFriendRequest(member.id)}
                        disabled={sendingRequestId === member.id}
                        style={[styles.friendConnectBtn, { backgroundColor: colors.tint }]}
                      >
                        <UserPlus size={13} color={accentTextColor} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  // 3. Render Post Item
  const renderPostItem = (log: any, index: number) => {
    if (!log) return null;
    const isMe = log.user_id === userProfile?.id;
    const authorUser = isMe
      ? {
          ...log.user,
          ...userProfile,
          role: userProfile?.role || log.user?.role,
          gym_name: log.user?.gym_name || myCurrentGym?.name || null,
          gym_city: log.user?.gym_city || myCurrentGym?.city || null,
        }
      : log.user || {};

    const displayName = authorUser?.username || 'Usuario';
    const comments = Array.isArray(log.Comments) ? log.Comments : log.comments || [];

    const isOlder = isOlderThan7Days(log.workout_date || log.created_at);
    const prevLog = index > 0 ? feed[index - 1] : null;
    const prevIsOlder = prevLog ? isOlderThan7Days(prevLog.workout_date || prevLog.created_at) : false;
    const showOlderDivider = isShowingOlder && isOlder && (!prevLog || !prevIsOlder);

    const isFriend = isMe || !!authorUser?.is_friend;
    const isPendingRequest = !!authorUser?.has_pending_request || !!pendingRequestsLocal[log.user_id];
    const isSameGymAuthor = authorUser?.gym_match_type === 'same_gym';
    const isSameCityAuthor = authorUser?.gym_match_type === 'same_city';

    // 4 Reactions counts & active state
    const rCounts = log.reactionsCounts || {
      fire: log.likesCount || 0,
      beast: 0,
      respect: 0,
      pr: 0,
    };
    const activeReaction = log.myReaction || (log.hasLiked ? 'fire' : null);

    const reactionButtons = [
      {
        key: 'fire',
        label: 'Fuego',
        Icon: Flame,
        count: rCounts.fire || 0,
        color: '#f97316',
        fill: activeReaction === 'fire' ? '#f97316' : 'transparent',
      },
      {
        key: 'beast',
        label: 'Bestia',
        Icon: Dumbbell,
        count: rCounts.beast || 0,
        color: '#a855f7',
        fill: 'transparent',
      },
      {
        key: 'respect',
        label: 'Respeto',
        Icon: Shield,
        count: rCounts.respect || 0,
        color: '#10b981',
        fill: activeReaction === 'respect' ? '#10b981' : 'transparent',
      },
      {
        key: 'pr',
        label: 'PR',
        Icon: Trophy,
        count: rCounts.pr || 0,
        color: '#f59e0b',
        fill: activeReaction === 'pr' ? '#f59e0b' : 'transparent',
      },
    ];

    const areCommentsOpen = !!showComments[log.id];

    return (
      <View key={log.id || `post_${index}`}>
        {showOlderDivider && (
          <View style={styles.olderDividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]} />
            <View style={[styles.olderBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' }]}>
              <Clock size={12} color={colors.tint} />
              <Text style={[styles.olderBadgeText, { color: colors.textSecondary }]}>
                Publicaciones de más de 7 días
              </Text>
            </View>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]} />
          </View>
        )}

        <View
          style={[
            styles.postCard,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
          />

          {/* Author Header */}
          <View style={styles.authorHeader}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => onNavigateProfile && onNavigateProfile(log.user_id)}
              style={styles.authorInfoGroup}
            >
              <SocialUserAvatar user={authorUser} size={46} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.authorUsername, { color: colors.text }]} numberOfLines={1}>
                    {displayName}
                  </Text>
                  {isMe && <Text style={[styles.authorMeTag, { color: colors.textSecondary }]}> (Tú)</Text>}
                </View>

                <View style={styles.authorSubRow}>
                  <Text style={[styles.authorTime, { color: colors.textSecondary }]}>
                    {timeAgo(log.workout_date || log.created_at)}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Flame size={12} color="#f97316" fill="#f97316" />
                    <Text style={styles.authorStreak}>{authorUser?.streak ?? 0}</Text>
                  </View>

                  {(authorUser?.gym_name || authorUser?.gym_city) && (
                    <View
                      style={[
                        styles.authorGymPill,
                        {
                          backgroundColor: isSameGymAuthor
                            ? 'rgba(16, 185, 129, 0.15)'
                            : isSameCityAuthor
                            ? 'rgba(59, 130, 246, 0.15)'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.06)'
                            : 'rgba(0, 0, 0, 0.05)',
                        },
                      ]}
                    >
                      {isSameGymAuthor ? (
                        <Dumbbell size={10} color="#10b981" />
                      ) : (
                        <MapPin size={10} color="#3b82f6" />
                      )}
                      <Text
                        style={[
                          styles.authorGymPillText,
                          {
                            color: isSameGymAuthor ? '#10b981' : isSameCityAuthor ? '#3b82f6' : colors.textSecondary,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {authorUser.gym_name || authorUser.gym_city}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {!isMe && !isFriend && (
              isPendingRequest ? (
                <View style={[styles.connectStatusPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                  <Clock size={12} color={colors.textSecondary} />
                  <Text style={[styles.connectStatusText, { color: colors.textSecondary }]}>Pendiente</Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handleQuickFriendRequest(log.user_id)}
                  disabled={sendingRequestId === log.user_id}
                  style={[styles.quickConnectBtn, { backgroundColor: colors.tint + '18' }]}
                >
                  <UserPlus size={13} color={colors.tint} />
                  <Text style={[styles.quickConnectBtnText, { color: colors.tint }]}>Conectar</Text>
                </TouchableOpacity>
              )
            )}
          </View>

          {/* Workout Summary Card */}
          <View
            style={[
              styles.workoutSummaryBox,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
          >
            <View style={styles.workoutSummaryHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Dumbbell size={16} color={colors.tint} />
                <Text style={[styles.routineNameText, { color: colors.text }]} numberOfLines={1}>
                  Completó: {log.routine?.name || log.routine_name || 'Entrenamiento libre'}
                </Text>
              </View>
              {log.routine_id && !isMe && (
                <TouchableOpacity
                  onPress={() => handleImportRoutine(log.routine_id)}
                  style={[styles.importBtn, { backgroundColor: colors.tint + '15' }]}
                >
                  <Download size={12} color={colors.tint} />
                  <Text style={[styles.importBtnText, { color: colors.tint }]}>Importar</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Chips: Duration & Calories */}
            <View style={styles.statsChipsRow}>
              {log.duration_seconds > 0 && (
                <View
                  style={[
                    styles.statChip,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                    },
                  ]}
                >
                  <Clock size={12} color={colors.textSecondary} />
                  <Text style={[styles.statChipText, { color: colors.text }]}>
                    {formatDuration(log.duration_seconds)}
                  </Text>
                </View>
              )}
              {log.calories_burned > 0 && (
                <View
                  style={[
                    styles.statChip,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                    },
                  ]}
                >
                  <Flame size={12} color="#eab308" />
                  <Text style={[styles.statChipText, { color: colors.text }]}>
                    {log.calories_burned} kcal
                  </Text>
                </View>
              )}
            </View>

            {/* Exercise Details with Sets */}
            {Array.isArray(log.WorkoutLogDetails) && log.WorkoutLogDetails.length > 0 && (
              <View style={styles.exercisesListContainer}>
                {log.WorkoutLogDetails.slice(0, 4).map((detail: any, dIdx: number) => {
                  const sets = Array.isArray(detail?.WorkoutLogSets) ? detail.WorkoutLogSets : [];
                  return (
                    <View key={dIdx} style={styles.exerciseDetailRow}>
                      <View style={[styles.exerciseIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                        <Dumbbell size={14} color={colors.textSecondary} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.exerciseDetailName, { color: colors.text }]} numberOfLines={1}>
                          {detail.exercise_name || 'Ejercicio'}
                        </Text>
                        <View style={styles.exerciseSetsRow}>
                          {sets.map((s: any, sIdx: number) => {
                            const weight = parseFloat(s.weight_kg);
                            return (
                              <View
                                key={sIdx}
                                style={[
                                  styles.setTag,
                                  {
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                                  },
                                ]}
                              >
                                <Text style={[styles.setTagText, { color: colors.textSecondary }]}>
                                  {s.reps} {weight > 0 ? `× ${weight}kg` : 'reps'}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  );
                })}
                {log.WorkoutLogDetails.length > 4 && (
                  <Text style={[styles.moreExercisesText, { color: colors.tint }]}>
                    + {log.WorkoutLogDetails.length - 4} ejercicios más
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* 4 Reactions Bar + Comment Count */}
          <View style={styles.reactionsBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reactionsScroll}>
              {reactionButtons.map(btn => {
                const isSelected = activeReaction === btn.key;
                return (
                  <TouchableOpacity
                    key={btn.key}
                    onPress={() => handleToggleLike(log.id, btn.key)}
                    activeOpacity={0.7}
                    style={[
                      styles.reactionBtn,
                      isSelected
                        ? {
                            backgroundColor: btn.color + '20',
                            borderColor: btn.color + '60',
                          }
                        : {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                          },
                    ]}
                  >
                    <btn.Icon
                      size={15}
                      color={isSelected ? btn.color : colors.textSecondary}
                      fill={btn.fill}
                    />
                    <Text
                      style={[
                        styles.reactionLabel,
                        {
                          color: isSelected ? btn.color : colors.textSecondary,
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                    >
                      {btn.label}
                    </Text>
                    {btn.count > 0 && (
                      <View
                        style={[
                          styles.reactionCountBadge,
                          {
                            backgroundColor: isSelected ? btn.color + '30' : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.reactionCountText,
                            { color: isSelected ? btn.color : colors.text },
                          ]}
                        >
                          {btn.count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowComments(prev => ({ ...prev, [log.id]: !prev[log.id] }))}
              style={[
                styles.commentToggleBtn,
                areCommentsOpen
                  ? { backgroundColor: colors.tint + '20', borderColor: colors.tint + '50' }
                  : {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    },
              ]}
            >
              <MessageCircle size={15} color={areCommentsOpen ? colors.tint : colors.textSecondary} />
              <Text
                style={[
                  styles.commentCountText,
                  { color: areCommentsOpen ? colors.tint : colors.textSecondary },
                ]}
              >
                {comments.length}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Comments List & Add Comment Input */}
          {areCommentsOpen && (
            <View style={[styles.commentsSection, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
              {comments.length > 0 && (
                <View style={styles.commentsList}>
                  {comments.map((c: any) => {
                    const isCommentMe = c.user_id === userProfile?.id;
                    const canDelete = isCommentMe || isMe || userProfile?.role === 'admin';
                    const cAuthor = c.user || {};

                    return (
                      <View
                        key={c.id}
                        style={[
                          styles.commentBubble,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                          },
                        ]}
                      >
                        <SocialUserAvatar user={cAuthor} size={30} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={[styles.commentAuthorName, { color: colors.text }]}>
                              {cAuthor.username || 'Usuario'}
                            </Text>
                            {canDelete && (
                              <TouchableOpacity onPress={() => handleDeleteComment(c.id)}>
                                <Trash2 size={13} color="#ef4444" />
                              </TouchableOpacity>
                            )}
                          </View>
                          <Text style={[styles.commentBodyText, { color: colors.textSecondary }]}>
                            {c.comment || c.text}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Input row */}
              <View style={[styles.commentInputRow, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
                <TextInput
                  value={activeCommentInput[log.id] || ''}
                  onChangeText={txt => setActiveCommentInput(prev => ({ ...prev, [log.id]: txt }))}
                  placeholder="Escribe un comentario..."
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.commentInputField, { color: colors.text }]}
                  returnKeyType="send"
                  onSubmitEditing={() => handleAddComment(log.id)}
                />
                <TouchableOpacity
                  onPress={() => handleAddComment(log.id)}
                  disabled={isActionLoading || !(activeCommentInput[log.id] || '').trim()}
                  style={[
                    styles.sendCommentBtn,
                    {
                      backgroundColor: colors.tint,
                      opacity: (activeCommentInput[log.id] || '').trim() ? 1 : 0.5,
                    },
                  ]}
                >
                  <Send size={14} color={accentTextColor} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderScopeSelector()}
      {renderGymSection()}

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : feed.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
          />
          <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
            {scope === 'gym' ? (
              <Building2 size={32} color="#10b981" />
            ) : scope === 'friends' ? (
              <Users size={32} color="#3b82f6" />
            ) : (
              <Globe size={32} color={colors.tint} />
            )}
          </View>

          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {scope === 'gym'
              ? 'Sin entrenamientos en los últimos 7 días en esta zona'
              : scope === 'friends'
              ? 'Sin actividad de tus amigos en los últimos 7 días'
              : 'Sin publicaciones en los últimos 7 días'}
          </Text>

          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {hasOlder
              ? 'Hay entrenamientos anteriores disponibles en el histórico.'
              : scope === 'gym'
              ? 'Sé el primero en registrar un entrenamiento en tu gimnasio o explora el muro Global.'
              : scope === 'friends'
              ? 'Cambia a Global o Mi Gimnasio para descubrir entrenamientos públicos.'
              : 'Completa tu próximo entrenamiento para inaugurar el muro de la comunidad.'}
          </Text>

          <View style={styles.emptyButtonsRow}>
            {hasOlder && (
              <TouchableOpacity
                onPress={() => loadFeed(true, scope, gymFilter)}
                disabled={isLoadingOlder}
                style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
              >
                {isLoadingOlder ? (
                  <ActivityIndicator size="small" color={accentTextColor} />
                ) : (
                  <Clock size={16} color={accentTextColor} />
                )}
                <Text style={[styles.primaryBtnText, { color: accentTextColor }]}>
                  Cargar publicaciones anteriores
                </Text>
              </TouchableOpacity>
            )}

            {scope !== 'global' && (
              <TouchableOpacity
                onPress={() => handleScopeChange('global')}
                style={[
                  styles.secondaryBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  },
                ]}
              >
                <Flame size={15} color="#f97316" fill="#f97316" />
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                  Ver Muro Global
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.feedList}>
          {feed.map((log, idx) => renderPostItem(log, idx))}

          {/* Bottom "Cargar publicaciones anteriores" button when hasOlder is true */}
          {hasOlder && !isShowingOlder && (
            <TouchableOpacity
              onPress={() => loadFeed(true, scope, gymFilter)}
              disabled={isLoadingOlder}
              style={[
                styles.loadOlderBottomBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              {isLoadingOlder ? (
                <ActivityIndicator size="small" color={colors.tint} />
              ) : (
                <Clock size={16} color={colors.tint} />
              )}
              <Text style={[styles.loadOlderBottomText, { color: colors.text }]}>
                Cargar publicaciones anteriores (+7 días)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Gym Location Modal */}
      <GymLocationModal
        visible={showGymModal}
        currentGym={myCurrentGym}
        onClose={() => setShowGymModal(false)}
        onSave={handleSaveGymFromFeed}
        onRemove={handleRemoveGymFromFeed}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  loadingBox: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeSection: {
    marginBottom: 16,
    gap: 10,
  },
  scopeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  infoToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoBox: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoBoxInner: {
    padding: 14,
    gap: 10,
  },
  infoCardItem: {
    gap: 4,
    padding: 10,
    borderRadius: 14,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  infoCardDesc: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  scopePillsContainer: {
    gap: 8,
    paddingVertical: 2,
  },
  scopeGlassPill: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  scopePillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  scopePillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  scopePillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  scopePillBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  subContextCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 4,
  },
  subContextContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  subContextTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 200,
  },
  subContextIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subContextText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  subContextPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: 180,
    alignSelf: 'center',
  },
  subContextPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  gymCtaCard: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 22,
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 16,
  },
  gymCtaIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gymCtaTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  gymCtaDesc: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  gymCtaButtons: {
    width: '100%',
    gap: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 18,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  gymHeaderCard: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
    marginBottom: 16,
    gap: 14,
  },
  gymInfoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  gymBadgeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymNameTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  gymMetaBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  gymCityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sameGymBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
  },
  sameCityBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3b82f6',
  },
  changeGymBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  changeGymText: {
    fontSize: 11,
    fontWeight: '800',
  },
  gymSubfilters: {
    gap: 8,
  },
  gymSubfilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gymSubfilterText: {
    fontSize: 11,
    fontWeight: '800',
  },
  athletesCarouselSection: {
    gap: 10,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  athletesCarouselTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  athletesCarouselScroll: {
    gap: 10,
  },
  athleteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    minWidth: 190,
    maxWidth: 220,
  },
  athleteCardName: {
    fontSize: 13,
    fontWeight: '700',
  },
  athleteGymTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  athleteGymTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  athleteStreakText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f97316',
  },
  friendStatusPill: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendConnectBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedList: {
    gap: 16,
  },
  olderDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  olderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  olderBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  postCard: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
    gap: 14,
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  authorInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  authorUsername: {
    fontSize: 15,
    fontWeight: '800',
  },
  authorMeTag: {
    fontSize: 12,
    fontWeight: '500',
  },
  authorSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  authorTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  authorStreak: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f97316',
  },
  authorGymPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  authorGymPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  quickConnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quickConnectBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  connectStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  connectStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  workoutSummaryBox: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  workoutSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  routineNameText: {
    fontSize: 14,
    fontWeight: '800',
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  importBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statsChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  exercisesListContainer: {
    gap: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  exerciseDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exerciseIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseDetailName: {
    fontSize: 12,
    fontWeight: '700',
  },
  exerciseSetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  setTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  setTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  moreExercisesText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  reactionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  reactionsScroll: {
    gap: 6,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  reactionLabel: {
    fontSize: 11,
  },
  reactionCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  reactionCountText: {
    fontSize: 10,
    fontWeight: '800',
  },
  commentToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  commentCountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  commentsSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  commentsList: {
    gap: 8,
  },
  commentBubble: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    borderRadius: 16,
  },
  commentAuthorName: {
    fontSize: 12,
    fontWeight: '700',
  },
  commentBodyText: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  commentInputField: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 4,
  },
  sendCommentBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  emptyCard: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyButtonsRow: {
    width: '100%',
    gap: 8,
  },
  loadOlderBottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
  },
  loadOlderBottomText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
