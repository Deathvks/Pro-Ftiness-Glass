/* backend/controllers/routineController.js */
import { validationResult } from 'express-validator';
import models from '../models/index.js';
import { Op } from 'sequelize';
import { addXp, checkStreak } from '../services/gamificationService.js';
import { deleteFile } from '../services/imageService.js';

const {
  sequelize,
  ExerciseList,
  User
} = models;

// OBTENER TODAS LAS RUTINAS (Personales del usuario)
export const getAllRoutines = async (req, res, next) => {
  try {
    const routines = await sequelize.models.Routine.findAll({
      where: { user_id: req.user.userId },
      include: [
        {
          model: sequelize.models.RoutineExercise,
          as: 'RoutineExercises',
          required: false,
        },
      ],
      order: [
        ['id', 'ASC'],
        ['RoutineExercises', 'exercise_order', 'ASC'],
        ['RoutineExercises', 'id', 'ASC'],
      ],
    });
    res.json(routines);
  } catch (error) {
    next(error);
  }
};

// OBTENER UNA RUTINA ESPECÍFICA POR ID
export const getRoutineById = async (req, res, next) => {
  try {
    const routine = await sequelize.models.Routine.findOne({
      where: {
        id: req.params.id,
        [Op.or]: [
          { user_id: req.user.userId },
          { is_public: true }
        ]
      },
      include: [
        {
          model: sequelize.models.RoutineExercise,
          as: 'RoutineExercises',
        },
        {
          model: User,
          attributes: ['id', 'username']
        }
      ],
      order: [
        ['RoutineExercises', 'exercise_order', 'ASC'],
        ['RoutineExercises', 'id', 'ASC']
      ],
    });

    if (!routine) {
      return res.status(404).json({ error: 'Rutina no encontrada o acceso denegado' });
    }
    res.json(routine);
  } catch (error) {
    next(error);
  }
};

const processAndSaveExercises = async (
  exercises,
  routineId,
  userId,
  transaction
) => {
  if (!exercises || exercises.length === 0) {
    return;
  }

  const exercisesToCreate = await Promise.all(
    exercises.map(async (ex) => {
      let exerciseListId = ex.exercise_list_id;
      let exerciseName = ex.name;
      let muscleGroup = ex.muscle_group;

      const isManual =
        ex.is_manual ||
        (typeof exerciseListId === 'string' && exerciseListId.startsWith('manual_'));

      if (isManual) {
        exerciseListId = null;
        if (!exerciseName) exerciseName = "Ejercicio Manual";
        if (!muscleGroup) muscleGroup = "Varios";
      } else if (exerciseListId && !isNaN(parseInt(exerciseListId))) {
        try {
          const exerciseFromList = await ExerciseList.findByPk(parseInt(exerciseListId), { transaction });
          if (exerciseFromList) {
            exerciseName = exerciseFromList.name;
            muscleGroup = exerciseFromList.muscle_group;
          } else {
            console.warn(`Ejercicio con ID ${exerciseListId} no encontrado en ExerciseList.`);
          }
        } catch (findError) {
          console.error(`Error buscando ExerciseList ID ${exerciseListId}:`, findError);
        }
      } else {
        exerciseListId = null;
        if (!exerciseName) {
          exerciseName = "Ejercicio Manual";
          muscleGroup = "Varios";
        }
      }

      return {
        name: exerciseName,
        muscle_group: muscleGroup,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        image_url_start: ex.image_url_start || null,
        video_url: ex.video_url || null,
        exercise_list_id: exerciseListId ? parseInt(exerciseListId) : null,
        routine_id: routineId,
        superset_group_id: ex.superset_group_id,
        exercise_order: ex.exercise_order,
      };
    })
  );

  if (exercisesToCreate.length > 0) {
    await sequelize.models.RoutineExercise.bulkCreate(exercisesToCreate, { transaction });
  }
};

// CREAR UNA NUEVA RUTINA
export const createRoutine = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, is_public = false, exercises = [], image_url } = req.body;
  const { userId } = req.user;
  const t = await sequelize.transaction();

  try {
    const existingRoutine = await sequelize.models.Routine.findOne({
      where: { name, user_id: userId },
      transaction: t,
    });

    if (existingRoutine) {
      await t.rollback();
      return res.status(409).json({ error: 'Ya existe una rutina con este nombre.' });
    }

    const newRoutine = await sequelize.models.Routine.create(
      {
        name,
        description,
        user_id: userId,
        is_public,
        downloads_count: 0,
        image_url: image_url || null
      },
      { transaction: t }
    );

    await processAndSaveExercises(exercises, newRoutine.id, userId, t);

    await t.commit();

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await addXp(userId, 20, 'Rutina creada');
      await checkStreak(userId, todayStr);
    } catch (gError) {
      console.error('Error gamificación en createRoutine:', gError);
    }

    const result = await sequelize.models.Routine.findByPk(newRoutine.id, {
      include: [{ model: sequelize.models.RoutineExercise, as: 'RoutineExercises' }],
      order: [
        ['RoutineExercises', 'exercise_order', 'ASC'],
        ['RoutineExercises', 'id', 'ASC']
      ],
    });
    res.status(201).json(result);
  } catch (error) {
    await t.rollback();
    console.error("Error detallado en createRoutine:", error);
    next(error);
  }
};

