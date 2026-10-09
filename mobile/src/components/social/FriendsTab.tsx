import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Users, UserX, ChevronLeft, ChevronRight, Search } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { SocialUserAvatar } from './SocialUserAvatar';
import { ConfirmationModal } from './ConfirmationModal';

interface FriendsTabProps {
  onSwitchToSearch: () => void;
  onNavigateProfile?: (userId: number | string) => void;
}

export function FriendsTab({ onSwitchToSearch, onNavigateProfile }: FriendsTabProps) {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const socialFriends = useAppStore(state => state.socialFriends) || [];
  const removeFriend = useAppStore(state => state.removeFriend);

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.ceil(socialFriends.length / ITEMS_PER_PAGE);

  const paginatedFriends = socialFriends.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const [deleteModal, setDeleteModal] = useState<{
    visible: boolean;
    friendId: number | string | null;
    friendName?: string;
  }>({
    visible: false,
    friendId: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePress = (friend: any) => {
    setDeleteModal({
      visible: true,
      friendId: friend.id,
      friendName: friend.username || friend.name || 'este amigo',
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.friendId) return;
    setIsDeleting(true);
    try {
      await removeFriend(deleteModal.friendId);
      setDeleteModal({ visible: false, friendId: null });
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ConfirmationModal
        visible={deleteModal.visible}
        title="Eliminar amigo"
        message={`¿Seguro que quieres eliminar a ${deleteModal.friendName} de tu lista de amigos?`}
        confirmText="Eliminar amigo"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ visible: false, friendId: null })}
      />

      <View style={[styles.card, { borderColor: colors.border }]}>
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        {/* Title */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Mis Amigos{' '}
            <Text style={{ color: colors.textSecondary, fontWeight: '500', fontSize: 16 }}>
              ({socialFriends.length})
            </Text>
          </Text>
        </View>

        {socialFriends.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' },
            ]}
          >
            <View style={[styles.emptyIconBox, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }]}>
              <Users size={32} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Aún no tienes amigos agregados
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Conecta con otros atletas y comparte tu progreso
            </Text>

            <TouchableOpacity
              onPress={onSwitchToSearch}
              activeOpacity={0.85}
              style={[
                styles.searchPeopleBtn,
                { backgroundColor: colors.tint + '15', borderColor: colors.tint + '30' },
              ]}
            >
              <Search size={16} color={colors.tint} style={{ marginRight: 8 }} />
              <Text style={[styles.searchPeopleText, { color: colors.tint }]}>
                Buscar personas
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {paginatedFriends.map((friend: any) => {
              const displayName = friend.username?.includes('@')
                ? friend.username.split('@')[0]
                : friend.username || friend.name || 'Usuario';

              return (
                <TouchableOpacity
                  key={friend.id}
                  activeOpacity={0.7}
                  onPress={() => onNavigateProfile && onNavigateProfile(friend.id)}
                  style={[
                    styles.userRow,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: colors.border + '40',
                    },
                  ]}
                >
                  <SocialUserAvatar user={friend} size={46} />

                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text style={[styles.userLevel, { color: colors.textSecondary }]}>
                      Nivel {friend.level || 1} • {friend.xp?.toLocaleString() || 0} XP
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDeletePress(friend)}
                    activeOpacity={0.7}
                    style={styles.deleteBtn}
                  >
                    <UserX size={18} color="#ef4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <View style={styles.pagination}>
                <TouchableOpacity
                  onPress={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={[
                    styles.pageBtn,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      opacity: page === 1 ? 0.3 : 1,
                    },
                  ]}
                >
                  <ChevronLeft size={20} color={colors.text} />
                </TouchableOpacity>

                <Text style={[styles.pageInfo, { color: colors.textSecondary }]}>
                  Página {page} de {totalPages}
                </Text>

                <TouchableOpacity
                  onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={[
                    styles.pageBtn,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      opacity: page === totalPages ? 0.3 : 1,
                    },
                  ]}
                >
                  <ChevronRight size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 20,
    backgroundColor: 'transparent',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  emptyState: {
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    marginVertical: 10,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
  },
  searchPeopleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
  },
  searchPeopleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    gap: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  userLevel: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 8,
  },
  pageBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageInfo: {
    fontSize: 13,
    fontWeight: '600',
  },
});
