import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  Share,
  Platform,
  useWindowDimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from 'expo-glass-effect';
import { FontAwesome5 } from '@expo/vector-icons';
import {
  Share2,
  ChevronRight,
  Send,
  ExternalLink,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getThemeBaseBackground, getAppleCardSurfaceStyle, shouldUseContentGlass } from '@/constants/theme';
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
    color: '#00B4D8',
  },
  youtube: {
    title: 'YouTube',
    handle: '@ProFitnessGlass',
    webUrl: 'https://www.youtube.com/@ProFitnessGlass',
    appUrl: 'vnd.youtube://www.youtube.com/@ProFitnessGlass',
    color: '#FF0000',
  },
};

// Iconos oficiales mediante FontAwesome5
function InstagramIcon({ size = 20, color }: { size?: number; color: string }) {
  return <FontAwesome5 name="instagram" size={size} color={color} brand />;
}

function TikTokIcon({ size = 19, color }: { size?: number; color: string }) {
  return <FontAwesome5 name="tiktok" size={size} color={color} brand />;
}

function YoutubeIcon({ size = 18, color }: { size?: number; color: string }) {
  return <FontAwesome5 name="youtube" size={size} color={color} brand />;
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
  const theme = useAppStore(state => state.theme) || 'oled';
  const isIOS = Platform.OS === 'ios';
  const useGlass = shouldUseContentGlass(theme);
  const innerRadius = Math.max(0, (isIOS ? 20 : radius) - 1);

  return (
    <View
      style={[
        getAppleCardSurfaceStyle(theme, radius),
        !isIOS && { borderWidth: 1, borderColor },
        style,
      ]}
    >
      {useGlass && (
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: innerRadius }]}
        />
      )}
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
  isLast?: boolean;
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
  isLast = false,
}: SocialItemProps) {
  const isIOS = Platform.OS === 'ios';
  const badgeColor = brandColor || colors.tint;

  return (
    <View>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.65}
        style={[
          styles.itemRow,
          isIOS
            ? {
                backgroundColor: 'transparent',
                borderWidth: 0,
                borderRadius: 0,
                paddingVertical: 13,
                paddingHorizontal: 16,
              }
            : {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              },
        ]}
      >
        <View
          style={[
            styles.itemIconBox,
            isIOS
              ? {
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  borderCurve: 'continuous',
                  backgroundColor: badgeColor,
                }
              : {
                  backgroundColor: brandColor ? brandColor + '18' : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                },
          ]}
        >
          {Icon ? <Icon size={isIOS ? 18 : 20} color={isIOS ? '#FFFFFF' : badgeColor} strokeWidth={2.2} /> : null}
        </View>

        <View style={styles.itemTextCol}>
          <Text
            style={[
              styles.itemTitle,
              {
                color: colors.text,
                fontSize: isIOS ? 16 : 14,
                fontWeight: isIOS ? '600' : '700',
                letterSpacing: isIOS ? -0.3 : -0.2,
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.itemSubtitle,
                {
                  color: colors.textSecondary,
                  fontSize: isIOS ? 13 : 11,
                  fontWeight: isIOS ? '400' : '500',
                },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.itemRightWrap}>
          {!isIOS && <ExternalLink size={16} color={colors.textSecondary} style={{ opacity: 0.5, marginRight: 4 }} />}
          <ChevronRight size={isIOS ? 17 : 18} color={colors.textSecondary} style={{ opacity: isIOS ? 0.4 : 0.6 }} />
        </View>
      </TouchableOpacity>

      {isIOS && !isLast && (
        <View
          style={{
            height: StyleSheet.hairlineWidth,
            marginLeft: 62,
            backgroundColor: isDark ? 'rgba(84, 84, 88, 0.45)' : 'rgba(60, 60, 67, 0.16)',
          }}
        />
      )}
    </View>
  );
}

export default function SocialLinksScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const isMobile = windowWidth < 600;
  const isIOS = Platform.OS === 'ios';

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
          paddingHorizontal: isMobile ? 16 : Math.max(16, (windowWidth - 640) / 2),
          paddingTop: insets.top + 72,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      >
        {/* ================= TARJETA PRINCIPAL: NUESTRAS REDES ================= */}
        {isIOS && (
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              marginLeft: 16,
              marginBottom: 8,
              marginTop: 6,
            }}
          >
            Canales Oficiales
          </Text>
        )}

        <GlassSurface
          radius={28}
          isDark={isDark}
          borderColor={glassBorder}
          style={[styles.card, { padding: isIOS ? 0 : isMobile ? 16 : 22 }]}
        >
          {/* Cabecera de Sección (Android / Web) */}
          {!isIOS && (
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
          )}

          {/* Lista de Redes Sociales */}
          <View style={[styles.itemsList, isIOS && { gap: 0 }]}>
            {/* Instagram */}
            <SocialItem
              icon={InstagramIcon}
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
              brandColor={isIOS ? '#00B4D8' : isDark ? '#25F4EE' : '#00b4d8'}
              onPress={() => handleOpenLink(SOCIAL_LINKS.tiktok.appUrl, SOCIAL_LINKS.tiktok.webUrl)}
              onLongPress={() => handleCopyHandle(SOCIAL_LINKS.tiktok.handle, 'TikTok')}
              isDark={isDark}
              colors={colors}
            />

            {/* YouTube */}
            <SocialItem
              icon={YoutubeIcon}
              title={SOCIAL_LINKS.youtube.title}
              subtitle={SOCIAL_LINKS.youtube.handle}
              brandColor={SOCIAL_LINKS.youtube.color}
              onPress={() => handleOpenLink(SOCIAL_LINKS.youtube.appUrl, SOCIAL_LINKS.youtube.webUrl)}
              onLongPress={() => handleCopyHandle(SOCIAL_LINKS.youtube.handle, 'YouTube')}
              isDark={isDark}
              colors={colors}
              isLast
            />
          </View>
        </GlassSurface>

        {/* ================= TARJETA SECUNDARIA: COMPARTIR LA COMUNIDAD ================= */}
        {isIOS && (
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              marginLeft: 16,
              marginBottom: 8,
              marginTop: 24,
            }}
          >
            Comunidad
          </Text>
        )}

        <GlassSurface
          radius={28}
          isDark={isDark}
          borderColor={glassBorder}
          style={[styles.card, { padding: isIOS ? 16 : isMobile ? 16 : 22, marginTop: isIOS ? 0 : 16 }]}
        >
          <View style={[styles.sectionTitleRow, isIOS && { marginBottom: 14 }]}>
            <View
              style={[
                styles.sectionIconBox,
                isIOS
                  ? {
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      borderCurve: 'continuous',
                      backgroundColor: '#30D158',
                    }
                  : { backgroundColor: '#10b9811A' },
              ]}
            >
              <Send size={isIOS ? 18 : 20} color={isIOS ? '#FFFFFF' : '#10b981'} strokeWidth={2.3} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.text,
                    fontSize: isIOS ? 16 : 18,
                    fontWeight: isIOS ? '600' : '800',
                  },
                ]}
              >
                Comunidad Pro Fitness Glass
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Comparte la app oficial con tus compañeros de entrenamiento.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleShareApp}
            activeOpacity={0.7}
            style={[
              styles.shareActionBtn,
              isIOS
                ? {
                    backgroundColor: colors.tint,
                    borderWidth: 0,
                    borderRadius: 14,
                    borderCurve: 'continuous',
                    paddingVertical: 13,
                  }
                : {
                    backgroundColor: colors.tint + '18',
                    borderColor: colors.tint + '33',
                  },
            ]}
          >
            <Send size={17} color={isIOS ? '#FFFFFF' : colors.tint} strokeWidth={2.2} />
            <Text style={[styles.shareActionBtnText, { color: isIOS ? '#FFFFFF' : colors.tint }]}>
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
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
