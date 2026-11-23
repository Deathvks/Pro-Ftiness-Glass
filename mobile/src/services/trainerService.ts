import apiClient from '@/services/apiClient';
import type { RoleUser } from '@/utils/userRoleUtils';

export const TRAINING_DAYS = [['1', 'Lunes'], ['2', 'Martes'], ['3', 'Miércoles'], ['4', 'Jueves'], ['5', 'Viernes'], ['6', 'Sábado'], ['0', 'Domingo']] as const;

export type TrainerPerson = RoleUser & { id: number; name: string; username: string; profile_image_url?: string | null };
export type Anamnesis = Record<string, string | string[] | number | null>;
export type TrainerClient = TrainerPerson & {
  createdAt?: string;
  isActive: boolean;
  isLinked: boolean;
  isAnamnesisComplete: boolean;
  trainedToday: boolean;
  anamnesisData?: Anamnesis;
  weight?: number;
  height?: number;
  age?: number;
  gender?: string;
  goal?: string;
  activity_level?: number;
};
export type TrainerRoutine = {
  id: number;
  name: string;
  description?: string | null;
  folder?: string | null;
  image_url?: string | null;
  AssignedClients?: TrainerPerson[];
  RoutineExercises?: {
    id: number;
    exercise_list_id?: number | null;
    name: string;
    muscle_group?: string;
    sets: number;
    reps: string;
    rest_seconds?: number;
    exercise_order?: number;
    image_url_start?: string;
    image_url_end?: string;
    images?: string[];
  }[];
};
export type TrainerWorkout = { id: number; workout_date: string; routine_name?: string; duration_seconds?: number };

export const trainerClients = (): Promise<TrainerClient[]> => apiClient('/trainer/clients');
export const trainerRoutines = (): Promise<TrainerRoutine[]> => apiClient('/trainer/routines');
export const trainerWorkouts = (id: number): Promise<TrainerWorkout[]> => apiClient(`/trainer/clients/${id}/workouts`);
export const searchTrainerUsers = (query: string): Promise<TrainerPerson[]> => apiClient(`/trainer/users/search?q=${encodeURIComponent(query)}`);
export const createTrainerClient = (body: { name: string; surname1: string; surname2: string }): Promise<{ client: TrainerPerson }> =>
  apiClient('/trainer/clients', { method: 'POST', body, queueWhenOffline: false });
export const changeTrainerClient = (id: number, action: 'link' | 'unlink' | 'delete') => action === 'delete'
  ? apiClient(`/trainer/clients/${id}`, { method: 'DELETE', queueWhenOffline: false })
  : apiClient(`/trainer/clients/${id}/${action}`, { method: 'PUT', queueWhenOffline: false });
export const updateTrainerClient = (id: number, name: string, anamnesisData: Anamnesis) =>
  apiClient(`/trainer/clients/${id}`, { method: 'PUT', body: { name, anamnesisData }, queueWhenOffline: false });
export const saveTrainerAnamnesis = (id: number, anamnesisData: Anamnesis) =>
  apiClient(`/trainer/clients/${id}/anamnesis`, { method: 'POST', body: { anamnesisData }, queueWhenOffline: false });
export const assignTrainerRoutine = (id: number, clientIds: number[]) =>
  apiClient(`/trainer/routines/${id}/assign`, { method: 'PUT', body: { clientIds }, queueWhenOffline: false });
