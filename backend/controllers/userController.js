import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import models from '../models/index.js';
import fs from 'fs/promises'; // <-- Importamos fs para borrar ficheros
import path from 'path'; // <-- Importamos path para construir rutas

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

// --- INICIO DE LA MODIFICACIÓN: Actualización de updateMyAccount ---
export const updateMyAccount = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Si hay errores de validación, y se subió un fichero, hay que borrarlo
    if (req.file) {
      await fs.unlink(req.file.path);
    }
    return res.status(400).json({ errors: errors.array() });
  }

  let oldImagePath = null;

  try {
    const { userId } = req.user;
    // Obtenemos 'username' del body
    const { name, username, email, currentPassword, newPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      if (req.file) {
        await fs.unlink(req.file.path);
      }
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // 1. Guardar la ruta de la imagen antigua (si existe) para borrarla DESPUÉS de guardar
    if (user.profile_image_url) {
        // El path en la BBDD es /images/profiles/filename.jpg
        // El path en el disco es public/images/profiles/filename.jpg
        // process.cwd() apunta a la raíz del backend
        oldImagePath = path.join(process.cwd(), 'public', user.profile_image_url);
    }

    // 2. Si se sube un nuevo fichero (req.file viene de multer)
    if (req.file) {
        // El path de multer es (ej) 'public/images/profiles/user-1-12345.jpg'
        // Guardamos la URL pública (sin 'public')
        const publicUrl = `/images/profiles/${req.file.filename}`;
        user.profile_image_url = publicUrl;
        
        // Si la nueva imagen es la misma que la antigua, no borramos la antigua
        if(oldImagePath && path.basename(oldImagePath) === req.file.filename) {
            oldImagePath = null;
        }
    }

    // 3. Si se intenta cambiar la contraseña
    if (newPassword) {
      if (!currentPassword) {
        // Borramos el fichero subido si la validación falla aquí
        if (req.file) await fs.unlink(req.file.path);
        return res.status(400).json({ error: 'La contraseña actual es requerida para cambiarla.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        // Borramos el fichero subido si la validación falla aquí
        if (req.file) await fs.unlink(req.file.path);
        return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
      }
      const salt = await bcrypt.genSalt(10);
      user.password_hash = await bcrypt.hash(newPassword, salt);
    }

    // 4. Actualizar el resto de campos
    user.name = name;
    user.username = username;
    user.email = email;

    // 5. Guardar en la BBDD
    await user.save();

    // 6. Si todo fue bien, borrar la imagen antigua (si existía)
    if (oldImagePath) {
      try {
        await fs.unlink(oldImagePath);
      } catch (unlinkError) {
        console.warn(`No se pudo borrar la imagen antigua: ${oldImagePath}`, unlinkError);
        // No bloqueamos la respuesta por esto, solo lo logueamos
      }
    }

    const { password_hash, ...userWithoutPassword } = user.get({ plain: true });
    res.json(userWithoutPassword);

  } catch (error) {
    // Si la BBDD falla (ej: username duplicado), borramos el fichero que acabamos de subir
    if (req.file) {
        await fs.unlink(req.file.path);
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      // Error específico para email o username duplicado
      return res.status(409).json({ error: 'El email o nombre de usuario ya está en uso.' });
    }
    
    next(error);
  }
};
// --- FIN DE LA MODIFICACIÓN ---

const userController = {
  getMyProfile,
  updateMyProfile,
  updateMyAccount // <-- Exportar la nueva función
};

export default userController;