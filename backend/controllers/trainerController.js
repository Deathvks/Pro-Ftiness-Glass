/* backend/controllers/trainerController.js */
import models from '../models/index.js';
import { Op } from 'sequelize';

const { User } = models;

const generateUniqueUsername = async (name, surname1, surname2) => {
    let base = (name.charAt(0) + surname1.substring(0, 3) + surname2.substring(0, 3)).toLowerCase();
    // Quitar acentos y caracteres raros
    base = base.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    
    let username = base;
    let counter = 1;
    let exists = true;
    
    while (exists) {
        const user = await User.findOne({ where: { username } });
        if (user) {
            username = `${base}${counter}`;
            counter++;
        } else {
            exists = false;
        }
    }
    return username;
};

export const registerClient = async (req, res) => {
    try {
        const { name, surname1, surname2 } = req.body;
        
        if (!name || !surname1 || !surname2) {
            return res.status(400).json({ error: 'Nombre y dos apellidos son requeridos.' });
        }

        const fullName = `${name} ${surname1} ${surname2}`.trim();
        const username = await generateUniqueUsername(name, surname1, surname2);
        const defaultPassword = '123456';
        const dummyEmail = `${username}@profitnessglass.internal`; // Needed because email is unique and required

        const newClient = await User.create({
            name: fullName,
            username: username,
            email: dummyEmail, 
            password_hash: defaultPassword, 
            role: 'trainee',
            trainer_id: req.user.userId,
            force_password_reset: true,
            is_verified: true
        });

        return res.status(201).json({
            message: 'Cliente creado correctamente.',
            client: {
                id: newClient.id,
                name: newClient.name,
                username: newClient.username,
                createdAt: newClient.created_at || newClient.createdAt
            }
        });
    } catch (error) {
        console.error('Error registerClient:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

export const getClients = async (req, res) => {
    try {
        const { WorkoutLog } = models;

        const clients = await User.findAll({
            where: {
                trainer_id: req.user.userId
            }
        });

        // Check workouts for today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const clientIds = clients.map(c => c.id);
        const todayWorkouts = await WorkoutLog.findAll({
            where: {
                user_id: clientIds,
                workout_date: {
                    [Op.between]: [startOfDay, endOfDay]
                }
            },
            attributes: ['user_id']
        });

        const usersWhoTrainedToday = new Set(todayWorkouts.map(w => w.user_id));

        const formattedClients = clients.map(client => {
            const data = client.anamnesis_data || {};
            const isComplete = Object.keys(data).length > 5;
            return {
                id: client.id,
                name: client.name,
                username: client.username,
                lastSeen: client.lastSeen,
                createdAt: client.created_at || client.createdAt,
                profile_image_url: client.profile_image_url,
                isAnamnesisComplete: isComplete,
                anamnesisData: data,
                isActive: client.role === 'trainee',
                trainedToday: usersWhoTrainedToday.has(client.id),
                isLinked: client.email && !client.email.endsWith('@profitnessglass.internal')
            };
        });

        return res.json(formattedClients);
    } catch (error) {
        console.error('Error getClients:', error);
        return res.status(500).json({ error: 'Error al obtener clientes.' });
    }
};

export const saveAnamnesis = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { anamnesisData } = req.body;

        const client = await User.findOne({
            where: {
                id: clientId,
                trainer_id: req.user.userId
            }
        });

        if (!client) {
            return res.status(404).json({ error: 'Cliente no encontrado o no autorizado.' });
        }

        const currentData = client.anamnesis_data || {};
        const mergedData = { ...currentData, ...anamnesisData };

        client.anamnesis_data = mergedData;
        await client.save();

        return res.json({ message: 'Datos guardados correctamente.', data: mergedData });
    } catch (error) {
        console.error('Error saveAnamnesis:', error);
        return res.status(500).json({ error: 'Error al guardar cuestionario.' });
    }
};

export const updateClient = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { name, anamnesisData } = req.body;

        const client = await User.findOne({
            where: {
                id: clientId,
                trainer_id: req.user.userId
            }
        });

        if (!client) {
            return res.status(404).json({ error: 'Cliente no encontrado o no autorizado.' });
        }

        if (name) client.name = name;
        if (anamnesisData) {
            const currentData = client.anamnesis_data || {};
            client.anamnesis_data = { ...currentData, ...anamnesisData };
        }

        await client.save();
        return res.json({ message: 'Cliente actualizado correctamente.', client: { id: client.id, name: client.name, username: client.username, anamnesisData: client.anamnesis_data }});
    } catch (error) {
        console.error('Error updateClient:', error);
        return res.status(500).json({ error: 'Error al actualizar cliente.' });
    }
};

