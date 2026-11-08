import React, { useState, useEffect } from 'react';
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
import { GlassView } from 'expo-glass-effect';
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

export default function ProgressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string }>();
  const colors = useAppColors();
  const theme = useAppStore((state: any) => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const getOrFetchAllExercises = useAppStore((state: any) => state.getOrFetchAllExercises);

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
      {/* Top Header - Authentic Apple Liquid Glass (no border lines) */}
      <View style={styles.headerBar}>
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

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
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <ChevronLeft size={20} color={colors.text} />
          <Text style={[styles.backBtnText, { color: colors.text }]}>
            {activeSection !== null ? 'Tu Progreso' : 'Atrás'}
          </Text>
        </TouchableOpacity>

        <Text
          style={[styles.screenTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {activeSection !== null ? activeSectionObj?.label : 'Tu Progreso'}
        </Text>
      </View>

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
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    overflow: 'hidden',
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
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
