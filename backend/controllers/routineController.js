import { validationResult } from 'express-validator';
import models from '../models/index.js';

const { Routine, RoutineExercise, sequelize } = models;

// Obtener todas las rutinas de un usuario, incluyendo sus ejercicios
export const getAllRoutines = async (req, res) => {
  try {
    const routines = await Routine.findAll({
      where: { user_id: req.user.userId },
      include: [{
        model: RoutineExercise,
        as: 'RoutineExercises'
      }],
      order: [
        ['id', 'DESC'],
        [{ model: RoutineExercise, as: 'RoutineExercises' }, 'id', 'ASC']
      ],
    });
    res.json(routines);
  } catch (error) {
    console.error("Error detallado al obtener rutinas:", error);
    res.status(500).json({ error: 'Error al obtener las rutinas' });
  }
};

// Obtener una rutina específica por ID, incluyendo sus ejercicios
export const getRoutineById = async (req, res) => {
  try {
    const routine = await Routine.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.userId
      },
      include: [{
        model: RoutineExercise,
        as: 'RoutineExercises'
      }],
      order: [
        [{ model: RoutineExercise, as: 'RoutineExercises' }, 'id', 'ASC']
      ],
    });

    if (!routine) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }
    res.json(routine);
  } catch (error) {
    console.error("Error detallado al obtener rutina por ID:", error);
    res.status(500).json({ error: 'Error al obtener la rutina' });
  }
};

// Crear una nueva rutina y sus ejercicios asociados
export const createRoutine = async (req, res) => {
  // --- INICIO: Manejo de validación ---
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // --- FIN ---

  const { name, description, exercises = [] } = req.body;
  const t = await sequelize.transaction();
  try {
    const newRoutine = await Routine.create({
      name,
      description,
      user_id: req.user.userId
    }, { transaction: t });

    if (exercises.length > 0) {
      const exercisesToCreate = exercises.map(ex => ({
        name: ex.name,
        muscle_group: ex.muscle_group,
        sets: ex.sets,
        reps: ex.reps,
        routine_id: newRoutine.id
      }));
      await RoutineExercise.bulkCreate(exercisesToCreate, { transaction: t });
    }

    await t.commit();
    const result = await Routine.findByPk(newRoutine.id, {
      include: [{ model: RoutineExercise, as: 'RoutineExercises' }],
      order: [[{ model: RoutineExercise, as: 'RoutineExercises' }, 'id', 'ASC']]
    });
    res.status(201).json(result);
  } catch (error) {
    await t.rollback();
    console.error("Error detallado al crear rutina:", error);
    res.status(500).json({ error: 'Error al crear la rutina', details: error.message });
  }
};

// Actualizar una rutina y sus ejercicios
export const updateRoutine = async (req, res) => {
  // --- INICIO: Manejo de validación ---
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // --- FIN ---

  const { id } = req.params;
  const { name, description, exercises = [] } = req.body;
  const t = await sequelize.transaction();
  try {
    const routine = await Routine.findOne({
      where: { id, user_id: req.user.userId }
    });

    if (!routine) {
      await t.rollback();
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }

    await routine.update({ name, description }, { transaction: t });
    await RoutineExercise.destroy({ where: { routine_id: id }, transaction: t });

    if (exercises.length > 0) {
      const exercisesToCreate = exercises.map(ex => ({
        name: ex.name,
        muscle_group: ex.muscle_group,
        sets: ex.sets,
        reps: ex.reps,
        routine_id: id
      }));
      await RoutineExercise.bulkCreate(exercisesToCreate, { transaction: t });
    }

    await t.commit();
    const result = await Routine.findByPk(id, {
      include: [{ model: RoutineExercise, as: 'RoutineExercises' }],
      order: [[{ model: RoutineExercise, as: 'RoutineExercises' }, 'id', 'ASC']]
    });
    res.json(result);
  } catch (error) {
    await t.rollback();
    console.error("Error detallado al actualizar rutina:", error);
    res.status(500).json({ error: 'Error al actualizar la rutina', details: error.message });
  }
};

// Eliminar una rutina
export const deleteRoutine = async (req, res) => {
  const { id } = req.params;
  try {
    const routine = await Routine.findOne({
      where: { id, user_id: req.user.userId }
    });
    if (!routine) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }
    await routine.destroy();
    res.json({ message: 'Rutina eliminada correctamente' });
  } catch (error) {
    console.error("Error detallado al eliminar rutina:", error);
    res.status(500).json({ error: 'Error al eliminar la rutina', details: error.message });
  }
};

const routineController = {
  getAllRoutines,
  getRoutineById,
  createRoutine,
  updateRoutine,
  deleteRoutine
};

export default routineController;