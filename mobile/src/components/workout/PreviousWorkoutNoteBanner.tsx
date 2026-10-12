/* mobile/src/components/workout/PreviousWorkoutNoteBanner.tsx */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StickyNote, Copy, X } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';

interface PreviousWorkoutNoteBannerProps {
  previousNote: {
    note: string;
    date: string;
    routineName?: string;
  };
  onDismiss: () => void;
  onCopyNote: (text: string) => void;
}

export const PreviousWorkoutNoteBanner: React.FC<PreviousWorkoutNoteBannerProps> = ({
  previousNote,
  onDismiss,
  onCopyNote,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const formattedDate = previousNote.date
    ? new Date(previousNote.date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
      })
    : '';

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
          borderColor: 'rgba(59, 130, 246, 0.3)',
        },
      ]}
    >
      <GlassView
        glassEffectStyle="regular"
        colorScheme={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.topRow}>
        <View style={styles.leftLabel}>
          <StickyNote size={15} color="#3b82f6" style={{ marginRight: 6 }} />
          <Text style={styles.bannerTag}>
            NOTA DE LA SESIÓN ANTERIOR {formattedDate ? `(${formattedDate})` : ''}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            try {
              Haptics.selectionAsync();
            } catch {}
            onDismiss();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.closeBtn}
        >
          <X size={15} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.noteContent, { color: colors.text }]}>{previousNote.note}</Text>

      <TouchableOpacity
        onPress={() => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch {}
          onCopyNote(previousNote.note);
        }}
        style={[
          styles.copyBtn,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
        activeOpacity={0.75}
      >
        <Copy size={13} color={colors.text} style={{ marginRight: 6 }} />
        <Text style={[styles.copyBtnText, { color: colors.text }]}>Copiar a notas de hoy</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  leftLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerTag: {
    fontSize: 10,
    fontWeight: '900',
    color: '#3b82f6',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 2,
  },
  noteContent: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 12,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
