/* backend/controllers/userController.js */
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import models from '../models/index.js';
import { createNotification } from '../services/notificationService.js';
import { deleteFile } from '../services/imageService.js';

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
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Obtenemos el usuario completo (con hash) para comprobar si tiene contraseña
    const userWithPass = await User.findByPk(req.user.userId, { attributes: ['password_hash'] });

    const userData = user.toJSON();
    // Añadimos un flag para que el frontend sepa si pedir contraseña o no
    userData.hasPassword = !!userWithPass.password_hash;

    res.json(userData);
  } catch (error) {
    next(error);
  }
};

// Actualizar el perfil físico del usuario (y preferencias)
export const updateMyProfile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const t = await sequelize.transaction();
  try {
    const { userId } = req.user;
    const { gender, age, height, activityLevel, goal, weight, login_email_notifications } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    await user.update(
      {
        gender,
        age,
        height,
        activity_level: activityLevel,
        goal,
        login_email_notifications // Se actualiza si viene en el body
      },
      { transaction: t }
    );

    if (weight) {
      const weightValue = parseFloat(weight);
      if (weightValue > 0) {
        await BodyWeightLog.create(
          {
            user_id: userId,
            weight_kg: weightValue,
            log_date: new Date(),
          },
          { transaction: t }
        );
      }
    }

    await t.commit();

    // Obtener IP y UserAgent
    let ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP desconocida';
    if (typeof ip === 'string' && ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    const userAgent = req.headers['user-agent'] || 'Dispositivo desconocido';

    // Notificación de actualización
    if (weight || goal || activityLevel) {
      createNotification(userId, {
        type: 'info',
        title: 'Perfil físico actualizado',
        message: 'Has actualizado tus datos físicos y objetivos.',
        data: { ip, userAgent, date: new Date() }
      });
    }

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] },
    });
    const userWithPass = await User.findByPk(userId, { attributes: ['password_hash'] });
    const userData = updatedUser.toJSON();
    userData.hasPassword = !!userWithPass.password_hash;

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
      // Solo requerimos currentPassword SI el usuario YA tiene una contraseña.
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

      // Si había imagen nueva y todo salió bien, borramos la antigua
      if (newImagePath && oldImageUrl) {
        deleteFile(oldImageUrl);
      }

      // Obtener IP y UserAgent
      let ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP desconocida';
      if (typeof ip === 'string' && ip.includes(',')) {
        ip = ip.split(',')[0].trim();
      }
      const userAgent = req.headers['user-agent'] || 'Dispositivo desconocido';

      // Notificación con resumen de cambios
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
    res.json(userWithoutPassword);

  } catch (error) {
    // Si falla algo, borramos la imagen nueva que se acababa de subir
    if (newImagePath) {
      deleteFile(newImagePath);
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'El email o nombre de usuario ya está en uso.' });
    }

    next(error);
  }
};

/**
 * Borra todos los datos del usuario (logs, rutinas, etc.) pero conserva la cuenta.
 */
export const clearMyData = async (req, res, next) => {
  const { userId } = req.user;
  const { password } = req.body;

  const t = await sequelize.transaction();
  let user;
  try {
    user = await User.findByPk(userId);
    if (!user) {
      await t.rollback();
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Si el usuario tiene contraseña, la verificamos.
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

    // 1. Recolectar y borrar todos los ficheros
    await deleteAllUserFiles(userId, user);

    // 2. Borrar todos los datos asociados en la BBDD
    await Routine.destroy({ where: { user_id: userId }, transaction: t });
    await WorkoutLog.destroy({ where: { user_id: userId }, transaction: t });
    await BodyWeightLog.destroy({ where: { user_id: userId }, transaction: t });
    await NutritionLog.destroy({ where: { user_id: userId }, transaction: t });
    await WaterLog.destroy({ where: { user_id: userId }, transaction: t });
    await FavoriteMeal.destroy({ where: { user_id: userId }, transaction: t });
    await PersonalRecord.destroy({ where: { user_id: userId }, transaction: t });
    await CreatinaLog.destroy({ where: { user_id: userId }, transaction: t });

    // 3. Resetear los campos del perfil del usuario
    await user.update(
      {
        profile_image_url: null,
        gender: null,
        age: null,
        height: null,
        activity_level: null,
        goal: null,
      },
      { transaction: t }
    );

    // 4. Commit
    await t.commit();

    // Obtener IP y UserAgent
    let ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP desconocida';
    if (typeof ip === 'string' && ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    const userAgent = req.headers['user-agent'] || 'Dispositivo desconocido';

    // Notificación de borrado de datos
    createNotification(userId, {
      type: 'warning',
      title: 'Datos eliminados',
      message: 'Has eliminado todos tus datos de progreso y registros de la aplicación.',
      data: { ip, userAgent, date: new Date() }
    });

    res.status(200).json({
      message:
        'Todos tus datos de progreso han sido eliminados. Tu cuenta se mantiene.',
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Borra permanentemente la cuenta del usuario y todos sus datos.
 */
export const deleteMyAccount = async (req, res, next) => {
  const { userId } = req.user;
  const { password } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Verificación condicional de contraseña
    if (user.password_hash) {
      if (!password) {
        return res.status(400).json({ error: 'La contraseña es requerida.' });
      }
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
      }
    }

    // 1. Recolectar y borrar todos los ficheros
    // (Debe hacerse antes de que los logs de BBDD desaparezcan)
    await deleteAllUserFiles(userId, user);

    // 2. Borrar el usuario de la BBDD
    // (onDelete: 'CASCADE' se encargará de borrar todos los registros asociados)
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
};

export default userController;