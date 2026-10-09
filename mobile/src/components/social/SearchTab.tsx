import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Search, UserPlus, Check, Clock } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import { GlassButton } from '@/components/ui/GlassButton';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { SocialUserAvatar } from './SocialUserAvatar';
import { getContrastTextColor } from '@/utils/routineHelpers';

export function SearchTab({
  onNavigateProfile,
  onFocusInput,
}: {
  onNavigateProfile?: (userId: any) => void;
  onFocusInput?: () => void;
}) {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentTextColor = getContrastTextColor(colors.tint);

  const userProfile = useAppStore(state => state.userProfile);
  const socialFriends = useAppStore(state => state.socialFriends) || [];
  const socialRequests = useAppStore(state => state.socialRequests) || { received: [], sent: [] };
  const socialSearchResults = useAppStore(state => state.socialSearchResults) || [];
  const isSocialLoading = useAppStore(state => state.isSocialLoading);
  const searchUsers = useAppStore(state => state.searchUsers);
  const sendFriendRequest = useAppStore(state => state.sendFriendRequest);

  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        searchUsers(query.trim());
        setHasSearched(true);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [query]);

  const handleManualSearch = () => {
    if (query.trim()) {
      searchUsers(query.trim());
      setHasSearched(true);
    }
  };

  const handleSendRequest = async (targetUserId: string | number) => {
    try {
      const ok = await sendFriendRequest(targetUserId);
      if (ok) {
        Alert.alert('Éxito', 'Solicitud de amistad enviada');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Input Card */}
      <View style={[styles.searchBarWrapper, { borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)' }]}>
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: 26 }]}
        />
        <Search size={20} color={colors.textSecondary} style={{ marginLeft: 14 }} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={onFocusInput}
          onSubmitEditing={handleManualSearch}
          returnKeyType="search"
          placeholder="Buscar por nombre de usuario..."
          placeholderTextColor={colors.textSecondary + '80'}
          style={[styles.searchInput, { color: colors.text }]}
        />
        <GlassButton
          onPress={handleManualSearch}
          theme={theme}
          noShadow={true}
          color={colors.tint}
          style={[styles.searchBtn, { borderColor: colors.tint }]}
        >
          {isSocialLoading ? (
            <ActivityIndicator size="small" color={accentTextColor} />
          ) : (
            <Text style={[styles.searchBtnText, { color: accentTextColor }]}>Buscar</Text>
          )}
        </GlassButton>
      </View>

      {/* Results Card */}
      {socialSearchResults.length > 0 && (
        <View style={[styles.card, { borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)', marginTop: 16 }]}>
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
          />

          <View style={styles.resultsHeader}>
            <Text style={[styles.title, { color: colors.text }]}>Resultados</Text>
            <View
              style={[
                styles.countPill,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              <Text style={[styles.countPillText, { color: colors.textSecondary }]}>
                {socialSearchResults.length} encontrados
              </Text>
            </View>
          </View>

          <View style={{ gap: 10, marginTop: 12 }}>
            {socialSearchResults.map((user: any) => {
              const isMe = String(user.id) === String(userProfile?.id);
              const isFriend = socialFriends.some((f: any) => String(f.id) === String(user.id));
              const hasSentRequest = (socialRequests?.sent || []).some(
                (r: any) => String(r.addressee_id || r.addresseeId) === String(user.id)
              );

              const displayName = user.username?.includes('@')
                ? user.username.split('@')[0]
                : user.username || user.name || 'Usuario';

              return (
                <View
                  key={user.id}
                  style={[
                    styles.userRow,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => onNavigateProfile && onNavigateProfile(user.id)}
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                  >
                    <SocialUserAvatar user={user} size={44} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                        {displayName}
                      </Text>
                      <Text style={[styles.userLevel, { color: colors.textSecondary }]}>
                        Nivel {user.level || 1} • {user.xp?.toLocaleString() || 0} XP
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Actions */}
                  {isMe ? (
                    <View style={[styles.badgePill, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                      <Text style={[styles.badgeText, { color: colors.textSecondary }]}>Tú</Text>
                    </View>
                  ) : isFriend ? (
                    <View style={[styles.badgePill, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                      <Check size={12} color="#22c55e" style={{ marginRight: 4 }} />
                      <Text style={[styles.badgeText, { color: '#22c55e' }]}>Amigo</Text>
                    </View>
                  ) : hasSentRequest ? (
                    <View style={[styles.badgePill, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                      <Clock size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={[styles.badgeText, { color: colors.textSecondary }]}>Enviada</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleSendRequest(user.id)}
                      activeOpacity={0.8}
                      style={[styles.addBtn, { backgroundColor: colors.tint }]}
                    >
                      <UserPlus size={18} color={accentTextColor} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Empty State when searched and 0 results */}
      {hasSearched && !isSocialLoading && query.trim() && socialSearchResults.length === 0 && (
        <View
          style={[
            styles.emptyCard,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
            },
          ]}
        >
          <Search size={36} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: 10 }} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No se encontraron usuarios</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Intenta con otro nombre de usuario
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'hidden',
    paddingRight: 6,
    backgroundColor: 'transparent',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  searchBtn: {
    paddingHorizontal: 18,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 20,
    backgroundColor: 'transparent',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  userLevel: {
    fontSize: 12,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    marginTop: 20,
    padding: 30,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
  },
});
