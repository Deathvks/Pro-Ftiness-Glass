import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';
import { Play, MoreHorizontal, Globe, Users, Lock, Clock, Dumbbell } from 'lucide-react-native';

interface RoutineCardProps {
  routine: any;
  onPressStart: () => void;
  onPressOptions: () => void;
  isCompletedToday: boolean;
}

export function RoutineCard({ routine, onPressStart, onPressOptions, isCompletedToday }: RoutineCardProps) {
  const theme = useAppStore(state => state.theme);
  const colors = Colors[theme as keyof typeof Colors] || Colors.oled;
  const accentColor = colors.tint; 
  
  const exercises = routine.exercises || routine.RoutineExercises || [];
  const exercisesCount = exercises.length;
  // Simplistic time estimate: 5 mins per exercise
  const estimatedTime = exercisesCount * 5;

  const renderVisibilityIcon = () => {
    const size = 14;
    const color = colors.textSecondary;
    switch(routine.visibility) {
      case 'public': return <Globe size={size} color={color} />;
      case 'friends': return <Users size={size} color={color} />;
      case 'private':
      default: return <Lock size={size} color={color} />;
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {routine.folder && (
            <View style={[styles.folderTag, { backgroundColor: accentColor + '20' }]}>
              <Text style={[styles.folderText, { color: accentColor }]}>{routine.folder}</Text>
            </View>
          )}
          <Text style={[styles.title, { color: colors.text }]}>{routine.name}</Text>
          {routine.description && (
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
              {routine.description}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={onPressOptions} style={styles.optionsButton}>
          <MoreHorizontal size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Clock size={14} color={colors.textSecondary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>{estimatedTime} min</Text>
        </View>
        <View style={styles.statItem}>
          <Dumbbell size={14} color={colors.textSecondary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>{exercisesCount} ej</Text>
        </View>
        <View style={styles.statItem}>
          {renderVisibilityIcon()}
        </View>
      </View>

      {/* Simple preview of exercises */}
      {exercises.length > 0 && (
        <View style={[styles.previewContainer, { backgroundColor: colors.background }]}>
          {exercises.slice(0, 3).map((ex: any, idx: number) => (
            <Text key={idx} style={[styles.previewText, { color: colors.textSecondary }]} numberOfLines={1}>
              • {ex.exercise?.name || ex.name || 'Ejercicio'}
            </Text>
          ))}
          {exercises.length > 3 && (
            <Text style={[styles.previewText, { color: colors.textSecondary, fontStyle: 'italic' }]}>
              + {exercises.length - 3} más...
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity
        onPress={onPressStart}
        style={[
          styles.startButton,
          { 
            backgroundColor: isCompletedToday ? colors.success + '20' : accentColor,
            borderColor: isCompletedToday ? colors.success : accentColor,
          }
        ]}
      >
        {!isCompletedToday && <Play size={16} color="#fff" style={{ marginRight: 8 }} />}
        <Text style={[
          styles.startButtonText,
          { color: isCompletedToday ? colors.success : '#fff' }
        ]}>
          {isCompletedToday ? 'Completada Hoy' : 'Iniciar'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  folderTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  folderText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  optionsButton: {
    padding: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  previewContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  previewText: {
    fontSize: 13,
    marginBottom: 2,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
  }
});
