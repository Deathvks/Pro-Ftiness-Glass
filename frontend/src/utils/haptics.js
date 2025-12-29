/* frontend/src/utils/haptics.js */
import useAppStore from '../store/useAppStore';

/**
 * Tipos de feedback háptico disponibles
 */
export const HapticType = {
    selection: 'selection', // Click suave (botones, toggles)
    success: 'success',     // Operación completada (guardar, marcar set)
    warning: 'warning',     // Error o advertencia
    timer: 'timer',         // Fin del cronómetro (patrón largo)
};

/**
 * Dispara una vibración en el dispositivo si es compatible.
 * Funciona en navegadores Android y App Nativa (Android).
 * En iOS Web no hace nada (limitación de Apple).
 * @param {string} type - Tipo de vibración (usar HapticType)
 */
export const triggerHaptic = (type = HapticType.selection) => {
    // 1. Verificamos si la vibración está activada en los ajustes
    // Usamos getState() para acceder al valor actual sin usar hooks (ya que esta es una función JS pura)
    // Usamos '?? true' para que por defecto esté activada si la propiedad no existe todavía.
    const isHapticsEnabled = useAppStore.getState().hapticsEnabled ?? true;

    if (!isHapticsEnabled) return;

    // 2. Verificamos si el navegador soporta vibración
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;

    try {
        switch (type) {
            case HapticType.selection:
                // Vibración muy corta y sutil (15ms)
                navigator.vibrate(15);
                break;

            case HapticType.success:
                // Doble pulso corto (50ms vibrar, 50ms pausa, 50ms vibrar)
                navigator.vibrate([50, 50, 50]);
                break;

            case HapticType.warning:
                // Vibración media (200ms)
                navigator.vibrate(200);
                break;

            case HapticType.timer:
                // Patrón largo: 500ms vibrar, 300ms pausa, repetido 3 veces
                navigator.vibrate([500, 300, 500, 300, 500]);
                break;

            default:
                navigator.vibrate(15);
        }
    } catch (e) {
        // Silenciosamente fallar si hay error (no molestar al usuario)
        console.warn('Haptic feedback failed', e);
    }
};