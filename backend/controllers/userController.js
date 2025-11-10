/* backend/controllers/userController.js */
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import models from '../models/index.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// --- INICIO DE LA MODIFICACIÓN ---
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
// --- FIN DE LA MODIFICACIÓN ---

// Simulación de __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // Esto será /app/backend/controllers

// --- INICIO DE LA MODIFICACIÓN ---
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
// --- FIN DE LA MODIFICACIÓN ---

// Obtener el perfil del usuario autenticado
export const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Actualizar el perfil físico del usuario
export const updateMyProfile = async (req, res, next) => {
  // ... (sin cambios aquí)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const t = await sequelize.transaction();
  try {
    const { userId } = req.user;
    const { gender, age, height, activityLevel, goal, weight } = req.body;

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

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] },
    });
    res.json(updatedUser);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Actualizar datos de la cuenta (username, email, pass, imagen)
export const updateMyAccount = async (req, res, next) => {
  let oldImagePath = null;
  const newImagePath = req.processedImagePath || null; // La ruta .webp desde el middleware
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

    if (newImagePath) {
      fieldsToUpdate.profile_image_url = newImagePath;
      if (oldImagePath && oldImagePath === imagePathToDeleteOnError) {
        oldImagePath = null;
      }
    }

    if (newPassword) {
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
      fieldsToUpdate.password_hash = newPassword; // El hook se encarga del hash
    }

    if (name !== undefined && name !== user.name) fieldsToUpdate.name = name;
    if (username !== undefined && username !== user.username)
      fieldsToUpdate.username = username;
    if (email !== undefined && email !== user.email)
      fieldsToUpdate.email = email;

    if (Object.keys(fieldsToUpdate).length > 0) {
      await user.update(fieldsToUpdate);
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

// --- INICIO DE LA MODIFICACIÓN ---

/**
 * Borra todos los datos del usuario (logs, rutinas, etc.) pero conserva la cuenta.
 */
export const clearMyData = async (req, res, next) => {
  const { userId } = req.user;
  const { password } = req.body;

  if (!password) {
    return res
      .status(400)
      .json({ error: 'La contraseña es requerida para borrar los datos.' });
  }

  const t = await sequelize.transaction();
  let user;
  try {
    user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
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

  if (!password) {
    return res
      .status(400)
      .json({ error: 'La contraseña es requerida para borrar la cuenta.' });
  }

  let user;
  try {
    user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
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
// --- FIN DE LA MODIFICACIÓN ---

const userController = {
  getMyProfile,
  updateMyProfile,
  updateMyAccount,
  // --- INICIO DE LA MODIFICACIÓN ---
  clearMyData,
  deleteMyAccount,
  // --- FIN DE LA MODIFICACIÓN ---
};

export default userController;