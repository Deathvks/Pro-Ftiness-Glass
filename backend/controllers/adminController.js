import bcrypt from 'bcryptjs';
import models from '../models/index.js';
const { User } = models;

// Obtener una lista de todos los usuarios
export const getAllUsers = async (req, res, next) => {
  try {
    let users = await User.findAll({
      attributes: { exclude: ['password_hash'] }, // Nunca exponer las contraseñas
      order: [['created_at', 'DESC']],
    });

    // --- INICIO DE LA MODIFICACIÓN ---
    // Mover al administrador actual al principio de la lista
    const adminUserId = req.user.userId;
    users = users.sort((a, b) => {
      if (a.id === adminUserId) return -1;
      if (b.id === adminUserId) return 1;
      return 0; // Mantener el orden original para los demás
    });
    // --- FIN DE LA MODIFICACIÓN ---

    res.json(users);
  } catch (error) {
    next(error);
  }
};

// Actualizar un usuario por su ID
export const updateUser = async (req, res, next) => {
  const { userId } = req.params;
  const { name, email, role } = req.body;

  // Evitar que un admin se quite el rol a sí mismo si es el único
  if (parseInt(userId, 10) === req.user.userId && role !== 'admin') {
    try {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'No puedes eliminar el rol del único administrador.' });
      }
    } catch (error) {
      return next(error);
    }
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    user.name = name ?? user.name;
    user.email = email ?? user.email;
    user.role = role ?? user.role;
    
    await user.save();
    
    const { password_hash, ...userWithoutPassword } = user.get({ plain: true });
    res.json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

// Eliminar un usuario por su ID
export const deleteUser = async (req, res, next) => {
  const { userId } = req.params;

  // Evitar que un admin se borre a sí mismo
  if (parseInt(userId, 10) === req.user.userId) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de administrador.' });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    await user.destroy();
    res.json({ message: 'Usuario eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
};

// Crear un nuevo usuario
export const createUser = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'El email ya está en uso.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password_hash,
      role,
    });

    const { password_hash: _, ...userWithoutPassword } = newUser.get({ plain: true });
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

const adminController = {
  getAllUsers,
  updateUser,
  deleteUser,
  createUser,
};

export default adminController;