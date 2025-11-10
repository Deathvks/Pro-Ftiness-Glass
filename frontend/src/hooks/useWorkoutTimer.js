/* frontend/src/hooks/useWorkoutTimer.js */
import { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';

/**
 * Hook para gestionar el cronómetro del entrenamiento (el 'timer' en segundos).
 * Se suscribe al estado del workout en Zustand (workoutStartTime, 
 * isWorkoutPaused, workoutAccumulatedTime) y calcula el tiempo
 * total transcurrido, actualizándose cada segundo.
 */
export const useWorkoutTimer = () => {
  // Estado local para el valor del 'timer' en segundos
  const [timer, setTimer] = useState(0);

  // Suscripción selectiva a los estados de Zustand que afectan al cronómetro
  const { workoutStartTime, isWorkoutPaused, workoutAccumulatedTime } = useAppStore(state => ({
    workoutStartTime: state.workoutStartTime,
    isWorkoutPaused: state.isWorkoutPaused,
    workoutAccumulatedTime: state.workoutAccumulatedTime,
  }));

  // Efecto que maneja el intervalo del cronómetro
  useEffect(() => {
    let interval = null;

    // Si el entrenamiento ha comenzado y NO está pausado
    if (workoutStartTime && !isWorkoutPaused) {
      // Iniciar un intervalo que se ejecuta cada segundo
      interval = setInterval(() => {
        // Calcular el tiempo transcurrido desde la última vez que se (re)anudó
        const elapsed = Date.now() - workoutStartTime;
        // El timer total es el tiempo acumulado + el tiempo transcurrido
        setTimer(Math.floor((workoutAccumulatedTime + elapsed) / 1000));
      }, 1000);
    } else {
      // Si está pausado o no ha comenzado, mostrar solo el tiempo acumulado
      setTimer(Math.floor(workoutAccumulatedTime / 1000));
    }

    // Función de limpieza:
    // Se ejecuta cuando el componente se desmonta o cuando
    // alguna de las dependencias (ej: isWorkoutPaused) cambia.
    return () => clearInterval(interval);

  }, [workoutStartTime, isWorkoutPaused, workoutAccumulatedTime]); // Dependencias

  // Devolver el estado del timer
  return timer;
};