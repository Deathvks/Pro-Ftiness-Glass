/* mobile/src/components/workout/PreviousWorkoutNoteBanner.tsx */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StickyNote, X, Copy, Check } from 'lucide-react-native';
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

  const [copied, setCopied] = useState(false);

  if (!previousNote || !previousNote.note) return null;

  const handleCopy = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    onCopyNote(previousNote.note);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

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
          backgroundColor: colors.tint + (isDark ? '1C' : '12'),
          borderColor: colors.tint + (isDark ? '4D' : '38'),
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Left StickyNote Badge */}
        <View style={[styles.iconBadge, { backgroundColor: colors.tint + '24', borderColor: colors.tint + '45' }]}>
          <StickyNote size={19} color={colors.tint} strokeWidth={2.4} />
        </View>

        <View style={styles.bodyCol}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.tagWrap}>
              <Text style={[styles.tagText, { color: colors.tint }]}>
                NOTA DE TU SESIÓN ANTERIOR
              </Text>
              {formattedDate ? (
                <View style={[styles.dateBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                  <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formattedDate}</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {}
                onDismiss();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
              ]}
            >
              <X size={15} color={colors.textSecondary} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          {/* Quote Note */}
          <View style={[styles.quoteBox, { borderLeftColor: colors.tint + '70' }]}>
            <Text style={[styles.quoteText, { color: colors.text }]}>
              "{previousNote.note}"
            </Text>
          </View>

          {/* Copy Button */}
          <TouchableOpacity
            onPress={handleCopy}
            style={[
              styles.copyPill,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.85)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
            activeOpacity={0.75}
          >
            {copied ? (
              <>
                <Check size={13} color="#22c55e" strokeWidth={3} style={{ marginRight: 5 }} />
                <Text style={[styles.copyPillText, { color: '#22c55e' }]}>Copiada a notas</Text>
              </>
            ) : (
              <>
                <Copy size={13} color={colors.tint} style={{ marginRight: 5 }} />
                <Text style={[styles.copyPillText, { color: colors.text }]}>Copiar a mis notas de hoy</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bodyCol: {
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  tagWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 2,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  dateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '700',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  quoteBox: {
    borderLeftWidth: 2.5,
    paddingLeft: 10,
    marginTop: 10,
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 13.5,
    lineHeight: 20,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1,
  },
  copyPillText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
});
