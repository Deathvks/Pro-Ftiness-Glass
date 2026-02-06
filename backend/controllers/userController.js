/* backend/controllers/userController.js */
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import models from '../models/index.js';
import { createNotification } from '../services/notificationService.js';
// IMPORTANTE: Importamos el procesador para comprimir imágenes de perfil (ahorro de espacio)
import { processUploadedFile } from '../services/uploadService.js';
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

// --- HELPER: Cálculo de Nivel (Misma fórmula que en gamificationService) ---
const calculateLevel = (xp) => Math.max(1, Math.floor((-350 + Math.sqrt(202500 + 200 * xp)) / 100));

/**
 * Helper para encontrar y eliminar todos los ficheros de un usuario.
 * OPTIMIZADO: Usa Promise.all para concurrencia y consultas raw para memoria.
 */
const deleteAllUserFiles = async (userId, userInstance) => {
  const pathsToDelete = new Set();

  // 1. Imagen de perfil
  if (userInstance && userInstance.profile_image_url) {
    pathsToDelete.add(userInstance.profile_image_url);
  }

  // 2. Imágenes de logs (Paralelo y RAW)
  const [nutritionLogs, favoriteMeals] = await Promise.all([
    NutritionLog.findAll({ 
      where: { user_id: userId }, 
      attributes: ['image_url'], 
      raw: true 
    }),
    FavoriteMeal.findAll({ 
      where: { user_id: userId }, 
      attributes: ['image_url'], 
      raw: true 
    })
  ]);

  nutritionLogs.forEach((log) => log.image_url && pathsToDelete.add(log.image_url));
  favoriteMeals.forEach((meal) => meal.image_url && pathsToDelete.add(meal.image_url));

  // 3. Borrar ficheros en paralelo (No bloqueante)
  await Promise.all([...pathsToDelete].map(relativePath => deleteFile(relativePath)));
};

