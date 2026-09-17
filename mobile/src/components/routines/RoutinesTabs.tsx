import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';
import { BookCopy, Compass, Dumbbell, Zap } from 'lucide-react-native';

export type TabKey = 'myRoutines' | 'explore' | 'manualExercises' | 'quickCardio';

interface RoutinesTabsProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
}

export function RoutinesTabs({ activeTab, onChangeTab }: RoutinesTabsProps) {
  const theme = useAppStore(state => state.theme);
  const colors = Colors[theme as keyof typeof Colors] || Colors.oled;
  // TODO: Add dynamic accent color support if available in mobile store
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
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChangeTab(tab.key as TabKey)}
            style={[
              styles.tab,
              {
                backgroundColor: isActive ? accentColor + '20' : colors.card,
                borderColor: isActive ? accentColor : colors.border,
                borderWidth: 1,
              }
            ]}
          >
            <Icon size={16} color={isActive ? accentColor : colors.textSecondary} style={{ marginRight: 6 }} />
            <Text
              style={[
                styles.tabText,
                { color: isActive ? accentColor : colors.textSecondary, fontWeight: isActive ? '700' : '500' }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Quick Cardio Tab / Button */}
      <TouchableOpacity
        onPress={() => onChangeTab('quickCardio')}
        style={[
          styles.tab,
          {
            backgroundColor: activeTab === 'quickCardio' ? accentColor + '20' : colors.card,
            borderColor: activeTab === 'quickCardio' ? accentColor : colors.border,
            borderWidth: 1,
            marginLeft: 8,
          }
        ]}
      >
        <Zap size={16} color={activeTab === 'quickCardio' ? accentColor : colors.textSecondary} style={{ marginRight: 6 }} />
        <Text
          style={[
            styles.tabText,
            { color: activeTab === 'quickCardio' ? accentColor : colors.textSecondary, fontWeight: activeTab === 'quickCardio' ? '700' : '500' }
          ]}
        >
          Cardio Rápido
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
  }
});
