/* mobile/src/components/modals/ConfirmBottomSheet.tsx */
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Copy, Trash2 } from 'lucide-react-native';

import { SwipeableBottomSheet } from '@/components/ui/SwipeableBottomSheet';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getUnselectedControlColors } from '@/constants/theme';
import { getContrastTextColor } from '@/utils/colorUtils';

interface ConfirmBottomSheetProps {
  visible: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'accent' | 'danger';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/** Bottom-sheet confirmation prompt aligned with mobile modal styling. */
export function ConfirmBottomSheet({
  visible,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmVariant = 'accent',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmBottomSheetProps) {
  const colors = useAppColors();
  const theme = useAppStore((s: any) => s.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const unselected = getUnselectedControlColors(theme);

  const isDanger = confirmVariant === 'danger';
  const confirmBg = isDanger ? '#ef4444' : colors.tint;
  const confirmFg = isDanger ? '#ffffff' : getContrastTextColor(colors.tint);

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={isLoading ? () => {} : onCancel}
      dismissible={!isLoading}
      isDark={isDark}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDanger ? 'rgba(239, 68, 68, 0.14)' : `${colors.tint}22`,
              borderColor: isDanger ? 'rgba(239, 68, 68, 0.28)' : `${colors.tint}44`,
            },
          ]}
        >
          {isDanger ? (
            <Trash2 size={24} color="#ef4444" strokeWidth={2.1} />
          ) : (
            <Copy size={24} color={colors.tint} strokeWidth={2.1} />
          )}
        </View>

        {Boolean(title) && (
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        )}

        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>

        <View style={styles.actions}>
          <Pressable
            onPress={() => void onConfirm()}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.confirmBtn,
              {
                backgroundColor: confirmBg,
                opacity: isLoading ? 0.7 : pressed ? 0.88 : 1,
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={confirmFg} />
            ) : (
              <Text style={[styles.confirmBtnText, { color: confirmFg }]}>
                {confirmText}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={onCancel}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.cancelBtn,
              {
                backgroundColor: unselected.backgroundColor,
                borderColor: colors.border,
                opacity: isLoading ? 0.55 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
              {cancelText}
            </Text>
          </Pressable>
        </View>
      </View>
    </SwipeableBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 8,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14.5,
    fontWeight: '500',
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 22,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  confirmBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ConfirmBottomSheet;
