/* mobile/src/components/modals/PRListModal.tsx */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { Trophy, ChevronRight, X } from 'lucide-react-native';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import {
  SwipeableBottomSheet,
  getAppleSheetCardStyle,
} from '@/components/ui/SwipeableBottomSheet';

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
  const isIOS = Platform.OS === 'ios';

  return (
    <SwipeableBottomSheet
      scrollable
      visible={visible}
      onClose={onClose}
      isDark={isDark}
      backgroundColor={colors.card}
      maxHeight="85%"
    >
      <View style={styles.sheetBody}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={[styles.title, { color: colors.text }]}>
              Nuevos Récords ({records.length})
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Selecciona cuál quieres ver o compartir
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.closeBtn,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              },
            ]}
            onPress={onClose}
          >
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Lista de récords */}
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {records.map((record, index) => {
            const name = record.exercise_name || record.exerciseName || 'Ejercicio';
            const weight = record.weight_kg || record.weight || 0;
            const dateStr = record.date
              ? new Date(record.date).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                })
              : '';

            return (
              <TouchableOpacity
                key={record.id || index}
                style={[
                  styles.recordRow,
                  {
                    backgroundColor: colors.background === 'transparent' ? colors.card : colors.background,
                    borderColor: colors.border,
                    borderWidth: isIOS ? 0 : 1,
                  },
                  getAppleSheetCardStyle(isDark, 18),
                ]}
                onPress={() => onSelectRecord(record)}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <Trophy size={18} color="#eab308" />
                </View>

                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text
                    style={[styles.exerciseName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {name}
                  </Text>
                  <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                    {dateStr}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                  <Text style={[styles.weightText, { color: colors.tint }]}>
                    {weight} kg
                  </Text>
                </View>

                <ChevronRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </SwipeableBottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetBody: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: Platform.OS === 'ios' ? '700' : '900',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    maxHeight: 400,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
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
    fontSize: 15,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
    marginTop: 2,
  },
  weightText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
