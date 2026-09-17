import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';
import { Folder } from 'lucide-react-native';

interface FolderListProps {
  folders: string[];
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
}

export function FolderList({ folders, selectedFolder, onSelectFolder }: FolderListProps) {
  const theme = useAppStore(state => state.theme);
  const colors = Colors[theme as keyof typeof Colors] || Colors.oled;
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
          <TouchableOpacity
            key={index}
            onPress={() => onSelectFolder(folder)}
            style={[
              styles.tab,
              {
                backgroundColor: isActive ? accentColor + '20' : colors.card,
                borderColor: isActive ? accentColor : colors.border,
                borderWidth: 1,
              }
            ]}
          >
            {folder !== 'Todas' && folder !== 'Sin Carpeta' && (
              <Folder size={14} color={isActive ? accentColor : colors.textSecondary} style={{ marginRight: 6 }} />
            )}
            <Text
              style={[
                styles.tabText,
                { color: isActive ? accentColor : colors.textSecondary, fontWeight: isActive ? '600' : '500' }
              ]}
            >
              {folder}
            </Text>
          </TouchableOpacity>
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
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  tabText: {
    fontSize: 13,
  }
});
