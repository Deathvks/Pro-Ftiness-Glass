/* backend/controllers/userController.js */
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import models from '../models/index.js';
import { createNotification } from '../services/notificationService.js';
import { deleteFile } from '../services/imageService.js';
import { addXp, checkStreak, WEIGHT_UPDATE_XP } from '../services/gamificationService.js';

const {
  User,
  BodyWeightLog,
  sequelize,
  Routine,
  WorkoutLog,
  NutritionLog,
  WaterLog,
  FavoriteMeal,
  PersonalRecord,
  CreatinaLog,
  WorkoutLogDetail,
  WorkoutLogSet
} = models;

/**
 * Helper para encontrar y eliminar todos los ficheros de un usuario (perfil, comidas).
 * Usa el servicio centralizado deleteFile para la limpieza.
 */
const deleteAllUserFiles = async (userId, userInstance) => {
  const pathsToDelete = new Set();

  // 1. Imagen de perfil
  if (userInstance && userInstance.profile_image_url) {
    pathsToDelete.add(userInstance.profile_image_url);
  }

  // 2. Imágenes de NutritionLog
  const nutritionLogs = await NutritionLog.findAll({
    where: { user_id: userId },
    attributes: ['image_url'],
    raw: true,
  });
  nutritionLogs.forEach((log) => log.image_url && pathsToDelete.add(log.image_url));

  // 3. Imágenes de FavoriteMeal
  const favoriteMeals = await FavoriteMeal.findAll({
    where: { user_id: userId },
    attributes: ['image_url'],
    raw: true,
  });
  favoriteMeals.forEach((meal) => meal.image_url && pathsToDelete.add(meal.image_url));

  // 4. Borrar ficheros usando el servicio
  pathsToDelete.forEach((relativePath) => {
    deleteFile(relativePath);
  });
};

// Obtener el perfil del usuario autenticado
export const getMyProfile = async (req, res, next) => {
  try {
    // User.findByPk devuelve todas las columnas por defecto
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const userWithPass = await User.findByPk(req.user.userId, { attributes: ['password_hash'] });
    const userData = user.toJSON();
    userData.hasPassword = !!userWithPass.password_hash;

    // --- CORRECCIÓN: Normalizar fecha de última actividad ---
    // Esto evita problemas de zona horaria donde la fecha retrocede un día al enviarse al frontend
    if (userData.last_activity_date) {
      const d = new Date(userData.last_activity_date);
      if (!isNaN(d.getTime())) {
        userData.last_activity_date = d.toISOString().split('T')[0];
      }
    }

    if (userData.unlocked_badges && typeof userData.unlocked_badges === 'string') {
      try {
        userData.unlocked_badges = JSON.parse(userData.unlocked_badges);
      } catch (e) {
        console.error("Error parseando insignias:", e);
        userData.unlocked_badges = [];
      }
    } else if (!userData.unlocked_badges) {
      userData.unlocked_badges = [];
    }

    res.json(userData);
  } catch (error) {
    next(error);
  }
};

// --- INICIO DE LA MODIFICACIÓN: Función de Exportación Corregida ---
export const exportMyData = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const format = req.query.format || 'json';

    // 1. Obtener Datos
    const user = await User.findByPk(userId, { attributes: { exclude: ['password_hash'] } });

    const bodyWeightLogs = await BodyWeightLog.findAll({
      where: { user_id: userId },
      order: [['log_date', 'DESC']]
    });

    // CORRECCIÓN: 'date' -> 'log_date'
    const nutritionLogs = await NutritionLog.findAll({
      where: { user_id: userId },
      order: [['log_date', 'DESC']]
    });

    // Para los logs de entrenamiento, incluimos la jerarquía completa
    // CORRECCIÓN: 'date' -> 'workout_date'
    const workoutLogs = await WorkoutLog.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Routine,
          as: 'routine',
          attributes: ['name']
        },
        {
          model: WorkoutLogDetail,
          as: 'WorkoutLogDetails',
          include: [{
            model: WorkoutLogSet,
            as: 'WorkoutLogSets'
          }]
        }
      ],
      order: [['workout_date', 'DESC']]
    });

    const personalRecords = await PersonalRecord.findAll({
      where: { user_id: userId }
    });

    // 2. Formatear y Enviar
    if (format === 'json') {
      const data = {
        profile: user,
        bodyWeight: bodyWeightLogs,
        nutrition: nutritionLogs,
        personalRecords: personalRecords,
        workouts: workoutLogs
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="pro-fitness-data-${userId}.json"`);
      return res.send(JSON.stringify(data, null, 2));

    } else if (format === 'csv') {
      // Para CSV, priorizamos los registros de entrenamiento aplanados, que es lo más útil para Excel.
      // Date, Routine, Exercise, Set, Weight, Reps, RPE, Type
      let csv = 'Date,Routine,Exercise,Set,Weight(kg),Reps,RPE,Type\n';

      workoutLogs.forEach(log => {
        // CORRECCIÓN: log.date -> log.workout_date
        const dateObj = new Date(log.workout_date);
        const date = !isNaN(dateObj) ? dateObj.toISOString().split('T')[0] : 'N/A';
        const routineName = log.routine ? log.routine.name : 'N/A';

        if (log.WorkoutLogDetails) {
          log.WorkoutLogDetails.forEach(detail => {
            const exerciseName = detail.exercise_name || 'Unknown Exercise';

            if (detail.WorkoutLogSets) {
              detail.WorkoutLogSets.forEach((set, index) => {
                // Escapar comillas dobles en nombres
                const safeRoutine = routineName.replace(/"/g, '""');
                const safeExercise = exerciseName.replace(/"/g, '""');

                csv += `"${date}","${safeRoutine}","${safeExercise}",${index + 1},${set.weight_kg || 0},${set.reps || 0},${set.rpe || ''},"${set.type || 'normal'}"\n`;
              });
            }
          });
        }
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="workouts-${userId}.csv"`);
      return res.send(csv);

    } else {
      return res.status(400).json({ error: 'Formato no soportado. Use json o csv.' });
    }

  } catch (error) {
    next(error);
  }
};
// --- FIN DE LA MODIFICACIÓN ---

