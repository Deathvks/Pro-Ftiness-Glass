import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  Share,
  useWindowDimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from 'expo-glass-effect';
import Svg, { Path } from 'react-native-svg';
import {
  Share2,
  ChevronRight,
  Instagram,
  Youtube,
  Send,
  Copy,
  ExternalLink,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getThemeBaseBackground } from '@/constants/theme';
import GlobalHeader from '@/components/GlobalHeader';
import ThemeBackground from '@/components/ThemeBackground';

// URLs Oficiales de Pro Fitness Glass
const SOCIAL_LINKS = {
  instagram: {
    title: 'Instagram',
    handle: '@pro_fitness_glass',
    webUrl: 'https://www.instagram.com/pro_fitness_glass/',
    appUrl: 'instagram://user?username=pro_fitness_glass',
    color: '#E1306C',
  },
  tiktok: {
    title: 'TikTok',
    handle: '@pro_fitness_glass',
    webUrl: 'https://www.tiktok.com/@pro_fitness_glass',
    appUrl: 'snssdk1233://user/profile/pro_fitness_glass',
    color: '#25F4EE',
  },
  youtube: {
    title: 'YouTube',
    handle: '@ProFitnessGlass',
    webUrl: 'https://www.youtube.com/@ProFitnessGlass',
    appUrl: 'vnd.youtube://www.youtube.com/@ProFitnessGlass',
    color: '#FF0000',
  },
};

// Icono TikTok fiel al SVG original del frontend
function TikTokIcon({ size = 20, color = '#25F4EE' }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </Svg>
  );
}

function GlassSurface({
  radius,
  isDark,
  borderColor,
  tintColor,
  tintOpacity = 0,
  style,
  children,
}: {
  radius: number;
  isDark: boolean;
  borderColor: string;
  tintColor?: string;
  tintOpacity?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const innerRadius = Math.max(0, radius - 1);
  return (
    <View style={[{ borderRadius: radius, borderWidth: 1, borderColor }, style]}>
      <GlassView
        glassEffectStyle="regular"
        colorScheme={isDark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, { borderRadius: innerRadius }]}
      />
      {tintColor ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: innerRadius, backgroundColor: tintColor, opacity: tintOpacity },
          ]}
        />
      ) : null}
      {children}
    </View>
  );
}

interface SocialItemProps {
  icon: any;
  title: string;
  subtitle?: string;
  onPress: () => void;
  onLongPress?: () => void;
  isDark: boolean;
  colors: any;
  brandColor?: string;
}

function SocialItem({
  icon: Icon,
  title,
  subtitle,
  onPress,
  onLongPress,
  isDark,
  colors,
  brandColor,
}: SocialItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={[
        styles.itemRow,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
        },
      ]}
    >
      <View
        style={[
          styles.itemIconBox,
          {
            backgroundColor: brandColor ? brandColor + '18' : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
          },
        ]}
      >
        <Icon size={20} color={brandColor || colors.tint} strokeWidth={2.2} />
      </View>

      <View style={styles.itemTextCol}>
        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.itemRightWrap}>
        <ExternalLink size={16} color={colors.textSecondary} style={{ opacity: 0.5, marginRight: 4 }} />
        <ChevronRight size={18} color={colors.textSecondary} style={{ opacity: 0.6 }} />
      </View>
    </TouchableOpacity>
  );
}

