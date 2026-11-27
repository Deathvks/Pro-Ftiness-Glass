import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Share,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import useAppStore from '@/store/useAppStore';
import { useToastStore } from '@/store/toastStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastTextColor } from '@/utils/colorUtils';
import { LiquidCloseButton } from '@/components/ui/GlassButton';
import { SwipeableBottomSheet, getAppleSheetCardStyle } from '@/components/ui/SwipeableBottomSheet';

interface RewardsModalProps {
  visible: boolean;
  onClose: () => void;
}

interface RewardVariant {
  id: string;
  label: string;
  testLabel: string;
}

interface RewardItem {
  id: string;
  name: string;
  previewCaption: string;
  description: string;
  requiredReferrals: number;
  color: string;
  textLight: string;
  textDark: string;
  iconName: string;
  previewImage: number;
  variants: RewardVariant[];
}

const REWARDS: RewardItem[] = [
  {
    id: 'galaxy',
    name: 'Tema Galaxia',
    previewCaption: 'Liquid Glass · Estelar',
    description: 'Un viaje al espacio con tonos púrpuras oscuros y un fondo estelar inmersivo.',
    requiredReferrals: 3,
    color: '#a855f7',
    textLight: '#6d28d9',
    textDark: '#d8b4fe',
    iconName: 'meteor',
    previewImage: require('../../../assets/images/galaxy.jpg'),
    variants: [{ id: 'galaxy', label: 'Usar tema', testLabel: 'Probar 10s' }],
  },
  {
    id: 'desert',
    name: 'Tema Desierto',
    previewCaption: 'Liquid Glass · Dunas',
    description: 'Tonos cálidos de arena y atardecer con dunas del desierto en modo claro u oscuro.',
    requiredReferrals: 5,
    color: '#f59e0b',
    textLight: '#b45309',
    textDark: '#fde68a',
    iconName: 'sun',
    previewImage: require('../../../assets/images/desert.jpg'),
    variants: [
      { id: 'desert', label: 'Claro', testLabel: 'Probar Claro' },
      { id: 'desert-dark', label: 'Oscuro', testLabel: 'Probar Oscuro' },
    ],
  },
  {
    id: 'ocean',
    name: 'Tema Océano',
    previewCaption: 'Liquid Glass · Océano',
    description: 'Tonos profundos de agua y azules vibrantes con fondo de playa en claro u oscuro.',
    requiredReferrals: 7,
    color: '#0ea5e9',
    textLight: '#0369a1',
    textDark: '#bae6fd',
    iconName: 'umbrella-beach',
    previewImage: require('../../../assets/images/ocean.jpg'),
    variants: [
      { id: 'ocean', label: 'Claro', testLabel: 'Probar Claro' },
      { id: 'ocean-dark', label: 'Oscuro', testLabel: 'Probar Oscuro' },
    ],
  },
];

