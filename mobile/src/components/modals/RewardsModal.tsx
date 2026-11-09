import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Trophy, Gift, Check, Lock, Palette, X } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastTextColor } from '@/utils/colorUtils';

interface RewardsModalProps {
  visible: boolean;
  onClose: () => void;
}

interface RewardItem {
  id: string;
  name: string;
  description: string;
  requiredReferrals: number;
  color: string;
}

const REWARDS: RewardItem[] = [
  {
    id: 'galaxy',
    name: 'Tema Galaxia',
    description: 'Un viaje al espacio con tonos púrpuras oscuros y un fondo estelar inmersivo.',
    requiredReferrals: 5,
    color: '#a855f7',
  },
  {
    id: 'desert',
    name: 'Tema Desierto',
    description: 'Tonos cálidos de arena y atardecer con un fondo de dunas del desierto.',
    requiredReferrals: 8,
    color: '#f97316',
  },
  {
    id: 'ocean',
    name: 'Tema Océano',
    description: 'Tonos profundos de agua y azules vibrantes con un fondo inmersivo de playa.',
    requiredReferrals: 11,
    color: '#3b82f6',
  },
];

export function RewardsModal({ visible, onClose }: RewardsModalProps) {
  const theme = useAppStore(state => state.theme) || 'oled';
  const setTheme = useAppStore(state => state.setTheme);
  const userProfile = useAppStore(state => state.userProfile);
  const colors = useAppColors();

  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const tintContrastText = getContrastTextColor(colors.tint);

  if (!visible) return null;

  const referralCount = userProfile?.referralCount || 0;
  const isAdmin = userProfile?.role === 'admin';

  const handleApplyTheme = (themeId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setTheme(themeId);
    useAppStore.getState().showToast?.(`¡Tema ${themeId} aplicado!`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(20, 20, 28, 0.96)' : 'rgba(255, 255, 255, 0.96)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.1)',
            },
          ]}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 30 }]}
          />

          {/* Header */}
          <View
            style={[
              styles.header,
              { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.iconWrap, { backgroundColor: colors.tint + '20' }]}>
                <Gift size={22} color={colors.tint} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>Recompensas</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' },
              ]}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Invita a tus amigos a registrarse con tu código y desbloquea temas exclusivos de
              personalización para toda la aplicación.
            </Text>

            {/* Contador de Amigos Invitados */}
            <View
              style={[
                styles.referralCounterBox,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              <View>
                <Text style={styles.counterLabel}>Amigos Invitados</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                  <Text style={[styles.counterValue, { color: colors.text }]}>{referralCount}</Text>
                  {isAdmin && <Text style={[styles.adminTag, { color: colors.tint }]}>· Acceso Admin</Text>}
                </View>
              </View>
              <Trophy size={32} color="#f59e0b" style={{ opacity: 0.9 }} />
            </View>

            {/* Lista de Recompensas */}
            <View style={styles.rewardsList}>
              {REWARDS.map(reward => {
                const isUnlocked = isAdmin || referralCount >= reward.requiredReferrals;
                const isActive = theme === reward.id;

                return (
                  <View
                    key={reward.id}
                    style={[
                      styles.rewardCard,
                      {
                        backgroundColor: isUnlocked
                          ? isActive
                            ? colors.tint + '12'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.04)'
                            : 'rgba(0, 0, 0, 0.03)'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.02)'
                          : 'rgba(0, 0, 0, 0.02)',
                        borderColor: isUnlocked
                          ? isActive
                            ? colors.tint + '40'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.06)'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.04)'
                          : 'rgba(0, 0, 0, 0.03)',
                        opacity: isUnlocked ? 1 : 0.65,
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                      <View
                        style={[
                          styles.rewardIconBox,
                          {
                            backgroundColor: reward.color + '20',
                          },
                        ]}
                      >
                        <Palette size={22} color={reward.color} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 4,
                          }}
                        >
                          <Text style={[styles.rewardTitle, { color: colors.text }]}>
                            {reward.name}
                          </Text>
                          <View
                            style={[
                              styles.lockBadge,
                              {
                                backgroundColor: isUnlocked ? '#10b98120' : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                              },
                            ]}
                          >
                            {isUnlocked ? (
                              <Check size={12} color="#10b981" strokeWidth={3} />
                            ) : (
                              <Lock size={12} color={colors.textSecondary} />
                            )}
                            <Text
                              style={[
                                styles.lockBadgeText,
                                {
                                  color: isUnlocked ? '#10b981' : colors.textSecondary,
                                },
                              ]}
                            >
                              {isUnlocked
                                ? 'Desbloqueado'
                                : `${referralCount}/${reward.requiredReferrals}`}
                            </Text>
                          </View>
                        </View>

                        <Text style={[styles.rewardDesc, { color: colors.textSecondary }]}>
                          {reward.description}
                        </Text>

                        {isUnlocked && (
                          <TouchableOpacity
                            onPress={() => handleApplyTheme(reward.id)}
                            disabled={isActive}
                            activeOpacity={0.7}
                            style={[
                              styles.applyBtn,
                              {
                                backgroundColor: isActive ? colors.tint : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                borderWidth: 1,
                                borderColor: isActive ? colors.tint : isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.applyBtnText,
                                { color: isActive ? tintContrastText : colors.text },
                              ]}
                            >
                              {isActive ? '✓ Tema Activo' : 'Usar este Tema'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '82%',
    borderRadius: 30,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  referralCounterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  counterLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  counterValue: {
    fontSize: 32,
    fontWeight: '900',
  },
  adminTag: {
    fontSize: 11,
    fontWeight: '700',
  },
  rewardsList: {
    gap: 12,
  },
  rewardCard: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
  },
  rewardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  lockBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  rewardDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  applyBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default RewardsModal;
