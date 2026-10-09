/* mobile/src/components/routines/RoutinesTabs.tsx */
import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { BookCopy, Compass, Dumbbell, Flame } from 'lucide-react-native';
import { GlassButton } from '@/components/ui/GlassButton';
import { getContrastTextColor } from '@/utils/routineHelpers';

export type TabKey = 'myRoutines' | 'explore' | 'manualExercises' | 'quickCardio';

interface RoutinesTabsProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  onQuickCardio?: () => void;
}

export function RoutinesTabs({ activeTab, onChangeTab, onQuickCardio }: RoutinesTabsProps) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const accentColor = colors.tint; 
  const userProfile = useAppStore(state => state.userProfile || (state as any).user);
  const isAdmin = userProfile?.role === 'admin';

  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'myRoutines', label: 'Mis Rutinas', icon: BookCopy },
    ...(isAdmin ? [{ key: 'explore' as TabKey, label: 'Explorar', icon: Compass }] : []),
    { key: 'manualExercises', label: 'Ejercicios Manuales', icon: Dumbbell },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const Icon = tab.icon;
        
        return (
          <GlassButton
            key={tab.key}
            onPress={() => onChangeTab(tab.key)}
            theme={theme}
            noShadow={true}
            color={isActive ? accentColor : undefined}
            style={[
              styles.tab, 
              { borderColor: isActive ? accentColor : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)') }
            ]}
          >
            <Icon 
              size={16} 
              color={isActive ? getContrastTextColor(accentColor) : colors.textSecondary} 
              style={{ marginRight: 6 }} 
            />
            <Text
              style={[
                styles.tabText,
                { 
                  color: isActive ? getContrastTextColor(accentColor) : colors.textSecondary, 
                  fontWeight: isActive ? '700' : '500' 
                }
              ]}
            >
              {tab.label}
            </Text>
          </GlassButton>
        );
      })}

      {/* Cardio Rápido (Flame icon) */}
      <GlassButton
        onPress={() => {
          if (onQuickCardio) onQuickCardio();
          else onChangeTab('quickCardio');
        }}
        theme={theme}
        noShadow={true}
        color={activeTab === 'quickCardio' ? accentColor : undefined}
        style={[
          styles.tab, 
          { borderColor: activeTab === 'quickCardio' ? accentColor : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)') }
        ]}
      >
        <Flame 
          size={16} 
          color={activeTab === 'quickCardio' ? getContrastTextColor(accentColor) : colors.textSecondary} 
          style={{ marginRight: 6 }} 
        />
        <Text
          style={[
            styles.tabText,
            { 
              color: activeTab === 'quickCardio' ? getContrastTextColor(accentColor) : colors.textSecondary, 
              fontWeight: activeTab === 'quickCardio' ? '700' : '500' 
            }
          ]}
        >
          Cardio Rápido
        </Text>
      </GlassButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    height: 40,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
  }
});
