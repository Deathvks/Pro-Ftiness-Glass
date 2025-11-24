/* backend/controllers/userController.js */
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import models from '../models/index.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
// --- INICIO DE LA MODIFICACIÓN ---
import { createNotification } from '../services/notificationService.js';
// --- FIN DE LA MODIFICACIÓN ---

// Importar todos los modelos necesarios para el borrado
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

// Simulación de __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // Esto será /app/backend/controllers

/**
 * Helper para encontrar y eliminar todos los ficheros de un usuario (perfil, comidas).
 * @param {number} userId - ID del usuario.
 * @param {object} userInstance - Instancia del modelo User (opcional, para la foto de perfil).
 */
const deleteAllUserFiles = async (userId, userInstance) => {
  const publicPath = path.join(__dirname, '..', 'public');
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
  nutritionLogs.forEach(
    (log) => log.image_url && pathsToDelete.add(log.image_url)
  );

  // 3. Imágenes de FavoriteMeal
  const favoriteMeals = await FavoriteMeal.findAll({
    where: { user_id: userId },
    attributes: ['image_url'],
    raw: true,
  });
  favoriteMeals.forEach(
    (meal) => meal.image_url && pathsToDelete.add(meal.image_url)
  );

  // 4. Borrar todos los ficheros en paralelo
  const deletePromises = [];
  for (const relativePath of pathsToDelete) {
    if (relativePath) {
      const fullPath = path.join(publicPath, relativePath);
      deletePromises.push(
        fs.unlink(fullPath).catch((err) => {
          // Ignorar errores "No such file or directory"
          if (err.code !== 'ENOENT') {
            console.warn(`Fallo al borrar fichero ${fullPath}: ${err.message}`);
          }
        })
      );
    }
  }
  await Promise.all(deletePromises);
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
        // --- INICIO DE LA MODIFICACIÓN ---
        login_email_notifications // Se actualiza si viene en el body, se ignora si es undefined
        // --- FIN DE LA MODIFICACIÓN ---
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

    // --- INICIO DE LA MODIFICACIÓN ---
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
    // --- FIN DE LA MODIFICACIÓN ---

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] },
    });
    // Mantenemos la coherencia devolviendo hasPassword
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
  let oldImagePath = null;
  const newImagePath = req.processedImagePath || null; 
  let imagePathToDeleteOnError = null;

  if (newImagePath) {
    imagePathToDeleteOnError = path.join(__dirname, '..', 'public', newImagePath);
  }

  try {
    const { userId } = req.user;
    const { name, username, email, currentPassword, newPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      if (imagePathToDeleteOnError)
        await fs.unlink(imagePathToDeleteOnError).catch((e) => {});
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (user.profile_image_url) {
      oldImagePath = path.join(__dirname, '..', 'public', user.profile_image_url);
    }

    const fieldsToUpdate = {};
    // --- INICIO DE LA MODIFICACIÓN (Tracking de cambios) ---
    const changes = []; 
    // --- FIN DE LA MODIFICACIÓN ---

    if (newImagePath) {
      fieldsToUpdate.profile_image_url = newImagePath;
      changes.push('foto de perfil');
      if (oldImagePath && oldImagePath === imagePathToDeleteOnError) {
        oldImagePath = null;
      }
    }

    if (newPassword) {
      // Solo requerimos currentPassword SI el usuario YA tiene una contraseña.
      if (user.password_hash) {
        if (!currentPassword) {
          if (imagePathToDeleteOnError)
            await fs.unlink(imagePathToDeleteOnError).catch((e) => {});
          return res
            .status(400)
            .json({ error: 'La contraseña actual es requerida para cambiarla.' });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
          if (imagePathToDeleteOnError)
            await fs.unlink(imagePathToDeleteOnError).catch((e) => {});
          return res
            .status(401)
            .json({ error: 'La contraseña actual es incorrecta.' });
        }
      }
      
      fieldsToUpdate.password_hash = newPassword; // El hook se encarga del hash
      changes.push('contraseña');
    }

    if (name !== undefined && name !== user.name) {
        fieldsToUpdate.name = name;
        changes.push('nombre');
    }
    if (username !== undefined && username !== user.username) {
        fieldsToUpdate.username = username;
        // --- CAMBIO SOLICITADO: Mostrar old -> new en la notificación ---
        changes.push(`usuario (${user.username} -> ${username})`);
    }
    if (email !== undefined && email !== user.email) {
        fieldsToUpdate.email = email;
        changes.push('email');
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      await user.update(fieldsToUpdate);

      // --- INICIO DE LA MODIFICACIÓN ---
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
      // --- FIN DE LA MODIFICACIÓN ---
    }

    if (oldImagePath && fieldsToUpdate.profile_image_url) {
      try {
        await fs.unlink(oldImagePath);
      } catch (unlinkError) {
        if (unlinkError.code !== 'ENOENT') {
          console.warn(
            `No se pudo borrar la imagen antigua: ${oldImagePath}`,
            unlinkError
          );
        }
      }
    }

    await user.reload();

    const { password_hash, ...userWithoutPassword } = user.get({ plain: true });
    // Devolver el flag actualizado (ahora tendrá password si la acaba de poner)
    userWithoutPassword.hasPassword = !!user.password_hash;
    res.json(userWithoutPassword);

  } catch (error) {
    if (imagePathToDeleteOnError) {
      await fs
        .unlink(imagePathToDeleteOnError)
        .catch((e) => console.error('Error borrando imagen tras fallo:', e));
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res
        .status(409)
        .json({ error: 'El email o nombre de usuario ya está en uso.' });
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

    // --- INICIO DE LA MODIFICACIÓN ---
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
    // --- FIN DE LA MODIFICACIÓN ---

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

  let user;
  try {
    user = await User.findByPk(userId);
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