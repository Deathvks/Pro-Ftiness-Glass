import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SwipeableSheetModal } from '@/components/ui/SwipeableBottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GraduationCap,
  Trophy,
  ShieldCheck,
  Flame,
  Zap,
  BadgeCheck,
  ChevronDown,
  X,
} from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastTextColor } from '@/utils/colorUtils';
import { getThemeBaseBackground } from '@/constants/theme';
import { SocialUserAvatar, type AvatarUser } from '@/components/social/SocialUserAvatar';

interface TrainerProfileModalProps {
  visible: boolean;
  onClose: () => void;
  trainer?: AvatarUser | null;
}

const STUDIES = [
  'Grado superior de acondicionamiento físico',
  'Grado universitario de CAFyD',
  'Máster de entrenamiento personal',
  'Máster de nutrición aplicada',
  'Certificación Nivel 1 en Biomecánica',
];

const SPECIALTIES = [
  'Rehabilitación y readaptación de lesiones y patologías',
  'Trabajo de rotaciones aplicado a rendimiento deportivo y salud',
  'Entrenamiento personalizado a tu día y vida diaria',
];

const HEADER_HEIGHT = 72;

export default function TrainerProfileModal({
  visible,
  onClose,
  trainer,
}: TrainerProfileModalProps) {
  const insets = useSafeAreaInsets();
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const surfaceColor = colors.background === 'transparent' ? getThemeBaseBackground(theme) : colors.background;
  const contrastText = getContrastTextColor(colors.tint);

  const [headerOpacity, setHeaderOpacity] = useState(0);

  if (!visible) return null;

  const handleClose = () => {
    setHeaderOpacity(0);
    onClose();
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const opacity = Math.min(1, Math.max(0, y) / 120);
    setHeaderOpacity(opacity);
  };

  return (
    <SwipeableSheetModal
      visible={visible}
      onClose={handleClose}
      backdropColor={isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.6)'}
      dragAreaHeight={HEADER_HEIGHT}
      sheetStyle={[
        styles.modalContainer,
        {
          backgroundColor: surfaceColor,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      {/* Keep the full-width drag area outside the ScrollView so it can receive downward swipes. */}
      <View style={styles.header}>
        <View
          pointerEvents="none"
          style={[
            styles.dragPill,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.25)' },
          ]}
        />
        {headerOpacity > 0.05 && (
          <View pointerEvents="none" style={[styles.stickyHeaderContent, { opacity: headerOpacity }]}>
            <SocialUserAvatar user={trainer} size={38} fallbackSource={require('@/assets/images/trainer-profile.jpg')} />
            <Text style={[styles.stickyTitle, { color: colors.text }]}>ENTRENADOR</Text>
          </View>
        )}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Cerrar perfil del entrenador"
          style={[
            styles.closeBtn,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
            },
          ]}
          onPress={handleClose}
          activeOpacity={0.8}
          hitSlop={8}
        >
          <X size={20} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollArea}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image Container */}
        <View style={styles.heroWrap}>
          <Image
            source={require('@/assets/images/trainer-profile.jpg')}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.45)', 'transparent']}
            style={styles.heroTopGrad}
          />
          <LinearGradient
            colors={['transparent', surfaceColor]}
            style={styles.heroBottomGrad}
          />
        </View>

        {/* Profile Header Info */}
        <View style={styles.profileMetaWrap}>
          {/* Scroll Hint */}
          <View style={styles.scrollHint}>
            <Text style={[styles.scrollHintText, { color: colors.textSecondary }]}>
              DESCUBRE MÁS
            </Text>
            <ChevronDown size={18} color={colors.textSecondary} />
          </View>

          {/* Title with verified badge */}
          <View style={styles.titleRow}>
            <Text style={[styles.mainTitle, { color: colors.text }]}>ENTRENADOR</Text>
            <View style={styles.verifiedIconWrap}>
              <ShieldCheck size={28} color={colors.tint} fill={colors.tint + '30'} />
            </View>
          </View>

          {/* Official preparer badge */}
          <View style={[styles.officialBadge, { backgroundColor: colors.tint }]}>
            <Flame size={18} color={contrastText} />
            <Text style={[styles.officialBadgeText, { color: contrastText }]}>
              PREPARADOR OFICIAL
            </Text>
          </View>
        </View>

        {/* Mis Estudios Section */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconCircle, { backgroundColor: colors.tint + '20' }]}>
              <GraduationCap size={24} color={colors.tint} />
            </View>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Mis Estudios</Text>
          </View>

          <View style={styles.cardsList}>
            {STUDIES.map((study, idx) => (
              <View
                key={idx}
                style={[
                  styles.cardItem,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
              >
                <View
                  style={[
                    styles.itemIconCircle,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                >
                  <Trophy size={18} color={colors.textSecondary} />
                </View>
                <Text style={[styles.studyText, { color: colors.text }]}>{study}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Especialidades Section */}
        <View style={[styles.sectionWrap, { marginTop: 28 }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconCircle, { backgroundColor: colors.tint + '20' }]}>
              <BadgeCheck size={24} color={colors.tint} />
            </View>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Especialidades</Text>
          </View>

          <View style={styles.cardsList}>
            {SPECIALTIES.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.specialtyCard,
                  {
                    backgroundColor: colors.tint + '0e',
                    borderColor: colors.tint + '30',
                  },
                ]}
              >
                <View style={[styles.specialtyAccentBar, { backgroundColor: colors.tint }]} />
                <Zap size={22} color={colors.tint} style={{ marginLeft: 12, marginRight: 8 }} />
                <Text style={[styles.specialtyText, { color: colors.text }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SwipeableSheetModal>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalContainer: {
    height: SCREEN_HEIGHT * 0.9,
    width: '100%',
    maxWidth: 580,
    alignSelf: 'center',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 24,
  },
  header: {
    height: HEADER_HEIGHT,
    flexShrink: 0,
    paddingHorizontal: 16,
  },
  dragPill: {
    alignSelf: 'center',
    marginTop: 10,
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  stickyHeaderContent: {
    height: 38,
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stickyTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  closeBtn: {
    position: 'absolute',
    top: 24,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroWrap: {
    position: 'relative',
    width: '100%',
    height: SCREEN_HEIGHT * 0.44,
    maxHeight: 380,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroTopGrad: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  heroBottomGrad: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  profileMetaWrap: {
    alignItems: 'center',
    marginTop: -30,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  scrollHint: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 12,
    gap: 2,
  },
  scrollHintText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  verifiedIconWrap: {
    marginLeft: 8,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  officialBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  sectionWrap: {
    paddingHorizontal: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    fontSize: 22,
    fontWeight: '900',
  },
  cardsList: {
    gap: 10,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  itemIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studyText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },
  specialtyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  specialtyAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  specialtyText: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    lineHeight: 19,
  },
});
