import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserPlus, Check, X, Clock } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { SocialUserAvatar } from './SocialUserAvatar';
import { getContrastTextColor } from '@/utils/routineHelpers';

export function RequestsTab({ onNavigateProfile }: { onNavigateProfile?: (userId: any) => void }) {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentTextColor = getContrastTextColor(colors.tint);

  const socialRequests = useAppStore(state => state.socialRequests) || { received: [], sent: [] };
  const respondFriendRequest = useAppStore(state => state.respondFriendRequest);

  const received = socialRequests.received || [];
  const sent = socialRequests.sent || [];

  const handleRespond = async (requestId: string | number, action: 'accept' | 'reject') => {
    try {
      await respondFriendRequest(requestId, action);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. SOLICITUDES RECIBIDAS */}
      <View style={[styles.card, { borderColor: colors.border, marginBottom: 20 }]}>
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Solicitudes Recibidas</Text>
          {received.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.tint }]}>
              <Text style={[styles.countText, { color: accentTextColor }]}>{received.length}</Text>
            </View>
          )}
        </View>

        {received.length === 0 ? (
          <View
            style={[
              styles.emptyBox,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' },
            ]}
          >
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No tienes solicitudes pendientes.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10, marginTop: 12 }}>
            {received.map((req: any) => {
              const requester = req.Requester || {};
              const displayName = requester.username?.includes('@')
                ? requester.username.split('@')[0]
                : requester.username || 'Usuario';

              return (
                <View
                  key={req.id}
                  style={[
                    styles.userRow,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: colors.border + '40',
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => onNavigateProfile && onNavigateProfile(requester.id)}
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                  >
                    <SocialUserAvatar user={requester} size={44} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                        {displayName}
                      </Text>
                      <Text style={[styles.userSubtext, { color: colors.textSecondary }]}>
                        Quiere ser tu amigo
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Accept & Reject buttons */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      onPress={() => handleRespond(req.id, 'accept')}
                      activeOpacity={0.75}
                      style={[styles.actionBtn, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}
                    >
                      <Check size={18} color="#22c55e" strokeWidth={2.5} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleRespond(req.id, 'reject')}
                      activeOpacity={0.75}
                      style={[styles.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}
                    >
                      <X size={18} color="#ef4444" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* 2. SOLICITUDES ENVIADAS */}
      {sent.length > 0 && (
        <View style={[styles.card, { borderColor: colors.border }]}>
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />

          <Text style={[styles.title, { color: colors.text, marginBottom: 12 }]}>
            Solicitudes Enviadas
          </Text>

          <View style={{ gap: 10 }}>
            {sent.map((req: any) => {
              const addressee = req.Addressee || {};
              const displayName = addressee.username?.includes('@')
                ? addressee.username.split('@')[0]
                : addressee.username || 'Usuario';

              return (
                <View
                  key={req.id}
                  style={[
                    styles.userRow,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: colors.border + '40',
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => onNavigateProfile && onNavigateProfile(addressee.id)}
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                  >
                    <SocialUserAvatar user={addressee} size={44} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                        {displayName}
                      </Text>
                      <Text style={[styles.userSubtext, { color: colors.textSecondary }]}>
                        Solicitud pendiente
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                  >
                    <Clock size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                      Esperando
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
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
  card: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 20,
    backgroundColor: 'transparent',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  countBadge: {
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyBox: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
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
  userSubtext: {
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
