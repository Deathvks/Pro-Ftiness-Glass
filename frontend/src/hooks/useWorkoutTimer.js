/* frontend/src/hooks/useWorkoutTimer.js */
import { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';
import { useToast } from './useToast';

// Límite de 4 horas en segundos (4 * 60 * 60)
const MAX_WORKOUT_DURATION = 14400;

/**
 * Hook para gestionar el cronómetro del entrenamiento (el 'timer' en segundos).
 * Aplica un límite de 4h, tras el cual autoguarda y finaliza la sesión.
 */
export const useWorkoutTimer = () => {
  const [timer, setTimer] = useState(0);
  const { addToast } = useToast();

  const { 
    workoutStartTime, 
    isWorkoutPaused, 
    workoutAccumulatedTime,
    finishWorkout
  } = useAppStore(state => ({
    workoutStartTime: state.workoutStartTime,
    isWorkoutPaused: state.isWorkoutPaused,
    workoutAccumulatedTime: state.workoutAccumulatedTime,
    finishWorkout: state.finishWorkout,
  }));

  useEffect(() => {
    let interval = null;

    if (workoutStartTime && !isWorkoutPaused) {
      interval = setInterval(() => {
        const elapsed = Date.now() - workoutStartTime;
        const currentTimer = Math.floor((workoutAccumulatedTime + elapsed) / 1000);
        
        if (currentTimer >= MAX_WORKOUT_DURATION) {
          clearInterval(interval);
          setTimer(MAX_WORKOUT_DURATION);
          
          // Autoguardado al alcanzar el límite de tiempo
          const handleAutoFinish = async () => {
            if (finishWorkout) {
              try {
                await finishWorkout();
                addToast('Entrenamiento guardado automáticamente (Límite de 4h)', 'info');
              } catch (error) {
                console.error("Error en autoguardado:", error);
              }
            }
          };
          
          handleAutoFinish();
        } else {
          setTimer(currentTimer);
        }
      }, 1000);
    } else {
      setTimer(Math.floor(workoutAccumulatedTime / 1000));
    }

    return () => clearInterval(interval);
  }, [workoutStartTime, isWorkoutPaused, workoutAccumulatedTime, finishWorkout, addToast]);

  return timer;
};