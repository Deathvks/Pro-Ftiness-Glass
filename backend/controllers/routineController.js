/* backend/controllers/routineController.js */
import { validationResult } from 'express-validator';
import models from '../models/index.js';
import { Op } from 'sequelize';

// --- INICIO DE LA MODIFICACIÓN ---
// Mantenemos sequelize, que es la clave para la solución.
// Importamos ExerciseList directamente para más claridad al crear manuales.
const {
  sequelize,
  ExerciseList, // <-- Importar ExerciseList
} = models;
// --- FIN DE LA MODIFICACIÓN ---

// OBTENER TODAS LAS RUTINAS
export const getAllRoutines = async (req, res, next) => {
  try {
    // CORRECCIÓN: Usar req.user.userId
    const routines = await sequelize.models.Routine.findAll({ // <--- MODIFICADO
      where: { user_id: req.user.userId },
      include: [
        {
          model: sequelize.models.RoutineExercise, // <--- MODIFICADO
          as: 'RoutineExercises',
          required: false,
        },
      ],
      order: [
        ['id', 'ASC'],
        ['RoutineExercises', 'exercise_order', 'ASC'], // <-- Ordenar por exercise_order
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
    const routine = await sequelize.models.Routine.findOne({ // <--- MODIFICADO
      where: {
        id: req.params.id,
        user_id: req.user.userId, // CORRECCIÓN: Usar req.user.userId
      },
      include: [
        {
          model: sequelize.models.RoutineExercise, // <--- MODIFICADO
          as: 'RoutineExercises',
        },
      ],
      order: [
        ['RoutineExercises', 'exercise_order', 'ASC'], // <-- Ordenar por exercise_order
        ['RoutineExercises', 'id', 'ASC']
      ],
    });

    if (!routine) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }
    res.json(routine);
  } catch (error) {
    next(error);
  }
};

// --- INICIO DE LA MODIFICACIÓN ---
const processAndSaveExercises = async (
  exercises,
  routineId,
  userId,
  transaction
) => {
  if (!exercises || exercises.length === 0) {
    return; // No hay ejercicios que procesar
  }

  // 1. Procesar todos los ejercicios con Promise.all
  const exercisesToCreate = await Promise.all(
    exercises.map(async (ex) => {
      let exerciseListId = ex.exercise_list_id;
      let exerciseName = ex.name; // Nombre original del ejercicio en la rutina
      let muscleGroup = ex.muscle_group; // Grupo muscular original

      // 2. Comprobar si es un ejercicio manual (nuevo o existente personalizado)
      const isManual =
        ex.is_manual ||
        (typeof exerciseListId === 'string' && exerciseListId.startsWith('manual_'));

      if (isManual) {
        // Podría ser un ejercicio manual ya existente o uno nuevo.
        // Buscamos si ya existe un ejercicio personalizado con ese nombre PARA ESE USUARIO
        // (Asumiendo que queremos reutilizar ejercicios manuales por nombre,
        // o podríamos necesitar una forma de identificar unívocamente los manuales)

        // **Decisión:** Por simplicidad y evitar duplicados en ExerciseList,
        // NO crearemos nuevas entradas en ExerciseList aquí. Asumiremos que
        // los ejercicios manuales son simplemente nombres personalizados dentro
        // de RoutineExercise, sin un ID de ExerciseList asociado.
        // Si se quisiera persistir el ejercicio manual en ExerciseList,
        // la lógica sería más compleja para manejar duplicados y asociar al usuario.

        // Por lo tanto, para manuales, exerciseListId será null.
        exerciseListId = null;

        // Si no viene nombre o grupo muscular para el manual (poco probable), intentamos obtenerlos
        if (!exerciseName) exerciseName = "Ejercicio Manual"; // Nombre por defecto
        if (!muscleGroup) muscleGroup = "Varios"; // Grupo por defecto

        console.log(`Ejercicio manual detectado: "${exerciseName}". Se guardará sin exercise_list_id.`);


      } else if (exerciseListId && !isNaN(parseInt(exerciseListId))) {
        // Si es un ejercicio de la lista (ID numérico), intentamos obtener
        // el nombre y grupo muscular actualizados desde ExerciseList
        try {
          const exerciseFromList = await ExerciseList.findByPk(parseInt(exerciseListId), { transaction });
          if (exerciseFromList) {
            exerciseName = exerciseFromList.name; // Usar el nombre de la lista maestra
            muscleGroup = exerciseFromList.muscle_group; // Usar el grupo de la lista maestra
          } else {
             console.warn(`Ejercicio con ID ${exerciseListId} no encontrado en ExerciseList. Usando nombre/grupo de la rutina.`);
             // Mantener exerciseListId original por si acaso, aunque no exista
          }
        } catch(findError) {
          console.error(`Error buscando ExerciseList ID ${exerciseListId}:`, findError);
          // Mantener nombre/grupo originales si falla la búsqueda
        }
      } else {
         // Si no es manual y no tiene un ID válido, tratarlo como manual (sin ID)
         console.warn(`Ejercicio "${exerciseName}" sin ID válido y no marcado como manual. Tratando como manual.`);
         exerciseListId = null;
         if (!muscleGroup) muscleGroup = "Varios";
       }


      // 5. Devolver el objeto para 'RoutineExercise'
      return {
        // Usar el nombre y grupo muscular (potencialmente actualizados de ExerciseList o los originales)
        name: exerciseName,
        muscle_group: muscleGroup,
        sets: ex.sets,
        reps: ex.reps,

        // --- INICIO DE LA MODIFICACIÓN (EL BUG ESTABA AQUÍ) ---
        // Faltaban estos campos, que SÍ vienen del frontend (ex)
        rest_seconds: ex.rest_seconds,
        image_url_start: ex.image_url_start || null,
        video_url: ex.video_url || null,
        // --- FIN DE LA MODIFICACIÓN ---

        // Usar el ID numérico si existe, o null para manuales/no encontrados
        exercise_list_id: exerciseListId ? parseInt(exerciseListId) : null,
        routine_id: routineId,
        superset_group_id: ex.superset_group_id,
        exercise_order: ex.exercise_order,
      };
    })
  );

  // 6. Insertar en lote todos los RoutineExercise
  if (exercisesToCreate.length > 0) {
    await sequelize.models.RoutineExercise.bulkCreate(exercisesToCreate, { transaction });
  }
};
// --- FIN DE LA MODIFICACIÓN ---

// CREAR UNA NUEVA RUTINA
export const createRoutine = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, exercises = [] } = req.body;
  // CORRECCIÓN: Usar req.user.userId
  const { userId } = req.user;
  const t = await sequelize.transaction();

  try {
    const existingRoutine = await sequelize.models.Routine.findOne({ // <--- MODIFICADO
      where: { name, user_id: userId },
      transaction: t,
    });

    if (existingRoutine) {
      await t.rollback();
      return res
        .status(409)
        .json({ error: 'Ya existe una rutina con este nombre.' });
    }

    const newRoutine = await sequelize.models.Routine.create( // <--- MODIFICADO
      {
        name,
        description,
        user_id: userId,
      },
      { transaction: t }
    );

    // Pasar userId a la función (aunque ya no se usa para crear en ExerciseList)
    await processAndSaveExercises(exercises, newRoutine.id, userId, t);

    await t.commit();
    const result = await sequelize.models.Routine.findByPk(newRoutine.id, { // <--- MODIFICADO
      include: [{ model: sequelize.models.RoutineExercise, as: 'RoutineExercises' }], // <--- MODIFICADO
      order: [
        ['RoutineExercises', 'exercise_order', 'ASC'], // <-- Ordenar por exercise_order
        ['RoutineExercises', 'id', 'ASC']
      ],
    });
    res.status(201).json(result);
  } catch (error) {
    await t.rollback();
    console.error("Error detallado en createRoutine:", error); // Log detallado
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
  const { name, description, exercises = [] } = req.body;
  // CORRECCIÓN: Usar req.user.userId
  const { userId } = req.user;
  const t = await sequelize.transaction();

  try {
    const existingRoutine = await sequelize.models.Routine.findOne({ // <--- MODIFICADO
      where: {
        name,
        user_id: userId,
        id: { [Op.ne]: id },
      },
      transaction: t,
    });

    if (existingRoutine) {
      await t.rollback();
      return res
        .status(409)
        .json({ error: 'Ya existe otra rutina con este nombre.' });
    }

    const routine = await sequelize.models.Routine.findOne({ // <--- MODIFICADO
      where: { id, user_id: userId },
      include: [{ model: sequelize.models.RoutineExercise, as: 'RoutineExercises' }], // <--- MODIFICADO
      transaction: t,
    });

    if (!routine) {
      await t.rollback();
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }

    const oldExercises = routine.RoutineExercises;
    const renamedExercises = [];
    exercises.forEach((newEx) => {
      // Intentar encontrar el ejercicio antiguo por ID si existe, o por nombre/orden si es nuevo/manual
      const oldEx = oldExercises.find((old) => old.id && old.id === newEx.id) ||
                    oldExercises.find((old) => old.exercise_order === newEx.exercise_order && old.name === newEx.name); // Fallback por si acaso

      if (oldEx && oldEx.name !== newEx.name && !newEx.exercise_list_id) { // Solo si es manual y se renombró
        renamedExercises.push({ oldName: oldEx.name, newName: newEx.name });
      }
    });

    await routine.update({ name, description }, { transaction: t });
    // Borrar TODOS los ejercicios antiguos ANTES de insertar los nuevos
    await sequelize.models.RoutineExercise.destroy({ where: { routine_id: id }, transaction: t }); // <--- MODIFICADO

    // Re-insertar todos los ejercicios (actualizados)
    // Pasar userId a la función (aunque ya no se usa para crear en ExerciseList)
    await processAndSaveExercises(exercises, id, userId, t);

    // Actualizar historial si hubo renombres de ejercicios MANUALES
    if (renamedExercises.length > 0) {
      for (const rename of renamedExercises) {
        // Encontrar logs que usaron esta rutina
        const workoutLogsForRoutine = await sequelize.models.WorkoutLog.findAll({ // <--- MODIFICADO
          where: { routine_id: id, user_id: userId }, // CORRECCIÓN: Usar userId
          attributes: ['id'],
          raw: true,
          transaction: t,
        });
        const workoutLogIds = workoutLogsForRoutine.map((log) => log.id);

        if (workoutLogIds.length > 0) {
          // Actualizar detalles de log con el nombre antiguo
          await sequelize.models.WorkoutLogDetail.update( // <--- MODIFICADO
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
        // Actualizar Récords Personales con el nombre antiguo
        await sequelize.models.PersonalRecord.update( // <--- MODIFICADO
          { exercise_name: rename.newName },
          {
            where: { user_id: userId, exercise_name: rename.oldName }, // CORRECCIÓN: Usar userId
            transaction: t,
          }
        );
      }
    }

    await t.commit();
    // Devolver la rutina actualizada con los ejercicios reinsertados
    const result = await sequelize.models.Routine.findByPk(id, { // <--- MODIFICADO
      include: [{ model: sequelize.models.RoutineExercise, as: 'RoutineExercises' }], // <--- MODIFICADO
      order: [
          ['RoutineExercises', 'exercise_order', 'ASC'], // <-- Ordenar por exercise_order
          ['RoutineExercises', 'id', 'ASC']
      ],
    });
    res.json(result);
  } catch (error) {
    await t.rollback();
    console.error("Error detallado en updateRoutine:", error); // Log detallado
    next(error);
  }
};


// ELIMINAR UNA RUTINA
export const deleteRoutine = async (req, res, next) => {
  const { id } = req.params;
  // CORRECCIÓN: Usar req.user.userId
  const { userId } = req.user;
  const t = await sequelize.transaction();

  try {
    const routine = await sequelize.models.Routine.findOne({ // <--- MODIFICADO
      where: { id, user_id: userId },
      transaction: t,
    });

    if (!routine) {
      await t.rollback();
      return res.status(404).json({ error: 'Rutina no encontrada' }); // Corregido 4404 -> 404
    }

    // 1. Recolectar todos los detalles de los entrenamientos que se van a borrar
    const logsToDelete = await sequelize.models.WorkoutLog.findAll({ // <--- MODIFICADO
      where: { routine_id: id, user_id: userId },
      include: [{ model: sequelize.models.WorkoutLogDetail, as: 'WorkoutLogDetails' }], // <--- MODIFICADO
      transaction: t,
    });
    const detailsToDelete = logsToDelete.flatMap((log) => log.WorkoutLogDetails);
    const affectedExercises = [
      ...new Set(detailsToDelete.map((d) => d.exercise_name)),
    ];

    // 2. Eliminar la rutina (esto borrará en cascada los logs, detalles y series)
    await routine.destroy({ transaction: t });

    // 3. Recalcular PRs para los ejercicios afectados
    for (const exerciseName of affectedExercises) {
      const currentPR = await sequelize.models.PersonalRecord.findOne({ // <--- MODIFICADO
        where: { user_id: userId, exercise_name: exerciseName },
        transaction: t,
      });

      if (currentPR) {
        // Buscar el nuevo mejor set en el resto de entrenamientos (los que no hemos borrado)
        const newBestLogDetail = await sequelize.models.WorkoutLogDetail.findOne({ // <--- MODIFICADO
          include: [
            {
              model: sequelize.models.WorkoutLog, // <--- MODIFICADO
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
          // Si encontramos un nuevo mejor, actualizamos el PR
          const newBestWorkout = await sequelize.models.WorkoutLog.findByPk( // <--- MODIFICADO
            newBestLogDetail.workout_log_id,
            { attributes: ['workout_date'], transaction: t }
          );
          currentPR.weight_kg = newBestLogDetail.best_set_weight;
          currentPR.date = newBestWorkout.workout_date;
          await currentPR.save({ transaction: t });
        } else {
          // Si no quedan registros para ese ejercicio, borramos el PR
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
// --- FIN DE LA CORRECCIÓN ---

const routineController = {
  getAllRoutines,
  getRoutineById,
  createRoutine,
  updateRoutine,
  deleteRoutine,
};

export default routineController;