// ACTUALIZAR UNA RUTINA
export const updateRoutine = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, description, is_public, exercises = [], image_url } = req.body;
  const { userId } = req.user;
  const t = await sequelize.transaction();

  try {
    const existingRoutine = await sequelize.models.Routine.findOne({
      where: {
        name,
        user_id: userId,
        id: { [Op.ne]: id },
      },
      transaction: t,
    });

    if (existingRoutine) {
      await t.rollback();
      return res.status(409).json({ error: 'Ya existe otra rutina con este nombre.' });
    }

    const routine = await sequelize.models.Routine.findOne({
      where: { id, user_id: userId },
      include: [{ model: sequelize.models.RoutineExercise, as: 'RoutineExercises' }],
      transaction: t,
    });

    if (!routine) {
      await t.rollback();
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }

    // Manejo de eliminación de imagen antigua si cambia
    const oldImageUrl = routine.image_url;

    // Actualizamos campos
    const updateData = { name, description };
    if (typeof is_public !== 'undefined') updateData.is_public = is_public;
    if (typeof image_url !== 'undefined') updateData.image_url = image_url;

    await routine.update(updateData, { transaction: t });

    // Si la imagen ha cambiado y la antigua era una subida (no predefinida), borrarla
    if (image_url !== undefined && oldImageUrl && oldImageUrl !== image_url) {
      if (oldImageUrl.includes('/uploads/')) {
        deleteFile(oldImageUrl);
      }
    }

    // Actualización de ejercicios
    const oldExercises = routine.RoutineExercises;
    const renamedExercises = [];
    exercises.forEach((newEx) => {
      const oldEx = oldExercises.find((old) => old.id && old.id === newEx.id) ||
        oldExercises.find((old) => old.exercise_order === newEx.exercise_order && old.name === newEx.name);

      if (oldEx && oldEx.name !== newEx.name && !newEx.exercise_list_id) {
        renamedExercises.push({ oldName: oldEx.name, newName: newEx.name });
      }
    });

    await sequelize.models.RoutineExercise.destroy({ where: { routine_id: id }, transaction: t });
    await processAndSaveExercises(exercises, id, userId, t);

    // Actualizar nombres en Logs y PRs
    if (renamedExercises.length > 0) {
      for (const rename of renamedExercises) {
        const workoutLogsForRoutine = await sequelize.models.WorkoutLog.findAll({
          where: { routine_id: id, user_id: userId },
          attributes: ['id'],
          raw: true,
          transaction: t,
        });
        const workoutLogIds = workoutLogsForRoutine.map((log) => log.id);

        if (workoutLogIds.length > 0) {
          await sequelize.models.WorkoutLogDetail.update(
            { exercise_name: rename.newName },
            {
              where: {
                workout_log_id: { [Op.in]: workoutLogIds },
                exercise_name: rename.oldName,
              },
              transaction: t,
            }
          );
        }
        await sequelize.models.PersonalRecord.update(
          { exercise_name: rename.newName },
          {
            where: { user_id: userId, exercise_name: rename.oldName },
            transaction: t,
          }
        );
      }
    }

    await t.commit();
    const result = await sequelize.models.Routine.findByPk(id, {
      include: [{ model: sequelize.models.RoutineExercise, as: 'RoutineExercises' }],
      order: [
        ['RoutineExercises', 'exercise_order', 'ASC'],
        ['RoutineExercises', 'id', 'ASC']
      ],
    });
    res.json(result);
  } catch (error) {
    await t.rollback();
    console.error("Error detallado en updateRoutine:", error);
    next(error);
  }
};

