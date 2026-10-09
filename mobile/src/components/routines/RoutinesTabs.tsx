/* mobile/src/components/routines/RoutinesTabs.tsx */
import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { BookCopy, Compass, Dumbbell, Flame } from 'lucide-react-native';
import { getContrastColor } from '@/utils/colorUtils';

export type TabKey = 'myRoutines' | 'explore' | 'manualExercises' | 'quickCardio';

interface RoutinesTabsProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  onQuickCardio?: () => void;
}

export function RoutinesTabs({ activeTab, onChangeTab, onQuickCardio }: RoutinesTabsProps) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme);
  const userProfile = useAppStore(state => state.userProfile || (state as any).user);
  const isAdmin = userProfile?.role === 'admin';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const tabs: { key: TabKey; label: string; icon: any; adminOnly?: boolean }[] = [
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
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChangeTab(tab.key)}
            activeOpacity={0.8}
            style={[
              styles.tab,
              {
                backgroundColor: isActive ? colors.tint : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'),
                borderColor: isActive ? colors.tint : colors.border,
                shadowColor: isActive ? colors.tint : 'transparent',
                shadowOpacity: isActive ? 0.3 : 0,
                shadowRadius: 8,
                elevation: isActive ? 3 : 0,
              }
            ]}
          >
            <Icon 
              size={18} 
              color={isActive ? getContrastColor(colors.tint, theme) : colors.textSecondary} 
              style={{ marginRight: 8 }} 
            />
            <Text
              style={[
                styles.tabText,
                { 
                  color: isActive ? getContrastColor(colors.tint, theme) : colors.textSecondary, 
                  fontWeight: isActive ? '800' : '600' 
                }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Cardio Rápido (Icono Flame idéntico al frontend) */}
      <TouchableOpacity
        onPress={() => {
          if (onQuickCardio) {
            onQuickCardio();
          } else {
            onChangeTab('quickCardio');
          }
        }}
        activeOpacity={0.8}
        style={[
          styles.tab,
          {
            backgroundColor: activeTab === 'quickCardio' ? colors.tint : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'),
            borderColor: activeTab === 'quickCardio' ? colors.tint : colors.border,
          }
        ]}
      >
        <Flame 
          size={18} 
          color={activeTab === 'quickCardio' ? getContrastColor(colors.tint, theme) : colors.textSecondary} 
          style={{ marginRight: 8 }} 
        />
        <Text
          style={[
            styles.tabText,
            { 
              color: activeTab === 'quickCardio' ? getContrastColor(colors.tint, theme) : colors.textSecondary, 
              fontWeight: activeTab === 'quickCardio' ? '800' : '600' 
            }
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
    paddingHorizontal: 2,
    paddingVertical: 4,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    height: 42,
    borderRadius: 22,
    borderWidth: 1,
    marginRight: 8,
  },
  tabText: {
    fontSize: 13,
  }
});
