import { validationResult } from 'express-validator';
import models from '../models/index.js';

const { Routine, RoutineExercise, sequelize } = models;

// OBTENER TODAS LAS RUTINAS
export const getAllRoutines = async (req, res, next) => {
  try {
    const routines = await Routine.findAll({
      where: { user_id: req.user.userId },
      include: [
        {
          model: RoutineExercise,
          as: 'RoutineExercises',
          required: false,
        }
      ],
      order: [
        ['id', 'DESC'],
        [{ model: RoutineExercise, as: 'RoutineExercises' }, 'id', 'ASC']
      ],
    });
    res.json(routines);
  } catch (error) {
    next(error); // Pasar el error al middleware central
  }
};

// OBTENER UNA RUTINA ESPECÍFICA POR ID
export const getRoutineById = async (req, res, next) => {
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
    next(error); // Pasar el error al middleware central
  }
};

// CREAR UNA NUEVA RUTINA
export const createRoutine = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

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
        exercise_list_id: ex.exercise_list_id || null,
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
    next(error); // Pasar el error al middleware central
  }
};

// ACTUALIZAR UNA RUTINA
export const updateRoutine = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

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
        exercise_list_id: ex.exercise_list_id || null,
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
    next(error); // Pasar el error al middleware central
  }
};

// ELIMINAR UNA RUTINA
export const deleteRoutine = async (req, res, next) => {
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
    next(error); // Pasar el error al middleware central
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