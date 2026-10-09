/* mobile/src/components/routines/FolderList.tsx */
import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { Folder, FolderOpen } from 'lucide-react-native';
import { getContrastColor } from '@/utils/colorUtils';

interface FolderListProps {
  folders: string[];
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
}

export function FolderList({ folders, selectedFolder, onSelectFolder }: FolderListProps) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const options = [
    { id: 'all', label: 'Todas' },
    ...folders.map(f => ({ id: f, label: f })),
    { id: 'uncategorized', label: 'Otros' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map((opt) => {
        const isActive = selectedFolder === opt.id;
        const isNamedFolder = opt.id !== 'all' && opt.id !== 'uncategorized';
        
        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => onSelectFolder(opt.id)}
            activeOpacity={0.8}
            style={[
              styles.tab,
              {
                backgroundColor: isActive ? colors.tint : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'),
                borderColor: isActive ? colors.tint : colors.border,
                shadowColor: isActive ? colors.tint : 'transparent',
                shadowOpacity: isActive ? 0.3 : 0,
                shadowRadius: 8,
                elevation: isActive ? 2 : 0,
              }
            ]}
          >
            {isNamedFolder && (
              isActive ? (
                <FolderOpen 
                  size={15} 
                  color={getContrastColor(colors.tint, theme)} 
                  style={{ marginRight: 6 }} 
                />
              ) : (
                <Folder 
                  size={15} 
                  color={colors.textSecondary} 
                  style={{ marginRight: 6 }} 
                />
              )
            )}
            <Text
              style={[
                styles.tabText,
                { 
                  color: isActive ? getContrastColor(colors.tint, theme) : colors.textSecondary, 
                  fontWeight: isActive ? '800' : '600' 
                }
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
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
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  tabText: {
    fontSize: 13,
  }
});
