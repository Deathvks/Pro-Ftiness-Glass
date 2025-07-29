import { validationResult } from 'express-validator';
import models from '../models/index.js';

const { User, BodyWeightLog, sequelize } = models;

// Obtener el perfil del usuario autenticado
export const getMyProfile = async (req, res) => {
  try {
    // req.user.userId viene del middleware de autenticación
    const user = await User.findByPk(req.user.userId, {
      // Excluimos el hash de la contraseña de la respuesta
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el perfil del usuario' });
  }
};

// Actualizar el perfil del usuario (usado en el onboarding)
export const updateMyProfile = async (req, res) => {
  // --- INICIO: Manejo de validación ---
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // --- FIN ---

  const t = await sequelize.transaction();
  try {
    const { userId } = req.user;
    const { gender, age, height, activityLevel, goal, weight } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Actualizamos el perfil del usuario con los nuevos datos
    await user.update({
      gender,
      age,
      height,
      activity_level: activityLevel, // Asegúrate de que el nombre de la propiedad coincida con el modelo
      goal
    }, { transaction: t });

    // Si se proporciona un peso inicial, se crea el primer registro
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
    
    // Devolvemos el perfil actualizado (sin la contraseña)
    const updatedUser = await User.findByPk(userId, {
        attributes: { exclude: ['password_hash'] }
    });
    res.json(updatedUser);

  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
};

const userController = {
    getMyProfile,
    updateMyProfile
};

export default userController;