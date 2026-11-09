import { CARDIO_ACTIVITIES, type CardioActivity } from '@/data/cardioActivities';
import useAppStore from '@/store/useAppStore';
import type { QueuedRequest } from '@/store/syncSlice';
import apiClient from '@/services/apiClient';

export type CardioPoint = [latitude: number, longitude: number];

export interface CardioSession {
  activityId: string;
  elapsedMs: number;
  startedAt: number | null;
  path: CardioPoint[];
  distance: number;
}

export function getCardioActivity(id?: string) {
  return CARDIO_ACTIVITIES.find(activity => activity.id === id);
}

type WeightEntry = { log_date: string; weight_kg: number | string };

export function getCardioWeight(log: WeightEntry[] | undefined, weight: unknown) {
  const latest = log?.reduce<WeightEntry | undefined>((current, entry) =>
    !current || new Date(entry.log_date).getTime() > new Date(current.log_date).getTime() ? entry : current,
  undefined);
  const measured = Number(latest?.weight_kg ?? weight);
  return Number.isFinite(measured) && measured > 0 ? measured : 75;
}

export function estimateCardioCalories(mets: number, weight: number, seconds: number) {
  return Math.round(mets * weight * seconds / 3600);
}

export function cardioDistance(from: CardioPoint, to: CardioPoint) {
  const radians = Math.PI / 180;
  const a = Math.sin((to[0] - from[0]) * radians / 2) ** 2 +
    Math.cos(from[0] * radians) * Math.cos(to[0] * radians) * Math.sin((to[1] - from[1]) * radians / 2) ** 2;
  return 12_742_000 * Math.asin(Math.sqrt(Math.min(1, a)));
}

export function formatCardioDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
}

export function formatCardioTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = String(seconds % 60).padStart(2, '0');
  if (minutes < 60) return `${minutes}:${remainder}`;
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${remainder}`;
}

export function formatCardioPace(seconds: number, distance: number) {
  const pace = distance > 0 ? Math.round(seconds * 1000 / distance) : 0;
  return `${Math.floor(pace / 60)}:${String(pace % 60).padStart(2, '0')} /km`;
}

export function cardioElapsedMs(session: CardioSession, now: number) {
  return session.elapsedMs + (session.startedAt === null ? 0 : Math.max(0, now - session.startedAt));
}

function isCardioPoint(value: unknown): value is CardioPoint {
  return Array.isArray(value) && value.length === 2 &&
    typeof value[0] === 'number' && Math.abs(value[0]) <= 90 &&
    typeof value[1] === 'number' && Math.abs(value[1]) <= 180;
}

const GPS_MARKER = 'GPS_DATA::';

export function readCardioNotes(notes: unknown): { text: string; path: CardioPoint[] } {
  if (typeof notes !== 'string') return { text: '', path: [] };
  const marker = notes.indexOf(GPS_MARKER);
  if (marker === -1) return { text: notes, path: [] };
  const text = notes.slice(0, marker).trim();
  try {
    const path: unknown = JSON.parse(notes.slice(marker + GPS_MARKER.length));
    return { text, path: Array.isArray(path) ? path.filter(isCardioPoint) : [] };
  } catch {
    return { text, path: [] };
  }
}

export function cardioWorkoutPayload(activity: CardioActivity, seconds: number, weight: number, route?: CardioSession) {
  const manualNote = `Cardio Rápido: ${activity.name} (${activity.intensity}). Registrado desde Quick Cardio.`;
  const routeNote = route && `Sesión GPS: ${formatCardioDistance(route.distance)}. Ritmo: ${formatCardioPace(seconds, route.distance)}.`;
  return {
    routineName: activity.name,
    workout_date: new Date().toISOString(),
    duration_seconds: seconds,
    calories_burned: estimateCardioCalories(activity.mets, weight, seconds),
    notes: route?.path.length ? `${routeNote}\n${GPS_MARKER}${JSON.stringify(route.path)}` : routeNote || manualNote,
    exercises: [],
  };
}

export async function saveCardioWorkout(activity: CardioActivity, seconds: number, weight: number, route?: CardioSession) {
  const { logWorkout, fetchInitialData } = useAppStore.getState();
  const result = await logWorkout(cardioWorkoutPayload(activity, seconds, weight, route), { standalone: true });
  if (result.success && !result.offline) void fetchInitialData().catch(() => {});
  return result;
}

export async function syncPendingCardio(userId: number | string) {
  const { isSyncing, syncQueue, token, setSyncing, removeFromSyncQueue, fetchInitialData } = useAppStore.getState();
  const pending: QueuedRequest[] = syncQueue.filter((item: QueuedRequest) => item.cardioUserId === userId);
  if (isSyncing || !token || pending.length === 0) return;

  setSyncing(true);
  let synced = false;
  try {
    for (const item of pending) {
      if (useAppStore.getState().token !== token) break;
      try {
        await apiClient(item.endpoint, { ...item.options, queueWhenOffline: false });
        removeFromSyncQueue(item.id);
        synced = true;
      } catch {
        // Leave queued sessions available for the next sync attempt.
        break;
      }
    }
    if (synced && useAppStore.getState().token === token) await fetchInitialData();
  } finally {
    setSyncing(false);
  }
}

const cardioStorageKey = (userId: number | string) => `active_cardio_session:${userId}`;

export function loadCardioSession(userId: number | string | undefined): CardioSession | null {
  if (userId == null) return null;
  try {
    const session = JSON.parse(localStorage.getItem(cardioStorageKey(userId)) || 'null') as CardioSession | null;
    if (session && getCardioActivity(session.activityId)?.hasGPS && Array.isArray(session.path) &&
        Number.isFinite(session.elapsedMs) && session.elapsedMs >= 0 &&
        Number.isFinite(session.distance) && session.distance >= 0 &&
        (session.startedAt === null || Number.isFinite(session.startedAt))) {
      return { ...session, path: session.path.filter(isCardioPoint) };
    }
  } catch {}
  return null;
}

export function storeCardioSession(userId: number | string, session: CardioSession | null) {
  if (session) localStorage.setItem(cardioStorageKey(userId), JSON.stringify(session));
  else localStorage.removeItem(cardioStorageKey(userId));
}
