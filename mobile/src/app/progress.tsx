import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { PROGRESS_SECTIONS, ProgressSectionId } from '@/config/progressSections';
import { ProgressSectionList } from '@/components/progress/ProgressSectionList';
import { MuscleHeatmapView } from '@/components/progress/MuscleHeatmapView';
import { ExerciseProgressionView } from '@/components/progress/ExerciseProgressionView';
import { NutritionProgressView } from '@/components/progress/NutritionProgressView';
import { RecordsProgressView } from '@/components/progress/RecordsProgressView';
import { BodyWeightProgressView } from '@/components/progress/BodyWeightProgressView';
import { MeasurementsProgressView } from '@/components/progress/MeasurementsProgressView';
import { CalendarProgressView } from '@/components/progress/CalendarProgressView';
import { getContrastColor } from '@/utils/colorUtils';

export default function ProgressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string }>();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentText = getContrastColor(colors.tint, theme);

  const getOrFetchAllExercises = useAppStore(state => state.getOrFetchAllExercises);

  // Validate initial section from query param
  const initialSection = (
    params.section &&
    PROGRESS_SECTIONS.some(s => s.id === params.section)
      ? params.section
      : null
  ) as ProgressSectionId | null;

  const [activeSection, setActiveSection] = useState<ProgressSectionId | null>(
    initialSection
  );

  const tabsScrollRef = useRef<any>(null);

  useEffect(() => {
    if (getOrFetchAllExercises) {
      getOrFetchAllExercises();
    }
  }, [getOrFetchAllExercises]);

  useEffect(() => {
    if (params.section && PROGRESS_SECTIONS.some(s => s.id === params.section)) {
      setActiveSection(params.section as ProgressSectionId);
    }
  }, [params.section]);

  const handleSelectSection = (id: ProgressSectionId) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setActiveSection(id);
  };

  const handleBack = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (activeSection !== null) {
      setActiveSection(null);
    } else {
      router.back();
    }
  };

  const activeSectionObj = PROGRESS_SECTIONS.find(s => s.id === activeSection);

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {/* Top Header */}
      <View
        style={[
          styles.headerBar,
          {
            borderBottomColor: isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          style={[
            styles.backBtn,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.05)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          <ChevronLeft size={20} color={colors.text} />
          <Text style={[styles.backBtnText, { color: colors.text }]}>
            {activeSection !== null ? 'Tu Progreso' : 'Atrás'}
          </Text>
        </TouchableOpacity>

        {activeSection !== null && (
          <Text
            style={[styles.screenTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {activeSectionObj?.label}
          </Text>
        )}
      </View>

      {/* Horizontal Pills (only when a section is active) */}
      {activeSection !== null && (
        <View style={styles.pillsContainer}>
          <ScrollView
            ref={tabsScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsContent}
          >
            {PROGRESS_SECTIONS.map(s => {
              const isActive = activeSection === s.id;
              const Icon = s.icon;

              return (
                <TouchableOpacity
                  key={s.id}
                  activeOpacity={0.8}
                  onPress={() => handleSelectSection(s.id)}
                  style={[
                    styles.pillBtn,
                    {
                      backgroundColor: isActive
                        ? colors.tint
                        : isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(0, 0, 0, 0.04)',
                      borderColor: isActive
                        ? colors.tint
                        : isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                >
                  <Icon
                    size={14}
                    color={isActive ? accentText : colors.textSecondary}
                    strokeWidth={2.2}
                  />
                  <Text
                    style={[
                      styles.pillText,
                      {
                        color: isActive ? accentText : colors.textSecondary,
                        fontWeight: isActive ? '800' : '600',
                      },
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Main Content Area */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeSection === null && (
          <ProgressSectionList onSelectSection={handleSelectSection} />
        )}

        {activeSection === 'heatmap' && <MuscleHeatmapView />}
        {activeSection === 'exercise' && <ExerciseProgressionView />}
        {activeSection === 'nutrition' && <NutritionProgressView />}
        {activeSection === 'records' && <RecordsProgressView />}
        {activeSection === 'bodyWeight' && <BodyWeightProgressView />}
        {activeSection === 'measurements' && <MeasurementsProgressView />}
        {activeSection === 'calendar' && <CalendarProgressView />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    flex: 1,
  },
  pillsContainer: {
    paddingVertical: 8,
  },
  pillsContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
