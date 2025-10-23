/* backend/controllers/adminController.js */
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
  const { username, email, password, role, is_verified } = req.body;
  try {
    const existingUser = await User.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ email }, { username }]
      }
    });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });
      }
      if (existingUser.username === username) {
        return res.status(409).json({ message: 'El nombre de usuario ya está en uso.' });
      }
    }

    const newUser = await User.create({
      username,
      name: username,
      email,
      password_hash: password,
      role: role || 'user',
      is_verified: is_verified || false,
    });

    const userResponse = {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      is_verified: newUser.is_verified,
      profile_image_url: newUser.profile_image_url,
      lastSeen: newUser.lastSeen,
    };

    res.status(201).json(userResponse);
  } catch (error) {
    next(error);
  }
};

// Actualizar un usuario
export const updateUser = async (req, res, next) => {
  // --- INICIO DE LA MODIFICACIÓN ---
  const { userId } = req.params; // Cambiado de 'id' a 'userId'
  // --- FIN DE LA MODIFICACIÓN ---
  const { username, email, role, is_verified, password } = req.body;

  try {
    // --- INICIO DE LA MODIFICACIÓN ---
    const user = await User.findByPk(userId); // Cambiado de 'id' a 'userId'
    // --- FIN DE LA MODIFICACIÓN ---
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const existingUser = await User.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ email }, { username }],
        // --- INICIO DE LA MODIFICACIÓN ---
        id: { [db.Sequelize.Op.ne]: userId } // Cambiado de 'id' a 'userId'
        // --- FIN DE LA MODIFICACIÓN ---
      }
    });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({ message: 'El correo electrónico ya está en uso por otro usuario.' });
      }
      if (existingUser.username === username) {
        return res.status(409).json({ message: 'El nombre de usuario ya está en uso por otro usuario.' });
      }
    }

    const updateData = {
      username,
      email,
      role,
      is_verified,
    };

    if (password) {
      updateData.password_hash = password;
    }

    if (username) {
      updateData.name = username;
    }

    await user.update(updateData);

    const userResponse = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
      profile_image_url: user.profile_image_url,
      lastSeen: user.lastSeen,
    };

    res.json(userResponse);
  } catch (error) {
    next(error);
  }
};

// Eliminar un usuario
export const deleteUser = async (req, res, next) => {
  // --- INICIO DE LA MODIFICACIÓN ---
  const { userId } = req.params; // Cambiado de 'id' a 'userId'
  // --- FIN DE LA MODIFICACIÓN ---

  try {
    // --- INICIO DE LA MODIFICACIÓN ---
    const user = await User.findByPk(userId); // Cambiado de 'id' a 'userId'
    // --- FIN DE LA MODIFICACIÓN ---
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await user.destroy();
    res.status(200).json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};