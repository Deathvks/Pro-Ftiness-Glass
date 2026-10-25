/* frontend/src/utils/timerSound.js */
import useAppStore from '../store/useAppStore';
import { triggerHaptic, HapticType } from './haptics';

// Web Audio API Context (Singleton para reusar y desbloquear)
let audioCtx = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

// Desbloquear AudioContext en el primer toque del usuario
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
}

/**
 * Emite un doble pitido suave, deportivo y limpio usando la Web Audio API.
 * Cero dependencias de archivos de audio externos (0 KB de peso, sin latencia).
 */
export const playRestTimerCompleteSound = () => {
  try {
    const isSoundEnabled = useAppStore.getState().restSoundEnabled ?? true;
    if (!isSoundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // --- Pulso 1: Tono medio (784 Hz - Sol5) ---
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(784, now);

    // Envolvente de volumen suave para evitar chasquidos (clicks)
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.24, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.13);

    // --- Pulso 2: Tono alto (1046.5 Hz - Do6) ---
    const t2 = now + 0.15;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, t2);

    gain2.gain.setValueAtTime(0.001, t2);
    gain2.gain.exponentialRampToValueAtTime(0.28, t2 + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.22);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t2);
    osc2.stop(t2 + 0.23);
  } catch (e) {
    console.warn('Fallo al reproducir sonido de fin de descanso:', e);
  }
};

/**
 * Notificación integral de fin de descanso:
 * 1. Doble pitido suave (Web Audio API)
 * 2. Vibración háptica enérgica en el bolsillo (navigator.vibrate)
 * 3. Notificación de sistema si la pestaña está en segundo plano (Web / PWA)
 */
export const notifyRestTimerComplete = () => {
  // 1. Sonido
  playRestTimerCompleteSound();

  // 2. Vibración
  triggerHaptic(HapticType.timer);

  // 3. Notificación Web si está en segundo plano
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    if (document.visibilityState === 'hidden') {
      try {
        const notif = new Notification('¡Descanso terminado! 💪', {
          body: 'Toca la siguiente serie. ¡A por todas!',
          icon: '/favicon-32x32.png',
          tag: 'rest-timer-finished',
          renotify: true,
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (_) {}
    }
  }
};
