import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { Folder } from 'lucide-react-native';
import { GlassButton } from '@/components/ui/GlassButton';
import { getContrastColor } from '@/utils/colorUtils';

interface FolderListProps {
  folders: string[];
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
}

export function FolderList({ folders, selectedFolder, onSelectFolder }: FolderListProps) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const accentColor = colors.tint; 

  const allOptions = ['Todas', ...folders, 'Sin Carpeta'];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {allOptions.map((folder, index) => {
        const isActive = selectedFolder === folder;
        
        return (
          <GlassButton
            key={index}
            onPress={() => onSelectFolder(folder)}
            theme={theme}
            noShadow={true}
            color={isActive ? accentColor : undefined}
            style={[styles.tab, { borderColor: isActive ? accentColor : colors.border + '60' }]} >
            {folder !== 'Todas' && folder !== 'Sin Carpeta' && (
              <Folder size={14} color={isActive ? getContrastColor(accentColor, theme) : colors.textSecondary} style={{ marginRight: 6 }} />
            )}
            <Text
              style={[
                styles.tabText,
                { color: isActive ? getContrastColor(accentColor, theme) : colors.textSecondary, fontWeight: isActive ? '600' : '500' }
              ]}
            >
              {folder}
            </Text>
          </GlassButton>
        );
      })}
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
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 16,
    marginRight: 8,
  },
  tabText: {
    fontSize: 13,
  }
});
