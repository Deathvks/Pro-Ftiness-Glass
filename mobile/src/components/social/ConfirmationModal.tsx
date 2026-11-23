import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';
import { AlertTriangle, Trash2, LogOut } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { ModalThemeBackground, getThemedModalBorderColor, getThemedModalSurfaceColor } from '@/components/ui/ModalThemeBackground';

interface ConfirmationModalProps {
  visible: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  visible,
  title = '¿Estás seguro?',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  return (
    <Modal visible={visible} transparent statusBarTranslucent navigationBarTranslucent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={[
          StyleSheet.absoluteFill,
          {
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.45)',
          },
        ]}
        onPress={onCancel}
      >
        <Pressable
          onPress={e => e.stopPropagation()}
          style={[
            styles.cardWrapper,
            {
              backgroundColor: getThemedModalSurfaceColor(theme),
              borderColor: getThemedModalBorderColor(theme),
              borderWidth: 1,
            },
          ]}
        >
          <ModalThemeBackground theme={theme} />
            <View style={[styles.card, { borderWidth: 0, backgroundColor: 'transparent' }]}>
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: isDestructive ? 'rgba(239, 68, 68, 0.15)' : colors.tint + '15',
                  borderColor: isDestructive ? 'rgba(239, 68, 68, 0.3)' : colors.tint + '30',
                },
              ]}
            >
              {isDestructive ? (
                <Trash2 size={28} color="#ef4444" />
              ) : (
                <AlertTriangle size={28} color={colors.tint} />
              )}
            </View>

            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={onConfirm}
                disabled={isLoading}
                activeOpacity={0.85}
                style={[
                  styles.confirmBtn,
                  {
                    borderColor: isDestructive ? '#ef4444' : colors.tint,
                    borderWidth: 1,
                    overflow: 'hidden',
                    backgroundColor: 'transparent',
                    opacity: isLoading ? 0.6 : 1,
                  },
                ]}
              >
                <GlassView
                  glassEffectStyle="regular"
                  colorScheme={isDark ? 'dark' : 'light'}
                  style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                />
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: isDestructive ? '#ef4444' : colors.tint,
                      opacity: isDark ? 0.35 : 0.25,
                      borderRadius: 20,
                    },
                  ]}
                />
                {isLoading ? (
                  <ActivityIndicator size="small" color={isDestructive ? '#ef4444' : colors.tint} />
                ) : (
                  <Text style={[styles.confirmText, { color: isDestructive ? '#ef4444' : colors.tint }]}>{confirmText}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onCancel}
                disabled={isLoading}
                activeOpacity={0.7}
                style={[
                  styles.cancelBtn,
                  {
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    borderRadius: 20,
                    overflow: 'hidden',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  },
                ]}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
  </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  card: {
    padding: 24,
    borderWidth: 1,
    borderRadius: 28,
    alignItems: 'center',
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  confirmBtn: {
    width: '100%',
    height: 48,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBtn: {
    width: '100%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
