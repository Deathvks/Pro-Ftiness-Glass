import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { Folder } from 'lucide-react-native';

interface FolderListProps {
  folders: string[];
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
}

export function FolderList({ folders, selectedFolder, onSelectFolder }: FolderListProps) {
  const colors = useAppColors();
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
