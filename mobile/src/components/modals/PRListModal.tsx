/* mobile/src/components/modals/PRListModal.tsx */
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Trophy, ChevronRight, X } from 'lucide-react-native';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';

interface PRListModalProps {
  visible: boolean;
  onClose: () => void;
  records: any[];
  onSelectRecord: (record: any) => void;
}

export const PRListModal: React.FC<PRListModalProps> = ({
  visible,
  onClose,
  records,
  onSelectRecord,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        
        <View style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Nuevos Récords ({records.length})</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Selecciona cuál quieres ver o compartir</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Lista de récords */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {records.map((record, index) => {
              const name = record.exercise_name || record.exerciseName || 'Ejercicio';
              const weight = record.weight_kg || record.weight || 0;
              const dateStr = record.date 
                ? new Date(record.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                : '';

              return (
                <TouchableOpacity
                  key={record.id || index}
                  style={[styles.recordRow, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => onSelectRecord(record)}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconBox}>
                    <Trophy size={18} color="#eab308" />
                  </View>

                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={1}>{name}</Text>
                    <Text style={[styles.dateText, { color: colors.textSecondary }]}>{dateStr}</Text>
                  </View>

                  <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                    <Text style={[styles.weightText, { color: colors.tint }]}>{weight} kg</Text>
                  </View>

                  <ChevronRight size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    borderRadius: 32,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    maxHeight: 340,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '800',
  },
  dateText: {
    fontSize: 11,
    marginTop: 2,
  },
  weightText: {
    fontSize: 16,
    fontWeight: '900',
  },
});