export default function SocialLinksScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const isMobile = windowWidth < 600;

  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const glassBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)';

  const handleOpenLink = async (appUrl: string, webUrl: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      try {
        await Linking.openURL(webUrl);
      } catch (err) {
        console.warn('Error opening social URL:', err);
      }
    }
  };

  const handleCopyHandle = async (handle: string, platform: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await Clipboard.setStringAsync(handle);
      useAppStore.getState().showToast?.(`Copiado ${handle} de ${platform}`);
    } catch {}
  };

  const handleShareApp = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Share.share({
        title: 'Pro Fitness Glass',
        message: '¡Entrena con Pro Fitness Glass! La experiencia de élite para tus entrenamientos y nutrición: https://profitnessglass.es',
        url: 'https://profitnessglass.es',
      });
    } catch (err) {
      console.warn('Error sharing app:', err);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background === 'transparent' ? getThemeBaseBackground(theme) : colors.background }}>
      <ThemeBackground />

      {/* Header fijo superior con botón de volver atrás */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }} pointerEvents="box-none">
        <GlobalHeader title="Nuestras Redes" scrollY={scrollY} showBackButton />
      </View>

      <Animated.ScrollView
        contentContainerStyle={{
          paddingHorizontal: isMobile ? 14 : Math.max(16, (windowWidth - 640) / 2),
          paddingTop: insets.top + 52,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      >
        {/* ================= TARJETA PRINCIPAL: NUESTRAS REDES ================= */}
        <GlassSurface
          radius={28}
          isDark={isDark}
          borderColor={glassBorder}
          style={[styles.card, { padding: isMobile ? 16 : 22 }]}
        >
          {/* Cabecera de Sección */}
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: colors.tint + '1A' }]}>
              <Share2 size={22} color={colors.tint} strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Nuestras Redes</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Síguenos en nuestras redes para rutinas exclusivas y novedades.
              </Text>
            </View>
          </View>

          {/* Lista de Redes Sociales */}
          <View style={styles.itemsList}>
            {/* Instagram */}
            <SocialItem
              icon={Instagram}
              title={SOCIAL_LINKS.instagram.title}
              subtitle={SOCIAL_LINKS.instagram.handle}
              brandColor={SOCIAL_LINKS.instagram.color}
              onPress={() => handleOpenLink(SOCIAL_LINKS.instagram.appUrl, SOCIAL_LINKS.instagram.webUrl)}
              onLongPress={() => handleCopyHandle(SOCIAL_LINKS.instagram.handle, 'Instagram')}
              isDark={isDark}
              colors={colors}
            />

            {/* TikTok */}
            <SocialItem
              icon={TikTokIcon}
              title={SOCIAL_LINKS.tiktok.title}
              subtitle={SOCIAL_LINKS.tiktok.handle}
              brandColor={isDark ? '#25F4EE' : '#00b4d8'}
              onPress={() => handleOpenLink(SOCIAL_LINKS.tiktok.appUrl, SOCIAL_LINKS.tiktok.webUrl)}
              onLongPress={() => handleCopyHandle(SOCIAL_LINKS.tiktok.handle, 'TikTok')}
              isDark={isDark}
              colors={colors}
            />

            {/* YouTube */}
            <SocialItem
              icon={Youtube}
              title={SOCIAL_LINKS.youtube.title}
              subtitle={SOCIAL_LINKS.youtube.handle}
              brandColor={SOCIAL_LINKS.youtube.color}
              onPress={() => handleOpenLink(SOCIAL_LINKS.youtube.appUrl, SOCIAL_LINKS.youtube.webUrl)}
              onLongPress={() => handleCopyHandle(SOCIAL_LINKS.youtube.handle, 'YouTube')}
              isDark={isDark}
              colors={colors}
            />
          </View>
        </GlassSurface>

        {/* ================= TARJETA SECUNDARIA: COMPARTIR LA COMUNIDAD ================= */}
        <GlassSurface
          radius={28}
          isDark={isDark}
          borderColor={glassBorder}
          style={[styles.card, { padding: isMobile ? 16 : 22, marginTop: 16 }]}
        >
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: '#10b9811A' }]}>
              <Send size={20} color="#10b981" strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Comunidad</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Comparte Pro Fitness Glass con tus compañeros de entrenamiento.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleShareApp}
            activeOpacity={0.7}
            style={[
              styles.shareActionBtn,
              {
                backgroundColor: colors.tint + '18',
                borderColor: colors.tint + '33',
              },
            ]}
          >
            <Send size={18} color={colors.tint} strokeWidth={2.2} />
            <Text style={[styles.shareActionBtnText, { color: colors.tint }]}>
              Compartir App Oficial
            </Text>
          </TouchableOpacity>
        </GlassSurface>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 16,
  },
  itemsList: {
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  itemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextCol: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  itemSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  itemRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 4,
  },
  shareActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