export const deleteClient = async (req, res) => {
    try {
        const { clientId } = req.params;

        const client = await User.findOne({
            where: {
                id: clientId,
                trainer_id: req.user.userId
            }
        });

        if (!client) {
            return res.status(404).json({ error: 'Cliente no encontrado o no autorizado.' });
        }

        if (client.email && !client.email.endsWith('@profitnessglass.internal')) {
            client.trainer_id = null;
            client.role = 'user';
            await client.save();
            return res.json({ message: 'El usuario ya existía en la app. Se ha desvinculado de tu asesoría correctamente.' });
        }

        await client.destroy();
        return res.json({ message: 'Cliente eliminado correctamente.' });
    } catch (error) {
        console.error('Error deleteClient:', error);
        return res.status(500).json({ error: 'Error al eliminar cliente.' });
    }
};

export const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;

        let whereClause = {
            trainer_id: null,
            role: 'user'
        };

        if (q && q.trim().length >= 3) {
            whereClause[Op.or] = [
                { username: { [Op.like]: `%${q}%` } },
                { name: { [Op.like]: `%${q}%` } },
                { email: { [Op.like]: `%${q}%` } }
            ];
        }

        const users = await User.findAll({
            where: whereClause,
            attributes: ['id', 'username', 'name', 'email', 'profile_image_url'],
            limit: q && q.trim().length >= 3 ? 10 : 50,
            order: [['created_at', 'DESC']]
        });

        return res.json(users);
    } catch (error) {
        console.error('Error searchUsers:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

export const linkClient = async (req, res) => {
    try {
        const { clientId } = req.params;
        const user = await User.findOne({ 
            where: { 
                id: clientId, 
                role: 'user',
                [Op.or]: [
                    { trainer_id: null },
                    { trainer_id: req.user.userId }
                ]
            } 
        });
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado o ya vinculado.' });
        }

        user.trainer_id = req.user.userId;
        user.role = 'trainee';
        await user.save();

        return res.json({ message: 'Usuario vinculado exitosamente.' });
    } catch (error) {
        console.error('Error linkClient:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

export const unlinkClient = async (req, res) => {
    try {
        const { clientId } = req.params;
        const client = await User.findOne({
            where: {
                id: clientId,
                trainer_id: req.user.userId
            }
        });

        if (!client) {
            return res.status(404).json({ error: 'Cliente no encontrado o no autorizado.' });
        }

        client.role = 'user';
        await client.save();

        return res.json({ message: 'Cliente dado de baja correctamente.' });
    } catch (error) {
        console.error('Error unlinkClient:', error);
        return res.status(500).json({ error: 'Error al dar de baja al cliente.' });
    }
};

export const getClientWorkouts = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { WorkoutLog, WorkoutLogDetail, WorkoutLogSet } = models;

        // Verify the client belongs to the trainer
        const client = await User.findOne({
            where: {
                id: clientId,
                trainer_id: req.user.userId
            }
        });

        if (!client) {
            return res.status(404).json({ error: 'Cliente no encontrado o no autorizado.' });
        }

        const history = await WorkoutLog.findAll({
            where: { user_id: clientId },
            include: [{
                model: WorkoutLogDetail,
                as: 'WorkoutLogDetails',
                include: [{
                    model: WorkoutLogSet,
                    as: 'WorkoutLogSets',
                    order: [['set_number', 'ASC']],
                }],
                order: [['id', 'ASC']],
            }],
            order: [['workout_date', 'DESC']],
        });

        const plainHistory = history.map(log => log.get({ plain: true }));

        // Opcional: calcular 1RM
        plainHistory.forEach(log => {
            if (log.WorkoutLogDetails) {
                log.WorkoutLogDetails.forEach(detail => {
                    if (detail.WorkoutLogSets) {
                        detail.WorkoutLogSets.forEach(set => {
                            const weightNum = parseFloat(set.weight_kg);
                            const repsNum = parseInt(set.reps, 10);
                            let estimated1RM = 0;
                            if (!isNaN(weightNum) && !isNaN(repsNum) && weightNum > 0 && repsNum > 0) {
                                estimated1RM = Math.round((weightNum * (1 + repsNum / 30)) * 100) / 100;
                            }
                            set.estimated1RM = estimated1RM;
                        });
                    }
                });
            }
        });

        return res.json(plainHistory);
    } catch (error) {
        console.error('Error getClientWorkouts:', error);
        return res.status(500).json({ error: 'Error al obtener los entrenamientos del cliente.' });
    }
};

// --- RUTINAS DEL ENTRENADOR ---

export const getTrainerRoutines = async (req, res) => {
  try {
    const routines = await models.Routine.findAll({
      where: { user_id: req.user.userId, is_trainer_template: true },
      include: [
        {
          model: models.RoutineExercise,
          as: 'RoutineExercises',
          required: false,
          include: [
            {
              model: models.ExerciseList,
              as: 'ExerciseList',
              required: false,
              attributes: ['image_url_start', 'image_url_end', 'images']
            }
          ]
        },
        {
          model: models.User,
          as: 'AssignedClients',
          attributes: ['id', 'name', 'username', 'profile_image_url'],
          through: { attributes: ['assigned_at'] }
        }
      ],
      order: [
        ['folder', 'ASC'],
        ['id', 'ASC'],
        ['RoutineExercises', 'exercise_order', 'ASC']
      ]
    });
    
    // Normalizar imágenes
    const routinesData = routines.map(routine => {
      const routineJson = routine.toJSON();
      if (routineJson.RoutineExercises) {
        routineJson.RoutineExercises = routineJson.RoutineExercises.map(ex => {
          if (ex.ExerciseList) {
            if (!ex.image_url_start) ex.image_url_start = ex.ExerciseList.image_url_start;
            ex.image_url_end = ex.ExerciseList.image_url_end;
            ex.images = ex.ExerciseList.images;
            delete ex.ExerciseList;
          }
          return ex;
        });
      }
      return routineJson;
    });

    res.json(routinesData);
  } catch (error) {
    console.error('Error fetching trainer routines:', error);
    res.status(500).json({ error: 'Error obteniendo rutinas' });
  }
};

export const createTrainerRoutine = async (req, res) => {
  // Lo implementaremos redirigiendo al RoutineEditor con un flag. 
  // No necesitamos un POST en trainerController si el RoutineEditor hace POST a /api/routines con is_trainer_template.
};

export const assignTrainerRoutine = async (req, res) => {
  try {
    const { routineId } = req.params;
    const { clientIds } = req.body; // Array de IDs de clientes

    const routine = await models.Routine.findOne({
      where: { id: routineId, user_id: req.user.userId, is_trainer_template: true }
    });
    if (!routine) return res.status(404).json({ error: 'Rutina no encontrada' });

    // Validar que los clientes pertenecen a este entrenador (tienen trainer_id = req.user.userId)
    const validClients = await models.User.findAll({
      where: { id: clientIds, trainer_id: req.user.userId }
    });
    
    const validClientIds = validClients.map(c => c.id);

    // Si queremos reemplazar todas las asignaciones o añadir: usaremos setAssignedClients
    // pero tal vez sea mejor hacer bulkCreate para mantener el history, o setAssignedClients de Sequelize
    await routine.setAssignedClients(validClientIds);

    res.json({ success: true, message: 'Rutina asignada correctamente' });
  } catch (error) {
    console.error('Error assigning routine:', error);
    res.status(500).json({ error: 'Error al asignar rutina' });
  }
};

export const unassignTrainerRoutine = async (req, res) => {
  try {
    const { routineId, clientId } = req.params;

    const routine = await models.Routine.findOne({
      where: { id: routineId, user_id: req.user.userId, is_trainer_template: true }
    });
    if (!routine) return res.status(404).json({ error: 'Rutina no encontrada' });

    await routine.removeAssignedClient(clientId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error unassigning routine:', error);
    res.status(500).json({ error: 'Error al desasignar rutina' });
  }
};
