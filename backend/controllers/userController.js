/* backend/controllers/userController.js */
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import models from '../models/index.js';
import fs from 'fs/promises';
import path from 'path';
// --- INICIO DE LA MODIFICACIÓN ---
import { fileURLToPath } from 'url'; // Necesario para __dirname en ESM
// --- FIN DE LA MODIFICACIÓN ---

const { User, BodyWeightLog, sequelize } = models;

// --- INICIO DE LA MODIFICACIÓN ---
// Simulación de __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // Esto será /app/backend/controllers
// --- FIN DE LA MODIFICACIÓN ---


// Obtener el perfil del usuario autenticado
export const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['password_hash'] }
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

    await user.update({
      gender,
      age,
      height,
      activity_level: activityLevel,
      goal
    }, { transaction: t });

    if (weight) {
      const weightValue = parseFloat(weight);
      if (weightValue > 0) {
        await BodyWeightLog.create({
          user_id: userId,
          weight_kg: weightValue,
          log_date: new Date()
        }, { transaction: t });
      }
    }

    await t.commit();

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] }
    });
    res.json(updatedUser);

  } catch (error) {
    await t.rollback();
    next(error);
  }
};


// --- INICIO DE MODIFICACIÓN (Lógica de updateMyAccount) ---
export const updateMyAccount = async (req, res, next) => {
  // La validación ya ocurrió en la ruta (handleValidationErrors)
  // req.file ya fue procesado por Sharp y la ruta está en req.processedImagePath
  // (req.processedImagePath fue asignado en la ruta)

  let oldImagePath = null;
  const newImagePath = req.processedImagePath || null; // La ruta .webp desde el middleware
  let imagePathToDeleteOnError = null;

  // Si se subió una nueva imagen, guardamos su ruta para borrarla si algo falla
  if (newImagePath) {
      imagePathToDeleteOnError = path.join(__dirname, '..', 'public', newImagePath);
  }

  try {
    const { userId } = req.user;
    const { name, username, email, currentPassword, newPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      if (imagePathToDeleteOnError) await fs.unlink(imagePathToDeleteOnError).catch(e => {});
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // 1. Guardar ruta imagen antigua
    if (user.profile_image_url) {
        oldImagePath = path.join(__dirname, '..', 'public', user.profile_image_url);
    }

    const fieldsToUpdate = {};

    // 2. Si se sube una nueva imagen (.webp)
    if (newImagePath) {
        fieldsToUpdate.profile_image_url = newImagePath; // Guardamos la URL relativa .webp

        // Evitar borrar si la ruta es idéntica (poco probable)
        if (oldImagePath && oldImagePath === imagePathToDeleteOnError) {
            oldImagePath = null;
        }
    }

    // 3. Si se intenta cambiar contraseña
    if (newPassword) {
      if (!currentPassword) {
        if (imagePathToDeleteOnError) await fs.unlink(imagePathToDeleteOnError).catch(e => {});
        return res.status(400).json({ error: 'La contraseña actual es requerida para cambiarla.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        if (imagePathToDeleteOnError) await fs.unlink(imagePathToDeleteOnError).catch(e => {});
        return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
      }
      fieldsToUpdate.password_hash = newPassword; // El hook se encarga del hash
    }

    // 4. Actualizar otros campos
    if (name !== undefined && name !== user.name) fieldsToUpdate.name = name;
    if (username !== undefined && username !== user.username) fieldsToUpdate.username = username;
    if (email !== undefined && email !== user.email) fieldsToUpdate.email = email;

    // 5. Guardar en BBDD
    if (Object.keys(fieldsToUpdate).length > 0) {
        await user.update(fieldsToUpdate);
    }

    // 6. Borrar imagen antigua si existe y si subimos una nueva
    if (oldImagePath && fieldsToUpdate.profile_image_url) {
      try {
        await fs.unlink(oldImagePath);
        console.log(`Imagen antigua borrada: ${oldImagePath}`);
      } catch (unlinkError) {
        if (unlinkError.code !== 'ENOENT') {
            console.warn(`No se pudo borrar la imagen antigua: ${oldImagePath}`, unlinkError);
        } else {
             console.log(`La imagen antigua no existía, no se borró: ${oldImagePath}`);
        }
      }
    }

    // 7. Recargar datos frescos
    await user.reload();

    // 8. Enviar respuesta actualizada
    const { password_hash, ...userWithoutPassword } = user.get({ plain: true });
    res.json(userWithoutPassword);

  } catch (error) {
    // Manejo de errores
    if (imagePathToDeleteOnError) {
        // Si falló (ej. constraint de BBDD), borrar la imagen .webp que acabamos de subir
        await fs.unlink(imagePathToDeleteOnError).catch(e => console.error("Error borrando imagen tras fallo:", e));
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'El email o nombre de usuario ya está en uso.' });
    }

    next(error);
  }
};
// --- FIN DE MODIFICACIÓN ---

const userController = {
  getMyProfile,
  updateMyProfile,
  updateMyAccount
};

export default userController;