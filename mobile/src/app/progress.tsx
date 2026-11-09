import React, { useState, useEffect, useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import AnimatedScreen from '@/components/AnimatedScreen';
import GlobalHeader from '@/components/GlobalHeader';
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
    } else if (!params.section) {
      setActiveSection(null);
    }
  }, [params.section]);

  const handleSelectSection = (id: ProgressSectionId) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    router.push({ pathname: '/progress', params: { section: id } } as any);
  };

  const handleBack = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (params.section) {
      if (router.canGoBack()) {
        router.back();
      } else {
        setActiveSection(null);
      }
    } else if (activeSection !== null) {
      setActiveSection(null);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/hub' as any);
    }
  }, [params.section, activeSection, router]);

  useEffect(() => {
    if (activeSection === null || params.section) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setActiveSection(null);
      return true;
    });
    return () => sub.remove();
  }, [activeSection, params.section]);

  const activeSectionObj = PROGRESS_SECTIONS.find(s => s.id === activeSection);
  const headerTitle = activeSection !== null ? (activeSectionObj?.label || 'Tu Progreso') : 'Tu Progreso';

  return (
    <AnimatedScreen
      key={activeSection || 'main-list'}
      paddingHorizontal={0}
      paddingBottom={40}
      header={
        <GlobalHeader
          title={headerTitle}
          showBackButton={true}
          onBackPress={handleBack}
        />
      }
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
    </AnimatedScreen>
  );
}