export function RewardsModal({ visible, onClose }: RewardsModalProps) {
  const theme = useAppStore(state => state.theme) || 'oled';
  const setTheme = useAppStore(state => state.setTheme);
  const startThemeTest = useAppStore(state => (state as any).startThemeTest);
  const themeTest = useAppStore(state => state.themeTest);
  const userProfile = useAppStore(state => state.userProfile);
  const colors = useAppColors();

  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isIOS = Platform.OS === 'ios';
  const tintContrastText = getContrastTextColor(colors.tint);
  const isTestingTheme = Boolean(themeTest?.name);

  const referralCount = userProfile?.referralCount || 0;
  const isAdmin = userProfile?.role === 'admin';
  const referralCode = userProfile?.referral_code || '';
  const referralLink = `https://profitnessglass.es/register?ref=${referralCode}`;
  const nextReward = REWARDS.find(r => referralCount < r.requiredReferrals);

  const handleApplyTheme = (themeId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {}
    setTheme(themeId);
    useToastStore.getState().showToast(`¡Tema ${themeId} aplicado!`, 'success');
    onClose();
  };

  const handleTestTheme = (themeId: string) => {
    if (isTestingTheme) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    startThemeTest?.(themeId, 10);
    useToastStore.getState().showToast('Probando tema en vivo durante 10s', 'info');
  };

  const handleCopyReferral = async () => {
    const showToast = useToastStore.getState().showToast;
    if (!referralCode) {
      showToast('Tu código aún se está cargando. Inténtalo de nuevo.', 'info');
      return;
    }
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {}
    try {
      await Clipboard.setStringAsync(referralLink);
      showToast('¡Enlace copiado! (+1.000 XP para ambos)', 'success');
    } catch {
      showToast('No se pudo copiar el enlace al portapapeles.', 'error');
    }
  };

  const handleShareReferral = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Share.share({
        title: 'Únete a Pro Fitness Glass',
        message: `¡Entrena y lleva tu nutrición conmigo en Pro Fitness Glass! Regístrate gratis con mi enlace: ${referralLink}`,
        url: referralLink,
      });
    } catch {
      void handleCopyReferral();
    }
  };

  return (
    <SwipeableBottomSheet
      scrollable
      visible={visible}
      onClose={onClose}
      isDark={isDark}
      backgroundColor={colors.card}
      height="88%"
      maxHeight="88%"
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View style={[styles.iconWrap, { backgroundColor: colors.tint + '20' }]}>
            <FontAwesome5 name="gift" size={18} color={colors.tint} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <Text style={[styles.title, { color: colors.text }]}>Recompensas</Text>
              <View style={[styles.xpPill, { backgroundColor: colors.tint + '22' }]}>
                <FontAwesome5 name="bolt" size={9} color={colors.tint} />
                <Text style={[styles.xpPillText, { color: colors.tint }]}>+1.000 XP para ambos</Text>
              </View>
            </View>
          </View>
        </View>
        <LiquidCloseButton
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          iconColor={colors.textSecondary}
          style={styles.closeBtn}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Cada amigo que se registre con tu enlace os suma 1.000 XP a los dos al instante y desbloquea estos temas inmersivos Liquid Glass.
        </Text>

        {/* Contador de Amigos Invitados */}
        <View
          style={[
            styles.referralCounterBox,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              borderWidth: isIOS ? 0 : 1,
            },
            getAppleSheetCardStyle(isDark, 20),
          ]}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.counterLabel}>Amigos invitados</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
              <Text style={[styles.counterValue, { color: colors.text }]}>{referralCount}</Text>
              {isAdmin ? (
                <Text style={[styles.adminTag, { color: colors.tint }]}>· Acceso Admin</Text>
              ) : nextReward ? (
                <Text style={[styles.nextTag, { color: colors.textSecondary }]}>
                  · Faltan {nextReward.requiredReferrals - referralCount} para {nextReward.name.replace('Tema ', '')}
                </Text>
              ) : (
                <Text style={[styles.nextTag, { color: '#10b981' }]}>· Todos desbloqueados</Text>
              )}
            </View>
          </View>
          <View style={[styles.trophyBox, { backgroundColor: '#f59e0b20' }]}>
            <FontAwesome5 name="trophy" size={20} color="#f59e0b" />
          </View>
        </View>

        {/* Lista de Recompensas con vistas previas reales */}
        <View style={styles.rewardsList}>
          {REWARDS.map(reward => {
            const isUnlocked = isAdmin || referralCount >= reward.requiredReferrals;
            const isGroupActive = reward.variants.some(v => v.id === theme);
            const remaining = Math.max(0, reward.requiredReferrals - referralCount);
            const progressPct = Math.min(100, Math.round((referralCount / reward.requiredReferrals) * 100));

            return (
              <View
                key={reward.id}
                style={[
                  styles.rewardCard,
                  {
                    backgroundColor: isGroupActive
                      ? colors.tint + '12'
                      : isDark
                        ? 'rgba(255, 255, 255, 0.04)'
                        : 'rgba(0, 0, 0, 0.03)',
                    borderColor: isGroupActive
                      ? colors.tint + '40'
                      : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.06)',
                    borderWidth: isIOS && !isGroupActive ? 0 : 1,
                  },
                  !isGroupActive && getAppleSheetCardStyle(isDark, 20),
                ]}
              >
                {/* Preview real despejado */}
                <View style={styles.previewBanner}>
                  <ExpoImage
                    source={reward.previewImage}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={200}
                  />
                  <LinearGradient
                    colors={['rgba(0,0,0,0.04)', 'rgba(0,0,0,0.3)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.previewLockPill}>
                    <FontAwesome5
                      name={isUnlocked ? 'lock-open' : 'lock'}
                      size={9}
                      color={isUnlocked ? '#34d399' : '#e2e8f0'}
                    />
                    <Text style={styles.previewLockText}>
                      {isUnlocked ? 'Desbloqueado' : `${referralCount}/${reward.requiredReferrals}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.rewardTitleRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.rewardTitle, { color: colors.text }]}>{reward.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                      <FontAwesome5 name={reward.iconName} size={10} color={isDark ? reward.textDark : reward.textLight} solid />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? reward.textDark : reward.textLight }} numberOfLines={1}>
                        {reward.previewCaption}
                      </Text>
                    </View>
                  </View>
                  {!isUnlocked && (
                    <Text style={[styles.remainingText, { color: colors.textSecondary }]}>
                      Faltan {remaining}
                    </Text>
                  )}
                </View>

                <Text style={[styles.rewardDesc, { color: colors.textSecondary }]}>
                  {reward.description}
                </Text>

                {!isUnlocked && (
                  <View
                    style={[
                      styles.progressTrack,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progressPct}%`, backgroundColor: reward.color },
                      ]}
                    />
                  </View>
                )}

                <View style={styles.buttonsRow}>
                  {isUnlocked
                    ? reward.variants.map(v => {
                        const isVariantActive = theme === v.id;
                        return (
                          <TouchableOpacity
                            key={v.id}
                            onPress={() => handleApplyTheme(v.id)}
                            disabled={isVariantActive}
                            activeOpacity={0.75}
                            style={[
                              styles.variantBtn,
                              {
                                backgroundColor: isVariantActive
                                  ? colors.tint
                                  : isDark
                                    ? 'rgba(255, 255, 255, 0.08)'
                                    : 'rgba(0, 0, 0, 0.06)',
                              },
                            ]}
                          >
                            {isVariantActive && (
                              <FontAwesome5 name="check" size={10} color={tintContrastText} />
                            )}
                            <Text
                              style={[
                                styles.variantBtnText,
                                { color: isVariantActive ? tintContrastText : colors.text },
                              ]}
                            >
                              {isVariantActive ? 'Tema activo' : v.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    : reward.variants.map(v => (
                        <TouchableOpacity
                          key={v.id}
                          onPress={() => handleTestTheme(v.id)}
                          disabled={isTestingTheme}
                          activeOpacity={0.75}
                          style={[
                            styles.variantBtn,
                            {
                              backgroundColor: reward.color + '24',
                              opacity: isTestingTheme ? 0.8 : 1,
                            },
                          ]}
                        >
                          <Text style={[styles.variantBtnText, { color: reward.color }]}>
                            {isTestingTheme ? `Probando ${themeTest?.timeLeft ?? 10}s` : v.testLabel}
                          </Text>
                        </TouchableOpacity>
                      ))}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer fijo con Compartir enlace */}
      <View
        style={[
          styles.footerBar,
          { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' },
        ]}
      >
        <TouchableOpacity
          onPress={() => void handleShareReferral()}
          activeOpacity={0.8}
          style={[styles.sharePrimaryBtn, { backgroundColor: colors.tint }]}
        >
          <FontAwesome5 name="share-alt" size={13} color={tintContrastText} />
          <Text style={[styles.sharePrimaryBtnText, { color: tintContrastText }]}>
            Compartir enlace (+1.000 XP)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => void handleCopyReferral()}
          activeOpacity={0.8}
          style={[
            styles.copySecondaryBtn,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
          ]}
        >
          <FontAwesome5 name="copy" size={13} color={colors.text} />
          <Text style={[styles.copySecondaryBtnText, { color: colors.text }]}>Copiar</Text>
        </TouchableOpacity>
      </View>
    </SwipeableBottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    letterSpacing: -0.3,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  xpPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    gap: 14,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
  },
  referralCounterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 20,
    borderCurve: 'continuous',
    gap: 10,
  },
  counterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  counterValue: {
    fontSize: 30,
    fontWeight: '800',
  },
  adminTag: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  nextTag: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  trophyBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardsList: {
    gap: 12,
  },
  rewardCard: {
    padding: 14,
    borderRadius: 20,
    borderCurve: 'continuous',
  },
  previewBanner: {
    height: 108,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  previewLockPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  previewLockText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  rewardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  rewardTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  remainingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rewardDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  progressTrack: {
    height: 5,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  buttonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantBtn: {
    flex: 1,
    minWidth: 105,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  variantBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sharePrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  sharePrimaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  copySecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  copySecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default RewardsModal;
