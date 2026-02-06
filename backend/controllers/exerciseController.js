/* backend/controllers/exerciseController.js */
import { validationResult } from 'express-validator';
import models from '../models/index.js';

const { RoutineExercise } = models;

// Obtener todos los ejercicios de una rutina específica
export const getExercisesFromRoutine = async (req, res, next) => {
  try {
    // OPTIMIZACIÓN: 'raw: true' ahorra mucha memoria RAM al no crear instancias complejas.
    // Devuelve todas las columnas, por lo que es seguro y no rompe el frontend.
    const exercises = await RoutineExercise.findAll({
      where: { routine_id: req.params.routineId },
      raw: true
    });
    res.json(exercises);
  } catch (error) {
    next(error); 
  }
};

// Añadir un nuevo ejercicio a una rutina
export const addExerciseToRoutine = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

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
    next(error); 
  }
};

// Actualizar un ejercicio específico por su ID
export const updateExercise = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { exerciseId } = req.params;
  const { name, muscle_group, sets, reps } = req.body;
  
  try {
    // Mantenemos findByPk + save aquí porque necesitamos devolver el objeto actualizado completo
    const exercise = await RoutineExercise.findByPk(exerciseId);
    if (!exercise) {
      return res.status(404).json({ error: 'Ejercicio no encontrado' });
    }
    
    // Asignación segura
    exercise.name = name ?? exercise.name;
    exercise.muscle_group = muscle_group ?? exercise.muscle_group;
    exercise.sets = sets ?? exercise.sets;
    exercise.reps = reps ?? exercise.reps;

    await exercise.save();
    res.json(exercise);
  } catch (error) {
    next(error); 
  }
};

// Eliminar un ejercicio específico por su ID
export const deleteExercise = async (req, res, next) => {
  const { exerciseId } = req.params;
  try {
    // OPTIMIZACIÓN: Borrado directo en 1 sola consulta (ahorra I/O de base de datos)
    const deletedCount = await RoutineExercise.destroy({
      where: { id: exerciseId }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Ejercicio no encontrado' });
    }

    res.json({ message: 'Ejercicio eliminado correctamente' });
  } catch (error) {
    next(error); 
  }
};

const exerciseController = {
  getExercisesFromRoutine,
  addExerciseToRoutine,
  updateExercise,
  deleteExercise
};

export default exerciseController;