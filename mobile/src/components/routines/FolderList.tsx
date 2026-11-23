/* mobile/src/components/routines/FolderList.tsx */
import React from 'react';
import { ScrollView, Text, StyleSheet, Platform } from 'react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { Folder, FolderOpen } from 'lucide-react-native';
import { GlassButton } from '@/components/ui/GlassButton';
import { getContrastTextColor } from '@/utils/routineHelpers';
import { getUnselectedControlColors } from '@/constants/theme';

interface FolderListProps {
  folders: string[];
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
}

export function FolderList({ folders, selectedFolder, onSelectFolder }: FolderListProps) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const controlColors = getUnselectedControlColors(theme);
  const accentColor = colors.tint;
  const isIOS = Platform.OS === 'ios';

  const allOptions = [
    { id: 'all', label: 'Todas' },
    ...folders.map(f => ({ id: f, label: f })),
    { id: 'uncategorized', label: 'Otros' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.container}
    >
      {allOptions.map((opt) => {
        const isActive = selectedFolder === opt.id;
        const isNamedFolder = opt.id !== 'all' && opt.id !== 'uncategorized';
        const activeForeground = isIOS ? accentColor : getContrastTextColor(accentColor);

        return (
          <GlassButton
            key={opt.id}
            onPress={() => onSelectFolder(opt.id)}
            theme={theme}
            noShadow={true}
            color={isActive ? (isIOS ? accentColor + '22' : accentColor) : controlColors.backgroundColor}
            style={[
              styles.tab,
              { borderColor: isActive ? (isIOS ? accentColor + '50' : accentColor) : controlColors.borderColor }
            ]}
          >
            {isNamedFolder && (
              isActive ? (
                <FolderOpen
                  size={14}
                  color={activeForeground}
                  style={{ marginRight: 6 }}
                />
              ) : (
                <Folder
                  size={14}
                  color={colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
              )
            )}
            <Text
              style={[
                styles.tabText,
                {
                  color: isActive ? activeForeground : colors.textSecondary,
                  fontWeight: isActive ? '700' : '500'
                }
              ]}
            >
              {opt.label}
            </Text>
          </GlassButton>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    marginHorizontal: -16,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    height: 42,
    borderRadius: 21,
    borderCurve: 'continuous',
  },
  tabText: {
    fontSize: 13.5,
  }
});
