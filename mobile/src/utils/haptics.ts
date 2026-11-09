import { Platform } from 'react-native';
import * as ExpoHaptics from 'expo-haptics';
import { requireOptionalNativeModule } from 'expo';
import useAppStore from '@/store/useAppStore';

/**
 * Comprueba si la vibración háptica está activada en las preferencias del usuario.
 */
export const isHapticsEnabled = (): boolean => {
  try {
    return useAppStore.getState().hapticsEnabled !== false;
  } catch {
    return true;
  }
};

/**
 * Impacto táctil físico (Light, Medium, Heavy, Rigid, Soft).
 * Se omite automáticamente si el usuario ha desactivado la vibración en Apariencia.
 */
export const impactAsync = async (
  style: ExpoHaptics.ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle.Medium
): Promise<void> => {
  if (!isHapticsEnabled()) return;
  try {
    await ExpoHaptics.impactAsync(style);
  } catch (err) {
    // Silencioso en caso de dispositivos sin motor háptico
  }
};

/**
 * Feedback táctil de selección / clic suave.
 * En Android, selectionAsync nativo suele ser imperceptible según el fabricante;
 * por ello usamos ImpactFeedbackStyle.Light para garantizar un clic táctil nítido y real.
 */
export const selectionAsync = async (): Promise<void> => {
  if (!isHapticsEnabled()) return;
  try {
    if (Platform.OS === 'android') {
      await ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
    } else {
      await ExpoHaptics.selectionAsync();
    }
  } catch (err) {
    // Silencioso
  }
};

/**
 * Notificación táctil (Success, Warning, Error).
 */
export const notificationAsync = async (
  type: ExpoHaptics.NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType.Success
): Promise<void> => {
  if (!isHapticsEnabled()) return;
  try {
    await ExpoHaptics.notificationAsync(type);
  } catch (err) {
    // Silencioso
  }
};

/**
 * Tipos compatibles con frontend
 */
export const HapticType = {
  selection: 'selection',
  success: 'success',
  warning: 'warning',
  timer: 'timer',
} as const;

export type HapticTypeValue = (typeof HapticType)[keyof typeof HapticType];

export const triggerHaptic = async (type: HapticTypeValue = HapticType.selection): Promise<void> => {
  if (!isHapticsEnabled()) return;
  try {
    switch (type) {
      case HapticType.selection:
        await selectionAsync();
        break;
      case HapticType.success:
        await notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
        break;
      case HapticType.warning:
        await notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning);
        break;
      case HapticType.timer:
        await impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);
        break;
      default:
        await selectionAsync();
    }
  } catch {}
};

export const ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType;

/**
 * Interceptor global: engancha el módulo nativo de ExpoHaptics para que
 * CUALQUIER importación existente de 'expo-haptics' en toda la app respete
 * automáticamente la configuración global de hapticsEnabled.
 */
let isInterceptorInstalled = false;
export const installHapticsInterceptor = () => {
  if (isInterceptorInstalled) return;
  try {
    const NativeExpoHaptics = requireOptionalNativeModule('ExpoHaptics') as any;
    if (NativeExpoHaptics) {
      const origImpact = NativeExpoHaptics.impactAsync?.bind(NativeExpoHaptics);
      const origSelection = NativeExpoHaptics.selectionAsync?.bind(NativeExpoHaptics);
      const origNotification = NativeExpoHaptics.notificationAsync?.bind(NativeExpoHaptics);

      if (origImpact) {
        NativeExpoHaptics.impactAsync = async (...args: any[]) => {
          if (!isHapticsEnabled()) return;
          return origImpact(...args);
        };
      }

      if (origSelection) {
        NativeExpoHaptics.selectionAsync = async (...args: any[]) => {
          if (!isHapticsEnabled()) return;
          // En Android asegurar sensación perceptible
          if (Platform.OS === 'android' && origImpact) {
            return origImpact(ExpoHaptics.ImpactFeedbackStyle.Light);
          }
          return origSelection(...args);
        };
      }

      if (origNotification) {
        NativeExpoHaptics.notificationAsync = async (...args: any[]) => {
          if (!isHapticsEnabled()) return;
          return origNotification(...args);
        };
      }

      isInterceptorInstalled = true;
    }
  } catch (e) {
    console.warn('Haptics interceptor warning:', e);
  }
};

export default {
  impactAsync,
  selectionAsync,
  notificationAsync,
  triggerHaptic,
  isHapticsEnabled,
  installHapticsInterceptor,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
  HapticType,
};
