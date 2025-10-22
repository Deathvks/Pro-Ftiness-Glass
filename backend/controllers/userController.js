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

    // --- INICIO DE LA MODIFICACIÓN (oldImagePath con __dirname) ---
    // 1. Guardar ruta imagen antigua usando __dirname
    if (user.profile_image_url) {
        // user.profile_image_url es algo como "/images/profiles/imagen.jpg"
        // Necesitamos unir la base de 'public' con esa ruta relativa.
        // __dirname es /app/backend/controllers
        // subimos un nivel a /app/backend, luego entramos a public
        oldImagePath = path.join(__dirname, '..', 'public', user.profile_image_url);
    }
    // --- FIN DE LA MODIFICACIÓN ---

    const fieldsToUpdate = {};

    // 2. Si se sube una nueva imagen
    if (req.file) {
        const publicUrl = `/images/profiles/${req.file.filename}`;
        fieldsToUpdate.profile_image_url = publicUrl;

        // Comprobamos si la imagen antigua existe y si su nombre de archivo base es diferente al nuevo
        if (oldImagePath && path.basename(oldImagePath) === req.file.filename) {
            oldImagePath = null; // No borrar si es la misma imagen (poco probable con timestamp, pero por seguridad)
        }
    }

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
      fieldsToUpdate.password_hash = newPassword; // El hook se encarga del hash
    }

    // 4. Actualizar otros campos
    if (name && name !== user.name) fieldsToUpdate.name = name;
    if (username && username !== user.username) fieldsToUpdate.username = username;
    if (email && email !== user.email) fieldsToUpdate.email = email;

    // 5. Guardar en BBDD
    if (Object.keys(fieldsToUpdate).length > 0) {
        await user.update(fieldsToUpdate);
    }

    // 6. Borrar imagen antigua si existe y si subimos una nueva diferente
    if (oldImagePath && fieldsToUpdate.profile_image_url) {
      try {
        await fs.unlink(oldImagePath);
        console.log(`Imagen antigua borrada: ${oldImagePath}`); // Log para verificar
      } catch (unlinkError) {
        // Si el archivo no existe (ENOENT), no es un error crítico
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
    if (req.file) {
        try { await fs.unlink(req.file.path); } catch (e) {}
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'El email o nombre de usuario ya está en uso.' });
    }

    next(error);
  }
};

const userController = {
  getMyProfile,
  updateMyProfile,
  updateMyAccount
};

export default userController;