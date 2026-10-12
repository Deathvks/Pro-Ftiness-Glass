/* mobile/src/components/workout/WorkoutNotes.tsx */
import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { FileText } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';

interface WorkoutNotesProps {
  notes: string;
  setNotes: (text: string) => void;
  hasWorkoutStarted: boolean;
}

export const WorkoutNotes: React.FC<WorkoutNotesProps> = ({
  notes,
  setNotes,
  hasWorkoutStarted,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.8)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        },
      ]}
    >
      <GlassView
        glassEffectStyle="regular"
        colorScheme={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.headerRow}>
        <FileText size={16} color={colors.tint} style={{ marginRight: 8 }} />
        <Text style={[styles.title, { color: colors.text }]}>Notas del Entrenamiento</Text>
      </View>

      <TextInput
        placeholder="¿Cómo te has sentido hoy? Anota sensaciones, fatiga o dolores..."
        placeholderTextColor={colors.textSecondary + '70'}
        value={notes}
        onChangeText={setNotes}
        multiline
        editable={hasWorkoutStarted}
        style={[
          styles.input,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
            color: colors.text,
            opacity: hasWorkoutStarted ? 1 : 0.5,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  input: {
    minHeight: 80,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
});
