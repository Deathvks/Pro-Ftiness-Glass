/* backend/controllers/adminController.js */
import { Op } from 'sequelize';
import db from '../models/index.js';
const User = db.User;

// Obtener todos los usuarios
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'is_verified', 'username', 'profile_image_url', 'lastSeen'],
      order: [['id', 'ASC']],
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// Crear un nuevo usuario
export const createUser = async (req, res, next) => {
  let { username, name, email, password, role, is_verified } = req.body;

  // Compatibilidad: si envían name pero no username, usamos name
  if (!username && name) username = name;

  try {
    // Validamos duplicados solo si tenemos datos para comparar
    const checks = [];
    if (email) checks.push({ email });
    if (username) checks.push({ username });

    if (checks.length > 0) {
      const existingUser = await User.findOne({
        where: { [Op.or]: checks }
      });

      if (existingUser) {
        if (email && existingUser.email === email) return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });
        if (username && existingUser.username === username) return res.status(409).json({ message: 'El nombre de usuario ya está en uso.' });
      }
    }

    const newUser = await User.create({
      username,
      name: username, // Mantenemos name y username sincronizados
      email,
      password_hash: password,
      role: role || 'user',
      is_verified: is_verified || false,
    });

    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      is_verified: newUser.is_verified,
      profile_image_url: newUser.profile_image_url,
      lastSeen: newUser.lastSeen,
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar un usuario
export const updateUser = async (req, res, next) => {
  const { userId } = req.params;
  let { username, name, email, role, is_verified, password } = req.body;

  // Compatibilidad: si envían name pero no username, usamos name
  if (!username && name) username = name;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Construcción dinámica de validación de duplicados
    const checks = [];
    if (email) checks.push({ email });
    if (username) checks.push({ username });

    if (checks.length > 0) {
      const existingUser = await User.findOne({
        where: {
          [Op.or]: checks,
          id: { [Op.ne]: userId } // Excluir al propio usuario
        }
      });

      if (existingUser) {
        if (email && existingUser.email === email) return res.status(409).json({ message: 'El email ya está en uso.' });
        if (username && existingUser.username === username) return res.status(409).json({ message: 'El usuario ya está en uso.' });
      }
    }

    const updateData = {};
    if (username) {
      updateData.username = username;
      updateData.name = username;
    }
    if (email) updateData.email = email;
    if (role) updateData.role = role;

    // Verificamos explícitamente undefined porque es un booleano
    if (typeof is_verified !== 'undefined') updateData.is_verified = is_verified;

    if (password) updateData.password_hash = password;

    await user.update(updateData);

    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
      profile_image_url: user.profile_image_url,
      lastSeen: user.lastSeen,
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar un usuario
export const deleteUser = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    await user.destroy();
    res.status(200).json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};