// Obtener el perfil del usuario autenticado
export const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // --- AUTO-REPARACIÓN LIGERA ---
    const correctLevel = calculateLevel(user.xp || 0);
    if (user.level !== correctLevel) {
      // Usamos update directo para evitar triggers innecesarios si solo es fix
      await user.update({ level: correctLevel }, { hooks: false });
      user.level = correctLevel; // Actualizamos objeto en memoria
    }
    // -----------------------------

    const userWithPass = await User.findByPk(req.user.userId, { attributes: ['password_hash'], raw: true });
    const userData = user.toJSON();
    userData.hasPassword = !!(userWithPass && userWithPass.password_hash);

    // Normalizar fecha
    if (userData.last_activity_date) {
      const d = new Date(userData.last_activity_date);
      if (!isNaN(d.getTime())) {
        userData.last_activity_date = d.toISOString().split('T')[0];
      }
    }

    // Parseo seguro de badges
    if (typeof userData.unlocked_badges === 'string') {
      try {
        userData.unlocked_badges = JSON.parse(userData.unlocked_badges);
      } catch (e) {
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

export const exportMyData = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const format = req.query.format || 'json';

    // 1. Obtener Datos en Paralelo (Mucho más rápido)
    const [user, bodyWeightLogs, nutritionLogs, personalRecords, workoutLogs] = await Promise.all([
      User.findByPk(userId, { attributes: { exclude: ['password_hash'] } }),
      BodyWeightLog.findAll({ where: { user_id: userId }, order: [['log_date', 'DESC']], raw: true }),
      NutritionLog.findAll({ where: { user_id: userId }, order: [['log_date', 'DESC']], raw: true }),
      PersonalRecord.findAll({ where: { user_id: userId }, raw: true }),
      // WorkoutLog mantenemos estructura completa para el CSV
      WorkoutLog.findAll({
        where: { user_id: userId },
        include: [
          { model: Routine, as: 'routine', attributes: ['name'] },
          {
            model: WorkoutLogDetail,
            as: 'WorkoutLogDetails',
            include: [{ model: WorkoutLogSet, as: 'WorkoutLogSets' }]
          }
        ],
        order: [['workout_date', 'DESC']]
      })
    ]);

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
      let csv = 'Date,Routine,Exercise,Set,Weight(kg),Reps,RPE,Type\n';

      workoutLogs.forEach(log => {
        const dateObj = new Date(log.workout_date);
        const date = !isNaN(dateObj) ? dateObj.toISOString().split('T')[0] : 'N/A';
        const routineName = log.routine ? log.routine.name : 'N/A';

        if (log.WorkoutLogDetails) {
          log.WorkoutLogDetails.forEach(detail => {
            const exerciseName = detail.exercise_name || 'Unknown Exercise';

            if (detail.WorkoutLogSets) {
              detail.WorkoutLogSets.forEach((set, index) => {
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

// Endpoint de Gamificación
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
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    // Login Diario Optimizado
    if (reason === 'Login Diario') {
      const todayStr = new Date().toISOString().split('T')[0];
      const result = await checkStreak(userId, todayStr);

      if (!result.success) throw new Error(result.error || 'Error procesando racha');

      // Reload ligero
      await user.reload({ attributes: ['xp', 'level', 'streak', 'last_activity_date', 'unlocked_badges'] });

      let currentBadges = [];
      try {
        currentBadges = typeof user.unlocked_badges === 'string'
          ? JSON.parse(user.unlocked_badges)
          : user.unlocked_badges || [];
      } catch (e) { currentBadges = []; }

      let returnDate = user.last_activity_date;
      if (returnDate) returnDate = new Date(returnDate).toISOString().split('T')[0];

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
        ignored: result.xpAwarded === 0
      });
    }

    // --- LÓGICA MANUAL ---
    const updates = {};
    const oldXp = user.xp;
    const oldLevel = user.level;

    if (xp !== undefined) updates.xp = xp;
    if (level !== undefined) updates.level = level;
    if (streak !== undefined) updates.streak = streak;

    const finalDate = req.body.last_activity_date !== undefined
      ? req.body.last_activity_date
      : (last_activity_date !== undefined ? last_activity_date : lastActivityDate);

    if (finalDate !== undefined) updates.last_activity_date = finalDate;

    const finalBadges = unlocked_badges !== undefined ? unlocked_badges : unlockedBadges;
    if (finalBadges !== undefined) {
      updates.unlocked_badges = Array.isArray(finalBadges) ? JSON.stringify(finalBadges) : finalBadges;
    }

    // Notificaciones
    if (xp !== undefined && xp > oldXp) {
      const diff = xp - oldXp;
      if (diff > 0) {
        createNotification(userId, {
          type: 'info',
          title: `+${diff} XP`,
          message: `Has ganado ${diff} XP. Motivo: ${reason || 'Progreso'}`
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

    await user.update(updates);

    // Respuesta
    let returnDate = updates.last_activity_date || user.last_activity_date;
    if (returnDate) returnDate = new Date(returnDate).toISOString().split('T')[0];

    let returnBadges = updates.unlocked_badges || user.unlocked_badges;
    if (typeof returnBadges === 'string') {
      try { returnBadges = JSON.parse(returnBadges); } catch (e) { returnBadges = []; }
    }

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

export const updateMyProfile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const t = await sequelize.transaction();
  try {
    const { userId } = req.user;
    const {
      gender, age, height, activityLevel, goal, weight, login_email_notifications,
      is_public_profile, show_level_xp, show_badges, timezone
    } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      await t.rollback();
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const updateData = {
      gender, age, height, activity_level: activityLevel, goal, login_email_notifications
    };

    if (timezone) updateData.timezone = timezone;
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
      // Async para no bloquear
      const todayStr = new Date().toISOString().split('T')[0];
      addXp(userId, WEIGHT_UPDATE_XP, 'Peso registrado (Perfil)').catch(console.error);
      checkStreak(userId, todayStr).catch(console.error);
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
    const userWithPass = await User.findByPk(userId, { attributes: ['password_hash'], raw: true });
    const userData = updatedUser.toJSON();
    userData.hasPassword = !!(userWithPass && userWithPass.password_hash);

    if (userData.unlocked_badges && typeof userData.unlocked_badges === 'string') {
      try { userData.unlocked_badges = JSON.parse(userData.unlocked_badges); } catch (e) { userData.unlocked_badges = []; }
    }

    res.json(userData);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

export const updateMyAccount = async (req, res, next) => {
  // Variable para la nueva imagen si se sube una
  let newImagePath = null;

  try {
    const { userId } = req.user;
    const { name, username, email, currentPassword, newPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    // --- OPTIMIZACIÓN: Procesamiento de Imagen ---
    // Si viene archivo (Multipart), lo procesamos con el servicio
    if (req.file) {
      try {
        const processed = await processUploadedFile(req.file);
        newImagePath = processed.url;
      } catch (uploadError) {
        return res.status(400).json({ error: 'Error procesando imagen: ' + uploadError.message });
      }
    } else if (req.processedImagePath) {
      // Fallback para middleware legacy
      newImagePath = req.processedImagePath;
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
          if (newImagePath) await deleteFile(newImagePath);
          return res.status(400).json({ error: 'La contraseña actual es requerida.' });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
          if (newImagePath) await deleteFile(newImagePath);
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
      changes.push(`usuario`);
    }
    if (email !== undefined && email !== user.email) {
      fieldsToUpdate.email = email;
      changes.push('email');
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      await user.update(fieldsToUpdate);
      
      // Limpieza de imagen antigua
      if (newImagePath && oldImageUrl) {
        await deleteFile(oldImageUrl);
      }

      let ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP desconocida';
      if (typeof ip === 'string' && ip.includes(',')) ip = ip.split(',')[0].trim();
      const userAgent = req.headers['user-agent'] || 'Dispositivo desconocido';

      if (changes.length > 0) {
        createNotification(userId, {
          type: 'info',
          title: 'Cuenta actualizada',
          message: `Datos actualizados: ${changes.join(', ')}.`,
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
    // Si falló algo y habíamos subido imagen nueva, borrarla
    if (newImagePath) await deleteFile(newImagePath);

    if (error.name === 'SequelizeUniqueConstraintError') {
      if (error.fields && error.fields.email) return res.status(409).json({ error: 'El email ya está en uso.' });
      if (error.fields && error.fields.username) return res.status(409).json({ error: 'El nombre de usuario ya está en uso.' });
    }
    next(error);
  }
};

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

    // Borrado físico (sin esperar al cron)
    await deleteAllUserFiles(userId, user);

    // Borrado lógico masivo
    const deleteOpts = { where: { user_id: userId }, transaction: t };
    await Promise.all([
      Routine.destroy(deleteOpts),
      WorkoutLog.destroy(deleteOpts),
      BodyWeightLog.destroy(deleteOpts),
      NutritionLog.destroy(deleteOpts),
      WaterLog.destroy(deleteOpts),
      FavoriteMeal.destroy(deleteOpts),
      PersonalRecord.destroy(deleteOpts),
      CreatinaLog.destroy(deleteOpts)
    ]);

    await user.update(
      {
        profile_image_url: null,
        gender: null, age: null, height: null, activity_level: null,
        goal: null, xp: 0, level: 1, streak: 0, unlocked_badges: '[]'
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
      message: 'Has eliminado todos tus datos de progreso.',
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

export const deleteMyAccount = async (req, res, next) => {
  const { userId } = req.user;
  const { password } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    if (user.password_hash) {
      if (!password) return res.status(400).json({ error: 'La contraseña es requerida.' });
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) return res.status(401).json({ error: 'La contraseña incorrecta.' });
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