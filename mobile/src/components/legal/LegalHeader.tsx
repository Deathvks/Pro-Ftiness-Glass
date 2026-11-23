import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { ChevronLeft, Shield, Scale, Building2, Cookie } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

export type LegalRoute = 'privacy' | 'terms' | 'legal-notice' | 'cookies';

interface LegalHeaderProps {
  currentRoute: LegalRoute;
  title: string;
  badge?: string;
}

export const LEGAL_TABS = [
  { id: 'privacy' as LegalRoute, label: 'Privacidad / RGPD', icon: Shield, route: '/privacy' },
  { id: 'terms' as LegalRoute, label: 'Términos', icon: Scale, route: '/terms' },
  { id: 'legal-notice' as LegalRoute, label: 'Aviso Legal', icon: Building2, route: '/legal-notice' },
  { id: 'cookies' as LegalRoute, label: 'Cookies', icon: Cookie, route: '/cookies' },
];

export default function LegalHeader({ currentRoute, title, badge = 'LEGAL' }: LegalHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const theme = colors;
  const currentStoreTheme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(currentStoreTheme);
  const contrastColor = getContrastTextColor(theme.tint);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login');
    }
  };

  const handleTabPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Barra superior flotante con Liquid Glass */}
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          style={[
            styles.backButton,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
          />
          <ChevronLeft color={theme.text} size={22} strokeWidth={2.5} />
          <Text style={[styles.backText, { color: theme.text }]}>Volver</Text>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                borderColor: theme.tint,
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: theme.tint }]}>{badge}</Text>
          </View>
          <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>

      {/* Selector de pestañas horizontales Liquid Glass */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {LEGAL_TABS.map(tab => {
            const isActive = tab.id === currentRoute;
            const Icon = tab.icon;

            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => handleTabPress(tab.route)}
                activeOpacity={0.75}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: isActive
                      ? theme.tint
                      : isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                    borderColor: isActive
                      ? theme.tint
                      : isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
              >
                {!isActive && (
                  <GlassView
                    glassEffectStyle="regular"
                    colorScheme={isDark ? 'dark' : 'light'}
                    style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                  />
                )}
                <Icon
                  size={15}
                  color={isActive ? contrastColor : theme.textSecondary}
                  strokeWidth={2.2}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? contrastColor : theme.textSecondary,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 50,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 44,
    gap: 4,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
  },
  titleContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  tabsWrapper: {
    marginHorizontal: -16,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 38,
  },
  tabLabel: {
    fontSize: 13,
  },
});
