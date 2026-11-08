import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { PROGRESS_SECTIONS, ProgressSectionId } from '@/config/progressSections';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';

interface ProgressSectionListProps {
  onSelectSection: (sectionId: ProgressSectionId) => void;
}

export function ProgressSectionList({ onSelectSection }: ProgressSectionListProps) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

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
        <Text style={[styles.heading, { color: colors.text }]}>Tu Progreso</Text>
        <Text style={[styles.subheading, { color: colors.textSecondary }]}>
          Analítica, evolución y métricas de entrenamiento
        </Text>
      </View>

      {/* Grouped Liquid Glass Section List */}
      <View
        style={[
          styles.listCard,
          {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        {PROGRESS_SECTIONS.map((section, index) => {
          const Icon = section.icon;
          const isLast = index === PROGRESS_SECTIONS.length - 1;

          return (
            <React.Fragment key={section.id}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handlePress(section.id)}
                style={styles.itemRow}
              >
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                >
                  <Icon size={20} color={colors.tint} strokeWidth={2.2} />
                </View>

                <View style={styles.textWrap}>
                  <Text style={[styles.itemTitle, { color: colors.text }]}>
                    {section.label}
                  </Text>
                  <Text
                    style={[styles.itemDesc, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {section.description}
                  </Text>
                </View>

                <ChevronRight
                  size={18}
                  color={colors.textSecondary}
                  strokeWidth={2}
                />
              </TouchableOpacity>

              {!isLast && (
                <View
                  style={[
                    styles.divider,
                    {
                      backgroundColor: isDark
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
    marginBottom: 20,
    marginTop: 8,
  },
  heading: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 20,
  },
  listCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
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
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginLeft: 70,
  },
});
