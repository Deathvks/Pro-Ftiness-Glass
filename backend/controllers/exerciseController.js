import { validationResult } from 'express-validator'; // Importar validationResult
import models from '../models/index.js';

const { RoutineExercise } = models;

// Obtener todos los ejercicios de una rutina específica
export const getExercisesFromRoutine = async (req, res) => {
  try {
    const exercises = await RoutineExercise.findAll({
      where: { routine_id: req.params.routineId }
    });
    res.json(exercises);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los ejercicios de la rutina' });
  }
};

// Añadir un nuevo ejercicio a una rutina
export const addExerciseToRoutine = async (req, res) => {
  // --- INICIO: Manejo de validación ---
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // --- FIN ---

  const { name, muscle_group, sets, reps } = req.body;
  const { routineId } = req.params;
  try {
    const newExercise = await RoutineExercise.create({
      routine_id: routineId,
      name,
      muscle_group,
      sets,
      reps
    });
    res.status(201).json(newExercise);
  } catch (error) {
    res.status(500).json({ error: 'Error al añadir el ejercicio a la rutina' });
  }
};

// Actualizar un ejercicio específico por su ID
export const updateExercise = async (req, res) => {
  // --- INICIO: Manejo de validación ---
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // --- FIN ---

  const { exerciseId } = req.params;
  const { name, muscle_group, sets, reps } = req.body;
  try {
    const exercise = await RoutineExercise.findByPk(exerciseId);
    if (!exercise) {
      return res.status(404).json({ error: 'Ejercicio no encontrado' });
    }
    exercise.name = name ?? exercise.name;
    exercise.muscle_group = muscle_group ?? exercise.muscle_group;
    exercise.sets = sets ?? exercise.sets;
    exercise.reps = reps ?? exercise.reps;

    await exercise.save();
    res.json(exercise);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el ejercicio' });
  }
};

// Eliminar un ejercicio específico por su ID
export const deleteExercise = async (req, res) => {
  const { exerciseId } = req.params;
  try {
    const exercise = await RoutineExercise.findByPk(exerciseId);
    if (!exercise) {
      return res.status(404).json({ error: 'Ejercicio no encontrado' });
    }
    await exercise.destroy();
    res.json({ message: 'Ejercicio eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el ejercicio' });
  }
};

const exerciseController = {
  getExercisesFromRoutine,
  addExerciseToRoutine,
  updateExercise,
  deleteExercise
};

export default exerciseController;