// ELIMINAR UNA RUTINA
export const deleteRoutine = async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.user;
  const t = await sequelize.transaction();

  try {
    const routine = await sequelize.models.Routine.findOne({
      where: { id, user_id: userId },
      transaction: t,
    });

    if (!routine) {
      await t.rollback();
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }

    const imageUrl = routine.image_url;

    const logsToDelete = await sequelize.models.WorkoutLog.findAll({
      where: { routine_id: id, user_id: userId },
      include: [{ model: sequelize.models.WorkoutLogDetail, as: 'WorkoutLogDetails' }],
      transaction: t,
    });
    const detailsToDelete = logsToDelete.flatMap((log) => log.WorkoutLogDetails);
    const affectedExercises = [
      ...new Set(detailsToDelete.map((d) => d.exercise_name)),
    ];

    await routine.destroy({ transaction: t });

    // Eliminar imagen si era una subida
    if (imageUrl && imageUrl.includes('/uploads/')) {
      deleteFile(imageUrl);
    }

    // Recálculo de PRs
    for (const exerciseName of affectedExercises) {
      const currentPR = await sequelize.models.PersonalRecord.findOne({
        where: { user_id: userId, exercise_name: exerciseName },
        transaction: t,
      });

      if (currentPR) {
        const newBestLogDetail = await sequelize.models.WorkoutLogDetail.findOne({
          include: [
            {
              model: sequelize.models.WorkoutLog,
              as: 'WorkoutLog',
              where: { user_id: userId },
              attributes: [],
            },
          ],
          where: { exercise_name: exerciseName },
          order: [['best_set_weight', 'DESC']],
          transaction: t,
        });

        if (newBestLogDetail) {
          const newBestWorkout = await sequelize.models.WorkoutLog.findByPk(
            newBestLogDetail.workout_log_id,
            { attributes: ['workout_date'], transaction: t }
          );
          currentPR.weight_kg = newBestLogDetail.best_set_weight;
          currentPR.date = newBestWorkout.workout_date;
          await currentPR.save({ transaction: t });
        } else {
          await currentPR.destroy({ transaction: t });
        }
      }
    }

    await t.commit();
    res.json({
      message: 'Rutina y su historial eliminados, récords recalculados.',
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// --- NUEVOS MÉTODOS SOCIALES PARA RUTINAS ---

// CAMBIAR ESTADO PÚBLICO/PRIVADO
export const togglePublicStatus = async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    const routine = await sequelize.models.Routine.findOne({
      where: { id, user_id: userId }
    });

    if (!routine) return res.status(404).json({ error: 'Rutina no encontrada' });

    routine.is_public = !routine.is_public;
    await routine.save();

    res.json({ success: true, is_public: routine.is_public });
  } catch (error) {
    next(error);
  }
};

// OBTENER RUTINAS PÚBLICAS (COMUNIDAD)
export const getPublicRoutines = async (req, res, next) => {
  try {
    const { sort = 'popular', query } = req.query; // sort: popular | recent

    const whereClause = { is_public: true };
    if (query) {
      whereClause.name = { [Op.like]: `%${query}%` };
    }

    const order = sort === 'recent'
      ? [['created_at', 'DESC']]
      : [['downloads_count', 'DESC']];

    const routines = await sequelize.models.Routine.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profile_image_url']
        },
        {
          model: sequelize.models.RoutineExercise,
          as: 'RoutineExercises',
          attributes: ['name', 'muscle_group']
        }
      ],
      order,
      limit: 50
    });
    res.json(routines);
  } catch (error) {
    next(error);
  }
};

// DESCARGAR (COPIAR) RUTINA DE OTRO USUARIO
export const downloadRoutine = async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.user;
  const t = await sequelize.transaction();

  try {
    const sourceRoutine = await sequelize.models.Routine.findByPk(id, {
      include: [{ model: sequelize.models.RoutineExercise, as: 'RoutineExercises' }],
      transaction: t
    });

    if (!sourceRoutine) {
      await t.rollback();
      return res.status(404).json({ error: 'Rutina original no encontrada' });
    }

    if (!sourceRoutine.is_public && sourceRoutine.user_id !== userId) {
      await t.rollback();
      return res.status(403).json({ error: 'Esta rutina es privada' });
    }

    // Crear la copia (Nota: No copiamos la imagen por defecto para evitar enlaces rotos si el dueño la borra)
    const newRoutine = await sequelize.models.Routine.create({
      name: `${sourceRoutine.name} (Copia)`,
      description: sourceRoutine.description,
      user_id: userId,
      is_public: false,
      downloads_count: 0,
      image_url: null // Iniciamos sin imagen
    }, { transaction: t });

    const exercisesToCopy = sourceRoutine.RoutineExercises.map(ex => ({
      exercise_list_id: ex.exercise_list_id,
      name: ex.name,
      muscle_group: ex.muscle_group,
      sets: ex.sets,
      reps: ex.reps,
      rest_seconds: ex.rest_seconds,
      video_url: ex.video_url,
      image_url_start: ex.image_url_start,
      superset_group_id: ex.superset_group_id,
      exercise_order: ex.exercise_order,
      is_manual: ex.exercise_list_id === null
    }));

    await processAndSaveExercises(exercisesToCopy, newRoutine.id, userId, t);

    if (sourceRoutine.user_id !== userId) {
      await sourceRoutine.increment('downloads_count', { transaction: t });
      try {
        await addXp(sourceRoutine.user_id, 5, `Tu rutina "${sourceRoutine.name}" fue descargada`);
      } catch (ignore) { }
    }

    await t.commit();
    res.json({ success: true, message: 'Rutina descargada con éxito', newRoutineId: newRoutine.id });

  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const routineController = {
  getAllRoutines,
  getRoutineById,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  togglePublicStatus,
  getPublicRoutines,
  downloadRoutine
};

export default routineController;