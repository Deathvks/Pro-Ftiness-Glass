/* mobile/src/components/workout/WorkoutNotes.tsx */
import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { FileText } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';

interface WorkoutNotesProps {
  notes: string;
  setNotes: (value: string | ((prev: string) => string)) => void;
  hasWorkoutStarted: boolean;
  previousNote?: { note: string; date: string } | null;
}

export const WorkoutNotes: React.FC<WorkoutNotesProps> = ({
  notes,
  setNotes,
  hasWorkoutStarted,
  previousNote,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const handlePastePrevious = () => {
    if (!previousNote?.note) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    setNotes((prev: string) => (prev ? `${prev}\n${previousNote.note}` : previousNote.note));
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.85)',
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
        <View style={styles.titleWithIcon}>
          <View style={[styles.iconBadge, { backgroundColor: colors.tint + '18', borderColor: colors.tint + '35' }]}>
            <FileText size={20} color={colors.tint} strokeWidth={2.5} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Notas de la Sesión</Text>
        </View>

        {previousNote?.note && hasWorkoutStarted ? (
          <TouchableOpacity
            onPress={handlePastePrevious}
            style={[styles.pasteBtn, { backgroundColor: colors.tint + '15', borderColor: colors.tint + '30' }]}
            activeOpacity={0.75}
          >
            <Text style={[styles.pasteBtnText, { color: colors.tint }]}>📋 Pegar nota anterior</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <TextInput
        placeholder={
          hasWorkoutStarted
            ? '¿Cómo te sentiste hoy? ¿Algún récord o molestia?...'
            : 'Inicia el cronómetro para añadir notas...'
        }
        placeholderTextColor={colors.textSecondary + '70'}
        value={notes}
        onChangeText={(text) => setNotes(text)}
        multiline
        editable={hasWorkoutStarted}
        style={[
          styles.input,
          {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.03)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
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
    borderRadius: 32,
    borderWidth: 1,
    padding: 20,
    marginTop: 10,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
    zIndex: 2,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  pasteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  pasteBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  input: {
    minHeight: 100,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    textAlignVertical: 'top',
    zIndex: 2,
  },
});
