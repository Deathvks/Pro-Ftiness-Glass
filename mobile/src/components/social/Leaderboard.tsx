import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Trophy, Medal, Flame } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import apiClient from '@/services/apiClient';
import LevelBadge from '@/components/LevelBadge';
import { SocialUserAvatar } from './SocialUserAvatar';

interface LeaderboardProps {
  onNavigateProfile?: (userId: any) => void;
}

export function Leaderboard({ onNavigateProfile }: LeaderboardProps) {
  const theme = useAppStore((state: any) => state.theme) || 'oled';
  const colors = useAppColors();
  const userProfile = useAppStore((state: any) => state.userProfile);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const socialLeaderboard = useAppStore((state: any) => state.socialLeaderboard);
  const fetchLeaderboard = useAppStore((state: any) => state.fetchLeaderboard);

  const [localLeaderboard, setLocalLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadLeaderboardData = async () => {
    if (fetchLeaderboard) {
      try {
        await fetchLeaderboard();
      } catch (e) {
        console.warn('Leaderboard fetch from store failed, falling back to direct API', e);
      }
    }
    try {
      const data = await apiClient('/social/leaderboard');
      const list = Array.isArray(data) ? data : (data?.data || []);
      setLocalLeaderboard(list);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!socialLeaderboard || !Array.isArray(socialLeaderboard) || socialLeaderboard.length === 0) {
      setIsLoading(true);
    }
    loadLeaderboardData();
  }, []);

  const items = (Array.isArray(socialLeaderboard) && socialLeaderboard.length > 0)
    ? socialLeaderboard
    : localLeaderboard;

  if (isLoading && items.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.titleGroup}>
          <View style={styles.trophyBadge}>
            <Trophy size={20} color="#eab308" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Ranking Global</Text>
        </View>
        <View style={[styles.topPill, { backgroundColor: colors.tint + '18' }]}>
          <Text style={[styles.topPillText, { color: colors.tint }]}>Top 50</Text>
        </View>
      </View>

      <View
        style={[
          styles.tableColumns,
          {
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <View style={styles.rankCol}>
          <Text style={styles.colHeaderCenter}>#</Text>
        </View>
        <View style={styles.athleteColHeader}>
          <Text style={styles.colHeaderLeft}>Atleta</Text>
        </View>
        <View style={styles.levelCol}>
          <Text style={styles.colHeaderRight}>Nivel</Text>
        </View>
        <View style={styles.streakCol}>
          <Text style={styles.colHeaderRight}>Racha</Text>
        </View>
        <View style={styles.xpCol}>
          <Text style={styles.colHeaderRight}>XP</Text>
        </View>
      </View>
    </View>
  );

  const renderItem = (user: any, index: number) => {
    if (!user) return null;
    const isMe = String(user.id) === String(userProfile?.id);
    const displayName = user.username?.includes('@')
      ? user.username.split('@')[0]
      : user.username || user.name || 'Usuario';

    let rankNode = null;
    if (index === 0) {
      rankNode = <Medal size={20} color="#facc15" />;
    } else if (index === 1) {
      rankNode = <Medal size={20} color="#9ca3af" />;
    } else if (index === 2) {
      rankNode = <Medal size={20} color="#b45309" />;
    } else {
      rankNode = (
        <Text style={[styles.rankNum, { color: colors.textSecondary }]}>
          #{index + 1}
        </Text>
      );
    }

    const itemKey = user.id ? `user-${user.id}` : `idx-${index}`;

    return (
      <TouchableOpacity
        key={itemKey}
        activeOpacity={0.7}
        onPress={() => onNavigateProfile && onNavigateProfile(user.id)}
        style={[
          styles.row,
          {
            backgroundColor: isMe
              ? colors.tint + '18'
              : isDark
              ? 'rgba(255, 255, 255, 0.03)'
              : 'rgba(0, 0, 0, 0.02)',
            borderWidth: isMe ? 1.5 : 0,
            borderColor: isMe ? colors.tint + '50' : 'transparent',
            marginVertical: isMe ? 3 : 0,
          },
        ]}
      >
        <View style={styles.rankCol}>{rankNode}</View>

        <View style={styles.athleteCol}>
          <SocialUserAvatar user={user} size={30} />
          <Text
            style={[
              styles.athleteName,
              {
                color: isMe ? colors.tint : colors.text,
                fontWeight: isMe ? '800' : '600',
              },
            ]}
            numberOfLines={1}
          >
            {displayName}{isMe ? ' (Tú)' : ''}
          </Text>
        </View>

        <View style={styles.levelCol}>
          <LevelBadge level={Number(user.level) || 1} size="sm" />
        </View>

        <View style={styles.streakCol}>
          <Flame size={13} color="#f97316" fill="#f97316" />
          <Text style={styles.streakText}>{user.streak || 0}</Text>
        </View>

        <View style={styles.xpCol}>
          <Text style={[styles.xpText, { color: colors.text }]}>
            {Number(user.xp || 0).toLocaleString('es-ES')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: 32 }]}
        />

        {renderHeader()}

        <View style={styles.list}>
          {items.map((user, idx) => renderItem(user, idx))}
          {items.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No hay atletas en el ranking todavía.
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  card: {
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trophyBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  topPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topPillText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableColumns: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  colHeaderCenter: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  colHeaderLeft: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  colHeaderRight: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'right',
  },
  list: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 16,
  },
  rankCol: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNum: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.6,
  },
  athleteColHeader: {
    flex: 1,
    paddingLeft: 6,
    justifyContent: 'center',
  },
  athleteCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 6,
    paddingRight: 6,
  },
  athleteName: {
    fontSize: 13,
    flex: 1,
  },
  levelCol: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  streakCol: {
    width: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f97316',
  },
  xpCol: {
    width: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  xpText: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  emptyState: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
});
