import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Trophy, Medal } from 'lucide-react-native';
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

      <View style={[styles.tableColumns, { borderBottomColor: colors.border }]}>
        <Text style={[styles.colHeader, { width: 34, textAlign: 'center' }]}>#</Text>
        <Text style={[styles.colHeader, { flex: 1, paddingLeft: 8 }]}>Atleta</Text>
        <Text style={[styles.colHeader, { width: 56, textAlign: 'right' }]}>Nivel</Text>
        <Text style={[styles.colHeader, { width: 72, textAlign: 'right' }]}>XP</Text>
      </View>
    </View>
  );

  const renderItem = ({ item: user, index }: { item: any; index: number }) => {
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
            borderColor: isMe ? colors.tint + '40' : 'transparent',
          },
        ]}
      >
        <View style={styles.rankCol}>{rankIcon}</View>

        <View style={styles.athleteCol}>
          <SocialUserAvatar user={user} size={34} />
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
      <View style={[styles.card, { borderColor: colors.border }]}>
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        <View style={{ padding: 18, paddingBottom: 30 }}>
          {renderHeader()}
          <View style={{ gap: 4 }}>
            {Array.isArray(leaderboard) && leaderboard.map((item, index) => renderItem({ item, index }))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    flex: 1,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    flex: 1,
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
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
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
    letterSpacing: 1,
  },
  tableColumns: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  colHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#9ca3af',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 4,
  },
  rankCol: {
    width: 34,
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
    paddingLeft: 6,
    gap: 8,
  },
  athleteName: {
    fontSize: 13,
    flexShrink: 1,
  },
  levelCol: {
    width: 56,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  levelScale: {
    transform: [{ scale: 0.44 }],
  },
  xpCol: {
    width: 72,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  xpText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
