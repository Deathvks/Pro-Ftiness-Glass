import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Trophy, Medal, Flame } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import apiClient from '@/services/apiClient';
import LevelBadge from '@/components/LevelBadge';
import { SocialUserAvatar } from './SocialUserAvatar';

export function Leaderboard({ onNavigateProfile }: { onNavigateProfile?: (userId: any) => void }) {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const userProfile = useAppStore(state => state.userProfile);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLeaderboard = async () => {
    try {
      const data = await apiClient('/social/leaderboard');
      const list = Array.isArray(data) ? data : (data?.data || []);
      setLeaderboard(list);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  if (isLoading) {
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
            <Trophy size={20} color="#f59e0b" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Ranking Global</Text>
        </View>
        <View style={[styles.topPill, { backgroundColor: colors.tint + '18' }]}>
          <Text style={[styles.topPillText, { color: colors.tint }]}>Top 50</Text>
        </View>
      </View>

      <View style={[styles.tableColumns, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
        <Text style={[styles.colHeader, { width: 30, textAlign: 'center' }]}>#</Text>
        <Text style={[styles.colHeader, { flex: 1, paddingLeft: 6 }]}>Atleta</Text>
        <Text style={[styles.colHeader, { width: 50, textAlign: 'right' }]}>Nivel</Text>
        <Text style={[styles.colHeader, { width: 48, textAlign: 'right' }]}>Racha</Text>
        <Text style={[styles.colHeader, { width: 64, textAlign: 'right' }]}>XP</Text>
      </View>
    </View>
  );

  const renderItem = (user: any, index: number) => {
    if (!user) return null;
    const isMe = String(user.id) === String(userProfile?.id);
    const displayName = user.username?.includes('@')
      ? user.username.split('@')[0]
      : user.username || user.name || 'Usuario';

    let rankIcon = null;
    if (index === 0) {
      rankIcon = <Medal size={20} color="#f59e0b" />;
    } else if (index === 1) {
      rankIcon = <Medal size={20} color="#9ca3af" />;
    } else if (index === 2) {
      rankIcon = <Medal size={20} color="#b45309" />;
    } else {
      rankIcon = (
        <Text style={[styles.rankNum, { color: colors.textSecondary }]}>
          #{index + 1}
        </Text>
      );
    }

    const itemKey = user.id ? String(user.id) : String(index);

    return (
      <TouchableOpacity
        key={itemKey}
        activeOpacity={0.7}
        onPress={() => onNavigateProfile && onNavigateProfile(user.id)}
        style={[
          styles.row,
          {
            backgroundColor: isMe
              ? colors.tint + '15'
              : isDark
              ? 'rgba(255, 255, 255, 0.03)'
              : 'rgba(0, 0, 0, 0.02)',
            borderWidth: isMe ? 1 : 0,
            borderColor: isMe ? colors.tint + '40' : 'transparent',
          },
        ]}
      >
        <View style={styles.rankCol}>{rankIcon}</View>

        <View style={styles.athleteCol}>
          <SocialUserAvatar user={user} size={32} />
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
          <View style={styles.levelScale}>
            <LevelBadge level={Number(user.level) || 1} size="sm" bgTheme={colors.card} />
          </View>
        </View>

        <View style={styles.streakCol}>
          <Flame size={13} color="#f97316" fill="#f97316" />
          <Text style={styles.streakText}>{user.streak || 0}</Text>
        </View>

        <View style={styles.xpCol}>
          <Text style={[styles.xpText, { color: colors.text }]}>
            {Number(user.xp || 0).toLocaleString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.card, { borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' }]}>
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
        />

        {renderHeader()}

        <View style={styles.list}>
          {leaderboard.map((user, idx) => renderItem(user, idx))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  card: {
    borderRadius: 28,
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
    marginBottom: 12,
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
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
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
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  colHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  rankCol: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNum: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.6,
  },
  athleteCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
  },
  athleteName: {
    fontSize: 13,
    flex: 1,
  },
  levelCol: {
    width: 50,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  levelScale: {
    transform: [{ scale: 0.7 }],
  },
  streakCol: {
    width: 48,
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
    width: 64,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  xpText: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
