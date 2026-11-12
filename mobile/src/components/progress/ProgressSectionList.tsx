import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { PROGRESS_SECTIONS, ProgressSectionId } from '@/config/progressSections';
import { useAppColors } from '@/hooks/useAppColors';
import { getAppleCardSurfaceStyle, shouldUseContentGlass } from '@/constants/theme';
import useAppStore from '@/store/useAppStore';

interface ProgressSectionListProps {
  onSelectSection: (sectionId: ProgressSectionId) => void;
}

const IOS_SECTION_COLORS: Record<string, string> = {
  summary: '#30D158',
  weight: '#0A84FF',
  volume: '#BF5AF2',
  records: '#FF9F0A',
  muscle: '#FF375F',
  exercises: '#5E5CE6',
  frequency: '#64D2FF',
};

export function ProgressSectionList({ onSelectSection }: ProgressSectionListProps) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isIOS = Platform.OS === 'ios';
  const useGlass = shouldUseContentGlass(theme);

  const handlePress = (id: ProgressSectionId) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onSelectSection(id);
  };

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        <Text style={[styles.subheading, { color: colors.textSecondary }]}>
          Analítica, evolución y métricas de entrenamiento
        </Text>
      </View>

      {/* Grouped Section List */}
      <View
        style={[
          styles.listCard,
          getAppleCardSurfaceStyle(theme, 24),
          !isIOS && {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        {useGlass && (
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        )}

        {PROGRESS_SECTIONS.map((section, index) => {
          const Icon = section.icon;
          const isLast = index === PROGRESS_SECTIONS.length - 1;
          const iosBadgeBg = IOS_SECTION_COLORS[section.id] || colors.tint;

          return (
            <React.Fragment key={section.id}>
              <TouchableOpacity
                activeOpacity={0.65}
                onPress={() => handlePress(section.id)}
                style={styles.itemRow}
              >
                <View
                  style={[
                    styles.iconBox,
                    isIOS
                      ? {
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          borderCurve: 'continuous',
                          backgroundColor: iosBadgeBg,
                        }
                      : {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.05)',
                        },
                  ]}
                >
                  <Icon
                    size={isIOS ? 19 : 20}
                    color={isIOS ? '#FFFFFF' : colors.tint}
                    strokeWidth={2.2}
                  />
                </View>

                <View style={styles.textWrap}>
                  <Text
                    style={[
                      styles.itemTitle,
                      {
                        color: colors.text,
                        fontSize: isIOS ? 17 : 16,
                        fontWeight: isIOS ? '600' : '700',
                        letterSpacing: isIOS ? -0.35 : -0.2,
                      },
                    ]}
                  >
                    {section.label}
                  </Text>
                  <Text
                    style={[
                      styles.itemDesc,
                      {
                        color: colors.textSecondary,
                        fontSize: isIOS ? 13 : 12,
                        fontWeight: isIOS ? '400' : '500',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {section.description}
                  </Text>
                </View>

                <ChevronRight
                  size={isIOS ? 17 : 18}
                  color={colors.textSecondary}
                  style={{ opacity: isIOS ? 0.4 : 0.7 }}
                  strokeWidth={2.2}
                />
              </TouchableOpacity>

              {!isLast && (
                <View
                  style={[
                    styles.divider,
                    {
                      height: isIOS ? StyleSheet.hairlineWidth : 1,
                      marginLeft: isIOS ? 64 : 70,
                      backgroundColor: isIOS
                        ? isDark
                          ? 'rgba(84, 84, 88, 0.45)'
                          : 'rgba(60, 60, 67, 0.16)'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.07)'
                        : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  heading: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  listCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textWrap: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  itemDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  divider: {
    height: 1,
    marginLeft: 70,
  },
});