// Endpoint de Gamificación (Actualización manual/admin si fuese necesario)
export const updateGamificationStats = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const {
      xp, level, streak,
      lastActivityDate, last_activity_date,
      unlockedBadges, unlocked_badges,
      reason
    } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // --- INICIO DE LA MODIFICACIÓN (FIX XP INFINITA) ---
    // Si es "Login Diario", usamos checkStreak del servicio que tiene la protección de fecha.
    if (reason === 'Login Diario') {
      const todayStr = new Date().toISOString().split('T')[0];

      // Llamamos al servicio (que ahora maneja la lógica de 'solo una vez al día' y valida mayúsculas/minúsculas)
      const result = await checkStreak(userId, todayStr);

      if (!result.success) {
        throw new Error(result.error || 'Error procesando racha');
      }

      // Recargamos el usuario para tener los datos finales (XP sumada o no, nivel, etc.)
      await user.reload();

      let currentBadges = [];
      try {
        currentBadges = typeof user.unlocked_badges === 'string'
          ? JSON.parse(user.unlocked_badges)
          : user.unlocked_badges || [];
      } catch (e) { currentBadges = []; }

      // Normalizar fecha para respuesta
      let returnDate = user.last_activity_date;
      if (returnDate) {
        returnDate = new Date(returnDate).toISOString().split('T')[0];
      }

      return res.json({
        message: result.xpAwarded > 0 ? 'Login diario procesado (+XP)' : 'Login diario ya registrado hoy',
        success: true,
        data: {
          xp: user.xp,
          level: user.level,
          streak: user.streak,
          last_activity_date: returnDate,
          unlocked_badges: currentBadges
        },
        ignored: result.xpAwarded === 0 // Flag para que el frontend sepa si se sumó o no
      });
    }
    // --- FIN DE LA MODIFICACIÓN ---

    // --- LÓGICA MANUAL (Para otras actualizaciones que no sean Login Diario) ---
    const updates = {};
    const oldXp = user.xp;
    const oldLevel = user.level;

    if (xp !== undefined) updates.xp = xp;
    if (level !== undefined) updates.level = level;
    if (streak !== undefined) updates.streak = streak;

    // Prioridad a lo que hayamos forzado (req.body), luego snake_case, luego camelCase
    const finalDate = req.body.last_activity_date !== undefined
      ? req.body.last_activity_date
      : (last_activity_date !== undefined ? last_activity_date : lastActivityDate);

    if (finalDate !== undefined) {
      updates.last_activity_date = finalDate;
    }

    const finalBadges = unlocked_badges !== undefined ? unlocked_badges : unlockedBadges;
    if (finalBadges !== undefined) {
      updates.unlocked_badges = Array.isArray(finalBadges)
        ? JSON.stringify(finalBadges)
        : finalBadges;
    }

    // --- LÓGICA DE NOTIFICACIONES ---
    if (xp !== undefined && xp > oldXp) {
      const diff = xp - oldXp;
      if (diff > 0) {
        const noteReason = reason || 'Progreso sincronizado';
        createNotification(userId, {
          type: 'info',
          title: `+${diff} XP`,
          message: `Has ganado ${diff} XP. Motivo: ${noteReason}`
        });
      }
    }

    if (level !== undefined && level > oldLevel) {
      createNotification(userId, {
        type: 'success',
        title: '¡Subida de Nivel!',
        message: `¡Felicidades! Has alcanzado el Nivel ${level}.`
      });
    }

    if (finalBadges !== undefined) {
      let currentBadges = [];
      try {
        currentBadges = typeof user.unlocked_badges === 'string'
          ? JSON.parse(user.unlocked_badges)
          : user.unlocked_badges || [];
      } catch (e) { currentBadges = []; }

      const newBadgesList = Array.isArray(finalBadges) ? finalBadges : [];
      const earnedBadges = newBadgesList.filter(b => !currentBadges.includes(b));

      if (earnedBadges.length > 0) {
        createNotification(userId, {
          type: 'success',
          title: '¡Insignia Desbloqueada!',
          message: `Has conseguido ${earnedBadges.length} nueva(s) insignia(s).`
        });
      }
    }

    await user.update(updates);

    // Preparar respuesta con datos normalizados
    let returnDate = updates.last_activity_date || user.last_activity_date;
    if (returnDate) {
      returnDate = new Date(returnDate).toISOString().split('T')[0];
    }

    let returnBadges = updates.unlocked_badges || user.unlocked_badges;
    if (typeof returnBadges === 'string') {
      try { returnBadges = JSON.parse(returnBadges); } catch (e) { returnBadges = []; }
    }

    // Devolvemos SIEMPRE el objeto 'data' con el estado final
    res.json({
      message: 'Progreso guardado',
      success: true,
      data: {
        xp: updates.xp !== undefined ? updates.xp : user.xp,
        level: updates.level !== undefined ? updates.level : user.level,
        streak: updates.streak !== undefined ? updates.streak : user.streak,
        last_activity_date: returnDate,
        unlocked_badges: returnBadges
      }
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar el perfil físico, preferencias y PRIVACIDAD
export const updateMyProfile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const t = await sequelize.transaction();
  try {
    const { userId } = req.user;
    const {
      gender, age, height, activityLevel, goal, weight, login_email_notifications,
      is_public_profile, show_level_xp, show_badges, timezone // <--- AÑADIDO: timezone
    } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const updateData = {
      gender, age, height, activity_level: activityLevel, goal, login_email_notifications
    };

    if (timezone) updateData.timezone = timezone; // <--- AÑADIDO: Guardar timezone
    if (typeof is_public_profile !== 'undefined') updateData.is_public_profile = is_public_profile;
    if (typeof show_level_xp !== 'undefined') updateData.show_level_xp = show_level_xp;
    if (typeof show_badges !== 'undefined') updateData.show_badges = show_badges;

    await user.update(updateData, { transaction: t });

    let weightUpdated = false;
    if (weight) {
      const weightValue = parseFloat(weight);
      if (weightValue > 0) {
        await BodyWeightLog.create(
          { user_id: userId, weight_kg: weightValue, log_date: new Date() },
          { transaction: t }
        );
        weightUpdated = true;
      }
    }

    await t.commit();

    if (weightUpdated) {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        await addXp(userId, WEIGHT_UPDATE_XP, 'Peso registrado (Perfil)');
        await checkStreak(userId, todayStr);
      } catch (gError) {
        console.error('Error gamificación en updateMyProfile (weight):', gError);
      }
    }

    let ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP desconocida';
    if (typeof ip === 'string' && ip.includes(',')) ip = ip.split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || 'Dispositivo desconocido';

    if (weight || goal || activityLevel) {
      createNotification(userId, {
        type: 'info',
        title: 'Perfil físico actualizado',
        message: 'Has actualizado tus datos físicos y objetivos.',
        data: { ip, userAgent, date: new Date() }
      });
    }

    const updatedUser = await User.findByPk(userId, { attributes: { exclude: ['password_hash'] } });
    const userWithPass = await User.findByPk(userId, { attributes: ['password_hash'] });
    const userData = updatedUser.toJSON();
    userData.hasPassword = !!userWithPass.password_hash;

    if (userData.unlocked_badges && typeof userData.unlocked_badges === 'string') {
      try { userData.unlocked_badges = JSON.parse(userData.unlocked_badges); } catch (e) { userData.unlocked_badges = []; }
    }

    res.json(userData);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Actualizar datos de la cuenta (username, email, pass, imagen)
export const updateMyAccount = async (req, res, next) => {
  const newImagePath = req.processedImagePath || null;

  try {
    const { userId } = req.user;
    const { name, username, email, currentPassword, newPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      if (newImagePath) deleteFile(newImagePath);
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const oldImageUrl = user.profile_image_url;
    const fieldsToUpdate = {};
    const changes = [];

    if (newImagePath) {
      fieldsToUpdate.profile_image_url = newImagePath;
      changes.push('foto de perfil');
    }

    if (newPassword) {
      if (user.password_hash) {
        if (!currentPassword) {
          if (newImagePath) deleteFile(newImagePath);
          return res.status(400).json({ error: 'La contraseña actual es requerida para cambiarla.' });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
          if (newImagePath) deleteFile(newImagePath);
          return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
        }
      }
      fieldsToUpdate.password_hash = newPassword;
      changes.push('contraseña');
    }

    if (name !== undefined && name !== user.name) {
      fieldsToUpdate.name = name;
      changes.push('nombre');
    }
    if (username !== undefined && username !== user.username) {
      fieldsToUpdate.username = username;
      changes.push(`usuario (${user.username} -> ${username})`);
    }
    if (email !== undefined && email !== user.email) {
      fieldsToUpdate.email = email;
      changes.push('email');
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      await user.update(fieldsToUpdate);
      if (newImagePath && oldImageUrl) deleteFile(oldImageUrl);

      let ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP desconocida';
      if (typeof ip === 'string' && ip.includes(',')) ip = ip.split(',')[0].trim();
      const userAgent = req.headers['user-agent'] || 'Dispositivo desconocido';

      if (changes.length > 0) {
        const message = `Datos actualizados: ${changes.join(', ')}.`;
        createNotification(userId, {
          type: 'info',
          title: 'Cuenta actualizada',
          message: message,
          data: { ip, userAgent, date: new Date() }
        });
      }
    }

    await user.reload();
    const { password_hash, ...userWithoutPassword } = user.get({ plain: true });
    userWithoutPassword.hasPassword = !!user.password_hash;

    if (userWithoutPassword.unlocked_badges && typeof userWithoutPassword.unlocked_badges === 'string') {
      try { userWithoutPassword.unlocked_badges = JSON.parse(userWithoutPassword.unlocked_badges); } catch (e) { userWithoutPassword.unlocked_badges = []; }
    }

    res.json(userWithoutPassword);

  } catch (error) {
    if (newImagePath) deleteFile(newImagePath);
    if (error.name === 'SequelizeUniqueConstraintError') {
      if (error.fields && error.fields.email) return res.status(409).json({ error: 'El email o nombre de usuario ya está en uso.' });
      if (error.fields && error.fields.username) return res.status(409).json({ error: 'El nombre de usuario ya está en uso.' });
    }
    next(error);
  }
};

// Borra todos los datos del usuario pero conserva la cuenta
export const clearMyData = async (req, res, next) => {
  const { userId } = req.user;
  const { password } = req.body;

  const t = await sequelize.transaction();
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      await t.rollback();
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (user.password_hash) {
      if (!password) {
        await t.rollback();
        return res.status(400).json({ error: 'La contraseña es requerida.' });
      }
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        await t.rollback();
        return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
      }
    }

    await deleteAllUserFiles(userId, user);

    await Routine.destroy({ where: { user_id: userId }, transaction: t });
    await WorkoutLog.destroy({ where: { user_id: userId }, transaction: t });
    await BodyWeightLog.destroy({ where: { user_id: userId }, transaction: t });
    await NutritionLog.destroy({ where: { user_id: userId }, transaction: t });
    await WaterLog.destroy({ where: { user_id: userId }, transaction: t });
    await FavoriteMeal.destroy({ where: { user_id: userId }, transaction: t });
    await PersonalRecord.destroy({ where: { user_id: userId }, transaction: t });
    await CreatinaLog.destroy({ where: { user_id: userId }, transaction: t });

    await user.update(
      {
        profile_image_url: null,
        gender: null,
        age: null,
        height: null,
        activity_level: null,
        goal: null,
        xp: 0,
        level: 1,
        streak: 0,
        unlocked_badges: '[]'
      },
      { transaction: t }
    );

    await t.commit();

    let ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP desconocida';
    if (typeof ip === 'string' && ip.includes(',')) ip = ip.split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || 'Dispositivo desconocido';

    createNotification(userId, {
      type: 'warning',
      title: 'Datos eliminados',
      message: 'Has eliminado todos tus datos de progreso y registros de la aplicación.',
      data: { ip, userAgent, date: new Date() }
    });

    res.status(200).json({
      message: 'Todos tus datos de progreso han sido eliminados. Tu cuenta se mantiene.',
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Borra permanentemente la cuenta
export const deleteMyAccount = async (req, res, next) => {
  const { userId } = req.user;
  const { password } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (user.password_hash) {
      if (!password) {
        return res.status(400).json({ error: 'La contraseña es requerida.' });
      }
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
      }
    }

    await deleteAllUserFiles(userId, user);
    await user.destroy();

    res.status(200).json({
      message: 'Tu cuenta y todos tus datos han sido eliminados permanentemente.',
    });
  } catch (error) {
    next(error);
  }
};

const userController = {
  getMyProfile,
  updateMyProfile,
  updateMyAccount,
  clearMyData,
  deleteMyAccount,
  updateGamificationStats,
  exportMyData
};

export default userController;