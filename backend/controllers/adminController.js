/* backend/controllers/adminController.js */
import db from '../models/index.js';
const User = db.User;

// Obtener todos los usuarios
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      // --- INICIO DE LA MODIFICACIÓN ---
      // Añadimos 'lastSeen' a los atributos seleccionados
      attributes: ['id', 'name', 'email', 'role', 'is_verified', 'username', 'profile_image_url', 'lastSeen'],
      // --- FIN DE LA MODIFICACIÓN ---
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
    // Validar que el username o email no existan ya
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
      name: username, // Rellenamos 'name' con 'username' por consistencia
      email,
      // --- INICIO DE LA MODIFICACIÓN (BUG DOBLE HASH) ---
      // Pasamos la contraseña en texto plano al campo 'password_hash'.
      // El hook 'beforeSave' del modelo se encargará de hashearla.
      password_hash: password, 
      // --- FIN DE LA MODIFICACIÓN ---
      role: role || 'user',
      is_verified: is_verified || false,
    });

    // No enviamos la contraseña en la respuesta
    const userResponse = {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      is_verified: newUser.is_verified,
      profile_image_url: newUser.profile_image_url,
      lastSeen: newUser.lastSeen, // Incluimos lastSeen
    };

    res.status(201).json(userResponse);
  } catch (error) {
    next(error);
  }
};

// Actualizar un usuario
export const updateUser = async (req, res, next) => {
  const { id } = req.params;
  const { username, email, role, is_verified, password } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Validar que el username o email no existan en OTRO usuario
    const existingUser = await User.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ email }, { username }],
        id: { [db.Sequelize.Op.ne]: id } // Excluimos al usuario actual
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

    // Construir objeto de actualización
    const updateData = {
      username,
      email,
      role,
      is_verified,
    };
    
    // --- INICIO DE LA MODIFICACIÓN (BUG DOBLE HASH) ---
    // Si se proporciona una contraseña, se actualizará
    // El hook 'beforeSave' en el modelo se encargará de hashearla
    if (password) {
      // Pasamos la contraseña en texto plano al campo 'password_hash'.
      updateData.password_hash = password;
    }
    // --- FIN DE LA MODIFICACIÓN ---
    
    // Rellenamos 'name' por consistencia si 'username' cambia
    if (username) {
      updateData.name = username;
    }

    await user.update(updateData);

    // No enviamos la contraseña en la respuesta
    const userResponse = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
      profile_image_url: user.profile_image_url,
      lastSeen: user.lastSeen, // Incluimos lastSeen
    };

    res.json(userResponse);
  } catch (error) {
    next(error);
  }
};

// Eliminar un usuario
export const deleteUser = async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await user.destroy();
    res.status(200).json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};