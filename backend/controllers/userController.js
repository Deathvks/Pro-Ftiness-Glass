import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import models from '../models/index.js';
import fs from 'fs/promises';
import path from 'path';

const { User, BodyWeightLog, sequelize } = models;

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
  // ... (esta función no cambia)
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

// --- INICIO DE LA MODIFICACIÓN (Versión 2) ---
export const updateMyAccount = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file) {
      await fs.unlink(req.file.path);
    }
    return res.status(400).json({ errors: errors.array() });
  }

  let oldImagePath = null;

  try {
    const { userId } = req.user;
    const { name, username, email, currentPassword, newPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      if (req.file) {
        await fs.unlink(req.file.path);
      }
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // 1. Guardar ruta imagen antigua
    if (user.profile_image_url) {
        oldImagePath = path.join(process.cwd(), 'public', user.profile_image_url);
    }

    // Objeto para guardar solo los campos que vamos a actualizar
    const fieldsToUpdate = {};

    // 2. Si se sube una nueva imagen
    if (req.file) {
        const publicUrl = `/images/profiles/${req.file.filename}`;
        fieldsToUpdate.profile_image_url = publicUrl; // Añadir al objeto de actualización

        if(oldImagePath && path.basename(oldImagePath) === req.file.filename) {
            oldImagePath = null; // No borrar si es la misma imagen
        }
    }
    // Si no hay req.file, NO añadimos profile_image_url a fieldsToUpdate

    // 3. Si se intenta cambiar contraseña
    if (newPassword) {
      if (!currentPassword) {
        if (req.file) await fs.unlink(req.file.path);
        return res.status(400).json({ error: 'La contraseña actual es requerida para cambiarla.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        if (req.file) await fs.unlink(req.file.path);
        return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
      }
      const salt = await bcrypt.genSalt(10);
      fieldsToUpdate.password_hash = await bcrypt.hash(newPassword, salt); // Añadir al objeto de actualización
    }

    // 4. Actualizar otros campos (SOLO si se proporcionan y son diferentes)
    if (name !== undefined && name !== user.name) fieldsToUpdate.name = name;
    if (username !== undefined && username !== user.username) fieldsToUpdate.username = username;
    if (email !== undefined && email !== user.email) fieldsToUpdate.email = email;

    // 5. Guardar en BBDD (SOLO los campos especificados en fieldsToUpdate)
    // Usamos user.update en lugar de user.save()
    if (Object.keys(fieldsToUpdate).length > 0) {
        await user.update(fieldsToUpdate);
    }

    // 6. Borrar imagen antigua si procede
    if (oldImagePath && fieldsToUpdate.profile_image_url) { // Solo borrar si subimos una NUEVA imagen
      try {
        await fs.unlink(oldImagePath);
      } catch (unlinkError) {
        console.warn(`No se pudo borrar la imagen antigua: ${oldImagePath}`, unlinkError);
      }
    }

    // 7. Recargar datos frescos desde la BBDD
    await user.reload();

    // 8. Enviar respuesta actualizada
    const { password_hash, ...userWithoutPassword } = user.get({ plain: true });
    res.json(userWithoutPassword);

  } catch (error) {
    // Manejo de errores (borrar fichero subido si falla la BBDD)
    if (req.file) {
        try { await fs.unlink(req.file.path); } catch (e) {}
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'El email o nombre de usuario ya está en uso.' });
    }

    next(error);
  }
};
// --- FIN DE LA MODIFICACIÓN (Versión 2) ---

const userController = {
  getMyProfile,
  updateMyProfile,
  updateMyAccount
};

export default userController;