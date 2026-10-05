import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { BookCopy, Compass, Dumbbell, Zap } from 'lucide-react-native';
import { GlassButton } from '@/components/ui/GlassButton';
import { getContrastColor } from '@/utils/colorUtils';

export type TabKey = 'myRoutines' | 'explore' | 'manualExercises' | 'quickCardio';

interface RoutinesTabsProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
}

export function RoutinesTabs({ activeTab, onChangeTab }: RoutinesTabsProps) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const accentColor = colors.tint; 

  const tabs = [
    { key: 'myRoutines', label: 'Mis Rutinas', icon: BookCopy },
    { key: 'explore', label: 'Explorar', icon: Compass },
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
            onPress={() => onChangeTab(tab.key as TabKey)}
            theme={theme}
            color={isActive ? accentColor : undefined}
            style={[styles.tab, { borderColor: isActive ? accentColor : colors.border + '60' }]} >
            <Icon size={16} color={isActive ? getContrastColor(accentColor, theme) : colors.textSecondary} style={{ marginRight: 6 }} />
            <Text
              style={[
                styles.tabText,
                { color: isActive ? getContrastColor(accentColor, theme) : colors.textSecondary, fontWeight: isActive ? '700' : '500' }
              ]}
            >
              {tab.label}
            </Text>
          </GlassButton>
        );
      })}

      {/* Quick Cardio Tab / Button */}
      <GlassButton
        onPress={() => onChangeTab('quickCardio')}
        theme={theme}
        color={activeTab === 'quickCardio' ? accentColor : undefined}
        style={[styles.tab, { marginLeft: 8, borderColor: activeTab === 'quickCardio' ? accentColor : colors.border + '60' }]}>
        <Zap size={16} color={activeTab === 'quickCardio' ? getContrastColor(accentColor, theme) : colors.textSecondary} style={{ marginRight: 6 }} />
        <Text
          style={[
            styles.tabText,
            { color: activeTab === 'quickCardio' ? getContrastColor(accentColor, theme) : colors.textSecondary, fontWeight: activeTab === 'quickCardio' ? '700' : '500' }
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
