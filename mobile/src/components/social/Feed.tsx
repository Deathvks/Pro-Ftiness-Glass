import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import {
  Heart,
  MessageCircle,
  Clock,
  Dumbbell,
  Download,
  Trash2,
  Activity,
  Send,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import apiClient from '@/services/apiClient';
import socialService from '@/services/socialService';
import { forkRoutine } from '@/services/routineService';
import { SocialUserAvatar } from './SocialUserAvatar';
import { getContrastTextColor } from '@/utils/routineHelpers';

const timeAgo = (dateString: string) => {
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

export function Feed({ onNavigateProfile }: { onNavigateProfile?: (userId: any) => void }) {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const userProfile = useAppStore(state => state.userProfile);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentTextColor = getContrastTextColor(colors.tint);

  const [feed, setFeed] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showComments, setShowComments] = useState<{ [id: string]: boolean }>({});
  const [commentInputs, setCommentInputs] = useState<{ [id: string]: string }>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<{ [id: string]: boolean }>({});
  const [forkingRoutineId, setForkingRoutineId] = useState<string | null>(null);

  const loadFeed = async () => {
    try {
      const data = await socialService.getFeed();
      setFeed(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleToggleLike = async (workoutId: string) => {
    setFeed(prev =>
      prev.map(item => {
        if (item.id === workoutId) {
          const hasLiked = !item.hasLiked;
          const likesCount = (item.likesCount || 0) + (hasLiked ? 1 : -1);
          return { ...item, hasLiked, likesCount: Math.max(0, likesCount) };
        }
        return item;
      })
    );

    try {
      await socialService.toggleLike(workoutId);
    } catch (e) {
      loadFeed();
    }
  };

  const toggleCommentsSection = (workoutId: string) => {
    setShowComments(prev => ({
      ...prev,
      [workoutId]: !prev[workoutId],
    }));
  };

  const handleAddComment = async (workoutId: string) => {
    const text = commentInputs[workoutId]?.trim();
    if (!text) return;

    setIsSubmittingComment(prev => ({ ...prev, [workoutId]: true }));
    try {
      await socialService.addComment(workoutId, text);
      setCommentInputs(prev => ({ ...prev, [workoutId]: '' }));
      await loadFeed();
    } catch (error) {
      Alert.alert('Error', 'No se pudo publicar el comentario');
    } finally {
      setIsSubmittingComment(prev => ({ ...prev, [workoutId]: false }));
    }
  };

  const handleDeleteComment = async (commentId: string | number) => {
    try {
      await socialService.deleteComment(commentId);
      await loadFeed();
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el comentario');
    }
  };

  const handleForkRoutine = async (routineId: string, routineName: string) => {
    if (!routineId || forkingRoutineId) return;
    setForkingRoutineId(routineId);
    try {
      await forkRoutine(routineId, `Copia de ${routineName}`);
      Alert.alert('¡Rutina Importada!', `"${routineName}" se ha guardado en tus rutinas.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al importar rutina');
    } finally {
      setForkingRoutineId(null);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (feed.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View
          style={[
            styles.emptyIconBox,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' },
          ]}
        >
          <Activity size={32} color={colors.textSecondary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>El muro está vacío</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Agrega amigos para ver sus entrenamientos aquí.
        </Text>
      </View>
    );
  }

  const renderItem = ({ item: log }: { item: any }) => {
    const user = log.user || {};
    const displayName = user.username?.includes('@')
      ? user.username.split('@')[0]
      : user.username || 'Usuario';
    const areCommentsOpen = !!showComments[log.id];
    const commentsList = log.comments || [];

    return (
      <View style={[styles.card, { borderColor: colors.border }]}>
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        {/* 1. Header: Avatar + Username + Time */}
        <View style={styles.cardHeader}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => onNavigateProfile && onNavigateProfile(user.id)}
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
          >
            <SocialUserAvatar user={user} size={44} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.cardAuthor, { color: colors.text }]} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={[styles.cardTime, { color: colors.textSecondary }]}>
                {timeAgo(log.end_time || log.created_at)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 2. Workout Details */}
        <View style={styles.cardBody}>
          <Text style={[styles.routineTitle, { color: colors.text }]}>
            {log.routine_name || 'Entrenamiento'}
          </Text>

          {/* Stats Chips */}
          <View style={styles.chipsRow}>
            <View
              style={[
                styles.chip,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.04)',
                  borderColor: colors.border + '50',
                },
              ]}
            >
              <Clock size={13} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.chipText, { color: colors.text }]}>
                {Math.floor((log.duration_seconds || 0) / 60)} min
              </Text>
            </View>

            <View
              style={[
                styles.chip,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.04)',
                  borderColor: colors.border + '50',
                },
              ]}
            >
              <Dumbbell size={13} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.chipText, { color: colors.text }]}>
                {log.total_volume || 0} kg
              </Text>
            </View>
          </View>

          {/* Exercises Preview */}
          {log.exercises && log.exercises.length > 0 && (
            <View style={styles.exercisesList}>
              {log.exercises.slice(0, 3).map((ex: any, idx: number) => (
                <Text key={idx} style={[styles.exerciseItem, { color: colors.textSecondary }]} numberOfLines={1}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>
                    {ex.sets?.length || 1}x
                  </Text>{' '}
                  {ex.name || 'Ejercicio'}
                </Text>
              ))}
              {log.exercises.length > 3 && (
                <Text style={[styles.moreExercises, { color: colors.tint }]}>
                  + {log.exercises.length - 3} ejercicios más
                </Text>
              )}
            </View>
          )}
        </View>

        {/* 3. Action Buttons: Like, Comment, Fork */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => handleToggleLike(log.id)}
            activeOpacity={0.7}
            style={[
              styles.actionBtn,
              {
                backgroundColor: log.hasLiked
                  ? 'rgba(239, 68, 68, 0.15)'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(0, 0, 0, 0.04)',
              },
            ]}
          >
            <Heart
              size={18}
              color={log.hasLiked ? '#ef4444' : colors.textSecondary}
              fill={log.hasLiked ? '#ef4444' : 'transparent'}
            />
            <Text
              style={[
                styles.actionBtnText,
                { color: log.hasLiked ? '#ef4444' : colors.textSecondary },
              ]}
            >
              {log.likesCount || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggleCommentsSection(log.id)}
            activeOpacity={0.7}
            style={[
              styles.actionBtn,
              {
                backgroundColor: areCommentsOpen
                  ? colors.tint + '18'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(0, 0, 0, 0.04)',
              },
            ]}
          >
            <MessageCircle
              size={18}
              color={areCommentsOpen ? colors.tint : colors.textSecondary}
            />
            <Text
              style={[
                styles.actionBtnText,
                { color: areCommentsOpen ? colors.tint : colors.textSecondary },
              ]}
            >
              {commentsList.length}
            </Text>
          </TouchableOpacity>

          {/* Fork / Clone routine button */}
          {log.routine_id ? (
            <TouchableOpacity
              onPress={() => handleForkRoutine(log.routine_id, log.routine_name)}
              disabled={forkingRoutineId === log.routine_id}
              activeOpacity={0.7}
              style={[
                styles.forkBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.04)',
                },
              ]}
            >
              {forkingRoutineId === log.routine_id ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Download size={17} color={colors.text} />
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 4. Comments Section (Collapsible) */}
        {areCommentsOpen && (
          <View style={[styles.commentsSection, { borderTopColor: colors.border + '60' }]}>
            {/* Comments List */}
            {commentsList.length === 0 ? (
              <Text style={[styles.noCommentsText, { color: colors.textSecondary }]}>
                No hay comentarios aún. ¡Sé el primero!
              </Text>
            ) : (
              <View style={{ gap: 10, marginBottom: 14 }}>
                {commentsList.map((comm: any) => {
                  const commUser = comm.user || {};
                  const isMyComment = String(commUser.id || comm.user_id) === String(userProfile?.id);

                  return (
                    <View
                      key={comm.id}
                      style={[
                        styles.commentRow,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.04)'
                            : 'rgba(0, 0, 0, 0.03)',
                        },
                      ]}
                    >
                      <SocialUserAvatar user={commUser} size={28} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.commentAuthor, { color: colors.text }]}>
                            {commUser.username || 'Usuario'}
                          </Text>
                          <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                            {timeAgo(comm.created_at)}
                          </Text>
                        </View>
                        <Text style={[styles.commentText, { color: colors.textSecondary }]}>
                          {comm.comment}
                        </Text>
                      </View>

                      {isMyComment && (
                        <TouchableOpacity
                          onPress={() => handleDeleteComment(comm.id)}
                          style={{ padding: 6 }}
                        >
                          <Trash2 size={14} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Comment Input Form */}
            <View
              style={[
                styles.commentInputRow,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.04)',
                  borderColor: colors.border,
                },
              ]}
            >
              <TextInput
                value={commentInputs[log.id] || ''}
                onChangeText={t => setCommentInputs(prev => ({ ...prev, [log.id]: t }))}
                placeholder="Escribe un comentario..."
                placeholderTextColor={colors.textSecondary + '80'}
                style={[styles.commentInput, { color: colors.text }]}
              />
              <TouchableOpacity
                onPress={() => handleAddComment(log.id)}
                disabled={!commentInputs[log.id]?.trim() || isSubmittingComment[log.id]}
                activeOpacity={0.8}
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor: colors.tint,
                    opacity: !commentInputs[log.id]?.trim() ? 0.4 : 1,
                  },
                ]}
              >
                {isSubmittingComment[log.id] ? (
                  <ActivityIndicator size="small" color={accentTextColor} />
                ) : (
                  <Send size={15} color={accentTextColor} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 60, gap: 16 }}>
      {feed.map(item => (
        <View key={item.id.toString()}>
          {renderItem({ item })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 10,
  },
  cardAuthor: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardTime: {
    fontSize: 12,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  routineTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  exercisesList: {
    gap: 4,
  },
  exerciseItem: {
    fontSize: 13,
  },
  moreExercises: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  forkBtn: {
    marginLeft: 'auto',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsSection: {
    padding: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  noCommentsText: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 12,
    textAlign: 'center',
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 16,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
  },
  commentTime: {
    fontSize: 11,
  },
  commentText: {
    fontSize: 13,
    marginTop: 2,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  commentInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
